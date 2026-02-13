import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { MapSpot } from "@/lib/types";
import { spotSchema, spotPatchSchema, idSchema, parseOrError } from "@/lib/validations";

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
  const parsed = parseOrError(spotSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const spots = await readStore<MapSpot[]>(STORE_NAME, []);
  const newSpot: MapSpot = {
    id: `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: parsed.data.name.trim(),
    category: parsed.data.category,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    memo: parsed.data.memo,
    date: parsed.data.date,
    address: parsed.data.address,
    area: parsed.data.area,
  };
  spots.push(newSpot);
  await safeSave(spots);
  return NextResponse.json(spots);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(spotPatchSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const spots = await readStore<MapSpot[]>(STORE_NAME, []);
  const spot = spots.find((s) => s.id === parsed.data.id);
  if (!spot) return NextResponse.json({ error: "항목을 찾을 수 없습니다" }, { status: 404 });

  spot.name = parsed.data.name;
  spot.category = parsed.data.category;
  spot.memo = parsed.data.memo;
  spot.date = parsed.data.date;
  spot.address = parsed.data.address;
  spot.lat = parsed.data.lat;
  spot.lng = parsed.data.lng;
  await safeSave(spots);
  return NextResponse.json(spots);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(idSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const spots = await readStore<MapSpot[]>(STORE_NAME, []);
  const updated = spots.filter((s) => s.id !== parsed.data.id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
