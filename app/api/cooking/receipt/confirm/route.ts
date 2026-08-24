import { NextRequest, NextResponse } from "next/server";
import { ingredientById } from "@/lib/cooking/data";
import { mergeReceiptIngredients } from "@/lib/cooking/receipt/pantry";
import type { PantryData } from "@/lib/cooking/types";
import { readStore, writeStore } from "@/lib/store";
import { parseOrError, receiptConfirmSchema } from "@/lib/validations";

const STORE_NAME = "cooking-pantry";

export async function POST(request: NextRequest) {
  try {
    const parsed = parseOrError(receiptConfirmSchema, await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const invalid = parsed.data.ingredientIds.find((id) => !ingredientById.has(id));
    if (invalid) return NextResponse.json({ error: "등록되지 않은 식재료가 포함되어 있습니다." }, { status: 400 });

    const pantry = await readStore<PantryData>(STORE_NAME, { items: [] });
    const result = mergeReceiptIngredients(pantry, parsed.data.ingredientIds, parsed.data.storageLocation);
    await writeStore(STORE_NAME, result.pantry);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Pantry를 업데이트하지 못했습니다." }, { status: 500 });
  }
}
