"use client";

import React from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripDraft } from "src/lib/trip-domain";
import { useCountUp } from "src/lib/hooks/useCountUp";
import { formatKrw, formatPercentage } from "src/features/budget/presentation/formatters";
import { useExchangeRate } from "src/lib/hooks/useExchangeRate";
import { formatUsd } from "src/lib/currency/currency-converter";

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

  // Real-time Exchange Rate (USD/KRW)
  const { rate: usdRate } = useExchangeRate();
  const usdGrandTotal = Math.round(grandTotalKrw / usdRate);
  const usdDailyAverage = Math.round(dailyAverageKrw / usdRate);
  const usdPerTraveler = Math.round(usdGrandTotal / adults);

  // Rolling counter animations
  const animatedGrandTotalKrw = useCountUp(grandTotalKrw, 1100);
  const animatedGrandTotalUsd = useCountUp(usdGrandTotal, 1100);
  const animatedDailyAverageKrw = useCountUp(dailyAverageKrw, 1100);
  const animatedDailyAverageUsd = useCountUp(usdDailyAverage, 1100);

  const animatedPerTravelerKrw = Math.round(animatedGrandTotalKrw / adults);
  const animatedPerTravelerUsd = Math.round(animatedGrandTotalUsd / adults);

  // Target Budget Metrics
  const targetBudget = calculations.basePlan?.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(grandTotalKrw - targetBudget);
  const diffAmountUsd = Math.round(diffAmount / usdRate);
  const targetUsagePercent = targetBudget > 0 ? (grandTotalKrw / targetBudget) * 100 : 0;

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-6 sm:p-7 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.05)] transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-8 items-stretch">
        
        {/* Left: Total Estimated Budget (KRW & USD) */}
        <div className="flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                TOTAL ESTIMATED BUDGET
              </span>
              <span
                className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight shadow-2xs"
                title={locale === "ko" ? "실시간 외환 시장 고시 환율 기준" : "Live foreign exchange rate"}
              >
                {locale === "ko"
                  ? `환율: $1 ≈ ₩${Math.round(usdRate).toLocaleString("ko-KR")}`
                  : `$1 ≈ ₩${Math.round(usdRate).toLocaleString("en-US")}`}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 sm:gap-3.5 pt-1 flex-nowrap overflow-visible">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 tabular-nums shrink-0">
                {locale === "ko" ? formatKrw(animatedGrandTotalKrw) : formatUsd(animatedGrandTotalUsd)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60 whitespace-nowrap shrink-0">
                {locale === "ko"
                  ? `1인당 ${formatKrw(animatedPerTravelerKrw)} (≈ $${usdPerTraveler.toLocaleString()})`
                  : `${formatUsd(animatedPerTravelerUsd)} / person (₩${(Math.round(grandTotalKrw / adults)).toLocaleString()})`}
              </span>
            </div>

            <div className="pt-1.5">
              <span className="text-xs sm:text-sm font-bold text-neutral-500 tabular-nums">
                {locale === "ko"
                  ? `≈ $${usdGrandTotal.toLocaleString()} USD`
                  : `≈ ₩${grandTotalKrw.toLocaleString()} KRW`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Daily Expense Insight & Target Budget Pacing */}
        <div className="border-t pt-6 lg:pt-0 lg:border-t-0 lg:border-l lg:border-neutral-100 lg:pl-8 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            {/* Header: Title */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                DAILY EXPENSE INSIGHT
              </span>
            </div>

            {/* Price & 1인당 금액 (TOTAL ESTIMATED BUDGET과 동일한 스타일) */}
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-900 tabular-nums">
                  {locale === "ko" ? formatKrw(animatedDailyAverageKrw) : formatUsd(animatedDailyAverageUsd)}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  {locale === "ko" ? `/ 1일 예상 지출` : `/ day total estimate`}
                </span>
              </div>

              <span className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60 whitespace-nowrap shrink-0">
                {locale === "ko"
                  ? `1인당 ${formatKrw(Math.round(animatedDailyAverageKrw / adults))} (≈ $${Math.round(dailyAverageKrw / adults / usdRate)})`
                  : `${formatUsd(Math.round(dailyAverageKrw / adults / usdRate))} / person (₩${(Math.round(dailyAverageKrw / adults)).toLocaleString()})`}
              </span>
            </div>

            {/* Target Budget Comparison Progress + 안전 권역 표기 (하단 금액 뒤로 이동) */}
            {targetBudget > 0 ? (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                  <span className="text-neutral-500">{formatPercentage(targetUsagePercent)}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={isOverBudget ? "text-rose-600" : "text-teal-700"}>
                      {isOverBudget
                        ? (locale === "ko" ? `+ ${formatKrw(diffAmount)}` : `+ ${formatUsd(diffAmountUsd)}`)
                        : (locale === "ko" ? `- ${formatKrw(diffAmount)}` : `- ${formatUsd(diffAmountUsd)}`)}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                        isOverBudget
                          ? "bg-rose-50 text-rose-600 border-rose-200"
                          : "bg-teal-50 text-teal-700 border-teal-200"
                      }`}
                    >
                      {isOverBudget ? (locale === "ko" ? "예산 초과" : "Over Budget") : (locale === "ko" ? "안전 권역" : "Within Target")}
                    </span>
                  </div>
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
            ) : (
              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <span className="text-neutral-400">{locale === "ko" ? "목표 예산 미설정" : "No Target Set"}</span>
                <span className="bg-teal-50 text-teal-700 border border-teal-200/80 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs shrink-0">
                  {locale === "ko" ? "합리적인 여행가" : "Smart Traveler"}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
