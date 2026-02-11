import { NextResponse } from "next/server";

let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10분

export async function GET() {
  // 캐시가 유효하면 재사용
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_TTL) {
    return NextResponse.json({ rate: cachedRate.rate, cached: true });
  }

  try {
    // exchangerate-api.com 무료 API (JPY -> KRW)
    const res = await fetch(
      "https://open.er-api.com/v6/latest/JPY",
      { next: { revalidate: 600 } }
    );

    if (!res.ok) throw new Error("API 응답 오류");

    const data = await res.json();
    const krwRate = data.rates?.KRW;

    if (!krwRate) throw new Error("KRW 환율 없음");

    // 100엔 당 원화 (예: 100엔 = 920원이면 9.2)
    const per100Yen = Math.round(krwRate * 100 * 10) / 10;

    cachedRate = { rate: per100Yen, timestamp: Date.now() };

    return NextResponse.json({ rate: per100Yen, cached: false });
  } catch {
    // 실패 시 캐시된 값이 있으면 반환, 없으면 기본값
    return NextResponse.json(
      { rate: cachedRate?.rate ?? 920, cached: true, fallback: true },
    );
  }
}
