import Link from "next/link";
import Image from "next/image";
import { Artist } from "@/lib/types";

interface ArtistCardProps {
  artist: Artist;
  imageUrl?: string | null;
}

export default function ArtistCard({ artist, imageUrl }: ArtistCardProps) {
  // 공식 활동명(name)을 1순위로 사용
  const displayName = artist.name;
  const ticketSearchUrl = `https://eplus.jp/sf/search?block=true&keyword=${encodeURIComponent(displayName)}`;

  return (
    <Link href={`/artists/${artist.slug}`}>
      <div className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer h-full">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 mx-auto relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl">
              {displayName.charAt(0)}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-white text-center group-hover:text-pink-400 transition-colors">
          {displayName}
        </h3>
        {artist.nameJa && artist.name !== artist.nameJa && (
          <p className="text-sm text-gray-400 text-center mt-1">
            {artist.nameJa}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-1 mt-3">
          {artist.genre.map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300"
            >
              {g}
            </span>
          ))}
        </div>
        {artist.description && (
          <p className="text-xs text-gray-500 text-center mt-3 line-clamp-2">
            {artist.description}
          </p>
        )}
        <div className="flex justify-center mt-3">
          <span
            onClick={(e) => {
              e.preventDefault();
              window.open(ticketSearchUrl, "_blank");
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/20 hover:bg-orange-500/30 transition-colors"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            티켓 검색
          </span>
        </div>
      </div>
    </Link>
  );
}
