"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TripDraft,
  SupportedCity,
  BudgetTier,
  DEFAULT_TRIP_DRAFT,
  calculateDefaultNightAllocation,
  validateTripDraft,
  getCitiesSentenceLabel,
} from "src/lib/trip-domain";
import { saveTripDraft, loadTripDraft, savePlannerPreferences } from "src/lib/storage-helper";
import { formatCityAllocationSummary } from "src/features/budget/presentation/formatters";
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

// 예산 등급에 따른 영어 관사 및 마감 단어 사전
const BUDGET_TENSE_MAP = {
  BUDGET: { pre: "on a", post: "plan." },
  STANDARD: { pre: "with a", post: "budget." },
  PREMIUM: { pre: "with a", post: "budget." },
};

export default function LandingForm({ locale, dict }: LandingFormProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsHydrated(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!isHydrated) {
    return <StaticLandingForm dict={dict} />;
  }

  return <HydratedLandingForm locale={locale} dict={dict} />;
}

/**
 * 1. 서버 렌더링 및 최초 클라이언트 Hydration용 정적 폼 컴포넌트
 */
function StaticLandingForm({ dict }: { dict: Dictionary }) {
  return (
    <div className="w-full flex flex-col items-center opacity-70 pointer-events-none">
      <div className="w-full bg-[#ffffff] border border-[#dedede] rounded-[20px] p-6 md:p-10 shadow-xs">
        <div className="text-center text-[20px] md:text-[26px] font-semibold leading-[1.75] tracking-[-0.015em] text-[#1d1d1f] mb-8">
          <div className="flex flex-wrap justify-center items-center gap-y-3 gap-x-2">
            <span>I&apos;m planning a</span>
            <div className="inline-flex items-center gap-1 border-2 border-dashed border-[#b93829] bg-[#fdf2f2] px-3.5 py-1 rounded-xl select-none min-h-[44px]">
              <span className="font-bold text-[#b93829] px-1 text-center text-[17px]">🗓️ Select Nights ▾</span>
            </div>
            <span>trip for</span>
            <div className="relative inline-block border-2 border-dashed border-[#b93829] bg-[#fdf2f2] px-3.5 py-1 rounded-xl select-none min-h-[44px]">
              <span className="font-bold text-[#b93829] px-1 text-center text-[17px]">👥 Select Travelers ▾</span>
            </div>
            <span>to</span>
            <div className="relative inline-block border-2 border-dashed border-[#b93829] bg-[#fdf2f2] px-3.5 py-1 rounded-xl select-none min-h-[44px]">
              <span className="font-bold text-[#b93829] px-1 text-center text-[17px]">📍 Select Destinations ▾</span>
            </div>
            <span>with a</span>
            <div className="relative inline-block border-2 border-dashed border-[#b93829] bg-[#fdf2f2] px-3.5 py-1 rounded-xl select-none min-h-[44px]">
              <span className="font-bold text-[#b93829] px-1 text-center text-[17px]">💎 Select Budget ▾</span>
            </div>
          </div>
        </div>

        <div className="text-center text-[14px] text-[#666b73] font-medium mb-8 py-2 px-4 rounded-full bg-[#faf9f7] max-w-sm mx-auto border border-[#dedede] flex items-center justify-center">
          💡 4가지 필수 여행 정보(기간, 인원, 목적지, 예산)를 모두 선택해 주세요.
        </div>

        <div className="flex flex-col items-center gap-3">
          <button disabled className="w-full sm:w-auto min-h-[52px] md:min-h-[56px] px-10 rounded-[14px] bg-slate-200 text-slate-400 font-bold text-[17px] md:text-[18px] cursor-not-allowed border border-slate-300">
            {dict.landing.cta}
          </button>
          <span className="text-[14px] text-[#666b73] font-normal">{dict.landing.helper}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Hydration 완료 후 로컬스토리지 데이터를 Lazy Loading 하여 구동되는 동적 폼 컴포넌트
 */
function HydratedLandingForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();

  const [draft, setDraft] = useState<TripDraft>(() => loadTripDraft());
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalNights = draft.totalNights;
  const adultCount = draft.adultCount;
  const budgetTier = draft.budgetTier;

  const isFormComplete =
    totalNights !== null &&
    adultCount !== null &&
    draft.selectedCities.length >= 1 &&
    budgetTier !== null;

  const [mobileStep, setMobileStep] = useState<1 | 2 | 3 | 4>(1);

  const [isNightsDropdownOpen, setIsNightsDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const nightsDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (nightsDropdownRef.current && !nightsDropdownRef.current.contains(event.target as Node)) {
        setIsNightsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setMobileStep(3);
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

  const handleBudgetChange = (tier: BudgetTier) => {
    setDraft((prev) => ({
      ...prev,
      budgetTier: tier,
    }));
  };

  const getAllocationSummaryText = () => {
    if (!isFormComplete) {
      return locale === "ko"
        ? "💡 4가지 여행 항목(기간, 인원, 목적지, 예산)을 모두 선택해 주세요."
        : "💡 Select all 4 trip options (nights, travelers, destinations, budget tier).";
    }
    return formatCityAllocationSummary(draft.cityNightAllocations, dict, locale);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = validateTripDraft(draft);
    if (!validation.success) {
      const firstError = validation.errors[0];
      let errMsg = dict.landing.validation.saveFailed;
      if (firstError === "invalid_nights") errMsg = dict.landing.validation.invalidNights;
      if (firstError === "invalid_adults") errMsg = dict.landing.validation.invalidAdults;
      if (firstError === "invalid_cities_count" || firstError === "invalid_city") errMsg = dict.landing.validation.noCities;
      if (firstError === "invalid_budget_tier") errMsg = "예산 스타일을 선택해 주세요.";

      setValidationError(errMsg);
      return;
    }

    const saved = saveTripDraft(draft);
    if (!saved) {
      setValidationError(dict.landing.validation.saveFailed);
      return;
    }

    savePlannerPreferences({
      draft,
      accommodationByCity: {},
      foodOverrides: {},
      foodAddOnOverrides: {},
      attractionByCity: {},
    });

    router.push(`/${locale}/planner`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
      {/* Container Card */}
      <div className="w-full bg-[#ffffff] border border-[#dedede] rounded-[20px] p-5 sm:p-8 md:p-10 shadow-xs transition-shadow duration-300">

        {/* ================= DESKTOP UI: 감성적인 자연어 문장형 (sm 이상) ================= */}
        <div className="hidden sm:block text-center text-[22px] md:text-[26px] font-semibold leading-[1.75] tracking-[-0.015em] text-[#1d1d1f] mb-8">
          <div className="flex flex-wrap justify-center items-center gap-y-4 gap-x-2">
            <span>I&apos;m planning a</span>

            {/* Field 1: Total Nights Stepper / Popover */}
            <div className="relative inline-block" ref={nightsDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNightsDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all min-h-[48px] font-bold text-[17px] cursor-pointer ${totalNights !== null
                    ? "border-2 border-[#b93829] bg-[#fdf2f2] text-[#b93829]"
                    : "border-2 border-dashed border-[#b93829] bg-[#fdf2f2] text-[#b93829] hover:bg-[#fce8e8]"
                  }`}
                aria-label="Select nights"
              >
                <span>{totalNights !== null ? `${totalNights}-night` : "🗓️ Select Nights"}</span>
                <span className="text-[10px] text-[#b93829] select-none ml-0.5">▼</span>
              </button>

              {isNightsDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white border border-[#dedede] rounded-2xl p-4 shadow-xl z-50 text-left space-y-3">
                  <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
                    <span>🗓️ 여행 일정 설정</span>
                    {totalNights !== null && <span className="text-[#b93829] font-bold">{totalNights}박 ({totalNights + 1}일)</span>}
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-[#dedede]">
                    <button
                      type="button"
                      onClick={() => handleNightsChange(Math.max(1, (totalNights || 5) - 1))}
                      disabled={(totalNights || 1) <= 1}
                      aria-label="Decrease nights"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-[#b93829] hover:text-white text-[#1d1d1f] font-bold text-sm transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-[#1d1d1f] text-base">
                      {totalNights !== null ? `${totalNights} Nights` : "일정 선택"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNightsChange(Math.min(14, (totalNights || 0) + 1))}
                      disabled={(totalNights || 0) >= 14}
                      aria-label="Increase nights"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-[#b93829] hover:text-white text-[#1d1d1f] font-bold text-sm transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[3, 5, 7, 10].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          handleNightsChange(preset);
                          setIsNightsDropdownOpen(false);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${totalNights === preset
                            ? "bg-[#b93829] border-[#b93829] text-white"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {preset}박
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span>trip for</span>

            {/* Field 2: Travelers Selector */}
            <div className={`relative inline-block border-2 px-3 py-1 rounded-xl transition-colors min-h-[48px] leading-[44px] ${adultCount !== null
                ? "border-[#b93829] bg-[#fdf2f2]"
                : "border-dashed border-[#b93829] bg-[#fdf2f2]"
              }`}>
              <select
                value={adultCount ?? ""}
                onChange={(e) => handleAdultsChange(Number(e.target.value))}
                className="appearance-none bg-transparent pr-5 font-bold text-[#b93829] text-[17px] cursor-pointer focus:outline-none text-center"
                aria-label="Number of travelers"
              >
                <option value="" disabled>👥 Select Travelers</option>
                <option value={1}>1 person</option>
                <option value={2}>2 people</option>
                <option value={3}>3 people</option>
                <option value={4}>4 people</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#b93829] pointer-events-none select-none">▼</span>
            </div>

            <span>to</span>

            {/* Field 3: Cities Selector */}
            <div className="relative inline-block" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all min-h-[48px] font-bold text-[17px] cursor-pointer ${draft.selectedCities.length > 0
                    ? "border-2 border-[#b93829] bg-[#fdf2f2] text-[#b93829]"
                    : "border-2 border-dashed border-[#b93829] bg-[#fdf2f2] text-[#b93829] hover:bg-[#fce8e8]"
                  }`}
                aria-expanded={isCityDropdownOpen}
                aria-label="Destination cities"
              >
                <span>{draft.selectedCities.length > 0 ? getCitiesSentenceLabel(draft.selectedCities) : "📍 Select Destinations"}</span>
                <span className="text-[10px] text-[#b93829] select-none ml-0.5">▼</span>
              </button>

              {isCityDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white border border-[#dedede] rounded-2xl p-3 shadow-xl z-50 text-left">
                  <div className="text-xs font-bold text-slate-500 mb-2 px-1 flex items-center justify-between">
                    <span>도시 다중 선택 (1~4개)</span>
                    <span className="text-[#b93829]">{draft.selectedCities.length}/4 선택됨</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
                    {ALL_CITY_OPTIONS.map((cityOpt) => {
                      const isSelected = draft.selectedCities.includes(cityOpt.key);
                      return (
                        <button
                          key={cityOpt.key}
                          type="button"
                          onClick={() => toggleCitySelection(cityOpt.key)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${isSelected
                              ? "bg-[#fdf2f2] text-[#b93829] border border-[#b93829]"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent"
                            }`}
                        >
                          <span>{cityOpt.nameEn}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <span>{budgetTier ? BUDGET_TENSE_MAP[budgetTier].pre : "with a"}</span>

            {/* Field 4: Budget Tier Selector */}
            <div className={`relative inline-block border-2 px-3 py-1 rounded-xl transition-colors min-h-[48px] leading-[44px] ${budgetTier !== null
                ? "border-[#b93829] bg-[#fdf2f2]"
                : "border-dashed border-[#b93829] bg-[#fdf2f2]"
              }`}>
              <select
                value={budgetTier ?? ""}
                onChange={(e) => handleBudgetChange(e.target.value as BudgetTier)}
                className="appearance-none bg-transparent pr-5 font-bold text-[#b93829] text-[17px] cursor-pointer focus:outline-none text-center"
                aria-label="Budget tier"
              >
                <option value="" disabled>💎 Select Budget</option>
                <option value="BUDGET">Budget</option>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#b93829] pointer-events-none select-none">▼</span>
            </div>

            <span>{budgetTier ? BUDGET_TENSE_MAP[budgetTier].post : "budget."}</span>
          </div>
        </div>

        {/* ================= MOBILE UI: 4단계 진행형 Step Wizard 레이아웃 (sm 미만) ================= */}
        <div className="block sm:hidden mb-6">

          {validationError && (
            <div className="text-xs text-[#ef4444] font-semibold mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-center" aria-live="polite">
              ⚠️ {validationError}
            </div>
          )}

          {/* 상단 4단계 Progress Nav */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs font-bold text-[#666b73] mb-2 px-1">
              <span className="text-[#b93829] font-extrabold">{mobileStep}단계 / 4단계</span>
              <span>
                {mobileStep === 1 && "1. 여행 기간 설정"}
                {mobileStep === 2 && "2. 여행 인원 선택"}
                {mobileStep === 3 && "3. 여행 목적지 선택"}
                {mobileStep === 4 && "4. 예산 스타일 선택"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#b93829] transition-all duration-300 rounded-full"
                style={{ width: `${mobileStep * 25}%` }}
              />
            </div>
          </div>

          {/* Step 1: 🗓️ 여행 기간 (Nights Stepper) */}
          {mobileStep === 1 && (
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">🗓️ 1단계: 여행 기간 설정</span>
                <span className="text-[17px] font-extrabold text-[#b93829]">
                  {totalNights !== null ? `${totalNights}박 (${totalNights + 1}일)` : "미선택"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-[14px] border border-[#dedede]">
                <button
                  type="button"
                  onClick={() => handleNightsChange(Math.max(1, (totalNights || 5) - 1))}
                  disabled={(totalNights || 1) <= 1}
                  aria-label="Decrease nights"
                  className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-xl transition-colors cursor-pointer"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="font-extrabold text-[#1d1d1f] text-[20px] block">
                    {totalNights !== null ? `${totalNights} Nights` : "기간을 선택하세요"}
                  </span>
                  <span className="text-xs text-[#666b73]">
                    {totalNights !== null ? `${totalNights + 1}일간의 한국 여행` : "아래 버튼을 터치해 박수 선택"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNightsChange(Math.min(14, (totalNights || 0) + 1))}
                  disabled={(totalNights || 0) >= 14}
                  aria-label="Increase nights"
                  className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-xl transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Quick Select Preset Chips */}
              <div className="pt-1">
                <span className="text-xs font-semibold text-[#666b73] block mb-2">자주 찾는 일정 빠른 선택:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleNightsChange(preset)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
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
          )}
          {mobileStep === 2 && (
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">👥 2단계: 여행 인원 선택</span>
                <span className="text-xs text-[#666b73]">선택 시 자동 다음 이동</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { count: 1, label: "1명 (나홀로 여행)" },
                  { count: 2, label: "2명 (커플/친구)" },
                  { count: 3, label: "3명 (소규모 그룹)" },
                  { count: 4, label: "4명 (가족/그룹)" },
                ].map((item) => {
                  const isSelected = adultCount === item.count;
                  return (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => handleAdultsChange(item.count)}
                      className={`p-3.5 rounded-[14px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#fdf2f2] border-2 border-[#b93829] text-[#1d1d1f] font-bold shadow-2xs"
                          : "bg-white border-[#dedede] text-[#666b73] font-semibold hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm">{item.label}</span>
                      {isSelected && <span className="text-[#b93829] font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: 📍 여행 목적지 (Destinations) */}
          {mobileStep === 3 && (
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">📍 3단계: 여행 목적지 선택</span>
                <span className="text-xs text-[#b93829] font-bold">다중 선택 ({draft.selectedCities.length}/4)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ALL_CITY_OPTIONS.map((cityOpt) => {
                  const isSelected = draft.selectedCities.includes(cityOpt.key);
                  return (
                    <button
                      key={cityOpt.key}
                      type="button"
                      onClick={() => toggleCitySelection(cityOpt.key)}
                      className={`min-h-[48px] px-2 py-2.5 rounded-[12px] border text-[14px] transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
                        isSelected
                          ? "bg-[#fdf2f2] border-2 border-[#b93829] text-[#1d1d1f] font-bold shadow-2xs"
                          : "bg-white border-[#dedede] text-[#666b73] font-semibold hover:border-slate-300"
                      }`}
                    >
                      {isSelected && <span className="text-[#b93829] font-bold text-xs">✓</span>}
                      <span>{cityOpt.nameKo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: 💎 예산 스타일 (Budget Tier Cards & Final CTA) */}
          {mobileStep === 4 && (
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">💎 4단계: 예산 스타일 선택</span>
                <span className="text-xs text-[#666b73]">최종 단계</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "BUDGET", label: "Budget", desc: "실속형" },
                  { key: "STANDARD", label: "Standard", desc: "일반형" },
                  { key: "PREMIUM", label: "Premium", desc: "프리미엄" },
                ].map((tierOpt) => {
                  const isSelected = budgetTier === tierOpt.key;
                  return (
                    <button
                      key={tierOpt.key}
                      type="button"
                      onClick={() => handleBudgetChange(tierOpt.key as BudgetTier)}
                      className={`min-h-[56px] p-2 rounded-[12px] border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-[#fdf2f2] border-2 border-[#b93829] text-[#1d1d1f] font-bold shadow-2xs"
                          : "bg-white border-[#dedede] text-[#666b73] font-semibold hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {isSelected && <span className="text-[#b93829] font-bold text-xs">✓</span>}
                        <span className="text-[14px]">{tierOpt.label}</span>
                      </div>
                      <span className="text-[11px] text-[#666b73] font-normal">{tierOpt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* 도시별 숙박일 배분 요약 (데스크톱 전용) */}
        <div className="hidden sm:flex text-center text-[14px] text-[#666b73] font-medium mb-6 py-2 px-4 rounded-full bg-[#faf9f7] max-w-sm mx-auto border border-[#dedede] items-center justify-center">
          {getAllocationSummaryText()}
        </div>

        {/* CTA 버튼 & 안내 (데스크톱 전용) */}
        <div className="hidden sm:flex flex-col items-center gap-3">
          {validationError && (
            <div className="text-xs text-[#ef4444] font-semibold mb-2" aria-live="polite">
              ⚠️ {validationError}
            </div>
          )}
          
          <button
            type="submit"
            disabled={!isFormComplete}
            className={`w-full sm:w-auto min-h-[52px] md:min-h-[56px] px-10 rounded-[14px] font-bold text-[17px] md:text-[18px] leading-[1.2] transition-all ${
              isFormComplete
                ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] active:scale-[0.98] cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
            }`}
          >
            {dict.landing.cta}
          </button>
          
          <span className="text-[14px] text-[#666b73] font-normal">
            {isFormComplete ? dict.landing.helper : "4가지 여행 항목(기간, 인원, 목적지, 예산)을 모두 선택해 주세요."}
          </span>
        </div>

      </div>

      {/* ================= MOBILE STICKY BOTTOM NAVIGATION BAR ================= */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f7]/95 backdrop-blur-md border-t border-[#dedede] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg flex flex-col gap-2">
        {/* 모든 단계(1~4단계) 공통: 실행 버튼 바로 위 고정 요약 위치 */}
        <div className="text-center text-xs font-semibold text-slate-600 py-1.5 px-3 rounded-full bg-white border border-[#dedede] w-full truncate shadow-2xs">
          {getAllocationSummaryText()}
        </div>

        {mobileStep === 1 && (
          <button
            type="button"
            disabled={totalNights === null}
            onClick={() => setMobileStep(2)}
            className={`w-full min-h-[50px] rounded-[14px] text-[16px] font-bold transition-all ${
              totalNights !== null
                ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
            }`}
          >
            {totalNights !== null ? "다음 단계 (2/4 인원 선택) →" : "여행 기간을 선택해 주세요"}
          </button>
        )}

        {mobileStep === 2 && (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setMobileStep(1)}
              className="w-1/3 min-h-[50px] rounded-[14px] bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 cursor-pointer"
            >
              ← 이전
            </button>
            <button
              type="button"
              disabled={adultCount === null}
              onClick={() => setMobileStep(3)}
              className={`w-2/3 min-h-[50px] rounded-[14px] text-[15px] font-bold transition-all ${
                adultCount !== null
                  ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              }`}
            >
              {adultCount !== null ? "다음 단계 (3/4 목적지) →" : "여행 인원을 선택해 주세요"}
            </button>
          </div>
        )}

        {mobileStep === 3 && (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setMobileStep(2)}
              className="w-1/3 min-h-[50px] rounded-[14px] bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 cursor-pointer"
            >
              ← 이전
            </button>
            <button
              type="button"
              disabled={draft.selectedCities.length === 0}
              onClick={() => setMobileStep(4)}
              className={`w-2/3 min-h-[50px] rounded-[14px] text-[15px] font-bold transition-all ${
                draft.selectedCities.length > 0
                  ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              }`}
            >
              {draft.selectedCities.length > 0 ? "다음 단계 (4/4 예산) →" : "목적지를 1개 이상 선택해 주세요"}
            </button>
          </div>
        )}

        {mobileStep === 4 && (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setMobileStep(3)}
              className="w-1/3 min-h-[50px] rounded-[14px] bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 cursor-pointer"
            >
              ← 이전
            </button>
            <button
              type="submit"
              disabled={!isFormComplete}
              className={`w-2/3 min-h-[50px] rounded-[14px] font-extrabold text-[16px] transition-all flex items-center justify-center gap-1 ${
                isFormComplete
                  ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              }`}
            >
              <span>{isFormComplete ? `${dict.landing.cta} 🚀` : "예산 스타일 선택 완료 필요"}</span>
            </button>
          </div>
        )}
      </div>

    </form>
  );
}
