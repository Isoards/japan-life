import type { ChecklistCategory, ChecklistPriority } from "./types";

export const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  "pre-departure": "출국 전 준비",
  "post-arrival": "도착 후 수속",
  "living-setup": "생활 세팅",
  workplace: "직장 관련",
  finance: "금융/절세",
};

export const CATEGORY_ICONS: Record<ChecklistCategory, string> = {
  "pre-departure": "✈️",
  "post-arrival": "🛬",
  "living-setup": "🏠",
  workplace: "💼",
  finance: "💰",
};

export const PRIORITY_LABELS: Record<ChecklistPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const PRIORITY_COLORS: Record<ChecklistPriority, string> = {
  high: "text-red-400 bg-red-500/15 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/15 border-yellow-500/20",
  low: "text-green-400 bg-green-500/15 border-green-500/20",
};
