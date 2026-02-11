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
    revalidateOnFocus: false,
  });
}

export function useConcerts() {
  return useSWR<UserConcert[]>("/api/user-concerts", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
}

export function useNotes() {
  return useSWR<Note[]>("/api/notes", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
}

export function useSpots() {
  return useSWR<MapSpot[]>("/api/spots", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
}

export function useBudget() {
  return useSWR<BudgetData>("/api/budget", fetcher, {
    revalidateOnFocus: false,
  });
}

export function useFavorites() {
  return useSWR<FavoriteArtist[]>("/api/favorites", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
}

export function useLinks() {
  return useSWR<QuickLink[]>("/api/links", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
}

export function useReleases(ids: string | null) {
  return useSWR<ITunesTrack[]>(
    ids ? `/api/releases?ids=${ids}&limit=10` : null,
    fetcher,
  );
}

export interface ChartSong {
  rank: number;
  songName: string;
  artistId: string;
  artistName: string;
  artworkUrl: string;
}

export function useTopSongs() {
  return useSWR<ChartSong[]>("/api/top-artists", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
}

export interface ExchangeRateData {
  rate: number;
  cached?: boolean;
  fallback?: boolean;
}

export function useExchangeRate() {
  return useSWR<ExchangeRateData>("/api/exchange-rate", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600_000, // 10분 중복 방지
  });
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
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { error?: string }).error || "요청에 실패했습니다" };
    }
    const data = await res.json();
    await mutate(url);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "네트워크 오류가 발생했습니다" };
  }
}
