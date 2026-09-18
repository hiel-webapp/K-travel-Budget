"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Script from "next/script";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { SupportedCity } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import type { AttractionSpot } from "src/features/budget/catalog/attraction-spots";
import {
  getSpotCoordinates,
  optimizeSpotSequence,
  getKakaoMapDirectLink,
  calculateDistanceKm,
  LatLng,
} from "src/lib/map/spot-coordinates";
import { formatKrw } from "src/features/budget/presentation/formatters";

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
}

export default function SmartRouteMap({
  selectedCities,
  cityBreakdown,
  locale,
}: SmartRouteMapProps) {
  // 1. 활성화된 도시 탭 (기본값: 첫 번째 도시)
  const [activeCity, setActiveCity] = useState<SupportedCity>(
    selectedCities[0] || "SEOUL"
  );
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // 환경변수가 빌드 환경에 누락되어도 정상 작동하도록 기본 공개 JavaScript 키 폴백 제공
  const kakaoAppKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "0fd19b94d6a6dffb2c23e0879fcab8ca";

  // 2. 현재 선택된 도시의 관광지 스팟 리스트 추출 및 좌표 매핑
  const citySpots = useMemo(() => {
    const rawSpots = cityBreakdown[activeCity]?.selectedSpots || [];
    if (rawSpots.length === 0) return [];

    const mapped: (Omit<RouteSpotItem, "routeOrder">)[] = rawSpots.map(
      (spot, idx) => {
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
      }
    );

    // 지리적 인접성에 따른 최적 동선(1, 2, 3...) 자동 정렬
    const optimized = optimizeSpotSequence(mapped);
    return optimized.map((item, seqIdx) => ({
      ...item,
      routeOrder: seqIdx + 1,
    }));
  }, [activeCity, cityBreakdown]);

  // 총 이동거리 추산
  const totalRouteDistKm = useMemo(() => {
    if (citySpots.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < citySpots.length - 1; i++) {
      dist += calculateDistanceKm(citySpots[i], citySpots[i + 1]);
    }
    return Math.round(dist * 10) / 10;
  }, [citySpots]);

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
          citySpots.length > 0
            ? new window.kakao.maps.LatLng(citySpots[0].lat, citySpots[0].lng)
            : new window.kakao.maps.LatLng(37.5665, 126.978);

        const options = {
          center: centerCoord,
          level: 6,
        };

        const map = new window.kakao.maps.Map(mapContainerRef.current, options);
        mapInstanceRef.current = map;
        setIsMapLoaded(true);

        // 줌 컨트롤러 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        if (citySpots.length === 0) {
          return;
        }

        const bounds = new window.kakao.maps.LatLngBounds();
        const pathCoords: any[] = [];

        // 커스텀 핀 오버레이 생성
        citySpots.forEach((spot) => {
          const pos = new window.kakao.maps.LatLng(spot.lat, spot.lng);
          bounds.extend(pos);
          pathCoords.push(pos);

          const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;

          // 번호 뱃지 커스텀 HTML 오버레이
          const content = document.createElement("div");
          content.className =
            "relative group cursor-pointer transform -translate-x-1/2 -translate-y-full transition-transform duration-200 hover:scale-110";
          content.innerHTML = `
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f172a] text-white shadow-lg border-2 border-white">
              <span class="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                ${spot.routeOrder}
              </span>
              <span class="text-[11px] font-extrabold max-w-[90px] truncate">
                ${spotName}
              </span>
            </div>
            <div class="w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-[#0f172a] mx-auto"></div>
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
            strokeColor: "#e25c5c",
            strokeOpacity: 0.85,
            strokeStyle: "shortdash",
          });
          polyline.setMap(map);
          polylineRef.current = polyline;
        }

        // 영역 자동 조정
        if (citySpots.length === 1) {
          map.setCenter(new window.kakao.maps.LatLng(citySpots[0].lat, citySpots[0].lng));
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

  // 도시 탭이 바뀌거나 카카오 스크립트가 준비되었을 때 맵 재초기화
  useEffect(() => {
    // 1. 이미 kakao 객체가 로드되어 있는 경우 즉시 초기화
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      initKakaoMap();
      return;
    }

    // 2. 스크립트 태그가 아직 주입되지 않았을 경우를 위한 보장 로직
    if (typeof window !== "undefined" && !document.getElementById("kakao-map-sdk")) {
      const script = document.createElement("script");
      script.id = "kakao-map-sdk";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`;
      script.async = true;
      script.onload = () => {
        initKakaoMap();
      };
      script.onerror = () => {
        console.warn("Failed to load Kakao Map script directly.");
        setMapLoadError(true);
      };
      document.head.appendChild(script);
    }
  }, [activeCity, citySpots, kakaoAppKey]);

  const activeCityName =
    locale === "ko"
      ? CITY_KOREAN_NAMES[activeCity] || activeCity
      : CITY_ENGLISH_NAMES[activeCity] || activeCity;

  // 전체 길찾기 열기 링크 (첫 스팟 -> 마지막 스팟)
  const fullRouteLink =
    citySpots.length > 0
      ? getKakaoMapDirectLink(
          locale === "ko" ? citySpots[0].nameKo : citySpots[0].nameEn,
          citySpots[0].lat,
          citySpots[0].lng
        )
      : `https://map.kakao.com`;

  return (
    <>
      {/* Kakao Map Web SDK Script (afterInteractive 로드) */}
      <Script
        id="kakao-map-sdk-next"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          initKakaoMap();
        }}
        onError={() => {
          console.warn("Kakao Map Script failed to load.");
          setMapLoadError(true);
        }}
      />

      <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
        {/* Header with City Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                Interactive Smart Route
              </span>
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                {locale === "ko" ? "스마트 코스 최적 동선 & 카카오맵" : "Smart Route & Kakao Map"}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              {locale === "ko"
                ? "선택하신 관광지를 지리적 최단 동선(1, 2, 3...)으로 정렬하여 인터랙티브 지도와 함께 안내합니다."
                : "Your selected attractions are optimized geographically in efficient visiting sequence (1, 2, 3...)."}
            </p>
          </div>

          {/* City Selection Tabs */}
          {selectedCities.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 self-start sm:self-auto">
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-white text-neutral-900 shadow-2xs"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Route Overview Stat Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-neutral-400 block text-[10px] font-bold uppercase">
                {locale === "ko" ? "선택 스팟" : "SELECTED SPOTS"}
              </span>
              <span className="font-extrabold text-neutral-900 tabular-nums">
                {citySpots.length}{locale === "ko" ? "개소" : " Spots"}
              </span>
            </div>
            <div className="h-6 w-px bg-neutral-200" />
            <div>
              <span className="text-neutral-400 block text-[10px] font-bold uppercase">
                {locale === "ko" ? "총 추천 동선 거리" : "TOTAL ROUTE"}
              </span>
              <span className="font-extrabold text-neutral-900 tabular-nums">
                {totalRouteDistKm > 0
                  ? `약 ${totalRouteDistKm} km`
                  : locale === "ko"
                  ? "인접 구역"
                  : "Adjacent"}
              </span>
            </div>
          </div>

          {/* Kakao Map Deep Link Button */}
          {citySpots.length > 0 && (
            <a
              href={fullRouteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.708 4.8 4.27 6.054l-.865 3.186c-.078.287.213.522.46.368l3.77-2.35c.446.04.9.057 1.365.057 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
              </svg>
              <span>{locale === "ko" ? "카카오맵에서 길찾기 열기" : "Open in Kakao Map"}</span>
              <span className="text-[10px]">↗</span>
            </a>
          )}
        </div>

        {/* Map Container Area */}
        <div className="relative w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-neutral-200/80 bg-neutral-100">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Fallback / Loading State Overlay */}
          {(!isMapLoaded || mapLoadError) && (
            <div className="absolute inset-0 bg-neutral-50/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200/80 flex items-center justify-center shadow-2xs">
                <svg className="w-5 h-5 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-800">
                  {mapLoadError
                    ? locale === "ko"
                      ? "지도를 불러오는 중입니다 (타임라인 모드 활성화)"
                      : "Map Loading (Timeline Mode Active)"
                    : locale === "ko"
                    ? "카카오맵 인터랙티브 경로를 로딩 중입니다..."
                    : "Connecting Kakao Map Route..."}
                </h4>
                <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed">
                  {locale === "ko"
                    ? "하단의 1, 2, 3 순번 타임라인에서 최적 동선과 개별 길찾기를 즉시 이용하실 수 있습니다."
                    : "You can view the optimal sequence and directions in the timeline below."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Optimized Sequence Timeline List */}
        {citySpots.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
              {locale === "ko" ? "순번별 최적 동선 타임라인" : "RECOMMENDED VISITING TIMELINE"}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {citySpots.map((spot, idx) => {
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
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? "bg-rose-50/70 border-rose-300 shadow-xs"
                        : "bg-neutral-50/60 hover:bg-white border-neutral-200/70 hover:shadow-2xs"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#0f172a] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {spot.routeOrder}
                          </span>
                          <h4 className="text-xs font-black text-neutral-900 truncate">
                            {spotName}
                          </h4>
                        </div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-neutral-200/70 text-neutral-600 shrink-0">
                          {spot.categoryType}
                        </span>
                      </div>

                      {spot.subwayInfo && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <span className="text-[10px]">🚇</span>
                          <span className="truncate">{spot.subwayInfo}</span>
                        </p>
                      )}

                      <p className="text-[11px] text-neutral-500 line-clamp-1 leading-relaxed">
                        {spotDesc}
                      </p>
                    </div>

                    {/* Bottom Action / Direct Link */}
                    <div className="pt-2 border-t border-neutral-200/50 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-neutral-700 tabular-nums">
                        {spot.price > 0
                          ? formatKrw(spot.price)
                          : locale === "ko"
                          ? "무료 입장"
                          : "Free Entry"}
                      </span>

                      <a
                        href={directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-extrabold text-[#191919] hover:text-rose-600 transition-colors"
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
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 text-center space-y-1">
            <p className="text-xs font-bold text-neutral-600">
              {locale === "ko"
                ? "현재 도시에 등록된 관광지 스팟이 없습니다."
                : "No attractions selected for this city yet."}
            </p>
            <p className="text-[11px] text-neutral-400">
              {locale === "ko"
                ? "장소 탐색이나 플래너에서 명소를 담으시면 스마트 동선이 자동으로 생성됩니다."
                : "Add places in Planner or Explore to generate your route."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
