import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Artist, Concert } from "@/lib/types";
import {
  fetchArtistTracks,
  fetchArtistInfo,
  fetchArtistImage,
} from "@/lib/itunes";
import LatestRelease from "@/components/LatestRelease";
import TrackList from "@/components/TrackList";
import ConcertList from "@/components/ConcertList";
import FavoriteButton from "@/components/FavoriteButton";
import ArtistNews from "@/components/ArtistNews";
import TicketLinks from "@/components/TicketLinks";
import artistsData from "@/data/artists.json";
import concertsData from "@/data/concerts.json";

interface ArtistPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return artistsData.map((artist) => ({ slug: artist.slug }));
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params;
  const artists: Artist[] = artistsData;
  const concerts: Concert[] = concertsData;

  // Try JSON by slug first
  let artist = artists.find((a) => a.slug === slug);

  // Try JSON by itunesId
  const itunesIdNum = parseInt(slug);
  if (!artist && !isNaN(itunesIdNum)) {
    artist = artists.find((a) => a.itunesId === itunesIdNum);
  }

  // For non-JSON artists, fetch from iTunes
  let artistName: string;
  let artistNameSub: string | null = null;
  let genres: string[];
  let description: string | null = null;
  let itunesId: number;

  if (artist) {
    // JSON 아티스트: name = 공식 활동명 (1순위)
    artistName = artist.name;
    // nameJa는 name과 다를 때만 서브로 표시
    artistNameSub = (artist.nameJa && artist.nameJa !== artist.name) ? artist.nameJa : null;
    genres = artist.genre;
    description = artist.description;
    itunesId = artist.itunesId;
  } else if (!isNaN(itunesIdNum)) {
    // iTunes 아티스트: lang=ja_jp → 공식 활동명 반환
    const info = await fetchArtistInfo(itunesIdNum);
    if (!info) notFound();
    artistName = info.artistName;
    genres = [info.primaryGenreName];
    itunesId = info.artistId;
  } else {
    notFound();
  }

  const itunesTracksRaw = await fetchArtistTracks(itunesId, 30);

  // Filter out live recordings
  const isLiveTrack = (t: { trackName: string; collectionName: string }) => {
    const name = t.trackName.toLowerCase();
    const collection = t.collectionName.toLowerCase();
    return (
      name.includes("live") ||
      name.includes("ライブ") ||
      collection.includes("live") ||
      collection.includes("ライブ")
    );
  };
  const itunesTracks = itunesTracksRaw.filter((t) => !isLiveTrack(t));

  const latestTrack = itunesTracks.length > 0 ? itunesTracks[0] : null;
  const restTracks = itunesTracks.slice(1, 15);

  // Deezer에서 아티스트 대표 사진 시도, 실패 시 앨범 아트
  const artistImageUrl = await fetchArtistImage(
    itunesId,
    artist?.nameJa,
    artistName
  );

  const artistConcerts = artist
    ? concerts
        .filter((c) => c.artistSlug === artist.slug)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
    : [];

  return (
    <div className="space-y-8">
      <Link
        href="/artists"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        아티스트 목록
      </Link>

      {/* Artist Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative">
          {artistImageUrl ? (
            <Image
              src={artistImageUrl}
              alt={artistName}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-5xl">
              {artistName.charAt(0)}
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{artistName}</h1>
              {artistNameSub && (
                <p className="text-lg text-gray-400">{artistNameSub}</p>
              )}
            </div>
            <FavoriteButton
              artist={{
                itunesId,
                name: artistName,
                imageUrl: artistImageUrl,
                genres,
              }}
              size="lg"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g}
                className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-300"
              >
                {g}
              </span>
            ))}
          </div>
          {description && (
            <p className="text-gray-300 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
          <TicketLinks artistName={artistName} />
        </div>
      </div>

      {/* Concert News */}
      <ArtistNews artistName={artistName} />

      {/* Latest Release */}
      {latestTrack && (
        <section>
          <LatestRelease track={latestTrack} />
        </section>
      )}

      {/* All Tracks */}
      {restTracks.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">트랙</h2>
          <TrackList tracks={restTracks} />
        </section>
      )}

      {/* Upcoming Concerts */}
      {artistConcerts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            다가오는 콘서트
          </h2>
          <ConcertList concerts={artistConcerts} artists={artists} />
        </section>
      )}
    </div>
  );
}
