import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { UserConcert } from "@/lib/userConcerts";
import { userConcertSchema, userConcertPatchSchema, idSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "user-concerts";

async function safeSave(data: UserConcert[]): Promise<void> {
  try {
    await writeStore(STORE_NAME, data);
  } catch {
    // permission denied — silently fail
  }
}

export async function GET() {
  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);
  return NextResponse.json(concerts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(userConcertSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);
  const now = new Date().toISOString();
  const newConcert: UserConcert = {
    id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: parsed.data.title,
    artist: parsed.data.artist ?? "",
    date: parsed.data.date,
    venue: parsed.data.venue ?? "",
    city: parsed.data.city ?? "",
    memo: parsed.data.memo ?? "",
    status: parsed.data.status ?? "planned",
    ticketPrice: parsed.data.ticketPrice,
    ticketUrl: parsed.data.ticketUrl,
    showTimes: parsed.data.showTimes ?? [],
    milestones: parsed.data.milestones ?? [],
    sources: parsed.data.sources ?? [],
    createdAt: now,
    updatedAt: now,
    version: 2,
  };
  concerts.push(newConcert);
  await safeSave(concerts);
  return NextResponse.json(newConcert);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(userConcertPatchSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);
  const concert = concerts.find((c) => c.id === parsed.data.id);
  if (!concert) return NextResponse.json({ error: "콘서트를 찾을 수 없습니다" }, { status: 404 });

  const { id, ...updates } = parsed.data;
  void id;
  Object.assign(concert, updates, { updatedAt: new Date().toISOString() });
  await safeSave(concerts);
  return NextResponse.json(concerts);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(idSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);
  const updated = concerts.filter((c) => c.id !== parsed.data.id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
