"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHighResArtwork, formatDuration } from "@/lib/itunes";
import { getUpcomingMilestones } from "@/lib/milestoneUtils";
import MusicButton from "@/components/MusicButton";
import TodayActionCenter, { type TodayAction } from "@/components/TodayActionCenter";
import {
  useFavorites,
  useChecklist,
  useConcerts,
  useBudget,
  useReleases,
  useLiveExchangeRates,
  useSheetsSummary,
  useWeather,
  useGarbageSchedule,
  usePackages,
  useCookingOverview,
  useMealPlan,
  useSettings,
} from "@/lib/hooks/use-api";
import { getUpcomingHolidays } from "@/lib/constants/holidays";
import { weatherCodeToEmoji, weatherCodeToLabel } from "@/lib/weather";
import { DAY_LABELS, isGarbageCollectionOn } from "@/lib/constants/garbage";
import { dateKeyInTokyo } from "@/lib/cooking/freshness";
import { displayDishName } from "@/lib/cooking/names";
import { DEFAULT_USER_SETTINGS, isLivingMode } from "@/lib/settings";

const DASHBOARD_RENDER_TIME = Date.now();

export default function DashboardClient({ initialNow }: { initialNow: string }) {
  const { data: settings = DEFAULT_USER_SETTINGS } = useSettings();
  const { data: favorites = [] } = useFavorites();
  const { data: checklist = [] } = useChecklist();
  const { data: concerts = [] } = useConcerts();
  const { data: budget } = useBudget();
  const { data: liveRates, isLoading: ratesLoading } = useLiveExchangeRates();
  const currentMonth = useMemo(
    () =>
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    [],
  );
  const currentMonthLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
      }),
    [],
  );
  const { data: currentMonthSheet, isLoading: monthSheetLoading } =
    useSheetsSummary(currentMonth);

  const releaseIds = useMemo(
    () =>
      favorites.length > 0 ? favorites.map((f) => f.itunesId).join(",") : null,
    [favorites],
  );
  const { data: newReleases = [], isLoading: releasesLoading } =
    useReleases(releaseIds);

  const { checkedCount, totalChecklist, checklistPct, highPriorityLeft } =
    useMemo(() => {
      const checked = checklist.filter((c) => c.checked).length;
      const total = checklist.length;
      return {
        checkedCount: checked,
        totalChecklist: total,
        checklistPct: total > 0 ? Math.round((checked / total) * 100) : 0,
        highPriorityLeft: checklist.filter(
          (c) => c.priority === "high" && !c.checked,
        ).length,
      };
    }, [checklist]);

  const { upcomingConcerts, nextConcert } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = concerts
      .filter((c) => c.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return { upcomingConcerts: upcoming, nextConcert: upcoming[0] || null };
  }, [concerts]);

  const { budgetTotal, budgetSpent, budgetRemaining } = useMemo(() => {
    const total =
      budget?.categories?.reduce((sum, category) => sum + category.amount, 0) ??
      0;
    // 실제 지출은 예산 카테고리 매핑과 독립적으로 가계부의 지출 합계를 사용한다.
    const spent = currentMonthSheet?.totalExpense ?? 0;
    return {
      budgetTotal: total,
      budgetSpent: spent,
      budgetRemaining: total - spent,
    };
  }, [budget, currentMonthSheet]);

  const upcomingMilestones = useMemo(
    () => getUpcomingMilestones(concerts, 7),
    [concerts],
  );

  const { data: weather, isLoading: weatherLoading } = useWeather();
  const { data: garbageSchedule } = useGarbageSchedule();
  const { data: packages = [] } = usePackages();
  const { data: cookingOverview, isLoading: cookingLoading } = useCookingOverview();
  const { data: mealPlan, isLoading: mealPlanLoading } = useMealPlan();

  const upcomingHolidays = useMemo(() => getUpcomingHolidays(3), []);

  const garbageToday = useMemo(() => {
    const today = new Date();
    return garbageSchedule?.entries.filter((entry) => isGarbageCollectionOn(entry, today)) ?? [];
  }, [garbageSchedule]);

  const garbageTomorrow = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return garbageSchedule?.entries.filter((entry) => isGarbageCollectionOn(entry, tomorrow)) ?? [];
  }, [garbageSchedule]);

  const activePackages = useMemo(
    () => packages.filter((p) => p.status !== "delivered" && p.status !== "returned"),
    [packages],
  );

  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const moveDate = useMemo(
    () => new Date(`${settings.moveDate}T00:00:00+09:00`),
    [settings.moveDate],
  );
  const { dDay, isInJapan, days, hours, minutes, seconds } = useMemo(() => {
    const inJapan = isLivingMode(settings, now);
    const absDiff = inJapan
      ? Math.max(0, now.getTime() - moveDate.getTime())
      : Math.max(0, moveDate.getTime() - now.getTime());
    const d = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const h = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((absDiff % (1000 * 60)) / 1000);
    return {
      dDay: inJapan ? `+${d}` : `-${d}`,
      isInJapan: inJapan,
      days: d,
      hours: h,
      minutes: m,
      seconds: s,
    };
  }, [moveDate, now, settings]);

  const dashboardDateKey = dateKeyInTokyo(now);
  const todayActions = useMemo<TodayAction[]>(() => {
    const actions: TodayAction[] = [];
    const todayKey = dashboardDateKey;
    const today = new Date(`${todayKey}T12:00:00+09:00`);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = dateKeyInTokyo(tomorrow);
    const ingredientById = new Map((cookingOverview?.ingredients ?? []).map((ingredient) => [ingredient.id, ingredient]));

    const urgentFreshness = (cookingOverview?.freshness ?? []).filter((item) => item.status === "EXPIRED" || item.status === "TODAY");
    if (urgentFreshness.length > 0) {
      const names = urgentFreshness.map((item) => ingredientById.get(item.ingredientId)?.nameKo).filter(Boolean);
      actions.push({
        id: "freshness-urgent",
        title: `사용일을 확인할 재료 ${urgentFreshness.length}개`,
        detail: names.slice(0, 4).join(", ") || "Pantry에서 상태를 확인해 주세요.",
        href: "/cooking/pantry",
        icon: "⏳",
        tone: "urgent",
      });
    }

    if (garbageToday.length > 0) {
      actions.push({
        id: `garbage-${todayKey}`,
        title: `오늘 ${garbageToday.map((item) => item.label).join(", ")} 수거`,
        detail: "수거 당일 오전 8시까지 지정 장소에 배출해요.",
        href: "/garbage",
        icon: "🗑️",
        tone: "urgent",
      });
    }

    if (budgetTotal > 0 && budgetRemaining < 0) {
      actions.push({
        id: `budget-over-${currentMonth}`,
        title: `이번 달 예산을 ¥${Math.abs(budgetRemaining).toLocaleString("ko-KR")} 초과했어요`,
        detail: `지출 ¥${budgetSpent.toLocaleString("ko-KR")} · 예산 ¥${budgetTotal.toLocaleString("ko-KR")}`,
        href: "/expenses",
        icon: "💸",
        tone: "urgent",
      });
    } else if (budgetTotal > 0 && budgetSpent / budgetTotal >= 0.8) {
      actions.push({
        id: `budget-warning-${currentMonth}`,
        title: "이번 달 예산의 80% 이상을 사용했어요",
        detail: `남은 예산 ¥${budgetRemaining.toLocaleString("ko-KR")}`,
        href: "/expenses",
        icon: "💰",
        tone: "attention",
      });
    }

    upcomingMilestones.slice(0, 3).forEach((milestone) => {
      actions.push({
        id: `milestone-${milestone.id}`,
        title: milestone.label,
        detail: `${milestone.date === todayKey ? "오늘" : milestone.date.slice(5).replace("-", "/")} · ${milestone.concertTitle}`,
        href: `/concerts/${milestone.concertId}`,
        icon: "🎫",
        tone: milestone.date === todayKey ? "urgent" : "attention",
      });
    });

    if (garbageTomorrow.length > 0) {
      actions.push({
        id: `garbage-${tomorrowKey}`,
        title: `내일 ${garbageTomorrow.map((item) => item.label).join(", ")} 수거`,
        detail: "오늘 저녁에 미리 분리해 두세요.",
        href: "/garbage",
        icon: "♻️",
        tone: "attention",
      });
    }

    const soonFreshness = (cookingOverview?.freshness ?? []).filter((item) => item.status === "SOON");
    if (soonFreshness.length > 0) {
      const names = soonFreshness.map((item) => ingredientById.get(item.ingredientId)?.nameKo).filter(Boolean);
      actions.push({
        id: "freshness-soon",
        title: `먼저 사용하면 좋은 재료 ${soonFreshness.length}개`,
        detail: names.slice(0, 4).join(", "),
        href: "/cooking",
        icon: "🥬",
        tone: "attention",
      });
    }

    if (!mealPlanLoading) {
      const meals = (mealPlan?.items ?? []).filter((item) => item.date === todayKey);
      const dishById = new Map((cookingOverview?.recommendations ?? []).map((item) => [item.dish.id, item.dish]));
      if (meals.length === 0) {
        actions.push({
          id: `meal-empty-${todayKey}`,
          title: "오늘 식단이 아직 비어 있어요",
          detail: "Pantry 재료를 반영한 추천에서 점심과 저녁을 골라보세요.",
          href: "/cooking/planner",
          icon: "🍽️",
          tone: "attention",
        });
      } else {
        const mealNames = meals.map((item) => {
          const dish = dishById.get(item.dishId);
          return dish ? displayDishName(dish) : "등록된 메뉴";
        });
        actions.push({
          id: `meal-${todayKey}`,
          title: `오늘 식단 · ${mealNames.join(", ")}`,
          detail: meals.length < 2 ? "비어 있는 시간대의 메뉴도 정할 수 있어요." : "오늘 계획한 메뉴를 확인하세요.",
          href: "/cooking/planner",
          icon: "🍳",
          tone: "info",
        });
      }
    }

    const relevantChecklist = checklist.filter((item) => {
      if (item.checked || item.priority !== "high") return false;
      return !isLivingMode(settings, today) || item.category !== "pre-departure";
    });
    if (relevantChecklist.length > 0) {
      actions.push({
        id: "checklist-high",
        title: `중요 체크리스트 ${relevantChecklist.length}개 남음`,
        detail: relevantChecklist.slice(0, 2).map((item) => item.title).join(" · "),
        href: "/checklist",
        icon: "✅",
        tone: "info",
      });
    }

    if (activePackages.length > 0) {
      actions.push({
        id: "packages-active",
        title: `배송 중인 택배 ${activePackages.length}건`,
        detail: activePackages.slice(0, 2).map((item) => item.description).join(" · "),
        href: "/packages",
        icon: "📦",
        tone: "info",
      });
    }

    if (Number(todayKey.slice(8, 10)) === settings.payday) {
      actions.push({
        id: `payday-${todayKey}`,
        title: "오늘은 설정한 월급일이에요",
        detail: "입금 내역과 이번 달 예산을 확인해 보세요.",
        href: "/expenses",
        icon: "🏦",
        tone: "info",
      });
    }

    const order = { urgent: 0, attention: 1, info: 2 };
    return actions.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 10);
  }, [activePackages, budgetRemaining, budgetSpent, budgetTotal, checklist, cookingOverview, currentMonth, dashboardDateKey, garbageToday, garbageTomorrow, mealPlan, mealPlanLoading, settings, upcomingMilestones]);

  return (
    <div className="space-y-10">
      <div className="relative text-center py-6">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-pink-500/5 to-transparent rounded-2xl pointer-events-none" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 rounded-full blur-2xl opacity-60" />
            <Image
              src="/jp_logo_v2.png"
              alt="Japan Life"
              width={400}
              height={100}
              className="relative mx-auto h-28 sm:h-50 w-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              priority
            />
          </div>
          <p className="text-sm text-gray-500 tracking-widest uppercase font-medium">
            Dashboard
          </p>
        </div>
      </div>

      {/* D-day 타이머 */}
      <div className="relative rounded-2xl border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-sky-500/10" />
        <div className="relative px-5 py-6 text-center">
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-2">
            {isInJapan ? "일본 생활" : "도일까지"}
          </p>
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400">
              D{dDay}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {[
              { value: days, label: "일" },
              { value: hours, label: "시간" },
              { value: minutes, label: "분" },
              { value: seconds, label: "초" },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {isInJapan
              ? `${moveDate.toLocaleDateString("ko-KR")} 도일`
              : `${moveDate.toLocaleDateString("ko-KR")} 출발 예정`}
          </p>
          <Link href="/settings" className="mt-3 inline-flex items-center gap-1 text-[11px] text-gray-600 transition hover:text-purple-300">
            ⚙️ 생활 기준 변경
          </Link>
        </div>
      </div>

      <TodayActionCenter actions={todayActions} />

      {/* 요리 / 영수증 빠른 실행 */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/cooking" className="group rounded-xl border border-orange-400/15 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5 p-5 transition-all hover:border-orange-400/35 hover:bg-orange-500/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><span className="text-2xl">🍳</span><h3 className="font-semibold text-white">오늘의 요리</h3></div>
                <p className="mt-2 text-sm text-gray-400">보유 재료로 만들 수 있는 요리를 확인해요.</p>
                <p className="mt-3 text-xs text-orange-300">
                  {cookingLoading || !cookingOverview
                    ? "요리 추천 불러오는 중..."
                    : `바로 가능한 요리 ${cookingOverview.recommendations.filter((item) => item.canCookNow).length}개 · 보유 재료 ${cookingOverview.pantry.items.length}개`}
                </p>
              </div>
              <span className="text-orange-300 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <div className="rounded-xl border border-pink-400/15 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/5 p-5">
            <div className="flex items-center gap-2"><span className="text-2xl">🧾</span><h3 className="font-semibold text-white">영수증 추가</h3></div>
            <p className="mt-2 text-sm text-gray-400">일본 영수증을 읽어 원하는 곳에 반영해요.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/expenses/receipt" className="rounded-lg bg-pink-400 px-3 py-2.5 text-center text-xs font-semibold text-gray-950 transition hover:bg-pink-300">가계부에 추가</Link>
              <Link href="/cooking/receipt" className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2.5 text-center text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20">Pantry에 추가</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 날씨 위젯 */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-sky-500/10 via-transparent to-blue-500/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌤️</span>
          <span className="truncate text-sm font-medium text-gray-400">{weather?.locationLabel ?? settings.residenceLabel} 날씨</span>
          {weatherLoading && (
            <div className="w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin ml-auto" />
          )}
        </div>
        {weather ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{weatherCodeToEmoji(weather.current.weatherCode)}</span>
              <div>
                <div className="text-2xl font-bold text-white">{Math.round(weather.current.temperature)}°</div>
                <p className="text-xs text-gray-500">{weatherCodeToLabel(weather.current.weatherCode)} · 습도 {weather.current.humidity}%</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto flex-1 justify-end">
              {weather.daily.slice(1).map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-0.5 shrink-0">
                  <span className="text-[10px] text-gray-500">
                    {DAY_LABELS[new Date(day.date + "T00:00:00+09:00").getDay()]}
                  </span>
                  <span className="text-base">{weatherCodeToEmoji(day.weatherCode)}</span>
                  <span className="text-xs text-white font-mono">{Math.round(day.tempMax)}°</span>
                  <span className="text-[10px] text-gray-500 font-mono">{Math.round(day.tempMin)}°</span>
                  {day.precipitationProbability > 0 && (
                    <span className="text-[10px] text-sky-400">{day.precipitationProbability}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : !weatherLoading ? (
          <p className="text-gray-600 text-sm">날씨 정보를 불러올 수 없습니다</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/checklist">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 p-4 hover:border-emerald-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✅</span>
              <span className="text-sm font-medium text-gray-400">
                체크리스트
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {checklistPct}%
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 mb-2">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {checkedCount}/{totalChecklist} 완료
              {highPriorityLeft > 0 && (
                <span className="text-amber-400 ml-1">
                  ({highPriorityLeft} 중요)
                </span>
              )}
            </p>
          </div>
        </Link>

        <Link href="/expenses">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 p-4 hover:border-blue-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💰</span>
              <span className="text-sm font-medium text-gray-400">예산</span>
            </div>
            {budgetTotal > 0 ? (
              <>
                <div className="text-2xl font-bold text-white mb-1">
                  ¥{budgetRemaining.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  {monthSheetLoading
                    ? `${currentMonthLabel} 지출 불러오는 중...`
                    : `${currentMonthLabel} 지출 ¥${budgetSpent.toLocaleString()} / 예산 ¥${budgetTotal.toLocaleString()}`}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-600 mb-1">--</div>
                <p className="text-xs text-gray-500">예산을 설정해 주세요</p>
              </>
            )}
          </div>
        </Link>

        <Link href="/concerts">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 p-4 hover:border-purple-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎵</span>
              <span className="text-sm font-medium text-gray-400">콘서트</span>
            </div>
            {nextConcert ? (
              <>
                <div className="text-sm font-bold text-white mb-1 truncate">
                  {nextConcert.title}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {nextConcert.date} · {nextConcert.venue}
                </p>
                <p className="text-xs text-purple-400 mt-1">
                  {upcomingConcerts.length}개 예정
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-600 mb-1">
                  {concerts.length}
                </div>
                <p className="text-xs text-gray-500">
                  {concerts.length > 0
                    ? "기록된 콘서트"
                    : "콘서트를 추가해 주세요"}
                </p>
              </>
            )}
          </div>
        </Link>

        <Link href="/calculator#exchange-calculator">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 p-4 h-full hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💱</span>
                <span className="text-sm font-medium text-gray-400">환율</span>
              </div>
              {ratesLoading && (
                <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {ratesLoading || !liveRates ? (
              <div className="text-2xl font-bold text-gray-600 mb-1">--</div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">JPY/KRW</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {liveRates.krwJpy.toLocaleString("ko-KR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">USD/KRW</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {liveRates.krwUsd.toLocaleString("ko-KR", {
                      maximumFractionDigits: 1,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">USD/JPY</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {liveRates.jpyUsd.toLocaleString("ko-KR", {
                      maximumFractionDigits: 1,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* 공휴일 / 쓰레기 / 택배 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 공휴일 */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎌</span>
            <span className="text-sm font-medium text-gray-400">다가오는 공휴일</span>
          </div>
          {upcomingHolidays.length > 0 ? (
            <div className="space-y-1.5">
              {upcomingHolidays.map((h) => (
                <div key={h.date} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{h.nameKo}</p>
                    <p className="text-[10px] text-gray-500">{h.name}</p>
                  </div>
                  <span className="text-xs text-gray-500 font-mono shrink-0">{h.date.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">올해 남은 공휴일이 없습니다</p>
          )}
        </div>

        {/* 쓰레기 */}
        <Link href="/garbage">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-lime-500/10 p-4 hover:border-emerald-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🗑️</span>
              <span className="text-sm font-medium text-gray-400">쓰레기 수거</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">오늘</p>
                {garbageToday.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {garbageToday.map((g) => (
                      <span key={g.type} className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {g.icon} {g.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">수거 없음</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">내일</p>
                {garbageTomorrow.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {garbageTomorrow.map((g) => (
                      <span key={g.type} className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        {g.icon} {g.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">수거 없음</p>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* 택배 */}
        <Link href="/packages">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 p-4 hover:border-indigo-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📦</span>
              <span className="text-sm font-medium text-gray-400">택배</span>
            </div>
            {activePackages.length > 0 ? (
              <>
                <div className="text-2xl font-bold text-white mb-1">
                  {activePackages.length}건
                </div>
                <p className="text-xs text-gray-500">배송 진행 중</p>
                <div className="mt-2 space-y-1">
                  {activePackages.slice(0, 2).map((p) => (
                    <p key={p.id} className="text-xs text-indigo-400 truncate">
                      {p.description}
                    </p>
                  ))}
                  {activePackages.length > 2 && (
                    <p className="text-xs text-gray-500">+{activePackages.length - 2}건 더</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-600 mb-1">0</div>
                <p className="text-xs text-gray-500">추적 중인 택배 없음</p>
              </>
            )}
          </div>
        </Link>
      </div>

      {favorites.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">최신 발매</h2>
          {releasesLoading && (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!releasesLoading && newReleases.length > 0 && (
            <div className="space-y-2">
              {newReleases.map((track, i) => {
                const artworkUrl = getHighResArtwork(track.artworkUrl100, 120);
                const releaseDate = new Date(track.releaseDate);
                const isRecent =
                  DASHBOARD_RENDER_TIME - releaseDate.getTime() <
                  30 * 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={`${track.trackId}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={artworkUrl}
                        alt={track.trackName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">
                          {track.trackName}
                        </p>
                        {isRecent && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-pink-500/20 text-pink-300 shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        <Link
                          href={`/artists/${track.artistId}`}
                          className="hover:text-purple-400 transition-colors"
                        >
                          {track.artistName}
                        </Link>
                        {" · "}
                        {track.collectionName}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:block shrink-0">
                      {releaseDate.toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-gray-500 hidden md:block shrink-0">
                      {formatDuration(track.trackTimeMillis)}
                    </span>
                    <div className="shrink-0">
                      <MusicButton
                        trackName={track.trackName}
                        artistName={track.artistName}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!releasesLoading && newReleases.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              발매 정보가 없습니다.
            </p>
          )}
        </section>
      )}

      {favorites.length === 0 && (
        <section className="text-center py-10 rounded-xl border border-dashed border-white/10">
          <p className="text-gray-300 text-lg mb-2">
            아티스트 페이지에서 즐겨찾기를 추가해 주세요
          </p>
          <p className="text-gray-500 text-sm">
            <Link href="/artists" className="text-purple-400 hover:text-purple-300 transition-colors">
              /artists
            </Link>
            {" 에서 아티스트 검색과 즐겨찾기를 관리할 수 있습니다"}
          </p>
        </section>
      )}
    </div>
  );
}
