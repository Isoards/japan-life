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
    lang: "ja_jp",
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

/** Deezer API로 아티스트 대표 사진을 가져옴 (무료, API 키 불필요) */
async function fetchDeezerArtistPhoto(
  ...names: (string | undefined)[]
): Promise<string | null> {
  for (const name of names) {
    if (!name) continue;
    try {
      const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) continue;
      const data = await res.json();
      const artist = data.data?.[0];
      if (!artist) continue;
      // picture_xl = 1000x1000 고해상도 아티스트 사진
      const photo = (artist.picture_xl || artist.picture_big || artist.picture_medium) as string | undefined;
      if (photo) return photo;
    } catch {
      continue;
    }
  }
  return null;
}

/** 아티스트 이미지: Deezer 아티스트 사진 → 고해상도 앨범 아트 순으로 시도 */
export async function fetchArtistImage(
  itunesId: number,
  nameJa?: string,
  nameEn?: string
): Promise<string | null> {
  // Deezer에서 아티스트 대표 사진 시도 (공식 활동명 → 일본어 → 영어)
  const deezerPhoto = await fetchDeezerArtistPhoto(nameEn, nameJa);
  if (deezerPhoto) return deezerPhoto;

  // 폴백: 고해상도 앨범 아트워크
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
    `${ITUNES_API}/lookup?id=${itunesId}&country=jp&lang=ja_jp`,
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
  // 일본 iTunes 스토어에서 일본어 이름으로 검색
  const params = new URLSearchParams({
    term: query,
    entity: "song",
    country: "jp",
    lang: "ja_jp",
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
