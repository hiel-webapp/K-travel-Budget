"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Script from "next/script";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { SupportedCity } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import {
  TOUR_COURSE_PRESETS,
  ATTRACTION_SPOTS_CATALOG,
  type AttractionSpot,
  type TourCoursePreset,
} from "src/features/budget/catalog/attraction-spots";
import {
  getSpotCoordinates,
  optimizeSpotSequence,
  getKakaoMapDirectLink,
  calculateDistanceKm,
  LatLng,
} from "src/lib/map/spot-coordinates";
import { formatPriceByLocale } from "src/lib/currency/currency-converter";
import { formatTransitInfo } from "src/lib/places/place-localization";

declare global {
  interface Window {
    kakao: any;
  }
}

export interface RouteSpotItem extends LatLng {
  id: string;
  originalIndex: number;
  routeOrder: number;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  price: number;
  subwayInfo?: string;
  categoryType?: string;
  officialUrl?: string;
  cityCode: SupportedCity;
}

export interface SmartRouteMapProps {
  selectedCities: SupportedCity[];
  cityBreakdown: Record<string, { selectedSpots?: AttractionSpot[] }>;
  locale: Locale;
  dict: Dictionary;
  usdRate?: number;
}

export default function SmartRouteMap({
  selectedCities,
  cityBreakdown,
  locale,
  usdRate = 1387,
}: SmartRouteMapProps) {
  // 1. 활성화된 도시 탭 (기본값: 첫 번째 도시)
  const [activeCity, setActiveCity] = useState<SupportedCity>(
    selectedCities[0] || "SEOUL"
  );

  // 현재 도시의 추천 투어 코스 목록
  const cityCourses = useMemo(() => {
    return TOUR_COURSE_PRESETS.filter((c) => c.cityCode === activeCity);
  }, [activeCity]);

  // 선택된 추천 코스 ID (기본값: 해당 도시의 첫 번째 코스)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // 도시가 바뀔 때 선택 코스 초기화
  useEffect(() => {
    const firstCourse = TOUR_COURSE_PRESETS.find((c) => c.cityCode === activeCity);
    setSelectedCourseId(firstCourse ? firstCourse.id : null);
  }, [activeCity]);

  const activeCourse: TourCoursePreset | null = useMemo(() => {
    if (!cityCourses || cityCourses.length === 0) return null;
    if (selectedCourseId) {
      const found = cityCourses.find((c) => c.id === selectedCourseId);
      if (found) return found;
    }
    return cityCourses[0] || null;
  }, [cityCourses, selectedCourseId]);

  // 사용자가 바스켓에 담은 스팟 여부
  const userRawSpots = useMemo(() => {
    return cityBreakdown[activeCity]?.selectedSpots || [];
  }, [cityBreakdown, activeCity]);

  // 지도 뷰 모드: 'USER' (내 바스켓 스팟) vs 'COURSE' (추천 코스 스팟)
  const [viewMode, setViewMode] = useState<"USER" | "COURSE">("COURSE");

  // 바스켓에 담은 스팟이 있으면 기본을 'USER'로, 없으면 'COURSE'로 설정
  useEffect(() => {
    if (userRawSpots.length > 0) {
      setViewMode("USER");
    } else {
      setViewMode("COURSE");
    }
  }, [activeCity, userRawSpots.length]);

  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const kakaoAppKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "0fd19b94d6a6dffb2c23e0879fcab8ca";

  // 2. 현재 뷰 모드에 따라 지도에 표시할 스팟 리스트 추출
  const displayedSpots: RouteSpotItem[] = useMemo(() => {
    if (viewMode === "COURSE" && activeCourse) {
      // 추천 코스의 스팟들을 순서대로 매핑
      const mapped: RouteSpotItem[] = [];
      activeCourse.spotIds.forEach((sid, idx) => {
        const spot: AttractionSpot =
          ATTRACTION_SPOTS_CATALOG.find((s) => s.id === sid) || {
            id: sid,
            cityCode: activeCity,
            nameKo: sid,
            nameEn: sid,
            descKo: "",
            descEn: "",
            price: 0,
            priceStatus: "FREE",
            tag: "Attraction",
            emoji: "📍",
            gradientBg: "from-slate-700 to-slate-900",
            isFeatured: false,
            subwayInfo: "",
            categoryType: "명소",
            officialUrl: "",
          };

        const coords = getSpotCoordinates(
          spot.nameKo,
          spot.nameEn,
          activeCity,
          (spot as any).latitude,
          (spot as any).longitude,
          idx
        );

        mapped.push({
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
          cityCode: activeCity,
          lat: coords.lat,
          lng: coords.lng,
        });
      });
      return mapped;
    }

    // USER 모드: 사용자가 선택한 스팟
    if (userRawSpots.length === 0) return [];

    const mapped = userRawSpots.map((spot, idx) => {
      const coords = getSpotCoordinates(
        spot.nameKo,
        spot.nameEn,
        activeCity,
        (spot as any).latitude,
        (spot as any).longitude,
        idx
      );
      return {
        id: spot.id,
        originalIndex: idx,
        nameKo: spot.nameKo,
        nameEn: spot.nameEn,
        descKo: spot.descKo,
        descEn: spot.descEn,
        price: spot.price || 0,
        subwayInfo: spot.subwayInfo,
        categoryType: spot.categoryType || "명소",
        officialUrl: spot.officialUrl,
        cityCode: activeCity,
        lat: coords.lat,
        lng: coords.lng,
      };
    });

    const optimized = optimizeSpotSequence(mapped);
    return optimized.map((item, seqIdx) => ({
      ...item,
      routeOrder: seqIdx + 1,
    }));
  }, [viewMode, activeCourse, userRawSpots, activeCity]);

  // 총 이동거리 추산
  const totalRouteDistKm = useMemo(() => {
    if (displayedSpots.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < displayedSpots.length - 1; i++) {
      dist += calculateDistanceKm(displayedSpots[i], displayedSpots[i + 1]);
    }
    return Math.round(dist * 10) / 10;
  }, [displayedSpots]);

  // 3. 카카오맵 렌더링 함수
  const initKakaoMap = () => {
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps) {
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapContainerRef.current) return;

      try {
        // 기존 오버레이 및 폴리라인 정리
        overlaysRef.current.forEach((ov) => ov.setMap(null));
        overlaysRef.current = [];
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        // 기본 중심점 설정
        const centerCoord =
          displayedSpots.length > 0
            ? new window.kakao.maps.LatLng(displayedSpots[0].lat, displayedSpots[0].lng)
            : new window.kakao.maps.LatLng(37.5665, 126.978);

        const options = {
          center: centerCoord,
          level: 6,
        };

        const map = new window.kakao.maps.Map(mapContainerRef.current, options);
        mapInstanceRef.current = map;
        setIsMapLoaded(true);
        setMapLoadError(false);

        // 줌 컨트롤러 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        if (displayedSpots.length === 0) {
          return;
        }

        const bounds = new window.kakao.maps.LatLngBounds();
        const pathCoords: any[] = [];

        // 커스텀 핀 오버레이 생성
        displayedSpots.forEach((spot) => {
          const pos = new window.kakao.maps.LatLng(spot.lat, spot.lng);
          bounds.extend(pos);
          pathCoords.push(pos);

          // 넘버링 마커 커스텀 오버레이
          const isSelected = selectedSpotId === spot.id;
          const isCourse = viewMode === "COURSE";
          const badgeBg = isSelected
            ? "#e25c5c"
            : isCourse
            ? "#4f46e5"
            : "#0f172a";

          const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;

          const content = document.createElement("div");
          content.className = "group cursor-pointer transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-110";
          content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="background-color: ${badgeBg}; color: white; border-radius: 9999px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid white;">
                ${spot.routeOrder}
              </div>
              <div style="background-color: rgba(15, 23, 42, 0.9); backdrop-filter: blur(4px); color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; margin-top: 3px; white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
                ${spotName}
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid ${badgeBg};"></div>
            </div>
          `;

          content.onclick = () => {
            setSelectedSpotId(spot.id);
            map.panTo(pos);
          };

          const overlay = new window.kakao.maps.CustomOverlay({
            position: pos,
            content,
            yAnchor: 1,
            zIndex: 10,
          });

          overlay.setMap(map);
          overlaysRef.current.push(overlay);
        });

        // 스팟들을 잇는 동선 폴리라인(Polyline)
        if (pathCoords.length > 1) {
          const polyline = new window.kakao.maps.Polyline({
            path: pathCoords,
            strokeWeight: 4,
            strokeColor: viewMode === "COURSE" ? "#6366f1" : "#e25c5c",
            strokeOpacity: 0.85,
            strokeStyle: "shortdash",
          });
          polyline.setMap(map);
          polylineRef.current = polyline;
        }

        // 영역 자동 조정
        if (displayedSpots.length === 1) {
          map.setCenter(new window.kakao.maps.LatLng(displayedSpots[0].lat, displayedSpots[0].lng));
          map.setLevel(5);
        } else {
          map.setBounds(bounds);
        }
      } catch (e) {
        console.error("Failed to render Kakao Map:", e);
        setMapLoadError(true);
      }
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      initKakaoMap();
      return;
    }

    // 4초 이상 SDK 로드가 지연되거나 도메인 정책 등으로 막힐 경우 로딩 무한 대기를 방지하고 깔끔한 타임라인 폴백 모드로 자동 전환
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
        initKakaoMap();
      } else {
        setMapLoadError(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [activeCity, viewMode, selectedCourseId, displayedSpots]);

  const fullRouteLink =
    displayedSpots.length > 0
      ? getKakaoMapDirectLink(
          locale === "ko" ? displayedSpots[0].nameKo : displayedSpots[0].nameEn,
          displayedSpots[0].lat,
          displayedSpots[0].lng
        )
      : `https://map.kakao.com`;

  const cityName =
    locale === "ko"
      ? CITY_KOREAN_NAMES[activeCity] || activeCity
      : CITY_ENGLISH_NAMES[activeCity] || activeCity;

  return (
    <>
      <Script
        id="kakao-map-sdk-next"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          setMapLoadError(false);
          initKakaoMap();
        }}
        onError={() => {
          console.warn("Kakao Map Script failed to load.");
          setMapLoadError(true);
        }}
      />

      <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-[0_10px_35px_rgb(0,0,0,0.04)] space-y-5">
        {/* 1. Header */}
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {locale === "ko" ? "스마트 투어 코스" : "Smart Tour Route"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {locale === "ko"
              ? "도시별 추천 여행 코스와 최적 이동 동선을 지도에서 한눈에 확인하세요."
              : "Explore curated tour routes and optimized travel sequences on the map."}
          </p>
        </div>

        {/* 2. City Switcher (Left Column) & Map Viewport (Right Column) */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
          {/* 좌측 세로 도시 전환 탭 */}
          {selectedCities.length > 1 && (
            <div className="flex sm:flex-col gap-1.5 p-1.5 rounded-2xl bg-neutral-100/90 border border-neutral-200/70 w-full sm:w-32 md:w-36 lg:w-40 shrink-0 self-start">
              {selectedCities.map((c) => {
                const cName =
                  locale === "ko"
                    ? CITY_KOREAN_NAMES[c] || c
                    : CITY_ENGLISH_NAMES[c] || c;
                const isCurrent = c === activeCity;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setActiveCity(c);
                      setSelectedSpotId(null);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-black transition-all cursor-pointer text-center sm:text-left ${
                      isCurrent
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
                    }`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>
          )}

          {/* 우측 컴팩트 카카오맵 뷰포트 (지도의 크기를 줄임) */}
          <div className="flex-1 min-w-0">
            <div className="relative w-full h-72 sm:h-80 md:h-[350px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* 로딩 / 에러 폴백 */}
              {(!isMapLoaded || mapLoadError) && (
                <div className="absolute inset-0 bg-slate-50/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs">
                    {mapLoadError ? (
                      <span className="text-xl">🗺️</span>
                    ) : (
                      <svg className="w-5 h-5 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-black text-slate-800">
                      {mapLoadError
                        ? locale === "ko"
                          ? "카카오맵 최적 경로 & 타임라인 모드"
                          : "Kakao Map Route & Timeline Mode"
                        : locale === "ko"
                        ? "카카오맵 인터랙티브 경로를 연결하는 중..."
                        : "Connecting Kakao Map Route..."}
                    </h4>
                    <p className="text-[11.5px] text-slate-500 max-w-sm leading-relaxed">
                      {mapLoadError
                        ? locale === "ko"
                          ? "외부 도메인 보안 설정에 따라 아래 스마트 타임라인(1➔2➔3)과 카카오 공식 길찾기 바로가기로 안전하게 안내해 드립니다."
                          : "Explore the optimized sequence (1➔2➔3) below and access direct Kakao Map directions."
                        : locale === "ko"
                        ? "하단의 1, 2, 3 순번 타임라인에서 최적 동선과 개별 길찾기를 즉시 이용하실 수 있습니다."
                        : "You can view the optimal sequence and directions in the timeline below."}
                    </p>
                  </div>

                  {mapLoadError && displayedSpots.length > 0 && (
                    <a
                      href={fullRouteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fee500] hover:bg-[#fdd835] text-slate-900 text-xs font-black shadow-xs transition-colors"
                    >
                      <span>카카오맵에서 전체 코스 보기</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. 동선 제어 바 (지도 아래로 이동: 모드 토글 + 거리/스팟 정보 + 길찾기) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200/70">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode("COURSE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "COURSE"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/70"
              }`}
            >
              <span>🧭</span>
              <span>{locale === "ko" ? "추천 투어 코스" : "Curated Courses"}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${viewMode === "COURSE" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                {cityCourses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("USER")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "USER"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/70"
              }`}
            >
              <span>📍</span>
              <span>{locale === "ko" ? "내가 담은 여행지 동선" : "My Selected Route"}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${viewMode === "USER" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                {userRawSpots.length}
              </span>
            </button>
          </div>

          {/* 거리, 스팟 수 & 카카오맵 길찾기 */}
          <div className="flex items-center gap-3 text-xs font-bold text-neutral-600 flex-wrap">
            <span>
              {locale === "ko" ? "경로 스팟" : "Spots"}: <strong className="text-neutral-900">{displayedSpots.length}개소</strong>
            </span>
            <span className="text-neutral-300">|</span>
            <span>
              {locale === "ko" ? "예상 이동거리" : "Distance"}:{" "}
              <strong className="text-neutral-900">
                {totalRouteDistKm > 0 ? `약 ${totalRouteDistKm} km` : (locale === "ko" ? "인접 도보권" : "Adjacent")}
              </strong>
            </span>

            {displayedSpots.length > 0 && (
              <a
                href={fullRouteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs transition-all shadow-2xs shrink-0 cursor-pointer ml-1"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.708 4.8 4.27 6.054l-.865 3.186c-.078.287.213.522.46.368l3.77-2.35c.446.04.9.057 1.365.057 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                </svg>
                <span>{locale === "ko" ? "카카오맵 길찾기" : "Kakao Map"}</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* 5. 추천 코스 탭 스위처 (viewMode === 'COURSE' 일 때 표시) */}
        {viewMode === "COURSE" && cityCourses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {cityCourses.map((c, idx) => {
                const isSelected = (activeCourse?.id === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setSelectedSpotId(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs scale-[1.02]"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white/20 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{locale === "ko" ? c.nameKo : c.nameEn}</span>
                  </button>
                );
              })}
            </div>

            {/* 선택된 추천 코스 상세 카드 (프리미엄 디자인) */}
            {activeCourse && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white space-y-3 shadow-sm border border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-md shrink-0">
                      {locale === "ko" ? "엄선 추천 코스" : "Curated Course"}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                      {locale === "ko" ? activeCourse.nameKo : activeCourse.nameEn}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="text-[11px] font-extrabold text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 tabular-nums">
                      ⏱ {locale === "ko" ? `약 ${activeCourse.estimatedHours}시간 코스` : `~${activeCourse.estimatedHours}h Course`}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-400/30">
                      📍 {locale === "ko" ? "최단 근접 동선" : "Optimal Route"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {locale === "ko" ? activeCourse.descKo : activeCourse.descEn}
                </p>

                {/* 동선 스팟 체인 (➔) */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-extrabold text-slate-400 shrink-0 mr-1">
                    {locale === "ko" ? "추천 순서:" : "Sequence:"}
                  </span>
                  {activeCourse.spotIds.map((sid, sIdx) => {
                    const spot = ATTRACTION_SPOTS_CATALOG.find((s) => s.id === sid);
                    const spotName = spot
                      ? locale === "ko"
                        ? spot.nameKo
                        : spot.nameEn
                      : sid;

                    return (
                      <React.Fragment key={sid}>
                        <span className="text-[11px] font-bold bg-white/15 text-white px-2.5 py-1 rounded-lg border border-white/15 whitespace-nowrap shrink-0 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                            {sIdx + 1}
                          </span>
                          <span>{spotName}</span>
                        </span>
                        {sIdx < activeCourse.spotIds.length - 1 && (
                          <span className="text-rose-400 text-xs font-black shrink-0">➔</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Optimized Sequence Timeline List (스팟별 카드) */}
        {displayedSpots.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <span>🚩</span>
                <span>{locale === "ko" ? "순번별 방문 타임라인 & 길찾기" : "VISITING SEQUENCE & DIRECTIONS"}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {locale === "ko" ? "카드를 클릭하면 지도 해당 위치로 이동합니다." : "Click a card to focus on map."}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedSpots.map((spot) => {
                const isSelected = selectedSpotId === spot.id;
                const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;
                const spotDesc = locale === "ko" ? spot.descKo : spot.descEn;
                const directLink = getKakaoMapDirectLink(spotName, spot.lat, spot.lng);

                return (
                  <div
                    key={spot.id}
                    onClick={() => {
                      setSelectedSpotId(spot.id);
                      if (mapInstanceRef.current && window.kakao) {
                        mapInstanceRef.current.panTo(
                          new window.kakao.maps.LatLng(spot.lat, spot.lng)
                        );
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-xs"
                        : "bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                            {spot.routeOrder}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate" title={spotName}>
                            {spotName}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                          {spot.categoryType || (locale === "ko" ? "명소" : "Spot")}
                        </span>
                      </div>

                      {spot.subwayInfo && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <span className="text-[10px]">🚇</span>
                          <span className="truncate">{formatTransitInfo(spot.subwayInfo, locale)}</span>
                        </p>
                      )}

                      {spotDesc && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {spotDesc}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-700 tabular-nums">
                        {spot.price > 0
                          ? formatPriceByLocale(spot.price, locale, usdRate)
                          : (locale === "ko" ? "무료 입장" : "Free Entry")}
                      </span>

                      <a
                        href={directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>{locale === "ko" ? "카카오맵 길찾기" : "Directions"}</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1.5">
            <p className="text-xs font-bold text-slate-700">
              {locale === "ko"
                ? "현재 도시에 등록된 여행지가 없습니다."
                : "No attractions selected for this city yet."}
            </p>
            <p className="text-[11px] text-slate-400">
              {locale === "ko"
                ? "상단의 '추천 투어 코스' 탭을 선택하시면 엄선된 코스 동선을 바로 보실 수 있습니다."
                : "Click 'Curated Courses' above to view the recommended itinerary."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
