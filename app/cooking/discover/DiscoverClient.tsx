"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CookingHeader from "@/components/cooking/CookingHeader";
import DishCard from "@/components/cooking/DishCard";
import { COLLECTION_SECTION_LABELS, CUISINE_LABELS } from "@/lib/cooking/names";
import type { Cuisine, RecipeCollectionSection } from "@/lib/cooking/types";
import { useCookingOverview } from "@/lib/hooks/use-api";

type Availability = "ALL" | "NOW" | "ONE" | "COOKED";
const cuisines: (Cuisine | "ALL")[] = ["ALL", "KOREAN", "JAPANESE", "CHINESE", "WESTERN", "OTHER"];
const collectionSections = Object.keys(COLLECTION_SECTION_LABELS) as RecipeCollectionSection[];

export default function DiscoverClient() {
  const params = useSearchParams();
  const { data, isLoading } = useCookingOverview();
  const [cuisine, setCuisine] = useState<Cuisine | "ALL">("ALL");
  const [collection, setCollection] = useState<"ALL" | "RYU_SO_YOUNG">("ALL");
  const [collectionSection, setCollectionSection] = useState<"ALL" | RecipeCollectionSection>("ALL");
  const [availability, setAvailability] = useState<Availability>(() => params.get("filter") === "now" ? "NOW" : params.get("filter") === "one" ? "ONE" : params.get("filter") === "cooked" ? "COOKED" : "ALL");
  const cookedByDish = useMemo(() => {
    const grouped = new Map<string, NonNullable<typeof data>["cookedDishes"]["items"]>();
    for (const item of data?.cookedDishes.items ?? []) grouped.set(item.dishId, [...(grouped.get(item.dishId) ?? []), item]);
    return grouped;
  }, [data]);
  const results = useMemo(
    () => (data?.recommendations ?? [])
      .filter((result) =>
        (cuisine === "ALL" || result.dish.cuisine === cuisine)
        && (collection === "ALL" || result.dish.collection === collection)
        && (collectionSection === "ALL" || result.dish.collectionSection === collectionSection)
        && (availability === "ALL"
          || (availability === "NOW" && result.canCookNow)
          || (availability === "ONE" && result.missingCoreCount === 1)
          || (availability === "COOKED" && cookedByDish.has(result.dish.id))),
      )
      .sort((a, b) =>
        a.missingCoreCount - b.missingCoreCount
        || b.matchPercent - a.matchPercent
        || a.dish.nameKo.localeCompare(b.dish.nameKo, "ko"),
      ),
    [data, cuisine, collection, collectionSection, availability, cookedByDish],
  );
  return <div className="space-y-7"><CookingHeader title="요리 찾기" description="레시피 모음과 나라, 현재 재료 상태를 조합해 오늘의 메뉴를 찾아보세요." />
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <FilterRow><Chip active={collection === "ALL"} onClick={() => { setCollection("ALL"); setCollectionSection("ALL"); }}>전체 레시피</Chip><Chip active={collection === "RYU_SO_YOUNG"} onClick={() => setCollection("RYU_SO_YOUNG")}>류수영</Chip></FilterRow>
      {collection === "RYU_SO_YOUNG" && <FilterRow><Chip active={collectionSection === "ALL"} onClick={() => setCollectionSection("ALL")}>전체 79개</Chip>{collectionSections.map((value) => <Chip key={value} active={collectionSection === value} onClick={() => setCollectionSection(value)}>{COLLECTION_SECTION_LABELS[value]}</Chip>)}</FilterRow>}
      <FilterRow>{cuisines.map((value) => <Chip key={value} active={cuisine === value} onClick={() => setCuisine(value)}>{value === "ALL" ? "모든 나라" : CUISINE_LABELS[value]}</Chip>)}</FilterRow><FilterRow>{([['ALL','전체 상태'],['NOW','바로 가능'],['ONE','핵심 재료 1개 부족'],['COOKED','해본 요리']] as [Availability,string][]).map(([value,label]) => <Chip key={value} active={availability === value} onClick={() => setAvailability(value)}>{label}</Chip>)}</FilterRow></div>
    <div className="flex items-center justify-between gap-3 text-sm text-gray-500"><p>조건에 맞는 요리 {results.length}개</p><p className="text-xs text-gray-600">핵심 재료 부족이 적은 순</p></div>{isLoading ? <p className="py-16 text-center text-sm text-gray-500">추천을 계산하는 중...</p> : results.length ? <div className="grid gap-3 md:grid-cols-2">{results.map((result) => <DishCard key={result.dish.id} result={result} cookedItems={cookedByDish.get(result.dish.id)} />)}</div> : <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-gray-500">조건에 맞는 요리가 없어요.</p>}</div>;
}
function FilterRow({ children }: { children: React.ReactNode }) { return <div className="flex flex-wrap gap-2">{children}</div>; }
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition ${active ? "bg-orange-400 text-gray-950" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>{children}</button>; }
