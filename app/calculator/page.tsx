"use client";

import { useState, useEffect } from "react";
import type { SalaryBreakdown } from "@/lib/types";
import { calculateSalary, convertCurrency } from "@/lib/calculator";
import { useExchangeRate } from "@/lib/hooks/use-api";

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
          급여 & 환율 계산기
        </h1>
        <p className="text-gray-400 mt-1">
          일본 급여 실수령액, 환율 계산
        </p>
      </div>

      {/* Tabs */}
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

/* ──────────── 급여 계산기 ──────────── */
function SalaryTab() {
  const [monthly, setMonthly] = useState<string>("270000");
  const [bonusMonths, setBonusMonths] = useState<string>("6.9");
  const [result, setResult] = useState<SalaryBreakdown | null>(null);

  useEffect(() => {
    const m = parseInt(monthly);
    const b = parseFloat(bonusMonths);
    if (!isNaN(m) && m > 0 && !isNaN(b) && b >= 0) {
      setResult(calculateSalary(m, b));
    } else if (!isNaN(m) && m > 0) {
      setResult(calculateSalary(m, 0));
    } else {
      setResult(null);
    }
  }, [monthly, bonusMonths]);

  const fmt = (n: number) => n.toLocaleString("ja-JP");

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            월 기본급 (月給, 세전)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">¥</span>
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
              placeholder="250000"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {[180000, 200000, 250000, 300000, 350000].map((v) => (
              <button
                key={v}
                onClick={() => setMonthly(String(v))}
                className="px-3 py-1 rounded-lg text-xs bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                ¥{fmt(v)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            보너스 (賞与, 몇 개월분)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min="0"
              value={bonusMonths}
              onChange={(e) => setBonusMonths(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
              placeholder="2"
            />
            <span className="text-gray-400 text-sm">
              개월분 (연 2회 지급 가정)
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {[0, 1, 2, 3, 4].map((v) => (
              <button
                key={v}
                onClick={() => setBonusMonths(String(v))}
                className="px-3 py-1 rounded-lg text-xs bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                {v}개월
              </button>
            ))}
          </div>
        </div>
        {result && (
          <div className="text-xs text-gray-500 pt-2 border-t border-white/10">
            연봉 환산: ¥{fmt(result.grossAnnual)} (월급 ¥
            {fmt(result.grossMonthly)} x {12 + result.bonusMonths}개월)
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Monthly + Bonus highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10">
              <div className="text-sm text-gray-400">월 실수령액 (手取り)</div>
              <div className="text-3xl font-bold text-white mt-1">
                ¥{fmt(result.netMonthly)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                월급 ¥{fmt(result.grossMonthly)} 중 ¥
                {fmt(result.totalDeductions)} 공제
              </div>
            </div>
            {result.bonusMonths > 0 && (
              <div className="text-center p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10">
                <div className="text-sm text-gray-400">
                  보너스 실수령액 (1회)
                </div>
                <div className="text-3xl font-bold text-white mt-1">
                  ¥{fmt(result.bonusNetPerPayment)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  세전 ¥{fmt(result.bonusGrossPerPayment)} / 연 2회
                </div>
              </div>
            )}
          </div>

          {/* Annual summary */}
          <div className="text-center p-3 rounded-xl border border-white/10 bg-white/5">
            <span className="text-sm text-gray-400">연간 실수령 합계: </span>
            <span className="text-lg font-bold text-emerald-400">
              ¥{fmt(result.netAnnual)}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              (월 ¥{fmt(result.netMonthly)} x 12
              {result.bonusMonths > 0 &&
                ` + 보너스 ¥${fmt(result.bonusNetPerPayment)} x 2`}
              )
            </span>
          </div>

          {/* Deduction breakdown */}
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

/* ──────────── 환율 계산기 ──────────── */
function ExchangeTab() {
  const { data: rateData, isLoading: rateLoading, mutate: refreshRateSWR } = useExchangeRate();
  const [rateOverride, setRateOverride] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("100000");
  const [direction, setDirection] = useState<"krw-to-jpy" | "jpy-to-krw">(
    "jpy-to-krw",
  );

  const rate = rateOverride ?? (rateData?.rate ? String(rateData.rate) : "");
  const lastUpdated = rateData && !rateData.fallback
    ? new Date().toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit" })
    : null;

  const rateVal = parseFloat(rate) || 0;
  const amountVal = parseInt(amount) || 0;
  const converted =
    rateVal > 0 ? convertCurrency(amountVal, rateVal, direction) : 0;

  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Rate input */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">환율 (100엔 당 원화)</label>
          <button
            onClick={() => { setRateOverride(null); refreshRateSWR(); }}
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

      {/* Direction toggle */}
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

      {/* Amount input & result */}
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

        {/* Quick amounts */}
        <div className="flex flex-wrap gap-2">
          {(direction === "jpy-to-krw"
            ? [10000, 50000, 100000, 300000, 500000]
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

        {/* Result */}
        <div className="text-center p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10">
          <div className="text-sm text-gray-400">변환 결과</div>
          <div className="text-3xl font-bold text-white mt-1">
            {direction === "jpy-to-krw" ? "₩" : "¥"}
            {fmt(converted)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {direction === "jpy-to-krw"
              ? `¥${fmt(amountVal)} → ₩${fmt(converted)} (¥100 = ₩${rate})`
              : `₩${fmt(amountVal)} → ¥${fmt(converted)} (¥100 = ₩${rate})`}
          </div>
        </div>
      </div>

      {/* Common conversions */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          자주 쓰는 금액
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "편의점 도시락", jpy: 500 },
            { label: "라멘 한 그릇", jpy: 900 },
            { label: "전철 기본요금", jpy: 200 },
            { label: "100엔숍", jpy: 110 },
            { label: "월세 (토치기)", jpy: 45000 },
            { label: "휴대폰 요금", jpy: 3000 },
          ].map((item) => (
            <div
              key={item.label}
              className="p-2 rounded-lg bg-white/5 text-center"
            >
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-sm text-white font-mono">
                ¥{fmt(item.jpy)}
              </div>
              <div className="text-xs text-purple-400 font-mono">
                ≈ ₩{fmt(Math.round((item.jpy * rateVal) / 100))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
