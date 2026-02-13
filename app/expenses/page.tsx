"use client";

import { useState, useEffect } from "react";
import type { BudgetCategory, BudgetPeriod } from "@/lib/types";
import {
  getDefaultBudget,
  getBudgetByPeriod,
  BUDGET_PERIOD_LABELS,
  BUDGET_PERIOD_INCOME,
} from "@/lib/calculator";
import { useBudget, useSheetsSummary, mutateAPI } from "@/lib/hooks/use-api";

type Tab = "budget" | "sheet";
const ALL_PERIODS: BudgetPeriod[] = ["apr-jul", "aug-dec", "year2"];

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("budget");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          가계부
        </h1>
        <p className="text-gray-400 mt-1">
          예산 관리 & Google Sheets 가계부 연동
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {([
          { key: "budget", label: "🏠 예산 플래너" },
          { key: "sheet", label: "📊 가계부 시트" },
        ] as const).map((t) => (
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

      {tab === "budget" && <BudgetTab />}
      {tab === "sheet" && <SheetTab />}
    </div>
  );
}

/* ──────────── 예산 플래너 ──────────── */
function BudgetTab() {
  const { data: budgetData, isLoading } = useBudget();
  const [period, setPeriod] = useState<BudgetPeriod>("apr-jul");
  const [categories, setCategories] = useState<BudgetCategory[]>(getDefaultBudget());
  const [income, setIncome] = useState<string>("270000");
  const [initialized, setInitialized] = useState(false);

  // 월 선택 (Sheets 연동)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const { data: sheetData, isLoading: sheetsLoading } = useSheetsSummary(selectedMonth);

  useEffect(() => {
    if (!budgetData || initialized) return;
    if (budgetData.categories.length > 0) {
      // 저장된 데이터에 sheetCategories가 없을 수 있으므로 프리셋에서 병합
      const preset = getBudgetByPeriod(budgetData.period || "apr-jul");
      const merged = budgetData.categories.map((cat: BudgetCategory) => {
        if (cat.sheetCategories) return cat;
        const match = preset.find((p) => p.id === cat.id);
        return { ...cat, sheetCategories: match?.sheetCategories ?? [] };
      });
      setCategories(merged);
    }
    if (budgetData.income > 0) setIncome(String(budgetData.income));
    if (budgetData.period) setPeriod(budgetData.period);
    setInitialized(true);
  }, [budgetData, initialized]);

  const save = async (cats: BudgetCategory[], inc: string, p: BudgetPeriod) => {
    const incVal = parseInt(inc) || 0;
    await mutateAPI("/api/budget", "POST", {
      income: incVal,
      categories: cats,
      period: p,
    });
  };

  const switchPeriod = (p: BudgetPeriod) => {
    setPeriod(p);
    const newCats = getBudgetByPeriod(p);
    const newIncome = String(BUDGET_PERIOD_INCOME[p]);
    setCategories(newCats);
    setIncome(newIncome);
    save(newCats, newIncome, p);
  };

  const updateAmount = (id: string, amount: number) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, amount } : c));
    setCategories(updated);
    save(updated, income, period);
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const getActual = (cat: BudgetCategory): number => {
    if (!sheetData || !cat.sheetCategories) return 0;
    return cat.sheetCategories.reduce(
      (sum, sc) => sum + (sheetData.byCategory[sc] || 0),
      0,
    );
  };

  const incomeVal = parseInt(income) || 0;
  const totalBudget = categories.reduce((sum, c) => sum + c.amount, 0);
  const totalActual = sheetData
    ? categories.reduce((sum, c) => sum + getActual(c), 0)
    : 0;
  const fmt = (n: number) => n.toLocaleString("ja-JP");
  const monthLabel = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return `${y}년 ${m}월`;
  })();

  if (isLoading) {
    return <div className="text-gray-400 py-10 text-center">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {ALL_PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => switchPeriod(p)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              period === p
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {BUDGET_PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Period description */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-4">
        <div className="text-sm text-gray-300">
          {period === "apr-jul" && "연수/실습 기간. 8월 차량 구입을 위해 절약 목표"}
          {period === "aug-dec" && "본배속 + 차량 구입. 기존 저축액을 유지비로 전환"}
          {period === "year2" && "안정기. 부양공제 환급금 연 +23만엔 포함"}
        </div>
      </div>

      {/* Month selector + Income */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm text-gray-400 mb-2">조회 월 (Sheets 연동)</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftMonth(-1)}
              className="px-3 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/15 transition-colors"
            >
              &lt;
            </button>
            <span className="flex-1 text-center text-white font-medium">
              {monthLabel}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              className="px-3 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/15 transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm text-gray-400 mb-2">월 수입 (실수령액, 엔)</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">¥</span>
            <input
              type="number"
              value={income}
              onChange={(e) => {
                setIncome(e.target.value);
                save(categories, e.target.value, period);
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-xs text-gray-500">수입</div>
          <div className="text-lg font-bold text-white">¥{fmt(incomeVal)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-xs text-gray-500">예산 합계</div>
          <div className="text-lg font-bold text-purple-400">¥{fmt(totalBudget)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-xs text-gray-500">실제 지출</div>
          <div className="text-lg font-bold text-pink-400">
            {sheetsLoading ? (
              <span className="text-gray-500">...</span>
            ) : (
              `¥${fmt(totalActual)}`
            )}
          </div>
        </div>
        <div
          className={`rounded-xl border p-4 text-center ${
            incomeVal - totalActual >= 0
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-red-500/20 bg-red-500/5"
          }`}
        >
          <div className="text-xs text-gray-500">잔액 (실제)</div>
          <div
            className={`text-lg font-bold ${
              incomeVal - totalActual >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {sheetsLoading ? (
              <span className="text-gray-500">...</span>
            ) : (
              `¥${fmt(incomeVal - totalActual)}`
            )}
          </div>
        </div>
      </div>

      {/* Sheets income info */}
      {sheetData && sheetData.totalIncome > 0 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center justify-between">
          <span className="text-sm text-blue-300">
            Sheets {monthLabel} 수입 합계
          </span>
          <span className="text-sm font-bold text-blue-400">
            ¥{fmt(sheetData.totalIncome)}
          </span>
        </div>
      )}

      {/* Progress bar */}
      {totalBudget > 0 && (
        <div className="space-y-1">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative">
            {/* 예산 기준선 */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500/30 to-purple-500/20 absolute"
              style={{ width: "100%" }}
            />
            {/* 실제 지출 */}
            <div
              className={`h-full rounded-full transition-all duration-300 absolute ${
                totalActual > totalBudget
                  ? "bg-gradient-to-r from-red-500 to-red-400"
                  : "bg-gradient-to-r from-pink-500 to-purple-500"
              }`}
              style={{
                width: `${Math.min((totalActual / totalBudget) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>실제 {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(0) : 0}%</span>
            <span>예산 ¥{fmt(totalBudget)}</span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="space-y-2">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 px-3 py-2 text-xs text-gray-500">
          <span />
          <span>카테고리</span>
          <span className="text-right">예산</span>
          <span className="text-right">실제</span>
          <span className="text-right">차이</span>
        </div>
        {categories.map((cat) => {
          const actual = getActual(cat);
          const diff = cat.amount - actual;
          const overBudget = cat.amount > 0 && actual > cat.amount;
          return (
            <div
              key={cat.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 items-center p-3 rounded-lg border border-white/10 bg-white/5"
            >
              <span className="text-lg shrink-0">{cat.icon}</span>
              <div className="min-w-0">
                <span className="text-sm text-gray-300 truncate block">
                  {cat.label}
                </span>
                {cat.sheetCategories?.length > 0 && (
                  <span className="text-[10px] text-gray-600 truncate block">
                    {cat.sheetCategories.join(", ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-gray-500 text-xs">¥</span>
                <input
                  type="number"
                  value={cat.amount}
                  onChange={(e) =>
                    updateAmount(cat.id, parseInt(e.target.value) || 0)
                  }
                  className="w-[72px] px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-mono text-right focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <span className="text-sm font-mono text-pink-400 w-[72px] text-right shrink-0">
                {sheetsLoading ? "..." : `¥${fmt(actual)}`}
              </span>
              <span
                className={`text-sm font-mono w-[80px] text-right shrink-0 ${
                  overBudget ? "text-red-400" : diff >= 0 ? "text-emerald-400" : "text-gray-500"
                }`}
              >
                {sheetsLoading
                  ? "..."
                  : cat.amount === 0 && actual === 0
                    ? "-"
                    : `${diff >= 0 ? "+" : ""}¥${fmt(diff)}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Year 2 tax refund info */}
      {period === "year2" && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h3 className="text-sm font-bold text-emerald-400 mb-2">
            연말정산 부양공제 환급
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">부양가족 3명</div>
              <div className="text-white">
                아빠(38만) + 엄마(38만) + 할머니(48만)
              </div>
            </div>
            <div>
              <div className="text-gray-500">연간 송금액</div>
              <div className="text-white">¥1,240,000 (보너스 활용)</div>
            </div>
            <div>
              <div className="text-gray-500">연간 환급/절감</div>
              <div className="text-emerald-400 font-bold">+¥230,000/년</div>
            </div>
            <div>
              <div className="text-gray-500">월 환산</div>
              <div className="text-emerald-400 font-bold">+¥19,167/월</div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600">
        * 예산은 자동 저장됩니다. 실제 지출은 Google Sheets 가계부에서 불러옵니다.
      </p>
    </div>
  );
}

/* ──────────── 가계부 시트 ──────────── */
function SheetTab() {
  const sheetId = "1volLOrTwvHDDOCXY_AD7fLqVd5JVHHm9HsPg7QTZ0qg";
  const embedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&rm=minimal`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <a
          href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
        >
          새 탭에서 열기
        </a>
        <a
          href="https://moneyforward.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Money Forward ME
        </a>
      </div>

      <div
        className="rounded-xl border border-white/10 overflow-hidden"
        style={{ height: "700px" }}
      >
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="가계부 스프레드시트"
        />
      </div>
    </div>
  );
}
