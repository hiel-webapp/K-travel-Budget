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
  usdRate = 1387,
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

  // 1. 정차지 목록 (서울, 전주, 부산, 서울 (+) 등)
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
    }));
  }, [stopBreakdown, draft.selectedCities, cityBreakdown, isKo]);

  // 2. 예약 데이터 및 무료 명소
  const { categorizedItems, totalCount, freeSpots } = useMemo(() => {
    return buildBookingHubData(calculations, draft, locale, usdRate);
  }, [calculations, draft, locale, usdRate]);

  // 3. 차트용 비율 데이터
  const grandTotalSafe = grandTotalKrw || 1;
  const stayPct = Math.round((sumAccTotal / grandTotalSafe) * 100);
  const foodPct = Math.round((sumFoodTotal / grandTotalSafe) * 100);
  const attrPct = Math.round((sumAttractionTotal / grandTotalSafe) * 100);
  const transPct = Math.round(((sumTransportTotal + intercityTotal) / grandTotalSafe) * 100);
  const otherPct = Math.max(0, 100 - (stayPct + foodPct + attrPct + transPct));

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
      {/* PAGE 1: 리포트 총괄 요약 대시보드 (A4 Landscape) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page p-6 flex flex-col justify-between">
        {/* 1-1. 상단 헤더 & 일정 루트 칩 */}
        <div className="space-y-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md bg-[#b93829] text-white text-[10px] font-black uppercase tracking-wider">
                  HYPEHERITAGE K-REPORT
                </span>
                <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                  {isKo ? "여행 예산 리포트" : "Korea Travel Budget Report"}
                </h1>
              </div>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                {isKo
                  ? "플래너에서 직접 담은 숙소, 식비, 교통, 명소 및 비상금이 100% 반영된 종합 실비 리포트입니다."
                  : "Comprehensive verified budget report directly mapped to your customized itinerary."}
              </p>
            </div>
            <div className="text-right text-[11px] text-neutral-400 font-bold">
              {new Date().toLocaleDateString(isKo ? "ko-KR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          {/* 일정 메타 칩 */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-black">
              {totalNights}{isKo ? "박" : "N"} {travelDays}{isKo ? "일" : "D"}
            </span>
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold">
              {adultCount}{isKo ? "인 성인" : " Adults"}
            </span>
            <span className="text-xs font-bold text-neutral-400 mx-1">· ROUTE:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {stopsList.map((stop: any, idx: number) => (
                <React.Fragment key={stop.stopId || `${stop.city}-${idx}`}>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    stop.isAdded
                      ? "bg-amber-50 text-amber-900 border border-amber-200"
                      : "bg-white text-neutral-800 border border-neutral-200"
                  }`}>
                    {stop.cityName}
                    {stop.isAdded && <span className="ml-1 text-[10px] text-amber-600 font-black">+추가</span>}
                    <span className="ml-1 text-neutral-400 font-normal">
                      ({stop.nights > 0 ? `${stop.nights}${isKo ? "박" : "N"}` : (isKo ? "당일" : "Day")})
                    </span>
                  </span>
                  {idx < stopsList.length - 1 && (
                    <span className="text-neutral-300 text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 1-2. 총 예상 경비 & 1일 지출 분석 (2열 카드) */}
        <div className="grid grid-cols-2 gap-4 py-3">
          {/* 총 예상 경비 */}
          <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-neutral-700">
                {isKo ? "총 예상 경비" : "Total Estimated Budget"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                $1 ≈ ₩{usdRate.toLocaleString()}
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-neutral-900 tracking-tight tabular-nums">
                ₩ {grandTotalKrw.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-neutral-500 mt-0.5 tabular-nums">
                ≈ ${Math.round(grandTotalKrw / usdRate).toLocaleString()} USD
                {adultCount > 1 && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600 text-[11px]">
                    1인당 ₩ {Math.round(grandTotalKrw / adultCount).toLocaleString()} (≈ ${Math.round(grandTotalKrw / adultCount / usdRate).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 1일 예상 지출 분석 */}
          <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-neutral-700">
                {isKo ? "1일 예상 지출 분석" : "Daily Expense Rate"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                {isKo ? "안전 권역" : "Target Zone"}
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-neutral-900 tracking-tight tabular-nums">
                ₩ {dailyAverageKrw.toLocaleString()}
                <span className="text-xs text-neutral-400 font-normal ml-1.5">/ 1일 예상 지출</span>
              </div>
              <div className="text-xs font-bold text-neutral-500 mt-0.5 tabular-nums">
                1인당 ₩ {Math.round(dailyAverageKrw / adultCount).toLocaleString()} (≈ ${Math.round(dailyAverageKrw / adultCount / usdRate).toLocaleString()})
              </div>
            </div>
          </div>
        </div>

        {/* 1-3. 원스톱 예산 분석 허브 (도시별 집계표 8열 + 2개 세로 비중 바 차트 4열) */}
        <div className="p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/80 flex-1 flex flex-col justify-between">
          <div className="border-b border-neutral-200 pb-2 mb-2">
            <span className="text-xs font-black text-neutral-900 tracking-tight">
              {isKo ? "도시별 5대 부문 집계표" : "City Expense Audit Table"}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center flex-1">
            {/* 8열: 5대 부문 표 */}
            <div className="col-span-8 overflow-hidden">
              <table className="w-full text-center text-xs border-collapse font-medium">
                <thead>
                  <tr className="border-b border-neutral-200 uppercase text-[10px] tracking-wider text-neutral-500">
                    <th className="py-1.5 font-bold">{isKo ? "도시" : "City"}</th>
                    <th className="py-1.5 font-bold">{isKo ? "체류" : "Nights"}</th>
                    <th className="py-1.5 font-black text-teal-600">{isKo ? "숙소" : "Stay"}</th>
                    <th className="py-1.5 font-black text-rose-600">{isKo ? "음식" : "Food"}</th>
                    <th className="py-1.5 font-black text-amber-600">{isKo ? "관광" : "Attr"}</th>
                    <th className="py-1.5 font-black text-indigo-600">{isKo ? "교통" : "Transit"}</th>
                    <th className="py-1.5 font-black text-purple-600">{isKo ? "기타" : "Others"}</th>
                    <th className="py-1.5 font-black text-neutral-900">{isKo ? "소계" : "Subtotal"}</th>
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
                        <td className="py-1.5 font-bold text-neutral-800">
                          {stop.cityName}
                          {stop.isAdded && <span className="ml-1 text-[10px] text-amber-600 font-black">(+)</span>}
                        </td>
                        <td className="py-1.5 text-neutral-500 tabular-nums">{nights}N</td>
                        <td className="py-1.5 text-neutral-800 tabular-nums">₩ {stayKrw.toLocaleString()}</td>
                        <td className="py-1.5 text-neutral-800 tabular-nums">₩ {foodKrw.toLocaleString()}</td>
                        <td className="py-1.5 text-neutral-800 tabular-nums">₩ {attrKrw.toLocaleString()}</td>
                        <td className="py-1.5 text-neutral-800 tabular-nums">₩ {transKrw.toLocaleString()}</td>
                        <td className="py-1.5 text-neutral-800 tabular-nums">₩ {otherKrw.toLocaleString()}</td>
                        <td className="py-1.5 font-black text-neutral-900 tabular-nums">₩ {rowSubtotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {/* 소계 합계행 */}
                  <tr className="border-t-2 border-neutral-300 bg-neutral-100/70 font-black text-neutral-900 text-xs">
                    <td className="py-2 text-center">{isKo ? "소계" : "Total"}</td>
                    <td className="py-2 tabular-nums">{totalNights}N</td>
                    <td className="py-2 tabular-nums text-teal-700">₩ {sumAccTotal.toLocaleString()}</td>
                    <td className="py-2 tabular-nums text-rose-700">₩ {sumFoodTotal.toLocaleString()}</td>
                    <td className="py-2 tabular-nums text-amber-700">₩ {sumAttractionTotal.toLocaleString()}</td>
                    <td className="py-2 tabular-nums text-indigo-700">₩ {(sumTransportTotal + intercityTotal).toLocaleString()}</td>
                    <td className="py-2 tabular-nums text-purple-700">₩ {(shoppingAmountKrw + totalDailyAllowanceKrw + computedEmergencyKrw).toLocaleString()}</td>
                    <td className="py-2 tabular-nums text-neutral-900">₩ {grandTotalKrw.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4열: 2개 세로 비중 바 차트 */}
            <div className="col-span-4 flex items-center justify-around h-36 bg-white rounded-xl border border-neutral-200 p-2">
              {/* 카테고리 비중 바 */}
              <div className="flex flex-col items-center h-full">
                <span className="text-[10px] font-bold text-neutral-500 mb-1">{isKo ? "카테고리 비중" : "Category %"}</span>
                <div className="w-6 flex-1 rounded-full overflow-hidden flex flex-col-reverse bg-neutral-100 border border-neutral-200">
                  <div style={{ height: `${stayPct}%` }} className="bg-teal-500" title={`숙소: ${stayPct}%`} />
                  <div style={{ height: `${foodPct}%` }} className="bg-rose-500" title={`음식: ${foodPct}%`} />
                  <div style={{ height: `${attrPct}%` }} className="bg-amber-500" title={`관광: ${attrPct}%`} />
                  <div style={{ height: `${transPct}%` }} className="bg-indigo-500" title={`교통: ${transPct}%`} />
                  <div style={{ height: `${otherPct}%` }} className="bg-purple-500" title={`기타: ${otherPct}%`} />
                </div>
                <span className="text-[9px] font-black text-neutral-700 mt-1">100%</span>
              </div>

              {/* 범례 미니 라벨 */}
              <div className="text-[10px] space-y-1 text-neutral-600 font-bold">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> 숙소 {stayPct}%</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> 음식 {foodPct}%</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 관광 {attrPct}%</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> 교통 {transPct}%</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> 기타 {otherPct}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page 1
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
          <div key={`pdf-course-${stop.stopId || `${city}-${stopIdx}`}`} className="pdf-landscape-page p-6 flex flex-col justify-between">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider">
                  SMART TOUR COURSE
                </span>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">
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
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-neutral-900 font-extrabold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <span>{isKo ? "카카오맵 길찾기" : "KakaoMap Route"}</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </div>
            </div>

            {/* 2분할 레이아웃: 좌측 지도 다이어그램 + 우측 코스 관광지 카드 목록 */}
            <div className="grid grid-cols-12 gap-5 flex-1 items-stretch py-3 overflow-hidden">
              {/* 좌측 (col-span-5): 스마트 동선 지도 다이어그램 */}
              <div className="col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2 mb-2">
                  <span className="text-xs font-black text-neutral-800">
                    {isKo ? "권역별 최적 이동 동선" : "Optimized Travel Sequence"}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">ROUTE MATRIX</span>
                </div>

                {/* 시각적 경로 연결선 다이어그램 */}
                <div className="flex-1 flex flex-col justify-center space-y-2 py-2">
                  {displayedSpots.length === 0 ? (
                    <div className="text-center text-neutral-400 text-xs py-10">
                      {isKo ? "선택된 관광지가 없습니다." : "No attractions selected."}
                    </div>
                  ) : (
                    displayedSpots.slice(0, 7).map((spot) => (
                      <div key={spot.id} className="flex items-center gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-neutral-900 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                          {spot.routeOrder}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <span className="font-bold text-neutral-800 truncate text-[11px]">
                            {isKo ? spot.nameKo : spot.nameEn}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium shrink-0 ml-2">
                            {spot.price === 0 ? (isKo ? "무료" : "Free") : `₩${spot.price.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  {displayedSpots.length > 7 && (
                    <div className="text-center text-[10px] text-neutral-400 font-bold">
                      +{displayedSpots.length - 7} more spots on itinerary
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-neutral-200 text-[10px] text-neutral-500 leading-relaxed">
                  💡 {isKo
                    ? "지도 상단 '카카오맵 길찾기'를 클릭하면 모바일 및 PC 카카오맵으로 전체 최적 이동 동선이 바로 연동됩니다."
                    : "Click 'KakaoMap Route' to open the complete multi-stop navigation in KakaoMap."}
                </div>
              </div>

              {/* 우측 (col-span-7): 코스별 관광지 카드 목록 (2열 그리드) */}
              <div className="col-span-7 overflow-hidden flex flex-col justify-between">
                <div className="space-y-3 flex-1 overflow-hidden">
                  {spotGroups.map((group) => (
                    <div key={group.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-neutral-900">
                          {isKo ? group.courseTitleKo : group.courseTitleEn}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400">
                          ({group.spots.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {group.spots.map((spot) => (
                          <div
                            key={spot.id}
                            className="p-2.5 rounded-xl bg-white border border-neutral-200/90 flex flex-col justify-between space-y-1.5"
                          >
                            <div className="flex items-start gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-neutral-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {spot.routeOrder}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="font-extrabold text-[11px] text-neutral-900 block truncate">
                                  {isKo ? spot.nameKo : spot.nameEn}
                                </span>
                                {spot.subwayInfo && (
                                  <span className="text-[9.5px] text-neutral-400 block truncate">
                                    {spot.subwayInfo}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[10px]">
                              <span className="text-neutral-400">{spot.categoryType}</span>
                              <span className="font-black text-neutral-800">
                                {spot.price === 0 ? (isKo ? "무료 입장" : "Free") : `₩${spot.price.toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
              Page {stopIdx + 2}
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* PAGE (N + 2): 스마트 여행 예약 (2단 그리드 + 하이퍼링크 + 최하단 무료 명소) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page p-6 flex flex-col justify-between">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#b93829] text-white text-[10px] font-black uppercase tracking-wider">
                BOOKING ACTION HUB
              </span>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                {isKo ? "스마트 여행 예약" : "Smart Travel Booking"}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              {isKo
                ? "내 여행 일정에 맞춘 공식 예매 및 추천 예약 링크입니다. (PDF 내 링크를 클릭하면 공식 예매처로 연결됩니다)"
                : "Official booking links for your itinerary. Click any link to open official booking portals directly."}
            </p>
          </div>
          <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
            {isKo ? `총 ${totalCount}개 예약 연동` : `${totalCount} Bookings`}
          </span>
        </div>

        {/* 2단 다단 그리드로 4대 카테고리(교통, 숙소, 명소, 준비물) 정렬 */}
        <div className="grid grid-cols-2 gap-4 flex-1 py-3 overflow-hidden">
          {/* 좌측단: 교통편 예매 + 도시별 숙소 */}
          <div className="space-y-3 overflow-hidden flex flex-col justify-between">
            {/* 1. 교통편 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-1">
                <span className="text-xs font-black text-neutral-800">
                  {isKo ? "교통편 예매" : "Transit Booking"}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold">{categorizedItems.TRANSIT.length}건</span>
              </div>
              <div className="space-y-1.5">
                {categorizedItems.TRANSIT.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[11px] text-neutral-900 block truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-neutral-900 block">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-0.5 text-[10px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 도시별 숙소 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-1">
                <span className="text-xs font-black text-neutral-800">
                  {isKo ? "도시별 숙소" : "Accommodations"}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold">{categorizedItems.STAY.length}건</span>
              </div>
              <div className="space-y-1.5">
                {categorizedItems.STAY.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[11px] text-neutral-900 block truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-neutral-900 block">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-0.5 text-[10px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 우측단: 명소 & 티켓 + 필수 준비물 */}
          <div className="space-y-3 overflow-hidden flex flex-col justify-between">
            {/* 3. 명소 & 티켓 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-1">
                <span className="text-xs font-black text-neutral-800">
                  {isKo ? "명소 & 티켓 바우처" : "Attractions & Tickets"}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold">{categorizedItems.ATTRACTION.length}건</span>
              </div>
              <div className="space-y-1.5">
                {categorizedItems.ATTRACTION.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[11px] text-neutral-900 block truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-neutral-900 block">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-0.5 text-[10px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. 필수 준비물 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-1">
                <span className="text-xs font-black text-neutral-800">
                  {isKo ? "여행 필수 준비물" : "Travel Essentials"}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold">{categorizedItems.ESSENTIAL.length}건</span>
              </div>
              <div className="space-y-1.5">
                {categorizedItems.ESSENTIAL.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[11px] text-neutral-900 block truncate">
                        {isKo ? item.titleKo : item.titleEn}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {isKo ? item.subtitleKo : item.subtitleEn}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-neutral-900 block">{item.priceText}</span>
                      <a
                        href={item.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-0.5 text-[10px] font-extrabold text-[#b93829] hover:underline"
                      >
                        {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 최하단: 무료 명소 리스트 */}
        {freeSpots.length > 0 && (
          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-neutral-900">
                {isKo ? "사전 예약 없이 바로 가는 무료 명소" : "Free Admission Spots"}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">{freeSpots.length}곳</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {freeSpots.map((spot) => (
                <a
                  key={spot.id}
                  href={spot.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[10px] font-bold text-neutral-800 hover:text-[#b93829]"
                >
                  <span className="text-neutral-400 mr-1">[{isKo ? spot.cityNameKo : spot.cityNameEn}]</span>
                  {isKo ? spot.nameKo : spot.nameEn} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page {stopsList.length + 2}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE (N + 3): 도시별 대표 음식 리스트 (PDF 전용 신규 수록) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page p-6 flex flex-col justify-between">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#b93829] text-white text-[10px] font-black uppercase tracking-wider">
                K-FOOD SELECTION
              </span>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                {isKo ? "도시별 담은 대표 음식 리스트" : "Selected Food Guide by City"}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              {isKo
                ? "플래너에서 직접 선택한 도시별 한국 대표 미식 목록입니다."
                : "Curated regional Korean gourmet experiences selected in your travel planner."}
            </p>
          </div>
          <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
            {isKo ? `식비 합계: ₩ ${sumFoodTotal.toLocaleString()}` : `Total Food: ₩ ${sumFoodTotal.toLocaleString()}`}
          </span>
        </div>

        {/* 도시별 구획 분리 음식 리스트 */}
        <div className="flex-1 py-3 space-y-4 overflow-hidden flex flex-col justify-start">
          {stopsList.map((stop: any, sIdx: number) => {
            const foodItems = (stop.foodBreakdown && stop.foodBreakdown.length > 0)
              ? stop.foodBreakdown
              : ((cityBreakdown[stop.city] as any)?.foodBreakdown || []);

            if (foodItems.length === 0) return null;

            return (
              <div key={`pdf-food-${stop.stopId || `${stop.city}-${sIdx}`}`} className="space-y-2">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-1">
                  <span className="text-xs font-black text-neutral-900">
                    {stop.cityName}
                    {stop.isAdded && <span className="text-[#b93829] ml-1">(+)</span>}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    ({foodItems.length}{isKo ? "종" : " items"})
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {foodItems.map((fItem: any) => {
                    const food = fItem.food || {};
                    const fName = isKo ? food.nameKo || food.nameEn : food.nameEn || food.nameKo;
                    const unitPrice = food.unitPriceKrw || 0;
                    const imgUrl = food.imageUrl || "/assets/food-placeholder.jpg";

                    return (
                      <div
                        key={food.id || fName}
                        className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/90 flex items-center gap-3"
                      >
                        {/* 음식 사진 (웹에 등록된 사진) */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200">
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
                          <span className="font-extrabold text-xs text-neutral-900 block truncate">
                            {fName}
                          </span>
                          <span className="text-[10px] text-neutral-500 block tabular-nums">
                            {formatKrw(unitPrice)} {adultCount > 1 ? `× ${adultCount}인` : ""}
                          </span>
                          <span className="text-[11px] font-black text-[#b93829] block tabular-nums">
                            ₩ {(fItem.subtotalKrw || unitPrice * adultCount).toLocaleString()}
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

        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page {stopsList.length + 3}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE (N + 4): 내 한국 여행 영수증 (3단 다단 전체 연결 흐름) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page p-6 flex flex-col justify-between">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider">
                ITEMIZED RECEIPT
              </span>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                {isKo ? "내 한국 여행 영수증" : "Itemized Travel Receipt"}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              {isKo
                ? "도시별 이동 교통과 머무는 일정에 맞춘 전 일정 실비 영수증입니다."
                : "Chronological itemized breakdown for all legs, stays, dining, and activities."}
            </p>
          </div>
          <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
            {totalNights}{isKo ? "박" : "N"} · {adultCount}{isKo ? "인" : " Travelers"}
          </span>
        </div>

        {/* 3단 다단(3-column)으로 위에서 아래로 좌➔중➔우 자연스럽게 이어지는 영수증 본문 */}
        <div className="print-receipt-3col flex-1 py-3 overflow-hidden text-xs text-neutral-800">
          {/* 1. 입국 공항 이동 */}
          {entryItems.length > 0 && (
            <div className="print-avoid-break p-2.5 mb-2.5 rounded-xl bg-neutral-100/70 border border-neutral-200">
              <div className="flex justify-between items-center text-[11px] font-bold text-neutral-800">
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
                      (leg.sourceId && leg.sourceId.includes(`${sInfo.city}-${nextStop.city}`)))
                )
              : null;

            const foodItems = (sInfo.foodBreakdown && sInfo.foodBreakdown.length > 0)
              ? sInfo.foodBreakdown
              : ((cityBreakdown[sInfo.city] as any)?.foodBreakdown || []);

            const spots = sInfo.selectedSpots || cityBreakdown[sInfo.city]?.selectedSpots || [];

            return (
              <React.Fragment key={sInfo.stopId || `${sInfo.city}-${idx}`}>
                <div className="print-avoid-break p-3 mb-2.5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  {/* 도시 헤더 */}
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                    <span className="font-black text-xs text-neutral-900">
                      • {sInfo.cityName}
                      {sInfo.isAdded && <span className="text-[#b93829] ml-1">(+)</span>}
                      <span className="text-[10px] text-neutral-400 font-normal ml-1">({sInfo.nights}박)</span>
                    </span>
                    <strong className="text-xs font-black text-neutral-900 tabular-nums">
                      ₩ {((sInfo.stayTotalKrw || 0) + (sInfo.foodTotalKrw || 0) + (sInfo.transportTotalKrw || 0) + (sInfo.attractionTotalKrw || 0)).toLocaleString()}
                    </strong>
                  </div>

                  {/* 숙소 */}
                  {(sInfo.stayTotalKrw || 0) > 0 && (
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-neutral-600">
                        <span className="font-bold text-teal-700 mr-1">[숙소]</span>
                        {sInfo.stayItemLabel || (isKo ? "호텔" : "Hotel")}
                      </span>
                      <span className="font-bold tabular-nums">₩ {(sInfo.stayTotalKrw || 0).toLocaleString()}</span>
                    </div>
                  )}

                  {/* 음식 */}
                  {foodItems.length > 0 && (
                    <div className="space-y-0.5 pt-1 border-t border-neutral-100">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-rose-700">[음식] 대표 음식 {foodItems.length}종</span>
                        <span className="font-bold tabular-nums">₩ {(sInfo.foodTotalKrw || 0).toLocaleString()}</span>
                      </div>
                      <div className="pl-2 space-y-0.5 text-[9.5px] text-neutral-500">
                        {foodItems.map((f: any) => (
                          <div key={f.food?.id || f.food?.nameKo} className="flex justify-between">
                            <span className="truncate pr-1">{isKo ? f.food?.nameKo : f.food?.nameEn}</span>
                            <span className="tabular-nums shrink-0">₩ {(f.subtotalKrw || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 교통 */}
                  <div className="flex justify-between items-center text-[10.5px] pt-1 border-t border-neutral-100">
                    <span className="text-neutral-600">
                      <span className="font-bold text-indigo-700 mr-1">[교통]</span>
                      {sInfo.cityName} 시내 대중교통
                    </span>
                    <span className="font-bold tabular-nums">₩ {(sInfo.transportTotalKrw || 0).toLocaleString()}</span>
                  </div>

                  {/* 관광 */}
                  {spots.length > 0 && (
                    <div className="space-y-0.5 pt-1 border-t border-neutral-100">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-amber-700">[관광] 명소 {spots.length}곳</span>
                        <span className="font-bold tabular-nums">₩ {(sInfo.attractionTotalKrw || 0).toLocaleString()}</span>
                      </div>
                      <div className="pl-2 space-y-0.5 text-[9.5px] text-neutral-500">
                        {spots.map((sp: any) => (
                          <div key={sp.id} className="flex justify-between">
                            <span className="truncate pr-1">{isKo ? sp.nameKo : sp.nameEn}</span>
                            <span className="tabular-nums shrink-0">
                              {sp.price === 0 ? "무료" : `₩ ${(sp.price * adultCount).toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 도시 간 이동 커넥터 */}
                {transitToNext && (
                  <div className="print-avoid-break p-2 mb-2.5 rounded-xl bg-neutral-100/70 border border-neutral-200 flex justify-between items-center text-[10px] font-bold text-neutral-700">
                    <span>{formatSimplifiedTransit(transitToNext).routeName} ({formatSimplifiedTransit(transitToNext).modeName})</span>
                    <span className="font-black tabular-nums">₩ {transitToNext.lineTotalKrw.toLocaleString()}</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* 3. 출국 공항 이동 */}
          {exitItems.length > 0 && (
            <div className="print-avoid-break p-2.5 mb-2.5 rounded-xl bg-neutral-100/70 border border-neutral-200">
              <div className="flex justify-between items-center text-[11px] font-bold text-neutral-800">
                <span>{exitItems.map((i: any) => formatSimplifiedTransit(i).routeName).join(", ")}</span>
                <span className="font-black tabular-nums">
                  ₩ {exitItems.reduce((sum: number, item: any) => sum + item.lineTotalKrw, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3단 하단 전폭(column-span: all) 최종 합계 요약 바 */}
        <div className="print-column-span-all pt-2 border-t-2 border-neutral-900 bg-neutral-50 p-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs">
            {shoppingAmountKrw > 0 && (
              <div>
                <span className="text-[10px] text-neutral-400 block font-bold">{isKo ? "쇼핑 예산" : "Shopping"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {shoppingAmountKrw.toLocaleString()}</span>
              </div>
            )}
            {totalDailyAllowanceKrw > 0 && (
              <div>
                <span className="text-[10px] text-neutral-400 block font-bold">{isKo ? "일일 용돈" : "Daily Allowance"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {totalDailyAllowanceKrw.toLocaleString()}</span>
              </div>
            )}
            {computedEmergencyKrw > 0 && (
              <div>
                <span className="text-[10px] text-neutral-400 block font-bold">{isKo ? "여행 비상금" : "Emergency Fund"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {computedEmergencyKrw.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
              {isKo ? "예산 총액 (GRAND TOTAL)" : "Grand Total"}
            </span>
            <span className="text-xl font-black text-neutral-900 tabular-nums">
              ₩ {grandTotalKrw.toLocaleString()}
            </span>
            {adultCount > 1 && (
              <span className="text-[10px] text-neutral-500 font-bold block">
                1인당 ₩ {Math.round(grandTotalKrw / adultCount).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page {stopsList.length + 4}
        </div>
      </div>
    </div>
  );
}