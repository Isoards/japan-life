"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useConcerts, mutateAPI } from "@/lib/hooks/use-api";
import { useToast } from "@/components/Toast";
import type { MilestoneStatus } from "@/lib/userConcerts";
import TicketTimeline from "@/components/TicketTimeline";

const STATUS_LABELS: Record<string, string> = {
  planned: "예정",
  confirmed: "확정",
  attended: "관람 완료",
  cancelled: "취소",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  attended: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function ConcertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: concerts = [], mutate } = useConcerts();

  const concert = useMemo(
    () => concerts.find((c) => c.id === params.id),
    [concerts, params.id],
  );

  const handleMilestoneStatusChange = async (
    milestoneId: string,
    newStatus: MilestoneStatus,
  ) => {
    if (!concert) return;
    const updatedMilestones = concert.milestones.map((ms) =>
      ms.id === milestoneId ? { ...ms, status: newStatus } : ms,
    );
    const res = await mutateAPI("/api/user-concerts", "PATCH", {
      id: concert.id,
      milestones: updatedMilestones,
    });
    if (res.ok) {
      mutate();
    } else {
      toast(res.error, "error");
    }
  };

  const handleDelete = async () => {
    if (!concert) return;
    const res = await mutateAPI("/api/user-concerts", "DELETE", {
      id: concert.id,
    });
    if (res.ok) {
      toast("콘서트를 삭제했습니다");
      router.push("/concerts");
    } else {
      toast(res.error, "error");
    }
  };

  if (!concert) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-gray-400">
          {concerts.length === 0 ? "로딩 중..." : "콘서트를 찾을 수 없습니다"}
        </div>
        <Link
          href="/concerts"
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/concerts"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white truncate">
          {concert.title}
        </h1>
      </div>

      {/* Concert Info */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {concert.artist && (
            <span className="text-purple-400 font-medium">
              {concert.artist}
            </span>
          )}
          {(concert.venue || concert.city) && (
            <span className="text-gray-400 text-sm">
              {[concert.venue, concert.city].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-md border ${STATUS_COLORS[concert.status] ?? STATUS_COLORS.planned}`}
          >
            {STATUS_LABELS[concert.status] ?? concert.status}
          </span>
          {concert.ticketPrice && (
            <span className="text-xs text-gray-400">
              ¥{concert.ticketPrice.toLocaleString()}
            </span>
          )}
          {concert.ticketUrl && (
            <a
              href={concert.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              티켓 링크
            </a>
          )}
        </div>
      </div>

      {/* Show Times */}
      {(concert.showTimes?.length > 0 ||
        concert.date) && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-3">공연 일시</h2>
          <div className="space-y-2">
            {concert.showTimes?.length > 0 ? (
              concert.showTimes.map((st, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-pink-400 text-sm font-mono">
                    {st.date}
                    {st.time && ` ${st.time}`}
                  </span>
                  {st.venue && (
                    <span className="text-gray-400 text-sm">{st.venue}</span>
                  )}
                  {st.city && (
                    <span className="text-gray-500 text-sm">{st.city}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-pink-400 text-sm font-mono">
                {concert.date}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Timeline */}
      {concert.milestones?.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-4">
            티켓 타임라인
          </h2>
          <TicketTimeline
            milestones={concert.milestones}
            onStatusChange={handleMilestoneStatusChange}
          />
        </div>
      )}

      {/* Sources */}
      {concert.sources?.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-3">출처</h2>
          <div className="space-y-2">
            {concert.sources.map((src) => (
              <div key={src.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                  {src.type}
                </span>
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 truncate transition-colors"
                  >
                    {src.url}
                  </a>
                ) : (
                  <span className="text-gray-500 truncate">
                    텍스트 붙여넣기
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memo */}
      {concert.memo && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-medium text-gray-400 mb-2">메모</h2>
          <p className="text-sm text-white whitespace-pre-wrap">
            {concert.memo}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleDelete}
          className="px-4 py-2 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
