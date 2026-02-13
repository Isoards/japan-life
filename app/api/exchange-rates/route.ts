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
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.rates, cached: true });
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Exchange API error");

    const data = await res.json();
    const usdToKrw = Number(data?.rates?.KRW);
    const usdToJpy = Number(data?.rates?.JPY);
    if (!usdToKrw || !usdToJpy) throw new Error("Missing rate");

    const rates = {
      // KRW-JPY: KRW per 100 JPY (e.g. 939.5)
      krwJpy: Math.round(((usdToKrw / usdToJpy) * 100) * 10) / 10,
      // KRW-USD: KRW per 1 USD (e.g. 1469)
      krwUsd: Math.round(usdToKrw),
      // JPY-USD: JPY per 1 USD (e.g. 135)
      jpyUsd: Math.round(usdToJpy),
    };

    cached = { rates, timestamp: Date.now() };
    return NextResponse.json({ ...rates, cached: false });
  } catch {
    return NextResponse.json({
      krwJpy: cached?.rates.krwJpy ?? 939.5,
      krwUsd: cached?.rates.krwUsd ?? 1469,
      jpyUsd: cached?.rates.jpyUsd ?? 135,
      cached: true,
      fallback: true,
    });
  }
}
