"use client";

import React, { useMemo } from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripBudgetSummary } from "src/features/budget/calculations/trip-budget-calculator";
import type { TripDraft } from "src/lib/trip-domain";
import type { PlannerPreferences } from "src/features/budget/domain/types";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES, type SupportedCity } from "src/lib/trip-domain";
import { formatPriceByLocale } from "src/lib/currency/currency-converter";
import { formatKrw } from "src/features/budget/presentation/formatters";
import { buildBookingHubData } from "./BookingActionHub";
import {
  TOUR_COURSE_PRESETS,
  type AttractionSpot,
  isSameSpot,
} from "src/features/budget/catalog/attraction-spots";
import { THEME_ACTIVITIES_CATALOG } from "src/features/budget/catalog/theme-activities";
import { getSpotCoordinates, optimizeSpotSequence, getKakaoMapDirectLink, LatLng } from "src/lib/map/spot-coordinates";

export interface RouteSpotItem extends LatLng {
  id: string;
  originalIndex: number;
  routeOrder: number;
  nameKo: string;
  nameEn: string;
  descKo?: string;
  descEn?: string;
  price: number;
  subwayInfo?: string;
  categoryType?: string;
  officialUrl?: string;
  cityCode: SupportedCity;
}

export interface ReportPdfDocumentProps {
  calculations: TripBudgetSummary;
  draft: TripDraft;
  preferences: PlannerPreferences;
  locale: Locale;
  dict: Dictionary;
  usdRate?: number;
  dbAttractionsByCity?: Record<string, AttractionSpot[]>;
  className?: string;
}

export default function ReportPdfDocument({
  calculations,
  draft,
  locale,
  dict,
  usdRate = 1356,
  className = "",
}: ReportPdfDocumentProps) {
  const isKo = locale === "ko";

  const {
    cityBreakdown,
    stopBreakdown,
    sumAccTotal,
    sumFoodTotal,
    sumTransportTotal,
    sumAttractionTotal,
    intercityTotal,
    shoppingAmountKrw,
    totalDailyAllowanceKrw,
    computedEmergencyKrw,
    grandTotalKrw,
    dailyAverageKrw,
    adultCount,
    totalNights,
    travelDays,
  } = calculations;

  // 1. 정차지 목록
  const stopsList = useMemo(() => {
    if (stopBreakdown && stopBreakdown.length > 0) {
      return stopBreakdown;
    }
    return draft.selectedCities.map((city, idx) => ({
      stopId: `${city}-${idx}`,
      city,
      cityName: isKo ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city,
      isAdded: false,
      stopIndex: idx,
      selectedSpots: cityBreakdown[city]?.selectedSpots || [],
      nights: cityBreakdown[city]?.nights || 0,
      label: undefined,
      stayTotalKrw: cityBreakdown[city]?.stayTotalKrw || 0,
      foodTotalKrw: cityBreakdown[city]?.foodTotalKrw || 0,
      transportTotalKrw: cityBreakdown[city]?.transportTotalKrw || 0,
      attractionTotalKrw: cityBreakdown[city]?.attractionTotalKrw || 0,
      foodBasketPlan: cityBreakdown[city]?.foodBasketPlan,
      stayItemLabel: cityBreakdown[city]?.stayItemLabel || "",
      subtotalKrw: cityBreakdown[city]?.subtotalKrw || 0,
    }));
  }, [stopBreakdown, draft.selectedCities, cityBreakdown, isKo]);

  // 총 페이지 수 (1. 대시보드 1p, 2. 도시별 코스 Np, 3. 스마트 예약 1p, 4. 음식 리스트 1p, 5. 영수증 1p)
  const totalPages = stopsList.length + 4;

  // 2. 예약 데이터 및 무료 명소
  const { categorizedItems, totalCount, freeSpots } = useMemo(() => {
    return buildBookingHubData(calculations, draft, locale, usdRate);
  }, [calculations, draft, locale, usdRate]);

  // 3. Page 1 전용: 캡슐 바 연산 (ExpenseAnalyticsHub와 100% 동일한 로직)
  const safeTotal = Math.max(1, grandTotalKrw);
  const stayTotal = sumAccTotal || 0;
  const foodTotal = sumFoodTotal || 0;
  const attractionTotal = sumAttractionTotal || 0;
  const transportTotal = (sumTransportTotal || 0) + (intercityTotal || 0);
  const etcTotal = Math.max(
    0,
    grandTotalKrw - (stayTotal + foodTotal + attractionTotal + transportTotal)
  );

  // 카테고리별 비중 (%)
  const stayPct = Math.round((stayTotal / safeTotal) * 100);
  const foodPct = Math.round((foodTotal / safeTotal) * 100);
  const attrPct = Math.round((attractionTotal / safeTotal) * 100);
  const transPct = Math.round((transportTotal / safeTotal) * 100);
  const etcPct = Math.max(0, 100 - (stayPct + foodPct + attrPct + transPct));

  const categoryList = [
    { key: "stay", label: isKo ? "숙소" : "Stay", pct: stayPct, barColor: "bg-teal-500", textColor: "text-teal-700" },
    { key: "food", label: isKo ? "음식" : "Food", pct: foodPct, barColor: "bg-rose-500", textColor: "text-rose-600" },
    { key: "attraction", label: isKo ? "관광" : "Attr", pct: attrPct, barColor: "bg-amber-500", textColor: "text-amber-700" },
    { key: "transport", label: isKo ? "교통" : "Transit", pct: transPct, barColor: "bg-indigo-500", textColor: "text-indigo-600" },
    { key: "etc", label: isKo ? "기타" : "Others", pct: etcPct, barColor: "bg-purple-500", textColor: "text-purple-600" },
  ];

  // 도시별 비중 (%)
  const CITY_BAR_PALETTE = [
    { barColor: "bg-slate-900", textColor: "text-slate-900" },
    { barColor: "bg-blue-600", textColor: "text-blue-700" },
    { barColor: "bg-emerald-600", textColor: "text-emerald-700" },
    { barColor: "bg-amber-600", textColor: "text-amber-700" },
    { barColor: "bg-purple-600", textColor: "text-purple-700" },
    { barColor: "bg-rose-600", textColor: "text-rose-700" },
  ];

  const cityList = stopsList.map((stop: any, idx: number) => {
    const cSubtotal = stop.subtotalKrw || 0;
    const cPct = Math.round((cSubtotal / safeTotal) * 100);
    const pal = CITY_BAR_PALETTE[idx % CITY_BAR_PALETTE.length];
    return {
      key: stop.stopId || `${stop.city}-${idx}`,
      label: stop.cityName + (stop.isAdded ? "(+)" : ""),
      pct: cPct,
      barColor: pal.barColor,
      textColor: pal.textColor,
    };
  });

  // 교차 지시선 계산 헬퍼
  const computeAlternatingLabels = (items: Array<{ key: string; label: string; pct: number; textColor: string }>) => {
    const valid = items.filter((i) => i.pct > 0);
    if (valid.length === 0) return [];
    let acc = 0;
    const list = valid.map((item, idx) => {
      const center = acc + item.pct / 2;
      acc += item.pct;
      const side: "left" | "right" = idx % 2 === 0 ? "left" : "right";
      return {
        ...item,
        displayYPercent: center,
        side,
      };
    });

    const MIN_GAP = 14;
    ["left", "right"].forEach((side) => {
      const sideItems = list.filter((it) => it.side === side);
      for (let i = 1; i < sideItems.length; i++) {
        if (sideItems[i].displayYPercent - sideItems[i - 1].displayYPercent < MIN_GAP) {
          sideItems[i].displayYPercent = sideItems[i - 1].displayYPercent + MIN_GAP;
        }
      }
      if (sideItems.length > 0 && sideItems[sideItems.length - 1].displayYPercent > 92) {
        sideItems[sideItems.length - 1].displayYPercent = 92;
        for (let i = sideItems.length - 2; i >= 0; i--) {
          if (sideItems[i + 1].displayYPercent - sideItems[i].displayYPercent < MIN_GAP) {
            sideItems[i].displayYPercent = sideItems[i + 1].displayYPercent - MIN_GAP;
          }
        }
      }
    });
    return list;
  };

  const categoryLabels = computeAlternatingLabels(categoryList);
  const cityLabels = computeAlternatingLabels(cityList);

  // 4. 도시별 교통 연계 (영수증용)
  const allTransitLegs = useMemo(() => {
    return (calculations as any).intercityLegs || [];
  }, [calculations]);

  const entryItems = allTransitLegs.filter((i: any) => i.isAirportLeg && i.from === "ICN");
  const exitItems = allTransitLegs.filter((i: any) => i.isAirportLeg && i.to === "ICN");

  const formatSimplifiedTransit = (item: any) => {
    const rawMode = item.transitMode || "";
    let modeName = isKo ? "공항철도" : "AREX";
    if (rawMode === "AREX_EXPRESS") modeName = isKo ? "AREX 직통" : "AREX Express";
    else if (rawMode === "AREX_ALLSTOP") modeName = isKo ? "AREX 일반" : "AREX All-Stop";
    else if (rawMode === "KTX" || rawMode === "KTX_ECONOMY") modeName = isKo ? "KTX 고속철도" : "KTX High-speed";
    else if (rawMode === "SRT") modeName = isKo ? "SRT 고속철도" : "SRT";
    else if (rawMode === "EXPRESS_BUS") modeName = isKo ? "우등고속버스" : "Express Bus";
    else if (rawMode === "FLIGHT_DOMESTIC") modeName = isKo ? "국내선 항공" : "Domestic Flight";

    let fromName = isKo ? CITY_KOREAN_NAMES[item.from as SupportedCity] || item.from : CITY_ENGLISH_NAMES[item.from as SupportedCity] || item.from;
    let toName = isKo ? CITY_KOREAN_NAMES[item.to as SupportedCity] || item.to : CITY_ENGLISH_NAMES[item.to as SupportedCity] || item.to;
    if (item.from === "ICN") fromName = isKo ? "인천공항" : "Incheon Airport";
    if (item.to === "ICN") toName = isKo ? "인천공항" : "Incheon Airport";

    return {
      routeName: `${fromName} → ${toName}`,
      modeName,
    };
  };

  return (
    <div className={`report-pdf-root ${className}`}>
      {/* ========================================================================= */}
      {/* PAGE 1: 리포트 총괄 요약 대시보드 (사용자 첨부 이미지와 100% 동일한 화면) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page flex flex-col justify-between">
        {/* 1. Header Card (Craft.do 감성의 단정한 카드) */}
        <div className="bg-white/95 rounded-2xl border border-neutral-200/90 px-4 py-2.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div>
              <h1 className="text-lg font-black text-neutral-900 tracking-tight">
                {isKo ? "여행 예산 리포트" : "Korea Travel Budget Report"}
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">
                {isKo
                  ? "플래너에서 직접 담은 숙소, 식비, 교통, 명소 및 비상금이 100% 반영된 종합 실비 리포트입니다."
                  : "Comprehensive verified budget report directly mapped to your customized itinerary."}
              </p>
            </div>
            <div className="inline-flex h-7 px-3 items-center gap-1 rounded-full bg-neutral-900 text-white font-bold text-[10.5px]">
              <span>← {isKo ? "플래너로 돌아가기" : "Back to Planner"}</span>
            </div>
          </div>

          {/* 칩 스트립 */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600">
            <span className="bg-neutral-100/90 border border-neutral-200/70 text-neutral-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {totalNights}{isKo ? "박 " : "N "}{travelDays}{isKo ? "일" : "D"}
            </span>
            <span className="bg-neutral-100/90 border border-neutral-200/70 text-neutral-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {adultCount}{isKo ? "인 성인" : " Adults"}
            </span>
            <span className="text-neutral-300 font-bold text-xs">·</span>
            <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider shrink-0">ROUTE:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {stopsList.map((stop: any, idx: number) => (
                <React.Fragment key={stop.stopId || `${stop.city}-${idx}`}>
                  <span className="inline-flex items-center gap-1 bg-neutral-100/90 border border-neutral-200/70 text-neutral-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    <span>{stop.cityName}</span>
                    {stop.isAdded && (
                      <span className="text-[9px] px-1 py-0.2 rounded font-extrabold bg-rose-100 text-[#e25c5c]">
                        +추가
                      </span>
                    )}
                    <span className="text-neutral-500 font-medium">
                      ({stop.nights === 0 ? (isKo ? "당일" : "Day") : `${stop.nights}${isKo ? "박" : "N"}`})
                    </span>
                  </span>
                  {idx < stopsList.length - 1 && (
                    <span className="text-neutral-300 font-bold text-xs">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Bento Dashboard Cards (총 예상 경비 + 1일 예상 지출 분석) */}
        <div className="grid grid-cols-2 gap-3.5 my-2">
          {/* 총 예상 경비 카드 */}
          <div className="bg-white/95 rounded-2xl border border-neutral-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xs font-black text-neutral-900 tracking-tight">
                {isKo ? "총 예상 경비" : "TOTAL ESTIMATED BUDGET"}
              </h2>
              <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                환율: $1 = ₩{usdRate.toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline gap-2.5 my-0.5">
              <span className="text-2xl font-black text-neutral-900 tracking-tight tabular-nums">
                ₩ {grandTotalKrw.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                1인당 ₩ {Math.round(grandTotalKrw / adultCount).toLocaleString()} (≈ ${Math.round(grandTotalKrw / adultCount / usdRate).toLocaleString()})
              </span>
            </div>
            <div className="text-[11px] font-bold text-neutral-400">
              ≈ ${Math.round(grandTotalKrw / usdRate).toLocaleString()} USD
            </div>
          </div>

          {/* 1일 예상 지출 분석 카드 */}
          <div className="bg-white/95 rounded-2xl border border-neutral-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-black text-neutral-900 tracking-tight">
                {isKo ? "1일 예상 지출 분석" : "DAILY PACING ANALYSIS"}
              </h2>
            </div>
            <div className="flex items-baseline gap-2 my-0.5">
              <span className="text-2xl font-black text-neutral-900 tracking-tight tabular-nums">
                ₩ {dailyAverageKrw.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold">/ 1일 매칭 지출</span>
              <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full ml-auto">
                1인당 ₩ {Math.round(dailyAverageKrw / adultCount).toLocaleString()} (≈ ${Math.round(dailyAverageKrw / adultCount / usdRate).toLocaleString()})
              </span>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                <div style={{ width: "79.3%" }} className="bg-emerald-500 h-full rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-neutral-500">79.3%</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-600">- ₩ {(dailyAverageKrw * 2).toLocaleString()}</span>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                    안전 권역
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 원스톱 예산 분석 허브 (첨부 이미지와 100% 동일한 집계표 + 2개 캡슐 바) */}
        <div className="bg-white/95 rounded-2xl border border-neutral-200/90 p-3.5 shadow-2xs flex-1 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-neutral-100 pb-1.5 mb-1.5">
            <h3 className="text-xs font-black text-neutral-900 tracking-tight">
              {isKo ? "원스톱 예산 분석 허브" : "Unified Expense Analytics Hub"}
            </h3>
            <p className="text-[10px] text-neutral-400 font-medium">
              {isKo
                ? "도시별 이동 교통비와 머무는 일정에 맞춘 모든 여행 경비를 한눈에 보기 쉽게 정리한 내역입니다."
                : "Comprehensive category audit by destination and sector."}
            </p>
          </div>

          <div className="grid grid-cols-12 gap-3.5 items-center flex-1">
            {/* 좌측 8열: 도시별 5대 부문 집계표 */}
            <div className="col-span-8 overflow-hidden">
              <div className="mb-1 text-[11px] font-black text-neutral-800">
                {isKo ? "도시별 5대 부문 집계표" : "City Expense Breakdown"}
              </div>
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-[10px] text-neutral-500 font-bold uppercase">
                    <th className="py-1">{isKo ? "도시" : "City"}</th>
                    <th className="py-1">{isKo ? "체류" : "Nights"}</th>
                    <th className="py-1 text-teal-600 font-black">{isKo ? "숙소" : "Stay"}</th>
                    <th className="py-1 text-rose-600 font-black">{isKo ? "음식" : "Food"}</th>
                    <th className="py-1 text-amber-600 font-black">{isKo ? "관광" : "Attr"}</th>
                    <th className="py-1 text-indigo-600 font-black">{isKo ? "교통" : "Transit"}</th>
                    <th className="py-1 text-purple-600 font-black">{isKo ? "기타" : "Others"}</th>
                    <th className="py-1 text-neutral-900 font-black">{isKo ? "소계" : "Subtotal"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[11px]">
                  {stopsList.map((stop: any, idx: number) => {
                    const cInfo = cityBreakdown[stop.city];
                    const nights = stop.nights;
                    const stayKrw = stop.stayTotalKrw ?? (cInfo?.stayTotalKrw || 0);
                    const foodKrw = stop.foodTotalKrw ?? (cInfo?.foodTotalKrw || 0);
                    const attrKrw = stop.attractionTotalKrw ?? (cInfo?.attractionTotalKrw || 0);
                    const transKrw = stop.transportTotalKrw ?? (cInfo?.transportTotalKrw || 0);
                    const otherKrw = stop.otherTotalKrw ?? ((cInfo as any)?.otherTotalKrw || 0);
                    const rowSubtotal = stayKrw + foodKrw + attrKrw + transKrw + otherKrw;

                    return (
                      <tr key={stop.stopId || `${stop.city}-${idx}`} className="hover:bg-neutral-50/50">
                        <td className="py-1 font-bold text-neutral-800">
                          {stop.cityName}
                          {stop.isAdded && <span className="ml-1 text-[9px] text-amber-600 font-black">(+)</span>}
                        </td>
                        <td className="py-1 text-neutral-500 tabular-nums">
                          {nights > 0 ? `${nights}N` : "0N"}
                        </td>
                        <td className="py-1 tabular-nums font-semibold text-neutral-700">₩ {stayKrw.toLocaleString()}</td>
                        <td className="py-1 tabular-nums font-semibold text-neutral-700">₩ {foodKrw.toLocaleString()}</td>
                        <td className="py-1 tabular-nums font-semibold text-neutral-700">₩ {attrKrw.toLocaleString()}</td>
                        <td className="py-1 tabular-nums font-semibold text-neutral-700">₩ {transKrw.toLocaleString()}</td>
                        <td className="py-1 tabular-nums text-neutral-400">₩ {otherKrw.toLocaleString()}</td>
                        <td className="py-1 tabular-nums font-black text-neutral-900">₩ {rowSubtotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-300 font-black text-[11px] bg-neutral-50/60">
                    <td className="py-1 text-neutral-900">{isKo ? "소계" : "Subtotal"}</td>
                    <td className="py-1 text-neutral-700 tabular-nums">{totalNights}N</td>
                    <td className="py-1 text-neutral-900 tabular-nums">₩ {sumAccTotal.toLocaleString()}</td>
                    <td className="py-1 text-neutral-900 tabular-nums">₩ {sumFoodTotal.toLocaleString()}</td>
                    <td className="py-1 text-neutral-900 tabular-nums">₩ {sumAttractionTotal.toLocaleString()}</td>
                    <td className="py-1 text-neutral-900 tabular-nums">₩ {(sumTransportTotal + intercityTotal).toLocaleString()}</td>
                    <td className="py-1 text-neutral-900 tabular-nums">
                      ₩ {(shoppingAmountKrw + totalDailyAllowanceKrw + computedEmergencyKrw).toLocaleString()}
                    </td>
                    <td className="py-1 text-neutral-950 tabular-nums font-black">₩ {grandTotalKrw.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 우측 4열: 2개 캡슐 막대그래프 (카테고리 비중 & 도시별 비중) */}
            <div className="col-span-4 grid grid-cols-2 gap-2.5 items-stretch h-full">
              {/* 캡슐 1: 카테고리 비중 */}
              <div className="p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-200/70 flex flex-col justify-between">
                <div className="border-b border-neutral-200/60 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black text-neutral-900">{isKo ? "카테고리 비중" : "Categories"}</span>
                  <span className="text-[8.5px] font-bold text-neutral-400">100%</span>
                </div>
                <div className="flex-1 flex items-center justify-center relative py-1">
                  <div className="relative flex items-center justify-center">
                    {/* 지시선 레이어 */}
                    <div className="absolute inset-0 h-[120px] pointer-events-none">
                      {categoryLabels.map((cat: any) => {
                        const isLeft = cat.side === "left";
                        return (
                          <div
                            key={cat.key}
                            style={{ top: `${cat.displayYPercent}%` }}
                            className={`absolute -translate-y-1/2 flex items-center gap-1 whitespace-nowrap z-10 ${
                              isLeft ? "right-full mr-1" : "left-full ml-1"
                            }`}
                          >
                            {isLeft && (
                              <div className="flex flex-col items-center text-center leading-none">
                                <span className="block text-[8px] text-neutral-500 font-bold">{cat.label}</span>
                                <span className={`block text-[8.5px] font-black tabular-nums ${cat.textColor}`}>{cat.pct}%</span>
                              </div>
                            )}
                            <span className="w-2 h-[1px] bg-neutral-300 rounded-full shrink-0" />
                            {!isLeft && (
                              <div className="flex flex-col items-center text-center leading-none">
                                <span className="block text-[8px] text-neutral-500 font-bold">{cat.label}</span>
                                <span className={`block text-[8.5px] font-black tabular-nums ${cat.textColor}`}>{cat.pct}%</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* 캡슐 바 */}
                    <div className="w-5 h-[120px] rounded-full flex flex-col bg-neutral-200/60 p-0.5 shadow-inner relative overflow-hidden">
                      {categoryList.map((cat) => {
                        if (cat.pct <= 0) return null;
                        return (
                          <div
                            key={cat.key}
                            style={{ height: `${cat.pct}%` }}
                            className={`${cat.barColor} w-full first:rounded-t-full last:rounded-b-full`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 캡슐 2: 도시별 비중 */}
              <div className="p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-200/70 flex flex-col justify-between">
                <div className="border-b border-neutral-200/60 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black text-neutral-900">{isKo ? "도시별 비중" : "Cities"}</span>
                  <span className="text-[8.5px] font-bold text-neutral-400">100%</span>
                </div>
                <div className="flex-1 flex items-center justify-center relative py-1">
                  <div className="relative flex items-center justify-center">
                    {/* 지시선 레이어 */}
                    <div className="absolute inset-0 h-[120px] pointer-events-none">
                      {cityLabels.map((c: any) => {
                        const isLeft = c.side === "left";
                        return (
                          <div
                            key={c.key}
                            style={{ top: `${c.displayYPercent}%` }}
                            className={`absolute -translate-y-1/2 flex items-center gap-1 whitespace-nowrap z-10 ${
                              isLeft ? "right-full mr-1" : "left-full ml-1"
                            }`}
                          >
                            {isLeft && (
                              <div className="flex flex-col items-center text-center leading-none">
                                <span className="block text-[8px] text-neutral-500 font-bold">{c.label}</span>
                                <span className={`block text-[8.5px] font-black tabular-nums ${c.textColor}`}>{c.pct}%</span>
                              </div>
                            )}
                            <span className="w-2 h-[1px] bg-neutral-300 rounded-full shrink-0" />
                            {!isLeft && (
                              <div className="flex flex-col items-center text-center leading-none">
                                <span className="block text-[8px] text-neutral-500 font-bold">{c.label}</span>
                                <span className={`block text-[8.5px] font-black tabular-nums ${c.textColor}`}>{c.pct}%</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* 캡슐 바 */}
                    <div className="w-5 h-[120px] rounded-full flex flex-col bg-neutral-200/60 p-0.5 shadow-inner relative overflow-hidden">
                      {cityList.map((c) => {
                        if (c.pct <= 0) return null;
                        return (
                          <div
                            key={c.key}
                            style={{ height: `${c.pct}%` }}
                            className={`${c.barColor} w-full first:rounded-t-full last:rounded-b-full`}
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

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page 1 / {totalPages}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2 ~ (1 + N): 도시별 스마트 투어 코스 (선택한 도시 개수만큼 각각 1페이지) */}
      {/* ========================================================================= */}
      {stopsList.map((stop: any, stopIdx: number) => {
        const city = stop.city;
        const cInfo = cityBreakdown[city];
        const rawSpots = (stop.selectedSpots !== undefined ? stop.selectedSpots : cInfo?.selectedSpots || []).filter(
          (s: any) => !s.id.startsWith("act_") && !THEME_ACTIVITIES_CATALOG.some((a) => isSameSpot(a.id, s.id))
        );

        // 스팟 좌표 및 최적 동선 계산
        const mappedSpots: RouteSpotItem[] = rawSpots.map((spot: any, idx: number) => {
          const coords = getSpotCoordinates(
            spot.nameKo,
            spot.nameEn,
            city,
            spot.latitude,
            spot.longitude,
            idx
          );
          return {
            id: spot.id,
            originalIndex: idx,
            routeOrder: idx + 1,
            nameKo: spot.nameKo,
            nameEn: spot.nameEn,
            descKo: spot.descKo,
            descEn: spot.descEn,
            price: spot.price || 0,
            subwayInfo: spot.subwayInfo,
            categoryType: spot.categoryType || "명소",
            officialUrl: spot.officialUrl,
            cityCode: city,
            lat: coords.lat,
            lng: coords.lng,
          };
        });

        const displayedSpots: RouteSpotItem[] = optimizeSpotSequence(mappedSpots).map((item, seqIdx) => ({
          ...item,
          routeOrder: seqIdx + 1,
        }));

        // 코스별 그룹화 (TOUR_COURSE_PRESETS 매칭)
        const cityCourses = TOUR_COURSE_PRESETS.filter(
          (c) => (c.cityCode || "").toLowerCase() === (city || "").toLowerCase() && c.isActive !== false
        );

        const spotGroups: Array<{
          id: string;
          courseTitleKo: string;
          courseTitleEn: string;
          spots: RouteSpotItem[];
        }> = [];

        const remainingSpots = [...displayedSpots];
        cityCourses.forEach((course) => {
          if (!course.spotIds || course.spotIds.length === 0) return;
          const hasAllSpots = course.spotIds.every((csId: string) =>
            remainingSpots.some((s) => isSameSpot(s.id, csId))
          );
          if (hasAllSpots) {
            const matchedSpots: RouteSpotItem[] = [];
            course.spotIds.forEach((csId: string) => {
              const foundIdx = remainingSpots.findIndex((s) => isSameSpot(s.id, csId));
              if (foundIdx !== -1) {
                matchedSpots.push(remainingSpots[foundIdx]);
                remainingSpots.splice(foundIdx, 1);
              }
            });
            matchedSpots.sort((a, b) => a.routeOrder - b.routeOrder);
            spotGroups.push({
              id: course.id,
              courseTitleKo: course.nameKo,
              courseTitleEn: course.nameEn,
              spots: matchedSpots,
            });
          }
        });

        if (remainingSpots.length > 0) {
          remainingSpots.sort((a, b) => a.routeOrder - b.routeOrder);
          spotGroups.push({
            id: `custom-group-${stopIdx}`,
            courseTitleKo: isKo ? "맞춤 여행 스팟" : "Custom Tour Spots",
            courseTitleEn: "Custom Tour Spots",
            spots: remainingSpots,
          });
        }

        const kakaoDirectUrl = displayedSpots[0]
          ? getKakaoMapDirectLink(displayedSpots[0].nameKo, displayedSpots[0].lat, displayedSpots[0].lng)
          : "https://map.kakao.com";

        return (
          <div key={`pdf-course-${stop.stopId || `${city}-${stopIdx}`}`} className="pdf-landscape-page flex flex-col justify-between">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[9.5px] font-black uppercase tracking-wider">
                  SMART TOUR COURSE
                </span>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                  {stop.cityName}
                  {stop.isAdded && <span className="text-[#b93829] ml-1.5">(+)</span>}
                  <span className="text-xs text-neutral-400 font-bold ml-2">
                    {stop.nights > 0 ? `${stop.nights}${isKo ? "박 일정" : "N Stay"}` : (isKo ? "당일 코스" : "Day Tour")}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-500">
                  {isKo ? `경로 스팟: ${displayedSpots.length}개소` : `${displayedSpots.length} Spots`}
                </span>
                <a
                  href={kakaoDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-extrabold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <span>{isKo ? "카카오맵 길찾기" : "KakaoMap Route"}</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </div>
            </div>

            {/* 2분할 레이아웃: 좌측 지도 다이어그램 + 우측 코스 관광지 카드 목록 */}
            <div className="grid grid-cols-12 gap-3.5 flex-1 items-stretch py-2 overflow-hidden">
              {/* 좌측 (col-span-5): 스마트 동선 지도 다이어그램 */}
              <div className="col-span-5 flex flex-col justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200/80 pb-1 mb-1">
                  <span className="text-xs font-black text-neutral-800">
                    {isKo ? "권역별 최적 이동 동선" : "Optimized Travel Sequence"}
                  </span>
                  <span className="text-[9.5px] font-bold text-neutral-400">ROUTE MATRIX</span>
                </div>

                {/* 시각적 경로 연결선 다이어그램 */}
                <div className="flex-1 flex flex-col justify-center space-y-1.5 py-1">
                  {displayedSpots.length === 0 ? (
                    <div className="text-center text-neutral-400 text-xs py-10">
                      {isKo ? "선택된 관광지가 없습니다." : "No attractions selected."}
                    </div>
                  ) : (
                    displayedSpots.slice(0, 7).map((spot) => (
                      <div key={spot.id} className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 rounded-full bg-neutral-900 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                          {spot.routeOrder}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <span className="font-bold text-neutral-800 truncate text-[10.5px]">
                            {isKo ? spot.nameKo : spot.nameEn}
                          </span>
                          <span className="text-[9.5px] text-neutral-400 font-medium shrink-0 ml-1.5">
                            {spot.price === 0 ? (isKo ? "무료" : "Free") : `₩${spot.price.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  {displayedSpots.length > 7 && (
                    <div className="text-center text-[9.5px] text-neutral-400 font-bold pt-0.5">
                      +{displayedSpots.length - 7} more spots on itinerary
                    </div>
                  )}
                </div>

                <div className="pt-1.5 border-t border-neutral-200/80 text-[9px] text-neutral-400 leading-tight">
                  💡 {isKo ? "지도 상단 '카카오맵 길찾기'를 클릭하면 모바일 및 PC 카카오맵으로 전체 최적 이동 동선이 바로 연동됩니다." : "Click 'KakaoMap Route' to open direct navigation."}
                </div>
              </div>

              {/* 우측 (col-span-7): 선택된 관광지 코스별 카드 그리드 */}
              <div className="col-span-7 overflow-hidden flex flex-col justify-start space-y-2">
                {spotGroups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-0.5">
                      <span className="text-xs font-black text-neutral-900">
                        {isKo ? group.courseTitleKo : group.courseTitleEn}
                        <span className="text-neutral-400 font-bold ml-1.5">({group.spots.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {group.spots.map((spot) => {
                        const spotName = isKo ? spot.nameKo : spot.nameEn;
                        const transitDesc = spot.subwayInfo || (spot.descKo ? spot.descKo.slice(0, 36) : "");
                        return (
                          <div
                            key={spot.id}
                            className="p-2 rounded-xl bg-white border border-neutral-200/90 shadow-2xs flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-3.5 h-3.5 rounded-full bg-neutral-100 text-neutral-700 font-black text-[8.5px] flex items-center justify-center shrink-0">
                                  {spot.routeOrder}
                                </span>
                                <h4 className="font-extrabold text-[10.5px] text-neutral-900 truncate">
                                  {spotName}
                                </h4>
                              </div>
                              <span className="text-[9px] font-bold text-neutral-600 tabular-nums shrink-0">
                                {spot.price === 0 ? (isKo ? "무료 입장" : "Free") : `₩${spot.price.toLocaleString()}`}
                              </span>
                            </div>

                            {transitDesc && (
                              <p className="text-[9px] text-neutral-400 mt-0.5 line-clamp-1 leading-tight">
                                {transitDesc}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-neutral-100 text-[8.5px] text-neutral-400">
                              <span>{spot.categoryType || "명소"}</span>
                              {spot.officialUrl && (
                                <a
                                  href={spot.officialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 font-bold hover:underline"
                                >
                                  {isKo ? "공식정보" : "Official"} ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 하단 푸터 */}
            <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
              Page {stopIdx + 2} / {totalPages}
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* PAGE (N + 2): 스마트 여행 예약 */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page flex flex-col justify-between">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-md bg-[#b93829] text-white text-[9.5px] font-black uppercase tracking-wider">
                BOOKING ACTION HUB
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                {isKo ? "스마트 여행 예약" : "Smart Booking Action Hub"}
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
              {isKo
                ? "내 여행 일정에 맞춘 공식 예매 및 추천 예약 링크입니다. (PDF 내 링크를 클릭하면 공식 예매처로 연결됩니다)"
                : "Official and verified booking links mapped directly to your itinerary."}
            </p>
          </div>
          <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-0.5 rounded-full">
            {isKo ? `총 ${totalCount}개 예약 연동` : `${totalCount} Bookings`}
          </span>
        </div>

        {/* 4대 부문 2단 다단 그리드 */}
        <div className="grid grid-cols-2 gap-3.5 flex-1 py-2 overflow-hidden">
          {/* 좌측단: 1. 교통편 예매 + 2. 도시별 숙소 */}
          <div className="space-y-2.5 overflow-hidden flex flex-col justify-between">
            {/* 교통편 예매 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-0.5">
                <span className="text-xs font-black text-neutral-900">
                  {isKo ? "교통편 예매" : "Transit & Flights"}
                </span>
                <span className="text-[10px] font-bold text-neutral-400">
                  {categorizedItems.TRANSIT.length}건
                </span>
              </div>
              <div className="space-y-1">
                {categorizedItems.TRANSIT.map((item) => (
                  <div key={item.id} className="p-1.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-[11px] text-neutral-900 truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </h4>
                      <p className="text-[9px] text-neutral-400 truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 도시별 숙소 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-0.5">
                <span className="text-xs font-black text-neutral-900">
                  {isKo ? "도시별 숙소" : "Accommodations"}
                </span>
                <span className="text-[10px] font-bold text-neutral-400">
                  {categorizedItems.STAY.length}건
                </span>
              </div>
              <div className="space-y-1">
                {categorizedItems.STAY.map((item) => (
                  <div key={item.id} className="p-1.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-[11px] text-neutral-900 truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </h4>
                      <p className="text-[9px] text-neutral-400 truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? "아고다 예약" : "Agoda"} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 우측단: 3. 명소 & 티켓 바우처 + 4. 여행 필수 준비물 + 5. 무료 명소 */}
          <div className="space-y-2 overflow-hidden flex flex-col justify-between">
            {/* 명소 & 티켓 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-0.5">
                <span className="text-xs font-black text-neutral-900">
                  {isKo ? "명소 & 티켓 바우처" : "Attractions & Tickets"}
                </span>
                <span className="text-[10px] font-bold text-neutral-400">
                  {categorizedItems.ATTRACTION.length}건
                </span>
              </div>
              <div className="space-y-1">
                {categorizedItems.ATTRACTION.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-1.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-[10.5px] text-neutral-900 truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </h4>
                      <p className="text-[8.5px] text-neutral-400 truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[8.5px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 필수 준비물 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-0.5">
                <span className="text-xs font-black text-neutral-900">
                  {isKo ? "여행 필수 준비물" : "Travel Essentials"}
                </span>
                <span className="text-[10px] font-bold text-neutral-400">
                  {categorizedItems.ESSENTIAL.length}건
                </span>
              </div>
              <div className="space-y-1">
                {categorizedItems.ESSENTIAL.map((item) => (
                  <div key={item.id} className="p-1.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-[10.5px] text-neutral-900 truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </h4>
                      <p className="text-[8.5px] text-neutral-400 truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[8.5px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 무료 명소 리스트 (컴팩트 태그 클라우드) */}
            {freeSpots.length > 0 && (
              <div className="space-y-0.5 p-1.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200/80 pb-0.5">
                  <span className="text-[9.5px] font-black text-neutral-800">
                    {isKo ? "사전 예약 없이 바로 가는 무료 명소" : "Free Attractions (No Booking)"}
                  </span>
                  <span className="text-[8.5px] font-bold text-neutral-400">{freeSpots.length}곳</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden pt-0.5">
                  {freeSpots.map((spot) => (
                    <a
                      key={spot.id}
                      href={spot.targetUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-1.5 py-0.2 rounded bg-white border border-neutral-200 text-[8px] text-neutral-700 hover:text-blue-600 font-medium truncate"
                    >
                      <span className="text-neutral-400 mr-0.5">[{isKo ? spot.cityNameKo : spot.cityNameEn}]</span>
                      {isKo ? spot.nameKo : spot.nameEn} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page {stopsList.length + 2} / {totalPages}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE (N + 3): 도시별 담은 대표 음식 리스트 (K-FOOD SELECTION) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page flex flex-col justify-between">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-md bg-[#b93829] text-white text-[9.5px] font-black uppercase tracking-wider">
                K-FOOD SELECTION
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                {isKo ? "도시별 담은 대표 음식 리스트" : "Selected Food Guide by City"}
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
              {isKo
                ? "플래너에서 직접 선택한 도시별 한국 대표 미식 목록입니다."
                : "Curated regional Korean gourmet experiences selected in your travel planner."}
            </p>
          </div>
          <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-0.5 rounded-full">
            {isKo ? `식비 합계: ₩ ${sumFoodTotal.toLocaleString()}` : `Total Food: ₩ ${sumFoodTotal.toLocaleString()}`}
          </span>
        </div>

        {/* 도시별 구획 분리 음식 리스트 */}
        <div className="flex-1 py-2 space-y-2 overflow-hidden flex flex-col justify-start">
          {stopsList.map((stop: any, sIdx: number) => {
            const foodItems = (stop as any).foodBasketPlan?.selectedItems
              || (cityBreakdown[stop.city] as any)?.foodBasketPlan?.selectedItems
              || [];

            if (foodItems.length === 0) return null;

            return (
              <div key={`pdf-food-${stop.stopId || `${stop.city}-${sIdx}`}`} className="space-y-1">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-0.5">
                  <span className="text-xs font-black text-neutral-900">
                    {stop.cityName}
                    {stop.isAdded && <span className="text-[#b93829] ml-1">(+)</span>}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    ({foodItems.length}{isKo ? "종" : " items"})
                  </span>
                  <span className="text-[10.5px] font-black text-rose-700 ml-auto tabular-nums">
                    ₩ {(stop.foodTotalKrw || (cityBreakdown[stop.city]?.foodTotalKrw) || 0).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {foodItems.map((fItem: any) => {
                    const food = fItem.food || {};
                    const fName = isKo ? food.nameKo || food.nameEn : food.nameEn || food.nameKo;
                    const unitPrice = food.unitPriceKrw || 0;
                    const qty = fItem.quantity || 1;
                    const imgUrl = food.imageUrl || "/assets/food-placeholder.jpg";
                    const itemSubtotal = fItem.subtotalKrw || (unitPrice * adultCount * qty);

                    return (
                      <div
                        key={food.id || fName}
                        className="p-1.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-2"
                      >
                        {/* 음식 사진 (웹에 등록된 사진) */}
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200">
                          <img
                            src={imgUrl}
                            alt={fName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>

                        {/* 메뉴명 및 가격 */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="font-extrabold text-[10.5px] text-neutral-900 block truncate leading-tight">
                            {fName}
                          </span>
                          <span className="text-[9px] text-neutral-500 block tabular-nums leading-tight">
                            ₩ {unitPrice.toLocaleString()} {adultCount > 1 ? `× ${adultCount}인` : ""}
                          </span>
                          <span className="text-[10px] font-black text-rose-700 block tabular-nums leading-tight">
                            ₩ {itemSubtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page {stopsList.length + 3} / {totalPages}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE (N + 4): 내 한국 여행 영수증 (3단 다단 전체 연결 흐름) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page flex flex-col justify-between">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[9.5px] font-black uppercase tracking-wider">
                ITEMIZED RECEIPT
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                {isKo ? "내 한국 여행 영수증" : "Itemized Travel Receipt"}
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
              {isKo
                ? "도시별 이동 교통과 머무는 일정에 맞춘 전 일정 실비 영수증입니다."
                : "Chronological itemized breakdown for all legs, stays, dining, and activities."}
            </p>
          </div>
          <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-0.5 rounded-full">
            {totalNights}{isKo ? "박" : "N"} · {adultCount}{isKo ? "인" : " Travelers"}
          </span>
        </div>

        {/* 3단 다단(3-column)으로 위에서 아래로 좌➔중➔우 자연스럽게 이어지는 영수증 본문 */}
        <div className="print-receipt-3col flex-1 py-1.5 overflow-hidden text-xs text-neutral-800">
          {/* 1. 입국 공항 이동 */}
          {entryItems.length > 0 && (
            <div className="print-avoid-break p-1.5 mb-1.5 rounded-xl bg-neutral-100/70 border border-neutral-200">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-800">
                <span>{entryItems.map((i: any) => formatSimplifiedTransit(i).routeName).join(", ")}</span>
                <span className="font-black tabular-nums">
                  ₩ {entryItems.reduce((sum: number, item: any) => sum + item.lineTotalKrw, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* 2. 도시별 영수증 블록들 */}
          {stopsList.map((sInfo: any, idx: number) => {
            const nextStop = stopsList[idx + 1];
            const transitToNext = nextStop
              ? allTransitLegs.find(
                  (leg: any) =>
                    !leg.isAirportLeg &&
                    ((leg.from === sInfo.city && leg.to === nextStop.city) ||
                      (leg.from === nextStop.city && leg.to === sInfo.city))
                )
              : null;

            const cInfo = cityBreakdown[sInfo.city];
            const spots = (sInfo.selectedSpots !== undefined ? sInfo.selectedSpots : cInfo?.selectedSpots || []).filter(
              (s: any) => !s.id.startsWith("act_") && !THEME_ACTIVITIES_CATALOG.some((a) => isSameSpot(a.id, s.id))
            );

            // 음식 내역
            const foodItems = (sInfo as any).foodBasketPlan?.selectedItems
              || ((cityBreakdown[sInfo.city] as any)?.foodBasketPlan?.selectedItems || []);
            const foodKrw = sInfo.foodTotalKrw || (cityBreakdown[sInfo.city]?.foodTotalKrw || 0);

            const stayTotal = sInfo.stayTotalKrw ?? (cInfo?.stayTotalKrw || 0);

            return (
              <React.Fragment key={`receipt-stop-${sInfo.stopId || `${sInfo.city}-${idx}`}`}>
                <div className="print-avoid-break p-1.5 mb-1.5 rounded-xl bg-neutral-50 border border-neutral-200/90 space-y-0.5">
                  {/* 도시 헤더 */}
                  <div className="flex justify-between items-center pb-0.5 border-b border-neutral-200">
                    <span className="font-black text-[11px] text-neutral-900">
                      • {sInfo.cityName}
                      {sInfo.isAdded && <span className="text-[#b93829] ml-1">(+)</span>}
                      <span className="text-[9.5px] text-neutral-400 font-medium ml-1">
                        ({sInfo.nights > 0 ? `${sInfo.nights}박` : "0박"})
                      </span>
                    </span>
                    <span className="font-black text-[11px] text-neutral-900 tabular-nums">
                      ₩ {(sInfo.subtotalKrw || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* 숙소 */}
                  {stayTotal > 0 && (
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="text-neutral-600 truncate pr-1">
                        <span className="font-bold text-teal-700 mr-1">[숙소]</span>
                        {sInfo.stayItemLabel || "도심 호텔"}
                      </span>
                      <span className="font-bold tabular-nums shrink-0">₩ {stayTotal.toLocaleString()}</span>
                    </div>
                  )}

                  {/* 식비 */}
                  {foodKrw > 0 && (
                    <div className="space-y-0.5 pt-0.5 border-t border-neutral-100">
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="text-neutral-600 truncate pr-1">
                          <span className="font-bold text-rose-700 mr-1">[식비]</span>
                          {foodItems.length > 0 ? `선택 미식 ${foodItems.length}종` : "식비 합계"}
                        </span>
                        <span className="font-bold tabular-nums shrink-0">₩ {foodKrw.toLocaleString()}</span>
                      </div>
                      {foodItems.length > 0 && (
                        <div className="pl-1.5 space-y-0.2 text-[8.5px] text-neutral-500">
                          {foodItems.slice(0, 3).map((fi: any) => (
                            <div key={fi.food?.id || fi.food?.nameKo} className="flex justify-between">
                              <span className="truncate pr-1">• {isKo ? fi.food?.nameKo : fi.food?.nameEn}</span>
                              <span className="tabular-nums shrink-0">₩ {(fi.subtotalKrw || 0).toLocaleString()}</span>
                            </div>
                          ))}
                          {foodItems.length > 3 && (
                            <div className="text-[8px] text-neutral-400">외 {foodItems.length - 3}개 메뉴</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 교통 */}
                  <div className="flex justify-between items-center text-[9.5px] pt-0.5 border-t border-neutral-100">
                    <span className="text-neutral-600">
                      <span className="font-bold text-indigo-700 mr-1">[교통]</span>
                      {sInfo.cityName} 시내 대중교통
                    </span>
                    <span className="font-bold tabular-nums">₩ {(sInfo.transportTotalKrw || 0).toLocaleString()}</span>
                  </div>

                  {/* 관광 */}
                  {spots.length > 0 && (
                    <div className="space-y-0.5 pt-0.5 border-t border-neutral-100">
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="font-bold text-amber-700">[관광] 명소 {spots.length}곳</span>
                        <span className="font-bold tabular-nums">₩ {(sInfo.attractionTotalKrw || 0).toLocaleString()}</span>
                      </div>
                      <div className="pl-1.5 space-y-0.2 text-[8.5px] text-neutral-500">
                        {spots.slice(0, 4).map((sp: any) => (
                          <div key={sp.id} className="flex justify-between">
                            <span className="truncate pr-1">• {isKo ? sp.nameKo : sp.nameEn}</span>
                            <span className="tabular-nums shrink-0">
                              {sp.price === 0 ? "무료" : `₩ ${(sp.price * adultCount).toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                        {spots.length > 4 && (
                          <div className="text-[8px] text-neutral-400">외 {spots.length - 4}개 명소</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 도시 간 이동 커넥터 */}
                {transitToNext && (
                  <div className="print-avoid-break p-1 mb-1.5 rounded-xl bg-neutral-100/70 border border-neutral-200 flex justify-between items-center text-[9px] font-bold text-neutral-700">
                    <span>{formatSimplifiedTransit(transitToNext).routeName} ({formatSimplifiedTransit(transitToNext).modeName})</span>
                    <span className="font-black tabular-nums">₩ {transitToNext.lineTotalKrw.toLocaleString()}</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* 3. 출국 공항 이동 */}
          {exitItems.length > 0 && (
            <div className="print-avoid-break p-1.5 mb-1.5 rounded-xl bg-neutral-100/70 border border-neutral-200">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-800">
                <span>{exitItems.map((i: any) => formatSimplifiedTransit(i).routeName).join(", ")}</span>
                <span className="font-black tabular-nums">
                  ₩ {exitItems.reduce((sum: number, item: any) => sum + item.lineTotalKrw, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3단 하단 전폭(column-span: all) 최종 합계 요약 바 */}
        <div className="print-column-span-all pt-1 border-t-2 border-neutral-900 bg-neutral-50 p-2 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            {shoppingAmountKrw > 0 && (
              <div>
                <span className="text-[9px] text-neutral-400 block font-bold">{isKo ? "쇼핑 예산" : "Shopping"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {shoppingAmountKrw.toLocaleString()}</span>
              </div>
            )}
            {totalDailyAllowanceKrw > 0 && (
              <div>
                <span className="text-[9px] text-neutral-400 block font-bold">{isKo ? "일일 용돈" : "Daily Allowance"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {totalDailyAllowanceKrw.toLocaleString()}</span>
              </div>
            )}
            {computedEmergencyKrw > 0 && (
              <div>
                <span className="text-[9px] text-neutral-400 block font-bold">{isKo ? "여행 비상금" : "Emergency Fund"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {computedEmergencyKrw.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider">
              {isKo ? "예산 총액 (GRAND TOTAL)" : "Grand Total"}
            </span>
            <span className="text-base font-black text-neutral-900 tabular-nums">
              ₩ {grandTotalKrw.toLocaleString()}
            </span>
            {adultCount > 1 && (
              <span className="text-[9px] text-neutral-500 font-bold block">
                1인당 ₩ {Math.round(grandTotalKrw / adultCount).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page {stopsList.length + 4} / {totalPages}
        </div>
      </div>
    </div>
  );
}