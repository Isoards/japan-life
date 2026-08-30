"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import CookingHeader from "@/components/cooking/CookingHeader";
import type { Ingredient, ReceiptConfirmResult, ReceiptParseResult, ReceiptParsedItem } from "@/lib/cooking/types";
import { useCookingOverview } from "@/lib/hooks/use-api";

type Step = "UPLOAD" | "PROCESSING" | "REVIEW" | "SUCCESS";

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "요청을 처리하지 못했습니다.");
  return body;
}

export default function ReceiptClient() {
  const { data: overview } = useCookingOverview();
  const [step, setStep] = useState<Step>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ReceiptParsedItem[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReceiptConfirmResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ingredients = useMemo(() => overview?.ingredients ?? [], [overview?.ingredients]);
  const ingredientById = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])), [ingredients]);
  const ownedIds = useMemo(() => new Set(overview?.pantry.items.map((item) => item.ingredientId) ?? []), [overview]);

  async function processReceipt() {
    if (!file) return setError("영수증 사진을 선택해 주세요.");
    setError("");
    setStep("PROCESSING");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const ocr = await responseJson<{ lines: string[] }>(await fetch("/api/cooking/receipt/ocr", { method: "POST", body: formData }));
      const parsed = await responseJson<ReceiptParseResult>(await fetch("/api/cooking/receipt/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: ocr.lines }),
      }));
      if (!parsed.items.length) throw new Error("영수증에서 품목을 찾지 못했어요. 사진이 흐리거나 영수증 전체가 보이지 않을 수 있습니다.");
      if (parsed.items.every((item) => item.itemType === "NON_FOOD")) throw new Error("영수증에서 식재료 품목을 찾지 못했어요. 다른 영수증이거나 사진이 흐릴 수 있습니다.");
      setItems(parsed.items);
      setStep("REVIEW");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "영수증을 읽지 못했습니다.");
      setStep("UPLOAD");
    }
  }

  function updateItem(id: string, patch: Partial<ReceiptParsedItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function confirm() {
    const ingredientIds = items.filter((item) => item.selected && item.matchedIngredientId).map((item) => item.matchedIngredientId as string);
    if (!ingredientIds.length) return setError("추가할 식재료를 한 개 이상 선택해 주세요.");
    setError("");
    try {
      const confirmed = await responseJson<ReceiptConfirmResult>(await fetch("/api/cooking/receipt/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientIds }),
      }));
      await mutate("/api/cooking/overview");
      setResult(confirmed);
      setStep("SUCCESS");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pantry를 업데이트하지 못했습니다.");
    }
  }

  function reset() {
    setStep("UPLOAD");
    setFile(null);
    setItems([]);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const high = items.filter((item) => item.itemType === "FOOD" && item.confidence >= 0.9 && item.matchedIngredientId);
  const uncertain = items.filter((item) => item.itemType !== "NON_FOOD" && !high.includes(item));
  const nonFood = items.filter((item) => item.itemType === "NON_FOOD");
  const selectedCount = new Set(items.filter((item) => item.selected && item.matchedIngredientId).map((item) => item.matchedIngredientId)).size;

  return (
    <div className="space-y-7 pb-24">
      <CookingHeader title="영수증으로 재료 추가" description="일본 영수증을 읽고 식재료 이름을 한국어로 확인한 뒤 Pantry에 한 번에 추가합니다." />

      {step === "UPLOAD" && (
        <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
          <div className="rounded-xl border border-dashed border-orange-400/30 bg-orange-500/5 p-6 text-center">
            <div className="text-5xl" aria-hidden>🧾</div>
            <p className="mt-4 font-semibold text-white">영수증 전체가 선명하게 보이는 사진</p>
            <p className="mt-1 text-sm text-gray-500">JPG, PNG, WebP · 최대 10MB</p>
            <label className="mt-5 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-orange-400 px-5 py-3 font-semibold text-gray-950 hover:bg-orange-300">
              {file ? "다른 사진 선택" : "사진 선택 (카메라·앨범)"}
              <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(""); }} />
            </label>
            {file && <p className="mt-3 truncate text-sm text-orange-200">{file.name}</p>}
          </div>
          <div className="rounded-xl bg-black/20 p-4 text-xs leading-5 text-gray-400">
            사진은 OCR 처리에만 사용하며 저장하지 않습니다. 상점·결제·포인트 관련 행은 Pantry 분석에서 제외합니다.
          </div>
          {error && <ErrorMessage message={error} />}
          <button type="button" disabled={!file} onClick={processReceipt} className="min-h-12 w-full cursor-pointer rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-gray-950 disabled:cursor-not-allowed disabled:opacity-40">영수증 읽기</button>
        </section>
      )}

      {step === "PROCESSING" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-20 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-orange-300 border-t-transparent" />
          <p className="mt-5 font-medium text-white">영수증의 일본어 품목을 읽고 있어요</p>
          <p className="mt-2 text-sm text-gray-500">OCR 후 식재료 사전과 대조합니다.</p>
        </div>
      )}

      {step === "REVIEW" && (
        <div className="space-y-7">
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">자동 등록 전 확인 단계입니다. 잘못 읽힌 품목은 후보를 바꾸거나 제외해 주세요.</div>
          {high.length > 0 && <ReviewSection title={`✓ 높은 신뢰도 · ${high.length}개`} tone="emerald">{high.map((item) => <ReceiptItemCard key={item.id} item={item} ingredients={ingredients} ingredientById={ingredientById} ownedIds={ownedIds} onChange={(patch) => updateItem(item.id, patch)} />)}</ReviewSection>}
          {uncertain.length > 0 && <ReviewSection title={`? 확인 필요 · ${uncertain.length}개`} tone="amber">{uncertain.map((item) => <ReceiptItemCard key={item.id} item={item} ingredients={ingredients} ingredientById={ingredientById} ownedIds={ownedIds} onChange={(patch) => updateItem(item.id, patch)} />)}</ReviewSection>}
          {nonFood.length > 0 && <ReviewSection title={`식재료 아님 · ${nonFood.length}개`} tone="gray">{nonFood.map((item) => <ReceiptItemCard key={item.id} item={item} ingredients={ingredients} ingredientById={ingredientById} ownedIds={ownedIds} onChange={(patch) => updateItem(item.id, patch)} />)}</ReviewSection>}
          {error && <ErrorMessage message={error} />}
          <div className="sticky bottom-3 z-20 flex gap-3 rounded-2xl border border-white/10 bg-gray-950/95 p-3 shadow-2xl backdrop-blur">
            <button type="button" onClick={reset} className="min-h-12 rounded-xl border border-white/10 px-4 text-sm text-gray-300">다시 읽기</button>
            <button type="button" disabled={selectedCount === 0} onClick={confirm} className="min-h-12 flex-1 rounded-xl bg-orange-400 px-4 font-semibold text-gray-950 disabled:opacity-40">선택한 {selectedCount}개 Pantry에 추가</button>
          </div>
        </div>
      )}

      {step === "SUCCESS" && result && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-7 text-center">
          <div className="text-5xl" aria-hidden>✅</div>
          <h2 className="mt-4 text-2xl font-bold text-white">Pantry 업데이트 완료</h2>
          <p className="mt-2 text-sm text-emerald-100">새 재료 {result.addedIngredientIds.length}개를 추가했고, 이미 보유한 {result.alreadyOwnedIngredientIds.length}개는 중복 등록하지 않았습니다.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/cooking" className="rounded-xl bg-orange-400 px-4 py-3 font-semibold text-gray-950">새 추천 보기</Link>
            <button type="button" onClick={reset} className="rounded-xl border border-white/15 px-4 py-3 text-white">다른 영수증 읽기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewSection({ title, tone, children }: { title: string; tone: "emerald" | "amber" | "gray"; children: React.ReactNode }) {
  const color = tone === "emerald" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-gray-400";
  return <section className="space-y-3"><h2 className={`text-lg font-bold ${color}`}>{title}</h2><div className="grid gap-3 lg:grid-cols-2">{children}</div></section>;
}

function ReceiptItemCard({ item, ingredients, ingredientById, ownedIds, onChange }: {
  item: ReceiptParsedItem;
  ingredients: Ingredient[];
  ingredientById: Map<string, Ingredient>;
  ownedIds: Set<string>;
  onChange: (patch: Partial<ReceiptParsedItem>) => void;
}) {
  const [query, setQuery] = useState("");
  const matched = item.matchedIngredientId ? ingredientById.get(item.matchedIngredientId) : undefined;
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return ingredients.filter((ingredient) => [ingredient.nameKo, ingredient.nameJa, ...(ingredient.aliasesKo ?? []), ...(ingredient.aliasesJa ?? []), ...(ingredient.receiptAliasesJa ?? [])].some((value) => value?.toLowerCase().includes(normalized))).slice(0, 6);
  }, [ingredients, query]);
  const confidenceLabel = item.confidence >= 0.9 ? "높음" : item.confidence >= 0.7 ? "보통" : "낮음";

  function choose(ingredientId?: string) {
    onChange({ matchedIngredientId: ingredientId, selected: Boolean(ingredientId), itemType: ingredientId ? "FOOD" : item.itemType });
    setQuery("");
  }

  return (
    <article className={`rounded-xl border p-4 ${item.selected ? "border-orange-400/30 bg-orange-500/[0.07]" : "border-white/10 bg-white/[0.03]"}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={item.selected} disabled={!item.matchedIngredientId} onChange={(event) => onChange({ selected: event.target.checked })} className="mt-1 h-5 w-5 accent-orange-400" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-white">{matched?.nameKo ?? (item.itemType === "NON_FOOD" ? "식재료 아님" : "재료를 선택해 주세요")}</span>
          {matched?.nameJa && <span className="mt-0.5 block text-sm text-gray-400">{matched.nameJa}</span>}
          <span className="mt-2 block break-words text-xs text-gray-500">원문: {item.rawText}</span>
        </span>
        <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[11px] text-gray-400">{confidenceLabel}</span>
      </label>
      {matched && ownedIds.has(matched.id) && <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">✓ 이미 Pantry에 있어요</p>}
      {item.itemType === "NON_FOOD" && !matched && <p className="mt-3 text-xs text-gray-500">식재료가 아닌 것으로 판단해 제외했습니다.</p>}
      {item.candidates.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.candidates.slice(0, 3).map((candidate) => { const ingredient = ingredientById.get(candidate.ingredientId); return ingredient ? <button type="button" key={candidate.ingredientId} onClick={() => choose(candidate.ingredientId)} className={`rounded-full border px-3 py-1.5 text-xs ${matched?.id === ingredient.id ? "border-orange-300 bg-orange-400/20 text-orange-100" : "border-white/10 text-gray-300"}`}>{ingredient.nameKo} · {Math.round(candidate.confidence * 100)}%</button> : null; })}
          <button type="button" onClick={() => choose(undefined)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-400">제외</button>
        </div>
      )}
      <div className="relative mt-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="한국어·일본어로 다른 재료 검색" className="w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/40" />
        {searchResults.length > 0 && <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-gray-950 shadow-xl">{searchResults.map((ingredient) => <button type="button" key={ingredient.id} onClick={() => choose(ingredient.id)} className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-white/10"><span className="text-white">{ingredient.nameKo}</span><span className="text-gray-500">{ingredient.nameJa}</span></button>)}</div>}
      </div>
    </article>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{message}</p>;
}
