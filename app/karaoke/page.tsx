"use client";

import { useEffect, useMemo, useState } from "react";
import { useKaraokeSearch } from "@/lib/hooks/use-api";

export default function KaraokePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchType, setSearchType] = useState<"song" | "singer">("singer");

  useEffect(() => {
    const nextQuery = query.trim();
    const delay = nextQuery.length < 1 ? 0 : 400;
    const timer = setTimeout(() => setDebouncedQuery(nextQuery.length < 1 ? "" : nextQuery), delay);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useKaraokeSearch(debouncedQuery || null, searchType);

  const sortByDate = (a: { release: string }, b: { release: string }) => b.release.localeCompare(a.release);
  const tjSongs = useMemo(() => (results ?? []).filter((s) => s.brand === "tj").sort(sortByDate), [results]);
  const kySongs = useMemo(() => (results ?? []).filter((s) => s.brand === "kumyoung").sort(sortByDate), [results]);

  const hasResults = tjSongs.length > 0 || kySongs.length > 0;
  const searched = debouncedQuery.length >= 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">🎤</span> 노래방 번호 검색
        </h1>
        <p className="text-gray-400 mt-1">곡명 또는 가수명으로 TJ/금영 번호를 찾습니다.</p>
      </div>

      <div className="flex gap-2">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as "song" | "singer")}
          className="bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
        >
          <option value="song">노래 제목</option>
          <option value="singer">가수 이름</option>
        </select>

        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchType === "song" ? "노래 제목 입력 (예: 아이돌)" : "가수 이름 입력 (예: YOASOBI)"}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {searched && !isLoading && !hasResults && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-5xl mb-3">🔎</p>
          <p className="text-lg">검색 결과가 없습니다.</p>
        </div>
      )}

      {hasResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BrandSection brand="TJ" color="blue" songs={tjSongs} />
          <BrandSection brand="금영" color="green" songs={kySongs} />
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-600">
          <p className="text-6xl mb-4">🎵</p>
          <p className="text-lg text-gray-400">부르고 싶은 곡을 검색해보세요.</p>
        </div>
      )}
    </div>
  );
}

function BrandSection({
  brand,
  color,
  songs,
}: {
  brand: string;
  color: "blue" | "green";
  songs: { no: string; title: string; singer: string; release: string }[];
}) {
  const colorMap = {
    blue: {
      badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      header: "text-blue-400",
      row: "hover:bg-blue-500/5",
      no: "text-blue-400",
    },
    green: {
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      header: "text-emerald-400",
      row: "hover:bg-emerald-500/5",
      no: "text-emerald-400",
    },
  };

  const c = colorMap[color];

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className={`font-bold ${c.header}`}>{brand}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${c.badge}`}>{songs.length}곡</span>
      </div>

      {songs.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-600 text-sm">{brand} 검색 결과가 없습니다.</div>
      ) : (
        <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
          {songs.map((song, i) => (
            <div key={`${song.no}-${i}`} className={`px-4 py-3 flex items-center gap-4 transition-colors ${c.row}`}>
              <span className={`font-mono text-sm font-bold ${c.no} min-w-[60px]`}>{song.no}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{song.title}</p>
                <p className="text-gray-500 text-xs truncate">{song.singer}</p>
              </div>
              <span className="text-gray-600 text-xs shrink-0">{song.release}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
