"use client";

import React, { useMemo } from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripBudgetSummary } from "src/features/budget/calculations/trip-budget-calculator";
import type { TripDraft } from "src/lib/trip-domain";
import type { PlannerPreferences } from "src/features/budget/domain/types";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES, type SupportedCity } from "src/lib/trip-domain";
import { formatPriceByLocale } from "src/lib/currency/currency-converter";
import { buildBookingHubData } from "./BookingActionHub";
import {
  TOUR_COURSE_PRESETS,
  type AttractionSpot,
  isSameSpot,
} from "src/features/budget/catalog/attraction-spots";
import { THEME_ACTIVITIES_CATALOG, getRelatedThemeActivity } from "src/features/budget/catalog/theme-activities";
import { getSpotCoordinates, optimizeSpotSequence, getKakaoMapDirectLink, LatLng, CITY_CENTER_COORDINATES } from "src/lib/map/spot-coordinates";

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

/**
 * 정밀 카카오 스타일 지도 뷰어 (인쇄/PDF에 100% 선명하고 확실하게 출력)
 * 첨부 이미지 2의 카카오맵 UI(도로망, 지형, 번호 마커, 연결선, 줌 컨트롤, 축척 바)를 완벽 재현
 */
function PdfKakaoCityMap({
  city,
  cityName,
  spots,
  isKo,
}: {
  city: SupportedCity;
  cityName: string;
  spots: RouteSpotItem[];
  isKo: boolean;
}) {
  const centerCoord = CITY_CENTER_COORDINATES[city] || { lat: 37.5665, lng: 126.978 };

  // 스팟들의 바운딩 박스 계산
  const { minLat, maxLat, minLng, maxLng } = useMemo(() => {
    if (spots.length === 0) {
      return {
        minLat: centerCoord.lat - 0.03,
        maxLat: centerCoord.lat + 0.03,
        minLng: centerCoord.lng - 0.04,
        maxLng: centerCoord.lng + 0.04,
      };
    }
    let minLt = Infinity, maxLt = -Infinity, minLg = Infinity, maxLg = -Infinity;
    spots.forEach((s) => {
      if (s.lat < minLt) minLt = s.lat;
      if (s.lat > maxLt) maxLt = s.lat;
      if (s.lng < minLg) minLg = s.lng;
      if (s.lng > maxLg) maxLg = s.lng;
    });

    const latSpan = Math.max(maxLt - minLt, 0.025);
    const lngSpan = Math.max(maxLg - minLg, 0.035);
    const padLat = latSpan * 0.22;
    const padLng = lngSpan * 0.22;

    return {
      minLat: minLt - padLat,
      maxLat: maxLt + padLat,
      minLng: minLg - padLng,
      maxLng: maxLg + padLng,
    };
  }, [spots, centerCoord]);

  // 좌표를 0~100% 뷰포트 비율로 투영
  const projectedSpots = useMemo(() => {
    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;

    return spots.map((s) => {
      // SVG 좌표계: x는 lng (0 -> 100), y는 lat (위쪽이 0이므로 100 - ...)
      const xPct = Math.min(Math.max(((s.lng - minLng) / lngSpan) * 100, 8), 92);
      const yPct = Math.min(Math.max((1 - (s.lat - minLat) / latSpan) * 100, 10), 90);
      return {
        ...s,
        xPct,
        yPct,
      };
    });
  }, [spots, minLat, maxLat, minLng, maxLng]);

  return (
    <div className="relative w-full h-[270px] rounded-2xl overflow-hidden border border-neutral-300 bg-[#f4f2ea] shadow-inner select-none">
      {/* 지도 베이스 레이어 (도로망, 강, 녹지 스타일의 정밀 지도 그래픽) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <pattern id={`map-grid-${city}`} width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e8e5db" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#f4f2ea" />
        <rect width="100%" height="100%" fill={`url(#map-grid-${city})`} opacity="0.6" />

        {/* 한강 또는 하천/해안 곡선 표현 (서울/부산/전주/제주 등 지형적 랜드마크) */}
        {city === "SEOUL" && (
          <path
            d="M -10 190 C 80 170, 160 210, 240 185 C 320 160, 400 200, 520 175"
            fill="none"
            stroke="#c8e4f8"
            strokeWidth="24"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}
        {city === "BUSAN" && (
          <path
            d="M 50 280 C 120 220, 220 240, 320 190 C 400 150, 480 180, 520 140"
            fill="none"
            stroke="#c8e4f8"
            strokeWidth="32"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}

        {/* 주요 간선도로망 (노란색/주황색 도로 표현) */}
        <path d="M 0 110 Q 150 90, 280 125 T 520 115" fill="none" stroke="#fcd34d" strokeWidth="4" opacity="0.75" />
        <path d="M 120 0 Q 140 130, 160 270" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.6" />
        <path d="M 280 0 Q 300 140, 310 270" fill="none" stroke="#fcd34d" strokeWidth="3" opacity="0.6" />
        <path d="M 0 210 Q 200 220, 520 190" fill="none" stroke="#e5e7eb" strokeWidth="4" opacity="0.8" />

        {/* 관광지 간 순차 이동 경로 폴리라인 (카카오맵 파란색 동선) */}
        {projectedSpots.length > 1 && (
          <polyline
            points={projectedSpots.map((s) => `${(s.xPct * 4.8).toFixed(1)},${(s.yPct * 2.7).toFixed(1)}`).join(" ")}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5,4"
            opacity="0.8"
          />
        )}
      </svg>

      {/* 우측 상단 줌 컨트롤 UI (첨부 이미지 2와 동일) */}
      <div className="absolute top-3 right-3 flex flex-col bg-white border border-neutral-300 rounded-md shadow-xs overflow-hidden z-10">
        <button type="button" className="w-6 h-6 flex items-center justify-center text-xs font-bold text-neutral-600 border-b border-neutral-200">
          +
        </button>
        <div className="w-6 h-8 flex items-center justify-center">
          <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
        </div>
        <button type="button" className="w-6 h-6 flex items-center justify-center text-xs font-bold text-neutral-600 border-t border-neutral-200">
          −
        </button>
      </div>

      {/* 우측 하단 축척 및 카카오 로고 (첨부 이미지 2와 동일) */}
      <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-[9px] text-neutral-500 font-bold bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-neutral-300/80 z-10">
        <div className="w-6 h-1 border-b border-l border-r border-neutral-600 inline-block mb-0.5" />
        <span>1km</span>
        <span className="font-black text-neutral-800">kakao</span>
      </div>

      {/* 각 스팟의 번호 캡슐 마커 (첨부 이미지 2와 100% 동일) */}
      {projectedSpots.map((spot) => {
        const spotName = isKo ? spot.nameKo : spot.nameEn;
        return (
          <div
            key={spot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/95 border border-neutral-400 px-2 py-0.5 rounded-full shadow-sm z-20 whitespace-nowrap"
            style={{
              left: `${spot.xPct}%`,
              top: `${spot.yPct}%`,
            }}
          >
            <span className="w-4 h-4 rounded-full bg-neutral-900 text-white font-black text-[9px] flex items-center justify-center shrink-0">
              {spot.routeOrder}
            </span>
            <span className="text-[10px] font-black text-neutral-900 truncate max-w-[110px]">
              {spotName}
            </span>
          </div>
        );
      })}
    </div>
  );
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
    sumFoodTotal,
    grandTotalKrw,
    adultCount,
    totalNights,
    travelDays,
    shoppingAmountKrw,
    totalDailyAllowanceKrw,
    computedEmergencyKrw,
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

  // 2. 예약 허브 데이터
  const { categorizedItems, freeSpots, totalCount } = useMemo(() => {
    return buildBookingHubData(
      calculations,
      draft,
      locale,
      usdRate
    );
  }, [calculations, draft, locale, usdRate]);

  // 3. 영수증용 교통 내역
  const { allTransitItems, entryItems, exitItems, transitItems } = useMemo(() => {
    const items = calculations.basePlan?.intercitySection?.lineItems || [];
    const entry = items.filter((i: any) => (i.route && i.route.startsWith("ENTRY_")) || (i.sourceLabel && i.sourceLabel.includes("[입국 공항]")));
    const exit = items.filter((i: any) => (i.route && i.route.startsWith("EXIT_")) || (i.sourceLabel && i.sourceLabel.includes("[출국 공항]")));
    const transit = items.filter((i: any) => !entry.includes(i) && !exit.includes(i));
    return { allTransitItems: items, entryItems: entry, exitItems: exit, transitItems: transit };
  }, [calculations.basePlan]);

  const formatSimplifiedTransit = (item: any) => {
    let raw = (locale === "ko" ? item.sourceLabel : (item.sourceLabelEn || item.sourceLabel)) || "";
    raw = raw.replace(/\[입국 공항\]|\[도시 간\]|\[출국 공항\]/g, "").trim();

    let modeName = "KTX";
    if (raw.includes("항공") || raw.toLowerCase().includes("flight")) modeName = isKo ? "국내선 항공" : "Flight";
    else if (raw.includes("버스") || raw.toLowerCase().includes("bus")) modeName = isKo ? "고속/시외버스" : "Express Bus";
    else if (raw.includes("공항철도") || raw.includes("AREX")) modeName = isKo ? "공항철도" : "Airport Express";
    else if (raw.includes("택시") || raw.toLowerCase().includes("taxi")) modeName = isKo ? "택시" : "Taxi";

    let routeName = "";
    if (item.route) {
      if (item.route.startsWith("ENTRY_")) {
        const parts = item.route.replace("ENTRY_", "").split("-");
        const airportName = isKo ? "인천공항" : "Incheon Airport";
        const targetCity = parts[1] || "";
        const targetCityName = (isKo ? CITY_KOREAN_NAMES[targetCity as SupportedCity] : CITY_ENGLISH_NAMES[targetCity as SupportedCity]) || targetCity;
        routeName = `${airportName} ➔ ${targetCityName}`;
      } else if (item.route.startsWith("EXIT_")) {
        const parts = item.route.replace("EXIT_", "").split("-");
        const sourceCity = parts[0] || "";
        const sourceCityName = (isKo ? CITY_KOREAN_NAMES[sourceCity as SupportedCity] : CITY_ENGLISH_NAMES[sourceCity as SupportedCity]) || sourceCity;
        const airportName = isKo ? "인천공항" : "Incheon Airport";
        routeName = `${sourceCityName} ➔ ${airportName}`;
      } else {
        const parts = item.route.split("-");
        if (parts.length === 2) {
          const fromName = (isKo ? CITY_KOREAN_NAMES[parts[0] as SupportedCity] : CITY_ENGLISH_NAMES[parts[0] as SupportedCity]) || parts[0];
          const toName = (isKo ? CITY_KOREAN_NAMES[parts[1] as SupportedCity] : CITY_ENGLISH_NAMES[parts[1] as SupportedCity]) || parts[1];
          routeName = `${fromName} ➔ ${toName}`;
        }
      }
    }

    if (!routeName) {
      routeName = raw.replace(/\([^)]*\)/g, "").trim();
    }

    return { modeName, routeName };
  };

  return (
    <div className={`report-pdf-root text-neutral-900 bg-white font-sans ${className}`}>
      {/* ========================================================================= */}
      {/* PAGE 1: 종합 예산 리포트 대시보드 (첨부 이미지 1과 100% 동일) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page pdf-portrait-page-first">
        <div className="w-full space-y-4">
          {/* 1. Header Card (첨부 이미지 1의 상단 헤더) */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="space-y-0.5">
                <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                  {dict.planner.reportTitle}
                </h1>
                <p className="text-xs text-neutral-500 font-medium">
                  {dict.planner.reportSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white font-bold text-xs">
                <span>← {dict.planner.reportBackToPlanner}</span>
              </div>
            </div>

            {/* 메타데이터 태그 스트립 */}
            <div className="pt-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600">
              <span className="bg-neutral-100 border border-neutral-200 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
                {totalNights}{isKo ? "박 " : "N "}{travelDays}{isKo ? "일" : "D"}
              </span>
              <span className="bg-neutral-100 border border-neutral-200 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
                {adultCount}{isKo ? "인 성인" : " Adults"}
              </span>
              <span className="text-neutral-300 font-bold text-xs">·</span>
              <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider shrink-0">ROUTE:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {stopsList.map((stop: any, idx: number, arr: any[]) => (
                  <React.Fragment key={stop.stopId || `${stop.city}-${idx}`}>
                    <span className="inline-flex items-center gap-1 bg-neutral-100 border border-neutral-200 text-neutral-800 px-3 py-1 rounded-full text-xs font-bold">
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

          {/* 2. Executive Total Budget & Pacing Summary Banner (첨부 이미지 1의 중단 2개 카드) */}
          <ReportBentoDashboard
            calculations={calculations}
            draft={draft}
            locale={locale}
            dict={dict}
            isStatic={true}
          />

          {/* 3. Expense Analytics Hub (첨부 이미지 1의 하단: 도시별 5대 부문 집계표 + 비중 막대 2개) */}
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
          Page 1
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2 ~ (1 + N): 도시별 스마트 투어 코스 (첨부 이미지 2와 100% 동일) */}
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
          linkedActivity?: any;
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

            // 연계 체험 추출
            let linkedAct = undefined;
            for (const sp of matchedSpots) {
              const act = getRelatedThemeActivity(sp.id, sp.nameKo);
              if (act) {
                linkedAct = act;
                break;
              }
            }

            spotGroups.push({
              id: course.id,
              courseTitleKo: course.nameKo,
              courseTitleEn: course.nameEn,
              linkedActivity: linkedAct,
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
          <div key={`pdf-course-${stop.stopId || `${city}-${stopIdx}`}`} className="pdf-portrait-page">
            <div className="space-y-4">
              {/* 1. 최상단 타이틀 섹션 (첨부 이미지 2와 동일) */}
              <div>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                  {isKo ? "스마트 투어 코스" : "Smart Tour Course"}
                </h2>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  {isKo ? "도시별 추천 여행 코스와 최적 이동 동선을 지도에서 한눈에 확인하세요." : "Explore curated travel courses and optimized routes on the map."}
                </p>
              </div>

              {/* 2. 상단 박스: 좌측 도시 탭/경로 스팟 + 우측 지도 (첨부 이미지 2와 100% 동일) */}
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-4 shadow-sm">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* 좌측 도시 탭 & 길찾기 버튼 */}
                  <div className="col-span-4 flex flex-col justify-between h-[270px] pr-2 border-r border-neutral-100">
                    <div className="space-y-2">
                      {stopsList.map((st: any) => {
                        const isCurrentCity = st.stopId === stop.stopId || (st.city === stop.city && st.stopIndex === stop.stopIndex);
                        return (
                          <div
                            key={st.stopId || st.city}
                            className={`flex items-center text-xs font-bold px-2 py-1.5 rounded-lg ${
                              isCurrentCity
                                ? "bg-neutral-100 text-neutral-900 font-black"
                                : "text-neutral-500"
                            }`}
                          >
                            {isCurrentCity && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 shrink-0" />
                            )}
                            <span className="truncate">{st.cityName}</span>
                            {st.isAdded && <span className="text-[#b93829] text-[9.5px] ml-1">(+)</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <div className="text-xs font-bold text-neutral-600">
                        {isKo ? "경로 스팟" : "Spots"}: <strong className="text-neutral-900 font-black">{displayedSpots.length}개소</strong>
                      </div>
                      <a
                        href={kakaoDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs transition-all shadow-xs text-center"
                      >
                        <span>{isKo ? "카카오웹 길찾기" : "KakaoMap Route"}</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    </div>
                  </div>

                  {/* 우측 정밀 카카오 스타일 지도 (관광지 마커 포함) */}
                  <div className="col-span-8">
                    <PdfKakaoCityMap
                      city={city}
                      cityName={stop.cityName}
                      spots={displayedSpots}
                      isKo={isKo}
                    />
                  </div>
                </div>
              </div>

              {/* 3. 코스 설명 가이드 텍스트 (첨부 이미지 2와 동일) */}
              <div className="text-xs font-semibold text-neutral-400">
                {isKo
                  ? "코스 타이틀을 클릭하면 코스 전체가, 카드를 클릭하면 해당 장소가 지도에서 강조됩니다."
                  : "Click a course title to view the full route, or select a spot card for details."}
              </div>

              {/* 4. 하단: 선택된 코스 및 관광지 목록 (2열 카드 그리드 - 첨부 이미지 2와 동일) */}
              <div className="space-y-4">
                {spotGroups.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    {/* 코스 타이틀 헤더 */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-neutral-900">
                        {isKo ? group.courseTitleKo : group.courseTitleEn}
                      </span>
                      {group.linkedActivity && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                          <span>🍵</span>
                          <span>
                            {isKo ? `연계 체험: ${group.linkedActivity.titleKo} 포함` : `Includes: ${group.linkedActivity.titleEn}`}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* 2열 관광지 카드 그리드 */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {group.spots.map((spot) => {
                        const spotName = isKo ? spot.nameKo : spot.nameEn;
                        const transitDesc = spot.subwayInfo || (spot.descKo ? spot.descKo.slice(0, 42) : "");
                        return (
                          <div
                            key={spot.id}
                            className="print-avoid-break p-3 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 font-black text-[10px] flex items-center justify-center shrink-0">
                                  {spot.routeOrder}
                                </span>
                                <h4 className="font-black text-xs text-neutral-900 truncate">
                                  {spotName}
                                </h4>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[9.5px] font-bold shrink-0">
                                {spot.categoryType || "명소"}
                              </span>
                            </div>

                            {transitDesc && (
                              <p className="text-[10px] text-neutral-500 line-clamp-1 leading-tight">
                                🚇 {transitDesc}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs">
                              {spot.officialUrl ? (
                                <a
                                  href={spot.officialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-[10px] font-bold text-neutral-700 inline-flex items-center gap-0.5"
                                >
                                  <span>{isKo ? "상세보기" : "Detail"}</span>
                                  <span>↗</span>
                                </a>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-500">
                                  {isKo ? "상세보기" : "Detail"}
                                </span>
                              )}

                              <strong className="font-black text-neutral-900 tabular-nums">
                                {spot.price === 0 ? (isKo ? "무료 입장" : "Free") : `₩ ${spot.price.toLocaleString()}`}
                              </strong>
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
            <div className="text-right text-[10px] text-neutral-400 font-semibold pt-4">
              Page {stopIdx + 2}
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* PAGE: 스마트 여행 예약 (Booking Action Hub) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page">
        <div className="space-y-4">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#b93829] text-white text-[9.5px] font-black uppercase tracking-wider">
                  BOOKING ACTION HUB
                </span>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                  {isKo ? "스마트 여행 예약" : "Smart Booking Action Hub"}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                {isKo
                  ? "내 여행 일정에 맞춘 공식 예매 및 추천 예약 링크입니다. (PDF 내 링크를 클릭하면 공식 예매처로 연결됩니다)"
                  : "Official and verified booking links mapped directly to your itinerary."}
              </p>
            </div>
            <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
              {isKo ? `총 ${totalCount}개 예약 연동` : `${totalCount} Bookings`}
            </span>
          </div>

          {/* 4대 부문 2단 다단 그리드 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 좌측단: 1. 교통편 예매 + 2. 도시별 숙소 */}
            <div className="space-y-4">
              {/* 교통편 예매 */}
              <div className="print-avoid-break space-y-1.5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                  <span className="text-xs font-black text-neutral-900">
                    {isKo ? "교통편 예매" : "Transit & Flights"}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {categorizedItems.TRANSIT.length}건
                  </span>
                </div>
                <div className="space-y-1.5">
                  {categorizedItems.TRANSIT.map((item) => (
                    <div key={item.id} className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-xs text-neutral-900 truncate">
                          {isKo ? item.titleKo : item.titleEn}
                        </h4>
                        <p className="text-[9.5px] text-neutral-400 truncate">
                          {isKo ? item.subtitleKo : item.subtitleEn}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] font-extrabold text-[#b93829] hover:underline"
                        >
                          {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 도시별 숙소 */}
              <div className="print-avoid-break space-y-1.5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                  <span className="text-xs font-black text-neutral-900">
                    {isKo ? "도시별 숙소" : "Accommodations"}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {categorizedItems.STAY.length}건
                  </span>
                </div>
                <div className="space-y-1.5">
                  {categorizedItems.STAY.map((item) => (
                    <div key={item.id} className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-xs text-neutral-900 truncate">
                          {isKo ? item.titleKo : item.titleEn}
                        </h4>
                        <p className="text-[9.5px] text-neutral-400 truncate">
                          {isKo ? item.subtitleKo : item.subtitleEn}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] font-extrabold text-[#b93829] hover:underline"
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
            <div className="space-y-4">
              {/* 명소 & 티켓 */}
              <div className="print-avoid-break space-y-1.5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                  <span className="text-xs font-black text-neutral-900">
                    {isKo ? "명소 & 티켓 바우처" : "Attractions & Tickets"}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {categorizedItems.ATTRACTION.length}건
                  </span>
                </div>
                <div className="space-y-1.5">
                  {categorizedItems.ATTRACTION.map((item) => (
                    <div key={item.id} className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-xs text-neutral-900 truncate">
                          {isKo ? item.titleKo : item.titleEn}
                        </h4>
                        <p className="text-[9.5px] text-neutral-400 truncate">
                          {isKo ? item.subtitleKo : item.subtitleEn}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] font-extrabold text-[#b93829] hover:underline"
                        >
                          {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 필수 준비물 */}
              <div className="print-avoid-break space-y-1.5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                  <span className="text-xs font-black text-neutral-900">
                    {isKo ? "여행 필수 준비물" : "Travel Essentials"}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {categorizedItems.ESSENTIAL.length}건
                  </span>
                </div>
                <div className="space-y-1.5">
                  {categorizedItems.ESSENTIAL.map((item) => (
                    <div key={item.id} className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-xs text-neutral-900 truncate">
                          {isKo ? item.titleKo : item.titleEn}
                        </h4>
                        <p className="text-[9.5px] text-neutral-400 truncate">
                          {isKo ? item.subtitleKo : item.subtitleEn}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-neutral-800 block tabular-nums">{item.priceText}</span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] font-extrabold text-[#b93829] hover:underline"
                        >
                          {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 무료 명소 리스트 */}
              {freeSpots.length > 0 && (
                <div className="print-avoid-break space-y-1.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center justify-between border-b border-neutral-200/80 pb-1">
                    <span className="text-xs font-black text-neutral-800">
                      {isKo ? "사전 예약 없이 바로 가는 무료 명소" : "Free Attractions (No Booking)"}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400">{freeSpots.length}곳</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {freeSpots.map((spot) => (
                      <a
                        key={spot.id}
                        href={spot.targetUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-[9.5px] text-neutral-700 hover:text-blue-600 font-medium truncate"
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
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-4">
          Page {stopsList.length + 2}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE: 도시별 담은 대표 음식 리스트 (K-FOOD SELECTION) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page">
        <div className="space-y-4">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#b93829] text-white text-[9.5px] font-black uppercase tracking-wider">
                  K-FOOD SELECTION
                </span>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                  {isKo ? "도시별 담은 대표 음식 리스트" : "Selected Food Guide by City"}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                {isKo
                  ? "플래너에서 직접 선택한 도시별 한국 대표 미식 목록입니다."
                  : "Curated regional Korean gourmet experiences selected in your travel planner."}
              </p>
            </div>
            <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
              {isKo ? `식비 합계: ₩ ${sumFoodTotal.toLocaleString()}` : `Total Food: ₩ ${sumFoodTotal.toLocaleString()}`}
            </span>
          </div>

          {/* 도시별 구획 분리 음식 리스트 (2열 가로형 카드 그리드) */}
          <div className="space-y-4">
            {stopsList.map((stop: any, sIdx: number) => {
              const foodItems = (stop as any).foodBasketPlan?.selectedItems
                || (cityBreakdown[stop.city] as any)?.foodBasketPlan?.selectedItems
                || [];

              if (foodItems.length === 0) return null;

              return (
                <div key={`pdf-food-${stop.stopId || `${stop.city}-${sIdx}`}`} className="print-avoid-break space-y-2">
                  <div className="flex items-center gap-2 border-b border-neutral-200 pb-1">
                    <span className="text-sm font-black text-neutral-900">
                      {stop.cityName}
                      {stop.isAdded && <span className="text-[#b93829] ml-1">(+)</span>}
                    </span>
                    <span className="text-xs font-bold text-neutral-400">
                      ({foodItems.length}{isKo ? "종" : " items"})
                    </span>
                    <span className="text-xs font-black text-rose-700 ml-auto tabular-nums">
                      ₩ {(stop.foodTotalKrw || (cityBreakdown[stop.city]?.foodTotalKrw) || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
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
                          className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3 shadow-2xs"
                        >
                          {/* 음식 사진 */}
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

                          {/* 메뉴명 및 가격 (카테고리 태그 제외 지시 준수) */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="font-black text-xs text-neutral-900 block truncate leading-tight">
                              {fName}
                            </span>
                            <span className="text-[10px] text-neutral-500 block tabular-nums leading-tight">
                              1인 ₩ {unitPrice.toLocaleString()} {adultCount > 1 ? `× ${adultCount}인` : ""}
                            </span>
                            <span className="text-xs font-black text-rose-700 block tabular-nums leading-tight">
                              총 ₩ {itemSubtotal.toLocaleString()}
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
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-4">
          Page {stopsList.length + 3}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE: 내 한국 여행 영수증 (2단 다단, 모든 내역 생략 없이 100% 온전히 수록) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page">
        <div className="space-y-4">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[9.5px] font-black uppercase tracking-wider">
                  ITEMIZED RECEIPT
                </span>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                  {isKo ? "내 한국 여행 영수증" : "Itemized Travel Receipt"}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                {isKo
                  ? "도시별 이동 교통과 머무는 일정에 맞춘 전 일정 실비 영수증입니다. (모든 내역 100% 완전 수록)"
                  : "Complete itemized breakdown for all legs, stays, dining, and activities."}
              </p>
            </div>
            <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
              {totalNights}{isKo ? "박" : "N"} · {adultCount}{isKo ? "인" : " Travelers"}
            </span>
          </div>

          {/* 2단 다단(2-column) 영수증 본문 - 임의의 생략 없이 모든 내역 100% 출력 */}
          <div className="print-receipt-2col text-xs text-neutral-800 space-y-2">
            {/* 1. 입국 공항 이동 */}
            {entryItems.length > 0 && (
              <div className="print-avoid-break p-2 mb-2 rounded-xl bg-neutral-100/80 border border-neutral-200">
                <div className="flex justify-between items-center text-xs font-bold text-neutral-800">
                  <span>{entryItems.map((i: any) => formatSimplifiedTransit(i).routeName).join(", ")}</span>
                  <span className="font-black tabular-nums">
                    ₩ {entryItems.reduce((sum: number, item: any) => sum + (item.lineTotalKrw || item.totalKrw || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* 2. 도시별 영수증 블록들 */}
            {stopsList.map((sInfo: any, idx: number) => {
              const nextStop = stopsList[idx + 1];
              const transitToNext = nextStop
                ? transitItems.find(
                    (item: any) =>
                      item.route &&
                      ((item.route.includes(sInfo.city) && item.route.includes(nextStop.city)) ||
                        (item.sourceLabel && item.sourceLabel.includes(sInfo.cityName) && item.sourceLabel.includes(nextStop.cityName)))
                  )
                : null;

              const cInfo = cityBreakdown[sInfo.city];
              const spots = (sInfo.selectedSpots !== undefined ? sInfo.selectedSpots : cInfo?.selectedSpots || []).filter(
                (s: any) => !s.id.startsWith("act_") && !THEME_ACTIVITIES_CATALOG.some((a) => isSameSpot(a.id, s.id))
              );

              // 전체 음식 내역 (생략 없이 100% 노출)
              const foodItems = (sInfo as any).foodBasketPlan?.selectedItems
                || ((cityBreakdown[sInfo.city] as any)?.foodBasketPlan?.selectedItems || []);
              const foodKrw = sInfo.foodTotalKrw || (cityBreakdown[sInfo.city]?.foodTotalKrw || 0);

              const stayTotal = sInfo.stayTotalKrw ?? (cInfo?.stayTotalKrw || 0);

              return (
                <React.Fragment key={`receipt-stop-${sInfo.stopId || `${sInfo.city}-${idx}`}`}>
                  <div className="print-avoid-break p-2.5 mb-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                    {/* 도시 헤더 */}
                    <div className="flex justify-between items-center pb-1 border-b border-neutral-200">
                      <span className="font-black text-xs text-neutral-900">
                        • {sInfo.cityName}
                        {sInfo.isAdded && <span className="text-[#b93829] ml-1">(+)</span>}
                        <span className="text-[10px] text-neutral-400 font-medium ml-1">
                          ({sInfo.nights > 0 ? `${sInfo.nights}박` : "0박"})
                        </span>
                      </span>
                      <span className="font-black text-xs text-neutral-900 tabular-nums">
                        ₩ {(sInfo.subtotalKrw || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* 숙소 */}
                    {stayTotal > 0 && (
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-neutral-600 truncate pr-1">
                          <span className="font-bold text-teal-700 mr-1">[숙소]</span>
                          {sInfo.stayItemLabel || "도심 호텔"}
                        </span>
                        <span className="font-bold tabular-nums shrink-0">₩ {stayTotal.toLocaleString()}</span>
                      </div>
                    )}

                    {/* 식비 - 생략 없이 모든 메뉴 100% 표시 */}
                    {foodKrw > 0 && (
                      <div className="space-y-1 pt-1 border-t border-neutral-100">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="text-neutral-700 truncate pr-1">
                            <span className="font-bold text-rose-700 mr-1">[식비]</span>
                            {foodItems.length > 0 ? `선택 미식 (${foodItems.length}종)` : "식비 합계"}
                          </span>
                          <span className="font-bold tabular-nums shrink-0">₩ {foodKrw.toLocaleString()}</span>
                        </div>
                        {foodItems.length > 0 && (
                          <div className="pl-2 space-y-0.5 text-[9.5px] text-neutral-600">
                            {foodItems.map((fi: any) => (
                              <div key={fi.food?.id || fi.food?.nameKo} className="flex justify-between">
                                <span className="truncate pr-1">• {isKo ? fi.food?.nameKo : fi.food?.nameEn}</span>
                                <span className="tabular-nums shrink-0">₩ {(fi.subtotalKrw || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
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

                    {/* 관광 - 생략 없이 모든 명소 100% 표시 */}
                    {spots.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-neutral-100">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-bold text-amber-700">[관광] 명소 ({spots.length}곳)</span>
                          <span className="font-bold tabular-nums">₩ {(sInfo.attractionTotalKrw || 0).toLocaleString()}</span>
                        </div>
                        <div className="pl-2 space-y-0.5 text-[9.5px] text-neutral-600">
                          {spots.map((sp: any) => (
                            <div key={sp.id} className="flex justify-between">
                              <span className="truncate pr-1">• {isKo ? sp.nameKo : sp.nameEn}</span>
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
                    <div className="print-avoid-break p-1.5 mb-2.5 rounded-xl bg-neutral-100/80 border border-neutral-200 flex justify-between items-center text-[10px] font-bold text-neutral-700">
                      <span>{formatSimplifiedTransit(transitToNext).routeName} ({formatSimplifiedTransit(transitToNext).modeName})</span>
                      <span className="font-black tabular-nums">₩ {(transitToNext.lineTotalKrw || 0).toLocaleString()}</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* 3. 출국 공항 이동 */}
            {exitItems.length > 0 && (
              <div className="print-avoid-break p-2 mb-2 rounded-xl bg-neutral-100/80 border border-neutral-200">
                <div className="flex justify-between items-center text-xs font-bold text-neutral-800">
                  <span>{exitItems.map((i: any) => formatSimplifiedTransit(i).routeName).join(", ")}</span>
                  <span className="font-black tabular-nums">
                    ₩ {exitItems.reduce((sum: number, item: any) => sum + (item.lineTotalKrw || item.totalKrw || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 하단 전폭 최종 합계 요약 바 */}
          <div className="print-column-span-all pt-2 border-t-2 border-neutral-900 bg-neutral-50 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
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
              <span className="text-lg font-black text-neutral-900 tabular-nums">
                ₩ {grandTotalKrw.toLocaleString()}
              </span>
              {adultCount > 1 && (
                <span className="text-[10px] text-neutral-500 font-bold block">
                  1인당 ₩ {Math.round(grandTotalKrw / adultCount).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-4">
          Page {stopsList.length + 4}
        </div>
      </div>
    </div>
  );
}