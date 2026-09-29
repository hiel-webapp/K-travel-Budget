"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "src/lib/i18n/locales";

interface ReportShareBarProps {
  locale: Locale;
}

export default function ReportShareBar({ locale }: ReportShareBarProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 2500);
      }
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] sm:w-[92%] max-w-5xl print:hidden">
      <div className="p-3 sm:p-4 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-full border border-neutral-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-300">
        {/* Left: Info Text & Bullet Points */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-neutral-900">
                {locale === "ko" ? "예산 리포트 저장 및 공유" : "Save & Share Budget Report"}
              </span>
              <span className="text-[9.5px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.2 rounded-full hidden sm:inline-block">
                {locale === "ko" ? "원클릭" : "One-Click"}
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-neutral-500 font-medium hidden md:block">
              {locale === "ko" ? "PDF 인쇄 다운로드 · 플래너 수정 · 실시간 링크 공유" : "Instant PDF print, planner editing, and link sharing"}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Print / PDF button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 active:scale-[0.97] text-neutral-700 font-bold text-xs transition-all duration-150 ease-out cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{locale === "ko" ? "인쇄 / PDF" : "Print / PDF"}</span>
          </button>

          {/* Back to Planner button */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/planner`)}
            className="px-4 py-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 active:scale-[0.97] text-neutral-700 font-bold text-xs transition-all duration-150 ease-out cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span>{locale === "ko" ? "플래너 수정" : "Edit Plan"}</span>
          </button>

          {/* One-Click Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.97] px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-150 ease-out shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>{locale === "ko" ? "공유하기 / 링크 복사" : "Share / Copy Link"}</span>
          </button>
        </div>
      </div>

      {/* Floating Glassmorphism Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-neutral-900/90 text-white text-xs sm:text-sm font-semibold backdrop-blur-xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>
              {locale === "ko"
                ? "여행 예산 리포트 링크가 복사되었습니다 ✨"
                : "Trip budget report link copied to clipboard ✨"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
