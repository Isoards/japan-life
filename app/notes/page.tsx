"use client";

import { useState } from "react";
import type { NoteCategory, Note } from "@/lib/types";
import { useNotes, useLinks, mutateAPI } from "@/lib/hooks/use-api";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type Tab = "notes" | "links";

const NOTE_CATEGORIES: { key: NoteCategory; label: string; icon: string }[] = [
  { key: "business", label: "비즈니스", icon: "💼" },
  { key: "honda", label: "Honda 용어", icon: "🏭" },
  { key: "daily", label: "일상 표현", icon: "🗣️" },
  { key: "other", label: "기타", icon: "📝" },
];

export default function NotesPage() {
  const [tab, setTab] = useState<Tab>("notes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          메모장
        </h1>
        <p className="text-gray-400 mt-1">일본어 메모 & 자주 쓰는 링크 모음</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        <button
          onClick={() => setTab("notes")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === "notes" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          📓 일본어 메모
        </button>
        <button
          onClick={() => setTab("links")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === "links" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          🔗 링크 모음
        </button>
      </div>

      {tab === "notes" && <NotesTab />}
      {tab === "links" && <LinksTab />}
    </div>
  );
}

/* ──── 일본어 메모 ──── */
function NotesTab() {
  const { data: notes = [], isLoading: loading, error, mutate } = useNotes();
  const { toast } = useToast();
  const [filter, setFilter] = useState<NoteCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [formJa, setFormJa] = useState("");
  const [formReading, setFormReading] = useState("");
  const [formKo, setFormKo] = useState("");
  const [formMemo, setFormMemo] = useState("");
  const [formCat, setFormCat] = useState<NoteCategory>("business");

  const resetForm = () => {
    setFormJa(""); setFormReading(""); setFormKo(""); setFormMemo("");
    setFormCat("business");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setFormJa(note.japanese);
    setFormReading(note.reading || "");
    setFormKo(note.korean);
    setFormMemo(note.memo || "");
    setFormCat(note.category);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formJa.trim() || !formKo.trim()) return;

    const body = {
      japanese: formJa.trim(),
      reading: formReading.trim() || undefined,
      korean: formKo.trim(),
      memo: formMemo.trim() || undefined,
      category: formCat,
    };

    const res = editingId
      ? await mutateAPI("/api/notes", "PATCH", { id: editingId, ...body })
      : await mutateAPI("/api/notes", "POST", body);

    if (res.ok) { toast(editingId ? "메모를 수정했습니다" : "메모를 추가했습니다"); } else { toast(res.error, "error"); }
    mutate();
    resetForm();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await mutateAPI("/api/notes", "DELETE", { id: deleteTarget });
    if (res.ok) { toast("메모를 삭제했습니다"); } else { toast(res.error, "error"); }
    mutate();
    setDeleteTarget(null);
  };

  const filtered = notes
    .filter((n) => filter === "all" || n.category === filter)
    .filter((n) =>
      search === "" ||
      n.japanese.includes(search) ||
      n.korean.includes(search) ||
      (n.reading && n.reading.includes(search))
    );

  if (loading) return <div className="text-gray-400 py-10 text-center">불러오는 중...</div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-red-400">데이터를 불러오지 못했습니다</div>
        <button onClick={() => mutate()} className="px-4 py-2 rounded-lg text-sm bg-white/10 text-white hover:bg-white/15 transition-colors">다시 시도</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={deleteTarget !== null}
        title="메모 삭제"
        message="이 메모를 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="검색 (일본어/한국어/읽기)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* Category filter + Add button */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
          전체 ({notes.length})
        </button>
        {NOTE_CATEGORIES.map((cat) => (
          <button key={cat.key} onClick={() => setFilter(cat.key)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === cat.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            {cat.icon} {cat.label}
          </button>
        ))}
        <button onClick={() => { resetForm(); setShowForm(true); }} className="ml-auto px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">
          + 추가
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-sm font-medium text-white">{editingId ? "메모 수정" : "새 메모 추가"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="일본어 (日本語)" value={formJa} onChange={(e) => setFormJa(e.target.value)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50" />
            <input type="text" placeholder="읽기 (ひらがな) — 선택" value={formReading} onChange={(e) => setFormReading(e.target.value)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50" />
          </div>
          <input type="text" placeholder="한국어 뜻" value={formKo} onChange={(e) => setFormKo(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50" />
          <div className="flex gap-3">
            <select value={formCat} onChange={(e) => setFormCat(e.target.value as NoteCategory)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none">
              {NOTE_CATEGORIES.map((c) => <option key={c.key} value={c.key} className="bg-gray-900">{c.icon} {c.label}</option>)}
            </select>
            <input type="text" placeholder="메모 (선택)" value={formMemo} onChange={(e) => setFormMemo(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors">{editingId ? "수정" : "추가"}</button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">취소</button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-2">
        {filtered.map((note) => {
          const cat = NOTE_CATEGORIES.find((c) => c.key === note.category);
          return (
            <div key={note.id} className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 group">
              <span className="text-lg shrink-0 mt-0.5">{cat?.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-white">{note.japanese}</div>
                {note.reading && <div className="text-xs text-purple-400">{note.reading}</div>}
                <div className="text-sm text-gray-400 mt-0.5">{note.korean}</div>
                {note.memo && <div className="text-xs text-gray-600 mt-1">{note.memo}</div>}
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(note)} className="text-gray-500 hover:text-purple-400 transition-colors p-1" title="수정">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => setDeleteTarget(note.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="삭제">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 rounded-xl border border-dashed border-white/10">
            <p className="text-gray-500">{search ? "검색 결과가 없습니다" : "메모를 추가해보세요"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── 링크 모음 ──── */
function LinksTab() {
  const { data: links = [], isLoading: loading, error, mutate } = useLinks();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("금융");
  const [formIcon, setFormIcon] = useState("🔗");

  const handleAdd = async () => {
    if (!formTitle.trim() || !formUrl.trim()) return;
    const res = await mutateAPI("/api/links", "POST", {
      title: formTitle.trim(),
      url: formUrl.trim(),
      category: formCategory.trim(),
      icon: formIcon || "🔗",
    });
    if (res.ok) { toast("링크를 추가했습니다"); } else { toast(res.error, "error"); }
    mutate();
    setFormTitle(""); setFormUrl(""); setShowForm(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await mutateAPI("/api/links", "DELETE", { id: deleteTarget });
    if (res.ok) { toast("링크를 삭제했습니다"); } else { toast(res.error, "error"); }
    mutate();
    setDeleteTarget(null);
  };

  if (loading) return <div className="text-gray-400 py-10 text-center">불러오는 중...</div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-red-400">데이터를 불러오지 못했습니다</div>
        <button onClick={() => mutate()} className="px-4 py-2 rounded-lg text-sm bg-white/10 text-white hover:bg-white/15 transition-colors">다시 시도</button>
      </div>
    );
  }

  // Group by category
  const categories = [...new Set(links.map((l) => l.category))];

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={deleteTarget !== null}
        title="링크 삭제"
        message="이 링크를 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">
          + 링크 추가
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="사이트 이름" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50" />
            <input type="url" placeholder="URL (https://...)" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50" />
          </div>
          <div className="flex gap-3">
            <input type="text" placeholder="카테고리" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50" />
            <input type="text" placeholder="아이콘" value={formIcon} onChange={(e) => setFormIcon(e.target.value)} className="w-16 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm text-center focus:outline-none focus:border-purple-500/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors">추가</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">취소</button>
          </div>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat} className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {links.filter((l) => l.category === cat).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <span className="text-lg shrink-0">{link.icon || "🔗"}</span>
                <span className="text-sm text-white flex-1 truncate">{link.title}</span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(link.id); }}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0"
                  title="삭제"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
