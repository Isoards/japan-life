"use client";

import { useState, useMemo } from "react";
import type { NoteCategory, Note } from "@/lib/types";
import { useNotes, useLinks, mutateAPI } from "@/lib/hooks/use-api";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  loadSrs, saveSrs, getDueNotes, updateSrs,
  loadQuizStats, saveQuizStats, updateQuizStats,
  type SrsState, type QuizStats,
} from "@/lib/srs";

type Tab = "notes" | "templates" | "quiz" | "links";

const NOTE_CATEGORIES: { key: NoteCategory; label: string; icon: string }[] = [
  { key: "business", label: "비즈니스", icon: "💼" },
  { key: "ev", label: "전동/EV", icon: "⚡" },
  { key: "vehicle", label: "차량 부품", icon: "🚗" },
  { key: "daily", label: "일상 표현", icon: "🗣️" },
  { key: "sw", label: "SW/시험", icon: "💻" },
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
        {([
          { key: "notes", label: "📓 메모" },
          { key: "templates", label: "📧 템플릿" },
          { key: "quiz", label: "🧠 퀴즈" },
          { key: "links", label: "🔗 링크" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "notes" && <NotesTab />}
      {tab === "templates" && <TemplatesTab />}
      {tab === "quiz" && <QuizTab />}
      {tab === "links" && <LinksTab />}
    </div>
  );
}

/* ──── Fisher-Yates 셔플 ──── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  // 검색/필터 없을 때 랜덤 순서로 표시, 검색 중일 때는 원래 순서 유지
  const filtered = useMemo(() => {
    const result = notes
      .filter((n) => filter === "all" || n.category === filter)
      .filter((n) =>
        search === "" ||
        n.japanese.includes(search) ||
        n.korean.includes(search) ||
        (n.reading && n.reading.includes(search))
      );
    return search ? result : shuffle(result);
  }, [notes, filter, search]);

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
        {NOTE_CATEGORIES.map((cat) => {
          const count = notes.filter((n) => n.category === cat.key).length;
          return (
            <button key={cat.key} onClick={() => setFilter(cat.key)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === cat.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {cat.icon} {cat.label} ({count})
            </button>
          );
        })}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((note) => {
          const cat = NOTE_CATEGORIES.find((c) => c.key === note.category);
          return (
            <div key={note.id} className="relative p-5 rounded-xl border border-white/10 bg-white/5 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{cat?.icon} {cat?.label}</span>
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
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-white leading-snug">{note.japanese}</div>
                {note.reading && <div className="text-base text-purple-400">{note.reading}</div>}
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="text-lg text-gray-300">{note.korean}</div>
                </div>
                {note.memo && <div className="text-sm text-gray-500 mt-1">{note.memo}</div>}
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

/* ──── SRS 퀴즈 ──── */

function QuizTab() {
  const { data: notes = [], isLoading } = useNotes();
  const [srs, setSrs] = useState<SrsState>(loadSrs);
  const [quizStats, setQuizStats] = useState<QuizStats>(loadQuizStats);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [filterCat, setFilterCat] = useState<NoteCategory | "all">("all");
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });
  const [direction, setDirection] = useState<"ja-to-ko" | "ko-to-ja">("ja-to-ko");

  const filtered = useMemo(() => {
    return filterCat === "all" ? notes : notes.filter((n) => n.category === filterCat);
  }, [notes, filterCat]);

  const dueNotes = useMemo(() => getDueNotes(filtered, srs), [filtered, srs]);
  const current = dueNotes[currentIndex];

  const handleAnswer = (quality: number) => {
    if (!current) return;
    const newSrs = updateSrs(srs, current.id, quality);
    setSrs(newSrs);
    saveSrs(newSrs);

    const correct = quality >= 3;
    setSessionStats((prev) => ({
      total: prev.total + 1,
      correct: correct ? prev.correct + 1 : prev.correct,
    }));

    const newStats = updateQuizStats(quizStats, current.category, correct);
    setQuizStats(newStats);
    saveQuizStats(newStats);

    setShowAnswer(false);
    if (currentIndex >= dueNotes.length - 1) {
      setCurrentIndex(0);
    }
  };

  const resetAll = () => {
    setSrs({});
    saveSrs({});
    setCurrentIndex(0);
    setSessionStats({ total: 0, correct: 0 });
  };

  if (isLoading) return <div className="text-gray-400 py-10 text-center">불러오는 중...</div>;

  if (notes.length === 0) {
    return (
      <div className="text-center py-10 rounded-xl border border-dashed border-white/10">
        <p className="text-gray-400 mb-2">퀴즈를 시작하려면 먼저 메모를 추가하세요</p>
        <p className="text-gray-600 text-sm">일본어 메모 탭에서 단어/표현을 추가하면 여기서 퀴즈를 풀 수 있습니다</p>
      </div>
    );
  }

  const activeDue = getDueNotes(filtered, srs);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        메모에 저장한 일본어 표현을 SRS(간격 반복) 방식으로 복습합니다.
      </p>

      {/* Stats bar */}
      {quizStats.totalReviewed > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{quizStats.streakDays}</div>
              <div className="text-gray-500">연속 학습일</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{quizStats.totalReviewed}</div>
              <div className="text-gray-500">누적 복습</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">
                {quizStats.totalReviewed > 0 ? Math.round((quizStats.totalCorrect / quizStats.totalReviewed) * 100) : 0}%
              </div>
              <div className="text-gray-500">정답률</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-500 mb-1.5">카테고리별</div>
              <div className="space-y-1">
                {NOTE_CATEGORIES.map((cat) => {
                  const cs = quizStats.byCategory[cat.key];
                  if (!cs || cs.reviewed === 0) return null;
                  const pct = Math.round((cs.correct / cs.reviewed) * 100);
                  return (
                    <div key={cat.key} className="flex items-center gap-2">
                      <span className="w-16 truncate text-gray-400">{cat.icon} {cat.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-gray-500 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direction toggle + Category filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setDirection(direction === "ja-to-ko" ? "ko-to-ja" : "ja-to-ko")}
          className="px-3 py-1.5 rounded-lg text-sm bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
        >
          {direction === "ja-to-ko" ? "🇯🇵 → 🇰🇷" : "🇰🇷 → 🇯🇵"}
        </button>
        <div className="w-px h-5 bg-white/10" />
        <button
          onClick={() => { setFilterCat("all"); setCurrentIndex(0); setShowAnswer(false); }}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCat === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          전체
        </button>
        {NOTE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => { setFilterCat(cat.key); setCurrentIndex(0); setShowAnswer(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCat === cat.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Session stats */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>복습 대기: <span className="text-white font-medium">{activeDue.length}</span></span>
        <span>오늘 학습: <span className="text-white font-medium">{sessionStats.total}</span></span>
        {sessionStats.total > 0 && (
          <span>정답률: <span className="text-emerald-400 font-medium">{Math.round((sessionStats.correct / sessionStats.total) * 100)}%</span></span>
        )}
      </div>

      {/* Quiz card */}
      {activeDue.length > 0 && currentIndex < activeDue.length ? (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 text-center space-y-4">
          <div className="text-xs text-gray-600">
            {currentIndex + 1} / {activeDue.length}
          </div>

          {/* Question */}
          {direction === "ja-to-ko" ? (
            <>
              <div className="text-2xl font-bold text-white py-4">
                {activeDue[currentIndex].japanese}
              </div>
              {activeDue[currentIndex].reading && (
                <div className="text-sm text-purple-400">
                  {activeDue[currentIndex].reading}
                </div>
              )}
            </>
          ) : (
            <div className="text-2xl font-bold text-white py-4">
              {activeDue[currentIndex].korean}
            </div>
          )}

          {/* Answer */}
          {showAnswer ? (
            <div className="space-y-4">
              {direction === "ja-to-ko" ? (
                <div className="text-lg text-emerald-400 font-medium py-2">
                  {activeDue[currentIndex].korean}
                </div>
              ) : (
                <div className="space-y-1 py-2">
                  <div className="text-lg text-emerald-400 font-medium">
                    {activeDue[currentIndex].japanese}
                  </div>
                  {activeDue[currentIndex].reading && (
                    <div className="text-sm text-purple-400">
                      {activeDue[currentIndex].reading}
                    </div>
                  )}
                </div>
              )}
              {activeDue[currentIndex].memo && (
                <div className="text-xs text-gray-500">{activeDue[currentIndex].memo}</div>
              )}
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => handleAnswer(1)}
                  className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  모름
                </button>
                <button
                  onClick={() => handleAnswer(3)}
                  className="px-4 py-2 rounded-lg text-sm bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors"
                >
                  어려움
                </button>
                <button
                  onClick={() => handleAnswer(4)}
                  className="px-4 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                >
                  보통
                </button>
                <button
                  onClick={() => handleAnswer(5)}
                  className="px-4 py-2 rounded-lg text-sm bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  쉬움
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAnswer(true)}
              className="px-6 py-3 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
            >
              정답 보기
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-10 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-emerald-400 font-medium mb-2">오늘 복습 완료!</p>
          <p className="text-gray-500 text-sm">
            총 {filtered.length}개 중 {filtered.length - activeDue.length}개 학습 완료
          </p>
        </div>
      )}

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={resetAll}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          학습 기록 초기화
        </button>
      </div>
    </div>
  );
}

/* ──── 업무 템플릿 ──── */

interface EmailTemplate {
  id: string;
  category: string;
  title: string;
  titleKo: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "meeting-request",
    category: "회의",
    title: "打ち合わせ依頼",
    titleKo: "미팅 요청",
    subject: "【ご相談】○○の件でお打ち合わせのお願い",
    body: `お疲れ様です。○○部の○○です。

○○の件について、ご相談させていただきたく、
お打ち合わせのお時間をいただけないでしょうか。

【議題】
・○○について

【候補日時】
・○月○日（○）○:00〜○:00
・○月○日（○）○:00〜○:00

ご都合の良い日時をお知らせいただけますと幸いです。
お忙しいところ恐れ入りますが、よろしくお願いいたします。`,
  },
  {
    id: "schedule-change",
    category: "회의",
    title: "日程変更のお願い",
    titleKo: "일정 변경 요청",
    subject: "【日程変更】○月○日の打ち合わせについて",
    body: `お疲れ様です。○○です。

○月○日に予定しておりました打ち合わせですが、
急な予定が入り、日程の変更をお願いできないでしょうか。

【変更希望日時】
・○月○日（○）○:00〜○:00
・○月○日（○）○:00〜○:00

ご迷惑をおかけして申し訳ございません。
ご検討のほど、よろしくお願いいたします。`,
  },
  {
    id: "bug-report",
    category: "기술",
    title: "不具合報告",
    titleKo: "결함 보고",
    subject: "【不具合報告】○○における○○の不具合について",
    body: `お疲れ様です。○○です。

○○において不具合を確認しましたので、ご報告いたします。

【対象】○○（型式：○○）
【発生日時】○年○月○日 ○:○○
【事象】
・○○の操作を行った際に、○○が発生する

【再現手順】
1. ○○を起動する
2. ○○の操作を行う
3. ○○が発生する

【再現率】○/○回（○%）
【影響範囲】○○

【添付資料】
・ログファイル
・スクリーンショット

ご確認のほど、よろしくお願いいたします。`,
  },
  {
    id: "test-result",
    category: "기술",
    title: "検証結果共有",
    titleKo: "검증 결과 공유",
    subject: "【検証結果】○○の評価結果について",
    body: `お疲れ様です。○○です。

○○の検証結果をご報告いたします。

【検証対象】○○
【検証期間】○月○日〜○月○日
【検証環境】○○

【結果サマリ】
・テスト項目数：○件
・合格：○件
・不合格：○件
・未実施：○件

【主な指摘事項】
1. ○○：○○（重要度：高/中/低）
2. ○○：○○（重要度：高/中/低）

【添付】
・検証結果一覧（Excel）

詳細についてはご質問ください。
よろしくお願いいたします。`,
  },
  {
    id: "spec-review",
    category: "기술",
    title: "仕様書レビュー依頼",
    titleKo: "사양서 리뷰 요청",
    subject: "【レビュー依頼】○○仕様書 v○.○",
    body: `お疲れ様です。○○です。

○○の仕様書を作成しましたので、
レビューをお願いいたします。

【文書名】○○仕様書 v○.○
【格納先】○○
【レビュー期限】○月○日（○）

【主な変更点】
・○○の要件を追加
・○○の条件を修正

お忙しいところ恐れ入りますが、
ご確認のほどよろしくお願いいたします。`,
  },
  {
    id: "progress-report",
    category: "보고",
    title: "進捗報告",
    titleKo: "진척 보고",
    subject: "【週報】○月○日〜○月○日 進捗報告",
    body: `お疲れ様です。○○です。
今週の進捗をご報告いたします。

【今週の実績】
・○○：○○を完了（進捗○%）
・○○：○○まで対応済み

【来週の予定】
・○○：○○を実施予定
・○○：○○を開始予定

【課題・相談事項】
・○○について、○○の判断が必要です

以上、よろしくお願いいたします。`,
  },
  {
    id: "absence",
    category: "근태",
    title: "休暇届",
    titleKo: "휴가 신청",
    subject: "【休暇届】○月○日 有給休暇取得のお願い",
    body: `お疲れ様です。○○です。

下記の通り、有給休暇を取得させていただきたく、
ご承認をお願いいたします。

【取得日】○月○日（○）
【種類】有給休暇 / 半休（午前/午後）
【理由】私用のため
【業務引継ぎ】○○さんへ依頼済み

ご迷惑をおかけしますが、
よろしくお願いいたします。`,
  },
  {
    id: "thank-you",
    category: "인사",
    title: "お礼メール",
    titleKo: "감사 메일",
    subject: "○○の件、ありがとうございました",
    body: `お疲れ様です。○○です。

先日は○○の件でお時間をいただき、
ありがとうございました。

○○について、大変参考になりました。
いただいたアドバイスをもとに、○○を進めてまいります。

今後ともご指導のほど、よろしくお願いいたします。`,
  },
];

const TEMPLATE_CATEGORIES = [...new Set(EMAIL_TEMPLATES.map((t) => t.category))];

function TemplatesTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string | "all">("all");

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  const filtered = filterCat === "all"
    ? EMAIL_TEMPLATES
    : EMAIL_TEMPLATES.filter((t) => t.category === filterCat);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Honda 업무에서 자주 쓰는 일본어 메일 템플릿입니다. 클릭하여 펼치고 복사할 수 있습니다.
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCat === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          전체 ({EMAIL_TEMPLATES.length})
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCat === cat ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            {cat} ({EMAIL_TEMPLATES.filter((t) => t.category === cat).length})
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="space-y-2">
        {filtered.map((tpl) => {
          const isExpanded = expandedId === tpl.id;
          const isCopied = copiedId === tpl.id;

          return (
            <div key={tpl.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400 shrink-0">{tpl.category}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{tpl.title}</div>
                  <div className="text-xs text-gray-500">{tpl.titleKo}</div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5">
                  {/* Subject */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">件名 (제목)</span>
                      <button
                        onClick={() => copyToClipboard(tpl.subject, tpl.id + "-subj")}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {copiedId === tpl.id + "-subj" ? "copied!" : "복사"}
                      </button>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-white/10 text-sm text-white font-mono">
                      {tpl.subject}
                    </div>
                  </div>

                  {/* Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">本文 (본문)</span>
                      <button
                        onClick={() => copyToClipboard(tpl.body, tpl.id)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {isCopied ? "copied!" : "복사"}
                      </button>
                    </div>
                    <pre className="px-3 py-2 rounded-lg bg-white/10 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {tpl.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
