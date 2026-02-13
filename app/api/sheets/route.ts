import { NextRequest, NextResponse } from "next/server";
import { INCOME_CATEGORIES, SAVING_CATEGORIES } from "@/lib/constants/budget";
import type { SheetsSummary } from "@/lib/types";

const SHEET_ID = "1volLOrTwvHDDOCXY_AD7fLqVd5JVHHm9HsPg7QTZ0qg";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

// 시트 열 구조: A=ID, B=날짜, C=구분, D=카테고리, E=내용, F=금액
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

  const monthParam = request.nextUrl.searchParams.get("month");
  const now = new Date();
  const targetMonth = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

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

    const byCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;
    let totalSaving = 0;

    for (const row of dataRows) {
      const dateRaw = String(row[COL_DATE] || "");
      const type = String(row[COL_TYPE] || "").trim();
      const category = String(row[COL_CATEGORY] || "").trim();
      const amount = typeof row[COL_AMOUNT] === "number"
        ? row[COL_AMOUNT]
        : parseFloat(String(row[COL_AMOUNT] || "0")) || 0;

      if (!category || amount === 0) continue;

      // 날짜 필터: YYYY-MM 매칭
      const dateMatch = dateRaw.match(/(\d{4})[-/.년](\d{1,2})/);
      if (!dateMatch) continue;
      const rowMonth = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}`;
      if (rowMonth !== targetMonth) continue;

      const absAmount = Math.abs(amount);

      if (type === "수입" || INCOME_CATEGORIES.includes(category)) {
        totalIncome += absAmount;
      } else if (type === "저축/투자" || SAVING_CATEGORIES.includes(category)) {
        totalSaving += absAmount;
      } else {
        totalExpense += absAmount;
      }

      byCategory[category] = (byCategory[category] || 0) + absAmount;
    }

    const result: SheetsSummary = {
      month: targetMonth,
      byCategory,
      totalIncome,
      totalExpense,
      totalSaving,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Google Sheets 데이터 조회 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
