"use client";

import { useState, useEffect, useRef } from "react";
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
  sortCitiesByStandardOrder,
  getDefaultTargetBudgetByNights,
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
import TravelPresetSelector from "src/components/landing/TravelPresetSelector";
import {
  TravelPreset,
  TravelPresetId,
  getTravelPresetById,
} from "src/lib/presets/travel-presets";
import { scalePresetPreferences } from "src/lib/presets/preset-scaler";
import MadlibsTripSentence from "src/components/landing/MadlibsTripSentence";

interface LandingFormProps {
  locale: Locale;
  dict: Dictionary;
  initialPresets?: TravelPreset[];
}

const ALL_CITY_OPTIONS: { key: SupportedCity; nameKo: string; nameEn: string }[] = [
  { key: "SEOUL", nameKo: "서울", nameEn: "Seoul" },
  { key: "BUSAN", nameKo: "부산", nameEn: "Busan" },
  { key: "JEJU", nameKo: "제주", nameEn: "Jeju" },
  { key: "INCHEON", nameKo: "인천", nameEn: "Incheon" },
  { key: "SUWON", nameKo: "수원", nameEn: "Suwon" },
  { key: "JEONJU", nameKo: "전주", nameEn: "Jeonju" },
  { key: "GYEONGJU", nameKo: "경주", nameEn: "Gyeongju" },
  { key: "GANGNEUNG", nameKo: "강릉", nameEn: "Gangneung" },
  { key: "SOKCHO", nameKo: "속초", nameEn: "Sokcho" },
  { key: "YEOSU", nameKo: "여수", nameEn: "Yeosu" },
];

export default function LandingForm({ locale, dict, initialPresets }: LandingFormProps) {
  const router = useRouter();

  const [draft, setDraft] = useState<TripDraft>(DEFAULT_TRIP_DRAFT);
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<TravelPresetId | null>(null);
  const isKo = locale === "ko";

  // Reliable JS-based mobile detection to completely avoid CSS 'hidden' media-query bugs
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load saved draft safely on client side, with deep linking URL params taking precedence
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nightsParam = params.get("nights");
    const adultsParam = params.get("adults");
    const citiesParam = params.get("cities");
    const presetParam = params.get("preset");

    if (nightsParam || adultsParam || citiesParam) {
      const parsedNights = nightsParam ? parseInt(nightsParam, 10) : draft.totalNights;
      const parsedAdults = adultsParam ? parseInt(adultsParam, 10) : draft.adultCount;
      const parsedCities = citiesParam
        ? (citiesParam.split(",").filter((c) => ALL_CITY_OPTIONS.some((opt) => opt.key === c)) as SupportedCity[])
        : draft.selectedCities;

      const newAllocations = calculateDefaultNightAllocation(parsedCities, parsedNights);
      const defaultBudget = getDefaultTargetBudgetByNights(parsedNights, parsedAdults);

      setDraft((prev) => ({
        ...prev,
        totalNights: parsedNights,
        adultCount: parsedAdults,
        selectedCities: parsedCities,
        cityNightAllocations: newAllocations,
        budgetTier: defaultBudget.budgetTier,
        targetBudgetKrw: defaultBudget.targetBudgetKrw,
      }));

      if (presetParam) {
        setActivePresetId(presetParam as TravelPresetId);
      }
      return;
    }

    const saved = loadActiveDraft();
    if (saved && saved.draft) {
      setDraft(saved.draft);
      if (saved.mobileStep) {
        setMobileStep(saved.mobileStep as 1 | 2 | 3);
      }
    }
  }, []);

  const totalNights = draft.totalNights;
  const adultCount = draft.adultCount;

  const isFormComplete =
    totalNights !== null &&
    adultCount !== null &&
    draft.selectedCities.length >= 1;

  // Save draft state on changes & synchronize with URL query string
  useEffect(() => {
    saveActiveDraft(draft, mobileStep);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (draft.totalNights !== null) {
        params.set("nights", draft.totalNights.toString());
      } else {
        params.delete("nights");
      }

      if (draft.adultCount !== null) {
        params.set("adults", draft.adultCount.toString());
      } else {
        params.delete("adults");
      }

      if (draft.selectedCities.length > 0) {
        params.set("cities", draft.selectedCities.join(","));
      } else {
        params.delete("cities");
      }

      if (activePresetId) {
        params.set("preset", activePresetId);
      } else {
        params.delete("preset");
      }

      const newQuery = params.toString();
      const newPath = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
      window.history.replaceState(null, "", newPath);
    }
  }, [draft, mobileStep, activePresetId]);

  const formTopRef = useRef<HTMLDivElement>(null);

  const handleSelectPreset = (preset: TravelPreset) => {
    setActivePresetId(preset.id);
    setDraft(preset.draft);
    setValidationError(null);
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClearPreset = () => {
    setActivePresetId(null);
  };

  const handleResetDraft = () => {
    clearActiveDraft();
    setActivePresetId(null);
    setDraft(EMPTY_TRIP_DRAFT);
    setMobileStep(1);
    setActiveStep(1);
    setValidationError(null);
  };

  const handleNightsChange = (newNights: number) => {
    setActiveStep(1);
    const newAllocations = calculateDefaultNightAllocation(draft.selectedCities, newNights);
    const defaultBudget = getDefaultTargetBudgetByNights(newNights, draft.adultCount);
    setDraft((prev) => ({
      ...prev,
      totalNights: newNights,
      cityNightAllocations: newAllocations,
      budgetTier: defaultBudget.budgetTier,
      targetBudgetKrw: defaultBudget.targetBudgetKrw,
    }));
  };

  const handleAdultsChange = (newAdults: number) => {
    setActiveStep(2);
    const defaultBudget = getDefaultTargetBudgetByNights(draft.totalNights, newAdults);
    setDraft((prev) => ({
      ...prev,
      adultCount: newAdults,
      budgetTier: defaultBudget.budgetTier,
      targetBudgetKrw: defaultBudget.targetBudgetKrw,
    }));
  };

  const toggleCitySelection = (cityCode: SupportedCity) => {
    setActiveStep(3);
    let nextCities: SupportedCity[];
    if (draft.selectedCities.includes(cityCode)) {
      nextCities = draft.selectedCities.filter((c) => c !== cityCode);
    } else {
      if (draft.selectedCities.length >= 4) return;
      nextCities = [...draft.selectedCities, cityCode];
    }

    nextCities = sortCitiesByStandardOrder(nextCities);

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
          : `${draft.totalNights}N ${draft.totalNights + 1}D`
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
        ? "3가지 필수 여행 정보(기간, 인원, 목적지)를 선택해 주세요."
        : "Select your trip options (nights, travelers, destinations).";
    }

    return parts.join(" · ");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const defaultBudget = getDefaultTargetBudgetByNights(draft.totalNights, draft.adultCount);

    const draftToSave: TripDraft = {
      ...draft,
      budgetTier: draft.budgetTier || defaultBudget.budgetTier,
      targetBudgetKrw: draft.targetBudgetKrw || defaultBudget.targetBudgetKrw,
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

    // 활성 프리셋이 있으면 사용자가 수정한 기간/도시/인원에 맞춰 테마 설정을 지능적으로 스케일링하여 저장
    const preferencesToSave = activePresetId
      ? scalePresetPreferences(activePresetId, draftToSave)
      : {
          draft: draftToSave,
          accommodationByCity: {},
          foodOverrides: {},
          foodAddOnOverrides: {},
          foodBasketSelections: [],
          attractionByCity: {},
          attractionSelections: {},
        };

    savePlannerPreferences(preferencesToSave);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("hh_planner_selected_city_tab", "ALL");
      sessionStorage.setItem("hh_planner_active_category", "ACCOMMODATION");
    }

    router.push(`/${locale}/planner?tab=ALL`);
  };

  // 프리셋 선택 후 사용자가 1~3단계에서 일정이나 도시를 커스텀 변경했는지 여부 감지
  const isCustomized = (() => {
    if (!activePresetId) return false;
    const preset = getTravelPresetById(activePresetId);
    if (!preset) return false;
    const isNightsDiff = draft.totalNights !== preset.draft.totalNights;
    const isAdultsDiff = draft.adultCount !== preset.draft.adultCount;
    const isCitiesDiff =
      draft.selectedCities.length !== preset.draft.selectedCities.length ||
      draft.selectedCities.some((c) => !preset.draft.selectedCities.includes(c));
    return isNightsDiff || isAdultsDiff || isCitiesDiff;
  })();

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
      {/* 1순위 HERO: 내 생각 즉시 반영 여행 폼 (Mad-libs + 1~3단계 벤토 카드) */}
      <div
        ref={formTopRef}
        className="w-full max-w-5xl mx-auto bg-white/90 backdrop-blur-md border border-neutral-200/70 rounded-3xl p-5 sm:p-7 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] scroll-mt-6"
      >
        {/* ================= PC / TABLET VIEW (!isMobile) ================= */}
        {!isMobile && (
          <div>
            {validationError && (
              <div className="text-xs text-[#ef4444] font-semibold mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-center" aria-live="polite">
                {validationError}
              </div>
            )}

            {/* Live Interactive Mad-libs Sentence Preview */}
            <MadlibsTripSentence
              draft={draft}
              locale={locale}
              activeStep={activeStep}
              onStepClick={(step) => setActiveStep(step)}
            />

            {/* PC 3-Step Bento Cards Grid with Active Focus & Dimming */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* Step 1 Bento Card */}
              <div
                onClick={() => setActiveStep(1)}
                className={`rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  activeStep === 1
                    ? "scale-[1.01] border-teal-500/60 shadow-[0_12px_36px_rgba(20,184,166,0.08)] ring-2 ring-teal-500/20 opacity-100 bg-white"
                    : "opacity-70 border-neutral-200/60 bg-neutral-50/50 hover:opacity-90"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[15px] font-bold text-neutral-900">
                      {isKo ? "1단계: 여행 기간" : "Step 1: Duration"}
                    </span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      activeStep === 1 ? "bg-teal-50 text-teal-700 border border-teal-200/60" : "text-neutral-500"
                    }`}>
                      {totalNights !== null
                        ? isKo
                          ? `${totalNights}박 (${totalNights + 1}일)`
                          : `${totalNights}N ${totalNights + 1}D`
                        : isKo
                        ? "미선택"
                        : "None"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[36px_1fr_36px] items-center gap-1.5 bg-neutral-50/80 p-2 rounded-2xl border border-neutral-200/60 w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNightsChange(Math.max(1, (totalNights || 5) - 1));
                      }}
                      disabled={(totalNights || 1) <= 1}
                      aria-label="Decrease nights"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-lg transition-transform duration-150 ease-out cursor-pointer shadow-2xs active:scale-[0.97]"
                    >
                      -
                    </button>
                    <div className="text-center min-w-0 px-0.5 overflow-hidden">
                      <span className="font-extrabold text-neutral-900 text-sm lg:text-[15px] leading-tight block truncate">
                        {totalNights !== null
                          ? isKo
                            ? `${totalNights}박`
                            : `${totalNights} ${totalNights === 1 ? "Night" : "Nights"}`
                          : isKo
                          ? "기간 선택"
                          : "Duration"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNightsChange(Math.min(14, (totalNights || 0) + 1));
                      }}
                      disabled={(totalNights || 0) >= 14}
                      aria-label="Increase nights"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-lg transition-transform duration-150 ease-out cursor-pointer shadow-2xs active:scale-[0.97]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <span className="text-xs font-semibold text-neutral-500 block mb-2">
                    {isKo ? "일정 빠른 선택:" : "Quick Select:"}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 5, 7, 10].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNightsChange(preset);
                        }}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-transform duration-150 ease-out text-center whitespace-nowrap px-1 cursor-pointer active:scale-[0.97] ${
                          totalNights === preset
                            ? "bg-teal-700 border-teal-700 text-white shadow-xs ring-2 ring-teal-500/30 ring-offset-1"
                            : "bg-white border-neutral-200/70 text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        {isKo ? `${preset}박` : `${preset}N`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2 Bento Card */}
              <div
                onClick={() => setActiveStep(2)}
                className={`rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  activeStep === 2
                    ? "scale-[1.01] border-teal-500/60 shadow-[0_12px_36px_rgba(20,184,166,0.08)] ring-2 ring-teal-500/20 opacity-100 bg-white"
                    : "opacity-70 border-neutral-200/60 bg-neutral-50/50 hover:opacity-90"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[15px] font-bold text-neutral-900">
                      {isKo ? "2단계: 여행 인원" : "Step 2: Travelers"}
                    </span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      activeStep === 2 ? "bg-teal-50 text-teal-700 border border-teal-200/60" : "text-neutral-500"
                    }`}>
                      {adultCount !== null
                        ? isKo
                          ? `${adultCount}명`
                          : `${adultCount} ${adultCount === 1 ? "Person" : "People"}`
                        : isKo
                        ? "미선택"
                        : "None"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[36px_1fr_36px] items-center gap-1.5 bg-neutral-50/80 p-2 rounded-2xl border border-neutral-200/60 w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdultsChange(Math.max(1, (adultCount || 2) - 1));
                      }}
                      disabled={(adultCount || 1) <= 1}
                      aria-label="Decrease travelers"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-lg transition-transform duration-150 ease-out cursor-pointer shadow-2xs active:scale-[0.97]"
                    >
                      -
                    </button>
                    <div className="text-center min-w-0 px-0.5 overflow-hidden">
                      <span className="font-extrabold text-neutral-900 text-sm lg:text-[15px] leading-tight block truncate">
                        {adultCount !== null
                          ? isKo
                            ? `${adultCount}명`
                            : `${adultCount} ${adultCount === 1 ? "Person" : "People"}`
                          : isKo
                          ? "인원 선택"
                          : "Travelers"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdultsChange(Math.min(10, (adultCount || 0) + 1));
                      }}
                      disabled={(adultCount || 0) >= 10}
                      aria-label="Increase travelers"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-lg transition-transform duration-150 ease-out cursor-pointer shadow-2xs active:scale-[0.97]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <span className="text-xs font-semibold text-neutral-500 block mb-2">
                    {isKo ? "인원 빠른 선택:" : "Quick Select:"}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((countPreset) => (
                      <button
                        key={countPreset}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdultsChange(countPreset);
                        }}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-transform duration-150 ease-out cursor-pointer text-center whitespace-nowrap px-1 active:scale-[0.97] ${
                          adultCount === countPreset
                            ? "bg-teal-700 border-teal-700 text-white shadow-xs ring-2 ring-teal-500/30 ring-offset-1"
                            : "bg-white border-neutral-200/70 text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        {isKo ? `${countPreset}명` : `${countPreset}P`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3 Bento Card */}
              <div
                onClick={() => setActiveStep(3)}
                className={`rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  activeStep === 3
                    ? "scale-[1.01] border-teal-500/60 shadow-[0_12px_36px_rgba(20,184,166,0.08)] ring-2 ring-teal-500/20 opacity-100 bg-white"
                    : "opacity-70 border-neutral-200/60 bg-neutral-50/50 hover:opacity-90"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[15px] font-bold text-neutral-900">
                      {isKo ? "3단계: 여행 목적지" : "Step 3: Destinations"}
                    </span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      activeStep === 3 ? "bg-teal-50 text-teal-700 border border-teal-200/60" : "text-neutral-500"
                    }`}>
                      {isKo ? `다중 (${draft.selectedCities.length}/4)` : `Multi (${draft.selectedCities.length}/4)`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ALL_CITY_OPTIONS.map((cityOpt) => {
                      const isSelected = draft.selectedCities.includes(cityOpt.key);
                      return (
                        <button
                          key={cityOpt.key}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCitySelection(cityOpt.key);
                          }}
                          className={`min-h-[40px] px-1 py-1.5 rounded-xl border text-[13px] transition-transform duration-150 ease-out cursor-pointer flex items-center justify-center gap-1 text-center whitespace-nowrap active:scale-[0.97] ${
                            isSelected
                              ? "bg-teal-50/80 border-2 border-teal-600 text-teal-900 font-bold shadow-2xs ring-2 ring-teal-500/30 ring-offset-1"
                              : "bg-white border-neutral-200/60 text-neutral-600 font-medium hover:border-neutral-300"
                          }`}
                        >
                          {isSelected && <span className="text-teal-600 font-bold text-xs shrink-0">✓</span>}
                          <span>{isKo ? cityOpt.nameKo : cityOpt.nameEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* PC Bottom CTA Area */}
            <div className="mt-8 pt-6 border-t border-neutral-200/60 relative flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="submit"
                  disabled={!isFormComplete}
                  className={`min-h-[56px] px-10 rounded-[14px] font-bold text-[18px] transition-all flex items-center justify-center gap-2 ${
                    isFormComplete
                      ? "bg-[#b93829] hover:bg-[#a12f22] text-white shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
                  }`}
                >
                  <span>{dict.landing.cta}</span>
                  <span className="text-xl">→</span>
                </button>
              </div>

              {(totalNights !== null || adultCount !== null || draft.selectedCities.length > 0) && (
                <div className="md:absolute md:right-0 md:bottom-0 flex justify-end mt-2 md:mt-0">
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-all cursor-pointer bg-neutral-100 hover:bg-neutral-200/70 px-3.5 py-2 rounded-full border border-neutral-200/60 active:scale-95 shadow-2xs"
                  >
                    <span>↺</span>
                    <span>{isKo ? "일정 초기화" : "Reset Plan"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MOBILE VIEW (isMobile) ================= */}
        {isMobile && (
          <div>
            {validationError && (
              <div className="text-xs text-[#ef4444] font-semibold mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-center" aria-live="polite">
                {validationError}
              </div>
            )}

            {/* Step Progress Header */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-bold text-[#666b73] mb-2 px-1">
                <span className="text-[#b93829] font-extrabold">
                  {isKo ? `${mobileStep}단계 / 3단계` : `Step ${mobileStep} / 3`}
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    {mobileStep === 1 && (isKo ? "1. 여행 기간" : "1. Duration")}
                    {mobileStep === 2 && (isKo ? "2. 여행 인원" : "2. Travelers")}
                    {mobileStep === 3 && (isKo ? "3. 여행 목적지" : "3. Destinations")}
                  </span>
                  {(totalNights !== null || adultCount !== null || draft.selectedCities.length > 0) && (
                    <button
                      type="button"
                      onClick={handleResetDraft}
                      className="text-[11px] font-semibold text-slate-500 hover:text-[#b93829] bg-slate-100 hover:bg-red-50 px-2 py-0.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
                    >
                      {isKo ? "↺ 초기화" : "↺ Reset"}
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#b93829] transition-all duration-300 rounded-full"
                  style={{ width: `${mobileStep * 33.33}%` }}
                />
              </div>
            </div>

            {/* Mobile Live Interactive Mad-libs Sentence */}
            <div className="mb-4 px-1">
              <MadlibsTripSentence
                draft={draft}
                locale={locale}
                activeStep={mobileStep}
                onStepClick={(step) => setMobileStep(step)}
                compact={true}
              />
            </div>

            {/* Mobile Step 1: 여행 기간 */}
            {mobileStep === 1 && (
              <div className="bg-[#faf9f7] p-5 rounded-[22px] border border-neutral-200/70 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-neutral-900">
                    {isKo ? "1단계: 여행 기간" : "Step 1: Duration"}
                  </span>
                  <span className="text-[16px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                    {totalNights !== null
                      ? isKo
                        ? `${totalNights}박 (${totalNights + 1}일)`
                        : `${totalNights}N ${totalNights + 1}D`
                      : isKo
                      ? "미선택"
                      : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/60">
                  <button type="button" onClick={() => handleNightsChange(Math.max(1, (totalNights || 5) - 1))} disabled={(totalNights || 1) <= 1} className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-xl transition-transform duration-150 ease-out cursor-pointer active:scale-[0.97]">-</button>
                  <div className="text-center">
                    <span className="font-extrabold text-neutral-900 text-[18px] block">
                      {totalNights !== null
                        ? isKo
                          ? `${totalNights}박`
                          : `${totalNights} ${totalNights === 1 ? "Night" : "Nights"}`
                        : isKo
                        ? "기간 선택"
                        : "Duration"}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleNightsChange(Math.min(14, (totalNights || 0) + 1))} disabled={(totalNights || 0) >= 14} className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-xl transition-transform duration-150 ease-out cursor-pointer active:scale-[0.97]">+</button>
                </div>

                <div className="pt-1">
                  <span className="text-xs font-semibold text-neutral-500 block mb-2">
                    {isKo ? "일정 빠른 선택:" : "Quick Select:"}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 7, 10].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleNightsChange(preset)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                          totalNights === preset
                            ? "bg-teal-700 border-teal-700 text-white shadow-xs ring-2 ring-teal-500/30 ring-offset-1"
                            : "bg-white border-neutral-200/70 text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        {isKo ? `${preset}박` : `${preset}N`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Step 2: 여행 인원 */}
            {mobileStep === 2 && (
              <div className="bg-[#faf9f7] p-5 rounded-[22px] border border-neutral-200/70 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-neutral-900">
                    {isKo ? "2단계: 여행 인원" : "Step 2: Travelers"}
                  </span>
                  <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                    {adultCount !== null
                      ? isKo
                        ? `${adultCount}명`
                        : `${adultCount} ${adultCount === 1 ? "Person" : "People"}`
                      : isKo
                      ? "미선택"
                      : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/60">
                  <button type="button" onClick={() => handleAdultsChange(Math.max(1, (adultCount || 2) - 1))} disabled={(adultCount || 1) <= 1} className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-xl transition-transform duration-150 ease-out cursor-pointer active:scale-[0.97]">-</button>
                  <div className="text-center">
                    <span className="font-extrabold text-neutral-900 text-lg block">
                      {adultCount !== null
                        ? isKo
                          ? `${adultCount}명`
                          : `${adultCount} ${adultCount === 1 ? "Person" : "People"}`
                        : isKo
                        ? "인원 선택"
                        : "Travelers"}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleAdultsChange(Math.min(10, (adultCount || 0) + 1))} disabled={(adultCount || 0) >= 10} className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30 text-neutral-800 font-bold text-xl transition-transform duration-150 ease-out cursor-pointer active:scale-[0.97]">+</button>
                </div>

                <div className="pt-1">
                  <span className="text-xs font-semibold text-neutral-500 block mb-2">
                    {isKo ? "인원 빠른 선택:" : "Quick Select:"}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((countPreset) => (
                      <button
                        key={countPreset}
                        type="button"
                        onClick={() => handleAdultsChange(countPreset)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                          adultCount === countPreset
                            ? "bg-teal-700 border-teal-700 text-white shadow-xs ring-2 ring-teal-500/30 ring-offset-1"
                            : "bg-white border-neutral-200/70 text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        {isKo ? `${countPreset}명` : `${countPreset}P`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Step 3: 여행 목적지 */}
            {mobileStep === 3 && (
              <div className="bg-[#faf9f7] p-5 rounded-[22px] border border-neutral-200/70 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-neutral-900">
                    {isKo ? "3단계: 여행 목적지" : "Step 3: Destinations"}
                  </span>
                  <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                    {isKo ? `다중 (${draft.selectedCities.length}/4)` : `Multi (${draft.selectedCities.length}/4)`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_CITY_OPTIONS.map((cityOpt) => (
                    <button
                      key={cityOpt.key}
                      type="button"
                      onClick={() => toggleCitySelection(cityOpt.key)}
                      className={`min-h-[44px] px-2 py-2 rounded-xl border text-[13px] transition-all duration-150 ease-out cursor-pointer flex items-center justify-center gap-1 text-center active:scale-[0.97] ${
                        draft.selectedCities.includes(cityOpt.key)
                          ? "bg-teal-50/80 border-2 border-teal-600 text-teal-900 font-bold shadow-2xs ring-2 ring-teal-500/30 ring-offset-1"
                          : "bg-white border-neutral-200/70 text-neutral-600 font-medium hover:border-neutral-300"
                      }`}
                    >
                      {draft.selectedCities.includes(cityOpt.key) && <span className="text-teal-600 font-bold text-xs">✓</span>}
                      {isKo ? cityOpt.nameKo : cityOpt.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2순위 SUB / INSPIRATION: 추천 여행 코스 가이드 프리셋 */}
      <div className="w-full max-w-5xl mx-auto mt-10 pt-8 border-t border-neutral-200/70 mb-8">
        <div className="mb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] sm:text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60 uppercase tracking-wide">
              {locale === "ko" ? "추천 코스 가이드" : "Curated Presets"}
            </span>
            <h2 className="text-[17px] sm:text-[20px] font-extrabold text-neutral-900 mt-2 tracking-tight">
              {locale === "ko"
                ? "어떤 여행을 꿈꾸고 계신가요? 인기 코스로 1초 만에 플랜 완성하기"
                : "Looking for inspiration? Fill your plan with popular presets"}
            </h2>
            <p className="text-xs sm:text-[13px] text-neutral-500 mt-1">
              {locale === "ko"
                ? "추천 코스를 선택하시면 위의 여행 완성 문장과 1~3단계 설정이 자동으로 세팅됩니다."
                : "Select any preset to automatically fill the statement and steps above."}
            </p>
          </div>
        </div>

        <TravelPresetSelector
          locale={locale}
          dict={dict}
          activePresetId={activePresetId}
          isCustomized={isCustomized}
          initialPresets={initialPresets}
          onSelectPreset={handleSelectPreset}
          onClearPreset={handleClearPreset}
        />
      </div>

      {/* Mobile Fixed Bottom Navigation Floating Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f7]/95 backdrop-blur-md border-t border-[#dedede] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg flex flex-col gap-2">
          <div className="text-center text-xs font-semibold text-slate-700 py-1.5 px-3 rounded-xl bg-white border border-[#dedede] w-full shadow-2xs">
            <MadlibsTripSentence
              draft={draft}
              locale={locale}
              activeStep={mobileStep}
              onStepClick={(step) => setMobileStep(step)}
              compact={true}
            />
          </div>

          {mobileStep === 1 && (
            <button
              type="button"
              disabled={totalNights === null}
              onClick={() => setMobileStep(2)}
              className={`w-full min-h-[50px] rounded-[14px] text-[16px] font-bold transition-all duration-150 ease-out active:scale-[0.97] ${
                totalNights !== null
                  ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              }`}
            >
              {totalNights !== null
                ? isKo
                  ? "다음 단계 (2/3 인원 선택) →"
                  : "Next (2/3 Travelers) →"
                : isKo
                ? "여행 기간을 선택해 주세요"
                : "Please select stay duration"}
            </button>
          )}

          {mobileStep === 2 && (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setMobileStep(1)}
                className="w-1/3 min-h-[50px] rounded-[14px] bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                {isKo ? "← 이전" : "← Back"}
              </button>
              <button
                type="button"
                disabled={adultCount === null}
                onClick={() => setMobileStep(3)}
                className={`w-2/3 min-h-[50px] rounded-[14px] text-[15px] font-bold transition-all duration-150 ease-out active:scale-[0.97] ${
                  adultCount !== null
                    ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                }`}
              >
                {adultCount !== null
                  ? isKo
                    ? "다음 단계 (3/3 목적지) →"
                    : "Next (3/3 Destinations) →"
                  : isKo
                  ? "여행 인원을 선택해 주세요"
                  : "Please select travelers"}
              </button>
            </div>
          )}

          {mobileStep === 3 && (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setMobileStep(2)}
                className="w-1/3 min-h-[50px] rounded-[14px] bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                {isKo ? "← 이전" : "← Back"}
              </button>
              <button
                type="submit"
                disabled={!isFormComplete}
                className={`w-2/3 min-h-[50px] rounded-[14px] font-extrabold text-[16px] transition-all duration-150 ease-out active:scale-[0.97] flex items-center justify-center gap-1 ${
                  isFormComplete
                    ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                }`}
              >
                <span>{isFormComplete ? dict.landing.cta : (isKo ? "목적지 1개 이상 선택 필요" : "Select at least 1 destination")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
