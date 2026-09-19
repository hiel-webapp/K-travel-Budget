"use client";

import React from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripDraft } from "src/lib/trip-domain";
import { useCountUp } from "src/lib/hooks/useCountUp";
import { formatKrw, formatPercentage } from "src/features/budget/presentation/formatters";

export interface ReportBentoDashboardProps {
  calculations: {
    grandTotalKrw: number;
    perTravelerTotalKrw: number;
    dailyAverageKrw: number;
    sumAccTotal: number;
    sumFoodTotal: number;
    sumTransportTotal: number;
    intercityTotal: number;
    sumAttractionTotal: number;
    shoppingAmountKrw: number;
    totalDailyAllowanceKrw: number;
    computedEmergencyKrw: number;
    adultCount: number;
    totalNights: number;
    travelDays: number;
    sumCitySubtotals: number;
    basePlan: any;
    cityBreakdown: Record<string, any>;
  };
  draft: TripDraft;
  locale: Locale;
  dict: Dictionary;
}

export default function ReportBentoDashboard({
  calculations,
  draft,
  locale,
}: ReportBentoDashboardProps) {
  const nights = draft.totalNights || 1;
  const travelDays = calculations.travelDays || nights + 1;
  const adults = calculations.adultCount || 1;
  const grandTotalKrw = calculations.grandTotalKrw || 0;
  const dailyAverageKrw = calculations.dailyAverageKrw || 0;

  // Rolling counter animations
  const animatedGrandTotal = useCountUp(grandTotalKrw, 1100);
  const animatedDailyAverage = useCountUp(dailyAverageKrw, 1100);
  const animatedPerTraveler = Math.round(animatedGrandTotal / adults);

  // Approximate USD Conversion (Standard Ref Rate ~1,350 KRW / USD)
  const usdRate = 1350;
  const usdGrandTotal = Math.round(grandTotalKrw / usdRate);
  const usdPerTraveler = Math.round(usdGrandTotal / adults);

  // Target Budget Metrics
  const targetBudget = calculations.basePlan?.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(grandTotalKrw - targetBudget);
  const targetUsagePercent = targetBudget > 0 ? (grandTotalKrw / targetBudget) * 100 : 0;

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-6 sm:p-7 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.05)] transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-8 items-stretch">
        
        {/* Left: Total Estimated Budget (KRW & USD) */}
        <div className="flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                TOTAL ESTIMATED BUDGET
              </span>
              <span className="text-[10px] font-bold text-neutral-400">·</span>
              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                ≈ ${usdGrandTotal.toLocaleString()} USD
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 pt-1 flex-nowrap overflow-visible">
              <span className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black tracking-tight text-neutral-900 tabular-nums shrink-0">
                {formatKrw(animatedGrandTotal)}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 sm:px-3 py-1 rounded-full border border-neutral-200/60 whitespace-nowrap shrink-0">
                {locale === "ko"
                  ? `1인당 ${formatKrw(animatedPerTraveler)} (≈ $${usdPerTraveler.toLocaleString()})`
                  : `${formatKrw(animatedPerTraveler)} / person (≈ $${usdPerTraveler.toLocaleString()})`}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-400 font-medium leading-relaxed">
            {locale === "ko"
              ? "플래너에서 직접 담은 숙소, 식비, 교통, 명소 및 비상금이 100% 반영된 종합 실비입니다."
              : "Comprehensive actual expenditure based on your selected stays, meals, transit, and activities."}
          </p>
        </div>

        {/* Right: Daily Expense Insight & Target Budget Pacing */}
        <div className="border-t pt-6 lg:pt-0 lg:border-t-0 lg:border-l lg:border-neutral-100 lg:pl-8 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            {/* Header: Title + Pacing Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                DAILY EXPENSE INSIGHT
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/70 shadow-2xs">
                {travelDays}{locale === "ko" ? "일간 페이싱" : " Days Pacing"}
              </span>
            </div>

            {/* Price & Target Status */}
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-neutral-900 tabular-nums">
                  ~{formatKrw(animatedDailyAverage)}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  {locale === "ko" ? `/ 1일 예상 지출` : `/ day total estimate`}
                </span>
              </div>

              {targetBudget > 0 ? (
                <span
                  className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shrink-0 ${
                    isOverBudget
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-teal-50 text-teal-700 border-teal-200"
                  }`}
                >
                  {isOverBudget ? (locale === "ko" ? "예산 초과" : "Over Budget") : (locale === "ko" ? "안전 권역" : "Within Target")}
                </span>
              ) : (
                <span className="bg-teal-50 text-teal-700 border border-teal-200/80 text-[11px] px-3 py-1 rounded-full font-bold shadow-2xs shrink-0">
                  {locale === "ko" ? "합리적인 여행가" : "Smart Traveler"}
                </span>
              )}
            </div>

            {/* Target Budget Comparison Progress */}
            {targetBudget > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                  <span className="text-neutral-500">{formatPercentage(targetUsagePercent)}</span>
                  <span className={isOverBudget ? "text-rose-600" : "text-teal-700"}>
                    {isOverBudget ? `+ ${formatKrw(diffAmount)}` : `- ${formatKrw(diffAmount)}`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget ? "bg-rose-500" : "bg-teal-600"
                    }`}
                    style={{ width: `${Math.min(targetUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed font-medium">
            {locale === "ko"
              ? `1인당 1일 약 ${formatKrw(Math.round(dailyAverageKrw / adults))} (≈ $${Math.round(dailyAverageKrw / adults / usdRate)})으로 계획된 균형 잡힌 일정입니다.`
              : `Comfortable daily pacing of approx. ${formatKrw(Math.round(dailyAverageKrw / adults))} (≈ $${Math.round(dailyAverageKrw / adults / usdRate)}) per traveler.`}
          </p>
        </div>

      </div>
    </div>
  );
}
