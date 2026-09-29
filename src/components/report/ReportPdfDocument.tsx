"use client";

import React, { useMemo, useEffect, useRef } from "react";
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
  ATTRACTION_SPOTS_CATALOG,
  normalizeSpotKey,
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
 * 웹 예산 리포트의 스마트 투어 코스 지도와 100% 동일한 카카오 지도 뷰어
 * 카카오 지도 SDK 인스턴스, 정품 줌 슬라이더, 화이트 알약 핀 마커, 핑크 점선 경로 완벽 일치
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (typeof window === "undefined" || !el) return;

    const renderMap = () => {
      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps) return;

      kakao.maps.load(() => {
        if (!mapContainerRef.current) return;

        try {
          const centerCoord =
            spots.length > 0
              ? new kakao.maps.LatLng(spots[0].lat, spots[0].lng)
              : new kakao.maps.LatLng(37.5665, 126.978);

          const options = {
            center: centerCoord,
            level: 6,
          };

          mapContainerRef.current.innerHTML = "";
          const map = new kakao.maps.Map(mapContainerRef.current, options);
          mapInstanceRef.current = map;

          // 1. 웹 화면과 100% 동일한 우측 카카오 정품 줌 슬라이더
          const zoomControl = new kakao.maps.ZoomControl();
          map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

          if (spots.length === 0) return;

          const bounds = new kakao.maps.LatLngBounds();
          const pathCoords: any[] = [];

          // 2. 웹 화면과 100% 동일한 화이트 알약 핀 마커 커스텀 오버레이
          spots.forEach((spot) => {
            const pos = new kakao.maps.LatLng(spot.lat, spot.lng);
            bounds.extend(pos);
            pathCoords.push(pos);

            const spotName = isKo ? spot.nameKo : spot.nameEn;

            const content = document.createElement("div");
            content.className = "cursor-default transform -translate-x-1/2 -translate-y-full";
            content.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="display: flex; align-items: center; gap: 4px; background-color: #ffffff; color: #1e293b; padding: 2.5px 7px; border-radius: 9999px; font-weight: 700; font-size: 11px; box-shadow: 0 2px 6px rgba(0,0,0,0.14); border: 1.5px solid #cbd5e1; white-space: nowrap;">
                  <span style="background: #f1f5f9; color: #475569; width: 15px; height: 15px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800;">${spot.routeOrder}</span>
                  <span style="font-weight: 600;">${spotName}</span>
                </div>
                <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #cbd5e1;"></div>
              </div>
            `;

            const overlay = new kakao.maps.CustomOverlay({
              position: pos,
              content,
              yAnchor: 1,
              zIndex: 10 + (spot.routeOrder || 1),
            });
            overlay.setMap(map);
          });

          // 3. 웹 화면과 100% 동일한 스팟 간 핑크/레드 점선 이동 경로
          if (pathCoords.length > 1) {
            const polyline = new kakao.maps.Polyline({
              path: pathCoords,
              strokeWeight: 3.5,
              strokeColor: "#f43f5e",
              strokeOpacity: 0.85,
              strokeStyle: "shortdash",
            });
            polyline.setMap(map);
          }

          // 4. 지도 바운딩 박스 포커스
          if (spots.length === 1) {
            map.setCenter(new kakao.maps.LatLng(spots[0].lat, spots[0].lng));
            map.setLevel(5);
          } else {
            map.setBounds(bounds);
          }
        } catch (err) {
          console.error("PDF Kakao Map init error:", err);
        }
      });
    };

    if ((window as any).kakao && (window as any).kakao.maps) {
      renderMap();
    } else {
      const timer = setInterval(() => {
        if ((window as any).kakao && (window as any).kakao.maps) {
          clearInterval(timer);
          renderMap();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [spots, city, isKo]);

  return (
    <div className="relative w-full h-[330px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-inner select-none">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

export default function ReportPdfDocument({
  calculations,
  draft,
  locale,
  dict,
  usdRate = 1356,
  dbAttractionsByCity = {},
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
      {/* PAGE 1: 종합 예산 리포트 대시보드 (첨부 이미지 1과 100% 동일, 캡슐 바 완결) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page pdf-portrait-page-first">
        <div className="w-full space-y-3.5 scale-[0.96] origin-top">
          {/* 1. Header Card (첨부 이미지 1의 상단 헤더) */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 px-6 py-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
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
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600">
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

          {/* 3. Expense Analytics Hub (첨부 이미지 1의 하단: 도시별 5대 부문 집계표 + 컴팩트 캡슐 비중 바) */}
          <ExpenseAnalyticsHub
            calculations={calculations}
            draft={draft}
            locale={locale}
            dict={dict}
            usdRate={usdRate}
            isCompact={true}
          />
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[10px] text-neutral-400 font-semibold pt-1">
          Page 1
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2 ~ (1 + N): 도시별 스마트 투어 코스 (각 정차지별 100% 독립 분리 렌더링) */}
      {/* ========================================================================= */}
      {stopsList.map((stop: any, stopIdx: number) => {
        const city = stop.city as SupportedCity;
        const cInfo = cityBreakdown[city];
        const isPriorVisit = stopsList.slice(0, stopIdx).some((s: any) => s.city === stop.city);
        const isAddedStop = Boolean(stop.isAdded || isPriorVisit);
        const currentStopLabel = isAddedStop
          ? `${stop.cityName || (isKo ? CITY_KOREAN_NAMES[city] : CITY_ENGLISH_NAMES[city])} (+)`
          : stop.cityName || (isKo ? CITY_KOREAN_NAMES[city] : CITY_ENGLISH_NAMES[city]);

        // 1. 관광지 목록 추출: 추가 도시(isAddedStop)는 1차 도시의 스팟으로 덮어쓰지 않고 정차지 전용 스팟만 독립 반영
        let citySpotsSource: AttractionSpot[] = [];

        if (stop.selectedSpots !== undefined) {
          // 정차지 전용 selectedSpots가 있으면 (빈 배열 포함) 이를 100% 최우선 반영
          citySpotsSource = stop.selectedSpots || [];
        } else if (!isAddedStop) {
          // 첫 번째 방문 정차지인 경우에만 도시 통합 breakdown 또는 프리셋 코스에서 가져옴
          citySpotsSource =
            cInfo?.selectedSpots && cInfo.selectedSpots.length > 0
              ? cInfo.selectedSpots
              : calculations.cityBreakdown?.[city]?.selectedSpots &&
                calculations.cityBreakdown[city].selectedSpots.length > 0
              ? calculations.cityBreakdown[city].selectedSpots
              : [];

          if (citySpotsSource.length === 0) {
            const cityPresets = TOUR_COURSE_PRESETS.filter(
              (c) => (c.cityCode || "").toLowerCase() === (city || "").toLowerCase() && c.isActive !== false
            );
            const presetSpotIds = new Set<string>();
            cityPresets.forEach((c) =>
              (c.spotIds || []).forEach((sid) => presetSpotIds.add(normalizeSpotKey(sid)))
            );

            citySpotsSource = Array.from(presetSpotIds)
              .map((sid) => {
                return (
                  ATTRACTION_SPOTS_CATALOG.find((s: AttractionSpot) => isSameSpot(s.id, sid)) ||
                  (dbAttractionsByCity[city] || []).find((s: AttractionSpot) => isSameSpot(s.id, sid))
                );
              })
              .filter((s): s is AttractionSpot => Boolean(s));
          }
        } else {
          // 추가 방문 도시(예: 서울(+))인데 전용 스팟이 지정되지 않은 경우: 1차 방문과 중복되지 않도록 빈 배열(독립 일정)로 유지
          citySpotsSource = [];
        }

        const rawSpots = citySpotsSource.filter(
          (s: any) => !s.id.startsWith("act_") && !THEME_ACTIVITIES_CATALOG.some((a) => isSameSpot(a.id, s.id))
        );

        // 2. 스팟 좌표 및 최적 이동 동선 계산
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

        // 3. 코스별 그룹화 (TOUR_COURSE_PRESETS 매칭 및 잔여 개별 스팟 수록)
        const cityCourses = TOUR_COURSE_PRESETS.filter(
          (c) => (c.cityCode || "").toLowerCase() === (city || "").toLowerCase() && c.isActive !== false
        );

        const spotGroups: Array<{
          id: string;
          courseTitleKo: string;
          courseTitleEn: string;
          courseDescKo?: string;
          estimatedHours?: number;
          linkedActivity?: any;
          spots: RouteSpotItem[];
        }> = [];

        const remainingSpots = [...displayedSpots];
        cityCourses.forEach((course) => {
          if (!course.spotIds || course.spotIds.length === 0) return;
          const hasMatchedSpots = course.spotIds.some((csId: string) =>
            remainingSpots.some((s) => isSameSpot(s.id, csId))
          );
          if (hasMatchedSpots) {
            const matchedSpots: RouteSpotItem[] = [];
            course.spotIds.forEach((csId: string) => {
              const foundIdx = remainingSpots.findIndex((s) => isSameSpot(s.id, csId));
              if (foundIdx !== -1) {
                matchedSpots.push(remainingSpots[foundIdx]);
                remainingSpots.splice(foundIdx, 1);
              }
            });
            matchedSpots.sort((a, b) => a.routeOrder - b.routeOrder);

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
              courseDescKo: course.descKo,
              estimatedHours: course.estimatedHours,
              linkedActivity: linkedAct,
              spots: matchedSpots,
            });
          }
        });

        if (remainingSpots.length > 0) {
          remainingSpots.sort((a, b) => a.routeOrder - b.routeOrder);
          spotGroups.push({
            id: `custom-group-${stopIdx}`,
            courseTitleKo: isKo ? "추천 관광지 & 명소" : "Recommended Spots",
            courseTitleEn: "Recommended Spots",
            spots: remainingSpots,
          });
        }

        const kakaoDirectUrl = displayedSpots[0]
          ? getKakaoMapDirectLink(displayedSpots[0].nameKo, displayedSpots[0].lat, displayedSpots[0].lng)
          : "https://map.kakao.com";

        return (
          <div key={`pdf-course-${stop.stopId || `${city}-${stopIdx}`}`} className="pdf-portrait-page">
            <div className="w-full space-y-2 scale-[0.94] origin-top">
              {/* 1. 최상단 타이틀 섹션 (웹 화면과 동일한 타이틀 & 정차지 독립 명칭 표기) */}
              <div className="border-b border-neutral-200/80 pb-1.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#b93829] shrink-0" />
                    <h2 className="text-base font-black text-neutral-900 tracking-tight">
                      {isKo ? "스마트 투어 코스" : "Smart Tour Course"}
                    </h2>
                    <span className="text-[10px] font-black text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/70">
                      {currentStopLabel} {stop.nights > 0 ? `(${stop.nights}${isKo ? "박" : "N"})` : `(${isKo ? "당일" : "Day"})`}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-neutral-500 font-medium leading-none">
                    {isKo
                      ? "도시별 추천 여행 코스와 최적 이동 동선을 지도에서 한눈에 확인하세요."
                      : "Explore curated travel courses and optimized routes on the map."}
                  </p>
                </div>
              </div>

              {/* 2. 상단 박스: 좌측 도시 탭 + 우측 카카오 지도 (웹 화면과 100% 동일한 구조) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-xs">
                <div className="flex flex-row items-stretch gap-2.5 w-full">
                  {/* 좌측 도시 탭 & 경로 스팟 + 길찾기 버튼 */}
                  <div className="flex flex-col justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 w-36 shrink-0">
                    {/* 도시 탭 리스트 (인덱스 기반으로 현재 정차지 100% 정확하게 활성화) */}
                    <div className="flex flex-col gap-1.5 w-full">
                      {stopsList.map((st: any, sIdx: number) => {
                        const isPrior = stopsList.slice(0, sIdx).some((s: any) => s.city === st.city);
                        const isAdded = Boolean(st.isAdded || isPrior);
                        const tabBaseName = st.cityName || (isKo ? CITY_KOREAN_NAMES[st.city as SupportedCity] : CITY_ENGLISH_NAMES[st.city as SupportedCity]);
                        const isCurrentStop = sIdx === stopIdx;

                        return (
                          <div
                            key={`${st.stopId || st.city}-${sIdx}`}
                            className={`w-full py-2 px-2.5 rounded-xl text-xs font-black text-left flex items-center justify-between gap-1.5 ${
                              isCurrentStop
                                ? "bg-white text-slate-900 border border-slate-200/90 shadow-2xs ring-1 ring-slate-900/5"
                                : "text-slate-500 font-bold"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              {isCurrentStop && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#b93829] shrink-0" />
                              )}
                              <span className="truncate">{tabBaseName}</span>
                              {isAdded && <span className="text-[#b93829] text-[9.5px] ml-0.5">(+)</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 지도 왼편 하단: 경로 스팟 n개소 + 카카오맵 길찾기 버튼 (2줄) */}
                    <div className="pt-2 mt-auto border-t border-neutral-200/80 flex flex-col gap-1.5 w-full">
                      <div className="text-[11px] font-bold text-neutral-600">
                        <span>{isKo ? "경로 스팟" : "Spots"}: </span>
                        <strong className="text-neutral-900 font-black">{displayedSpots.length}개소</strong>
                      </div>

                      {displayedSpots.length > 0 && (
                        <a
                          href={kakaoDirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-[11px] transition-all shadow-2xs cursor-pointer text-center no-underline"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.708 4.8 4.27 6.054l-.865 3.186c-.078.287.213.522.46.368l3.77-2.35c.446.04.9.057 1.365.057 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                          </svg>
                          <span className="truncate">{isKo ? "카카오맵 길찾기" : "Kakao Route"}</span>
                          <span className="text-[10px] shrink-0">↗</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 우측 컴팩트 카카오맵 뷰포트 */}
                  <div className="flex-1 min-w-0">
                    <PdfKakaoCityMap
                      city={city}
                      cityName={currentStopLabel}
                      spots={displayedSpots}
                      isKo={isKo}
                    />
                  </div>
                </div>
              </div>

              {/* 3. 코스 설명 가이드 텍스트 및 순번별 방문 타임라인 헤더 */}
              <div className="flex items-center justify-between text-[10px] px-0.5">
                <span className="font-extrabold text-neutral-800 flex items-center gap-1">
                  <span>🚩</span>
                  <span>{isKo ? "순번별 방문 타임라인 & 길찾기" : "Optimized Timeline & Route"}</span>
                </span>
                <span className="text-neutral-400 font-medium text-[9px]">
                  {displayedSpots.length > 0
                    ? isKo
                      ? "카카오맵 길찾기 링크를 누르면 지도 상세 경로로 연결됩니다."
                      : "Click Route to view Kakao Map directions."
                    : isKo
                    ? "선택된 별도 관광지가 없는 자유 일정 정차지입니다."
                    : "Free schedule with no scheduled attractions."}
                </span>
              </div>

              {/* 4. 하단: 3열 관광지 카드 그리드 (스팟이 없을 경우 독립적인 자유 일정 안내 박스 노출) */}
              {displayedSpots.length > 0 ? (
                <div className="space-y-2">
                {spotGroups.map((group) => {
                  const actName = group.linkedActivity
                    ? (isKo
                        ? group.linkedActivity.nameKo || group.linkedActivity.titleKo || group.linkedActivity.nameEn
                        : group.linkedActivity.nameEn || group.linkedActivity.titleEn || group.linkedActivity.nameKo)
                    : "";

                  return (
                    <div key={group.id} className="space-y-1.5">
                      {/* 코스 타이틀 헤더 바 */}
                      <div className="flex flex-wrap items-center justify-between gap-1 px-2.5 py-1 rounded-lg bg-neutral-100/90 border border-neutral-200/80">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black text-neutral-900">
                            {isKo ? group.courseTitleKo : group.courseTitleEn}
                          </span>
                          <span className="text-[9px] font-bold text-neutral-600 bg-white px-1.5 py-0.2 rounded border border-neutral-200">
                            {group.spots.length}개소
                          </span>
                          {group.estimatedHours && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              ⏱ {isKo ? `약 ${group.estimatedHours}시간` : `~${group.estimatedHours}h`}
                            </span>
                          )}
                        </div>
                        {group.linkedActivity && actName && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                            <span>🍵</span>
                            <span>
                              {isKo ? `연계 체험: ${actName}` : `Activity: ${actName}`}
                            </span>
                          </span>
                        )}
                      </div>

                    {/* 3열 관광지 카드 그리드 */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {group.spots.map((spot) => {
                        const spotName = isKo ? spot.nameKo : spot.nameEn;
                        const transitDesc =
                          spot.subwayInfo || (spot.descKo ? spot.descKo.slice(0, 36) : "");
                        const directLink = getKakaoMapDirectLink(spot.nameKo, spot.lat, spot.lng);

                        return (
                          <div
                            key={spot.id}
                            className="p-2 rounded-xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between space-y-1 text-left"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#f43f5e] text-white font-black text-[8px] flex items-center justify-center shrink-0 shadow-2xs">
                                    {spot.routeOrder}
                                  </span>
                                  <h4 className="font-black text-[10px] text-neutral-900 truncate" title={spotName}>
                                    {spotName}
                                  </h4>
                                </div>
                                <span className="px-1 py-0.2 rounded bg-neutral-100 text-neutral-600 text-[8px] font-bold shrink-0">
                                  {spot.categoryType || (isKo ? "명소" : "Spot")}
                                </span>
                              </div>

                              {transitDesc && (
                                <p className="text-[8.5px] text-neutral-500 line-clamp-1 leading-tight">
                                  🚇 {transitDesc}
                                </p>
                              )}
                            </div>

                            {/* 하단 요금 및 카카오맵 길찾기 링크 */}
                            <div className="pt-1 border-t border-neutral-100 flex items-center justify-between text-[9px]">
                              <span className="font-black tabular-nums text-neutral-900">
                                {spot.price === 0
                                  ? isKo
                                    ? "무료 입장"
                                    : "Free"
                                  : `₩ ${spot.price.toLocaleString()}`}
                              </span>
                              <a
                                href={directLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#2563eb] hover:text-[#1d4ed8] font-black text-[8.5px] inline-flex items-center gap-0.5 cursor-pointer no-underline"
                              >
                                <span>{isKo ? "카카오맵 길찾기" : "Route"}</span>
                                <span>↗</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-center space-y-1.5 my-3">
              <p className="text-xs font-bold text-slate-700">
                {isKo
                  ? `${currentStopLabel}에 등록된 별도 여행 동선 스팟이 없습니다.`
                  : `No attractions selected for ${currentStopLabel} yet.`}
              </p>
              <p className="text-[11px] text-slate-400">
                {isKo
                  ? "추가 일정은 자유 탐방, 환승 이동 및 휴식 일정으로 진행됩니다."
                  : "This additional stop is designated for free exploration or transit."}
              </p>
            </div>
          )}
        </div>

            {/* 하단 푸터 */}
            <div className="text-right text-[9.5px] text-neutral-400 font-semibold pt-1">
              Page {stopIdx + 2}
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* PAGE: 스마트 여행 예약 (Booking Action Hub - 하이퍼링크 100% 작동 보장) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page">
        <div className="w-full space-y-3.5 scale-[0.95] origin-top">
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

          {/* 4대 부문 2단 다단 그리드 (overflow-hidden 제거하여 PDF 링크 주석 완벽 보존) */}
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
                    <a
                      key={item.id}
                      href={item.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between transition-colors block text-inherit no-underline cursor-pointer"
                    >
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
                        <span className="text-[9.5px] font-extrabold text-[#b93829] hover:underline inline-flex items-center gap-0.5">
                          {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                        </span>
                      </div>
                    </a>
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
                    <a
                      key={item.id}
                      href={item.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between transition-colors block text-inherit no-underline cursor-pointer"
                    >
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
                        <span className="text-[9.5px] font-extrabold text-[#b93829] hover:underline inline-flex items-center gap-0.5">
                          {isKo ? "아고다 예약" : "Agoda"} ↗
                        </span>
                      </div>
                    </a>
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
                    <a
                      key={item.id}
                      href={item.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between transition-colors block text-inherit no-underline cursor-pointer"
                    >
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
                        <span className="text-[9.5px] font-extrabold text-[#b93829] hover:underline inline-flex items-center gap-0.5">
                          {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                        </span>
                      </div>
                    </a>
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
                    <a
                      key={item.id}
                      href={item.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between transition-colors block text-inherit no-underline cursor-pointer"
                    >
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
                        <span className="text-[9.5px] font-extrabold text-[#b93829] hover:underline inline-flex items-center gap-0.5">
                          {isKo ? item.actionLabelKo : item.actionLabelEn} ↗
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[9.5px] text-neutral-400 font-semibold pt-1">
          Page {stopsList.length + 2}
        </div>
      </div>

        {/* ========================================================================= */}
        {/* PAGE: 사전 예약 없이 바로 가는 무료 명소 (Free Attractions) */}
        {/* ========================================================================= */}
        {freeSpots.length > 0 && (
          <div className="pdf-portrait-page">
            <div className="w-full space-y-3 scale-[0.95] origin-top">
              {/* 상단 헤더 */}
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider">
                      FREE ATTRACTIONS
                    </span>
                    <h2 className="text-base font-black text-neutral-900 tracking-tight">
                      {isKo ? "사전 예약 없이 바로 가는 무료 명소" : "Free Attractions (No Booking Required)"}
                    </h2>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-0.5 font-medium leading-none">
                    {isKo
                      ? "별도의 예매나 바우처 구매 없이 현장에서 즉시 자유롭게 관람할 수 있는 명소 목록입니다."
                      : "Curated open attractions that you can visit freely without prior reservations."}
                  </p>
                </div>
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  {freeSpots.length}곳
                </span>
              </div>

              {/* 3열 카드 그리드 형태의 무료 명소 리스트 */}
              <div className="grid grid-cols-3 gap-2">
                {freeSpots.map((spot) => (
                  <a
                    key={spot.id}
                    href={spot.targetUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between text-left text-neutral-800 no-underline cursor-pointer shadow-2xs"
                  >
                    <div className="min-w-0 pr-1.5 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded shrink-0">
                          {isKo ? spot.cityNameKo : spot.cityNameEn}
                        </span>
                        <h4 className="font-black text-[10.5px] text-neutral-900 truncate">
                          {isKo ? spot.nameKo : spot.nameEn}
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-400 block">
                        {isKo ? "현장 무료 입장" : "Free Admission"}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-blue-600 shrink-0">↗</span>
                  </a>
                ))}
              </div>
            </div>

            {/* 하단 푸터 */}
            <div className="text-right text-[9.5px] text-neutral-400 font-semibold pt-1">
              Page {stopsList.length + 3}
            </div>
          </div>
        )}

      {/* ========================================================================= */}
      {/* PAGE: 도시별 담은 대표 음식 리스트 (K-FOOD SELECTION - 100% 온전히 수록) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page">
        <div className="w-full space-y-3 scale-[0.95] origin-top">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#b93829] text-white text-[9px] font-black uppercase tracking-wider">
                  K-FOOD SELECTION
                </span>
                <h2 className="text-base font-black text-neutral-900 tracking-tight">
                  {isKo ? "도시별 담은 대표 음식 리스트" : "Selected Food Guide by City"}
                </h2>
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5 font-medium leading-none">
                {isKo
                  ? "플래너에서 직접 선택한 도시별 한국 대표 미식 목록입니다."
                  : "Curated regional Korean gourmet experiences selected in your travel planner."}
              </p>
            </div>
            <span className="text-[11px] font-black text-neutral-800 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60">
              {isKo ? `식비 합계: ₩ ${sumFoodTotal.toLocaleString()}` : `Total Food: ₩ ${sumFoodTotal.toLocaleString()}`}
            </span>
          </div>

          {/* 도시별 구획 분리 음식 리스트 (도시별 다단 컬럼 그리드 - 12개 음식 100% 완벽 출력) */}
          <div className="grid grid-cols-3 gap-3 w-full items-start">
            {stopsList.map((stop: any, sIdx: number) => {
              const foodItems = (stop as any).foodBasketPlan?.selectedItems
                || (cityBreakdown[stop.city] as any)?.foodBasketPlan?.selectedItems
                || [];

              if (foodItems.length === 0) return null;

              return (
                <div key={`pdf-food-${stop.stopId || `${stop.city}-${sIdx}`}`} className="space-y-2 bg-neutral-50/50 p-2.5 rounded-2xl border border-neutral-200/70">
                  <div className="flex items-center gap-1.5 border-b border-neutral-200/80 pb-1">
                    <span className="text-xs font-black text-neutral-900">
                      {stop.cityName}
                      {stop.isAdded && <span className="text-[#b93829] ml-1 text-[9px]">(+)</span>}
                    </span>
                    <span className="text-[9.5px] font-bold text-neutral-400">
                      ({foodItems.length}{isKo ? "종" : ""})
                    </span>
                    <span className="text-[10px] font-black text-rose-700 ml-auto tabular-nums">
                      ₩ {(stop.foodTotalKrw || (cityBreakdown[stop.city]?.foodTotalKrw) || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
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
                          className="p-1.5 rounded-xl bg-white border border-neutral-200/90 flex items-center gap-2 shadow-2xs"
                        >
                          {/* 음식 사진 */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200/60">
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
                            <span className="font-black text-[10px] text-neutral-900 block truncate leading-tight">
                              {fName}
                            </span>
                            <div className="flex items-center justify-between text-[8.5px] leading-tight">
                              <span className="text-neutral-500 tabular-nums">
                                ₩ {unitPrice.toLocaleString()}{adultCount > 1 ? `×${adultCount}` : ""}
                              </span>
                              <span className="font-black text-rose-700 tabular-nums">
                                ₩ {itemSubtotal.toLocaleString()}
                              </span>
                            </div>
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
        <div className="text-right text-[9.5px] text-neutral-400 font-semibold pt-1">
          Page {freeSpots.length > 0 ? stopsList.length + 4 : stopsList.length + 3}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE: 내 한국 여행 영수증 (2단 다단, 모든 내역 생략 없이 100% 온전히 수록, 단일 페이지 완결) */}
      {/* ========================================================================= */}
      <div className="pdf-portrait-page pdf-portrait-page-receipt flex flex-col justify-between h-[297mm] max-h-[297mm] overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[9px] font-black uppercase tracking-wider">
                ITEMIZED RECEIPT
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                {isKo ? "내 한국 여행 영수증" : "Itemized Travel Receipt"}
              </h2>
            </div>
            <p className="text-[10.5px] text-neutral-500 mt-0.5 font-medium">
              {isKo
                ? "도시별 이동 교통과 머무는 일정에 맞춘 전 일정 실비 영수증입니다. (모든 내역 100% 완전 수록)"
                : "Complete itemized breakdown for all legs, stays, dining, and activities."}
            </p>
          </div>
          <span className="text-xs font-black text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full shrink-0">
            {totalNights}{isKo ? "박" : "N"} · {adultCount}{isKo ? "인" : " Travelers"}
          </span>
        </div>

        {/* 2단 다단(2-column) 영수증 본문 - 임의의 생략 없이 모든 내역 100% 출력 & 컴팩트 수록 */}
        <div className="print-receipt-2col flex-1 overflow-hidden text-[10px] leading-tight text-neutral-800 py-1.5 space-y-1.5">
          {/* 1. 입국 공항 이동 */}
          {entryItems.length > 0 && (
            <div className="print-avoid-break p-1.5 mb-1.5 rounded-xl bg-neutral-100/80 border border-neutral-200">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-800">
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
                <div className="print-avoid-break p-2 mb-1.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  {/* 도시 헤더 */}
                  <div className="flex justify-between items-center pb-0.5 border-b border-neutral-200">
                    <span className="font-black text-[10.5px] text-neutral-900">
                      • {sInfo.cityName}
                      {sInfo.isAdded && <span className="text-[#b93829] ml-1">(+)</span>}
                      <span className="text-[9.5px] text-neutral-400 font-medium ml-1">
                        ({sInfo.nights > 0 ? `${sInfo.nights}박` : "0박"})
                      </span>
                    </span>
                    <span className="font-black text-[10.5px] text-neutral-900 tabular-nums">
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

                  {/* 식비 - 생략 없이 모든 메뉴 100% 표시 */}
                  {foodKrw > 0 && (
                    <div className="space-y-0.5 pt-0.5 border-t border-neutral-100">
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="text-neutral-700 truncate pr-1">
                          <span className="font-bold text-rose-700 mr-1">[식비]</span>
                          {foodItems.length > 0 ? `선택 미식 (${foodItems.length}종)` : "식비 합계"}
                        </span>
                        <span className="font-bold tabular-nums shrink-0">₩ {foodKrw.toLocaleString()}</span>
                      </div>
                      {foodItems.length > 0 && (
                        <div className="pl-1.5 space-y-0.2 text-[8.5px] text-neutral-600">
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
                  <div className="flex justify-between items-center text-[9.5px] pt-0.5 border-t border-neutral-100">
                    <span className="text-neutral-600">
                      <span className="font-bold text-indigo-700 mr-1">[교통]</span>
                      {sInfo.cityName} 시내 대중교통
                    </span>
                    <span className="font-bold tabular-nums">₩ {(sInfo.transportTotalKrw || 0).toLocaleString()}</span>
                  </div>

                  {/* 관광 - 생략 없이 모든 명소 100% 표시 */}
                  {spots.length > 0 && (
                    <div className="space-y-0.5 pt-0.5 border-t border-neutral-100">
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="font-bold text-amber-700">[관광] 명소 ({spots.length}곳)</span>
                        <span className="font-bold tabular-nums">₩ {(sInfo.attractionTotalKrw || 0).toLocaleString()}</span>
                      </div>
                      <div className="pl-1.5 space-y-0.2 text-[8.5px] text-neutral-600">
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
                  <div className="print-avoid-break p-1 mb-1.5 rounded-lg bg-neutral-100/80 border border-neutral-200 flex justify-between items-center text-[9px] font-bold text-neutral-700">
                    <span>{formatSimplifiedTransit(transitToNext).routeName} ({formatSimplifiedTransit(transitToNext).modeName})</span>
                    <span className="font-black tabular-nums">₩ {(transitToNext.lineTotalKrw || 0).toLocaleString()}</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* 3. 출국 공항 이동 */}
          {exitItems.length > 0 && (
            <div className="print-avoid-break p-1.5 mb-1.5 rounded-xl bg-neutral-100/80 border border-neutral-200">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-800">
                <span>{exitItems.map((i: any) => formatSimplifiedTransit(i).routeName).join(", ")}</span>
                <span className="font-black tabular-nums">
                  ₩ {exitItems.reduce((sum: number, item: any) => sum + (item.lineTotalKrw || item.totalKrw || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 하단 전폭 최종 합계 요약 바 (영수증과 같은 페이지 하단에 단단히 고정) */}
        <div className="print-column-span-all print-avoid-break shrink-0 mt-auto pt-1.5 border-t-2 border-neutral-900 bg-neutral-50 p-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            {shoppingAmountKrw > 0 && (
              <div>
                <span className="text-[9.5px] text-neutral-400 block font-bold">{isKo ? "쇼핑 예산" : "Shopping"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {shoppingAmountKrw.toLocaleString()}</span>
              </div>
            )}
            {totalDailyAllowanceKrw > 0 && (
              <div>
                <span className="text-[9.5px] text-neutral-400 block font-bold">{isKo ? "일일 용돈" : "Daily Allowance"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {totalDailyAllowanceKrw.toLocaleString()}</span>
              </div>
            )}
            {computedEmergencyKrw > 0 && (
              <div>
                <span className="text-[9.5px] text-neutral-400 block font-bold">{isKo ? "여행 비상금" : "Emergency Fund"}</span>
                <span className="font-black text-neutral-800 tabular-nums">₩ {computedEmergencyKrw.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[9.5px] text-neutral-400 block font-bold uppercase tracking-wider">
              {isKo ? "예산 총액 (GRAND TOTAL)" : "Grand Total"}
            </span>
            <span className="text-base font-black text-neutral-900 tabular-nums">
              ₩ {grandTotalKrw.toLocaleString()}
            </span>
            {adultCount > 1 && (
              <span className="text-[9.5px] text-neutral-500 font-bold block">
                1인당 ₩ {Math.round(grandTotalKrw / adultCount).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="text-right text-[9.5px] text-neutral-400 font-semibold pt-1 shrink-0">
          Page {freeSpots.length > 0 ? stopsList.length + 5 : stopsList.length + 4}
        </div>
      </div>
    </div>
  );
}