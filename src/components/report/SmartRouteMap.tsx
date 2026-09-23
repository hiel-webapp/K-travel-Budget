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
  SEOUL_LANDMARK_BILINGUAL_MAP,
} from "src/features/budget/catalog/attraction-spots";
import {
  THEME_ACTIVITIES_CATALOG,
  getRelatedThemeActivity,
  getAllThemeActivities,
  type ThemeActivityItem,
} from "src/features/budget/catalog/theme-activities";
import {
  getSpotCoordinates,
  optimizeSpotSequence,
  getKakaoMapDirectLink,
  LatLng,
} from "src/lib/map/spot-coordinates";
import { formatPriceByLocale } from "src/lib/currency/currency-converter";
import { formatTransitInfo } from "src/lib/places/place-localization";

function getActivityEmoji(actId?: string, nameKo?: string): string {
  if (!actId && !nameKo) return "✨";
  const id = (actId || "").toLowerCase();
  const name = (nameKo || "").toLowerCase();
  if (id.includes("hanbok") || name.includes("한복")) return "👘";
  if (id.includes("gyobok") || name.includes("교복")) return "🎒";
  if (id.includes("cruise") || id.includes("yacht") || name.includes("요트") || name.includes("크루즈")) return "⛵";
  if (id.includes("tea") || name.includes("다도")) return "🍵";
  if (id.includes("tower") || id.includes("cable") || name.includes("케이블카")) return "🚡";
  if (id.includes("color") || name.includes("퍼스널컬러")) return "🎨";
  if (id.includes("cooking") || name.includes("쿠킹") || name.includes("요리")) return "🍳";
  if (id.includes("beauty") || id.includes("spa") || name.includes("스파")) return "💆";
  if (id.includes("surf") || name.includes("서핑")) return "🏄";
  return "✨";
}

/**
 * 관광 카드의 선택 상태 및 코스 순번(routeOrder)에 따른 동적 Z-Index 계산
 * - 단일 스팟 선택 시: 999 (무조건 모든 마커 중 최상단)
 * - 코스 전체/다중 선택 시: 200 - routeOrder (1번이 2번보다 위, 순서대로 차례차례 노출)
 * - 기본 미선택 상태: 100 - routeOrder (기본 순번대로 자연스럽게 위계 형성)
 * - 기타 비활성 마커: 10 (가장 아래)
 */
function getSpotZIndex(spotId: string, routeOrder: number, selectedSpotIds: string[]): number {
  const isSelected = selectedSpotIds.includes(spotId);
  const isSingle = selectedSpotIds.length === 1 && selectedSpotIds[0] === spotId;

  // 1. 단일 스팟이 강조된 경우 -> 무조건 최상단 999
  if (isSingle) {
    return 999;
  }

  // 2. 코스 전체가 선택되었거나 다중 선택된 경우 -> 선택된 것들은 순번대로 (1번이 가장 위: 200 - routeOrder)
  if (selectedSpotIds.length > 1 && isSelected) {
    return 200 - routeOrder;
  }

  // 3. 아무것도 선택되지 않았을 때도 기본적으로 1번부터 차례대로 위에 정돈 (100 - routeOrder)
  if (selectedSpotIds.length === 0) {
    return 100 - routeOrder;
  }

  // 4. 다른 것이 선택되어 비활성화된 스팟 -> 가장 아래 10
  return 10;
}

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

  // 사용자가 바스켓에 담은 스팟 (테마 액티비티/체험은 지리적 명소 경로 지도에서 제외)
  const userRawSpots = useMemo(() => {
    const list = cityBreakdown[activeCity]?.selectedSpots || [];
    return list.filter(
      (s) => !s.id.startsWith("act_") && !THEME_ACTIVITIES_CATALOG.some((a) => isSameSpot(a.id, s.id))
    );
  }, [cityBreakdown, activeCity]);

  // 사용자가 신청한 연계 K-체험 목록 (도시별)
  const selectedThemeActivities = useMemo(() => {
    const allSelected = cityBreakdown[activeCity]?.selectedSpots || [];
    const actCatalog = getAllThemeActivities();
    return allSelected.filter(
      (s) => s.id.startsWith("act_") || actCatalog.some((a) => isSameSpot(a.id, s.id))
    );
  }, [cityBreakdown, activeCity]);

  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);
  const [previewSpot, setPreviewSpot] = useState<RouteSpotItem | null>(null);
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
          content.setAttribute("data-route-order", String(spot.routeOrder));
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

          const calculatedZ = getSpotZIndex(spot.id, spot.routeOrder, selectedSpotIds);

          const overlay = new window.kakao.maps.CustomOverlay({
            position: pos,
            content,
            yAnchor: 1,
            zIndex: calculatedZ,
          });

          (overlay as any).spotId = spot.id;
          (overlay as any).routeOrder = spot.routeOrder;

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

  // 선택된 장소들(selectedSpotIds) 변경 시 지도 위의 핀 스타일 및 zIndex를 즉시 동기화
  useEffect(() => {
    // 1. 카카오맵 SDK CustomOverlay 객체의 zIndex 업데이트
    if (overlaysRef.current && overlaysRef.current.length > 0) {
      overlaysRef.current.forEach((overlay) => {
        const spotId = (overlay as any).spotId;
        const routeOrder = (overlay as any).routeOrder || 1;
        if (spotId && typeof overlay.setZIndex === "function") {
          const z = getSpotZIndex(spotId, routeOrder, selectedSpotIds);
          overlay.setZIndex(z);
        }
      });
    }

    // 2. DOM 요소의 핀 스타일(normal vs active) 및 zIndex & 부모 래퍼 zIndex 업데이트
    if (!mapContainerRef.current) return;
    const markerElements = mapContainerRef.current.querySelectorAll<HTMLElement>("[data-spot-marker]");
    markerElements.forEach((el) => {
      const spotId = el.getAttribute("data-spot-id");
      const routeOrder = parseInt(el.getAttribute("data-route-order") || "1", 10);
      const isSel = spotId ? selectedSpotIds.includes(spotId) : false;
      const normalPin = el.querySelector<HTMLElement>(".pin-normal");
      const activePin = el.querySelector<HTMLElement>(".pin-active");
      if (normalPin && activePin) {
        normalPin.style.display = isSel ? "none" : "flex";
        activePin.style.display = isSel ? "flex" : "none";
      }

      if (spotId) {
        const z = getSpotZIndex(spotId, routeOrder, selectedSpotIds);
        el.style.zIndex = String(z);
        if (el.parentElement) {
          el.parentElement.style.zIndex = String(z);
        }
      }
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

  // 단일 선택된 스팟 정보 (있을 경우 해당 스팟으로 길찾기 동적 연결)
  const singleSelectedSpot = useMemo(() => {
    if (selectedSpotIds.length === 1) {
      return displayedSpots.find((s) => s.id === selectedSpotIds[0]);
    }
    return null;
  }, [selectedSpotIds, displayedSpots]);

  const activeKakaoRouteLink = useMemo(() => {
    if (singleSelectedSpot) {
      return getKakaoMapDirectLink(
        locale === "ko" ? singleSelectedSpot.nameKo : singleSelectedSpot.nameEn,
        singleSelectedSpot.lat,
        singleSelectedSpot.lng
      );
    }
    return fullRouteLink;
  }, [singleSelectedSpot, fullRouteLink, locale]);

  const activeKakaoButtonText = useMemo(() => {
    if (singleSelectedSpot) {
      const name = locale === "ko" ? singleSelectedSpot.nameKo : singleSelectedSpot.nameEn;
      return locale === "ko" ? `${name} 길찾기` : `${name} Route`;
    }
    return locale === "ko" ? "카카오맵 길찾기" : "Kakao Map Route";
  }, [singleSelectedSpot, locale]);

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
                  href={activeKakaoRouteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs transition-all shadow-2xs cursor-pointer text-center"
                  title={activeKakaoButtonText}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.708 4.8 4.27 6.054l-.865 3.186c-.078.287.213.522.46.368l3.77-2.35c.446.04.9.057 1.365.057 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                  </svg>
                  <span className="truncate">{activeKakaoButtonText}</span>
                  <span className="text-[10px] shrink-0">↗</span>
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
              // 이 코스에 속한 장소들 중 사용자가 신청한 연계 체험 추출 (중복 제거)
              const courseLinkedActivities: ThemeActivityItem[] = [];
              const seenActIds = new Set<string>();
              if (group.isCourse) {
                group.spots.forEach((sp) => {
                  const act = getRelatedThemeActivity(sp.id, sp.nameKo);
                  if (act && !seenActIds.has(act.id) && selectedThemeActivities.some((a) => isSameSpot(a.id, act.id))) {
                    seenActIds.add(act.id);
                    courseLinkedActivities.push(act);
                  }
                });
              }

              return (
                <div key={group.id} className="space-y-3">
                  {/* 코스 타이틀 헤더 바 (코스명 + 우측 연계 체험 뱃지) */}
                  {title && (
                    <div className="flex flex-wrap items-center gap-2">
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

                      {/* 연계 체험 뱃지 (코스명 우측) */}
                      {courseLinkedActivities.map((act) => {
                        const actEmoji = getActivityEmoji(act.id, act.nameKo);
                        const actName = locale === "ko" ? act.nameKo : act.nameEn;
                        return (
                          <div
                            key={act.id}
                            className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl border border-purple-200/80 bg-purple-50/90 text-purple-900 shadow-2xs select-none"
                            title={locale === "ko" ? `${actName} 신청 포함` : `${actName} Included`}
                          >
                            <span className="text-xs">{actEmoji}</span>
                            <span className="text-xs font-black tracking-tight">
                              {locale === "ko" ? `연계 체험: ${actName} 포함` : `Linked: ${actName}`}
                            </span>
                          </div>
                        );
                      })}
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

                      // 이 개별 관광지에 신청된 연계 K-체험 확인
                      const spotLinkedAct = getRelatedThemeActivity(spot.id, spot.nameKo);
                      const isActApplied = Boolean(
                        spotLinkedAct && selectedThemeActivities.some((a) => isSameSpot(a.id, spotLinkedAct.id))
                      );

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
                                  className={`text-xs sm:text-sm truncate transition-colors flex items-center gap-1.5 ${
                                    isSelected
                                      ? "font-black text-rose-950"
                                      : "font-bold text-slate-800"
                                  }`}
                                  title={spotName}
                                >
                                  <span className="truncate">{spotName}</span>
                                  {isActApplied && spotLinkedAct && (
                                    <span
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-purple-100/90 text-[13px] leading-none shrink-0 shadow-2xs border border-purple-200/60 cursor-help"
                                      title={locale === "ko" ? `${spotLinkedAct.nameKo} 신청됨` : `${spotLinkedAct.nameEn} Applied`}
                                    >
                                      {getActivityEmoji(spotLinkedAct.id, spotLinkedAct.nameKo)}
                                    </span>
                                  )}
                                </h4>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {spot.categoryType || (locale === "ko" ? "명소" : "Spot")}
                              </span>
                            </div>

                            {spot.subwayInfo && (
                              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                                <span className="text-[10px]">🚇</span>
                                <span className="truncate">{formatTransitInfo(spot.subwayInfo, locale)}</span>
                              </p>
                            )}
                          </div>

                          {/* 하단 영역: [상세보기] (좌측)                무료 입장 / 요금 (우측) */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewSpot(spot);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors border border-slate-200/80 cursor-pointer shadow-2xs"
                            >
                              <span>{locale === "ko" ? "상세보기" : "Details"}</span>
                            </button>

                            <span
                              className={`font-black tabular-nums whitespace-nowrap text-right ${
                                spot.price === 0
                                  ? "text-emerald-600"
                                  : isSelected
                                  ? "text-rose-900"
                                  : "text-slate-900"
                              }`}
                            >
                              {spot.price > 0
                                ? formatPriceByLocale(spot.price, locale, usdRate)
                                : (locale === "ko" ? "무료 입장" : "Free Entry")}
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

      {/* 6. 관광지 상세 정보 팝업 모달 (플래너와 동일 규격) */}
      {previewSpot && (() => {
        const spotKey = previewSpot.id.replace(/^kto_/, "");
        const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[spotKey];
        const catalogSpot = ATTRACTION_SPOTS_CATALOG.find((s) => isSameSpot(s.id, previewSpot.id));

        const name = locale === "ko" ? (previewSpot.nameKo || bilingual?.nameKo) : (previewSpot.nameEn || bilingual?.nameEn);
        const desc = locale === "ko"
          ? (catalogSpot?.descKo || previewSpot.descKo || bilingual?.descKo || previewSpot.descEn)
          : (catalogSpot?.descEn || previewSpot.descEn || bilingual?.descEn || previewSpot.descKo);
        const subway = locale === "ko"
          ? (catalogSpot?.subwayInfoKo || previewSpot.subwayInfo || bilingual?.subwayKo)
          : (catalogSpot?.subwayInfoEn || previewSpot.subwayInfo || bilingual?.subwayEn);
        const hours = locale === "ko"
          ? (catalogSpot?.openingHoursKo || bilingual?.hoursKo)
          : (catalogSpot?.openingHoursEn || bilingual?.hoursEn);
        const closed = locale === "ko"
          ? (catalogSpot?.closedDaysKo || bilingual?.closedKo)
          : (catalogSpot?.closedDaysEn || bilingual?.closedEn);

        const hasImage = Boolean(catalogSpot?.imageUrl && catalogSpot.imageUrl !== "/assets/default-place.jpg");
        const imageUrl = catalogSpot?.imageUrl;
        const directKakaoLink = getKakaoMapDirectLink(name, previewSpot.lat, previewSpot.lng);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setPreviewSpot(null)}
          >
            <div
              className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Header with Gradient & Title */}
              <div className="relative w-full h-56 sm:h-64 bg-slate-900 shrink-0">
                {hasImage && imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-slate-800 to-indigo-900 flex items-center justify-center">
                    <span className="text-xl font-black text-white/40 tracking-wider">SPOT</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 pointer-events-none" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewSpot(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer text-lg font-bold z-10 shadow-sm"
                  title={locale === "ko" ? "닫기" : "Close"}
                >
                  ✕
                </button>

                {/* Price & Category badges */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap">
                  {(() => {
                    const cat = previewSpot.categoryType || catalogSpot?.categoryType || bilingual?.categoryType;
                    if (!cat) return null;
                    const badgeConfig = {
                      명소: { bg: "bg-blue-600/90 text-white", labelKo: "명소", labelEn: "Landmark" },
                      자연: { bg: "bg-emerald-600/90 text-white", labelKo: "자연", labelEn: "Nature" },
                      엔터: { bg: "bg-purple-600/90 text-white", labelKo: "엔터", labelEn: "Enter" },
                      쇼핑: { bg: "bg-amber-600/90 text-white", labelKo: "쇼핑", labelEn: "Shopping" },
                    }[cat as "명소" | "자연" | "엔터" | "쇼핑"];
                    if (!badgeConfig) return null;
                    return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 ${badgeConfig.bg}`}>
                        <span>{locale === "ko" ? badgeConfig.labelKo : badgeConfig.labelEn}</span>
                      </span>
                    );
                  })()}

                  {catalogSpot?.isFeatured && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md flex items-center gap-1">
                      <span>★ {locale === "ko" ? "추천 명소" : "Must-Visit"}</span>
                    </span>
                  )}
                </div>

                {/* Title on bottom of image */}
                <div className="absolute bottom-4 left-5 right-5 text-white z-10">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                    {name}
                  </h3>
                </div>
              </div>

              {/* Modal Body Content (Scrollable) */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                {desc && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {locale === "ko" ? "관광지 소개" : "About"}
                    </h4>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                      {desc}
                    </p>
                  </div>
                )}

                {/* Key Visitor Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                        {locale === "ko" ? "입장료 / 요금" : "Admission Fee"}
                      </span>
                      <span className="text-[#e25c5c] font-black">
                        {previewSpot.price > 0
                          ? formatPriceByLocale(previewSpot.price, locale, usdRate)
                          : (locale === "ko" ? "무료 입장" : "Free Admission")}
                      </span>
                    </div>
                  </div>
                  {subway && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <div>
                        <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                          {locale === "ko" ? "지하철 / 대중교통" : "Transit"}
                        </span>
                        <span className="text-slate-600">{subway}</span>
                      </div>
                    </div>
                  )}
                  {closed && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <div>
                        <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                          {locale === "ko" ? "휴무일" : "Closed Days"}
                        </span>
                        <span className="text-slate-600">{closed}</span>
                      </div>
                    </div>
                  )}
                  {hours && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 sm:col-span-2">
                      <div>
                        <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                          {locale === "ko" ? "운영시간" : "Opening Hours"}
                        </span>
                        <span className="text-slate-600">{hours}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
                <a
                  href={directKakaoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs transition-all shadow-2xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.708 4.8 4.27 6.054l-.865 3.186c-.078.287.213.522.46.368l3.77-2.35c.446.04.9.057 1.365.057 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                  </svg>
                  <span>{locale === "ko" ? "카카오맵 길찾기" : "Kakao Map"}</span>
                  <span className="text-[10px]">↗</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewSpot(null)}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
                >
                  {locale === "ko" ? "닫기" : "Close"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
