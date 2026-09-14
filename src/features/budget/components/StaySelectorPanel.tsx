"use client";

import React, { useState } from "react";
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
  selectedArchetypeId: StayArchetypeId;
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
  const [addedNotice, setAddedNotice] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customNameInput, setCustomNameInput] = useState("");
  const [customPriceInput, setCustomPriceInput] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const cityName = locale === "ko"
    ? CITY_KOREAN_NAMES[city] || city
    : CITY_ENGLISH_NAMES[city] || city;

  const currentArchetype = STAY_ARCHETYPES.find((a) => a.id === selectedArchetypeId) || STAY_ARCHETYPES[1];
  
  // 직접 입력한 숙소가 있으면 해당 단가 우선 적용, 없으면 아키타입 카탈로그 단가 적용
  const isCustomActive = !!customStayOverride;
  const nightlyRoomPrice = isCustomActive
    ? customStayOverride.nightlyPriceKrw
    : getStayArchetypePrice(city, currentArchetype.id);

  // 안 1 로직:
  // 1인 여행자: 방 1개 = 1인 부담 100%
  // 2인 이상 여행자:
  // - SHARED_PAIR (기본): 2인 1실 (총 객실비 = 1개 방 * 박수, 1인당 부담 = 1/2)
  // - SOLO: 1인 1실 (총 객실비 = adultCount개 방 * 박수, 1인당 부담 = 방 1개 전액)
  const isSoloTraveler = adultCount <= 1;
  const isPairSplit = !isSoloTraveler && occupancyMode === "SHARED_PAIR";

  // 여행 전체 숙박비 (총 결제액)
  const roomCount = isSoloTraveler ? 1 : isPairSplit ? Math.ceil(adultCount / 2) : adultCount;
  const totalStayCostKrw = nightlyRoomPrice * roomCount * cityNights;
  const perPersonStayCostKrw = Math.round(totalStayCostKrw / adultCount);

  // USD 환율 (1 USD ≈ ₩1,350 기준 정수 환산)
  const totalStayCostUsd = Math.round(totalStayCostKrw / 1350);
  const perPersonStayCostUsd = Math.round(perPersonStayCostKrw / 1350);

  const handleAddToReceiptClick = () => {
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleOpenCustomModal = () => {
    if (customStayOverride) {
      setCustomNameInput(customStayOverride.placeName);
      setCustomPriceInput(String(customStayOverride.nightlyPriceKrw));
    } else {
      setCustomNameInput("");
      setCustomPriceInput("");
    }
    setModalError(null);
    setIsCustomModalOpen(true);
  };

  const handleApplyCustomStay = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = customNameInput.trim();
    const parsedPrice = parseInt(customPriceInput.replace(/[^0-9]/g, ""), 10);

    if (!trimmedName) {
      setModalError(locale === "ko" ? "숙소 이름을 입력해 주세요." : "Please enter the accommodation name.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setModalError(locale === "ko" ? "올바른 1박 객실 요금을 입력해 주세요." : "Please enter a valid nightly rate.");
      return;
    }

    onSaveCustomStay?.(city, trimmedName, parsedPrice);
    setIsCustomModalOpen(false);
  };

  const otaUrl = generateStayOtaUrl(currentArchetype.id, city);

  return (
    <div className="space-y-6">
      {/* 1. Header & Reset Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
              <span>🏨</span>
              <span>
                {cityName} {dict.planner?.stayPlannerTitle?.replace("🏨 ", "") || (locale === "ko" ? "숙소 플래너" : "Stay Planner")}
              </span>
            </h4>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-[#e25c5c] border border-rose-200/80">
              <span>🗓️</span>
              <span>{cityNights === 0 ? (locale === "ko" ? "당일치기" : "Day trip") : (locale === "ko" ? `${cityNights}박 체류 기준` : `${cityNights} Nights`)}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {dict.planner?.stayPlannerSubtitle || (locale === "ko"
              ? "외국인 여행자 맞춤 4대 숙소 스타일과 객실 이용 방식을 설정하세요."
              : "Choose your stay archetype and room sharing preferences.")}
          </p>
        </div>
        {onResetToRecommended && (
          <button
            type="button"
            onClick={() => onResetToRecommended(city)}
            disabled={!hasCustomOverride}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              hasCustomOverride
                ? "text-[#e25c5c] border-[#fce8e8] bg-[#faf5f5] hover:bg-[#fdeeed]"
                : "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
            }`}
          >
            {dict.planner?.resetToRecommended || (locale === "ko" ? "추천 숙소로 초기화" : "Reset")}
          </button>
        )}
      </div>

      {/* Custom Stay Active Notice Banner */}
      {isCustomActive && customStayOverride && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs flex items-center justify-between font-bold text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🏷️</span>
            <span className="truncate">
              {locale === "ko"
                ? `확정 숙소 적용 중: ${customStayOverride.placeName} (${formatKrw(customStayOverride.nightlyPriceKrw)}/박)`
                : `Custom Stay Active: ${customStayOverride.placeName} (${formatKrw(customStayOverride.nightlyPriceKrw)}/night)`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleOpenCustomModal}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              {locale === "ko" ? "금액 수정" : "Edit"}
            </button>
            <span className="text-amber-300">|</span>
            <button
              type="button"
              onClick={() => onResetCustomStay?.(city)}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
            >
              {locale === "ko" ? "티어 평균가로 복귀" : "Reset to Tier"}
            </button>
          </div>
        </div>
      )}

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
            const isSelected = !isCustomActive && archetype.id === selectedArchetypeId;
            const price = getStayArchetypePrice(city, archetype.id);
            const title = locale === "ko" ? archetype.titleKo : archetype.titleEn;
            const desc = locale === "ko" ? archetype.descKo : archetype.descEn;
            const badge = locale === "ko" ? archetype.badgeKo : archetype.badgeEn;

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
                  {badge && (
                    <div className="absolute bottom-1.5 left-1.5 z-10">
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-black/65 text-white backdrop-blur-xs">
                        {badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Content & Pricing */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{archetype.icon}</span>
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
      </div>

      {/* 3. Step 2: Room Occupancy Option (안 1: 인원수 자동 감지) */}
      {!isSoloTraveler ? (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">👥</span>
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
              <span className="text-base mt-0.5">🛏️</span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black ${isPairSplit ? "text-[#e25c5c]" : "text-slate-800"}`}>
                    {adultCount === 2
                      ? (locale === "ko" ? "2인 1실 (추천: 비용 1/2 분할 계산)" : "Share 1 Room (Split 1/2)")
                      : (locale === "ko" ? `2인 1실 기준 쉐어 (${adultCount}명 분할 계산)` : `Share Rooms (Split across ${adultCount})`)}
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
                        ? `방 1개를 둘이서 같이 쓰고 1인당 숙박비를 절반(50%)만 계산합니다.`
                        : `1 room shared by 2 travelers. Each pays half the room rate.`)
                    : (locale === "ko"
                        ? `총 ${roomCount}개 방을 나누어 쓰고 전체 숙박비를 ${adultCount}명이 균등 분할합니다.`
                        : `${roomCount} rooms shared. Total stay budget split evenly across ${adultCount} travelers.`)}
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
              <span className="text-base mt-0.5">🚪</span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black ${!isPairSplit ? "text-[#e25c5c]" : "text-slate-800"}`}>
                    {adultCount === 2
                      ? (locale === "ko" ? "1인 1실 (각자 방 사용: 전액 부담)" : "Separate Rooms (1 Room Each)")
                      : (locale === "ko" ? `전원 1인 1실 (${adultCount}개 객실)` : `1 Room Per Traveler (${adultCount} Rooms)`)}
                  </span>
                  {!isPairSplit && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#e25c5c] text-white font-black">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {locale === "ko"
                    ? `각자 독립된 방(${adultCount}개)을 사용하여 1인당 객실 1개 요금 전액을 부담합니다.`
                    : `Each traveler reserves their own private room for full privacy.`}
                </p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span>{locale === "ko" ? "1인 나홀로 여행: 1인 1실 단독 투숙이 자동 적용 중입니다." : "Solo Traveler: 1 private room rate automatically applied."}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500">방 1개</span>
        </div>
      )}

      {/* 4. Bottom Live Cost Summary & Action Buttons */}
      <div className="p-4.5 rounded-2xl bg-[#faf9f8] border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/70 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-bold">
                {isCustomActive
                  ? (locale === "ko" ? "확정 1박 비용" : "Booked Nightly Rate")
                  : (dict.planner?.stayEstimatedNightly || (locale === "ko" ? "예상 1박 비용" : "Est. Nightly Rate"))}:
              </span>
              <strong className="text-xs font-extrabold text-slate-900">
                {formatKrw(nightlyRoomPrice)}
              </strong>
              <span className="text-[11px] text-slate-400">|</span>
              <span className="text-xs text-slate-500 font-bold">
                {locale === "ko" ? `총 ${cityName} 숙박비 (${cityNights}박):` : `Total ${cityName} Stay (${cityNights} Nts):`}
              </span>
              <strong className="text-sm font-black text-[#e25c5c]">
                {formatKrw(totalStayCostKrw)}
              </strong>
              <span className="text-xs font-bold text-slate-500">
                (${totalStayCostUsd.toLocaleString()} USD)
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              💡 {locale === "ko"
                ? `1인당 부담액: ${formatKrw(perPersonStayCostKrw)} ($${perPersonStayCostUsd.toLocaleString()}) · ${
                    isPairSplit ? "2인 1실 1/2 분할 반영" : "1인 1실 기준"
                  }`
                : `Per traveler: ${formatKrw(perPersonStayCostKrw)} ($${perPersonStayCostUsd.toLocaleString()}) · ${
                    isPairSplit ? "1/2 split applied" : "1 room per traveler"
                  }`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
          {/* Add to Receipt Button */}
          <button
            type="button"
            onClick={handleAddToReceiptClick}
            className="h-10 px-3 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <span>🛍️</span>
            <span>
              {addedNotice
                ? (locale === "ko" ? "✓ 영수증 반영 완료" : "✓ Applied to Receipt")
                : (dict.planner?.stayAddToReceipt || (locale === "ko" ? "영수증에 담기" : "Add to Receipt"))}
            </span>
          </button>

          {/* Custom Stay Input Trigger */}
          <button
            type="button"
            onClick={handleOpenCustomModal}
            className="h-10 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <span>✏️</span>
            <span>{locale === "ko" ? "확정 숙소 직접 입력" : "Enter Booked Stay"}</span>
          </button>

          {/* Deep Link to OTA Button */}
          <a
            href={otaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1 h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
          >
            <span>🔗</span>
            <span>
              {dict.planner?.staySearchOta || (locale === "ko" ? "아고다/에어비앤비에서 이 조건으로 검색" : "Search on Agoda/Airbnb with these filters")}
            </span>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform text-[11px]">↗</span>
          </a>
        </div>
      </div>

      {/* 5. Booked Stay Manual Input Modal */}
      {isCustomModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-stay-modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsCustomModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <h3 id="custom-stay-modal-title" className="text-base font-extrabold text-slate-900">
                    {locale === "ko" ? "확정 숙소 및 실 결제액 입력" : "Enter Booked Stay & Rate"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {locale === "ko"
                    ? `OTA(아고다/에어비앤비 등)에서 예약하신 ${cityName} 숙소명과 1박 객실 요금을 입력하시면 실시간 예산 및 영수증에 즉시 반영됩니다.`
                    : `Enter your booked stay name and nightly rate in ${cityName} to reflect live in your budget and receipt.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label={locale === "ko" ? "닫기" : "Close"}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleApplyCustomStay} className="space-y-4">
              {/* Hotel / Stay Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {locale === "ko" ? "숙소 이름 (호텔/에어비앤비/게스트하우스)" : "Accommodation Name"}
                </label>
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder={
                    locale === "ko"
                      ? "예: 나인트리 프리미어 로카우스 호텔 서울 용산"
                      : "e.g. Nine Tree Premier ROKAUS Hotel"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e25c5c] focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              {/* Nightly Rate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    {locale === "ko" ? "1박 객실 요금 (KRW 원)" : "Nightly Rate (KRW)"}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {locale === "ko" ? "1개 객실 기준 결제액" : "Per room per night"}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
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
                    placeholder="150,000"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e25c5c] focus:border-transparent transition-all"
                  />
                </div>

                {/* Quick Price Suggestion Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">
                    {locale === "ko" ? "빠른 선택:" : "Quick:"}
                  </span>
                  {[50000, 100000, 150000, 200000, 300000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomPriceInput(preset.toLocaleString())}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      ₩{(preset / 10000).toLocaleString()}{locale === "ko" ? "만" : "0k"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Notice */}
              {modalError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-semibold flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {locale === "ko" ? "취소" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>✓</span>
                  <span>{locale === "ko" ? "예산에 즉시 반영" : "Apply to Budget"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
