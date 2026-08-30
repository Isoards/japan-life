import { readStore } from "@/lib/store";
import { dishes, dishIngredients, ingredientRelations, ingredients } from "./data";
import { rankDishes } from "./recommendation";
import { calculateUnlocks } from "./unlock";
import { getPantryFreshness } from "./freshness";
import type { CookedDishesData, CookingOverview, PantryData } from "./types";

export async function getCookingOverview(): Promise<CookingOverview> {
  const pantry = await readStore<PantryData>("cooking-pantry", { items: [] });
  const cookedDishes = await readStore<CookedDishesData>("cooking-cooked", { items: [] });
  const freshness = pantry.items.map((item) => getPantryFreshness(item));
  const available = new Set(freshness.filter((item) => item.status !== "EXPIRED").map((item) => item.ingredientId));
  const expiring = new Map(freshness
    .filter((item) => (item.status === "SOON" || item.status === "TODAY") && item.daysRemaining !== undefined)
    .map((item) => [item.ingredientId, item.daysRemaining as number]));
  return {
    ingredients,
    pantry,
    freshness,
    cookedDishes,
    recommendations: rankDishes(dishes, ingredients, dishIngredients, ingredientRelations, available, expiring),
    unlocks: calculateUnlocks(dishes, ingredients, dishIngredients, ingredientRelations, available),
  };
}
