import type { GarbageScheduleEntry } from "../types";

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
export const GARBAGE_REGION = "栃木県塩谷郡高根沢町宝石台（収集地区②）";
export const GARBAGE_SOURCE_URL = "https://www.town.takanezawa.tochigi.jp/life/gomi/dashikata/documents/R8gomisyuusyuubi.pdf";
export const GARBAGE_VALID_THROUGH = "2027-03-31";

const officialDates = (dayByMonth: number[]) =>
  dayByMonth.map((day, index) => {
    const monthIndex = index + 4;
    const year = monthIndex <= 12 ? 2026 : 2027;
    const month = monthIndex <= 12 ? monthIndex : monthIndex - 12;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });

/** 高根沢町 令和8年度 수거구역 ②: 光陽台・宝石台. */
export const DEFAULT_GARBAGE_ENTRIES: GarbageScheduleEntry[] = [
  {
    type: "burnable",
    label: "타는 쓰레기",
    labelJa: "もえるごみ",
    icon: "🔥",
    dayOfWeek: [1, 4],
    frequency: "weekly",
    note: "매주 월·목요일, 당일 오전 8시까지",
  },
  {
    type: "recyclable",
    label: "자원병·용기포장 플라스틱",
    labelJa: "資源びん・容器包装プラスチック",
    icon: "♻️",
    dayOfWeek: [2],
    collectionDates: officialDates([7, 5, 2, 7, 4, 1, 6, 3, 1, 5, 2, 2]),
    frequency: "monthly",
    note: "매월 공식 지정일, 당일 오전 8시까지",
  },
  {
    type: "paper",
    label: "헌 종이",
    labelJa: "古紙",
    icon: "📰",
    dayOfWeek: [2],
    collectionDates: officialDates([14, 12, 9, 14, 11, 8, 13, 10, 8, 12, 9, 9]),
    frequency: "monthly",
    note: "매월 공식 지정일, 당일 오전 8시까지",
  },
  {
    type: "pet-bottles",
    label: "페트병·용기포장 플라스틱",
    labelJa: "ペットボトル・容器包装プラスチック",
    icon: "🧴",
    dayOfWeek: [2],
    collectionDates: officialDates([21, 19, 16, 21, 18, 15, 20, 17, 15, 19, 16, 16]),
    frequency: "monthly",
    note: "매월 공식 지정일, 당일 오전 8시까지",
  },
  {
    type: "non-burnable",
    label: "캔·유리·안 타는 쓰레기",
    labelJa: "カン・ガラス・不燃物",
    icon: "🥫",
    dayOfWeek: [2],
    collectionDates: officialDates([28, 26, 23, 28, 25, 22, 27, 24, 22, 26, 23, 23]),
    frequency: "monthly",
    note: "매월 공식 지정일, 당일 오전 8시까지",
  },
];

export function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isGarbageCollectionOn(entry: GarbageScheduleEntry, date: Date): boolean {
  if (entry.collectionDates?.length) return entry.collectionDates.includes(dateKey(date));
  return entry.dayOfWeek.includes(date.getDay());
}

export interface UpcomingGarbageCollection {
  date: string;
  entries: GarbageScheduleEntry[];
}

export function getUpcomingGarbageCollections(
  entries: GarbageScheduleEntry[],
  from = new Date(),
  count = 8,
): UpcomingGarbageCollection[] {
  const results: UpcomingGarbageCollection[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  for (let offset = 0; offset < 370 && results.length < count; offset += 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + offset);
    const matches = entries.filter((entry) => isGarbageCollectionOn(entry, date));
    if (matches.length > 0) results.push({ date: dateKey(date), entries: matches });
  }
  return results;
}
