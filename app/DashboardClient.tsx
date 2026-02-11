"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHighResArtwork, formatDuration } from "@/lib/itunes";
import MusicButton from "@/components/MusicButton";
import FavoriteButton from "@/components/FavoriteButton";
import {
  useFavorites,
  useChecklist,
  useConcerts,
  useNotes,
  useSpots,
  useBudget,
  useReleases,
  useSearch,
} from "@/lib/hooks/use-api";

export default function DashboardClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: favorites = [] } = useFavorites();
  const { data: checklist = [] } = useChecklist();
  const { data: concerts = [] } = useConcerts();
  const { data: notes = [] } = useNotes();
  const { data: spots = [] } = useSpots();
  const { data: budget } = useBudget();

  const releaseIds = useMemo(
    () => (favorites.length > 0 ? favorites.map((f) => f.itunesId).join(",") : null),
    [favorites],
  );
  const { data: newReleases = [], isLoading: releasesLoading } = useReleases(releaseIds);
  const { data: searchResults = [], isLoading: searching } = useSearch(debouncedQuery);

  // Debounce search query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derived stats
  const { checkedCount, totalChecklist, checklistPct, highPriorityLeft } = useMemo(() => {
    const checked = checklist.filter((c) => c.checked).length;
    const total = checklist.length;
    return {
      checkedCount: checked,
      totalChecklist: total,
      checklistPct: total > 0 ? Math.round((checked / total) * 100) : 0,
      highPriorityLeft: checklist.filter((c) => c.priority === "high" && !c.checked).length,
    };
  }, [checklist]);

  const { upcomingConcerts, nextConcert } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = concerts
      .filter((c) => c.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return { upcomingConcerts: upcoming, nextConcert: upcoming[0] || null };
  }, [concerts]);

  const { budgetTotal, budgetIncome, budgetRemaining } = useMemo(() => {
    const total = budget?.categories?.reduce((s, c) => s + c.amount, 0) ?? 0;
    const income = budget?.income ?? 0;
    return { budgetTotal: total, budgetIncome: income, budgetRemaining: income - total };
  }, [budget]);

  return (
    <div className="space-y-10">
      {/* Hero + Search */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Japan Life
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          일본 생활 대시보드
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Checklist */}
        <Link href="/checklist">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-emerald-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✅</span>
              <span className="text-sm font-medium text-gray-400">체크리스트</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{checklistPct}%</div>
            <div className="w-full h-1.5 rounded-full bg-white/10 mb-2">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {checkedCount}/{totalChecklist} 완료
              {highPriorityLeft > 0 && (
                <span className="text-amber-400 ml-1">({highPriorityLeft} 중요)</span>
              )}
            </p>
          </div>
        </Link>

        {/* Budget */}
        <Link href="/calculator">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-blue-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💰</span>
              <span className="text-sm font-medium text-gray-400">예산</span>
            </div>
            {budgetIncome > 0 ? (
              <>
                <div className="text-2xl font-bold text-white mb-1">
                  ¥{budgetRemaining.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  ¥{budgetIncome.toLocaleString()} 중 ¥{budgetTotal.toLocaleString()} 지출
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-600 mb-1">--</div>
                <p className="text-xs text-gray-500">예산을 설정하세요</p>
              </>
            )}
          </div>
        </Link>

        {/* Concerts */}
        <Link href="/concerts">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-purple-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎵</span>
              <span className="text-sm font-medium text-gray-400">콘서트</span>
            </div>
            {nextConcert ? (
              <>
                <div className="text-sm font-bold text-white mb-1 truncate">{nextConcert.title}</div>
                <p className="text-xs text-gray-500 truncate">{nextConcert.date} · {nextConcert.venue}</p>
                <p className="text-xs text-purple-400 mt-1">
                  {upcomingConcerts.length}개 예정
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-600 mb-1">{concerts.length}</div>
                <p className="text-xs text-gray-500">
                  {concerts.length > 0 ? "기록된 콘서트" : "콘서트를 추가하세요"}
                </p>
              </>
            )}
          </div>
        </Link>

        {/* Notes & Spots */}
        <Link href="/notes">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-amber-500/30 transition-all h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium text-gray-400">메모 / 장소</span>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{notes.length}</div>
                <p className="text-xs text-gray-500">메모</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{spots.length}</div>
                <p className="text-xs text-gray-500">장소</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Inline Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="아티스트를 검색하세요... (예: Official髭男dism, LiSA, King Gnu)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {(searching || searchResults.length > 0) && searchQuery.length >= 2 && (
          <div className="mt-2 rounded-xl bg-gray-900/95 border border-white/10 overflow-hidden shadow-2xl">
            {searching && (
              <div className="p-4 text-center">
                <div className="inline-block w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!searching && searchResults.length > 0 && (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((artist) => (
                  <div
                    key={artist.itunesId}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <Link
                      href={`/artists/${artist.itunesId}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                        {artist.imageUrl ? (
                          <Image
                            src={artist.imageUrl}
                            alt={artist.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm">
                            {artist.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {artist.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {artist.genres.join(", ")}
                        </p>
                      </div>
                    </Link>
                    <FavoriteButton
                      artist={{
                        itunesId: artist.itunesId,
                        name: artist.name,
                        imageUrl: artist.imageUrl,
                        genres: artist.genres,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <p className="p-4 text-sm text-gray-500 text-center">
                아티스트를 찾을 수 없습니다
              </p>
            )}
          </div>
        )}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            ♥ 즐겨찾기
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {favorites.map((fav) => (
              <Link key={fav.itunesId} href={`/artists/${fav.itunesId}`}>
                <div className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-pink-500/30 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 relative">
                    {fav.imageUrl ? (
                      <Image
                        src={fav.imageUrl}
                        alt={fav.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xl">
                        {fav.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white text-center truncate group-hover:text-pink-400 transition-colors">
                    {fav.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Releases from Favorites */}
      {favorites.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            최신 발매
          </h2>
          {releasesLoading && (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!releasesLoading && newReleases.length > 0 && (
            <div className="space-y-2">
              {newReleases.map((track, i) => {
                const artworkUrl = getHighResArtwork(
                  track.artworkUrl100,
                  120
                );
                const releaseDate = new Date(track.releaseDate);
                const isRecent =
                  Date.now() - releaseDate.getTime() < 30 * 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={`${track.trackId}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={artworkUrl}
                        alt={track.trackName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">
                          {track.trackName}
                        </p>
                        {isRecent && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-pink-500/20 text-pink-300 shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        <Link
                          href={`/artists/${track.artistId}`}
                          className="hover:text-purple-400 transition-colors"
                        >
                          {track.artistName}
                        </Link>
                        {" · "}
                        {track.collectionName}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:block shrink-0">
                      {releaseDate.toLocaleDateString("ko", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-gray-500 hidden md:block shrink-0">
                      {formatDuration(track.trackTimeMillis)}
                    </span>
                    <div className="shrink-0">
                      <MusicButton
                        trackName={track.trackName}
                        artistName={track.artistName}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!releasesLoading && newReleases.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              발매 정보가 없습니다.
            </p>
          )}
        </section>
      )}

      {/* Empty State */}
      {favorites.length === 0 && (
        <section className="text-center py-10 rounded-xl border border-dashed border-white/10">
          <p className="text-gray-300 text-lg mb-2">
            위에서 아티스트를 검색하고 즐겨찾기에 추가하세요
          </p>
          <p className="text-gray-500 text-sm">
            최신 발매 정보가 여기에 표시됩니다
          </p>
        </section>
      )}
    </div>
  );
}
