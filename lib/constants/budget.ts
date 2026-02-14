import type { BudgetCategory } from "../types";

/** Sheets 수입 카테고리 */
export const INCOME_CATEGORIES = ["급여", "상여", "부가 수입"];

/** Sheets 저축/투자 카테고리 */
export const SAVING_CATEGORIES = ["NISA", "가족 송금"];

/** 기본 예산 카테고리 프리셋 (Sheets 카테고리 매핑 포함) */
export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "fixed", label: "주거/고정비", amount: 45_000, icon: "🏠", sheetCategories: ["주거", "공과금", "통신", "구독", "보험", "세금"] },
  { id: "food", label: "식비", amount: 40_000, icon: "🍳", sheetCategories: ["장보기", "배달", "외식", "커피/간식"] },
  { id: "living", label: "생활/건강", amount: 5_000, icon: "🧺", sheetCategories: ["생활용품", "의료/건강", "미용/의류"] },
  { id: "transport", label: "교통/차량", amount: 5_000, icon: "🚕", sheetCategories: ["주유", "차량관리", "대중교통", "택시"] },
  { id: "leisure", label: "여가/문화", amount: 15_000, icon: "🎬", sheetCategories: ["여가 기타", "문화생활", "도서", "여행", "취미"] },
  { id: "shopping", label: "쇼핑/잡화", amount: 10_000, icon: "🛍", sheetCategories: ["의류", "전자기기", "기타"] },
  { id: "edu", label: "교육", amount: 0, icon: "📚", sheetCategories: ["강의"] },
  { id: "social", label: "사교", amount: 10_000, icon: "🍻", sheetCategories: ["가족", "지인", "모임"] },
  { id: "nisa", label: "NISA", amount: 30_000, icon: "📢", sheetCategories: ["NISA"] },
  { id: "remit", label: "가족 송금", amount: 0, icon: "💯", sheetCategories: ["가족 송금"] },
];
