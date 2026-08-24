import Link from "next/link";

const links = [
  { href: "/cooking", label: "홈" },
  { href: "/cooking/pantry", label: "식재료" },
  { href: "/cooking/receipt", label: "영수증 읽기" },
  { href: "/cooking/discover", label: "요리 찾기" },
  { href: "/cooking/shopping", label: "장보기" },
];

export default function CookingNav() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="shrink-0 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-200 transition hover:bg-orange-500/20">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
