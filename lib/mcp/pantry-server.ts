import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { defaultStorageLocation } from "@/lib/cooking/freshness";
import { getCookingOverview } from "@/lib/cooking/service";

const freshnessSchema = z.object({
  status: z.enum(["NONE", "FRESH", "SOON", "TODAY", "EXPIRED", "FROZEN"]),
  daysRemaining: z.number().optional(),
  recommendedUseBy: z.string().optional(),
});

const pantryIngredientSchema = z.object({
  id: z.string(),
  nameKo: z.string(),
  nameJa: z.string().optional(),
  category: z.string(),
  storageLocation: z.enum(["PANTRY", "FRIDGE", "FREEZER"]),
  addedAt: z.string(),
  availableForCooking: z.boolean(),
  freshness: freshnessSchema,
});

export function createPantryMcpServer() {
  const server = new McpServer(
    { name: "japan-life-pantry", version: "1.0.0" },
    {
      instructions: "Use get_pantry whenever the user asks what to cook from ingredients they own. Treat EXPIRED items as unavailable, remember that quantities are not tracked, and ask about allergies when relevant. Use get_cooking_recommendations for ranked menu ideas and get_shopping_suggestions when one extra purchase is acceptable.",
    },
  );

  server.registerTool(
    "get_pantry",
    {
      title: "Get current Pantry",
      description: "Read the user's current Japan Life Pantry with Korean and Japanese ingredient names, storage location, and freshness. Use this before suggesting recipes based on ingredients at home.",
      inputSchema: {},
      outputSchema: {
        quantityTracked: z.boolean(),
        ingredients: z.array(pantryIngredientSchema),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const overview = await getCookingOverview();
      const ingredientById = new Map(overview.ingredients.map((ingredient) => [ingredient.id, ingredient]));
      const freshnessById = new Map(overview.freshness.map((item) => [item.ingredientId, item]));
      const pantryIngredients = overview.pantry.items.flatMap((item) => {
        const ingredient = ingredientById.get(item.ingredientId);
        const freshness = freshnessById.get(item.ingredientId);
        if (!ingredient || !freshness) return [];
        return [{
          id: ingredient.id,
          nameKo: ingredient.nameKo,
          ...(ingredient.nameJa ? { nameJa: ingredient.nameJa } : {}),
          category: ingredient.category,
          storageLocation: item.storageLocation ?? defaultStorageLocation(item.ingredientId),
          addedAt: item.addedAt,
          availableForCooking: freshness.status !== "EXPIRED",
          freshness: {
            status: freshness.status,
            ...(freshness.daysRemaining !== undefined ? { daysRemaining: freshness.daysRemaining } : {}),
            ...(freshness.recommendedUseBy ? { recommendedUseBy: freshness.recommendedUseBy } : {}),
          },
        }];
      });
      const structuredContent = { quantityTracked: false, ingredients: pantryIngredients };
      return {
        structuredContent,
        content: [{ type: "text", text: `Pantry에서 ${pantryIngredients.length}개 재료를 확인했습니다. 수량은 저장되지 않으며 EXPIRED 재료는 사용 가능한 것으로 보지 마세요.` }],
      };
    },
  );

  server.registerTool(
    "get_cooking_recommendations",
    {
      title: "Get cooking recommendations",
      description: "Get dishes ranked by the deterministic Japan Life recommendation engine, including missing and expiring ingredients. Use after or alongside get_pantry when the user wants menu ideas.",
      inputSchema: {
        filter: z.enum(["cook_now", "one_away", "expiring", "all"]).default("cook_now"),
        limit: z.number().int().min(1).max(10).default(5),
      },
      outputSchema: {
        recommendations: z.array(z.object({
          id: z.string(),
          nameKo: z.string(),
          nameLocal: z.string().optional(),
          cuisine: z.string(),
          canCookNow: z.boolean(),
          matchPercent: z.number(),
          missingCoreCount: z.number(),
          missingRequired: z.array(z.string()),
          missingImportant: z.array(z.string()),
          expiringIngredients: z.array(z.object({ nameKo: z.string(), daysRemaining: z.number() })),
        })),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ filter, limit }) => {
      const overview = await getCookingOverview();
      const filtered = overview.recommendations.filter((item) => {
        if (filter === "cook_now") return item.canCookNow;
        if (filter === "one_away") return item.missingCoreCount === 1;
        if (filter === "expiring") return item.expiringIngredients.length > 0;
        return true;
      }).slice(0, limit);
      const recommendations = filtered.map((item) => ({
        id: item.dish.id,
        nameKo: item.dish.nameKo,
        ...(item.dish.nameLocal ? { nameLocal: item.dish.nameLocal } : {}),
        cuisine: item.dish.cuisine,
        canCookNow: item.canCookNow,
        matchPercent: item.matchPercent,
        missingCoreCount: item.missingCoreCount,
        missingRequired: item.missingRequired.map((ingredient) => ingredient.nameKo),
        missingImportant: item.missingImportant.map((ingredient) => ingredient.nameKo),
        expiringIngredients: item.expiringIngredients.map((entry) => ({ nameKo: entry.ingredient.nameKo, daysRemaining: entry.daysRemaining })),
      }));
      return {
        structuredContent: { recommendations },
        content: [{ type: "text", text: `현재 Pantry 기준 추천 요리 ${recommendations.length}개를 찾았습니다.` }],
      };
    },
  );

  server.registerTool(
    "get_shopping_suggestions",
    {
      title: "Get high-impact shopping suggestions",
      description: "Find ingredients not currently owned that would unlock the most additional dishes. Use when the user is willing to buy one or a few ingredients.",
      inputSchema: { limit: z.number().int().min(1).max(10).default(5) },
      outputSchema: {
        suggestions: z.array(z.object({
          ingredientId: z.string(),
          nameKo: z.string(),
          nameJa: z.string().optional(),
          unlockCount: z.number(),
          improvedCount: z.number(),
          unlockedDishes: z.array(z.string()),
        })),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ limit }) => {
      const overview = await getCookingOverview();
      const suggestions = overview.unlocks.slice(0, limit).map((item) => ({
        ingredientId: item.ingredient.id,
        nameKo: item.ingredient.nameKo,
        ...(item.ingredient.nameJa ? { nameJa: item.ingredient.nameJa } : {}),
        unlockCount: item.unlockCount,
        improvedCount: item.improvedCount,
        unlockedDishes: item.unlockedDishes.map((dish) => dish.nameKo),
      }));
      return {
        structuredContent: { suggestions },
        content: [{ type: "text", text: `구매 효과가 높은 재료 ${suggestions.length}개를 계산했습니다.` }],
      };
    },
  );

  return server;
}
