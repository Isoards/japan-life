import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/lib/itunes";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }

  const results = await searchArtists(q.trim());
  return NextResponse.json(results);
}
