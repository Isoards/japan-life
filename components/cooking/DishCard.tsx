import Link from "next/link";
import { CUISINE_LABELS, displayDishName } from "@/lib/cooking/names";
import type { DishRecommendation } from "@/lib/cooking/types";
import CookedButton from "./CookedButton";

export default function DishCard({ result, cooked = false }: { result: DishRecommendation; cooked?: boolean }) {
  const missingCount = result.missingRequired.length + result.missingImportant.length;
  return (
    <div className={`group rounded-xl border bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-white/[0.07] ${cooked ? "border-sky-400/25" : "border-white/10"}`}>
      <Link href={`/cooking/dishes/${result.dish.id}`} className="block">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white group-hover:text-orange-200">{displayDishName(result.dish)}</p>
          <p className="mt-1 text-xs text-gray-500">{CUISINE_LABELS[result.dish.cuisine]}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${result.canCookNow ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
          {result.canCookNow ? "바로 가능" : `${result.missingCoreCount}개 핵심 재료 부족`}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300" style={{ width: `${result.matchPercent}%` }} />
        </div>
        <span className="text-xs font-mono text-gray-400">{result.matchPercent}%</span>
      </div>
        {missingCount > 0 && <p className="mt-2 truncate text-xs text-gray-500">부족: {[...result.missingRequired, ...result.missingImportant].map((item) => item.nameKo).join(", ")}</p>}
      </Link>
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <Link href={`/cooking/dishes/${result.dish.id}`} className="text-xs text-orange-300 hover:text-orange-200">상세 보기 →</Link>
        <CookedButton dishId={result.dish.id} cooked={cooked} compact />
      </div>
    </div>
  );
}
