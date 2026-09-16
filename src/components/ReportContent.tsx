"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  loadTripDraft,
  loadPlannerPreferencesEx,
  loadSavedPlaceIds,
  loadBudgetPlaces,
} from "../lib/storage-helper";
import { generateInitialBudgetPlan } from "../features/budget/calculations/engine";
import { calculateFoodBasketPlan, calculateCityFoodBasketPlan } from "../features/budget/calculations/food-engine";
import { getPersonalizedTrendRecommendations } from "../lib/trend";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";
import {
  formatKrw,
  formatPercentage,
  getCategoryLabel,
  getBasketLabel,
  getCalculationExpression,
  getCombinedTransportSubtotal,
} from "../features/budget/presentation/formatters";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";
import type { TripDraft, SupportedCity } from "../lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "../lib/trip-domain";
import type { PlannerPreferences, BudgetCategory, BudgetBasketId } from "../features/budget/domain/types";
import {
  TOUR_COURSE_PRESETS,
  ATTRACTION_SPOTS_CATALOG,
  AttractionSpot,
  isSameSpot,
  normalizeSpotKey,
} from "../features/budget/catalog/attraction-spots";
import { THEME_ACTIVITIES_CATALOG, themeActivityToAttractionSpot } from "../features/budget/catalog/theme-activities";
import { STAY_ARCHETYPES, getStayArchetypePrice } from "../features/budget/catalog/stay-archetypes";
import ReportBentoDashboard from "./report/ReportBentoDashboard";
import ReportShareBar from "./report/ReportShareBar";

interface ReportContentProps {
  locale: Locale;
  dict: Dictionary;
}

export default function ReportContent({ locale, dict }: ReportContentProps) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [preferences, setPreferences] = useState<PlannerPreferences | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [budgetPlaces, setBudgetPlaces] = useState<any[]>([]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      try {
        const loadedDraft = loadTripDraft();
        setDraft(loadedDraft);
        if (loadedDraft) {
          const res = loadPlannerPreferencesEx(loadedDraft);
          if (res.status === "valid") {
            setPreferences(res.preferences);
          }
        }
        setSavedPlaceIds(loadSavedPlaceIds());
        setBudgetPlaces(loadBudgetPlaces());
      } catch (error) {
        console.error("Failed to load report data:", error);
      } finally {
        setIsHydrated(true);
      }
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // 플랜 유효성 검증
  const hasValidPlan = draft && preferences && draft.selectedCities && draft.selectedCities.length > 0;

  // 플래너와 100% 동일한 정밀 계산 로직
  const calculations = useMemo(() => {
    if (!draft || !preferences) return null;

    const adultCount = draft.adultCount || 1;
    const totalNights = draft.totalNights || 1;
    const travelDays = totalNights + 1;

    // 1. 순수 기본 플랜 (엔진 임의 관광지 'NONE' 처리)
    const basePlan = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG, {
      accommodation: preferences.accommodationByCity,
      foodTier: preferences.foodTier,
      food: preferences.foodOverrides,
      foodAddOns: preferences.addOnSelections,
      foodBasketSelections: preferences.foodBasketSelections,
      attraction: draft.selectedCities.reduce((acc, c) => ({ ...acc, [c]: "NONE" as BudgetBasketId }), {}),
      attractionSelections: undefined,
      attractionCustomDailyKrw: undefined,
      emergencyFundKrw: 0,
      intercityTransportOverrides: preferences.intercityTransportOverrides,
      localTransitStyle: preferences.localTransitStyle,
      cityTransitStyles: preferences.cityTransitStyles,
      isKobusPassApplied: preferences.isKobusPassApplied,
      occupancyMode: (preferences as any).occupancyModeByCity,
    });

    // 2. 전체 푸드 바스켓 연산 (사용자가 담은 음식만 100% 정직하게 계산)
    const totalFoodBasketPlan = calculateFoodBasketPlan(
      preferences.foodBasketSelections || [],
      totalNights,
      adultCount
    );

    // 3. 도시별 정밀 내역 구성
    const cityBreakdown: Record<
      string,
      {
        nights: number;
        stayTotalKrw: number;
        stayItemLabel: string;
        stayNightlyPrice: number;
        hasStay: boolean;
        foodTotalKrw: number;
        foodBasketPlan: any;
        transportTotalKrw: number;
        attractionTotalKrw: number;
        selectedSpots: AttractionSpot[];
        subtotalKrw: number;
      }
    > = {};

    let sumAccTotal = 0;
    let sumFoodTotal = 0;
    let sumTransportTotal = 0;
    let sumAttractionTotal = 0;
    let sumCitySubtotals = 0;

    draft.selectedCities.forEach((city) => {
      const nights = draft.cityNightAllocations[city] || 0;
      const section = basePlan.citySections[city];

      // A. 숙박 (사용자가 선택한 아키타입/커스텀 숙소만)
      const accSelection = preferences.accommodationByCity?.[city];
      let stayTotal = 0;
      let stayLabel = locale === "ko" ? "선택된 숙소 없음" : "No stay selected";
      let stayNightly = 0;
      let hasStay = false;

      if (accSelection) {
        if (typeof accSelection === "object" && (accSelection as any).kind === "CUSTOM") {
          const custom = accSelection as any;
          stayNightly = custom.customPriceKrw || 0;
          stayTotal = stayNightly * Math.max(1, nights);
          stayLabel = custom.placeName || (locale === "ko" ? "직접 입력 숙소" : "Custom Stay");
          hasStay = true;
        } else {
          const archId = typeof accSelection === "string" ? accSelection : (accSelection as any).basketId || (accSelection as any).archetypeId;
          const arch = STAY_ARCHETYPES.find((a) => a.id === archId);
          if (arch) {
            stayNightly = getStayArchetypePrice(city, arch.id);
            stayTotal = stayNightly * Math.max(1, nights);
            stayLabel = locale === "ko" ? arch.titleKo : arch.titleEn;
            hasStay = true;
          }
        }
      }

      // B. 음식 (사용자가 해당 도시 탭에서 바스켓에 담은 음식만)
      const cityFoodBasket = calculateCityFoodBasketPlan(
        city,
        nights,
        totalNights,
        totalFoodBasketPlan,
        adultCount
      );
      const foodTotal = cityFoodBasket.grandTotalKrw;

      // C. 교통 (도시 내 일일 대중교통)
      const transportItems = section?.lineItems?.filter((i) => i.category === "CITY_TRANSPORT") || [];
      const transportTotal = transportItems.reduce((sum, i) => sum + i.lineTotalKrw, 0);

      // D. 관광 (사용자가 해당 도시에서 직접 담은 명소 및 액티비티만)
      const citySel = preferences.attractionSelections?.[city] || { selectedCourseIds: [], individualSpotIds: [] };
      const spotsForCity: AttractionSpot[] = [
        ...ATTRACTION_SPOTS_CATALOG.filter((s) => s.cityCode === city),
        ...THEME_ACTIVITIES_CATALOG.filter((act) => act.cityCode === city).map(themeActivityToAttractionSpot),
      ];

      const selectedSpotKeys = new Set<string>();
      (citySel.selectedCourseIds || []).forEach((cid) => {
        const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
        if (course) course.spotIds.forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));
      });
      (citySel.individualSpotIds || []).forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));

      const selectedSpotsList: AttractionSpot[] = [];
      let attractionTotal = 0;
      selectedSpotKeys.forEach((normKey) => {
        const spot = spotsForCity.find((s) => isSameSpot(s.id, normKey)) || ATTRACTION_SPOTS_CATALOG.find((s) => isSameSpot(s.id, normKey));
        if (spot) {
          selectedSpotsList.push(spot);
          if (spot.priceStatus === "PAID" && spot.price > 0) {
            attractionTotal += spot.price * adultCount;
          }
        }
      });

      const citySub = stayTotal + foodTotal + transportTotal + attractionTotal;

      cityBreakdown[city] = {
        nights,
        stayTotalKrw: stayTotal,
        stayItemLabel: stayLabel,
        stayNightlyPrice: stayNightly,
        hasStay,
        foodTotalKrw: foodTotal,
        foodBasketPlan: cityFoodBasket,
        transportTotalKrw: transportTotal,
        attractionTotalKrw: attractionTotal,
        selectedSpots: selectedSpotsList,
        subtotalKrw: citySub,
      };

      sumAccTotal += stayTotal;
      sumFoodTotal += foodTotal;
      sumTransportTotal += transportTotal;
      sumAttractionTotal += attractionTotal;
      sumCitySubtotals += citySub;
    });

    // 4. 도시 간 이동 교통 요금 (KTX)
    const intercityTotal = basePlan.intercitySection.subtotalKrw;

    // 5. 기본 여행 경비 = 도시별 순수 합산 + 도시 간 교통
    const baseTripExpensesKrw = sumCitySubtotals + intercityTotal;

    // 6. 공통 자율 예산 (쇼핑 / 일일 용돈 / 비상금)
    // 플래너에서 설정된 자율 예산 단가와 동일 연산
    const dailyAllowancePerPerson = preferences.attractionCustomDailyKrw !== undefined
      ? preferences.attractionCustomDailyKrw
      : 30000;
    const totalDailyAllowanceKrw = dailyAllowancePerPerson * adultCount * totalNights;

    // 쇼핑 예산
    const shoppingAmountKrw = (preferences as any).shoppingAmountKrw || 0;

    // 비상금 (기본 여행 경비 + 쇼핑 + 용돈의 10%)
    const baseEmergencyGrandTotal = baseTripExpensesKrw + shoppingAmountKrw + totalDailyAllowanceKrw;
    const emergencyPct = preferences.emergencyFundPct !== undefined
      ? preferences.emergencyFundPct
      : 0.10;
    const computedEmergencyKrw = emergencyPct > 0
      ? Math.round(((baseEmergencyGrandTotal / adultCount) * emergencyPct) / 1000) * 1000 * adultCount
      : (preferences.emergencyFundKrw || 0);

    // 최종 총액
    const grandTotalKrw = baseEmergencyGrandTotal + computedEmergencyKrw;
    const perTravelerTotalKrw = Math.round(grandTotalKrw / adultCount);
    const dailyAverageKrw = Math.round(grandTotalKrw / travelDays);

    return {
      basePlan,
      cityBreakdown,
      sumAccTotal,
      sumFoodTotal,
      sumTransportTotal,
      sumAttractionTotal,
      intercityTotal,
      sumCitySubtotals,
      baseTripExpensesKrw,
      shoppingAmountKrw,
      dailyAllowancePerPerson,
      totalDailyAllowanceKrw,
      emergencyPct,
      computedEmergencyKrw,
      grandTotalKrw,
      perTravelerTotalKrw,
      dailyAverageKrw,
      adultCount,
      totalNights,
      travelDays,
    };
  }, [draft, preferences, locale]);

  if (!isHydrated) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-200 border-t-[#0f172a]"></div>
          <p className="text-xs font-semibold text-slate-500 tracking-tight">
            {locale === "ko" ? "예산 리포트를 불러오는 중입니다..." : "Loading travel budget report..."}
          </p>
        </div>
      </div>
    );
  }

  // 예산이 전혀 편성되지 않았거나 계산 데이터가 없을 때
  if (!hasValidPlan || !calculations || calculations.grandTotalKrw === 0) {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-100 flex flex-col items-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-[#e25c5c]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {locale === "ko" ? "아직 편성된 여행 예산이 없습니다" : dict.planner.missingTitle}
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
            {locale === "ko"
              ? "예산 리포트를 확인하시려면 먼저 플래너에서 여행 일정과 예산을 편성해 주세요."
              : dict.planner.missingDescription}
          </p>
          <button
            onClick={() => router.push(`/${locale}/planner`)}
            className="mt-6 flex w-full items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#0f172a] text-white hover:bg-slate-800 font-extrabold text-sm shadow-sm transition-all cursor-pointer"
          >
            <span>{locale === "ko" ? "여행 예산 편성하러 가기" : dict.planner.missingButton}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const {
    basePlan,
    cityBreakdown,
    sumAccTotal,
    sumFoodTotal,
    sumTransportTotal,
    sumAttractionTotal,
    intercityTotal,
    sumCitySubtotals,
    shoppingAmountKrw,
    dailyAllowancePerPerson,
    totalDailyAllowanceKrw,
    emergencyPct,
    computedEmergencyKrw,
    grandTotalKrw,
    perTravelerTotalKrw,
    dailyAverageKrw,
    adultCount,
    totalNights,
    travelDays,
  } = calculations;

  // 개인화 트렌드 팁
  const personalizedTrends = draft && preferences
    ? getPersonalizedTrendRecommendations({
        draft,
        preferences,
        savedPlaceIds,
        locale,
      })
    : [];

  // 목표 예산 건강성 계산
  const targetBudget = basePlan.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(grandTotalKrw - targetBudget);
  const targetUsagePercent = targetBudget > 0 ? (grandTotalKrw / targetBudget) * 100 : 0;

  // 카테고리 비중 계산
  const safeGrandTotal = Math.max(1, grandTotalKrw);
  const categoryGauges = [
    { label: locale === "ko" ? "숙소" : "Stay", amount: sumAccTotal, color: "bg-blue-500" },
    { label: locale === "ko" ? "음식" : "Food", amount: sumFoodTotal, color: "bg-amber-500" },
    { label: locale === "ko" ? "교통" : "Transit", amount: sumTransportTotal + intercityTotal, color: "bg-indigo-500" },
    { label: locale === "ko" ? "관광" : "Attr", amount: sumAttractionTotal, color: "bg-emerald-500" },
    { label: locale === "ko" ? "자율/비상금" : "Flex", amount: shoppingAmountKrw + totalDailyAllowanceKrw + computedEmergencyKrw, color: "bg-purple-500" },
  ].map((c) => ({
    ...c,
    pct: Math.round((c.amount / safeGrandTotal) * 100),
  }));

  const safeCitySum = Math.max(1, sumCitySubtotals);
  const cityPalette = [
    { bg: "bg-slate-800" },
    { bg: "bg-indigo-600" },
    { bg: "bg-emerald-600" },
    { bg: "bg-amber-600" },
  ];

  // 추천 코스 필터링 (최대 2개 엄선)
  const recommendedCourses = TOUR_COURSE_PRESETS.filter((course) =>
    draft.selectedCities.includes(course.cityCode as SupportedCity)
  ).slice(0, 2);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 text-slate-800 print:p-0 print:space-y-4">
      {/* 1. Header with Route & Metadata (Craft.do 감성의 단정한 글래스 카드) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] print:border-b-2 print:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold tracking-tight text-teal-800 uppercase bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                HypeHeritage Travel Report
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                {totalNights}{locale === "ko" ? "박 " : "N "}{travelDays}{locale === "ko" ? "일" : "D"} · {adultCount}{locale === "ko" ? "인 성인" : " Adults"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              {dict.planner.reportTitle}
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              {dict.planner.reportSubtitle}
            </p>
          </div>

          {/* Action Tools for Print / Edit */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/planner`)}
              className="inline-flex h-9 px-4 items-center gap-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-transform duration-150 ease-out active:scale-95 cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>{dict.planner.reportBackToPlanner}</span>
            </button>
          </div>
        </div>

        {/* Selected Cities Tag Strip */}
        <div className="pt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600">
          <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">ROUTE:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {draft.selectedCities.map((city, idx) => {
              const cityName = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
              const nights = draft.cityNightAllocations[city] || 0;
              return (
                <React.Fragment key={city}>
                  <span className="bg-neutral-100/80 border border-neutral-200/60 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
                    {cityName} ({nights === 0 ? (locale === "ko" ? "당일" : "Day") : `${nights}${locale === "ko" ? "박" : "N"}`})
                  </span>
                  {idx < draft.selectedCities.length - 1 && (
                    <span className="text-neutral-300 font-bold text-xs">➔</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Executive Bento Grid Dashboard (Apple & Craft.do Asymmetric Grid) */}
      <ReportBentoDashboard
        calculations={calculations}
        draft={draft}
        locale={locale}
        dict={dict}
      />

      {/* 3. Balanced 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BUDGET ARCHITECTURE & CITY AUDIT (6 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card: Budget Architecture Visual Gauges */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                {locale === "ko" ? "예산 구조 분석 및 지출 비중" : "Budget Architecture & Allocation"}
              </h2>
            </div>

            {/* Category Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">{locale === "ko" ? "카테고리별 비중" : "Category Breakdown"}</span>
                <span className="font-bold text-slate-900 text-xs tabular-nums">{formatKrw(grandTotalKrw)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
                {categoryGauges.map((item, idx) => {
                  if (item.pct <= 0) return null;
                  return (
                    <div
                      key={idx}
                      style={{ width: `${item.pct}%` }}
                      className={`${item.color} transition-all duration-300 relative`}
                      title={`${item.label}: ${item.pct}% (${formatKrw(item.amount)})`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-5 gap-1.5 pt-1 text-xs">
                {categoryGauges.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 min-w-0">
                    <span className={`h-2 w-2 rounded-full ${item.color} shrink-0`}></span>
                    <span className="font-semibold text-slate-700 truncate text-[10px]">{item.label}</span>
                    <span className="font-bold text-slate-900 ml-auto text-[10px] tabular-nums">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* City Gauge */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">{locale === "ko" ? "도시별 비중" : "City Allocation"}</span>
                <span className="font-bold text-slate-900 text-xs tabular-nums">{formatKrw(sumCitySubtotals)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
                {draft.selectedCities.map((city, idx) => {
                  const sub = cityBreakdown[city]?.subtotalKrw || 0;
                  const pct = Math.round((sub / safeCitySum) * 100);
                  if (pct <= 0) return null;
                  const palette = cityPalette[idx % cityPalette.length];
                  return (
                    <div
                      key={city}
                      style={{ width: `${pct}%` }}
                      className={`${palette.bg} transition-all duration-300 relative`}
                      title={`${CITY_KOREAN_NAMES[city] || city}: ${pct}% (${formatKrw(sub)})`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs">
                {draft.selectedCities.map((city, idx) => {
                  const sub = cityBreakdown[city]?.subtotalKrw || 0;
                  const pct = Math.round((sub / safeCitySum) * 100);
                  const palette = cityPalette[idx % cityPalette.length];
                  const cityName = locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city);
                  return (
                    <div key={city} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${palette.bg} shrink-0`}></span>
                      <span className="font-semibold text-slate-700 text-[11px]">{cityName}</span>
                      <span className="font-bold text-slate-900 text-[11px] tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card: City Financial Audit Table */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                {locale === "ko" ? "도시별 4대 부문 지출 집계" : "City-by-City Expense Breakdown"}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-medium">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2 font-bold">{locale === "ko" ? "도시" : "City"}</th>
                    <th className="py-2 text-center font-bold">{locale === "ko" ? "체류" : "Nights"}</th>
                    <th className="py-2 text-right font-bold">{locale === "ko" ? "숙소" : "Stay"}</th>
                    <th className="py-2 text-right font-bold">{locale === "ko" ? "음식" : "Food"}</th>
                    <th className="py-2 text-right font-bold">{locale === "ko" ? "교통" : "Transit"}</th>
                    <th className="py-2 text-right font-bold">{locale === "ko" ? "관광" : "Attr"}</th>
                    <th className="py-2 text-right font-black text-slate-900">{locale === "ko" ? "소계" : "Subtotal"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {draft.selectedCities.map((city) => {
                    const cInfo = cityBreakdown[city];
                    if (!cInfo) return null;

                    return (
                      <tr key={city} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900">
                          {locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                        </td>
                        <td className="py-2.5 text-center text-slate-500 text-[11px] tabular-nums">
                          {cInfo.nights === 0 ? (locale === "ko" ? "당일" : "Day") : `${cInfo.nights}N`}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-slate-600 font-medium">{formatKrw(cInfo.stayTotalKrw)}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-600 font-medium">{formatKrw(cInfo.foodTotalKrw)}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-600 font-medium">{formatKrw(cInfo.transportTotalKrw)}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-600 font-medium">{formatKrw(cInfo.attractionTotalKrw)}</td>
                        <td className="py-2.5 text-right tabular-nums font-black text-slate-900">{formatKrw(cInfo.subtotalKrw)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Recommended Tour Courses (Curated Route Guide) */}
          {recommendedCourses.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  {locale === "ko" ? "선택 도시 추천 코스 & 최적 동선 가이드" : "Curated Route & Tour Presets"}
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase">RECOMMENDED</span>
              </div>

              <div className="space-y-3 pt-1">
                {recommendedCourses.map((course) => {
                  const cityName = locale === "ko"
                    ? CITY_KOREAN_NAMES[course.cityCode as SupportedCity] || course.cityCode
                    : CITY_ENGLISH_NAMES[course.cityCode as SupportedCity] || course.cityCode;

                  return (
                    <div
                      key={course.id}
                      className="p-3.5 rounded-2xl border border-neutral-200/70 bg-neutral-50/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-neutral-900 text-white px-2 py-0.5 rounded-full uppercase">
                            {cityName}
                          </span>
                          <h3 className="text-xs font-bold text-slate-900">
                            {locale === "ko" ? course.nameKo : course.nameEn}
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                          {locale === "ko" ? `약 ${course.estimatedHours}시간` : `~${course.estimatedHours}h`}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {locale === "ko" ? course.descKo : course.descEn}
                      </p>

                      {/* Route Spots Sequence */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {course.spotIds.map((sid, sIdx) => {
                          const spot = ATTRACTION_SPOTS_CATALOG.find((s) => s.id === sid);
                          const spotName = spot ? (locale === "ko" ? spot.nameKo : spot.nameEn) : sid;
                          return (
                            <React.Fragment key={sid}>
                              <span className="text-[10px] font-medium bg-white text-slate-800 px-2.5 py-0.5 rounded-full border border-neutral-200/80 shadow-2xs">
                                {spotName}
                              </span>
                              {sIdx < course.spotIds.length - 1 && (
                                <span className="text-neutral-300 text-[10px] font-bold">➔</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card: Personalized K-Trend Tips */}
          {personalizedTrends.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  {dict.trendSection.personalizedTitle}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {personalizedTrends.slice(0, 2).map(({ trend, reason }, idx) => {
                  const trans = trend.translations[locale === "en" ? "en" : "ko"];
                  const cityName = trend.city === "ALL"
                    ? (locale === "en" ? "All Cities" : "전체 도시")
                    : (locale === "en" ? CITY_ENGLISH_NAMES[trend.city as SupportedCity] || trend.city : CITY_KOREAN_NAMES[trend.city as SupportedCity] || trend.city);

                  return (
                    <div
                      key={trend.id || idx}
                      className="p-3.5 rounded-2xl border border-neutral-200/70 bg-neutral-50/70 flex flex-col justify-between space-y-2 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-neutral-700 bg-white border border-neutral-200/80 px-2 py-0.5 rounded-full inline-block">
                          {cityName}
                        </span>
                        <h3 className="font-bold text-slate-900">{trans.title}</h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{trans.overview}</p>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-200/50 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700">{reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: OFFICIAL SMART RECEIPT (사용자가 직접 담은 항목만 100% 일치) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
            {/* Receipt Header */}
            <div className="bg-neutral-50/80 border-b border-neutral-200/70 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-widest text-slate-400 block uppercase font-bold">
                  ITEMIZED EXPENSE AUDIT
                </span>
                <h2 className="text-base font-black tracking-tight text-slate-900 mt-0.5">
                  {locale === "ko" ? "스마트 예산 영수증 세부 내역" : "Smart Budget Receipt"}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">GRAND TOTAL</span>
                <span className="text-base sm:text-lg font-black tabular-nums text-slate-900">
                  {formatKrw(grandTotalKrw)}
                </span>
              </div>
            </div>

            {/* Receipt Items Body */}
            <div className="p-4 sm:p-5 space-y-5 divide-y divide-slate-100 text-xs">
              {/* 공통 자율 예산 (쇼핑, 용돈, 비상금) */}
              {(shoppingAmountKrw > 0 || totalDailyAllowanceKrw > 0 || computedEmergencyKrw > 0) && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {locale === "ko" ? "공통 자율 예산 (쇼핑 · 용돈 · 비상금)" : "Common Flexible Expenses"}
                  </span>
                  <div className="space-y-2">
                    {shoppingAmountKrw > 0 && (
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {locale === "ko" ? "쇼핑 예산" : "Shopping Budget"}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {locale === "ko" ? "한국 여행 자율 쇼핑 예산" : "Custom shopping budget"}
                          </span>
                        </div>
                        <strong className="font-black text-slate-900 tabular-nums shrink-0">
                          {formatKrw(shoppingAmountKrw)}
                        </strong>
                      </div>
                    )}

                    {totalDailyAllowanceKrw > 0 && (
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {locale === "ko" ? "일일 용돈" : "Daily Allowance"}
                          </span>
                          <span className="text-[10px] text-slate-400 block tabular-nums">
                            {formatKrw(dailyAllowancePerPerson)} × {adultCount}인 × {totalNights}박
                          </span>
                        </div>
                        <strong className="font-black text-slate-900 tabular-nums shrink-0">
                          {formatKrw(totalDailyAllowanceKrw)}
                        </strong>
                      </div>
                    )}

                    {computedEmergencyKrw > 0 && (
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {locale === "ko" ? "여행 비상금" : "Emergency Fund"}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {emergencyPct > 0 ? `기본 경비 대비 ${Math.round(emergencyPct * 100)}%` : "고정 비상금"}
                          </span>
                        </div>
                        <strong className="font-black text-slate-900 tabular-nums shrink-0">
                          {formatKrw(computedEmergencyKrw)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 도시별 실제 선택 내역 */}
              {draft.selectedCities.map((city) => {
                const cInfo = cityBreakdown[city];
                if (!cInfo) return null;

                const cityName = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
                const foodItems = cInfo.foodBasketPlan?.selectedItems || [];

                return (
                  <div key={city} className="pt-4 first:pt-0 space-y-3">
                    {/* 도시 헤더 */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm">{cityName}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({cInfo.nights === 0 ? (locale === "ko" ? "당일치기" : "Day trip") : `${cInfo.nights}${locale === "ko" ? "박" : "N"}`})
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-xs tabular-nums">
                        {formatKrw(cInfo.subtotalKrw)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* 1. 숙박 */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                {locale === "ko" ? "숙소" : "Stay"}
                              </span>
                              <span className="font-bold text-slate-800">
                                {cInfo.stayItemLabel}
                              </span>
                            </div>
                            {cInfo.hasStay && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                                1박 {formatKrw(cInfo.stayNightlyPrice)} × {cInfo.nights}박
                              </span>
                            )}
                          </div>
                          <strong className="font-bold text-slate-900 tabular-nums shrink-0">
                            {formatKrw(cInfo.stayTotalKrw)}
                          </strong>
                        </div>
                      </div>

                      {/* 2. 음식 */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-50">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                {locale === "ko" ? "음식" : "Food"}
                              </span>
                              <span className="font-bold text-slate-800">
                                {foodItems.length > 0
                                  ? (locale === "ko" ? `담은 대표 음식 (${foodItems.length}종)` : `Selected Foods (${foodItems.length})`)
                                  : (locale === "ko" ? "담은 음식 없음" : "No foods selected")}
                              </span>
                            </div>
                          </div>
                          <strong className="font-bold text-slate-900 tabular-nums shrink-0">
                            {formatKrw(cInfo.foodTotalKrw)}
                          </strong>
                        </div>

                        {/* 선택된 음식 품목 목록 */}
                        {foodItems.length > 0 && (
                          <div className="pl-4 pt-1 space-y-1 border-l-2 border-slate-100">
                            {foodItems.map((fItem: any) => {
                              const fName = locale === "ko" ? fItem.food.nameKo : fItem.food.nameEn;
                              return (
                                <div key={fItem.food.id} className="flex justify-between items-center text-[11px] text-slate-600">
                                  <span className="truncate pr-2">
                                    {fName} ×{fItem.quantity}
                                  </span>
                                  <span className="tabular-nums font-medium text-slate-700 shrink-0">
                                    {formatKrw(fItem.subtotalKrw)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 3. 시내 교통 */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-50">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                {locale === "ko" ? "교통" : "Transit"}
                              </span>
                              <span className="font-bold text-slate-800">
                                {cityName} {locale === "ko" ? "시내 대중교통" : "Local Transit"}
                              </span>
                            </div>
                          </div>
                          <strong className="font-bold text-slate-900 tabular-nums shrink-0">
                            {formatKrw(cInfo.transportTotalKrw)}
                          </strong>
                        </div>
                      </div>

                      {/* 4. 관광 & 액티비티 */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-50">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                {locale === "ko" ? "관광" : "Attr"}
                              </span>
                              <span className="font-bold text-slate-800">
                                {cInfo.selectedSpots.length > 0
                                  ? (locale === "ko" ? `담은 명소 · 액티비티 (${cInfo.selectedSpots.length}곳)` : `Selected Spots (${cInfo.selectedSpots.length})`)
                                  : (locale === "ko" ? "담은 관광지 없음" : "No attractions selected")}
                              </span>
                            </div>
                          </div>
                          <strong className="font-bold text-slate-900 tabular-nums shrink-0">
                            {formatKrw(cInfo.attractionTotalKrw)}
                          </strong>
                        </div>

                        {/* 선택된 명소 & 액티비티 품목 목록 */}
                        {cInfo.selectedSpots.length > 0 && (
                          <div className="pl-4 pt-1 space-y-1 border-l-2 border-slate-100">
                            {cInfo.selectedSpots.map((spot) => {
                              const sName = locale === "ko" ? spot.nameKo : spot.nameEn;
                              const isActivity = (spot as any).categoryType === "액티비티" || spot.id.startsWith("act_");
                              const isFree = spot.priceStatus === "FREE" || spot.price === 0;
                              return (
                                <div key={spot.id} className="flex justify-between items-center text-[11px]">
                                  <span className="truncate pr-2 text-slate-700 flex items-center gap-1">
                                    {isActivity && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">
                                        액티비티
                                      </span>
                                    )}
                                    {sName}
                                  </span>
                                  <span className="tabular-nums font-medium text-slate-900 shrink-0">
                                    {isFree ? (locale === "ko" ? "무료" : "Free") : formatKrw(spot.price * adultCount)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 도시 간 이동 교통 (KTX) */}
              {intercityTotal > 0 && (
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-black text-slate-900 text-sm">
                      {dict.planner.intercityTransportation}
                    </span>
                    <span className="font-bold text-slate-900 text-xs tabular-nums">
                      {formatKrw(intercityTotal)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {basePlan.intercitySection.lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-3">
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {item.sourceLabel || getBasketLabel(item.basketId, dict, locale)}
                          </span>
                          <span className="text-[10px] text-slate-400 block tabular-nums">
                            {getCalculationExpression(item, dict, locale)}
                          </span>
                        </div>
                        <strong className="font-bold text-slate-900 tabular-nums shrink-0">
                          {formatKrw(item.lineTotalKrw)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Footer Stamp */}
            <div className="bg-slate-50 border-t border-slate-200/80 p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-slate-700">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>HypeHeritage Verified Travel Budget</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {locale === "ko"
                  ? "본 리포트는 플래너에서 직접 담은 바스켓 데이터를 기반으로 산출된 공식 예산 내역입니다."
                  : "Certified travel budget plan calculated from your actual planner selections."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Report Storage & Share Bar (인쇄 / PDF / 공유하기 / 링크 복사) */}
      <ReportShareBar locale={locale} />
    </div>
  );
}
