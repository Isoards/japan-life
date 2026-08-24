import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { dishById } from "@/lib/cooking/data";
import type { CookedDishesData } from "@/lib/cooking/types";
import { readStore, writeStore } from "@/lib/store";
import { cookingLogSchema, idSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "cooking-cooked";

export async function GET() {
  return NextResponse.json(await readStore<CookedDishesData>(STORE_NAME, { items: [] }));
}

export async function POST(request: NextRequest) {
  const parsed = parseOrError(cookingLogSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!dishById.has(parsed.data.dishId)) {
    return NextResponse.json({ error: "등록되지 않은 요리입니다" }, { status: 404 });
  }

  const cooked = await readStore<CookedDishesData>(STORE_NAME, { items: [] });
  cooked.items.push({
    id: randomUUID(),
    dishId: parsed.data.dishId,
    cookedAt: new Date(`${parsed.data.cookedOn}T12:00:00+09:00`).toISOString(),
    sourceTitle: parsed.data.sourceTitle || undefined,
    sourceUrl: parsed.data.sourceUrl || undefined,
    note: parsed.data.note || undefined,
  });
  await writeStore(STORE_NAME, cooked);
  return NextResponse.json(cooked);
}

export async function DELETE(request: NextRequest) {
  const parsed = parseOrError(idSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const cooked = await readStore<CookedDishesData>(STORE_NAME, { items: [] });
  cooked.items = cooked.items.filter((item) => item.id !== parsed.data.id);
  await writeStore(STORE_NAME, cooked);
  return NextResponse.json(cooked);
}
