"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TripDraft,
  SupportedCity,
  DEFAULT_TRIP_DRAFT,
  EMPTY_TRIP_DRAFT,
  calculateDefaultNightAllocation,
  validateTripDraft,
  getCitiesSentenceLabel,
  CITY_KOREAN_NAMES,
} from "src/lib/trip-domain";
import {
  saveTripDraft,
  saveActiveDraft,
  loadActiveDraft,
  clearActiveDraft,
  savePlannerPreferences,
} from "src/lib/storage-helper";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { Locale } from "src/lib/i18n/locales";

interface LandingFormProps {
  locale: Locale;
  dict: Dictionary;
}

const ALL_CITY_OPTIONS: { key: SupportedCity; nameKo: string; nameEn: string }[] = [
  { key: "SEOUL", nameKo: "서울", nameEn: "Seoul" },
  { key: "BUSAN", nameKo: "부산", nameEn: "Busan" },
  { key: "JEJU", nameKo: "제주", nameEn: "Jeju" },
  { key: "INCHEON", nameKo: "인천", nameEn: "Incheon" },
  { key: "GYEONGJU", nameKo: "경주", nameEn: "Gyeongju" },
  { key: "JEONJU", nameKo: "전주", nameEn: "Jeonju" },
  { key: "GANGNEUNG", nameKo: "강릉", nameEn: "Gangneung" },
  { key: "SUWON", nameKo: "수원", nameEn: "Suwon" },
  { key: "YEOSU", nameKo: "여수", nameEn: "Yeosu" },
  { key: "SOKCHO", nameKo: "속초", nameEn: "Sokcho" },
];

export default function LandingForm({ locale, dict }: LandingFormProps) {
  const router = useRouter();

  const [draft, setDraft] = useState<TripDraft>(DEFAULT_TRIP_DRAFT);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load saved draft safely on client side after hydration
  useEffect(() => {
    const saved = loadActiveDraft();
    if (saved && saved.draft) {
      setDraft(saved.draft);
    }
  }, []);

  const totalNights = draft.totalNights;
  const adultCount = draft.adultCount;

  const isFormComplete =
    totalNights !== null &&
    adultCount !== null &&
    draft.selectedCities.length >= 1;

  // Save draft state on changes
  useEffect(() => {
    saveActiveDraft(draft, 1);
  }, [draft]);

  const handleResetDraft = () => {
    clearActiveDraft();
    setDraft(EMPTY_TRIP_DRAFT);
    setValidationError(null);
  };

  const handleNightsChange = (newNights: number) => {
    const newAllocations = calculateDefaultNightAllocation(draft.selectedCities, newNights);
    setDraft((prev) => ({
      ...prev,
      totalNights: newNights,
      cityNightAllocations: newAllocations,
    }));
  };

  const handleAdultsChange = (newAdults: number) => {
    setDraft((prev) => ({
      ...prev,
      adultCount: newAdults,
    }));
  };

  const toggleCitySelection = (cityCode: SupportedCity) => {
    let nextCities: SupportedCity[];
    if (draft.selectedCities.includes(cityCode)) {
      nextCities = draft.selectedCities.filter((c) => c !== cityCode);
    } else {
      if (draft.selectedCities.length >= 4) return;
      nextCities = [...draft.selectedCities, cityCode];
    }

    const newAllocations = calculateDefaultNightAllocation(nextCities, draft.totalNights);
    setDraft((prev) => ({
      ...prev,
      selectedCities: nextCities,
      cityNightAllocations: newAllocations,
    }));
  };

  const getAllocationSummaryText = () => {
    const parts: string[] = [];

    if (draft.totalNights !== null && draft.totalNights > 0) {
      parts.push(
        locale === "ko"
          ? `${draft.totalNights}박 ${draft.totalNights + 1}일`
          : `${draft.totalNights} Nights (${draft.totalNights + 1} Days)`
      );
    }

    if (draft.adultCount !== null && draft.adultCount > 0) {
      parts.push(
        locale === "ko"
          ? `${draft.adultCount}명`
          : `${draft.adultCount} ${draft.adultCount === 1 ? "Person" : "People"}`
      );
    }

    if (draft.selectedCities && draft.selectedCities.length > 0) {
      if (locale === "ko") {
        const cityNames = draft.selectedCities.map((c) => CITY_KOREAN_NAMES[c] || c);
        parts.push(cityNames.join(" · "));
      } else {
        parts.push(getCitiesSentenceLabel(draft.selectedCities));
      }
    }

    if (parts.length === 0) {
      return locale === "ko"
        ? "💡 3가지 필수 여행 정보(기간, 인원, 목적지)를 선택해 주세요."
        : "💡 Select your trip options (nights, travelers, destinations).";
    }

    return `💡 ${parts.join(" · ")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const draftToSave: TripDraft = {
      ...draft,
      budgetTier: draft.budgetTier || "STANDARD",
    };

    const validation = validateTripDraft(draftToSave);
    if (!validation.success) {
      const firstError = validation.errors[0];
      let errMsg = dict.landing.validation.saveFailed;
      if (firstError === "invalid_nights") errMsg = dict.landing.validation.invalidNights;
      if (firstError === "invalid_adults") errMsg = dict.landing.validation.invalidAdults;
      if (firstError === "invalid_cities_count" || firstError === "invalid_city") errMsg = dict.landing.validation.noCities;

      setValidationError(errMsg);
      return;
    }

    const saved = saveTripDraft(draftToSave);
    if (!saved) {
      setValidationError(dict.landing.validation.saveFailed);
      return;
    }

    savePlannerPreferences({
      draft: draftToSave,
      accommodationByCity: {},
      foodOverrides: {},
      foodAddOnOverrides: {},
      attractionByCity: {},
    });

    router.push(`/${locale}/planner`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto bg-white border border-[#dedede] rounded-[24px] p-5 sm:p-7 md:p-8 shadow-xs">
        {/* validation error */}
        {validationError && (
          <div className="text-xs text-[#ef4444] font-semibold mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center" aria-live="polite">
            ⚠️ {validationError}
          </div>
        )}

        {/* Reset Button */}
        {(totalNights !== null || adultCount !== null || draft.selectedCities.length > 0) && (
          <div className="flex justify-end mb-4 px-1">
            <button
              type="button"
              onClick={handleResetDraft}
              className="text-xs font-semibold text-slate-500 hover:text-[#b93829] flex items-center gap-1 transition-colors cursor-pointer bg-slate-100 hover:bg-red-50 px-3.5 py-1.5 rounded-full border border-slate-200"
            >
              <span>↺</span>
              <span>일정 초기화</span>
            </button>
          </div>
        )}

        {/* 3단계 카드 반응형 그리드 - 항상 표시 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Step 1 Card: 🗓️ 여행 기간 */}
          <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[15px] font-bold text-[#1d1d1f]">🗓️ 1단계: 여행 기간 설정</span>
                <span className="text-xs font-extrabold text-[#b93829]">
                  {totalNights !== null ? `${totalNights}박 (${totalNights + 1}일)` : "미선택"}
                </span>
              </div>
              <div className="grid grid-cols-[36px_1fr_36px] items-center gap-1.5 bg-white p-2.5 rounded-[14px] border border-[#dedede] w-full">
                <button
                  type="button"
                  onClick={() => handleNightsChange(Math.max(1, (totalNights || 5) - 1))}
                  disabled={(totalNights || 1) <= 1}
                  aria-label="Decrease nights"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer justify-self-start"
                >
                  -
                </button>
                <div className="text-center min-w-0 px-0.5 overflow-hidden">
                  <span className="font-extrabold text-[#1d1d1f] text-sm lg:text-[16px] leading-tight block truncate">
                    {totalNights !== null ? `${totalNights} Nights` : "기간 선택"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNightsChange(Math.min(14, (totalNights || 0) + 1))}
                  disabled={(totalNights || 0) >= 14}
                  aria-label="Increase nights"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer justify-self-end"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-[#666b73] block mb-2">일정 빠른 선택:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 5, 7, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleNightsChange(preset)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all text-center whitespace-nowrap px-1 cursor-pointer ${
                      totalNights === preset
                        ? "bg-[#b93829] border-[#b93829] text-white"
                        : "bg-white border-[#dedede] text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {preset}박
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 Card: 👥 여행 인원 */}
          <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[15px] font-bold text-[#1d1d1f]">👥 2단계: 여행 인원 선택</span>
                <span className="text-xs font-extrabold text-[#b93829]">
                  {adultCount !== null ? `${adultCount}명` : "미선택"}
                </span>
              </div>
              <div className="grid grid-cols-[36px_1fr_36px] items-center gap-1.5 bg-white p-2.5 rounded-[14px] border border-[#dedede] w-full">
                <button
                  type="button"
                  onClick={() => handleAdultsChange(Math.max(1, (adultCount || 2) - 1))}
                  disabled={(adultCount || 1) <= 1}
                  aria-label="Decrease travelers"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer justify-self-start"
                >
                  -
                </button>
                <div className="text-center min-w-0 px-0.5 overflow-hidden">
                  <span className="font-extrabold text-[#1d1d1f] text-sm lg:text-[16px] leading-tight block truncate">
                    {adultCount !== null ? `${adultCount} ${adultCount === 1 ? "Person" : "People"}` : "인원 선택"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdultsChange(Math.min(10, (adultCount || 0) + 1))}
                  disabled={(adultCount || 0) >= 10}
                  aria-label="Increase travelers"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer justify-self-end"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-[#666b73] block mb-2">인원 빠른 선택:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((countPreset) => (
                  <button
                    key={countPreset}
                    type="button"
                    onClick={() => handleAdultsChange(countPreset)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center whitespace-nowrap px-1 ${
                      adultCount === countPreset
                        ? "bg-[#b93829] border-[#b93829] text-white"
                        : "bg-white border-[#dedede] text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {countPreset}명
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 Card: 📍 여행 목적지 */}
          <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[15px] font-bold text-[#1d1d1f]">📍 3단계: 여행 목적지 선택</span>
                <span className="text-xs text-[#b93829] font-bold">다중 선택 ({draft.selectedCities.length}/4)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_CITY_OPTIONS.map((cityOpt) => {
                  const isSelected = draft.selectedCities.includes(cityOpt.key);
                  return (
                    <button
                      key={cityOpt.key}
                      type="button"
                      onClick={() => toggleCitySelection(cityOpt.key)}
                      className={`min-h-[42px] px-1 py-1.5 rounded-[12px] border text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1 text-center whitespace-nowrap ${
                        isSelected
                          ? "bg-[#fdf2f2] border-2 border-[#b93829] text-[#1d1d1f] font-bold shadow-2xs"
                          : "bg-white border-[#dedede] text-[#666b73] font-semibold hover:border-slate-300"
                      }`}
                    >
                      {isSelected && <span className="text-[#b93829] font-bold text-xs shrink-0">✓</span>}
                      <span>{cityOpt.nameKo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 요약 태그 & 제출 버튼 */}
        <div className="mt-8 pt-6 border-t border-[#dedede]/60 flex flex-col items-center gap-4">
          <div className="text-center text-[14px] text-[#666b73] font-medium py-2 px-5 rounded-full bg-[#faf9f7] max-w-lg mx-auto border border-[#dedede] flex items-center justify-center shadow-2xs">
            {getAllocationSummaryText()}
          </div>

          <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={!isFormComplete}
              className={`w-full sm:w-auto min-h-[52px] md:min-h-[56px] px-10 rounded-[14px] font-bold text-[17px] md:text-[18px] transition-all flex items-center justify-center gap-2 ${
                isFormComplete
                  ? "bg-[#b93829] hover:bg-[#a12f22] text-white shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
              }`}
            >
              <span>{dict.landing.cta}</span>
              <span className="text-xl">→</span>
            </button>

            <span className="text-xs sm:text-sm text-[#666b73] font-normal">
              {isFormComplete ? dict.landing.helper : "3가지 필수 여행 항목(기간, 인원, 목적지)을 모두 선택해 주세요."}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
