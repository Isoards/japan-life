import type { Ingredient, PantryFreshness, PantryItem, StorageLocation } from "./types";

/** 보수적인 냉장 권장 보관일. 제품 포장에 적힌 날짜가 항상 우선이다. */
export const REFRIGERATED_DAYS: Record<string, number> = {
  egg: 21,
  tofu: 3,
  "soft-tofu": 3,
  milk: 5,
  "heavy-cream": 4,
  "chicken-thigh": 2,
  "whole-chicken": 2,
  "chicken-breast": 2,
  "ground-chicken": 2,
  "thin-pork": 3,
  "pork-belly": 3,
  "pork-ribs": 3,
  "pork-backbone": 3,
  "ground-pork": 2,
  "pork-loin": 3,
  "thin-beef": 3,
  "beef-brisket": 3,
  "yukhoe-beef": 1,
  "ground-beef": 2,
  mackerel: 2,
  salmon: 2,
  shrimp: 2,
  squid: 2,
  crab: 2,
  mussel: 1,
  oyster: 1,
  abalone: 2,
  cod: 2,
  clam: 1,
  "bean-sprout": 2,
  "soy-sprout": 2,
  spinach: 3,
  komatsuna: 3,
  mizuna: 3,
  "bok-choy": 4,
  lettuce: 4,
  chives: 4,
  mitsuba: 3,
  perilla: 4,
  mushroom: 5,
  shiitake: 5,
  enoki: 5,
  shimeji: 5,
  maitake: 5,
};

const FROZEN_INGREDIENT_IDS = new Set(["frozen-vegetables", "seafood-mix", "frozen-edamame"]);
const FREEZABLE_FRESH_IDS = new Set([
  "chicken-thigh", "whole-chicken", "chicken-breast", "ground-chicken",
  "thin-pork", "pork-belly", "pork-ribs", "pork-backbone", "ground-pork", "pork-loin",
  "thin-beef", "beef-brisket", "yukhoe-beef", "ground-beef",
  "mackerel", "salmon", "shrimp", "squid", "crab", "mussel", "oyster", "abalone", "cod", "clam",
]);

export function defaultStorageLocation(ingredientId: string): StorageLocation {
  if (FROZEN_INGREDIENT_IDS.has(ingredientId)) return "FREEZER";
  if (REFRIGERATED_DAYS[ingredientId]) return "FRIDGE";
  return "PANTRY";
}

export function effectiveStorageLocation(item: PantryItem): StorageLocation {
  return item.storageLocation === "FREEZER" ? "FREEZER" : defaultStorageLocation(item.ingredientId);
}

export function dateKeyInTokyo(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDateKeyDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function differenceInDateKeys(later: string, earlier: string): number {
  return Math.round((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / 86_400_000);
}

export function getPantryFreshness(item: PantryItem, today = dateKeyInTokyo()): PantryFreshness {
  const days = REFRIGERATED_DAYS[item.ingredientId];
  if (!days) return { ingredientId: item.ingredientId, status: "NONE" };
  if (effectiveStorageLocation(item) === "FREEZER") return { ingredientId: item.ingredientId, status: "FROZEN" };

  const registeredOn = dateKeyInTokyo(new Date(item.addedAt));
  const recommendedUseBy = addDateKeyDays(registeredOn, days);
  const daysRemaining = differenceInDateKeys(recommendedUseBy, today);
  const status = daysRemaining < 0 ? "EXPIRED" : daysRemaining === 0 ? "TODAY" : daysRemaining <= 2 ? "SOON" : "FRESH";
  return { ingredientId: item.ingredientId, status, daysRemaining, recommendedUseBy };
}

export function getFreshnessLabel(freshness: PantryFreshness): string | null {
  if (freshness.status === "FROZEN") return "냉동 보관 중";
  if (freshness.status === "NONE" || freshness.daysRemaining === undefined) return null;
  if (freshness.daysRemaining < 0) return `${Math.abs(freshness.daysRemaining)}일 지남 · 확인 필요`;
  if (freshness.daysRemaining === 0) return "오늘 사용 추천";
  return `D-${freshness.daysRemaining} · ${freshness.recommendedUseBy?.slice(5).replace("-", "/")}까지 사용 추천`;
}

export function isFreshIngredient(ingredient: Ingredient): boolean {
  return Boolean(REFRIGERATED_DAYS[ingredient.id]);
}

export function isFreezableIngredient(ingredientId: string): boolean {
  return FREEZABLE_FRESH_IDS.has(ingredientId);
}
