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
  const totalPresets = TRAVEL_PRESETS.length; // 5개

  // 3배 복제 배열을 구성하여 양방향 무한 루프 구현 ([0~4], [5~9 원본], [10~14])
  const extendedPresets = [...TRAVEL_PRESETS, ...TRAVEL_PRESETS, ...TRAVEL_PRESETS];

  // 초기 위치: 중앙 세트의 첫 번째 아이템 (인덱스 5)
  const [currentIndex, setCurrentIndex] = useState(totalPresets);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [dragOffset, setDragOffset] = useState(0);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const preventClickRef = useRef(false);
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

  // 다음 슬라이드 이동 (무한 순환)
  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // 이전 슬라이드 이동 (무한 순환)
  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  // 트랜지션 완료 시 클론 경계 체크 및 무한 루프 점프 (순간 이동)
  const handleTransitionEnd = () => {
    if (currentIndex >= totalPresets * 2) {
      // 오른쪽 끝 클론 도달 -> 애니메이션 끄고 중앙 세트로 순간 이동
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev - totalPresets);
    } else if (currentIndex < totalPresets) {
      // 왼쪽 끝 클론 도달 -> 애니메이션 끄고 중앙 세트로 순간 이동
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev + totalPresets);
    }
  };

  // 순간 이동 후 트랜지션 다시 활성화
  useEffect(() => {
    if (!isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

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

  // ================= 마우스 드래그 핸들러 (PC Drag to Slide) =================
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    preventClickRef.current = false;
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const diff = e.clientX - dragStartXRef.current;
    if (Math.abs(diff) > 6) {
      preventClickRef.current = true;
    }
    setDragOffset(diff * 0.4);
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPaused(false);

    if (dragOffset < -40) {
      handleNext();
    } else if (dragOffset > 40) {
      handlePrev();
    }
    setDragOffset(0);

    setTimeout(() => {
      preventClickRef.current = false;
    }, 150);
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleMouseUp();
    }
    setIsPaused(false);
  };

  // ================= 터치 스와이프 핸들러 (모바일) =================
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartXRef.current = e.touches[0].clientX;
    preventClickRef.current = false;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartXRef.current;
    if (Math.abs(diff) > 6) {
      preventClickRef.current = true;
    }
    setDragOffset(diff * 0.4);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (dragOffset < -40) {
      handleNext();
    } else if (dragOffset > 40) {
      handlePrev();
    }
    setDragOffset(0);

    setTimeout(() => {
      preventClickRef.current = false;
    }, 150);
  };

  // 도트 인디케이터용 현재 원본 인덱스 계산 (0 ~ 4)
  const activeDotIndex = ((currentIndex % totalPresets) + totalPresets) % totalPresets;

  const handleDotClick = (targetIndex: number) => {
    setIsTransitioning(true);
    setCurrentIndex(totalPresets + targetIndex);
  };

  return (
    <div
      className="w-full space-y-3.5 mb-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 헤더 타이틀 */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#b93829]/10 text-[#b93829]">
              QUICK PRESETS
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

      {/* 프리셋 캐러셀 뷰포트 (자연스러운 무한 루프 + 마우스 드래그 & 터치 스와이프) */}
      <div
        className="relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          onTransitionEnd={handleTransitionEnd}
          className={`flex ${
            isTransitioning && dragOffset === 0
              ? "transition-transform duration-500 ease-out"
              : "transition-none"
          } will-change-transform`}
          style={{
            transform: `translateX(calc(-${currentIndex * (100 / visibleCount)}% + ${dragOffset}px))`,
          }}
        >
          {extendedPresets.map((preset, index) => {
            const isSelected = activePresetId === preset.id;
            const badge = locale === "ko" ? preset.badgeKo : preset.badgeEn;
            const title = locale === "ko" ? preset.titleKo : preset.titleEn;
            const tagline = locale === "ko" ? preset.taglineKo : preset.taglineEn;
            const route = locale === "ko" ? preset.routeTextKo : preset.routeTextEn;
            const tags = locale === "ko" ? preset.highlightTagsKo : preset.highlightTagsEn;

            return (
              <div
                key={`${preset.id}-${index}`}
                className="px-1.5 shrink-0"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (preventClickRef.current) return;
                    onSelectPreset(preset);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectPreset(preset);
                    }
                  }}
                  className={`group relative w-full h-[280px] sm:h-[295px] text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-2xl select-none ${
                    isSelected
                      ? "border-teal-400 ring-2 ring-teal-400/60 shadow-xl scale-[1.01]"
                      : "border-neutral-200/80 hover:border-neutral-300"
                  }`}
                >
                  {/* 배경 이미지 (한국관광공사 고화질 실사) */}
                  <img
                    src={preset.imageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-none"
                    loading="lazy"
                    draggable={false}
                  />

                  {/* 하단 집약형 딥 다크 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 via-45% to-black/20 pointer-events-none" />

                  {/* 선택 시 테두리 광원 링 */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-teal-400 rounded-2xl pointer-events-none z-20" />
                  )}

                  {/* 1. 상단 영역: 뱃지 & 선택 인디케이터 */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md bg-white/25 border border-white/40 text-white shadow-md tracking-tight">
                      {badge}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shadow-md ${
                        isSelected
                          ? "border-teal-400 bg-teal-500 text-white"
                          : "border-white/50 bg-black/40 text-transparent group-hover:border-white/80"
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* 2. 하단 영역: 순백색 타이틀, 서브타이틀, 동선, 구분선, 태그 & 예산 */}
                  <div className="relative z-10 w-full space-y-2.5">
                    <div>
                      <h3
                        style={{ color: "#ffffff" }}
                        className="text-[16px] sm:text-[17px] font-black !text-white tracking-tight leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-colors"
                      >
                        {title}
                      </h3>
                      <p className="text-xs text-white/90 line-clamp-2 mt-1 leading-relaxed font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        {tagline}
                      </p>
                    </div>

                    {/* 동선 요약 뱃지 */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/25 text-[11px] font-bold text-white shadow-xs">
                        <span className="text-[10px] text-white/70 font-medium">동선:</span>
                        <span>{route}</span>
                      </span>
                    </div>

                    {/* 구분선 및 태그 & 1인 권장 예산 */}
                    <div className="pt-2 border-t border-white/20 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-white/85 font-medium drop-shadow-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9.5px] text-white/70 block leading-none">1인 권장</span>
                        <span className="text-xs sm:text-[13px] font-black text-amber-300 tabular-nums drop-shadow-xs">
                          {formatKrw(preset.estimatedBudgetKrw)}~
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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

        {/* 중앙: 도트 인디케이터 (0 ~ 4) */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPresets }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDotClick(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeDotIndex === idx
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
