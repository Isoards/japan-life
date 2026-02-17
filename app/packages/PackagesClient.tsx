"use client";

import { useState } from "react";
import { usePackages, mutateAPI } from "@/lib/hooks/use-api";
import { CARRIERS, getCarrier } from "@/lib/constants/carriers";
import type { PackageCarrier, PackageStatus } from "@/lib/types";

const STATUS_LABELS: Record<PackageStatus, { label: string; color: string }> = {
  pending: { label: "대기 중", color: "text-gray-400 bg-gray-500/20" },
  "in-transit": { label: "배송 중", color: "text-blue-400 bg-blue-500/20" },
  delivered: { label: "배송 완료", color: "text-emerald-400 bg-emerald-500/20" },
  returned: { label: "반송", color: "text-red-400 bg-red-500/20" },
};

export default function PackagesClient() {
  const { data: packages = [] } = usePackages();
  const [showForm, setShowForm] = useState(false);
  const [showDelivered, setShowDelivered] = useState(false);
  const [form, setForm] = useState({
    trackingNumber: "",
    carrier: "yamato" as PackageCarrier,
    description: "",
    memo: "",
  });

  const active = packages.filter((p) => p.status !== "delivered" && p.status !== "returned");
  const completed = packages.filter((p) => p.status === "delivered" || p.status === "returned");

  async function handleAdd() {
    if (!form.trackingNumber.trim() || !form.description.trim()) return;
    await mutateAPI("/api/packages", "POST", {
      trackingNumber: form.trackingNumber.trim(),
      carrier: form.carrier,
      description: form.description.trim(),
      memo: form.memo.trim() || undefined,
    });
    setForm({ trackingNumber: "", carrier: "yamato", description: "", memo: "" });
    setShowForm(false);
  }

  async function handleStatusChange(id: string, status: PackageStatus) {
    await mutateAPI("/api/packages", "PATCH", { id, status });
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await mutateAPI("/api/packages", "DELETE", { id });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">택배 추적</h1>
          <p className="text-gray-500 text-sm">
            {active.length > 0
              ? `${active.length}건 배송 진행 중`
              : "추적 중인 택배가 없습니다"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors text-sm cursor-pointer"
        >
          {showForm ? "취소" : "+ 택배 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">운송사</label>
              <select
                value={form.carrier}
                onChange={(e) => setForm({ ...form, carrier: e.target.value as PackageCarrier })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {CARRIERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name} ({c.nameJa})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">송장번호</label>
              <input
                type="text"
                value={form.trackingNumber}
                onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                placeholder="송장번호 입력"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">설명</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="무엇을 주문했나요?"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">메모 (선택)</label>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="추가 메모"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!form.trackingNumber.trim() || !form.description.trim()}
            className="px-5 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            추가
          </button>
        </div>
      )}

      {/* 활성 택배 */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((pkg) => {
            const carrier = getCarrier(pkg.carrier);
            const statusInfo = STATUS_LABELS[pkg.status];
            return (
              <div
                key={pkg.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{carrier?.icon}</span>
                      <span className="text-sm font-medium text-white truncate">
                        {pkg.description}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {carrier?.name} · {pkg.trackingNumber}
                      {pkg.memo && <span className="ml-2 text-gray-600">· {pkg.memo}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {pkg.status === "pending" && (
                      <button
                        onClick={() => handleStatusChange(pkg.id, "in-transit")}
                        className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer"
                      >
                        배송 중
                      </button>
                    )}
                    {(pkg.status === "pending" || pkg.status === "in-transit") && (
                      <button
                        onClick={() => handleStatusChange(pkg.id, "delivered")}
                        className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                      >
                        수령 완료
                      </button>
                    )}
                    {carrier && carrier.id !== "other" && (
                      <a
                        href={carrier.trackingUrl(pkg.trackingNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                      >
                        추적
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 배송 완료 */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowDelivered(!showDelivered)}
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors cursor-pointer mb-3"
          >
            {showDelivered ? "▼" : "▶"} 배송 완료 ({completed.length}건)
          </button>
          {showDelivered && (
            <div className="space-y-2">
              {completed.map((pkg) => {
                const carrier = getCarrier(pkg.carrier);
                const statusInfo = STATUS_LABELS[pkg.status];
                return (
                  <div
                    key={pkg.id}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{carrier?.icon}</span>
                        <span className="text-sm text-gray-400 truncate">{pkg.description}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0 cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {active.length === 0 && completed.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-dashed border-white/10">
          <p className="text-gray-400 text-lg mb-2">아직 등록된 택배가 없습니다</p>
          <p className="text-gray-600 text-sm">위의 &quot;+ 택배 추가&quot; 버튼을 눌러 추가하세요</p>
        </div>
      )}
    </div>
  );
}
