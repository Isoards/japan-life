"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import { useFavorites, useSearch } from "@/lib/hooks/use-api";

export default function ArtistsClient() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: favorites = [] } = useFavorites();
  const { data: results = [], isLoading: loading } = useSearch(debouncedQuery);
  const searched = debouncedQuery.length >= 2;

  useEffect(() => {
    const nextQuery = query.trim();
    const delay = nextQuery.length < 2 ? 0 : 400;
    const timer = setTimeout(() => setDebouncedQuery(nextQuery.length < 2 ? "" : nextQuery), delay);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">아티스트</h1>
          <p className="text-gray-400">검색하고 즐겨찾기를 관리하세요.</p>
        </div>
        <Link
          href="/top100"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
        >
          일본 TOP 100 보기
        </Link>
      </div>

      <div className="max-w-3xl relative">
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
          placeholder="아티스트 이름으로 검색... (예: LiSA, King Gnu)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        <div className="max-w-4xl">
          <p className="text-sm text-gray-400 mb-4">{results.length}명의 아티스트를 찾았습니다.</p>
          <div className="space-y-3">
            {results.map((artist) => (
              <div
                key={artist.itunesId}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Link href={`/artists/${artist.itunesId}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
                    {artist.imageUrl ? (
                      <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xl">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{artist.name}</h3>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {artist.genres.map((g) => (
                        <span key={g} className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300">
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
        <p className="text-gray-500 text-center py-8">&ldquo;{debouncedQuery}&rdquo; 검색 결과가 없습니다.</p>
      )}

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">♥ 즐겨찾기</h2>
        {favorites.length > 0 ? (
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
        ) : (
          <p className="text-gray-500 text-sm">즐겨찾기한 아티스트가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
