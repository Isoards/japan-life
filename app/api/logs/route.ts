import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { WeeklyLog } from "@/lib/types";
import { weeklyLogSchema, weeklyLogPatchSchema, idSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "logs";

async function safeSave(data: WeeklyLog[]): Promise<void> {
  try {
    await writeStore(STORE_NAME, data);
  } catch {
    // Volume permission issue
  }
}

export async function GET() {
  const logs = await readStore<WeeklyLog[]>(STORE_NAME, []);
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(weeklyLogSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const logs = await readStore<WeeklyLog[]>(STORE_NAME, []);
  const newLog: WeeklyLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    week: parsed.data.week,
    technical: parsed.data.technical,
    expression: parsed.data.expression,
    mistake: parsed.data.mistake,
    memo: parsed.data.memo,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog);
  await safeSave(logs);
  return NextResponse.json(logs);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(weeklyLogPatchSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const logs = await readStore<WeeklyLog[]>(STORE_NAME, []);
  const log = logs.find((l) => l.id === parsed.data.id);
  if (!log) return NextResponse.json({ error: "항목을 찾을 수 없습니다" }, { status: 404 });

  log.week = parsed.data.week;
  log.technical = parsed.data.technical;
  log.expression = parsed.data.expression;
  log.mistake = parsed.data.mistake;
  log.memo = parsed.data.memo;
  await safeSave(logs);
  return NextResponse.json(logs);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(idSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const logs = await readStore<WeeklyLog[]>(STORE_NAME, []);
  const updated = logs.filter((l) => l.id !== parsed.data.id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
