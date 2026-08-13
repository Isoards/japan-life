"use client";

import { useState } from "react";
import Link from "next/link";
import CookingHeader from "@/components/cooking/CookingHeader";
import { displayDishName } from "@/lib/cooking/names";
import { useCookingOverview } from "@/lib/hooks/use-api";

export default function ShoppingClient() {
  const { data, isLoading } = useCookingOverview();
  const [expanded, setExpanded] = useState<string | null>(null);
  return <div className="space-y-7"><CookingHeader title="효율적인 장보기" description="재료 하나를 추가했을 때 새롭게 만들 수 있게 되는 요리가 많은 순서예요. 가격 대신 활용도를 기준으로 계산합니다." />
    {isLoading ? <p className="py-16 text-center text-gray-500">장보기 효과를 계산하는 중...</p> : data?.unlocks.length ? <div className="space-y-3">{data.unlocks.slice(0, 20).map((item, index) => <div key={item.ingredient.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"><button onClick={() => setExpanded(expanded === item.ingredient.id ? null : item.ingredient.id)} className="flex w-full cursor-pointer items-center gap-4 p-4 text-left hover:bg-white/[0.03]"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${index < 3 ? "bg-orange-400 text-black" : "bg-white/10 text-gray-400"}`}>{index + 1}</span><div className="min-w-0 flex-1"><p className="font-semibold text-white">{item.ingredient.nameKo} <span className="ml-1 font-normal text-gray-500">{item.ingredient.nameJa}</span></p><p className="mt-1 text-xs text-gray-500">관련 요리 {item.improvedCount}개의 적합도도 올라가요</p></div><div className="shrink-0 text-right"><p className="text-lg font-bold text-emerald-300">+{item.unlockCount}</p><p className="text-[10px] text-gray-500">새 요리</p></div><span className="text-gray-600">{expanded === item.ingredient.id ? "↑" : "↓"}</span></button>{expanded === item.ingredient.id && <div className="border-t border-white/5 bg-black/20 px-5 py-4"><p className="mb-3 text-xs font-medium text-gray-500">새롭게 만들 수 있는 요리 · 눌러서 상세 보기</p><div className="flex flex-wrap gap-2">{item.unlockedDishes.map((dish) => <Link key={dish.id} href={`/cooking/dishes/${dish.id}`} className="rounded-full border border-emerald-400/10 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-500/20">{displayDishName(dish)} →</Link>)}</div></div>}</div>)}</div> : <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-gray-500">Pantry에 재료를 등록하면 구매 효과를 계산해 드려요.</p>}
  </div>;
}
