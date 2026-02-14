import { NextResponse } from "next/server";

interface CachedRates {
  rates: {
    krwJpy: number;
    krwUsd: number;
    jpyUsd: number;
  };
  timestamp: number;
}

let cached: CachedRates | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10분

interface WiseRate {
  source: string;
  target: string;
  value: number;
  time: number;
}

async function fetchWiseRate(source: string, target: string): Promise<number> {
  const res = await fetch(
    `https://wise.com/rates/live?source=${source}&target=${target}`,
    { next: { revalidate: 600 } },
  );
  if (!res.ok) throw new Error(`Wise API error: ${source}→${target}`);
  const data: WiseRate = await res.json();
  return data.value;
}

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.rates, cached: true });
  }

  try {
    // Wise 미드마켓 환율 (3쌍 병렬 조회)
    const [jpyToKrw, usdToKrw, usdToJpy] = await Promise.all([
      fetchWiseRate("JPY", "KRW"),
      fetchWiseRate("USD", "KRW"),
      fetchWiseRate("USD", "JPY"),
    ]);

    const rates = {
      // 100엔 당 원화 (예: 100엔 = 943원)
      krwJpy: Math.round(jpyToKrw * 100 * 10) / 10,
      // 1달러 당 원화 (예: 1달러 = 1,440원)
      krwUsd: Math.round(usdToKrw * 10) / 10,
      // 1달러 당 엔화 (예: 1달러 = 152.7엔)
      jpyUsd: Math.round(usdToJpy * 10) / 10,
    };

    cached = { rates, timestamp: Date.now() };
    return NextResponse.json({ ...rates, cached: false });
  } catch {
    // Wise 실패 시 open.er-api.com 폴백
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/JPY", {
        next: { revalidate: 600 },
      });
      if (!res.ok) throw new Error("Fallback API error");

      const data = await res.json();
      const jpyToKrw = Number(data?.rates?.KRW);
      const jpyToUsd = Number(data?.rates?.USD);
      if (!jpyToKrw || !jpyToUsd) throw new Error("Missing rate");

      const rates = {
        krwJpy: Math.round(jpyToKrw * 100 * 10) / 10,
        krwUsd: Math.round(jpyToKrw / jpyToUsd),
        jpyUsd: Math.round(1 / jpyToUsd),
      };

      cached = { rates, timestamp: Date.now() };
      return NextResponse.json({ ...rates, cached: false, source: "fallback" });
    } catch {
      return NextResponse.json({
        krwJpy: cached?.rates.krwJpy ?? 943,
        krwUsd: cached?.rates.krwUsd ?? 1440,
        jpyUsd: cached?.rates.jpyUsd ?? 153,
        cached: true,
        fallback: true,
      });
    }
  }
}
