"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { mutateAPI } from "@/lib/hooks/use-api";
import type { RecipeSource } from "@/lib/cooking/types";

function localDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function CookedButton({ dishId, cooked, compact = false, sources = [] }: { dishId: string; cooked: boolean; compact?: boolean; sources?: RecipeSource[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cookedOn, setCookedOn] = useState(localDate);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await mutateAPI("/api/cooking/cooked", "POST", { dishId, cookedOn, sourceTitle, sourceUrl, note });
    if (result.ok) {
      await mutate("/api/cooking/overview");
      router.refresh();
      setOpen(false);
      setSourceTitle("");
      setSourceUrl("");
      setNote("");
    } else {
      setError(result.error);
    }
    setSaving(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`cursor-pointer rounded-lg border transition ${cooked ? "border-sky-400/30 bg-sky-500/15 text-sky-200" : "border-white/10 bg-white/5 text-gray-400 hover:border-sky-400/30 hover:text-sky-200"} ${compact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"}`}>
        {compact ? (cooked ? "+ 기록" : "기록 추가") : (cooked ? "+ 또 만들었어요" : "만든 기록 추가")}
      </button>
      {open && <div role="dialog" aria-modal="true" aria-label="조리 기록 추가" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <form onSubmit={save} className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-gray-950 p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-white">만든 기록 추가</h2><p className="mt-1 text-xs text-gray-500">날짜와 참고한 영상·레시피를 함께 남겨보세요.</p></div><button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-lg px-2 py-1 text-gray-500 hover:bg-white/5 hover:text-white" aria-label="닫기">✕</button></div>
          <label className="block space-y-1.5"><span className="text-xs font-medium text-gray-400">만든 날짜 *</span><input required type="date" value={cookedOn} onChange={(event) => setCookedOn(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/40" /></label>
          {sources.length > 0 && <div className="space-y-2"><p className="text-xs font-medium text-gray-400">제공된 레시피에서 선택</p><div className="flex flex-wrap gap-2">{sources.map((source) => <button key={source.id} type="button" onClick={() => { setSourceTitle(source.title); setSourceUrl(source.url); }} className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-gray-300 hover:border-orange-400/30 hover:text-orange-200">{source.sourceType === "YOUTUBE" ? "▶" : "↗"} {source.title}</button>)}</div></div>}
          <label className="block space-y-1.5"><span className="text-xs font-medium text-gray-400">참고 자료 이름</span><input value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} maxLength={120} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/40" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-medium text-gray-400">영상·레시피 URL</span><input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/40" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-medium text-gray-400">메모</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/40" /></label>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-white/5">취소</button><button disabled={saving} type="submit" className="cursor-pointer rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-sky-300 disabled:cursor-wait disabled:opacity-50">{saving ? "저장 중..." : "기록 저장"}</button></div>
        </form>
      </div>}
    </>
  );
}
