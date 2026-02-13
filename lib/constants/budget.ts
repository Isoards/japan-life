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

/** Sheets 수입 카테고리 */
export const INCOME_CATEGORIES = ["급여", "상여", "부가 수입"];

/** Sheets 저축/투자 카테고리 */
export const SAVING_CATEGORIES = ["NISA", "가족 송금"];

/** 기간별 카테고리 프리셋 (Sheets 카테고리 매핑 포함) */
export const BUDGET_PRESETS: Record<BudgetPeriod, BudgetCategory[]> = {
  "apr-jul": [
    { id: "fixed", label: "주거/고정비", amount: 45_000, icon: "🏠", sheetCategories: ["주거", "공과금", "통신", "구독", "보험", "세금"] },
    { id: "food", label: "식비", amount: 40_000, icon: "🍱", sheetCategories: ["장보기", "배달", "외식", "커피/간식"] },
    { id: "living", label: "생활/건강", amount: 5_000, icon: "🧴", sheetCategories: ["생활용품", "의료/건강", "미용/화장"] },
    { id: "transport", label: "교통/차량", amount: 5_000, icon: "🚗", sheetCategories: ["주차", "차량관리", "대중교통", "택시"] },
    { id: "leisure", label: "여가/문화", amount: 15_000, icon: "🎮", sheetCategories: ["여가 기타", "문화생활", "도서", "운동", "여행"] },
    { id: "shopping", label: "쇼핑/패션", amount: 10_000, icon: "👕", sheetCategories: ["옷", "장신구", "기타"] },
    { id: "edu", label: "교육", amount: 0, icon: "📚", sheetCategories: ["강의"] },
    { id: "social", label: "사교", amount: 10_000, icon: "🤝", sheetCategories: ["가족", "지인", "모임"] },
    { id: "nisa", label: "NISA", amount: 30_000, icon: "📈", sheetCategories: ["NISA"] },
    { id: "remit", label: "가족 송금", amount: 0, icon: "💸", sheetCategories: ["가족 송금"] },
  ],
  "aug-dec": [
    { id: "fixed", label: "주거/고정비", amount: 45_000, icon: "🏠", sheetCategories: ["주거", "공과금", "통신", "구독", "보험", "세금"] },
    { id: "food", label: "식비", amount: 40_000, icon: "🍱", sheetCategories: ["장보기", "배달", "외식", "커피/간식"] },
    { id: "living", label: "생활/건강", amount: 15_000, icon: "🧴", sheetCategories: ["생활용품", "의료/건강", "미용/화장"] },
    { id: "transport", label: "교통/차량", amount: 50_000, icon: "🚗", sheetCategories: ["주차", "차량관리", "대중교통", "택시"] },
    { id: "leisure", label: "여가/문화", amount: 20_000, icon: "🎮", sheetCategories: ["여가 기타", "문화생활", "도서", "운동", "여행"] },
    { id: "shopping", label: "쇼핑/패션", amount: 10_000, icon: "👕", sheetCategories: ["옷", "장신구", "기타"] },
    { id: "edu", label: "교육", amount: 0, icon: "📚", sheetCategories: ["강의"] },
    { id: "social", label: "사교", amount: 10_000, icon: "🤝", sheetCategories: ["가족", "지인", "모임"] },
    { id: "nisa", label: "NISA", amount: 30_000, icon: "📈", sheetCategories: ["NISA"] },
    { id: "remit", label: "가족 송금", amount: 0, icon: "💸", sheetCategories: ["가족 송금"] },
  ],
  "year2": [
    { id: "fixed", label: "주거/고정비", amount: 20_000, icon: "🏠", sheetCategories: ["주거", "공과금", "통신", "구독", "보험", "세금"] },
    { id: "food", label: "식비", amount: 40_000, icon: "🍱", sheetCategories: ["장보기", "배달", "외식", "커피/간식"] },
    { id: "living", label: "생활/건강", amount: 10_000, icon: "🧴", sheetCategories: ["생활용품", "의료/건강", "미용/화장"] },
    { id: "transport", label: "교통/차량", amount: 50_000, icon: "🚗", sheetCategories: ["주차", "차량관리", "대중교통", "택시"] },
    { id: "leisure", label: "여가/문화", amount: 15_000, icon: "🎮", sheetCategories: ["여가 기타", "문화생활", "도서", "운동", "여행"] },
    { id: "shopping", label: "쇼핑/패션", amount: 10_000, icon: "👕", sheetCategories: ["옷", "장신구", "기타"] },
    { id: "edu", label: "교육", amount: 0, icon: "📚", sheetCategories: ["강의"] },
    { id: "social", label: "사교", amount: 10_000, icon: "🤝", sheetCategories: ["가족", "지인", "모임"] },
    { id: "nisa", label: "NISA", amount: 35_000, icon: "📈", sheetCategories: ["NISA"] },
    { id: "remit", label: "가족 송금", amount: 0, icon: "💸", sheetCategories: ["가족 송금"] },
  ],
};
