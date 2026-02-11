"use client";

import { useState, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTopSongs, ChartSong } from "@/lib/hooks/use-api";

export default function ArtistsClient() {
  const { data: songs = [], isLoading } = useTopSongs();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.songName.toLowerCase().includes(q) ||
        s.artistName.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  const top3 = !searchQuery ? filtered.slice(0, 3) : [];
  const rest = !searchQuery ? filtered.slice(3) : filtered;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            일본 TOP 100
          </h1>
          <p className="text-gray-400 mt-1">Apple Music 일본 인기 차트</p>
        </div>
        <Link
          href="/search"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
        >
          아티스트 검색
        </Link>
      </div>

      {/* Search */}
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
          placeholder="곡명 또는 아티스트 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {searchQuery && (
        <p className="text-sm text-gray-400">
          &ldquo;{searchQuery}&rdquo; 검색 결과 {filtered.length}곡
        </p>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* TOP 3 Hero Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((song) => (
                <TopCard key={song.rank} song={song} />
              ))}
            </div>
          )}

          {/* Rest of chart */}
          {rest.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              {rest.map((song, i) => (
                <SongRow key={`${song.rank}-${song.songName}`} song={song} isLast={i === rest.length - 1} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              검색 결과가 없습니다.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ──── TOP 3 Hero Card ──── */
const TopCard = memo(function TopCard({ song }: { song: ChartSong }) {
  const medals = ["", "bg-yellow-500/20 border-yellow-500/30", "bg-gray-400/15 border-gray-400/30", "bg-amber-700/20 border-amber-700/30"];
  const rankLabels = ["", "1st", "2nd", "3rd"];
  const rankColors = ["", "text-yellow-400", "text-gray-300", "text-amber-500"];

  return (
    <Link href={`/artists/${song.artistId}`}>
      <div className={`group rounded-xl border p-4 transition-all hover:scale-[1.02] cursor-pointer ${medals[song.rank]}`}>
        {/* Rank badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${rankColors[song.rank]}`}>
            {rankLabels[song.rank]}
          </span>
          <svg
            className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Artwork */}
        <div className="aspect-square rounded-lg overflow-hidden relative mb-3 shadow-lg">
          {song.artworkUrl ? (
            <Image
              src={song.artworkUrl}
              alt={song.songName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-4xl">
              {song.songName.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="font-bold text-white truncate group-hover:text-pink-400 transition-colors">
          {song.songName}
        </h3>
        <p className="text-sm text-gray-400 truncate mt-0.5">
          {song.artistName}
        </p>
      </div>
    </Link>
  );
});

/* ──── Song Row ──── */
const SongRow = memo(function SongRow({ song, isLast }: { song: ChartSong; isLast: boolean }) {
  const isTop10 = song.rank <= 10;

  return (
    <Link href={`/artists/${song.artistId}`}>
      <div className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group ${!isLast ? "border-b border-white/5" : ""}`}>
        {/* Rank */}
        <span className={`w-8 text-center font-bold shrink-0 ${isTop10 ? "text-purple-400" : "text-gray-600"}`}>
          {song.rank}
        </span>

        {/* Album Art */}
        <div className="w-11 h-11 rounded-md overflow-hidden shrink-0 relative">
          {song.artworkUrl ? (
            <Image
              src={song.artworkUrl}
              alt={song.songName}
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs">
              {song.songName.charAt(0)}
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm truncate group-hover:text-pink-400 transition-colors ${isTop10 ? "font-semibold text-white" : "font-medium text-gray-200"}`}>
            {song.songName}
          </h3>
          <p className="text-xs text-gray-500 truncate">{song.artistName}</p>
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
});

/* ──── Loading Skeleton ──── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="h-4 w-8 bg-white/10 rounded mb-3" />
            <div className="aspect-square bg-white/10 rounded-lg mb-3" />
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <div className="w-8 h-5 bg-white/10 rounded" />
            <div className="w-11 h-11 bg-white/10 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-2/5" />
              <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
