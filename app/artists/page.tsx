import { Artist } from "@/lib/types";
import { fetchArtistImage } from "@/lib/itunes";
import ArtistsClient from "./ArtistsClient";
import artistsData from "@/data/artists.json";

export default async function ArtistsPage() {
  const artists: Artist[] = artistsData;

  const imageEntries = await Promise.all(
    artists.map(async (a) => {
      const url = await fetchArtistImage(a.itunesId);
      return [a.slug, url] as const;
    })
  );
  const artistImages: Record<string, string | null> = Object.fromEntries(imageEntries);

  return <ArtistsClient artists={artists} artistImages={artistImages} />;
}
