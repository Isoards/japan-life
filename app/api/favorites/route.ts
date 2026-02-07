import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

interface FavoriteArtist {
  itunesId: number;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

const STORE_NAME = "favorites";

export async function GET() {
  const favorites = await readStore<FavoriteArtist[]>(STORE_NAME, []);
  return NextResponse.json(favorites);
}

export async function POST(request: NextRequest) {
  const artist: FavoriteArtist = await request.json();
  const favorites = await readStore<FavoriteArtist[]>(STORE_NAME, []);

  if (!favorites.some((f) => f.itunesId === artist.itunesId)) {
    favorites.push(artist);
    await writeStore(STORE_NAME, favorites);
  }

  return NextResponse.json(favorites);
}

export async function DELETE(request: NextRequest) {
  const { itunesId } = await request.json();
  const favorites = await readStore<FavoriteArtist[]>(STORE_NAME, []);
  const updated = favorites.filter((f) => f.itunesId !== itunesId);
  await writeStore(STORE_NAME, updated);
  return NextResponse.json(updated);
}
