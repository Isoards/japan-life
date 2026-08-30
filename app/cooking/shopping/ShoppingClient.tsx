"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CookingHeader from "@/components/cooking/CookingHeader";
import { dateKeyInTokyo } from "@/lib/cooking/freshness";
import { getWeekDates, getWeekStart } from "@/lib/cooking/meal-plan";
import { displayDishName } from "@/lib/cooking/names";
import { useCookingOverview, useMealPlan } from "@/lib/hooks/use-api";

export default function ShoppingClient() {
  const { data, isLoading } = useCookingOverview();
  const { data: mealPlan } = useMealPlan();
  const [expanded, setExpanded] = useState<string | null>(null);
  const plannedShopping = useMemo(() => {
    if (!data) return [];
    const weekDates = new Set(getWeekDates(getWeekStart(dateKeyInTokyo())));
    const recommendationByDish = new Map(data.recommendations.map((result) => [result.dish.id, result]));
    const grouped = new Map<string, { ingredient: (typeof data.ingredients)[number]; dishes: string[] }>();
    for (const planItem of mealPlan?.items ?? []) {
      if (!weekDates.has(planItem.date)) continue;
      const result = recommendationByDish.get(planItem.dishId);
      if (!result) continue;
      for (const ingredient of [...result.missingRequired, ...result.missingImportant]) {
        const current = grouped.get(ingredient.id) ?? { ingredient, dishes: [] };
        const dishName = displayDishName(result.dish);
        if (!current.dishes.includes(dishName)) current.dishes.push(dishName);
        grouped.set(ingredient.id, current);
      }
    }
    return [...grouped.values()].sort((a, b) => b.dishes.length - a.dishes.length || a.ingredient.nameKo.localeCompare(b.ingredient.nameKo, "ko"));
  }, [data, mealPlan]);

  return <div className="space-y-7">
    <CookingHeader title="효율적인 장보기" description="이번 주 식단에 필요한 재료와, 하나만 사도 만들 수 있는 요리가 늘어나는 재료를 모았습니다." />
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">이번 주 식단 장보기</h2><Link href="/cooking/planner" className="text-sm text-orange-300">식단 수정 →</Link></div>
      {plannedShopping.length ? <div className="grid gap-2 sm:grid-cols-2">{plannedShopping.map((item) => <div key={item.ingredient.id} className="rounded-xl border border-amber-400/15 bg-amber-500/[0.07] p-4"><p className="font-semibold text-white">{item.ingredient.nameKo} <span className="ml-1 font-normal text-gray-500">{item.ingredient.nameJa}</span></p><p className="mt-1 text-xs text-amber-200">{item.dishes.join(", ")}에 필요</p>{item.ingredient.shoppingHintJa && <p className="mt-2 text-xs text-gray-500">마트에서: {item.ingredient.shoppingHintJa}</p>}</div>)}</div> : <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">이번 주 식단을 채우면 부족한 핵심 재료를 자동으로 모아드려요.</div>}
    </section>
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-white">활용도가 높은 다음 재료</h2>
      {isLoading ? <p className="py-16 text-center text-gray-500">장보기 효과를 계산하는 중...</p> : data?.unlocks.length ? <div className="space-y-3">{data.unlocks.slice(0, 20).map((item, index) => <div key={item.ingredient.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"><button onClick={() => setExpanded(expanded === item.ingredient.id ? null : item.ingredient.id)} className="flex w-full cursor-pointer items-center gap-4 p-4 text-left hover:bg-white/[0.03]"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${index < 3 ? "bg-orange-400 text-black" : "bg-white/10 text-gray-400"}`}>{index + 1}</span><div className="min-w-0 flex-1"><p className="font-semibold text-white">{item.ingredient.nameKo} <span className="ml-1 font-normal text-gray-500">{item.ingredient.nameJa}</span></p><p className="mt-1 text-xs text-gray-500">관련 요리 {item.improvedCount}개의 적합도도 올라가요</p></div><div className="shrink-0 text-right"><p className="text-lg font-bold text-emerald-300">+{item.unlockCount}</p><p className="text-[10px] text-gray-500">새 요리</p></div><span className="text-gray-600">{expanded === item.ingredient.id ? "↑" : "↓"}</span></button>{expanded === item.ingredient.id && <div className="border-t border-white/5 bg-black/20 px-5 py-4"><p className="mb-3 text-xs font-medium text-gray-500">새롭게 만들 수 있는 요리 · 눌러서 상세 보기</p><div className="flex flex-wrap gap-2">{item.unlockedDishes.map((dish) => <Link key={dish.id} href={`/cooking/dishes/${dish.id}`} className="rounded-full border border-emerald-400/10 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-500/20">{displayDishName(dish)} →</Link>)}</div></div>}</div>)}</div> : <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-gray-500">Pantry에 재료를 등록하면 구매 효과를 계산해 드려요.</p>}
    </section>
  </div>;
}
