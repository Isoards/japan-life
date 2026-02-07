"use client";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  genres: string[];
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  showDateFilter?: boolean;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
}

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  genres,
  selectedGenre,
  onGenreChange,
  showDateFilter = false,
  dateFrom = "",
  dateTo = "",
  onDateFromChange,
  onDateToChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="아티스트 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
        />
      </div>
      <select
        value={selectedGenre}
        onChange={(e) => onGenreChange(e.target.value)}
        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
      >
        <option value="" className="bg-gray-900">
          전체 장르
        </option>
        {genres.map((genre) => (
          <option key={genre} value={genre} className="bg-gray-900">
            {genre}
          </option>
        ))}
      </select>
      {showDateFilter && (
        <>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange?.(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange?.(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="To"
          />
        </>
      )}
    </div>
  );
}
