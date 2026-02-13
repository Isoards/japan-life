"use client";

import { useState } from "react";
import type { WeeklyLog } from "@/lib/types";
import { useLogs, mutateAPI } from "@/lib/hooks/use-api";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

function getCurrentWeek(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export default function LogsPage() {
  const { data: logs = [], isLoading, error, mutate } = useLogs();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [formWeek, setFormWeek] = useState(getCurrentWeek());
  const [formTechnical, setFormTechnical] = useState("");
  const [formExpression, setFormExpression] = useState("");
  const [formMistake, setFormMistake] = useState("");
  const [formMemo, setFormMemo] = useState("");

  const resetForm = () => {
    setFormWeek(getCurrentWeek());
    setFormTechnical("");
    setFormExpression("");
    setFormMistake("");
    setFormMemo("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (log: WeeklyLog) => {
    setEditingId(log.id);
    setFormWeek(log.week);
    setFormTechnical(log.technical);
    setFormExpression(log.expression);
    setFormMistake(log.mistake);
    setFormMemo(log.memo || "");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formTechnical.trim() || !formExpression.trim() || !formMistake.trim()) {
      toast("모든 필수 항목을 입력해주세요", "error");
      return;
    }

    const body = {
      week: formWeek,
      technical: formTechnical.trim(),
      expression: formExpression.trim(),
      mistake: formMistake.trim(),
      memo: formMemo.trim() || undefined,
    };

    const res = editingId
      ? await mutateAPI("/api/logs", "PATCH", { id: editingId, ...body })
      : await mutateAPI("/api/logs", "POST", body);

    if (res.ok) {
      toast(editingId ? "회고를 수정했습니다" : "회고를 추가했습니다");
    } else {
      toast(res.error, "error");
    }
    mutate();
    resetForm();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await mutateAPI("/api/logs", "DELETE", { id: deleteTarget });
    if (res.ok) toast("회고를 삭제했습니다");
    else toast(res.error, "error");
    mutate();
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <div className="text-gray-400 py-10 text-center">불러오는 중...</div>;
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
        title="회고 삭제"
        message="이 회고를 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          주간 회고 로그
        </h1>
        <p className="text-gray-400 mt-1">
          매주 배운 것 (기술/표현/실수)을 기록하고 성장을 확인하세요
        </p>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-xs text-gray-500">총 회고</div>
            <div className="text-lg font-bold text-white">{logs.length}주</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-xs text-gray-500">첫 회고</div>
            <div className="text-sm font-medium text-purple-400">
              {logs[logs.length - 1]?.week}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-xs text-gray-500">최근 회고</div>
            <div className="text-sm font-medium text-emerald-400">
              {logs[0]?.week}
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
        >
          + 이번 주 회고 작성
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="text-sm font-medium text-white">
            {editingId ? "회고 수정" : "새 회고 작성"}
          </h3>

          <div>
            <label className="block text-xs text-gray-500 mb-1">주차</label>
            <input
              type="week"
              value={formWeek}
              onChange={(e) => setFormWeek(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              이번 주에 배운 기술 *
            </label>
            <textarea
              placeholder="예: ECU 요구사양 작성법, MATLAB/Simulink 모델링..."
              value={formTechnical}
              onChange={(e) => setFormTechnical(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              배운 일본어 표현 *
            </label>
            <textarea
              placeholder="예: 要件定義(ようけんていぎ) = 요구 정의, 不具合(ふぐあい) = 결함..."
              value={formExpression}
              onChange={(e) => setFormExpression(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              실수/반성 포인트 *
            </label>
            <textarea
              placeholder="예: 보고서에서 단위 변환 실수, 경어 사용 실수..."
              value={formMistake}
              onChange={(e) => setFormMistake(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">메모 (선택)</label>
            <input
              type="text"
              placeholder="기타 메모..."
              value={formMemo}
              onChange={(e) => setFormMemo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors"
            >
              {editingId ? "수정" : "저장"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Logs list */}
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{log.week}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(log)}
                  className="text-gray-500 hover:text-purple-400 transition-colors p-1"
                  title="수정"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteTarget(log.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  title="삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <span className="text-[10px] text-blue-400 uppercase tracking-wider">기술</span>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-line">{log.technical}</p>
              </div>
              <div>
                <span className="text-[10px] text-purple-400 uppercase tracking-wider">표현</span>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-line">{log.expression}</p>
              </div>
              <div>
                <span className="text-[10px] text-pink-400 uppercase tracking-wider">실수/반성</span>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-line">{log.mistake}</p>
              </div>
            </div>

            {log.memo && (
              <p className="text-xs text-gray-600">{log.memo}</p>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-10 rounded-xl border border-dashed border-white/10">
            <p className="text-gray-400 mb-2">아직 회고가 없습니다</p>
            <p className="text-gray-600 text-sm">매주 배운 것을 기록하면 3개월 뒤 성장이 체감됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
