import { normalizeForMatch } from "./normalize-text";

const METADATA_PATTERNS = [
  /^(?:小計|合計|総合計|税込|税|消費税|内税|外税|現金|お預り|お釣り|釣銭|クレジット|ポイント|値引|割引|レジ|担当|店舗)$/u,
  /^(?:tel|電話|営業時間|領収書|レシート|ありがとうございました|毎度ありがとうございます)/iu,
  /^(?:合計|小計|現金|お預り|お釣り|消費税|ポイント|値引|割引)[\s:：¥￥\d,.-]*/u,
  /^(?:\d{2,4}[年/-]\d{1,2}[月/-]\d{1,2}|\d{1,2}:\d{2})/u,
  /^(?:no\.?|伝票|取引|端末|承認|カード|会員)\s*[:：#]?\s*[\d*-]+/iu,
];

const NON_FOOD_TERMS = [
  "キッチンペーパー", "ティッシュ", "トイレットペーパー", "洗剤", "柔軟剤", "ラップ",
  "アルミホイル", "ゴミ袋", "ごみ袋", "スポンジ", "歯ブラシ", "シャンプー", "石鹸",
  "せっけん", "電池", "マスク", "紙おむつ", "除菌", "漂白剤", "保存袋",
];

const FOOD_TERMS = [
  "肉", "鶏", "豚", "牛", "魚", "鮭", "さば", "えび", "いか", "卵", "豆腐", "納豆",
  "ねぎ", "ネギ", "葱", "玉ねぎ", "玉葱", "野菜", "キャベツ", "もやし", "にんじん", "人参",
  "じゃが", "しめじ", "えのき", "しいたけ", "ほうれん", "ブロッコリー", "ニラ", "白菜", "大根",
  "米", "ご飯", "うどん", "そば", "パスタ", "パン", "醤油", "みりん", "料理酒", "味噌",
  "だし", "油", "塩", "こしょう", "胡椒", "砂糖", "にんにく", "キムチ", "牛乳", "チーズ",
];

export function isReceiptMetadataLine(value: string): boolean {
  const text = value.trim();
  if (!text || /^[\d\s¥￥,.*#-]+$/.test(text)) return true;
  return METADATA_PATTERNS.some((pattern) => pattern.test(text));
}

export function isKnownNonFood(value: string): boolean {
  const text = normalizeForMatch(value);
  return NON_FOOD_TERMS.some((term) => text.includes(normalizeForMatch(term)));
}

export function hasFoodSignal(value: string): boolean {
  const text = normalizeForMatch(value);
  return FOOD_TERMS.some((term) => text.includes(normalizeForMatch(term)));
}
