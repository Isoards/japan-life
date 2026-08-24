import type { BudgetCategory } from "../types";

/** Sheets 수입 카테고리 */
export const INCOME_CATEGORIES = ["급여", "상여", "부가 수입"];

/** Sheets 저축/투자 카테고리 */
export const SAVING_CATEGORIES = ["NISA", "라이프플랜", "현금저축", "가족 송금"];

/**
 * 설정 시트의 대분류와 일치하는 월 예산 프리셋.
 * 진단 권장안: 식비 35,000 + 고정비/생활 105,000 + 사교/문화 25,000 = 165,000엔.
 */
export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: "food",
    label: "식비",
    amount: 35_000,
    icon: "🍱",
    sheetCategories: ["장보기", "구내식당", "외식", "배달", "커피/간식", "구내매점"],
  },
  {
    id: "fixed-contract",
    label: "고정·계약비",
    amount: 45_000,
    icon: "🏠",
    sheetCategories: ["주거", "공과금", "통신", "구독", "보험", "세금", "직장공제"],
  },
  {
    id: "transport-vehicle",
    label: "교통·차량",
    amount: 50_000,
    icon: "🚗",
    sheetCategories: ["대중교통", "택시", "주차", "차량구매/할부", "주유", "자동차보험", "정비/소모품", "통행료"],
  },
  {
    id: "living-consumption",
    label: "생활·소비",
    amount: 10_000,
    icon: "🧺",
    sheetCategories: ["생활용품", "의료/건강", "의류/미용", "가전/가구", "쇼핑", "도서", "운동", "행정/정착", "기타"],
  },
  {
    id: "social-leisure",
    label: "사교·여가",
    amount: 25_000,
    icon: "🎭",
    sheetCategories: ["취미", "문화생활", "술/유흥", "지인", "모임", "여행", "선물", "경조사", "강의"],
  },
];
