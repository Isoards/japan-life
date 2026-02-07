import { NextRequest, NextResponse } from "next/server";
import { fetchArtistTracks } from "@/lib/itunes";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");

  if (!idsParam) return NextResponse.json([]);

  const ids = idsParam
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id));

  if (ids.length === 0) return NextResponse.json([]);

  const allTracks = await Promise.all(
    ids.map((id) => fetchArtistTracks(id, 10))
  );

  // Filter out live recordings
  const isLive = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes("live") || lower.includes("ライブ");
  };

  const combined = allTracks
    .flat()
    .filter((t) => !isLive(t.trackName) && !isLive(t.collectionName))
    .sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    )
    .slice(0, limit);

  return NextResponse.json(combined);
}
