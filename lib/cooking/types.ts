export const INGREDIENT_CATEGORIES = [
  "MEAT", "SEAFOOD", "VEGETABLE", "FRUIT", "EGG_DAIRY",
  "GRAIN_NOODLE", "SEASONING", "SAUCE", "OTHER",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];
export type Cuisine = "KOREAN" | "JAPANESE" | "CHINESE" | "WESTERN" | "OTHER";
export type Importance = "REQUIRED" | "IMPORTANT" | "OPTIONAL";
export type StorageLocation = "PANTRY" | "FRIDGE" | "FREEZER";

export interface Ingredient {
  id: string;
  slug: string;
  category: IngredientCategory;
  nameKo: string;
  nameJa?: string;
  aliasesKo?: string[];
  aliasesJa?: string[];
  /** 일본 마트 영수증에서 자주 쓰이는 축약명·표기 변형 */
  receiptAliasesJa?: string[];
  shoppingHintJa?: string;
}

export interface ReceiptOcrLine {
  rawText: string;
  normalizedText: string;
  lineIndex: number;
}

export type ReceiptItemType = "FOOD" | "NON_FOOD" | "UNKNOWN";

export interface ReceiptIngredientCandidate {
  ingredientId: string;
  confidence: number;
  reason?: string;
}

export interface ReceiptParsedItem {
  id: string;
  rawText: string;
  normalizedText: string;
  itemType: ReceiptItemType;
  matchedIngredientId?: string;
  candidates: ReceiptIngredientCandidate[];
  confidence: number;
  selected: boolean;
}

export interface ReceiptParseResult {
  items: ReceiptParsedItem[];
  ignoredLineCount: number;
}

export interface ReceiptConfirmResult {
  pantry: PantryData;
  addedIngredientIds: string[];
  alreadyOwnedIngredientIds: string[];
}

export interface IngredientRelation {
  fromIngredientId: string;
  toIngredientId: string;
  type: "EQUIVALENT" | "SUBSTITUTE" | "SIMILAR";
  quality: "GOOD" | "ACCEPTABLE" | "POOR";
  noteKo?: string;
}

export interface Dish {
  id: string;
  slug: string;
  cuisine: Cuisine;
  nameKo: string;
  nameLocal?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  onePan?: boolean;
  mealPrepFriendly?: boolean;
  soloFriendly?: boolean;
  tags?: string[];
}

export interface DishIngredient {
  dishId: string;
  ingredientId: string;
  importance: Importance;
}

export interface RecipeSource {
  id: string;
  dishId: string;
  sourceType: "YOUTUBE" | "WEB";
  title: string;
  url: string;
  channelOrSite?: string;
}

export interface PantryItem {
  ingredientId: string;
  storageLocation: StorageLocation;
  addedAt: string;
}

export interface PantryData {
  __version?: number;
  items: PantryItem[];
}

export interface CookedDishItem {
  id: string;
  dishId: string;
  cookedAt: string;
  sourceTitle?: string;
  sourceUrl?: string;
  note?: string;
}

export interface CookedDishesData {
  __version?: number;
  items: CookedDishItem[];
}

export interface SubstitutionMatch {
  requestedIngredientId: string;
  ownedIngredientId: string;
  quality: IngredientRelation["quality"];
  noteKo?: string;
}

export interface DishRecommendation {
  dish: Dish;
  canCookNow: boolean;
  missingCoreCount: number;
  matchPercent: number;
  missingRequired: Ingredient[];
  missingImportant: Ingredient[];
  missingOptional: Ingredient[];
  matchedBySubstitution: SubstitutionMatch[];
  requirements: DishIngredient[];
}

export interface UnlockRecommendation {
  ingredient: Ingredient;
  unlockCount: number;
  improvedCount: number;
  unlockedDishes: Dish[];
}

export interface CookingOverview {
  ingredients: Ingredient[];
  pantry: PantryData;
  cookedDishes: CookedDishesData;
  recommendations: DishRecommendation[];
  unlocks: UnlockRecommendation[];
}
