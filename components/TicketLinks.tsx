"use client";

interface TicketLinksProps {
  artistName: string;
}

const TICKET_SITES = [
  {
    name: "e+",
    url: (name: string) =>
      `https://eplus.jp/sf/search?block=true&keyword=${encodeURIComponent(name)}`,
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30",
  },
  {
    name: "チケットぴあ",
    url: (name: string) =>
      `https://t.pia.jp/pia/search_all.do?kw=${encodeURIComponent(name)}`,
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
  },
  {
    name: "ローソンチケット",
    url: (name: string) =>
      `https://l-tike.com/search/?keyword=${encodeURIComponent(name)}`,
    color: "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30",
  },
];

export default function TicketLinks({ artistName }: TicketLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-gray-400 self-center mr-1">
        티켓 검색:
      </span>
      {TICKET_SITES.map((site) => (
        <a
          key={site.name}
          href={site.url(artistName)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${site.color}`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          {site.name}
        </a>
      ))}
    </div>
  );
}
