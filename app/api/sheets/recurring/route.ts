import { NextRequest, NextResponse } from "next/server";
import {
  getRecentMonths,
  parseSheetEntries,
  SHEETS_HISTORY_RANGE,
  SHEETS_ID,
  type ParsedSheetEntry,
  type SheetCell,
} from "@/lib/sheets";
import type { RecurringExpense, RecurringExpensesResult } from "@/lib/types";

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const MIN_RECURRING_MONTHS = 2;
const HIGH_CONFIDENCE_VARIATION = 0.15;
const MEDIUM_CONFIDENCE_VARIATION = 0.35;

function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）［］\[\]【】]/g, "")
    .trim();
}

function toRecurringExpense(entries: ParsedSheetEntry[]): RecurringExpense | null {
  const months = [...new Set(entries.map((entry) => entry.month))].sort();
  if (months.length < MIN_RECURRING_MONTHS) return null;

  const amounts = entries.map((entry) => entry.amount);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const averageAmount = Math.round(total / amounts.length);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const variationRate = averageAmount > 0 ? (maxAmount - minAmount) / averageAmount : 0;

  if (variationRate > MEDIUM_CONFIDENCE_VARIATION) return null;

  const latest = [...entries].sort((a, b) => b.month.localeCompare(a.month))[0];
  const first = entries[0];
  const confidence =
    months.length >= 3 && variationRate <= HIGH_CONFIDENCE_VARIATION ? "high" : "medium";

  return {
    id: `${first.category}:${normalizeDescription(first.description)}`,
    label: first.description,
    category: first.category,
    months,
    occurrences: entries.length,
    averageAmount,
    latestAmount: latest.amount,
    latestMonth: latest.month,
    minAmount,
    maxAmount,
    variationRate,
    confidence,
  };
}

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_API_KEY가 설정되지 않았습니다" },
      { status: 500 },
    );
  }

  const monthsParam = parseInt(request.nextUrl.searchParams.get("months") || "6", 10);
  const monthsBack = Math.min(Math.max(monthsParam, 2), 24);
  const targetMonths = new Set(getRecentMonths(monthsBack));

  try {
    const range = encodeURIComponent(SHEETS_HISTORY_RANGE);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${range}?key=${API_KEY}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Google Sheets API 호출 실패", detail: err },
        { status: 502 },
      );
    }

    const data = await res.json();
    const rows: SheetCell[][] = data.values || [];
    const groups = new Map<string, ParsedSheetEntry[]>();

    for (const entry of parseSheetEntries(rows)) {
      if (entry.kind !== "expense" || !targetMonths.has(entry.month)) continue;
      const normalizedDescription = normalizeDescription(entry.description);
      if (!normalizedDescription) continue;

      const key = `${entry.category}:${normalizedDescription}`;
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }

    const items = Array.from(groups.values())
      .map(toRecurringExpense)
      .filter((item): item is RecurringExpense => item !== null)
      .sort((a, b) => b.averageAmount - a.averageAmount);

    const result: RecurringExpensesResult = {
      months: monthsBack,
      estimatedMonthlyTotal: items.reduce((sum, item) => sum + item.averageAmount, 0),
      items,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "정기 지출 탐지 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
