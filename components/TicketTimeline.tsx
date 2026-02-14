"use client";

import type { TicketMilestone, MilestoneStatus } from "@/lib/userConcerts";

const STATUS_STYLES: Record<
  MilestoneStatus,
  { dot: string; badge: string; badgeText: string; line: string }
> = {
  done: {
    dot: "bg-emerald-400 border-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
    badgeText: "완료",
    line: "border-emerald-400/30",
  },
  planned: {
    dot: "bg-purple-400 border-purple-400",
    badge: "bg-purple-500/20 text-purple-300",
    badgeText: "예정",
    line: "border-white/10",
  },
  missed: {
    dot: "bg-red-400 border-red-400",
    badge: "bg-red-500/20 text-red-300",
    badgeText: "놓침",
    line: "border-red-400/30",
  },
  cancelled: {
    dot: "bg-gray-600 border-gray-600",
    badge: "bg-white/5 text-gray-500",
    badgeText: "취소",
    line: "border-white/5",
  },
};

const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = {
  planned: "done",
  done: "planned",
  missed: "done",
  cancelled: "planned",
};

interface TicketTimelineProps {
  milestones: TicketMilestone[];
  onStatusChange?: (id: string, status: MilestoneStatus) => void;
}

export default function TicketTimeline({
  milestones,
  onStatusChange,
}: TicketTimelineProps) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">등록된 마일스톤이 없습니다.</p>
    );
  }

  const sorted = [...milestones].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="relative ml-3">
      {sorted.map((ms, i) => {
        const style = STATUS_STYLES[ms.status];
        const isLast = i === sorted.length - 1;
        const isPast = ms.date < today && ms.status === "planned";

        return (
          <div key={ms.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div
                className={`absolute left-[7px] top-5 bottom-0 w-px border-l-2 ${style.line}`}
              />
            )}

            {/* Dot */}
            <div className="relative z-10 shrink-0 mt-1">
              <div
                className={`w-4 h-4 rounded-full border-2 ${style.dot} ${
                  onStatusChange ? "cursor-pointer hover:scale-125 transition-transform" : ""
                }`}
                onClick={() => {
                  if (onStatusChange) {
                    onStatusChange(ms.id, NEXT_STATUS[ms.status]);
                  }
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-medium ${
                    ms.status === "cancelled"
                      ? "text-gray-500 line-through"
                      : "text-white"
                  }`}
                >
                  {ms.label}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${style.badge}`}
                >
                  {style.badgeText}
                </span>
                {isPast && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    기한 지남
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {ms.date}
                {ms.time && ` ${ms.time}`}
              </p>
              {ms.memo && (
                <p className="text-xs text-gray-500 mt-1">{ms.memo}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
