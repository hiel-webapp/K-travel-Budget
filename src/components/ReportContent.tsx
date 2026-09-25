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
import { useExchangeRate } from "../lib/hooks/useExchangeRate";
import { formatPriceByLocale } from "../lib/currency/currency-converter";
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
  registerCustomAttractionSpots,
} from "../features/budget/catalog/attraction-spots";
import { THEME_ACTIVITIES_CATALOG, themeActivityToAttractionSpot } from "../features/budget/catalog/theme-activities";
import { STAY_ARCHETYPES, getStayArchetypePrice } from "../features/budget/catalog/stay-archetypes";
import { calculateTripBudgetSummary } from "../features/budget/calculations/trip-budget-calculator";
import ReportBentoDashboard from "./report/ReportBentoDashboard";
import ExpenseAnalyticsHub from "./report/ExpenseAnalyticsHub";
import SmartRouteMap from "./report/SmartRouteMap";
import BookingActionHub from "./report/BookingActionHub";
import TravelHelpline1330 from "./report/TravelHelpline1330";
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
  const [dbAttractionsByCity, setDbAttractionsByCity] = useState<Record<string, AttractionSpot[]>>({});
  const { rate: usdRate } = useExchangeRate();
  const [expandedReceiptCities, setExpandedReceiptCities] = useState<Record<string, boolean>>({});

  const toggleReceiptCity = (cityKey: string) => {
    setExpandedReceiptCities((prev) => ({
      ...prev,
      [cityKey]: prev[cityKey] === undefined ? false : !prev[cityKey],
    }));
  };

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      try {
        const loadedDraft = loadTripDraft();
        setDraft(loadedDraft);
        if (loadedDraft) {
          const res = loadPlannerPreferencesEx(loadedDraft);
          if (res.preferences) {
            setPreferences(res.preferences);
          }

          // 도시별 최신 관광지 DB 카탈로그 프리페치 (플래너와 100% 동일한 DB 명소 입장료 동기화)
          if (Array.isArray(loadedDraft.selectedCities)) {
            loadedDraft.selectedCities.forEach(async (city) => {
              try {
                const res = await fetch(`/api/catalog/attractions?city=${city}`);
                const json = await res.json();
                const validData = Array.isArray(json.data)
                  ? json.data.filter((spot: any) => spot.cityCode === city)
                  : [];
                if (json.success && validData.length > 0) {
                  registerCustomAttractionSpots(validData);
                  setDbAttractionsByCity((prev) => ({
                    ...prev,
                    [city]: validData,
                  }));
                }
              } catch (e) {
                console.warn("[Report] Failed to fetch city attractions for:", city, e);
              }
            });
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

  // 플래너와 100% 동일한 정밀 종합 예산 계산
  const calculations = useMemo(() => {
    if (!draft || !preferences) return null;
    return calculateTripBudgetSummary(draft, preferences, budgetPlaces, locale, dbAttractionsByCity);
  }, [draft, preferences, budgetPlaces, locale, dbAttractionsByCity]);

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
  if (!hasValidPlan || !calculations) {
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

  // 목표 예산 건강성 계산
  const targetBudget = basePlan.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(grandTotalKrw - targetBudget);
  const targetUsagePercent = targetBudget > 0 ? (grandTotalKrw / targetBudget) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 text-slate-800 print:p-0 print:space-y-4">
      {/* 1. Header with Route & Metadata (Craft.do 감성의 단정한 글래스 카드) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] print:border-b-2 print:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
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

        {/* Selected Cities Tag Strip with Travel Duration & Adults */}
        <div className="pt-3 flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-semibold text-neutral-600">
          <span className="bg-neutral-100/80 border border-neutral-200/60 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
            {totalNights}{locale === "ko" ? "박 " : "N "}{travelDays}{locale === "ko" ? "일" : "D"}
          </span>
          <span className="bg-neutral-100/80 border border-neutral-200/60 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
            {adultCount}{locale === "ko" ? "인 성인" : " Adults"}
          </span>
          <span className="text-neutral-300 font-bold text-xs">·</span>
          <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider shrink-0">ROUTE:</span>
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

      {/* 2. Executive Total Budget & Pacing Summary Banner (Section A) */}
      <ReportBentoDashboard
        calculations={calculations}
        draft={draft}
        locale={locale}
        dict={dict}
      />

      {/* 3. Unified Expense Analytics Hub (Section B: Category Donut + City Donut + City Audit Table) */}
      <ExpenseAnalyticsHub
        calculations={calculations}
        draft={draft}
        locale={locale}
        dict={dict}
        usdRate={usdRate}
      />

      {/* 4. Balanced 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: ITINERARY, BOOKING & HELPLINE (8 COLS / ~68%) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section C: Interactive Smart Route & Kakao Map */}
          <SmartRouteMap
            selectedCities={draft.selectedCities}
            cityBreakdown={cityBreakdown}
            locale={locale}
            dict={dict}
            usdRate={usdRate}
          />

          {/* Section D: One-Stop Booking & Action Hub */}
          <BookingActionHub
            calculations={calculations}
            draft={draft}
            locale={locale}
            dict={dict}
            usdRate={usdRate}
          />

          {/* Section E: 1330 Korea Travel Helpline Banner */}
          <TravelHelpline1330 locale={locale} />
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: STICKY OFFICIAL SMART RECEIPT (4 COLS / ~32%) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col max-h-[calc(100vh-5.5rem)]">
            {/* Receipt Header (고정) */}
            <div className="bg-neutral-50/80 border-b border-neutral-200/70 px-4 py-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
              <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 truncate">
                {locale === "ko" ? "내 한국 여행 영수증" : "My Korea Travel Receipt"}
              </h2>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                  {totalNights}{locale === "ko" ? "박" : "N"} · {adultCount}{locale === "ko" ? "인" : " Travelers"}
                </span>
              </div>
            </div>

            {/* Receipt Items Body (독립 스크롤 영역) */}
            <div className="p-3.5 sm:p-4 space-y-3.5 divide-y divide-slate-100 text-xs overflow-y-auto overscroll-contain flex-1 pr-1.5">
              {/* 여정 타임라인 및 도시별 접이식 아코디언 카드 (도시 간 이동 교통 포함) */}
              {(() => {
                const allTransitItems = basePlan.intercitySection?.lineItems || [];
                const entryItems = allTransitItems.filter((i) => (i.route && i.route.startsWith("ENTRY_")) || (i.sourceLabel && i.sourceLabel.includes("[입국 공항]")));
                const exitItems = allTransitItems.filter((i) => (i.route && i.route.startsWith("EXIT_")) || (i.sourceLabel && i.sourceLabel.includes("[출국 공항]")));
                const transitItems = allTransitItems.filter((i) => !entryItems.includes(i) && !exitItems.includes(i));

                const formatSimplifiedTransit = (item: any) => {
                  let raw = (locale === "ko" ? item.sourceLabel : (item.sourceLabelEn || item.sourceLabel)) || getBasketLabel(item.basketId, dict, locale) || "";
                  raw = raw.replace(/\[입국 공항\]|\[도시 간\]|\[출국 공항\]/g, "").trim();

                  const isJejuRoute = (item.route && item.route.includes("JEJU")) || raw.includes("제주");

                  let mode = "";
                  if ((raw.includes("항공") || isJejuRoute) && (raw.includes("버스") || raw.includes("시외") || raw.includes("리무진"))) {
                    mode = locale === "ko" ? "항공+버스" : "Flight+Bus";
                  } else if ((raw.includes("항공") || isJejuRoute) && (raw.includes("KTX") || raw.includes("열차") || raw.includes("기차") || raw.includes("이음") || raw.includes("ITX"))) {
                    mode = locale === "ko" ? "항공+KTX" : "Flight+KTX";
                  } else if ((raw.includes("항공") || isJejuRoute) && (raw.includes("공항철도") || raw.includes("AREX"))) {
                    mode = locale === "ko" ? "항공+공항철도" : "Flight+Airport Express";
                  } else if (
                    raw.includes("항공") ||
                    raw.includes("비행기") ||
                    raw.toLowerCase().includes("flight") ||
                    (isJejuRoute && (raw.includes("공항") || raw.includes("일반석") || raw.includes("특가") || raw.includes("할인석")))
                  ) {
                    mode = locale === "ko" ? "국내선 항공" : "Domestic Flight";
                  } else if (raw.includes("KTX") || raw.includes("SRT") || raw.includes("고속철도") || raw.includes("이음") || raw.includes("기차")) {
                    mode = raw.includes("SRT") ? "SRT" : "KTX";
                  } else if (raw.includes("공항철도") || raw.includes("AREX")) {
                    mode = locale === "ko" ? "공항철도" : "Airport Express";
                  } else if (raw.includes("고속버스") || raw.includes("우등") || raw.includes("KOBUS")) {
                    mode = locale === "ko" ? "고속버스" : "Express Bus";
                  } else if (raw.includes("시외버스") || raw.includes("공항버스") || raw.includes("리무진") || raw.includes("버스타고") || raw.toLowerCase().includes("bus")) {
                    mode = locale === "ko" ? "공항/시외버스" : "Bus";
                  } else {
                    const match = raw.match(/\(([^)]+)\)/);
                    if (match) {
                      mode = match[1].replace(/표준\/정규형|일반석|우등|직통|버스타고/g, "").trim();
                    }
                    if (!mode && isJejuRoute) {
                      mode = locale === "ko" ? "국내선 항공" : "Domestic Flight";
                    }
                  }

                  let routeName = "";
                  if (item.route) {
                    if (item.route.startsWith("ENTRY_")) {
                      const parts = item.route.replace("ENTRY_", "").split("-");
                      const airportCode = parts[0] || "INCHEON";
                      const targetCity = parts[1] || "";
                      const airportName = airportCode === "INCHEON" ? (locale === "ko" ? "인천공항" : "Incheon Airport") : (locale === "ko" ? "공항" : "Airport");
                      const targetCityName = (locale === "ko" ? CITY_KOREAN_NAMES[targetCity as SupportedCity] : CITY_ENGLISH_NAMES[targetCity as SupportedCity]) || targetCity;
                      routeName = `${airportName} ➔ ${targetCityName}`;
                    } else if (item.route.startsWith("EXIT_")) {
                      const parts = item.route.replace("EXIT_", "").split("-");
                      const sourceCity = parts[0] || "";
                      const airportCode = parts[1] || "INCHEON";
                      const sourceCityName = (locale === "ko" ? CITY_KOREAN_NAMES[sourceCity as SupportedCity] : CITY_ENGLISH_NAMES[sourceCity as SupportedCity]) || sourceCity;
                      const airportName = airportCode === "INCHEON" ? (locale === "ko" ? "인천공항" : "Incheon Airport") : (locale === "ko" ? "공항" : "Airport");
                      routeName = `${sourceCityName} ➔ ${airportName}`;
                    } else {
                      const parts = item.route.split("-");
                      if (parts.length === 2) {
                        const fromName = (locale === "ko" ? CITY_KOREAN_NAMES[parts[0] as SupportedCity] : CITY_ENGLISH_NAMES[parts[0] as SupportedCity]) || parts[0];
                        const toName = (locale === "ko" ? CITY_KOREAN_NAMES[parts[1] as SupportedCity] : CITY_ENGLISH_NAMES[parts[1] as SupportedCity]) || parts[1];
                        routeName = `${fromName} ➔ ${toName}`;
                      }
                    }
                  }

                  if (!routeName) {
                    routeName = raw.replace(/\([^)]*\)/g, "").trim();
                  }

                  return { routeName, modeName: mode, rawLabel: raw };
                };

                const renderTransitConnector = (transitItem: any, key: string) => {
                  const info = formatSimplifiedTransit(transitItem);
                  const subtext = (locale === "ko" ? transitItem.sourceLabel : (transitItem.sourceLabelEn || transitItem.sourceLabel)) || "";
                  return (
                    <div key={key} className="relative py-1 flex items-center justify-center my-1">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dashed border-slate-300"></div>
                      </div>
                      <div
                        className="relative flex items-center justify-between gap-2 max-w-[96%] px-2.5 py-0.5 rounded-full bg-slate-100/95 border border-slate-300/80 text-[11px] shadow-2xs text-slate-700"
                        title={subtext}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 truncate font-bold text-[10px]">
                          <span className="truncate text-slate-800">{info.routeName}</span>
                          {info.modeName && (
                            <span className="text-[9.5px] text-slate-500 font-medium shrink-0">
                              ({info.modeName})
                            </span>
                          )}
                        </div>
                        <span className="font-sans tabular-nums font-black text-slate-900 shrink-0 text-[11px] pl-1.5 border-l border-slate-300/70">
                          {formatPriceByLocale(transitItem.lineTotalKrw, locale, usdRate)}
                        </span>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-3 pt-2">
                    {/* 1. 입국 공항 이동 (첫 도시 전 타임라인 구분선 커넥터) */}
                    {entryItems.length > 0 && (
                      <div className="relative py-1 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-dashed border-slate-300"></div>
                        </div>
                        <div
                          className="relative flex items-center justify-between gap-2 max-w-[96%] px-2.5 py-0.5 rounded-full bg-slate-100/95 border border-slate-300/80 text-[11px] shadow-2xs text-slate-700"
                          title={entryItems.map((i) => i.sourceLabel).join(" / ")}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 truncate font-bold text-[10px]">
                            <span className="truncate text-slate-800">
                              {entryItems.map((i) => formatSimplifiedTransit(i).routeName).join(", ")}
                            </span>
                            {entryItems[0] && formatSimplifiedTransit(entryItems[0]).modeName && (
                              <span className="text-[9.5px] text-slate-500 font-medium shrink-0">
                                ({formatSimplifiedTransit(entryItems[0]).modeName})
                              </span>
                            )}
                          </div>
                          <span className="font-sans tabular-nums font-black text-slate-900 shrink-0 text-[11px] pl-1.5 border-l border-slate-300/70">
                            {formatPriceByLocale(entryItems.reduce((sum, item) => sum + item.lineTotalKrw, 0), locale, usdRate)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 2. 도시별 접이식 아코디언 카드 및 도시 간 이동 교통 */}
                    {draft.selectedCities.map((city, cityIdx) => {
                      const cInfo = cityBreakdown[city];
                      if (!cInfo) return null;

                      const cityName = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
                      const foodItems = cInfo.foodBasketPlan?.selectedItems || [];

                      const accordionKey = `${city}-${cityIdx}`;
                      const isExpanded = expandedReceiptCities[accordionKey] !== false;

                      // 다음 도시로 이동하는 교통 아이템
                      const nextCity = draft.selectedCities[cityIdx + 1];
                      const transitToNext = nextCity ? (
                        transitItems.find((i) => i.route === `${city}-${nextCity}` || i.route === `${nextCity}-${city}`) || transitItems[cityIdx]
                      ) : null;

                      return (
                        <div key={accordionKey} className="space-y-2.5">
                          {/* 도시 접이식 아코디언 카드 */}
                          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all">
                            {/* 도시 헤더 (토글 버튼) */}
                            <button
                              type="button"
                              onClick={() => toggleReceiptCity(accordionKey)}
                              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-[#e25c5c] shrink-0"></span>
                                <span className="text-[13px] font-black text-[#0f172a] truncate">{cityName}</span>
                                <span className="text-[10.5px] font-bold text-slate-400 shrink-0">
                                  ({cInfo.nights === 0 ? (locale === "ko" ? "당일치기" : "Day trip") : `${cInfo.nights}${locale === "ko" ? "박" : "N"}`})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-black text-slate-900 tabular-nums">
                                  {formatPriceByLocale(cInfo.subtotalKrw, locale, usdRate)}
                                </span>
                                <span className="text-slate-400 font-bold text-[10px] w-3 text-center">
                                  {isExpanded ? "▲" : "▼"}
                                </span>
                              </div>
                            </button>

                            {/* 도시 내부 항목 (펼쳤을 때만 노출) */}
                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/30 text-xs">
                                {/* 1. 숙박 */}
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                          {locale === "ko" ? "숙소" : "Stay"}
                                        </span>
                                        <span className="font-bold text-slate-800">
                                          {(() => {
                                            const accSel = preferences.accommodationByCity?.[city];
                                            const isSplit = accSel && typeof accSel === "object" && "kind" in accSel && (accSel as any).kind === "SPLIT";
                                            if (isSplit) {
                                              return locale === "ko" ? "분할 숙박 (Split Stay)" : "Split Stay";
                                            }
                                            return cInfo.stayItemLabel;
                                          })()}
                                        </span>
                                      </div>
                                      {cInfo.hasStay && (
                                        <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                                          {locale === "ko"
                                            ? `1박 ${formatKrw(cInfo.stayNightlyPrice)} × ${cInfo.nights}박`
                                            : `${formatPriceByLocale(cInfo.stayNightlyPrice, locale, usdRate)}/night × ${cInfo.nights}N`}
                                        </span>
                                      )}
                                      {(() => {
                                        const accSel = preferences.accommodationByCity?.[city];
                                        if (accSel && typeof accSel === "object" && "kind" in accSel && (accSel as any).kind === "SPLIT" && Array.isArray((accSel as any).segments)) {
                                          return (
                                            <div className="mt-1.5 space-y-0.5 border-l-2 border-rose-300 pl-2 text-[10.5px] text-slate-600">
                                              {(accSel as any).segments.map((seg: any, sIdx: number) => {
                                                let segName = seg.placeNameKo;
                                                if (locale === "en") segName = seg.placeNameEn || seg.placeNameKo;
                                                const bId = seg.basketId;
                                                const arch = STAY_ARCHETYPES.find((a) => (a.id as string) === (bId as string));
                                                if (!segName || segName === "호텔" || segName === "Hotel") {
                                                  if (arch) {
                                                    segName = locale === "ko" ? arch.titleKo : arch.titleEn;
                                                  } else if (bId === "HOSTEL_GUESTHOUSE" || bId === "BUDGET_STAY") {
                                                    segName = locale === "ko" ? "호스텔 & 게스트하우스" : "Hostel & Guesthouse";
                                                  } else if (bId === "HANOK_BOUTIQUE") {
                                                    segName = locale === "ko" ? "한옥 스테이" : "Hanok Stay";
                                                  } else if (bId === "LUXURY_SKYLINE" || bId === "PREMIUM_HERITAGE") {
                                                    segName = locale === "ko" ? "5성급 럭셔리 호텔" : "5-Star Luxury";
                                                  } else if (bId === "BUSINESS_HOTEL" || bId === "STANDARD_HOTEL") {
                                                    segName = locale === "ko" ? "도심 비즈니스 호텔" : "Business Hotel";
                                                  } else {
                                                    segName = locale === "ko" ? "도심 비즈니스 호텔" : "Business Hotel";
                                                  }
                                                }
                                                return (
                                                  <div key={sIdx} className="flex justify-between">
                                                    <span>• {segName} ({seg.nights}{locale === "ko" ? "박" : "N"})</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                    <strong className="font-bold text-slate-900 tabular-nums shrink-0">
                                      {formatPriceByLocale(cInfo.stayTotalKrw, locale, usdRate)}
                                    </strong>
                                  </div>
                                </div>

                                {/* 2. 음식 */}
                                <div className="space-y-1 pt-1.5 border-t border-slate-100">
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
                                      {formatPriceByLocale(cInfo.foodTotalKrw, locale, usdRate)}
                                    </strong>
                                  </div>

                                  {/* 선택된 음식 품목 목록 */}
                                  {foodItems.length > 0 && (
                                    <div className="pl-4 pt-1 space-y-1 border-l-2 border-slate-100">
                                      {foodItems.map((fItem: any) => {
                                        const fName = locale === "ko" ? fItem.food.nameKo : fItem.food.nameEn;
                                        const unitPrice = fItem.food.unitPriceKrw || 0;
                                        const qty = fItem.quantity || 1;
                                        const subtext = adultCount > 1
                                          ? (locale === "ko"
                                            ? `1인 ${formatKrw(unitPrice)}${qty > 1 ? ` (${qty}세트)` : ""} × ${adultCount}명`
                                            : `${formatPriceByLocale(unitPrice, locale, usdRate)}/person${qty > 1 ? ` (${qty} sets)` : ""} × ${adultCount} travelers`)
                                          : (qty > 1 ? (locale === "ko" ? `${qty}인분` : `${qty} servings`) : "");
                                        return (
                                          <div key={fItem.food.id} className="flex justify-between items-start text-[11px]">
                                            <div className="space-y-0.5 min-w-0 pr-2">
                                              <span className="font-medium text-slate-700 block truncate">
                                                {fName}
                                              </span>
                                              {subtext && (
                                                <span className="text-[10px] text-slate-400 block tabular-nums">
                                                  {subtext}
                                                </span>
                                              )}
                                            </div>
                                            <span className="tabular-nums font-medium text-slate-700 shrink-0">
                                              {formatPriceByLocale(fItem.subtotalKrw, locale, usdRate)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* 3. 시내 교통 */}
                                <div className="space-y-1 pt-1.5 border-t border-slate-100">
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
                                      {formatPriceByLocale(cInfo.transportTotalKrw, locale, usdRate)}
                                    </strong>
                                  </div>
                                </div>

                                {/* 4. 관광 & 액티비티 */}
                                <div className="space-y-1 pt-1.5 border-t border-slate-100">
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
                                      {formatPriceByLocale(cInfo.attractionTotalKrw, locale, usdRate)}
                                    </strong>
                                  </div>

                                  {/* 선택된 명소 & 액티비티 품목 목록 */}
                                  {cInfo.selectedSpots.length > 0 && (
                                    <div className="pl-4 pt-1 space-y-1 border-l-2 border-slate-100">
                                      {cInfo.selectedSpots.map((spot) => {
                                        const sName = locale === "ko" ? spot.nameKo : spot.nameEn;
                                        const isActivity = (spot as any).categoryType === "액티비티" || spot.id.startsWith("act_");
                                        const isFree = spot.priceStatus === "FREE" || spot.price === 0;
                                        const spotSubtext = (!isFree && adultCount > 1)
                                          ? (locale === "ko"
                                            ? `1인 ${isActivity ? "체험비" : "입장료"} ${formatKrw(spot.price)} × ${adultCount}명`
                                            : `${formatPriceByLocale(spot.price, locale, usdRate)}/person × ${adultCount} travelers`)
                                          : "";
                                        return (
                                          <div key={spot.id} className="flex justify-between items-start text-[11px]">
                                            <div className="space-y-0.5 min-w-0 pr-2">
                                              <span className="truncate text-slate-700 flex items-center gap-1">
                                                {isActivity && (
                                                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">
                                                    {locale === "ko" ? "액티비티" : "Activity"}
                                                  </span>
                                                )}
                                                {sName}
                                              </span>
                                              {spotSubtext && (
                                                <span className="text-[10px] text-slate-400 block tabular-nums">
                                                  {spotSubtext}
                                                </span>
                                              )}
                                            </div>
                                            <span className="tabular-nums font-medium text-slate-900 shrink-0">
                                              {isFree ? (locale === "ko" ? "무료" : "Free") : formatPriceByLocale(spot.price * adultCount, locale, usdRate)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 도시 간 이동 교통 (도시와 다음 도시 사이 커넥터) */}
                          {transitToNext && renderTransitConnector(transitToNext, `transit-${city}-${nextCity}`)}
                        </div>
                      );
                    })}

                    {/* 3. 출국 공항 이동 (마지막 도시 나온 후 타임라인 구분선 커넥터) */}
                    {exitItems.length > 0 && (
                      <div className="relative py-1 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-dashed border-slate-300"></div>
                        </div>
                        <div
                          className="relative flex items-center justify-between gap-2 max-w-[96%] px-2.5 py-0.5 rounded-full bg-slate-100/95 border border-slate-300/80 text-[11px] shadow-2xs text-slate-700"
                          title={exitItems.map((i) => i.sourceLabel).join(" / ")}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 truncate font-bold text-[10px]">
                            <span className="truncate text-slate-800">
                              {exitItems.map((i) => formatSimplifiedTransit(i).routeName).join(", ")}
                            </span>
                            {exitItems[0] && formatSimplifiedTransit(exitItems[0]).modeName && (
                              <span className="text-[9.5px] text-slate-500 font-medium shrink-0">
                                ({formatSimplifiedTransit(exitItems[0]).modeName})
                              </span>
                            )}
                          </div>
                          <span className="font-sans tabular-nums font-black text-slate-900 shrink-0 text-[11px] pl-1.5 border-l border-slate-300/70">
                            {formatPriceByLocale(exitItems.reduce((sum, item) => sum + item.lineTotalKrw, 0), locale, usdRate)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Receipt Bottom Fixed: 쇼핑 예산, 일일 용돈, 여행 비상금, 예산 총액 고정 영역 */}
            <div className="bg-slate-50/95 border-t border-slate-200/90 p-3.5 sm:p-4 space-y-3 shrink-0 backdrop-blur-xs">
              {/* 공통 자율 예산 (쇼핑 · 용돈 · 비상금) */}
              {(shoppingAmountKrw > 0 || totalDailyAllowanceKrw > 0 || computedEmergencyKrw > 0) && (
                <div className="space-y-1.5 pb-2 border-b border-slate-200/70 text-xs">
                  {shoppingAmountKrw > 0 && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {locale === "ko" ? "쇼핑 예산" : "Shopping Budget"}
                      </span>
                      <strong className="font-black text-slate-900 tabular-nums shrink-0">
                        {formatPriceByLocale(shoppingAmountKrw, locale, usdRate)}
                      </strong>
                    </div>
                  )}

                  {totalDailyAllowanceKrw > 0 && (
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-slate-900 shrink-0">
                          {locale === "ko" ? "일일 용돈" : "Daily Allowance"}
                        </span>
                        <span className="text-[10.5px] text-slate-400 tabular-nums truncate">
                          ({formatPriceByLocale(dailyAllowancePerPerson, locale, usdRate)} × {adultCount}{locale === "ko" ? "인" : " Travelers"} × {totalNights}{locale === "ko" ? "박" : "N"})
                        </span>
                      </div>
                      <strong className="font-black text-slate-900 tabular-nums shrink-0">
                        {formatPriceByLocale(totalDailyAllowanceKrw, locale, usdRate)}
                      </strong>
                    </div>
                  )}

                  {computedEmergencyKrw > 0 && (
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-slate-900 shrink-0">
                          {locale === "ko" ? "여행 비상금" : "Emergency Fund"}
                        </span>
                        <span className="text-[10.5px] text-slate-400 truncate">
                          ({emergencyPct > 0 ? `${Math.round(emergencyPct * 100)}%` : (locale === "ko" ? "고정" : "Fixed")})
                        </span>
                      </div>
                      <strong className="font-black text-slate-900 tabular-nums shrink-0">
                        {formatPriceByLocale(computedEmergencyKrw, locale, usdRate)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* 예산 총액 */}
              <div className="flex justify-between items-center pt-0.5">
                <div>
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 block">
                    {locale === "ko" ? "예산 총액" : "Total Budget"}
                  </span>
                  {adultCount > 1 && (
                    <span className="text-[10.5px] font-bold text-slate-400 tabular-nums block">
                      {locale === "ko"
                        ? `(1인당 ${formatPriceByLocale(Math.round(grandTotalKrw / adultCount), locale, usdRate)})`
                        : `(${formatPriceByLocale(Math.round(grandTotalKrw / adultCount), locale, usdRate)} / person)`}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <strong className="text-lg sm:text-xl font-black text-slate-900 tracking-tight tabular-nums block leading-tight">
                    {formatPriceByLocale(grandTotalKrw, locale, usdRate, { withSecondary: locale === "en" })}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Report Storage & Share Bar (인쇄 / PDF / 공유하기 / 링크 복사) */}
      <ReportShareBar locale={locale} />
    </div>
  );
}
