import { INCOME_CATEGORIES, SAVING_CATEGORIES } from "./constants/budget";

export const SHEETS_ID = "1volLOrTwvHDDOCXY_AD7fLqVd5JVHHm9HsPg7QTZ0qg";
export const SHEETS_HISTORY_RANGE = "내역!A:F";

const COL_DATE = 1;
const COL_TYPE = 2;
const COL_CATEGORY = 3;
const COL_AMOUNT = 5;
const MONTH_PATTERN = /(\d{4})[-/.년](\d{1,2})/;

export type SheetCell = string | number | boolean;

export interface ParsedSheetEntry {
  month: string;
  category: string;
  amount: number;
  kind: "income" | "saving" | "expense";
}

export interface SheetAggregate {
  byCategory: Record<string, number>;
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getRecentMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

export function parseSheetEntries(rows: SheetCell[][]): ParsedSheetEntry[] {
  const entries: ParsedSheetEntry[] = [];

  for (const row of rows.slice(1)) {
    const dateRaw = String(row[COL_DATE] || "");
    const type = String(row[COL_TYPE] || "").trim();
    const category = String(row[COL_CATEGORY] || "").trim();
    const amount =
      typeof row[COL_AMOUNT] === "number"
        ? row[COL_AMOUNT]
        : parseFloat(String(row[COL_AMOUNT] || "0")) || 0;

    if (!category || amount === 0) continue;

    const dateMatch = dateRaw.match(MONTH_PATTERN);
    if (!dateMatch) continue;

    const month = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}`;
    const absAmount = Math.abs(amount);

    if (type === "수입" || INCOME_CATEGORIES.includes(category)) {
      entries.push({ month, category, amount: absAmount, kind: "income" });
    } else if (type === "저축/투자" || SAVING_CATEGORIES.includes(category)) {
      entries.push({ month, category, amount: absAmount, kind: "saving" });
    } else {
      entries.push({ month, category, amount: absAmount, kind: "expense" });
    }
  }

  return entries;
}

export function createEmptyAggregate(): SheetAggregate {
  return {
    byCategory: {},
    totalIncome: 0,
    totalExpense: 0,
    totalSaving: 0,
  };
}

export function addEntryToAggregate(aggregate: SheetAggregate, entry: ParsedSheetEntry): void {
  if (entry.kind === "income") {
    aggregate.totalIncome += entry.amount;
  } else if (entry.kind === "saving") {
    aggregate.totalSaving += entry.amount;
  } else {
    aggregate.totalExpense += entry.amount;
  }

  aggregate.byCategory[entry.category] =
    (aggregate.byCategory[entry.category] || 0) + entry.amount;
}

export function aggregateSheetEntries(entries: ParsedSheetEntry[]): SheetAggregate {
  const aggregate = createEmptyAggregate();
  for (const entry of entries) {
    addEntryToAggregate(aggregate, entry);
  }
  return aggregate;
}
