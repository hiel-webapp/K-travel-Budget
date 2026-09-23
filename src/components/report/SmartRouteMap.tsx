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
  isSameSpot,
  normalizeSpotKey,
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

export interface RouteSpotGroup {
  id: string;
  isCourse: boolean;
  courseTitleKo: string;
  courseTitleEn: string;
  courseDescKo?: string;
  courseDescEn?: string;
  estimatedHours?: number;
  spots: RouteSpotItem[];
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

  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const kakaoAppKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "0fd19b94d6a6dffb2c23e0879fcab8ca";

  // 도시 전환 시 선택 상태 초기화
  useEffect(() => {
    setSelectedSpotIds([]);
  }, [activeCity]);

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

  // 2-B. 추천 투어 코스 결합 및 그룹화 로직 (사용자가 담은 스팟들이 추천 코스에 부합할 경우 타이틀로 묶음)
  const spotGroups = useMemo<RouteSpotGroup[]>(() => {
    if (displayedSpots.length === 0) return [];

    const cityCourses = TOUR_COURSE_PRESETS.filter(
      (c) => (c.cityCode || "").toLowerCase() === (activeCity || "").toLowerCase() && c.isActive !== false
    );

    const remainingSpots = [...displayedSpots];
    const groups: RouteSpotGroup[] = [];

    // 1) 각 코스별로 모든 스팟이 100% 온전히 포함되어 있는지 검사 (완전한 코스만 타이틀로 묶음)
    cityCourses.forEach((course) => {
      if (!course.spotIds || course.spotIds.length === 0) return;

      // 이 코스의 모든 spotId가 remainingSpots에 빠짐없이 존재하는지 확인
      const hasAllSpots = course.spotIds.every((csId) =>
        remainingSpots.some((s) => isSameSpot(s.id, csId))
      );

      // 코스에 속한 모든 장소가 100% 완전히 갖춰진 경우에만 코스명으로 묶음
      if (hasAllSpots) {
        const matchedSpots: RouteSpotItem[] = [];
        course.spotIds.forEach((csId) => {
          const foundIdx = remainingSpots.findIndex((s) => isSameSpot(s.id, csId));
          if (foundIdx !== -1) {
            matchedSpots.push(remainingSpots[foundIdx]);
            remainingSpots.splice(foundIdx, 1);
          }
        });

        matchedSpots.sort((a, b) => a.routeOrder - b.routeOrder);
        groups.push({
          id: course.id,
          isCourse: true,
          courseTitleKo: course.nameKo,
          courseTitleEn: course.nameEn,
          courseDescKo: course.descKo,
          courseDescEn: course.descEn,
          estimatedHours: course.estimatedHours,
          spots: matchedSpots,
        });
      }
    });

    // 2) 불완전한 코스 스팟이거나 개별 스팟들은 코스명 없이 각각의 카드로 표시
    if (remainingSpots.length > 0) {
      remainingSpots.sort((a, b) => a.routeOrder - b.routeOrder);
      groups.push({
        id: "individual_spots",
        isCourse: false,
        courseTitleKo: "",
        courseTitleEn: "",
        spots: remainingSpots,
      });
    }

    return groups;
  }, [displayedSpots, activeCity]);

  // 개별 카드 클릭 핸들러 (한번 누르면 강조, 한번 더 누르면 강조 해제)
  const handleSpotCardClick = (spot: RouteSpotItem) => {
    const isAlreadySelected = selectedSpotIds.length === 1 && selectedSpotIds[0] === spot.id;
    if (isAlreadySelected) {
      setSelectedSpotIds([]);
    } else {
      setSelectedSpotIds([spot.id]);
      if (mapInstanceRef.current && window.kakao) {
        mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(spot.lat, spot.lng));
      }
    }
  };

  // 마커 캡슐(텍스트)이 지도 외곽으로 잘리지 않도록 상하좌우 안전 여백을 포함한 Bounds 계산
  const getPaddedBounds = (spots: RouteSpotItem[], paddingRatio = 0.35) => {
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps || spots.length === 0) {
      return null;
    }

    let minLat = spots[0].lat;
    let maxLat = spots[0].lat;
    let minLng = spots[0].lng;
    let maxLng = spots[0].lng;

    spots.forEach((s) => {
      if (s.lat < minLat) minLat = s.lat;
      if (s.lat > maxLat) maxLat = s.lat;
      if (s.lng < minLng) minLng = s.lng;
      if (s.lng > maxLng) maxLng = s.lng;
    });

    // 위경도 차이 계산 (스팟들이 너무 가까울 경우를 대비한 최소 안전 범위 보정)
    const latDiff = Math.max(maxLat - minLat, 0.008);
    const lngDiff = Math.max(maxLng - minLng, 0.008);

    // 상하좌우 패딩 (가로 텍스트 말풍선 길이를 고려하여 좌우 padLng에 더 넉넉한 패딩 적용)
    const padLat = latDiff * paddingRatio;
    const padLng = lngDiff * (paddingRatio * 1.45);

    return new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(minLat - padLat, minLng - padLng),
      new window.kakao.maps.LatLng(maxLat + padLat, maxLng + padLng)
    );
  };

  // 코스 타이틀 클릭 핸들러 (코스 내 모든 관광지 일괄 강조 + 지도 Bounds 자동 조정)
  const handleCourseTitleClick = (group: RouteSpotGroup) => {
    const groupSpotIds = group.spots.map((s) => s.id);
    const isAllGroupSelected =
      groupSpotIds.length > 0 &&
      groupSpotIds.every((id) => selectedSpotIds.includes(id)) &&
      selectedSpotIds.length === groupSpotIds.length;

    if (isAllGroupSelected) {
      // 이미 해당 코스의 모든 스팟이 선택되어 있다면 전체 해제 및 전체 뷰 복귀
      setSelectedSpotIds([]);
      if (mapInstanceRef.current && window.kakao && displayedSpots.length > 0) {
        const allBounds = getPaddedBounds(displayedSpots, 0.28);
        if (allBounds) {
          mapInstanceRef.current.setBounds(allBounds);
        }
      }
    } else {
      // 해당 코스에 속한 모든 스팟을 일괄 선택 및 강조
      setSelectedSpotIds(groupSpotIds);

      // 지도 포커스: 마커 텍스트가 화면 밖으로 잘리지 않도록 안전 여백이 포함된 영역으로 맞춤
      if (mapInstanceRef.current && window.kakao && group.spots.length > 0) {
        if (group.spots.length === 1) {
          mapInstanceRef.current.panTo(
            new window.kakao.maps.LatLng(group.spots[0].lat, group.spots[0].lng)
          );
          mapInstanceRef.current.setLevel(5);
        } else {
          const paddedBounds = getPaddedBounds(group.spots, 0.38);
          if (paddedBounds) {
            mapInstanceRef.current.setBounds(paddedBounds);
          }
        }
      }
    }
  };

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

        // 커스텀 핀 오버레이 생성 (기본: 깔끔한 화이트/슬레이트 핀, 선택 시: 돋보이는 볼드 로즈 핀)
        displayedSpots.forEach((spot) => {
          const pos = new window.kakao.maps.LatLng(spot.lat, spot.lng);
          bounds.extend(pos);
          pathCoords.push(pos);

          const isSelected = selectedSpotIds.includes(spot.id);
          const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;

          const content = document.createElement("div");
          content.setAttribute("data-spot-marker", "true");
          content.setAttribute("data-spot-id", spot.id);
          content.className = "cursor-pointer transform -translate-x-1/2 -translate-y-full transition-transform duration-150 hover:scale-110";
          content.innerHTML = `
            <!-- 비선택 기본 핀 (단정하고 깔끔한 화이트/슬레이트 스타일) -->
            <div class="pin-normal" style="display: ${isSelected ? "none" : "flex"}; flex-direction: column; align-items: center;">
              <div style="display: flex; align-items: center; gap: 4px; background-color: #ffffff; color: #1e293b; padding: 2.5px 7px; border-radius: 9999px; font-weight: 700; font-size: 11px; box-shadow: 0 2px 6px rgba(0,0,0,0.14); border: 1.5px solid #cbd5e1; white-space: nowrap;">
                <span style="background: #f1f5f9; color: #475569; width: 15px; height: 15px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800;">${spot.routeOrder}</span>
                <span style="font-weight: 600;">${spotName}</span>
              </div>
              <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #cbd5e1;"></div>
            </div>

            <!-- 선택된 강조 핀 (선명한 로즈-코랄 그라데이션 + 링 글로우) -->
            <div class="pin-active" style="display: ${isSelected ? "flex" : "none"}; flex-direction: column; align-items: center;">
              <div style="display: flex; align-items: center; gap: 5px; background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: 900; font-size: 12px; box-shadow: 0 0 0 3px rgba(244,63,94,0.35), 0 6px 16px rgba(225,29,72,0.45); border: 2px solid #ffffff; white-space: nowrap;">
                <span style="background: #ffffff; color: #e11d48; width: 17px; height: 17px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900;">${spot.routeOrder}</span>
                <span style="font-weight: 900; letter-spacing: -0.2px;">${spotName}</span>
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #e11d48;"></div>
            </div>
          `;

          content.onclick = () => {
            setSelectedSpotIds((prev) => {
              if (prev.length === 1 && prev[0] === spot.id) {
                return [];
              }
              return [spot.id];
            });
            map.panTo(pos);
          };

          const overlay = new window.kakao.maps.CustomOverlay({
            position: pos,
            content,
            yAnchor: 1,
            zIndex: isSelected ? 30 : 10,
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

        // 영역 자동 조정 (마커 텍스트가 잘리지 않도록 안전 여백 Padded Bounds 적용)
        if (displayedSpots.length === 1) {
          map.setCenter(new window.kakao.maps.LatLng(displayedSpots[0].lat, displayedSpots[0].lng));
          map.setLevel(5);
        } else {
          const paddedBounds = getPaddedBounds(displayedSpots, 0.28);
          if (paddedBounds) {
            map.setBounds(paddedBounds);
          } else {
            map.setBounds(bounds);
          }
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

  // 선택된 장소들(selectedSpotIds) 변경 시 지도 위의 핀 스타일을 즉시 동기화
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const markerElements = mapContainerRef.current.querySelectorAll<HTMLElement>("[data-spot-marker]");
    markerElements.forEach((el) => {
      const spotId = el.getAttribute("data-spot-id");
      const isSel = spotId ? selectedSpotIds.includes(spotId) : false;
      const normalPin = el.querySelector<HTMLElement>(".pin-normal");
      const activePin = el.querySelector<HTMLElement>(".pin-active");
      if (normalPin && activePin) {
        normalPin.style.display = isSel ? "none" : "flex";
        activePin.style.display = isSel ? "flex" : "none";
      }
      el.style.zIndex = isSel ? "30" : "10";
    });
  }, [selectedSpotIds]);

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
                        setSelectedSpotIds([]);
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

          {/* 우측 컴팩트 카카오맵 뷰포트 */}
          <div className="flex-1 min-w-0">
            <div className="relative w-full h-80 sm:h-96 md:h-[410px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-inner">
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

        {/* 5. Optimized Sequence Timeline List (스팟별 카드 - 추천 코스별 타이틀 결합) */}
        {displayedSpots.length > 0 ? (
          <div className="space-y-6 pt-2">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-500">
                {spotGroups.some((g) => g.isCourse)
                  ? (locale === "ko"
                    ? "코스 타이틀을 클릭하면 코스 전체가, 카드를 클릭하면 해당 장소가 지도에서 강조됩니다."
                    : "Click a course title to highlight the entire route, or click a card to focus on a spot.")
                  : (locale === "ko"
                    ? "카드를 클릭하면 지도에서 해당 위치로 이동합니다."
                    : "Click a card to focus on the map location.")}
              </span>
            </div>

            {spotGroups.map((group) => {
              const groupSpotIds = group.spots.map((s) => s.id);
              const isGroupActive =
                groupSpotIds.length > 0 &&
                groupSpotIds.every((id) => selectedSpotIds.includes(id)) &&
                selectedSpotIds.length === groupSpotIds.length;
              const title = locale === "ko" ? group.courseTitleKo : group.courseTitleEn;
              const desc = locale === "ko" ? group.courseDescKo : group.courseDescEn;

              return (
                <div key={group.id} className="space-y-3">
                  {/* 코스 타이틀 헤더 바 (코스 명만 남기고 모두 제거) */}
                  {title && (
                    <div
                      onClick={() => handleCourseTitleClick(group)}
                      className={`w-fit py-1.5 px-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isGroupActive
                          ? "bg-rose-50/90 border-rose-400 text-rose-950 ring-2 ring-rose-300/60 shadow-xs"
                          : "bg-slate-50/90 border-slate-200/90 text-slate-800 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                      title={locale === "ko" ? "클릭 시 지도에서 코스 전체 강조 / 해제" : "Click to toggle course highlight on map"}
                    >
                      <h4 className="text-sm sm:text-base font-black tracking-tight">
                        {title}
                      </h4>
                    </div>
                  )}

                  {/* 카드 그리드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.spots.map((spot) => {
                      const isSelected = selectedSpotIds.includes(spot.id);
                      const isSingleSelected = isSelected && selectedSpotIds.length === 1;
                      const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;
                      const spotDesc = locale === "ko" ? spot.descKo : spot.descEn;
                      const directLink = getKakaoMapDirectLink(spotName, spot.lat, spot.lng);

                      return (
                        <div
                          key={spot.id}
                          onClick={() => handleSpotCardClick(spot)}
                          className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 ${
                            isSelected
                              ? "bg-rose-50/70 border-rose-500 ring-2 ring-rose-400/50 shadow-md shadow-rose-500/10 -translate-y-0.5"
                              : "bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:shadow-2xs"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-rose-500 text-white shadow-xs ring-2 ring-rose-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {spot.routeOrder}
                                </span>
                                <h4
                                  className={`text-xs sm:text-sm truncate transition-colors ${
                                    isSelected
                                      ? "font-black text-rose-950"
                                      : "font-bold text-slate-800"
                                  }`}
                                  title={spotName}
                                >
                                  {spotName}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {isSingleSelected && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-500 text-white shadow-2xs">
                                    {locale === "ko" ? "선택됨" : "Focused"}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {spot.categoryType || (locale === "ko" ? "명소" : "Spot")}
                                </span>
                              </div>
                            </div>

                            {spot.subwayInfo && (
                              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                                <span className="text-[10px]">🚇</span>
                                <span className="truncate">{formatTransitInfo(spot.subwayInfo, locale)}</span>
                              </p>
                            )}

                            {spotDesc && (
                              <p
                                className={`text-[11px] line-clamp-2 leading-relaxed ${
                                  isSelected ? "text-slate-600 font-medium" : "text-slate-500"
                                }`}
                              >
                                {spotDesc}
                              </p>
                            )}
                          </div>

                          {/* Bottom Action */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span
                              className={`font-extrabold tabular-nums ${
                                isSelected ? "text-rose-900" : "text-slate-700"
                              }`}
                            >
                              {spot.price > 0
                                ? formatPriceByLocale(spot.price, locale, usdRate)
                                : (locale === "ko" ? "무료 입장" : "Free Entry")}
                            </span>

                            <a
                              href={directLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-1 font-extrabold transition-colors ${
                                isSelected
                                  ? "text-rose-600 hover:text-rose-800"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
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
              );
            })}
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
