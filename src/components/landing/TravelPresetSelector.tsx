"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 반응형 한 번에 노출될 카드 수 계산 (PC: 3, Tablet: 2, Mobile: 1)
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const totalPresets = TRAVEL_PRESETS.length;
  const maxIndex = Math.max(0, totalPresets - visibleCount);

  // 다음 슬라이드 이동 (순환)
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  // 이전 슬라이드 이동 (순환)
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // n초(4초) 자동 롤링 타이머
  useEffect(() => {
    if (!isPlaying || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isPaused, handleNext]);

  // 터치 스와이프 핸들러 (모바일)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diffX = touchStartXRef.current - touchEndXRef.current;
      if (diffX > 40) {
        handleNext();
      } else if (diffX < -40) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <div
      className="w-full space-y-3.5 mb-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 헤더 타이틀 및 직접 선택 전환 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#b93829]/10 text-[#b93829]">
              QUICK PRESETS
            </span>
            <span className="text-xs font-bold text-slate-500">
              {locale === "ko" ? "한국관광공사 추천 5대 테마 코스" : "KTO Curated 5 Style Courses"}
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

      {/* 프리셋 캐러셀 뷰포트 */}
      <div
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
          }}
        >
          {TRAVEL_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            const badge = locale === "ko" ? preset.badgeKo : preset.badgeEn;
            const title = locale === "ko" ? preset.titleKo : preset.titleEn;
            const tagline = locale === "ko" ? preset.taglineKo : preset.taglineEn;
            const route = locale === "ko" ? preset.routeTextKo : preset.routeTextEn;
            const tags = locale === "ko" ? preset.highlightTagsKo : preset.highlightTagsEn;

            return (
              <div
                key={preset.id}
                className="px-1.5 shrink-0"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <button
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`group relative w-full h-[268px] sm:h-[280px] text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl select-none ${
                    isSelected
                      ? "border-teal-400 ring-2 ring-teal-400/50 shadow-lg scale-[1.01]"
                      : "border-neutral-200/80 hover:border-neutral-300"
                  }`}
                >
                  {/* 배경 이미지 (한국관광공사 고화질 사진) */}
                  <img
                    src={preset.imageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* 딥 다크 그라데이션 오버레이 (텍스트 가독성 확보) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                  {/* 선택 시 활성화되는 테두리 광원 효과 */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-teal-400 rounded-2xl pointer-events-none" />
                  )}

                  {/* 카드 상단: 뱃지 & 선택 인디케이터 */}
                  <div className="relative z-10 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md bg-white/20 border border-white/30 text-white shadow-xs tracking-tight">
                        {badge}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shadow-xs ${
                          isSelected
                            ? "border-teal-400 bg-teal-500 text-white"
                            : "border-white/40 bg-black/30 text-transparent group-hover:border-white/70"
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                    {/* 타이틀 & 슬로건 */}
                    <div>
                      <h3 className="text-[15px] sm:text-[16px] font-black text-white tracking-tight leading-snug group-hover:text-teal-200 transition-colors drop-shadow-xs">
                        {title}
                      </h3>
                      <p className="text-xs text-white/80 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {tagline}
                      </p>
                    </div>

                    {/* 동선 요약 뱃지 */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white/95 shadow-2xs">
                      <span className="text-[10px] text-white/60 font-medium">동선:</span>
                      <span>{route}</span>
                    </div>
                  </div>

                  {/* 카드 하단: 태그 & 예상 예산 */}
                  <div className="relative z-10 pt-2.5 mt-2 border-t border-white/15 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-[10px] text-white/75 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] text-white/60 block leading-none">1인 권장</span>
                      <span className="text-xs sm:text-[13px] font-black text-amber-300 tabular-nums">
                        {formatKrw(preset.estimatedBudgetKrw)}~
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 컨트롤러 바: 좌우 이동, 페이지네이션 도트, 자동 롤링 상태 */}
      <div className="flex items-center justify-between px-2 pt-1">
        {/* 좌측 정보 (자동 재생 안내) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            aria-label={isPlaying ? "일시정지" : "자동재생"}
          >
            <span>{isPlaying ? "⏸" : "▶"}</span>
            <span className="hidden sm:inline">{isPlaying ? "자동 롤링 중 (4초)" : "정지됨"}</span>
          </button>
        </div>

        {/* 중앙: 도트 인디케이터 */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx
                  ? "w-6 bg-teal-600 shadow-xs"
                  : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
              aria-label={`슬라이드 ${idx + 1}로 이동`}
            />
          ))}
        </div>

        {/* 우측: 좌/우 화살표 네비게이션 버튼 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-bold"
            aria-label="이전 프리셋"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-bold"
            aria-label="다음 프리셋"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
