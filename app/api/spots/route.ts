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
  const spots = await readStore<MapSpot[]>(STORE_NAME, []);

  const newSpot: MapSpot = {
    ...body,
    id: `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  spots.push(newSpot);
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
