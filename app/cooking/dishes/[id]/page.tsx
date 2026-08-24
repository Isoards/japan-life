import Link from "next/link";
import { notFound } from "next/navigation";
import CookingHeader from "@/components/cooking/CookingHeader";
import CookedButton from "@/components/cooking/CookedButton";
import CookingHistory from "@/components/cooking/CookingHistory";
import { dishById, getDishRequirements, getDishSources, ingredientById, ingredientRelations } from "@/lib/cooking/data";
import { CUISINE_LABELS, IMPORTANCE_LABELS, displayDishName } from "@/lib/cooking/names";
import { getCookingOverview } from "@/lib/cooking/service";
import type { Importance } from "@/lib/cooking/types";

export const dynamic = "force-dynamic";

export default async function DishDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = dishById.get(id);
  if (!dish) notFound();
  const overview = await getCookingOverview();
  const result = overview.recommendations.find((item) => item.dish.id === id);
  if (!result) notFound();
  const owned = new Set(overview.pantry.items.map((item) => item.ingredientId));
  const requirements = getDishRequirements(id);
  const sources = getDishSources(id);
  const cookedItems = overview.cookedDishes.items.filter((item) => item.dishId === id).sort((a, b) => b.cookedAt.localeCompare(a.cookedAt));
  const latestCooked = cookedItems[0];

  return <div className="space-y-7">
    <CookingHeader title={displayDishName(dish)} description={`${CUISINE_LABELS[dish.cuisine]} · 난이도 ${dish.difficulty === "EASY" ? "쉬움" : dish.difficulty === "MEDIUM" ? "보통" : "어려움"}`} />
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-sky-400/15 bg-sky-500/5 p-4 sm:flex-row sm:items-center"><div><p className="font-medium text-white">이 요리를 만드셨나요?</p><p className="mt-1 text-xs text-gray-500">날짜와 참고한 영상·레시피를 기록할 수 있어요.{latestCooked ? ` · 최근 ${new Date(latestCooked.cookedAt).toLocaleDateString("ko-KR")} · 총 ${cookedItems.length}회` : ""}</p></div><CookedButton dishId={dish.id} cooked={cookedItems.length > 0} sources={sources} /></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="재료 적합도" value={`${result.matchPercent}%`} /><Metric label="현재 상태" value={result.canCookNow ? "바로 가능" : `핵심 재료 ${result.missingCoreCount}개 부족`} accent={result.canCookNow} /><Metric label="조리 특성" value={[dish.onePan && "원팬", dish.soloFriendly && "1인분", dish.mealPrepFriendly && "보관 용이"].filter(Boolean).join(" · ") || "일반"} /></div>
    {(["REQUIRED", "IMPORTANT", "OPTIONAL"] as Importance[]).map((importance) => {
      const group = requirements.filter((requirement) => requirement.importance === importance);
      if (!group.length) return null;
      return <section key={importance} className="space-y-3"><h2 className="text-lg font-bold text-white">{IMPORTANCE_LABELS[importance]}</h2><div className="grid gap-2 sm:grid-cols-2">{group.map((requirement) => {
        const ingredient = ingredientById.get(requirement.ingredientId);
        if (!ingredient) return null;
        const substitution = result.matchedBySubstitution.find((item) => item.requestedIngredientId === ingredient.id);
        const substituteIngredient = substitution ? ingredientById.get(substitution.ownedIngredientId) : undefined;
        const has = owned.has(ingredient.id);
        const hints = ingredientRelations.filter((relation) => relation.fromIngredientId === ingredient.id).map((relation) => ({ ...relation, ingredient: ingredientById.get(relation.toIngredientId) })).filter((item) => item.ingredient);
        return <div key={ingredient.id} className={`rounded-xl border p-4 ${has ? "border-emerald-400/20 bg-emerald-500/10" : substitution ? "border-amber-400/20 bg-amber-500/10" : "border-white/10 bg-white/[0.03]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-white">{ingredient.nameKo}</p><p className="mt-0.5 text-sm text-gray-500">{ingredient.nameJa}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${has ? "bg-emerald-500/15 text-emerald-300" : substitution ? "bg-amber-500/15 text-amber-300" : "bg-red-500/10 text-red-300"}`}>{has ? "보유" : substitution ? "대체 가능" : "부족"}</span></div>{substituteIngredient && <p className="mt-3 text-xs text-amber-200">{substituteIngredient.nameKo} ({substituteIngredient.nameJa})로 대체 · {substitution?.noteKo}</p>}{!has && !substitution && hints.length > 0 && <div className="mt-3 space-y-1">{hints.slice(0, 2).map((hint) => <p key={hint.toIngredientId} className="text-xs text-gray-500">대체 힌트: {hint.ingredient?.nameKo} · {hint.noteKo}</p>)}</div>}{ingredient.shoppingHintJa && <p className="mt-2 text-xs text-gray-500">마트에서: {ingredient.shoppingHintJa}</p>}</div>;
      })}</div></section>;
    })}
    <section className="space-y-3"><h2 className="text-lg font-bold text-white">외부 레시피</h2>{sources.length ? <div className="grid gap-2 sm:grid-cols-2">{sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300 hover:border-orange-400/30 hover:text-orange-200"><span className="mr-2">{source.sourceType === "YOUTUBE" ? "▶" : "↗"}</span>{source.title}<p className="mt-1 text-xs text-gray-600">{source.channelOrSite}</p></a>)}</div> : <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${dish.nameLocal || dish.nameKo} 레시피`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20">YouTube에서 레시피 검색 ↗</a>}</section>
    <CookingHistory items={cookedItems} />
    <Link href="/cooking/discover" className="inline-flex text-sm text-orange-300 hover:text-orange-200">← 요리 목록으로</Link>
  </div>;
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-gray-500">{label}</p><p className={`mt-1 font-semibold ${accent ? "text-emerald-300" : "text-white"}`}>{value}</p></div>; }
