"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface CommandItem {
  href: string;
  label: string;
  description: string;
  icon: string;
  group: "빠른 실행" | "메뉴";
  keywords?: string;
}

interface CommandPaletteProps {
  commands: CommandItem[];
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ commands, open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.description} ${command.keywords ?? ""}`
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [commands, query]);

  function run(command: CommandItem) {
    onClose();
    router.push(command.href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="빠른 실행과 메뉴 검색"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#111] shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <span className="text-gray-500" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && filtered[0]) run(filtered[0]);
            }}
            placeholder="기능이나 메뉴 검색…"
            className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
          />
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-gray-500 hover:text-white"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {(["빠른 실행", "메뉴"] as const).map((group) => {
            const items = filtered.filter((command) => command.group === group);
            if (items.length === 0) return null;
            return (
              <section key={group} className="mb-2 last:mb-0">
                <p className="px-3 py-2 text-[11px] font-medium text-gray-600">{group}</p>
                {items.map((command) => (
                  <button
                    key={`${group}-${command.href}-${command.label}`}
                    onClick={() => run(command)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-lg">
                      {command.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{command.label}</span>
                      <span className="block truncate text-xs text-gray-500">{command.description}</span>
                    </span>
                    <span className="text-gray-700">→</span>
                  </button>
                ))}
              </section>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-gray-600">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
