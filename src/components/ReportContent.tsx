"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadTripDraft, loadPlannerPreferencesEx, loadSavedPlaceIds } from "../lib/storage-helper";
import { generateInitialBudgetPlan } from "../features/budget/calculations/engine";
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
import { isCalculatedMealPlan } from "../features/budget/domain/types";
import type { PlannerPreferences, BudgetCategory } from "../features/budget/domain/types";
import { TOUR_COURSE_PRESETS, ATTRACTION_SPOTS_CATALOG } from "../features/budget/catalog/attraction-spots";
import { THEME_ACTIVITIES_CATALOG } from "../features/budget/catalog/theme-activities";
import FoodReceiptDetails from "./FoodReceiptDetails";

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
      } catch (error) {
        console.error("Failed to load report data:", error);
      } finally {
        setIsHydrated(true);
      }
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#e25c5c]"></div>
          <p className="text-sm font-medium text-slate-500">
            {locale === "ko" ? "예산 리포트를 불러오는 중입니다..." : "Loading travel budget report..."}
          </p>
        </div>
      </div>
    );
  }

  if (!draft || !preferences) {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50 flex flex-col items-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-[#e25c5c]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11a2 2 0 012-2h1.055M11 20.055V18a2 2 0 012-2h3.5a2 2 0 002.5-2.5V11" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">{dict.planner.missingTitle}</h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm">{dict.planner.missingDescription}</p>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="mt-8 flex w-full items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#e25c5c] text-white font-bold text-base shadow-md hover:bg-[#d14b4b] hover:shadow-lg transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:outline-offset-2"
          >
            <span>{dict.planner.missingButton}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Budget Engine 계산 구동
  const plan = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG, {
    accommodation: preferences.accommodationByCity,
    food: preferences.foodOverrides,
    foodAddOns: preferences.addOnSelections,
    attraction: preferences.attractionByCity,
  });

  const personalizedTrends = getPersonalizedTrendRecommendations({
    draft,
    preferences,
    savedPlaceIds,
    locale,
  });

  // 목표 예산 대비 분석
  const targetBudget = plan.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && plan.grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(plan.grandTotalKrw - targetBudget);

  const categories: BudgetCategory[] = [
    "ACCOMMODATION",
    "FOOD",
    "CITY_TRANSPORT",
    "ATTRACTION",
    "EMERGENCY_FUND",
  ];

  // 도시별/카테고리별 시각화 데이터 계산
  const citySubtotalMap: Record<string, number> = {};
  let sumCitySubtotals = 0;
  draft.selectedCities.forEach((city) => {
    const sub = plan.citySections[city]?.subtotalKrw || 0;
    citySubtotalMap[city] = sub;
    sumCitySubtotals += sub;
  });
  const safeCitySum = Math.max(1, sumCitySubtotals);

  const cityColors = [
    { bg: "bg-[#e25c5c]", text: "text-[#e25c5c]", border: "border-[#fce8e8]", lightBg: "bg-[#faf5f5]" },
    { bg: "bg-indigo-600", text: "text-indigo-600", border: "border-indigo-100", lightBg: "bg-indigo-50/50" },
    { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-100", lightBg: "bg-emerald-50/50" },
    { bg: "bg-amber-600", text: "text-amber-600", border: "border-amber-100", lightBg: "bg-amber-50/50" },
  ];

  const categoryMeta = [
    { cat: "ACCOMMODATION", label: locale === "ko" ? "숙소" : "Stay", colorBg: "bg-blue-500" },
    { cat: "FOOD", label: locale === "ko" ? "음식" : "Food", colorBg: "bg-amber-500" },
    { cat: "CITY_TRANSPORT", label: locale === "ko" ? "교통" : "Transport", colorBg: "bg-indigo-500" },
    { cat: "ATTRACTION", label: locale === "ko" ? "관광" : "Attractions", colorBg: "bg-emerald-500" },
  ];

  const grandTotal = plan.grandTotalKrw || 1;
  const categorySubtotals = categoryMeta.map((item) => {
    const amount =
      item.cat === "CITY_TRANSPORT"
        ? getCombinedTransportSubtotal(plan)
        : plan.categoryTotals[item.cat as BudgetCategory] || 0;
    return {
      label: item.label,
      amount,
      pct: Math.round((amount / grandTotal) * 100),
      colorBg: item.colorBg,
    };
  });

  // 선택한 도시들에 대한 추천 여행 코스 필터링
  const recommendedCourses = TOUR_COURSE_PRESETS.filter((course) =>
    draft.selectedCities.includes(course.cityCode as SupportedCity)
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:px-8 space-y-8 print:p-0 print:space-y-6">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 gap-4 print:border-b-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 text-white tracking-wide">
              {locale === "ko" ? "통합 예산 리포트" : "Unified Travel Budget Report"}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {draft.adultCount}{locale === "ko" ? "인" : " Travelers"} · {(draft.totalNights || 5)}{locale === "ko" ? "박 " : "N "}{(draft.totalNights || 5) + 1}{locale === "ko" ? "일" : "D"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
            {dict.planner.reportTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {dict.planner.reportSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 px-4 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{locale === "ko" ? "리포트 인쇄 / PDF 저장" : "Print / Save PDF"}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/planner`)}
            className="inline-flex h-10 px-4 items-center justify-center rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-sm transition-colors cursor-pointer shadow-xs"
          >
            {dict.planner.reportBackToPlanner}
          </button>
        </div>
      </div>

      {/* 2. Core Aggregated Totals (플래너 영수증에서 리포트로 이관된 1인당, 하루 평균 예산 포함) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {locale === "ko" ? "총 예상 경비" : "Estimated Total"}
          </span>
          <strong className="text-2xl sm:text-3xl font-black text-[#0f172a] tabular-nums block">
            {formatKrw(plan.grandTotalKrw)}
          </strong>
          <span className="text-xs text-slate-400 font-semibold block">
            {draft.selectedCities.map((c) => (locale === "ko" ? CITY_KOREAN_NAMES[c] || c : CITY_ENGLISH_NAMES[c] || c)).join(", ")}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {locale === "ko" ? "1인당 예상 경비" : "Per Traveler Budget"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {draft.adultCount}{locale === "ko" ? "인 기준" : " Travelers"}
            </span>
          </div>
          <strong className="text-2xl sm:text-3xl font-black text-slate-800 tabular-nums block">
            {formatKrw(plan.perTravelerTotalKrw)}
          </strong>
          <span className="text-xs text-slate-400 font-semibold block">
            {locale === "ko" ? "인원수 균등 분할 계산" : "Equally divided by adults"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {locale === "ko" ? "하루 평균 예산" : "Daily Average Budget"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {(draft.totalNights || 5) + 1}{locale === "ko" ? "일 기준" : " Days"}
            </span>
          </div>
          <strong className="text-2xl sm:text-3xl font-black text-slate-800 tabular-nums block">
            {formatKrw(plan.dailyAverageKrw)}
          </strong>
          <span className="text-xs text-slate-400 font-semibold block">
            {locale === "ko" ? `총 ${(draft.totalNights || 5) + 1}일 (${draft.totalNights || 5}박) 기준` : `Based on ${(draft.totalNights || 5) + 1} days`}
          </span>
        </div>
      </div>

      {/* 3. Target Budget Health Comparison (플래너 요약 탭에서 이관된 예산 건강성 분석) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#0f172a]">
              {locale === "ko" ? "목표 예산 대비 달성 현황" : "Target Budget Health & Allocation"}
            </h2>
          </div>
          {targetBudget > 0 && (
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
              isOverBudget ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>
              {isOverBudget
                ? (locale === "ko" ? "목표 예산 초과" : "Over Budget")
                : (locale === "ko" ? "목표 예산 내 충족" : "Within Target")}
            </span>
          )}
        </div>

        {targetBudget > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm gap-2">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-slate-500">{dict.planner.reportTotalBudget}:</span>
                <span className="text-slate-900 font-black tabular-nums">{formatKrw(targetBudget)}</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-slate-500">{locale === "ko" ? "예산 소진율:" : "Usage Ratio:"}</span>
                <span className={`tabular-nums font-black ${isOverBudget ? "text-red-500" : "text-emerald-700"}`}>
                  {formatPercentage(plan.targetBudgetUsagePercent)}
                </span>
              </div>
            </div>

            {/* Health Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={plan.targetBudgetUsagePercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverBudget ? "bg-red-500" : "bg-emerald-600"
                }`}
                style={{ width: `${Math.min(plan.targetBudgetUsagePercent, 100)}%` }}
              ></div>
            </div>

            <div className="text-xs font-bold flex items-center justify-between pt-1">
              {isOverBudget ? (
                <>
                  <span className="text-red-500">{dict.planner.reportDiffOver}</span>
                  <span className="text-red-500 tabular-nums">+{formatKrw(diffAmount)}</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-700">{dict.planner.reportDiffUnder}</span>
                  <span className="text-emerald-700 tabular-nums">-{formatKrw(diffAmount)}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 font-medium">{dict.planner.reportNoTargetBudget}</p>
        )}
      </div>

      {/* 4. Visual Progress Bars (플래너 요약 탭에서 이관된 도시별/항목별 비중 시각화) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: City Budget Allocation Stacked Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-[#0f172a]">
              <span>{locale === "ko" ? `도시별 예산 비중 (합계: ${formatKrw(sumCitySubtotals)})` : `City Budget Allocation (${formatKrw(sumCitySubtotals)})`}</span>
            </h3>
          </div>

          {/* Segmented Progress Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
            {draft.selectedCities.map((city, idx) => {
              const amount = citySubtotalMap[city] || 0;
              const pct = Math.round((amount / safeCitySum) * 100);
              if (pct <= 0) return null;
              const color = cityColors[idx % cityColors.length];
              return (
                <div
                  key={city}
                  style={{ width: `${pct}%` }}
                  className={`${color.bg} transition-all duration-300 relative group`}
                  title={`${CITY_KOREAN_NAMES[city] || city}: ${pct}% (${formatKrw(amount)})`}
                />
              );
            })}
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-xs">
            {draft.selectedCities.map((city, idx) => {
              const amount = citySubtotalMap[city] || 0;
              const pct = Math.round((amount / safeCitySum) * 100);
              const color = cityColors[idx % cityColors.length];
              const cityName = locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city);
              return (
                <div key={city} className="flex items-center gap-1.5 justify-start min-w-0">
                  <span className={`h-2.5 w-2.5 rounded-full ${color.bg} shrink-0`}></span>
                  <span className="font-bold text-slate-800 truncate">{cityName}</span>
                  <span className="font-extrabold text-slate-900 ml-auto tabular-nums shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Category Distribution Stacked Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-[#0f172a]">
              <span>{locale === "ko" ? `카테고리별 지출 비중 (합계: ${formatKrw(plan.grandTotalKrw)})` : `Category Distribution (${formatKrw(plan.grandTotalKrw)})`}</span>
            </h3>
          </div>

          {/* Segmented Progress Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
            {categorySubtotals.map((item, idx) => {
              if (item.pct <= 0) return null;
              return (
                <div
                  key={idx}
                  style={{ width: `${item.pct}%` }}
                  className={`${item.colorBg} transition-all duration-300 relative group`}
                  title={`${item.label}: ${item.pct}% (${formatKrw(item.amount)})`}
                />
              );
            })}
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-xs">
            {categorySubtotals.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 justify-start min-w-0">
                <span className={`h-2.5 w-2.5 rounded-full ${item.colorBg} shrink-0`}></span>
                <span className="font-bold text-slate-800 truncate">{item.label}</span>
                <span className="font-extrabold text-slate-900 ml-auto tabular-nums shrink-0">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. City Breakdown Cards (플래너 요약 탭에서 이관된 4대 항목 세부 지출 카드) */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-[#0f172a]">
          {locale === "ko" ? "도시별 세부 지출 구조" : "City Breakdown Details"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {draft.selectedCities.map((city, idx) => {
            const nights = draft.cityNightAllocations[city] || 0;
            const subtotal = citySubtotalMap[city] || 0;
            const color = cityColors[idx % cityColors.length];

            const lineItems = plan.citySections[city]?.lineItems || [];
            const stayAmount = lineItems.find((i) => i.category === "ACCOMMODATION")?.lineTotalKrw || 0;
            const foodAmount = lineItems.find((i) => i.category === "FOOD")?.lineTotalKrw || 0;
            const transportAmount = lineItems.find((i) => i.category === "CITY_TRANSPORT")?.lineTotalKrw || 0;
            const attractionAmount = lineItems.find((i) => i.category === "ATTRACTION")?.lineTotalKrw || 0;

            return (
              <div
                key={city}
                className={`p-4 sm:p-5 rounded-2xl border ${color.border} ${color.lightBg} flex flex-col justify-between space-y-3 shadow-2xs text-left`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                    <strong className="text-base font-extrabold text-slate-900">
                      {locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city)}
                    </strong>
                    <span className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-200/70">
                      {nights === 0
                        ? (locale === "ko" ? "당일치기" : "Day Trip")
                        : `${nights}${locale === "ko" ? "박 " : "N "}${nights + 1}${locale === "ko" ? "일" : "D"}`}
                    </span>
                  </div>

                  {/* 4대 항목 격자 */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-white/90 border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{locale === "ko" ? "숙소" : "Stay"}</span>
                      <strong className="text-slate-900 font-extrabold tabular-nums">{formatKrw(stayAmount)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{locale === "ko" ? "음식" : "Food"}</span>
                      <strong className="text-slate-900 font-extrabold tabular-nums">{formatKrw(foodAmount)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{locale === "ko" ? "교통" : "Transit"}</span>
                      <strong className="text-slate-900 font-extrabold tabular-nums">{formatKrw(transportAmount)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{locale === "ko" ? "관광" : "Attr"}</span>
                      <strong className="text-slate-900 font-extrabold tabular-nums">{formatKrw(attractionAmount)}</strong>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/40">
                    <span className="text-xs text-slate-500 font-bold">
                      {locale === "ko" ? "도시 소계" : "City Subtotal"}
                    </span>
                    <strong className={`text-base font-black tabular-nums ${color.text}`}>
                      {formatKrw(subtotal)}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Comprehensive Smart Receipt (사용자가 담은 숙박, 음식, 관광+액티비티 전체 바스켓 완전 노출) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              {locale === "ko" ? "스마트 예산 영수증 세부 내역" : "Smart Budget Receipt Details"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {locale === "ko" ? "플래너에서 선택한 숙박, 음식, 관광 및 액티비티 바스켓의 전체 계산식입니다." : "Itemized breakdown of selected stays, food, attractions, and activities."}
            </p>
          </div>
          <span className="text-xs font-black text-slate-900 tabular-nums bg-slate-100 px-3 py-1 rounded-xl">
            {formatKrw(plan.grandTotalKrw)}
          </span>
        </div>

        {/* 전체 여행 공통 비용 (쇼핑 예산, 일일 용돈, 여행 비상금) */}
        {plan.tripWideSection.lineItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg">
              {locale === "ko" ? "공통 자율 예산 (쇼핑 · 용돈 · 비상금)" : dict.planner.tripWideExpenses}
            </h3>
            <div className="divide-y divide-slate-100 pl-1">
              {plan.tripWideSection.lineItems.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-start text-xs gap-4">
                  <div>
                    <span className="text-slate-900 font-bold block">
                      {getBasketLabel(item.basketId, dict, locale)}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {getCalculationExpression(item, dict, locale)}
                    </span>
                  </div>
                  <strong className="font-extrabold tabular-nums text-slate-900 whitespace-nowrap text-sm">
                    {formatKrw(item.lineTotalKrw)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 도시별 세부 내역 (숙박, 음식, 관광+액티비티, 시내교통) */}
        {draft.selectedCities.map((city) => {
          const section = plan.citySections[city];
          if (!section || section.lineItems.length === 0) return null;

          const label = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
          const cityNights = section.nights;

          // 해당 도시의 선택된 명소 및 테마 액티비티 추출
          const attractionSel = preferences.attractionSelections?.[city];
          const individualSpotIds = attractionSel?.individualSpotIds || [];
          const selectedSpots = individualSpotIds
            .map((id) => ATTRACTION_SPOTS_CATALOG.find((s) => s.id === id))
            .filter(Boolean);
          const selectedActivities = individualSpotIds
            .map((id) => THEME_ACTIVITIES_CATALOG.find((a) => a.id === id))
            .filter(Boolean);

          return (
            <div key={city} className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                <h3 className="text-sm font-extrabold text-[#0f172a]">
                  {label} <span className="text-xs font-semibold text-slate-500">({cityNights === 0 ? (locale === "ko" ? "당일치기" : "Day trip") : `${cityNights}${locale === "ko" ? "박" : "N"}`})</span>
                </h3>
                <span className="text-xs font-black text-slate-800 tabular-nums">
                  {formatKrw(section.subtotalKrw)}
                </span>
              </div>

              <div className="space-y-3 pl-1">
                {section.lineItems.map((item) => (
                  <div key={item.id} className="space-y-1.5 border-b border-slate-50 pb-2.5">
                    <div className="flex justify-between items-start text-xs gap-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {getCategoryLabel(item.category, dict)}
                          </span>
                          <span className="text-slate-900 font-bold">
                            {(item.sourceLabel && !item.sourceLabel.includes("Archetype") && !item.sourceLabel.includes("Mock"))
                              ? item.sourceLabel
                              : getBasketLabel(item.basketId, dict, locale, item.cityCode || city)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {getCalculationExpression(item, dict, locale)}
                        </span>
                      </div>
                      <strong className="font-extrabold tabular-nums text-slate-900 whitespace-nowrap text-sm">
                        {formatKrw(item.lineTotalKrw)}
                      </strong>
                    </div>

                    {/* 음식 상세 슬롯 */}
                    {item.category === "FOOD" && isCalculatedMealPlan(item.mealPlan) && (
                      <div className="w-full overflow-x-auto pt-1">
                        <FoodReceiptDetails
                          mealPlan={item.mealPlan}
                          locale={locale}
                          dict={dict}
                        />
                      </div>
                    )}

                    {/* 관광 & 연계 액티비티 상세 리스트 */}
                    {item.category === "ATTRACTION" && (selectedSpots.length > 0 || selectedActivities.length > 0) && (
                      <div className="mt-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-xs space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 block">
                          {locale === "ko" ? "담은 관광 명소 및 액티비티 바스켓" : "Selected Attractions & Activities"}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedSpots.map((spot) => spot && (
                            <div key={spot.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-slate-700">
                              <span className="font-semibold">{locale === "ko" ? spot.nameKo : spot.nameEn}</span>
                              <span className="font-extrabold tabular-nums text-slate-900">
                                {spot.priceStatus === "FREE" || spot.price === 0
                                  ? (locale === "ko" ? "무료" : "Free")
                                  : formatKrw(spot.price)}
                              </span>
                            </div>
                          ))}
                          {selectedActivities.map((act) => act && (
                            <div key={act.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-100 text-emerald-800">
                              <span className="font-bold flex items-center gap-1">
                                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">액티비티</span>
                                {locale === "ko" ? act.nameKo : act.nameEn}
                              </span>
                              <span className="font-extrabold tabular-nums text-slate-900">{formatKrw(act.priceKrw)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 도시 간 이동 교통 (KTX) */}
        {plan.intercitySection.lineItems.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
              <h3 className="text-sm font-extrabold text-[#0f172a]">
                {dict.planner.intercityTransportation}
              </h3>
              <span className="text-xs font-black text-slate-800 tabular-nums">
                {formatKrw(plan.intercitySection.subtotalKrw)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 pl-1">
              {plan.intercitySection.lineItems.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-start text-xs gap-4">
                  <div>
                    <span className="text-slate-900 font-bold block">
                      {item.sourceLabel || getBasketLabel(item.basketId, dict, locale)}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {getCalculationExpression(item, dict, locale)}
                    </span>
                  </div>
                  <strong className="font-extrabold tabular-nums text-slate-900 whitespace-nowrap text-sm">
                    {formatKrw(item.lineTotalKrw)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Recommended Tour Courses (선택 도시 기반 추천 여행 코스 및 동선 안내) */}
      {recommendedCourses.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
                {locale === "ko" ? "선택 도시 추천 여행 코스 & 최적 동선" : "Recommended Tour Courses & Route Guide"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {locale === "ko"
                  ? "선택하신 도시에서 이동 동선을 최소화하고 알차게 즐길 수 있는 권역별 추천 코스입니다."
                  : "Curated route-optimized tour course presets for your selected cities."}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
              {recommendedCourses.length}{locale === "ko" ? "개 코스 안내" : " Courses"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedCourses.map((course) => {
              const cityName = locale === "ko"
                ? CITY_KOREAN_NAMES[course.cityCode as SupportedCity] || course.cityCode
                : CITY_ENGLISH_NAMES[course.cityCode as SupportedCity] || course.cityCode;

              return (
                <div
                  key={course.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded uppercase">
                        {cityName}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {locale === "ko" ? `예상 ${course.estimatedHours}시간` : `~${course.estimatedHours}h`}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900">
                      {locale === "ko" ? course.nameKo : course.nameEn}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {locale === "ko" ? course.descKo : course.descEn}
                    </p>
                  </div>

                  {/* 포함된 스팟 태그 */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                    {course.spotIds.map((sid) => {
                      const spot = ATTRACTION_SPOTS_CATALOG.find((s) => s.id === sid);
                      const spotName = spot ? (locale === "ko" ? spot.nameKo : spot.nameEn) : sid;
                      return (
                        <span
                          key={sid}
                          className="text-[10px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                        >
                          {spotName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Personalized K-Trend Insights (잠금 없이 100% 완전 공개) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              {dict.trendSection.personalizedTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {dict.trendSection.personalizedSubtitle}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
            {locale === "ko" ? "여행자 맞춤 인사이트" : "Personalized Tips"}
          </span>
        </div>

        {personalizedTrends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personalizedTrends.map(({ trend, reason }, idx) => {
              const trans = trend.translations[locale === "en" ? "en" : "ko"];
              const cityName = trend.city === "ALL"
                ? (locale === "en" ? "All Cities" : "전체 도시")
                : (locale === "en" ? CITY_ENGLISH_NAMES[trend.city as SupportedCity] || trend.city : CITY_KOREAN_NAMES[trend.city as SupportedCity] || trend.city);

              return (
                <div
                  key={trend.id || idx}
                  className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">
                        {cityName}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {locale === "ko" ? "추천" : "Recommended"}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {trans.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {trans.overview}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 font-bold space-y-0.5">
                    <span className="text-slate-400 block text-[10px]">{dict.trendSection.reasonLabel}</span>
                    <span className="text-slate-800 block">{reason}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-medium py-2">
            {dict.trendSection.emptyPersonalizedNotice}
          </p>
        )}
      </div>
    </div>
  );
}
