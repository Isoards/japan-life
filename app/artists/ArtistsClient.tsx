"use client";

import { useState, useMemo } from "react";
import { Artist } from "@/lib/types";
import ArtistCard from "@/components/ArtistCard";
import SearchFilter from "@/components/SearchFilter";

interface ArtistsClientProps {
  artists: Artist[];
  artistImages: Record<string, string | null>;
}

export default function ArtistsClient({
  artists,
  artistImages,
}: ArtistsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    artists.forEach((a) => a.genre.forEach((g) => genres.add(g)));
    return Array.from(genres).sort();
  }, [artists]);

  const filtered = useMemo(() => {
    return artists.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.nameJa.includes(searchQuery);
      const matchesGenre = !selectedGenre || a.genre.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    });
  }, [artists, searchQuery, selectedGenre]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">아티스트</h1>
      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        genres={allGenres}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((artist) => (
          <ArtistCard
            key={artist.slug}
            artist={artist}
            imageUrl={artistImages[artist.slug]}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          필터에 맞는 아티스트가 없습니다.
        </p>
      )}
    </div>
  );
}
