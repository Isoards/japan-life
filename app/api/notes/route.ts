import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { Note } from "@/lib/types";

const STORE_NAME = "notes";

async function safeSave(data: Note[]): Promise<void> {
  try {
    await writeStore(STORE_NAME, data);
  } catch {
    // Volume permission issue
  }
}

export async function GET() {
  const notes = await readStore<Note[]>(STORE_NAME, []);
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.japanese?.trim()) return NextResponse.json({ error: "일본어 텍스트가 필요합니다" }, { status: 400 });
  if (!body.korean?.trim()) return NextResponse.json({ error: "한국어 뜻이 필요합니다" }, { status: 400 });
  const notes = await readStore<Note[]>(STORE_NAME, []);

  const newNote: Note = {
    ...body,
    japanese: body.japanese.trim(),
    korean: body.korean.trim(),
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  notes.push(newNote);
  await safeSave(notes);

  return NextResponse.json(notes);
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
  const notes = await readStore<Note[]>(STORE_NAME, []);
  const note = notes.find((n) => n.id === id);
  if (!note) return NextResponse.json({ error: "항목을 찾을 수 없습니다" }, { status: 404 });
  if (updates.japanese !== undefined) note.japanese = updates.japanese;
  if (updates.reading !== undefined) note.reading = updates.reading;
  if (updates.korean !== undefined) note.korean = updates.korean;
  if (updates.memo !== undefined) note.memo = updates.memo;
  if (updates.category !== undefined) note.category = updates.category;
  await safeSave(notes);
  return NextResponse.json(notes);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const notes = await readStore<Note[]>(STORE_NAME, []);
  const updated = notes.filter((n) => n.id !== id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
