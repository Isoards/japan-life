import { NextResponse } from "next/server";

export interface ChartSong {
  rank: number;
  songName: string;
  artistId: string;
  artistName: string;
  artworkUrl: string;
}

let cached: { data: ChartSong[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1시간

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(
      "https://rss.applemarketingtools.com/api/v2/jp/music/most-played/100/songs.json",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error("Chart API error");

    const data = await res.json();
    const results = data.feed?.results || [];

    const songs: ChartSong[] = results.map(
      (song: { name: string; artistId: string; artistName: string; artworkUrl100: string }, i: number) => ({
        rank: i + 1,
        songName: song.name,
        artistId: song.artistId,
        artistName: song.artistName,
        artworkUrl: song.artworkUrl100
          ? song.artworkUrl100.replace(/\d+x\d+bb/, "600x600bb")
          : "",
      })
    );

    cached = { data: songs, timestamp: Date.now() };
    return NextResponse.json(songs);
  } catch {
    return NextResponse.json(cached?.data || []);
  }
}
