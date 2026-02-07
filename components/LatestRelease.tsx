"use client";

import Image from "next/image";
import { ITunesTrack } from "@/lib/types";
import { getHighResArtwork, formatDuration } from "@/lib/itunes";
import MusicButton from "./MusicButton";

interface LatestReleaseProps {
  track: ITunesTrack;
}

export default function LatestRelease({ track }: LatestReleaseProps) {
  const artworkUrl = getHighResArtwork(track.artworkUrl100, 600);
  const releaseDate = new Date(track.releaseDate);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10">
      <div className="flex flex-col sm:flex-row gap-6 p-6">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden shadow-2xl shrink-0 mx-auto sm:mx-0">
          <Image
            src={artworkUrl}
            alt={track.trackName}
            fill
            className="object-cover"
            sizes="224px"
          />
        </div>
        <div className="flex flex-col justify-center space-y-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">
              최신 발매
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {track.trackName}
            </h3>
            <p className="text-gray-400 mt-1">{track.collectionName}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>
              {releaseDate.toLocaleDateString("ko", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>&middot;</span>
            <span>{formatDuration(track.trackTimeMillis)}</span>
          </div>
          <div className="pt-2">
            <MusicButton
              trackName={track.trackName}
              artistName={track.artistName}
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
