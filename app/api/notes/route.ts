import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { noteSchema, notePatchSchema, idSchema, parseOrError } from "@/lib/validations";

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
  const parsed = parseOrError(noteSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const notes = await readStore<Note[]>(STORE_NAME, []);
  const newNote: Note = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: parsed.data.category,
    japanese: parsed.data.japanese.trim(),
    korean: parsed.data.korean.trim(),
    reading: parsed.data.reading,
    memo: parsed.data.memo,
  };
  notes.push(newNote);
  await safeSave(notes);
  return NextResponse.json(notes);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(notePatchSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const notes = await readStore<Note[]>(STORE_NAME, []);
  const note = notes.find((n) => n.id === parsed.data.id);
  if (!note) return NextResponse.json({ error: "항목을 찾을 수 없습니다" }, { status: 404 });

  note.japanese = parsed.data.japanese;
  note.reading = parsed.data.reading;
  note.korean = parsed.data.korean;
  note.memo = parsed.data.memo;
  note.category = parsed.data.category;
  await safeSave(notes);
  return NextResponse.json(notes);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(idSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const notes = await readStore<Note[]>(STORE_NAME, []);
  const updated = notes.filter((n) => n.id !== parsed.data.id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
