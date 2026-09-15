"use client";

import { useState, useMemo } from "react";
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
} from "../features/budget/catalog/theme-activities";
import { formatKrw } from "../features/budget/presentation/formatters";

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
}: AttractionPlannerPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"CITY" | "THEME" | "BASKET">("CITY");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // 커스텀 명소 직접 추가 폼 상태
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<string>("");

  // 1. 도시 대표 명소 목록 병합
  const spotsForCity = useMemo(() => {
    return [...customAttractionPlaces, ...baseSpotsForCity];
  }, [customAttractionPlaces, baseSpotsForCity]);

  // 2. 현재 도시의 K-테마 액티비티 목록
  const themeActivitiesForCity = useMemo(() => {
    return THEME_ACTIVITIES_CATALOG.filter((act) => act.cityCode === city).map((act) => ({
      activity: act,
      spot: themeActivityToAttractionSpot(act),
    }));
  }, [city]);

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

  // 4. 바스켓 통계 요약 (무료/유료 개수 및 총 입장료)
  const basketSummary = useMemo(() => {
    let freeCount = 0;
    let paidCount = 0;
    let totalPerPersonKrw = 0;

    selectedSpotsInCity.forEach((spot) => {
      if (spot.priceStatus === "FREE" || spot.price === 0) {
        freeCount += 1;
      } else {
        paidCount += 1;
        totalPerPersonKrw += spot.price;
      }
    });

    const grandTotalKrw = totalPerPersonKrw * adultCount;

    return {
      totalCount: selectedSpotsInCity.length,
      freeCount,
      paidCount,
      totalPerPersonKrw,
      grandTotalKrw,
    };
  }, [selectedSpotsInCity, adultCount]);

  // 5. 도시 대표 명소 필터링
  const effectiveCatFilter = categoryFilter === "SAVED_ONLY" && selectedSpotKeys.size === 0 ? "ALL" : categoryFilter;
  const filteredSpotsForCity = useMemo(() => {
    if (effectiveCatFilter === "SAVED_ONLY") {
      return spotsForCity.filter((s) => selectedSpotKeys.has(normalizeSpotKey(s.id)));
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
      {/* 1. 관광 바스켓 요약 바 (Top Summary Bar: Food/Stay 플래너와 100% 동일한 위계 및 디자인 규격) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#0f172a] tracking-tight">
                {cityName} {locale === "ko" ? "관광 바스켓 플래너" : "Attraction Basket Planner"}
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
              {formatKrw(basketSummary.grandTotalKrw)}
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
                {adultCount > 1 && basketSummary.totalPerPersonKrw > 0 ? ` · 1인 ${formatKrw(basketSummary.totalPerPersonKrw)}` : ""})
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
            <span>{cityName} {locale === "ko" ? `대표 명소 (${spotsForCity.length}선)` : `Attractions (${spotsForCity.length})`}</span>
          </button>

          {/* K-테마 액티비티 탭 */}
          <button
            type="button"
            onClick={() => setActiveSubTab("THEME")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "THEME"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>{locale === "ko" ? `K-테마 액티비티 (${themeActivitiesForCity.length}선)` : `K-Theme & Activities (${themeActivitiesForCity.length})`}</span>
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
      </div>

      {/* 3. 서브탭별 본문 */}

      {/* ================= SUBTAB 1: 도시 대표 명소 ================= */}
      {activeSubTab === "CITY" && (
        <div className="space-y-4">
          <div className="min-h-[36px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {cityName} {locale === "ko" ? `대표 명소 리스트 (${spotsForCity.length}선)` : `Attractions List (${spotsForCity.length})`}
              </h4>
            </div>

            {/* 카테고리 필터 태그 (FoodPlanner NATIONAL 탭과 동일 규격) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { key: "ALL", labelKo: "전체", labelEn: "All" },
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
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCategoryFilter(tab.key)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? isSavedTab
                          ? "bg-rose-500 text-white shadow-xs"
                          : "bg-slate-900 text-white shadow-xs"
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

                const name = locale === "ko" ? (bilingual?.nameKo || rawSpot.nameKo) : (bilingual?.nameEn || rawSpot.nameEn);
                const desc = locale === "ko"
                  ? (bilingual?.descKo || rawSpot.descKo || rawSpot.descEn)
                  : (bilingual?.descEn || rawSpot.descEn || rawSpot.descKo);
                const subway = locale === "ko"
                  ? (bilingual?.subwayKo || rawSpot.subwayInfoKo || rawSpot.subwayInfo)
                  : (bilingual?.subwayEn || rawSpot.subwayInfoEn || rawSpot.subwayInfo);
                const hours = locale === "ko"
                  ? (bilingual?.hoursKo || rawSpot.openingHoursKo || rawSpot.openingHours)
                  : (bilingual?.hoursEn || rawSpot.openingHoursEn || rawSpot.openingHours);
                const closed = locale === "ko"
                  ? (bilingual?.closedKo || rawSpot.closedDaysKo || rawSpot.closedDays)
                  : (bilingual?.closedEn || rawSpot.closedDaysEn || rawSpot.closedDays);

                const isSpotSelected = individualSpotIds.some((sid) => isSameSpot(sid, rawSpot.id));
                const isIncludedInCourse = selectedCourseIds.some((cid) => {
                  const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
                  return course?.spotIds.some((sid) => isSameSpot(sid, rawSpot.id));
                });
                const isSelected = isSpotSelected || isIncludedInCourse;
                const hasImage = (rawSpot as any).imageUrl && (rawSpot as any).imageUrl !== "/assets/default-place.jpg";

                return (
                  <div
                    key={rawSpot.id}
                    onClick={() => onToggleSpot(city, rawSpot.id)}
                    className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 overflow-hidden cursor-pointer group ${
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

                        <span
                          className={`text-xs sm:text-sm font-black shrink-0 whitespace-nowrap ${
                            rawSpot.priceStatus === "FREE" || rawSpot.price === 0
                              ? "text-emerald-600"
                              : "text-[#e25c5c]"
                          }`}
                        >
                          {rawSpot.priceStatus === "FREE" || rawSpot.price === 0
                            ? (locale === "ko" ? "무료" : "Free")
                            : formatKrw(rawSpot.price)}
                        </span>
                      </div>

                      {/* 카테고리 뱃지 */}
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        {rawSpot.isLocal && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                            <span>로컬</span>
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
                          onToggleSpot(city, rawSpot.id);
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

      {/* ================= SUBTAB 2: K-테마 액티비티 ================= */}
      {activeSubTab === "THEME" && (
        <div className="space-y-4">
          <div className="min-h-[36px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {cityName} {locale === "ko" ? `K-테마 액티비티 (${themeActivitiesForCity.length}선)` : `K-Theme & Activities (${themeActivitiesForCity.length})`}
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              {locale === "ko" ? "취향에 따라 골라 담기" : "Explore by Preference"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themeActivitiesForCity.map(({ activity, spot }) => {
              const name = locale === "ko" ? activity.nameKo : activity.nameEn;
              const desc = locale === "ko" ? activity.descKo : activity.descEn;
              const isSelected = selectedSpotKeys.has(normalizeSpotKey(spot.id));
              const hasImage = !!activity.imageUrl;

              return (
                <div
                  key={activity.id}
                  onClick={() => onToggleSpot(city, spot.id)}
                  className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 overflow-hidden cursor-pointer group ${
                    isSelected
                      ? "bg-[#fff7f7] border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    {/* 실사 썸네일 */}
                    {hasImage && (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 shadow-2xs">
                        <img
                          src={activity.imageUrl}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                        {/* 선택 체크 배지 */}
                        {isSelected && (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="w-5 h-5 rounded-full bg-[#e25c5c] text-white flex items-center justify-center text-xs font-black shadow-xs">
                              ✓
                            </span>
                          </div>
                        )}

                        <span className="absolute bottom-1.5 right-2 text-[9px] font-medium text-white/80 drop-shadow-xs">
                          Photo
                        </span>
                      </div>
                    )}

                    {/* 상단 태그 & 가격: [액티비티명]        [가격] */}
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

                      <span className="text-xs sm:text-sm font-black text-[#e25c5c] shrink-0 whitespace-nowrap">
                        {formatKrw(activity.priceKrw)}
                      </span>
                    </div>

                    {/* 태그 뱃지 */}
                    <div className="flex items-center gap-1 shrink-0 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        {dict.planner.themeActivityBadge || "K-액티비티"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                        {activity.tag}
                      </span>
                    </div>

                    {/* 설명 */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>

                    {/* 소요 시간 & 참고 팁 */}
                    {(activity.durationTextKo || activity.bookingTipKo) && (
                      <div className="space-y-1 pt-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {activity.durationTextKo && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-400">{locale === "ko" ? "예상 소요시간" : "Est. Duration"}</span>
                            <span className="font-bold text-slate-700">
                              {locale === "ko" ? activity.durationTextKo : (activity.durationTextEn || activity.durationTextKo)}
                            </span>
                          </div>
                        )}
                        {activity.bookingTipKo && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-400">{locale === "ko" ? "참고사항" : "Note"}</span>
                            <span className="font-bold text-slate-700 truncate max-w-[180px]" title={locale === "ko" ? activity.bookingTipKo : (activity.bookingTipEn || activity.bookingTipKo)}>
                              {locale === "ko" ? activity.bookingTipKo : (activity.bookingTipEn || activity.bookingTipKo)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 하단 액션 버튼 */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewSpot(spot);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors border border-slate-200/80 cursor-pointer"
                    >
                      <span>{dict.planner.viewDetailsButton || "상세보기"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSpot(city, spot.id);
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
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUBTAB 3: 관광 바스켓 요약 (FoodPlanner BASKET 탭과 100% 동일) ================= */}
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
                  const isFree = spot.priceStatus === "FREE" || spot.price === 0;
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
                                isFree
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {isFree ? (locale === "ko" ? "무료" : "Free") : (locale === "ko" ? "유료" : "Paid")}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-md">
                            {spot.tag || "Attraction"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-black text-[#0f172a] block">
                            {isFree ? (locale === "ko" ? "0원" : "₩0") : formatKrw(totalItemPrice)}
                          </span>
                          {!isFree && adultCount > 1 && (
                            <span className="text-[10px] text-slate-400 block">
                              1인 {formatKrw(spot.price)}
                            </span>
                          )}
                        </div>

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
                  <span className="font-bold text-slate-800">{formatKrw(basketSummary.totalPerPersonKrw)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-[#0f172a]">
                  <span>{locale === "ko" ? `최종 관광비 합계 (${adultCount}인)` : `Total Attraction Budget (${adultCount}p)`}:</span>
                  <span className="text-base sm:text-lg text-[#e25c5c]">
                    {formatKrw(basketSummary.grandTotalKrw)}
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
