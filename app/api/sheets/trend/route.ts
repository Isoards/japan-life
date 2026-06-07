import { NextRequest, NextResponse } from "next/server";
import {
  addEntryToAggregate,
  createEmptyAggregate,
  getRecentMonths,
  parseSheetEntries,
  SHEETS_HISTORY_RANGE,
  SHEETS_ID,
  type SheetAggregate,
  type SheetCell,
} from "@/lib/sheets";
import type { MonthlyTrend } from "@/lib/types";

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_API_KEY가 설정되지 않았습니다" },
      { status: 500 },
    );
  }

  const monthsParam = parseInt(request.nextUrl.searchParams.get("months") || "6", 10);
  const monthsBack = Math.min(Math.max(monthsParam, 1), 24);
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

    const monthMap = new Map<string, SheetAggregate>();

    for (const month of targetMonths) {
      monthMap.set(month, createEmptyAggregate());
    }

    for (const sheetEntry of parseSheetEntries(rows)) {
      const aggregate = monthMap.get(sheetEntry.month);
      if (!aggregate) continue;
      addEntryToAggregate(aggregate, sheetEntry);
    }

    const result: MonthlyTrend[] = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Google Sheets 데이터 조회 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
