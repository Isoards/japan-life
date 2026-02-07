"use client";

import { getSpotifyTrackUri, getSpotifyTrackUrl } from "@/lib/spotify";

interface SpotifyButtonProps {
  spotifyId: string;
  size?: "sm" | "md";
}

export default function SpotifyButton({
  spotifyId,
  size = "sm",
}: SpotifyButtonProps) {
  const handleClick = () => {
    // Try opening in desktop app via URI scheme
    window.location.href = getSpotifyTrackUri(spotifyId);
  };

  const sizeClasses =
    size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm";

  return (
    <span className="inline-flex gap-1">
      <button
        onClick={handleClick}
        className={`${sizeClasses} rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer`}
        title="Open in Spotify Desktop App"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        App
      </button>
      <a
        href={getSpotifyTrackUrl(spotifyId)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses} rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors inline-flex items-center gap-1`}
        title="Open in Spotify Web"
      >
        Web
      </a>
    </span>
  );
}
