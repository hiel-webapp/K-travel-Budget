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
    <div className="space-y-5">
      {/* 1. 패널 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
            <span>{cityName}</span>
            <span>{dict.planner.attractionBasketTitle || "관광 바스켓 플래너"}</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {dict.planner.attractionBasketSubtitle || "도시 명소와 K-테마 액티비티를 자유롭게 담아 나만의 일정을 완성하세요."}
          </p>
        </div>

        {/* 3대 서브탭 네비게이션 */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("CITY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "CITY"
                ? "bg-white text-[#0f172a] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {dict.planner.tabCitySpots || "도시 대표 명소"}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("THEME")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "THEME"
                ? "bg-white text-[#0f172a] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {dict.planner.tabThemeActivities || "K-테마 액티비티"}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("BASKET")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === "BASKET"
                ? "bg-[#e25c5c] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{dict.planner.tabBasketOverview || "관광 바스켓"}</span>
            {basketSummary.totalCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeSubTab === "BASKET" ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700"
                }`}
              >
                {basketSummary.totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. 상단 실시간 관광 바스켓 상태 요약 바 (Live Summary Bar) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-rose-400 text-sm shrink-0 border border-white/10">
            {basketSummary.totalCount}
          </div>
          <div>
            <div className="text-xs text-slate-300 font-medium">
              {cityName} {locale === "ko" ? "담긴 명소/체험" : "Selected Spots"}
            </div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>{basketSummary.totalCount}{locale === "ko" ? "곳 선택" : " spots"}</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-emerald-300 text-xs font-bold">
                {dict.planner.freeSpotsCount || "무료"} {basketSummary.freeCount}{locale === "ko" ? "곳" : ""}
              </span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-rose-300 text-xs font-bold">
                {dict.planner.paidSpotsCount || "유료"} {basketSummary.paidCount}{locale === "ko" ? "곳" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-white/10">
          <div className="text-right">
            <div className="text-[11px] text-slate-300">
              {dict.planner.totalAdmissionFee || "총 입장료 합계"}
              {adultCount > 1 && (
                <span className="text-slate-400 ml-1">
                  (1인 {formatKrw(basketSummary.totalPerPersonKrw)})
                </span>
              )}
            </div>
            <div className="text-base font-black text-white">
              {formatKrw(basketSummary.grandTotalKrw)}
              {adultCount > 1 && (
                <span className="text-xs font-normal text-slate-300 ml-1">
                  ({adultCount}{locale === "ko" ? "명" : " travelers"})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {basketSummary.totalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(dict.planner.clearAttractionBasketConfirm || "현재 도시의 담은 명소를 모두 비우시겠습니까?")) {
                    onClearCitySpots(city);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-white/15 cursor-pointer"
              >
                {dict.planner.clearAttractionBasket || "비우기"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. 서브탭별 본문 */}

      {/* ================= SUBTAB 1: 도시 대표 명소 ================= */}
      {activeSubTab === "CITY" && (
        <div className="space-y-4">
          {/* 카테고리 필터 바 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {locale === "ko" ? "도시 대표 관광지" : (dict.planner.cityAttractionsTitle || "City Attractions")}
            </span>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
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

          {/* 스팟 카드 그리드 */}
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
                      {/* 이미지 썸네일 */}
                      {hasImage ? (
                        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 group/img shadow-2xs">
                          <img
                            src={(rawSpot as any).imageUrl}
                            alt={name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover/img:opacity-40 transition-opacity" />

                          {/* 선택 체크 배지 */}
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

                      {/* 제목 & 가격 */}
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
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {desc}
                      </p>

                      {/* 지하철 / 휴무 / 시간 */}
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
                            className="text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 truncate max-w-[200px]"
                            title={hours}
                          >
                            {hours}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
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
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? "bg-rose-500 text-white shadow-xs hover:bg-rose-600 ring-1 ring-rose-200"
                            : "bg-[#0f172a] text-white hover:bg-slate-800 shadow-2xs"
                        }`}
                      >
                        {isSelected
                          ? (dict.planner.inBudgetButton || "✓ 담김")
                          : (dict.planner.addToBudgetButton || "예산에 담기")}
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
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {cityName} {dict.planner.tabThemeActivities || "K-테마 액티비티 & 문화 체험"}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {themeActivitiesForCity.length}{locale === "ko" ? "개 프로그램" : " activities"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themeActivitiesForCity.map(({ activity, spot }) => {
              const name = locale === "ko" ? activity.nameKo : activity.nameEn;
              const desc = locale === "ko" ? activity.descKo : activity.descEn;
              const isSelected = selectedSpotKeys.has(normalizeSpotKey(spot.id));

              return (
                <div
                  key={activity.id}
                  onClick={() => onToggleSpot(city, spot.id)}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer group ${
                    isSelected
                      ? "bg-[#fff7f7] border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* 상단 태그 & 가격 */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#e25c5c] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            ✓
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          {dict.planner.themeActivityBadge || "K-액티비티"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                          {activity.tag}
                        </span>
                      </div>

                      <span className="text-xs sm:text-sm font-black text-[#e25c5c] whitespace-nowrap">
                        {formatKrw(activity.priceKrw)}
                      </span>
                    </div>

                    {/* 액티비티 제목 */}
                    <h5
                      className={`text-sm sm:text-base font-black transition-colors ${
                        isSelected ? "text-[#e25c5c]" : "text-[#0f172a] group-hover:text-indigo-600"
                      }`}
                    >
                      {name}
                    </h5>

                    {/* 설명 */}
                    <p className="text-xs text-slate-600 leading-relaxed">
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
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-rose-500 text-white shadow-xs hover:bg-rose-600 ring-1 ring-rose-200"
                          : "bg-[#0f172a] text-white hover:bg-slate-800 shadow-2xs"
                      }`}
                    >
                      {isSelected
                        ? (dict.planner.inBudgetButton || "✓ 담김")
                        : (dict.planner.addToBudgetButton || "예산에 담기")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUBTAB 3: 관광 바스켓 요약 ================= */}
      {activeSubTab === "BASKET" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {cityName} {dict.planner.tabBasketOverview || "담은 관광 명소 & 액티비티 목록"}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {basketSummary.totalCount}{locale === "ko" ? "개 항목" : " items"}
            </span>
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
            <div className="space-y-2.5">
              {selectedSpotsInCity.map((spot, idx) => {
                const isFree = spot.priceStatus === "FREE" || spot.price === 0;
                const spotName = locale === "ko" ? spot.nameKo : spot.nameEn;
                const totalItemPrice = spot.price * adultCount;

                return (
                  <div
                    key={spot.id || idx}
                    className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
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
                        <div className="text-xs sm:text-sm font-black text-[#0f172a]">
                          {isFree ? (locale === "ko" ? "0원" : "₩0") : formatKrw(totalItemPrice)}
                        </div>
                        {!isFree && adultCount > 1 && (
                          <div className="text-[10px] text-slate-400">
                            1인 {formatKrw(spot.price)}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleSpot(city, spot.id)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        title={locale === "ko" ? "제외하기" : "Remove"}
                      >
                        {locale === "ko" ? "제외" : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. 커스텀 명소 직접 추가 아코디언 (하단) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-all">
        <button
          type="button"
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black">
              +
            </span>
            <span>{dict.planner.customSpotAddTitle || "찾으시는 명소/체험 직접 추가"}</span>
          </span>
          <span className="text-slate-400 text-[11px]">
            {isCustomOpen ? (locale === "ko" ? "접기 ▲" : "Close ▲") : (locale === "ko" ? "입력하기 ▼" : "Add ▼")}
          </span>
        </button>

        {isCustomOpen && (
          <form onSubmit={handleCustomSubmit} className="mt-3 pt-3 border-t border-slate-200/60 space-y-3">
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
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 transition-colors cursor-pointer"
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
