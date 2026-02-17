"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/Toast";
import { getDefaultBudget } from "@/lib/calculator";
import { mutateAPI, useBudget, useSheetsSummary, useSheetsTrend } from "@/lib/hooks/use-api";
import { INCOME_CATEGORIES, SAVING_CATEGORIES } from "@/lib/constants/budget";
import type { BudgetCategory, SinkingFund } from "@/lib/types";

const MonthlyTrendChart = dynamic(
  () => import("@/components/ExpenseCharts").then((m) => m.MonthlyTrendChart),
  { ssr: false },
);
const CategoryPieChart = dynamic(
  () => import("@/components/ExpenseCharts").then((m) => m.CategoryPieChart),
  { ssr: false },
);

type Tab = "budget" | "sheet" | "charts";

function getUsageLevel(actual: number, budget: number): "safe" | "warn" | "danger" {
  if (budget <= 0) return "safe";
  const ratio = actual / budget;
  if (ratio > 1) return "danger";
  if (ratio >= 0.8) return "warn";
  return "safe";
}

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("budget");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          가계부
        </h1>
        <p className="text-gray-400 mt-1">예산 관리와 Google Sheets 가계부 연동</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {([
          { key: "budget", label: "🏠 예산 플래너" },
          { key: "sheet", label: "📤 가계부 시트" },
          { key: "charts", label: "📊 지출 차트" },
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

      {tab === "budget" && <BudgetTab />}
      {tab === "sheet" && <SheetTab />}
      {tab === "charts" && <ChartsTab />}
    </div>
  );
}

function BudgetTab() {
  const { data: budgetData, isLoading } = useBudget();
  const { toast } = useToast();

  const [categories, setCategories] = useState<BudgetCategory[]>(getDefaultBudget());
  const [income, setIncome] = useState<string>("270000");
  const [sinkingFunds, setSinkingFunds] = useState<SinkingFund[]>([]);
  const [newFundName, setNewFundName] = useState("");
  const [newFundTarget, setNewFundTarget] = useState("");
  const [initialized, setInitialized] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  const { data: sheetData, isLoading: sheetsLoading } = useSheetsSummary(selectedMonth);
  const alertHistory = useRef<Set<string>>(new Set());
  const prevStageByCategory = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!budgetData || initialized) return;

    const timer = setTimeout(() => {
      if (budgetData.categories.length > 0) {
        const preset = getDefaultBudget();
        const merged = budgetData.categories.map((cat: BudgetCategory) => {
          if (cat.sheetCategories) return cat;
          const match = preset.find((p) => p.id === cat.id);
          return { ...cat, sheetCategories: match?.sheetCategories ?? [] };
        });
        setCategories(merged);
      }

      if (budgetData.income > 0) setIncome(String(budgetData.income));
      setSinkingFunds(budgetData.sinkingFunds ?? []);
      setInitialized(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [budgetData, initialized]);

  const save = async (cats: BudgetCategory[], inc: string, funds: SinkingFund[]) => {
    const incVal = parseInt(inc, 10) || 0;
    await mutateAPI("/api/budget", "POST", {
      income: incVal,
      categories: cats,
      sinkingFunds: funds,
    });
  };

  useEffect(() => {
    if (!sheetData || sheetsLoading) return;

    const currentStageMap: Record<string, string> = {};
    const hasPreviousSnapshot = Object.keys(prevStageByCategory.current).length > 0;

    for (const cat of categories) {
      if (cat.amount <= 0) continue;
      const actual = (cat.sheetCategories ?? []).reduce((sum, key) => sum + (sheetData.byCategory[key] || 0), 0);
      const level = getUsageLevel(actual, cat.amount);
      const stage = level === "danger" ? "danger" : actual === cat.amount ? "full" : level === "warn" ? "warn" : "safe";
      currentStageMap[cat.id] = stage;

      // 첫 스냅샷에서는 과거 상태가 없으므로 알림을 띄우지 않는다.
      if (!hasPreviousSnapshot) continue;

      // 임계치 구간으로 "진입"할 때만 알림
      if (prevStageByCategory.current[cat.id] === stage || stage === "safe") continue;

      const key = `${selectedMonth}:${cat.id}:${stage}`;
      if (alertHistory.current.has(key)) continue;
      alertHistory.current.add(key);

      if (level === "danger") {
        const pct = Math.max(101, Math.ceil((actual / cat.amount) * 100));
        toast(`${cat.label} 예산을 초과했어요. (${pct}%)`, "error");
      } else if (actual === cat.amount) {
        toast(`${cat.label} 예산 한도(100%)에 도달했어요.`, "info");
      } else {
        toast(`${cat.label} 예산 사용률 80%를 넘었어요.`, "info");
      }
    }

    prevStageByCategory.current = currentStageMap;
  }, [categories, selectedMonth, sheetData, sheetsLoading, toast]);

  const updateAmount = (id: string, amount: number) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, amount } : c));
    setCategories(updated);
    save(updated, income, sinkingFunds);
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const updateSinkingFund = (id: string, patch: Partial<SinkingFund>) => {
    const updated = sinkingFunds.map((f) => (f.id === id ? { ...f, ...patch } : f));
    setSinkingFunds(updated);
    save(categories, income, updated);
  };

  const deleteSinkingFund = (id: string) => {
    const updated = sinkingFunds.filter((f) => f.id !== id);
    setSinkingFunds(updated);
    save(categories, income, updated);
  };

  const addSinkingFund = () => {
    const name = newFundName.trim();
    const targetAmount = parseInt(newFundTarget, 10) || 0;
    if (!name || targetAmount <= 0) {
      toast("목표저축 이름과 목표 금액을 입력해주세요.", "error");
      return;
    }

    const fund: SinkingFund = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      targetAmount,
      savedAmount: 0,
    };

    const updated = [...sinkingFunds, fund];
    setSinkingFunds(updated);
    setNewFundName("");
    setNewFundTarget("");
    save(categories, income, updated);
    toast("목표저축을 추가했습니다.");
  };

  const getActual = (cat: BudgetCategory): number => {
    if (!sheetData || !cat.sheetCategories) return 0;
    return cat.sheetCategories.reduce((sum, sc) => sum + (sheetData.byCategory[sc] || 0), 0);
  };

  const incomeVal = parseInt(income, 10) || 0;
  const totalBudget = categories.reduce((sum, c) => sum + c.amount, 0);
  const totalActual = sheetData ? categories.reduce((sum, c) => sum + getActual(c), 0) : 0;
  const totalUsageLevel = getUsageLevel(totalActual, totalBudget);

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
            <span className="flex-1 text-center text-white font-medium">{monthLabel}</span>
            <button
              onClick={() => shiftMonth(1)}
              className="px-3 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/15 transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm text-gray-400 mb-2">월 실수령 수입 (세후)</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">¥</span>
            <input
              type="number"
              value={income}
              onChange={(e) => {
                setIncome(e.target.value);
                save(categories, e.target.value, sinkingFunds);
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-lg font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>

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
          <div
            className={`text-lg font-bold ${
              totalUsageLevel === "danger" ? "text-red-400" : totalUsageLevel === "warn" ? "text-amber-400" : "text-pink-400"
            }`}
          >
            {sheetsLoading ? <span className="text-gray-500">...</span> : `¥${fmt(totalActual)}`}
          </div>
        </div>
        <div
          className={`rounded-xl border p-4 text-center ${
            incomeVal - totalActual >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
          }`}
        >
          <div className="text-xs text-gray-500">잔액 (실제)</div>
          <div className={`text-lg font-bold ${incomeVal - totalActual >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {sheetsLoading ? <span className="text-gray-500">...</span> : `¥${fmt(incomeVal - totalActual)}`}
          </div>
        </div>
      </div>

      {sheetData && sheetData.totalIncome > 0 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center justify-between">
          <span className="text-sm text-blue-300">Sheets {monthLabel} 수입 합계</span>
          <span className="text-sm font-bold text-blue-400">¥{fmt(sheetData.totalIncome)}</span>
        </div>
      )}

      {totalBudget > 0 && (
        <div className="space-y-1">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500/30 to-purple-500/20 absolute"
              style={{ width: "100%" }}
            />
            <div
              className={`h-full rounded-full transition-all duration-300 absolute ${
                totalUsageLevel === "danger"
                  ? "bg-gradient-to-r from-red-500 to-red-400"
                  : totalUsageLevel === "warn"
                    ? "bg-gradient-to-r from-amber-500 to-orange-400"
                    : "bg-gradient-to-r from-pink-500 to-purple-500"
              }`}
              style={{ width: `${Math.min((totalActual / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>실제 {((totalActual / totalBudget) * 100).toFixed(0)}%</span>
            <span>예산 ¥{fmt(totalBudget)}</span>
          </div>
        </div>
      )}

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
          const usageLevel = getUsageLevel(actual, cat.amount);

          return (
            <div
              key={cat.id}
              className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 items-center p-3 rounded-lg border bg-white/5 ${
                usageLevel === "danger"
                  ? "border-red-500/30"
                  : usageLevel === "warn"
                    ? "border-amber-500/30"
                    : "border-white/10"
              }`}
            >
              <span className="text-lg shrink-0">{cat.icon}</span>
              <div className="min-w-0">
                <span className="text-sm text-gray-300 truncate block">{cat.label}</span>
                {cat.sheetCategories?.length > 0 && (
                  <span className="text-[10px] text-gray-600 truncate block">{cat.sheetCategories.join(", ")}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-gray-500 text-xs">¥</span>
                <input
                  type="number"
                  value={cat.amount}
                  onChange={(e) => updateAmount(cat.id, parseInt(e.target.value, 10) || 0)}
                  className="w-[72px] px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-mono text-right focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <span className="text-sm font-mono text-pink-400 w-[72px] text-right shrink-0">
                {sheetsLoading ? "..." : `¥${fmt(actual)}`}
              </span>
              <span
                className={`text-sm font-mono w-[80px] text-right shrink-0 ${
                  usageLevel === "danger" ? "text-red-400" : usageLevel === "warn" ? "text-amber-400" : diff >= 0 ? "text-emerald-400" : "text-gray-500"
                }`}
              >
                {sheetsLoading ? "..." : cat.amount === 0 && actual === 0 ? "-" : `${diff >= 0 ? "+" : ""}¥${fmt(diff)}`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">목표저축 (싱킹펀드)</h3>
          <span className="text-xs text-gray-500">미래 지출을 미리 적립</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
          <input
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            placeholder="예: 차량 구매"
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10">
            <span className="text-gray-500 text-xs">¥</span>
            <input
              type="number"
              value={newFundTarget}
              onChange={(e) => setNewFundTarget(e.target.value)}
              placeholder="목표금액"
              className="w-28 bg-transparent text-white text-sm font-mono focus:outline-none"
            />
          </div>
          <button
            onClick={addSinkingFund}
            className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
          >
            추가
          </button>
        </div>

        <div className="space-y-2">
          {sinkingFunds.length === 0 && (
            <p className="text-sm text-gray-500">아직 등록된 목표저축이 없습니다.</p>
          )}

          {sinkingFunds.map((fund) => {
            const progress = fund.targetAmount > 0 ? Math.min((fund.savedAmount / fund.targetAmount) * 100, 100) : 0;
            return (
              <div key={fund.id} className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={fund.name}
                    onChange={(e) => updateSinkingFund(fund.id, { name: e.target.value })}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none border-b border-transparent focus:border-white/20"
                  />
                  <button
                    onClick={() => deleteSinkingFund(fund.id)}
                    className="text-xs px-2 py-1 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25"
                  >
                    삭제
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="text-xs text-gray-400">
                    목표 금액
                    <div className="mt-1 flex items-center gap-1 px-2 py-1 rounded bg-white/10 border border-white/10">
                      <span className="text-gray-500">¥</span>
                      <input
                        type="number"
                        value={fund.targetAmount}
                        onChange={(e) => updateSinkingFund(fund.id, { targetAmount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-transparent text-white font-mono focus:outline-none"
                      />
                    </div>
                  </label>

                  <label className="text-xs text-gray-400">
                    현재 적립액
                    <div className="mt-1 flex items-center gap-1 px-2 py-1 rounded bg-white/10 border border-white/10">
                      <span className="text-gray-500">¥</span>
                      <input
                        type="number"
                        value={fund.savedAmount}
                        onChange={(e) => updateSinkingFund(fund.id, { savedAmount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-transparent text-white font-mono focus:outline-none"
                      />
                    </div>
                  </label>

                  <label className="text-xs text-gray-400">
                    목표 월 (선택)
                    <input
                      type="month"
                      value={fund.targetMonth || ""}
                      onChange={(e) => updateSinkingFund(fund.id, { targetMonth: e.target.value || undefined })}
                      className="mt-1 w-full px-2 py-1 rounded bg-white/10 border border-white/10 text-white focus:outline-none"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{progress.toFixed(0)}%</span>
                    <span>
                      ¥{fmt(fund.savedAmount)} / ¥{fmt(fund.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-600">* 예산과 목표저축은 자동 저장됩니다. 실제 지출은 Google Sheets 가계부에서 불러옵니다.</p>
    </div>
  );
}

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
          시트 열기
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

      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ height: "700px" }}>
        <iframe src={embedUrl} style={{ width: "100%", height: "100%", border: "none" }} title="가계부 스프레드시트" />
      </div>
    </div>
  );
}

function ChartsTab() {
  const { data: trend, isLoading: trendLoading } = useSheetsTrend(6);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: currentSheet, isLoading: sheetLoading } = useSheetsSummary(currentMonth);

  const excludeCategories = useMemo(
    () => new Set([...INCOME_CATEGORIES, ...SAVING_CATEGORIES]),
    [],
  );

  const expenseOnly = useMemo(() => {
    if (!currentSheet?.byCategory) return {};
    return Object.fromEntries(
      Object.entries(currentSheet.byCategory).filter(
        ([key]) => !excludeCategories.has(key),
      ),
    );
  }, [currentSheet, excludeCategories]);

  const isLoading = trendLoading || sheetLoading;

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {trend && <MonthlyTrendChart data={trend} />}
      {currentSheet && (
        <>
          <p className="text-sm text-gray-500 text-center">
            {currentMonth} 카테고리별 지출
          </p>
          <CategoryPieChart byCategory={expenseOnly} />
        </>
      )}
      {!trend?.length && !currentSheet && (
        <p className="text-gray-500 text-center py-8">
          Google Sheets에 데이터가 없거나 API 키가 설정되지 않았습니다.
        </p>
      )}
    </div>
  );
}
