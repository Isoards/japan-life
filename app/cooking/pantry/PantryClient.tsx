"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import CookingHeader from "@/components/cooking/CookingHeader";
import { useToast } from "@/components/Toast";
import { getFreshnessLabel, isFreezableIngredient } from "@/lib/cooking/freshness";
import { CATEGORY_LABELS } from "@/lib/cooking/names";
import type { IngredientCategory } from "@/lib/cooking/types";
import { INGREDIENT_CATEGORIES } from "@/lib/cooking/types";
import { mutateAPI, useCookingOverview } from "@/lib/hooks/use-api";

type PantryFilter = IngredientCategory | "ALL" | "OWNED" | "URGENT";

export default function PantryClient() {
  const { data, isLoading } = useCookingOverview();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PantryFilter>("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const ownedMap = useMemo(() => new Map(data?.pantry.items.map((item) => [item.ingredientId, item]) ?? []), [data]);
  const freshnessMap = useMemo(() => new Map(data?.freshness.map((item) => [item.ingredientId, item]) ?? []), [data]);
  const filtered = useMemo(() => (data?.ingredients ?? []).filter((ingredient) => {
    const q = query.trim().toLowerCase();
    const freshness = freshnessMap.get(ingredient.id);
    const categoryMatches = category === "ALL"
      || ingredient.category === category
      || (category === "OWNED" && ownedMap.has(ingredient.id))
      || (category === "URGENT" && ["SOON", "TODAY", "EXPIRED"].includes(freshness?.status ?? ""));
    return categoryMatches && (!q || [ingredient.nameKo, ingredient.nameJa, ...(ingredient.aliasesKo ?? []), ...(ingredient.aliasesJa ?? []), ...(ingredient.receiptAliasesJa ?? [])].some((value) => value?.toLowerCase().includes(q)));
  }).sort((a, b) => {
    const aDays = freshnessMap.get(a.id)?.daysRemaining ?? Number.POSITIVE_INFINITY;
    const bDays = freshnessMap.get(b.id)?.daysRemaining ?? Number.POSITIVE_INFINITY;
    return aDays - bDays || a.nameKo.localeCompare(b.nameKo, "ko");
  }), [data, query, category, ownedMap, freshnessMap]);

  async function toggle(id: string) {
    setBusy(id);
    const owned = ownedMap.has(id);
    const result = await mutateAPI("/api/cooking/pantry", owned ? "DELETE" : "POST", owned ? { id } : { ingredientId: id });
    if (result.ok) {
      await mutate("/api/cooking/overview");
    } else {
      toast(result.error, "error");
    }
    setBusy(null);
  }

  async function setFrozen(ingredientId: string, frozen: boolean) {
    setBusy(ingredientId);
    const result = await mutateAPI("/api/cooking/pantry", "PATCH", { ingredientId, frozen });
    if (result.ok) {
      await mutate("/api/cooking/overview");
      toast(frozen ? "냉장 카운트다운을 멈췄어요." : "오늘부터 냉장 카운트다운을 다시 시작해요.");
    } else {
      toast(result.error, "error");
    }
    setBusy(null);
  }

  const urgentCount = data?.freshness.filter((item) => ["SOON", "TODAY", "EXPIRED"].includes(item.status)).length ?? 0;

  return (
    <div className="space-y-7">
      <CookingHeader title="우리 집 식재료" description="있는 재료만 체크하세요. 신선식품의 보관 위치와 권장 사용일은 자동으로 관리합니다." />
      <Link href="/cooking/receipt" className="flex min-h-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20">🧾 영수증으로 재료 추가</Link>
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="굴소스·간장처럼 한국어·일본어로 검색" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-gray-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-400/40" />
          <select value={category} onChange={(event) => setCategory(event.target.value as PantryFilter)} className="rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none"><option value="ALL">전체 카테고리</option><option value="OWNED">보유 중</option><option value="URGENT">먼저 사용할 재료</option>{INGREDIENT_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setCategory("OWNED"); setQuery(""); }} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition ${category === "OWNED" ? "bg-orange-400 text-gray-950" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>✓ 보유 재료만</button>
          <button type="button" onClick={() => { setCategory("URGENT"); setQuery(""); }} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition ${category === "URGENT" ? "bg-amber-400 text-gray-950" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>⏳ 먼저 사용 {urgentCount}</button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm"><p className="text-gray-500">검색 결과 {filtered.length}개</p><p className="font-medium text-orange-300">보유 {data?.pantry.items.length ?? 0}개</p></div>
      {isLoading ? <p className="py-16 text-center text-gray-500">식재료를 불러오는 중...</p> : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ingredient) => {
            const owned = ownedMap.get(ingredient.id);
            const freshness = freshnessMap.get(ingredient.id);
            const freshnessLabel = freshness ? getFreshnessLabel(freshness) : null;
            const urgent = freshness && ["SOON", "TODAY", "EXPIRED"].includes(freshness.status);
            return (
              <div key={ingredient.id} className={`rounded-xl border p-4 transition ${urgent ? "border-amber-400/35 bg-amber-500/10" : owned ? "border-orange-400/30 bg-orange-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                <button disabled={busy === ingredient.id} onClick={() => toggle(ingredient.id)} className="w-full cursor-pointer text-left disabled:opacity-50">
                  <p className="font-medium text-white"><span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${owned ? "border-orange-400 bg-orange-400 text-black" : "border-gray-600"}`}>{owned ? "✓" : ""}</span>{ingredient.nameKo}</p>
                  <p className="ml-7 mt-1 text-xs text-gray-500">{ingredient.nameJa || "-"} · {CATEGORY_LABELS[ingredient.category]}</p>
                </button>
                {freshnessLabel && <p className={`ml-7 mt-2 text-xs ${urgent ? "font-medium text-amber-200" : freshness?.status === "FROZEN" ? "text-sky-300" : "text-gray-400"}`}>{freshnessLabel}</p>}
                {ingredient.shoppingHintJa && <p className="mt-3 rounded-lg bg-black/20 px-3 py-2 text-xs text-gray-400">장보기: {ingredient.shoppingHintJa}</p>}
                {owned && isFreezableIngredient(ingredient.id) && <button type="button" disabled={busy === ingredient.id} onClick={() => setFrozen(ingredient.id, freshness?.status !== "FROZEN")} className="ml-7 mt-3 cursor-pointer rounded-lg bg-white/5 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50">{freshness?.status === "FROZEN" ? "냉장으로 돌리기" : "냉동했어요"}</button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
