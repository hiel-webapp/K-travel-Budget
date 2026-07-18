"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { loadTripDraft, loadPlannerPreferencesEx } from "../lib/storage-helper";
import { generateInitialBudgetPlan } from "../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";
import {
  formatKrw,
  formatPercentage,
  getCategoryLabel,
} from "../features/budget/presentation/formatters";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";
import type { TripDraft } from "../lib/trip-domain";
import type { PlannerPreferences, BudgetCategory } from "../features/budget/domain/types";

interface ReportContentProps {
  locale: Locale;
  dict: Dictionary;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ReportContent({ locale, dict }: ReportContentProps) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [draft] = useState<TripDraft | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return loadTripDraft();
    } catch {
      return null;
    }
  });

  const [preferences] = useState<PlannerPreferences | null>(() => {
    if (typeof window === "undefined" || !draft) return null;
    try {
      const res = loadPlannerPreferencesEx(draft);
      return res.status === "valid" ? res.preferences : null;
    } catch {
      return null;
    }
  });

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
      <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#e25c5c]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#0f172a]">{dict.planner.missingTitle}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{dict.planner.missingDescription}</p>
        <button
          onClick={() => router.push(`/${locale}/planner`)}
          className="w-full h-11 rounded-xl bg-[#e25c5c] text-white font-bold text-sm shadow hover:bg-[#d14b4b] transition-colors cursor-pointer"
        >
          {dict.planner.missingButton}
        </button>
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
            Based on {draft.adultCount} {draft.adultCount === 1 ? "traveler" : "travelers"}
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
            Total {draft.totalNights + 1} days ({draft.totalNights} nights)
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
                  <span className="text-red-500 font-mono">+{formatKrw(diffAmount)}</span>
                </>
              ) : (
                <>
                  <span className="text-[#4d7c67]">{dict.planner.reportDiffUnder}</span>
                  <span className="text-[#4d7c67] font-mono">-{formatKrw(diffAmount)}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 font-medium">{dict.planner.reportNoTargetBudget}</p>
        )}
      </div>

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
                      <td className="py-2.5 text-right font-mono text-[#0f172a] font-extrabold">
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
                        {city === "SEOUL" ? "Seoul" : "Busan"}
                      </td>
                      <td className="py-2.5 text-center text-slate-600 font-bold">
                        {section.nights}박
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#0f172a] font-extrabold">
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
                    <td className="py-2.5 text-right font-mono text-[#0f172a] font-extrabold">
                      {formatKrw(plan.intercitySection.subtotalKrw)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
