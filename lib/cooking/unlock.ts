import { rankDishes } from "./recommendation";
import type { Dish, DishIngredient, Ingredient, IngredientRelation, UnlockRecommendation } from "./types";

export function calculateUnlocks(
  dishes: Dish[], ingredients: Ingredient[], requirements: DishIngredient[],
  relations: IngredientRelation[], ownedIngredientIds: Iterable<string>,
): UnlockRecommendation[] {
  const owned = new Set(ownedIngredientIds);
  const before = rankDishes(dishes, ingredients, requirements, relations, owned);
  const beforeByDish = new Map(before.map((result) => [result.dish.id, result]));

  return ingredients
    .filter((ingredient) => !owned.has(ingredient.id))
    .map((ingredient): UnlockRecommendation => {
      const after = rankDishes(dishes, ingredients, requirements, relations, [...owned, ingredient.id]);
      const unlockedDishes = after
        .filter((result) => result.canCookNow && !beforeByDish.get(result.dish.id)?.canCookNow)
        .map((result) => result.dish);
      const improvedCount = after.filter((result) =>
        result.matchPercent > (beforeByDish.get(result.dish.id)?.matchPercent ?? 0),
      ).length;
      return { ingredient, unlockCount: unlockedDishes.length, improvedCount, unlockedDishes };
    })
    .filter((result) => result.unlockCount > 0 || result.improvedCount > 0)
    .sort((a, b) => b.unlockCount - a.unlockCount || b.improvedCount - a.improvedCount || a.ingredient.nameKo.localeCompare(b.ingredient.nameKo, "ko"));
}
