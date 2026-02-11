import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { QuickLink } from "@/lib/types";

const STORE_NAME = "links";

const DEFAULT_LINKS: QuickLink[] = [
  { id: "link-1", title: "SMBC 뱅킹", url: "https://www.smbc.co.jp/", category: "금융", icon: "🏦" },
  { id: "link-2", title: "SBI新生銀行", url: "https://www.sbishinseibank.co.jp/", category: "금융", icon: "🏦" },
  { id: "link-3", title: "SBI証券", url: "https://www.sbisec.co.jp/", category: "금융", icon: "📈" },
  { id: "link-4", title: "Money Forward ME", url: "https://moneyforward.com/", category: "금융", icon: "💰" },
  { id: "link-5", title: "Wise (해외송금)", url: "https://wise.com/", category: "금융", icon: "💸" },
  { id: "link-6", title: "건강보험공단", url: "https://www.nhis.or.kr/", category: "한국", icon: "🏥" },
  { id: "link-7", title: "PayPay", url: "https://paypay.ne.jp/", category: "결제", icon: "💳" },
  { id: "link-8", title: "Amazon Japan", url: "https://www.amazon.co.jp/", category: "쇼핑", icon: "📦" },
  { id: "link-9", title: "Yahoo!乗換案内", url: "https://transit.yahoo.co.jp/", category: "교통", icon: "🚃" },
  { id: "link-10", title: "후루사토 납세", url: "https://www.furusato-tax.jp/", category: "절세", icon: "🎁" },
];

async function safeSave(data: QuickLink[]): Promise<void> {
  try {
    await writeStore(STORE_NAME, data);
  } catch {
    // Volume permission issue
  }
}

export async function GET() {
  const stored = await readStore<QuickLink[] | null>(STORE_NAME, null);
  if (stored === null) {
    await safeSave(DEFAULT_LINKS);
    return NextResponse.json(DEFAULT_LINKS);
  }
  return NextResponse.json(stored);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const links = await readStore<QuickLink[]>(STORE_NAME, DEFAULT_LINKS);

  const newLink: QuickLink = {
    ...body,
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  links.push(newLink);
  await safeSave(links);

  return NextResponse.json(links);
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
  const links = await readStore<QuickLink[]>(STORE_NAME, DEFAULT_LINKS);
  const link = links.find((l) => l.id === id);
  if (!link) return NextResponse.json({ error: "항목을 찾을 수 없습니다" }, { status: 404 });
  if (updates.title !== undefined) link.title = updates.title;
  if (updates.url !== undefined) link.url = updates.url;
  if (updates.category !== undefined) link.category = updates.category;
  if (updates.icon !== undefined) link.icon = updates.icon;
  await safeSave(links);
  return NextResponse.json(links);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const links = await readStore<QuickLink[]>(STORE_NAME, DEFAULT_LINKS);
  const updated = links.filter((l) => l.id !== id);
  await safeSave(updated);
  return NextResponse.json(updated);
}
