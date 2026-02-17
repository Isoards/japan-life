import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { PackageEntry } from "@/lib/types";
import { packageSchema, packagePatchSchema, idSchema, parseOrError } from "@/lib/validations";

const STORE_NAME = "packages";

async function safeSave(data: PackageEntry[]): Promise<void> {
  try {
    await writeStore(STORE_NAME, data);
  } catch {
    // Volume permission issue — skip persisting
  }
}

export async function GET() {
  const packages = await readStore<PackageEntry[]>(STORE_NAME, []);
  return NextResponse.json(packages);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(packageSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const packages = await readStore<PackageEntry[]>(STORE_NAME, []);
  const newEntry: PackageEntry = {
    id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trackingNumber: parsed.data.trackingNumber.trim(),
    carrier: parsed.data.carrier,
    description: parsed.data.description.trim(),
    status: parsed.data.status ?? "pending",
    createdAt: new Date().toISOString(),
    memo: parsed.data.memo,
  };
  packages.push(newEntry);
  await safeSave(packages);
  return NextResponse.json(packages);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(packagePatchSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const packages = await readStore<PackageEntry[]>(STORE_NAME, []);
  const pkg = packages.find((p) => p.id === parsed.data.id);
  if (!pkg) return NextResponse.json({ error: "택배를 찾을 수 없습니다" }, { status: 404 });

  if (parsed.data.trackingNumber !== undefined) pkg.trackingNumber = parsed.data.trackingNumber;
  if (parsed.data.carrier !== undefined) pkg.carrier = parsed.data.carrier;
  if (parsed.data.description !== undefined) pkg.description = parsed.data.description;
  if (parsed.data.status !== undefined) {
    pkg.status = parsed.data.status;
    if (parsed.data.status === "delivered") {
      pkg.deliveredAt = new Date().toISOString();
    }
  }
  if (parsed.data.memo !== undefined) pkg.memo = parsed.data.memo;

  await safeSave(packages);
  return NextResponse.json(packages);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const parsed = parseOrError(idSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const packages = await readStore<PackageEntry[]>(STORE_NAME, []);
  const updated = packages.filter((p) => p.id !== parsed.data.id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
