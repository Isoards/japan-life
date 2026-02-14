export interface Artist {
  slug: string;
  name: string;
  nameJa: string;
  genre: string[];
  image: string;
  description: string;
  itunesId: number;
}

export interface Concert {
  id: string;
  artistSlug: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketUrl: string;
}

export interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artistId: number;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackViewUrl: string;
  releaseDate: string;
  trackTimeMillis: number;
  primaryGenreName: string;
}

export interface EnrichedArtist extends Artist {
  imageUrl: string | null;
  itunesTracks: ITunesTrack[];
}

// ── 취업/이주 준비 대시보드 타입 ──

export type ChecklistCategory = "pre-departure" | "post-arrival" | "living-setup" | "workplace" | "finance";
export type ChecklistPriority = "high" | "medium" | "low";

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  title: string;
  description?: string;
  checked: boolean;
  priority: ChecklistPriority;
  custom?: boolean;
}

export interface SalaryBreakdown {
  monthlyBase: number;
  bonusMonths: number;
  grossAnnual: number;
  grossMonthly: number;
  incomeTax: number;
  residentTax: number;
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  totalDeductions: number;
  netMonthly: number;
  bonusGrossPerPayment: number;
  bonusNetPerPayment: number;
  netAnnual: number;
}

export interface BudgetCategory {
  id: string;
  label: string;
  amount: number;
  icon: string;
  sheetCategories: string[];
}

export interface SheetsSummary {
  month: string;
  byCategory: Record<string, number>;
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
}

export type BudgetPeriod = "apr-jul" | "aug-dec" | "year2";

export interface BudgetData {
  income: number;
  categories: BudgetCategory[];
  period?: BudgetPeriod;
}

export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  items: GuideItem[];
}

export interface GuideItem {
  title: string;
  content: string;
  linkedChecklist?: string[];
}

// ── 메모장 ──

export type NoteCategory = "business" | "honda" | "daily" | "other";

export interface Note {
  id: string;
  category: NoteCategory;
  japanese: string;
  reading?: string;
  korean: string;
  memo?: string;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  category: string;
  icon?: string;
}

// ── 주간 회고 로그 ──

export interface WeeklyLog {
  id: string;
  week: string;
  technical: string;
  expression: string;
  mistake: string;
  memo?: string;
  createdAt: string;
}

// ── 노래방 검색 ──

export interface KaraokeSong {
  brand: "tj" | "kumyoung";
  no: string;
  title: string;
  singer: string;
  composer: string;
  lyricist: string;
  release: string;
}
