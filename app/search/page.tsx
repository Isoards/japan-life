"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";

interface SearchResult {
  itunesId: number;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">아티스트 검색</h1>
        <p className="text-gray-400">
          아티스트를 검색하고 즐겨찾기에 추가하세요
        </p>
      </div>

      <div className="max-w-xl mx-auto relative">
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
          placeholder="아티스트 이름으로 검색... (예: Official髭男dism, LiSA, King Gnu)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-lg"
        />
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-2 text-sm">검색 중...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-400 mb-4">
            {results.length}명의 아티스트를 찾았습니다
          </p>
          <div className="space-y-3">
            {results.map((artist) => (
              <div
                key={artist.itunesId}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Link
                  href={`/artists/${artist.itunesId}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
                    {artist.imageUrl ? (
                      <Image
                        src={artist.imageUrl}
                        alt={artist.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xl">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {artist.name}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      {artist.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
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
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          &ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다
        </p>
      )}
    </div>
  );
}
