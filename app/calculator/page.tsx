"use client";

import { useEffect, useMemo, useState } from "react";
import type { SalaryBreakdown } from "@/lib/types";
import { calculateSalary, convertCurrency } from "@/lib/calculator";
import { useLiveExchangeRates } from "@/lib/hooks/use-api";

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
        <p className="text-gray-400 mt-1">일본 실수령 급여와 환율을 빠르게 계산합니다.</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {([
          { key: "salary", label: "💴 급여 계산기" },
          { key: "exchange", label: "💱 환율 계산기" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
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
          <label className="block text-sm text-gray-400 mb-2">월 기본급 (세전)</label>
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
          <label className="block text-sm text-gray-400 mb-2">보너스 개월수</label>
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
              <div className="text-3xl font-bold text-white mt-1">¥{fmt(result.netMonthly)}</div>
              <div className="text-xs text-gray-500 mt-1">세전 ¥{fmt(result.grossMonthly)} 기준</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10">
              <div className="text-sm text-gray-400">연 실수령 합계</div>
              <div className="text-3xl font-bold text-emerald-300 mt-1">¥{fmt(result.netAnnual)}</div>
              <div className="text-xs text-gray-500 mt-1">보너스 포함 추정</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">월 공제 내역</h3>
            {[
              ["소득세", result.incomeTax],
              ["주민세", result.residentTax],
              ["건강보험", result.healthInsurance],
              ["연금", result.pension],
              ["고용보험", result.employmentInsurance],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-mono text-white">¥{fmt(Number(val))}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-sm">
              <span className="text-gray-300 font-medium">총 공제</span>
              <span className="font-mono text-pink-400 font-bold">¥{fmt(result.totalDeductions)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExchangeTab() {
  const { data: rateData, isLoading: rateLoading, mutate: refreshRateSWR } = useLiveExchangeRates();
  const [rateOverride, setRateOverride] = useState<string | null>(null);
  const [amount, setAmount] = useState("100000");
  const [direction, setDirection] = useState<"krw-to-jpy" | "jpy-to-krw">("jpy-to-krw");

  const rate = rateOverride ?? (rateData?.krwJpy ? String(rateData.krwJpy) : "");
  const rateVal = parseFloat(rate) || 0;
  const amountVal = parseInt(amount, 10) || 0;
  const converted = rateVal > 0 ? convertCurrency(amountVal, rateVal, direction) : 0;

  const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">환율 (100엔 기준)</label>
          <button
            onClick={() => {
              setRateOverride(null);
              refreshRateSWR();
            }}
            disabled={rateLoading}
            className="px-3 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
          >
            {rateLoading ? "불러오는 중..." : "실시간 갱신"}
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
      </div>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        <button
          onClick={() => setDirection("jpy-to-krw")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            direction === "jpy-to-krw" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          ¥ → ₩
        </button>
        <button
          onClick={() => setDirection("krw-to-jpy")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            direction === "krw-to-jpy" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          ₩ → ¥
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{direction === "jpy-to-krw" ? "¥" : "₩"}</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
          />
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
    </div>
  );
}
