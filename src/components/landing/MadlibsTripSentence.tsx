"use client";

import React from "react";
import { TripDraft, SupportedCity, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import type { Locale } from "src/lib/i18n/locales";

interface MadlibsTripSentenceProps {
  draft: TripDraft;
  locale: Locale;
  activeStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
  compact?: boolean;
}

export default function MadlibsTripSentence({
  draft,
  locale,
  activeStep,
  onStepClick,
  compact = false,
}: MadlibsTripSentenceProps) {
  const isKo = locale === "ko";

  // 1단계: 기간 슬롯
  const nights = draft.totalNights;
  const nightsLabel =
    nights !== null && nights > 0
      ? isKo
        ? `${nights}박 ${nights + 1}일`
        : `${nights} Nights (${nights + 1} Days)`
      : null;

  // 2단계: 인원 슬롯
  const adults = draft.adultCount;
  const adultsLabel =
    adults !== null && adults > 0
      ? isKo
        ? `${adults}명`
        : `${adults} ${adults === 1 ? "Person" : "People"}`
      : null;

  // 3단계: 목적지 슬롯
  const cities = draft.selectedCities;
  const citiesLabel =
    cities && cities.length > 0
      ? cities
          .map((c: SupportedCity) => (isKo ? CITY_KOREAN_NAMES[c] || c : CITY_ENGLISH_NAMES[c] || c))
          .join(" · ")
      : null;

  const isAllFilled = nights !== null && adults !== null && cities.length > 0;

  if (compact) {
    return (
      <div className="w-full text-center text-[13.5px] sm:text-[14px] leading-relaxed text-neutral-700 font-medium">
        {isKo ? (
          <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
            <span>나는</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                adultsLabel
                  ? "bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100"
                  : "bg-amber-50 text-amber-800 border border-dashed border-amber-300 animate-pulse"
              }`}
            >
              {adultsLabel ? `👥 ${adultsLabel}` : "[ 인원 선택 ]"}
            </button>
            <span>이서</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                citiesLabel
                  ? "bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100"
                  : "bg-amber-50 text-amber-800 border border-dashed border-amber-300 animate-pulse"
              }`}
            >
              {citiesLabel ? `📍 ${citiesLabel}` : "[ 목적지 선택 ]"}
            </button>
            <span>(으)로</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                nightsLabel
                  ? "bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100"
                  : "bg-amber-50 text-amber-800 border border-dashed border-amber-300 animate-pulse"
              }`}
            >
              {nightsLabel ? `🗓️ ${nightsLabel}` : "[ 기간 선택 ]"}
            </button>
            <span>여행을 떠날 거예요</span>
          </span>
        ) : (
          <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
            <span>Planning a</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                nightsLabel
                  ? "bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100"
                  : "bg-amber-50 text-amber-800 border border-dashed border-amber-300 animate-pulse"
              }`}
            >
              {nightsLabel ? `🗓️ ${nightsLabel}` : "[ Duration ]"}
            </button>
            <span>trip to</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                citiesLabel
                  ? "bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100"
                  : "bg-amber-50 text-amber-800 border border-dashed border-amber-300 animate-pulse"
              }`}
            >
              {citiesLabel ? `📍 ${citiesLabel}` : "[ Destinations ]"}
            </button>
            <span>for</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                adultsLabel
                  ? "bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100"
                  : "bg-amber-50 text-amber-800 border border-dashed border-amber-300 animate-pulse"
              }`}
            >
              {adultsLabel ? `👥 ${adultsLabel}` : "[ Travelers ]"}
            </button>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-teal-50/40 via-white to-white border border-teal-100/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 shadow-xs mb-7 transition-all">
      <div className="text-[18px] sm:text-[22px] md:text-[26px] leading-[1.6] sm:leading-[1.5] text-neutral-900 font-bold flex flex-wrap items-center gap-x-2.5 gap-y-2.5">
        {isKo ? (
          <>
            <span>나는</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[16px] sm:text-[19px] md:text-[20px] font-black transition-all duration-200 cursor-pointer ${
                adultsLabel
                  ? activeStep === 2
                    ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-50 text-teal-900 border border-teal-300/80 hover:bg-teal-100 hover:scale-[1.01]"
                  : "bg-amber-50 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-100"
              }`}
            >
              <span>{adultsLabel ? `👥 ${adultsLabel}` : "👥 [ 인원 선택 ]"}</span>
              <span className="text-xs opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>이서</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[16px] sm:text-[19px] md:text-[20px] font-black transition-all duration-200 cursor-pointer ${
                citiesLabel
                  ? activeStep === 3
                    ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-50 text-teal-900 border border-teal-300/80 hover:bg-teal-100 hover:scale-[1.01]"
                  : "bg-amber-50 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-100"
              }`}
            >
              <span>{citiesLabel ? `📍 ${citiesLabel}` : "📍 [ 목적지 선택 ]"}</span>
              <span className="text-xs opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>(으)로</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[16px] sm:text-[19px] md:text-[20px] font-black transition-all duration-200 cursor-pointer ${
                nightsLabel
                  ? activeStep === 1
                    ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-50 text-teal-900 border border-teal-300/80 hover:bg-teal-100 hover:scale-[1.01]"
                  : "bg-amber-50 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-100"
              }`}
            >
              <span>{nightsLabel ? `🗓️ ${nightsLabel}` : "🗓️ [ 기간 선택 ]"}</span>
              <span className="text-xs opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>동안 한국 여행을 떠날 거예요!</span>
          </>
        ) : (
          <>
            <span>I am planning a</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[16px] sm:text-[19px] md:text-[20px] font-black transition-all duration-200 cursor-pointer ${
                nightsLabel
                  ? activeStep === 1
                    ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-50 text-teal-900 border border-teal-300/80 hover:bg-teal-100 hover:scale-[1.01]"
                  : "bg-amber-50 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-100"
              }`}
            >
              <span>{nightsLabel ? `🗓️ ${nightsLabel}` : "🗓️ [ Duration ]"}</span>
              <span className="text-xs opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>trip to</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[16px] sm:text-[19px] md:text-[20px] font-black transition-all duration-200 cursor-pointer ${
                citiesLabel
                  ? activeStep === 3
                    ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-50 text-teal-900 border border-teal-300/80 hover:bg-teal-100 hover:scale-[1.01]"
                  : "bg-amber-50 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-100"
              }`}
            >
              <span>{citiesLabel ? `📍 ${citiesLabel}` : "📍 [ Destinations ]"}</span>
              <span className="text-xs opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>with</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[16px] sm:text-[19px] md:text-[20px] font-black transition-all duration-200 cursor-pointer ${
                adultsLabel
                  ? activeStep === 2
                    ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-50 text-teal-900 border border-teal-300/80 hover:bg-teal-100 hover:scale-[1.01]"
                  : "bg-amber-50 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-100"
              }`}
            >
              <span>{adultsLabel ? `👥 ${adultsLabel}` : "👥 [ Travelers ]"}</span>
              <span className="text-xs opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>!</span>
          </>
        )}
      </div>

      {!isAllFilled && (
        <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-[13px] text-amber-800 font-medium bg-amber-50/90 py-2 px-3.5 rounded-xl border border-amber-200/70">
          <span>💡</span>
          <span>
            {isKo
              ? "아래 1~3단계를 선택하여 나만의 여행 문장을 완성해 보세요!"
              : "Select Steps 1~3 below to complete your travel statement!"}
          </span>
        </div>
      )}
    </div>
  );
}
