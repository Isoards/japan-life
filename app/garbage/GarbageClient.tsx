"use client";

import { useState } from "react";
import { useGarbageSchedule, mutateAPI } from "@/lib/hooks/use-api";
import {
  DAY_LABELS,
  getUpcomingGarbageCollections,
  isGarbageCollectionOn,
} from "@/lib/constants/garbage";

export default function GarbageClient() {
  const { data: schedule, isLoading } = useGarbageSchedule();
  const [saving, setSaving] = useState(false);

  const entries = schedule?.entries ?? [];

  const todayDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const today = todayDate.getDay();
  const tomorrow = tomorrowDate.getDay();

  const todayItems = entries.filter((entry) => isGarbageCollectionOn(entry, todayDate));
  const tomorrowItems = entries.filter((entry) => isGarbageCollectionOn(entry, tomorrowDate));
  const upcoming = getUpcomingGarbageCollections(entries);

  async function toggleDay(entryType: string, day: number) {
    if (!schedule) return;
    setSaving(true);
    const updated = schedule.entries.map((e) => {
      if (e.type !== entryType) return e;
      const has = e.dayOfWeek.includes(day);
      return {
        ...e,
        dayOfWeek: has
          ? e.dayOfWeek.filter((d) => d !== day)
          : [...e.dayOfWeek, day].sort(),
      };
    });
    await mutateAPI("/api/garbage", "POST", { ...schedule, entries: updated });
    setSaving(false);
  }

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">쓰레기 분리수거</h1>
        <p className="text-gray-500 text-sm">
          {schedule?.region ?? "수거 지역을 불러오는 중"}
          {saving && <span className="ml-2 text-purple-400">저장 중...</span>}
        </p>
      </div>

      {/* 오늘/내일 안내 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 p-4">
          <p className="text-sm font-medium text-gray-400 mb-2">오늘 ({DAY_LABELS[today]})</p>
          {todayItems.length > 0 ? (
            <div className="space-y-1">
              {todayItems.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-white text-sm">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.labelJa}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">수거 없음</p>
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 p-4">
          <p className="text-sm font-medium text-gray-400 mb-2">내일 ({DAY_LABELS[tomorrow]})</p>
          {tomorrowItems.length > 0 ? (
            <div className="space-y-1">
              {tomorrowItems.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-white text-sm">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.labelJa}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">수거 없음</p>
          )}
        </div>
      </div>

      {/* 공식 일정에서 계산한 다음 수거일 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white">다가오는 수거일</h2>
            <p className="mt-1 text-xs text-gray-500">
              令和8年度 공식 일정 · 모든 쓰레기는 수거 당일 오전 8시까지
            </p>
          </div>
          {schedule?.sourceUrl && (
            <a
              href={schedule.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              高根沢町 공식표 ↗
            </a>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {upcoming.map((collection) => {
            const date = new Date(`${collection.date}T00:00:00`);
            return (
              <div key={collection.date} className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-3">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-xs text-gray-500">{date.toLocaleDateString("ko-KR", { weekday: "short" })}</p>
                  <p className="font-mono text-sm font-semibold text-white">{collection.date.slice(5).replace("-", "/")}</p>
                </div>
                <div className="min-w-0 space-y-1">
                  {collection.entries.map((entry) => (
                    <p key={entry.type} className="text-sm text-gray-300">
                      <span className="mr-1.5">{entry.icon}</span>{entry.label}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 주간 스케줄 테이블 */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">종류</th>
                {DAY_LABELS.map((day, i) => (
                  <th
                    key={day}
                    className={`px-3 py-3 text-center font-medium ${
                      i === today ? "text-emerald-400" : i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.type} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{entry.icon}</span>
                      <div>
                        <p className="text-white">{entry.label}</p>
                        <p className="text-xs text-gray-500">{entry.labelJa}</p>
                      </div>
                    </div>
                  </td>
                  {DAY_LABELS.map((_, dayIdx) => {
                    const active = entry.dayOfWeek.includes(dayIdx);
                    const usesOfficialDates = Boolean(entry.collectionDates?.length);
                    return (
                      <td key={dayIdx} className="px-3 py-3 text-center">
                        <button
                          onClick={() => !usesOfficialDates && toggleDay(entry.type, dayIdx)}
                          disabled={usesOfficialDates}
                          title={usesOfficialDates ? "공식 지정일을 사용합니다" : "수거 요일 변경"}
                          className={`w-8 h-8 rounded-lg transition-all cursor-pointer ${
                            active
                              ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/50"
                              : "bg-white/5 text-gray-600 border border-white/10 hover:border-white/20"
                          } ${usesOfficialDates ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          {active ? (usesOfficialDates ? "지정" : "●") : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        공식 일정 유효기간: {schedule?.validThrough ?? "확인 필요"} · 이후 연도 일정은 高根沢町 공지를 다시 확인해야 합니다.
      </p>
    </div>
  );
}
