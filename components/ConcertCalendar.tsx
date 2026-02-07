"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import { Concert, Artist } from "@/lib/types";
import "react-calendar/dist/Calendar.css";

interface ConcertCalendarProps {
  concerts: Concert[];
  artists: Artist[];
}

export default function ConcertCalendar({
  concerts,
  artists,
}: ConcertCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const artistMap = new Map(artists.map((a) => [a.slug, a]));

  const concertDates = new Set(
    concerts.map((c) => new Date(c.date).toDateString())
  );

  const selectedConcerts = selectedDate
    ? concerts.filter(
        (c) => new Date(c.date).toDateString() === selectedDate.toDateString()
      )
    : [];

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month" && concertDates.has(date.toDateString())) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
        </div>
      );
    }
    return null;
  };

  const handleDateClick = (value: Date) => {
    setSelectedDate(value);
  };

  return (
    <div className="space-y-6">
      <div className="concert-calendar">
        <Calendar
          onChange={(value) => handleDateClick(value as Date)}
          value={selectedDate}
          tileContent={tileContent}
          className="!bg-transparent !border-none w-full"
        />
      </div>

      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            {selectedDate.toLocaleDateString("ko", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          {selectedConcerts.length > 0 ? (
            <div className="space-y-3">
              {selectedConcerts.map((concert) => {
                const artist = artistMap.get(concert.artistSlug);
                return (
                  <div
                    key={concert.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <h4 className="font-semibold text-white">
                      {concert.title}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {concert.venue} &middot; {concert.city},{" "}
                      {concert.country}
                    </p>
                    {artist && (
                      <p className="text-xs text-purple-400 mt-1">
                        {artist.name}
                      </p>
                    )}
                    <a
                      href={concert.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-3 py-1 text-xs rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors"
                    >
                      티켓 구매
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">이 날짜에 콘서트가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
