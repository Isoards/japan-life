"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import CookingHeader from "@/components/cooking/CookingHeader";
import { CATEGORY_LABELS, STORAGE_LABELS } from "@/lib/cooking/names";
import type { IngredientCategory, StorageLocation } from "@/lib/cooking/types";
import { INGREDIENT_CATEGORIES } from "@/lib/cooking/types";
import { mutateAPI, useCookingOverview } from "@/lib/hooks/use-api";

type PantryFilter = IngredientCategory | "ALL" | "OWNED";

export default function PantryClient() {
  const { data, isLoading } = useCookingOverview();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PantryFilter>("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const ownedMap = useMemo(() => new Map(data?.pantry.items.map((item) => [item.ingredientId, item]) ?? []), [data]);
  const filtered = useMemo(() => (data?.ingredients ?? []).filter((ingredient) => {
    const q = query.trim().toLowerCase();
    const categoryMatches = category === "ALL"
      || ingredient.category === category
      || (category === "OWNED" && ownedMap.has(ingredient.id));
    return categoryMatches && (!q || [ingredient.nameKo, ingredient.nameJa, ...(ingredient.aliasesKo ?? []), ...(ingredient.aliasesJa ?? []), ...(ingredient.receiptAliasesJa ?? [])].some((value) => value?.toLowerCase().includes(q)));
  }), [data, query, category, ownedMap]);

  async function toggle(id: string) {
    setBusy(id);
    const owned = ownedMap.get(id);
    await mutateAPI("/api/cooking/pantry", owned ? "DELETE" : "POST", owned ? { id } : { ingredientId: id, storageLocation: "PANTRY" });
    await mutate("/api/cooking/overview");
    setBusy(null);
  }
  async function changeStorage(ingredientId: string, storageLocation: StorageLocation) {
    setBusy(ingredientId);
    await mutateAPI("/api/cooking/pantry", "POST", { ingredientId, storageLocation });
    await mutate("/api/cooking/overview");
    setBusy(null);
  }

  return (
    <div className="space-y-7">
      <CookingHeader title="우리 집 식재료" description="수량은 신경 쓰지 말고, 지금 사용할 수 있는 재료만 가볍게 등록하세요." />
      <Link href="/cooking/receipt" className="flex min-h-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20">🧾 영수증으로 재료 추가</Link>
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="굴소스·간장처럼 한국어·일본어로 검색" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-gray-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-400/40" />
          <select value={category} onChange={(event) => setCategory(event.target.value as PantryFilter)} className="rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none"><option value="ALL">전체 카테고리</option><option value="OWNED">보유 중</option>{INGREDIENT_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setCategory("OWNED"); setQuery(""); }} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition ${category === "OWNED" ? "bg-orange-400 text-gray-950" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>✓ 보유 재료만</button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm"><p className="text-gray-500">검색 결과 {filtered.length}개</p><p className="font-medium text-orange-300">보유 {data?.pantry.items.length ?? 0}개</p></div>
      {isLoading ? <p className="py-16 text-center text-gray-500">식재료를 불러오는 중...</p> : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ingredient) => { const owned = ownedMap.get(ingredient.id); return (
            <div key={ingredient.id} className={`rounded-xl border p-4 transition ${owned ? "border-orange-400/30 bg-orange-500/10" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="flex items-start justify-between gap-3"><button disabled={busy === ingredient.id} onClick={() => toggle(ingredient.id)} className="min-w-0 flex-1 cursor-pointer text-left disabled:opacity-50"><p className="font-medium text-white"><span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${owned ? "border-orange-400 bg-orange-400 text-black" : "border-gray-600"}`}>{owned ? "✓" : ""}</span>{ingredient.nameKo}</p><p className="ml-7 mt-1 text-xs text-gray-500">{ingredient.nameJa || "-"} · {CATEGORY_LABELS[ingredient.category]}</p></button></div>
              {ingredient.shoppingHintJa && <p className="mt-3 rounded-lg bg-black/20 px-3 py-2 text-xs text-gray-400">장보기: {ingredient.shoppingHintJa}</p>}
              {owned && <div className="mt-3 flex gap-1">{(Object.keys(STORAGE_LABELS) as StorageLocation[]).map((location) => <button key={location} onClick={() => changeStorage(ingredient.id, location)} className={`cursor-pointer rounded-md px-2 py-1 text-[11px] ${owned.storageLocation === location ? "bg-orange-400/20 text-orange-200" : "bg-white/5 text-gray-500 hover:text-gray-300"}`}>{STORAGE_LABELS[location]}</button>)}</div>}
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}
