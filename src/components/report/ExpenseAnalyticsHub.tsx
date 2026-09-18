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
  const isKo = locale === "ko";
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
      barColor: "bg-teal-500",
      dotColorClass: "bg-teal-500",
      textColor: "text-teal-700",
    },
    {
      key: "food",
      labelKo: "식비",
      labelEn: "Dining",
      pct: foodPct,
      amount: foodAmount,
      barColor: "bg-rose-500",
      dotColorClass: "bg-rose-500",
      textColor: "text-rose-700",
    },
    {
      key: "transport",
      labelKo: "교통",
      labelEn: "Transit",
      pct: transportPct,
      amount: transportAmount,
      barColor: "bg-indigo-500",
      dotColorClass: "bg-indigo-500",
      textColor: "text-indigo-700",
    },
    {
      key: "flex",
      labelKo: "쇼핑·체험·기타",
      labelEn: "Activities & Flex",
      pct: flexPct,
      amount: flexAmount,
      barColor: "bg-amber-500",
      dotColorClass: "bg-amber-500",
      textColor: "text-amber-700",
    },
  ];

  // 2. 도시별 지출 비중 계산
  const sumCitySubtotals = calculations.sumCitySubtotals || 0;
  const safeCitySum = Math.max(1, sumCitySubtotals);
  const cityPalette = [
    { barColor: "bg-slate-900", dot: "bg-slate-900", textColor: "text-slate-900" },
    { barColor: "bg-indigo-600", dot: "bg-indigo-600", textColor: "text-indigo-600" },
    { barColor: "bg-teal-600", dot: "bg-teal-600", textColor: "text-teal-600" },
    { barColor: "bg-amber-500", dot: "bg-amber-500", textColor: "text-amber-600" },
    { barColor: "bg-pink-500", dot: "bg-pink-500", textColor: "text-pink-600" },
  ];

  const cityList = draft.selectedCities.map((city, idx) => {
    const sub = calculations.cityBreakdown?.[city]?.subtotalKrw || 0;
    const pct = Math.round((sub / safeCitySum) * 100);
    const color = cityPalette[idx % cityPalette.length];
    const cityName = isKo
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

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
              3-Way Financial Audit
            </span>
            <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
              {isKo ? "원스톱 예산 분석 허브" : "Expense Analytics Hub"}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {isKo
              ? "카테고리별 비중, 도시별 비중, 세부 지출 집계표를 탭 이동 없이 나란히 대조합니다."
              : "Cross-examine category share, city allocation, and detailed audit table side-by-side without toggling."}
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-400 self-start sm:self-auto tabular-nums">
          {isKo ? `총 ${draft.selectedCities.length}개 도시 분석` : `${draft.selectedCities.length} Cities Audited`}
        </span>
      </div>

      {/* 3-Column Parallel Grid: 3 : 3 : 6 비대칭 비율로 집계표의 가로 공간을 대폭 확장 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        
        {/* ========================================================================= */}
        {/* Col 1: 4대 카테고리 지출 비중 가로 막대 그래프 (xl:col-span-3) */}
        {/* ========================================================================= */}
        <div className="xl:col-span-3 flex flex-col justify-between space-y-3.5 p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
            <span className="text-xs font-black text-neutral-900 tracking-tight">
              {isKo ? "1. 카테고리별 비중" : "1. By Category"}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">4 SECTORS</span>
          </div>

          {/* 가로 막대 그래프 & 상단 비중(%) 라벨 */}
          <div className="space-y-2 py-1">
            {/* 그래프 상단 비중(%) 지표 스트립 */}
            <div className="flex items-center justify-between gap-1 text-[11px] font-black tabular-nums">
              {categories.map((cat) => (
                <div key={cat.key} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${cat.dotColorClass}`} />
                  <span className={cat.textColor}>{cat.pct}%</span>
                </div>
              ))}
            </div>

            {/* 가로 누적 막대 그래프 (Horizontal Stacked Bar) */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-neutral-200/60 p-0.5 shadow-inner">
              {categories.map((cat) => {
                if (cat.pct <= 0) return null;
                return (
                  <div
                    key={cat.key}
                    style={{ width: `${cat.pct}%` }}
                    className={`${cat.barColor} h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-500 flex items-center justify-center text-white text-[10px] font-black select-none overflow-hidden`}
                    title={`${isKo ? cat.labelKo : cat.labelEn}: ${cat.pct}% (${formatKrw(cat.amount)})`}
                  >
                    {cat.pct >= 14 && <span>{cat.pct}%</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 2x2 카드: % 기호 제거, 항목명과 금액만 선명하게 표시 */}
          <div className="grid grid-cols-2 gap-2 w-full pt-1">
            {categories.map((cat) => (
              <div
                key={cat.key}
                className="p-2.5 rounded-xl bg-white border border-neutral-200/80 flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0 mb-1">
                  <span className={`w-2 h-2 rounded-full ${cat.dotColorClass} shrink-0`} />
                  <span className="text-[11px] font-bold text-neutral-700 truncate">
                    {isKo ? cat.labelKo : cat.labelEn}
                  </span>
                </div>
                <span className="text-xs font-black text-neutral-900 tabular-nums">
                  {formatKrw(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Col 2: 방문 도시별 비중 가로 막대 그래프 (xl:col-span-3) */}
        {/* ========================================================================= */}
        <div className="xl:col-span-3 flex flex-col justify-between space-y-3.5 p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
            <span className="text-xs font-black text-neutral-900 tracking-tight">
              {isKo ? "2. 방문 도시별 비중" : "2. By City Allocation"}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">CITIES</span>
          </div>

          {/* 가로 막대 그래프 & 상단 비중(%) 라벨 */}
          <div className="space-y-2 py-1">
            {/* 그래프 상단 비중(%) 지표 스트립 */}
            <div className="flex items-center justify-between gap-1 text-[11px] font-black tabular-nums">
              {cityList.map((c) => (
                <div key={c.city} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={c.textColor}>{c.cityName} {c.pct}%</span>
                </div>
              ))}
            </div>

            {/* 가로 누적 막대 그래프 (Horizontal Stacked Bar) */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-neutral-200/60 p-0.5 shadow-inner">
              {cityList.map((c) => {
                if (c.pct <= 0) return null;
                return (
                  <div
                    key={c.city}
                    style={{ width: `${c.pct}%` }}
                    className={`${c.barColor} h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-500 flex items-center justify-center text-white text-[10px] font-black select-none overflow-hidden`}
                    title={`${c.cityName}: ${c.pct}% (${formatKrw(c.subtotal)})`}
                  >
                    {c.pct >= 14 && <span>{c.pct}%</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 도시 카드: % 기호 제거, 도시명과 금액만 선명하게 표시 */}
          <div className="grid grid-cols-2 gap-2 w-full pt-1">
            {cityList.map((c) => (
              <div
                key={c.city}
                className="p-2.5 rounded-xl bg-white border border-neutral-200/80 flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0 mb-1">
                  <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                  <span className="text-[11px] font-bold text-neutral-700 truncate">
                    {c.cityName}
                  </span>
                </div>
                <span className="text-xs font-black text-neutral-900 tabular-nums">
                  {formatKrw(c.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Col 3: 도시별 4대 부문 지출 집계 테이블 (xl:col-span-6 / 50%의 여유 공간 확보) */}
        {/* ========================================================================= */}
        <div className="xl:col-span-6 flex flex-col justify-between space-y-3 p-4 sm:p-5 rounded-2xl bg-neutral-50/60 border border-neutral-200/70">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-neutral-900 tracking-tight">
                {isKo ? "3. 도시별 4대 부문 집계표" : "3. City Financial Audit"}
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                {isKo ? "여유로운 세부 표출" : "Itemized Audit"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">BREAKDOWN</span>
          </div>

          <div className="overflow-x-auto flex-1 flex flex-col justify-start">
            <table className="w-full text-left text-xs border-collapse font-medium">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 font-bold">{isKo ? "도시" : "City"}</th>
                  <th className="py-2 text-center font-bold">{isKo ? "체류" : "Nights"}</th>
                  <th className="py-2 text-right font-bold">{isKo ? "숙소" : "Stay"}</th>
                  <th className="py-2 text-right font-bold">{isKo ? "식비" : "Food"}</th>
                  <th className="py-2 text-right font-bold">{isKo ? "교통" : "Transit"}</th>
                  <th className="py-2 text-right font-bold">{isKo ? "관광" : "Attr"}</th>
                  <th className="py-2 text-right font-black text-neutral-900">{isKo ? "소계" : "Subtotal"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/70 text-neutral-700">
                {draft.selectedCities.map((city) => {
                  const cInfo = calculations.cityBreakdown?.[city];
                  if (!cInfo) return null;

                  return (
                    <tr key={city} className="hover:bg-white/90 transition-colors">
                      <td className="py-2.5 font-bold text-neutral-900">
                        {isKo ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                      </td>
                      <td className="py-2.5 text-center text-neutral-500 tabular-nums">
                        {cInfo.nights === 0 ? (isKo ? "당일" : "Day") : `${cInfo.nights}N`}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600 font-medium">{formatKrw(cInfo.stayTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600 font-medium">{formatKrw(cInfo.foodTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600 font-medium">{formatKrw(cInfo.transportTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600 font-medium">{formatKrw(cInfo.attractionTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums font-black text-neutral-900">{formatKrw(cInfo.subtotalKrw)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2.5 border-t border-neutral-200/80 flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-500">
              {isKo ? "도시별 지출 소계 합계" : "Sum of City Subtotals"}
            </span>
            <span className="font-black text-neutral-900 text-sm tabular-nums">
              {formatKrw(sumCitySubtotals)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
