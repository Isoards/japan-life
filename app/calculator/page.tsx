"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SalaryBreakdown } from "@/lib/types";
import { calculateSalary, convertCurrency } from "@/lib/calculator";
import { useLiveExchangeRates } from "@/lib/hooks/use-api";

interface Subscription {
  id: string;
  name: string;
  price: number;
  day: number;
  color: string;
}

const SUB_COLORS = [
  "text-red-400",
  "text-blue-400",
  "text-green-400",
  "text-indigo-400",
  "text-yellow-400",
  "text-sky-400",
  "text-rose-400",
  "text-amber-400",
  "text-teal-400",
  "text-fuchsia-400",
];

const DEFAULT_SUBS: Subscription[] = [
  { id: "2", name: "쿠팡와우", price: 7890, day: 3, color: "text-blue-400" },
  { id: "7", name: "유튜브 프리미엄", price: 6300, day: 4, color: "text-rose-400" },
  { id: "3", name: "네이버플러스", price: 4900, day: 7, color: "text-green-400" },
  { id: "1", name: "LG알뜰", price: 1980, day: 9, color: "text-red-400" },
  { id: "6", name: "쿠팡플레이", price: 9900, day: 14, color: "text-sky-400" },
  { id: "4", name: "디스코드", price: 940, day: 17, color: "text-indigo-400" },
  { id: "5", name: "카카오 톡서랍", price: 990, day: 20, color: "text-yellow-400" },
];

const STORAGE_KEY = "kr-subscriptions";

function loadSubscriptions(): Subscription[] {
  if (typeof window === "undefined") return DEFAULT_SUBS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_SUBS;
}

type Tab = "salary" | "exchange";

export default function CalculatorPage() {
  const [tab, setTab] = useState<Tab>("salary");

  useEffect(() => {
    const syncTabFromHash = () => {
      if (window.location.hash === "#exchange-calculator") {
        setTab("exchange");
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          급여 · 환율 계산기
        </h1>
        <p className="text-gray-400 mt-1">
          일본 실수령 급여와 환율을 빠르게 계산합니다.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {(
          [
            { key: "salary", label: "💴 급여 계산기" },
            { key: "exchange", label: "💱 환율 계산기" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "salary" && <SalaryTab />}
      {tab === "exchange" && (
        <div id="exchange-calculator">
          <ExchangeTab />
        </div>
      )}
    </div>
  );
}

function SalaryTab() {
  const [monthly, setMonthly] = useState("270000");
  const [bonusMonths, setBonusMonths] = useState("6.9");

  const result: SalaryBreakdown | null = useMemo(() => {
    const m = parseInt(monthly, 10);
    const b = parseFloat(bonusMonths);
    if (Number.isNaN(m) || m <= 0) return null;
    if (Number.isNaN(b) || b < 0) return calculateSalary(m, 0);
    return calculateSalary(m, b);
  }, [monthly, bonusMonths]);

  const fmt = (n: number) => n.toLocaleString("ja-JP");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            월 기본급 (세전)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">¥</span>
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            보너스 개월수
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={bonusMonths}
              onChange={(e) => setBonusMonths(e.target.value)}
              className="w-28 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-gray-400 text-sm">(예: 6.9)</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10">
              <div className="text-sm text-gray-400">월 실수령액</div>
              <div className="text-3xl font-bold text-white mt-1">
                ¥{fmt(result.netMonthly)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                세전 ¥{fmt(result.grossMonthly)} 기준
              </div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10">
              <div className="text-sm text-gray-400">연 실수령 합계</div>
              <div className="text-3xl font-bold text-emerald-300 mt-1">
                ¥{fmt(result.netAnnual)}
              </div>
              <div className="text-xs text-gray-500 mt-1">보너스 포함 추정</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">
                월급 공제 내역
              </h3>
              {[
                {
                  label: "소득세 (所得税)",
                  value: result.incomeTax,
                  color: "bg-red-500",
                },
                {
                  label: "주민세 (住民税)",
                  value: result.residentTax,
                  color: "bg-orange-500",
                },
                {
                  label: "건강보험 (健康保険)",
                  value: result.healthInsurance,
                  color: "bg-blue-500",
                },
                {
                  label: "후생연금 (厚生年金)",
                  value: result.pension,
                  color: "bg-purple-500",
                },
                {
                  label: "고용보험 (雇用保険)",
                  value: result.employmentInsurance,
                  color: "bg-green-500",
                },
              ].map((item) => {
                const pct =
                  result.grossMonthly > 0
                    ? ((item.value / result.grossMonthly) * 100).toFixed(1)
                    : "0";
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${item.color} shrink-0`}
                    />
                    <span className="text-sm text-gray-300 flex-1">
                      {item.label}
                    </span>
                    <span className="text-sm text-gray-500">{pct}%</span>
                    <span className="text-sm font-mono text-white w-24 text-right">
                      ¥{fmt(item.value)}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <div className="w-2 h-2 shrink-0" />
                <span className="text-sm font-medium text-white flex-1">
                  총 공제액
                </span>
                <span className="text-sm text-gray-500">
                  {result.grossMonthly > 0
                    ? (
                        (result.totalDeductions / result.grossMonthly) *
                        100
                      ).toFixed(1)
                    : "0"}
                  %
                </span>
                <span className="text-sm font-mono font-medium text-pink-400 w-24 text-right">
                  ¥{fmt(result.totalDeductions)}
                </span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500">월급 배분</div>
              <div className="w-full h-4 rounded-full overflow-hidden flex">
                {[
                  { value: result.incomeTax, color: "bg-red-500" },
                  { value: result.residentTax, color: "bg-orange-500" },
                  { value: result.healthInsurance, color: "bg-blue-500" },
                  { value: result.pension, color: "bg-purple-500" },
                  { value: result.employmentInsurance, color: "bg-green-500" },
                  { value: result.netMonthly, color: "bg-emerald-400" },
                ].map((item, i) => {
                  const w =
                    result.grossMonthly > 0
                      ? (item.value / result.grossMonthly) * 100
                      : 0;
                  return (
                    <div
                      key={i}
                      className={`${item.color} h-full`}
                      style={{ width: `${w}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">공제</span>
                <span className="text-emerald-400">실수령</span>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              * 2025~2026년 기준 근사 계산입니다. 실제 금액은 회사/지역에 따라
              다를 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ExchangeTab() {
  const {
    data: rateData,
    isLoading: rateLoading,
    mutate: refreshRateSWR,
  } = useLiveExchangeRates();
  const [rateOverride, setRateOverride] = useState<string | null>(null);
  const [amount, setAmount] = useState("100000");
  const [direction, setDirection] = useState<"krw-to-jpy" | "jpy-to-krw">(
    "jpy-to-krw",
  );

  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(DEFAULT_SUBS);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", day: "" });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", price: "", day: "" });

  useEffect(() => {
    setSubscriptions(loadSubscriptions());
  }, []);

  const saveSubs = useCallback((subs: Subscription[]) => {
    setSubscriptions(subs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  }, []);

  const deleteSub = (id: string) => {
    saveSubs(subscriptions.filter((s) => s.id !== id));
  };

  const startEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setEditForm({
      name: sub.name,
      price: String(sub.price),
      day: String(sub.day),
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const price = parseInt(editForm.price, 10);
    const day = parseInt(editForm.day, 10);
    if (
      !editForm.name.trim() ||
      isNaN(price) ||
      price <= 0 ||
      isNaN(day) ||
      day < 1 ||
      day > 31
    )
      return;
    saveSubs(
      subscriptions.map((s) =>
        s.id === editingId
          ? { ...s, name: editForm.name.trim(), price, day }
          : s,
      ),
    );
    setEditingId(null);
  };

  const addSub = () => {
    const price = parseInt(addForm.price, 10);
    const day = parseInt(addForm.day, 10);
    if (
      !addForm.name.trim() ||
      isNaN(price) ||
      price <= 0 ||
      isNaN(day) ||
      day < 1 ||
      day > 31
    )
      return;
    const newSub: Subscription = {
      id: Date.now().toString(),
      name: addForm.name.trim(),
      price,
      day,
      color: SUB_COLORS[subscriptions.length % SUB_COLORS.length],
    };
    saveSubs([...subscriptions, newSub]);
    setAddForm({ name: "", price: "", day: "" });
    setAdding(false);
  };

  const totalSub = subscriptions.reduce((s, i) => s + i.price, 0);

  const rate =
    rateOverride ?? (rateData?.krwJpy ? String(rateData.krwJpy) : "");
  const lastUpdated =
    rateData && !rateData.fallback
      ? new Date().toLocaleTimeString("ko", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  const rateVal = parseFloat(rate) || 0;
  const amountVal = parseInt(amount, 10) || 0;
  const converted =
    rateVal > 0 ? convertCurrency(amountVal, rateVal, direction) : 0;

  const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">환율 (100엔 당 원화)</label>
          <button
            onClick={() => {
              setRateOverride(null);
              refreshRateSWR();
            }}
            disabled={rateLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            {rateLoading ? (
              <div className="w-3 h-3 border border-blue-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            실시간 환율
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">₩</span>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRateOverride(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
          />
          <span className="text-gray-500 text-sm">/ ¥100</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {lastUpdated
            ? `실시간 환율 반영됨 (${lastUpdated} 기준) · 수동 수정 가능`
            : "실시간 환율을 불러오는 중... 직접 입력도 가능합니다"}
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        <button
          onClick={() => setDirection("jpy-to-krw")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            direction === "jpy-to-krw"
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ¥ JPY → ₩ KRW
        </button>
        <button
          onClick={() => setDirection("krw-to-jpy")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            direction === "krw-to-jpy"
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ₩ KRW → ¥ JPY
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            {direction === "jpy-to-krw" ? "일본 엔 (¥)" : "한국 원 (₩)"}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">
              {direction === "jpy-to-krw" ? "¥" : "₩"}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(direction === "jpy-to-krw"
            ? [10000, 50000, 100000, 270000, 500000]
            : [100000, 500000, 1000000, 3000000, 5000000]
          ).map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="px-3 py-1 rounded-lg text-xs bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              {direction === "jpy-to-krw" ? "¥" : "₩"}
              {fmt(v)}
            </button>
          ))}
        </div>

        <div className="text-center p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10">
          <div className="text-sm text-gray-400">변환 결과</div>
          <div className="text-3xl font-bold text-white mt-1">
            {direction === "jpy-to-krw" ? "₩" : "¥"}
            {fmt(converted)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            기준 환율: ₩{rate || "-"} / ¥100
          </div>
        </div>

        <p className="text-xs text-gray-600">
          * 실시간 환율이 없으면 마지막 값 또는 수동 입력값을 사용합니다.
        </p>
      </div>

      {/* 한국 월정액 구독 */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">
            한국 월정액 구독
          </h3>
          <button
            onClick={() => {
              setEditing(!editing);
              setEditingId(null);
              setAdding(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              editing
                ? "bg-purple-500/20 text-purple-300"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {editing ? "완료" : "편집"}
          </button>
        </div>

        <div className="space-y-1.5">
          {[...subscriptions].sort((a, b) => a.day - b.day).map((sub) =>
            editingId === sub.id ? (
              <div
                key={sub.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10"
              >
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="이름"
                  className="flex-1 min-w-0 px-2 py-1 rounded bg-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 border border-white/10"
                />
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                  placeholder="금액"
                  className="w-20 px-2 py-1 rounded bg-white/10 text-white text-sm font-mono focus:outline-none focus:border-purple-500/50 border border-white/10"
                />
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editForm.day}
                  onChange={(e) =>
                    setEditForm({ ...editForm, day: e.target.value })
                  }
                  placeholder="일"
                  className="w-12 px-2 py-1 rounded bg-white/10 text-white text-sm font-mono focus:outline-none focus:border-purple-500/50 border border-white/10"
                />
                <span className="text-xs text-gray-500">일</span>
                <button
                  onClick={saveEdit}
                  className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-2 py-1 rounded bg-white/5 text-gray-400 text-xs hover:text-white"
                >
                  취소
                </button>
              </div>
            ) : (
              <div key={sub.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (editing) {
                      startEdit(sub);
                    } else {
                      setDirection("krw-to-jpy");
                      setAmount(String(sub.price));
                    }
                  }}
                  className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${sub.color}`}>
                      {sub.name}
                    </span>
                    <span className="text-xs text-gray-600">
                      매월 {sub.day}일
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-100">
                      ₩{sub.price.toLocaleString("ko-KR")}
                    </span>
                    {rateVal > 0 && (
                      <span className="text-sm text-gray-500">
                        ≈ ¥{fmt(Math.round((sub.price * 100) / rateVal))}
                      </span>
                    )}
                  </div>
                </button>
                {editing && (
                  <button
                    onClick={() => deleteSub(sub.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ),
          )}
        </div>

        {/* 추가 폼 */}
        {editing && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-2 rounded-lg border border-dashed border-white/10 text-sm text-gray-500 hover:text-white hover:border-white/20 transition-colors"
          >
            + 구독 추가
          </button>
        )}
        {adding && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10">
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="이름"
              className="flex-1 min-w-0 px-2 py-1 rounded bg-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 border border-white/10"
            />
            <input
              type="number"
              value={addForm.price}
              onChange={(e) =>
                setAddForm({ ...addForm, price: e.target.value })
              }
              placeholder="금액(₩)"
              className="w-20 px-2 py-1 rounded bg-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 border border-white/10"
            />
            <input
              type="number"
              min="1"
              max="31"
              value={addForm.day}
              onChange={(e) => setAddForm({ ...addForm, day: e.target.value })}
              placeholder="일"
              className="w-12 px-2 py-1 rounded bg-white/10 text-white text-sm font-mono focus:outline-none focus:border-purple-500/50 border border-white/10"
            />
            <span className="text-xs text-gray-500">일</span>
            <button
              onClick={addSub}
              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30"
            >
              추가
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setAddForm({ name: "", price: "", day: "" });
              }}
              className="px-2 py-1 rounded bg-white/5 text-gray-400 text-xs hover:text-white"
            >
              취소
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              setDirection("krw-to-jpy");
              setAmount(String(totalSub));
            }}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            전체 합계로 계산하기
          </button>
          <div className="flex items-center gap-2">
            <span className="text-m font-bold text-purple-400">
              ₩{totalSub.toLocaleString("ko-KR")}
            </span>
            <span className="text-m font-bold text-red-400">≈</span>
            {rateVal > 0 && (
              <span className="text-m font-bold text-red-400">
                ¥{fmt(Math.round((totalSub * 100) / rateVal))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
