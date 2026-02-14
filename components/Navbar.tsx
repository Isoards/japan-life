"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/artists", label: "아티스트" },
  { href: "/karaoke", label: "노래방" },
  { href: "/concerts", label: "콘서트" },
  { href: "/checklist", label: "체크리스트" },
  { href: "/calculator", label: "계산기" },
  { href: "/guide", label: "생활 가이드" },
  { href: "/expenses", label: "가계부" },
  { href: "/notes", label: "메모" },
  { href: "/logs", label: "주간 로그" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <Image
              src="/jp_icon_v2.png"
              alt="Japan Life"
              width={512}
              height={512}
              className="h-18 w-18 rounded-full"
              priority
            />
            <span className="text-lg font-semibold text-white hidden sm:block">
              Japan Life
            </span>
          </Link>
          <div className="flex gap-1 items-center overflow-x-auto scrollbar-hide ml-4">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
