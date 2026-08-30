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

export interface SalaryLineItem {
  id: string;
  label: string;
  labelJa: string;
  amount: number;
}

export interface PayslipEarningItem extends SalaryLineItem {
  taxable: boolean;
}

export type PayslipDeductionCategory = "tax" | "social" | "company";

export interface PayslipDeductionItem extends SalaryLineItem {
  category: PayslipDeductionCategory;
}

export interface PayslipBreakdown {
  earnings: PayslipEarningItem[];
  deductions: PayslipDeductionItem[];
  totalEarnings: number;
  taxableEarnings: number;
  nonTaxableEarnings: number;
  totalDeductions: number;
  statutoryDeductions: number;
  companyDeductions: number;
  socialInsuranceTotal: number;
  taxTotal: number;
  netPay: number;
  takeHomeRate: number;
  deductionRate: number;
}

export interface BudgetCategory {
  id: string;
  label: string;
  amount: number;
  icon: string;
  sheetCategories: string[];
}

export interface SinkingFund {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetMonth?: string;
}

export interface SheetsSummary {
  month: string;
  byCategory: Record<string, number>;
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
}

export interface BudgetData {
  income: number;
  categories: BudgetCategory[];
  sinkingFunds: SinkingFund[];
}

export type NoteCategory = "business" | "ev" | "vehicle" | "daily" | "sw";

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

export interface KaraokeSong {
  brand: "tj" | "kumyoung";
  no: string;
  title: string;
  singer: string;
  composer: string;
  lyricist: string;
  release: string;
}

// ── Weather ──

export interface WeatherCurrent {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
}

export interface WeatherDaily {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  daily: WeatherDaily[];
  fetchedAt: string;
  locationLabel?: string;
}

// ── Garbage ──

export type GarbageType =
  | "burnable"
  | "non-burnable"
  | "recyclable"
  | "pet-bottles"
  | "plastic"
  | "paper"
  | "cans-bottles";

export interface GarbageScheduleEntry {
  type: GarbageType;
  label: string;
  labelJa: string;
  icon: string;
  dayOfWeek: number[];
  /** 시구정촌이 공지한 예외를 포함한 실제 수거일. 있으면 요일보다 우선한다. */
  collectionDates?: string[];
  frequency?: "weekly" | "biweekly" | "monthly";
  note?: string;
}

export interface GarbageScheduleData {
  entries: GarbageScheduleEntry[];
  region?: string;
  sourceUrl?: string;
  validThrough?: string;
}

// ── Packages ──

export type PackageCarrier =
  | "yamato"
  | "sagawa"
  | "japan-post"
  | "ems"
  | "dhl"
  | "fedex"
  | "other";

export type PackageStatus = "pending" | "in-transit" | "delivered" | "returned";

export interface PackageEntry {
  id: string;
  trackingNumber: string;
  carrier: PackageCarrier;
  description: string;
  status: PackageStatus;
  createdAt: string;
  deliveredAt?: string;
  memo?: string;
}

// ── Monthly Trend ──

export interface MonthlyTrend {
  month: string;
  totalExpense: number;
  totalIncome: number;
  totalSaving: number;
  byCategory: Record<string, number>;
}

export interface RecurringExpense {
  id: string;
  label: string;
  category: string;
  months: string[];
  occurrences: number;
  averageAmount: number;
  latestAmount: number;
  latestMonth: string;
  minAmount: number;
  maxAmount: number;
  variationRate: number;
  confidence: "high" | "medium";
}

export interface RecurringExpensesResult {
  months: number;
  estimatedMonthlyTotal: number;
  items: RecurringExpense[];
}
