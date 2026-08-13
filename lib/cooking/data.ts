import ingredientsJson from "@/data/cooking-ingredients.json";
import catalogJson from "@/data/cooking-dishes.json";
import relationsJson from "@/data/cooking-relations.json";
import sourcesJson from "@/data/cooking-recipe-sources.json";
import type { Dish, DishIngredient, Importance, Ingredient, IngredientRelation, RecipeSource } from "./types";

type CatalogDish = Dish & { required: string[]; important?: string[]; optional?: string[] };

export const ingredients = ingredientsJson as Ingredient[];
const catalog = catalogJson as CatalogDish[];
export const dishes: Dish[] = catalog.map((entry) => ({
  id: entry.id,
  slug: entry.slug,
  cuisine: entry.cuisine,
  nameKo: entry.nameKo,
  nameLocal: entry.nameLocal,
  difficulty: entry.difficulty,
  onePan: entry.onePan,
  mealPrepFriendly: entry.mealPrepFriendly,
  soloFriendly: entry.soloFriendly,
  tags: entry.tags,
}));
export const dishIngredients: DishIngredient[] = catalog.flatMap((dish) =>
  ([
    ...dish.required.map((ingredientId) => ({ ingredientId, importance: "REQUIRED" as Importance })),
    ...(dish.important ?? []).map((ingredientId) => ({ ingredientId, importance: "IMPORTANT" as Importance })),
    ...(dish.optional ?? []).map((ingredientId) => ({ ingredientId, importance: "OPTIONAL" as Importance })),
  ]).map((requirement) => ({ dishId: dish.id, ...requirement })),
);
export const ingredientRelations = relationsJson as IngredientRelation[];
export const recipeSources = sourcesJson as RecipeSource[];

export const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
export const dishById = new Map(dishes.map((dish) => [dish.id, dish]));

export function getDishRequirements(dishId: string) {
  return dishIngredients.filter((requirement) => requirement.dishId === dishId);
}

export function getDishSources(dishId: string) {
  return recipeSources.filter((source) => source.dishId === dishId);
}
