"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CookingHeader from "@/components/cooking/CookingHeader";
import DishCard from "@/components/cooking/DishCard";
import { CUISINE_LABELS } from "@/lib/cooking/names";
import type { Cuisine } from "@/lib/cooking/types";
import { useCookingOverview } from "@/lib/hooks/use-api";

type Availability = "ALL" | "NOW" | "ONE" | "COOKED";
const cuisines: (Cuisine | "ALL")[] = ["ALL", "KOREAN", "JAPANESE", "CHINESE", "WESTERN", "OTHER"];

export default function DiscoverClient() {
  const params = useSearchParams();
  const { data, isLoading } = useCookingOverview();
  const [cuisine, setCuisine] = useState<Cuisine | "ALL">("ALL");
  const [availability, setAvailability] = useState<Availability>(() => params.get("filter") === "now" ? "NOW" : params.get("filter") === "one" ? "ONE" : params.get("filter") === "cooked" ? "COOKED" : "ALL");
  const cookedIds = useMemo(() => new Set(data?.cookedDishes.items.map((item) => item.dishId) ?? []), [data]);
  const results = useMemo(
    () => (data?.recommendations ?? [])
      .filter((result) =>
        (cuisine === "ALL" || result.dish.cuisine === cuisine)
        && (availability === "ALL"
          || (availability === "NOW" && result.canCookNow)
          || (availability === "ONE" && result.missingCoreCount === 1)
          || (availability === "COOKED" && cookedIds.has(result.dish.id))),
      )
      .sort((a, b) =>
        a.missingCoreCount - b.missingCoreCount
        || b.matchPercent - a.matchPercent
        || a.dish.nameKo.localeCompare(b.dish.nameKo, "ko"),
      ),
    [data, cuisine, availability, cookedIds],
  );
  return <div className="space-y-7"><CookingHeader title="요리 찾기" description="나라와 현재 재료 상태를 조합해 오늘의 메뉴를 찾아보세요." />
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"><FilterRow>{cuisines.map((value) => <Chip key={value} active={cuisine === value} onClick={() => setCuisine(value)}>{value === "ALL" ? "전체" : CUISINE_LABELS[value]}</Chip>)}</FilterRow><FilterRow>{([['ALL','전체'],['NOW','바로 가능'],['ONE','핵심 재료 1개 부족'],['COOKED','해본 요리']] as [Availability,string][]).map(([value,label]) => <Chip key={value} active={availability === value} onClick={() => setAvailability(value)}>{label}</Chip>)}</FilterRow></div>
    <div className="flex items-center justify-between gap-3 text-sm text-gray-500"><p>조건에 맞는 요리 {results.length}개</p><p className="text-xs text-gray-600">핵심 재료 부족이 적은 순</p></div>{isLoading ? <p className="py-16 text-center text-gray-500">추천을 계산하는 중...</p> : results.length ? <div className="grid gap-3 md:grid-cols-2">{results.map((result) => <DishCard key={result.dish.id} result={result} cooked={cookedIds.has(result.dish.id)} />)}</div> : <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-gray-500">조건에 맞는 요리가 없어요.</p>}</div>;
}
function FilterRow({ children }: { children: React.ReactNode }) { return <div className="flex flex-wrap gap-2">{children}</div>; }
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition ${active ? "bg-orange-400 text-gray-950" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>{children}</button>; }
