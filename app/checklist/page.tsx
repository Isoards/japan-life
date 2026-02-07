"use client";

import { useEffect, useState, useCallback } from "react";
import type { ChecklistItem, ChecklistCategory, ChecklistPriority } from "@/lib/types";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  fetchChecklist,
  toggleChecklistItem,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/lib/checklist";

const ALL_CATEGORIES: ChecklistCategory[] = [
  "pre-departure",
  "post-arrival",
  "living-setup",
  "workplace",
];

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [filter, setFilter] = useState<ChecklistCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // form fields (shared for add/edit)
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState<ChecklistCategory>("pre-departure");
  const [formPriority, setFormPriority] = useState<ChecklistPriority>("medium");

  const load = useCallback(async () => {
    const data = await fetchChecklist();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormCategory("pre-departure");
    setFormPriority("medium");
    setEditingId(null);
    setShowForm(false);
  };

  const handleToggle = async (id: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !checked } : i))
    );
    const updated = await toggleChecklistItem(id, !checked);
    setItems(updated);
  };

  const handleAdd = async () => {
    if (!formTitle.trim()) return;
    const updated = await addChecklistItem({
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      category: formCategory,
      priority: formPriority,
    });
    setItems(updated);
    resetForm();
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDesc(item.description || "");
    setFormCategory(item.category);
    setFormPriority(item.priority);
    setShowForm(true);
  };

  const handleEdit = async () => {
    if (!editingId || !formTitle.trim()) return;
    const updated = await updateChecklistItem(editingId, {
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      category: formCategory,
      priority: formPriority,
    });
    setItems(updated);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteChecklistItem(id);
    setItems(updated);
  };

  const filtered =
    filter === "all" ? items : items.filter((i) => i.category === filter);

  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          취업/이주 체크리스트
        </h1>
        <p className="text-gray-400 mt-1">
          토치기현 취업 준비 — 남은 할 일을 체크하세요
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">전체 진행률</span>
          <span className="text-sm font-medium text-white">
            {done}/{total} 완료 ({progress}%)
          </span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Category mini stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {ALL_CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            const catDone = catItems.filter((i) => i.checked).length;
            return (
              <div
                key={cat}
                className="text-center p-2 rounded-lg bg-white/5"
              >
                <div className="text-lg">{CATEGORY_ICONS[cat]}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {CATEGORY_LABELS[cat]}
                </div>
                <div className="text-sm font-medium text-white">
                  {catDone}/{catItems.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === "all"
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          전체
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === cat
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </button>
        ))}
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="ml-auto px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
        >
          + 항목 추가
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="text-sm font-medium text-white">
            {editingId ? "항목 수정" : "새 항목 추가"}
          </h3>
          <input
            type="text"
            placeholder="제목"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50"
          />
          <input
            type="text"
            placeholder="설명 (선택)"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={formCategory}
              onChange={(e) =>
                setFormCategory(e.target.value as ChecklistCategory)
              }
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-900">
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <select
              value={formPriority}
              onChange={(e) =>
                setFormPriority(e.target.value as ChecklistPriority)
              }
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none"
            >
              <option value="high" className="bg-gray-900">높음</option>
              <option value="medium" className="bg-gray-900">보통</option>
              <option value="low" className="bg-gray-900">낮음</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleEdit : handleAdd}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors"
            >
              {editingId ? "수정" : "추가"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Items grouped by category */}
      {(filter === "all" ? ALL_CATEGORIES : [filter]).map((cat) => {
        const catItems = filtered.filter((i) => i.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <h2 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <span>{CATEGORY_ICONS[cat]}</span>
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-1">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all group ${
                    item.checked
                      ? "border-white/5 bg-white/[0.02] opacity-60"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <button
                    onClick={() => handleToggle(item.id, item.checked)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.checked
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "border-gray-500 hover:border-purple-400"
                    }`}
                  >
                    {item.checked && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${item.checked ? "line-through text-gray-500" : "text-white"}`}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_COLORS[item.priority]}`}
                  >
                    {PRIORITY_LABELS[item.priority]}
                  </span>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-gray-500 hover:text-purple-400 transition-colors p-1"
                      title="수정"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
