"use client";

import React from "react";
import { Locale } from "../../lib/i18n/locales";
import type { Dictionary } from "../../lib/i18n/dictionaries/ko";
import { TRAVEL_PRESETS, TravelPreset, TravelPresetId } from "../../lib/presets/travel-presets";
import { formatKrw } from "../../features/budget/presentation/formatters";

interface TravelPresetSelectorProps {
  locale: Locale;
  dict: Dictionary;
  activePresetId: TravelPresetId | null;
  onSelectPreset: (preset: TravelPreset) => void;
  onClearPreset?: () => void;
}

export default function TravelPresetSelector({
  locale,
  dict,
  activePresetId,
  onSelectPreset,
  onClearPreset,
}: TravelPresetSelectorProps) {
  return (
    <div className="w-full space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#b93829]/10 text-[#b93829]">
              QUICK PRESETS
            </span>
            <span className="text-xs font-bold text-slate-500">
              {locale === "ko" ? "취향 저격 3대 추천 코스" : "3 Curated Style Courses"}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1">
            {locale === "ko"
              ? "어떤 여행을 꿈꾸고 계신가요? 1초 만에 플랜 완성하기"
              : "Choose Your Travel Style — Ready in 1 Click"}
          </h2>
        </div>
        {activePresetId && onClearPreset && (
          <button
            type="button"
            onClick={onClearPreset}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 hover:underline self-start sm:self-auto cursor-pointer transition-colors"
          >
            {locale === "ko" ? "↺ 직접 선택으로 전환" : "↺ Custom Planning"}
          </button>
        )}
      </div>

      {/* 3대 프리셋 반응형 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {TRAVEL_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          const badge = locale === "ko" ? preset.badgeKo : preset.badgeEn;
          const title = locale === "ko" ? preset.titleKo : preset.titleEn;
          const tagline = locale === "ko" ? preset.taglineKo : preset.taglineEn;
          const route = locale === "ko" ? preset.routeTextKo : preset.routeTextEn;
          const tags = locale === "ko" ? preset.highlightTagsKo : preset.highlightTagsEn;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                isSelected
                  ? "bg-white border-[#b93829] ring-2 ring-[#b93829]/20 shadow-md scale-[1.01]"
                  : "bg-gradient-to-b from-white to-slate-50/60 border-slate-200/90 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {/* 상단 장식 그라데이션 라인 */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                }`}
                style={{ backgroundColor: preset.accentColor }}
              />

              <div className="space-y-2.5">
                {/* 뱃지 & 선택 인디케이터 */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full border tracking-tight ${preset.badgeBg} ${preset.badgeText}`}
                  >
                    {badge}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-[#b93829] bg-[#b93829] text-white"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 타이틀 & 슬로건 */}
                <div>
                  <h3 className="text-[15px] sm:text-[16px] font-black text-slate-900 tracking-tight leading-snug group-hover:text-[#b93829] transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-medium">
                    {tagline}
                  </p>
                </div>

                {/* 동선 요약 뱃지 */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/70 text-[11px] font-bold text-slate-700">
                  <span className="text-[10px] text-slate-400">동선:</span>
                  <span>{route}</span>
                </div>
              </div>

              {/* 하단 태그 & 예상 예산 */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-[10px] text-slate-400 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9.5px] text-slate-400 block leading-none">1인 권장</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {formatKrw(preset.estimatedBudgetKrw)}~
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
