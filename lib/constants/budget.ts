import type { BudgetCategory, BudgetPeriod } from "../types";

/** 기간 라벨 */
export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  "apr-jul": "4~7월 (연수/실습)",
  "aug-dec": "8~12월 (본배속)",
  "year2": "2년차~",
};

/** 기간별 기본 수입 (실수령액) */
export const BUDGET_PERIOD_INCOME: Record<BudgetPeriod, number> = {
  "apr-jul": 220_000,
  "aug-dec": 220_000,
  "year2": 190_000,
};

/** 기간별 카테고리 프리셋 */
export const BUDGET_PRESETS: Record<BudgetPeriod, BudgetCategory[]> = {
  "apr-jul": [
    { id: "fixed", label: "고정비 (주거/통신/공과금/구독)", amount: 45_000, icon: "🏠" },
    { id: "food", label: "식비 (마트/편의점/외식)", amount: 40_000, icon: "🍱" },
    { id: "living", label: "생활/건강 (생필품/의료)", amount: 5_000, icon: "🧴" },
    { id: "hobby", label: "취미/쇼핑 (게임/옷/유흥)", amount: 30_000, icon: "🎮" },
    { id: "nisa", label: "新NISA 적립", amount: 30_000, icon: "📈" },
    { id: "car-save", label: "차량 저축 (8월 구입용)", amount: 60_000, icon: "🚗" },
  ],
  "aug-dec": [
    { id: "fixed", label: "고정비 (주거/통신/공과금)", amount: 45_000, icon: "🏠" },
    { id: "food", label: "식비 (마트/외식/편의점)", amount: 40_000, icon: "🍱" },
    { id: "hobby", label: "취미/쇼핑 (게임/옷/유흥)", amount: 30_000, icon: "🎮" },
    { id: "living", label: "생활/건강 (생필품/의료)", amount: 15_000, icon: "🧴" },
    { id: "car", label: "자동차 (할부/보험/기름값)", amount: 50_000, icon: "🚗" },
    { id: "nisa", label: "新NISA 적립", amount: 30_000, icon: "📈" },
    { id: "reserve", label: "예비비 (비상금)", amount: 10_000, icon: "🔒" },
  ],
  "year2": [
    { id: "fixed", label: "고정비 (공과금/통신/구독)", amount: 20_000, icon: "🏠" },
    { id: "variable", label: "변동비 (식비/취미/쇼핑/의료)", amount: 85_000, icon: "🍱" },
    { id: "car", label: "차량 유지 (할부/보험/유류)", amount: 50_000, icon: "🚗" },
    { id: "nisa", label: "新NISA 투자 (츠미타테)", amount: 35_000, icon: "📈" },
  ],
};
