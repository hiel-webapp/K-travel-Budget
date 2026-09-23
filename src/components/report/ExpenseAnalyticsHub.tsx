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

  // 도시별 비중 세로 막대 좌측 라벨 위치 및 좁은 간격 겹침 방지(Collision Avoidance) 계산
  const cityLabelLayouts = useMemo(() => {
    const validItems = cityBarItems.filter((c) => c.pct > 0);
    if (validItems.length === 0) return [];

    let acc = 0;
    const rawList = validItems.map((c) => {
      const center = acc + c.pct / 2;
      acc += c.pct;
      return {
        ...c,
        originalCenterPct: center,
        displayYPercent: center,
      };
    });

    // 최소 간격 (% 기준): 215px 기준 텍스트 높이 + 여백 감안 시 약 9.5%
    const MIN_GAP_PCT = 9.5;

    // 1차 순방향 밀어내기 (위 -> 아래)
    for (let i = 1; i < rawList.length; i++) {
      if (rawList[i].displayYPercent - rawList[i - 1].displayYPercent < MIN_GAP_PCT) {
        rawList[i].displayYPercent = rawList[i - 1].displayYPercent + MIN_GAP_PCT;
      }
    }

    // 하단 경계(96%) 초과 시 역방향 밀어내기 (아래 -> 위)
    if (rawList[rawList.length - 1].displayYPercent > 96) {
      rawList[rawList.length - 1].displayYPercent = 96;
      for (let i = rawList.length - 2; i >= 0; i--) {
        if (rawList[i + 1].displayYPercent - rawList[i].displayYPercent < MIN_GAP_PCT) {
          rawList[i].displayYPercent = rawList[i + 1].displayYPercent - MIN_GAP_PCT;
        }
      }
    }

    // 상단 경계(4%) 보정
    if (rawList[0].displayYPercent < 4) {
      rawList[0].displayYPercent = 4;
      for (let i = 1; i < rawList.length; i++) {
        if (rawList[i].displayYPercent - rawList[i - 1].displayYPercent < MIN_GAP_PCT) {
          rawList[i].displayYPercent = rawList[i - 1].displayYPercent + MIN_GAP_PCT;
        }
      }
    }

    return rawList.map((item) => ({
      ...item,
      isOffset: Math.abs(item.displayYPercent - item.originalCenterPct) > 2.5,
    }));
  }, [cityBarItems]);

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
    },
    {
      key: "food",
      label: isKo ? "음식" : "Food",
      pct: foodPct,
      amount: foodTotal,
      barColor: "bg-rose-500",
    },
    {
      key: "attraction",
      label: isKo ? "관광" : "Attraction",
      pct: attrPct,
      amount: attractionTotal,
      barColor: "bg-amber-500",
    },
    {
      key: "transport",
      label: isKo ? "교통" : "Transit",
      pct: transPct,
      amount: transportTotal,
      barColor: "bg-indigo-500",
    },
    {
      key: "etc",
      label: isKo ? "기타" : "Others",
      pct: etcPct,
      amount: etcTotal,
      barColor: "bg-purple-500",
    },
  ];

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
              ? "도시별 실질 이동비와 체류 기간 비례 기타 경비가 완벽히 산입된 종합 회계 집계표입니다."
              : "Cross-examine itemized city expenditures with transit legs and duration-proportioned flex expenses."}
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-400 self-start sm:self-auto tabular-nums">
          {isKo ? `총 ${draft.selectedCities.length}개 도시 분석` : `${draft.selectedCities.length} Cities Audited`}
        </span>
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
          
          {/* [세로 막대그래프 1: 카테고리 비중] - 높이를 h-40 sm:h-44로 표와 완벽하게 동기화 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70 flex flex-col justify-between space-y-2">
            <div className="border-b border-neutral-200/60 pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black text-neutral-900">
                {isKo ? "카테고리 비중" : "By Sector"}
              </span>
              <span className="text-[9px] font-bold text-neutral-400">100%</span>
            </div>

            {/* 세로 누적 막대 (박스 중앙 정렬 & 시원하게 확장된 높이) */}
            <div className="flex-1 flex items-center justify-center py-1 relative">
              <div className="w-14 sm:w-16 h-[210px] sm:h-[220px] rounded-2xl flex flex-col bg-neutral-200/60 p-1 shadow-inner relative">
                {categoryList.map((cat) => {
                  if (cat.pct <= 0) return null;
                  const isSmall = cat.pct < 7;
                  return (
                    <div
                      key={cat.key}
                      style={{ height: `${cat.pct}%` }}
                      className={`${cat.barColor} w-full first:rounded-t-xl last:rounded-b-xl transition-all duration-500 flex items-center justify-center relative select-none`}
                      title={`${cat.label}: ${cat.pct}% (${formatPriceByLocale(cat.amount, locale, usdRate)})`}
                    >
                      {!isSmall ? (
                        <span className="text-white text-[11px] font-black">{cat.pct}%</span>
                      ) : (
                        <div className="absolute left-full ml-1.5 flex items-center text-[10px] font-black text-neutral-800 whitespace-nowrap z-10 pointer-events-none">
                          <span className="text-neutral-400 mr-0.5">-</span>
                          <span>{cat.pct}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* [세로 막대그래프 2: 방문 도시별 비중] - 박스 중앙 정렬 & 시원하게 확장된 높이 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/70 flex flex-col justify-between space-y-2">
            <div className="border-b border-neutral-200/60 pb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black text-neutral-900">
                {isKo ? "도시별 비중" : "By City"}
              </span>
              <span className="text-[9px] font-bold text-neutral-400">100%</span>
            </div>

            {/* 세로 누적 막대 (좌측 도시명 라벨 + 박스 중앙 정렬) */}
            <div className="flex-1 flex items-center justify-center py-1 pl-10 sm:pl-12 relative">
              <div className="relative flex items-center">
                {/* 좌측 도시명 라벨 오버레이 */}
                <div className="absolute right-full mr-2 h-[210px] sm:h-[220px] w-20 sm:w-24 pointer-events-none">
                  {cityLabelLayouts.map((c) => (
                    <div
                      key={c.city}
                      style={{ top: `${c.displayYPercent}%` }}
                      className="absolute right-0 -translate-y-1/2 flex items-center justify-end gap-1 whitespace-nowrap"
                    >
                      <span
                        className={`text-[10.5px] sm:text-[11px] font-black tracking-tight ${c.textColor}`}
                        title={`${c.cityName}: ${c.pct}%`}
                      >
                        {c.cityName}
                      </span>
                      {c.isOffset ? (
                        <span className="w-2.5 h-[1.5px] bg-neutral-300 rounded-full shrink-0" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${c.barColor} shrink-0 opacity-80`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* 중앙 세로 누적 막대 */}
                <div className="w-13 sm:w-15 h-[210px] sm:h-[220px] rounded-2xl flex flex-col bg-neutral-200/60 p-1 shadow-inner relative">
                  {cityBarItems.map((c) => {
                    if (c.pct <= 0) return null;
                    const isSmall = c.pct < 7;
                    return (
                      <div
                        key={c.city}
                        style={{ height: `${c.pct}%` }}
                        className={`${c.barColor} w-full first:rounded-t-xl last:rounded-b-xl transition-all duration-500 flex items-center justify-center relative select-none`}
                        title={`${c.cityName}: ${c.pct}% (${formatPriceByLocale(c.subtotal, locale, usdRate)})`}
                      >
                        {!isSmall ? (
                          <span className="text-white text-[11px] font-black">{c.pct}%</span>
                        ) : (
                          <div className="absolute left-full ml-1.5 flex items-center text-[10px] font-black text-neutral-800 whitespace-nowrap z-10 pointer-events-none">
                            <span className="text-neutral-400 mr-0.5">-</span>
                            <span>{c.pct}%</span>
                          </div>
                        )}
                      </div>
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
