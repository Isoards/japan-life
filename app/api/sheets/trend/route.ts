import { NextRequest, NextResponse } from "next/server";
import { INCOME_CATEGORIES, SAVING_CATEGORIES } from "@/lib/constants/budget";
import type { MonthlyTrend } from "@/lib/types";

const SHEET_ID = "1volLOrTwvHDDOCXY_AD7fLqVd5JVHHm9HsPg7QTZ0qg";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

const COL_DATE = 1;
const COL_TYPE = 2;
const COL_CATEGORY = 3;
const COL_AMOUNT = 5;

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_API_KEY가 설정되지 않았습니다" },
      { status: 500 },
    );
  }

  const monthsParam = parseInt(request.nextUrl.searchParams.get("months") || "6", 10);
  const monthsBack = Math.min(Math.max(monthsParam, 1), 24);

  // 최근 N개월 목록 생성
  const now = new Date();
  const targetMonths = new Set<string>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    targetMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  try {
    const range = encodeURIComponent("내역!A:F");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Google Sheets API 호출 실패", detail: err },
        { status: 502 },
      );
    }

    const data = await res.json();
    const rows: (string | number | boolean)[][] = data.values || [];
    const dataRows = rows.slice(1);

    // 월별 집계
    const monthMap = new Map<string, { byCategory: Record<string, number>; totalIncome: number; totalExpense: number; totalSaving: number }>();

    for (const month of targetMonths) {
      monthMap.set(month, { byCategory: {}, totalIncome: 0, totalExpense: 0, totalSaving: 0 });
    }

    for (const row of dataRows) {
      const dateRaw = String(row[COL_DATE] || "");
      const type = String(row[COL_TYPE] || "").trim();
      const category = String(row[COL_CATEGORY] || "").trim();
      const amount = typeof row[COL_AMOUNT] === "number"
        ? row[COL_AMOUNT]
        : parseFloat(String(row[COL_AMOUNT] || "0")) || 0;

      if (!category || amount === 0) continue;

      const dateMatch = dateRaw.match(/(\d{4})[-/.년](\d{1,2})/);
      if (!dateMatch) continue;
      const rowMonth = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}`;

      const entry = monthMap.get(rowMonth);
      if (!entry) continue;

      const absAmount = Math.abs(amount);

      if (type === "수입" || INCOME_CATEGORIES.includes(category)) {
        entry.totalIncome += absAmount;
      } else if (type === "저축/투자" || SAVING_CATEGORIES.includes(category)) {
        entry.totalSaving += absAmount;
      } else {
        entry.totalExpense += absAmount;
      }

      entry.byCategory[category] = (entry.byCategory[category] || 0) + absAmount;
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
