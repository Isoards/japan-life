import { NextRequest, NextResponse } from "next/server";
import { dishById } from "@/lib/cooking/data";
import type { CookedDishesData } from "@/lib/cooking/types";
import { readStore, writeStore } from "@/lib/store";
import { idSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "cooking-cooked";

export async function GET() {
  return NextResponse.json(await readStore<CookedDishesData>(STORE_NAME, { items: [] }));
}

export async function POST(request: NextRequest) {
  const parsed = parseOrError(idSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!dishById.has(parsed.data.id)) {
    return NextResponse.json({ error: "등록되지 않은 요리입니다" }, { status: 404 });
  }

  const cooked = await readStore<CookedDishesData>(STORE_NAME, { items: [] });
  const existing = cooked.items.find((item) => item.dishId === parsed.data.id);
  if (existing) existing.cookedAt = new Date().toISOString();
  else cooked.items.push({ dishId: parsed.data.id, cookedAt: new Date().toISOString() });
  await writeStore(STORE_NAME, cooked);
  return NextResponse.json(cooked);
}

export async function DELETE(request: NextRequest) {
  const parsed = parseOrError(idSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const cooked = await readStore<CookedDishesData>(STORE_NAME, { items: [] });
  cooked.items = cooked.items.filter((item) => item.dishId !== parsed.data.id);
  await writeStore(STORE_NAME, cooked);
  return NextResponse.json(cooked);
}
