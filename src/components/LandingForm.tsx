"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  TripDraft,
  SupportedCity,
  BudgetTier,
  DEFAULT_TRIP_DRAFT,
  calculateDefaultNightAllocation,
  validateTripDraft,
} from "src/lib/trip-domain";
import { saveTripDraft, loadTripDraft } from "src/lib/storage-helper";
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

// useSyncExternalStore용 stable no-op subscribe 및 스냅샷 함수
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function LandingForm({ locale, dict }: LandingFormProps) {
  // React 표준 useSyncExternalStore를 활용해 Hydration 완료 여부를 감지합니다.
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isHydrated) {
    // 1. 서버 렌더링 및 최초 Hydration 상태: 기본값(DEFAULT_TRIP_DRAFT)을 적용한 정적 비활성 폼 제공
    return <StaticLandingForm dict={dict} />;
  }

  // 2. Hydration 완료 후: 로컬스토리지를 Lazy Loading 하여 바인딩된 동적 클라이언트 전용 폼 제공
  return <HydratedLandingForm locale={locale} dict={dict} />;
}

/**
 * 1. 서버 렌더링 및 최초 클라이언트 Hydration용 정적 폼 컴포넌트
 */
function StaticLandingForm({ dict }: { dict: Dictionary }) {
  const defaultNights = DEFAULT_TRIP_DRAFT.totalNights;
  const defaultBudget = DEFAULT_TRIP_DRAFT.budgetTier;

  // 기본 배분 요약 텍스트
  const allocationText = dict.landing.allocationSeoulBusan
    .replace("{seoul}", "3")
    .replace("{busan}", "2");

  return (
    <div className="w-full flex flex-col items-center opacity-70 pointer-events-none">
      <div className="w-full bg-white border border-[#e2e8f0]/60 rounded-2xl p-6 md:p-12 shadow-sm">
        <div className="text-center text-xl md:text-2xl font-semibold leading-relaxed tracking-tight text-[#0f172a] mb-8">
          <div className="flex flex-wrap justify-center items-center gap-y-4 gap-x-2">
            <span>I&apos;m planning a</span>
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 bg-slate-50 px-2 py-0.5 rounded">
              <select disabled value={defaultNights} className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] text-center" aria-label="Trip duration">
                <option value={5}>5-night</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
            </div>
            <span>trip for</span>
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 bg-slate-50 px-2 py-0.5 rounded">
              <select disabled value={2} className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] text-center" aria-label="Number of travelers">
                <option value={2}>2 adults</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
            </div>
            <span>to</span>
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 bg-slate-50 px-2 py-0.5 rounded">
              <select disabled value="SEOUL_BUSAN" className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] text-center" aria-label="Destination">
                <option value="SEOUL_BUSAN">Seoul and Busan</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
            </div>
            <span>{BUDGET_TENSE_MAP[defaultBudget].pre}</span>
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 bg-slate-50 px-2 py-0.5 rounded">
              <select disabled value={defaultBudget} className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] text-center" aria-label="Budget tier">
                <option value="STANDARD">Standard</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
            </div>
            <span>{BUDGET_TENSE_MAP[defaultBudget].post}</span>
          </div>
        </div>

        <div className="text-center text-sm text-slate-400 font-medium mb-12 py-1.5 px-4 rounded-full bg-slate-50 max-w-xs mx-auto border border-slate-100/80 min-h-[36px] flex items-center justify-center">
          {allocationText}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button disabled className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#e25c5c]/50 text-white font-bold shadow cursor-not-allowed">
            {dict.landing.cta}
          </button>
          <span className="text-xs text-slate-400">{dict.landing.helper}</span>
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

  // Lazy Initial State를 통해 타이머/Effect 없이 동기적으로 로컬스토리지를 단 1회 안전하게 로딩 및 주입합니다.
  const [draft, setDraft] = useState<TripDraft>(() => loadTripDraft());
  const [validationError, setValidationError] = useState<string | null>(null);

  // draft 상태값을 편리한 로컬 바인딩 변수로 변환
  const totalNights = draft.totalNights;
  const adultCount = draft.adultCount;
  const budgetTier = draft.budgetTier;

  // selectedCities 배열에 따라 selector 키 산출
  let citiesKey = "SEOUL_BUSAN";
  if (draft.selectedCities.includes("SEOUL") && draft.selectedCities.includes("BUSAN")) {
    citiesKey = "SEOUL_BUSAN";
  } else if (draft.selectedCities.includes("SEOUL")) {
    citiesKey = "SEOUL";
  } else if (draft.selectedCities.includes("BUSAN")) {
    citiesKey = "BUSAN";
  }

  const getSelectedCitiesArray = (key: string): SupportedCity[] => {
    if (key === "SEOUL") return ["SEOUL"];
    if (key === "BUSAN") return ["BUSAN"];
    return ["SEOUL", "BUSAN"];
  };

  // select 변경 핸들러 모음
  const handleNightsChange = (nights: number) => {
    setDraft((prev) => {
      const nextCities = prev.selectedCities;
      return {
        ...prev,
        totalNights: nights,
        cityNightAllocations: calculateDefaultNightAllocation(nextCities, nights),
      };
    });
  };

  const handleAdultsChange = (adults: number) => {
    setDraft((prev) => ({
      ...prev,
      adultCount: adults,
    }));
  };

  const handleCitiesChange = (key: string) => {
    setDraft((prev) => {
      const nextCities = getSelectedCitiesArray(key);
      return {
        ...prev,
        selectedCities: nextCities,
        cityNightAllocations: calculateDefaultNightAllocation(nextCities, prev.totalNights),
      };
    });
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

    router.push(`/${locale}/planner`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
      {/* Mad-libs Input Card */}
      <div className="w-full bg-white border border-[#e2e8f0]/60 rounded-2xl p-6 md:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
        
        {/* 영어 고정 Mad-libs 문장 */}
        <div className="text-center text-xl md:text-2xl font-semibold leading-relaxed tracking-tight text-[#0f172a] mb-8">
          <div className="flex flex-wrap justify-center items-center gap-y-4 gap-x-2">
            <span>I&apos;m planning a</span>
            
            {/* Nights Selector */}
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 hover:border-[#e25c5c] focus-within:border-[#e25c5c] bg-slate-50/50 hover:bg-slate-100/50 px-2 py-0.5 rounded transition-colors">
              <select
                value={totalNights}
                onChange={(e) => handleNightsChange(Number(e.target.value))}
                className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] cursor-pointer focus:outline-none text-center"
                aria-label="Trip duration in nights"
              >
                <option value={3}>3-night</option>
                <option value={5}>5-night</option>
                <option value={7}>7-night</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">▼</span>
            </div>

            <span>trip for</span>

            {/* Travelers Selector */}
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 hover:border-[#e25c5c] focus-within:border-[#e25c5c] bg-slate-50/50 hover:bg-slate-100/50 px-2 py-0.5 rounded transition-colors">
              <select
                value={adultCount}
                onChange={(e) => handleAdultsChange(Number(e.target.value))}
                className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] cursor-pointer focus:outline-none text-center"
                aria-label="Number of travelers"
              >
                <option value={1}>1 adult</option>
                <option value={2}>2 adults</option>
                <option value={3}>3 adults</option>
                <option value={4}>4 adults</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">▼</span>
            </div>

            <span>to</span>

            {/* Cities Selector */}
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 hover:border-[#e25c5c] focus-within:border-[#e25c5c] bg-slate-50/50 hover:bg-slate-100/50 px-2 py-0.5 rounded transition-colors">
              <select
                value={citiesKey}
                onChange={(e) => handleCitiesChange(e.target.value)}
                className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] cursor-pointer focus:outline-none text-center"
                aria-label="Destination cities"
              >
                <option value="SEOUL_BUSAN">Seoul and Busan</option>
                <option value="SEOUL">Seoul</option>
                <option value="BUSAN">Busan</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">▼</span>
            </div>

            {/* 예산 등급에 따른 자연스러운 영어 어구 결합 */}
            <span>{BUDGET_TENSE_MAP[budgetTier].pre}</span>

            {/* Budget Tier Selector */}
            <div className="relative inline-block border-b-2 border-dashed border-slate-300 hover:border-[#e25c5c] focus-within:border-[#e25c5c] bg-slate-50/50 hover:bg-slate-100/50 px-2 py-0.5 rounded transition-colors">
              <select
                value={budgetTier}
                onChange={(e) => handleBudgetChange(e.target.value as BudgetTier)}
                className="appearance-none bg-transparent pr-4 font-bold text-[#e25c5c] cursor-pointer focus:outline-none text-center"
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

        {/* 도시별 숙박일 배분 상태 요약 */}
        <div className="text-center text-sm text-slate-500 font-medium mb-12 py-1.5 px-4 rounded-full bg-slate-50 max-w-xs mx-auto border border-slate-100/80 min-h-[36px] flex items-center justify-center">
          {getAllocationSummaryText()}
        </div>

        {/* CTA 버튼 및 안내 */}
        <div className="flex flex-col items-center gap-3">
          {validationError && (
            <div className="text-xs text-[#ef4444] font-semibold mb-2" aria-live="polite">
              ⚠️ {validationError}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#e25c5c] text-white font-bold shadow hover:bg-[#d14b4b] hover:shadow-md transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e25c5c] cursor-pointer"
          >
            {dict.landing.cta}
          </button>
          
          <span className="text-xs text-slate-400">
            {dict.landing.helper}
          </span>
        </div>
      </div>
    </form>
  );
}
