import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { GarbageScheduleData } from "@/lib/types";
import { DEFAULT_GARBAGE_ENTRIES } from "@/lib/constants/garbage";
import { garbageScheduleSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "garbage";

export async function GET() {
  const data = await readStore<GarbageScheduleData | null>(STORE_NAME, null);
  if (data === null) {
    const defaults: GarbageScheduleData = {
      entries: DEFAULT_GARBAGE_ENTRIES,
      region: "栃木県",
    };
    return NextResponse.json(defaults);
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(garbageScheduleSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await writeStore(STORE_NAME, parsed.data);
  } catch {
    // Volume permission issue — skip persisting
  }
  return NextResponse.json(parsed.data);
}
