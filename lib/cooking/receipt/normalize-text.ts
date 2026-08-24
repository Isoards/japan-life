const LEADING_MARKER = /^[\s・●■□◆◇※*+\-ー]+/;
const TRAILING_TAX_MARKER = /\s*[※*＊](?:軽|税)?\s*$/u;
const TRAILING_PRICE = /(?:\s|^)[¥￥]?\d{1,3}(?:,\d{3})*(?:円)?(?:\s*[※*＊])?\s*$/u;
const TRAILING_QUANTITY = /\s+(?:\d+(?:\.\d+)?\s*(?:g|kg|ml|l|個|本|枚|袋|パック|入)|[x×]\s*\d+)\s*$/iu;

/** OCR 표시용 정리. 의미 있는 일본어 문자는 보존한다. */
export function normalizeReceiptLine(value: string): string {
  let text = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ");
  text = text.replace(LEADING_MARKER, "").replace(/\s+/g, " ").trim();
  text = text.replace(TRAILING_TAX_MARKER, "").trim();
  for (let index = 0; index < 2; index += 1) {
    text = text.replace(TRAILING_PRICE, "").replace(TRAILING_QUANTITY, "").trim();
  }
  return text;
}

/** 비교용 정규화. 가타카나를 히라가나로 맞추고 구두점·공백을 제거한다. */
export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .replace(/[\s\-ー_・.,，。()（）\[\]【】「」『』/\\'"`]/g, "");
}

const BRAND_PREFIXES = /^(?:cgc|topvalu|トップバリュ|セブンプレミアム|ローソンセレクト|ファミマル|co-?op|コープ|くらしモア)\s*/iu;
const ORIGIN_PREFIXES = /^(?:(?:国産|国内産|北海道産|青森県産|千葉県産|茨城県産|栃木県産|群馬県産|埼玉県産|長野県産|九州産|韓国産|中国産)\s*)+/u;
const PRODUCT_ADJECTIVES = /^(?:新鮮|新物|特選|徳用|お徳用|大容量|無添加|有機|オーガニック)\s*/u;
const PACKAGE_SUFFIX = /\s*\d+(?:\.\d+)?\s*(?:g|kg|ml|l|個|本|枚|袋|パック|入)(?:\s*[x×]\s*\d+)?\s*$/iu;

export function normalizeProductText(value: string): string {
  let text = normalizeReceiptLine(value);
  for (let index = 0; index < 3; index += 1) {
    text = text.replace(BRAND_PREFIXES, "").replace(ORIGIN_PREFIXES, "").replace(PRODUCT_ADJECTIVES, "").trim();
  }
  return text.replace(PACKAGE_SUFFIX, "").trim();
}
