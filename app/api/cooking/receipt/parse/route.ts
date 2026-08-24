import { NextRequest, NextResponse } from "next/server";
import { ingredients } from "@/lib/cooking/data";
import { parseReceiptItems } from "@/lib/cooking/receipt/parse-items";
import { parseOrError, receiptParseSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const parsed = parseOrError(receiptParseSchema, await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    return NextResponse.json(parseReceiptItems(parsed.data.lines, ingredients));
  } catch {
    return NextResponse.json({ error: "영수증 품목을 분석하지 못했습니다." }, { status: 400 });
  }
}
