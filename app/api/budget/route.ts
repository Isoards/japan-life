import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { BudgetData } from "@/lib/types";
import { getDefaultBudget } from "@/lib/calculator";

const STORE_NAME = "budget";

export async function GET() {
  const data = await readStore<BudgetData | null>(STORE_NAME, null);
  if (data === null) {
    const defaults: BudgetData = {
      income: 0,
      categories: getDefaultBudget(),
    };
    return NextResponse.json(defaults);
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body: BudgetData = await request.json();
  try {
    await writeStore(STORE_NAME, body);
  } catch {
    // Volume permission issue — skip persisting
  }
  return NextResponse.json(body);
}
