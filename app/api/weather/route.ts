import { NextResponse } from "next/server";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=36.5657&longitude=139.8836" +
  "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&timezone=Asia/Tokyo&forecast_days=5";

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch(OPEN_METEO_URL);
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
      daily: raw.daily.time.map((date: string, i: number) => ({
        date,
        weatherCode: raw.daily.weather_code[i],
        tempMax: raw.daily.temperature_2m_max[i],
        tempMin: raw.daily.temperature_2m_min[i],
        precipitationProbability: raw.daily.precipitation_probability_max[i],
      })),
      fetchedAt: new Date().toISOString(),
    };

    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "날씨 데이터 조회 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
