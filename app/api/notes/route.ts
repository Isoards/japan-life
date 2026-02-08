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
  const notes = await readStore<Note[]>(STORE_NAME, []);

  const newNote: Note = {
    ...body,
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  notes.push(newNote);
  await safeSave(notes);

  return NextResponse.json(notes);
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  const notes = await readStore<Note[]>(STORE_NAME, []);
  const note = notes.find((n) => n.id === id);
  if (note) {
    Object.assign(note, updates);
    await safeSave(notes);
  }
  return NextResponse.json(notes);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const notes = await readStore<Note[]>(STORE_NAME, []);
  const updated = notes.filter((n) => n.id !== id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
