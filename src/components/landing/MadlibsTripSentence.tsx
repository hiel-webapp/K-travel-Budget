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

  // 모바일 하단 플로팅 바용 컴팩트 모드 (이모티콘 없이 순수 텍스트)
  if (compact) {
    return (
      <div className="w-full text-center text-[13px] sm:text-[14px] leading-relaxed text-neutral-700 font-medium">
        {isKo ? (
          <span className="inline-flex flex-wrap items-center justify-center gap-1">
            <span>나는</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`font-bold transition-all cursor-pointer ${
                activeStep === 2
                  ? "text-teal-700 underline underline-offset-4 decoration-2"
                  : adultsLabel
                  ? "text-neutral-900 hover:underline"
                  : "text-neutral-400 hover:underline"
              }`}
            >
              {adultsLabel ? `(${adultsLabel})` : "(인원 선택)"}
            </button>
            <span>이서</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`font-bold transition-all cursor-pointer ${
                activeStep === 3
                  ? "text-teal-700 underline underline-offset-4 decoration-2"
                  : citiesLabel
                  ? "text-neutral-900 hover:underline"
                  : "text-neutral-400 hover:underline"
              }`}
            >
              {citiesLabel ? `(${citiesLabel})` : "(목적지 선택)"}
            </button>
            <span>(으)로</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`font-bold transition-all cursor-pointer ${
                activeStep === 1
                  ? "text-teal-700 underline underline-offset-4 decoration-2"
                  : nightsLabel
                  ? "text-neutral-900 hover:underline"
                  : "text-neutral-400 hover:underline"
              }`}
            >
              {nightsLabel ? `(${nightsLabel})` : "(기간 선택)"}
            </button>
            <span>여행을 떠날 거예요</span>
          </span>
        ) : (
          <span className="inline-flex flex-wrap items-center justify-center gap-1">
            <span>Planning a</span>
            <button
              type="button"
              onClick={() => onStepClick(1)}
              className={`font-bold transition-all cursor-pointer ${
                activeStep === 1
                  ? "text-teal-700 underline underline-offset-4 decoration-2"
                  : nightsLabel
                  ? "text-neutral-900 hover:underline"
                  : "text-neutral-400 hover:underline"
              }`}
            >
              {nightsLabel ? `(${nightsLabel})` : "(Duration)"}
            </button>
            <span>trip to</span>
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className={`font-bold transition-all cursor-pointer ${
                activeStep === 3
                  ? "text-teal-700 underline underline-offset-4 decoration-2"
                  : citiesLabel
                  ? "text-neutral-900 hover:underline"
                  : "text-neutral-400 hover:underline"
              }`}
            >
              {citiesLabel ? `(${citiesLabel})` : "(Destinations)"}
            </button>
            <span>, Korea with</span>
            <button
              type="button"
              onClick={() => onStepClick(2)}
              className={`font-bold transition-all cursor-pointer ${
                activeStep === 2
                  ? "text-teal-700 underline underline-offset-4 decoration-2"
                  : adultsLabel
                  ? "text-neutral-900 hover:underline"
                  : "text-neutral-400 hover:underline"
              }`}
            >
              {adultsLabel ? `(${adultsLabel})` : "(Travelers)"}
            </button>
          </span>
        )}
      </div>
    );
  }

  // 메인 상단: 박스 디자인/이모티콘 없이 순수 텍스트 중심의 정갈한 2줄 배열 (가운데 정렬)
  return (
    <div className="w-full py-2 sm:py-3 mb-6 transition-all text-center">
      <div className="text-[20px] sm:text-[24px] md:text-[28px] leading-[1.6] sm:leading-[1.5] text-neutral-900 font-extrabold tracking-[-0.01em] space-y-1.5 sm:space-y-2 text-center">
        {isKo ? (
          <>
            {/* 1번째 줄: 나는 (N명) 이서 (목적지) (으)로 */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>나는</span>
              <button
                type="button"
                onClick={() => onStepClick(2)}
                className={`transition-all duration-150 cursor-pointer ${
                  activeStep === 2
                    ? "text-teal-700 underline underline-offset-8 decoration-teal-600 decoration-3"
                    : adultsLabel
                    ? "text-neutral-900 hover:text-teal-700 hover:underline underline-offset-8"
                    : "text-neutral-400 hover:text-neutral-600 hover:underline underline-offset-8"
                }`}
              >
                {adultsLabel ? `(${adultsLabel})` : "(인원 선택)"}
              </button>
              <span>이서</span>
              <button
                type="button"
                onClick={() => onStepClick(3)}
                className={`transition-all duration-150 cursor-pointer ${
                  activeStep === 3
                    ? "text-teal-700 underline underline-offset-8 decoration-teal-600 decoration-3"
                    : citiesLabel
                    ? "text-neutral-900 hover:text-teal-700 hover:underline underline-offset-8"
                    : "text-neutral-400 hover:text-neutral-600 hover:underline underline-offset-8"
                }`}
              >
                {citiesLabel ? `(${citiesLabel})` : "(목적지 선택)"}
              </button>
              <span>(으)로</span>
            </div>

            {/* 2번째 줄: (기간) 동안 한국 여행을 떠날 거예요! */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <button
                type="button"
                onClick={() => onStepClick(1)}
                className={`transition-all duration-150 cursor-pointer ${
                  activeStep === 1
                    ? "text-teal-700 underline underline-offset-8 decoration-teal-600 decoration-3"
                    : nightsLabel
                    ? "text-neutral-900 hover:text-teal-700 hover:underline underline-offset-8"
                    : "text-neutral-400 hover:text-neutral-600 hover:underline underline-offset-8"
                }`}
              >
                {nightsLabel ? `(${nightsLabel})` : "(기간 선택)"}
              </button>
              <span>동안 한국 여행을 떠날 거예요!</span>
            </div>
          </>
        ) : (
          <>
            {/* 1번째 줄: I am planning a (duration) trip to (Destinations), Korea */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>I am planning a</span>
              <button
                type="button"
                onClick={() => onStepClick(1)}
                className={`transition-all duration-150 cursor-pointer ${
                  activeStep === 1
                    ? "text-teal-700 underline underline-offset-8 decoration-teal-600 decoration-3"
                    : nightsLabel
                    ? "text-neutral-900 hover:text-teal-700 hover:underline underline-offset-8"
                    : "text-neutral-400 hover:text-neutral-600 hover:underline underline-offset-8"
                }`}
              >
                {nightsLabel ? `(${nightsLabel})` : "(Duration)"}
              </button>
              <span>trip to</span>
              <button
                type="button"
                onClick={() => onStepClick(3)}
                className={`transition-all duration-150 cursor-pointer ${
                  activeStep === 3
                    ? "text-teal-700 underline underline-offset-8 decoration-teal-600 decoration-3"
                    : citiesLabel
                    ? "text-neutral-900 hover:text-teal-700 hover:underline underline-offset-8"
                    : "text-neutral-400 hover:text-neutral-600 hover:underline underline-offset-8"
                }`}
              >
                {citiesLabel ? `(${citiesLabel})` : "(Destinations)"}
              </button>
              <span>, Korea</span>
            </div>

            {/* 2번째 줄: with (Travelers) ! */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>with</span>
              <button
                type="button"
                onClick={() => onStepClick(2)}
                className={`transition-all duration-150 cursor-pointer ${
                  activeStep === 2
                    ? "text-teal-700 underline underline-offset-8 decoration-teal-600 decoration-3"
                    : adultsLabel
                    ? "text-neutral-900 hover:text-teal-700 hover:underline underline-offset-8"
                    : "text-neutral-400 hover:text-neutral-600 hover:underline underline-offset-8"
                }`}
              >
                {adultsLabel ? `(${adultsLabel})` : "(Travelers)"}
              </button>
              <span>!</span>
            </div>
          </>
        )}
      </div>

      {!isAllFilled && (
        <div className="mt-2.5 text-xs sm:text-[13px] text-neutral-500 font-normal text-center">
          {isKo
            ? "아래 1~3단계를 선택하여 나만의 여행 문장을 완성해 보세요!"
            : "Select Steps 1~3 below to complete your travel statement!"}
        </div>
      )}
    </div>
  );
}
