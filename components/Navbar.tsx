"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CommandPalette, { type CommandItem } from "./CommandPalette";

const primaryLinks = [
  { href: "/expenses", label: "가계부", icon: "💴" },
  { href: "/calculator", label: "계산기", icon: "🧮" },
  { href: "/cooking", label: "요리", icon: "🍳" },
  { href: "/top100", label: "TOP100", icon: "🎧" },
];

const secondaryLinks = [
  { href: "/artists", label: "아티스트", icon: "🎤" },
  { href: "/checklist", label: "체크리스트", icon: "✅" },
  { href: "/notes", label: "메모", icon: "📝" },
  { href: "/garbage", label: "쓰레기", icon: "♻️" },
  { href: "/packages", label: "택배", icon: "📦" },
  { href: "/karaoke", label: "노래방", icon: "🎶" },
  { href: "/concerts", label: "콘서트", icon: "🎫" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

const commands: CommandItem[] = [
  { href: "/expenses/receipt", label: "가계부 영수증 등록", description: "영수증을 읽어 지출을 추가해요.", icon: "🧾", group: "빠른 실행", keywords: "지출 OCR" },
  { href: "/cooking/receipt", label: "Pantry 영수증 등록", description: "장본 재료를 Pantry에 추가해요.", icon: "🛒", group: "빠른 실행", keywords: "팬트리 식재료 OCR" },
  { href: "/cooking/planner", label: "이번 주 식단 짜기", description: "점심과 저녁 식단을 계획해요.", icon: "📅", group: "빠른 실행", keywords: "요리 플래너" },
  { href: "/concerts/import", label: "콘서트 일정 가져오기", description: "공지 URL이나 텍스트에서 일정을 만들어요.", icon: "🎫", group: "빠른 실행", keywords: "공연 티켓" },
  { href: "/packages?add=1", label: "택배 추가", description: "새 송장번호를 등록해요.", icon: "📦", group: "빠른 실행", keywords: "배송" },
  ...[...primaryLinks, ...secondaryLinks].map((item) => ({
    ...item,
    description: `${item.label} 화면으로 이동`,
    group: "메뉴" as const,
  })),
];

export default function Navbar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const moreIsActive = useMemo(
    () => secondaryLinks.some((link) => pathname.startsWith(link.href)),
    [pathname],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
      if (event.key === "Escape") setMoreOpen(false);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  return (
    <nav className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <Image
              src="/jp_icon_v2.png"
              alt="Japan Life"
              width={512}
              height={512}
              className="h-12 w-12 rounded-full"
              priority
            />
            <span className="text-lg font-semibold text-white hidden sm:block">
              Japan Life
            </span>
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-1">
            <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {primaryLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="sm:hidden" aria-hidden="true">{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
            </div>

            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="빠른 실행과 메뉴 검색"
              className="hidden md:flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-500 transition hover:border-white/20 hover:text-white"
            >
              <span>⌕</span><span>빠른 실행</span><kbd className="text-[10px] text-gray-600">⌘K</kbd>
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="빠른 실행과 메뉴 검색"
              className="md:hidden rounded-lg px-2.5 py-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              ⌕
            </button>

            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((current) => !current)}
                aria-expanded={moreOpen}
                className={`rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  moreIsActive || moreOpen ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                더보기 <span className="text-[10px]">▾</span>
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] grid w-56 grid-cols-2 gap-1 rounded-xl border border-white/15 bg-[#111]/95 p-2 shadow-2xl backdrop-blur-xl">
                  {secondaryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${
                        pathname.startsWith(link.href) ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{link.icon}</span><span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {paletteOpen && <CommandPalette commands={commands} open onClose={closePalette} />}
    </nav>
  );
}
