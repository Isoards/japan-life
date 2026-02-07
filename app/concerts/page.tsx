"use client";

import { useState, useEffect, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  getUserConcerts,
  addUserConcert,
  updateUserConcert,
  deleteUserConcert,
  UserConcert,
} from "@/lib/userConcerts";

export default function ConcertsPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [concerts, setConcerts] = useState<UserConcert[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formMemo, setFormMemo] = useState("");

  const loadConcerts = () => {
    getUserConcerts().then(setConcerts);
  };

  useEffect(() => {
    loadConcerts();
  }, []);

  const concertDates = useMemo(
    () => new Set(concerts.map((c) => new Date(c.date).toDateString())),
    [concerts]
  );

  const selectedConcerts = useMemo(() => {
    if (!selectedDate) return [];
    return concerts.filter(
      (c) => new Date(c.date).toDateString() === selectedDate.toDateString()
    );
  }, [concerts, selectedDate]);

  const sortedConcerts = useMemo(
    () =>
      [...concerts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [concerts]
  );

  const resetForm = () => {
    setFormTitle("");
    setFormDate("");
    setFormVenue("");
    setFormCity("");
    setFormMemo("");
    setEditingId(null);
  };

  const openForm = (presetDate?: string) => {
    resetForm();
    if (presetDate) setFormDate(presetDate);
    setShowForm(true);
  };

  const startEdit = (concert: UserConcert) => {
    setEditingId(concert.id);
    setFormTitle(concert.title);
    setFormDate(concert.date);
    setFormVenue(concert.venue);
    setFormCity(concert.city);
    setFormMemo(concert.memo);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    if (editingId) {
      await updateUserConcert(editingId, {
        title: formTitle.trim(),
        date: formDate,
        venue: formVenue.trim(),
        city: formCity.trim(),
        memo: formMemo.trim(),
      });
    } else {
      await addUserConcert({
        title: formTitle.trim(),
        date: formDate,
        venue: formVenue.trim(),
        city: formCity.trim(),
        memo: formMemo.trim(),
      });
    }
    loadConcerts();
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteUserConcert(id);
    loadConcerts();
  };

  const tileContent = ({ date, view: v }: { date: Date; view: string }) => {
    if (v === "month" && concertDates.has(date.toDateString())) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">내 콘서트</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => openForm()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30 transition-colors cursor-pointer"
          >
            + 일정 추가
          </button>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                view === "calendar"
                  ? "bg-purple-500/30 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              캘린더
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                view === "list"
                  ? "bg-purple-500/30 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              목록
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-white">
              {editingId ? "콘서트 일정 수정" : "콘서트 일정 추가"}
            </h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                제목 <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="예: YOASOBI ARENA TOUR 2026"
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                날짜 <span className="text-pink-400">*</span>
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">공연장</label>
              <input
                type="text"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                placeholder="예: 東京ドーム"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">도시</label>
              <input
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="예: 도쿄"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">메모</label>
              <textarea
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                placeholder="티켓 정보, 좌석, 동행자 등"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors cursor-pointer text-sm"
              >
                {editingId ? "수정" : "추가"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="space-y-6">
          <div className="concert-calendar">
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              tileContent={tileContent}
              className="!bg-transparent !border-none w-full"
            />
          </div>

          {selectedDate && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">
                  {selectedDate.toLocaleDateString("ko", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => {
                    const yyyy = selectedDate.getFullYear();
                    const mm = String(selectedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const dd = String(selectedDate.getDate()).padStart(2, "0");
                    openForm(`${yyyy}-${mm}-${dd}`);
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  + 이 날짜에 추가
                </button>
              </div>
              {selectedConcerts.length > 0 ? (
                <div className="space-y-3">
                  {selectedConcerts.map((concert) => (
                    <ConcertCard
                      key={concert.id}
                      concert={concert}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">이 날짜에 콘서트가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-3">
          {sortedConcerts.length > 0 ? (
            sortedConcerts.map((concert) => (
              <div
                key={concert.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
              >
                <div className="text-center min-w-[60px]">
                  <div className="text-2xl font-bold text-pink-400">
                    {new Date(concert.date).getDate()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(concert.date).toLocaleString("ko", {
                      month: "short",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(concert.date).getFullYear()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">
                    {concert.title}
                  </h4>
                  {(concert.venue || concert.city) && (
                    <p className="text-sm text-gray-400 mt-1">
                      {[concert.venue, concert.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {concert.memo && (
                    <p className="text-xs text-gray-500 mt-1">
                      {concert.memo}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(concert)}
                    className="text-gray-600 hover:text-purple-400 transition-colors cursor-pointer p-1"
                    title="수정"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(concert.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                    title="삭제"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed border-white/10">
              <p className="text-gray-300 text-lg mb-2">
                등록된 콘서트가 없습니다
              </p>
              <p className="text-gray-500 text-sm mb-4">
                가고 싶은 콘서트 일정을 직접 추가해보세요
              </p>
              <button
                onClick={() => openForm()}
                className="px-4 py-2 text-sm rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors cursor-pointer"
              >
                + 첫 일정 추가하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConcertCard({
  concert,
  onEdit,
  onDelete,
}: {
  concert: UserConcert;
  onEdit: (concert: UserConcert) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 group">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-white">{concert.title}</h4>
          {(concert.venue || concert.city) && (
            <p className="text-sm text-gray-400 mt-1">
              {[concert.venue, concert.city].filter(Boolean).join(" · ")}
            </p>
          )}
          {concert.memo && (
            <p className="text-xs text-gray-500 mt-2 bg-white/5 rounded-md px-2 py-1 inline-block">
              {concert.memo}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(concert)}
            className="text-gray-600 hover:text-purple-400 transition-colors cursor-pointer p-1"
            title="수정"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(concert.id)}
            className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
            title="삭제"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
