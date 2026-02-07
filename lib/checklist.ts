import type { ChecklistItem, ChecklistCategory, ChecklistPriority } from "./types";

export const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  "pre-departure": "출국 전 준비",
  "post-arrival": "도착 후 수속",
  "living-setup": "생활 세팅",
  workplace: "직장 관련",
};

export const CATEGORY_ICONS: Record<ChecklistCategory, string> = {
  "pre-departure": "✈️",
  "post-arrival": "🛬",
  "living-setup": "🏠",
  workplace: "💼",
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

export async function fetchChecklist(): Promise<ChecklistItem[]> {
  const res = await fetch("/api/checklist");
  return res.json();
}

export async function toggleChecklistItem(id: string, checked: boolean): Promise<ChecklistItem[]> {
  const res = await fetch("/api/checklist", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, checked }),
  });
  return res.json();
}

export async function addChecklistItem(
  item: Omit<ChecklistItem, "id" | "checked" | "custom">
): Promise<ChecklistItem[]> {
  const res = await fetch("/api/checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function updateChecklistItem(
  id: string,
  updates: Partial<Pick<ChecklistItem, "title" | "description" | "category" | "priority">>
): Promise<ChecklistItem[]> {
  const res = await fetch("/api/checklist", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
  return res.json();
}

export async function deleteChecklistItem(id: string): Promise<ChecklistItem[]> {
  const res = await fetch("/api/checklist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.json();
}
