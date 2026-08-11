import type { BudgetCategory } from "../types";

/** Sheets 수입 카테고리 */
export const INCOME_CATEGORIES = ["급여", "상여", "부가 수입"];

/** Sheets 저축/투자 카테고리 */
export const SAVING_CATEGORIES = ["NISA", "가족 송금"];

/** 첨부 가계부의 카테고리와 일치하는 기본 예산 프리셋 */
export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "groceries", label: "장보기", amount: 0, icon: "🛒", sheetCategories: ["장보기"] },
  { id: "delivery", label: "배달", amount: 0, icon: "🛵", sheetCategories: ["배달"] },
  { id: "dining", label: "외식", amount: 0, icon: "🍽️", sheetCategories: ["외식"] },
  { id: "snacks", label: "커피/간식", amount: 0, icon: "☕", sheetCategories: ["커피/간식"] },
  { id: "household", label: "생활용품", amount: 0, icon: "🧺", sheetCategories: ["생활용품"] },
  { id: "medical", label: "의료/건강", amount: 0, icon: "💊", sheetCategories: ["의료/건강"] },
  { id: "clothing", label: "의류/미용", amount: 0, icon: "👕", sheetCategories: ["의류/미용"] },
  { id: "hobby", label: "취미", amount: 0, icon: "🎮", sheetCategories: ["취미"] },
  { id: "appliances", label: "가전/가구", amount: 0, icon: "🪑", sheetCategories: ["가전/가구"] },
  { id: "alcohol", label: "술/유흥", amount: 0, icon: "🍺", sheetCategories: ["술/유흥"] },
  { id: "friends", label: "지인", amount: 0, icon: "👤", sheetCategories: ["지인"] },
  { id: "gatherings", label: "모임", amount: 0, icon: "👥", sheetCategories: ["모임"] },
  { id: "telecom", label: "통신", amount: 0, icon: "📱", sheetCategories: ["통신"] },
  { id: "subscriptions", label: "구독", amount: 0, icon: "🔄", sheetCategories: ["구독"] },
  { id: "insurance", label: "보험", amount: 0, icon: "🛡️", sheetCategories: ["보험"] },
  { id: "classes", label: "강의", amount: 0, icon: "📚", sheetCategories: ["강의"] },
  { id: "parking", label: "주차", amount: 0, icon: "🅿️", sheetCategories: ["주차"] },
  { id: "vehicle", label: "차량비", amount: 0, icon: "🚗", sheetCategories: ["차량비"] },
  { id: "transit", label: "대중교통", amount: 0, icon: "🚃", sheetCategories: ["대중교통"] },
  { id: "taxi", label: "택시", amount: 0, icon: "🚕", sheetCategories: ["택시"] },
  { id: "culture", label: "문화생활", amount: 0, icon: "🎬", sheetCategories: ["문화생활"] },
  { id: "books", label: "도서", amount: 0, icon: "📖", sheetCategories: ["도서"] },
  { id: "fitness", label: "운동", amount: 0, icon: "🏃", sheetCategories: ["운동"] },
  { id: "travel", label: "여행", amount: 0, icon: "✈️", sheetCategories: ["여행"] },
  { id: "gifts", label: "선물", amount: 0, icon: "🎁", sheetCategories: ["선물"] },
  { id: "family-events", label: "경조사", amount: 0, icon: "💐", sheetCategories: ["경조사"] },
  { id: "tax", label: "세금", amount: 0, icon: "🧾", sheetCategories: ["세금"] },
  { id: "utilities", label: "공과금", amount: 0, icon: "💡", sheetCategories: ["공과금"] },
  { id: "housing", label: "주거", amount: 0, icon: "🏠", sheetCategories: ["주거"] },
  { id: "other", label: "기타", amount: 0, icon: "📦", sheetCategories: ["기타"] },
];
