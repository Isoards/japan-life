import { Concert, Artist } from "@/lib/types";

interface ConcertListProps {
  concerts: Concert[];
  artists: Artist[];
  limit?: number;
}

export default function ConcertList({
  concerts,
  artists,
  limit,
}: ConcertListProps) {
  const artistMap = new Map(artists.map((a) => [a.slug, a]));

  const sorted = [...concerts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const displayed = limit ? sorted.slice(0, limit) : sorted;

  return (
    <div className="space-y-3">
      {displayed.map((concert) => {
        const artist = artistMap.get(concert.artistSlug);
        const date = new Date(concert.date);
        return (
          <div
            key={concert.id}
            className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="text-center min-w-[60px]">
              <div className="text-2xl font-bold text-pink-400">
                {date.getDate()}
              </div>
              <div className="text-xs text-gray-400 uppercase">
                {date.toLocaleString("ko", { month: "short" })}
              </div>
              <div className="text-xs text-gray-500">{date.getFullYear()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate">
                {concert.title}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                {concert.venue} &middot; {concert.city}, {concert.country}
              </p>
              {artist && (
                <p className="text-xs text-purple-400 mt-1">{artist.name}</p>
              )}
            </div>
            <a
              href={concert.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors whitespace-nowrap"
            >
              티켓
            </a>
          </div>
        );
      })}
      {displayed.length === 0 && (
        <p className="text-gray-500 text-center py-8">콘서트 정보가 없습니다.</p>
      )}
    </div>
  );
}
