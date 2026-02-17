"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHighResArtwork, formatDuration } from "@/lib/itunes";
import { getUpcomingMilestones } from "@/lib/milestoneUtils";
import MusicButton from "@/components/MusicButton";
import FavoriteButton from "@/components/FavoriteButton";
import {
  useFavorites,
  useChecklist,
  useConcerts,
  useBudget,
  useReleases,
  useSearch,
  useLiveExchangeRates,
  useSheetsSummary,
  useWeather,
  useGarbageSchedule,
  usePackages,
} from "@/lib/hooks/use-api";
import { getUpcomingHolidays } from "@/lib/constants/holidays";
import { weatherCodeToEmoji, weatherCodeToLabel } from "@/lib/weather";
import { DAY_LABELS } from "@/lib/constants/garbage";

const DASHBOARD_RENDER_TIME = Date.now();

export default function DashboardClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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
  const { data: searchResults = [], isLoading: searching } =
    useSearch(debouncedQuery);

  useEffect(() => {
    const nextQuery = searchQuery.trim();
    const timer = setTimeout(
      () => setDebouncedQuery(nextQuery.length >= 2 ? nextQuery : ""),
      400,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    const spent = currentMonthSheet
      ? (budget?.categories ?? []).reduce((sum, category) => {
          const sheetKeys = category.sheetCategories ?? [];
          const categorySpent = sheetKeys.reduce(
            (acc, key) => acc + (currentMonthSheet.byCategory?.[key] ?? 0),
            0,
          );
          return sum + categorySpent;
        }, 0)
      : 0;
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

  const upcomingHolidays = useMemo(() => getUpcomingHolidays(3), []);

  const garbageToday = useMemo(() => {
    const today = new Date().getDay();
    return garbageSchedule?.entries.filter((e) => e.dayOfWeek.includes(today)) ?? [];
  }, [garbageSchedule]);

  const garbageTomorrow = useMemo(() => {
    const tomorrow = (new Date().getDay() + 1) % 7;
    return garbageSchedule?.entries.filter((e) => e.dayOfWeek.includes(tomorrow)) ?? [];
  }, [garbageSchedule]);

  const activePackages = useMemo(
    () => packages.filter((p) => p.status !== "delivered" && p.status !== "returned"),
    [packages],
  );

  const DEPARTURE_DATE = new Date("2026-03-18T00:00:00+09:00");

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { dDay, isInJapan, days, hours, minutes, seconds } = useMemo(() => {
    const diff = DEPARTURE_DATE.getTime() - now.getTime();
    const inJapan = diff <= 0;
    const absDiff = Math.abs(diff);
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
  }, [now]);

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
              ? `${DEPARTURE_DATE.toLocaleDateString("ko-KR")} 도일`
              : `${DEPARTURE_DATE.toLocaleDateString("ko-KR")} 출발 예정`}
          </p>
        </div>
      </div>

      {/* 날씨 위젯 */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-sky-500/10 via-transparent to-blue-500/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌤️</span>
          <span className="text-sm font-medium text-gray-400">도치기현 날씨</span>
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

      {/* 이번 주 마감 카드 */}
      {upcomingMilestones.length > 0 && (
        <Link href="/concerts">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-rose-500/10 via-transparent to-amber-500/10 p-4 hover:border-rose-500/30 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <span className="text-sm font-medium text-gray-400">
                이번 주 마감
              </span>
              <span className="ml-auto text-xs text-rose-400">
                {upcomingMilestones.length}건
              </span>
            </div>
            <div className="space-y-2">
              {upcomingMilestones.slice(0, 3).map((ms) => (
                <div
                  key={ms.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{ms.label}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {ms.concertTitle}
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-mono shrink-0">
                    {ms.date.slice(5)}
                  </span>
                </div>
              ))}
              {upcomingMilestones.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{upcomingMilestones.length - 3}건 더
                </p>
              )}
            </div>
          </div>
        </Link>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="아티스트를 검색하세요... (예: Official髭男dism, LiSA, King Gnu)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {(searching || searchResults.length > 0) && searchQuery.length >= 2 && (
          <div className="mt-2 rounded-xl bg-gray-900/95 border border-white/10 overflow-hidden shadow-2xl">
            {searching && (
              <div className="p-4 text-center">
                <div className="inline-block w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!searching && searchResults.length > 0 && (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((artist) => (
                  <div
                    key={artist.itunesId}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <Link
                      href={`/artists/${artist.itunesId}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                        {artist.imageUrl ? (
                          <Image
                            src={artist.imageUrl}
                            alt={artist.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm">
                            {artist.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {artist.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {artist.genres.join(", ")}
                        </p>
                      </div>
                    </Link>
                    <FavoriteButton
                      artist={{
                        itunesId: artist.itunesId,
                        name: artist.name,
                        imageUrl: artist.imageUrl,
                        genres: artist.genres,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {!searching &&
              searchResults.length === 0 &&
              searchQuery.length >= 2 && (
                <p className="p-4 text-sm text-gray-500 text-center">
                  아티스트를 찾을 수 없습니다
                </p>
              )}
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">♥ 즐겨찾기</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {favorites.map((fav) => (
              <Link key={fav.itunesId} href={`/artists/${fav.itunesId}`}>
                <div className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-pink-500/30 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 relative">
                    {fav.imageUrl ? (
                      <Image
                        src={fav.imageUrl}
                        alt={fav.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xl">
                        {fav.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white text-center truncate group-hover:text-pink-400 transition-colors">
                    {fav.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
            위에서 아티스트를 검색하고 즐겨찾기에 추가하세요
          </p>
          <p className="text-gray-500 text-sm">
            최신 발매 정보가 여기에 표시됩니다
          </p>
        </section>
      )}
    </div>
  );
}
