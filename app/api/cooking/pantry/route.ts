import { NextRequest, NextResponse } from "next/server";
import { ingredientById } from "@/lib/cooking/data";
import type { PantryData } from "@/lib/cooking/types";
import { readStore, writeStore } from "@/lib/store";
import { idSchema, pantryItemSchema, parseOrError } from "@/lib/validations";

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
  if (existing) {
    existing.storageLocation = parsed.data.storageLocation;
  } else {
    pantry.items.push({ ...parsed.data, addedAt: new Date().toISOString() });
  }
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
