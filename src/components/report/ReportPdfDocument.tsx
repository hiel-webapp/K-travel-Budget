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

import ReportBentoDashboard from "./ReportBentoDashboard";
import ExpenseAnalyticsHub from "./ExpenseAnalyticsHub";

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

  // 3. 도시별 교통 연계 (영수증용)
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
      {/* PAGE 1: 리포트 총괄 요약 대시보드 (첨부된 웹 화면 원본 디자인 100% 동일 렌더링) */}
      {/* ========================================================================= */}
      <div className="pdf-landscape-page flex flex-col justify-between">
        <div className="w-full space-y-3.5 transform scale-[0.88] origin-top">
          {/* 1. Header with Route & Metadata (Craft.do 감성의 단정한 글래스 카드) */}
          <div className="bg-white/95 rounded-3xl border border-neutral-200/80 px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="space-y-0.5">
                <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                  {dict.planner.reportTitle}
                </h1>
                <p className="text-xs text-neutral-500 font-medium">
                  {dict.planner.reportSubtitle}
                </p>
              </div>

              {/* Action Tools for Print / Edit */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex h-9 px-4 items-center gap-1.5 rounded-full bg-neutral-900 text-white font-bold text-xs shadow-xs">
                  <span>← {dict.planner.reportBackToPlanner}</span>
                </div>
              </div>
            </div>

            {/* Selected Cities Tag Strip with Travel Duration & Adults */}
            <div className="pt-3 flex flex-wrap items-center gap-2.5 text-xs font-semibold text-neutral-600">
              <span className="bg-neutral-100/80 border border-neutral-200/60 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
                {totalNights}{isKo ? "박 " : "N "}{travelDays}{isKo ? "일" : "D"}
              </span>
              <span className="bg-neutral-100/80 border border-neutral-200/60 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
                {adultCount}{isKo ? "인 성인" : " Adults"}
              </span>
              <span className="text-neutral-300 font-bold text-xs">·</span>
              <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider shrink-0">ROUTE:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {stopsList.map((stop: any, idx: number, arr: any[]) => (
                  <React.Fragment key={stop.stopId || `${stop.city}-${idx}`}>
                    <span className="inline-flex items-center gap-1 bg-neutral-100/80 border border-neutral-200/60 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
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
                    {idx < arr.length - 1 && (
                      <span className="text-neutral-300 font-bold text-xs">➔</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Executive Total Budget & Pacing Summary Banner (Section A) */}
          <ReportBentoDashboard
            calculations={calculations}
            draft={draft}
            locale={locale}
            dict={dict}
            isStatic={true}
          />

          {/* 3. Unified Expense Analytics Hub (Section B: Category Donut + City Donut + City Audit Table) */}
          <ExpenseAnalyticsHub
            calculations={calculations}
            draft={draft}
            locale={locale}
            dict={dict}
            usdRate={usdRate}
          />
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