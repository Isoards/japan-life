import { addDateKeyDays } from "./freshness";

export function getWeekStart(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const day = date.getUTCDay();
  return addDateKeyDays(dateKey, -(day === 0 ? 6 : day - 1));
}

export function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDateKeyDays(weekStart, index));
}
