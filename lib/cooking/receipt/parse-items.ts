import type { Ingredient, ReceiptParseResult, ReceiptParsedItem } from "../types";
import { hasFoodSignal, isKnownNonFood, isReceiptMetadataLine } from "./classify-line";
import { matchIngredient } from "./match-ingredient";
import { normalizeProductText, normalizeReceiptLine } from "./normalize-text";

export function parseReceiptItems(lines: string[], ingredients: Ingredient[]): ReceiptParseResult {
  const items: ReceiptParsedItem[] = [];
  let ignoredLineCount = 0;

  lines.forEach((rawText, lineIndex) => {
    const cleaned = normalizeReceiptLine(rawText);
    if (isReceiptMetadataLine(cleaned)) {
      ignoredLineCount += 1;
      return;
    }

    const candidates = matchIngredient(cleaned, ingredients);
    const best = candidates[0];
    const nonFood = isKnownNonFood(cleaned);
    const itemType = nonFood ? "NON_FOOD" : best || hasFoodSignal(cleaned) ? "FOOD" : "UNKNOWN";
    const confidence = nonFood ? 1 : best?.confidence ?? (itemType === "FOOD" ? 0.55 : 0);
    items.push({
      id: `line-${lineIndex}`,
      rawText,
      normalizedText: normalizeProductText(cleaned),
      itemType,
      matchedIngredientId: itemType === "FOOD" && best && best.confidence >= 0.7 ? best.ingredientId : undefined,
      candidates,
      confidence,
      selected: itemType === "FOOD" && Boolean(best && best.confidence >= 0.7),
    });
  });

  return { items, ignoredLineCount };
}
