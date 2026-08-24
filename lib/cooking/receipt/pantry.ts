import type { PantryData, ReceiptConfirmResult, StorageLocation } from "../types";

export function mergeReceiptIngredients(
  pantry: PantryData,
  ingredientIds: string[],
  storageLocation: StorageLocation = "PANTRY",
  addedAt = new Date().toISOString(),
): ReceiptConfirmResult {
  const owned = new Set(pantry.items.map((item) => item.ingredientId));
  const uniqueIds = [...new Set(ingredientIds)];
  const addedIngredientIds = uniqueIds.filter((id) => !owned.has(id));
  const alreadyOwnedIngredientIds = uniqueIds.filter((id) => owned.has(id));
  return {
    pantry: {
      ...pantry,
      items: [...pantry.items, ...addedIngredientIds.map((ingredientId) => ({ ingredientId, storageLocation, addedAt }))],
    },
    addedIngredientIds,
    alreadyOwnedIngredientIds,
  };
}
