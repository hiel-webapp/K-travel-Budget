"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TripDraft,
  SupportedCity,
  BudgetTier,
  DEFAULT_TRIP_DRAFT,
  calculateDefaultNightAllocation,
  validateTripDraft,
} from "src/lib/trip-domain";
import { saveTripDraft, loadTripDraft, savePlannerPreferences } from "src/lib/storage-helper";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { Locale } from "src/lib/i18n/locales";

interface LandingFormProps {
  locale: Locale;
  dict: Dictionary;
}

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
  const defaultNights = DEFAULT_TRIP_DRAFT.totalNights;
  const defaultBudget = DEFAULT_TRIP_DRAFT.budgetTier;

  const allocationText = dict.landing.allocationSeoulBusan
    .replace("{seoul}", "3")
    .replace("{busan}", "2");

  return (
    <div className="w-full flex flex-col items-center opacity-70 pointer-events-none">
      <div className="w-full bg-[#ffffff] border border-[#dedede] rounded-[20px] p-6 md:p-10 shadow-xs">
        <div className="text-center text-[20px] md:text-[26px] font-semibold leading-[1.75] tracking-[-0.015em] text-[#1d1d1f] mb-8">
          <div className="flex flex-wrap justify-center items-center gap-y-3 gap-x-2">
            <span>I&apos;m planning a</span>
            <div className="inline-flex items-center gap-1 border-b-2 border-dashed border-[#dedede] bg-slate-50 px-3 py-1 rounded select-none min-h-[44px]">
              <button disabled className="w-8 h-8 flex items-center justify-center rounded bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed">-</button>
              <span className="font-bold text-[#b93829] px-1 text-center">{defaultNights}-night</span>
              <button disabled className="w-8 h-8 flex items-center justify-center rounded bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed">+</button>
            </div>
            <span>trip for</span>
            <div className="relative inline-block border-b-2 border-dashed border-[#dedede] bg-slate-50 px-3 py-1 rounded min-h-[44px]">
              <select disabled value={2} className="appearance-none bg-transparent pr-4 font-bold text-[#b93829] text-center" aria-label="Number of travelers">
                <option value={2}>2 people</option>
              </select>
            </div>
            <span>to</span>
            <div className="relative inline-block border-b-2 border-dashed border-[#dedede] bg-slate-50 px-3 py-1 rounded min-h-[44px]">
              <select disabled value="SEOUL_BUSAN" className="appearance-none bg-transparent pr-4 font-bold text-[#b93829] text-center" aria-label="Destination">
                <option value="SEOUL_BUSAN">Seoul and Busan</option>
              </select>
            </div>
            <span>{BUDGET_TENSE_MAP[defaultBudget].pre}</span>
            <div className="relative inline-block border-b-2 border-dashed border-[#dedede] bg-slate-50 px-3 py-1 rounded min-h-[44px]">
              <select disabled value={defaultBudget} className="appearance-none bg-transparent pr-4 font-bold text-[#b93829] text-center" aria-label="Budget tier">
                <option value="STANDARD">Standard</option>
              </select>
            </div>
            <span>{BUDGET_TENSE_MAP[defaultBudget].post}</span>
          </div>
        </div>

        <div className="text-center text-[14px] text-[#666b73] font-medium mb-8 py-2 px-4 rounded-full bg-[#faf9f7] max-w-xs mx-auto border border-[#dedede] flex items-center justify-center">
          {allocationText}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button disabled className="w-full sm:w-auto min-h-[52px] md:min-h-[56px] px-10 rounded-[14px] bg-[#b93829]/50 text-white font-bold text-[17px] md:text-[18px] cursor-not-allowed">
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

  let citiesKey = "SEOUL_BUSAN";
  if (draft.selectedCities.includes("SEOUL") && draft.selectedCities.includes("BUSAN")) {
    citiesKey = "SEOUL_BUSAN";
  } else if (draft.selectedCities.includes("SEOUL")) {
    citiesKey = "SEOUL";
  } else if (draft.selectedCities.includes("BUSAN")) {
    citiesKey = "BUSAN";
  }

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

  const handleCitiesChange = (key: string) => {
    let cities: SupportedCity[] = ["SEOUL", "BUSAN"];
    if (key === "SEOUL") cities = ["SEOUL"];
    if (key === "BUSAN") cities = ["BUSAN"];

    const newAllocations = calculateDefaultNightAllocation(cities, draft.totalNights);
    setDraft((prev) => ({
      ...prev,
      selectedCities: cities,
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
    const seoul = draft.cityNightAllocations.SEOUL || 0;
    const busan = draft.cityNightAllocations.BUSAN || 0;

    if (draft.selectedCities.includes("SEOUL") && draft.selectedCities.includes("BUSAN")) {
      return dict.landing.allocationSeoulBusan
        .replace("{seoul}", String(seoul))
        .replace("{busan}", String(busan));
    } else if (draft.selectedCities.includes("SEOUL")) {
      return dict.landing.allocationSeoulOnly.replace("{seoul}", String(seoul));
    } else if (draft.selectedCities.includes("BUSAN")) {
      return dict.landing.allocationBusanOnly.replace("{busan}", String(busan));
    }
    return "";
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
      if (firstError === "invalid_target_budget") errMsg = dict.landing.validation.invalidTargetBudget;
      
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
            
            {/* Stepper */}
            <div className="inline-flex items-center gap-1.5 border-b-2 border-dashed border-[#dedede] hover:border-[#b93829] focus-within:border-[#b93829] bg-[#faf9f7] hover:bg-slate-100/60 px-3 py-1 rounded transition-colors select-none min-h-[48px]">
              <button
                type="button"
                onClick={() => handleNightsChange(Math.max(1, totalNights - 1))}
                disabled={totalNights <= 1}
                aria-label="Decrease nights"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-[#b93829] hover:text-white disabled:opacity-40 text-[#1d1d1f] font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="font-bold text-[#b93829] px-1 text-center min-w-[72px] text-[17px]">
                {totalNights}-night
              </span>
              <button
                type="button"
                onClick={() => handleNightsChange(Math.min(14, totalNights + 1))}
                disabled={totalNights >= 14}
                aria-label="Increase nights"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-[#b93829] hover:text-white disabled:opacity-40 text-[#1d1d1f] font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <span>trip for</span>

            {/* Travelers Selector */}
            <div className="relative inline-block border-b-2 border-dashed border-[#dedede] hover:border-[#b93829] focus-within:border-[#b93829] bg-[#faf9f7] hover:bg-slate-100/60 px-3 py-1 rounded transition-colors min-h-[48px] leading-[44px]">
              <select
                value={adultCount}
                onChange={(e) => handleAdultsChange(Number(e.target.value))}
                className="appearance-none bg-transparent pr-5 font-bold text-[#b93829] text-[17px] cursor-pointer focus:outline-none text-center"
                aria-label="Number of travelers"
              >
                <option value={1}>1 person</option>
                <option value={2}>2 people</option>
                <option value={3}>3 people</option>
                <option value={4}>4 people</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">▼</span>
            </div>

            <span>to</span>

            {/* Cities Selector */}
            <div className="relative inline-block border-b-2 border-dashed border-[#dedede] hover:border-[#b93829] focus-within:border-[#b93829] bg-[#faf9f7] hover:bg-slate-100/60 px-3 py-1 rounded transition-colors min-h-[48px] leading-[44px]">
              <select
                value={citiesKey}
                onChange={(e) => handleCitiesChange(e.target.value)}
                className="appearance-none bg-transparent pr-5 font-bold text-[#b93829] text-[17px] cursor-pointer focus:outline-none text-center"
                aria-label="Destination cities"
              >
                <option value="SEOUL_BUSAN">Seoul and Busan</option>
                <option value="SEOUL">Seoul</option>
                <option value="BUSAN">Busan</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">▼</span>
            </div>

            <span>{BUDGET_TENSE_MAP[budgetTier].pre}</span>

            {/* Budget Tier Selector */}
            <div className="relative inline-block border-b-2 border-dashed border-[#dedede] hover:border-[#b93829] focus-within:border-[#b93829] bg-[#faf9f7] hover:bg-slate-100/60 px-3 py-1 rounded transition-colors min-h-[48px] leading-[44px]">
              <select
                value={budgetTier}
                onChange={(e) => handleBudgetChange(e.target.value as BudgetTier)}
                className="appearance-none bg-transparent pr-5 font-bold text-[#b93829] text-[17px] cursor-pointer focus:outline-none text-center"
                aria-label="Budget tier"
              >
                <option value="BUDGET">Budget</option>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">▼</span>
            </div>

            <span>{BUDGET_TENSE_MAP[budgetTier].post}</span>
          </div>
        </div>

        {/* ================= MOBILE UI: 직관적인 4대 독립 카드 레이아웃 (sm 미만) ================= */}
        <div className="block sm:hidden space-y-6 mb-7">
          
          {/* Card 1: 🗓️ 여행 기간 (Nights Stepper) */}
          <div className="bg-[#faf9f7] p-4 rounded-[16px] border border-[#dedede] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#666b73]">🗓️ 여행 기간 (Nights)</span>
              <span className="text-[17px] font-bold text-[#b93829]">{totalNights}박 ({totalNights + 1}일)</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-[12px] border border-[#dedede]">
              <button
                type="button"
                onClick={() => handleNightsChange(Math.max(1, totalNights - 1))}
                disabled={totalNights <= 1}
                aria-label="Decrease nights"
                className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer min-h-[48px] min-w-[48px]"
              >
                -
              </button>
              <span className="font-bold text-[#1d1d1f] text-[18px]">
                {totalNights} Nights
              </span>
              <button
                type="button"
                onClick={() => handleNightsChange(Math.min(14, totalNights + 1))}
                disabled={totalNights >= 14}
                aria-label="Increase nights"
                className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer min-h-[48px] min-w-[48px]"
              >
                +
              </button>
            </div>
          </div>

          {/* Card 2: 👥 여행 인원 (Travelers) */}
          <div className="bg-[#faf9f7] p-4 rounded-[16px] border border-[#dedede] space-y-3">
            <span className="text-[14px] font-semibold text-[#666b73] block">👥 여행 인원 (Travelers)</span>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((count) => {
                const isSelected = adultCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleAdultsChange(count)}
                    className={`min-h-[48px] py-2.5 rounded-[12px] border text-[15px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-[#fdf2f2] border-2 border-[#b93829] text-[#1d1d1f] font-bold shadow-2xs"
                        : "bg-white border-[#dedede] text-[#666b73] font-semibold hover:border-slate-300"
                    }`}
                  >
                    {isSelected && <span className="text-[#b93829] font-bold text-xs">✓</span>}
                    <span>{count}명</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: 📍 여행 목적지 (Destinations) */}
          <div className="bg-[#faf9f7] p-4 rounded-[16px] border border-[#dedede] space-y-3">
            <span className="text-[14px] font-semibold text-[#666b73] block">📍 여행 목적지 (Destinations)</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "SEOUL_BUSAN", label: "서울 & 부산" },
                { key: "SEOUL", label: "서울 전용" },
                { key: "BUSAN", label: "부산 전용" },
              ].map((cityOpt) => {
                const isSelected = citiesKey === cityOpt.key;
                return (
                  <button
                    key={cityOpt.key}
                    type="button"
                    onClick={() => handleCitiesChange(cityOpt.key)}
                    className={`min-h-[48px] px-2 py-2.5 rounded-[12px] border text-[14px] transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
                      isSelected
                        ? "bg-[#fdf2f2] border-2 border-[#b93829] text-[#1d1d1f] font-bold shadow-2xs"
                        : "bg-white border-[#dedede] text-[#666b73] font-semibold hover:border-slate-300"
                    }`}
                  >
                    {isSelected && <span className="text-[#b93829] font-bold text-xs">✓</span>}
                    <span>{cityOpt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: 💎 예산 스타일 (Budget Tier Cards) */}
          <div className="bg-[#faf9f7] p-4 rounded-[16px] border border-[#dedede] space-y-3">
            <span className="text-[14px] font-semibold text-[#666b73] block">💎 예산 스타일 (Budget Tier)</span>
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
                    className={`min-h-[52px] p-2 rounded-[12px] border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
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

        </div>

        {/* 도시별 숙박일 배분 요약 */}
        <div className="text-center text-[14px] text-[#666b73] font-medium mb-8 sm:mb-10 py-2 px-4 rounded-full bg-[#faf9f7] max-w-xs mx-auto border border-[#dedede] flex items-center justify-center">
          {getAllocationSummaryText()}
        </div>

        {/* CTA 버튼 & 안내 (데스크톱 및 인라인) */}
        <div className="flex flex-col items-center gap-3">
          {validationError && (
            <div className="text-xs text-[#ef4444] font-semibold mb-2" aria-live="polite">
              ⚠️ {validationError}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[52px] md:min-h-[56px] px-10 rounded-[14px] bg-[#b93829] text-white text-[17px] md:text-[18px] font-bold leading-[1.2] shadow-sm hover:bg-[#a12f22] hover:shadow-md transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#b93829] cursor-pointer"
          >
            {dict.landing.cta}
          </button>
          
          <span className="text-[14px] text-[#666b73] font-normal">
            {dict.landing.helper}
          </span>
        </div>

      </div>

      {/* ================= MOBILE STICKY CTA (모바일 화면 하단 고정 버튼) ================= */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f7]/90 backdrop-blur-md border-t border-[#dedede] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-col items-center shadow-lg">
        <button
          type="submit"
          className="w-full min-h-[52px] rounded-[14px] bg-[#b93829] text-white text-[17px] font-bold leading-[1.2] shadow-md hover:bg-[#a12f22] active:scale-[0.98] cursor-pointer"
        >
          {dict.landing.cta}
        </button>
      </div>

    </form>
  );
}
