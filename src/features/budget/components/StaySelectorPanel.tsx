"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { SupportedCity, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "../../../lib/trip-domain";
import type { Dictionary } from "../../../lib/i18n/dictionaries/ko";
import { formatKrw } from "../presentation/formatters";
import {
  STAY_ARCHETYPES,
  StayArchetypeId,
  OccupancyMode,
  getStayArchetypePrice,
  generateStayOtaUrl,
  AGODA_CITY_IDS,
} from "../catalog/stay-archetypes";

export interface StaySelectorPanelProps {
  city: SupportedCity;
  locale: "ko" | "en";
  dict: Dictionary;
  adultCount: number;
  cityNights: number;
  totalNights?: number;
  totalAllocatedNights?: number;
  onCityNightsChange?: (city: SupportedCity, delta: number) => void;
  selectedArchetypeId: StayArchetypeId | null;
  onSelectArchetype: (city: SupportedCity, archetypeId: StayArchetypeId) => void;
  occupancyMode: OccupancyMode;
  onSelectOccupancyMode: (city: SupportedCity, mode: OccupancyMode) => void;
  onResetToRecommended?: (city: SupportedCity) => void;
  hasCustomOverride?: boolean;
  customStayOverride?: { placeName: string; nightlyPriceKrw: number } | null;
  onSaveCustomStay?: (city: SupportedCity, placeName: string, nightlyPriceKrw: number) => void;
  onResetCustomStay?: (city: SupportedCity) => void;
}

export const StaySelectorPanel: React.FC<StaySelectorPanelProps> = ({
  city,
  locale,
  dict,
  adultCount,
  cityNights,
  selectedArchetypeId,
  onSelectArchetype,
  occupancyMode,
  onSelectOccupancyMode,
  onResetToRecommended,
  hasCustomOverride = false,
  customStayOverride = null,
  onSaveCustomStay,
  onResetCustomStay,
}) => {
  const [customNameInput, setCustomNameInput] = useState(() => customStayOverride?.placeName || "");
  const [customPriceInput, setCustomPriceInput] = useState(() =>
    customStayOverride ? customStayOverride.nightlyPriceKrw.toLocaleString() : ""
  );
  const [inputError, setInputError] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // 선택된 도시나 커스텀 숙소 정보가 바뀔 때 인풋 동기화
  useEffect(() => {
    if (customStayOverride) {
      setCustomNameInput(customStayOverride.placeName);
      setCustomPriceInput(customStayOverride.nightlyPriceKrw.toLocaleString());
    } else {
      setCustomNameInput("");
      setCustomPriceInput("");
    }
    setInputError(null);
  }, [customStayOverride, city]);

  const cityName = locale === "ko"
    ? CITY_KOREAN_NAMES[city] || city
    : CITY_ENGLISH_NAMES[city] || city;

  const currentArchetype = selectedArchetypeId
    ? STAY_ARCHETYPES.find((a) => a.id === selectedArchetypeId) || null
    : null;
  
  // 직접 입력한 숙소가 있으면 해당 단가 우선 적용, 없으면 아키타입 카탈로그 단가 적용
  const isCustomActive = !!customStayOverride;
  const hasSelection = isCustomActive || !!currentArchetype;
  const nightlyRoomPrice = isCustomActive
    ? customStayOverride.nightlyPriceKrw
    : currentArchetype
    ? getStayArchetypePrice(city, currentArchetype.id)
    : 0;

  // 안 1 로직:
  // 1인 여행자: 방 1개 = 1인 부담 100%
  // 2인 이상 여행자:
  // - SHARED_PAIR (기본): 2인 1실 (총 객실비 = 1개 방 * 박수, 1인당 부담 = 1/2)
  // - SOLO: 1인 1실 (총 객실비 = adultCount개 방 * 박수, 1인당 부담 = 방 1개 전액)
  const isSoloTraveler = adultCount <= 1;
  const isPairSplit = !isSoloTraveler && occupancyMode === "SHARED_PAIR";

  // 여행 전체 숙박비 (총 결제액)
  const sharedRoomCount = Math.ceil(adultCount / 2);
  const roomCount = isSoloTraveler ? 1 : isPairSplit ? sharedRoomCount : adultCount;
  const totalStayCostKrw = nightlyRoomPrice * roomCount * cityNights;
  const perPersonStayCostKrw = Math.round(totalStayCostKrw / adultCount);


  const handleApplyCustomStay = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = customNameInput.trim();
    const parsedPrice = parseInt(customPriceInput.replace(/[^0-9]/g, ""), 10);

    if (!trimmedName) {
      setInputError(locale === "ko" ? "숙소 이름을 입력해 주세요." : "Please enter the accommodation name.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setInputError(locale === "ko" ? "올바른 1박 객실 요금을 입력해 주세요." : "Please enter a valid nightly rate.");
      return;
    }

    setInputError(null);
    onSaveCustomStay?.(city, trimmedName, parsedPrice);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  const handleResetToTier = () => {
    setCustomNameInput("");
    setCustomPriceInput("");
    setInputError(null);
    onResetCustomStay?.(city);
  };

  // 아고다 검색 딥링크 URL 생성 (선택된 아키타입 조건 또는 도시 기본 검색)
  const cityId = AGODA_CITY_IDS[city] || 14690;
  const agodaSearchUrl = currentArchetype
    ? generateStayOtaUrl(currentArchetype.id, city)
    : `https://www.agoda.com/search?city=${cityId}&priceCur=KRW&tag=hypeheritage`;

  return (
    <div className="space-y-6">
      {/* 1. 숙박 바스켓 요약 바 (Top Summary Bar: 음식 탭과 동일한 위계 및 카드 규격) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#0f172a] tracking-tight">
                {cityName} {locale === "ko" ? "숙박 바스켓 플래너" : "Stay Basket Planner"}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {!hasSelection
                ? (locale === "ko"
                    ? "원하는 숙소 스타일을 선택하거나 직접 입력하여 숙박 예산을 확정하세요."
                    : "Select a stay archetype or enter your custom booked stay.")
                : isCustomActive
                ? (locale === "ko"
                    ? `직접 입력 숙소: "${customStayOverride?.placeName}" (1박 ${formatKrw(nightlyRoomPrice)})`
                    : `Custom stay: "${customStayOverride?.placeName}" (${formatKrw(nightlyRoomPrice)}/nt)`)
                : (locale === "ko"
                    ? `선택된 숙소: ${locale === "ko" ? currentArchetype?.titleKo : currentArchetype?.titleEn} (1박 평균 ${formatKrw(nightlyRoomPrice)})`
                    : `Selected: ${currentArchetype?.titleEn} (${formatKrw(nightlyRoomPrice)}/nt)`)}
            </p>
          </div>

          {/* 총 숙박비 표시 (우측 대형 강조) */}
          <div className="text-right flex items-baseline sm:flex-col sm:items-end justify-between gap-1">
            <span className="text-[11px] font-bold text-slate-400">
              {locale === "ko"
                ? `${cityName} 총 숙박비 (${cityNights}박 · ${adultCount}인)`
                : `${cityName} Total Stay (${cityNights} Nts · ${adultCount}p)`}
            </span>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-xl sm:text-2xl font-black text-[#e25c5c] tracking-tight">
                {formatKrw(totalStayCostKrw)}
              </span>
            </div>
          </div>
        </div>

        {/* 하단 세부 정보 바 (1인당 실제 부담액 & 객실 이용 방식 칩) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <span>{locale === "ko" ? "1인당 실제 부담액:" : "Per Traveler:"}</span>
              <strong className="text-slate-900 font-black">
                {formatKrw(perPersonStayCostKrw)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
              {isSoloTraveler
                ? (locale === "ko" ? "1인 1실 단독" : "1 Room")
                : isPairSplit
                ? (locale === "ko" ? `2인 1실 (${sharedRoomCount}개 객실 · 1/2 분할)` : `2-in-1 Room (${sharedRoomCount} rms)`)
                : (locale === "ko" ? `전원 1인 1실 (${adultCount}개 객실)` : `1 Room each (${adultCount} rms)`)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Step 1: 4-Tier Stay Archetype Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
            {dict.planner?.stayStep1Title || (locale === "ko" ? "Step 1. 당신이 원하는 숙소 스타일은?" : "Step 1. Choose your preferred stay style")}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {locale === "ko" ? "도시별 표준 실측 평균가 적용" : "Verified city average rates"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STAY_ARCHETYPES.map((archetype) => {
            const isSelected = !isCustomActive && currentArchetype?.id === archetype.id;
            const price = getStayArchetypePrice(city, archetype.id);
            const title = locale === "ko" ? archetype.titleKo : archetype.titleEn;
            const desc = locale === "ko" ? archetype.descKo : archetype.descEn;

            return (
              <button
                key={archetype.id}
                type="button"
                onClick={() => onSelectArchetype(city, archetype.id)}
                className={`p-3 rounded-2xl border text-left flex flex-row items-stretch gap-3.5 transition-all duration-155 cursor-pointer relative overflow-hidden group focus-visible:outline-2 focus-visible:outline-[#e25c5c] ${
                  isSelected
                    ? "bg-[#fff7f7] border border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
                    : "bg-white border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                {/* Left: Thumbnail Image Container with Badge & Checkmark */}
                <div className="relative w-28 sm:w-32 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <Image
                    src={archetype.imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 112px, 128px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="w-5 h-5 rounded-full bg-[#e25c5c] text-white flex items-center justify-center text-xs font-black shadow-xs">
                        ✓
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Content & Pricing */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h5 className={`text-xs sm:text-[13px] font-black leading-snug ${isSelected ? "text-[#e25c5c]" : "text-slate-900"}`}>
                        {title}
                      </h5>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-baseline justify-between w-full">
                    <span className="text-[10px] font-bold text-slate-400">
                      {locale === "ko" ? "1박 평균" : "Per Night"}
                    </span>
                    <strong className="text-xs sm:text-sm font-black text-[#e25c5c]">
                      {formatKrw(price)}
                    </strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Inline: 숙소 직접 입력 */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-200 ${
            isCustomActive
              ? "bg-[#fffbf0] border-amber-300 shadow-xs ring-1 ring-amber-300"
              : "bg-slate-50/90 border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <div>
                <h5 className="text-xs sm:text-[13px] font-black text-slate-900 flex items-center gap-1.5">
                  <span>{locale === "ko" ? "숙소 직접 입력" : "Direct Stay Input"}</span>
                  {isCustomActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                      {locale === "ko" ? "적용 중" : "Active"}
                    </span>
                  )}
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {locale === "ko"
                    ? "아고다에서 찾아본 숙소 이름과 1박 금액을 직접 입력할 수 있습니다."
                    : "Enter stay name and nightly rate found on Agoda to apply directly to the budget."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              {isCustomActive && onResetCustomStay && (
                <button
                  type="button"
                  onClick={handleResetToTier}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-amber-300 bg-white text-amber-800 hover:bg-amber-100/60 transition-colors cursor-pointer"
                >
                  {locale === "ko" ? "티어 평균가로 복귀" : "Reset to Tier"}
                </button>
              )}
              {/* 아고다에서 검색 버튼 (헤더 우측 배치) */}
              <a
                href={agodaSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer group whitespace-nowrap"
                title={locale === "ko" ? `${cityName} 숙소 아고다에서 검색` : `Search ${cityName} stays on Agoda`}
              >
                <span>{locale === "ko" ? "아고다에서 검색" : "Search on Agoda"}</span>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform text-[11px]">↗</span>
              </a>
            </div>
          </div>

          <form onSubmit={handleApplyCustomStay} className="mt-3.5 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              {/* 숙소 이름 입력 */}
              <div className="sm:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  {locale === "ko" ? "숙소 이름" : "Stay Name"}
                </label>
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder={locale === "ko" ? "직접 입력" : "Enter stay name"}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e25c5c] focus:border-transparent transition-all shadow-2xs"
                />
              </div>

              {/* 1박 요금 입력 */}
              <div className="sm:col-span-4 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    {locale === "ko" ? "1박 요금" : "Nightly Rate"}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {locale === "ko" ? "1객실 기준" : "Per room"}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₩
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customPriceInput}
                    onChange={(e) => {
                      const numOnly = e.target.value.replace(/[^0-9]/g, "");
                      setCustomPriceInput(numOnly ? Number(numOnly).toLocaleString() : "");
                    }}
                    placeholder={locale === "ko" ? "직접 입력" : "Enter rate"}
                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e25c5c] focus:border-transparent transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* 반영 버튼 */}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <span>{appliedNotice ? "✓" : ""}</span>
                  <span>
                    {appliedNotice
                      ? (locale === "ko" ? "완료!" : "Done!")
                      : (locale === "ko" ? "반영" : "Apply")}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Notice */}
            {inputError && (
              <div className="p-2 rounded-lg bg-red-50 text-red-600 text-[11px] font-semibold flex items-center gap-1.5 mt-1.5">
                <span>{inputError}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 3. Step 2: Room Occupancy Option (안 1: 인원수 자동 감지) */}
      {!isSoloTraveler ? (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {locale === "ko" ? "Step 2. 객실 이용 방식을 선택하세요" : "Step 2. Select Room Sharing Preference"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#e25c5c]">
              {locale === "ko" ? `여행 인원 ${adultCount}명 기준` : `${adultCount} Travelers`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option A: SHARED_PAIR (1/2 분할) */}
            <button
              type="button"
              onClick={() => onSelectOccupancyMode(city, "SHARED_PAIR")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                isPairSplit
                  ? "bg-[#fff7f7] border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black ${isPairSplit ? "text-[#e25c5c]" : "text-slate-800"}`}>
                    {locale === "ko"
                      ? `2인 1실 (${sharedRoomCount}개 객실)`
                      : (adultCount === 2 ? "Share 1 Room (Split 1/2)" : `Shared Rooms (${sharedRoomCount} Rooms)`)}
                  </span>
                  {isPairSplit && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#e25c5c] text-white font-black">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {adultCount === 2
                    ? (locale === "ko"
                        ? "방 1개를 함께 사용하고 숙박비를 50%씩 부담합니다."
                        : "1 room shared by 2 travelers (50% cost split).")
                    : (locale === "ko"
                        ? `총 ${sharedRoomCount}개 방을 나누어 쓰고 숙박비를 균등 분할합니다.`
                        : `${sharedRoomCount} rooms shared, budget split evenly across travelers.`)}
                </p>
              </div>
            </button>

            {/* Option B: SOLO (각자 1인 1실) */}
            <button
              type="button"
              onClick={() => onSelectOccupancyMode(city, "SOLO")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                !isPairSplit
                  ? "bg-[#fff7f7] border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black ${!isPairSplit ? "text-[#e25c5c]" : "text-slate-800"}`}>
                    {locale === "ko"
                      ? `1인 1실 (${adultCount}개 객실)`
                      : `Private Rooms (${adultCount} Rooms)`}
                  </span>
                  {!isPairSplit && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#e25c5c] text-white font-black">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {locale === "ko"
                    ? "각자 개인 방을 쓰고 객실 요금 전액을 부담합니다."
                    : "Each traveler reserves a private room and pays full rate."}
                </p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span>{locale === "ko" ? "1인 나홀로 여행: 1인 1실 단독 투숙이 자동 적용 중입니다." : "Solo Traveler: 1 private room rate automatically applied."}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500">방 1개</span>
        </div>
      )}

    </div>
  );
};
