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

export interface CitySplitInfo {
  city: SupportedCity;
  cityName: string;
  cityNights: number;
  initialSegments?: SplitStaySegment[] | null;
  defaultArchetypeId?: StayArchetypeId | null;
}

export interface SplitStayModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCity: SupportedCity;
  allCities?: CitySplitInfo[];
  locale: "ko" | "en";
  adultCount: number;
  occupancyMode: OccupancyMode;
  onApplyForCity: (city: SupportedCity, segments: SplitStaySegment[]) => void;
  onResetSplitForCity: (city: SupportedCity) => void;
}

export const SplitStayModal: React.FC<SplitStayModalProps> = ({
  isOpen,
  onClose,
  activeCity,
  allCities = [],
  locale,
  adultCount,
  occupancyMode,
  onApplyForCity,
  onResetSplitForCity,
}) => {
  const { usdRate } = useExchangeRate();

  // 현재 모달에서 선택/편집 중인 도시
  const [selectedCity, setSelectedCity] = useState<SupportedCity>(activeCity);

  // 모달 오픈 시 활성 도시로 동기화
  useEffect(() => {
    if (isOpen) {
      setSelectedCity(activeCity);
    }
  }, [isOpen, activeCity]);

  // 각 도시별 박차 선택 상태를 통합 관리하는 맵
  const [citySelectionsMap, setCitySelectionsMap] = useState<Record<string, StayArchetypeId[]>>({});
  const [savedCityNotice, setSavedCityNotice] = useState<string | null>(null);

  // 도시 목록 또는 모달 열릴 때 초기화
  useEffect(() => {
    if (!isOpen) return;

    const initialMap: Record<string, StayArchetypeId[]> = {};
    allCities.forEach((c) => {
      initialMap[c.city] = createInitialNightSelections(
        c.cityNights,
        c.initialSegments,
        c.defaultArchetypeId
      );
    });

    setCitySelectionsMap(initialMap);
  }, [isOpen, allCities]);

  // 현재 선택된 도시 정보
  const currentCityInfo = useMemo(() => {
    return (
      allCities.find((c) => c.city === selectedCity) ||
      allCities[0] || {
        city: selectedCity,
        cityName: selectedCity,
        cityNights: 2,
        initialSegments: null,
        defaultArchetypeId: "BUSINESS_HOTEL" as StayArchetypeId,
      }
    );
  }, [allCities, selectedCity]);

  const currentNights = currentCityInfo.cityNights || 1;
  const currentSelections = useMemo(() => {
    const arr = citySelectionsMap[selectedCity];
    if (arr && arr.length === currentNights) return arr;
    return createInitialNightSelections(
      currentNights,
      currentCityInfo.initialSegments,
      currentCityInfo.defaultArchetypeId
    );
  }, [citySelectionsMap, selectedCity, currentNights, currentCityInfo]);

  // 방 개수 및 인원 계산
  const isSoloTraveler = adultCount <= 1;
  const isPairSplit = !isSoloTraveler && occupancyMode === "SHARED_PAIR";
  const sharedRoomCount = Math.ceil(adultCount / 2);
  const roomCount = isSoloTraveler ? 1 : isPairSplit ? sharedRoomCount : adultCount;

  // 특정 박차의 숙소 변경
  const handleSelectNight = (nightIndex: number, archId: StayArchetypeId) => {
    setCitySelectionsMap((prev) => {
      const current = prev[selectedCity] ? [...prev[selectedCity]] : [...currentSelections];
      current[nightIndex] = archId;
      return {
        ...prev,
        [selectedCity]: current,
      };
    });
  };

  // 연속된 동일 숙소를 자동으로 묶어주는 스마트 그룹핑
  const groupedSummary = useMemo(() => {
    if (currentSelections.length === 0) return [];

    const groups: {
      archId: StayArchetypeId;
      startNight: number;
      endNight: number;
      nights: number;
    }[] = [];

    let currentArch = currentSelections[0];
    let startNight = 1;
    let nights = 1;

    for (let i = 1; i < currentSelections.length; i++) {
      if (currentSelections[i] === currentArch) {
        nights += 1;
      } else {
        groups.push({
          archId: currentArch,
          startNight,
          endNight: startNight + nights - 1,
          nights,
        });
        currentArch = currentSelections[i];
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
  }, [currentSelections]);

  // 실시간 숙소 예산 연산
  const { totalCostKrw, perPersonCostKrw } = useMemo(() => {
    let totalRoomCostForStay = 0;
    currentSelections.forEach((archId) => {
      const price = getStayArchetypePrice(selectedCity, archId);
      totalRoomCostForStay += price * roomCount;
    });

    const perPerson = Math.round(totalRoomCostForStay / adultCount);

    return {
      totalCostKrw: totalRoomCostForStay,
      perPersonCostKrw: perPerson,
    };
  }, [currentSelections, selectedCity, roomCount, adultCount]);

  // 적용 핸들러: SplitStaySegment[]로 변환하여 부모에 전달
  const handleApplyCurrentCity = () => {
    const segments: SplitStaySegment[] = groupedSummary.map((grp, idx) => {
      const arch = STAY_ARCHETYPES.find((a) => a.id === grp.archId);
      const nightlyPrice = getStayArchetypePrice(selectedCity, grp.archId);
      return {
        segmentId: `seg_${idx + 1}`,
        basketId: grp.archId as BudgetBasketId,
        nights: grp.nights,
        nightlyPriceKrw: nightlyPrice,
        placeNameKo: arch?.titleKo || "호텔",
        placeNameEn: arch?.titleEn || "Hotel",
      };
    });

    onApplyForCity(selectedCity, segments);
    setSavedCityNotice(selectedCity);
    setTimeout(() => setSavedCityNotice(null), 1800);
  };

  // 모달 닫기 시 ESC 키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 모달 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-amber-50/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#e25c5c] text-white text-[11px] font-black tracking-tight">
              {locale === "ko" ? "숙소 분할" : "Split Stay"}
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {locale === "ko" ? "박수별 숙소 나누기" : "Divide Stay by Night"}
            </h2>
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

        {/* 2. 도시 탭 바 (모달 안에서 전체 도시 원스톱 전환) */}
        {allCities.length > 0 && (
          <div className="px-4 sm:px-6 pt-3.5 pb-1 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {allCities.map((c) => {
                const isSelected = selectedCity === c.city;
                const canSplit = c.cityNights >= 2;
                const hasExistingSplit = Boolean(c.initialSegments && c.initialSegments.length >= 2);

                return (
                  <button
                    key={c.city}
                    type="button"
                    disabled={!canSplit}
                    onClick={() => setSelectedCity(c.city)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border shrink-0 ${
                      !canSplit
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                        : isSelected
                        ? "bg-[#e25c5c] border-[#e25c5c] text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c.cityName}</span>
                    <span className={isSelected ? "text-rose-100 font-bold" : "text-slate-400 font-bold"}>
                      {c.cityNights}박
                    </span>
                    {!canSplit ? (
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({locale === "ko" ? "1박 단일" : "1N"})
                      </span>
                    ) : hasExistingSplit ? (
                      <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${
                        isSelected ? "bg-white text-[#e25c5c]" : "bg-rose-100 text-[#e25c5c]"
                      }`}>
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. 모달 바디: 군더더기 없는 슬림한 박수별 슬롯 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {currentNights < 2 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <p className="text-sm font-bold text-slate-700">
                {locale === "ko"
                  ? `${currentCityInfo.cityName}은 1박 체류이므로 숙소 분할이 필요하지 않습니다.`
                  : `${currentCityInfo.cityName} is a 1-night stay. Split stay requires at least 2 nights.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {Array.from({ length: currentNights }, (_, i) => {
                const currentArchId = currentSelections[i] || "BUSINESS_HOTEL";
                const nightNum = i + 1;

                return (
                  <div
                    key={`night_slot_${i}`}
                    className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    {/* 박수 뱃지 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                        {nightNum}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {locale === "ko" ? `${nightNum}박차` : `Night ${nightNum}`}
                      </span>
                    </div>

                    {/* 4개 숙소 선택 칩 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 max-w-xl">
                      {STAY_ARCHETYPES.map((arch) => {
                        const isSelected = currentArchId === arch.id;
                        const price = getStayArchetypePrice(selectedCity, arch.id);

                        return (
                          <button
                            key={arch.id}
                            type="button"
                            onClick={() => handleSelectNight(i, arch.id)}
                            className={`px-2 py-1.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#fff7f7] border-[#e25c5c] text-[#e25c5c] ring-1 ring-[#e25c5c] shadow-2xs font-black"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[11px] truncate block leading-tight font-bold">
                              {locale === "ko" ? arch.titleKo : arch.titleEn}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold mt-0.5 block ${
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
          )}

          {/* 슬림한 스마트 그룹핑 요약 */}
          {currentNights >= 2 && (
            <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-black text-slate-700 shrink-0 mr-1">
                {locale === "ko" ? "분할 구성:" : "Summary:"}
              </span>
              {groupedSummary.map((grp, idx) => {
                const arch = STAY_ARCHETYPES.find((a) => a.id === grp.archId);
                const title = locale === "ko" ? arch?.titleKo : arch?.titleEn;
                const nightLabel =
                  grp.nights === 1
                    ? `${grp.startNight}박`
                    : `${grp.startNight}~${grp.endNight}박 (${grp.nights}박)`;

                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-400 font-bold">+</span>}
                    <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                      <strong className="text-[#e25c5c] mr-1">{nightLabel}</strong>
                      <span>{title}</span>
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. 모달 푸터: 실시간 예산 & 적용 액션 */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold text-slate-500">
              {currentCityInfo.cityName} {locale === "ko" ? `숙박비 (${currentNights}박):` : `Total:`}
            </span>
            <span className="text-base sm:text-lg font-black text-[#e25c5c] tracking-tight">
              {formatPriceByLocale(totalCostKrw, locale, usdRate)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium ml-1">
              ({locale === "ko" ? "1인" : "Per person"} {formatPriceByLocale(perPersonCostKrw, locale, usdRate)})
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => onResetSplitForCity(selectedCity)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-black transition-colors cursor-pointer"
            >
              {locale === "ko" ? "분할 해제" : "Reset"}
            </button>
            <button
              type="button"
              onClick={handleApplyCurrentCity}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#e25c5c] to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{savedCityNotice === selectedCity ? "✓ 적용 완료!" : `✓ ${currentCityInfo.cityName} 분할 적용`}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-black transition-colors cursor-pointer"
            >
              {locale === "ko" ? "완료" : "Done"}
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

    while (arr.length < cityNights) {
      arr.push(defaultArch);
    }
    return arr.slice(0, cityNights);
  }

  const half = Math.max(1, Math.floor(cityNights / 2));
  return Array.from({ length: cityNights }, (_, i) =>
    i < half ? defaultArch : "HANOK_BOUTIQUE"
  );
}
