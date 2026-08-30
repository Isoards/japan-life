import Link from "next/link";

export type TodayActionTone = "urgent" | "attention" | "info";

export interface TodayAction {
  id: string;
  title: string;
  detail: string;
  href: string;
  icon: string;
  tone: TodayActionTone;
}

const TONE_STYLES: Record<TodayActionTone, { dot: string; border: string; badge: string; label: string }> = {
  urgent: { dot: "bg-red-400", border: "hover:border-red-400/35", badge: "bg-red-500/10 text-red-200", label: "지금" },
  attention: { dot: "bg-amber-400", border: "hover:border-amber-400/35", badge: "bg-amber-500/10 text-amber-200", label: "확인" },
  info: { dot: "bg-sky-400", border: "hover:border-sky-400/35", badge: "bg-sky-500/10 text-sky-200", label: "예정" },
};

export default function TodayActionCenter({ actions }: { actions: TodayAction[] }) {
  const urgentCount = actions.filter((action) => action.tone === "urgent").length;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-transparent">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">☀️</span>
            <h2 className="text-lg font-bold text-white">오늘 할 일</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">{actions.length}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">여러 메뉴의 중요한 항목을 한곳에 모았어요.</p>
        </div>
        {urgentCount > 0 && <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200">우선 확인 {urgentCount}건</span>}
      </div>

      {actions.length > 0 ? (
        <div className="divide-y divide-white/[0.06]">
          {actions.map((action) => {
            const style = TONE_STYLES[action.tone];
            return (
              <Link key={action.id} href={action.href} className={`group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.04] ${style.border}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">{action.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                    <span className="truncate text-sm font-medium text-white">{action.title}</span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-gray-500">{action.detail}</span>
                </span>
                <span className={`hidden shrink-0 rounded-full px-2 py-1 text-[10px] sm:block ${style.badge}`}>{style.label}</span>
                <span className="shrink-0 text-gray-700 transition group-hover:translate-x-0.5 group-hover:text-gray-400">→</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-2xl">✨</p>
          <p className="mt-2 text-sm font-medium text-gray-300">지금 확인할 중요한 일이 없습니다.</p>
          <p className="mt-1 text-xs text-gray-600">오늘도 여유롭게 시작하세요.</p>
        </div>
      )}
    </section>
  );
}
