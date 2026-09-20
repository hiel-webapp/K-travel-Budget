"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { Locale } from "../lib/i18n/locales";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import { SupportedCity, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "../lib/trip-domain";
import {
  AttractionSpot,
  TOUR_COURSE_PRESETS,
  SEOUL_LANDMARK_BILINGUAL_MAP,
  isSameSpot,
  normalizeSpotKey,
} from "../features/budget/catalog/attraction-spots";
import {
  THEME_ACTIVITIES_CATALOG,
  themeActivityToAttractionSpot,
  ThemeActivityItem,
  getRelatedThemeActivity,
  getAllThemeActivities,
  registerCustomThemeActivities,
  PALACE_HANBOK_FREE_SPOT_IDS,
  isPalaceFreeSpot,
  isHanbokActivityId,
} from "../features/budget/catalog/theme-activities";
import { formatKrw } from "../features/budget/presentation/formatters";
import { useExchangeRate } from "../lib/hooks/useExchangeRate";
import { formatPriceByLocale } from "../lib/currency/currency-converter";

export interface AttractionPlannerPanelProps {
  city: SupportedCity;
  locale: Locale;
  dict: Dictionary;
  adultCount: number;
  selectedSpotKeys: Set<string>;
  selectedCourseIds: string[];
  individualSpotIds: string[];
  onToggleSpot: (city: SupportedCity, spotId: string) => void;
  onClearCitySpots: (city: SupportedCity) => void;
  onPreviewSpot: (spot: AttractionSpot) => void;
  baseSpotsForCity: AttractionSpot[];
  customAttractionPlaces: AttractionSpot[];
  isLoading?: boolean;
  onAddCustomSpot?: (city: SupportedCity, name: string, priceKrw: number) => void;
  hideHeader?: boolean;
}

export default function AttractionPlannerPanel({
  city,
  locale,
  dict,
  adultCount,
  selectedSpotKeys,
  selectedCourseIds,
  individualSpotIds,
  onToggleSpot,
  onClearCitySpots,
  onPreviewSpot,
  baseSpotsForCity,
  customAttractionPlaces,
  isLoading = false,
  onAddCustomSpot,
  hideHeader = false,
}: AttractionPlannerPanelProps) {
  const { usdRate } = useExchangeRate();
  const [activeSubTab, setActiveSubTab] = useState<"CITY" | "BASKET">("CITY");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // 커스텀 명소 직접 추가 폼 상태
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<string>("");

  const [dynamicActivities, setDynamicActivities] = useState<ThemeActivityItem[]>(() => getAllThemeActivities());

  // 관리자 / Supabase 실시간 동적 K-체험 카탈로그 로드
  useEffect(() => {
    fetch("/api/admin/catalog?type=THEME_ACTIVITY")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.activities) && data.activities.length > 0) {
          registerCustomThemeActivities(data.activities);
          setDynamicActivities(data.activities);
        }
      })
      .catch(() => {});
  }, []);

  // 개별 관광지 카드별 독립 3D 플립 상태 및 10초 타이머 관리
  const [flippedCards, setFlippedCards] = useState<Record<string, { activity: ThemeActivityItem; spotName: string }>>({});
  const flipTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const unflipCard = useCallback((spotId: string) => {
    if (flipTimersRef.current[spotId]) {
      clearTimeout(flipTimersRef.current[spotId]);
      delete flipTimersRef.current[spotId];
    }
    setFlippedCards((prev) => {
      if (!prev[spotId]) return prev;
      const next = { ...prev };
      delete next[spotId];
      return next;
    });
  }, []);

  const flipCard = useCallback((spotId: string, spotName: string, activity: ThemeActivityItem) => {
    if (flipTimersRef.current[spotId]) {
      clearTimeout(flipTimersRef.current[spotId]);
    }
    setFlippedCards((prev) => ({ ...prev, [spotId]: { activity, spotName } }));
    // 10초 동안 노출 후 원래 앞면으로 자동 복귀
    flipTimersRef.current[spotId] = setTimeout(() => {
      unflipCard(spotId);
    }, 10000);
  }, [unflipCard]);

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(flipTimersRef.current).forEach((timer) => clearTimeout(timer));
      flipTimersRef.current = {};
    };
  }, []);

  // 명소 클릭 시 원클릭 담기 + 연계 K-체험 카드 3D 플립 애니메이션 트리거
  const handleToggleSpotWithActivityPrompt = (spotId: string, spotName: string) => {
    const isCurrentlySelected =
      individualSpotIds.some((sid) => isSameSpot(sid, spotId)) ||
      selectedCourseIds.some((cid) => {
        const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
        return course?.spotIds.some((sid) => isSameSpot(sid, spotId));
      });

    // 1. 기존 명소 토글 실행 (100% 즉시 반영, 딜레이 0)
    onToggleSpot(city, spotId);

    // 2. '담기'로 변경되는 순간 연계 액티비티가 있고 아직 담기지 않은 경우 해당 카드만 10초간 뒤집기
    if (!isCurrentlySelected) {
      const relatedAct = getRelatedThemeActivity(spotId, spotName);
      if (relatedAct && !selectedSpotKeys.has(normalizeSpotKey(relatedAct.id))) {
        flipCard(spotId, spotName, relatedAct);
      } else {
        unflipCard(spotId);
      }
    } else {
      // 담기 취소 시 뒤집힘 해제
      unflipCard(spotId);
    }
  };

  const handleAddLinkedActivity = (spotId: string, activity: ThemeActivityItem) => {
    onToggleSpot(city, activity.id);
    unflipCard(spotId);
  };

  // 1. 도시 대표 명소 목록 병합 및 추천(isFeatured) 우선 정렬
  // 추천 항목은 최상단에 위치하며, 추천 해제 시 본래 순서(sortOrder / ㄱㄴㄷ 순)로 복귀합니다.
  const spotsForCity = useMemo(() => {
    const combined = [...customAttractionPlaces, ...baseSpotsForCity];
    return combined.sort((a, b) => {
      const aFeat = !!a.isFeatured;
      const bFeat = !!b.isFeatured;
      if (aFeat && !bFeat) return -1;
      if (!aFeat && bFeat) return 1;
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    });
  }, [customAttractionPlaces, baseSpotsForCity]);

  // 2. 현재 도시의 K-테마 액티비티 목록
  const themeActivitiesForCity = useMemo(() => {
    return dynamicActivities
      .filter((act) => act.cityCode === city && act.isActive !== false)
      .map((act) => ({
        activity: act,
        spot: themeActivityToAttractionSpot(act),
      }));
  }, [city, dynamicActivities]);

  // 3. 현재 도시에서 선택된 모든 스팟 목록 (바스켓 아이템)
  const selectedSpotsInCity = useMemo(() => {
    const list: AttractionSpot[] = [];
    const seen = new Set<string>();

    const candidateSpots = [
      ...spotsForCity,
      ...themeActivitiesForCity.map((t) => t.spot),
    ];

    candidateSpots.forEach((s) => {
      const normKey = normalizeSpotKey(s.id);
      if (selectedSpotKeys.has(normKey) && !seen.has(normKey)) {
        seen.add(normKey);
        list.push(s);
      }
    });

    return list;
  }, [spotsForCity, themeActivitiesForCity, selectedSpotKeys]);

  // 서울 한복 대여 선택 여부 감지 (경복궁, 창덕궁, 창경궁, 덕수궁 무료 입장 연동)
  const isHanbokRentalSelected = useMemo(() => {
    return city === "SEOUL" && Array.from(selectedSpotKeys).some((k) => isHanbokActivityId(k));
  }, [city, selectedSpotKeys]);

  // 4. 바스켓 통계 요약 (무료/유료 개수 및 총 입장료)
  const basketSummary = useMemo(() => {
    let freeCount = 0;
    let paidCount = 0;
    let totalPerPersonKrw = 0;
    let hanbokSavingsPerPersonKrw = 0;

    selectedSpotsInCity.forEach((spot) => {
      const isPalaceFree =
        isHanbokRentalSelected &&
        isPalaceFreeSpot(spot.id, spot.nameKo);

      if (isPalaceFree) {
        freeCount += 1;
        hanbokSavingsPerPersonKrw += spot.price;
      } else if (spot.priceStatus === "FREE" || spot.price === 0) {
        freeCount += 1;
      } else {
        paidCount += 1;
        totalPerPersonKrw += spot.price;
      }
    });

    const grandTotalKrw = totalPerPersonKrw * adultCount;
    const totalSavingsKrw = hanbokSavingsPerPersonKrw * adultCount;

    return {
      totalCount: selectedSpotsInCity.length,
      freeCount,
      paidCount,
      totalPerPersonKrw,
      grandTotalKrw,
      totalSavingsKrw,
      hasHanbokSavings: totalSavingsKrw > 0,
    };
  }, [selectedSpotsInCity, adultCount, isHanbokRentalSelected]);

  // 5. 도시 대표 명소 필터링
  const effectiveCatFilter = categoryFilter === "SAVED_ONLY" && selectedSpotKeys.size === 0 ? "ALL" : categoryFilter;
  const filteredSpotsForCity = useMemo(() => {
    if (effectiveCatFilter === "SAVED_ONLY") {
      return spotsForCity.filter((s) => selectedSpotKeys.has(normalizeSpotKey(s.id)));
    }
    if (effectiveCatFilter === "FEATURED_ONLY") {
      return spotsForCity.filter((s) => s.isFeatured);
    }
    if (effectiveCatFilter === "ALL") {
      return spotsForCity;
    }
    return spotsForCity.filter((s) => {
      const spotKey = s.id.replace(/^kto_/, "");
      const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[spotKey];
      const cat = s.categoryType || bilingual?.categoryType;
      return cat === effectiveCatFilter;
    });
  }, [spotsForCity, effectiveCatFilter, selectedSpotKeys]);

  const displayedSpots = useMemo(() => {
    return filteredSpotsForCity.slice(0, visibleCount);
  }, [filteredSpotsForCity, visibleCount]);

  // 커스텀 장소 추가 제출 핸들러
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const priceNum = Math.max(0, parseInt(customPrice.replace(/[^0-9]/g, "") || "0", 10));
    if (onAddCustomSpot) {
      onAddCustomSpot(city, customName.trim(), priceNum);
    }
    setCustomName("");
    setCustomPrice("");
    setIsCustomOpen(false);
  };

  const cityName = locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city);

  return (
    <div className="w-full space-y-5">
      <style>{`
        @keyframes flipTimerShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {/* 1. 관광 바스켓 요약 바 (Top Summary Bar: Food/Stay 플래너와 100% 동일한 위계 및 디자인 규격) */}
      {!hideHeader && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#0f172a] tracking-tight">
                  {cityName} {locale === "ko" ? "관광 바스켓" : "Attraction Basket"}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {locale === "ko"
                  ? "방문하고 싶은 명소와 K-체험을 자유롭게 담으면 총 입장료가 자동으로 계산됩니다."
                  : "Add attractions and activities. Total admission budget auto-calculates for your group."}
              </p>
            </div>

            {/* 총 관광비 표시 (우측 정렬) */}
            <div className="text-right flex items-baseline sm:flex-col sm:items-end justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-400">
                {locale === "ko" ? `${cityName} 예상 관광비 (${adultCount}인)` : `${cityName} Attraction Budget (${adultCount}p)`}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#e25c5c] tracking-tight">
                {formatPriceByLocale(basketSummary.grandTotalKrw, locale, usdRate)}
              </span>
            </div>
          </div>

          {/* 담은 명소 상태 & 프로그레스 바 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5 flex-wrap">
                <span>{locale === "ko" ? "담은 명소·체험:" : "Selected Spots:"}</span>
                <span className="font-black text-emerald-600">
                  {basketSummary.totalCount}{locale === "ko" ? "곳 담김" : " items"}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({locale === "ko" ? "무료" : "Free"} {basketSummary.freeCount}{locale === "ko" ? "곳" : ""} · {locale === "ko" ? "유료" : "Paid"} {basketSummary.paidCount}{locale === "ko" ? "곳" : ""}
                  {adultCount > 1 && basketSummary.totalPerPersonKrw > 0 ? (locale === "ko" ? ` · 1인 ${formatKrw(basketSummary.totalPerPersonKrw)}` : ` · 1p ${formatPriceByLocale(basketSummary.totalPerPersonKrw, locale, usdRate)}`) : ""})
                </span>
              </span>

              {/* 바스켓 비우기 액션 */}
              {basketSummary.totalCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(dict.planner.clearAttractionBasketConfirm || "현재 도시의 담은 명소를 모두 비우시겠습니까?")) {
                      onClearCitySpots(city);
                    }
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer underline"
                >
                  {dict.planner.clearAttractionBasket || "바스켓 비우기"}
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  basketSummary.totalCount === 0
                    ? "bg-slate-300"
                    : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(100, basketSummary.totalCount > 0 ? Math.max(15, basketSummary.totalCount * 20) : 0)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. 네비게이션 탭 (도시 대표 명소 / K-테마 액티비티 / 담은 바스켓: FoodPlanner와 100% 동일) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* 도시 대표 명소 탭 */}
          <button
            type="button"
            onClick={() => setActiveSubTab("CITY")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "CITY"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>{cityName} {locale === "ko" ? "대표 명소" : "Attractions"}</span>
          </button>

          {/* 담은 바스켓 탭 */}
          <button
            type="button"
            onClick={() => setActiveSubTab("BASKET")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "BASKET"
                ? "bg-[#e25c5c] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>{locale === "ko" ? "담은 바스켓" : "My Basket"}</span>
            <span
              className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === "BASKET"
                  ? "bg-white/25 text-white"
                  : basketSummary.totalCount > 0
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {basketSummary.totalCount}
            </span>
          </button>
        </div>

        {/* 한복 무료 입장 혜택 알림 뱃지 */}
        {basketSummary.hasHanbokSavings && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold animate-fade-in shadow-2xs">
            <span className="text-sm">👘</span>
            <span>
              {locale === "ko"
                ? `한복 착용 궁궐 무료 입장 (-${formatPriceByLocale(basketSummary.totalSavingsKrw, locale, usdRate)} 절감)`
                : `Hanbok Palace Free Pass (-${formatPriceByLocale(basketSummary.totalSavingsKrw, locale, usdRate)})`}
            </span>
          </div>
        )}
      </div>

      {/* 3. 서브탭별 본문 */}

      {/* ================= SUBTAB 1: 도시 대표 명소 ================= */}
      {activeSubTab === "CITY" && (
        <div className="space-y-4">
          <div className="min-h-[36px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {cityName} {locale === "ko" ? "대표 명소 리스트" : "Attractions List"}
              </h4>
            </div>

            {/* 카테고리 필터 태그 (FoodPlanner NATIONAL 탭과 동일 규격) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { key: "ALL", labelKo: "전체", labelEn: "All" },
                { key: "FEATURED_ONLY", labelKo: "★ 추천", labelEn: "★ Must-Visit" },
                ...(selectedSpotKeys.size > 0
                  ? [
                      {
                        key: "SAVED_ONLY",
                        labelKo: `담은 항목 (${selectedSpotKeys.size})`,
                        labelEn: `Saved (${selectedSpotKeys.size})`,
                      },
                    ]
                  : []),
                { key: "명소", labelKo: "명소", labelEn: "Landmark" },
                { key: "자연", labelKo: "자연", labelEn: "Nature" },
                { key: "엔터", labelKo: "엔터", labelEn: "Enter" },
                { key: "쇼핑", labelKo: "쇼핑", labelEn: "Shopping" },
              ].map((tab) => {
                const isActive = effectiveCatFilter === tab.key;
                const isSavedTab = tab.key === "SAVED_ONLY";
                const isFeaturedTab = tab.key === "FEATURED_ONLY";
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCategoryFilter(tab.key)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? isFeaturedTab
                          ? "bg-rose-600 text-white shadow-xs"
                          : isSavedTab
                          ? "bg-rose-500 text-white shadow-xs"
                          : "bg-slate-900 text-white shadow-xs"
                        : isFeaturedTab
                          ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          : isSavedTab
                          ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    }`}
                  >
                    <span>{locale === "ko" ? tab.labelKo : tab.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 스팟 카드 그리드: FoodItemCard 규격과 100% 동일 */}
          {isLoading && displayedSpots.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="h-56 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedSpots.map((rawSpot) => {
                const spotKey = rawSpot.id.replace(/^kto_/, "");
                const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[spotKey];

                const name = locale === "ko" ? (rawSpot.nameKo || bilingual?.nameKo) : (rawSpot.nameEn || bilingual?.nameEn);
                const desc = locale === "ko"
                  ? (rawSpot.descKo || bilingual?.descKo || rawSpot.descEn)
                  : (rawSpot.descEn || bilingual?.descEn || rawSpot.descKo);
                const subway = locale === "ko"
                  ? (rawSpot.subwayInfoKo || rawSpot.subwayInfo || bilingual?.subwayKo)
                  : (rawSpot.subwayInfoEn || rawSpot.subwayInfo || bilingual?.subwayEn);
                const hours = locale === "ko"
                  ? (rawSpot.openingHoursKo || rawSpot.openingHours || bilingual?.hoursKo)
                  : (rawSpot.openingHoursEn || rawSpot.openingHours || bilingual?.hoursEn);
                const closed = locale === "ko"
                  ? (rawSpot.closedDaysKo || rawSpot.closedDays || bilingual?.closedKo)
                  : (rawSpot.closedDaysEn || rawSpot.closedDays || bilingual?.closedEn);

                const isSpotSelected = individualSpotIds.some((sid) => isSameSpot(sid, rawSpot.id));
                const isIncludedInCourse = selectedCourseIds.some((cid) => {
                  const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
                  return course?.spotIds.some((sid) => isSameSpot(sid, rawSpot.id));
                });
                const isSelected = isSpotSelected || isIncludedInCourse;
                const hasImage = (rawSpot as any).imageUrl && (rawSpot as any).imageUrl !== "/assets/default-place.jpg";

                const relatedAct = getRelatedThemeActivity(rawSpot.id, name);
                const isActivitySelected = !!(relatedAct && selectedSpotKeys.has(normalizeSpotKey(relatedAct.id)));

                const isFlipped = Boolean(flippedCards[rawSpot.id]);
                const flippedData = flippedCards[rawSpot.id];
                const act = flippedData?.activity;

                return (
                  <div
                    key={rawSpot.id}
                    className="relative [perspective:1000px] w-full min-h-[390px] flex flex-col"
                  >
                    <div
                      className="relative w-full h-full flex-1 transition-transform duration-500 ease-in-out"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      {/* 앞면 (FRONT): 일반 관광지 카드 */}
                      <div
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                        onClick={() => handleToggleSpotWithActivityPrompt(rawSpot.id, name)}
                        className={`w-full h-full rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 overflow-hidden cursor-pointer group ${
                          isSelected
                            ? "bg-[#fff7f7] border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                    <div className="space-y-2">
                      {/* 실사 이미지 썸네일 */}
                      {hasImage ? (
                        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 shadow-2xs">
                          <img
                            src={(rawSpot as any).imageUrl}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                          {/* 선택 체크마크 배지 */}
                          {isSelected && (
                            <div className="absolute top-2 left-2 z-10">
                              <span className="w-5 h-5 rounded-full bg-[#e25c5c] text-white flex items-center justify-center text-xs font-black shadow-xs">
                                ✓
                              </span>
                            </div>
                          )}

                          {/* 추천(Must-Visit) 배지 */}
                          {rawSpot.isFeatured && !isSelected && (
                            <div className="absolute top-2 left-2 z-10">
                              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-xs flex items-center gap-0.5">
                                ★ {locale === "ko" ? "추천" : "Must-Visit"}
                              </span>
                            </div>
                          )}

                          <span className="absolute bottom-1.5 right-2 text-[9px] font-medium text-white/80 drop-shadow-xs">
                            {(rawSpot as any).imageUrl?.includes("wikimedia")
                              ? "Wikimedia"
                              : (rawSpot as any).imageUrl?.startsWith("/assets")
                              ? "Photo"
                              : "KTO"}
                          </span>
                        </div>
                      ) : null}

                      {/* 제목 & 가격: [명소명]           [가격] */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!hasImage && isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#e25c5c] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              ✓
                            </span>
                          )}
                          <h5
                            className={`text-xs sm:text-sm font-black transition-colors line-clamp-1 ${
                              isSelected ? "text-[#e25c5c]" : "text-[#0f172a] group-hover:text-indigo-600"
                            }`}
                            title={name}
                          >
                            {name}
                          </h5>
                        </div>

                        {/* 가격 표시: 한복 대여 시 4대궁 무료 혜택 적용 */}
                        {(() => {
                          const isPalaceFreeWithHanbok =
                            city === "SEOUL" &&
                            isHanbokRentalSelected &&
                            isPalaceFreeSpot(rawSpot.id, rawSpot.nameKo);

                          if (isPalaceFreeWithHanbok) {
                            return (
                              <div className="text-right shrink-0 whitespace-nowrap">
                                <span className="text-[11px] text-slate-400 line-through block">
                                  {formatPriceByLocale(rawSpot.price, locale, usdRate)}
                                </span>
                                <span className="text-xs sm:text-sm font-black text-emerald-600 flex items-center gap-0.5 justify-end">
                                  <span>👘</span>
                                  <span>{locale === "ko" ? "0원 (한복 무료)" : "Free (Hanbok)"}</span>
                                </span>
                              </div>
                            );
                          }

                          return (
                            <span
                              className={`text-xs sm:text-sm font-black shrink-0 whitespace-nowrap ${
                                rawSpot.priceStatus === "FREE" || rawSpot.price === 0
                                  ? "text-emerald-600"
                                  : "text-[#e25c5c]"
                              }`}
                            >
                              {rawSpot.priceStatus === "FREE" || rawSpot.price === 0
                                ? (locale === "ko" ? "무료" : "Free")
                                : formatPriceByLocale(rawSpot.price, locale, usdRate)}
                            </span>
                          );
                        })()}
                      </div>

                      {/* 카테고리 뱃지 */}
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        {rawSpot.isFeatured && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                            <span>★ {locale === "ko" ? "추천" : "Must-Visit"}</span>
                          </span>
                        )}
                        {rawSpot.isLocal && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                            <span>{locale === "ko" ? "로컬" : "Local"}</span>
                          </span>
                        )}
                        {(() => {
                          const cat = rawSpot.categoryType || bilingual?.categoryType;
                          if (!cat) return null;
                          const badgeConfig = {
                            명소: { bg: "bg-blue-50 text-blue-700 border-blue-200/80", labelKo: "명소", labelEn: "Landmark" },
                            자연: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80", labelKo: "자연", labelEn: "Nature" },
                            엔터: { bg: "bg-purple-50 text-purple-700 border-purple-200/80", labelKo: "엔터", labelEn: "Enter" },
                            쇼핑: { bg: "bg-amber-50 text-amber-800 border-amber-200/80", labelKo: "쇼핑", labelEn: "Shopping" },
                          }[cat as "명소" | "자연" | "엔터" | "쇼핑"];
                          if (!badgeConfig) return null;
                          return (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeConfig.bg}`}>
                              {locale === "ko" ? badgeConfig.labelKo : badgeConfig.labelEn}
                            </span>
                          );
                        })()}
                      </div>

                      {/* 연계 액티비티 선택 표식 배너 */}
                      {isActivitySelected && relatedAct && (
                        <div className="flex items-center justify-between text-[11px] font-bold bg-purple-50 text-purple-900 px-2.5 py-1.5 rounded-xl border border-purple-200 shadow-2xs">
                          <span className="truncate flex items-center gap-1.5 min-w-0 pr-2">
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 shrink-0">
                              {locale === "ko" ? "액티비티 담김" : "Activity"}
                            </span>
                            <span className="truncate">{locale === "ko" ? relatedAct.nameKo : relatedAct.nameEn}</span>
                          </span>
                          <span className="font-extrabold text-purple-700 shrink-0 tabular-nums">
                            +{formatPriceByLocale(relatedAct.priceKrw, locale, usdRate)}
                          </span>
                        </div>
                      )}

                      {/* 설명 */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>

                      {/* 지하철 / 휴무 / 시간 메타 정보 */}
                      {(subway || closed || hours) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {subway && (
                            <div
                              className="flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 truncate max-w-full"
                              title={subway}
                            >
                              <span className="truncate">{subway}</span>
                            </div>
                          )}
                          {closed && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                closed.includes("연중무휴") || closed.toLowerCase().includes("year-round")
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {closed}
                            </span>
                          )}
                          {hours && (
                            <span
                              className="text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 truncate max-w-[180px]"
                              title={hours}
                            >
                              {hours}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 하단 버튼: [상세보기]              [예산에 담기] */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewSpot(rawSpot);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors border border-slate-200/80 cursor-pointer"
                      >
                        <span>{dict.planner.viewDetailsButton || "상세보기"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSpotWithActivityPrompt(rawSpot.id, name);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#e25c5c] text-white hover:bg-[#c94949] ring-1 ring-rose-200"
                            : "bg-[#0f172a] text-white hover:bg-slate-800"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <span className="font-bold">✓</span>
                            <span>{locale === "ko" ? "담김" : "Added"}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold">+</span>
                            <span>{locale === "ko" ? "담기" : "Add"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 뒷면 (BACK): 10초간 노출되는 연계 K-체험 카드 */}
                  {act && (
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                      className="absolute inset-0 w-full h-full rounded-2xl border border-purple-200/90 bg-gradient-to-b from-purple-50/70 via-white to-rose-50/40 p-3.5 flex flex-col justify-between shadow-md overflow-hidden z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1. 상단 바: 추천 뱃지 + ✕ 닫기 버튼 */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 shrink-0">
                          <span>✨</span>
                          <span>{locale === "ko" ? `${name} 연계 K-체험` : "Recommended Activity"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => unflipCard(rawSpot.id)}
                          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center text-xs font-black transition-colors cursor-pointer shrink-0 shadow-2xs"
                          title={locale === "ko" ? "닫기" : "Close"}
                          aria-label={locale === "ko" ? "닫기" : "Close"}
                        >
                          ✕
                        </button>
                      </div>

                      {/* 2. 본문 영역: 이미지/아이콘 + 명칭 + 가격/소요시간 + 혜택 안내 */}
                      <div className="space-y-2 my-auto py-1">
                        {act.imageUrl ? (
                          <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shadow-2xs border border-purple-100/80">
                            <img
                              src={act.imageUrl}
                              alt={locale === "ko" ? act.nameKo : act.nameEn}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-20 sm:h-24 rounded-xl bg-purple-100/60 border border-purple-200/60 flex items-center justify-center text-3xl shadow-2xs">
                            👘
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm sm:text-[15px] font-black text-slate-900 leading-snug">
                            {locale === "ko" ? act.nameKo : act.nameEn}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs sm:text-sm font-black text-[#e25c5c]">
                              +{formatPriceByLocale(act.priceKrw, locale, usdRate)}
                            </span>
                            {act.durationTextKo && (
                              <span className="text-[10.5px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                ({locale === "ko" ? act.durationTextKo : act.durationTextEn})
                              </span>
                            )}
                          </div>
                        </div>

                        {isPalaceFreeSpot(rawSpot.id, name) && isHanbokActivityId(act.id) ? (
                          <div className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs">
                            <span className="text-sm leading-none">👘</span>
                            <span>{locale === "ko" ? "한복 착용 시 4대궁 입장료 무료!" : "Free admission with Hanbok rental!"}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {locale === "ko" ? act.descKo : act.descEn}
                          </p>
                        )}
                      </div>

                      {/* 3. 하단 액션 영역: 10초 카운트다운 게이지 바 + [앞면 보기] / [+ 함께 담기] 버튼 */}
                      <div className="space-y-2 pt-1.5 border-t border-purple-100/80">
                        {/* 10초 진행 바 */}
                        <div className="w-full bg-purple-100 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full w-full"
                            style={{
                              animation: "flipTimerShrink 10s linear forwards",
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => unflipCard(rawSpot.id)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {locale === "ko" ? "앞면 보기" : "Back to Spot"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddLinkedActivity(rawSpot.id, act)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1 whitespace-nowrap"
                          >
                            <span>+</span>
                            <span>{locale === "ko" ? "함께 담기" : "Add Bundle"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
              })}
            </div>
          )}

          {/* 더보기 / 접기 페이징 */}
          {filteredSpotsForCity.length > 8 && (
            <div className="text-center pt-2">
              {visibleCount < filteredSpotsForCity.length ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <span>{dict.planner.showMore || "더보기"}</span>
                  <span>▼</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setVisibleCount(8)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <span>{dict.planner.showLess || "접기"}</span>
                  <span>▲</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= SUBTAB 2: 관광 바스켓 요약 ================= */}
      {activeSubTab === "BASKET" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {cityName} {locale === "ko" ? "담은 관광 명소 & 액티비티" : "Selected Attractions & Activities"}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-[#e25c5c] border border-rose-200">
                {basketSummary.totalCount}{locale === "ko" ? "곳" : " items"}
              </span>
            </div>

            {basketSummary.totalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(dict.planner.clearAttractionBasketConfirm || "현재 도시의 담은 명소를 모두 비우시겠습니까?")) {
                    onClearCitySpots(city);
                  }
                }}
                className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                {locale === "ko" ? "전체 비우기" : "Clear All"}
              </button>
            )}
          </div>

          {selectedSpotsInCity.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <div className="text-sm font-bold text-slate-700">
                {dict.planner.basketEmptyNotice || "아직 바스켓에 담은 명소나 액티비티가 없습니다."}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {dict.planner.basketEmptySub || "도시 대표 명소 또는 K-테마 탭에서 원하는 장소를 담아보세요!"}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("CITY")}
                  className="px-4 py-2 bg-[#0f172a] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {dict.planner.tabCitySpots || "도시 대표 명소 보러가기"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {selectedSpotsInCity.map((spot, idx) => {
                  const isPalaceFree =
                    isHanbokRentalSelected &&
                    isPalaceFreeSpot(spot.id, spot.nameKo);
                  const isFree = spot.priceStatus === "FREE" || spot.price === 0 || isPalaceFree;
                  const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;
                  const totalItemPrice = spot.price * adultCount;

                  return (
                    <div
                      key={spot.id || idx}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-rose-50 text-[#e25c5c] font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h6 className="text-xs sm:text-sm font-extrabold text-[#0f172a] truncate" title={spotName}>
                              {spotName}
                            </h6>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                isPalaceFree
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : isFree
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {isPalaceFree
                                ? (locale === "ko" ? "한복 무료" : "Hanbok Free")
                                : isFree
                                ? (locale === "ko" ? "무료" : "Free")
                                : (locale === "ko" ? "유료" : "Paid")}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-md">
                            {isPalaceFree
                              ? (locale === "ko" ? "한복 착용 시 입장료 무료 혜택 적용" : "Free admission with Hanbok rental")
                              : spot.tag || "Attraction"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isPalaceFree ? (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 line-through block">
                              {formatPriceByLocale(totalItemPrice, locale, usdRate)}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-emerald-600 block">
                              {locale === "ko" ? "0원 (무료)" : "$0 (Free)"}
                            </span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-black text-[#0f172a] block">
                              {isFree ? (locale === "ko" ? "0원" : "$0") : formatPriceByLocale(totalItemPrice, locale, usdRate)}
                            </span>
                            {!isFree && adultCount > 1 && (
                              <span className="text-[10px] text-slate-400 block">
                                {locale === "ko" ? `1인 ${formatKrw(spot.price)}` : `1p ${formatPriceByLocale(spot.price, locale, usdRate)}`}
                              </span>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onToggleSpot(city, spot.id)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                          title={locale === "ko" ? "취소" : "Remove"}
                        >
                          <span>✕</span>
                          <span>{locale === "ko" ? "취소" : "Remove"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 하단 총계 푸터 (FoodPlanner와 동일한 규격) */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{locale === "ko" ? "선택 명소 합계 (1인 기준)" : "Selected Spots Subtotal (Per Person)"}:</span>
                  <span className="font-bold text-slate-800">{formatPriceByLocale(basketSummary.totalPerPersonKrw, locale, usdRate)}</span>
                </div>

                {basketSummary.hasHanbokSavings && (
                  <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                    <span className="flex items-center gap-1 font-bold">
                      <span>👘</span>
                      <span>{locale === "ko" ? "한복 착용 4대궁 무료 입장 혜택" : "Hanbok Palace Free Admission"}</span>
                    </span>
                    <span className="font-black text-emerald-800">
                      -{formatPriceByLocale(basketSummary.totalSavingsKrw, locale, usdRate)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-[#0f172a]">
                  <span>{locale === "ko" ? `최종 관광비 합계 (${adultCount}인)` : `Total Attraction Budget (${adultCount}p)`}:</span>
                  <span className="text-base sm:text-lg text-[#e25c5c]">
                    {formatPriceByLocale(basketSummary.grandTotalKrw, locale, usdRate)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. 커스텀 명소 직접 추가 카드 (StaySelectorPanel 커스텀 카드와 통일) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">
              +
            </span>
            <span className="text-xs sm:text-sm font-black text-[#0f172a]">
              {dict.planner.customSpotAddTitle || "찾으시는 명소/체험 직접 추가"}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {isCustomOpen ? (locale === "ko" ? "접기 ▲" : "Close ▲") : (locale === "ko" ? "입력하기 ▼" : "Add ▼")}
          </span>
        </button>

        {isCustomOpen && (
          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {locale === "ko" ? "명소/체험 이름" : "Attraction/Activity Name"}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={dict.planner.customSpotNamePlaceholder || "명소 또는 액티비티 이름 입력"}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {locale === "ko" ? "1인 예상 비용 (원)" : "Est. Cost Per Person (KRW)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={dict.planner.customSpotPricePlaceholder || "1인 예상 비용 (무료는 0)"}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {locale === "ko" ? "취소" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#0f172a] text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                {dict.planner.customSpotAddButton || "바스켓에 추가"}
              </button>
            </div>
          </form>
        )}
      </div>


    </div>
  );
}
