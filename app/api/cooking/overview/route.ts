import { NextResponse } from "next/server";
import { getCookingOverview } from "@/lib/cooking/service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getCookingOverview());
}
