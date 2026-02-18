import type { Note, NoteCategory } from "./types";

// ── SRS State ──

export interface SrsEntry {
  interval: number;
  easeFactor: number;
  nextReview: string;
  repetitions: number;
}

export interface SrsState {
  [noteId: string]: SrsEntry;
}

const SRS_KEY = "japan-life-srs";

export function loadSrs(): SrsState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveSrs(state: SrsState) {
  localStorage.setItem(SRS_KEY, JSON.stringify(state));
}

export function getDueNotes(notes: Note[], srs: SrsState): Note[] {
  const today = new Date().toISOString().slice(0, 10);
  return notes.filter((n) => {
    const s = srs[n.id];
    if (!s) return true;
    return s.nextReview <= today;
  });
}

export function updateSrs(srs: SrsState, noteId: string, quality: number): SrsState {
  const prev = srs[noteId] || { interval: 0, easeFactor: 2.5, nextReview: "", repetitions: 0 };
  let { interval, easeFactor, repetitions } = prev;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    ...srs,
    [noteId]: {
      interval,
      easeFactor,
      nextReview: next.toISOString().slice(0, 10),
      repetitions,
    },
  };
}

// ── Quiz Stats ──

export interface QuizStats {
  totalReviewed: number;
  totalCorrect: number;
  streakDays: number;
  lastReviewDate: string;
  byCategory: Record<string, { reviewed: number; correct: number }>;
}

const STATS_KEY = "japan-life-quiz-stats";

function defaultStats(): QuizStats {
  return { totalReviewed: 0, totalCorrect: 0, streakDays: 0, lastReviewDate: "", byCategory: {} };
}

export function loadQuizStats(): QuizStats {
  if (typeof window === "undefined") return defaultStats();
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats();
    return { ...defaultStats(), ...JSON.parse(raw) };
  } catch {
    return defaultStats();
  }
}

export function saveQuizStats(stats: QuizStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function updateQuizStats(
  stats: QuizStats,
  category: NoteCategory,
  correct: boolean,
): QuizStats {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streakDays = stats.streakDays;
  if (stats.lastReviewDate === today) {
    // same day, streak unchanged
  } else if (stats.lastReviewDate === yesterday) {
    streakDays += 1;
  } else {
    streakDays = 1;
  }

  const catStats = stats.byCategory[category] || { reviewed: 0, correct: 0 };

  return {
    totalReviewed: stats.totalReviewed + 1,
    totalCorrect: stats.totalCorrect + (correct ? 1 : 0),
    streakDays,
    lastReviewDate: today,
    byCategory: {
      ...stats.byCategory,
      [category]: {
        reviewed: catStats.reviewed + 1,
        correct: catStats.correct + (correct ? 1 : 0),
      },
    },
  };
}
