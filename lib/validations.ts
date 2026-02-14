import { z } from "zod";

// ── Notes ──

export const noteSchema = z.object({
  japanese: z.string().min(1),
  korean: z.string().min(1),
  reading: z.string().optional(),
  memo: z.string().optional(),
  category: z.enum(["business", "honda", "daily", "other"]),
});

export const notePatchSchema = noteSchema.extend({
  id: z.string().min(1),
});

// ── Budget ──

export const budgetCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().min(0),
  icon: z.string(),
  sheetCategories: z.array(z.string()).optional(),
});

export const budgetSchema = z.object({
  income: z.number().min(0),
  categories: z.array(budgetCategorySchema),
  period: z.enum(["apr-jul", "aug-dec", "year2"]).optional(),
});

// ── Checklist ──

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["pre-departure", "post-arrival", "living-setup", "workplace", "finance"]),
  title: z.string().min(1),
  description: z.string().optional(),
  checked: z.boolean(),
  priority: z.enum(["high", "medium", "low"]),
  custom: z.boolean().optional(),
});

// ── Links ──

export const linkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  category: z.string().min(1),
  icon: z.string().optional(),
});

export const linkPatchSchema = linkSchema.extend({
  id: z.string().min(1),
});

// ── User Concerts ──

export const showTimeSchema = z.object({
  date: z.string().min(1),
  time: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
});

export const concertSourceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["tweet", "fanclub", "ticket", "promoter", "news", "manual"]),
  url: z.string().optional(),
  text: z.string().optional(),
  addedAt: z.string().min(1),
});

export const ticketMilestoneSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
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
  ]),
  label: z.string().min(1),
  date: z.string().min(1),
  time: z.string().optional(),
  status: z.enum(["planned", "done", "missed", "cancelled"]),
  memo: z.string().optional(),
});

export const userConcertSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional().default(""),
  date: z.string().min(1),
  venue: z.string().optional().default(""),
  city: z.string().optional().default(""),
  memo: z.string().optional().default(""),
  status: z.enum(["planned", "confirmed", "attended", "cancelled"]).optional().default("planned"),
  ticketPrice: z.number().optional(),
  ticketUrl: z.string().optional(),
  showTimes: z.array(showTimeSchema).optional().default([]),
  milestones: z.array(ticketMilestoneSchema).optional().default([]),
  sources: z.array(concertSourceSchema).optional().default([]),
});

export const userConcertPatchSchema = userConcertSchema.partial().extend({
  id: z.string().min(1),
});

// ── Weekly Logs ──

export const weeklyLogSchema = z.object({
  week: z.string().min(1),
  technical: z.string().min(1),
  expression: z.string().min(1),
  mistake: z.string().min(1),
  memo: z.string().optional(),
});

export const weeklyLogPatchSchema = weeklyLogSchema.extend({
  id: z.string().min(1),
});

// ── Helpers ──

export const idSchema = z.object({
  id: z.string().min(1),
});

/** Parse with zod — returns data or throws a string error for the caller to catch */
export function parseOrError<T>(schema: z.ZodType<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
  return { ok: false, error: messages };
}
