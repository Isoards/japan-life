import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

interface UserConcert {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  memo: string;
}

const STORE_NAME = "user-concerts";

export async function GET() {
  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);
  return NextResponse.json(concerts);
}

export async function POST(request: NextRequest) {
  const body: Omit<UserConcert, "id"> = await request.json();
  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);

  const newConcert: UserConcert = {
    ...body,
    id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  concerts.push(newConcert);
  await writeStore(STORE_NAME, concerts);

  return NextResponse.json(newConcert);
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);
  const concert = concerts.find((c) => c.id === id);
  if (concert) {
    if (updates.title !== undefined) concert.title = updates.title;
    if (updates.date !== undefined) concert.date = updates.date;
    if (updates.venue !== undefined) concert.venue = updates.venue;
    if (updates.city !== undefined) concert.city = updates.city;
    if (updates.memo !== undefined) concert.memo = updates.memo;
    await writeStore(STORE_NAME, concerts);
  }
  return NextResponse.json(concerts);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const concerts = await readStore<UserConcert[]>(STORE_NAME, []);
  const updated = concerts.filter((c) => c.id !== id);
  await writeStore(STORE_NAME, updated);
  return NextResponse.json(updated);
}
