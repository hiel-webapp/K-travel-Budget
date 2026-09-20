"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SupportedCity } from "../../../lib/trip-domain";
import {
  STAY_ARCHETYPES,
  StayArchetypeId,
  OccupancyMode,
  getStayArchetypePrice,
} from "../catalog/stay-archetypes";
import { SplitStaySegment, BudgetBasketId } from "../domain/types";
import { useExchangeRate } from "../../../lib/hooks/useExchangeRate";
import { formatPriceByLocale } from "../../../lib/currency/currency-converter";

export interface SplitStayModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: SupportedCity;
  cityName: string;
  cityNights: number;
  locale: "ko" | "en";
  adultCount: number;
  occupancyMode: OccupancyMode;
  initialSegments?: SplitStaySegment[] | null;
  defaultArchetypeId: StayArchetypeId | null;
  onApply: (segments: SplitStaySegment[]) => void;
  onResetSplit: () => void;
}

export const SplitStayModal: React.FC<SplitStayModalProps> = ({
  isOpen,
  onClose,
  city,
  cityName,
  cityNights,
  locale,
  adultCount,
  occupancyMode,
  initialSegments,
  defaultArchetypeId,
  onApply,
  onResetSplit,
}) => {
  const { usdRate } = useExchangeRate();

  // 각 박차별(0-indexed: 0 = 1박차, 1 = 2박차...) 선택된 StayArchetypeId 배열
  const [nightSelections, setNightSelections] = useState<StayArchetypeId[]>(() => {
    return createInitialNightSelections(cityNights, initialSegments, defaultArchetypeId);
  });

  // 모달이 열리거나 cityNights/initialSegments가 바뀔 때 상태 동기화
  useEffect(() => {
    if (isOpen) {
      setNightSelections(createInitialNightSelections(cityNights, initialSegments, defaultArchetypeId));
    }
  }, [isOpen, cityNights, initialSegments, defaultArchetypeId]);

  // 방 개수 및 인원 계산
  const isSoloTraveler = adultCount <= 1;
  const isPairSplit = !isSoloTraveler && occupancyMode === "SHARED_PAIR";
  const sharedRoomCount = Math.ceil(adultCount / 2);
  const roomCount = isSoloTraveler ? 1 : isPairSplit ? sharedRoomCount : adultCount;

  // 특정 박차의 숙소 변경
  const handleSelectNight = (nightIndex: number, archId: StayArchetypeId) => {
    setNightSelections((prev) => {
      const next = [...prev];
      next[nightIndex] = archId;
      return next;
    });
  };

  // 프리셋 1: 앞 절반 비즈니스 + 뒤 절반 한옥/부티크
  const applyHalfAndHalfPreset = () => {
    const half = Math.ceil(cityNights / 2);
    setNightSelections(
      Array.from({ length: cityNights }, (_, i) =>
        i < half ? "BUSINESS_HOTEL" : "HANOK_BOUTIQUE"
      )
    );
  };

  // 프리셋 2: 가성비 실속 + 마지막 1박 럭셔리 호캉스
  const applyHocanceLastPreset = () => {
    setNightSelections(
      Array.from({ length: cityNights }, (_, i) =>
        i === cityNights - 1 ? "LUXURY_SKYLINE" : "BUSINESS_HOTEL"
      )
    );
  };

  // 프리셋 3: 배낭 실속 + 마지막 1박 한옥 감성
  const applyBackpackerPreset = () => {
    setNightSelections(
      Array.from({ length: cityNights }, (_, i) =>
        i === cityNights - 1 ? "HANOK_BOUTIQUE" : "HOSTEL_GUESTHOUSE"
      )
    );
  };

  // 연속된 동일 숙소를 자동으로 묶어주는 스마트 그룹핑
  const groupedSummary = useMemo(() => {
    if (nightSelections.length === 0) return [];

    const groups: {
      archId: StayArchetypeId;
      startNight: number; // 1-indexed
      endNight: number;   // 1-indexed
      nights: number;
    }[] = [];

    let currentArch = nightSelections[0];
    let startNight = 1;
    let nights = 1;

    for (let i = 1; i < nightSelections.length; i++) {
      if (nightSelections[i] === currentArch) {
        nights += 1;
      } else {
        groups.push({
          archId: currentArch,
          startNight,
          endNight: startNight + nights - 1,
          nights,
        });
        currentArch = nightSelections[i];
        startNight = i + 1;
        nights = 1;
      }
    }

    groups.push({
      archId: currentArch,
      startNight,
      endNight: startNight + nights - 1,
      nights,
    });

    return groups;
  }, [nightSelections]);

  // 실시간 숙소 예산 연산
  const { totalCostKrw, perPersonCostKrw, averageNightlyRateKrw } = useMemo(() => {
    let totalRoomCostForStay = 0;
    nightSelections.forEach((archId) => {
      const price = getStayArchetypePrice(city, archId);
      totalRoomCostForStay += price * roomCount;
    });

    const perPerson = Math.round(totalRoomCostForStay / adultCount);
    const avgNightly = Math.round(totalRoomCostForStay / (cityNights || 1));

    return {
      totalCostKrw: totalRoomCostForStay,
      perPersonCostKrw: perPerson,
      averageNightlyRateKrw: avgNightly,
    };
  }, [nightSelections, city, roomCount, adultCount, cityNights]);

  // 숙소 변경 빈도 체크 (매 박마다 숙소가 바뀌는지)
  const isHighMoveFrequency = groupedSummary.length >= 3 && groupedSummary.length === cityNights;

  // 적용 핸들러: 그룹핑된 세그먼트를 SplitStaySegment[]로 변환하여 부모에 전달
  const handleApply = () => {
    const segments: SplitStaySegment[] = groupedSummary.map((grp, idx) => {
      const arch = STAY_ARCHETYPES.find((a) => a.id === grp.archId);
      const nightlyPrice = getStayArchetypePrice(city, grp.archId);
      return {
        segmentId: `seg_${idx + 1}`,
        basketId: grp.archId as BudgetBasketId,
        nights: grp.nights,
        nightlyPriceKrw: nightlyPrice,
        placeNameKo: arch?.titleKo || "호텔",
        placeNameEn: arch?.titleEn || "Hotel",
      };
    });

    onApply(segments);
    onClose();
  };

  // 모달 닫기 시 ESC 키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 모달 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-amber-50/40 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#e25c5c]/10 text-[#e25c5c] text-[11px] font-black tracking-tight">
                {locale === "ko" ? "스마트 분할 플래너" : "Smart Split Planner"}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {cityName} {locale === "ko" ? "박수별 숙소 나누기" : "Split Stay by Night"}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {locale === "ko"
                ? `총 ${cityNights}박의 여정을 박차(Night)별로 원하는 숙소 스타일에 자유롭게 배정하세요.`
                : `Assign your preferred stay style for each night of your ${cityNights}-night stay.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-sm font-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 2. 모달 바디 (스크롤 영역) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 퀵 프리셋 바 (Quick Presets) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                <span>⚡</span>
                <span>{locale === "ko" ? "원클릭 빠른 조합 추천" : "Quick Presets"}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {locale === "ko" ? "클릭 한 번으로 자동 배정" : "One-click auto assignment"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={applyHocanceLastPreset}
                className="px-3 py-2 rounded-xl text-left bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/80 transition-all cursor-pointer group"
              >
                <div className="text-xs font-black text-[#e25c5c] group-hover:translate-x-0.5 transition-transform">
                  💎 {locale === "ko" ? "마지막 날 호캉스" : "Luxury Finale"}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {locale === "ko" ? `호텔 + 마지막 1박 럭셔리` : `Hotel + 1N 5-Star`}
                </div>
              </button>

              <button
                type="button"
                onClick={applyHalfAndHalfPreset}
                className="px-3 py-2 rounded-xl text-left bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 transition-all cursor-pointer group"
              >
                <div className="text-xs font-black text-amber-700 group-hover:translate-x-0.5 transition-transform">
                  ⚖️ {locale === "ko" ? "반반 균등 분할" : "50:50 Balanced"}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {locale === "ko" ? `호텔 + 한옥·부티크` : `Hotel + Hanok`}
                </div>
              </button>

              <button
                type="button"
                onClick={applyBackpackerPreset}
                className="col-span-2 sm:col-span-1 px-3 py-2 rounded-xl text-left bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 transition-all cursor-pointer group"
              >
                <div className="text-xs font-black text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  🎒 {locale === "ko" ? "가성비 실속 + 감성" : "Budget & Hanok"}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {locale === "ko" ? `게스트하우스 + 한옥` : `Guesthouse + Hanok`}
                </div>
              </button>
            </div>
          </div>

          {/* 박수별 선택 슬롯 타임라인 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">
                {locale === "ko" ? `박차별 숙소 선택 (${cityNights}박)` : `Night-by-Night Assignment (${cityNights} Nights)`}
              </span>
              <span className="text-[11px] text-slate-400">
                {locale === "ko" ? "원하는 카드를 눌러 변경하세요" : "Click archetype to assign"}
              </span>
            </div>

            <div className="space-y-2.5">
              {Array.from({ length: cityNights }, (_, i) => {
                const currentArchId = nightSelections[i] || "BUSINESS_HOTEL";
                const nightNum = i + 1;

                return (
                  <div
                    key={`night_slot_${i}`}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    {/* 박수 라벨 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-2xs">
                        {nightNum}
                      </span>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">
                          {locale === "ko" ? `${nightNum}박차 (Night ${nightNum})` : `Night ${nightNum}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {locale === "ko"
                            ? `${cityName} 체류 ${nightNum}일차 밤`
                            : `Day ${nightNum} stay in ${cityName}`}
                        </span>
                      </div>
                    </div>

                    {/* 4개 아키타입 선택 칩 그리드 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 max-w-xl">
                      {STAY_ARCHETYPES.map((arch) => {
                        const isSelected = currentArchId === arch.id;
                        const price = getStayArchetypePrice(city, arch.id);

                        return (
                          <button
                            key={arch.id}
                            type="button"
                            onClick={() => handleSelectNight(i, arch.id)}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#fff7f7] border-[#e25c5c] text-[#e25c5c] ring-1 ring-[#e25c5c] shadow-2xs font-black"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[11px] truncate block leading-tight">
                              {locale === "ko" ? arch.titleKo : arch.titleEn}
                            </span>
                            <span
                              className={`text-[10px] font-bold mt-1 block ${
                                isSelected ? "text-[#e25c5c]" : "text-slate-400"
                              }`}
                            >
                              {formatPriceByLocale(price, locale, usdRate)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 스마트 그룹핑 요약 & 여행 팁 배너 */}
          <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              <span>📋</span>
              <span>{locale === "ko" ? "분할 구성 요약 (자동 그룹핑)" : "Smart Grouping Summary"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {groupedSummary.map((grp, idx) => {
                const arch = STAY_ARCHETYPES.find((a) => a.id === grp.archId);
                const title = locale === "ko" ? arch?.titleKo : arch?.titleEn;
                const nightLabel =
                  grp.nights === 1
                    ? `${grp.startNight}박차`
                    : `${grp.startNight}~${grp.endNight}박차 (${grp.nights}박)`;

                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-400 font-bold">+</span>}
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                      <strong className="text-[#e25c5c] font-black mr-1">{nightLabel}</strong>
                      <span>{title}</span>
                    </span>
                  </React.Fragment>
                );
              })}
            </div>

            {/* 체크인 이동 빈도 알림 */}
            {isHighMoveFrequency && (
              <p className="text-[11px] text-amber-700 bg-amber-50/80 p-2 rounded-xl border border-amber-200/80 mt-2 flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  {locale === "ko"
                    ? "매일 숙소가 바뀌면 체크인·체크아웃 및 짐 이동 일정이 늘어날 수 있습니다."
                    : "Changing hotels every night may increase check-in/out travel time."}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* 3. 모달 푸터: 실시간 예산 연산 & 액션 버튼 */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-slate-500">
                {locale === "ko" ? `총 숙박비 (${cityNights}박):` : `Total Stay (${cityNights}N):`}
              </span>
              <span className="text-lg sm:text-xl font-black text-[#e25c5c] tracking-tight">
                {formatPriceByLocale(totalCostKrw, locale, usdRate)}
              </span>
              <span className="text-xs text-slate-400">
                ({locale === "ko" ? "1박 평균" : "Avg"}{" "}
                {formatPriceByLocale(averageNightlyRateKrw, locale, usdRate)})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {locale === "ko"
                ? `1인 실제 부담액: ${formatPriceByLocale(perPersonCostKrw, locale, usdRate)} (${roomCount}개 객실 기준)`
                : `Per person: ${formatPriceByLocale(perPersonCostKrw, locale, usdRate)} (${roomCount} room)`}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                onResetSplit();
                onClose();
              }}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-black transition-colors cursor-pointer"
            >
              {locale === "ko" ? "분할 해제" : "Cancel Split"}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e25c5c] to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {locale === "ko" ? "✓ 이 구성으로 분할 적용" : "✓ Apply Split Stay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function createInitialNightSelections(
  cityNights: number,
  initialSegments?: SplitStaySegment[] | null,
  defaultArchetypeId?: StayArchetypeId | null
): StayArchetypeId[] {
  const defaultArch = defaultArchetypeId || "BUSINESS_HOTEL";

  if (initialSegments && initialSegments.length > 0) {
    const arr: StayArchetypeId[] = [];
    initialSegments.forEach((seg) => {
      const bId = (seg.basketId as StayArchetypeId) || defaultArch;
      const count = seg.nights || 1;
      for (let i = 0; i < count; i++) {
        arr.push(bId);
      }
    });

    // 만약 cityNights와 길이가 다를 경우 보정
    while (arr.length < cityNights) {
      arr.push(defaultArch);
    }
    return arr.slice(0, cityNights);
  }

  // 기본값: 2박 이상일 경우 앞 절반 기본 숙소, 뒤 절반 한옥
  const half = Math.max(1, Math.floor(cityNights / 2));
  return Array.from({ length: cityNights }, (_, i) =>
    i < half ? defaultArch : "HANOK_BOUTIQUE"
  );
}
