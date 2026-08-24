import { NextRequest, NextResponse } from "next/server";
import { appendExpenseReceipt, ExpenseSheetError, getExpenseSheetOptions, hasPossibleDuplicateExpense } from "@/lib/expenses/google-sheets";
import { expenseReceiptConfirmSchema, parseOrError } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const parsed = parseOrError(expenseReceiptConfirmSchema, await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const options = await getExpenseSheetOptions();
    if (parsed.data.draft.entries.some((entry) => !options.categories.includes(entry.category)) || !options.paymentMethods.includes(parsed.data.draft.paymentMethod)) {
      return NextResponse.json({ error: "설정 시트에 없는 카테고리 또는 결제수단입니다." }, { status: 400 });
    }
    const entryTotal = parsed.data.draft.entries.reduce((sum, entry) => sum + entry.amount, 0);
    if (entryTotal !== parsed.data.draft.totalAmount) {
      return NextResponse.json({ error: `카테고리별 금액 합계(¥${entryTotal.toLocaleString("ko-KR")})가 영수증 합계와 다릅니다.` }, { status: 400 });
    }
    if (!parsed.data.allowDuplicate && await hasPossibleDuplicateExpense(parsed.data.draft)) {
      return NextResponse.json({ error: "같은 날짜·가게·금액의 내역이 이미 있을 수 있습니다.", code: "POSSIBLE_DUPLICATE" }, { status: 409 });
    }
    return NextResponse.json(await appendExpenseReceipt(parsed.data.draft));
  } catch (error) {
    if (error instanceof ExpenseSheetError) {
      return NextResponse.json({ error: error.message }, { status: error.code === "UNAVAILABLE" ? 503 : 502 });
    }
    return NextResponse.json({ error: "가계부 내역을 저장하지 못했습니다." }, { status: 500 });
  }
}
