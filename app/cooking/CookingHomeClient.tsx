"use client";

import Link from "next/link";
import CookingHeader from "@/components/cooking/CookingHeader";
import DishCard from "@/components/cooking/DishCard";
import { displayDishName } from "@/lib/cooking/names";
import { useCookingOverview } from "@/lib/hooks/use-api";

export default function CookingHomeClient() {
  const { data, isLoading } = useCookingOverview();
  if (isLoading || !data) return <CookingLoading />;

  const cookNow = data.recommendations.filter((result) => result.canCookNow).slice(0, 4);
  const oneAway = data.recommendations.filter((result) => result.missingCoreCount === 1).slice(0, 4);
  const topUnlock = data.unlocks[0];
  const cookedIds = new Set(data.cookedDishes.items.map((item) => item.dishId));

  return (
    <div className="space-y-8">
      <CookingHeader title="오늘, 집에 있는 재료로" description="보유 식재료를 기준으로 한식·일식·중식·양식을 추천하고, 다음에 살 재료까지 골라드려요." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon="🥬" label="보유 식재료" value={`${data.pantry.items.length}개`} href="/cooking/pantry" />
        <SummaryCard icon="🍚" label="바로 가능한 요리" value={`${data.recommendations.filter((item) => item.canCookNow).length}개`} href="/cooking/discover?filter=now" />
        <SummaryCard icon="🛒" label="한 개만 더 사면" value={`${data.recommendations.filter((item) => item.missingCoreCount === 1).length}개`} href="/cooking/discover?filter=one" />
        <SummaryCard icon="👨‍🍳" label="해본 요리" value={`${data.cookedDishes.items.length}개`} href="/cooking/discover?filter=cooked" />
      </div>

      {data.pantry.items.length === 0 && (
        <Link href="/cooking/pantry" className="flex items-center justify-between rounded-xl border border-dashed border-orange-400/30 bg-orange-500/5 p-5 text-sm text-orange-100 hover:bg-orange-500/10">
          <span><strong>먼저 집에 있는 재료를 등록해 주세요.</strong><span className="ml-2 text-orange-200/60">수량 없이 탭 한 번이면 충분해요.</span></span>
          <span>등록하기 →</span>
        </Link>
      )}

      <Section title="지금 만들 수 있어요" action="전체 보기" href="/cooking/discover?filter=now">
        {cookNow.length ? <div className="grid gap-3 md:grid-cols-2">{cookNow.map((result) => <DishCard key={result.dish.id} result={result} cooked={cookedIds.has(result.dish.id)} />)}</div> : <Empty text="필수 재료가 모두 갖춰진 요리가 아직 없어요." />}
      </Section>

      <Section title="재료 하나만 더 있으면" action="전체 보기" href="/cooking/discover?filter=one">
        {oneAway.length ? <div className="grid gap-3 md:grid-cols-2">{oneAway.map((result) => <DishCard key={result.dish.id} result={result} cooked={cookedIds.has(result.dish.id)} />)}</div> : <Empty text="Pantry를 채우면 가까운 요리를 찾아드릴게요." />}
      </Section>

      <Section title="가장 효과적인 다음 장보기" action="장보기 추천" href="/cooking/shopping">
        {topUnlock ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><p className="text-xl font-bold text-white">{topUnlock.ingredient.nameKo} <span className="ml-1 text-base font-normal text-gray-500">{topUnlock.ingredient.nameJa}</span></p><p className="mt-1 text-sm text-emerald-300">새롭게 만들 수 있는 요리 +{topUnlock.unlockCount}</p></div>
              <Link href="/cooking/shopping" className="rounded-lg bg-emerald-500/15 px-4 py-2 text-center text-sm text-emerald-200 hover:bg-emerald-500/25">왜 추천하나요? →</Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{topUnlock.unlockedDishes.slice(0, 6).map((dish) => <span key={dish.id} className="rounded-full bg-black/20 px-3 py-1 text-xs text-gray-300">{displayDishName(dish)}</span>)}</div>
          </div>
        ) : <Empty text="추천을 계산하려면 Pantry에 재료를 등록해 주세요." />}
      </Section>
    </div>
  );
}

function SummaryCard({ icon, label, value, href }: { icon: string; label: string; value: string; href: string }) {
  return <Link href={href} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-orange-400/20 hover:bg-white/[0.06]"><div className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-white">{value}</p></div></div></Link>;
}
function Section({ title, action, href, children }: { title: string; action: string; href: string; children: React.ReactNode }) { return <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">{title}</h2><Link href={href} className="text-sm text-orange-300 hover:text-orange-200">{action} →</Link></div>{children}</section>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">{text}</div>; }
function CookingLoading() { return <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">요리 추천을 준비하고 있어요...</div>; }
