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
    <div className="w-full bg-gradient-to-r from-teal-50/70 via-white to-slate-50/70 border border-teal-100/90 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 transition-all">
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-teal-100/60">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wider text-teal-800">
            {isKo ? "실시간 여행 완성 문장 (Live Mad-libs Sentence)" : "Live Mad-libs Trip Sentence"}
          </span>
        </div>
        <span className="text-[11px] sm:text-xs text-neutral-400 font-medium hidden sm:inline">
          {isKo ? "각 괄호를 클릭하면 해당 단계를 바로 수정할 수 있어요" : "Click each slot to quickly edit"}
        </span>
      </div>

      <div className="text-[15px] sm:text-[17px] md:text-[18px] leading-relaxed text-neutral-800 font-semibold flex flex-wrap items-center gap-x-2 gap-y-2">
        {isKo ? (
          <>
            <span>나는</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[14px] sm:text-[15px] font-extrabold transition-all duration-200 cursor-pointer ${
                adultsLabel
                  ? activeStep === 2
                    ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-100/80 text-teal-900 border border-teal-300/80 hover:bg-teal-200"
                  : "bg-amber-100/80 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-200"
              }`}
            >
              <span>{adultsLabel ? `👥 ${adultsLabel}` : "👥 [ 인원 선택 ]"}</span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>이서</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[14px] sm:text-[15px] font-extrabold transition-all duration-200 cursor-pointer ${
                citiesLabel
                  ? activeStep === 3
                    ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-100/80 text-teal-900 border border-teal-300/80 hover:bg-teal-200"
                  : "bg-amber-100/80 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-200"
              }`}
            >
              <span>{citiesLabel ? `📍 ${citiesLabel}` : "📍 [ 목적지 선택 ]"}</span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>(으)로</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[14px] sm:text-[15px] font-extrabold transition-all duration-200 cursor-pointer ${
                nightsLabel
                  ? activeStep === 1
                    ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-100/80 text-teal-900 border border-teal-300/80 hover:bg-teal-200"
                  : "bg-amber-100/80 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-200"
              }`}
            >
              <span>{nightsLabel ? `🗓️ ${nightsLabel}` : "🗓️ [ 기간 선택 ]"}</span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>동안 한국 여행을 떠날 거예요!</span>
          </>
        ) : (
          <>
            <span>I am planning a</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[14px] sm:text-[15px] font-extrabold transition-all duration-200 cursor-pointer ${
                nightsLabel
                  ? activeStep === 1
                    ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-100/80 text-teal-900 border border-teal-300/80 hover:bg-teal-200"
                  : "bg-amber-100/80 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-200"
              }`}
            >
              <span>{nightsLabel ? `🗓️ ${nightsLabel}` : "🗓️ [ Duration ]"}</span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>trip to</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[14px] sm:text-[15px] font-extrabold transition-all duration-200 cursor-pointer ${
                citiesLabel
                  ? activeStep === 3
                    ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-100/80 text-teal-900 border border-teal-300/80 hover:bg-teal-200"
                  : "bg-amber-100/80 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-200"
              }`}
            >
              <span>{citiesLabel ? `📍 ${citiesLabel}` : "📍 [ Destinations ]"}</span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>with</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[14px] sm:text-[15px] font-extrabold transition-all duration-200 cursor-pointer ${
                adultsLabel
                  ? activeStep === 2
                    ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/40 scale-[1.02]"
                    : "bg-teal-100/80 text-teal-900 border border-teal-300/80 hover:bg-teal-200"
                  : "bg-amber-100/80 text-amber-900 border-2 border-dashed border-amber-400 animate-pulse hover:bg-amber-200"
              }`}
            >
              <span>{adultsLabel ? `👥 ${adultsLabel}` : "👥 [ Travelers ]"}</span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100">✏️</span>
            </button>
            <span>!</span>
          </>
        )}
      </div>

      {!isAllFilled && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50/90 py-1.5 px-3 rounded-lg border border-amber-200/60">
          <span>💡</span>
          <span>
            {isKo
              ? "점선으로 표시된 빈칸을 클릭하거나 아래 1~3단계를 선택해 나만의 여행 문장을 완성해 보세요!"
              : "Click the dashed boxes or select Steps 1~3 below to complete your trip sentence!"}
          </span>
        </div>
      )}
    </div>
  );
}
