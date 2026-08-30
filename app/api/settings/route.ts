import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/lib/settings";
import { parseOrError, userSettingsSchema } from "@/lib/validations";

const STORE_NAME = "settings";

export async function GET() {
  const settings = await readStore<UserSettings>(STORE_NAME, DEFAULT_USER_SETTINGS);
  return NextResponse.json({ ...DEFAULT_USER_SETTINGS, ...settings });
}

export async function POST(request: NextRequest) {
  const parsed = parseOrError(userSettingsSchema, await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await writeStore(STORE_NAME, parsed.data);
  } catch {
    return NextResponse.json({ error: "설정을 저장하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json(parsed.data);
}
