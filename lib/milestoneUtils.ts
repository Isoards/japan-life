import type { UserConcert, TicketMilestone } from "./userConcerts";

export interface UpcomingMilestone extends TicketMilestone {
  concertId: string;
  concertTitle: string;
}

/**
 * Get milestones due within the next N days, sorted by date.
 */
export function getUpcomingMilestones(
  concerts: UserConcert[],
  days: number = 7,
): UpcomingMilestone[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().split("T")[0];
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const results: UpcomingMilestone[] = [];

  for (const concert of concerts) {
    for (const ms of concert.milestones ?? []) {
      if (ms.status !== "planned") continue;
      if (ms.date >= todayStr && ms.date <= cutoffStr) {
        results.push({
          ...ms,
          concertId: concert.id,
          concertTitle: concert.title,
        });
      }
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get the next milestone for a single concert (for card display).
 */
export function getNextMilestone(concert: UserConcert): TicketMilestone | null {
  const today = new Date().toISOString().split("T")[0];
  return (
    (concert.milestones ?? [])
      .filter((ms) => ms.status === "planned" && ms.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}
