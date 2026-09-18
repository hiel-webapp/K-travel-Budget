"use client";

import React from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripDraft } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import { formatKrw } from "src/features/budget/presentation/formatters";
import type { TripBudgetSummary } from "src/features/budget/calculations/trip-budget-calculator";

export interface ExpenseAnalyticsHubProps {
  calculations: TripBudgetSummary;
  draft: TripDraft;
  locale: Locale;
  dict: Dictionary;
}

export default function ExpenseAnalyticsHub({
  calculations,
  draft,
  locale,
}: ExpenseAnalyticsHubProps) {
  const grandTotalKrw = calculations.grandTotalKrw || 0;
  const totalForPct = Math.max(1, grandTotalKrw);

  // 1. 카테고리 4대 부문 지출 계산
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
      labelKo: "쇼핑·체험·기타",
      labelEn: "Activities & Flex",
      pct: flexPct,
      amount: flexAmount,
      hexColor: "#f59e0b", // Amber
      textColorClass: "text-amber-600",
      dotColorClass: "bg-amber-500",
    },
  ];

  // SVG Ring Chart 기본 제원
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.159

  let categoryAccumulatedOffset = 0;
  const categorySegments = categories.map((cat) => {
    const dashLength = (cat.pct / 100) * circumference;
    const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
    const strokeDashoffset = -categoryAccumulatedOffset;
    categoryAccumulatedOffset += dashLength;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // 2. 도시별 지출 비중 계산
  const sumCitySubtotals = calculations.sumCitySubtotals || 0;
  const safeCitySum = Math.max(1, sumCitySubtotals);
  const cityPalette = [
    { hex: "#0f172a", bg: "bg-slate-900", dot: "bg-slate-900" },
    { hex: "#6366f1", bg: "bg-indigo-600", dot: "bg-indigo-600" },
    { hex: "#0d9488", bg: "bg-teal-600", dot: "bg-teal-600" },
    { hex: "#f59e0b", bg: "bg-amber-500", dot: "bg-amber-500" },
    { hex: "#ec4899", bg: "bg-pink-500", dot: "bg-pink-500" },
  ];

  const cityList = draft.selectedCities.map((city, idx) => {
    const sub = calculations.cityBreakdown?.[city]?.subtotalKrw || 0;
    const pct = Math.round((sub / safeCitySum) * 100);
    const color = cityPalette[idx % cityPalette.length];
    const cityName =
      locale === "ko"
        ? CITY_KOREAN_NAMES[city] || city
        : CITY_ENGLISH_NAMES[city] || city;
    return {
      city,
      cityName,
      subtotal: sub,
      pct,
      ...color,
    };
  });

  let cityAccumulatedOffset = 0;
  const citySegments = cityList.map((c) => {
    const dashLength = (c.pct / 100) * circumference;
    const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
    const strokeDashoffset = -cityAccumulatedOffset;
    cityAccumulatedOffset += dashLength;
    return {
      ...c,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              3-Way Financial Audit
            </span>
            <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
              {locale === "ko" ? "원스톱 예산 분석 허브" : "Expense Analytics Hub"}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {locale === "ko"
              ? "카테고리별 비중, 도시별 비중, 세부 지출 집계표를 탭 이동 없이 나란히 대조합니다."
              : "Cross-examine category share, city allocation, and detailed audit table side-by-side without toggling."}
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-400 self-start sm:self-auto tabular-nums">
          {locale === "ko" ? `총 ${draft.selectedCities.length}개 도시 분석` : `${draft.selectedCities.length} Cities Audited`}
        </span>
      </div>

      {/* 3-Column Parallel Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        
        {/* ========================================================================= */}
        {/* Col 1: 4대 카테고리 지출 비중 도넛 */}
        {/* ========================================================================= */}
        <div className="flex flex-col justify-between space-y-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
            <span className="text-xs font-black text-neutral-800 tracking-tight">
              {locale === "ko" ? "1. 카테고리별 비중" : "1. By Category"}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">4 SECTORS</span>
          </div>

          <div className="flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-4 py-1">
            {/* SVG Donut */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="stroke-neutral-200/60"
                  strokeWidth="14"
                  fill="transparent"
                />
                {categorySegments.map((seg) => {
                  if (seg.pct <= 0) return null;
                  return (
                    <circle
                      key={seg.key}
                      cx="65"
                      cy="65"
                      r={radius}
                      stroke={seg.hexColor}
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                <span className="text-[9px] font-semibold text-neutral-400 block leading-none">
                  {locale === "ko" ? "부문별" : "Category"}
                </span>
                <span className="text-[11px] font-black text-neutral-800 leading-tight mt-0.5">
                  100%
                </span>
              </div>
            </div>

            {/* 2x2 Grid Legend */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="p-2 rounded-xl bg-white border border-neutral-200/70 flex flex-col justify-between shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${cat.dotColorClass} shrink-0`} />
                      <span className="font-bold text-neutral-700 truncate">
                        {locale === "ko" ? cat.labelKo : cat.labelEn}
                      </span>
                    </div>
                    <span className="font-extrabold text-neutral-400 tabular-nums shrink-0 ml-1">
                      {cat.pct}%
                    </span>
                  </div>
                  <span className="text-xs font-black text-neutral-900 tabular-nums">
                    {formatKrw(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Col 2: 방문 도시별 비중 도넛 */}
        {/* ========================================================================= */}
        <div className="flex flex-col justify-between space-y-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
            <span className="text-xs font-black text-neutral-800 tracking-tight">
              {locale === "ko" ? "2. 방문 도시별 비중" : "2. By City Allocation"}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">CITIES</span>
          </div>

          <div className="flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-4 py-1">
            {/* SVG Donut */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="stroke-neutral-200/60"
                  strokeWidth="14"
                  fill="transparent"
                />
                {citySegments.map((seg) => {
                  if (seg.pct <= 0) return null;
                  return (
                    <circle
                      key={seg.city}
                      cx="65"
                      cy="65"
                      r={radius}
                      stroke={seg.hex}
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                <span className="text-[9px] font-semibold text-neutral-400 block leading-none">
                  {locale === "ko" ? "도시별" : "Cities"}
                </span>
                <span className="text-[11px] font-black text-neutral-800 leading-tight mt-0.5">
                  100%
                </span>
              </div>
            </div>

            {/* City Grid Legend */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {cityList.map((c) => (
                <div
                  key={c.city}
                  className="p-2 rounded-xl bg-white border border-neutral-200/70 flex flex-col justify-between shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                      <span className="font-bold text-neutral-700 truncate">
                        {c.cityName}
                      </span>
                    </div>
                    <span className="font-extrabold text-neutral-400 tabular-nums shrink-0 ml-1">
                      {c.pct}%
                    </span>
                  </div>
                  <span className="text-xs font-black text-neutral-900 tabular-nums">
                    {formatKrw(c.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Col 3: 도시별 4대 부문 지출 집계 테이블 */}
        {/* ========================================================================= */}
        <div className="flex flex-col justify-between space-y-3 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
            <span className="text-xs font-black text-neutral-800 tracking-tight">
              {locale === "ko" ? "3. 도시별 4대 부문 집계표" : "3. City Financial Audit"}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">BREAKDOWN</span>
          </div>

          <div className="overflow-x-auto flex-1 flex flex-col justify-start">
            <table className="w-full text-left text-[11px] border-collapse font-medium">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[9px] tracking-wider">
                  <th className="py-1.5 font-bold">{locale === "ko" ? "도시" : "City"}</th>
                  <th className="py-1.5 text-center font-bold">{locale === "ko" ? "박" : "N"}</th>
                  <th className="py-1.5 text-right font-bold">{locale === "ko" ? "숙소" : "Stay"}</th>
                  <th className="py-1.5 text-right font-bold">{locale === "ko" ? "식비" : "Food"}</th>
                  <th className="py-1.5 text-right font-bold">{locale === "ko" ? "교통" : "Trans"}</th>
                  <th className="py-1.5 text-right font-bold">{locale === "ko" ? "관광" : "Attr"}</th>
                  <th className="py-1.5 text-right font-black text-neutral-900">{locale === "ko" ? "소계" : "Sub"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 text-neutral-700">
                {draft.selectedCities.map((city) => {
                  const cInfo = calculations.cityBreakdown?.[city];
                  if (!cInfo) return null;

                  return (
                    <tr key={city} className="hover:bg-white/90 transition-colors">
                      <td className="py-2 font-bold text-neutral-900 truncate max-w-[65px]">
                        {locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                      </td>
                      <td className="py-2 text-center text-neutral-500 tabular-nums">
                        {cInfo.nights === 0 ? (locale === "ko" ? "당" : "0") : cInfo.nights}
                      </td>
                      <td className="py-2 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.stayTotalKrw)}</td>
                      <td className="py-2 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.foodTotalKrw)}</td>
                      <td className="py-2 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.transportTotalKrw)}</td>
                      <td className="py-2 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.attractionTotalKrw)}</td>
                      <td className="py-2 text-right tabular-nums font-black text-neutral-900">{formatKrw(cInfo.subtotalKrw)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-neutral-200/70 flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-500">
              {locale === "ko" ? "도시별 지출 합계" : "City Subtotal Sum"}
            </span>
            <span className="font-black text-neutral-900 tabular-nums">
              {formatKrw(sumCitySubtotals)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
