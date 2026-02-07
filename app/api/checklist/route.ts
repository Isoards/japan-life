import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { ChecklistItem } from "@/lib/types";
import defaults from "@/data/checklist-defaults.json";

const STORE_NAME = "checklist";

async function getChecklist(): Promise<ChecklistItem[]> {
  const stored = await readStore<ChecklistItem[] | null>(STORE_NAME, null);
  if (stored === null) {
    const items = defaults as ChecklistItem[];
    await writeStore(STORE_NAME, items);
    return items;
  }
  return stored;
}

export async function GET() {
  const items = await getChecklist();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const items = await getChecklist();

  const newItem: ChecklistItem = {
    ...body,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    checked: false,
    custom: true,
  };
  items.push(newItem);
  await writeStore(STORE_NAME, items);

  return NextResponse.json(items);
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  const items = await getChecklist();
  const item = items.find((i) => i.id === id);
  if (item) {
    if (updates.checked !== undefined) item.checked = updates.checked;
    if (updates.title !== undefined) item.title = updates.title;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.priority !== undefined) item.priority = updates.priority;
    await writeStore(STORE_NAME, items);
  }
  return NextResponse.json(items);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const items = await getChecklist();
  const updated = items.filter((i) => i.id !== id);
  await writeStore(STORE_NAME, updated);
  return NextResponse.json(updated);
}
