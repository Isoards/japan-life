import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { dishById } from "@/lib/cooking/data";
import type { MealPlanData } from "@/lib/cooking/types";
import { readStore, writeStore } from "@/lib/store";
import { idSchema, mealPlanCreateSchema, mealPlanPatchSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "cooking-meal-plan";

export async function GET() {
  return NextResponse.json(await readStore<MealPlanData>(STORE_NAME, { items: [] }));
}

export async function POST(request: NextRequest) {
  const parsed = parseOrError(mealPlanCreateSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!dishById.has(parsed.data.dishId)) return NextResponse.json({ error: "등록되지 않은 요리입니다" }, { status: 404 });

  const plan = await readStore<MealPlanData>(STORE_NAME, { items: [] });
  const existing = plan.items.find((item) => item.date === parsed.data.date && item.slot === parsed.data.slot);
  if (existing) {
    existing.dishId = parsed.data.dishId;
    existing.note = parsed.data.note || undefined;
  } else {
    plan.items.push({ id: randomUUID(), ...parsed.data, note: parsed.data.note || undefined });
  }
  await writeStore(STORE_NAME, plan);
  return NextResponse.json(plan);
}

export async function PATCH(request: NextRequest) {
  const parsed = parseOrError(mealPlanPatchSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (parsed.data.dishId && !dishById.has(parsed.data.dishId)) return NextResponse.json({ error: "등록되지 않은 요리입니다" }, { status: 404 });

  const plan = await readStore<MealPlanData>(STORE_NAME, { items: [] });
  const item = plan.items.find((candidate) => candidate.id === parsed.data.id);
  if (!item) return NextResponse.json({ error: "식단 항목을 찾지 못했습니다" }, { status: 404 });
  const nextDate = parsed.data.date ?? item.date;
  const nextSlot = parsed.data.slot ?? item.slot;
  if (plan.items.some((candidate) => candidate.id !== item.id && candidate.date === nextDate && candidate.slot === nextSlot)) {
    return NextResponse.json({ error: "해당 시간대에 이미 등록된 요리가 있습니다" }, { status: 409 });
  }
  Object.assign(item, {
    date: nextDate,
    slot: nextSlot,
    dishId: parsed.data.dishId ?? item.dishId,
    note: parsed.data.note === undefined ? item.note : parsed.data.note || undefined,
  });
  await writeStore(STORE_NAME, plan);
  return NextResponse.json(plan);
}

export async function DELETE(request: NextRequest) {
  const parsed = parseOrError(idSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const plan = await readStore<MealPlanData>(STORE_NAME, { items: [] });
  plan.items = plan.items.filter((item) => item.id !== parsed.data.id);
  await writeStore(STORE_NAME, plan);
  return NextResponse.json(plan);
}
