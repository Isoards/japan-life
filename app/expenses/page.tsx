"use client";

export default function ExpensesPage() {
  const sheetId = "1volLOrTwvHDDOCXY_AD7fLqVd5JVHHm9HsPg7QTZ0qg";
  const embedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&rm=minimal`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          가계부
        </h1>
        <p className="text-gray-400 mt-1">
          Google Spreadsheet 가계부 — 직접 편집 가능
        </p>
      </div>

      {/* Quick summary links */}
      <div className="flex flex-wrap gap-3">
        <a
          href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
        >
          새 탭에서 열기
        </a>
        <a
          href="https://moneyforward.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Money Forward ME
        </a>
      </div>

      {/* Category reference */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-3">카테고리 체계</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-white font-medium">고정비</div>
            <div className="text-xs text-gray-500 mt-1">야칭, 공과금, 통신비, 구독</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-white font-medium">차량 유지비</div>
            <div className="text-xs text-gray-500 mt-1">할부, 주유, 보험, 정비</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-white font-medium">변동비</div>
            <div className="text-xs text-gray-500 mt-1">식비, 생활, 취미, 건강</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-white font-medium">자산/이체</div>
            <div className="text-xs text-gray-500 mt-1">NISA, 가족 송금</div>
          </div>
        </div>
      </div>

      {/* Embedded spreadsheet */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ height: "600px" }}>
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="가계부 스프레드시트"
        />
      </div>
    </div>
  );
}
