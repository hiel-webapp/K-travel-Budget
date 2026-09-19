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
          />

          {/* Section D: One-Stop Booking & Action Hub */}
          <BookingActionHub
            calculations={calculations}
            draft={draft}
            locale={locale}
            dict={dict}
          />

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

          {/* Section E: 1330 Korea Travel Helpline Banner */}
          <TravelHelpline1330 locale={locale} />
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: STICKY OFFICIAL SMART RECEIPT (4 COLS / ~32%) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
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
                                  : `${formatKrw(cInfo.stayNightlyPrice)}/night × ${cInfo.nights}N`}
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
                            {(locale === "ko" ? item.sourceLabel : (item.sourceLabelEn || item.sourceLabel)) || getBasketLabel(item.basketId, dict, locale)}
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
