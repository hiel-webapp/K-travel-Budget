"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Script from "next/script";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { SupportedCity } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import {
  ATTRACTION_SPOTS_CATALOG,
  type AttractionSpot,
} from "src/features/budget/catalog/attraction-spots";
import {
  getSpotCoordinates,
  optimizeSpotSequence,
  getKakaoMapDirectLink,
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

  // 사용자가 바스켓에 담은 스팟
  const userRawSpots = useMemo(() => {
    return cityBreakdown[activeCity]?.selectedSpots || [];
  }, [cityBreakdown, activeCity]);

  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const kakaoAppKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "0fd19b94d6a6dffb2c23e0879fcab8ca";

  // 2. 현재 도시에서 사용자가 선택한 스팟 리스트 추출 및 최적 동선 계산
  const displayedSpots: RouteSpotItem[] = useMemo(() => {
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
  }, [userRawSpots, activeCity]);

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

        // 커스텀 핀 오버레이 생성 (산뜻한 로즈-코랄 컬러 + 관광지명 앞 소형 숫자)
        displayedSpots.forEach((spot) => {
          const pos = new window.kakao.maps.LatLng(spot.lat, spot.lng);
          bounds.extend(pos);
          pathCoords.push(pos);

          const isSelected = selectedSpotId === spot.id;
          const badgeBg = isSelected ? "#be123c" : "#f43f5e";
          const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;

          const content = document.createElement("div");
          content.className = "group cursor-pointer transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-105";
          content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="display: flex; align-items: center; gap: 4px; background-color: ${badgeBg}; color: white; padding: 3px 8px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.35); border: 1.5px solid white; white-space: nowrap;">
                <span style="background: rgba(255,255,255,0.25); width: 16px; height: 16px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900;">${spot.routeOrder}</span>
                <span>${spotName}</span>
              </div>
              <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid ${badgeBg};"></div>
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
            strokeWeight: 3.5,
            strokeColor: "#f43f5e",
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
  }, [activeCity, displayedSpots]);

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

        {/* 2. City Switcher & Route Action (Left Column) & Map Viewport (Right Column) */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
          {/* 좌측 사이드바: 도시 전환 탭 + 경로 스팟 수 + 카카오맵 길찾기 버튼 (2줄) */}
          <div className="flex sm:flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-neutral-100/90 border border-neutral-200/70 w-full sm:w-36 md:w-44 shrink-0 justify-between sm:justify-start">
            {/* 도시 탭 리스트 */}
            {selectedCities.length > 1 && (
              <div className="flex sm:flex-col gap-1.5 w-full">
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
                      className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-black transition-all cursor-pointer text-center sm:text-left ${
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

            {/* 지도 왼편 하단: 경로 스팟 n개소 + 카카오맵 길찾기 버튼 (2줄) */}
            <div className="pt-2 sm:mt-auto sm:border-t sm:border-neutral-200/80 flex flex-col gap-2 w-full">
              <div className="text-xs font-bold text-neutral-600">
                <span>{locale === "ko" ? "경로 스팟" : "Spots"}: </span>
                <strong className="text-neutral-900 font-black">{displayedSpots.length}개소</strong>
              </div>

              {displayedSpots.length > 0 && (
                <a
                  href={fullRouteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs transition-all shadow-2xs cursor-pointer text-center"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.708 4.8 4.27 6.054l-.865 3.186c-.078.287.213.522.46.368l3.77-2.35c.446.04.9.057 1.365.057 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                  </svg>
                  <span>{locale === "ko" ? "카카오맵 길찾기" : "Kakao Map"}</span>
                  <span className="text-[10px]">↗</span>
                </a>
              )}
            </div>
          </div>

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
