"use client";

import React, { useMemo } from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripDraft } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import { formatKrw } from "src/features/budget/presentation/formatters";
import { formatPriceByLocale } from "src/lib/currency/currency-converter";
import type { TripBudgetSummary } from "src/features/budget/calculations/trip-budget-calculator";

export interface ExpenseAnalyticsHubProps {
  calculations: TripBudgetSummary;
  draft: TripDraft;
  locale: Locale;
  dict: Dictionary;
  usdRate?: number;
}

export default function ExpenseAnalyticsHub({
  calculations,
  draft,
  locale,
  usdRate = 1387,
}: ExpenseAnalyticsHubProps) {
  const isKo = locale === "ko";
  const grandTotalKrw = calculations.grandTotalKrw || 0;
  const safeTotal = Math.max(1, grandTotalKrw);

  // 1. 5대 카테고리(숙소, 음식, 관광, 교통, 기타) 합계 계산
  const stayTotal = calculations.sumAccTotal || 0;
  const foodTotal = calculations.sumFoodTotal || 0;
  const attractionTotal = calculations.sumAttractionTotal || 0;
  const intercityTotal = calculations.intercityTotal || 0;
  const transportTotal =
    (calculations.sumTransportTotal || 0) + intercityTotal;

  // 전체 기타 비용: 숙소, 음식, 관광, 교통을 제외한 모든 잔여 예산(쇼핑, 용돈, 비상금)
  const etcTotal = Math.max(
    0,
    grandTotalKrw - (stayTotal + foodTotal + attractionTotal + transportTotal)
  );

  // 2. 실제 도시간 이동 구간(Leg-by-Leg)별 실제 요금을 여정 정차지 순서(인덱스)에 맞게 정확히 귀속
  //    - ENTRY_... (공항 -> 1번 정차지): 1번 정차지에 귀속
  //    - 도시 간 이동: 이동 도착 정차지(targetStopIdx)에 귀속
  //    - EXIT_... (마지막 정차지 -> 공항): 마지막 정차지에 귀속
  const intercityLineItems =
    calculations.basePlan?.intercitySection?.lineItems || [];
  const numCities = draft.selectedCities.length;

  const allocatedIntercityByIndex: number[] = new Array(numCities).fill(0);

  if (intercityLineItems.length > 0) {
    intercityLineItems.forEach((item, itemIdx) => {
      const cost = item.lineTotalKrw || 0;
      const route = item.route || "";

      if (route.startsWith("ENTRY_") || itemIdx === 0) {
        allocatedIntercityByIndex[0] += cost;
      } else if (route.startsWith("EXIT_") || itemIdx === intercityLineItems.length - 1) {
        allocatedIntercityByIndex[numCities - 1] += cost;
      } else {
        const targetStopIdx = Math.min(itemIdx, numCities - 1);
        allocatedIntercityByIndex[targetStopIdx] += cost;
      }
    });
  } else if (intercityTotal > 0 && numCities > 0) {
    const totalLegs = numCities <= 1 ? 1 : numCities + 1;
    draft.selectedCities.forEach((_, idx) => {
      const legs = idx === numCities - 1 ? 2 : 1;
      allocatedIntercityByIndex[idx] = Math.round((intercityTotal * legs) / totalLegs);
    });
  }

  // 3. 총 체류 박수 및 도시별 가중치 (당일치기 0박은 0.5가중치 보정)
  const cityWeights = draft.selectedCities.map((city) => {
    const nights = calculations.cityBreakdown?.[city]?.nights || 0;
    return nights > 0 ? nights : 0.5;
  });
  const totalWeight = cityWeights.reduce((a, b) => a + b, 0);

  // 기타 비용(쇼핑, 용돈, 비상금)을 도시별 체류 기간(박수) 비례로 배분
  const allocatedEtcList = draft.selectedCities.map((_, idx) => {
    if (etcTotal <= 0) return 0;
    if (numCities === 1) return etcTotal;
    const w = cityWeights[idx];
    return Math.round((etcTotal * w) / totalWeight);
  });
  if (numCities > 1 && etcTotal > 0) {
    const sumEtc = allocatedEtcList
      .slice(0, numCities - 1)
      .reduce((a, b) => a + b, 0);
    allocatedEtcList[numCities - 1] = etcTotal - sumEtc;
  }

  // 4. 도시별 고유 색상 팔레트 및 실질 5대 부문 지출 데이터 매핑
  const cityPalette = [
    { barColor: "bg-slate-900", textColor: "text-slate-900" },
    { barColor: "bg-blue-600", textColor: "text-blue-600" },
    { barColor: "bg-emerald-600", textColor: "text-emerald-600" },
    { barColor: "bg-orange-500", textColor: "text-orange-500" },
    { barColor: "bg-sky-500", textColor: "text-sky-500" },
    { barColor: "bg-violet-600", textColor: "text-violet-600" },
    { barColor: "bg-pink-600", textColor: "text-pink-600" },
  ];

  const cityTableRows = draft.selectedCities.map((city, idx) => {
    const cInfo = calculations.cityBreakdown?.[city];
    const color = cityPalette[idx % cityPalette.length];
    
    // 순환 여정(동일 도시 중복 방문) 시 N차 표기 지원
    const cityOccurrences = draft.selectedCities.filter((c) => c === city).length;
    let cityName = isKo ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
    if (cityOccurrences > 1) {
      const visitCount = draft.selectedCities.slice(0, idx + 1).filter((c) => c === city).length;
      cityName = isKo ? `${cityName} (${visitCount}차)` : `${cityName} (#${visitCount})`;
    }

    const stay = cInfo?.stayTotalKrw || 0;
    const food = cInfo?.foodTotalKrw || 0;
    const attr = cInfo?.attractionTotalKrw || 0;
    const trans = (cInfo?.transportTotalKrw || 0) + (allocatedIntercityByIndex[idx] || 0);
    const etc = allocatedEtcList[idx];
    const subtotal = stay + food + attr + trans + etc;
    const nights = cInfo?.nights || 0;

    return {
      city: `${city}_${idx}`,
      cityName,
      nights,
      stay,
      food,
      attr,
      trans,
      etc,
      subtotal,
      ...color,
    };
  });

  // 도시별 비중 (%) 계산 (위에서 아래로 1번 도시부터 정렬, 합계 100% 보정)
  const cityPercentList = cityTableRows.map((r) => {
    return Math.round((r.subtotal / safeTotal) * 100);
  });
  if (cityPercentList.length > 0) {
    const sumPcts = cityPercentList.slice(0, -1).reduce((a, b) => a + b, 0);
    cityPercentList[cityPercentList.length - 1] = Math.max(0, 100 - sumPcts);
  }

  const cityBarItems = cityTableRows.map((r, idx) => ({
    ...r,
    pct: cityPercentList[idx],
  }));

  // 5. 카테고리별 비중 (%) 계산 (위에서 아래로: 숙소, 음식, 관광, 교통, 기타 순서)
  const stayPct = Math.round((stayTotal / safeTotal) * 100);
  const foodPct = Math.round((foodTotal / safeTotal) * 100);
  const attrPct = Math.round((attractionTotal / safeTotal) * 100);
  const transPct = Math.round((transportTotal / safeTotal) * 100);
  const etcPct = Math.max(0, 100 - (stayPct + foodPct + attrPct + transPct));

  const categoryList = [
    {
      key: "stay",
      label: isKo ? "숙소" : "Stay",
      pct: stayPct,
      amount: stayTotal,
      barColor: "bg-teal-500",
      textColor: "text-teal-700",
    },
    {
      key: "food",
      label: isKo ? "음식" : "Food",
      pct: foodPct,
      amount: foodTotal,
      barColor: "bg-rose-500",
      textColor: "text-rose-600",
    },
    {
      key: "attraction",
      label: isKo ? "관광" : "Attraction",
      pct: attrPct,
      amount: attractionTotal,
      barColor: "bg-amber-500",
      textColor: "text-amber-700",
    },
    {
      key: "transport",
      label: isKo ? "교통" : "Transit",
      pct: transPct,
      amount: transportTotal,
      barColor: "bg-indigo-500",
      textColor: "text-indigo-600",
    },
    {
      key: "etc",
      label: isKo ? "기타" : "Others",
      pct: etcPct,
      amount: etcTotal,
      barColor: "bg-purple-500",
      textColor: "text-purple-600",
    },
  ];

  // 좌/우 교차 2줄 라벨(홀수: 좌측, 짝수: 우측) 위치 및 겹침 방지(Collision Avoidance) 계산 헬퍼
  const computeAlternatingLabels = <T extends { pct: number }>(items: T[]) => {
    const validItems = items.filter((item) => item.pct > 0);
    if (validItems.length === 0) return [];

    let acc = 0;
    const list = validItems.map((item, idx) => {
      const center = acc + item.pct / 2;
      acc += item.pct;
      // 1, 3, 5번째 (idx 0, 2, 4) -> 좌측 / 2, 4번째 (idx 1, 3) -> 우측
      const side: "left" | "right" = idx % 2 === 0 ? "left" : "right";
      return {
        ...item,
        originalCenterPct: center,
        displayYPercent: center,
        side,
      };
    });

    const MIN_GAP_PCT = 11; // 2줄 텍스트(약 26px) 공간 확보

    ["left", "right"].forEach((targetSide) => {
      const sideItems = list.filter((it) => it.side === targetSide);
      if (sideItems.length <= 1) return;

      for (let i = 1; i < sideItems.length; i++) {
        if (sideItems[i].displayYPercent - sideItems[i - 1].displayYPercent < MIN_GAP_PCT) {
          sideItems[i].displayYPercent = sideItems[i - 1].displayYPercent + MIN_GAP_PCT;
        }
      }

      if (sideItems[sideItems.length - 1].displayYPercent > 94) {
        sideItems[sideItems.length - 1].displayYPercent = 94;
        for (let i = sideItems.length - 2; i >= 0; i--) {
          if (sideItems[i + 1].displayYPercent - sideItems[i].displayYPercent < MIN_GAP_PCT) {
            sideItems[i].displayYPercent = sideItems[i + 1].displayYPercent - MIN_GAP_PCT;
          }
        }
      }

      if (sideItems[0].displayYPercent < 6) {
        sideItems[0].displayYPercent = 6;
        for (let i = 1; i < sideItems.length; i++) {
          if (sideItems[i].displayYPercent - sideItems[i - 1].displayYPercent < MIN_GAP_PCT) {
            sideItems[i].displayYPercent = sideItems[i - 1].displayYPercent + MIN_GAP_PCT;
          }
        }
      }
    });

    return list;
  };

  const categoryLabelLayouts = useMemo(
    () => computeAlternatingLabels(categoryList),
    [categoryList]
  );

  const cityLabelLayouts = useMemo(
    () => computeAlternatingLabels(cityBarItems),
    [cityBarItems]
  );

  // 4개 행을 유지하기 위한 빈 행(placeholder rows) 계산
  const minRows = 4;
  const emptyRowsCount = Math.max(0, minRows - cityTableRows.length);
  const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => ({
    id: `empty-row-${i}`,
  }));

  // 총 체류 박수 계산
  const totalNights = draft.selectedCities.reduce((acc, city) => {
    return acc + (calculations.cityBreakdown?.[city]?.nights || 0);
  }, 0);

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            {isKo ? "원스톱 예산 분석 허브" : "Integrated Expense Audit"}
          </h2>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {isKo
              ? "도시별 이동 교통비와 머무는 일정에 맞춘 모든 여행 경비를 한눈에 보기 쉽게 정리한 내역입니다."
              : "A clear, itemized breakdown of transit costs between cities and essential expenses tailored to your stay."}
          </p>
        </div>
      </div>

      {/* Main Unified Layout: 도시별 집계표(8열) + 세로 막대그래프 2개(4열) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ========================================================================= */}
        {/* 1. 도시별 5대 부문 집계표 (lg:col-span-8) - 모든 열 가운데 정렬 & 4행 유지 */}
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

          {/* Table Area (모든 열 text-center) */}
          <div className="overflow-x-auto flex-1 flex flex-col justify-between">
            <table className="w-full text-center text-xs border-collapse font-medium min-w-[540px]">
              <thead>
                <tr className="border-b border-neutral-200 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-bold text-neutral-500 text-center">{isKo ? "도시" : "City"}</th>
                  <th className="py-2.5 font-bold text-neutral-500 text-center">{isKo ? "체류" : "Nights"}</th>
                  <th className="py-2.5 font-black text-teal-600 text-center">{isKo ? "숙소" : "Stay"}</th>
                  <th className="py-2.5 font-black text-rose-600 text-center">{isKo ? "음식" : "Food"}</th>
                  <th className="py-2.5 font-black text-amber-600 text-center">{isKo ? "관광" : "Attr"}</th>
                  <th className="py-2.5 font-black text-indigo-600 text-center">{isKo ? "교통" : "Transit"}</th>
                  <th className="py-2.5 font-black text-purple-600 text-center">{isKo ? "기타" : "Others"}</th>
                  <th className="py-2.5 font-black text-neutral-900 text-center">{isKo ? "소계" : "Subtotal"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 text-neutral-700">
                {/* 1) 실제 선택된 도시 행 */}
                {cityTableRows.map((row) => (
                  <tr key={row.city} className="hover:bg-white/90 transition-colors">
                    <td className="py-2.5 font-black text-center">
                      <span className={row.textColor}>{row.cityName}</span>
                    </td>
                    <td className="py-2.5 text-center text-neutral-500 tabular-nums font-semibold">
                      {row.nights === 0 ? (isKo ? "당일" : "Day") : `${row.nights}N`}
                    </td>
                    <td className="py-2.5 text-center tabular-nums text-neutral-600">{formatPriceByLocale(row.stay, locale, usdRate)}</td>
                    <td className="py-2.5 text-center tabular-nums text-neutral-600">{formatPriceByLocale(row.food, locale, usdRate)}</td>
                    <td className="py-2.5 text-center tabular-nums text-neutral-600">{formatPriceByLocale(row.attr, locale, usdRate)}</td>
                    <td className="py-2.5 text-center tabular-nums text-neutral-600">{formatPriceByLocale(row.trans, locale, usdRate)}</td>
                    <td className="py-2.5 text-center tabular-nums text-neutral-600">{formatPriceByLocale(row.etc, locale, usdRate)}</td>
                    <td className="py-2.5 text-center tabular-nums font-black text-neutral-900">{formatPriceByLocale(row.subtotal, locale, usdRate)}</td>
                  </tr>
                ))}

                {/* 2) 4행 유지를 위한 빈 행(Placeholder Rows) */}
                {emptyRows.map((er) => (
                  <tr key={er.id} className="text-neutral-300">
                    <td className="py-2.5 text-center font-bold text-neutral-300">-</td>
                    <td className="py-2.5 text-center text-neutral-300">-</td>
                    <td className="py-2.5 text-center text-neutral-300">-</td>
                    <td className="py-2.5 text-center text-neutral-300">-</td>
                    <td className="py-2.5 text-center text-neutral-300">-</td>
                    <td className="py-2.5 text-center text-neutral-300">-</td>
                    <td className="py-2.5 text-center text-neutral-300">-</td>
                    <td className="py-2.5 text-center text-neutral-300">-</td>
                  </tr>
                ))}
              </tbody>

              {/* 세로 소계 (모든 열 text-center) */}
              <tfoot>
                <tr className="border-t-2 border-neutral-300 bg-white/95">
                  <td className="py-3 font-black text-neutral-900 text-center">{isKo ? "소계" : "Subtotal"}</td>
                  <td className="py-3 text-center text-neutral-700 tabular-nums font-black">{totalNights}N</td>
                  <td className="py-3 text-center tabular-nums font-black text-neutral-900">{formatPriceByLocale(stayTotal, locale, usdRate)}</td>
                  <td className="py-3 text-center tabular-nums font-black text-neutral-900">{formatPriceByLocale(foodTotal, locale, usdRate)}</td>
                  <td className="py-3 text-center tabular-nums font-black text-neutral-900">{formatPriceByLocale(attractionTotal, locale, usdRate)}</td>
                  <td className="py-3 text-center tabular-nums font-black text-neutral-900">{formatPriceByLocale(transportTotal, locale, usdRate)}</td>
                  <td className="py-3 text-center tabular-nums font-black text-neutral-900">{formatPriceByLocale(etcTotal, locale, usdRate)}</td>
                  <td className="py-3 text-center tabular-nums font-black text-neutral-950 text-sm">{formatPriceByLocale(grandTotalKrw, locale, usdRate)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. 우측 세로 막대그래프 영역 (lg:col-span-4): 표와 동일한 높이로 정밀 조정 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3.5 items-stretch">
          
          {/* [세로 막대그래프 1: 카테고리 비중] - 슬림 캡슐 막대 + 좌우 2줄 교차 지시선 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70 flex flex-col justify-between space-y-2">
            <div className="border-b border-neutral-200/60 pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black text-neutral-900">
                {isKo ? "카테고리 비중" : "By Sector"}
              </span>
              <span className="text-[9px] font-bold text-neutral-400">100%</span>
            </div>

            {/* 슬림 막대 + 좌우 교차 2줄 라벨 */}
            <div className="flex-1 flex items-center justify-center py-2 relative">
              <div className="relative flex items-center justify-center">
                {/* 라벨 레이어 (좌우 지시선 오버레이) */}
                <div className="absolute inset-0 h-[210px] sm:h-[220px] pointer-events-none">
                  {categoryLabelLayouts.map((cat) => {
                    const isLeft = cat.side === "left";
                    return (
                      <div
                        key={cat.key}
                        style={{ top: `${cat.displayYPercent}%` }}
                        className={`absolute -translate-y-1/2 flex items-center gap-1.5 whitespace-nowrap z-10 ${
                          isLeft ? "right-full mr-1.5" : "left-full ml-1.5"
                        }`}
                      >
                        {isLeft && (
                          <div className="flex flex-col items-center text-center leading-none">
                            <span className="block text-[10px] text-neutral-500 font-bold mb-0.5">{cat.label}</span>
                            <span className={`block text-[10px] font-extrabold tabular-nums ${cat.textColor}`}>{cat.pct}%</span>
                          </div>
                        )}
                        <span className="w-2.5 sm:w-3.5 h-[1.5px] bg-neutral-300 rounded-full shrink-0" />
                        {!isLeft && (
                          <div className="flex flex-col items-center text-center leading-none">
                            <span className="block text-[10px] text-neutral-500 font-bold mb-0.5">{cat.label}</span>
                            <span className={`block text-[10px] font-extrabold tabular-nums ${cat.textColor}`}>{cat.pct}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 슬림 세로 누적 막대 */}
                <div className="w-7 sm:w-8 h-[210px] sm:h-[220px] rounded-full flex flex-col bg-neutral-200/60 p-0.5 shadow-inner relative overflow-hidden">
                  {categoryList.map((cat) => {
                    if (cat.pct <= 0) return null;
                    return (
                      <div
                        key={cat.key}
                        style={{ height: `${cat.pct}%` }}
                        className={`${cat.barColor} w-full first:rounded-t-full last:rounded-b-full transition-all duration-500 relative select-none`}
                        title={`${cat.label}: ${cat.pct}% (${formatPriceByLocale(cat.amount, locale, usdRate)})`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* [세로 막대그래프 2: 방문 도시별 비중] - 슬림 캡슐 막대 + 좌우 2줄 교차 지시선 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70 flex flex-col justify-between space-y-2">
            <div className="border-b border-neutral-200/60 pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black text-neutral-900">
                {isKo ? "도시별 비중" : "By City"}
              </span>
              <span className="text-[9px] font-bold text-neutral-400">100%</span>
            </div>

            {/* 슬림 막대 + 좌우 교차 2줄 라벨 */}
            <div className="flex-1 flex items-center justify-center py-2 relative">
              <div className="relative flex items-center justify-center">
                {/* 라벨 레이어 (좌우 지시선 오버레이) */}
                <div className="absolute inset-0 h-[210px] sm:h-[220px] pointer-events-none">
                  {cityLabelLayouts.map((c) => {
                    const isLeft = c.side === "left";
                    return (
                      <div
                        key={c.city}
                        style={{ top: `${c.displayYPercent}%` }}
                        className={`absolute -translate-y-1/2 flex items-center gap-1.5 whitespace-nowrap z-10 ${
                          isLeft ? "right-full mr-1.5" : "left-full ml-1.5"
                        }`}
                      >
                        {isLeft && (
                          <div className="flex flex-col items-center text-center leading-none">
                            <span className="block text-[10px] text-neutral-500 font-bold mb-0.5">{c.cityName}</span>
                            <span className={`block text-[10px] font-extrabold tabular-nums ${c.textColor}`}>{c.pct}%</span>
                          </div>
                        )}
                        <span className="w-2.5 sm:w-3.5 h-[1.5px] bg-neutral-300 rounded-full shrink-0" />
                        {!isLeft && (
                          <div className="flex flex-col items-center text-center leading-none">
                            <span className="block text-[10px] text-neutral-500 font-bold mb-0.5">{c.cityName}</span>
                            <span className={`block text-[10px] font-extrabold tabular-nums ${c.textColor}`}>{c.pct}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 슬림 세로 누적 막대 */}
                <div className="w-7 sm:w-8 h-[210px] sm:h-[220px] rounded-full flex flex-col bg-neutral-200/60 p-0.5 shadow-inner relative overflow-hidden">
                  {cityBarItems.map((c) => {
                    if (c.pct <= 0) return null;
                    return (
                      <div
                        key={c.city}
                        style={{ height: `${c.pct}%` }}
                        className={`${c.barColor} w-full first:rounded-t-full last:rounded-b-full transition-all duration-500 relative select-none`}
                        title={`${c.cityName}: ${c.pct}% (${formatPriceByLocale(c.subtotal, locale, usdRate)})`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
