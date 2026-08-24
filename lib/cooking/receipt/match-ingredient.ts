import type { Ingredient, ReceiptIngredientCandidate } from "../types";
import { normalizeForMatch, normalizeProductText } from "./normalize-text";

type AliasKind = "receipt" | "name" | "alias";
type AliasEntry = { ingredientId: string; value: string; kind: AliasKind };

function aliasesFor(ingredients: Ingredient[]): AliasEntry[] {
  return ingredients.flatMap((ingredient) => [
    ...(ingredient.receiptAliasesJa ?? []).map((value) => ({ ingredientId: ingredient.id, value, kind: "receipt" as const })),
    ...(ingredient.nameJa ? [{ ingredientId: ingredient.id, value: ingredient.nameJa, kind: "name" as const }] : []),
    ...(ingredient.aliasesJa ?? []).map((value) => ({ ingredientId: ingredient.id, value, kind: "alias" as const })),
  ]);
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function addCandidate(map: Map<string, ReceiptIngredientCandidate>, candidate: ReceiptIngredientCandidate) {
  const existing = map.get(candidate.ingredientId);
  if (!existing || candidate.confidence > existing.confidence) map.set(candidate.ingredientId, candidate);
}

export function matchIngredient(rawText: string, ingredients: Ingredient[]): ReceiptIngredientCandidate[] {
  const product = normalizeProductText(rawText);
  const normalized = normalizeForMatch(product);
  if (!normalized) return [];

  const candidates = new Map<string, ReceiptIngredientCandidate>();
  for (const alias of aliasesFor(ingredients)) {
    const normalizedAlias = normalizeForMatch(alias.value);
    if (!normalizedAlias) continue;
    if (normalized === normalizedAlias) {
      const confidence = alias.kind === "receipt" ? 1 : alias.kind === "name" ? 0.98 : 0.95;
      addCandidate(candidates, { ingredientId: alias.ingredientId, confidence, reason: "일본어 표기가 정확히 일치" });
      continue;
    }

    const shortest = Math.min(normalized.length, normalizedAlias.length);
    if (shortest >= 2 && (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized))) {
      const coverage = shortest / Math.max(normalized.length, normalizedAlias.length);
      addCandidate(candidates, {
        ingredientId: alias.ingredientId,
        confidence: Math.min(0.89, 0.78 + coverage * 0.11),
        reason: "상품명 안의 핵심 재료명이 일치",
      });
      continue;
    }

    if (shortest >= 3 && Math.max(normalized.length, normalizedAlias.length) <= 16) {
      const similarity = 1 - editDistance(normalized, normalizedAlias) / Math.max(normalized.length, normalizedAlias.length);
      if (similarity >= 0.62) {
        addCandidate(candidates, {
          ingredientId: alias.ingredientId,
          confidence: Math.min(0.74, 0.52 + similarity * 0.28),
          reason: "OCR 오타를 고려한 유사 표기",
        });
      }
    }
  }

  return [...candidates.values()]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 5);
}
