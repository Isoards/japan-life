"use client";

import { useState } from "react";
import { mutate } from "swr";
import { useToast } from "@/components/Toast";
import { mutateAPI, useSettings } from "@/lib/hooks/use-api";
import type { LifeMode, UserSettings } from "@/lib/settings";

const MODE_OPTIONS: Array<{ value: LifeMode; label: string; description: string }> = [
  { value: "auto", label: "자동", description: "이주일을 기준으로 자동 전환" },
  { value: "preparation", label: "이주 준비", description: "출국 전 정보와 체크리스트 중심" },
  { value: "living", label: "일본 생활", description: "현재 생활 정보와 할 일 중심" },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();

  if (isLoading || !settings) {
    return <p className="py-20 text-center text-sm text-gray-500">개인 설정을 불러오는 중...</p>;
  }

  return <SettingsForm key={JSON.stringify(settings)} initialSettings={settings} />;
}

function SettingsForm({ initialSettings }: { initialSettings: UserSettings }) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const result = await mutateAPI<UserSettings>("/api/settings", "POST", form);
    if (result.ok) {
      await Promise.all([
        mutate("/api/settings", result.data, { revalidate: false }),
        mutate("/api/weather"),
      ]);
      toast("개인 설정을 저장했습니다.");
    } else {
      toast(result.error, "error");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">Personal</p>
        <h1 className="mt-1 text-3xl font-bold text-white">개인 설정</h1>
        <p className="mt-2 text-sm text-gray-400">대시보드의 생활 모드, 날짜와 날씨 위치를 관리합니다.</p>
      </header>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div>
          <h2 className="font-semibold text-white">생활 단계</h2>
          <p className="mt-1 text-xs text-gray-500">대시보드 문구와 오늘 할 체크리스트에 반영됩니다.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update("lifeMode", option.value)}
              className={`rounded-xl border p-4 text-left transition ${form.lifeMode === option.value ? "border-purple-400/50 bg-purple-500/15" : "border-white/10 bg-black/15 hover:bg-white/5"}`}
            >
              <span className="block text-sm font-semibold text-white">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">{option.description}</span>
            </button>
          ))}
        </div>
        <Field label="일본 이주일">
          <input type="date" value={form.moveDate} onChange={(event) => update("moveDate", event.target.value)} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div>
          <h2 className="font-semibold text-white">거주지와 날씨</h2>
          <p className="mt-1 text-xs text-gray-500">위도와 경도는 Open-Meteo 날씨 조회에 사용됩니다.</p>
        </div>
        <Field label="대시보드에 표시할 지역명">
          <input value={form.residenceLabel} maxLength={120} onChange={(event) => update("residenceLabel", event.target.value)} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="위도">
            <input type="number" step="0.000001" value={form.latitude} onChange={(event) => update("latitude", Number(event.target.value))} className={inputClass} />
          </Field>
          <Field label="경도">
            <input type="number" step="0.000001" value={form.longitude} onChange={(event) => update("longitude", Number(event.target.value))} className={inputClass} />
          </Field>
        </div>
        <p className="rounded-xl bg-sky-500/10 px-4 py-3 text-xs leading-5 text-sky-200">
          현재 기본값은 高根沢町宝石台의 대표 좌표입니다. 정확한 집 주소는 저장하지 않아도 됩니다.
        </p>
      </section>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div>
          <h2 className="font-semibold text-white">생활 기준</h2>
          <p className="mt-1 text-xs text-gray-500">추후 월급일 알림과 월간 정산 기준으로 사용할 값입니다.</p>
        </div>
        <Field label="월급일">
          <div className="relative max-w-40">
            <input type="number" min={1} max={31} value={form.payday} onChange={(event) => update("payday", Number(event.target.value))} className={`${inputClass} pr-10`} />
            <span className="absolute right-3 top-2.5 text-sm text-gray-500">일</span>
          </div>
        </Field>
        <p className="text-xs text-gray-600">시간대는 일본 표준시(Asia/Tokyo)로 고정됩니다.</p>
      </section>

      <button type="button" disabled={saving || !form.residenceLabel.trim()} onClick={save} className="min-h-12 w-full rounded-xl bg-purple-500 px-5 py-3 font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40">
        {saving ? "저장 중..." : "설정 저장"}
      </button>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-medium text-gray-400">{label}</span>{children}</label>;
}
