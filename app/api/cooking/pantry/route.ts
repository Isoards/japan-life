import { NextRequest, NextResponse } from "next/server";
import { ingredientById } from "@/lib/cooking/data";
import { defaultStorageLocation, isFreezableIngredient } from "@/lib/cooking/freshness";
import type { PantryData } from "@/lib/cooking/types";
import { readStore, writeStore } from "@/lib/store";
import { idSchema, pantryFreezeSchema, pantryItemSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "cooking-pantry";

export async function GET() {
  return NextResponse.json(await readStore<PantryData>(STORE_NAME, { items: [] }));
}

export async function POST(request: NextRequest) {
  const parsed = parseOrError(pantryItemSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!ingredientById.has(parsed.data.ingredientId)) {
    return NextResponse.json({ error: "등록되지 않은 식재료입니다" }, { status: 404 });
  }
  const pantry = await readStore<PantryData>(STORE_NAME, { items: [] });
  const existing = pantry.items.find((item) => item.ingredientId === parsed.data.ingredientId);
  if (!existing) pantry.items.push({ ingredientId: parsed.data.ingredientId, storageLocation: defaultStorageLocation(parsed.data.ingredientId), addedAt: new Date().toISOString() });
  await writeStore(STORE_NAME, pantry);
  return NextResponse.json(pantry);
}

export async function PATCH(request: NextRequest) {
  const parsed = parseOrError(pantryFreezeSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const pantry = await readStore<PantryData>(STORE_NAME, { items: [] });
  const item = pantry.items.find((candidate) => candidate.ingredientId === parsed.data.ingredientId);
  if (!item) return NextResponse.json({ error: "Pantry에 없는 식재료입니다" }, { status: 404 });
  if (parsed.data.frozen && !isFreezableIngredient(item.ingredientId)) {
    return NextResponse.json({ error: "이 재료는 자동 냉장 관리 대상입니다" }, { status: 400 });
  }
  item.storageLocation = parsed.data.frozen ? "FREEZER" : defaultStorageLocation(item.ingredientId);
  if (!parsed.data.frozen) item.addedAt = new Date().toISOString();
  await writeStore(STORE_NAME, pantry);
  return NextResponse.json(pantry);
}

export async function DELETE(request: NextRequest) {
  const parsed = parseOrError(idSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const pantry = await readStore<PantryData>(STORE_NAME, { items: [] });
  pantry.items = pantry.items.filter((item) => item.ingredientId !== parsed.data.id);
  await writeStore(STORE_NAME, pantry);
  return NextResponse.json(pantry);
}
