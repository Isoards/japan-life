export interface FavoriteArtist {
  itunesId: number;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

export async function getFavorites(): Promise<FavoriteArtist[]> {
  try {
    const res = await fetch("/api/favorites");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addFavorite(artist: FavoriteArtist): Promise<void> {
  await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artist),
  });
}

export async function removeFavorite(itunesId: number): Promise<void> {
  await fetch("/api/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itunesId }),
  });
}

export async function isFavorite(itunesId: number): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f) => f.itunesId === itunesId);
}
