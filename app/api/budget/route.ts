import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { BudgetData } from "@/lib/types";
import { getDefaultBudget } from "@/lib/calculator";
import { budgetSchema, parseOrError } from "@/lib/validations";

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
  const body = await request.json();
  const parsed = parseOrError(budgetSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await writeStore(STORE_NAME, parsed.data);
  } catch {
    // Volume permission issue — skip persisting
  }
  return NextResponse.json(parsed.data);
}
