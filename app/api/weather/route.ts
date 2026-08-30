import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/lib/settings";

let cache: { key: string; data: unknown; timestamp: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

export async function GET() {
  const stored = await readStore<UserSettings>("settings", DEFAULT_USER_SETTINGS);
  const settings = { ...DEFAULT_USER_SETTINGS, ...stored };
  const cacheKey = `${settings.latitude},${settings.longitude},${settings.residenceLabel}`;
  if (cache?.key === cacheKey && Date.now() - cache.timestamp < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  const query = new URLSearchParams({
    latitude: String(settings.latitude),
    longitude: String(settings.longitude),
    current: "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: settings.timezone,
    forecast_days: "5",
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "날씨 데이터를 가져올 수 없습니다" },
        { status: 502 },
      );
    }

    const raw = await res.json();
    const data = {
      current: {
        temperature: raw.current.temperature_2m,
        weatherCode: raw.current.weather_code,
        humidity: raw.current.relative_humidity_2m,
        windSpeed: raw.current.wind_speed_10m,
      },
      locationLabel: settings.residenceLabel,
      daily: raw.daily.time.map((date: string, i: number) => ({
        date,
        weatherCode: raw.daily.weather_code[i],
        tempMax: raw.daily.temperature_2m_max[i],
        tempMin: raw.daily.temperature_2m_min[i],
        precipitationProbability: raw.daily.precipitation_probability_max[i],
      })),
      fetchedAt: new Date().toISOString(),
    };

    cache = { key: cacheKey, data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "날씨 데이터 조회 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
