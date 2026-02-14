"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface ArtistNewsProps {
  artistName: string;
}

function getGoogleNewsUrl(artistName: string) {
  const query = encodeURIComponent(`${artistName} 콘서트 OR 라이브 OR 투어`);
  return `https://news.google.com/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
}

export default function ArtistNews({ artistName }: ArtistNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/news?artist=${encodeURIComponent(artistName)}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setNews(data);
        })
        .catch(() => {
          if (!cancelled) setNews([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [artistName]);

  const moreNewsUrl = getGoogleNewsUrl(artistName);

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">콘서트 뉴스</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-white/5 border border-white/10 p-4">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">콘서트 뉴스</h2>
          <a href={moreNewsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            뉴스 검색
          </a>
        </div>
        <p className="text-gray-500 text-center py-4">최신 콘서트 뉴스가 없습니다.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">콘서트 뉴스</h2>
        <a href={moreNewsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
          뉴스 더보기
        </a>
      </div>
      <div className="space-y-3">
        {news.map((item, i) => {
          const date = item.pubDate
            ? new Date(item.pubDate).toLocaleDateString("ko", { year: "numeric", month: "short", day: "numeric" })
            : "";

          return (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-purple-500/30 transition-all group"
            >
              <h3 className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors line-clamp-2">{item.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                {item.source && <span>{item.source}</span>}
                {item.source && date && <span>·</span>}
                {date && <span>{date}</span>}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
