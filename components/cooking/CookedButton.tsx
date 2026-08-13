"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { mutateAPI } from "@/lib/hooks/use-api";

export default function CookedButton({ dishId, cooked, compact = false }: { dishId: string; cooked: boolean; compact?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const result = await mutateAPI("/api/cooking/cooked", cooked ? "DELETE" : "POST", { id: dishId });
    if (result.ok) {
      await mutate("/api/cooking/overview");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      aria-pressed={cooked}
      className={`cursor-pointer rounded-lg border transition disabled:cursor-wait disabled:opacity-50 ${cooked ? "border-sky-400/30 bg-sky-500/15 text-sky-200" : "border-white/10 bg-white/5 text-gray-400 hover:border-sky-400/30 hover:text-sky-200"} ${compact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"}`}
    >
      {saving ? "저장 중..." : cooked ? "✓ 해봤어요" : "해봤어요 체크"}
    </button>
  );
}
