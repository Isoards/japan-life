"use client";

import { useState } from "react";
import type { GuideSection } from "@/lib/types";

interface GuideClientProps {
  sections: GuideSection[];
}

export default function GuideClient({ sections }: GuideClientProps) {
  const [activeTab, setActiveTab] = useState(sections[0]?.id ?? "");

  const active = sections.find((s) => s.id === activeTab) ?? sections[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          일본 생활 가이드
        </h1>
        <p className="text-gray-400 mt-1">
          토치기현에서의 새 생활에 필요한 정보 모음
        </p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide rounded-xl bg-white/5 p-1 border border-white/10">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-w-fit ${
              activeTab === section.id
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="mr-1.5">{section.icon}</span>
            <span className="hidden sm:inline">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Section title */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{active.icon}</span>
        <h2 className="text-xl font-bold text-white">{active.title}</h2>
      </div>

      {/* Content cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {active.items.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07] transition-colors"
          >
            <h3 className="text-sm font-bold text-white mb-3">{item.title}</h3>
            <div className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
