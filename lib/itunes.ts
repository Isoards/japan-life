import { ITunesTrack } from "./types";

const ITUNES_API = "https://itunes.apple.com";

export function getHighResArtwork(artworkUrl100: string, size: number): string {
  return artworkUrl100.replace("100x100bb", `${size}x${size}bb`);
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function fetchArtistTracks(
  itunesId: number,
  limit = 20
): Promise<ITunesTrack[]> {
  const params = new URLSearchParams({
    id: String(itunesId),
    entity: "song",
    limit: String(limit + 1),
    sort: "recent",
    country: "jp",
  });

  const res = await fetch(`${ITUNES_API}/lookup?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();

  return (data.results as Record<string, unknown>[])
    .filter(
      (r): r is Record<string, unknown> & ITunesTrack => r.kind === "song"
    )
    .map((r) => ({
      trackId: r.trackId as number,
      trackName: r.trackName as string,
      artistName: r.artistName as string,
      artistId: r.artistId as number,
      collectionName: r.collectionName as string,
      artworkUrl100: r.artworkUrl100 as string,
      previewUrl: r.previewUrl as string,
      trackViewUrl: r.trackViewUrl as string,
      releaseDate: r.releaseDate as string,
      trackTimeMillis: r.trackTimeMillis as number,
      primaryGenreName: r.primaryGenreName as string,
    }));
}

export async function fetchArtistImage(
  itunesId: number
): Promise<string | null> {
  const tracks = await fetchArtistTracks(itunesId, 1);
  if (tracks.length === 0) return null;
  return getHighResArtwork(tracks[0].artworkUrl100, 600);
}

export interface ITunesArtistInfo {
  artistId: number;
  artistName: string;
  primaryGenreName: string;
}

export async function fetchArtistInfo(
  itunesId: number
): Promise<ITunesArtistInfo | null> {
  const res = await fetch(
    `${ITUNES_API}/lookup?id=${itunesId}&country=jp`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const artist = data.results?.[0];
  if (!artist || artist.wrapperType !== "artist") return null;
  return {
    artistId: artist.artistId,
    artistName: artist.artistName,
    primaryGenreName: artist.primaryGenreName,
  };
}

export interface SearchArtistResult {
  itunesId: number;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

export async function searchArtists(
  query: string
): Promise<SearchArtistResult[]> {
  const params = new URLSearchParams({
    term: query,
    entity: "song",
    country: "jp",
    limit: "50",
  });

  const res = await fetch(`${ITUNES_API}/search?${params}`);
  if (!res.ok) return [];

  const data = await res.json();

  // Group songs by artist to deduplicate
  const artistMap = new Map<number, SearchArtistResult>();
  for (const track of data.results) {
    if (track.kind !== "song") continue;
    if (!artistMap.has(track.artistId)) {
      artistMap.set(track.artistId, {
        itunesId: track.artistId,
        name: track.artistName,
        imageUrl: getHighResArtwork(track.artworkUrl100, 400),
        genres: [track.primaryGenreName],
      });
    }
  }

  return Array.from(artistMap.values());
}
