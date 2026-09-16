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
  const perTravelerTotalKrw = calculations.perTravelerTotalKrw || 0;

  // Rolling counter animations with ease-out quart curve
  const animatedGrandTotal = useCountUp(grandTotalKrw, 1100);
  const animatedDailyAverage = useCountUp(dailyAverageKrw, 1100);
  const animatedPerTraveler = Math.round(animatedGrandTotal / adults);

  // Real Category Breakdown Calculation
  const totalForPct = Math.max(1, grandTotalKrw);
  const stayAmount = calculations.sumAccTotal || 0;
  const foodAmount = calculations.sumFoodTotal || 0;
  const transportAmount = (calculations.sumTransportTotal || 0) + (calculations.intercityTotal || 0);
  const flexAmount =
    (calculations.sumAttractionTotal || 0) +
    (calculations.shoppingAmountKrw || 0) +
    (calculations.totalDailyAllowanceKrw || 0) +
    (calculations.computedEmergencyKrw || 0);

  const stayPct = Math.round((stayAmount / totalForPct) * 100);
  const foodPct = Math.round((foodAmount / totalForPct) * 100);
  const transportPct = Math.round((transportAmount / totalForPct) * 100);
  const flexPct = Math.max(0, 100 - stayPct - foodPct - transportPct);

  const categories = [
    {
      key: "stay",
      labelKo: "숙소",
      labelEn: "Stay",
      pct: stayPct,
      amount: stayAmount,
      hexColor: "#0d9488", // Teal
      textColorClass: "text-teal-600",
      dotColorClass: "bg-teal-600",
    },
    {
      key: "food",
      labelKo: "식비",
      labelEn: "Dining",
      pct: foodPct,
      amount: foodAmount,
      hexColor: "#fb7185", // Coral / Rose
      textColorClass: "text-rose-500",
      dotColorClass: "bg-rose-500",
    },
    {
      key: "transport",
      labelKo: "교통",
      labelEn: "Transit",
      pct: transportPct,
      amount: transportAmount,
      hexColor: "#6366f1", // Indigo
      textColorClass: "text-indigo-600",
      dotColorClass: "bg-indigo-600",
    },
    {
      key: "flex",
      labelKo: "쇼핑·체험·비상금",
      labelEn: "Activities & Flex",
      pct: flexPct,
      amount: flexAmount,
      hexColor: "#f59e0b", // Amber
      textColorClass: "text-amber-600",
      dotColorClass: "bg-amber-500",
    },
  ];

  // SVG Ring Chart calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // 339.292

  let accumulatedOffset = 0;
  const segments = categories.map((cat) => {
    const dashLength = (cat.pct / 100) * circumference;
    const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += dashLength;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Target Health Metrics
  const targetBudget = calculations.basePlan?.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(grandTotalKrw - targetBudget);
  const targetUsagePercent = targetBudget > 0 ? (grandTotalKrw / targetBudget) * 100 : 0;

  return (
    <div className="w-full relative">
      {/* 2-Column Bento Grid: Left 2 cols (Total Budget & Ring Chart) + Right 1 col (Daily Expense Insight) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
        
        {/* ========================================================================= */}
        {/* 1. Card A: 총 예상 경비 & 4대 카테고리 링 차트 (col-span-1 md:col-span-2) */}
        {/* ========================================================================= */}
        <div className="col-span-1 md:col-span-2 p-5 sm:p-7 md:p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
          <div>
            {/* Top Badge & Header */}
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                TOTAL ESTIMATED BUDGET (KRW)
              </span>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
                {nights}{locale === "ko" ? "박 " : "N "}{travelDays}{locale === "ko" ? "일 " : "D "}· {adults}{locale === "ko" ? "인 견적" : " Pax"}
              </span>
            </div>

            {/* Big Rolling Metric */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 tabular-nums">
                {formatKrw(animatedGrandTotal)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60">
                {locale === "ko"
                  ? `1인당 ${formatKrw(animatedPerTraveler)}`
                  : `${formatKrw(animatedPerTraveler)} / person`}
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium mt-1">
              {locale === "ko"
                ? "플래너에서 직접 담은 숙소, 식비, 교통, 명소 및 비상금이 100% 반영된 종합 실비입니다."
                : "Comprehensive actual breakdown based on your selected stays, meals, transit, and activities."}
            </p>
          </div>

          {/* SVG Ring Donut Chart & Category Breakdown Legend */}
          <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Left: SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Circle */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  className="stroke-neutral-100"
                  strokeWidth="15"
                  fill="transparent"
                />
                {/* Colored Segments */}
                {segments.map((seg) => {
                  if (seg.pct <= 0) return null;
                  return (
                    <circle
                      key={seg.key}
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke={seg.hexColor}
                      strokeWidth="15"
                      fill="transparent"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
              </svg>
              {/* Center Donut Capsule Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                <span className="text-[10px] font-medium text-neutral-400 block leading-tight">
                  {locale === "ko" ? "지출 비중" : "Breakdown"}
                </span>
                <span className="text-[12px] font-bold text-neutral-800 leading-tight">
                  {locale === "ko" ? "4대 카테고리" : "4 Sectors"}
                </span>
              </div>
            </div>

            {/* Right: Category Legend Grid (2x2) */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="p-2.5 rounded-2xl bg-neutral-50/70 border border-neutral-100 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cat.dotColorClass}`} />
                      <span className="font-semibold text-neutral-700 text-[11px]">
                        {locale === "ko" ? cat.labelKo : cat.labelEn}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-neutral-400 tabular-nums">
                      {cat.pct}%
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-neutral-900 tabular-nums">
                    {formatKrw(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Daily Expense Insight (col-span-1) - Moved to where Suggested Spot was */}
        {/* ========================================================================= */}
        <div className="col-span-1 p-5 sm:p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
          <div>
            {/* Top Label */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                DAILY EXPENSE INSIGHT
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                {travelDays}{locale === "ko" ? "일간 페이싱" : " Days Pacing"}
              </span>
            </div>

            {/* Metric with Rolling Counter */}
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 block tabular-nums">
                ~{formatKrw(animatedDailyAverage)}
              </span>
              <span className="text-xs text-neutral-500 font-medium block mt-0.5">
                {locale === "ko" ? `/ 1일 전체 예상 지출` : `/ day total estimate`}
              </span>
            </div>

            {/* Target Budget Health or Smart Plan Badge */}
            <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600">
                  {targetBudget > 0 ? (locale === "ko" ? "목표 예산 비교" : "Target Health") : (locale === "ko" ? "예산 플랜 유형" : "Plan Type")}
                </span>
                {targetBudget > 0 ? (
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isOverBudget
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-teal-50 text-teal-700 border-teal-200"
                    }`}
                  >
                    {isOverBudget ? (locale === "ko" ? "예산 초과" : "Over Budget") : (locale === "ko" ? "안전 권역" : "Within Target")}
                  </span>
                ) : (
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    {locale === "ko" ? "합리적인 여행가" : "Smart Traveler"}
                  </span>
                )}
              </div>

              {targetBudget > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                    <span className="text-neutral-500">{formatPercentage(targetUsagePercent)}</span>
                    <span className={isOverBudget ? "text-rose-600" : "text-teal-700"}>
                      {isOverBudget ? `+ ${formatKrw(diffAmount)}` : `- ${formatKrw(diffAmount)}`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
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
          </div>

          {/* Footer info note */}
          <p className="text-[11px] text-neutral-400 mt-4 leading-relaxed">
            {locale === "ko"
              ? `1인당 1일 약 ${formatKrw(Math.round(dailyAverageKrw / adults))}으로 계획된 균형 잡힌 일정입니다.`
              : `Comfortable daily pacing of approx. ${formatKrw(Math.round(dailyAverageKrw / adults))} per traveler.`}
          </p>
        </div>

      </div>
    </div>
  );
}
