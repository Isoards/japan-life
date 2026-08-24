import { createSign, randomBytes } from "node:crypto";
import { SHEETS_CLASSIFICATION_GUIDE_RANGE, SHEETS_HISTORY_RANGE, SHEETS_ID, SHEETS_SETTINGS_RANGE, type SheetCell } from "@/lib/sheets";
import type { ExpenseReceiptConfirmResult, ExpenseReceiptDraft, ExpenseReceiptEntryDraft, ExpenseSheetOptions } from "./receipt/types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
let tokenCache: { value: string; expiresAt: number } | null = null;

export class ExpenseSheetError extends Error {
  constructor(message: string, public readonly code: "UNAVAILABLE" | "AUTH" | "WRITE" | "READ") {
    super(message);
    this.name = "ExpenseSheetError";
  }
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email || !rawKey) throw new ExpenseSheetError("Google Sheets 쓰기 서비스가 설정되지 않았습니다.", "UNAVAILABLE");

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iss: email, scope: SHEETS_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${payload}`;
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    const signature = signer.sign(rawKey.replace(/\\n/g, "\n"));
    const assertion = `${unsigned}.${base64Url(signature)}`;
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      cache: "no-store",
    });
    if (!response.ok) throw new ExpenseSheetError("Google Sheets 인증에 실패했습니다.", "AUTH");
    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new ExpenseSheetError("Google Sheets 인증 토큰을 받지 못했습니다.", "AUTH");
    tokenCache = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return data.access_token;
  } catch (error) {
    if (error instanceof ExpenseSheetError) throw error;
    throw new ExpenseSheetError("Google Sheets 서비스 계정 키를 읽지 못했습니다.", "AUTH");
  }
}

function createSheetRowId(): string {
  return randomBytes(6).toString("base64url").slice(0, 8);
}

export function formatExpenseSheetRow(draft: ExpenseReceiptDraft, entry: ExpenseReceiptEntryDraft, rowId = createSheetRowId()): Array<string | number | boolean> {
  return [rowId, draft.date, draft.type, entry.category, entry.description, entry.amount, draft.paymentMethod, draft.memo, false];
}

export async function appendExpenseReceipt(draft: ExpenseReceiptDraft): Promise<ExpenseReceiptConfirmResult> {
  const rowIds = draft.entries.map(() => createSheetRowId());
  const rows = draft.entries.map((entry, index) => formatExpenseSheetRow(draft, entry, rowIds[index]));
  const provider = (process.env.GOOGLE_SHEETS_WRITE_PROVIDER ?? (process.env.GOOGLE_SHEETS_APPS_SCRIPT_URL ? "apps-script" : "service-account")).toLowerCase();
  if (provider === "apps-script") return appendExpenseReceiptWithAppsScript(draft, rowIds, rows);
  if (provider !== "service-account") throw new ExpenseSheetError("지원하지 않는 Google Sheets 쓰기 방식입니다.", "UNAVAILABLE");

  const token = await getAccessToken();
  const range = encodeURIComponent(SHEETS_HISTORY_RANGE);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ majorDimension: "ROWS", values: rows }),
      cache: "no-store",
    });
    if (!response.ok) throw new ExpenseSheetError("Google Sheets에 내역을 추가하지 못했습니다.", "WRITE");
    return { rowIds, rows };
  } catch (error) {
    if (error instanceof ExpenseSheetError) throw error;
    throw new ExpenseSheetError("Google Sheets 쓰기 중 네트워크 오류가 발생했습니다.", "WRITE");
  }
}

async function appendExpenseReceiptWithAppsScript(
  draft: ExpenseReceiptDraft,
  rowIds: string[],
  rows: Array<Array<string | number | boolean>>,
): Promise<ExpenseReceiptConfirmResult> {
  const url = process.env.GOOGLE_SHEETS_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_SHEETS_APPS_SCRIPT_SECRET;
  if (!url || !secret) throw new ExpenseSheetError("Apps Script Sheets 쓰기 설정이 없습니다.", "UNAVAILABLE");
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/u.test(url)) {
    throw new ExpenseSheetError("Apps Script Web App URL 형식이 올바르지 않습니다.", "UNAVAILABLE");
  }

  try {
    for (let index = 0; index < draft.entries.length; index += 1) {
      const entry = draft.entries[index];
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, row: { id: rowIds[index], date: draft.date, type: draft.type, category: entry.category, description: entry.description, amount: entry.amount, paymentMethod: draft.paymentMethod, memo: draft.memo } }),
        redirect: "follow",
        cache: "no-store",
      });
      if (!response.ok) throw new ExpenseSheetError(`Apps Script가 ${index + 1}번째 가계부 행을 처리하지 못했습니다.`, "WRITE");
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!data?.ok) {
        const message = data?.error === "unauthorized" ? "Apps Script API_SECRET이 일치하지 않습니다." : `Apps Script가 ${index + 1}번째 가계부 행 등록을 거부했습니다.`;
        throw new ExpenseSheetError(message, "WRITE");
      }
    }
    return { rowIds, rows };
  } catch (error) {
    if (error instanceof ExpenseSheetError) throw error;
    throw new ExpenseSheetError("Apps Script 호출 중 네트워크 오류가 발생했습니다.", "WRITE");
  }
}

export async function getExpenseSheetOptions(): Promise<ExpenseSheetOptions> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) throw new ExpenseSheetError("Google Sheets 설정을 읽을 API 키가 없습니다.", "UNAVAILABLE");
  const range = encodeURIComponent(SHEETS_SETTINGS_RANGE);
  const guideRange = encodeURIComponent(SHEETS_CLASSIFICATION_GUIDE_RANGE);
  try {
    const [response, guideResponse] = await Promise.all([
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${range}?key=${encodeURIComponent(apiKey)}&valueRenderOption=FORMATTED_VALUE`, { cache: "no-store" }),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${guideRange}?key=${encodeURIComponent(apiKey)}&valueRenderOption=FORMATTED_VALUE`, { cache: "no-store" }),
    ]);
    if (!response.ok || !guideResponse.ok) throw new ExpenseSheetError("Google Sheets 설정 또는 분류가이드 탭을 읽지 못했습니다.", "READ");
    const data = await response.json() as { values?: SheetCell[][] };
    const guideData = await guideResponse.json() as { values?: SheetCell[][] };
    const rows = data.values ?? [];
    const categories = [...new Set(rows.filter((row) => String(row[1] ?? "").trim() === "지출").map((row) => String(row[0] ?? "").trim()).filter(Boolean))];
    const paymentMethods = [...new Set(rows.map((row) => String(row[3] ?? "").trim()).filter(Boolean))];
    if (!categories.length || !paymentMethods.length) throw new ExpenseSheetError("Google Sheets 설정 탭의 카테고리 또는 결제수단 목록이 비어 있습니다.", "READ");
    return {
      categories,
      paymentMethods,
      defaultCategory: categories.includes("장보기") ? "장보기" : categories[0],
      defaultPaymentMethod: paymentMethods.includes("페이페이") ? "페이페이" : paymentMethods[0],
      classificationGuide: (guideData.values ?? []).slice(1).filter((row) => row[0] && row[1]).map((row) => ({ criterion: String(row[0]), category: String(row[1]), example: String(row[2] ?? ""), note: String(row[3] ?? "") })),
    };
  } catch (error) {
    if (error instanceof ExpenseSheetError) throw error;
    throw new ExpenseSheetError("Google Sheets 설정을 읽는 중 오류가 발생했습니다.", "READ");
  }
}

export async function hasPossibleDuplicateExpense(draft: ExpenseReceiptDraft): Promise<boolean> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) return false;
  const range = encodeURIComponent(SHEETS_HISTORY_RANGE);
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${range}?key=${encodeURIComponent(apiKey)}&valueRenderOption=FORMATTED_VALUE`, { cache: "no-store" });
    if (!response.ok) return false;
    const data = await response.json() as { values?: SheetCell[][] };
    const matching = (data.values ?? []).slice(1).filter((row) => {
      const date = String(row[1] ?? "").replace(/[/.]/g, "-");
      const description = String(row[4] ?? "");
      return date === draft.date && description.includes(draft.merchantName);
    });
    const matchingTotal = matching.reduce((sum, row) => sum + Number(String(row[5] ?? "0").replace(/[¥￥,]/g, "")), 0);
    return matchingTotal === draft.totalAmount;
  } catch {
    return false;
  }
}
