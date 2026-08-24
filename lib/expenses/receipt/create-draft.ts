import { parseGeneralReceipt } from "@/lib/receipt/parser/parse-receipt";
import { koreanizeReceiptText } from "./koreanize";
import type { ExpenseReceiptDraft, ExpenseReceiptEntryDraft, ExpenseSheetOptions } from "./types";

const HOUSEHOLD_TERMS = /(キッチンペーパー|ティッシュ|トイレットペーパー|洗剤|柔軟剤|ラップ|アルミホイル|ゴミ袋|ごみ袋|スポンジ|歯ブラシ|シャンプー|石鹸|せっけん|電池|マスク|紙おむつ|除菌|漂白剤|保存袋)/u;
const CATEGORY_RULES: Array<{ category: string; pattern: RegExp }> = [
  { category: "술/유흥", pattern: /(酒|ビール|発泡酒|チューハイ|ハイボール|ワイン|焼酎|日本酒|ストロング|술|맥주|하이볼|와인|소주|사케)/iu },
  { category: "커피/간식", pattern: /(コーヒー|珈琲|菓子|チョコ|アイス|ケーキ|スナック|プリン|커피|과자|초콜릿|아이스크림|케이크|푸딩)/iu },
  { category: "생활용품", pattern: HOUSEHOLD_TERMS },
  { category: "의료/건강", pattern: /(薬|医薬|サプリ|ビタミン|マスク|絆創膏|영양제|비타민|약|마스크|밴드)/iu },
  { category: "의류/미용", pattern: /(化粧|コスメ|クレンジング|化粧水|乳液|美容|토너|클렌징|화장품|미용)/iu },
];

export function formatExpenseDescription(merchantName: string, items: string[]): string {
  if (!items.length) return merchantName;
  const visible = items.slice(0, 4);
  const suffix = items.length > visible.length ? ` 외 ${items.length - visible.length}개` : "";
  return `${merchantName} (${visible.join(", ")}${suffix})`;
}

function categoryForItem(original: string, korean: string, options: ExpenseSheetOptions): string {
  const value = `${original} ${korean}`;
  return CATEGORY_RULES.find((rule) => options.categories.includes(rule.category) && rule.pattern.test(value))?.category
    ?? options.defaultCategory;
}

function allocateMissingAmounts(amounts: Array<number | undefined>, total: number): number[] {
  const knownTotal = amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  const missingCount = amounts.filter((amount) => amount === undefined).length;
  if (!missingCount) return amounts.map((amount) => amount ?? 0);
  const distributable = Math.max(0, total - knownTotal);
  const base = Math.floor(distributable / missingCount);
  let remainder = distributable - base * missingCount;
  return amounts.map((amount) => {
    if (amount !== undefined) return amount;
    const allocated = base + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
    return allocated;
  });
}

function reconcileEntries(entries: ExpenseReceiptEntryDraft[], total: number): ExpenseReceiptEntryDraft[] {
  if (!entries.length) return entries;
  const rawTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
  if (rawTotal <= 0) return entries.map((entry, index) => ({ ...entry, amount: index === 0 ? total : 0 }));
  let assigned = 0;
  return entries.map((entry, index) => {
    const remaining = Math.max(0, total - assigned);
    const amount = index === entries.length - 1
      ? remaining
      : Math.min(remaining, Math.round(total * entry.amount / rawTotal));
    assigned += amount;
    return { ...entry, amount };
  });
}

export async function createExpenseReceiptDraft(lines: string[], options: ExpenseSheetOptions): Promise<ExpenseReceiptDraft> {
  const receipt = parseGeneralReceipt(lines);
  const originalPurchasedItems = receipt.purchasedItems.map((item) => item.name);
  const korean = await koreanizeReceiptText(receipt.merchantName, originalPurchasedItems);
  const allocatedAmounts = allocateMissingAmounts(receipt.purchasedItems.map((item) => item.amount), receipt.totalAmount);
  const grouped = new Map<string, ExpenseReceiptEntryDraft>();
  receipt.purchasedItems.forEach((item, index) => {
    const koreanName = korean.items[index] ?? item.name;
    const category = categoryForItem(item.name, koreanName, options);
    const existing = grouped.get(category);
    if (existing) {
      existing.itemNames.push(koreanName);
      existing.originalItemNames.push(item.name);
      existing.amount += allocatedAmounts[index] ?? 0;
      existing.description = formatExpenseDescription(korean.merchantName, [...new Set(existing.itemNames)]);
    } else {
      grouped.set(category, {
        id: `entry-${grouped.size}`,
        category,
        itemNames: [koreanName],
        originalItemNames: [item.name],
        description: formatExpenseDescription(korean.merchantName, [koreanName]),
        amount: allocatedAmounts[index] ?? 0,
      });
    }
  });
  let entries = reconcileEntries([...grouped.values()], receipt.totalAmount)
    .filter((entry) => entry.amount > 0);
  if (!entries.length && receipt.totalAmount > 0) {
    entries = [{ id: "entry-0", category: options.defaultCategory, itemNames: [], originalItemNames: [], description: korean.merchantName, amount: receipt.totalAmount }];
  }
  const missingPriceCount = receipt.purchasedItems.filter((item) => item.amount === undefined).length;
  const warnings = [...receipt.warnings];
  if (missingPriceCount > 0) warnings.push(`가격을 읽지 못한 품목 ${missingPriceCount}개의 금액을 자동 배분했어요.`);
  return {
    date: receipt.date,
    type: "지출",
    merchantName: korean.merchantName,
    purchasedItems: korean.items,
    originalMerchantName: receipt.merchantName,
    originalPurchasedItems,
    totalAmount: receipt.totalAmount,
    entries,
    paymentMethod: options.defaultPaymentMethod,
    memo: `영수증 OCR 자동 등록 · 품목 ${originalPurchasedItems.length}개`,
    confidence: receipt.confidence,
    warnings,
  };
}
