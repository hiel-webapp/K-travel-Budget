"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TripDraft,
  SupportedCity,
  BudgetTier,
  DEFAULT_TRIP_DRAFT,
  EMPTY_TRIP_DRAFT,
  calculateDefaultNightAllocation,
  validateTripDraft,
  getCitiesSentenceLabel,
  CITY_KOREAN_NAMES,
} from "src/lib/trip-domain";
import {
  saveTripDraft,
  loadTripDraft,
  saveActiveDraft,
  loadActiveDraft,
  clearActiveDraft,
  savePlannerPreferences,
} from "src/lib/storage-helper";
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4">
            <span className="text-[15px] font-bold text-[#1d1d1f]">🗓️ 1단계: 여행 기간 설정</span>
          </div>
          <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4">
            <span className="text-[15px] font-bold text-[#1d1d1f]">👥 2단계: 여행 인원 선택</span>
          </div>
          <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4">
            <span className="text-[15px] font-bold text-[#1d1d1f]">📍 3단계: 여행 목적지 선택</span>
          </div>
        </div>

        <div className="text-center text-[14px] text-[#666b73] font-medium mb-8 py-2 px-4 rounded-full bg-[#faf9f7] max-w-sm mx-auto border border-[#dedede] flex items-center justify-center">
          💡 여행 정보(기간, 인원, 목적지)를 선택해 주세요.
        </div>

        <div className="flex flex-col items-center gap-3">
          <button disabled className="w-full sm:w-auto min-h-[52px] md:min-h-[56px] px-10 rounded-[14px] bg-slate-200 text-slate-400 font-bold text-[17px] md:text-[18px] cursor-not-allowed border border-slate-300">
            {dict.landing.cta}
          </button>
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

  const [initialData] = useState(() => loadActiveDraft());
  const [draft, setDraft] = useState<TripDraft>(initialData.draft);
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(
    (initialData.mobileStep as 1 | 2 | 3) || 1
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalNights = draft.totalNights;
  const adultCount = draft.adultCount;

  const isFormComplete =
    totalNights !== null &&
    adultCount !== null &&
    draft.selectedCities.length >= 1;

  // 실시간 입력 정보 자동 보존 (새로고침 및 메인 이동 시에도 보존)
  useEffect(() => {
    saveActiveDraft(draft, mobileStep);
  }, [draft, mobileStep]);

  const handleResetDraft = () => {
    clearActiveDraft();
    setDraft(EMPTY_TRIP_DRAFT);
    setMobileStep(1);
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
      <div className="w-full bg-[#ffffff] border border-[#dedede] rounded-[20px] p-5 sm:p-8 md:p-10 shadow-xs transition-shadow duration-300">

        <div className="hidden sm:block mb-8">
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1d1d1f]">내 한국 여행 예산 만들기</h2>
              <p className="text-xs text-[#666b73] mt-1">아래 3개 단계를 선택하여 나만의 맞춤 한국 여행 예산을 구성해 보세요.</p>
            </div>
            {(totalNights !== null || adultCount !== null || draft.selectedCities.length > 0) && (
              <button
                type="button"
                onClick={handleResetDraft}
                className="text-xs font-semibold text-slate-500 hover:text-[#b93829] flex items-center gap-1 transition-colors cursor-pointer bg-slate-100 hover:bg-red-50 px-3.5 py-1.5 rounded-full border border-slate-200"
              >
                <span>↺</span>
                <span>일정 초기화</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">🗓️ 1단계: 여행 기간 설정</span>
                <span className="text-xs font-extrabold text-[#b93829]">
                  {totalNights !== null ? `${totalNights}박 (${totalNights + 1}일)` : "미선택"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-[14px] border border-[#dedede]">
                <button
                  type="button"
                  onClick={() => handleNightsChange(Math.max(1, (totalNights || 5) - 1))}
                  disabled={(totalNights || 1) <= 1}
                  aria-label="Decrease nights"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="font-extrabold text-[#1d1d1f] text-[17px] block">
                    {totalNights !== null ? `${totalNights} Nights` : "기간 선택"}
                  </span>
                  <span className="text-[11px] text-[#666b73]">
                    {totalNights !== null ? `${totalNights + 1}일간의 한국 여행` : "박수 선택"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNightsChange(Math.min(14, (totalNights || 0) + 1))}
                  disabled={(totalNights || 0) >= 14}
                  aria-label="Increase nights"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="pt-1">
                <span className="text-xs font-semibold text-[#666b73] block mb-2">자주 찾는 일정 빠른 선택:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 7, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleNightsChange(preset)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
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

            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">👥 2단계: 여행 인원 선택</span>
                <span className="text-xs font-extrabold text-[#b93829]">
                  {adultCount !== null ? `${adultCount}명` : "미선택"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-[14px] border border-[#dedede]">
                <button
                  type="button"
                  onClick={() => handleAdultsChange(Math.max(1, (adultCount || 2) - 1))}
                  disabled={(adultCount || 1) <= 1}
                  aria-label="Decrease travelers"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="font-extrabold text-[#1d1d1f] text-[17px] block">
                    {adultCount !== null ? `${adultCount} ${adultCount === 1 ? "Person" : "People"}` : "인원 선택"}
                  </span>
                  <span className="text-[11px] text-[#666b73]">
                    {adultCount !== null ? `${adultCount}명의 한국 여행` : "인원 선택 (최대 10명)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdultsChange(Math.min(10, (adultCount || 0) + 1))}
                  disabled={(adultCount || 0) >= 10}
                  aria-label="Increase travelers"
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-lg transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="pt-1">
                <span className="text-xs font-semibold text-[#666b73] block mb-2">자주 찾는 인원 빠른 선택:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((countPreset) => (
                    <button
                      key={countPreset}
                      type="button"
                      onClick={() => handleAdultsChange(countPreset)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
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
                      className={`min-h-[42px] px-1.5 py-1.5 rounded-[12px] border text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
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
          </div>
        </div>

        <div className="block sm:hidden mb-6">
          {validationError && (
            <div className="text-xs text-[#ef4444] font-semibold mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-center" aria-live="polite">
              ⚠️ {validationError}
            </div>
          )}

          <div className="mb-5">
            <div className="flex items-center justify-between text-xs font-bold text-[#666b73] mb-2 px-1">
              <span className="text-[#b93829] font-extrabold">{mobileStep}단계 / 3단계</span>
              <div className="flex items-center gap-2">
                <span>
                  {mobileStep === 1 && "1. 여행 기간 설정"}
                  {mobileStep === 2 && "2. 여행 인원 선택"}
                  {mobileStep === 3 && "3. 여행 목적지 선택"}
                </span>
                {(totalNights !== null || adultCount !== null || draft.selectedCities.length > 0) && (
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    className="text-[11px] font-semibold text-slate-500 hover:text-[#b93829] bg-slate-100 hover:bg-red-50 px-2 py-0.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
                  >
                    ↺ 초기화
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

          {mobileStep === 1 && (
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">🗓️ 1단계: 여행 기간 설정</span>
                <span className="text-[17px] font-extrabold text-[#b93829]">
                  {totalNights !== null ? `${totalNights}박 (${totalNights + 1}일)` : "미선택"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-[14px] border border-[#dedede]">
                <button type="button" onClick={() => handleNightsChange(Math.max(1, (totalNights || 5) - 1))} disabled={(totalNights || 1) <= 1} className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-xl transition-colors cursor-pointer">-</button>
                <div className="text-center">
                  <span className="font-extrabold text-[#1d1d1f] text-[20px] block">{totalNights !== null ? `${totalNights} Nights` : "기간 선택"}</span>
                  <span className="text-xs text-[#666b73]">{totalNights !== null ? `${totalNights + 1}일간의 한국 여행` : "박수 선택"}</span>
                </div>
                <button type="button" onClick={() => handleNightsChange(Math.min(14, (totalNights || 0) + 1))} disabled={(totalNights || 0) >= 14} className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-xl transition-colors cursor-pointer">+</button>
              </div>
            </div>
          )}
          {mobileStep === 2 && (
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">👥 2단계: 여행 인원 선택</span>
                <span className="text-xs font-extrabold text-[#b93829]">{adultCount !== null ? `${adultCount}명` : "미선택"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-[14px] border border-[#dedede]">
                <button type="button" onClick={() => handleAdultsChange(Math.max(1, (adultCount || 2) - 1))} disabled={(adultCount || 1) <= 1} className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-xl transition-colors cursor-pointer">-</button>
                <div className="text-center">
                  <span className="font-extrabold text-[#1d1d1f] text-xl block">{adultCount !== null ? `${adultCount} ${adultCount === 1 ? "Person" : "People"}` : "인원 선택"}</span>
                  <span className="text-xs text-[#666b73]">{adultCount !== null ? `${adultCount}명의 한국 여행` : "인원 선택 (최대 10명)"}</span>
                </div>
                <button type="button" onClick={() => handleAdultsChange(Math.min(10, (adultCount || 0) + 1))} disabled={(adultCount || 0) >= 10} className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-[#b93829] hover:text-white disabled:opacity-30 text-[#1d1d1f] font-bold text-xl transition-colors cursor-pointer">+</button>
              </div>
            </div>
          )}
          {mobileStep === 3 && (
            <div className="bg-[#faf9f7] p-5 rounded-[18px] border border-[#dedede] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#1d1d1f]">📍 3단계: 여행 목적지 선택</span>
                <span className="text-xs text-[#b93829] font-bold">다중 선택 ({draft.selectedCities.length}/4)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ALL_CITY_OPTIONS.map((cityOpt) => (
                  <button key={cityOpt.key} type="button" onClick={() => toggleCitySelection(cityOpt.key)} className={`min-h-[48px] px-2 py-2.5 rounded-[12px] border text-[14px] transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${draft.selectedCities.includes(cityOpt.key) ? "bg-[#fdf2f2] border-2 border-[#b93829] text-[#1d1d1f] font-bold shadow-2xs" : "bg-white border-[#dedede] text-[#666b73] font-semibold hover:border-slate-300"}`}>
                    {draft.selectedCities.includes(cityOpt.key) && <span className="text-[#b93829] font-bold text-xs">✓</span>}
                    {cityOpt.nameKo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex text-center text-[14px] text-[#666b73] font-medium mb-6 py-2 px-4 rounded-full bg-[#faf9f7] max-w-sm mx-auto border border-[#dedede] items-center justify-center">
          {getAllocationSummaryText()}
        </div>

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
            {isFormComplete ? dict.landing.helper : "3가지 필수 여행 항목(기간, 인원, 목적지)을 모두 선택해 주세요."}
          </span>
        </div>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f7]/95 backdrop-blur-md border-t border-[#dedede] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg flex flex-col gap-2">
        <div className="text-center text-xs font-semibold text-slate-600 py-1.5 px-3 rounded-full bg-white border border-[#dedede] w-full truncate shadow-2xs">
          {getAllocationSummaryText()}
        </div>

        {mobileStep === 1 && (
          <button type="button" disabled={totalNights === null} onClick={() => setMobileStep(2)} className={`w-full min-h-[50px] rounded-[14px] text-[16px] font-bold transition-all ${totalNights !== null ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"}`}>
            {totalNights !== null ? "다음 단계 (2/3 인원 선택) →" : "여행 기간을 선택해 주세요"}
          </button>
        )}

        {mobileStep === 2 && (
          <div className="flex items-center gap-2 w-full">
            <button type="button" onClick={() => setMobileStep(1)} className="w-1/3 min-h-[50px] rounded-[14px] bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 cursor-pointer">← 이전</button>
            <button type="button" disabled={adultCount === null} onClick={() => setMobileStep(3)} className={`w-2/3 min-h-[50px] rounded-[14px] text-[15px] font-bold transition-all ${adultCount !== null ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"}`}>
              {adultCount !== null ? "다음 단계 (3/3 목적지) →" : "여행 인원을 선택해 주세요"}
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
              type="submit"
              disabled={!isFormComplete}
              className={`w-2/3 min-h-[50px] rounded-[14px] font-extrabold text-[16px] transition-all flex items-center justify-center gap-1 ${
                isFormComplete
                  ? "bg-[#b93829] text-white shadow-md hover:bg-[#a12f22] cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              }`}
            >
              <span>{isFormComplete ? `${dict.landing.cta} 🚀` : "목적지 1개 이상 선택 필요"}</span>
            </button>
          </div>
        )}
      </div>

    </form>
  );
}
