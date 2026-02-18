"use client";

import { useState } from "react";
import { useGarbageSchedule, mutateAPI } from "@/lib/hooks/use-api";
import { DAY_LABELS } from "@/lib/constants/garbage";

export default function GarbageClient() {
  const { data: schedule, isLoading } = useGarbageSchedule();
  const [saving, setSaving] = useState(false);

  const entries = schedule?.entries ?? [];

  const today = new Date().getDay();
  const tomorrow = (today + 1) % 7;

  const todayItems = entries.filter((e) => e.dayOfWeek.includes(today));
  const tomorrowItems = entries.filter((e) => e.dayOfWeek.includes(tomorrow));

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
          요일을 클릭해서 수거 스케줄을 설정하세요
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
                    return (
                      <td key={dayIdx} className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleDay(entry.type, dayIdx)}
                          className={`w-8 h-8 rounded-lg transition-all cursor-pointer ${
                            active
                              ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/50"
                              : "bg-white/5 text-gray-600 border border-white/10 hover:border-white/20"
                          }`}
                        >
                          {active ? "●" : ""}
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
        지역에 따라 수거 요일이 다를 수 있습니다. 실제 스케줄은 시구정촌 안내를 확인하세요.
      </p>
    </div>
  );
}
