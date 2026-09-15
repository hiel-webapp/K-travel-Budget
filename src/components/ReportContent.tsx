"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  const [activeReceiptCity, setActiveReceiptCity] = useState<string>("ALL");

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

  // 고유 리포트 번호 및 생성일
  const reportMeta = useMemo(() => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
    const randomHash = Math.random().toString(36).substring(2, 7).toUpperCase();
    return {
      reportId: `HH-KR-${randomHash}`,
      date: dateStr,
    };
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-200 border-t-[#0f172a]"></div>
          <p className="text-xs font-semibold text-slate-500 tracking-tight">
            {locale === "ko" ? "맞춤 여행 예산 리포트를 생성하는 중입니다..." : "Generating travel budget report..."}
          </p>
        </div>
      </div>
    );
  }

  if (!draft || !preferences) {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-xl shadow-slate-100 flex flex-col items-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900 tracking-tight">{dict.planner.missingTitle}</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-sm">{dict.planner.missingDescription}</p>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="mt-6 flex w-full items-center justify-center gap-2 h-11 px-5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
          >
            <span>{dict.planner.missingButton}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Budget Engine 계산
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

  const targetBudget = plan.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && plan.grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(plan.grandTotalKrw - targetBudget);

  // 도시별/카테고리별 요약 데이터
  const citySubtotalMap: Record<string, number> = {};
  let sumCitySubtotals = 0;
  draft.selectedCities.forEach((city) => {
    const sub = plan.citySections[city]?.subtotalKrw || 0;
    citySubtotalMap[city] = sub;
    sumCitySubtotals += sub;
  });
  const safeCitySum = Math.max(1, sumCitySubtotals);

  const cityPalette = [
    { bg: "bg-slate-900", border: "border-slate-800", text: "text-slate-900" },
    { bg: "bg-indigo-600", border: "border-indigo-600", text: "text-indigo-600" },
    { bg: "bg-emerald-600", border: "border-emerald-600", text: "text-emerald-600" },
    { bg: "bg-amber-600", border: "border-amber-600", text: "text-amber-600" },
  ];

  const categoryMeta = [
    { cat: "ACCOMMODATION", label: locale === "ko" ? "숙소" : "Stay", colorBg: "bg-blue-500", colorText: "text-blue-700" },
    { cat: "FOOD", label: locale === "ko" ? "음식" : "Food", colorBg: "bg-amber-500", colorText: "text-amber-700" },
    { cat: "CITY_TRANSPORT", label: locale === "ko" ? "교통" : "Transit", colorBg: "bg-indigo-500", colorText: "text-indigo-700" },
    { cat: "ATTRACTION", label: locale === "ko" ? "관광" : "Attractions", colorBg: "bg-emerald-500", colorText: "text-emerald-700" },
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
      colorText: item.colorText,
    };
  });

  // 추천 여행 코스 필터링
  const recommendedCourses = TOUR_COURSE_PRESETS.filter((course) =>
    draft.selectedCities.includes(course.cityCode as SupportedCity)
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 text-slate-800 print:p-0 print:space-y-4">
      {/* ========================================================================= */}
      {/* 1. OFFICIAL REPORT HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 print:border-b-2 print:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-widest text-slate-900 uppercase bg-slate-100 px-2 py-0.5 rounded">
                OFFICIAL REPORT
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {reportMeta.reportId}
              </span>
              <span className="text-xs font-medium text-slate-400">
                · {reportMeta.date}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {locale === "ko" ? "대한민국 맞춤 여행 예산 종합 리포트" : "Korea Travel Comprehensive Budget Report"}
            </h1>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 px-3.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>{locale === "ko" ? "인쇄 / PDF 저장" : "Print / PDF"}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/planner`)}
              className="inline-flex h-9 px-3.5 items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>{locale === "ko" ? "플래너로 돌아가기" : "Back to Planner"}</span>
            </button>
          </div>
        </div>

        {/* Trip Meta Quick Tags */}
        <div className="pt-3.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 font-bold uppercase text-[10px]">CITIES</span>
            <span className="font-extrabold text-slate-900">
              {draft.selectedCities.map((c) => (locale === "ko" ? CITY_KOREAN_NAMES[c] || c : CITY_ENGLISH_NAMES[c] || c)).join(" ➔ ")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 font-bold uppercase text-[10px]">SCHEDULE</span>
            <span className="font-extrabold text-slate-900">
              {(draft.totalNights || 5)}{locale === "ko" ? "박 " : "N "}{(draft.totalNights || 5) + 1}{locale === "ko" ? "일" : "D"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 font-bold uppercase text-[10px]">TRAVELERS</span>
            <span className="font-extrabold text-slate-900">
              {draft.adultCount}{locale === "ko" ? "인 성인" : " Adults"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl ml-auto">
            <span className="text-slate-400 font-bold uppercase text-[10px]">STATUS</span>
            <span className="font-extrabold text-emerald-700">
              {locale === "ko" ? "검증 완료된 예산안" : "Verified Calculation"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE FINANCIAL SUMMARY (COMPACT KPI STRIP) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-900/10 relative overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Total Budget */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === "ko" ? "총 예상 경비" : "Estimated Total"}
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-white">
              {formatKrw(plan.grandTotalKrw)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">
              {locale === "ko" ? "모든 지출 항목 종합" : "All expenses combined"}
            </span>
          </div>

          {/* Per Traveler */}
          <div className="space-y-1 pt-3 lg:pt-0 lg:pl-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === "ko" ? "1인당 예상 경비" : "Per Traveler"}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-slate-100">
              {formatKrw(plan.perTravelerTotalKrw)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">
              {draft.adultCount}{locale === "ko" ? "인 기준 분할" : " Travelers divided"}
            </span>
          </div>

          {/* Daily Average */}
          <div className="space-y-1 pt-3 lg:pt-0 lg:pl-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {locale === "ko" ? "하루 평균 예산" : "Daily Average"}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-slate-100">
              {formatKrw(plan.dailyAverageKrw)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">
              {(draft.totalNights || 5) + 1}{locale === "ko" ? "일간 일일 지출" : " Days daily spending"}
            </span>
          </div>

          {/* Target Health Gauge */}
          <div className="space-y-1 pt-3 lg:pt-0 lg:pl-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {locale === "ko" ? "목표 예산 비교" : "Target Health"}
              </span>
              {targetBudget > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  isOverBudget ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {isOverBudget ? (locale === "ko" ? "초과" : "Over") : (locale === "ko" ? "충족" : "Safe")}
                </span>
              )}
            </div>

            {targetBudget > 0 ? (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">{formatPercentage(plan.targetBudgetUsagePercent)}</span>
                  <span className={`font-bold ${isOverBudget ? "text-red-400" : "text-emerald-400"}`}>
                    {isOverBudget ? `+${formatKrw(diffAmount)}` : `-${formatKrw(diffAmount)}`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverBudget ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(plan.targetBudgetUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 block pt-1">
                {locale === "ko" ? "목표 예산 미설정" : "No target set"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN BALANCED DASHBOARD LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: ANALYTICS, CHARTS, TIMELINE & CITY SUMMARY (7 COLS) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Budget Architecture Visual Gauges */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>{locale === "ko" ? "예산 구조 분석 및 지출 비중" : "Budget Architecture & Allocation"}</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">VISUAL INSIGHTS</span>
            </div>

            {/* Category Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">{locale === "ko" ? "항목별 지출 비중" : "Category Breakdown"}</span>
                <span className="font-mono text-slate-400 text-[11px]">{formatKrw(plan.grandTotalKrw)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
                {categorySubtotals.map((item, idx) => {
                  if (item.pct <= 0) return null;
                  return (
                    <div
                      key={idx}
                      style={{ width: `${item.pct}%` }}
                      className={`${item.colorBg} transition-all duration-300 relative`}
                      title={`${item.label}: ${item.pct}% (${formatKrw(item.amount)})`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1 text-xs">
                {categorySubtotals.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 min-w-0">
                    <span className={`h-2 w-2 rounded-full ${item.colorBg} shrink-0`}></span>
                    <span className="font-semibold text-slate-700 truncate text-[11px]">{item.label}</span>
                    <span className="font-mono font-bold text-slate-900 ml-auto text-[11px]">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* City Gauge */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">{locale === "ko" ? "도시별 지출 비중" : "City Allocation"}</span>
                <span className="font-mono text-slate-400 text-[11px]">{formatKrw(sumCitySubtotals)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
                {draft.selectedCities.map((city, idx) => {
                  const amount = citySubtotalMap[city] || 0;
                  const pct = Math.round((amount / safeCitySum) * 100);
                  if (pct <= 0) return null;
                  const palette = cityPalette[idx % cityPalette.length];
                  return (
                    <div
                      key={city}
                      style={{ width: `${pct}%` }}
                      className={`${palette.bg} transition-all duration-300 relative`}
                      title={`${CITY_KOREAN_NAMES[city] || city}: ${pct}% (${formatKrw(amount)})`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs">
                {draft.selectedCities.map((city, idx) => {
                  const amount = citySubtotalMap[city] || 0;
                  const pct = Math.round((amount / safeCitySum) * 100);
                  const palette = cityPalette[idx % cityPalette.length];
                  const cityName = locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city);
                  return (
                    <div key={city} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${palette.bg} shrink-0`}></span>
                      <span className="font-semibold text-slate-700 text-[11px]">{cityName}</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card: City Financial Audit Table (Compact Financial Sheet) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                {locale === "ko" ? "도시별 4대 부문 지출 집계" : "City-by-City Expense Breakdown"}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">AUDIT SHEET</span>
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
                    const nights = draft.cityNightAllocations[city] || 0;
                    const subtotal = citySubtotalMap[city] || 0;
                    const lineItems = plan.citySections[city]?.lineItems || [];
                    const stayAmount = lineItems.find((i) => i.category === "ACCOMMODATION")?.lineTotalKrw || 0;
                    const foodAmount = lineItems.find((i) => i.category === "FOOD")?.lineTotalKrw || 0;
                    const transportAmount = lineItems.find((i) => i.category === "CITY_TRANSPORT")?.lineTotalKrw || 0;
                    const attractionAmount = lineItems.find((i) => i.category === "ATTRACTION")?.lineTotalKrw || 0;

                    return (
                      <tr key={city} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900">
                          {locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                        </td>
                        <td className="py-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {nights === 0 ? (locale === "ko" ? "당일" : "Day") : `${nights}N`}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{formatKrw(stayAmount)}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{formatKrw(foodAmount)}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{formatKrw(transportAmount)}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{formatKrw(attractionAmount)}</td>
                        <td className="py-2.5 text-right font-mono font-black text-slate-900">{formatKrw(subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Recommended Tour Courses (Curated Route Blueprint) */}
          {recommendedCourses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    {locale === "ko" ? "선택 도시 추천 코스 & 최적 동선 가이드" : "Curated Route & Tour Presets"}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {locale === "ko" ? "동선을 최적화한 권역별 대표 추천 투어입니다." : "Route-optimized course recommendations."}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">ROUTE BLUEPRINT</span>
              </div>

              <div className="space-y-3 pt-1">
                {recommendedCourses.map((course) => {
                  const cityName = locale === "ko"
                    ? CITY_KOREAN_NAMES[course.cityCode as SupportedCity] || course.cityCode
                    : CITY_ENGLISH_NAMES[course.cityCode as SupportedCity] || course.cityCode;

                  return (
                    <div
                      key={course.id}
                      className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wide">
                            {cityName}
                          </span>
                          <h3 className="text-xs font-bold text-slate-900">
                            {locale === "ko" ? course.nameKo : course.nameEn}
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          {locale === "ko" ? `약 ${course.estimatedHours}시간 소요` : `~${course.estimatedHours}h`}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {locale === "ko" ? course.descKo : course.descEn}
                      </p>

                      {/* Route Spots Sequence Tag */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {course.spotIds.map((sid, sIdx) => {
                          const spot = ATTRACTION_SPOTS_CATALOG.find((s) => s.id === sid);
                          const spotName = spot ? (locale === "ko" ? spot.nameKo : spot.nameEn) : sid;
                          return (
                            <React.Fragment key={sid}>
                              <span className="text-[10px] font-medium bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                {spotName}
                              </span>
                              {sIdx < course.spotIds.length - 1 && (
                                <span className="text-slate-300 text-[10px] font-bold">➔</span>
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

          {/* Card: Personalized K-Trend Recommendations */}
          {personalizedTrends.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  {dict.trendSection.personalizedTitle}
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase">CURATED INSIGHTS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {personalizedTrends.slice(0, 4).map(({ trend, reason }, idx) => {
                  const trans = trend.translations[locale === "en" ? "en" : "ko"];
                  const cityName = trend.city === "ALL"
                    ? (locale === "en" ? "All Cities" : "전체 도시")
                    : (locale === "en" ? CITY_ENGLISH_NAMES[trend.city as SupportedCity] || trend.city : CITY_KOREAN_NAMES[trend.city as SupportedCity] || trend.city);

                  return (
                    <div
                      key={trend.id || idx}
                      className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/60 flex flex-col justify-between space-y-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                            {cityName}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{trans.title}</h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{trans.overview}</p>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700">{reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: OFFICIAL SMART RECEIPT & BASKET AUDIT (5 COLS) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Receipt Header Strip */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 block uppercase">
                  ITEMIZED EXPENSE AUDIT
                </span>
                <h2 className="text-base font-black tracking-tight text-white mt-0.5">
                  {locale === "ko" ? "스마트 예산 공식 영수증" : "Smart Budget Receipt"}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">GRAND TOTAL</span>
                <span className="text-base sm:text-lg font-black font-mono tabular-nums text-emerald-400">
                  {formatKrw(plan.grandTotalKrw)}
                </span>
              </div>
            </div>

            {/* City Filter Tabs for Smart Receipt */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveReceiptCity("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeReceiptCity === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                {locale === "ko" ? "전체 보기" : "All Items"}
              </button>
              {draft.selectedCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setActiveReceiptCity(city)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeReceiptCity === city
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  {locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                </button>
              ))}
            </div>

            {/* Receipt Items Body */}
            <div className="p-4 sm:p-5 space-y-5 divide-y divide-slate-100 text-xs">
              {/* Trip-wide Section: Shopping, Allowance, Emergency Fund */}
              {(activeReceiptCity === "ALL") && plan.tripWideSection.lineItems.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {locale === "ko" ? "공통 자율 예산 (쇼핑 · 용돈 · 비상금)" : "Common Flexible Expenses"}
                  </span>
                  <div className="space-y-2">
                    {plan.tripWideSection.lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {getBasketLabel(item.basketId, dict, locale)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {getCalculationExpression(item, dict, locale)}
                          </span>
                        </div>
                        <strong className="font-mono font-black text-slate-900 tabular-nums shrink-0">
                          {formatKrw(item.lineTotalKrw)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* City-by-City Itemized Sections */}
              {draft.selectedCities.map((city) => {
                if (activeReceiptCity !== "ALL" && activeReceiptCity !== city) return null;
                const section = plan.citySections[city];
                if (!section || section.lineItems.length === 0) return null;

                const cityName = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
                const attractionSel = preferences.attractionSelections?.[city];
                const individualSpotIds = attractionSel?.individualSpotIds || [];
                const selectedSpots = individualSpotIds
                  .map((id) => ATTRACTION_SPOTS_CATALOG.find((s) => s.id === id))
                  .filter(Boolean);
                const selectedActivities = individualSpotIds
                  .map((id) => THEME_ACTIVITIES_CATALOG.find((a) => a.id === id))
                  .filter(Boolean);

                return (
                  <div key={city} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm">{cityName}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({section.nights === 0 ? (locale === "ko" ? "당일치기" : "Day trip") : `${section.nights}${locale === "ko" ? "박" : "N"}`})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {formatKrw(section.subtotalKrw)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {section.lineItems.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                  {getCategoryLabel(item.category, dict)}
                                </span>
                                <span className="font-bold text-slate-800">
                                  {(item.sourceLabel && !item.sourceLabel.includes("Archetype") && !item.sourceLabel.includes("Mock"))
                                    ? item.sourceLabel
                                    : getBasketLabel(item.basketId, dict, locale, item.cityCode || city)}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                {getCalculationExpression(item, dict, locale)}
                              </span>
                            </div>
                            <strong className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                              {formatKrw(item.lineTotalKrw)}
                            </strong>
                          </div>

                          {/* Food details */}
                          {item.category === "FOOD" && isCalculatedMealPlan(item.mealPlan) && (
                            <div className="w-full pt-1">
                              <FoodReceiptDetails
                                mealPlan={item.mealPlan}
                                locale={locale}
                                dict={dict}
                              />
                            </div>
                          )}

                          {/* Attraction & Theme Activity details */}
                          {item.category === "ATTRACTION" && (selectedSpots.length > 0 || selectedActivities.length > 0) && (
                            <div className="mt-1.5 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/60 text-[11px] space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                {locale === "ko" ? "선택 명소 및 액티비티" : "Selected Spots & Activities"}
                              </span>
                              <div className="space-y-1">
                                {selectedSpots.map((spot) => spot && (
                                  <div key={spot.id} className="flex items-center justify-between text-slate-700">
                                    <span className="truncate pr-2">{locale === "ko" ? spot.nameKo : spot.nameEn}</span>
                                    <span className="font-mono font-bold text-slate-900 shrink-0">
                                      {spot.priceStatus === "FREE" || spot.price === 0
                                        ? (locale === "ko" ? "무료" : "Free")
                                        : formatKrw(spot.price)}
                                    </span>
                                  </div>
                                ))}
                                {selectedActivities.map((act) => act && (
                                  <div key={act.id} className="flex items-center justify-between text-emerald-800 font-semibold">
                                    <span className="truncate pr-2 flex items-center gap-1">
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">액티비티</span>
                                      {locale === "ko" ? act.nameKo : act.nameEn}
                                    </span>
                                    <span className="font-mono font-bold text-slate-900 shrink-0">
                                      {formatKrw(act.priceKrw)}
                                    </span>
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

              {/* Intercity Transit (KTX) */}
              {(activeReceiptCity === "ALL") && plan.intercitySection.lineItems.length > 0 && (
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-black text-slate-900 text-sm">
                      {dict.planner.intercityTransportation}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {formatKrw(plan.intercitySection.subtotalKrw)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {plan.intercitySection.lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-3">
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {item.sourceLabel || getBasketLabel(item.basketId, dict, locale)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {getCalculationExpression(item, dict, locale)}
                          </span>
                        </div>
                        <strong className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
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
                  ? "본 리포트는 공공 데이터 및 실시간 카탈로그를 기반으로 계산된 여행 재무 견적서입니다."
                  : "Certified travel budget plan calculated from verified local rates."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
