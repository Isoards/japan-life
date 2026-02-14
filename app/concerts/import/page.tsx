"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutateAPI } from "@/lib/hooks/use-api";
import { useToast } from "@/components/Toast";
import type { ParsedConcertDraft } from "@/lib/concertParser";
import type { SourceType } from "@/lib/userConcerts";
import TicketTimeline from "@/components/TicketTimeline";

type Stage = "input" | "preview";
type Tab = "text" | "url";

export default function ConcertImportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [stage, setStage] = useState<Stage>("input");
  const [tab, setTab] = useState<Tab>("text");
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Draft state (editable after parse)
  const [draft, setDraft] = useState<ParsedConcertDraft | null>(null);
  const [sourceInfo, setSourceInfo] = useState<{
    type: SourceType;
    url?: string;
  } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editCity, setEditCity] = useState("");
  const [saving, setSaving] = useState(false);

  const handleParse = async () => {
    const payload =
      tab === "text" ? { text: inputText } : { url: inputUrl.trim() };

    if (tab === "text" && !inputText.trim()) {
      toast("텍스트를 입력해주세요", "error");
      return;
    }
    if (tab === "url" && !inputUrl.trim()) {
      toast("URL을 입력해주세요", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user-concerts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "파싱에 실패했습니다", "error");
        return;
      }

      const parsed = data.draft as ParsedConcertDraft;
      setDraft(parsed);
      setSourceInfo(data.source);
      setEditTitle(parsed.title);
      setEditArtist(parsed.artist);
      setEditVenue(parsed.venue);
      setEditCity(parsed.city);
      setStage("preview");
    } catch {
      toast("네트워크 오류가 발생했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;

    const primaryDate =
      draft.showTimes.length > 0
        ? draft.showTimes[0].date
        : new Date().toISOString().split("T")[0];

    const now = new Date().toISOString();
    const sources = sourceInfo
      ? [
          {
            id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: sourceInfo.type,
            url: sourceInfo.url,
            text: tab === "text" ? inputText : undefined,
            addedAt: now,
          },
        ]
      : [];

    const body = {
      title: editTitle.trim() || "제목 없음",
      artist: editArtist.trim(),
      date: primaryDate,
      venue: editVenue.trim(),
      city: editCity.trim(),
      memo: "",
      status: "planned",
      ticketPrice: draft.ticketPrice,
      showTimes: draft.showTimes,
      milestones: draft.milestones,
      sources,
    };

    setSaving(true);
    const res = await mutateAPI("/api/user-concerts", "POST", body);
    setSaving(false);

    if (res.ok) {
      toast("콘서트를 저장했습니다");
      router.push("/concerts");
    } else {
      toast(res.error, "error");
    }
  };

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
        <h1 className="text-2xl font-bold text-white">콘서트 정보 가져오기</h1>
      </div>

      {stage === "input" && (
        <>
          {/* Tab Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 w-fit">
            <button
              onClick={() => setTab("text")}
              className={`px-5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                tab === "text"
                  ? "bg-amber-500/30 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              텍스트 붙여넣기
            </button>
            <button
              onClick={() => setTab("url")}
              className={`px-5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                tab === "url"
                  ? "bg-amber-500/30 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              URL 입력
            </button>
          </div>

          {/* Input */}
          {tab === "text" ? (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`공지 내용을 붙여넣으세요...\n\n예:\nAdo LIVE TOUR 2026\n国立代々木競技場 第一体育館\nFC先行(抽選) 受付期間：2026/3/1(日) 12:00〜2026/3/5(木) 23:59\n当落発表：2026/3/10(火) 18:00\n一般発売：2026/3/20(金) 10:00\n開場 17:00 / 開演 18:00`}
              rows={12}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm resize-none"
            />
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://x.com/.../status/... 또는 프로모터/티켓 페이지 URL"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
              />
              <p className="text-xs text-gray-500">
                팬클럽(로그인 필요) 페이지는 텍스트 붙여넣기를 사용해주세요.
              </p>
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                분석 중...
              </span>
            ) : (
              "분석하기"
            )}
          </button>
        </>
      )}

      {stage === "preview" && draft && (
        <>
          {/* Warnings */}
          {draft.warnings.length > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-1">
              {draft.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-300">
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Editable Fields */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              기본 정보
            </h3>

            <div>
              <label className="block text-xs text-gray-500 mb-1">제목</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                아티스트
              </label>
              <input
                type="text"
                value={editArtist}
                onChange={(e) => setEditArtist(e.target.value)}
                placeholder="아티스트명을 입력하세요"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  공연장
                </label>
                <input
                  type="text"
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  도시
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {draft.ticketPrice && (
              <p className="text-sm text-gray-400">
                티켓 가격:{" "}
                <span className="text-white">
                  ¥{draft.ticketPrice.toLocaleString()}
                </span>
              </p>
            )}
          </div>

          {/* ShowTimes */}
          {draft.showTimes.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                공연 일시
              </h3>
              <div className="space-y-2">
                {draft.showTimes.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-white"
                  >
                    <span className="text-pink-400">
                      {st.date}
                      {st.time && ` ${st.time}`}
                    </span>
                    {st.venue && (
                      <span className="text-gray-400">{st.venue}</span>
                    )}
                    {st.city && (
                      <span className="text-gray-500">{st.city}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {draft.milestones.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                티켓 마일스톤
              </h3>
              <TicketTimeline milestones={draft.milestones} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50 text-sm"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
            <button
              onClick={() => {
                setStage("input");
                setDraft(null);
              }}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-sm"
            >
              다시 입력
            </button>
          </div>
        </>
      )}
    </div>
  );
}
