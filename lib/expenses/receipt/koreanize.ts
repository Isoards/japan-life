const MERCHANT_RULES: Array<[RegExp, string]> = [
  [/とりせん|トリセン/iu, "토리센"],
  [/イオン/iu, "이온"],
  [/業務スーパー/iu, "교무슈퍼"],
  [/ローソン/iu, "로손"],
  [/ファミリーマート|ファミマ/iu, "패밀리마트"],
  [/セブン.?イレブン/iu, "세븐일레븐"],
  [/マツモトキヨシ/iu, "마츠모토키요시"],
  [/ニトリ/iu, "니토리"],
  [/ダイソー|daiso/iu, "다이소"],
  [/ドン.?キホーテ/iu, "돈키호테"],
  [/西友/iu, "세이유"],
  [/ヤオコー/iu, "야오코"],
  [/ベルク/iu, "벨크"],
  [/カスミ/iu, "카스미"],
];

const ITEM_RULES: Array<[RegExp, string]> = [
  [/キンパ|巻寿司|巻き寿司|太巻|細巻|海苔巻/iu, "김밥"],
  [/弁当|お弁当/iu, "도시락"],
  [/寿司|鮨|すし/iu, "초밥"],
  [/焼鳥|焼き鳥|やきとり/iu, "닭꼬치"],
  [/鶏.*(?:もも|モモ)|若どり.*(?:もも|モモ)/iu, "닭다리살"],
  [/鶏.*(?:むね|ムネ)/iu, "닭가슴살"],
  [/豚.*ヒレ/iu, "돼지안심"],
  [/豚.*バラ/iu, "삼겹살"],
  [/豚.*こま/iu, "돼지고기"],
  [/牛.*こま/iu, "소고기"],
  [/玉ねぎ|玉葱|タマネギ/iu, "양파"],
  [/長ねぎ|長ネギ|長葱|白ネギ/iu, "대파"],
  [/もやし|モヤシ/iu, "숙주"],
  [/にんじん|人参/iu, "당근"],
  [/キャベツ/iu, "양배추"],
  [/じゃがいも|ジャガイモ|馬鈴薯/iu, "감자"],
  [/豆腐|とうふ/iu, "두부"],
  [/たまご|玉子|卵/iu, "달걀"],
  [/パン|食パン/iu, "빵"],
  [/牛乳/iu, "우유"],
  [/キムチ/iu, "김치"],
  [/ハイボール/iu, "하이볼"],
  [/ビール/iu, "맥주"],
  [/シャンプー/iu, "샴푸"],
  [/ボディソープ|ボディウォッシュ/iu, "바디워시"],
  [/ティッシュ|トイレットペーパー/iu, "휴지"],
  [/洗剤/iu, "세제"],
  [/柔軟剤/iu, "섬유유연제"],
  [/ゴミ袋|ごみ袋/iu, "쓰레기봉투"],
];

function matchRule(value: string, rules: Array<[RegExp, string]>): string | undefined {
  return rules.find(([pattern]) => pattern.test(value))?.[1];
}

function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function simplifyTranslation(value: string): string {
  return decodeHtml(value)
    .replace(/[\[【(（].*?[\]】)）]/g, "")
    .replace(/\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|개|팩|입)\b/giu, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function translateUnknown(values: string[]): Promise<string[]> {
  if (!values.length) return [];
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) return values;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: values, source: "ja", target: "ko", format: "text" }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return values;
    const data = await response.json() as { data?: { translations?: Array<{ translatedText?: string }> } };
    const translations = data.data?.translations ?? [];
    return values.map((value, index) => simplifyTranslation(translations[index]?.translatedText || value));
  } catch {
    return values;
  } finally {
    clearTimeout(timeout);
  }
}

export async function koreanizeReceiptText(merchantName: string, items: string[]) {
  const merchantRule = matchRule(merchantName, MERCHANT_RULES);
  const itemRules = items.map((item) => matchRule(item, ITEM_RULES));
  const unknownValues = [
    ...(merchantRule ? [] : [merchantName]),
    ...items.filter((_, index) => !itemRules[index]),
  ];
  const translated = await translateUnknown(unknownValues);
  let translatedIndex = 0;
  const koreanMerchantName = merchantRule ?? simplifyTranslation(translated[translatedIndex++] ?? merchantName);
  const koreanItems = items.map((item, index) => itemRules[index] ?? simplifyTranslation(translated[translatedIndex++] ?? item));
  return {
    merchantName: koreanMerchantName,
    items: koreanItems.filter(Boolean),
  };
}
