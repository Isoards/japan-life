import ingredientsJson from "@/data/cooking-ingredients.json";
import catalogJson from "@/data/cooking-dishes.json";
import ryuSoYoungJson from "@/data/cooking-ryu-so-young.json";
import relationsJson from "@/data/cooking-relations.json";
import sourcesJson from "@/data/cooking-recipe-sources.json";
import type { Dish, DishIngredient, Importance, Ingredient, IngredientRelation, RecipeSource } from "./types";

type CatalogDish = Dish & {
  required: string[];
  important?: string[];
  optional?: string[];
  sourceVideoId?: string;
  additionalSourceVideoIds?: string[];
};

export const ingredients = ingredientsJson as Ingredient[];
const catalog = [...catalogJson, ...ryuSoYoungJson] as CatalogDish[];
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
  collection: entry.collection,
  collectionSection: entry.collectionSection,
}));
export const dishIngredients: DishIngredient[] = catalog.flatMap((dish) =>
  ([
    ...dish.required.map((ingredientId) => ({ ingredientId, importance: "REQUIRED" as Importance })),
    ...(dish.important ?? []).map((ingredientId) => ({ ingredientId, importance: "IMPORTANT" as Importance })),
    ...(dish.optional ?? []).map((ingredientId) => ({ ingredientId, importance: "OPTIONAL" as Importance })),
  ]).map((requirement) => ({ dishId: dish.id, ...requirement })),
);
export const ingredientRelations = relationsJson as IngredientRelation[];
export const recipeSources = [
  ...(sourcesJson as RecipeSource[]),
  ...catalog.flatMap((dish): RecipeSource[] => [
    ...(dish.sourceVideoId ? [dish.sourceVideoId] : []),
    ...(dish.additionalSourceVideoIds ?? []),
  ].map((videoId, index) => ({
    id: `src-${dish.id}-${index + 1}`,
    dishId: dish.id,
    sourceType: "YOUTUBE",
    title: `${dish.nameKo} 공식 방송 레시피${index ? ` ${index + 1}` : ""}`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    channelOrSite: "KBS Entertain",
  }))),
];

export const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
export const dishById = new Map(dishes.map((dish) => [dish.id, dish]));

export function getDishRequirements(dishId: string) {
  return dishIngredients.filter((requirement) => requirement.dishId === dishId);
}

export function getDishSources(dishId: string) {
  return recipeSources.filter((source) => source.dishId === dishId);
}
