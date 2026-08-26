"use client";

import { useState, useEffect } from "react";
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
          <p className="text-sm font-medium text-slate-500">Loading report...</p>
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

  // 예산 건강성 계산 (차액 비교)
  const targetBudget = plan.targetBudgetKrw || 0;
  const isOverBudget = plan.grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(plan.grandTotalKrw - targetBudget);

  const categories: BudgetCategory[] = [
    "ACCOMMODATION",
    "FOOD",
    "CITY_TRANSPORT",
    "ATTRACTION",
    "EMERGENCY_FUND",
  ];

  const paidFeatures = [
    {
      title: dict.planner.paidFeatureHealth,
      desc: dict.planner.paidFeatureHealthDesc,
    },
    {
      title: dict.planner.paidFeatureMiss,
      desc: dict.planner.paidFeatureMissDesc,
    },
    {
      title: dict.planner.paidFeatureSave,
      desc: dict.planner.paidFeatureSaveDesc,
    },
    {
      title: dict.planner.paidFeaturePrice,
      desc: dict.planner.paidFeaturePriceDesc,
    },
    {
      title: dict.planner.paidFeatureHotel,
      desc: dict.planner.paidFeatureHotelDesc,
    },
    {
      title: dict.planner.paidFeatureOrder,
      desc: dict.planner.paidFeatureOrderDesc,
    },
    {
      title: dict.planner.paidFeatureTrend,
      desc: dict.planner.paidFeatureTrendDesc,
    },
    {
      title: dict.planner.paidFeatureExport,
      desc: dict.planner.paidFeatureExportDesc,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:px-8 space-y-8">
      {/* 1. Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {dict.planner.reportTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {dict.planner.reportSubtitle}
          </p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/planner`)}
          className="inline-flex h-10 px-5 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0f172a] font-bold text-sm transition-colors cursor-pointer"
        >
          {dict.planner.reportBackToPlanner}
        </button>
      </div>

      {/* 2. Free Basic Report: Core Aggregated Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Estimated Total
          </span>
          <strong className="text-2xl font-extrabold text-[#0f172a] block">
            {formatKrw(plan.grandTotalKrw)}
          </strong>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Per Traveler
          </span>
          <strong className="text-xl font-extrabold text-[#0f172a] block">
            {formatKrw(plan.perTravelerTotalKrw)}
          </strong>
          <span className="text-[10px] text-slate-400 font-semibold block">
            Based on {draft.adultCount} {draft.adultCount === 1 ? "person" : "people"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Daily Average
          </span>
          <strong className="text-xl font-extrabold text-[#0f172a] block">
            {formatKrw(plan.dailyAverageKrw)}
          </strong>
          <span className="text-[10px] text-slate-400 font-semibold block">
            Total {(draft.totalNights || 5) + 1} days ({draft.totalNights || 5} nights)
          </span>
        </div>
      </div>

      {/* 3. Target Budget & Health Comparison */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-[#0f172a]">Target Budget Health</h3>
        {targetBudget > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-2">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-slate-500">{dict.planner.reportTotalBudget}:</span>
                <span className="text-slate-800">{formatKrw(targetBudget)}</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-slate-500">Usage Ratio:</span>
                <span className={isOverBudget ? "text-red-500" : "text-[#4d7c67]"}>
                  {formatPercentage(plan.targetBudgetUsagePercent)}
                </span>
              </div>
            </div>

            {/* Health Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={plan.targetBudgetUsagePercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverBudget ? "bg-red-500" : "bg-[#4d7c67]"
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
                  <span className="text-[#4d7c67]">{dict.planner.reportDiffUnder}</span>
                  <span className="text-[#4d7c67] tabular-nums">-{formatKrw(diffAmount)}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 font-medium">{dict.planner.reportNoTargetBudget}</p>
        )}
      </div>

      {/* 3.5. Visual Progress Bars & City Breakdown Cards */}
      {(() => {
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
          { cat: "ACCOMMODATION", icon: "🏨", label: locale === "ko" ? "숙박" : "Stay", colorBg: "bg-blue-500" },
          { cat: "FOOD", icon: "🍱", label: locale === "ko" ? "음식" : "Food", colorBg: "bg-amber-500" },
          { cat: "CITY_TRANSPORT", icon: "🚌", label: locale === "ko" ? "교통" : "Transport", colorBg: "bg-indigo-500" },
          { cat: "ATTRACTION", icon: "🏛️", label: locale === "ko" ? "관광" : "Attractions", colorBg: "bg-emerald-500" },
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

        return (
          <div className="space-y-6">
            {/* Two Stacked Progress Bar Cards Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 1: City Budget Allocation Stacked Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
                    <span>🏙️</span>
                    <span>{locale === "ko" ? `도시별 합계: ${formatKrw(sumCitySubtotals)}` : `City Total: ${formatKrw(sumCitySubtotals)}`}</span>
                  </h4>
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
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 pt-1 text-xs w-max mx-auto">
                  {draft.selectedCities.map((city, idx) => {
                    const amount = citySubtotalMap[city] || 0;
                    const pct = Math.round((amount / safeCitySum) * 100);
                    const color = cityColors[idx % cityColors.length];
                    const cityName = locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city);

                    return (
                      <div key={city} className="flex items-center gap-1.5 justify-start min-w-0">
                        <span className={`h-2.5 w-2.5 rounded-full ${color.bg} shrink-0`}></span>
                        <span className="font-bold text-slate-800 truncate">{cityName}</span>
                        <span className="font-extrabold text-slate-900 ml-1.5 shrink-0">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Category Distribution Stacked Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
                    <span>📦</span>
                    <span>{locale === "ko" ? `항목별 합계: ${formatKrw(plan.grandTotalKrw)}` : `Category Total: ${formatKrw(plan.grandTotalKrw)}`}</span>
                  </h4>
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
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 pt-1 text-xs w-max mx-auto">
                  {categorySubtotals.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 justify-start min-w-0">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.colorBg} shrink-0`}></span>
                      <span className="font-bold text-slate-800 truncate">{item.label}</span>
                      <span className="font-extrabold text-slate-900 ml-1.5 shrink-0">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* City Details Cards with Amounts */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
                <span>📌</span>
                <span>{locale === "ko" ? "도시별 세부 금액 정보" : "City Breakdown Details"}</span>
              </h4>

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
                      className={`p-4 rounded-2xl border ${color.border} ${color.lightBg} flex flex-col justify-between space-y-3 shadow-2xs text-left`}
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-base font-extrabold text-slate-900 flex items-center gap-1">
                              <svg className={`w-4 h-4 ${color.text} fill-current shrink-0`} viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                              </svg>
                              <span>{locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city)}</span>
                            </strong>
                          </div>
                          <span className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-200/70">
                            {nights === 0
                              ? (locale === "ko" ? "당일치기" : "Day Trip")
                              : `${nights}${locale === "ko" ? "박 " : "N "}${nights + 1}${locale === "ko" ? "일" : "D"}`}
                          </span>
                        </div>

                        {/* Amount Breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="p-2 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-between">
                            <span className="text-slate-500 font-semibold">🏨 {locale === "ko" ? "숙박" : "Stay"}</span>
                            <strong className="text-slate-900 font-extrabold">{formatKrw(stayAmount)}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-between">
                            <span className="text-slate-500 font-semibold">🍱 {locale === "ko" ? "음식" : "Food"}</span>
                            <strong className="text-slate-900 font-extrabold">{formatKrw(foodAmount)}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-between">
                            <span className="text-slate-500 font-semibold">🚌 {locale === "ko" ? "교통" : "Transit"}</span>
                            <strong className="text-slate-900 font-extrabold">{formatKrw(transportAmount)}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-between">
                            <span className="text-slate-500 font-semibold">🏛️ {locale === "ko" ? "관광" : "Attr"}</span>
                            <strong className="text-slate-900 font-extrabold">{formatKrw(attractionAmount)}</strong>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/40">
                          <span className="text-xs text-slate-500 font-bold">
                            {locale === "ko" ? "도시 예산 소계" : "City Subtotal"}
                          </span>
                          <strong className={`text-base font-black ${color.text}`}>
                            {formatKrw(subtotal)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. Categorized & Localized Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#0f172a]">
            {dict.planner.reportCategorySummary}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                  <th className="pb-2 font-bold">Category</th>
                  <th className="pb-2 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categories.map((cat) => {
                  const subtotal = plan.categoryTotals[cat] || 0;
                  return (
                    <tr key={cat}>
                      <td className="py-2.5 text-slate-700 font-bold">{getCategoryLabel(cat, dict)}</td>
                      <td className="py-2.5 text-right font-sans tabular-nums text-[#0f172a] font-extrabold">
                        {formatKrw(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* City Breakdown Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#0f172a]">
            {dict.planner.reportCitySummary}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                  <th className="pb-2 font-bold">City</th>
                  <th className="pb-2 text-center font-bold">Nights</th>
                  <th className="pb-2 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {draft.selectedCities.map((city) => {
                  const section = plan.citySections[city];
                  if (!section) return null;
                  return (
                    <tr key={city}>
                      <td className="py-2.5 text-slate-700 font-bold">
                        {locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                      </td>
                      <td className="py-2.5 text-center text-slate-600 font-bold">
                        {section.nights}박
                      </td>
                      <td className="py-2.5 text-right font-sans tabular-nums text-[#0f172a] font-extrabold">
                        {formatKrw(section.subtotalKrw)}
                      </td>
                    </tr>
                  );
                })}
                {plan.intercitySection.subtotalKrw > 0 && (
                  <tr>
                    <td className="py-2.5 text-slate-700 font-bold" colSpan={2}>
                      Intercity Transit (KTX)
                    </td>
                    <td className="py-2.5 text-right font-sans tabular-nums text-[#0f172a] font-extrabold">
                      {formatKrw(plan.intercitySection.subtotalKrw)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4.5. Detailed Receipt (details/summary) */}
      <details className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 transition-all">
        <summary className="flex items-center justify-between font-extrabold text-[#0f172a] hover:text-[#e25c5c] cursor-pointer select-none focus-visible:outline-none">
          <span className="text-base">{dict.planner.viewDetailedReceipt ?? (locale === "ko" ? "상세 영수증 보기" : "View Detailed Receipt")}</span>
          <svg
            className="h-5 w-5 text-slate-400 transition-transform duration-150 rotate-0 group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-5">
          {/* 전체 여행 공통 비용 (tripWideSection) */}
          {plan.tripWideSection.lineItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {dict.planner.tripWideExpenses}
              </h4>
              <div className="space-y-2.5 pl-1.5 border-l border-slate-100">
                {plan.tripWideSection.lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-xs gap-4">
                    <div>
                      <span className="text-slate-800 font-bold block">{getBasketLabel(item.basketId, dict, locale)}</span>
                      <span className="text-[10px] text-slate-400 italic block mt-0.5">{getCalculationExpression(item, dict, locale)}</span>
                    </div>
                    <span className="font-sans tabular-nums font-bold text-[#0f172a] whitespace-nowrap">{formatKrw(item.lineTotalKrw)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 도시별 비용 (citySections) */}
          {draft.selectedCities.map((city) => {
            const section = plan.citySections[city];
            if (!section || section.lineItems.length === 0) return null;

            const label = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
            const cityNights = section.nights;

            return (
              <div key={city} className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-sm font-extrabold text-[#0f172a]">
                    {label} <span className="text-[11px] font-bold text-slate-400">({cityNights}박)</span>
                  </h4>
                  <span className="text-xs font-extrabold text-slate-800 whitespace-nowrap">{formatKrw(section.subtotalKrw)}</span>
                </div>

                <div className="space-y-2.5 pl-1.5 border-l border-slate-100">
                  {section.lineItems.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between items-start text-xs gap-4">
                        <div>
                          <span className="text-slate-700 font-medium block">
                            {item.sourceLabel || getBasketLabel(item.basketId, dict, locale, item.cityCode || city)}
                          </span>
                          <span className="text-[10px] text-slate-400 italic block mt-0.5">{getCalculationExpression(item, dict, locale)}</span>
                        </div>
                        <span className="font-sans tabular-nums font-semibold text-slate-700 whitespace-nowrap">{formatKrw(item.lineTotalKrw)}</span>
                      </div>
                      {item.category === "FOOD" && isCalculatedMealPlan(item.mealPlan) && (
                        <div className="w-full overflow-x-auto">
                          <FoodReceiptDetails
                            mealPlan={item.mealPlan}
                            locale={locale}
                            dict={dict}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 도시 간 교통 (intercitySection) */}
          {plan.intercitySection.lineItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-extrabold text-[#0f172a]">
                  {dict.planner.intercityTransportation}
                </h4>
                <span className="text-xs font-extrabold text-slate-800 whitespace-nowrap">{formatKrw(plan.intercitySection.subtotalKrw)}</span>
              </div>

              <div className="space-y-2 pl-1.5 border-l border-slate-100">
                {plan.intercitySection.lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-xs gap-4">
                    <div>
                      <span className="text-slate-700 font-medium block">
                        {item.sourceLabel || getBasketLabel(item.basketId, dict, locale)}
                      </span>
                      <span className="text-[10px] text-slate-400 italic block mt-0.5">{getCalculationExpression(item, dict, locale)}</span>
                    </div>
                    <span className="font-sans tabular-nums font-semibold text-slate-700 whitespace-nowrap">{formatKrw(item.lineTotalKrw)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>

      {/* 4.8. Paid One-Stop Report: Personalized K-Trend Preview Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a]">
              {dict.trendSection.personalizedTitle}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {dict.trendSection.personalizedSubtitle}
            </p>
          </div>
          <span className="text-[10px] font-extrabold text-[#e25c5c] bg-[#fdf2f2] px-2 py-0.5 rounded border border-[#fce8e8] uppercase tracking-wide shrink-0">
            One-Stop Preview
          </span>
        </div>

        {/* Lock Info Notice */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2.5">
          <svg className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-semibold">{dict.trendSection.personalizedLockedNotice}</span>
        </div>

        {/* Personalized Cards List */}
        {personalizedTrends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personalizedTrends.map(({ trend, reason }, idx) => {
              const trans = trend.translations[locale === "en" ? "en" : "ko"];
              const cityName = trend.city === "ALL" ? (locale === "en" ? "All Cities" : "전체 도시") : (locale === "en" ? CITY_ENGLISH_NAMES[trend.city as SupportedCity] || trend.city : CITY_KOREAN_NAMES[trend.city as SupportedCity] || trend.city);

              return (
                <div
                  key={trend.id || idx}
                  className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/70 flex flex-col justify-between space-y-3 opacity-85 select-none relative overflow-hidden"
                  aria-disabled="true"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/50 uppercase">
                        {cityName}
                      </span>
                      <span className="text-[9px] font-extrabold text-[#e25c5c] bg-white px-2 py-0.5 rounded border border-slate-200">
                        Locked Preview
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800">
                      {trans.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {trans.overview}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-600 font-bold space-y-1">
                    <span className="text-slate-400 block font-semibold">{dict.trendSection.reasonLabel}</span>
                    <span className="text-[#0f172a] block">{reason}</span>
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

      {/* 5. Paid One-Stop Report Lock UI section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h3 className="text-base font-extrabold text-[#0f172a]">
            {dict.planner.paidLockTitle}
          </h3>
          <span className="text-[10px] font-extrabold text-[#e25c5c] bg-[#fdf2f2] px-2 py-0.5 rounded border border-[#fce8e8] uppercase tracking-wide">
            {dict.planner.paidLockNotice}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paidFeatures.map((feat, index) => (
            <div
              key={index}
              className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between opacity-80 select-none relative overflow-hidden"
              aria-disabled="true"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h4 className="text-xs font-extrabold text-slate-700">{feat.title}</h4>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 font-medium">{feat.desc}</p>
              </div>
              <div className="mt-4 flex items-center justify-between w-full border-t border-slate-100 pt-2 text-[10px] font-bold text-slate-400">
                <span>Premium Feature</span>
                <span className="text-[#e25c5c] uppercase tracking-wider text-[9px] bg-white px-2 py-0.5 rounded border border-slate-200">
                  Locked
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
