import { NextRequest, NextResponse } from "next/server";
import { parseConcertAnnouncement } from "@/lib/concertParser";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, text } = body as { url?: string; text?: string };

  let rawText = "";
  let sourceType: "tweet" | "news" | "manual" = "manual";

  if (text) {
    rawText = text;
    sourceType = "manual";
  } else if (url) {
    try {
      // Tweet URL → try oEmbed
      if (/https?:\/\/(twitter\.com|x\.com)\//.test(url)) {
        sourceType = "tweet";
        const oembed = await fetch(
          `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
          {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(8_000),
          },
        );
        if (oembed.ok) {
          const data = await oembed.json();
          rawText = (data.html as string)
            .replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, " ")
            .trim();
        }
      }

      // Fallback: fetch HTML and extract text
      if (!rawText) {
        sourceType = url.match(/twitter|x\.com/) ? "tweet" : "news";
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const html = await res.text();
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          const bodyHtml = bodyMatch?.[1] ?? html;
          rawText = bodyHtml
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, "\n")
            .replace(/&[a-z]+;/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        }
      }
    } catch {
      return NextResponse.json(
        { error: "URL을 불러올 수 없습니다. 텍스트 붙여넣기를 사용해주세요." },
        { status: 400 },
      );
    }
  }

  if (!rawText) {
    return NextResponse.json(
      { error: "텍스트 또는 URL을 입력해주세요" },
      { status: 400 },
    );
  }

  const draft = parseConcertAnnouncement(rawText);

  return NextResponse.json({
    draft,
    source: {
      type: sourceType,
      url: url || undefined,
    },
  });
}
