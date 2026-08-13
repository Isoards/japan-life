import type { Dish, DishIngredient, DishRecommendation, Ingredient, IngredientRelation, SubstitutionMatch } from "./types";

const WEIGHTS = { REQUIRED: 6, IMPORTANT: 3, OPTIONAL: 1 } as const;
const SUBSTITUTION_CREDIT = { GOOD: 1, ACCEPTABLE: 0.7, POOR: 0.35 } as const;

export function rankDishes(
  dishes: Dish[],
  ingredients: Ingredient[],
  requirements: DishIngredient[],
  relations: IngredientRelation[],
  ownedIngredientIds: Iterable<string>,
): DishRecommendation[] {
  const owned = new Set(ownedIngredientIds);
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  const results = dishes.map((dish): DishRecommendation => {
    const dishRequirements = requirements.filter((requirement) => requirement.dishId === dish.id);
    const missing = { REQUIRED: [] as Ingredient[], IMPORTANT: [] as Ingredient[], OPTIONAL: [] as Ingredient[] };
    const matchedBySubstitution: SubstitutionMatch[] = [];
    let earned = 0;
    let possible = 0;

    for (const requirement of dishRequirements) {
      const weight = WEIGHTS[requirement.importance];
      possible += weight;
      if (owned.has(requirement.ingredientId)) {
        earned += weight;
        continue;
      }

      const relation = relations.find((candidate) =>
        candidate.fromIngredientId === requirement.ingredientId && owned.has(candidate.toIngredientId),
      );
      if (relation) {
        earned += weight * SUBSTITUTION_CREDIT[relation.quality];
        matchedBySubstitution.push({
          requestedIngredientId: requirement.ingredientId,
          ownedIngredientId: relation.toIngredientId,
          quality: relation.quality,
          noteKo: relation.noteKo,
        });
        if (relation.quality === "GOOD") continue;
      }

      const ingredient = ingredientMap.get(requirement.ingredientId);
      if (ingredient) missing[requirement.importance].push(ingredient);
    }

    const missingCoreCount = missing.REQUIRED.length + missing.IMPORTANT.length;

    return {
      dish,
      canCookNow: missingCoreCount === 0,
      missingCoreCount,
      matchPercent: possible === 0 ? 100 : Math.round((earned / possible) * 100),
      missingRequired: missing.REQUIRED,
      missingImportant: missing.IMPORTANT,
      missingOptional: missing.OPTIONAL,
      matchedBySubstitution,
      requirements: dishRequirements,
    };
  });

  return results.sort((a, b) =>
    Number(b.canCookNow) - Number(a.canCookNow)
    || b.matchPercent - a.matchPercent
    || a.missingImportant.length - b.missingImportant.length
    || a.dish.nameKo.localeCompare(b.dish.nameKo, "ko"),
  );
}
