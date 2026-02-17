import useSWR, { mutate } from "swr";
import { fetcher } from "../fetcher";
import type {
  ChecklistItem,
  Note,
  QuickLink,
  BudgetData,
  ITunesTrack,
  KaraokeSong,
  SheetsSummary,
  WeeklyLog,
  WeatherData,
  GarbageScheduleData,
  PackageEntry,
  MonthlyTrend,
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

export function useLogs() {
  return useSWR<WeeklyLog[]>("/api/logs", fetcher, {
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

export interface LiveExchangeRates {
  krwJpy: number;
  krwUsd: number;
  jpyUsd: number;
  cached?: boolean;
  fallback?: boolean;
}

export function useLiveExchangeRates() {
  return useSWR<LiveExchangeRates>("/api/exchange-rates", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600_000, // 10분 중복 방지
  });
}

export function useSheetsSummary(month: string) {
  return useSWR<SheetsSummary>(`/api/sheets?month=${month}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useKaraokeSearch(query: string | null, type: "song" | "singer" = "song") {
  return useSWR<KaraokeSong[]>(
    query && query.length >= 1
      ? `/api/karaoke?q=${encodeURIComponent(query)}&type=${type}`
      : null,
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

export function useWeather() {
  return useSWR<WeatherData>("/api/weather", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 900_000,
  });
}

export function useGarbageSchedule() {
  return useSWR<GarbageScheduleData>("/api/garbage", fetcher, {
    revalidateOnFocus: false,
  });
}

export function usePackages() {
  return useSWR<PackageEntry[]>("/api/packages", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
}

export function useSheetsTrend(months = 6) {
  return useSWR<MonthlyTrend[]>(
    `/api/sheets/trend?months=${months}`,
    fetcher,
    { revalidateOnFocus: false },
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
