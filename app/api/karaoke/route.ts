import { NextRequest, NextResponse } from "next/server";
import type { KaraokeSong } from "@/lib/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type") || "song";

  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }

  if (type !== "song" && type !== "singer") {
    return NextResponse.json(
      { error: "type은 song 또는 singer만 가능합니다" },
      { status: 400 },
    );
  }

  try {
    const encoded = encodeURIComponent(q.trim());
    const base = `https://api.manana.kr/karaoke/${type}/${encoded}.json`;

    const [tjRes, kyRes] = await Promise.all([
      fetch(`${base}?brand=tj`, { next: { revalidate: 300 } }),
      fetch(`${base}?brand=kumyoung`, { next: { revalidate: 300 } }),
    ]);

    if (!tjRes.ok && !kyRes.ok) {
      return NextResponse.json(
        { error: "노래방 검색 API 호출에 실패했습니다" },
        { status: 502 },
      );
    }

    const tjData: KaraokeSong[] = tjRes.ok ? await tjRes.json() : [];
    const kyData: KaraokeSong[] = kyRes.ok ? await kyRes.json() : [];

    return NextResponse.json([...tjData, ...kyData]);
  } catch {
    return NextResponse.json(
      { error: "노래방 검색 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
