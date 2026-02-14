// ── Source types ──

export type SourceType = "tweet" | "fanclub" | "ticket" | "promoter" | "news" | "manual";

export interface ConcertSource {
  id: string;
  type: SourceType;
  url?: string;
  text?: string;
  addedAt: string; // ISO datetime
}

// ── Milestone types ──

export type TicketMilestoneType =
  | "FC_LOTTERY_OPEN"
  | "FC_LOTTERY_CLOSE"
  | "FC_RESULT"
  | "OFFICIAL_LOTTERY_OPEN"
  | "OFFICIAL_LOTTERY_CLOSE"
  | "OFFICIAL_RESULT"
  | "GENERAL_SALE_OPEN"
  | "PAYMENT_DEADLINE"
  | "TICKET_ISSUE_OPEN"
  | "SHOW_DOOR_OPEN"
  | "SHOW_START";

export type MilestoneStatus = "planned" | "done" | "missed" | "cancelled";

export interface TicketMilestone {
  id: string;
  type: TicketMilestoneType;
  label: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: MilestoneStatus;
  memo?: string;
}

// ── ShowTime ──

export interface ShowTime {
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  venue?: string;
  city?: string;
}

// ── Concert status ──

export type ConcertStatus = "planned" | "confirmed" | "attended" | "cancelled";

// ── Main UserConcert v2 ──

export interface UserConcert {
  id: string;
  title: string;
  artist: string;
  date: string; // YYYY-MM-DD (primary/first date)
  venue: string;
  city: string;
  memo: string;
  status: ConcertStatus;
  ticketPrice?: number;
  ticketUrl?: string;

  // v2 additions
  showTimes: ShowTime[];
  milestones: TicketMilestone[];
  sources: ConcertSource[];
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  version: number;
}

// ── Milestone Korean labels ──

export const MILESTONE_LABELS: Record<TicketMilestoneType, string> = {
  FC_LOTTERY_OPEN: "FC 선행 접수 시작",
  FC_LOTTERY_CLOSE: "FC 선행 접수 마감",
  FC_RESULT: "FC 당락 발표",
  OFFICIAL_LOTTERY_OPEN: "오피셜 선행 시작",
  OFFICIAL_LOTTERY_CLOSE: "오피셜 선행 마감",
  OFFICIAL_RESULT: "오피셜 당락 발표",
  GENERAL_SALE_OPEN: "일반 발매",
  PAYMENT_DEADLINE: "입금 기한",
  TICKET_ISSUE_OPEN: "발권 시작",
  SHOW_DOOR_OPEN: "개장",
  SHOW_START: "개연",
};

// ── Milestone type display order ──

export const MILESTONE_ORDER: TicketMilestoneType[] = [
  "FC_LOTTERY_OPEN",
  "FC_LOTTERY_CLOSE",
  "FC_RESULT",
  "OFFICIAL_LOTTERY_OPEN",
  "OFFICIAL_LOTTERY_CLOSE",
  "OFFICIAL_RESULT",
  "GENERAL_SALE_OPEN",
  "PAYMENT_DEADLINE",
  "TICKET_ISSUE_OPEN",
  "SHOW_DOOR_OPEN",
  "SHOW_START",
];
