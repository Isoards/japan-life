"use client";

import { useEffect, useMemo, useState } from "react";
import { mutate } from "swr";
import CookingHeader from "@/components/cooking/CookingHeader";
import { useToast } from "@/components/Toast";
import { addDateKeyDays, dateKeyInTokyo } from "@/lib/cooking/freshness";
import { getWeekDates, getWeekStart } from "@/lib/cooking/meal-plan";
import { displayDishName } from "@/lib/cooking/names";
import type { DishRecommendation, MealPlanData, MealSlot } from "@/lib/cooking/types";
import { mutateAPI, useCookingOverview, useMealPlan } from "@/lib/hooks/use-api";

const SLOT_LABELS: Record<MealSlot, string> = { LUNCH: "점심", DINNER: "저녁" };
type PickerFilter = "ALL" | "NOW" | "EXPIRING" | "SUBSTITUTE";
type ActivePicker = { date: string; slot: MealSlot };

export default function MealPlannerClient() {
  const { data: overview, isLoading: overviewLoading } = useCookingOverview();
  const { data: plan, isLoading: planLoading } = useMealPlan();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(dateKeyInTokyo()));
  const [busy, setBusy] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const [query, setQuery] = useState("");
  const [pickerFilter, setPickerFilter] = useState<PickerFilter>("ALL");
  const dates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const itemsBySlot = useMemo(() => new Map((plan?.items ?? []).map((item) => [`${item.date}:${item.slot}`, item])), [plan]);
  const recommendations = useMemo(() => overview?.recommendations ?? [], [overview]);
  const ingredientNameById = useMemo(() => new Map((overview?.ingredients ?? []).map((ingredient) => [ingredient.id, `${ingredient.nameKo} ${ingredient.nameJa ?? ""}`])), [overview]);

  useEffect(() => {
    if (!activePicker) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePicker(null);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [activePicker]);

  const pickerResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko");
    return recommendations.filter((result) => {
      const filterMatches = pickerFilter === "ALL"
        || (pickerFilter === "NOW" && result.canCookNow)
        || (pickerFilter === "EXPIRING" && result.expiringIngredients.length > 0)
        || (pickerFilter === "SUBSTITUTE" && result.matchedBySubstitution.length > 0);
      if (!filterMatches) return false;
      if (!normalized) return true;
      return [result.dish.nameKo, result.dish.nameLocal, ...(result.dish.tags ?? []), ...result.requirements.map((item) => ingredientNameById.get(item.ingredientId))]
        .some((value) => value?.toLocaleLowerCase("ko").includes(normalized));
    }).slice(0, normalized ? 40 : 18);
  }, [ingredientNameById, pickerFilter, query, recommendations]);

  function openPicker(date: string, slot: MealSlot) {
    setQuery("");
    setPickerFilter("ALL");
    setActivePicker({ date, slot });
  }

  async function changeMeal(date: string, slot: MealSlot, dishId: string) {
    const key = `${date}:${slot}`;
    const existing = itemsBySlot.get(key);
    setBusy(key);
    const result = dishId
      ? await mutateAPI<MealPlanData>("/api/cooking/meal-plan", "POST", { date, slot, dishId })
      : existing ? await mutateAPI<MealPlanData>("/api/cooking/meal-plan", "DELETE", { id: existing.id }) : null;
    if (result && !result.ok) {
      toast(result.error, "error");
      setBusy(null);
      return;
    }
    if (result?.ok) {
      await mutate("/api/cooking/meal-plan");
      toast(dishId ? "식단에 메뉴를 담았어요." : "식단에서 메뉴를 뺐어요.");
    }
    setBusy(null);
    setActivePicker(null);
  }

  const loading = overviewLoading || planLoading;
  const thisWeek = weekStart === getWeekStart(dateKeyInTokyo());
  const activeKey = activePicker ? `${activePicker.date}:${activePicker.slot}` : null;
  const activeItem = activeKey ? itemsBySlot.get(activeKey) : undefined;

  return (
    <div className="space-y-7">
      <CookingHeader title="주간 식단" description="임박한 재료와 현재 Pantry를 반영한 추천 순서로 이번 주 메뉴를 가볍게 정하세요." />
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <button type="button" onClick={() => setWeekStart(addDateKeyDays(weekStart, -7))} className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10">← 이전 주</button>
        <div className="text-center"><p className="font-semibold text-white">{formatWeek(weekStart)}</p>{!thisWeek && <button type="button" onClick={() => setWeekStart(getWeekStart(dateKeyInTokyo()))} className="mt-1 text-xs text-orange-300">이번 주로</button>}</div>
        <button type="button" onClick={() => setWeekStart(addDateKeyDays(weekStart, 7))} className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10">다음 주 →</button>
      </div>
      {loading ? <p className="py-16 text-center text-gray-500">식단을 불러오는 중...</p> : (
        <div className="grid gap-3 xl:grid-cols-2">
          {dates.map((date) => (
            <section key={date} className={`rounded-xl border p-4 ${date === dateKeyInTokyo() ? "border-orange-400/30 bg-orange-500/[0.07]" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-white">{formatDay(date)}</h2>{date === dateKeyInTokyo() && <span className="rounded-full bg-orange-400/15 px-2.5 py-1 text-xs text-orange-200">오늘</span>}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["LUNCH", "DINNER"] as MealSlot[]).map((slot) => {
                  const key = `${date}:${slot}`;
                  const item = itemsBySlot.get(key);
                  const selected = item ? recommendations.find((result) => result.dish.id === item.dishId) : undefined;
                  return <MealSlotCard key={slot} label={SLOT_LABELS[slot]} selected={selected} busy={busy === key} onPick={() => openPicker(date, slot)} onRemove={() => changeMeal(date, slot, "")} />;
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="text-xs leading-5 text-gray-600">⏳ 표시는 권장 사용일이 가까운 재료를 활용하는 메뉴입니다. 식단에 담은 요리의 부족 재료는 장보기 화면에 자동으로 모입니다.</p>

      {activePicker && <MenuPicker
        date={activePicker.date}
        slot={activePicker.slot}
        selectedDishId={activeItem?.dishId}
        query={query}
        filter={pickerFilter}
        results={pickerResults}
        busy={busy === activeKey}
        onQueryChange={setQuery}
        onFilterChange={setPickerFilter}
        onChoose={(dishId) => changeMeal(activePicker.date, activePicker.slot, dishId)}
        onClose={() => setActivePicker(null)}
      />}
    </div>
  );
}

function MealSlotCard({ label, selected, busy, onPick, onRemove }: {
  label: string;
  selected?: DishRecommendation;
  busy: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  return <div className={`min-h-32 rounded-xl border p-3 ${selected ? "border-orange-400/15 bg-black/25" : "border-dashed border-white/10 bg-black/10"}`}>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    {selected ? <div className="mt-2 flex h-[calc(100%-1.25rem)] flex-col justify-between gap-3">
      <div><p className="font-semibold leading-5 text-white">{displayDishName(selected.dish)}</p><RecommendationStatus result={selected} /></div>
      <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={onPick} className="flex-1 rounded-lg bg-orange-400/10 px-3 py-2 text-xs font-medium text-orange-200 hover:bg-orange-400/20 disabled:opacity-50">메뉴 바꾸기</button><button type="button" disabled={busy} onClick={onRemove} aria-label={`${label} 메뉴 삭제`} className="rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-white/10 hover:text-red-300 disabled:opacity-50">삭제</button></div>
    </div> : <button type="button" disabled={busy} onClick={onPick} className="mt-2 flex min-h-20 w-full flex-col items-center justify-center rounded-lg text-sm text-gray-500 transition hover:bg-white/5 hover:text-orange-200 disabled:opacity-50"><span className="text-xl">＋</span><span className="mt-1">메뉴 검색</span></button>}
  </div>;
}

function MenuPicker({ date, slot, selectedDishId, query, filter, results, busy, onQueryChange, onFilterChange, onChoose, onClose }: {
  date: string;
  slot: MealSlot;
  selectedDishId?: string;
  query: string;
  filter: PickerFilter;
  results: DishRecommendation[];
  busy: boolean;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: PickerFilter) => void;
  onChoose: (dishId: string) => void;
  onClose: () => void;
}) {
  const filters: Array<{ value: PickerFilter; label: string }> = [
    { value: "ALL", label: "추천순" },
    { value: "NOW", label: "바로 가능" },
    { value: "EXPIRING", label: "먼저 쓸 재료" },
    { value: "SUBSTITUTE", label: "대체재 활용" },
  ];
  return <div role="dialog" aria-modal="true" aria-label="식단 메뉴 검색" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-gray-950 shadow-2xl sm:rounded-2xl">
      <div className="flex items-start justify-between border-b border-white/10 p-5"><div><p className="text-xs font-medium text-orange-300">{formatDay(date)} · {SLOT_LABELS[slot]}</p><h2 className="mt-1 text-xl font-bold text-white">어떤 메뉴를 먹을까요?</h2></div><button type="button" onClick={onClose} aria-label="메뉴 검색 닫기" className="rounded-lg px-3 py-2 text-gray-500 hover:bg-white/10 hover:text-white">✕</button></div>
      <div className="space-y-3 border-b border-white/10 p-4 sm:p-5">
        <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">⌕</span><input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="요리 이름이나 재료로 검색" className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-400/50" /></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button type="button" key={item.value} onClick={() => onFilterChange(item.value)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${filter === item.value ? "bg-orange-400 text-gray-950" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>{item.label}</button>)}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs text-gray-500">{query.trim() ? `검색 결과 ${results.length}개` : "Pantry를 반영한 추천 메뉴"}</p>{!query.trim() && <p className="text-[11px] text-gray-600">검색하면 전체 메뉴에서 찾아요</p>}</div>
        {results.length ? <div className="grid gap-2 md:grid-cols-2">{results.map((result) => <button type="button" key={result.dish.id} disabled={busy} onClick={() => onChoose(result.dish.id)} className={`rounded-xl border p-4 text-left transition hover:border-orange-400/40 hover:bg-orange-500/[0.07] disabled:opacity-50 ${selectedDishId === result.dish.id ? "border-orange-400/50 bg-orange-500/10" : "border-white/10 bg-white/[0.03]"}`}><div className="flex items-start justify-between gap-3"><p className="font-semibold leading-5 text-white">{displayDishName(result.dish)}</p>{selectedDishId === result.dish.id && <span className="shrink-0 rounded-full bg-orange-400 px-2 py-1 text-[10px] font-bold text-gray-950">선택됨</span>}</div><RecommendationStatus result={result} />{result.matchedBySubstitution.length > 0 && <p className="mt-2 text-[11px] text-violet-300">대체재 {result.matchedBySubstitution.length}개 활용 가능</p>}</button>)}</div> : <div className="rounded-xl border border-dashed border-white/10 py-14 text-center"><p className="text-sm text-gray-400">조건에 맞는 메뉴가 없어요.</p><button type="button" onClick={() => { onQueryChange(""); onFilterChange("ALL"); }} className="mt-3 text-xs text-orange-300">검색 조건 초기화</button></div>}
      </div>
    </div>
  </div>;
}

function RecommendationStatus({ result }: { result: DishRecommendation }) {
  if (result.expiringIngredients.length) return <p className="mt-1.5 text-xs text-amber-200">⏳ {result.expiringIngredients.map((item) => item.ingredient.nameKo).join(", ")} 먼저 사용</p>;
  if (result.canCookNow) return <p className="mt-1.5 text-xs text-emerald-300">✓ 현재 재료로 바로 가능</p>;
  return <p className="mt-1.5 text-xs text-gray-500">핵심 재료 {result.missingCoreCount}개 필요</p>;
}

function formatWeek(start: string) {
  const end = addDateKeyDays(start, 6);
  return `${start.slice(5).replace("-", ".")} – ${end.slice(5).replace("-", ".")}`;
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date(`${date}T12:00:00+09:00`));
}
