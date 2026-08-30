import type { PantryData, ReceiptConfirmResult } from "../types";
import { defaultStorageLocation } from "../freshness";

export function mergeReceiptIngredients(
  pantry: PantryData,
  ingredientIds: string[],
  addedAt = new Date().toISOString(),
): ReceiptConfirmResult {
  const owned = new Set(pantry.items.map((item) => item.ingredientId));
  const uniqueIds = [...new Set(ingredientIds)];
  const addedIngredientIds = uniqueIds.filter((id) => !owned.has(id));
  const alreadyOwnedIngredientIds = uniqueIds.filter((id) => owned.has(id));
  return {
    pantry: {
      ...pantry,
      items: [...pantry.items, ...addedIngredientIds.map((ingredientId) => ({ ingredientId, storageLocation: defaultStorageLocation(ingredientId), addedAt }))],
    },
    addedIngredientIds,
    alreadyOwnedIngredientIds,
  };
}
