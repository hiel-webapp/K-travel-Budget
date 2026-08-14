"use client";

import React from "react";
import type { Locale } from "../../lib/i18n/locales";
import type { BudgetTier } from "../../lib/trip-domain";

interface BudgetTierModalProps {
  pendingBudgetTier: BudgetTier | null;
  onClose: () => void;
  onConfirm: (tier: BudgetTier) => void;
  locale: Locale;
}

export default function BudgetTierModal({
  pendingBudgetTier,
  onClose,
  onConfirm,
  locale,
}: BudgetTierModalProps) {
  if (!pendingBudgetTier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 text-center transform transition-all">
        <div className="w-12 h-12 rounded-2xl bg-[#fdf2f2] text-[#e25c5c] flex items-center justify-center text-2xl mx-auto font-bold">
          💡
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-[#0f172a]">
            {locale === "ko" ? "예산 스타일 변경" : "Change Budget Style"}
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {locale === "ko"
              ? "선택하신 스타일에 맞게 초기화됩니다. 계속 진행하시겠습니까?"
              : "Your budget items will be reset to match the selected style. Would you like to proceed?"}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {locale === "ko" ? "취소" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pendingBudgetTier)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#e25c5c] hover:bg-[#d14b4b] text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
          >
            {locale === "ko" ? "확인" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
