"use client";

import React, { useState, useEffect } from "react";
import { TravelPreset } from "../../lib/presets/travel-presets";
import PresetBuilderModal from "./PresetBuilderModal";

export default function PresetManagerPanel() {
  const [presets, setPresets] = useState<TravelPreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPresetForEdit, setSelectedPresetForEdit] = useState<TravelPreset | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);

  const fetchPresets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/presets?includeInactive=true");
      const data = await res.json();
      if (data.success) {
        setPresets(data.presets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleToggleActive = async (preset: TravelPreset) => {
    const nextStatus = !preset.isActive;
    try {
      const res = await fetch("/api/admin/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preset.id, updates: { isActive: nextStatus } }),
      });
      const data = await res.json();
      if (data.success) {
        setPresets(presets.map((p) => (p.id === preset.id ? { ...p, isActive: nextStatus } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= presets.length) return;

    const newList = [...presets];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    setPresets(newList);

    try {
      await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REORDER",
          orderedIds: newList.map((p) => p.id),
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClone = async (preset: TravelPreset) => {
    const newTitleKo = prompt("복제할 프리셋의 새 테마명(한국어)을 입력하세요:", `${preset.titleKo} (사본)`);
    if (!newTitleKo) return;

    try {
      const res = await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLONE",
          sourcePresetId: preset.id,
          newTitleKo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPresets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (preset: TravelPreset) => {
    if (!confirm(`프리셋 "${preset.titleKo}" (${preset.id})을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/presets?id=${preset.id}&hard=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPresets(presets.filter((p) => p.id !== preset.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (!confirm("모든 프리셋을 초기 기본 5개 상태로 되돌리시겠습니까?")) return;
    try {
      const res = await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPresets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗺️</span> 여행 코스 프리셋 관리
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            총 {presets.length}개 프리셋 등록됨 (활성: {presets.filter((p) => p.isActive !== false).length}개) · 랜딩 페이지 및 플래너에 즉시 실시간 연동됩니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            기본 5개로 초기화
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPresetForEdit(null);
              setIsBuilderOpen(true);
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center gap-1.5"
          >
            <span>+</span> 카탈로그 기반 새 프리셋 조립
          </button>
        </div>
      </div>

      {/* Preset Cards List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {presets.map((preset, index) => {
            const isActive = preset.isActive !== false;
            return (
              <div
                key={preset.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isActive
                    ? "border-slate-800 bg-slate-900/60 shadow-md"
                    : "border-slate-800/40 bg-slate-950/40 opacity-60"
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Order control */}
                  <div className="flex flex-col items-center justify-center gap-1 pt-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 text-xs"
                      title="위로 이동"
                    >
                      ▲
                    </button>
                    <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === presets.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 text-xs"
                      title="아래로 이동"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={preset.imageUrl || "https://tong.visitkorea.or.kr/cms/resource/66/3092766_image2_1.jpg"}
                    alt={preset.titleKo}
                    className="h-20 w-24 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                  />

                  {/* Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-400">{preset.id}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {isActive ? "활성 (노출 중)" : "비활성 (숨김)"}
                      </span>
                      {preset.isCustom && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                          커스텀 생성
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{preset.titleKo}</span>
                      <span className="text-xs font-normal text-slate-400">({preset.titleEn})</span>
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-1">{preset.taglineKo}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 flex-wrap">
                      <span className="font-medium text-slate-400">동선: {preset.routeTextKo}</span>
                      <span>·</span>
                      <span className="font-bold text-indigo-400">
                        1인 예산: ₩{preset.estimatedBudgetKrw?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(preset)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {isActive ? "숨기기" : "노출하기"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClone(preset)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    복제
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPresetForEdit(preset);
                      setIsBuilderOpen(true);
                    }}
                    className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600"
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(preset)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preset Builder / Editor Modal */}
      <PresetBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        initialData={selectedPresetForEdit}
        onSaved={() => {
          fetchPresets();
        }}
      />
    </div>
  );
}
