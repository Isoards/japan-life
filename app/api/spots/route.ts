import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { MapSpot } from "@/lib/types";

const STORE_NAME = "spots";

async function safeSave(data: MapSpot[]): Promise<void> {
  try {
    await writeStore(STORE_NAME, data);
  } catch {
    // Volume permission issue
  }
}

export async function GET() {
  const spots = await readStore<MapSpot[]>(STORE_NAME, []);
  return NextResponse.json(spots);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "장소 이름이 필요합니다" }, { status: 400 });
  const spots = await readStore<MapSpot[]>(STORE_NAME, []);

  const newSpot: MapSpot = {
    ...body,
    name: body.name.trim(),
    id: `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  spots.push(newSpot);
  await safeSave(spots);

  return NextResponse.json(spots);
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
  const spots = await readStore<MapSpot[]>(STORE_NAME, []);
  const spot = spots.find((s) => s.id === id);
  if (!spot) return NextResponse.json({ error: "항목을 찾을 수 없습니다" }, { status: 404 });
  if (updates.name !== undefined) spot.name = updates.name;
  if (updates.category !== undefined) spot.category = updates.category;
  if (updates.memo !== undefined) spot.memo = updates.memo;
  if (updates.date !== undefined) spot.date = updates.date;
  if (updates.address !== undefined) spot.address = updates.address;
  if (updates.lat !== undefined) spot.lat = updates.lat;
  if (updates.lng !== undefined) spot.lng = updates.lng;
  await safeSave(spots);
  return NextResponse.json(spots);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const spots = await readStore<MapSpot[]>(STORE_NAME, []);
  const updated = spots.filter((s) => s.id !== id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
