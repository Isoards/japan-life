export interface Track {
  title: string;
  titleJa?: string;
  spotifyId: string;
}

export interface Artist {
  slug: string;
  name: string;
  nameJa: string;
  genre: string[];
  image: string;
  description: string;
  itunesId: number;
  tracks: Track[];
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

export interface EnrichedArtist extends Omit<Artist, "tracks"> {
  imageUrl: string | null;
  itunesTracks: ITunesTrack[];
}

// ── 취업/이주 준비 대시보드 타입 ──

export type ChecklistCategory = "pre-departure" | "post-arrival" | "living-setup" | "workplace";
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
}

export interface BudgetData {
  income: number;
  categories: BudgetCategory[];
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
}
