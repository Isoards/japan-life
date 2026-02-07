"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ITunesTrack } from "@/lib/types";
import { getFavorites, FavoriteArtist } from "@/lib/favorites";
import { getHighResArtwork, formatDuration } from "@/lib/itunes";
import MusicButton from "@/components/MusicButton";
import FavoriteButton from "@/components/FavoriteButton";

interface SearchResult {
  itunesId: number;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

export default function DashboardClient() {
  const [favorites, setFavorites] = useState<FavoriteArtist[]>([]);
  const [newReleases, setNewReleases] = useState<ITunesTrack[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const loadFavorites = useCallback(() => {
    getFavorites().then(setFavorites);
  }, []);

  // Load favorites
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Fetch new releases when favorites change
  useEffect(() => {
    if (favorites.length === 0) {
      setNewReleases([]);
      return;
    }
    setReleasesLoading(true);
    const ids = favorites.map((f) => f.itunesId).join(",");
    fetch(`/api/releases?ids=${ids}&limit=10`)
      .then((res) => res.json())
      .then((data) => setNewReleases(data))
      .catch(() => setNewReleases([]))
      .finally(() => setReleasesLoading(false));
  }, [favorites]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => search(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  // Re-read favorites when returning focus
  useEffect(() => {
    const onFocus = () => loadFavorites();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFavorites]);

  return (
    <div className="space-y-10">
      {/* Hero + Search */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          J-Pop 대시보드
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          아티스트를 검색하고, 즐겨찾기에 추가하고, 최신 발매를 확인하세요.
        </p>
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
