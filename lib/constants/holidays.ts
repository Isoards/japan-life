export interface JapaneseHoliday {
  date: string;
  name: string;
  nameKo: string;
}

export const HOLIDAYS_2026: JapaneseHoliday[] = [
  { date: "2026-01-01", name: "元日", nameKo: "설날" },
  { date: "2026-01-12", name: "成人の日", nameKo: "성인의 날" },
  { date: "2026-02-11", name: "建国記念の日", nameKo: "건국기념일" },
  { date: "2026-02-23", name: "天皇誕生日", nameKo: "천황 탄생일" },
  { date: "2026-03-20", name: "春分の日", nameKo: "춘분" },
  { date: "2026-04-29", name: "昭和の日", nameKo: "쇼와의 날" },
  { date: "2026-05-03", name: "憲法記念日", nameKo: "헌법기념일" },
  { date: "2026-05-04", name: "みどりの日", nameKo: "녹색의 날" },
  { date: "2026-05-05", name: "こどもの日", nameKo: "어린이날" },
  { date: "2026-05-06", name: "振替休日", nameKo: "대체휴일" },
  { date: "2026-07-20", name: "海の日", nameKo: "바다의 날" },
  { date: "2026-08-11", name: "山の日", nameKo: "산의 날" },
  { date: "2026-09-21", name: "敬老の日", nameKo: "경로의 날" },
  { date: "2026-09-23", name: "秋分の日", nameKo: "추분" },
  { date: "2026-10-12", name: "スポーツの日", nameKo: "스포츠의 날" },
  { date: "2026-11-03", name: "文化の日", nameKo: "문화의 날" },
  { date: "2026-11-23", name: "勤労感謝の日", nameKo: "근로감사의 날" },
];

export function getUpcomingHolidays(count = 3): JapaneseHoliday[] {
  const today = new Date().toISOString().split("T")[0];
  return HOLIDAYS_2026.filter((h) => h.date >= today).slice(0, count);
}

export function isHoliday(dateStr: string): JapaneseHoliday | undefined {
  return HOLIDAYS_2026.find((h) => h.date === dateStr);
}
