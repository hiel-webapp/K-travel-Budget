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
  const safeTotal = Math.max(1, grandTotalKrw);

  // 1. 5대 카테고리(숙소, 음식, 관광, 교통, 기타) 합계 계산
  const stayTotal = calculations.sumAccTotal || 0;
  const foodTotal = calculations.sumFoodTotal || 0;
  const attractionTotal = calculations.sumAttractionTotal || 0;
  const transportTotal =
    (calculations.sumTransportTotal || 0) + (calculations.intercityTotal || 0);

  // 기타: 숙소, 음식, 관광, 교통을 제외한 모든 잔여 예산(쇼핑, 일일 용돈, 비상금 등)
  const etcTotal = Math.max(
    0,
    grandTotalKrw - (stayTotal + foodTotal + attractionTotal + transportTotal)
  );

  // 비중 (%) 계산 (합계 100% 보정)
  const stayPct = Math.round((stayTotal / safeTotal) * 100);
  const foodPct = Math.round((foodTotal / safeTotal) * 100);
  const attrPct = Math.round((attractionTotal / safeTotal) * 100);
  const transPct = Math.round((transportTotal / safeTotal) * 100);
  const etcPct = Math.max(0, 100 - (stayPct + foodPct + attrPct + transPct));

  // 5대 카테고리 메타데이터 & 시각 일치 고유 색상 (순서: 숙소, 음식, 관광, 교통, 기타)
  const categoryList = [
    {
      key: "stay",
      label: isKo ? "숙소" : "Stay",
      pct: stayPct,
      amount: stayTotal,
      barColor: "bg-teal-500",
      textColor: "text-teal-600",
      dotColor: "bg-teal-500",
    },
    {
      key: "food",
      label: isKo ? "음식" : "Food",
      pct: foodPct,
      amount: foodTotal,
      barColor: "bg-rose-500",
      textColor: "text-rose-600",
      dotColor: "bg-rose-500",
    },
    {
      key: "attraction",
      label: isKo ? "관광" : "Attraction",
      pct: attrPct,
      amount: attractionTotal,
      barColor: "bg-amber-500",
      textColor: "text-amber-600",
      dotColor: "bg-amber-500",
    },
    {
      key: "transport",
      label: isKo ? "교통" : "Transit",
      pct: transPct,
      amount: transportTotal,
      barColor: "bg-indigo-500",
      textColor: "text-indigo-600",
      dotColor: "bg-indigo-500",
    },
    {
      key: "etc",
      label: isKo ? "기타" : "Others",
      pct: etcPct,
      amount: etcTotal,
      barColor: "bg-purple-500",
      textColor: "text-purple-600",
      dotColor: "bg-purple-500",
    },
  ];

  // 2. 도시별 고유 색상 팔레트 & 매핑
  const cityPalette = [
    { barColor: "bg-slate-900", dot: "bg-slate-900", textColor: "text-slate-900" },
    { barColor: "bg-blue-600", dot: "bg-blue-600", textColor: "text-blue-600" },
    { barColor: "bg-emerald-600", dot: "bg-emerald-600", textColor: "text-emerald-600" },
    { barColor: "bg-orange-500", dot: "bg-orange-500", textColor: "text-orange-500" },
    { barColor: "bg-sky-500", dot: "bg-sky-500", textColor: "text-sky-500" },
    { barColor: "bg-violet-600", dot: "bg-violet-600", textColor: "text-violet-600" },
    { barColor: "bg-pink-600", dot: "bg-pink-600", textColor: "text-pink-600" },
  ];

  const cityItems = draft.selectedCities.map((city, idx) => {
    const sub = calculations.cityBreakdown?.[city]?.subtotalKrw || 0;
    const pct = Math.round((sub / safeTotal) * 100);
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

  // 공통/자율(쇼핑·용돈·비상금·도시이동) 비중
  const commonSubtotal = Math.max(
    0,
    grandTotalKrw - (calculations.sumCitySubtotals || 0)
  );
  const commonPct = Math.max(
    0,
    100 - cityItems.reduce((acc, c) => acc + c.pct, 0)
  );

  const cityListWithCommon = [
    ...cityItems,
    ...(commonSubtotal > 0
      ? [
          {
            city: "COMMON",
            cityName: isKo ? "공통 / 자율" : "Common / Flex",
            subtotal: commonSubtotal,
            pct: commonPct,
            barColor: "bg-slate-500",
            dot: "bg-slate-500",
            textColor: "text-slate-600",
          },
        ]
      : []),
  ];

  // 총 체류 박수 계산
  const totalNights = draft.selectedCities.reduce((acc, city) => {
    return acc + (calculations.cityBreakdown?.[city]?.nights || 0);
  }, 0);

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
              Integrated Financial Audit
            </span>
            <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
              {isKo ? "원스톱 예산 분석 허브" : "Integrated Expense Audit"}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {isKo
              ? "도시별 5대 부문 집계표와 직관적으로 매칭된 세로 비중 그래프를 한눈에 대조합니다."
              : "Cross-examine the 5-sector audit table alongside color-synchronized vertical proportion bars."}
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-400 self-start sm:self-auto tabular-nums">
          {isKo ? `총 ${draft.selectedCities.length}개 도시 분석` : `${draft.selectedCities.length} Cities Audited`}
        </span>
      </div>

      {/* Main Unified Layout: 도시별 집계표(8열) + 세로 막대그래프 2개(4열) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ========================================================================= */}
        {/* 1. 도시별 5대 부문 집계표 (lg:col-span-8) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-neutral-50/60 border border-neutral-200/70">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-neutral-900 tracking-tight">
                {isKo ? "도시별 5대 부문 집계표" : "City Expense Audit Table"}
              </span>
              <span className="text-[10px] font-extrabold text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200/80">
                {isKo ? "가로·세로 소계 완비" : "Cross-Totaled"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">AUDIT MATRIX</span>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto flex-1 flex flex-col justify-between">
            <table className="w-full text-left text-xs border-collapse font-medium min-w-[520px]">
              <thead>
                <tr className="border-b border-neutral-200 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-bold text-neutral-500">{isKo ? "도시" : "City"}</th>
                  <th className="py-2.5 text-center font-bold text-neutral-500">{isKo ? "체류" : "Nights"}</th>
                  <th className="py-2.5 text-right font-black text-teal-600">{isKo ? "숙소" : "Stay"}</th>
                  <th className="py-2.5 text-right font-black text-rose-600">{isKo ? "음식" : "Food"}</th>
                  <th className="py-2.5 text-right font-black text-amber-600">{isKo ? "관광" : "Attr"}</th>
                  <th className="py-2.5 text-right font-black text-indigo-600">{isKo ? "교통" : "Transit"}</th>
                  <th className="py-2.5 text-right font-black text-purple-600">{isKo ? "기타" : "Others"}</th>
                  <th className="py-2.5 text-right font-black text-neutral-900">{isKo ? "소계" : "Subtotal"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 text-neutral-700">
                {/* 1) 도시별 행 (도시 고유 색상 점 및 텍스트 적용) */}
                {draft.selectedCities.map((city, idx) => {
                  const cInfo = calculations.cityBreakdown?.[city];
                  if (!cInfo) return null;
                  const cColor = cityPalette[idx % cityPalette.length];

                  return (
                    <tr key={city} className="hover:bg-white/90 transition-colors">
                      <td className="py-2.5 font-black text-neutral-900">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${cColor.dot} shrink-0`} />
                          <span className={cColor.textColor}>
                            {isKo ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-neutral-500 tabular-nums font-semibold">
                        {cInfo.nights === 0 ? (isKo ? "당일" : "Day") : `${cInfo.nights}N`}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.stayTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.foodTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.attractionTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-600">{formatKrw(cInfo.transportTotalKrw)}</td>
                      <td className="py-2.5 text-right tabular-nums text-neutral-400">₩0</td>
                      <td className="py-2.5 text-right tabular-nums font-black text-neutral-900">{formatKrw(cInfo.subtotalKrw)}</td>
                    </tr>
                  );
                })}

                {/* 2) 공통/자율 경비 행 (쇼핑, 일일 용돈, 비상금, 도시 간 이동) */}
                {(etcTotal > 0 || (calculations.intercityTotal || 0) > 0) && (
                  <tr className="bg-neutral-100/40 text-neutral-600 font-medium">
                    <td className="py-2.5 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                        <span className="text-slate-600">{isKo ? "공통 / 자율" : "Common / Flex"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center text-neutral-400">-</td>
                    <td className="py-2.5 text-right tabular-nums text-neutral-400">-</td>
                    <td className="py-2.5 text-right tabular-nums text-neutral-400">-</td>
                    <td className="py-2.5 text-right tabular-nums text-neutral-400">-</td>
                    <td className="py-2.5 text-right tabular-nums text-neutral-600">
                      {formatKrw(calculations.intercityTotal || 0)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-neutral-600">
                      {formatKrw(etcTotal)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums font-black text-neutral-800">
                      {formatKrw((calculations.intercityTotal || 0) + etcTotal)}
                    </td>
                  </tr>
                )}
              </tbody>

              {/* 3) 세로 소계 (도시별 소계와 동일한 font-black 스타일, 색상 동기화) */}
              <tfoot>
                <tr className="border-t-2 border-neutral-300 bg-white/95">
                  <td className="py-3 font-black text-neutral-900">{isKo ? "소계" : "Subtotal"}</td>
                  <td className="py-3 text-center text-neutral-700 tabular-nums font-black">{totalNights}N</td>
                  <td className="py-3 text-right tabular-nums font-black text-teal-600">{formatKrw(stayTotal)}</td>
                  <td className="py-3 text-right tabular-nums font-black text-rose-600">{formatKrw(foodTotal)}</td>
                  <td className="py-3 text-right tabular-nums font-black text-amber-600">{formatKrw(attractionTotal)}</td>
                  <td className="py-3 text-right tabular-nums font-black text-indigo-600">{formatKrw(transportTotal)}</td>
                  <td className="py-3 text-right tabular-nums font-black text-purple-600">{formatKrw(etcTotal)}</td>
                  <td className="py-3 text-right tabular-nums font-black text-neutral-950 text-sm">{formatKrw(grandTotalKrw)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. 우측 세로 막대그래프 영역 (lg:col-span-4): 막대 길이 확장 및 % 인라인 표출 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3.5 items-stretch">
          
          {/* [세로 막대그래프 1: 카테고리 비중] */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70 flex flex-col justify-between space-y-2">
            <div className="border-b border-neutral-200/60 pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black text-neutral-900">
                {isKo ? "카테고리 비중" : "By Sector"}
              </span>
              <span className="text-[9px] font-bold text-neutral-400">100%</span>
            </div>

            {/* 세로 누적 막대 기둥 (범례 삭제로 높이를 시원하게 확장: h-60 ~ h-64) */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div className="w-14 sm:w-16 h-56 sm:h-64 rounded-2xl overflow-hidden flex flex-col-reverse bg-neutral-200/60 p-1 shadow-inner">
                {categoryList.map((cat) => {
                  if (cat.pct <= 0) return null;
                  return (
                    <div
                      key={cat.key}
                      style={{ height: `${cat.pct}%` }}
                      className={`${cat.barColor} w-full first:rounded-b-xl last:rounded-t-xl transition-all duration-500 flex items-center justify-center text-white text-[11px] font-black select-none overflow-hidden`}
                      title={`${cat.label}: ${cat.pct}% (${formatKrw(cat.amount)})`}
                    >
                      {cat.pct >= 6 && <span>{cat.pct}%</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* [세로 막대그래프 2: 방문 도시별 비중] */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70 flex flex-col justify-between space-y-2">
            <div className="border-b border-neutral-200/60 pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black text-neutral-900">
                {isKo ? "도시별 비중" : "By City"}
              </span>
              <span className="text-[9px] font-bold text-neutral-400">100%</span>
            </div>

            {/* 세로 누적 막대 기둥 (범례 삭제로 높이를 시원하게 확장: h-60 ~ h-64) */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div className="w-14 sm:w-16 h-56 sm:h-64 rounded-2xl overflow-hidden flex flex-col-reverse bg-neutral-200/60 p-1 shadow-inner">
                {cityListWithCommon.map((c) => {
                  if (c.pct <= 0) return null;
                  return (
                    <div
                      key={c.city}
                      style={{ height: `${c.pct}%` }}
                      className={`${c.barColor} w-full first:rounded-b-xl last:rounded-t-xl transition-all duration-500 flex items-center justify-center text-white text-[11px] font-black select-none overflow-hidden`}
                      title={`${c.cityName}: ${c.pct}% (${formatKrw(c.subtotal)})`}
                    >
                      {c.pct >= 6 && <span>{c.pct}%</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
