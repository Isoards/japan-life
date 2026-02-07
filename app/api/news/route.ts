import { NextRequest, NextResponse } from "next/server";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
    const link = content.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    const source =
      content.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";

    const cleanTitle = title.replace(/\s*-\s*[^-]+$/, "").trim();

    items.push({
      title: cleanTitle || title,
      link,
      pubDate,
      source,
    });
  }

  return items;
}

async function translateToKorean(text: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return text;
    const data = await res.json();
    // Response format: [[["translated","original",...],...],...]
    const translated = (data[0] as [string][])
      .map((segment: [string]) => segment[0])
      .join("");
    return translated || text;
  } catch {
    return text;
  }
}

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "5");

  if (!artist) return NextResponse.json([]);

  // Search in Japanese for better results
  const query = encodeURIComponent(
    `${artist} コンサート OR ライブ OR ツアー OR tour`
  );
  const url = `https://news.google.com/rss/search?q=${query}&hl=ja&gl=JP&ceid=JP:ja`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) return NextResponse.json([]);

    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, limit);

    // Translate titles to Korean in parallel
    const translated = await Promise.all(
      items.map(async (item) => ({
        ...item,
        title: await translateToKorean(item.title),
      }))
    );

    return NextResponse.json(translated);
  } catch {
    return NextResponse.json([]);
  }
}
