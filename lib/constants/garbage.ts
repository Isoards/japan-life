import type { GarbageScheduleEntry } from "../types";

export const DEFAULT_GARBAGE_ENTRIES: GarbageScheduleEntry[] = [
  { type: "burnable", label: "타는 쓰레기", labelJa: "燃えるゴミ", icon: "🔥", dayOfWeek: [1, 4], frequency: "weekly" },
  { type: "non-burnable", label: "안 타는 쓰레기", labelJa: "燃えないゴミ", icon: "🪨", dayOfWeek: [], frequency: "monthly" },
  { type: "recyclable", label: "자원 쓰레기", labelJa: "資源ゴミ", icon: "♻️", dayOfWeek: [], frequency: "weekly" },
  { type: "pet-bottles", label: "페트병", labelJa: "ペットボトル", icon: "🧴", dayOfWeek: [], frequency: "biweekly" },
  { type: "plastic", label: "플라스틱", labelJa: "プラスチック", icon: "🛍️", dayOfWeek: [], frequency: "weekly" },
  { type: "paper", label: "고지/종이류", labelJa: "古紙", icon: "📰", dayOfWeek: [], frequency: "biweekly" },
  { type: "cans-bottles", label: "캔/병", labelJa: "缶・びん", icon: "🥫", dayOfWeek: [], frequency: "biweekly" },
];

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
