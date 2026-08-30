import type { Cuisine, Dish, IngredientCategory, Importance, RecipeCollectionSection, StorageLocation } from "./types";

export const CUISINE_LABELS: Record<Cuisine, string> = {
  KOREAN: "한식", JAPANESE: "일식", CHINESE: "중식", WESTERN: "양식", OTHER: "기타",
};

export const COLLECTION_SECTION_LABELS: Record<RecipeCollectionSection, string> = {
  SPECIAL: "평생 특식",
  RICE: "평생 밥",
  NOODLE: "평생 면",
  SOUP: "평생 국·탕·찌개",
  SNACK: "평생 간식",
};

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  MEAT: "육류", SEAFOOD: "해산물", VEGETABLE: "채소", FRUIT: "과일",
  EGG_DAIRY: "달걀·유제품", GRAIN_NOODLE: "곡물·면", SEASONING: "조미료",
  SAUCE: "소스", OTHER: "기타",
};

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  REQUIRED: "필수 재료", IMPORTANT: "중요 재료", OPTIONAL: "선택 재료",
};

export const STORAGE_LABELS: Record<StorageLocation, string> = {
  PANTRY: "실온", FRIDGE: "냉장", FREEZER: "냉동",
};

export function displayDishName(dish: Pick<Dish, "nameKo" | "nameLocal">) {
  return dish.nameLocal ? `${dish.nameKo} (${dish.nameLocal})` : dish.nameKo;
}
