"use client";

import React, { useState } from "react";
import type { Locale } from "src/lib/i18n/locales";

interface TravelHelpline1330Props {
  locale: Locale;
}

export default function TravelHelpline1330({ locale }: TravelHelpline1330Props) {
  const isKo = locale === "ko";
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("+82-2-1330");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Left Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
            ☎
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-400/30">
            24/7 Official Helpline
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {isKo ? "한국관광공사 공식 1330" : "Korea Tourism Org"}
          </span>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
            {isKo
              ? "24시간 무료 관광통역 헬프라인 1330"
              : "24/7 Tourist Helpline & Translation (1330)"}
          </h3>
          <p className="text-xs text-slate-300 font-normal mt-0.5 leading-relaxed max-w-lg">
            {isKo
              ? "여행 중 길찾기, 택시 기사와의 소통, 응급 통역 및 관광 불편 사항 발생 시 연중무휴 무료 지원됩니다."
              : "Free 24/7 real-time emergency translation, directions, taxi communication, and tourist guidance in 4 languages."}
          </p>
        </div>

        {/* Supported Languages Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Languages:</span>
          {["한국어", "English", "日本語", "中文"].map((lang) => (
            <span
              key={lang}
              className="text-[10px] font-semibold bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
        <a
          href="tel:1330"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
        >
          <span>📞</span>
          <span>{isKo ? "국내 통화: 1330" : "Call 1330"}</span>
        </a>

        <button
          type="button"
          onClick={handleCopyPhone}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs transition-all cursor-pointer"
        >
          <span>{copied ? "✓" : "📋"}</span>
          <span>
            {copied
              ? (isKo ? "번호 복사됨" : "Copied!")
              : "+82-2-1330"}
          </span>
        </button>

        <a
          href="https://www.visitkorea.or.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all"
        >
          <span>{isKo ? "공식 안내" : "Info"}</span>
          <span>↗</span>
        </a>
      </div>
    </div>
  );
}
