import { INCOME_CATEGORIES, SAVING_CATEGORIES } from "./constants/budget";

export const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || "1volLOrTwvHDDOCXY_AD7fLqVd5JVHHm9HsPg7QTZ0qg";
export const SHEETS_HISTORY_RANGE = "내역!A:I";
export const SHEETS_SETTINGS_RANGE = "설정!A2:D47";
export const SHEETS_CLASSIFICATION_GUIDE_RANGE = "분류가이드!A11:D21";

const COL_DATE = 1;
const COL_TYPE = 2;
const COL_CATEGORY = 3;
const COL_DESCRIPTION = 4;
const COL_AMOUNT = 5;
const MONTH_PATTERN = /(\d{4})[-/.년](\d{1,2})/;
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const CATEGORY_ALIASES: Record<string, string> = {
  "가전/디지털": "가전/가구",
  "전자기기": "가전/가구",
  "주유": "차량비",
  "차량관리": "차량비",
  "여가 기타": "기타",
};

export type SheetCell = string | number | boolean;

export interface ParsedSheetEntry {
  month: string;
  category: string;
  description: string;
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

/** Google Sheets의 UNFORMATTED_VALUE 날짜(Excel 일련번호 포함)를 YYYY-MM으로 변환한다. */
function parseMonth(dateRaw: SheetCell | undefined): string | null {
  const raw = String(dateRaw ?? "").trim();
  const dateMatch = raw.match(MONTH_PATTERN);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}`;
  }

  // Google Sheets API는 valueRenderOption=UNFORMATTED_VALUE일 때 날짜를
  // 1899-12-30 기준의 Excel 일련번호로 반환한다.
  const serial = typeof dateRaw === "number" ? dateRaw : Number(raw);
  if (!Number.isFinite(serial) || serial <= 0) return null;

  const date = new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * 86_400_000);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function parseSheetEntries(rows: SheetCell[][]): ParsedSheetEntry[] {
  const entries: ParsedSheetEntry[] = [];

  for (const row of rows.slice(1)) {
    const dateRaw = row[COL_DATE];
    const type = String(row[COL_TYPE] || "").trim();
    const rawCategory = String(row[COL_CATEGORY] || "").trim();
    const category = CATEGORY_ALIASES[rawCategory] ?? rawCategory;
    const description = String(row[COL_DESCRIPTION] || "").trim();
    const amount =
      typeof row[COL_AMOUNT] === "number"
        ? row[COL_AMOUNT]
        : parseFloat(String(row[COL_AMOUNT] || "0")) || 0;

    if (!category || amount === 0) continue;

    const month = parseMonth(dateRaw);
    if (!month) continue;
    const absAmount = Math.abs(amount);

    if (type === "수입" || INCOME_CATEGORIES.includes(category)) {
      entries.push({ month, category, description, amount: absAmount, kind: "income" });
    } else if (type === "저축/투자" || SAVING_CATEGORIES.includes(category)) {
      entries.push({ month, category, description, amount: absAmount, kind: "saving" });
    } else {
      entries.push({ month, category, description, amount: absAmount, kind: "expense" });
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
