import useSWR, { mutate } from "swr";
import { fetcher } from "../fetcher";
import type {
  ChecklistItem,
  MapSpot,
  Note,
  QuickLink,
  BudgetData,
  ITunesTrack,
} from "../types";
import type { UserConcert } from "../userConcerts";
import type { FavoriteArtist } from "../favorites";

interface SearchResult {
  itunesId: number;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

// ── Data hooks ──

export function useChecklist() {
  return useSWR<ChecklistItem[]>("/api/checklist", fetcher, {
    fallbackData: [],
  });
}

export function useConcerts() {
  return useSWR<UserConcert[]>("/api/user-concerts", fetcher, {
    fallbackData: [],
  });
}

export function useNotes() {
  return useSWR<Note[]>("/api/notes", fetcher, {
    fallbackData: [],
  });
}

export function useSpots() {
  return useSWR<MapSpot[]>("/api/spots", fetcher, {
    fallbackData: [],
  });
}

export function useBudget() {
  return useSWR<BudgetData>("/api/budget", fetcher);
}

export function useFavorites() {
  return useSWR<FavoriteArtist[]>("/api/favorites", fetcher, {
    fallbackData: [],
  });
}

export function useLinks() {
  return useSWR<QuickLink[]>("/api/links", fetcher, {
    fallbackData: [],
  });
}

export function useReleases(ids: string | null) {
  return useSWR<ITunesTrack[]>(
    ids ? `/api/releases?ids=${ids}&limit=10` : null,
    fetcher,
  );
}

export function useSearch(query: string | null) {
  return useSWR<SearchResult[]>(
    query && query.length >= 2
      ? `/api/search?q=${encodeURIComponent(query)}`
      : null,
    fetcher,
  );
}

// ── Mutation utility ──

export async function mutateAPI<T = unknown>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  // Revalidate the GET cache for this URL
  await mutate(url);
  return data;
}
