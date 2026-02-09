"use client";

import { FavoriteArtist } from "@/lib/favorites";
import { useFavorites, mutateAPI } from "@/lib/hooks/use-api";

interface FavoriteButtonProps {
  artist: FavoriteArtist;
  size?: "sm" | "lg";
  onToggle?: () => void;
}

export default function FavoriteButton({
  artist,
  size = "sm",
  onToggle,
}: FavoriteButtonProps) {
  const { data: favorites = [], mutate } = useFavorites();
  const favorited = favorites.some((f) => f.itunesId === artist.itunesId);

  const toggle = async () => {
    if (favorited) {
      await mutateAPI("/api/favorites", "DELETE", { itunesId: artist.itunesId });
    } else {
      await mutateAPI("/api/favorites", "POST", artist);
    }
    mutate();
    onToggle?.();
  };

  const sizeClasses = size === "lg" ? "w-10 h-10 text-xl" : "w-8 h-8 text-base";

  return (
    <button
      onClick={toggle}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-all cursor-pointer ${
        favorited
          ? "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
          : "bg-white/5 text-gray-500 hover:text-pink-400 hover:bg-white/10"
      }`}
      title={favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
    >
      {favorited ? "♥" : "♡"}
    </button>
  );
}
