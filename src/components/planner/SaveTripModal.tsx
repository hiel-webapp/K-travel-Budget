"use client";

import React from "react";
import type { Dictionary } from "../../lib/i18n/dictionaries/ko";
import type { SavedTripItem } from "../../lib/storage-helper";

interface SaveTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOverwrite: () => void;
  existingTrip: SavedTripItem | null;
  newTripTitle: string;
  locale: "ko" | "en";
  dict: Dictionary;
}

export default function SaveTripModal({
  isOpen,
  onClose,
  onConfirmOverwrite,
  existingTrip,
  newTripTitle,
  locale,
  dict,
}: SaveTripModalProps) {
  if (!isOpen) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overwrite-trip-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-md w-full rounded-2xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 space-y-4 text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            {locale === "ko" ? "기존 저장된 여행 덮어쓰기" : "Overwrite Saved Trip"}
          </span>
        </div>

        <div className="space-y-1">
          <h3 id="overwrite-trip-modal-title" className="text-base font-extrabold text-[#0f172a] tracking-tight">
            {locale === "ko" ? "이미 저장된 여행이 있습니다" : "A saved trip already exists"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {locale === "ko"
              ? "최대 1개의 여행만 보관할 수 있습니다. 현재 작성 중인 일정으로 기존 여행을 덮어쓰시겠습니까?"
              : "Only 1 trip can be saved. Overwrite the existing trip with your current itinerary?"}
          </p>
        </div>

        {/* 기존 여행 vs 새로운 여행 비교 카드 */}
        <div className="space-y-2.5 pt-1">
          {/* 기존 저장된 여행 */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {locale === "ko" ? "기존 저장된 여행" : "Currently Saved"}
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 truncate">
                {existingTrip?.title || (locale === "ko" ? "저장된 여행" : "Saved Trip")}
              </span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {formatDate(existingTrip?.savedAt)}
              </span>
            </div>
          </div>

          <div className="flex justify-center -my-1 text-slate-300">
            <span className="text-xs">↓</span>
          </div>

          {/* 새로 덮어쓸 여행 */}
          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-1">
            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">
              {locale === "ko" ? "새로 저장할 여행 (현재 작성 중)" : "New Itinerary (To Overwrite)"}
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-[#0f172a] truncate">
                {newTripTitle}
              </span>
              <span className="text-[10px] text-rose-600 font-bold shrink-0">
                {locale === "ko" ? "덮어쓰기 예정" : "Will replace"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
          >
            {dict.planner.saveTripModalCancel || (locale === "ko" ? "취소" : "Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirmOverwrite}
            className="h-9 px-4 rounded-xl bg-[#e25c5c] text-white hover:bg-[#d14b4b] active:bg-[#c03a3a] font-bold text-xs cursor-pointer transition-colors shadow-2xs"
          >
            {locale === "ko" ? "덮어쓰기 저장" : "Overwrite & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
