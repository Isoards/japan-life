"use client";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="text-6xl">📡</div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
        오프라인 상태
      </h1>
      <p className="text-gray-400 max-w-md">
        인터넷 연결이 끊겼습니다. 네트워크에 다시 연결되면 자동으로 복구됩니다.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors font-medium"
      >
        다시 시도
      </button>
    </div>
  );
}
