"use client";

import React from "react";
import type { Dictionary } from "../../lib/i18n/dictionaries/ko";

interface SaveTripModalProps {
  isOpen: boolean;
  saveTitle: string;
  onSaveTitleChange: (title: string) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  dict: Dictionary;
}

export default function SaveTripModal({
  isOpen,
  saveTitle,
  onSaveTitleChange,
  onClose,
  onSave,
  dict,
}: SaveTripModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-trip-modal-title"
    >
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200/80 shadow-2xl p-6 space-y-4">
        <h3 id="save-trip-modal-title" className="text-base font-extrabold text-[#0f172a]">
          {dict.planner.saveTripModalTitle}
        </h3>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="trip-title-input" className="text-xs font-bold text-slate-500 block">
              {dict.planner.saveTripModalLabel}
            </label>
            <input
              id="trip-title-input"
              type="text"
              required
              value={saveTitle}
              onChange={(e) => onSaveTitleChange(e.target.value)}
              placeholder={dict.planner.saveTripModalPlaceholder}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#e25c5c] text-sm text-[#0f172a] bg-slate-50/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer"
            >
              {dict.planner.saveTripModalCancel}
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-[#e25c5c] text-white hover:bg-[#d14b4b] font-bold text-xs cursor-pointer"
            >
              {dict.planner.saveTripModalSave}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
