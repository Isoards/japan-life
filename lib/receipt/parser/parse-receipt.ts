import type { GeneralReceiptItem, GeneralReceiptTransaction } from "../types";

const DATE_PATTERN = /(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})日?/u;
const TIME_PATTERN = /(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s|$)/u;
const TOTAL_LABEL = /(お支払(?:い)?|ご請求|総合計|税込合計|合計金額|合計)/u;
const ITEM_END_LABEL = /(小計|お買上点数|合計|総合計|消費税|内税|外税|お支払)/u;
const STORE_SIGNAL = /(店|ストア|スーパー|マート|市場|イオン|西友|ヨーク|ベニマル|業務スーパー|ドン.?キホーテ|カスミ|とりせん|ヤオコー|ベルク|マルエツ|ライフ|コープ|cgc)/iu;
const NON_ITEM_LINE = /(?:tel|電話|〒|住所|営業時間|領収書|レシート|レジ|担当|責任者|会員|ポイント|お預り|お釣り|釣銭|クレジット|カード|paypay|現金|電子マネー|値引|割引|消費税|内税|外税|税率|対象額|小計|合計|お支払|ありがとうございました|またのご来店|取引|端末|承認|伝票|発行)/iu;
const PRICE_AT_END = /(?:\s|^)[¥￥]?\s*-?\d{1,3}(?:,\d{3})*(?:円)?\s*[※*＊]?\s*$/u;
const ITEM_PRICE_AT_END = /(?:\s|^)[¥￥]?\s*(\d{1,3}(?:,\d{3})*)(?:円)?\s*[※*＊]?\s*$/u;
const QUANTITY_AT_END = /\s+(?:\d+(?:\.\d+)?\s*(?:g|kg|ml|l|個|本|枚|袋|パック|入)|[x×]\s*\d+)\s*$/iu;

function cleanLine(value: string): string {
  return value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(match: RegExpMatchArray): string {
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function extractAmount(value: string): number | null {
  const numbers = [...value.matchAll(/[¥￥]?\s*(\d{1,3}(?:,\d{3})+|\d{2,7})(?:円)?/gu)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((number) => Number.isFinite(number) && number > 0);
  return numbers.length ? numbers[numbers.length - 1] : null;
}

function detectDate(lines: string[]) {
  for (const line of lines) {
    const date = line.match(DATE_PATTERN);
    if (!date) continue;
    const time = line.match(TIME_PATTERN);
    return { date: formatDate(date), time: time ? `${time[1].padStart(2, "0")}:${time[2]}` : undefined };
  }
  const now = new Date();
  return {
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    time: undefined,
  };
}

function detectMerchant(lines: string[], dateIndex: number): string {
  const header = lines.slice(0, dateIndex >= 0 ? Math.max(dateIndex, 1) : Math.min(lines.length, 8));
  const candidates = header.filter((line) =>
    line.length >= 2
    && line.length <= 50
    && !NON_ITEM_LINE.test(line)
    && !DATE_PATTERN.test(line)
    && !/^[\d\s#*-]+$/.test(line),
  );
  return candidates.find((line) => STORE_SIGNAL.test(line)) ?? candidates[0] ?? "가게 이름 미확인";
}

function detectTotal(lines: string[]): number {
  const labeled = lines
    .map((line, index) => ({ line, index, priority: /お支払|ご請求|総合計|税込合計/u.test(line) ? 2 : TOTAL_LABEL.test(line) ? 1 : 0 }))
    .filter((entry) => entry.priority > 0)
    .flatMap((entry) => {
      const own = extractAmount(entry.line);
      const next = own === null && entry.index + 1 < lines.length ? extractAmount(lines[entry.index + 1]) : null;
      return own !== null || next !== null ? [{ amount: own ?? next as number, priority: entry.priority, index: entry.index }] : [];
    })
    .sort((left, right) => right.priority - left.priority || right.index - left.index);
  return labeled[0]?.amount ?? 0;
}

function detectPaymentMethod(lines: string[]): string | undefined {
  const text = lines.join(" ");
  if (/paypay/iu.test(text)) return "PayPay";
  if (/現金/u.test(text)) return "현금";
  if (/クレジット|カード/u.test(text)) return "신용카드";
  if (/交通系|suica|pasmo/iu.test(text)) return "교통계 IC";
  if (/電子マネー/u.test(text)) return "전자화폐";
  return undefined;
}

function cleanItemName(value: string): string {
  let name = value.replace(/^[・●■□◆◇※*+\-\s]+/u, "").replace(/^(?:\d{4,14}\s+)/u, "");
  name = name.replace(PRICE_AT_END, "").replace(QUANTITY_AT_END, "").replace(/\s*[※*＊]\s*$/u, "").trim();
  return name;
}

function extractItemAmount(value: string): number | undefined {
  const match = value.match(ITEM_PRICE_AT_END);
  if (!match) return undefined;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function detectItems(lines: string[], merchantName: string, dateIndex: number): GeneralReceiptItem[] {
  const endIndex = lines.findIndex((line, index) => index > Math.max(dateIndex, 0) && ITEM_END_LABEL.test(line));
  const startIndex = dateIndex >= 0 ? dateIndex + 1 : 0;
  const scoped = lines.slice(startIndex, endIndex >= 0 ? endIndex : lines.length);
  const items: GeneralReceiptItem[] = [];

  scoped.forEach((line, offset) => {
    if (line === merchantName || NON_ITEM_LINE.test(line) || DATE_PATTERN.test(line) || /^[\d\s¥￥,.*#-]+$/.test(line)) return;
    const name = cleanItemName(line);
    if (name.length < 2 || !/[一-龯ぁ-んァ-ヶa-z]/iu.test(name)) return;
    items.push({ rawText: line, name, lineIndex: startIndex + offset, amount: extractItemAmount(line) });
  });

  return items.slice(0, 30);
}

export function parseGeneralReceipt(rawLines: string[]): GeneralReceiptTransaction {
  const lines = rawLines.map(cleanLine).filter(Boolean);
  const dateIndex = lines.findIndex((line) => DATE_PATTERN.test(line));
  const { date, time } = detectDate(lines);
  const merchantName = detectMerchant(lines, dateIndex);
  const totalAmount = detectTotal(lines);
  const purchasedItems = detectItems(lines, merchantName, dateIndex);
  const warnings: string[] = [];
  if (merchantName === "가게 이름 미확인") warnings.push("가게 이름을 찾지 못했어요.");
  if (dateIndex < 0) warnings.push("거래 날짜를 찾지 못해 오늘 날짜를 넣었어요.");
  if (!totalAmount) warnings.push("최종 결제 금액을 찾지 못했어요.");
  if (!purchasedItems.length) warnings.push("구매 품목을 찾지 못했어요.");

  const confidence = [merchantName !== "가게 이름 미확인", dateIndex >= 0, totalAmount > 0, purchasedItems.length > 0]
    .filter(Boolean).length / 4;
  return { merchantName, purchasedItems, date, time, totalAmount, detectedPaymentMethod: detectPaymentMethod(lines), confidence, warnings };
}
