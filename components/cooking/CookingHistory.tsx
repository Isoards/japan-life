"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import type { CookedDishItem } from "@/lib/cooking/types";
import { mutateAPI } from "@/lib/hooks/use-api";

export default function CookingHistory({ items }: { items: CookedDishItem[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm("이 조리 기록을 삭제할까요?")) return;
    setDeleting(id);
    const result = await mutateAPI("/api/cooking/cooked", "DELETE", { id });
    if (result.ok) {
      await mutate("/api/cooking/overview");
      router.refresh();
    }
    setDeleting(null);
  }

  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">내 조리 기록 <span className="text-sm font-normal text-sky-300">{items.length}회</span></h2>
      <div className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-sky-400/10 bg-sky-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <time className="font-medium text-white">{new Date(item.cookedAt).toLocaleDateString("ko-KR")}</time>
              <div className="flex items-center gap-3">
                {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-300 hover:text-orange-200">{item.sourceTitle || "참고 레시피"} ↗</a> : item.sourceTitle ? <span className="text-xs text-gray-400">{item.sourceTitle}</span> : null}
                <button type="button" disabled={deleting === item.id} onClick={() => remove(item.id)} className="cursor-pointer text-xs text-gray-600 hover:text-red-300 disabled:cursor-wait disabled:opacity-50">{deleting === item.id ? "삭제 중..." : "삭제"}</button>
              </div>
            </div>
            {item.note && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">{item.note}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
