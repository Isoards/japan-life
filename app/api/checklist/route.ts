import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { ChecklistItem } from "@/lib/types";
import defaults from "@/data/checklist-defaults.json";

const STORE_NAME = "checklist";

function normalizeChecklist(stored: unknown): ChecklistItem[] | null {
  if (stored === null || stored === undefined) return null;
  if (Array.isArray(stored)) return stored as ChecklistItem[];

  if (typeof stored === "object") {
    const values = Object.entries(stored as Record<string, unknown>)
      .filter(([key]) => key !== "__version")
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, value]) => value)
      .filter((value): value is ChecklistItem => typeof value === "object" && value !== null);

    if (values.length > 0) return values;
  }

  return null;
}

async function safeSave(items: ChecklistItem[]): Promise<void> {
  try {
    await writeStore(STORE_NAME, items);
  } catch {
    // Volume permission issue — skip persisting
  }
}

async function getChecklist(): Promise<ChecklistItem[]> {
  const stored = await readStore<unknown>(STORE_NAME, null);
  const normalized = normalizeChecklist(stored);

  if (normalized === null) {
    const items = defaults as ChecklistItem[];
    await safeSave(items);
    return items;
  }

  if (!Array.isArray(stored)) {
    await safeSave(normalized);
  }

  return normalized;
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
  await safeSave(items);

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
    await safeSave(items);
  }
  return NextResponse.json(items);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const items = await getChecklist();
  const updated = items.filter((i) => i.id !== id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
