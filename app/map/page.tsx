"use client";

import { useState, useCallback } from "react";
import type { SpotCategory, MapSpot } from "@/lib/types";
import GoogleMapView from "@/components/GoogleMapView";
import { useSpots, mutateAPI } from "@/lib/hooks/use-api";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const SPOT_CATEGORIES: { key: SpotCategory; label: string; icon: string }[] = [
  { key: "food", label: "맛집", icon: "🍜" },
  { key: "sightseeing", label: "관광", icon: "⛩️" },
  { key: "shopping", label: "쇼핑", icon: "🛍️" },
  { key: "daily", label: "생활", icon: "🏪" },
  { key: "work", label: "직장", icon: "💼" },
  { key: "government", label: "관공서", icon: "🏛️" },
  { key: "medical", label: "의료", icon: "🏥" },
  { key: "finance", label: "금융", icon: "🏦" },
  { key: "transport", label: "교통", icon: "🚉" },
  { key: "other", label: "기타", icon: "📌" },
];

const AREAS = [
  { key: "yokohama" as const, label: "요코하마 (판매점 실습)", query: "横浜市戸塚区", lat: 35.4010, lng: 139.5341 },
  { key: "tochigi" as const, label: "토치기 (본배속)", query: "栃木県宇都宮市", lat: 36.5657, lng: 139.8836 },
];

export default function MapPage() {
  const { data: spots = [], isLoading: loading, error, mutate } = useSpots();
  const { toast } = useToast();
  const [area, setArea] = useState<"yokohama" | "tochigi">("yokohama");
  const [filter, setFilter] = useState<SpotCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<SpotCategory>("food");
  const [formMemo, setFormMemo] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setFormLat(lat);
    setFormLng(lng);
    setShowForm(true);
  }, []);

  const resetForm = () => {
    setFormName(""); setFormMemo(""); setFormDate(""); setFormAddress("");
    setFormLat(null); setFormLng(null);
    setFormCategory("food");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (spot: MapSpot) => {
    setEditingId(spot.id);
    setFormName(spot.name);
    setFormCategory(spot.category);
    setFormMemo(spot.memo || "");
    setFormDate(spot.date || "");
    setFormAddress(spot.address || "");
    setFormLat(spot.lat);
    setFormLng(spot.lng);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    const currentArea = AREAS.find((a) => a.key === area)!;

    const body = {
      name: formName.trim(),
      category: formCategory,
      lat: formLat ?? currentArea.lat,
      lng: formLng ?? currentArea.lng,
      memo: formMemo.trim() || undefined,
      date: formDate || undefined,
      address: formAddress.trim() || undefined,
      area,
    };

    const res = editingId
      ? await mutateAPI("/api/spots", "PATCH", { id: editingId, ...body })
      : await mutateAPI("/api/spots", "POST", body);

    if (res.ok) { toast(editingId ? "장소를 수정했습니다" : "장소를 추가했습니다"); } else { toast(res.error, "error"); }
    mutate();
    resetForm();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await mutateAPI("/api/spots", "DELETE", { id: deleteTarget });
    if (res.ok) { toast("장소를 삭제했습니다"); } else { toast(res.error, "error"); }
    mutate();
    setDeleteTarget(null);
  };

  const currentArea = AREAS.find((a) => a.key === area)!;
  const areaSpots = spots.filter((s) => s.area === area);
  const filteredSpots = areaSpots.filter((s) => filter === "all" || s.category === filter);

  const googleMapsUrl = `https://www.google.com/maps/@${currentArea.lat},${currentArea.lng},14z`;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-gray-400">불러오는 중...</div></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-red-400">데이터를 불러오지 못했습니다</div>
        <button onClick={() => mutate()} className="px-4 py-2 rounded-lg text-sm bg-white/10 text-white hover:bg-white/15 transition-colors">다시 시도</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={deleteTarget !== null}
        title="장소 삭제"
        message="이 장소를 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          활동 지도
        </h1>
        <p className="text-gray-400 mt-1">방문한 장소를 기록하고 Google Maps 저장 장소를 확인하세요</p>
      </div>

      {/* Area selector */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        {AREAS.map((a) => (
          <button
            key={a.key}
            onClick={() => setArea(a.key)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              area === a.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Google Maps */}
      <GoogleMapView
        center={{ lat: currentArea.lat, lng: currentArea.lng }}
        spots={filteredSpots}
        onMapClick={handleMapClick}
        clickedPosition={formLat !== null && formLng !== null ? { lat: formLat, lng: formLng } : null}
      />

      {/* Google Maps link */}
      <div className="flex flex-wrap gap-3">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
        >
          Google Maps에서 열기 (저장 장소 확인)
        </a>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
        >
          + 장소 기록
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-sm font-medium text-white">{editingId ? "장소 수정" : "새 장소 기록"}</h3>
          {formLat !== null && formLng !== null && (
            <div className="text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg">
              📍 지도에서 선택한 위치 ({formLat.toFixed(5)}, {formLng.toFixed(5)})
            </div>
          )}
          <input
            type="text"
            placeholder="장소 이름"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50"
          />
          <input
            type="text"
            placeholder="주소 또는 장소명 (Google Maps 검색용, 선택)"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as SpotCategory)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none"
            >
              {SPOT_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key} className="bg-gray-900">{cat.icon} {cat.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <input
            type="text"
            placeholder="메모 (선택)"
            value={formMemo}
            onChange={(e) => setFormMemo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors">{editingId ? "수정" : "추가"}</button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">취소</button>
          </div>
        </div>
      )}

      {/* Category filter */}
      {areaSpots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            전체 ({areaSpots.length})
          </button>
          {SPOT_CATEGORIES.map((cat) => {
            const count = areaSpots.filter((s) => s.category === cat.key).length;
            if (count === 0) return null;
            return (
              <button key={cat.key} onClick={() => setFilter(cat.key)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === cat.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                {cat.icon} {cat.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Spot list */}
      {filteredSpots.length > 0 && (
        <div className="space-y-2">
          {filteredSpots.map((spot) => {
            const cat = SPOT_CATEGORIES.find((c) => c.key === spot.category);
            const searchQuery = spot.address || spot.name;
            const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
            return (
              <div key={spot.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 group">
                <span className="text-lg shrink-0">{cat?.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{spot.name}</div>
                  {spot.memo && <div className="text-xs text-gray-500 truncate">{spot.memo}</div>}
                </div>
                {spot.date && <span className="text-xs text-gray-500 shrink-0">{spot.date}</span>}
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors p-1 shrink-0"
                  title="Google Maps에서 보기"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </a>
                <button
                  onClick={() => startEdit(spot)}
                  className="text-gray-500 hover:text-purple-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0"
                  title="수정"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteTarget(spot.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0"
                  title="삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {areaSpots.length === 0 && (
        <div className="text-center py-10 rounded-xl border border-dashed border-white/10">
          <p className="text-gray-400 mb-2">아직 기록한 장소가 없습니다</p>
          <p className="text-gray-600 text-sm">위의 &apos;+ 장소 기록&apos; 버튼으로 추가하거나, 지도를 클릭하여 장소를 추가하세요</p>
        </div>
      )}
    </div>
  );
}
