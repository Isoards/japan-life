import { NextRequest, NextResponse } from "next/server";
import { createExpenseReceiptDraft } from "@/lib/expenses/receipt/create-draft";
import { ExpenseSheetError, getExpenseSheetOptions } from "@/lib/expenses/google-sheets";
import { expenseReceiptParseSchema, parseOrError } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const parsed = parseOrError(expenseReceiptParseSchema, await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const options = await getExpenseSheetOptions();
    return NextResponse.json({ draft: await createExpenseReceiptDraft(parsed.data.lines, options), options });
  } catch (error) {
    if (error instanceof ExpenseSheetError) return NextResponse.json({ error: error.message }, { status: error.code === "UNAVAILABLE" ? 503 : 502 });
    return NextResponse.json({ error: "영수증의 가계부 내역을 분석하지 못했습니다." }, { status: 400 });
  }
}
