"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { formatExpenseDescription } from "@/lib/expenses/receipt/create-draft";
import type { ExpenseReceiptConfirmResult, ExpenseReceiptDraft, ExpenseReceiptParseResponse, ExpenseSheetOptions } from "@/lib/expenses/receipt/types";

type Step = "UPLOAD" | "PROCESSING" | "REVIEW" | "SUCCESS";

class ApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
  }
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string; code?: string };
  if (!response.ok) throw new ApiError(body.error || "요청을 처리하지 못했습니다.", body.code);
  return body;
}

export default function ExpenseReceiptClient() {
  const [step, setStep] = useState<Step>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ExpenseReceiptDraft | null>(null);
  const [options, setOptions] = useState<ExpenseSheetOptions | null>(null);
  const [result, setResult] = useState<ExpenseReceiptConfirmResult | null>(null);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processReceipt() {
    if (!file) return setError("영수증 사진을 선택해 주세요.");
    setStep("PROCESSING");
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const ocr = await responseJson<{ lines: string[] }>(await fetch("/api/expenses/receipt/ocr", { method: "POST", body: formData }));
      const parsed = await responseJson<ExpenseReceiptParseResponse>(await fetch("/api/expenses/receipt/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: ocr.lines }),
      }));
      setDraft(parsed.draft);
      setOptions(parsed.options);
      setStep("REVIEW");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "영수증을 읽지 못했습니다.");
      setStep("UPLOAD");
    }
  }

  function update(patch: Partial<ExpenseReceiptDraft>) {
    setDraft((current) => current ? { ...current, ...patch } : current);
    setDuplicateWarning(false);
  }

  function updateMerchant(value: string) {
    if (!draft) return;
    update({ merchantName: value, entries: draft.entries.map((entry) => ({ ...entry, description: formatExpenseDescription(value, [...new Set(entry.itemNames)]) })) });
  }

  function updateEntry(id: string, patch: Partial<ExpenseReceiptDraft["entries"][number]>) {
    if (!draft) return;
    update({ entries: draft.entries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry) });
  }

  function addManualEntry() {
    if (!draft || !options || draft.entries.length >= 20) return;
    update({
      entries: [
        ...draft.entries,
        {
          id: `manual-${crypto.randomUUID()}`,
          category: options.defaultCategory,
          itemNames: [],
          originalItemNames: [],
          description: draft.merchantName,
          amount: 0,
        },
      ],
    });
  }

  function removeEntry(id: string) {
    if (!draft || draft.entries.length <= 1) return;
    update({ entries: draft.entries.filter((entry) => entry.id !== id) });
  }

  function updateTotalAmount(totalAmount: number) {
    if (!draft) return;
    const difference = totalAmount - draft.totalAmount;
    const target = draft.entries.reduce((largest, entry) => entry.amount > largest.amount ? entry : largest, draft.entries[0]);
    update({ totalAmount, entries: draft.entries.map((entry) => entry.id === target?.id ? { ...entry, amount: Math.max(0, entry.amount + difference) } : entry) });
  }

  async function confirm(allowDuplicate = false) {
    if (!draft || !draft.date || !draft.merchantName || draft.totalAmount <= 0 || !draft.paymentMethod || draft.entries.some((entry) => !entry.category || !entry.description || entry.amount <= 0)) {
      return setError("날짜, 가게 이름, 분류 내역, 금액과 결제수단을 확인해 주세요.");
    }
    const entryTotal = draft.entries.reduce((sum, entry) => sum + entry.amount, 0);
    if (entryTotal !== draft.totalAmount) {
      return setError(`카테고리별 합계 ¥${entryTotal.toLocaleString("ko-KR")}와 영수증 합계 ¥${draft.totalAmount.toLocaleString("ko-KR")}가 다릅니다.`);
    }
    setSaving(true);
    setError("");
    try {
      const confirmed = await responseJson<ExpenseReceiptConfirmResult>(await fetch("/api/expenses/receipt/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, allowDuplicate }),
      }));
      await mutate((key) => typeof key === "string" && key.startsWith("/api/sheets"));
      setResult(confirmed);
      setDuplicateWarning(false);
      setStep("SUCCESS");
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "POSSIBLE_DUPLICATE") {
        setDuplicateWarning(true);
      } else {
        setError(caught instanceof Error ? caught.message : "가계부에 저장하지 못했습니다.");
      }
    } finally {
      setSaving(false);
    }
  }

  const entryTotal = draft?.entries.reduce((sum, entry) => sum + entry.amount, 0) ?? 0;
  const totalsMatch = Boolean(draft && entryTotal === draft.totalAmount);
  const entriesValid = Boolean(draft && draft.entries.every((entry) => entry.category && entry.description.trim() && entry.amount > 0));

  function reset() {
    setStep("UPLOAD");
    setFile(null);
    setDraft(null);
    setOptions(null);
    setResult(null);
    setError("");
    setDuplicateWarning(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-400">Expenses</p><h1 className="mt-1 text-3xl font-bold text-white">영수증으로 지출 추가</h1><p className="mt-2 text-sm text-gray-400">일본 영수증을 읽어 Google Sheets 가계부 내역을 만듭니다.</p></div>
        <Link href="/expenses" className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 hover:text-white">가계부로</Link>
      </div>

      {step === "UPLOAD" && <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div className="rounded-xl border border-dashed border-pink-400/30 bg-pink-500/5 p-7 text-center">
          <div className="text-5xl" aria-hidden>🧾</div>
          <p className="mt-4 font-semibold text-white">날짜와 합계가 선명한 영수증 사진</p>
          <p className="mt-1 text-sm text-gray-500">JPG, PNG, WebP · 최대 10MB</p>
          <label className="mt-5 inline-flex min-h-12 cursor-pointer items-center rounded-xl bg-pink-400 px-5 py-3 font-semibold text-gray-950 hover:bg-pink-300">
            {file ? "다른 사진 선택" : "사진 촬영 또는 선택"}
            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(""); }} />
          </label>
          {file && <p className="mt-3 truncate text-sm text-pink-200">{file.name}</p>}
        </div>
        <p className="rounded-xl bg-black/20 p-4 text-xs leading-5 text-gray-400">사진은 저장하지 않습니다. 추출한 날짜·가게·품목·금액을 확인한 뒤에만 시트에 기록합니다.</p>
        {error && <ErrorMessage message={error} />}
        <button type="button" disabled={!file} onClick={processReceipt} className="min-h-12 w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-gray-950 disabled:opacity-40">영수증 읽기</button>
      </section>}

      {step === "PROCESSING" && <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-20 text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-pink-300 border-t-transparent" /><p className="mt-5 font-medium text-white">가게·품목·합계를 찾고 있어요</p><p className="mt-2 text-sm text-gray-500">아직 Google Sheets에는 기록하지 않습니다.</p></div>}

      {step === "REVIEW" && draft && options && <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); confirm(); }}>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">품목을 분류 가이드에 따라 나눴습니다. 카테고리별 금액 합계가 영수증 합계와 같은지 확인해 주세요.</div>
        {draft.warnings.length > 0 && <div className="space-y-1 rounded-xl border border-red-400/20 bg-red-500/10 p-4">{draft.warnings.map((warning) => <p key={warning} className="text-sm text-red-200">• {warning}</p>)}</div>}
        <details className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"><summary className="cursor-pointer text-gray-400">일본어 OCR 원문 확인</summary><p className="mt-3 text-xs text-gray-500">가게: {draft.originalMerchantName}</p><ul className="mt-2 space-y-1 text-xs text-gray-500">{draft.originalPurchasedItems.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul></details>
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-2">
          <Field label="날짜 *"><input required type="date" value={draft.date} onChange={(event) => update({ date: event.target.value })} className={inputClass} /></Field>
          <Field label="구분"><input value="지출" disabled className={`${inputClass} opacity-60`} /></Field>
          <Field label="결제수단 *"><select required value={draft.paymentMethod} onChange={(event) => update({ paymentMethod: event.target.value })} className={inputClass}>{options.paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></Field>
          <Field label="가게 이름 *" wide><input required value={draft.merchantName} maxLength={120} onChange={(event) => updateMerchant(event.target.value)} className={inputClass} /></Field>
          <Field label="영수증 총액 *"><div className="relative"><span className="absolute left-3 top-2.5 text-gray-500">¥</span><input required type="number" min={1} value={draft.totalAmount || ""} onChange={(event) => updateTotalAmount(Number(event.target.value))} className={`${inputClass} pl-7`} /></div></Field>
          <Field label="메모"><input value={draft.memo} maxLength={500} onChange={(event) => update({ memo: event.target.value })} className={inputClass} /></Field>
        </div>
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="font-semibold text-white">카테고리별 등록 내역</h2><p className="mt-1 text-xs text-gray-500">각 묶음은 Google Sheets 내역 시트의 별도 행으로 등록됩니다.</p></div>
            <button type="button" disabled={draft.entries.length >= 20} onClick={addManualEntry} className="min-h-10 rounded-lg border border-pink-400/30 bg-pink-500/10 px-3 text-sm font-medium text-pink-200 hover:bg-pink-500/20 disabled:cursor-not-allowed disabled:opacity-40">+ 카테고리 직접 추가</button>
            <div className={`rounded-lg px-3 py-2 text-right text-sm ${totalsMatch ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"}`}><p>분류 합계 ¥{entryTotal.toLocaleString("ko-KR")}</p><p className="text-xs opacity-75">영수증 ¥{draft.totalAmount.toLocaleString("ko-KR")}</p></div>
          </div>
          <div className="space-y-3">
            {draft.entries.map((entry) => <div key={entry.id} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-gray-500">{entry.id.startsWith("manual-") ? "직접 추가한 내역" : "OCR 인식 내역"}</p>{draft.entries.length > 1 && <button type="button" onClick={() => removeEntry(entry.id)} className="rounded-md px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">이 분류 삭제</button>}</div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <Field label="카테고리 *"><select required value={entry.category} onChange={(event) => updateEntry(entry.id, { category: event.target.value })} className={inputClass}>{options.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
                <Field label="분류 금액 *"><div className="relative"><span className="absolute left-3 top-2.5 text-gray-500">¥</span><input required type="number" min={1} value={entry.amount || ""} onChange={(event) => updateEntry(entry.id, { amount: Number(event.target.value) })} className={`${inputClass} pl-7`} /></div></Field>
              </div>
              <div><p className="text-xs font-medium text-gray-400">인식 품목</p><div className="mt-2 flex flex-wrap gap-1.5">{entry.itemNames.length ? entry.itemNames.map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-gray-300">{item}</span>) : <span className="text-xs text-gray-500">품목을 읽지 못함</span>}</div></div>
              <Field label="시트에 들어갈 내용 *"><textarea required value={entry.description} maxLength={500} onChange={(event) => updateEntry(entry.id, { description: event.target.value })} rows={2} className={`${inputClass} resize-y`} /></Field>
            </div>)}
          </div>
          {!totalsMatch && <p role="alert" className="text-sm text-red-200">카테고리별 금액을 조정해 합계를 ¥{draft.totalAmount.toLocaleString("ko-KR")}로 맞춰 주세요.</p>}
        </section>
        {options.classificationGuide.length > 0 && <details className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"><summary className="cursor-pointer text-gray-400">분류가이드 보기</summary><div className="mt-3 space-y-2">{options.classificationGuide.map((guide, index) => <div key={`${guide.criterion}-${index}`} className="rounded-lg bg-black/20 p-3"><p className="font-medium text-gray-200">{guide.criterion} → {guide.category}</p>{guide.example && <p className="mt-1 text-xs text-gray-500">예: {guide.example}</p>}{guide.note && <p className="mt-1 text-xs text-gray-500">{guide.note}</p>}</div>)}</div></details>}
        {duplicateWarning && <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4"><p className="text-sm font-medium text-amber-100">같은 날짜·가게·금액의 내역이 이미 있을 수 있습니다.</p><button type="button" disabled={saving} onClick={() => confirm(true)} className="mt-3 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-gray-950">그래도 등록</button></div>}
        {error && <ErrorMessage message={error} />}
        <div className="sticky bottom-3 flex gap-3 rounded-2xl border border-white/10 bg-gray-950/95 p-3 shadow-2xl backdrop-blur"><button type="button" onClick={reset} className="min-h-12 rounded-xl border border-white/10 px-4 text-sm text-gray-300">다시 읽기</button><button type="submit" disabled={saving || !totalsMatch || !entriesValid || draft.totalAmount <= 0} className="min-h-12 flex-1 rounded-xl bg-pink-400 px-4 font-semibold text-gray-950 disabled:opacity-40">{saving ? "등록 중..." : `${draft.entries.length}개 행 등록`}</button></div>
      </form>}

      {step === "SUCCESS" && result && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-7 text-center"><div className="text-5xl">✅</div><h2 className="mt-4 text-2xl font-bold text-white">가계부 등록 완료</h2><p className="mt-2 text-sm text-emerald-100">Google Sheets 내역 시트에 카테고리별 {result.rows.length}개 행을 추가했습니다.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/expenses" className="rounded-xl bg-pink-400 px-4 py-3 font-semibold text-gray-950">가계부 확인</Link><button type="button" onClick={reset} className="rounded-xl border border-white/15 px-4 py-3 text-white">다른 영수증 읽기</button></div></div>}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-white/10 bg-gray-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-pink-400/40 disabled:cursor-not-allowed";
function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`block space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><span className="text-xs font-medium text-gray-400">{label}</span>{children}</label>; }
function ErrorMessage({ message }: { message: string }) { return <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{message}</p>; }
