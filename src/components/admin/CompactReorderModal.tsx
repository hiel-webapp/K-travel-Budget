"use client";

import React, { useState, useEffect, useRef } from "react";

export interface ReorderItem {
  id: string;
  titleKo: string;
  titleEn?: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  highlight?: boolean;
}

interface CompactReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categoryIcon: string;
  items: ReorderItem[];
  onSave: (orderedIds: string[]) => Promise<void>;
  noticeText?: string;
}

export default function CompactReorderModal({
  isOpen,
  onClose,
  title,
  categoryIcon,
  items,
  onSave,
  noticeText,
}: CompactReorderModalProps) {
  const [list, setList] = useState<ReorderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setList([...items]);
      setSearchQuery("");
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  // 순서 이동 헬퍼 함수
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return;
    const updated = [...list];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setList(updated);
  };

  // ㄱㄴㄷ(가나다순) 자동 정렬 핸들러 (추천 항목 최상단 우선 유지)
  const handleSortAlphabetical = (direction: "asc" | "desc" = "asc") => {
    const sorted = [...list].sort((a, b) => {
      const aHighlight = !!(a.highlight || (a.badge && (a.badge.includes("Must") || a.badge.includes("추천"))));
      const bHighlight = !!(b.highlight || (b.badge && (b.badge.includes("Must") || b.badge.includes("추천"))));
      if (aHighlight && !bHighlight) return -1;
      if (!aHighlight && bHighlight) return 1;

      const cmp = a.titleKo.localeCompare(b.titleKo, "ko");
      return direction === "asc" ? cmp : -cmp;
    });
    setList(sorted);
  };

  const moveToTop = (index: number) => {
    moveItem(index, 0);
  };

  const moveToBottom = (index: number) => {
    moveItem(index, list.length - 1);
  };

  // HTML5 Drag & Drop 핸들러
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // 파이어폭스 등 일부 브라우저 호환
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveItem(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 저장 핸들러
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const orderedIds = list.map((item) => item.id);
      await onSave(orderedIds);
      onClose();
    } catch (err: any) {
      alert(`순서 저장 중 오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 검색 필터링된 인덱스 맵핑
  const filteredList = list.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.titleKo.toLowerCase().includes(query) ||
      (item.titleEn && item.titleEn.toLowerCase().includes(query)) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryIcon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-400/40 px-2.5 py-0.5 text-xs font-extrabold text-indigo-300">
                  총 {list.length}개
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                마우스로 행을 잡고 원하는 위치로 끌어놓거나(Drag & Drop), 우측 이동 버튼을 클릭하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="이름이나 영문명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Sort Actions */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleSortAlphabetical("asc")}
              className="rounded-xl border border-indigo-500/50 bg-indigo-600/30 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="한글 이름 기준 가나다(ㄱ~ㅎ) 순으로 전체 정렬"
            >
              <span>🔤</span>
              <span>ㄱㄴㄷ순 정렬</span>
            </button>
            <button
              type="button"
              onClick={() => handleSortAlphabetical("desc")}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm active:scale-95"
              title="한글 이름 기준 역순(ㅎ~ㄱ)으로 전체 정렬"
            >
              <span>ㅎ~ㄱ</span>
            </button>
            {noticeText && (
              <div className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2.5 py-1 flex items-center gap-1">
                <span>💡</span>
                <span className="hidden md:inline">{noticeText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reorderable List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 min-h-[320px] max-h-[58vh]">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              검색 조건에 맞는 항목이 없습니다.
            </div>
          ) : (
            filteredList.map((item) => {
              const actualIndex = list.findIndex((x) => x.id === item.id);
              const isTop3 = actualIndex < 3;
              const isDragging = draggedIndex === actualIndex;
              const isOver = dragOverIndex === actualIndex;

              return (
                <div
                  key={item.id}
                  draggable={!searchQuery} // 검색 중에는 원본 인덱스 왜곡 방지를 위해 드래그 비활성화하고 버튼으로 이동
                  onDragStart={(e) => handleDragStart(e, actualIndex)}
                  onDragOver={(e) => handleDragOver(e, actualIndex)}
                  onDrop={(e) => handleDrop(e, actualIndex)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 transition-all select-none ${
                    isDragging
                      ? "opacity-30 border-indigo-400 bg-indigo-950/60 scale-[0.98]"
                      : isOver
                      ? "border-indigo-400 bg-indigo-900/30 shadow-lg"
                      : "border-slate-800/80 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/50"
                  } ${!searchQuery ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  {/* Left: Handle + Index Badge + Thumbnail + Names */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Drag Handle */}
                    <div
                      className={`text-slate-500 group-hover:text-slate-300 px-1 text-base font-bold ${
                        searchQuery ? "opacity-30 cursor-not-allowed" : ""
                      }`}
                      title={searchQuery ? "검색 중에는 버튼으로 이동하세요" : "잡고 끌어서 순서 변경"}
                    >
                      ⠿
                    </div>

                    {/* Order Number Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        actualIndex === 0
                          ? "bg-amber-500/25 border border-amber-400/60 text-amber-300 shadow-sm"
                          : actualIndex === 1
                          ? "bg-slate-400/20 border border-slate-300/40 text-slate-200"
                          : actualIndex === 2
                          ? "bg-orange-500/20 border border-orange-400/40 text-orange-300"
                          : "bg-slate-800 border border-slate-700 text-slate-400"
                      }`}
                    >
                      {actualIndex + 1}
                    </div>

                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.titleKo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-800/80 flex items-center justify-center text-xs shrink-0 text-slate-500">
                        {categoryIcon}
                      </div>
                    )}

                    {/* Titles */}
                    <div className="min-w-0 flex-1 truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white truncate">
                          {item.titleKo}
                        </span>
                        {item.titleEn && (
                          <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                            ({item.titleEn})
                          </span>
                        )}
                        {item.badge && (
                          <span className="rounded bg-indigo-500/20 border border-indigo-400/30 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-300 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Move Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={actualIndex === 0}
                      onClick={() => moveToTop(actualIndex)}
                      className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                      title="맨 위로 (1위) 이동"
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      disabled={actualIndex === 0}
                      onClick={() => moveItem(actualIndex, actualIndex - 1)}
                      className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                      title="한 칸 위로"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={actualIndex === list.length - 1}
                      onClick={() => moveItem(actualIndex, actualIndex + 1)}
                      className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                      title="한 칸 아래로"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      disabled={actualIndex === list.length - 1}
                      onClick={() => moveToBottom(actualIndex)}
                      className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-[11px] font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                      title="맨 아래로 이동"
                    >
                      End
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3.5 bg-slate-900/95">
          <button
            type="button"
            onClick={() => setList([...items])}
            disabled={isSaving}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            ↺ 원래대로 복원
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSaving ? "⏳" : "💾"}</span>
              <span>{isSaving ? "저장 및 배포 중..." : "순서 저장 및 실시간 적용"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
