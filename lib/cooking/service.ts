import { readStore } from "@/lib/store";
import { dishes, dishIngredients, ingredientRelations, ingredients } from "./data";
import { rankDishes } from "./recommendation";
import { calculateUnlocks } from "./unlock";
import type { CookedDishesData, CookingOverview, PantryData } from "./types";

export async function getCookingOverview(): Promise<CookingOverview> {
  const pantry = await readStore<PantryData>("cooking-pantry", { items: [] });
  const cookedDishes = await readStore<CookedDishesData>("cooking-cooked", { items: [] });
  const owned = pantry.items.map((item) => item.ingredientId);
  return {
    ingredients,
    pantry,
    cookedDishes,
    recommendations: rankDishes(dishes, ingredients, dishIngredients, ingredientRelations, owned),
    unlocks: calculateUnlocks(dishes, ingredients, dishIngredients, ingredientRelations, owned),
  };
}
