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
  onBatchApplySplit?: (batch: Record<string, SplitStaySegment[]>) => void;
  onBatchResetSplit?: (cities: SupportedCity[]) => void;
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
  onBatchApplySplit,
  onBatchResetSplit,
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

  // 방 개수 및 인원 계산 (2인 이상 기본값은 2인 1실 SHARED_PAIR 100% 보장)
  const isSoloTraveler = adultCount <= 1;
  const effectiveOccupancy = isSoloTraveler ? "SOLO" : (occupancyMode || "SHARED_PAIR");
  const isPairSplit = !isSoloTraveler && effectiveOccupancy === "SHARED_PAIR";
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

  // 1. 현재 선택된 도시 분할 적용
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
    setTimeout(() => setSavedCityNotice(null), 2000);
  };

  // 2. 현재 선택된 도시 분할 해제
  const handleResetCurrentCity = () => {
    onResetSplitForCity(selectedCity);

    // 로컬 상태 즉시 기본 단일 숙소로 리셋
    setCitySelectionsMap((prev) => ({
      ...prev,
      [selectedCity]: Array.from(
        { length: currentNights },
        () => currentCityInfo.defaultArchetypeId || "BUSINESS_HOTEL"
      ),
    }));

    setSavedCityNotice(`RESET_${selectedCity}`);
    setTimeout(() => setSavedCityNotice(null), 2000);
  };

  // 3. 전체 도시 분할 일괄 적용 (2박 이상인 모든 도시)
  const handleApplyAllCities = () => {
    const batchMap: Record<string, SplitStaySegment[]> = {};

    allCities.forEach((cityInfo) => {
      if (cityInfo.cityNights < 2) return;

      const selections =
        citySelectionsMap[cityInfo.city] ||
        createInitialNightSelections(
          cityInfo.cityNights,
          cityInfo.initialSegments,
          cityInfo.defaultArchetypeId
        );

      const grps: { archId: StayArchetypeId; nights: number }[] = [];
      if (selections.length > 0) {
        let curArch = selections[0];
        let cnt = 1;
        for (let i = 1; i < selections.length; i++) {
          if (selections[i] === curArch) {
            cnt += 1;
          } else {
            grps.push({ archId: curArch, nights: cnt });
            curArch = selections[i];
            cnt = 1;
          }
        }
        grps.push({ archId: curArch, nights: cnt });
      }

      const segments: SplitStaySegment[] = grps.map((grp, idx) => {
        const arch = STAY_ARCHETYPES.find((a) => a.id === grp.archId);
        const nightlyPrice = getStayArchetypePrice(cityInfo.city, grp.archId);
        return {
          segmentId: `seg_${idx + 1}`,
          basketId: grp.archId as BudgetBasketId,
          nights: grp.nights,
          nightlyPriceKrw: nightlyPrice,
          placeNameKo: arch?.titleKo || "호텔",
          placeNameEn: arch?.titleEn || "Hotel",
        };
      });

      batchMap[cityInfo.city] = segments;
    });

    if (onBatchApplySplit) {
      onBatchApplySplit(batchMap);
    } else {
      Object.entries(batchMap).forEach(([c, segs]) => {
        onApplyForCity(c as SupportedCity, segs);
      });
    }

    setSavedCityNotice("ALL");
    setTimeout(() => setSavedCityNotice(null), 2500);
  };

  // 4. 전체 도시 분할 일괄 해제
  const handleResetAllCities = () => {
    const eligibleCities = allCities
      .filter((c) => c.cityNights >= 2)
      .map((c) => c.city);

    if (onBatchResetSplit) {
      onBatchResetSplit(eligibleCities);
    } else {
      eligibleCities.forEach((cityCode) => {
        onResetSplitForCity(cityCode);
      });
    }

    const resetMap: Record<string, StayArchetypeId[]> = {};
    allCities.forEach((c) => {
      resetMap[c.city] = Array.from(
        { length: c.cityNights },
        () => c.defaultArchetypeId || "BUSINESS_HOTEL"
      );
    });
    setCitySelectionsMap(resetMap);

    setSavedCityNotice("RESET_ALL");
    setTimeout(() => setSavedCityNotice(null), 2500);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl lg:max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 모달 헤더 (확대 & 강조) */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/60 via-white to-amber-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg bg-[#e25c5c] text-white text-xs sm:text-sm font-black tracking-tight shadow-xs">
              {locale === "ko" ? "숙소 분할" : "Split Stay"}
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {locale === "ko" ? "박수별 숙소 나누기" : "Divide Stay by Night"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-base font-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 2. 도시 탭 바 (시원한 버튼 크기 및 폰트) */}
        {allCities.length > 0 && (
          <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
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
                    className={`px-4 py-2.5 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border shrink-0 ${
                      !canSplit
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                        : isSelected
                        ? "bg-[#e25c5c] border-[#e25c5c] text-white shadow-sm ring-2 ring-rose-200"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                    }`}
                  >
                    <span>{c.cityName}</span>
                    <span className={isSelected ? "text-rose-100 font-extrabold" : "text-slate-400 font-extrabold"}>
                      {c.cityNights}박
                    </span>
                    {!canSplit ? (
                      <span className="text-xs text-slate-400 font-normal">
                        ({locale === "ko" ? "1박 단일" : "1N"})
                      </span>
                    ) : hasExistingSplit ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
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

        {/* 3. 모달 바디: 큼직하고 시원한 박수별 슬롯 */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1">
          {currentNights < 2 ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <p className="text-base font-bold text-slate-700">
                {locale === "ko"
                  ? `${currentCityInfo.cityName}은 1박 체류이므로 숙소 분할이 필요하지 않습니다.`
                  : `${currentCityInfo.cityName} is a 1-night stay. Split stay requires at least 2 nights.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: currentNights }, (_, i) => {
                const currentArchId = currentSelections[i] || "BUSINESS_HOTEL";
                const nightNum = i + 1;

                return (
                  <div
                    key={`night_slot_${i}`}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* 박수 뱃지 및 라벨 (확대) */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm sm:text-base font-black flex items-center justify-center shadow-xs">
                        {nightNum}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-800">
                        {locale === "ko" ? `${nightNum}박차` : `Night ${nightNum}`}
                      </span>
                    </div>

                    {/* 4개 숙소 선택 칩 (크기 & 폰트 확대) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 max-w-2xl">
                      {STAY_ARCHETYPES.map((arch) => {
                        const isSelected = currentArchId === arch.id;
                        const price = getStayArchetypePrice(selectedCity, arch.id);

                        return (
                          <button
                            key={arch.id}
                            type="button"
                            onClick={() => handleSelectNight(i, arch.id)}
                            className={`p-2.5 sm:p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[66px] ${
                              isSelected
                                ? "bg-[#fff7f7] border-[#e25c5c] text-[#e25c5c] ring-2 ring-[#e25c5c] shadow-xs font-black"
                                : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                            }`}
                          >
                            <span className="text-xs sm:text-[13.5px] truncate block leading-snug font-black">
                              {locale === "ko" ? arch.titleKo : arch.titleEn}
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-black mt-1 block tracking-tight ${
                                isSelected ? "text-[#e25c5c]" : "text-slate-500"
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

          {/* 스마트 그룹핑 요약 바 (가독성 향상) */}
          {currentNights >= 2 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-black text-slate-800 shrink-0 mr-1 text-sm sm:text-base">
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
                    {idx > 0 && <span className="text-slate-400 font-black text-sm">+</span>}
                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs">
                      <strong className="text-[#e25c5c] font-black mr-1.5">{nightLabel}</strong>
                      <span>{title}</span>
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. 모달 푸터: 직관적인 2단 액션 바 (가격 요약 / 좌: 해제 그룹 / 우: 적용 & 완료 그룹) */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/95 space-y-3 shrink-0">
          {/* 상단 라인: 가격 요약 및 실시간 저장 알림 뱃지 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-700">
                {currentCityInfo.cityName} {locale === "ko" ? `총 숙박비 (${currentNights}박):` : `Total:`}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#e25c5c] tracking-tight">
                {formatPriceByLocale(totalCostKrw, locale, usdRate)}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-bold ml-1">
                ({locale === "ko" ? "1인당" : "Per person"} {formatPriceByLocale(perPersonCostKrw, locale, usdRate)})
              </span>
            </div>

            {savedCityNotice && (
              <span className="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 animate-in fade-in self-start sm:self-auto flex items-center gap-1 shadow-2xs">
                <span>✓</span>
                <span>
                  {savedCityNotice === "ALL"
                    ? (locale === "ko" ? "전체 도시 분할 적용 완료!" : "All cities applied!")
                    : savedCityNotice === "RESET_ALL"
                    ? (locale === "ko" ? "전체 도시 분할 해제 완료!" : "All cities reset!")
                    : (locale === "ko" ? `${currentCityInfo.cityName} 분할 적용 완료!` : `${currentCityInfo.cityName} applied!`)}
                </span>
              </span>
            )}
          </div>

          {/* 하단 버튼 라인: [좌측: 도시 적용 / 분할 해제] vs [우측: 전체 적용 / 분할 해제 / 완료] */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* 좌측: [도시 적용] [도시 분할 해제] */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleApplyCurrentCity}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#e25c5c] hover:bg-rose-600 active:scale-95 text-white text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>{locale === "ko" ? `${currentCityInfo.cityName} 분할 적용` : `Apply ${currentCityInfo.cityName}`}</span>
              </button>

              <button
                type="button"
                onClick={handleResetCurrentCity}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              >
                {locale === "ko" ? `${currentCityInfo.cityName} 분할 해제` : `Reset ${currentCityInfo.cityName}`}
              </button>
            </div>

            {/* 우측: [전체 분할 적용] [전체 분할 해제] [완료] */}
            <div className="flex items-center gap-2 justify-end flex-wrap">
              {allCities.filter((c) => c.cityNights >= 2).length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleApplyAllCities}
                    className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95 flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>{locale === "ko" ? "전체 분할 적용" : "Apply All"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAllCities}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    {locale === "ko" ? "전체 분할 해제" : "Reset All"}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                {locale === "ko" ? "완료" : "Done"}
              </button>
            </div>
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
