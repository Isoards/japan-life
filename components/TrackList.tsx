"use client";

import Image from "next/image";
import { ITunesTrack } from "@/lib/types";
import { getHighResArtwork, formatDuration } from "@/lib/itunes";
import MusicButton from "./MusicButton";

interface TrackListProps {
  tracks: ITunesTrack[];
}

export default function TrackList({ tracks }: TrackListProps) {
  return (
    <div className="space-y-2">
      {tracks.map((track, index) => {
        const artworkUrl = getHighResArtwork(track.artworkUrl100, 120);
        return (
          <div
            key={track.trackId}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <span className="text-gray-500 text-sm w-6 text-right shrink-0">
              {index + 1}
            </span>
            <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
              <Image
                src={artworkUrl}
                alt={track.trackName}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {track.trackName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {track.collectionName}
              </p>
            </div>
            <span className="text-xs text-gray-500 hidden sm:block shrink-0">
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
  );
}
