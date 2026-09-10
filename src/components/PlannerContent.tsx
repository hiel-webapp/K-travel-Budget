"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TripDraft, validateTripDraft, SupportedCity, BudgetTier, CITY_ENGLISH_NAMES, CITY_KOREAN_NAMES, calculateDefaultNightAllocation, sortCitiesByStandardOrder, getDefaultTargetBudgetByNights } from "../lib/trip-domain";
import { loadTripDraft, saveTripDraft, loadPlannerPreferencesEx, savePlannerPreferences, saveSavedTrip, loadSavedPlaceIds, hasActiveDraft, loadBudgetPlaces, toggleBudgetPlace, isPlaceInBudget, saveBudgetPlaces } from "../lib/storage-helper";
import type { PlaceItem } from "../lib/places/types";

import { BudgetCategory, BudgetBasketId, PlannerPreferences, isCalculatedMealPlan, AccommodationSelection, LocalTransitStyle, FoodBasketItemSelection } from "../features/budget/domain/types";
import { generateInitialBudgetPlan } from "../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";
import { ATTRACTION_SPOTS_CATALOG, TOUR_COURSE_PRESETS, AttractionSpot, TourCoursePreset, registerCustomAttractionSpots, parseAttractionMetadata, SEOUL_LANDMARK_BILINGUAL_MAP, isSameSpot, normalizeSpotKey } from "../features/budget/catalog/attraction-spots";
import { SHOW_LOCAL_SPOTS } from "../lib/config/spots-visibility";
import { ACCOMMODATION_SPOTS_CATALOG, AccommodationCandidateSpot } from "../features/budget/catalog/accommodation-spots";
import { getIntercityFareOptions, IntercityFareInfo, IntercityTransportMode } from "../lib/transport/intercity-fares";
import FoodPlannerPanel from "./FoodPlannerPanel";
import FoodReceiptDetails from "./FoodReceiptDetails";
import TransportPlannerPanel from "./TransportPlannerPanel";
import SaveTripModal from "./planner/SaveTripModal";
import BudgetTierModal from "./planner/BudgetTierModal";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";
import {
  formatKrw,
  formatPercentage,
  formatTripDuration,
  formatTravelerCount,
  formatCityAllocationSummary,
  getCategoryLabel,
  getBasketLabel,
  getCalculationExpression,
  getCombinedTransportSubtotal,
  generateBudgetSummaryText,
} from "../features/budget/presentation/formatters";

interface PlannerContentProps {
  locale: Locale;
  dict: Dictionary;
}

type PlannerState =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "calculation-error" }
  | { status: "ready"; draft: TripDraft; preferences: PlannerPreferences };

export default function PlannerContent({ locale, dict }: PlannerContentProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#e25c5c]"></div>
          <p className="text-sm font-medium text-slate-500">Loading planner...</p>
        </div>
      </div>
    );
  }

  return <HydratedPlannerContent locale={locale} dict={dict} />;
}

const ALL_CITY_OPTIONS: { key: SupportedCity; nameKo: string; nameEn: string }[] = [
  { key: "SEOUL", nameKo: "서울", nameEn: "Seoul" },
  { key: "BUSAN", nameKo: "부산", nameEn: "Busan" },
  { key: "JEJU", nameKo: "제주", nameEn: "Jeju" },
  { key: "INCHEON", nameKo: "인천", nameEn: "Incheon" },
  { key: "SUWON", nameKo: "수원", nameEn: "Suwon" },
  { key: "JEONJU", nameKo: "전주", nameEn: "Jeonju" },
  { key: "GYEONGJU", nameKo: "경주", nameEn: "Gyeongju" },
  { key: "GANGNEUNG", nameKo: "강릉", nameEn: "Gangneung" },
  { key: "SOKCHO", nameKo: "속초", nameEn: "Sokcho" },
  { key: "YEOSU", nameKo: "여수", nameEn: "Yeosu" },
];
 
function placeToAttractionSpot(p: PlaceItem): AttractionSpot {
  const categoryTypeMap: Record<string, "명소" | "자연" | "엔터" | "쇼핑"> = {
    NATURE: "자연",
    ENTERTAINMENT: "엔터",
    SHOPPING: "쇼핑",
    ATTRACTION: "명소",
    CULTURE: "명소",
  };
  const categoryType = p.categoryType || categoryTypeMap[p.category] || "명소";
  const emojiMap: Record<string, string> = {
    NATURE: "🌿",
    ENTERTAINMENT: "🎡",
    SHOPPING: "🛍️",
    ATTRACTION: "🏛️",
    CULTURE: "🎨",
  };
  const titleKo = p.translations?.ko?.title || (p as any).title || "명소";
  const titleEn = p.translations?.en?.title || titleKo;
  const descKo = p.translations?.ko?.description || (p as any).descriptionKo || titleKo;
  const descEn = p.translations?.en?.description || (p as any).descriptionEn || descKo;
  const price = p.priceKrw ?? (p as any).estimatedPriceKrw ?? 0;

  return {
    id: p.id,
    cityCode: p.city,
    nameKo: titleKo,
    nameEn: titleEn,
    descKo,
    descEn,
    price,
    priceStatus: price > 0 ? "PAID" : "FREE",
    tag: p.category,
    emoji: emojiMap[p.category] || "📍",
    gradientBg: "from-slate-700 to-slate-900",
    isFeatured: true,
    subwayInfo: p.subwayInfo,
    openingHours: p.openingHours,
    closedDays: p.closedDays,
    categoryType,
    imageUrl: p.repImageUrl || (p as any).imageUrl,
  };
}

function spotToPlaceItem(spot: AttractionSpot): PlaceItem {
  const normKey = normalizeSpotKey(spot.id);
  const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[normKey];
  const titleKo = bilingual?.nameKo || spot.nameKo;
  const titleEn = bilingual?.nameEn || spot.nameEn;
  const descKo = bilingual?.descKo || spot.descKo;
  const descEn = bilingual?.descEn || spot.descEn;
  const cat = bilingual?.categoryType || spot.categoryType || "명소";
  let placeCat: "LANDMARK" | "NATURE" | "ENTERTAINMENT" | "SHOPPING" = "LANDMARK";
  if (cat === "자연") placeCat = "NATURE";
  else if (cat === "엔터") placeCat = "ENTERTAINMENT";
  else if (cat === "쇼핑") placeCat = "SHOPPING";

  const repImg = bilingual?.imageUrl || (spot as any).imageUrl || "/assets/gyeongbokgung-main.jpg";

  return {
    id: `seoul_rep_${normKey}`,
    contentId: normKey,
    city: spot.cityCode,
    category: placeCat,
    categoryType: cat,
    sourceName: "KTO",
    qualityStatus: "READY",
    rawUpdatedAt: "2026-09-07",
    repImageUrl: repImg,
    tags: [cat, "서울대표", "추천관광지", normKey.replace("seoul_", "")],
    subwayInfo: bilingual?.subwayKo || spot.subwayInfo,
    openingHours: bilingual?.hoursKo || spot.openingHours,
    closedDays: bilingual?.closedKo || spot.closedDays,
    priceKrw: spot.price || 0,
    priceStatus: (spot.priceStatus === "PAID" || (spot.price !== undefined && spot.price > 0)) ? "OFFICIAL_PRICE" : "FREE",
    isLocal: spot.isLocal || false,
    translations: {
      ko: {
        title: titleKo,
        description: descKo,
        address: bilingual?.subwayKo || "서울특별시",
      },
      en: {
        title: titleEn,
        description: descEn,
        address: bilingual?.subwayEn || "Seoul, Republic of Korea",
      },
    },
  };
}

function placeToAccommodationSpot(p: PlaceItem): AccommodationCandidateSpot {
  const titleKo = p.translations?.ko?.title || (p as any).title || "숙소";
  const titleEn = p.translations?.en?.title || titleKo;
  const descKo = p.translations?.ko?.description || (p as any).descriptionKo || titleKo;
  const descEn = p.translations?.en?.description || (p as any).descriptionEn || descKo;
  const price = p.priceKrw ?? (p as any).estimatedPriceKrw ?? 95000;
  const basketId: BudgetBasketId =
    price < 60000
      ? "BUDGET_STAY"
      : price > 180000
      ? "PREMIUM_HERITAGE"
      : "STANDARD_HOTEL";

  const locKo = p.translations?.ko?.address || "도심";
  const locEn = p.translations?.en?.address || "City Center";

  return {
    id: p.id,
    cityCode: p.city,
    basketId,
    nameKo: titleKo,
    nameEn: titleEn,
    descKo,
    descEn,
    nightlyPriceKrw: price,
    locationKo: locKo,
    locationEn: locEn,
    tag: basketId === "BUDGET_STAY" ? "Hostel" : basketId === "PREMIUM_HERITAGE" ? "Luxury" : "Hotel",
    emoji: "🏨",
    gradientBg: "from-blue-600 to-indigo-700",
  };
}

function accommodationSpotToPlaceItem(spot: AccommodationCandidateSpot): PlaceItem {
  return {
    id: spot.id,
    contentId: spot.id,
    city: spot.cityCode,
    category: "ACCOMMODATION",
    sourceName: "MOCK",
    qualityStatus: "READY",
    rawUpdatedAt: "2026-09-07",
    repImageUrl: (spot as any).imageUrl || "/assets/default-hotel.jpg",
    tags: ["숙소", spot.basketId],
    priceKrw: spot.nightlyPriceKrw,
    priceStatus: "OFFICIAL_PRICE",
    translations: {
      ko: {
        title: spot.nameKo,
        description: spot.descKo,
        address: spot.locationKo,
      },
      en: {
        title: spot.nameEn,
        description: spot.descEn,
        address: spot.locationEn,
      },
    },
  };
}

function isDefaultAttractionSpot(spotId: string): boolean {
  const normKey = normalizeSpotKey(spotId);
  if (SEOUL_LANDMARK_BILINGUAL_MAP[normKey]) return true;
  return ATTRACTION_SPOTS_CATALOG.some(
    (s) => !s.id.startsWith("kto_custom_") && isSameSpot(s.id, spotId)
  );
}

function isDefaultAccommodationSpot(spotId: string): boolean {
  return ACCOMMODATION_SPOTS_CATALOG.some((s) => s.id === spotId);
}

// 모던 스켈레톤 & 페이드인 적용 관광지 카드 이미지 컴포넌트
function SpotCardImage({
  src,
  alt,
  isPriority,
  locale,
}: {
  src?: string;
  alt: string;
  isPriority?: boolean;
  locale: Locale;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const hasValidSrc = !!src && src.trim() !== "" && src !== "/assets/default-place.jpg";

  if (!hasValidSrc || hasError) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 select-none">
        <div className="w-9 h-9 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-400">
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-[10px] font-semibold text-slate-500">
          {locale === "ko" ? "대표 사진 준비 중" : "Photo in preparation"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {/* 은은한 펄스 스켈레톤 뼈대: 이미지가 다운로드되는 동안 어색한 목업/빈화면 방지 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading={isPriority ? "eager" : "lazy"}
        // @ts-ignore
        fetchPriority={isPriority ? "high" : "auto"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
        }}
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-98"
        }`}
      />
    </div>
  );
}

// 관광지 카드 목록 로딩 시 노출되는 스켈레톤 그리드
function SpotCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 bg-white flex flex-col overflow-hidden shadow-xs animate-pulse"
        >
          <div className="w-full aspect-[16/10] bg-slate-200/80" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200/90 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-12" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="h-3 bg-slate-100 rounded w-1/3" />
              <div className="h-7 bg-slate-200/80 rounded-xl w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 모던 스켈레톤 & 페이드인 적용 숙소 카드 상단 비주얼 컴포넌트
function AccSpotHeaderVisual({
  imageUrl,
  emoji,
  location,
  isPriority,
}: {
  imageUrl?: string;
  emoji: string;
  location: string;
  isPriority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const hasValidImage = !!imageUrl && imageUrl.trim() !== "" && imageUrl !== "/assets/default-hotel.jpg" && imageUrl !== "/assets/default-place.jpg";

  if (hasValidImage && !hasError) {
    return (
      <div className="relative h-16 w-full rounded-xl overflow-hidden bg-slate-100 shadow-2xs">
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 animate-pulse" />
        )}
        <img
          src={imageUrl}
          alt={location}
          loading={isPriority ? "eager" : "lazy"}
          // @ts-ignore
          fetchPriority={isPriority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-98"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-black/60 backdrop-blur-md text-white font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
          📍 {location}
        </span>
      </div>
    );
  }

  return (
    <div className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-500/10 via-slate-100 to-indigo-500/10 border border-indigo-200/40 flex items-center justify-between px-3">
      <span className="text-2xl">{emoji}</span>
      <span className="text-[9px] bg-white/95 text-slate-800 font-extrabold px-1.5 py-0.5 rounded shadow-2xs border border-slate-100">
        📍 {location}
      </span>
    </div>
  );
}

function HydratedPlannerContent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [state, setState] = useState<PlannerState>(() => {
    if (!hasActiveDraft()) {
      return { status: "missing" };
    }

    try {
      const draft = loadTripDraft();
      const validation = validateTripDraft(draft);

      if (!validation.success) {
        return { status: "invalid" };
      }

      const res = loadPlannerPreferencesEx(draft);
      if (res.status === "invalid") {
        return { status: "invalid" };
      }

      const preferences = res.preferences;
      if (res.status === "fingerprint-mismatch" || res.status === "missing") {
        savePlannerPreferences({
          draft,
          accommodationByCity: {},
          foodOverrides: {},
          foodAddOnOverrides: {},
          attractionByCity: {},
        });
      }

      return { status: "ready", draft, preferences };
    } catch (error) {
      console.error("Failed to load planner:", error);
      return { status: "calculation-error" };
    }
  });

  // 탭 상태 복원 (1순위: URL 쿼리 파라미터, 2순위: sessionStorage, 3순위: "ALL")
  const [selectedCityTab, setSelectedCityTab] = useState<"ALL" | "TRANSPORT" | SupportedCity>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get("tab") || params.get("cityTab");
        if (urlTab) return urlTab as "ALL" | "TRANSPORT" | SupportedCity;
        const saved = sessionStorage.getItem("hh_planner_selected_city_tab");
        if (saved) return saved as "ALL" | "TRANSPORT" | SupportedCity;
      } catch (e) {
        console.error("Failed to restore city tab:", e);
      }
    }
    return "ALL";
  });

  // 카테고리 상태 복원 (1순위: URL 쿼리 파라미터, 2순위: sessionStorage, 3순위: "ACCOMMODATION")
  const [activeCategory, setActiveCategory] = useState<BudgetCategory>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlCat = params.get("cat") || params.get("category");
        if (urlCat) return urlCat as BudgetCategory;
        const saved = sessionStorage.getItem("hh_planner_active_category");
        if (saved) return saved as BudgetCategory;
      } catch (e) {
        console.error("Failed to restore active category:", e);
      }
    }
    return "ACCOMMODATION";
  });

  // 방안 3: 목록 순서는 기본 추천순 고정, 필요 시 '담은 항목만 보기' 필터 제공
  const [showSavedOnlyAccByCity, setShowSavedOnlyAccByCity] = useState<Record<string, boolean>>({});

  // 도시 탭 및 카테고리 변경 시 sessionStorage 및 URL 쿼리 파라미터 동기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("hh_planner_selected_city_tab", selectedCityTab);
        const url = new URL(window.location.href);
        if (selectedCityTab === "ALL") {
          url.searchParams.delete("tab");
          url.searchParams.delete("cityTab");
        } else {
          url.searchParams.set("tab", selectedCityTab);
        }
        window.history.replaceState(null, "", url.toString());
      } catch (e) {}
    }
  }, [selectedCityTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("hh_planner_active_category", activeCategory);
        const url = new URL(window.location.href);
        if (activeCategory === "ACCOMMODATION") {
          url.searchParams.delete("cat");
          url.searchParams.delete("category");
        } else {
          url.searchParams.set("cat", activeCategory);
        }
        window.history.replaceState(null, "", url.toString());
      } catch (e) {}
    }
  }, [activeCategory]);

  // 유효한 도시인지 검증 (드래프트의 selectedCities에 없는 도시일 경우 안전하게 첫 번째 도시로 복구)
  useEffect(() => {
    if (state.status === "ready") {
      const validCities = state.draft.selectedCities || [];
      if (
        selectedCityTab !== "ALL" &&
        selectedCityTab !== "TRANSPORT" &&
        !validCities.includes(selectedCityTab as SupportedCity)
      ) {
        setSelectedCityTab(validCities[0] || "ALL");
      }
    }
  }, [state, selectedCityTab]);

  // 브라우저 새로고침 시 다른 페이지 하단으로 튀는 현상 방지:
  // 브라우저의 기본 스크롤 복원을 차단(manual)하고 현재 머무는 페이지의 최상단(0, 0)으로 위치시킴
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const t1 = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }, 0);
      const t2 = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }, 80);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, []);

  const [saveError, setSaveError] = useState<boolean>(false);

  const latestPrefsRef = useRef<PlannerPreferences | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedPlaceCount, setSavedPlaceCount] = useState<number>(0);
  type ShoppingOption = "NONE" | "BEAUTY" | "FASHION" | "SOUVENIR" | "CUSTOM";
  const [shoppingOption, setShoppingOption] = useState<ShoppingOption>("BEAUTY");
  const [shoppingCustomInput, setShoppingCustomInput] = useState<string>("");

  const [emergencyManualInput, setEmergencyManualInput] = useState<string>("");
  const [activityManualInput, setActivityManualInput] = useState<string>("");
  const [visibleAttractionsCountByCity, setVisibleAttractionsCountByCity] = useState<Record<string, number>>({});
  const [attractionCategoryFilterByCity, setAttractionCategoryFilterByCity] = useState<Record<string, string>>({});
  const [visibleAccommodationsCountByCity, setVisibleAccommodationsCountByCity] = useState<Record<string, number>>({});
  const [openOverviewInfoKey, setOpenOverviewInfoKey] = useState<string | null>(null);
  const [expandedReceiptCities, setExpandedReceiptCities] = useState<Record<string, boolean>>({});
  const [previewSpot, setPreviewSpot] = useState<(AttractionSpot & { imageUrl?: string; deepLink?: string }) | null>(null);
  const [budgetPlaces, setBudgetPlaces] = useState<PlaceItem[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBudgetPlaces(loadBudgetPlaces());
      const handleSync = () => {
        setBudgetPlaces(loadBudgetPlaces());
      };
      window.addEventListener("hypeheritage_budget_places_changed", handleSync);
      return () => {
        window.removeEventListener("hypeheritage_budget_places_changed", handleSync);
      };
    }
  }, []);

  useEffect(() => {
    const customAttractions = budgetPlaces
      .filter((p) => !["ACCOMMODATION", "RESTAURANT", "CAFE"].includes(p.category))
      .map(placeToAttractionSpot);
    if (customAttractions.length > 0) {
      registerCustomAttractionSpots(customAttractions);
    }
  }, [budgetPlaces]);

  // 담은 관광지가 0개가 되었을 때 카테고리 필터가 SAVED_ONLY로 남아있지 않도록 ALL로 자동 복귀
  useEffect(() => {
    if (state.status !== "ready") return;
    const prefs = state.preferences;
    Object.entries(attractionCategoryFilterByCity).forEach(([c, cat]) => {
      if (cat === "SAVED_ONLY") {
        const cityAttrSel = prefs.attractionSelections?.[c as SupportedCity] || { selectedCourseIds: [], individualSpotIds: [] };
        const hasSpots =
          (cityAttrSel.individualSpotIds?.length || 0) > 0 ||
          (cityAttrSel.selectedCourseIds?.length || 0) > 0 ||
          budgetPlaces.some((p) => p.city === c && !["ACCOMMODATION", "RESTAURANT", "CAFE"].includes(p.category));
        if (!hasSpots) {
          setAttractionCategoryFilterByCity((prev) => ({ ...prev, [c]: "ALL" }));
        }
      }
    });
  }, [state, budgetPlaces, attractionCategoryFilterByCity]);

  // 담은 숙소가 0개가 되었을 때 숙소 필터가 true로 남아있지 않도록 false로 자동 복귀
  useEffect(() => {
    if (state.status !== "ready") return;
    const prefs = state.preferences;
    Object.entries(showSavedOnlyAccByCity).forEach(([c, isSavedOnly]) => {
      if (isSavedOnly) {
        const accOverride = prefs.accommodationByCity?.[c as SupportedCity];
        const isPlaceOverride = typeof accOverride === "object" && accOverride !== null && "kind" in accOverride && (accOverride as any).kind === "PLACE";
        const hasSaved = isPlaceOverride || budgetPlaces.some((p) => p.city === c && p.category === "ACCOMMODATION");
        if (!hasSaved) {
          setShowSavedOnlyAccByCity((prev) => ({ ...prev, [c]: false }));
        }
      }
    });
  }, [state, budgetPlaces, showSavedOnlyAccByCity]);

  // Supabase DB (Hype_Catalog_Items) 동적 관광지 목록 상태 & 로딩 상태
  const [dbAttractionsByCity, setDbAttractionsByCity] = useState<Record<string, (AttractionSpot & { imageUrl?: string; deepLink?: string })[]>>({});
  const [isFetchingCityAttractions, setIsFetchingCityAttractions] = useState<Record<string, boolean>>({});
  const fetchedCitiesRef = useRef<Set<string>>(new Set());

  // 도시별 관광지 카탈로그 패치 및 프리페치(Prefetch) 함수
  const fetchCityAttractions = useCallback(async (city: string) => {
    if (fetchedCitiesRef.current.has(city)) return;
    fetchedCitiesRef.current.add(city);

    setIsFetchingCityAttractions((prev) => ({ ...prev, [city]: true }));
    try {
      const res = await fetch(`/api/catalog/attractions?city=${city}`);
      const json = await res.json();
      const validData = Array.isArray(json.data)
        ? json.data.filter((spot: any) => spot.cityCode === city)
        : [];

      if (json.success && validData.length > 0) {
        registerCustomAttractionSpots(validData);
        setDbAttractionsByCity((prev) => ({
          ...prev,
          [city]: validData,
        }));
      } else if (city === "SEOUL") {
        // 서울만 Supabase 직접 조회 폴백 (area_code=1) 허용
        try {
          const sbUrl1 = `https://aqfvmuytaukrkdmememh.supabase.co/rest/v1/Hype_Catalog_Items?select=*&budget_partition=eq.CITY_SPECIFIC&area_code=eq.1&main_category=eq.Sightseeing&order=id.asc&limit=50`;
          const sbUrl2 = `https://aqfvmuytaukrkdmememh.supabase.co/rest/v1/hype_catalog_items?select=*&budget_partition=eq.CITY_SPECIFIC&area_code=eq.1&main_category=eq.Sightseeing&order=item_id.asc&limit=50`;
          const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZnZtdXl0YXVrcmtkbWVtZW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2OTM0MzUsImV4cCI6MjEwMDI2OTQzNX0.he2Fy3OJ4RQEANKy2cuN2sb0BcfgQRhmZ9KJHTngaBs";
          let directRes = await fetch(sbUrl1, {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
          });
          if (!directRes.ok) {
            directRes = await fetch(sbUrl2, {
              headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
            });
          }
          if (directRes.ok) {
            const rows = await directRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
              const gradients = [
                "from-rose-500/15 to-pink-500/15",
                "from-blue-500/15 to-indigo-500/15",
                "from-emerald-500/15 to-teal-500/15",
                "from-amber-500/15 to-orange-500/15",
                "from-purple-500/15 to-fuchsia-500/15",
              ];
              const emojis = ["🎡", "🏞️", "🏙️", "🏛️", "☕", "📸", "🌉", "🎨"];
              const directSpots = rows.map((row: any, idx: number) => {
                const match = (row.title_en || "").match(/^(.*?)\s*\((.*?)\)$/);
                const nameEn = match ? match[1].trim() : row.title_en;
                const nameKo = match ? match[2].trim() : row.title_en;
                const meta = parseAttractionMetadata(row.desc_en || "");
                const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[row.content_id];
                return {
                  id: `kto_${row.content_id || row.id}`,
                  cityCode: "SEOUL" as SupportedCity,
                  nameKo: bilingual?.nameKo || nameKo,
                  nameEn: bilingual?.nameEn || nameEn,
                  categoryType: bilingual?.categoryType,
                  descKo: bilingual?.descKo || meta.cleanDesc || "한국관광공사 및 서울시 선정 추천 명소",
                  descEn: bilingual?.descEn || meta.cleanDesc || "Popular sightseeing spot in Seoul",
                  price: row.price_krw || 0,
                  priceStatus: (row.price_krw || 0) > 0 ? ("PAID" as const) : ("FREE" as const),
                  tag: row.sub_category || "Attraction",
                  emoji: emojis[idx % emojis.length],
                  gradientBg: gradients[idx % gradients.length],
                  isFeatured: true,
                  imageUrl: bilingual?.imageUrl || row.image_url,
                  deepLink: row.deep_link_template,
                  subwayInfo: meta.subwayInfo || bilingual?.subwayKo,
                  openingHours: meta.openingHours || bilingual?.hoursKo,
                  closedDays: meta.closedDays || bilingual?.closedKo,
                  officialUrl: meta.officialUrl || bilingual?.officialUrl,
                };
              });
              registerCustomAttractionSpots(directSpots);
              setDbAttractionsByCity((prev) => ({
                ...prev,
                SEOUL: directSpots,
              }));
            }
          }
        } catch (directErr) {
          console.warn("[Planner] Direct Supabase Fallback 실패:", directErr);
        }
      } else {
        // 타 도시(부산, 제주 등)는 기본 카탈로그로 바인딩
        const localSpots = ATTRACTION_SPOTS_CATALOG.filter((s) => s.cityCode === city && (SHOW_LOCAL_SPOTS || !s.isLocal));
        setDbAttractionsByCity((prev) => ({
          ...prev,
          [city]: localSpots,
        }));
      }
    } catch (err) {
      console.warn("[Planner] DB 관광지 연동 오류:", err);
      const localSpots = ATTRACTION_SPOTS_CATALOG.filter((s) => s.cityCode === city && (SHOW_LOCAL_SPOTS || !s.isLocal));
      setDbAttractionsByCity((prev) => ({
        ...prev,
        [city]: localSpots,
      }));
    } finally {
      setIsFetchingCityAttractions((prev) => ({ ...prev, [city]: false }));
    }
  }, []);

  // 1. 플래너 진입 시 여행 대상 도시들의 관광지 데이터를 백그라운드에서 사전 프리페치(Prefetch)
  useEffect(() => {
    if (state.status !== "ready") return;
    const prefetchCities = new Set<string>();
    if (state.draft.selectedCities && state.draft.selectedCities.length > 0) {
      state.draft.selectedCities.forEach((c) => prefetchCities.add(c));
    }
    prefetchCities.add("SEOUL");
    prefetchCities.add("BUSAN");
    prefetchCities.forEach((city) => {
      fetchCityAttractions(city);
    });
  }, [state, fetchCityAttractions]);

  // 2. 사용자가 도시 탭을 클릭했을 때 혹시 아직 패치되지 않은 도시라면 즉시 패치
  useEffect(() => {
    if (selectedCityTab === "ALL" || selectedCityTab === "TRANSPORT") return;
    fetchCityAttractions(selectedCityTab);
  }, [selectedCityTab, fetchCityAttractions]);

  // 여행 개요 섹션용 Option B Info 뱃지 및 툴팁 렌더러
  const renderOverviewSectionHeader = (
    key: string,
    icon: string,
    titleKo: string,
    titleEn: string,
    subtextKo: string,
    subtextEn: string,
    infoDescKo: string,
    infoDescEn: string,
    badgeKo?: string,
    badgeEn?: string,
    badgeType?: "total" | "daily"
  ) => {
    const isOpen = openOverviewInfoKey === key;
    const badgeText = locale === "ko" ? badgeKo : badgeEn;
    return (
      <div className="space-y-1">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {icon && <span className="text-base">{icon}</span>}
            <h4 className="text-sm font-extrabold text-[#0f172a]">
              {locale === "ko" ? titleKo : titleEn}
            </h4>

            {badgeText && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-2xs ${
                  badgeType === "daily"
                    ? "bg-rose-50 text-[#e25c5c] border-rose-200/90"
                    : "bg-slate-100/90 text-slate-600 border-slate-200"
                }`}
              >
                {badgeText}
              </span>
            )}

            {/* Info Badge Button */}
            <button
              type="button"
              onClick={() => setOpenOverviewInfoKey(isOpen ? null : key)}
              className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                isOpen
                  ? "bg-[#0f172a] text-white border-[#0f172a]"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400"
              }`}
              title={locale === "ko" ? "설명 보기" : "View explanation"}
            >
              <span>Info</span>
            </button>
          </div>

          {/* Popover Tooltip Aligned Directly Below Title Row */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                onClick={() => setOpenOverviewInfoKey(null)}
              />
              <div className="absolute left-0 top-full mt-1.5 w-full sm:w-80 max-w-full p-3.5 bg-slate-900 text-white text-[11px] font-normal leading-relaxed rounded-xl shadow-xl z-50 border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-200 whitespace-pre-line">
                    {locale === "ko" ? infoDescKo : infoDescEn}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenOverviewInfoKey(null)}
                    className="text-slate-400 hover:text-white text-xs p-0.5 rounded hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-0.5"
                    title={locale === "ko" ? "닫기" : "Close"}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {(locale === "ko" ? subtextKo : subtextEn) ? (
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            {locale === "ko" ? subtextKo : subtextEn}
          </p>
        ) : null}
      </div>
    );
  };

  // 목표 예산 직접 입력 상태
  const [isCustomTargetBudget, setIsCustomTargetBudget] = useState<boolean>(false);
  const [customTargetBudgetInput, setCustomTargetBudgetInput] = useState<string>("");

  // 여행 조건 수정 팝오버 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingBudgetTier, setPendingBudgetTier] = useState<BudgetTier | null>(null);
  const [editTab, setEditTab] = useState<"NIGHTS" | "ADULTS" | "CITIES">("NIGHTS");
  const [editDraft, setEditDraft] = useState<TripDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const handleModalNightsChange = (newNights: number) => {
    if (!editDraft) return;
    const newAllocations = calculateDefaultNightAllocation(editDraft.selectedCities, newNights);
    const defaultBudget = getDefaultTargetBudgetByNights(newNights, editDraft.adultCount);
    setEditDraft({
      ...editDraft,
      totalNights: newNights,
      cityNightAllocations: newAllocations,
      budgetTier: isCustomTargetBudget ? editDraft.budgetTier : defaultBudget.budgetTier,
      targetBudgetKrw: isCustomTargetBudget ? editDraft.targetBudgetKrw : defaultBudget.targetBudgetKrw,
    });
  };

  const handleModalCityNightChange = (city: SupportedCity, delta: number) => {
    if (!editDraft) return;
    const currentAlloc = editDraft.cityNightAllocations || {};
    const currentCityNights = currentAlloc[city] || 1;
    const allocatedSum = editDraft.selectedCities.reduce((sum, c) => sum + (currentAlloc[c] || 0), 0);
    const targetNights = editDraft.totalNights || 5;

    if (delta > 0 && allocatedSum >= targetNights) return;

    const nextCityNights = Math.max(1, currentCityNights + delta);

    const nextAlloc = {
      ...currentAlloc,
      [city]: nextCityNights,
    };

    setEditDraft({
      ...editDraft,
      cityNightAllocations: nextAlloc,
    });
  };

  const handleModalResetEqualAllocation = () => {
    if (!editDraft) return;
    const newAllocations = calculateDefaultNightAllocation(editDraft.selectedCities, editDraft.totalNights || 5);
    setEditDraft({
      ...editDraft,
      cityNightAllocations: newAllocations,
    });
  };

  const handleModalAdultsChange = (newAdults: number) => {
    if (!editDraft) return;
    const defaultBudget = getDefaultTargetBudgetByNights(editDraft.totalNights, newAdults);
    setEditDraft({
      ...editDraft,
      adultCount: newAdults,
      budgetTier: isCustomTargetBudget ? editDraft.budgetTier : defaultBudget.budgetTier,
      targetBudgetKrw: isCustomTargetBudget ? editDraft.targetBudgetKrw : defaultBudget.targetBudgetKrw,
    });
  };

  const handleSelectIntercityOverride = (routeKey: string, mode: IntercityTransportMode | string) => {
    if (state.status !== "ready") return;
    const currentOverrides = state.preferences.intercityTransportOverrides || {};
    const updatedOverrides = {
      ...currentOverrides,
      [routeKey]: mode as any,
    };
    const nextPrefs: PlannerPreferences = {
      ...state.preferences,
      intercityTransportOverrides: updatedOverrides,
    };

    savePlannerPreferences({
      draft: state.draft,
      accommodationByCity: nextPrefs.accommodationByCity,
      foodTier: nextPrefs.foodTier,
      foodOverrides: nextPrefs.foodOverrides,
      foodAddOnOverrides: nextPrefs.addOnSelections,
      attractionByCity: nextPrefs.attractionByCity,
      attractionSelections: nextPrefs.attractionSelections,
      attractionCustomDailyKrw: nextPrefs.attractionCustomDailyKrw,
      emergencyFundKrw: nextPrefs.emergencyFundKrw,
      emergencyFundPct: nextPrefs.emergencyFundPct,
      intercityTransportOverrides: updatedOverrides,
      localTransitStyle: nextPrefs.localTransitStyle,
      isKobusPassApplied: nextPrefs.isKobusPassApplied,
    });

    setState({
      ...state,
      preferences: nextPrefs,
    });
  };

  const handleSelectLocalTransitStyle = (style: LocalTransitStyle) => {
    if (state.status !== "ready") return;
    // 전체 도시 일괄 적용 시, 각 도시별 개별 설정도 해당 스타일로 맞춤
    const updatedCityStyles: Partial<Record<SupportedCity, LocalTransitStyle>> = {};
    state.draft.selectedCities.forEach((c) => {
      updatedCityStyles[c] = style;
    });

    const nextPrefs: PlannerPreferences = {
      ...state.preferences,
      localTransitStyle: style,
      cityTransitStyles: updatedCityStyles,
    };

    savePlannerPreferences({
      draft: state.draft,
      accommodationByCity: nextPrefs.accommodationByCity,
      foodTier: nextPrefs.foodTier,
      foodOverrides: nextPrefs.foodOverrides,
      foodAddOnOverrides: nextPrefs.addOnSelections,
      attractionByCity: nextPrefs.attractionByCity,
      attractionSelections: nextPrefs.attractionSelections,
      attractionCustomDailyKrw: nextPrefs.attractionCustomDailyKrw,
      emergencyFundKrw: nextPrefs.emergencyFundKrw,
      emergencyFundPct: nextPrefs.emergencyFundPct,
      intercityTransportOverrides: nextPrefs.intercityTransportOverrides,
      localTransitStyle: style,
      cityTransitStyles: updatedCityStyles,
      isKobusPassApplied: nextPrefs.isKobusPassApplied,
    });

    setState({
      ...state,
      preferences: nextPrefs,
    });
  };

  const handleSelectCityTransitStyle = (city: SupportedCity, style: LocalTransitStyle) => {
    if (state.status !== "ready") return;
    const currentCityStyles = state.preferences.cityTransitStyles || {};
    const updatedCityStyles = {
      ...currentCityStyles,
      [city]: style,
    };
    const nextPrefs: PlannerPreferences = {
      ...state.preferences,
      cityTransitStyles: updatedCityStyles,
    };

    savePlannerPreferences({
      draft: state.draft,
      accommodationByCity: nextPrefs.accommodationByCity,
      foodTier: nextPrefs.foodTier,
      foodOverrides: nextPrefs.foodOverrides,
      foodAddOnOverrides: nextPrefs.addOnSelections,
      attractionByCity: nextPrefs.attractionByCity,
      attractionSelections: nextPrefs.attractionSelections,
      attractionCustomDailyKrw: nextPrefs.attractionCustomDailyKrw,
      emergencyFundKrw: nextPrefs.emergencyFundKrw,
      emergencyFundPct: nextPrefs.emergencyFundPct,
      intercityTransportOverrides: nextPrefs.intercityTransportOverrides,
      localTransitStyle: nextPrefs.localTransitStyle,
      cityTransitStyles: updatedCityStyles,
      isKobusPassApplied: nextPrefs.isKobusPassApplied,
    });

    setState({
      ...state,
      preferences: nextPrefs,
    });
  };

  const handleReorderCities = (newCities: SupportedCity[]) => {
    if (state.status !== "ready") return;
    const nextDraft: TripDraft = {
      ...state.draft,
      selectedCities: newCities,
    };
    saveTripDraft(nextDraft);
    setState({
      ...state,
      draft: nextDraft,
    });
  };

  const handleModalToggleCity = (cityCode: SupportedCity) => {
    if (!editDraft) return;
    let nextCities: SupportedCity[];
    if (editDraft.selectedCities.includes(cityCode)) {
      nextCities = editDraft.selectedCities.filter((c) => c !== cityCode);
    } else {
      if (editDraft.selectedCities.length >= 4) return;
      nextCities = [...editDraft.selectedCities, cityCode];
    }
    nextCities = sortCitiesByStandardOrder(nextCities);
    const newAllocations = calculateDefaultNightAllocation(nextCities, editDraft.totalNights);
    setEditDraft({
      ...editDraft,
      selectedCities: nextCities,
      cityNightAllocations: newAllocations,
    });
  };

  const handleApplyTripDetailsEdit = () => {
    if (!editDraft) return;
    setEditError(null);

    const validation = validateTripDraft(editDraft);
    if (!validation.success) {
      const firstError = validation.errors[0];
      let errMsg = "여행 정보를 올바르게 입력해 주세요.";
      if (firstError === "invalid_nights") errMsg = "여행 기간은 1박~14박 사이로 설정해 주세요.";
      if (firstError === "invalid_adults") errMsg = "여행 인원은 1명~10명 사이로 설정해 주세요.";
      if (firstError === "invalid_cities_count" || firstError === "invalid_city") errMsg = "여행 목적지는 최소 1곳 이상 선택해 주세요.";
      setEditError(errMsg);
      return;
    }

    const currentAlloc = editDraft.cityNightAllocations || {};
    const allocatedSum = editDraft.selectedCities.reduce((sum, c) => sum + (currentAlloc[c] || 0), 0);
    const targetNights = editDraft.totalNights || 5;

    if (allocatedSum !== targetNights) {
      setEditError(`전체 여행 기간(${targetNights}박)에 맞추어 도시별 박수를 모두 배분해 주세요. (현재 ${allocatedSum}박 배분됨)`);
      return;
    }

    saveTripDraft(editDraft);
    if (state.status === "ready") {
      savePlannerPreferences({
        accommodationByCity: state.preferences.accommodationByCity,
        foodOverrides: state.preferences.foodOverrides,
        foodAddOnOverrides: state.preferences.addOnSelections,
        attractionByCity: state.preferences.attractionByCity,
        attractionSelections: state.preferences.attractionSelections,
        emergencyFundKrw: state.preferences.emergencyFundKrw,
        emergencyFundPct: state.preferences.emergencyFundPct,
        draft: editDraft,
      });
    }

    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        draft: editDraft,
      };
    });

    setIsEditModalOpen(false);
    setToastMessage("여행 조건이 반영되어 예산이 실시간 재계산되었습니다.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDirectCityNightChange = (city: SupportedCity, delta: number) => {
    if (state.status !== "ready") return;
    const currentDraft = state.draft;
    const maxTotalNights = currentDraft.totalNights || 5;
    const currentAlloc = currentDraft.cityNightAllocations || {};
    const currentCityNights = currentAlloc[city] ?? 1;
    const selectedCities = currentDraft.selectedCities;
    const allocatedSum = selectedCities.reduce((sum, c) => sum + (currentAlloc[c] || 0), 0);

    const nextAlloc = { ...currentAlloc };

    if (delta > 0) {
      if (allocatedSum >= maxTotalNights) {
        setToastMessage(
          locale === "ko"
            ? `총 ${maxTotalNights}박 예산이 모두 배분되었습니다. 다른 도시 박수를 먼저 - 로 줄여주세요.`
            : `Total ${maxTotalNights} nights already allocated. Reduce another city first.`
        );
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      nextAlloc[city] = currentCityNights + 1;
    } else if (delta < 0) {
      if (currentCityNights <= 0) return;
      nextAlloc[city] = currentCityNights - 1;
    }

    const nextDraft: TripDraft = {
      ...currentDraft,
      cityNightAllocations: nextAlloc,
    };

    const validation = validateTripDraft(nextDraft);
    if (!validation.success) return;

    saveTripDraft(nextDraft);
    savePlannerPreferences({
      accommodationByCity: state.preferences.accommodationByCity,
      foodOverrides: state.preferences.foodOverrides,
      foodAddOnOverrides: state.preferences.addOnSelections,
      attractionByCity: state.preferences.attractionByCity,
      attractionSelections: state.preferences.attractionSelections,
      emergencyFundKrw: state.preferences.emergencyFundKrw,
      emergencyFundPct: state.preferences.emergencyFundPct,
      draft: nextDraft,
    });

    setState((prev) => (prev.status === "ready" ? { ...prev, draft: nextDraft } : prev));

    const cityName = locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city);
    const updatedNights = nextAlloc[city];
    const updatedSum = selectedCities.reduce((sum, c) => sum + (nextAlloc[c] || 0), 0);
    const unallocated = maxTotalNights - updatedSum;

    setToastMessage(
      locale === "ko"
        ? `${cityName} 체류 기간이 ${updatedNights === 0 ? "당일" : `${updatedNights}박`}으로 변경되었습니다.${unallocated > 0 ? ` (${unallocated}박 여유)` : ""}`
        : `${cityName} stay updated to ${updatedNights} night(s).`
    );
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setSavedPlaceCount(loadSavedPlaceIds().length);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (state.status === "ready") {
      latestPrefsRef.current = state.preferences;
    }
  }, [state]);

  if (state.status === "missing") {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50 flex flex-col items-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-[#e25c5c]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11a2 2 0 012-2h1.055M11 20.055V18a2 2 0 012-2h3.5a2 2 0 002.5-2.5V11" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">{dict.planner.missingTitle}</h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm">{dict.planner.missingDescription}</p>
          <Link
            href={`/${locale}`}
            className="mt-8 flex w-full items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#e25c5c] text-white font-bold text-base shadow-md hover:bg-[#d14b4b] hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:outline-offset-2"
          >
            <span>{dict.planner.missingButton}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50 flex flex-col items-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">{dict.planner.invalidTitle}</h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm">{dict.planner.invalidDescription}</p>
          <Link
            href={`/${locale}`}
            className="mt-8 flex w-full items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#e25c5c] text-white font-bold text-base shadow-md hover:bg-[#d14b4b] hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:outline-offset-2"
          >
            <span>{dict.planner.invalidButton}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "calculation-error") {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50 flex flex-col items-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-[#e25c5c]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">{dict.planner.calculationErrorTitle}</h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm">{dict.planner.calculationErrorDescription}</p>
          <Link
            href={`/${locale}`}
            className="mt-8 flex w-full items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#e25c5c] text-white font-bold text-base shadow-md hover:bg-[#d14b4b] hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:outline-offset-2"
          >
            <span>{dict.planner.calculationErrorButton}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const { draft, preferences } = state;
  const adultCount = draft.adultCount || 1;

  // 쇼핑 예산 금액 산출 (1인 기준 옵션 × adultCount 또는 직접 입력)
  const shoppingAmountKrw = (() => {
    if (shoppingOption === "NONE") return 0;
    if (shoppingOption === "BEAUTY") return 200000 * adultCount;
    if (shoppingOption === "FASHION") return 300000 * adultCount;
    if (shoppingOption === "SOUVENIR") return 100000 * adultCount;
    if (shoppingOption === "CUSTOM") return (parseInt(shoppingCustomInput, 10) || 0);
    return 0;
  })();

  const activeEmergencyPct = preferences.emergencyFundPct !== undefined
    ? preferences.emergencyFundPct
    : (preferences.emergencyFundKrw === undefined || preferences.emergencyFundKrw === 0 ? 0.10 : undefined);

  const basePlanForEmergency = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG, {
    accommodation: preferences.accommodationByCity,
    foodTier: preferences.foodTier,
    food: preferences.foodOverrides,
    foodAddOns: preferences.addOnSelections,
    foodBasketSelections: preferences.foodBasketSelections,
    attraction: preferences.attractionByCity,
    attractionSelections: preferences.attractionSelections,
    attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
    emergencyFundKrw: 0,
    localTransitStyle: preferences.localTransitStyle,
    cityTransitStyles: preferences.cityTransitStyles,
  });

  // K-스팟에서 담긴 맛집/카페 총액 계산
  const allCustomFoodTotalKrw = budgetPlaces
    .filter((p) => p.category === "RESTAURANT" || p.category === "CAFE")
    .reduce((sum, p) => sum + (p.priceKrw ?? (p as any).estimatedPriceKrw ?? (p.category === "CAFE" ? 8000 : 18000)) * adultCount, 0);

  // 비상금 비율 계산 기준 총액 = (숙소 + 식비 + 교통 + 관광) + 쇼핑 예산 + K-스팟 맛집/카페
  const baseEmergencyGrandTotal = basePlanForEmergency.grandTotalKrw + shoppingAmountKrw + allCustomFoodTotalKrw;
  const emergencyAdultCount = adultCount;
  const computedEmergencyKrw = activeEmergencyPct !== undefined
    ? Math.round(((baseEmergencyGrandTotal / emergencyAdultCount) * activeEmergencyPct) / 1000) * 1000 * emergencyAdultCount
    : ((preferences.emergencyFundKrw || 0) * emergencyAdultCount);

  const perPersonEmergencyKrw = Math.round(computedEmergencyKrw / emergencyAdultCount);

  const plan = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG, {
    accommodation: preferences.accommodationByCity,
    foodTier: preferences.foodTier,
    food: preferences.foodOverrides,
    foodAddOns: preferences.addOnSelections,
    foodBasketSelections: preferences.foodBasketSelections,
    attraction: preferences.attractionByCity,
    attractionSelections: preferences.attractionSelections,
    attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
    emergencyFundKrw: computedEmergencyKrw,
    intercityTransportOverrides: preferences.intercityTransportOverrides,
    localTransitStyle: preferences.localTransitStyle,
    cityTransitStyles: preferences.cityTransitStyles,
    isKobusPassApplied: preferences.isKobusPassApplied,
  });

  const handleCopySummary = () => {
    try {
      const summaryText = generateBudgetSummaryText(plan, "", dict, locale);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryText)
          .then(() => {
            setToastMessage(dict.planner.copySummarySuccess);
            setTimeout(() => setToastMessage(null), 3000);
          })
          .catch(() => {
            setToastMessage(dict.planner.copySummaryError);
            setTimeout(() => setToastMessage(null), 3000);
          });
      } else {
        setToastMessage(dict.planner.copySummaryError);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      setToastMessage(dict.planner.copySummaryError);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };


  const isOverBudget = plan.grandTotalKrw > plan.targetBudgetKrw;
  const clampedUsage = Math.min(100, (plan.grandTotalKrw / plan.targetBudgetKrw) * 100);

  const handleStayOverride = (city: SupportedCity, selection: BudgetBasketId | AccommodationSelection) => {
    const accSelectionObj: AccommodationSelection =
      typeof selection === "string" ? { kind: "TIER", basketId: selection } : selection;

    const nextAcc = {
      ...preferences.accommodationByCity,
      [city]: accSelectionObj,
    };

    const saved = savePlannerPreferences({
      accommodationByCity: nextAcc,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      attractionSelections: preferences.attractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            accommodationByCity: nextAcc,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleTargetBudgetTierChange = (newTier: BudgetTier) => {
    const adultCount = draft.adultCount || 1;
    let perPersonAmount = 2000000;
    if (newTier === "BUDGET") perPersonAmount = 1000000;
    if (newTier === "STANDARD") perPersonAmount = 2000000;
    if (newTier === "PREMIUM") perPersonAmount = 3000000;

    const nextTargetBudget = perPersonAmount * adultCount;
    const nextDraft: TripDraft = {
      ...draft,
      budgetTier: newTier,
      targetBudgetKrw: nextTargetBudget,
    };

    saveTripDraft(nextDraft);
    setIsCustomTargetBudget(false);

    // 사용자의 모든 개별 오버라이드(숙소, K-Food, 관광 등) 100% 완전 보존
    savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodTier: preferences.foodTier,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      attractionSelections: preferences.attractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft: nextDraft,
    });

    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        draft: nextDraft,
      };
    });
  };

  const handleCustomTargetBudgetSubmit = (perPersonAmount: number) => {
    if (isNaN(perPersonAmount) || perPersonAmount <= 0) return;
    const adultCount = draft.adultCount || 1;
    const nextTargetBudget = perPersonAmount * adultCount;

    let inferredTier: BudgetTier = "STANDARD";
    if (perPersonAmount <= 1000000) inferredTier = "BUDGET";
    else if (perPersonAmount >= 2000000) inferredTier = "PREMIUM";

    const nextDraft: TripDraft = {
      ...draft,
      budgetTier: inferredTier,
      targetBudgetKrw: nextTargetBudget,
    };

    saveTripDraft(nextDraft);

    savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodTier: preferences.foodTier,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      attractionSelections: preferences.attractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft: nextDraft,
    });

    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        draft: nextDraft,
      };
    });
  };

  const handleFoodTierChange = (newFoodTier: BudgetTier) => {
    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodTier: newFoodTier,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      attractionSelections: preferences.attractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            foodTier: newFoodTier,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleResetStay = (cityTarget: SupportedCity) => {
    const currentStay = preferences.accommodationByCity?.[cityTarget];
    if (currentStay && typeof currentStay === "object" && "placeId" in currentStay) {
      const placeId = (currentStay as any).placeId;
      if (!isDefaultAccommodationSpot(placeId)) {
        const customAcc = budgetPlaces.find((p) => p.id === placeId);
        if (customAcc) {
          toggleBudgetPlace(customAcc);
        }
      }
    }

    const nextAcc = { ...preferences.accommodationByCity };
    delete nextAcc[cityTarget];

    const saved = savePlannerPreferences({
      accommodationByCity: nextAcc,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      attractionSelections: preferences.attractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            accommodationByCity: nextAcc,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleAttractionOverride = (city: SupportedCity, basketId: BudgetBasketId) => {
    const nextAttr = {
      ...preferences.attractionByCity,
      [city]: basketId,
    };

    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: nextAttr,
      attractionSelections: preferences.attractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            attractionByCity: nextAttr,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleSetAllCitiesAttractionBasket = (basketId: BudgetBasketId) => {
    const nextAttr: Record<string, BudgetBasketId> = {};
    draft.selectedCities.forEach((city) => {
      nextAttr[city] = basketId;
    });

    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: nextAttr,
      attractionSelections: preferences.attractionSelections,
      attractionCustomDailyKrw: undefined,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            attractionByCity: nextAttr,
            attractionCustomDailyKrw: undefined,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleResetAttraction = (cityTarget: SupportedCity) => {
    const nextAttr = { ...preferences.attractionByCity };
    delete nextAttr[cityTarget];

    const nextAttrSel = { ...preferences.attractionSelections };
    delete nextAttrSel[cityTarget];

    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: nextAttr,
      attractionSelections: nextAttrSel,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            attractionByCity: nextAttr,
            attractionSelections: nextAttrSel,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleToggleCourse = (city: SupportedCity, courseId: string) => {
    const currentCitySel = preferences.attractionSelections?.[city] || { selectedCourseIds: [], individualSpotIds: [] };
    const course = TOUR_COURSE_PRESETS.find((c) => c.id === courseId);
    if (!course) return;

    // 현재 이 코스에 속한 장소 중 담겨있는 장소가 하나라도 있는지 검사
    const isExplicitlySelected = currentCitySel.selectedCourseIds.includes(courseId);
    const includedIndividualSpots = course.spotIds.filter((sid) =>
      currentCitySel.individualSpotIds.some((id) => isSameSpot(id, sid))
    );
    const hasAnySpotInCourse = isExplicitlySelected || includedIndividualSpots.length > 0;

    let nextCourseIds = currentCitySel.selectedCourseIds.filter((id) => id !== courseId);
    let nextIndividualSpotIds = [...currentCitySel.individualSpotIds];

    const courseTitle = locale === "ko" ? course.nameKo : course.nameEn;

    // [상황 1] 완전 선택 또는 일부 담김 상태에서 클릭 시 -> 코스 및 관련 장소 전부 일괄 해제 (초기 미선택 무표시 상태로 리셋)
    if (hasAnySpotInCourse) {
      nextIndividualSpotIds = nextIndividualSpotIds.filter(
        (id) => !course.spotIds.some((sid) => isSameSpot(sid, id))
      );

      setToastMessage(
        locale === "ko"
          ? `[${courseTitle}]의 모든 장소가 예산에서 제외되었습니다.`
          : `All spots in [${courseTitle}] removed from budget.`
      );
      setTimeout(() => setToastMessage(null), 2500);

      // K-스팟 budgetPlaces에서도 해당 코스 장소들 일괄 제거
      const currentBudget = loadBudgetPlaces();
      const nextBudget = currentBudget.filter(
        (p) => !course.spotIds.some((sid) => isSameSpot(p.id, sid) || isSameSpot(p.contentId, sid))
      );
      saveBudgetPlaces(nextBudget);
    }
    // [상황 2] 미선택(표시 없음) 상태에서 클릭 시 -> 코스 전체 담기
    else {
      nextCourseIds.push(courseId);

      setToastMessage(
        locale === "ko"
          ? `[${courseTitle}]의 장소들이 예산에 담겼습니다.`
          : `[${courseTitle}] spots added to budget.`
      );
      setTimeout(() => setToastMessage(null), 2500);

      // K-스팟 budgetPlaces에 해당 코스 장소들 추가
      const currentBudget = loadBudgetPlaces();
      const allSpots = [...(dbAttractionsByCity[city] || []), ...ATTRACTION_SPOTS_CATALOG];
      const newItems: PlaceItem[] = [];
      course.spotIds.forEach((sid) => {
        if (
          !currentBudget.some((p) => isSameSpot(p.id, sid) || isSameSpot(p.contentId, sid)) &&
          !newItems.some((p) => isSameSpot(p.id, sid) || isSameSpot(p.contentId, sid))
        ) {
          const sp = allSpots.find((s) => isSameSpot(s.id, sid));
          if (sp) newItems.push(spotToPlaceItem(sp));
        }
      });
      if (newItems.length > 0) {
        saveBudgetPlaces([...currentBudget, ...newItems]);
      }
    }

    const nextAttractionSelections = {
      ...preferences.attractionSelections,
      [city]: {
        selectedCourseIds: nextCourseIds,
        individualSpotIds: nextIndividualSpotIds,
      },
    };

    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      attractionSelections: nextAttractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            attractionSelections: nextAttractionSelections,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleToggleSpot = (city: SupportedCity, spotId: string) => {
    const currentCitySel = preferences.attractionSelections?.[city] || { selectedCourseIds: [], individualSpotIds: [] };
    const customKSpot = budgetPlaces.find((p) => isSameSpot(p.id, spotId) || isSameSpot(p.contentId, spotId));

    // 이 spotId가 속한 코스 프리셋 중 현재 선택되어 있는 코스가 있는지 확인
    const matchingSelectedCourses = (currentCitySel.selectedCourseIds || []).filter((cid) => {
      const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
      return course?.spotIds.some((sid) => isSameSpot(sid, spotId));
    });

    const isIndividualSelected = currentCitySel.individualSpotIds.some((sid) => isSameSpot(sid, spotId));
    const isIncludedInSelectedCourse = matchingSelectedCourses.length > 0;
    const isCurrentlyActive = isIndividualSelected || isIncludedInSelectedCourse;

    const allSpots = [...(dbAttractionsByCity[city] || []), ...ATTRACTION_SPOTS_CATALOG];
    const targetSpot = allSpots.find((s) => isSameSpot(s.id, spotId));
    const spotName = locale === "ko" ? (targetSpot?.nameKo || "관광지") : (targetSpot?.nameEn || "Attraction");

    let nextCourseIds = [...(currentCitySel.selectedCourseIds || [])];
    let nextSpotIds: string[] = [];

    // [CASE 1] 코스 프리셋에 포함되어 담긴 장소를 제외하려는 경우 (하이브리드 언번들링)
    if (isIncludedInSelectedCourse) {
      // 1) 해당 코스들의 모든 spotIds를 추출하여 기존 individualSpotIds와 합병
      const spotsFromCourses: string[] = [];
      matchingSelectedCourses.forEach((cid) => {
        const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
        if (course) {
          course.spotIds.forEach((sid) => spotsFromCourses.push(normalizeSpotKey(sid)));
        }
      });

      const mergedSpotIdsSet = new Set<string>([
        ...currentCitySel.individualSpotIds.map(normalizeSpotKey),
        ...spotsFromCourses,
      ]);

      // 2) 클릭한 장소만 쏙 제외
      mergedSpotIdsSet.delete(normalizeSpotKey(spotId));
      nextSpotIds = Array.from(mergedSpotIdsSet);

      // 3) 해당 코스는 개별 장소들로 분해되었으므로 selectedCourseIds에서 제외
      nextCourseIds = nextCourseIds.filter((cid) => !matchingSelectedCourses.includes(cid));

      setToastMessage(
        locale === "ko"
          ? `💡 코스가 개별 선택으로 전환되며 [${spotName}]이(가) 예산에서 제외되었습니다.`
          : `💡 Course converted to individual spots, and [${spotName}] was removed.`
      );
      setTimeout(() => setToastMessage(null), 3000);
    }
    // [CASE 2] 개별적으로 이미 담겨 있던 장소를 제외하려는 경우
    else if (isIndividualSelected) {
      // K-스팟에서 유입된 비기본 커스텀 관광지의 담기 취소 시: 플래너 목록 및 예산에서 완전 제거
      if (!isDefaultAttractionSpot(spotId) && customKSpot) {
        toggleBudgetPlace(customKSpot);
        setToastMessage(locale === "ko" ? "선택된 관광지가 예산 및 목록에서 제외되었습니다." : "Attraction removed from budget and list.");
        setTimeout(() => setToastMessage(null), 2500);
        return;
      }

      nextSpotIds = currentCitySel.individualSpotIds.filter((id) => !isSameSpot(id, spotId));
      setToastMessage(
        locale === "ko"
          ? `[${spotName}]이(가) 예산에서 제외되었습니다.`
          : `[${spotName}] removed from budget.`
      );
      setTimeout(() => setToastMessage(null), 2000);
    }
    // [CASE 3] 담겨 있지 않던 장소를 새로 예산에 담는 경우
    else {
      const normSpotId = normalizeSpotKey(spotId);
      nextSpotIds = [...currentCitySel.individualSpotIds, normSpotId];
      setToastMessage(
        locale === "ko"
          ? `[${spotName}]이(가) 예산에 담겼습니다.`
          : `[${spotName}] added to budget.`
      );
      setTimeout(() => setToastMessage(null), 2000);
    }

    const nextAttractionSelections = {
      ...preferences.attractionSelections,
      [city]: {
        selectedCourseIds: nextCourseIds,
        individualSpotIds: nextSpotIds,
      },
    };

    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      attractionSelections: nextAttractionSelections,
      attractionCustomDailyKrw: preferences.attractionCustomDailyKrw,
      emergencyFundKrw: preferences.emergencyFundKrw,
      emergencyFundPct: preferences.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            attractionSelections: nextAttractionSelections,
          },
        };
      });

      // K-스팟 budgetPlaces 스토리지와 즉시 양방향 동기화
      const currentBudget = loadBudgetPlaces();
      if (!isCurrentlyActive) {
        // 새로 추가됨 -> budgetPlaces에도 장소 추가
        if (targetSpot && !currentBudget.some((p) => isSameSpot(p.id, spotId) || isSameSpot(p.contentId, spotId))) {
          const placeItem = spotToPlaceItem(targetSpot);
          saveBudgetPlaces([...currentBudget, placeItem]);
        }
      } else {
        // 제외됨 -> budgetPlaces에서도 제거
        const nextBudget = currentBudget.filter((p) => !isSameSpot(p.id, spotId) && !isSameSpot(p.contentId, spotId));
        saveBudgetPlaces(nextBudget);
      }
    } else {
      setSaveError(true);
    }
  };

  const handleSaveTripPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestPrefsRef.current) return;
    const success = saveSavedTrip(saveTitle, draft, latestPrefsRef.current);
    if (success) {
      setToastMessage(dict.planner.saveTripSuccess);
      setIsSaveModalOpen(false);
      setSaveTitle("");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleFoodBasketUpdateQuantity = (foodId: string, delta: number) => {
    if (!latestPrefsRef.current) return;

    const currentBasket = latestPrefsRef.current.foodBasketSelections || [];
    const existingIndex = currentBasket.findIndex((item) => item.foodId === foodId);

    let nextBasket: FoodBasketItemSelection[];
    if (existingIndex >= 0) {
      const nextQty = Math.max(0, currentBasket[existingIndex].quantity + delta);
      if (nextQty === 0) {
        nextBasket = currentBasket.filter((item) => item.foodId !== foodId);
      } else {
        nextBasket = currentBasket.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: nextQty } : item
        );
      }
    } else {
      if (delta > 0) {
        nextBasket = [...currentBasket, { foodId, quantity: delta }];
      } else {
        nextBasket = currentBasket;
      }
    }

    const nextPrefs: PlannerPreferences = {
      ...latestPrefsRef.current,
      foodBasketSelections: nextBasket,
    };

    const saved = savePlannerPreferences({
      draft,
      accommodationByCity: nextPrefs.accommodationByCity,
      foodTier: nextPrefs.foodTier,
      foodOverrides: nextPrefs.foodOverrides,
      foodAddOnOverrides: nextPrefs.addOnSelections,
      foodBasketSelections: nextBasket,
      attractionByCity: nextPrefs.attractionByCity,
      attractionSelections: nextPrefs.attractionSelections,
      attractionCustomDailyKrw: nextPrefs.attractionCustomDailyKrw,
      emergencyFundKrw: nextPrefs.emergencyFundKrw,
      emergencyFundPct: nextPrefs.emergencyFundPct,
      intercityTransportOverrides: nextPrefs.intercityTransportOverrides,
      localTransitStyle: nextPrefs.localTransitStyle,
      cityTransitStyles: nextPrefs.cityTransitStyles,
      isKobusPassApplied: nextPrefs.isKobusPassApplied,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = nextPrefs;
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: nextPrefs,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleFoodBasketSetQuantity = (foodId: string, quantity: number) => {
    if (!latestPrefsRef.current) return;

    const currentBasket = latestPrefsRef.current.foodBasketSelections || [];
    const existingIndex = currentBasket.findIndex((item) => item.foodId === foodId);

    let nextBasket: FoodBasketItemSelection[];
    const validQty = Math.max(0, Math.floor(quantity));
    if (validQty === 0) {
      nextBasket = currentBasket.filter((item) => item.foodId !== foodId);
    } else if (existingIndex >= 0) {
      nextBasket = currentBasket.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: validQty } : item
      );
    } else {
      nextBasket = [...currentBasket, { foodId, quantity: validQty }];
    }

    const nextPrefs: PlannerPreferences = {
      ...latestPrefsRef.current,
      foodBasketSelections: nextBasket,
    };

    const saved = savePlannerPreferences({
      draft,
      accommodationByCity: nextPrefs.accommodationByCity,
      foodTier: nextPrefs.foodTier,
      foodOverrides: nextPrefs.foodOverrides,
      foodAddOnOverrides: nextPrefs.addOnSelections,
      foodBasketSelections: nextBasket,
      attractionByCity: nextPrefs.attractionByCity,
      attractionSelections: nextPrefs.attractionSelections,
      attractionCustomDailyKrw: nextPrefs.attractionCustomDailyKrw,
      emergencyFundKrw: nextPrefs.emergencyFundKrw,
      emergencyFundPct: nextPrefs.emergencyFundPct,
      intercityTransportOverrides: nextPrefs.intercityTransportOverrides,
      localTransitStyle: nextPrefs.localTransitStyle,
      cityTransitStyles: nextPrefs.cityTransitStyles,
      isKobusPassApplied: nextPrefs.isKobusPassApplied,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = nextPrefs;
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: nextPrefs,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleFoodBasketClear = () => {
    if (!latestPrefsRef.current) return;

    const nextPrefs: PlannerPreferences = {
      ...latestPrefsRef.current,
      foodBasketSelections: [],
    };

    const saved = savePlannerPreferences({
      draft,
      accommodationByCity: nextPrefs.accommodationByCity,
      foodTier: nextPrefs.foodTier,
      foodOverrides: nextPrefs.foodOverrides,
      foodAddOnOverrides: nextPrefs.addOnSelections,
      foodBasketSelections: [],
      attractionByCity: nextPrefs.attractionByCity,
      attractionSelections: nextPrefs.attractionSelections,
      attractionCustomDailyKrw: nextPrefs.attractionCustomDailyKrw,
      emergencyFundKrw: nextPrefs.emergencyFundKrw,
      emergencyFundPct: nextPrefs.emergencyFundPct,
      intercityTransportOverrides: nextPrefs.intercityTransportOverrides,
      localTransitStyle: nextPrefs.localTransitStyle,
      cityTransitStyles: nextPrefs.cityTransitStyles,
      isKobusPassApplied: nextPrefs.isKobusPassApplied,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = nextPrefs;
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: nextPrefs,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleSelectFoodReplacement = (slotId: string, foodItemId: string) => {
    if (!latestPrefsRef.current) return;

    const currentFood = latestPrefsRef.current.foodOverrides;
    const nextFood = {
      ...currentFood,
      [slotId]: foodItemId,
    };

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: nextFood,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      emergencyFundKrw: latestPrefsRef.current.emergencyFundKrw,
      emergencyFundPct: latestPrefsRef.current.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        foodOverrides: nextFood,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleClearFoodReplacement = (slotId: string) => {
    if (!latestPrefsRef.current) return;

    const currentFood = latestPrefsRef.current.foodOverrides;
    const nextFood = { ...currentFood };
    delete nextFood[slotId];

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: nextFood,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      emergencyFundKrw: latestPrefsRef.current.emergencyFundKrw,
      emergencyFundPct: latestPrefsRef.current.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        foodOverrides: nextFood,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleSelectAddOn = (slotId: string, addOnItemId: string, quantity: number) => {
    if (!latestPrefsRef.current) return;

    const currentAddOns = latestPrefsRef.current.addOnSelections || {};
    const slotAddOns = currentAddOns[slotId] ? [...currentAddOns[slotId]] : [];

    if (slotAddOns.some((item) => item.addOnItemId === addOnItemId)) return;

    const nextAddOns = {
      ...currentAddOns,
      [slotId]: [...slotAddOns, { addOnItemId, quantity }],
    };

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: nextAddOns,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      emergencyFundKrw: latestPrefsRef.current.emergencyFundKrw,
      emergencyFundPct: latestPrefsRef.current.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        addOnSelections: nextAddOns,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleRemoveAddOn = (slotId: string, addOnItemId: string) => {
    if (!latestPrefsRef.current) return;

    const currentAddOns = latestPrefsRef.current.addOnSelections || {};
    if (!currentAddOns[slotId]) return;

    const slotAddOns = currentAddOns[slotId].filter((item) => item.addOnItemId !== addOnItemId);
    const nextAddOns = { ...currentAddOns };

    if (slotAddOns.length > 0) {
      nextAddOns[slotId] = slotAddOns;
    } else {
      delete nextAddOns[slotId];
    }

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: nextAddOns,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      emergencyFundKrw: latestPrefsRef.current.emergencyFundKrw,
      emergencyFundPct: latestPrefsRef.current.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        addOnSelections: nextAddOns,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleChangeAddOnQuantity = (slotId: string, addOnItemId: string, quantity: number) => {
    if (!latestPrefsRef.current) return;

    const currentAddOns = latestPrefsRef.current.addOnSelections || {};
    if (!currentAddOns[slotId]) return;

    const nextAddOns = {
      ...currentAddOns,
      [slotId]: currentAddOns[slotId].map((item) =>
        item.addOnItemId === addOnItemId ? { ...item, quantity } : item
      ),
    };

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: nextAddOns,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      emergencyFundKrw: latestPrefsRef.current.emergencyFundKrw,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        addOnSelections: nextAddOns,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleEmergencyFundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!latestPrefsRef.current) return;

    const valStr = e.target.value;
    setEmergencyManualInput(valStr);

    const raw = valStr === "" ? 0 : Number(valStr);

    const isValValid = (v: unknown): v is number => {
      return typeof v === "number" && !isNaN(v) && isFinite(v) && v >= 0 && Number.isInteger(v);
    };

    // 1만원 단위로 스냅
    const val = isValValid(raw) ? Math.round(raw / 10000) * 10000 : raw;

    if (!isValValid(val)) {
      setSaveError(true);
      return;
    }

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      emergencyFundKrw: val,
      emergencyFundPct: undefined,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        emergencyFundKrw: val,
        emergencyFundPct: undefined,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleActivityManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setActivityManualInput(valStr);

    const raw = valStr === "" ? 0 : Number(valStr);
    const isValValid = (v: unknown): v is number => {
      return typeof v === "number" && !isNaN(v) && isFinite(v) && v >= 0 && Number.isInteger(v);
    };

    if (!isValValid(raw) || raw === 0) {
      if (!latestPrefsRef.current) return;
      const saved = savePlannerPreferences({
        accommodationByCity: latestPrefsRef.current.accommodationByCity,
        foodOverrides: latestPrefsRef.current.foodOverrides,
        foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
        attractionByCity: latestPrefsRef.current.attractionByCity,
        attractionSelections: latestPrefsRef.current.attractionSelections,
        attractionCustomDailyKrw: undefined,
        emergencyFundKrw: latestPrefsRef.current.emergencyFundKrw,
        emergencyFundPct: latestPrefsRef.current.emergencyFundPct,
        draft,
      });
      if (saved) {
        latestPrefsRef.current = {
          ...latestPrefsRef.current,
          attractionCustomDailyKrw: undefined,
        };
        setState((prev) => (prev.status === "ready" ? { ...prev, preferences: latestPrefsRef.current! } : prev));
      }
      return;
    }

    if (!latestPrefsRef.current) return;
    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      attractionCustomDailyKrw: raw,
      emergencyFundKrw: latestPrefsRef.current.emergencyFundKrw,
      emergencyFundPct: latestPrefsRef.current.emergencyFundPct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        attractionCustomDailyKrw: raw,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleEmergencyFundPctChange = (pct: number) => {
    if (!latestPrefsRef.current) return;
    setEmergencyManualInput("");
    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      attractionSelections: latestPrefsRef.current.attractionSelections,
      emergencyFundKrw: undefined,
      emergencyFundPct: pct,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        emergencyFundKrw: undefined,
        emergencyFundPct: pct,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const getCatalogStayPrice = (city: SupportedCity, basketId: BudgetBasketId): number => {
    const cityMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ACCOMMODATION" && b.id === basketId && b.applicableCity === city
    );
    if (cityMatch) return cityMatch.representativePriceKrw;
    const fallbackMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ACCOMMODATION" && b.id === basketId
    );
    return fallbackMatch ? fallbackMatch.representativePriceKrw : 0;
  };

  const getCatalogAttractionPrice = (city: SupportedCity, basketId: BudgetBasketId): number => {
    const cityMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ATTRACTION" && b.id === basketId && b.applicableCity === city
    );
    if (cityMatch) return cityMatch.representativePriceKrw;
    const fallbackMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ATTRACTION" && b.id === basketId
    );
    return fallbackMatch ? fallbackMatch.representativePriceKrw : 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 space-y-6">
      <h1 className="sr-only">{dict.common.title}</h1>

      {/* Header Banner Section */}
      <div className="text-center space-y-2 pt-2">
        <span className="text-[#b93829] font-extrabold text-xs tracking-tight uppercase">
          HypeHeritage Planner
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {dict.planner.workspaceTitle}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {dict.planner.workspaceDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* ================= LEFT WORKSPACE (60%) ================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Summary Tab & City Visit Tabs */}
          <div className="flex items-center justify-start border-b border-slate-200 pb-px" role="tablist" aria-label="City tabs">
            {/* Left: Distinctive Summary & Transport Tabs with Right Divider */}
            <div className="flex items-center gap-1.5 border-r border-slate-200/80 pr-2.5 mr-2 shrink-0">
              <button
                role="tab"
                aria-selected={selectedCityTab === "ALL"}
                id="city-tab-ALL"
                aria-controls="city-panel-ALL"
                onClick={() => setSelectedCityTab("ALL")}
                className={`h-8 px-3.5 rounded-t-xl text-[13px] font-extrabold border-t border-x transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#e25c5c] cursor-pointer flex items-center justify-center whitespace-nowrap ${
                  selectedCityTab === "ALL"
                    ? "bg-[#0f172a] text-white border-[#0f172a] border-b-[#0f172a] shadow-xs z-10"
                    : "bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/80"
                }`}
              >
                <span>{dict.planner.summaryTab || (locale === "ko" ? "여행 개요" : "Trip Overview")}</span>
              </button>

              <button
                role="tab"
                aria-selected={selectedCityTab === "TRANSPORT"}
                id="city-tab-TRANSPORT"
                aria-controls="city-panel-TRANSPORT"
                onClick={() => setSelectedCityTab("TRANSPORT")}
                className={`h-8 px-3.5 rounded-t-xl text-[13px] font-extrabold border-t border-x transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#e25c5c] cursor-pointer flex items-center justify-center whitespace-nowrap ${
                  selectedCityTab === "TRANSPORT"
                    ? "bg-[#0f172a] text-white border-[#0f172a] border-b-[#0f172a] shadow-xs z-10"
                    : "bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/80"
                }`}
              >
                <span>{locale === "ko" ? "교통" : "Transport"}</span>
              </button>
            </div>

            {/* Right: City Tabs (Scrollbar hidden) */}
            <div className="flex items-center space-x-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
              {sortCitiesByStandardOrder(draft.selectedCities).map((city) => {
                const isActive = selectedCityTab === city;
                const label = locale === "ko"
                  ? CITY_KOREAN_NAMES[city] || city
                  : CITY_ENGLISH_NAMES[city] || city;

                return (
                  <button
                    key={city}
                    role="tab"
                    aria-selected={isActive}
                    id={`city-tab-${city}`}
                    aria-controls={`city-panel-${city}`}
                    onClick={() => {
                      setSelectedCityTab(city);
                      if (activeCategory === "CITY_TRANSPORT") {
                        setActiveCategory("ACCOMMODATION");
                      }
                    }}
                    className={`h-8 px-3 rounded-t-xl text-[13px] font-bold border-t border-x transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#e25c5c] cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-[#e25c5c] text-white border-[#e25c5c] border-b-[#e25c5c] shadow-2xs z-10 font-extrabold"
                        : "bg-[#faf9f6]/60 text-slate-600 border-slate-200/50 border-b-slate-200 hover:text-slate-900 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual City Night Allocation Quick Stepper Banner */}
          {selectedCityTab !== "ALL" && selectedCityTab !== "TRANSPORT" && (() => {
            const city = selectedCityTab;
            const currentNights = draft.cityNightAllocations[city] ?? 0;
            const cityName = locale === "ko"
              ? CITY_KOREAN_NAMES[city] || city
              : CITY_ENGLISH_NAMES[city] || city;
            const currentAllocatedSum = draft.selectedCities.reduce((sum, c) => sum + (draft.cityNightAllocations[c] || 0), 0);
            const maxNights = draft.totalNights || 5;
            const canIncrease = currentAllocatedSum < maxNights;

            return (
              <div className="bg-[#faf5f5] border border-[#fce8e8] p-3 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">🗓️</span>
                  <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                    {locale === "ko" ? `${cityName} 체류 기간:` : `${cityName} Stay:`}
                  </span>
                  <strong className="text-xs font-extrabold text-[#e25c5c] whitespace-nowrap">
                    {currentNights === 0
                      ? (locale === "ko" ? "당일" : "Day Trip")
                      : `${currentNights}${locale === "ko" ? "박 " : "N "}${currentNights + 1}${locale === "ko" ? "일" : "D"}`}
                  </strong>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline whitespace-nowrap">
                    ({locale === "ko" ? `전체 ${maxNights}박 중 ${currentAllocatedSum}박 배분됨` : `${currentAllocatedSum} / ${maxNights} nights allocated`})
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={currentNights <= 0}
                    onClick={() => handleDirectCityNightChange(city, -1)}
                    className="w-6 h-6 rounded-md bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200/80 transition-colors cursor-pointer"
                    title={locale === "ko" ? "1박 줄이기" : "Reduce 1 night"}
                  >
                    -
                  </button>
                  <span className="px-1.5 text-xs font-black text-slate-900 min-w-[38px] text-center whitespace-nowrap">
                    {currentNights === 0 ? (locale === "ko" ? "당일" : "Day") : `${currentNights}${locale === "ko" ? "박" : "N"}`}
                  </span>
                  <button
                    type="button"
                    disabled={!canIncrease}
                    onClick={() => handleDirectCityNightChange(city, 1)}
                    className="w-6 h-6 rounded-md bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200/80 transition-colors cursor-pointer"
                    title={locale === "ko" ? "1박 늘리기" : "Add 1 night"}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Category Tabs / Cards (Only shown for individual city tabs: 3 categories without redundant transport) */}
          {selectedCityTab !== "ALL" && selectedCityTab !== "TRANSPORT" && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3" role="tablist" aria-label="Budget categories">
              {(["ACCOMMODATION", "FOOD", "ATTRACTION"] as BudgetCategory[]).map((cat) => {
                const effectiveCategory = (activeCategory === "CITY_TRANSPORT" || activeCategory === "EMERGENCY_FUND") ? "ACCOMMODATION" : activeCategory;
                const isActive = effectiveCategory === cat;
                const label = getCategoryLabel(cat, dict);
                const amount = plan.categoryTotals[cat] || 0;

                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    id={`cat-tab-${cat}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-155 focus-visible:outline-2 focus-visible:outline-[#e25c5c] ${isActive
                        ? "bg-white border-[#e25c5c] shadow-sm text-[#0f172a]"
                        : "bg-white border-slate-200/80 text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    <div className={`h-1 w-6 rounded-full mb-1.5 ${isActive ? "bg-[#e25c5c]" : "bg-slate-200"}`}></div>
                    <span className="text-[11px] font-bold tracking-tight block sm:text-xs">
                      {label}
                    </span>
                    <span className="mt-1 text-[11px] sm:text-[13px] font-extrabold text-[#0f172a] block">
                      {formatKrw(amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Category Panel */}
          <div
            className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6"
            role="tabpanel"
            id={`cat-panel-${selectedCityTab === "ALL" ? "summary" : activeCategory}`}
            aria-labelledby={`cat-tab-${selectedCityTab === "ALL" ? "summary" : activeCategory}`}
            aria-live="polite"
          >


            {/* 1. Summary Tab Mode: Stacked Horizontal Progress Bars & City Details */}
            {selectedCityTab === "ALL" && (() => {
              const citySubtotalMap: Record<string, number> = {};
              let sumCitySubtotals = 0;
              draft.selectedCities.forEach((city) => {
                const sub = plan.citySections[city]?.subtotalKrw || 0;
                citySubtotalMap[city] = sub;
                sumCitySubtotals += sub;
              });

              const safeCitySum = Math.max(1, sumCitySubtotals);

              const cityColors = [
                { bg: "bg-[#e25c5c]", text: "text-[#e25c5c]", border: "border-[#fce8e8]", lightBg: "bg-[#faf5f5]" },
                { bg: "bg-indigo-600", text: "text-indigo-600", border: "border-indigo-100", lightBg: "bg-indigo-50/50" },
                { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-100", lightBg: "bg-emerald-50/50" },
                { bg: "bg-amber-600", text: "text-amber-600", border: "border-amber-100", lightBg: "bg-amber-50/50" },
              ];

              // Category Amounts Data
              const categoryMeta = [
                { cat: "ACCOMMODATION", label: locale === "ko" ? "숙박" : "Stay", colorBg: "bg-blue-500" },
                { cat: "FOOD", label: locale === "ko" ? "음식" : "Food", colorBg: "bg-amber-500" },
                { cat: "CITY_TRANSPORT", label: locale === "ko" ? "교통" : "Transport", colorBg: "bg-indigo-500" },
                { cat: "ATTRACTION", label: locale === "ko" ? "관광" : "Attractions", colorBg: "bg-emerald-500" },
              ];

              const grandTotal = plan.grandTotalKrw || 1;
              const categorySubtotals = categoryMeta.map((item) => {
                const amount =
                  item.cat === "CITY_TRANSPORT"
                    ? getCombinedTransportSubtotal(plan)
                    : plan.categoryTotals[item.cat as BudgetCategory] || 0;
                return {
                  label: item.label,
                  amount,
                  pct: Math.round((amount / grandTotal) * 100),
                  colorBg: item.colorBg,
                };
              });

              return (
                <div className="space-y-5">
                  {/* 1. Dedicated Header Card: City Night Allocation Bar */}
                  {(() => {
                    const currentAllocatedSum = draft.selectedCities.reduce((sum, c) => sum + (draft.cityNightAllocations[c] || 0), 0);
                    const maxNights = draft.totalNights || 5;
                    const unallocatedNights = maxNights - currentAllocatedSum;
                    const isFull = unallocatedNights === 0;

                    const titleKo = isFull
                      ? `도시별 체류 기간 (${maxNights}박)`
                      : `도시별 체류 기간 (총 ${maxNights}박 중 ${currentAllocatedSum}박 배분 / ${unallocatedNights}박 여유)`;

                    const titleEn = isFull
                      ? `City Stay Duration (${maxNights}N)`
                      : `City Stay Duration (${currentAllocatedSum}/${maxNights}N Allocated / ${unallocatedNights}N Left)`;

                    return (
                      <div className="bg-[#faf5f5] border border-[#fce8e8] p-4 rounded-2xl space-y-3 shadow-2xs">
                        <div className="border-b border-[#fce8e8] pb-2.5">
                          {renderOverviewSectionHeader(
                            "cityNights",
                            "",
                            titleKo,
                            titleEn,
                            "",
                            "",
                            "각 도시의 체류 박수는 총 일정 범위 내에서 자유롭게 조정할 수 있습니다.\n각 도시의 체류 박수를 +/- 버튼으로 조절하세요.",
                            "You can freely adjust stay nights for each city within your total trip duration.\nUse the +/- buttons to adjust stay nights for each city."
                          )}
                        </div>

                    <div className="grid grid-cols-2 gap-3">
                      {draft.selectedCities.map((city) => {
                        const cityNights = draft.cityNightAllocations[city] ?? 0;
                        const cityName = locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city);
                        const currentAllocatedSum = draft.selectedCities.reduce((sum, c) => sum + (draft.cityNightAllocations[c] || 0), 0);
                        const maxNights = draft.totalNights || 5;
                        const canIncrease = currentAllocatedSum < maxNights;
                        const canDecrease = cityNights > 0;

                        return (
                          <div key={city} className="bg-white/80 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 min-w-0 shadow-2xs">
                            <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900 whitespace-nowrap">{cityName}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={!canDecrease}
                                onClick={() => handleDirectCityNightChange(city, -1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                title={locale === "ko" ? "1박 줄이기" : "Reduce 1 night"}
                              >
                                -
                              </button>
                              <span className="px-1.5 text-xs font-black text-[#e25c5c] min-w-[38px] text-center whitespace-nowrap">
                                {cityNights === 0 ? (locale === "ko" ? "당일" : "Day") : `${cityNights}${locale === "ko" ? "박" : "N"}`}
                              </span>
                              <button
                                type="button"
                                disabled={!canIncrease}
                                onClick={() => handleDirectCityNightChange(city, 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                title={locale === "ko" ? "1박 늘리기" : "Add 1 night"}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

                  {/* 2단 박스: 여행 전체 예산 설정 Outer Box Container */}
                  <div className="bg-slate-50/80 border border-slate-200/90 p-5 rounded-2xl space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-[#0f172a] tracking-tight">
                          {locale === "ko" ? "여행 전체 예산 설정" : "Total Trip Budgeting"}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {locale === "ko" ? "전체 일정 통틀어 1회 산출" : "Calculated once for total trip"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* 2-1. AI 목표 예산 맞춤 설정 Box */}
                      <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                        <div className="border-b border-slate-200/60 pb-3">
                          {renderOverviewSectionHeader(
                            "targetBudget",
                            "",
                            `목표 예산 ${dict.planner.perPersonLabel || "(1인 기준)"}`,
                            `Target Budget ${dict.planner.perPersonLabel || "(Per Person)"}`,
                            "",
                            "",
                            "여행 기간 동안의 1인당 목표 예산을 프리셋(1인 100만/200만/300만) 선택 또는 직접 입력으로 설정할 수 있으며, 선택한 1인당 예산에 맞춰 전체 여행 예산(1인당 × 여행 인원)이 자동 산출됩니다.",
                            "You can set your per-person budget using presets (1M/2M/3M) or custom input. The overall trip budget (per person × travelers) will be automatically calculated."
                          )}
                        </div>

                        {/* 4 cards grid: ₩1,000,000, ₩2,000,000, ₩3,000,000, ₩ 직접 입력 인풋 카드 */}
                        {(() => {
                          const adultCount = draft.adultCount || 1;
                          const currentPerPerson = Math.round((draft.targetBudgetKrw || 2000000) / adultCount);
                          const isPresetMatch = currentPerPerson === 1000000 || currentPerPerson === 2000000 || currentPerPerson === 3000000;
                          const isCustomActive = isCustomTargetBudget || !isPresetMatch;

                          const displayInputValue = customTargetBudgetInput !== ""
                            ? customTargetBudgetInput
                            : (isCustomTargetBudget ? "" : (!isPresetMatch ? String(currentPerPerson) : ""));

                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                {[
                                  { key: "BUDGET", amount: 1000000, label: formatKrw(1000000) },
                                  { key: "STANDARD", amount: 2000000, label: formatKrw(2000000) },
                                  { key: "PREMIUM", amount: 3000000, label: formatKrw(3000000) },
                                ].map((tierOpt) => {
                                  const isSelected = !isCustomActive && currentPerPerson === tierOpt.amount;
                                  return (
                                    <button
                                      key={tierOpt.key}
                                      type="button"
                                      onClick={() => {
                                        setIsCustomTargetBudget(false);
                                        setCustomTargetBudgetInput("");
                                        handleTargetBudgetTierChange(tierOpt.key as BudgetTier);
                                      }}
                                      className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                                        isSelected
                                          ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                                          : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                                      }`}
                                    >
                                      <span className="text-xs font-bold">{tierOpt.label}</span>
                                    </button>
                                  );
                                })}

                                {/* 4th Card: Integrated Direct Custom Input Card */}
                                <div
                                  className={`py-2 px-3 rounded-xl border text-center transition-all flex items-center justify-center relative ${
                                    isCustomActive
                                      ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                                      : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                                  }`}
                                >
                                  <span className="text-xs font-bold text-slate-400 mr-1.5 shrink-0">₩</span>
                                  <input
                                    type="number"
                                    step="10000"
                                    value={displayInputValue}
                                    onFocus={() => {
                                      setIsCustomTargetBudget(true);
                                      if (isPresetMatch) {
                                        setCustomTargetBudgetInput("");
                                      } else if (!customTargetBudgetInput) {
                                        setCustomTargetBudgetInput(String(currentPerPerson));
                                      }
                                    }}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      setCustomTargetBudgetInput(valStr);
                                      setIsCustomTargetBudget(true);
                                      const valNum = parseInt(valStr, 10);
                                      if (!isNaN(valNum) && valNum > 0) {
                                        handleCustomTargetBudgetSubmit(valNum);
                                      }
                                    }}
                                    placeholder={locale === "ko" ? "직접 입력" : "Custom"}
                                    className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-medium text-center"
                                  />
                                </div>
                              </div>

                              {/* Real-time Total Helper Bar with Formula */}
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between font-medium">
                                <span>
                                  <strong className="text-slate-800 font-bold">
                                    {`${formatKrw(currentPerPerson)} × ${adultCount}${locale === "ko" ? "명" : " travelers"}`}
                                  </strong>
                                </span>
                                <span>
                                  {locale === "ko" ? `${adultCount}명 기준 목표 예산:` : `Total for ${adultCount}:`}{" "}
                                  <strong className="text-[#e25c5c] font-extrabold">
                                    {formatKrw(draft.targetBudgetKrw)}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 2-2. Optional Shopping & Souvenirs Selector Card */}
                      {(() => {
                        const adultCount = draft.adultCount || 1;
                        const shoppingAmountKrw = (() => {
                          if (shoppingOption === "NONE") return 0;
                          if (shoppingOption === "BEAUTY") return 200000 * adultCount;
                          if (shoppingOption === "FASHION") return 300000 * adultCount;
                          if (shoppingOption === "SOUVENIR") return 100000 * adultCount;
                          if (shoppingOption === "CUSTOM") return (parseInt(shoppingCustomInput, 10) || 0);
                          return 0;
                        })();

                        const presets = [
                          { id: "SOUVENIR", title: locale === "ko" ? "가벼운 쇼핑" : "Light Shopping", perPerson: 100000 },
                          { id: "BEAUTY", title: locale === "ko" ? "일반 쇼핑" : "Standard Shopping", perPerson: 200000 },
                          { id: "FASHION", title: locale === "ko" ? "풍족한 쇼핑" : "Premium Shopping", perPerson: 300000 },
                        ];

                        return (
                          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                            <div className="border-b border-slate-200/60 pb-3">
                              {renderOverviewSectionHeader(
                                "shoppingFund",
                                "",
                                `쇼핑 예산 ${dict.planner.perPersonLabel || "(1인 기준)"}`,
                                `Shopping Budget ${dict.planner.perPersonLabel || "(Per Person)"}`,
                                "",
                                "",
                                "뷰티, 패션, 특산품 등 한국 여행 중 쇼핑을 위한 예산입니다.\n가벼운 쇼핑부터 프리미엄 쇼핑까지 1인당 단가 옵션을 선택하거나 원하는 금액을 입력할 수 있으며, 인원수(N명)에 따라 총액이 자동 산출되어 영수증에 포함됩니다.",
                                "Budget for shopping cosmetics, fashion, souvenirs, and local products in Korea.\nSelect shopping budget presets per person or enter a custom amount. The total will be multiplied by your travelers."
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {presets.map((opt) => {
                                const isSelected = shoppingOption === opt.id && shoppingCustomInput === "";
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setShoppingOption("NONE");
                                        setShoppingCustomInput("");
                                      } else {
                                        setShoppingOption(opt.id as ShoppingOption);
                                        setShoppingCustomInput("");
                                      }
                                    }}
                                    className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                                      isSelected
                                        ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                                        : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                                    }`}
                                  >
                                    <span className="text-xs font-bold">{formatKrw(opt.perPerson)}</span>
                                  </button>
                                );
                              })}

                              <div className={`py-2 px-3 rounded-xl border text-center transition-all flex items-center justify-center relative ${
                                shoppingOption === "CUSTOM" || shoppingCustomInput !== ""
                                  ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                                  : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                              }`}>
                                <span className="text-xs font-bold text-slate-400 mr-1.5 shrink-0">₩</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="10000"
                                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-medium text-center"
                                  placeholder={locale === "ko" ? "직접 입력" : "Custom"}
                                  value={shoppingCustomInput}
                                  onChange={(e) => {
                                    setShoppingCustomInput(e.target.value);
                                    setShoppingOption("CUSTOM");
                                  }}
                                />
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between font-medium">
                              <span>
                                <strong className="text-slate-800 font-bold">
                                  {shoppingOption === "CUSTOM" || shoppingCustomInput !== ""
                                    ? (locale === "ko" ? "사용자 설정 쇼핑 예산" : "Custom Shopping Budget")
                                    : shoppingAmountKrw === 0
                                    ? (locale === "ko" ? "선택 안함 (₩0)" : "No Selection (₩0)")
                                    : `${formatKrw(shoppingOption === "SOUVENIR" ? 100000 : shoppingOption === "BEAUTY" ? 200000 : 300000)} × ${adultCount}${locale === "ko" ? "명" : " travelers"}`}
                                </strong>
                              </span>
                              <span>
                                {locale === "ko" ? `${adultCount}명 기준 쇼핑 예산:` : `Total for ${adultCount}:`}{" "}
                                <strong className="text-[#e25c5c] font-extrabold">
                                  {formatKrw(shoppingAmountKrw)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2-3. Trip-wide Emergency Fund Setting Block */}
                      <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                        <div className="border-b border-slate-200/60 pb-3">
                          {renderOverviewSectionHeader(
                            "emergencyFund",
                            "",
                            `여행 비상금 ${dict.planner.perPersonLabel || "(1인 기준)"}`,
                            `Emergency Fund ${dict.planner.perPersonLabel || "(Per Person)"}`,
                            "",
                            "",
                            "여행 중 발생할 수 있는 돌발 상황이나 현지 비상 지출을 대비한 예산입니다.\n전체 예산의 5%, 10%, 15% 비율 또는 수동 입력으로 비상금을 설정할 수 있습니다. 1인당 비상금 수치와 전체 여행 인원 수치(N명)가 명확히 계산되어 합산됩니다.",
                            "Budget for unexpected emergencies or unforeseen contingencies during your trip.\nSet an emergency reserve as 5%, 10%, or 15% of your total budget, or enter a custom amount. Per-person and total figures will be clearly presented."
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { pct: 0.05, label: "5%" },
                              { pct: 0.10, label: "10%" },
                              { pct: 0.15, label: "15%" },
                            ].map((preset) => {
                              const basePerPerson = Math.round(baseEmergencyGrandTotal / adultCount);
                              const calcValPerPerson = Math.round((basePerPerson * preset.pct) / 1000) * 1000;
                              const isSelected = activeEmergencyPct === preset.pct && emergencyManualInput === "";

                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      handleEmergencyFundPctChange(0);
                                      setEmergencyManualInput("");
                                    } else {
                                      handleEmergencyFundPctChange(preset.pct);
                                      setEmergencyManualInput("");
                                    }
                                  }}
                                  className={`py-2 px-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                                      : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                                  }`}
                                >
                                  <div className={isSelected ? "font-extrabold text-[#0f172a]" : "font-semibold text-slate-700"}>{preset.label}</div>
                                  <div className={`text-[10px] mt-0.5 ${isSelected ? "font-extrabold text-[#e25c5c]" : "opacity-80 text-slate-500"}`}>{formatKrw(calcValPerPerson)}</div>
                                </button>
                              );
                            })}

                            <div className={`py-2 px-3 rounded-xl border text-center transition-all flex items-center justify-center relative ${
                              emergencyManualInput !== "" && emergencyManualInput !== "0"
                                ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                            }`}>
                              <span className="text-xs font-bold text-slate-400 mr-1.5 shrink-0">₩</span>
                              <input
                                type="number"
                                min="0"
                                step="10000"
                                className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-medium text-center"
                                placeholder={locale === "ko" ? "직접 입력" : "Custom"}
                                value={emergencyManualInput === "0" ? "" : emergencyManualInput}
                                onChange={handleEmergencyFundChange}
                              />
                            </div>
                          </div>

                          {(() => {
                            const basePerPerson = Math.round(baseEmergencyGrandTotal / adultCount);
                            const pctPct = Math.round((activeEmergencyPct || 0.10) * 100);

                            const formulaText = emergencyManualInput !== "" && emergencyManualInput !== "0"
                              ? (locale === "ko"
                                  ? `직접 입력 ${formatKrw(parseInt(emergencyManualInput, 10) || 0)} × ${adultCount}명`
                                  : `Custom ${formatKrw(parseInt(emergencyManualInput, 10) || 0)} × ${adultCount} travelers`)
                              : (activeEmergencyPct || 0) === 0
                              ? (locale === "ko" ? "선택 안함 (₩0)" : "No Selection (₩0)")
                              : (locale === "ko"
                                  ? `기본 예산 ${formatKrw(basePerPerson)} × ${pctPct}% × ${adultCount}명`
                                  : `Base Budget ${formatKrw(basePerPerson)} × ${pctPct}% × ${adultCount} travelers`);

                            return (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-medium">
                                <span>
                                  <strong className="text-slate-800 font-bold">
                                    {formulaText}
                                  </strong>
                                </span>
                                <span className="shrink-0">
                                  {locale === "ko" ? `${adultCount}명 기준 비상금:` : `Total for ${adultCount}:`}{" "}
                                  <strong className="text-[#e25c5c] font-extrabold">
                                    {formatKrw(computedEmergencyKrw)}
                                  </strong>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3단 박스: 일일 용돈 (1인 기준) Outer Box Container */}
                  <div className="bg-[#fdf2f2]/60 border border-rose-200/90 p-5 rounded-2xl space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-rose-200/80 pb-3">
                      <div className="flex-1">
                        {renderOverviewSectionHeader(
                          "activityFund",
                          "",
                          `일일 용돈 ${dict.planner.perPersonLabel || "(1인 기준)"}`,
                          `Daily Allowance ${dict.planner.perPersonLabel || "(Per Person)"}`,
                          "",
                          "",
                          "여행 중 자유롭게 사용할 일일 용돈 및 추가 액티비티 예산입니다.\n일일 1인 기준 용돈 단가를 설정하면 [1일 1인 단가 × 인원수(N명) × 전체 박수]로 자동 산출되어 전체 예산에 반영됩니다.",
                          "Daily pocket money for personal activities and extras during your trip.\nDaily activity allowance is calculated as [Daily per-person rate × Travelers × Total nights] and included in your overall budget."
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#e25c5c] shrink-0 ml-3">
                        {locale === "ko" ? `${draft.totalNights || 1}박 일수 자동 연동` : `Applied across ${draft.totalNights || 1} nights`}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          {
                            id: "MOSTLY_FREE" as BudgetBasketId,
                            label: locale === "ko" ? "10,000원" : "₩10,000",
                            dailyPrice: 10000,
                          },
                          {
                            id: "BALANCED" as BudgetBasketId,
                            label: locale === "ko" ? "30,000원" : "₩30,000",
                            dailyPrice: 30000,
                          },
                          {
                            id: "EXPERIENCE_RICH" as BudgetBasketId,
                            label: locale === "ko" ? "50,000원" : "₩50,000",
                            dailyPrice: 50000,
                          },
                        ].map((preset) => {
                          const firstCity = draft.selectedCities[0];
                          const currentBasket = preferences.attractionByCity?.[firstCity] || "BALANCED";
                          const isSelected = currentBasket === preset.id && !preferences.attractionCustomDailyKrw && activityManualInput === "";

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setActivityManualInput("");
                                  handleSetAllCitiesAttractionBasket("NONE" as BudgetBasketId);
                                } else {
                                  setActivityManualInput("");
                                  handleSetAllCitiesAttractionBasket(preset.id);
                                }
                              }}
                              className={`py-2.5 px-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                                  : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                              }`}
                            >
                              <div className={isSelected ? "font-extrabold text-[#0f172a]" : "font-semibold text-slate-700"}>{preset.label}</div>
                            </button>
                          );
                        })}

                        <div className={`py-2 px-3 rounded-xl border text-center transition-all flex items-center justify-center relative ${
                          (preferences.attractionCustomDailyKrw && preferences.attractionCustomDailyKrw > 0) || (activityManualInput !== "" && activityManualInput !== "0")
                            ? "bg-[#fdf2f2] border border-[#e25c5c] ring-1 ring-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100"
                        }`}>
                          <span className="text-xs font-bold text-slate-400 mr-1.5 shrink-0">₩</span>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-medium text-center"
                            placeholder={locale === "ko" ? "직접 입력" : "Custom"}
                            value={activityManualInput === "0" ? "" : activityManualInput}
                            onChange={handleActivityManualInputChange}
                          />
                        </div>
                      </div>

                      {(() => {
                        const firstCity = draft.selectedCities[0];
                        const currentBasket = preferences.attractionByCity?.[firstCity] || "BALANCED";
                        const currentDailyRate = preferences.attractionCustomDailyKrw !== undefined
                          ? preferences.attractionCustomDailyKrw
                          : ((currentBasket as string) === "NONE" ? 0 : currentBasket === "MOSTLY_FREE" ? 10000 : currentBasket === "EXPERIENCE_RICH" ? 50000 : 30000);
                        const totalNights = draft.totalNights || 1;
                        const adultCount = draft.adultCount || 1;
                        const totalActivityFund = currentDailyRate * adultCount * totalNights;

                        return (
                          <div className="p-3 rounded-xl bg-white/80 border border-rose-200/60 text-xs text-slate-600 flex items-center justify-between font-medium">
                            <span>
                              <strong className="text-slate-800 font-bold">
                                {currentDailyRate === 0
                                  ? (locale === "ko" ? "선택 안함 (₩0)" : "No Selection (₩0)")
                                  : `${formatKrw(currentDailyRate)} × ${adultCount}${locale === "ko" ? "명" : " travelers"} × ${totalNights}${locale === "ko" ? "박" : " nights"}`}
                              </strong>
                            </span>
                            <span>
                              {locale === "ko" ? `${adultCount}명 기준 용돈:` : `Total for ${adultCount}:`}{" "}
                              <strong className="text-[#e25c5c] font-extrabold">
                                {formatKrw(totalActivityFund)}
                              </strong>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 1.5 Transport Tab Mode: Custom Transport Planner Panel */}
            {selectedCityTab === "TRANSPORT" && (
              <TransportPlannerPanel
                draft={draft}
                intercityOverrides={preferences.intercityTransportOverrides || {}}
                onSelectIntercityOverride={handleSelectIntercityOverride}
                onReorderCities={handleReorderCities}
                localTransitStyle={preferences.localTransitStyle || "STANDARD_MIX"}
                onSelectLocalTransitStyle={handleSelectLocalTransitStyle}
                cityTransitStyles={preferences.cityTransitStyles || {}}
                onSelectCityTransitStyle={handleSelectCityTransitStyle}
                locale={locale}
                dict={dict}
              />
            )}

            {/* 2. Single City Tab Mode: City-Specific Category Options */}
            {selectedCityTab !== "ALL" && selectedCityTab !== "TRANSPORT" && (
              <div className="space-y-6">
                {activeCategory === "ACCOMMODATION" && (() => {
                  const city = selectedCityTab;

                  const accOverride = preferences.accommodationByCity[city];
                  const hasOverride = !!accOverride;
                  const isPlaceOverride = typeof accOverride === "object" && accOverride !== null && "kind" in accOverride && accOverride.kind === "PLACE";
                  const activeBasketId: BudgetBasketId =
                    (isPlaceOverride
                      ? (accOverride as { basketId: BudgetBasketId }).basketId
                      : typeof accOverride === "string"
                        ? accOverride
                        : typeof accOverride === "object" && accOverride !== null && "basketId" in accOverride
                          ? accOverride.basketId
                          : plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.basketId) || "STANDARD_HOTEL";
                  const basketOptions: BudgetBasketId[] = ["BUDGET_STAY", "STANDARD_HOTEL", "PREMIUM_HERITAGE"];

                  const defaultAccSpots = ACCOMMODATION_SPOTS_CATALOG.filter((s) => s.cityCode === city);
                  const customAccSpots = budgetPlaces
                    .filter((p) => p.city === city && p.category === "ACCOMMODATION" && !defaultAccSpots.some((d) => d.id === p.id))
                    .map(placeToAccommodationSpot);
                  const accSpotsForCity = [...customAccSpots, ...defaultAccSpots];
                  const savedAccSpotsCount = accSpotsForCity.filter((spot) =>
                    (isPlaceOverride && (accOverride as any).placeId === spot.id) ||
                    budgetPlaces.some((p) => p.id === spot.id)
                  ).length;
                  const isSavedOnlyAcc = !!showSavedOnlyAccByCity[city] && savedAccSpotsCount > 0;
                  // 방안 3: 기본 추천순 항상 고정, 필요 시 '담은 항목' 필터로 모아봄
                  const filteredAccSpots = isSavedOnlyAcc
                    ? accSpotsForCity.filter((spot) =>
                        (isPlaceOverride && (accOverride as any).placeId === spot.id) ||
                        budgetPlaces.some((p) => p.id === spot.id)
                      )
                    : accSpotsForCity;
                  const visibleAccCount = visibleAccommodationsCountByCity[city] ?? 8;
                  const displayedAccSpots = filteredAccSpots.slice(0, visibleAccCount);
                  const cityNights = draft.cityNightAllocations[city] ?? 0;

                  return (
                    <div className="space-y-6">
                      {/* Consolidated Header & Reset Button */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0f172a]">
                            {CITY_KOREAN_NAMES[city] || city} {locale === "ko" ? "숙박 예산 및 유형 선택" : "Accommodation Budget & Tier"}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {locale === "ko"
                              ? "여행 조건에 맞는 숙소 유형(평균가)을 고르거나 하단 후보 숙소를 예산에 담으세요."
                              : "Choose stay tier average or select candidate places below."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResetStay(city)}
                          disabled={!hasOverride}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${hasOverride
                              ? "text-[#e25c5c] border-[#fce8e8] bg-[#faf5f5] hover:bg-[#fdeeed]"
                              : "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                            }`}
                        >
                          {dict.planner.resetToRecommended || "추천 숙소로 초기화"}
                        </button>
                      </div>

                      {/* PLACE Override Active Banner */}
                      {isPlaceOverride && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs flex items-center justify-between font-bold text-amber-900 shadow-2xs">
                          <div>
                            <span>
                              {locale === "ko"
                                ? `${(accOverride as any).placeNameKo} (${formatKrw((accOverride as any).nightlyPriceKrw)}/박) · 개별 숙소 지정가가 우선 적용 중입니다.`
                                : `${(accOverride as any).placeNameEn || (accOverride as any).placeNameKo} (${formatKrw((accOverride as any).nightlyPriceKrw)}/night) · Specific place active.`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetStay(city)}
                            className="text-[11px] underline text-amber-700 hover:text-amber-900 cursor-pointer shrink-0 ml-2"
                          >
                            {locale === "ko" ? "티어 평균가로 되돌리기" : "Reset to Tier Average"}
                          </button>
                        </div>
                      )}

                      {/* 1. Concise Stay Tier Basket Cards */}
                      <div className="space-y-2.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          {locale === "ko" ? "숙소 유형 선택 (도시 평균 정수 단가)" : "Stay Tier Average"}
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {basketOptions.map((opt) => {
                            const isSelected = !isPlaceOverride && activeBasketId === opt;
                            const name = getBasketLabel(opt, dict, locale, city);
                            const price = getCatalogStayPrice(city, opt);

                            let desc = locale === "ko" ? "편안한 비즈니스 & 시티뷰 호텔" : "Comfortable business & city view hotel";
                            if (opt === "BUDGET_STAY") desc = locale === "ko" ? "가성비 호스텔, 도미토리, 게스트하우스" : "Affordable hostel & guesthouse";
                            if (opt === "PREMIUM_HERITAGE") desc = locale === "ko" ? "고급 호텔, 독채 한옥, 풀빌라 리조트" : "Luxury hotel, Hanok stay & resort";

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleStayOverride(city, opt)}
                                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-155 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e25c5c] ${isSelected
                                    ? "bg-rose-50/40 border border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs text-slate-900"
                                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50"
                                  }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between w-full">
                                    <span className={`text-xs font-extrabold tracking-tight ${isSelected ? "text-[#e25c5c]" : "text-[#0f172a]"}`}>
                                      {name}
                                    </span>
                                    {isSelected && (
                                      <span className="text-[10px] bg-[#e25c5c] text-white px-2 py-0.5 rounded-md font-extrabold">
                                        ✓ {locale === "ko" ? "선택됨" : "Selected"}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-slate-500">
                                    {desc}
                                  </p>
                                </div>
                                <div className="mt-3 flex items-baseline justify-between w-full border-t border-slate-100 pt-2">
                                  <span className="text-[10px] font-bold text-slate-400">1박당 평균가</span>
                                  <span className="text-xs font-extrabold text-[#e25c5c]">{formatKrw(price)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. In-place Candidate Accommodations Section (3x2 Desktop, 2x3 Mobile Grid) */}
                      {accSpotsForCity.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              {locale === "ko" ? `${CITY_KOREAN_NAMES[city] || city} 실제 후보 숙소 탐색` : `${CITY_ENGLISH_NAMES[city] || city} Candidate Accommodations`}
                            </span>
                            <div className="flex items-center gap-2">
                              {savedAccSpotsCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowSavedOnlyAccByCity((prev) => ({
                                      ...prev,
                                      [city]: !prev[city],
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    isSavedOnlyAcc
                                      ? "bg-rose-500 text-white shadow-xs"
                                      : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                  }`}
                                >
                                  <span>🔖</span>
                                  <span>{locale === "ko" ? `담은 항목 (${savedAccSpotsCount})` : `Saved (${savedAccSpotsCount})`}</span>
                                </button>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">
                                {locale === "ko" ? `전체 ${filteredAccSpots.length}개 중 ${displayedAccSpots.length}개 노출` : `Showing ${displayedAccSpots.length} of ${filteredAccSpots.length}`}
                              </span>
                            </div>
                          </div>

                          {/* Grid: 2 cols on mobile (2x3), 3 cols on desktop (3x2) */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {displayedAccSpots.map((spot, spotIdx) => {
                              const isSelectedSpot =
                                (isPlaceOverride && (accOverride as any).placeId === spot.id) ||
                                budgetPlaces.some((p) => p.id === spot.id);
                              const stayNights = Math.max(1, cityNights);
                              const totalStayPrice = spot.nightlyPriceKrw * stayNights;

                              return (
                                <div
                                  key={spot.id}
                                  className={`p-3.5 rounded-2xl border bg-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all ${
                                    isSelectedSpot
                                      ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/20"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="space-y-2">
                                    {/* Visual Header: 이미지 스켈레톤 & 페이드인 적용 */}
                                    <AccSpotHeaderVisual
                                      imageUrl={(spot as any).imageUrl}
                                      emoji={spot.emoji}
                                      location={locale === "ko" ? spot.locationKo : spot.locationEn}
                                      isPriority={spotIdx < 6}
                                    />

                                    <div>
                                      <h5 className="text-xs font-bold text-[#0f172a] line-clamp-1">
                                        {locale === "ko" ? spot.nameKo : spot.nameEn}
                                      </h5>
                                      <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                                        {locale === "ko" ? spot.descKo : spot.descEn}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                                    <div className="flex items-baseline justify-between text-xs">
                                      <span className="text-[10px] text-slate-400 font-medium">1박 당</span>
                                      <strong className="font-extrabold text-slate-900">{formatKrw(spot.nightlyPriceKrw)}</strong>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                                      <span className="text-[10px] font-extrabold text-[#e25c5c]">
                                        {cityNights === 0
                                          ? (locale === "ko" ? "당일치기" : "Day trip")
                                          : `${cityNights}${locale === "ko" ? "박 " : "N "}${formatKrw(totalStayPrice)}`}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isSelectedSpot) {
                                            const existInBudget = budgetPlaces.find((p) => p.id === spot.id);
                                            if (existInBudget) {
                                              toggleBudgetPlace(existInBudget);
                                            }
                                            handleResetStay(city);
                                          } else {
                                            const existInBudget = budgetPlaces.find((p) => p.id === spot.id);
                                            if (!existInBudget) {
                                              toggleBudgetPlace(accommodationSpotToPlaceItem(spot));
                                            }
                                            handleStayOverride(city, {
                                              kind: "PLACE",
                                              basketId: spot.basketId,
                                              placeId: spot.id,
                                              placeNameKo: spot.nameKo,
                                              placeNameEn: spot.nameEn,
                                              nightlyPriceKrw: spot.nightlyPriceKrw,
                                              priceSource: "MOCK",
                                              snapshotAt: "2026-08-01",
                                            });
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer shrink-0 ${
                                          isSelectedSpot
                                            ? "bg-rose-500 text-white hover:bg-rose-600 shadow-2xs"
                                            : "bg-[#0f172a] text-white hover:bg-slate-800"
                                        }`}
                                      >
                                        {isSelectedSpot
                                          ? (locale === "ko" ? "✓ 담김" : "✓ Selected")
                                          : (locale === "ko" ? "예산에 담기" : "Add Stay")}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Stepwise Show More (+8) / Show Less Toggle Button */}
                          {filteredAccSpots.length > 8 && (
                            <div className="text-center pt-2">
                              {visibleAccCount < filteredAccSpots.length ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisibleAccommodationsCountByCity((prev) => ({
                                      ...prev,
                                      [city]: (prev[city] ?? 8) + 8,
                                    }))
                                  }
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                  <span>{dict.planner.showMore || "더보기"}</span>
                                  <span>▼</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisibleAccommodationsCountByCity((prev) => ({
                                      ...prev,
                                      [city]: 8,
                                    }))
                                  }
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

                      {/* 3. My Stay Budget Summary Panel */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-extrabold text-[#0f172a] flex items-center gap-1">
                            <span>📋</span>
                            <span>{locale === "ko" ? `${CITY_KOREAN_NAMES[city] || city} 숙박 예산 요약` : `${city} Stay Summary`}</span>
                          </span>
                          <span className="text-xs font-black text-[#e25c5c]">
                            {formatKrw(plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.lineTotalKrw || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span className="font-bold">
                            {isPlaceOverride ? (locale === "ko" ? "선택 숙소:" : "Selected Stay:") : (locale === "ko" ? "숙소 유형:" : "Stay Tier:")}
                          </span>
                          <span className="font-extrabold text-slate-800">
                            {isPlaceOverride
                              ? `${(accOverride as any).placeNameKo} (${formatKrw((accOverride as any).nightlyPriceKrw)}/박)`
                              : getBasketLabel(activeBasketId, dict, locale, city)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {activeCategory === "FOOD" && (() => {
                  const city = selectedCityTab;
                  const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
                  const activeFoodTier = preferences.foodTier || draft.budgetTier || "STANDARD";
                  const foodBasketOptions: BudgetBasketId[] = ["BUDGET_MEAL_PLAN", "STANDARD_MEAL_PLAN", "PREMIUM_MEAL_PLAN"];

                  return (
                    <div className="space-y-6">
                      {saveError && (
                        <div role="alert" className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                          {dict.planner.saveFailedNotice}
                        </div>
                      )}

                      {/* Food Basket Gourmet Planner Panel */}
                      <FoodPlannerPanel
                        locale={locale}
                        dict={dict}
                        currentCity={city}
                        selectedCities={draft.selectedCities}
                        travelNights={draft.totalNights || 3}
                        adultCount={draft.adultCount || 1}
                        basketSelections={preferences.foodBasketSelections || []}
                        foodBasketPlan={isCalculatedMealPlan(foodLine?.mealPlan) ? foodLine.mealPlan.foodBasketPlan : undefined}
                        onUpdateQuantity={handleFoodBasketUpdateQuantity}
                        onSetQuantity={handleFoodBasketSetQuantity}
                        onClearBasket={handleFoodBasketClear}
                      />

                      {/* 3. K-Spot Gourmet & Cafe Candidates added by user */}
                      {(() => {
                        const customFoodPlaces = budgetPlaces.filter(
                          (p) => p.city === city && (p.category === "RESTAURANT" || p.category === "CAFE")
                        );
                        if (customFoodPlaces.length === 0) return null;

                        return (
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                {locale === "ko"
                                  ? `🍱 K-스팟에서 담은 추천 맛집 & 카페 (${customFoodPlaces.length})`
                                  : `🍱 Selected K-Gourmet & Cafes (${customFoodPlaces.length})`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {locale === "ko" ? "취소 시 목록 및 예산에서 즉시 제외됩니다" : "Removing excludes from budget"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {customFoodPlaces.map((foodPlace) => {
                                const unitPrice = foodPlace.priceKrw ?? (foodPlace as any).estimatedPriceKrw ?? (foodPlace.category === "CAFE" ? 8000 : 18000);
                                const totalFoodItemPrice = unitPrice * (draft.adultCount || 1);
                                const title = locale === "ko"
                                  ? (foodPlace.translations?.ko?.title || (foodPlace as any).title)
                                  : (foodPlace.translations?.en?.title || foodPlace.translations?.ko?.title || (foodPlace as any).title);
                                const desc = locale === "ko"
                                  ? (foodPlace.translations?.ko?.description || (foodPlace as any).descriptionKo)
                                  : (foodPlace.translations?.en?.description || foodPlace.translations?.ko?.description || (foodPlace as any).descriptionKo);
                                const address = foodPlace.translations?.ko?.address || (foodPlace as any).area || foodPlace.city;

                                return (
                                  <div
                                    key={foodPlace.id}
                                    className="p-3.5 rounded-2xl border border-rose-300 ring-1 ring-rose-200 bg-rose-50/20 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xl shrink-0">{foodPlace.category === "CAFE" ? "☕" : "🍲"}</span>
                                          <div>
                                            <h5 className="text-xs font-bold text-[#0f172a] line-clamp-1">
                                              {title}
                                            </h5>
                                            <span className="text-[10px] text-slate-400">
                                              {foodPlace.category === "CAFE" ? (locale === "ko" ? "디저트·카페" : "Cafe") : (locale === "ko" ? "맛집·식당" : "Restaurant")} · {address}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-800 border-amber-200">
                                          {formatKrw(unitPrice)}/인
                                        </span>
                                      </div>

                                      {desc && (
                                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                          {desc}
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-rose-100 flex items-center justify-between text-xs">
                                      <span className="text-[11px] font-bold text-[#e25c5c]">
                                        {formatKrw(totalFoodItemPrice)} <span className="text-[10px] text-slate-400 font-normal">({draft.adultCount || 1}명 기준)</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          toggleBudgetPlace(foodPlace);
                                          setToastMessage(locale === "ko" ? "맛집 담기가 취소되어 목록에서 제외되었습니다." : "Removed from budget.");
                                          setTimeout(() => setToastMessage(null), 2500);
                                        }}
                                        className="px-3 py-1 rounded-lg text-xs font-black bg-rose-500 text-white hover:bg-rose-600 shadow-2xs cursor-pointer transition-colors"
                                      >
                                        {locale === "ko" ? "✓ 담김 (취소)" : "✓ Added"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {activeCategory === "ATTRACTION" && (() => {
                  const city = selectedCityTab;
                  const citySel = preferences.attractionSelections?.[city] || { selectedCourseIds: [], individualSpotIds: [] };
                  const selectedCourseIds = citySel.selectedCourseIds || [];
                  const individualSpotIds = citySel.individualSpotIds || [];

                  const hasOverride =
                    !!preferences.attractionByCity?.[city] ||
                    selectedCourseIds.length > 0 ||
                    individualSpotIds.length > 0;

                  const activeBasketId =
                    preferences.attractionByCity?.[city] ||
                    plan.citySections[city]?.lineItems.find((i) => i.category === "ATTRACTION")?.basketId ||
                    "BALANCED";

                  const coursesForCity = TOUR_COURSE_PRESETS.filter((c) => c.cityCode === city);
                  const dbSpots = dbAttractionsByCity[city];
                  const validDbSpots = dbSpots?.filter((s) => s.cityCode === city);
                  const baseSpotsForCity = ((validDbSpots && validDbSpots.length > 0)
                    ? validDbSpots
                    : ATTRACTION_SPOTS_CATALOG.filter((s) => s.cityCode === city)).filter((s) => SHOW_LOCAL_SPOTS || !s.isLocal);

                  // K-스팟에서 추가된 커스텀 관광지 중 기본 목록에 없는 장소들을 변환하여 상단에 병합
                  const customAttractionPlaces = budgetPlaces
                    .filter((p) => p.city === city && !["ACCOMMODATION", "RESTAURANT", "CAFE"].includes(p.category))
                    .map(placeToAttractionSpot)
                    .filter((cs) => {
                      if (isDefaultAttractionSpot(cs.id)) return false;
                      return !baseSpotsForCity.some((bs) => isSameSpot(bs.id, cs.id));
                    });

                  const spotsForCity = [...customAttractionPlaces, ...baseSpotsForCity];

                  // 수집된 중복 제거 유료 Spot 계산
                  const selectedSpotKeys = new Set<string>();
                  selectedCourseIds.forEach((cid) => {
                    const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
                    if (course) course.spotIds.forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));
                  });
                  individualSpotIds.forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));

                  const currentCatFilter = attractionCategoryFilterByCity[city] || "ALL";
                  const effectiveCatFilter = currentCatFilter === "SAVED_ONLY" && selectedSpotKeys.size === 0 ? "ALL" : currentCatFilter;
                  // 방안 3: 기본 추천순 항상 고정, 필요 시 '담은 항목' 필터로 모아봄
                  const filteredSpotsForCity =
                    effectiveCatFilter === "SAVED_ONLY"
                      ? spotsForCity.filter((s) => selectedSpotKeys.has(normalizeSpotKey(s.id)))
                      : effectiveCatFilter === "ALL"
                        ? spotsForCity
                        : spotsForCity.filter((s) => {
                            const spotKey = s.id.replace(/^kto_/, "");
                            const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[spotKey];
                            const cat = s.categoryType || bilingual?.categoryType;
                            return cat === effectiveCatFilter;
                          });

                  const visibleAttractionsCount = visibleAttractionsCountByCity[city] ?? 8;
                  const displayedSpots = filteredSpotsForCity.slice(0, visibleAttractionsCount);

                  const adultCount = draft.adultCount || 1;
                  let selectedSpotsPricePerPerson = 0;
                  const selectedSpotDetails: AttractionSpot[] = [];

                  selectedSpotKeys.forEach((normKey) => {
                    const spot = spotsForCity.find((s) => isSameSpot(s.id, normKey)) || ATTRACTION_SPOTS_CATALOG.find((s) => isSameSpot(s.id, normKey));
                    if (spot) {
                      selectedSpotDetails.push(spot);
                      if (spot.priceStatus === "PAID") {
                        selectedSpotsPricePerPerson += spot.price;
                      }
                    }
                  });

                  // 완충비 단가 (Basket 기준)
                  const bufferUnitPrice =
                    activeBasketId === "MOSTLY_FREE" ? 10000 : activeBasketId === "EXPERIENCE_RICH" ? 120000 : 50000;
                  const bufferTotal = bufferUnitPrice * adultCount;
                  const spotsTotal = selectedSpotsPricePerPerson * adultCount;
                  const totalAttractionBudget = spotsTotal + bufferTotal;

                  return (
                    <div className="space-y-6">
                      {/* Header & Reset */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0f172a]">
                            {CITY_KOREAN_NAMES[city] || city} {locale === "ko" ? "관광·액티비티 키오스크" : "Attractions Kiosk"}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {locale === "ko"
                              ? "원하는 관광 코스를 복수로 고르거나 개별 액티비티를 쇼핑하듯 예산에 담으세요."
                              : "Pick recommended course presets or add individual attractions."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResetAttraction(city)}
                          disabled={!hasOverride}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            hasOverride
                              ? "text-[#e25c5c] border-[#fce8e8] bg-[#faf5f5] hover:bg-[#fdeeed]"
                              : "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                          }`}
                        >
                          {dict.planner.resetToRecommendedAttraction || "추천 관광으로 초기화"}
                        </button>
                      </div>

                      {/* 1. Recommended Tour Course Presets Section */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            {dict.planner.recommendedCoursesTitle || "추천 관광 코스 프리셋 (복수 선택 가능)"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {locale === "ko" ? "중복 관광지 비용은 1회만 자동 계산" : "Deduplicated spot pricing"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {coursesForCity.map((course) => {
                            const isSelected = selectedCourseIds.includes(course.id);
                            const includedCount = course.spotIds.filter((sid) => selectedSpotKeys.has(normalizeSpotKey(sid))).length;
                            const isFullySelected = isSelected || (course.spotIds.length > 0 && includedCount === course.spotIds.length);
                            const isPartiallySelected = !isFullySelected && includedCount > 0;

                            // 코스 내 유료 관광지 1인 합산가 계산
                            let coursePricePerPerson = 0;
                            course.spotIds.forEach((sid) => {
                              const s = spotsForCity.find((spot) => spot.id === sid) || ATTRACTION_SPOTS_CATALOG.find((spot) => spot.id === sid);
                              if (s && s.priceStatus === "PAID") {
                                coursePricePerPerson += s.price;
                              }
                            });

                            return (
                              <button
                                key={course.id}
                                type="button"
                                onClick={() => handleToggleCourse(city, course.id)}
                                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                                  isFullySelected
                                    ? "bg-rose-50/40 border border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
                                    : isPartiallySelected
                                    ? "bg-amber-50/30 border border-amber-300 ring-1 ring-amber-200/70 shadow-2xs"
                                    : "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                }`}
                              >
                                <div className="space-y-1.5 w-full">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-extrabold">
                                      {course.courseType === "AREA_ROUTE" ? (locale === "ko" ? "권역 동선 코스" : "Route Course") : (locale === "ko" ? "도시 대표 코스" : "City Highlights")}
                                    </span>
                                    {isFullySelected ? (
                                      <span className="text-[10px] bg-[#e25c5c] text-white px-2 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
                                        ✓ {locale === "ko" ? "선택됨" : "Selected"}
                                      </span>
                                    ) : isPartiallySelected ? (
                                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
                                        {locale === "ko" ? `일부 담김 (${includedCount}/${course.spotIds.length})` : `Partial (${includedCount}/${course.spotIds.length})`}
                                      </span>
                                    ) : null}
                                  </div>
                                  <h5 className={`text-xs font-extrabold ${isFullySelected ? "text-[#e25c5c]" : isPartiallySelected ? "text-amber-900" : "text-[#0f172a]"}`}>
                                    {locale === "ko" ? course.nameKo : course.nameEn}
                                  </h5>
                                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                                    {locale === "ko" ? course.descKo : course.descEn}
                                  </p>
                                </div>

                                <div className="mt-3 border-t border-slate-100/80 pt-2 flex items-center justify-between text-xs w-full">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    ⏱️ {course.estimatedHours}{locale === "ko" ? "시간 소요" : "hrs"} · {course.spotIds.length}{locale === "ko" ? "개 장소" : " places"}
                                  </span>
                                  <span className="font-extrabold text-[#e25c5c]">
                                    {coursePricePerPerson > 0 ? `+${formatKrw(coursePricePerPerson)} /인` : (locale === "ko" ? "입장료 무료 코스" : "Free entry")}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Signature City Attractions Section (3x2 Desktop, 2x3 Mobile Grid) */}
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            {locale === "ko" ? "도시 대표 관광지" : (dict.planner.cityAttractionsTitle || "City Attractions")}
                          </span>

                          {/* Category Filter Tabs (전체, 명소, 자연, 엔터, 쇼핑) */}
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            {[
                              { key: "ALL", labelKo: "전체", labelEn: "All", icon: "" },
                              ...(selectedSpotKeys.size > 0
                                ? [
                                    {
                                      key: "SAVED_ONLY",
                                      labelKo: `담은 항목 (${selectedSpotKeys.size})`,
                                      labelEn: `Saved (${selectedSpotKeys.size})`,
                                      icon: "🔖",
                                    },
                                  ]
                                : []),
                              { key: "명소", labelKo: "명소", labelEn: "Landmark", icon: "🏛️" },
                              { key: "자연", labelKo: "자연", labelEn: "Nature", icon: "🌿" },
                              { key: "엔터", labelKo: "엔터", labelEn: "Enter", icon: "🎡" },
                              { key: "쇼핑", labelKo: "쇼핑", labelEn: "Shopping", icon: "🛍️" },
                            ].map((tab) => {
                              const isActive = effectiveCatFilter === tab.key;
                              const isSavedTab = tab.key === "SAVED_ONLY";
                              return (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() =>
                                    setAttractionCategoryFilterByCity((prev) => ({
                                      ...prev,
                                      [city]: tab.key,
                                    }))
                                  }
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
                                  {tab.icon && <span>{tab.icon}</span>}
                                  <span>{locale === "ko" ? tab.labelKo : tab.labelEn}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Grid: 1열 2개 관광정보 카드 (1 Row 2 Columns Grid) */}
                        {isFetchingCityAttractions[city] && (!dbAttractionsByCity[city] || dbAttractionsByCity[city].length === 0) ? (
                          <SpotCardSkeletonGrid />
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {displayedSpots.map((rawSpot, spotIdx) => {
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
                              const isAdded = isSpotSelected || isIncludedInCourse;

                              return (
                                <div
                                  key={rawSpot.id}
                                  className={`rounded-2xl border bg-white flex flex-col overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 ${
                                    isAdded ? "border-rose-300 ring-1 ring-rose-200 bg-rose-50/10" : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  {/* Photo Container: 클릭 시 상세 팝업 오픈 */}
                                  <div
                                    onClick={() => setPreviewSpot(rawSpot)}
                                    className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden cursor-pointer group"
                                    title={locale === "ko" ? "클릭하여 사진 및 상세정보 크게 보기" : "Click to view photo & details"}
                                  >
                                    <SpotCardImage
                                      src={(rawSpot as any).imageUrl}
                                      alt={name}
                                      isPriority={spotIdx < 4}
                                      locale={locale}
                                    />

                                    {/* Hover overlay hint */}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[1px] pointer-events-none">
                                      <span className="text-base">🔍</span>
                                      <span>{locale === "ko" ? "크게 보기" : "Zoom"}</span>
                                    </div>

                                    {/* Price Tag Pill & Local Badge on Image */}
                                    <div className="absolute top-3 right-3 z-10 pointer-events-none flex items-center gap-1.5">
                                      {/* 로컬 명소 뱃지 (추후 문구/디자인 손쉽게 변경 가능) */}
                                      {rawSpot.isLocal && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
                                          <span>🇰🇷</span>
                                          <span>로컬</span>
                                        </span>
                                      )}
                                      {rawSpot.priceStatus === "FREE" || rawSpot.price === 0 ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
                                          {locale === "ko" ? "무료" : "FREE"}
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-900/85 text-white backdrop-blur-md shadow-xs">
                                          {formatKrw(rawSpot.price)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                {/* Body Information */}
                                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                  <div className="space-y-2">
                                    {/* Title & Category Badge */}
                                    <div className="flex items-start justify-between gap-2">
                                      <h5
                                        onClick={() => setPreviewSpot(rawSpot)}
                                        className="text-[15px] font-extrabold text-[#0f172a] leading-snug cursor-pointer hover:text-indigo-600 transition-colors"
                                      >
                                        {name}
                                      </h5>
                                      {/* Category & Local Badges */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        {/* 로컬 명소 뱃지 (추후 문구/디자인 손쉽게 변경 가능) */}
                                        {rawSpot.isLocal && (
                                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                                            <span>🇰🇷</span>
                                            <span>로컬</span>
                                          </span>
                                        )}
                                        {(() => {
                                          const cat = rawSpot.categoryType || bilingual?.categoryType;
                                          if (!cat) return null;
                                          const badgeConfig = {
                                            명소: { bg: "bg-blue-50 text-blue-700 border-blue-200/80", icon: "🏛️", labelKo: "명소", labelEn: "Landmark" },
                                            자연: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80", icon: "🌿", labelKo: "자연", labelEn: "Nature" },
                                            엔터: { bg: "bg-purple-50 text-purple-700 border-purple-200/80", icon: "🎡", labelKo: "엔터", labelEn: "Enter" },
                                            쇼핑: { bg: "bg-amber-50 text-amber-800 border-amber-200/80", icon: "🛍️", labelKo: "쇼핑", labelEn: "Shopping" },
                                          }[cat as "명소" | "자연" | "엔터" | "쇼핑"];
                                          if (!badgeConfig) return null;
                                          return (
                                            <span
                                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badgeConfig.bg}`}
                                            >
                                              <span>{badgeConfig.icon}</span>
                                              <span>{locale === "ko" ? badgeConfig.labelKo : badgeConfig.labelEn}</span>
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                      {desc}
                                    </p>

                                    {/* Badges: Subway, Closed, Hours */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      {subway && (
                                        <div
                                          className="flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 truncate max-w-full"
                                          title={subway}
                                        >
                                          <span className="shrink-0">🚇</span>
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
                                          ⏱️ {closed}
                                        </span>
                                      )}
                                      {hours && (
                                        <span
                                          className="text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 truncate max-w-[200px]"
                                          title={hours}
                                        >
                                          🕒 {hours}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewSpot(rawSpot)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors border border-slate-200/80 cursor-pointer"
                                    >
                                      <span>🔍</span>
                                      <span>{locale === "ko" ? "상세보기" : "Details"}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleSpot(city, rawSpot.id)}
                                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                                        isSpotSelected || isIncludedInCourse
                                          ? "bg-rose-500 text-white shadow-xs hover:bg-rose-600"
                                          : "bg-[#0f172a] text-white hover:bg-slate-800 shadow-2xs"
                                      }`}
                                    >
                                      {isSpotSelected || isIncludedInCourse
                                        ? (locale === "ko" ? "✓ 담김" : "✓ Added")
                                        : (locale === "ko" ? "예산에 담기" : "Add to Budget")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        )}

                        {/* Stepwise Show More (+8) / Show Less Toggle Button */}
                        {filteredSpotsForCity.length > 8 && (
                          <div className="text-center pt-2">
                            {visibleAttractionsCount < filteredSpotsForCity.length ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleAttractionsCountByCity((prev) => ({
                                    ...prev,
                                    [city]: (prev[city] ?? 8) + 8,
                                  }))
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                <span>{dict.planner.showMore || "더보기"}</span>
                                <span>▼</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleAttractionsCountByCity((prev) => ({
                                    ...prev,
                                    [city]: 8,
                                  }))
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                <span>{dict.planner.showLess || "접기"}</span>
                                <span>▲</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. My Attraction Budget Summary Panel */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-extrabold text-[#0f172a] flex items-center gap-1">
                            {dict.planner.myAttractionSummaryTitle || "📋 내 여행 관광 예산 요약"}
                          </span>
                          <span className="text-xs font-black text-[#e25c5c]">
                            {formatKrw(totalAttractionBudget)}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          {/* Course breakdown */}
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-700">
                              {dict.planner.selectedCoursesLabel || "선택 코스"} ({selectedCourseIds.length}{locale === "ko" ? "개" : ""}):
                            </span>
                            <span className="font-medium text-right text-slate-800">
                              {selectedCourseIds.length === 0
                                ? (locale === "ko" ? "선택 없음" : "None selected")
                                : selectedCourseIds
                                    .map((cid) => {
                                      const c = TOUR_COURSE_PRESETS.find((course) => course.id === cid);
                                      return locale === "ko" ? c?.nameKo : c?.nameEn;
                                    })
                                    .join(", ")}
                            </span>
                          </div>

                          {/* Spot breakdown */}
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-700">
                              {dict.planner.individualSpotsLabel || "담은 유료 관광지"} ({selectedSpotDetails.filter(s => s.priceStatus === "PAID").length}{locale === "ko" ? "개" : ""}):
                            </span>
                            <span className="font-extrabold text-[#e25c5c]">
                              {formatKrw(spotsTotal)} ({adultCount}{locale === "ko" ? "인 기준" : " travelers"})
                            </span>
                          </div>

                          {/* Buffer budget (Basket) */}
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200/40">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <span>🎟️</span>
                              <span>{dict.planner.bufferBudgetLabel || "현지 활동 용돈 & 자유 예비비"}:</span>
                            </span>
                            <span className="font-extrabold text-slate-800">
                              {formatKrw(bufferTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Notice for unconfirmed/partially paid spots */}
                        {selectedSpotDetails.some((s) => s.priceStatus === "UNCONFIRMED" || s.priceStatus === "PARTIALLY_PAID") && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>{dict.planner.priceUnconfirmedWarning || "일부 유료 또는 가격 미확인 항목은 자동 예산 합산에서 제외되어 있습니다."}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}



            {(() => {
              const activeNotice =
                (activeCategory === "FOOD" && dict.planner.foodNotice) ||
                (activeCategory === "CITY_TRANSPORT" && dict.planner.transportNotice) ||
                (activeCategory === "ATTRACTION" && dict.planner.attractionOverrideNotice) ||
                (activeCategory === "EMERGENCY_FUND" && dict.planner.emergencyNotice);

              if (!activeNotice) return null;

              return (
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <svg className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="leading-relaxed">{activeNotice}</p>
                </div>
              );
            })()}
          </div>


        </div>

        {/* ================= RIGHT STICKY SMART RECEIPT (40%) ================= */}
        {(() => {
          const finalGrandTotalKrw = plan.grandTotalKrw + shoppingAmountKrw + allCustomFoodTotalKrw;
          const finalPerTravelerTotalKrw = Math.round(finalGrandTotalKrw / adultCount);

          const targetBudget = plan.targetBudgetKrw || 1;
          const isOverBudget = finalGrandTotalKrw > targetBudget;
          const targetBudgetUsagePercent = Math.round((finalGrandTotalKrw / targetBudget) * 100);
          const clampedUsage = Math.min(100, Math.max(0, targetBudgetUsagePercent));
          const remainingBudgetKrw = Math.max(0, targetBudget - finalGrandTotalKrw);
          const overBudgetAmountKrw = Math.max(0, finalGrandTotalKrw - targetBudget);

          return (
            <div className="lg:col-span-4 lg:sticky lg:top-[76px] space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#e25c5c] to-[#e25c5c]/60"></div>

                <div className="pb-4 border-b border-slate-100 mt-2 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold tracking-tight text-[#0f172a]">
                      {dict.planner.receiptTitle}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft(draft);
                        setEditTab("NIGHTS");
                        setEditError(null);
                        setIsEditModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#e25c5c] hover:underline hover:text-[#d14b4b] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e25c5c] p-1 flex items-center gap-1 transition-colors"
                    >
                      <span>{dict.planner.editTripDetails}</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* Trip Details Badges inside Receipt Header (Replaces '초안') */}
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 font-medium items-center">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-bold">
                      {formatTripDuration(draft.totalNights || 5, dict, locale)}
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-bold">
                      {formatTravelerCount(draft.adultCount || 2, dict, locale)}
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-bold">
                      {Object.entries(draft.cityNightAllocations || {})
                        .filter(([_, n]) => (n || 0) > 0)
                        .map(([city, n]) => {
                          const cityName = CITY_KOREAN_NAMES[city as SupportedCity] || city;
                          return draft.selectedCities.length > 1 ? `${cityName}(${n}박)` : cityName;
                        })
                        .join(" · ")}
                    </span>
                  </div>
                </div>

                <div className="py-4 border-b border-slate-100 space-y-3.5">
                  <div className="text-xs font-bold text-slate-500">
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                        {dict.planner.targetBudget}
                      </span>
                      <span className="mt-0.5 block text-slate-700 text-sm">{formatKrw(plan.targetBudgetKrw)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        {dict.planner.budgetUsage}
                      </span>
                      <span className={`tabular-nums font-extrabold ${isOverBudget ? "text-red-500" : "text-[#4d7c67]"}`}>
                        {formatPercentage(targetBudgetUsagePercent)}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={targetBudgetUsagePercent} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? "bg-red-500" : "bg-[#4d7c67]"
                          }`}
                        style={{ width: `${clampedUsage}%` }}
                      ></div>
                    </div>

                    <div className="text-xs flex items-center justify-between font-bold">
                      {isOverBudget ? (
                        <>
                          <span className="text-red-500">{dict.planner.overBudget}</span>
                          <span className="text-red-500 tabular-nums">+{formatKrw(overBudgetAmountKrw)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400">{dict.planner.remainingBudget}</span>
                          <span className="text-[#4d7c67] tabular-nums">{formatKrw(remainingBudgetKrw)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Journey Timeline: City Accordions & Intercity Transit */}
                {(() => {
                  const allTransitItems = plan.intercitySection?.lineItems || [];
                  const entryItems = allTransitItems.filter((i) => (i.route && i.route.startsWith("ENTRY_")) || (i.sourceLabel && i.sourceLabel.includes("[입국 공항]")));
                  const exitItems = allTransitItems.filter((i) => (i.route && i.route.startsWith("EXIT_")) || (i.sourceLabel && i.sourceLabel.includes("[출국 공항]")));
                  const transitItems = allTransitItems.filter((i) => !entryItems.includes(i) && !exitItems.includes(i));

                  const formatSimplifiedTransit = (item: any) => {
                    let raw = item.sourceLabel || getBasketLabel(item.basketId, dict, locale) || "";
                    raw = raw.replace(/\[입국 공항\]|\[도시 간\]|\[출국 공항\]/g, "").trim();

                    const isJejuRoute = (item.route && item.route.includes("JEJU")) || raw.includes("제주");

                    // 수단(Mode) 정제
                    let mode = "";
                    let icon = "🚆";

                    if ((raw.includes("항공") || isJejuRoute) && (raw.includes("버스") || raw.includes("시외") || raw.includes("리무진"))) {
                      mode = locale === "ko" ? "항공+버스" : "Flight+Bus";
                      icon = "🛫";
                    } else if ((raw.includes("항공") || isJejuRoute) && (raw.includes("KTX") || raw.includes("열차") || raw.includes("기차") || raw.includes("이음") || raw.includes("ITX"))) {
                      mode = locale === "ko" ? "항공+KTX" : "Flight+KTX";
                      icon = "🛫";
                    } else if ((raw.includes("항공") || isJejuRoute) && (raw.includes("공항철도") || raw.includes("AREX"))) {
                      mode = locale === "ko" ? "항공+공항철도" : "Flight+Airport Express";
                      icon = "🛫";
                    } else if (
                      raw.includes("항공") ||
                      raw.includes("비행기") ||
                      raw.toLowerCase().includes("flight") ||
                      (isJejuRoute && (raw.includes("공항") || raw.includes("일반석") || raw.includes("특가") || raw.includes("할인석")))
                    ) {
                      mode = locale === "ko" ? "국내선 항공" : "Domestic Flight";
                      icon = "🛫";
                    } else if (raw.includes("KTX") || raw.includes("SRT") || raw.includes("고속철도") || raw.includes("이음") || raw.includes("기차")) {
                      mode = raw.includes("SRT") ? "SRT" : "KTX";
                      icon = "🚆";
                    } else if (raw.includes("공항철도") || raw.includes("AREX")) {
                      mode = locale === "ko" ? "공항철도" : "Airport Express";
                      icon = "🚆";
                    } else if (raw.includes("고속버스") || raw.includes("우등") || raw.includes("KOBUS")) {
                      mode = locale === "ko" ? "고속버스" : "Express Bus";
                      icon = "🚌";
                    } else if (raw.includes("시외버스") || raw.includes("공항버스") || raw.includes("리무진") || raw.includes("버스타고") || raw.toLowerCase().includes("bus")) {
                      mode = locale === "ko" ? "공항/시외버스" : "Bus";
                      icon = "🚌";
                    } else {
                      const match = raw.match(/\(([^)]+)\)/);
                      if (match) {
                        mode = match[1].replace(/표준\/정규형|일반석|우등|직통|버스타고/g, "").trim();
                      }
                      if (!mode && isJejuRoute) {
                        mode = locale === "ko" ? "국내선 항공" : "Domestic Flight";
                        icon = "🛫";
                      }
                    }

                    // 구간(Route) 정제
                    let routeName = "";
                    if (item.route) {
                      if (item.route.startsWith("ENTRY_")) {
                        const parts = item.route.replace("ENTRY_", "").split("-");
                        const airportCode = parts[0] || "INCHEON";
                        const targetCity = parts[1] || "";
                        const airportName = airportCode === "INCHEON" ? (locale === "ko" ? "인천공항" : "Incheon Airport") : (locale === "ko" ? "공항" : "Airport");
                        const cityName = (locale === "ko" ? CITY_KOREAN_NAMES[targetCity as SupportedCity] : CITY_ENGLISH_NAMES[targetCity as SupportedCity]) || targetCity;
                        routeName = `${airportName} ➔ ${cityName}`;
                      } else if (item.route.startsWith("EXIT_")) {
                        const parts = item.route.replace("EXIT_", "").split("-");
                        const sourceCity = parts[0] || "";
                        const airportCode = parts[1] || "INCHEON";
                        const cityName = (locale === "ko" ? CITY_KOREAN_NAMES[sourceCity as SupportedCity] : CITY_ENGLISH_NAMES[sourceCity as SupportedCity]) || sourceCity;
                        const airportName = airportCode === "INCHEON" ? (locale === "ko" ? "인천공항" : "Incheon Airport") : (locale === "ko" ? "공항" : "Airport");
                        routeName = `${cityName} ➔ ${airportName}`;
                      } else {
                        const parts = item.route.split("-");
                        if (parts.length === 2) {
                          const fromName = (locale === "ko" ? CITY_KOREAN_NAMES[parts[0] as SupportedCity] : CITY_ENGLISH_NAMES[parts[0] as SupportedCity]) || parts[0];
                          const toName = (locale === "ko" ? CITY_KOREAN_NAMES[parts[1] as SupportedCity] : CITY_ENGLISH_NAMES[parts[1] as SupportedCity]) || parts[1];
                          routeName = `${fromName} ➔ ${toName}`;
                        }
                      }
                    }

                    if (!routeName) {
                      routeName = raw.replace(/\([^)]*\)/g, "").trim();
                    }

                    return { routeName, modeName: mode, icon };
                  };

                  const toggleReceiptCity = (city: string) => {
                    setExpandedReceiptCities((prev) => ({
                      ...prev,
                      [city]: !prev[city],
                    }));
                  };

                  return (
                    <div className="py-1 space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
                      {/* 1. 입국 공항 이동 (첫 도시 전 타임라인 구분선 커넥터) */}
                      {entryItems.length > 0 && (
                        <div className="relative py-1 flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-dashed border-slate-300"></div>
                          </div>
                          <div className="relative flex items-center justify-between gap-2 max-w-[96%] px-2.5 py-0.5 rounded-full bg-slate-100/95 border border-slate-300/80 text-[11px] shadow-2xs text-slate-700">
                            <div className="flex items-center gap-1.5 min-w-0 truncate font-bold text-[10px]">
                              <span className="shrink-0 text-xs">🛫</span>
                              <span className="truncate text-slate-800">
                                {entryItems.map((i) => formatSimplifiedTransit(i).routeName).join(", ")}
                              </span>
                              {entryItems[0] && formatSimplifiedTransit(entryItems[0]).modeName && (
                                <span className="text-[9.5px] text-slate-500 font-medium shrink-0">
                                  ({formatSimplifiedTransit(entryItems[0]).modeName})
                                </span>
                              )}
                            </div>
                            <span className="font-sans tabular-nums font-black text-slate-900 shrink-0 text-[11px] pl-1.5 border-l border-slate-300/70">
                              {formatKrw(entryItems.reduce((sum, item) => sum + item.lineTotalKrw, 0))}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 2. 도시별 아코디언 및 도시 간 이동 교통 */}
                      {draft.selectedCities.map((city, cityIdx) => {
                        const section = plan.citySections[city];
                        if (!section) return null;

                        const label = CITY_KOREAN_NAMES[city] || city;
                        const englishCityName = CITY_ENGLISH_NAMES[city] || city;
                        const cityNights = section.nights;
                        const cityLineItems = section.lineItems || [];

                        // 1) 숙박
                        const accItems = cityLineItems.filter((item) => item.category === "ACCOMMODATION");
                        const accTotal = accItems.reduce((sum, i) => sum + i.lineTotalKrw, 0);

                        // 2) 음식 (기본 식비 + K-스팟 맛집/카페)
                        const foodItems = cityLineItems.filter((item) => item.category === "FOOD");
                        const foodBaseTotal = foodItems.reduce((sum, i) => sum + i.lineTotalKrw, 0);
                        const cityCustomFood = budgetPlaces.filter((p) => p.city === city && ["RESTAURANT", "CAFE"].includes(p.category));
                        const adultCount = draft.adultCount || 1;
                        let cityCustomFoodTotalKrw = 0;
                        cityCustomFood.forEach((f) => {
                          const price = f.priceKrw ?? (f as any).estimatedPriceKrw ?? (f.category === "CAFE" ? 8000 : 18000);
                          cityCustomFoodTotalKrw += price * adultCount;
                        });
                        const foodTotal = foodBaseTotal + cityCustomFoodTotalKrw;

                        // 3) 시내 교통
                        const transportItems = cityLineItems.filter((item) => item.category === "CITY_TRANSPORT");
                        const transportTotal = transportItems.reduce((sum, i) => sum + i.lineTotalKrw, 0);

                        // 4) 관광 & 쇼핑
                        const citySel = preferences.attractionSelections?.[city] || { selectedCourseIds: [], individualSpotIds: [] };
                        const spotsForCity = [
                          ...budgetPlaces.filter((p) => p.city === city && !["ACCOMMODATION", "RESTAURANT", "CAFE"].includes(p.category)).map(placeToAttractionSpot),
                          ...(dbAttractionsByCity[city] || ATTRACTION_SPOTS_CATALOG.filter((s) => s.cityCode === city)),
                        ];
                        const selectedSpotKeys = new Set<string>();
                        (citySel.selectedCourseIds || []).forEach((cid) => {
                          const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
                          if (course) course.spotIds.forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));
                        });
                        (citySel.individualSpotIds || []).forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));

                        const addedSpotsList: AttractionSpot[] = [];
                        let attractionsAddedTotalKrw = 0;
                        selectedSpotKeys.forEach((normKey) => {
                          const spot = spotsForCity.find((s) => isSameSpot(s.id, normKey)) || ATTRACTION_SPOTS_CATALOG.find((s) => isSameSpot(s.id, normKey));
                          if (spot) {
                            addedSpotsList.push(spot);
                            if (spot.priceStatus === "PAID" && spot.price > 0) {
                              attractionsAddedTotalKrw += spot.price * adultCount;
                            }
                          }
                        });

                        const attractionBaseItems = cityLineItems.filter((item) => item.category === "ATTRACTION");
                        const attractionBaseTotal = attractionBaseItems.reduce((sum, i) => sum + i.lineTotalKrw, 0);
                        const cityShoppingKrw = cityIdx === 0 ? shoppingAmountKrw : 0;
                        const attractionShoppingTotal = attractionBaseTotal + attractionsAddedTotalKrw + cityShoppingKrw;

                        // 도시 총액
                        const cityTotal = accTotal + foodTotal + transportTotal + attractionShoppingTotal;

                        // 아코디언 열림 여부 (기본: 접힘, 클릭 시 토글)
                        const isExpanded = !!expandedReceiptCities[city];

                        // 다음 도시로 이동하는 교통 아이템
                        const nextCity = draft.selectedCities[cityIdx + 1];
                        const transitToNext = nextCity ? (
                          transitItems.find((i) => i.route === `${city}-${nextCity}` || i.route === `${nextCity}-${city}`) || transitItems[cityIdx]
                        ) : null;

                        return (
                          <div key={city} className="space-y-1.5">
                            {/* 도시 접이식 아코디언 카드 */}
                            <div className="rounded-lg border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all">
                              {/* 도시 헤더 (토글 버튼) */}
                              <button
                                type="button"
                                onClick={() => toggleReceiptCity(city)}
                                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#e25c5c]"></span>
                                  <span className="text-[13px] font-extrabold text-[#0f172a]">
                                    {locale === "ko" ? label : englishCityName}
                                  </span>
                                  <span className="text-[10.5px] font-bold text-slate-400">
                                    ({cityNights === 0 ? (locale === "ko" ? "당일" : "Day trip") : `${cityNights}${locale === "ko" ? "박" : "N"}`})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900 tabular-nums">
                                    {formatKrw(cityTotal)}
                                  </span>
                                  <span className="text-slate-400 font-bold text-[10px]">
                                    {isExpanded ? "▲" : "▼"}
                                  </span>
                                </div>
                              </button>

                              {/* 도시 내부 항목 (펼쳤을 때) */}
                              {isExpanded && (
                                <div className="px-3 pb-3 pt-1.5 border-t border-slate-100 space-y-2 bg-slate-50/30 text-xs">
                                  {/* 1. 숙박 */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                        <span>🏨</span>
                                        <span>{getCategoryLabel("ACCOMMODATION", dict)}</span>
                                      </span>
                                      <span className="font-sans tabular-nums font-bold text-slate-800">
                                        {formatKrw(accTotal)}
                                      </span>
                                    </div>
                                    {accItems.map((item) => (
                                      <div key={item.id} className="flex justify-between items-start text-[11px] text-slate-500 pl-5">
                                        <span className="truncate pr-2">{item.sourceLabel || getBasketLabel(item.basketId, dict, locale, city)}</span>
                                        <span className="tabular-nums font-medium text-slate-700 shrink-0">{formatKrw(item.lineTotalKrw)}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* 2. 음식 */}
                                  <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                        <span>🍱</span>
                                        <span>{getCategoryLabel("FOOD", dict)}</span>
                                      </span>
                                      <span className="font-sans tabular-nums font-bold text-slate-800">
                                        {formatKrw(foodTotal)}
                                      </span>
                                    </div>
                                    {/* 음식 품목 리스트 (관광 & 쇼핑과 동일한 직관적 플랫 리스트) */}
                                    {(() => {
                                      const primaryFood = foodItems[0];
                                      const basketPlan = isCalculatedMealPlan(primaryFood?.mealPlan)
                                        ? primaryFood.mealPlan.foodBasketPlan
                                        : undefined;

                                      if (basketPlan) {
                                        return (
                                          <div className="space-y-1 pl-5">
                                            {/* 선택된 대표 음식 목록 */}
                                            {basketPlan.selectedItems.map((item) => {
                                              const name = locale === "ko" ? item.food.nameKo : item.food.nameEn;
                                              return (
                                                <div key={item.food.id} className="flex justify-between items-center text-[11px] text-slate-600">
                                                  <span className="truncate pr-2">{name} x{item.quantity}</span>
                                                  <span className="tabular-nums font-medium text-slate-700 shrink-0">
                                                    {formatKrw(item.subtotalKrw)}
                                                  </span>
                                                </div>
                                              );
                                            })}

                                            {/* 부족 끼니 완충 식비 (선택한 음식이 끼니보다 적을 때만 간단명료하게 1줄 표시) */}
                                            {basketPlan.baseAllowanceTotalKrw > 0 && (
                                              <div className="flex justify-between items-center text-[11px] text-slate-500">
                                                <span className="truncate pr-2 text-slate-400">
                                                  {locale === "ko"
                                                    ? `기본 일상 식비 (${basketPlan.uncoveredMealsCount}끼)`
                                                    : `Base Allowance (${basketPlan.uncoveredMealsCount} meals)`}
                                                </span>
                                                <span className="tabular-nums font-medium text-slate-700 shrink-0">
                                                  {formatKrw(basketPlan.baseAllowanceTotalKrw)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }

                                      return foodItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start text-[11px] text-slate-500 pl-5">
                                          <span className="truncate pr-2">{locale === "ko" ? "기본 식비" : "Base Meal Allowance"}</span>
                                          <span className="tabular-nums font-medium text-slate-700 shrink-0">{formatKrw(item.lineTotalKrw)}</span>
                                        </div>
                                      ));
                                    })()}
                                    {cityCustomFood.length > 0 && (
                                      <div className="pl-5 pt-1 space-y-1 border-t border-dashed border-slate-200/80">
                                        <span className="text-[10px] font-bold text-amber-700 block">
                                          🍲 {locale === "ko" ? "담은 맛집·카페" : "Added Gourmet"} ({cityCustomFood.length})
                                        </span>
                                        {cityCustomFood.map((fp) => {
                                          const uPrice = fp.priceKrw ?? (fp as any).estimatedPriceKrw ?? (fp.category === "CAFE" ? 8000 : 18000);
                                          const iTotal = uPrice * adultCount;
                                          const fName = locale === "ko" ? (fp.translations?.ko?.title || (fp as any).title || (fp as any).nameKo) : (fp.translations?.en?.title || (fp as any).title || (fp as any).nameEn);
                                          return (
                                            <div key={fp.id} className="flex justify-between items-center text-[10px] text-slate-500">
                                              <span className="truncate pr-2">{fName}</span>
                                              <span className="tabular-nums font-medium text-slate-700 shrink-0">{formatKrw(iTotal)}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* 3. 시내 교통 */}
                                  <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                        <span>🚌</span>
                                        <span>{getCategoryLabel("CITY_TRANSPORT", dict)}</span>
                                      </span>
                                      <span className="font-sans tabular-nums font-bold text-slate-800">
                                        {formatKrw(transportTotal)}
                                      </span>
                                    </div>
                                    {transportItems.map((item) => (
                                      <div key={item.id} className="flex justify-between items-start text-[11px] text-slate-500 pl-5">
                                        <span className="truncate pr-2">{item.sourceLabel || getBasketLabel(item.basketId, dict, locale, city)}</span>
                                        <span className="tabular-nums font-medium text-slate-700 shrink-0">{formatKrw(item.lineTotalKrw)}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* 4. 관광 & 쇼핑 */}
                                  {(attractionShoppingTotal > 0 || addedSpotsList.length > 0) && (
                                    <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                          <span>🎡</span>
                                          <span>{locale === "ko" ? "관광 & 쇼핑" : "Attractions & Shopping"}</span>
                                        </span>
                                        <span className="font-sans tabular-nums font-bold text-slate-800">
                                          {formatKrw(attractionShoppingTotal)}
                                        </span>
                                      </div>
                                      {attractionBaseItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start text-[11px] text-slate-500 pl-5">
                                          <span className="truncate pr-2">{locale === "ko" ? "일일 활동 용돈" : "Daily Allowance"}</span>
                                          <span className="tabular-nums font-medium text-slate-700 shrink-0">{formatKrw(item.lineTotalKrw)}</span>
                                        </div>
                                      ))}
                                      {cityShoppingKrw > 0 && (
                                        <div className="flex justify-between items-start text-[11px] text-slate-500 pl-5">
                                          <span className="truncate pr-2">{locale === "ko" ? "쇼핑 예산" : "Shopping Budget"}</span>
                                          <span className="tabular-nums font-medium text-slate-700 shrink-0">{formatKrw(cityShoppingKrw)}</span>
                                        </div>
                                      )}
                                      {addedSpotsList.length > 0 && (
                                        <div className="pl-5 pt-1 space-y-1 border-t border-dashed border-slate-200/80">
                                          <span className="text-[10px] font-bold text-[#e25c5c] block">
                                            🎡 {locale === "ko" ? "담은 관광 명소" : "Added Sightseeing"} ({addedSpotsList.length})
                                          </span>
                                          {addedSpotsList.map((spot) => {
                                            const spotKey = normalizeSpotKey(spot.id);
                                            const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[spotKey];
                                            const sName = locale === "ko" ? (bilingual?.nameKo || spot.nameKo) : (bilingual?.nameEn || spot.nameEn);
                                            const sTotal = spot.priceStatus === "PAID" && spot.price > 0 ? spot.price * adultCount : 0;
                                            return (
                                              <div key={spot.id} className="flex justify-between items-center text-[10px] text-slate-500">
                                                <span className="truncate pr-2">{sName}</span>
                                                <span className="tabular-nums font-medium text-slate-700 shrink-0">
                                                  {sTotal > 0 ? formatKrw(sTotal) : "무료"}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* 도시 간 이동 교통 (도시와 도시를 구분하는 타임라인 구분선 커넥터) */}
                            {transitToNext && (() => {
                              const transitInfo = formatSimplifiedTransit(transitToNext);
                              return (
                                <div className="relative py-0.5 flex items-center justify-center">
                                  {/* 양옆으로 뻗어 도시를 구분해주는 대시 구분선 */}
                                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-dashed border-slate-300"></div>
                                  </div>
                                  {/* 중앙에 위치하는 도시 간 연결 뱃지 라벨 */}
                                  <div className="relative flex items-center justify-between gap-2 max-w-[96%] px-2.5 py-0.5 rounded-full bg-slate-100/95 border border-slate-300/80 text-[10.5px] shadow-2xs text-slate-700 hover:bg-slate-200/80 transition-colors">
                                    <div className="flex items-center gap-1.5 min-w-0 truncate font-bold text-[10px]">
                                      <span className="shrink-0 text-xs">{transitInfo.icon}</span>
                                      <span className="truncate text-slate-800">{transitInfo.routeName}</span>
                                      {transitInfo.modeName && (
                                        <span className="text-[9.5px] text-slate-500 font-medium shrink-0">
                                          ({transitInfo.modeName})
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-sans tabular-nums font-black text-slate-900 shrink-0 text-[11px] pl-1.5 border-l border-slate-300/70">
                                      {formatKrw(transitToNext.lineTotalKrw)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}

                      {/* 3. 출국 공항 이동 (마지막 도시 나온 후 타임라인 구분선 커넥터) */}
                      {exitItems.length > 0 && (
                        <div className="relative py-1 flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-dashed border-slate-300"></div>
                          </div>
                          <div className="relative flex items-center justify-between gap-2 max-w-[96%] px-2.5 py-0.5 rounded-full bg-slate-100/95 border border-slate-300/80 text-[11px] shadow-2xs text-slate-700">
                            <div className="flex items-center gap-1.5 min-w-0 truncate font-bold text-[10px]">
                              <span className="shrink-0 text-xs">🛫</span>
                              <span className="truncate text-slate-800">
                                {exitItems.map((i) => formatSimplifiedTransit(i).routeName).join(", ")}
                              </span>
                              {exitItems[0] && formatSimplifiedTransit(exitItems[0]).modeName && (
                                <span className="text-[9.5px] text-slate-500 font-medium shrink-0">
                                  ({formatSimplifiedTransit(exitItems[0]).modeName})
                                </span>
                              )}
                            </div>
                            <span className="font-sans tabular-nums font-black text-slate-900 shrink-0 text-[11px] pl-1.5 border-l border-slate-300/70">
                              {formatKrw(exitItems.reduce((sum, item) => sum + item.lineTotalKrw, 0))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Bottom Calculation Breakdown: Base Expenses + Emergency Fund = Grand Total */}
                <div className="pt-4 border-t border-dashed border-slate-200 space-y-3.5">
                  <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    {/* 1) 기본 여행 경비 */}
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-600">
                        {locale === "ko" ? "기본 여행 경비" : "Base Trip Expenses"}
                      </span>
                      <span className="font-extrabold text-slate-900 tabular-nums">
                        {formatKrw(baseEmergencyGrandTotal)}
                      </span>
                    </div>

                    {/* 2) 여행 비상금 */}
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-600 flex items-center gap-1.5">
                        <span>{locale === "ko" ? "여행 비상금" : "Emergency Fund"}</span>
                        {activeEmergencyPct !== undefined && activeEmergencyPct > 0 && emergencyManualInput === "" && (
                          <span className="text-[10px] font-extrabold text-[#e25c5c] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/80 leading-none">
                            +{Math.round(activeEmergencyPct * 100)}%
                          </span>
                        )}
                      </span>
                      <span className="font-extrabold text-[#e25c5c] tabular-nums">
                        +{formatKrw(computedEmergencyKrw)}
                      </span>
                    </div>
                  </div>

                  {/* 3) 최종 예상 총액 */}
                  <div className="pt-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-extrabold text-[#0f172a]">{dict.planner.estimatedTotal}</span>
                      <span className="text-2xl font-extrabold tracking-tight text-[#0f172a]">
                        {formatKrw(finalGrandTotalKrw)}
                      </span>
                    </div>
                  </div>
                </div>

              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-center">
                <p className="text-[11px] text-slate-500 font-medium">
                  {locale === "ko"
                    ? "💡 상세 분석 및 리포트는 [예산 리포트 만들기]에서 확인하세요."
                    : "💡 Detailed analytics & report are in [Generate Budget Report]."}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => router.push(`/${locale}/report`)}
                  className="w-full h-11 px-4 rounded-xl bg-[#e25c5c] text-white hover:bg-[#d14b4b] active:bg-[#c03a3a] font-extrabold text-sm text-center shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📊</span>
                  <span>{dict.planner.generateReport}</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="h-10 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs text-center transition-colors cursor-pointer"
                  >
                    <span>{dict.planner.saveTrip}</span>
                  </button>
                  <button
                    onClick={handleCopySummary}
                    className="h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs text-center transition-colors cursor-pointer"
                  >
                    <span>{dict.planner.copySummaryButton}</span>
                  </button>
                </div>
                {[
                  { label: dict.planner.shareReceipt, key: "share" }
                ].map((btn) => (
                  <button
                    key={btn.key}
                    disabled
                    aria-describedby="future-features-info"
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-slate-400 bg-slate-50 font-bold text-sm text-center relative cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    <span>{btn.label}</span>
                    <span className="absolute -top-1.5 right-2 bg-slate-200 text-slate-500 text-[8px] font-bold px-1 py-0.5 rounded scale-90">
                      Coming Soon
                    </span>
                  </button>
                ))}
                <span id="future-features-info" className="sr-only">
                  {dict.planner.notYetAvailable}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>

      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-xl shadow-lg border border-slate-700/60 font-semibold text-xs flex items-center gap-2"
        >
          <svg className="h-4 w-4 text-[#e25c5c] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Save Trip Modal */}
      <SaveTripModal
        isOpen={isSaveModalOpen}
        saveTitle={saveTitle}
        onSaveTitleChange={setSaveTitle}
        onClose={() => {
          setIsSaveModalOpen(false);
          setSaveTitle("");
        }}
        onSave={handleSaveTripPlan}
        dict={dict}
      />
      {/* ================= ✈️ 여행 조건 수정 탭 분리형 스마트 팝오버 모달 ================= */}
      {isEditModalOpen && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#faf9f7]">
              <div>
                <h3 className="text-lg font-extrabold text-[#0f172a]">✈️ 여행 조건 수정</h3>
                <p className="text-xs text-slate-500 mt-0.5">기간, 인원, 목적지를 수정한 후 적용하여 실시간 예산을 재계산하세요.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setEditTab("NIGHTS")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                  editTab === "NIGHTS"
                    ? "bg-white text-[#e25c5c] shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🗓️ 1단계: 기간 ({editDraft.totalNights ? `${editDraft.totalNights}박` : "미선택"})
              </button>

              <button
                type="button"
                onClick={() => setEditTab("ADULTS")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                  editTab === "ADULTS"
                    ? "bg-white text-[#e25c5c] shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👥 2단계: 인원 ({editDraft.adultCount ? `${editDraft.adultCount}명` : "미선택"})
              </button>

              <button
                type="button"
                onClick={() => setEditTab("CITIES")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                  editTab === "CITIES"
                    ? "bg-white text-[#e25c5c] shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📍 3단계: 목적지 ({editDraft.selectedCities.length}곳)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-white">
              {editError && (
                <div className="text-xs text-[#ef4444] font-semibold p-2.5 bg-red-50 border border-red-200 rounded-xl text-center">
                  ⚠️ {editError}
                </div>
              )}

              {/* Tab 3: 🗓️ 여행 전체 기간 설정 */}
              {editTab === "NIGHTS" && (() => {
                return (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>전체 여행 기간 설정 (1박 ~ 14박)</span>
                        <span className="text-[#e25c5c] font-black">
                          {editDraft.totalNights !== null ? `${editDraft.totalNights}박 ${editDraft.totalNights + 1}일` : "미선택"}
                        </span>
                      </div>

                      <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2 bg-[#faf9f7] p-3 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleModalNightsChange(Math.max(1, (editDraft.totalNights || 5) - 1))}
                          disabled={(editDraft.totalNights || 1) <= 1}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <div className="text-center">
                          <span className="font-extrabold text-slate-900 text-lg block">
                            {editDraft.totalNights !== null ? `${editDraft.totalNights} Nights` : "기간 선택"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleModalNightsChange(Math.min(14, (editDraft.totalNights || 0) + 1))}
                          disabled={(editDraft.totalNights || 0) >= 14}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-500 block mb-1.5">일정 빠른 선택:</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[3, 5, 7, 10].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleModalNightsChange(preset)}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                                editDraft.totalNights === preset
                                  ? "bg-[#e25c5c] border-[#e25c5c] text-white font-extrabold"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              {preset}박
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tab 2: 👥 여행 인원 선택 */}
              {editTab === "ADULTS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>여행 인원 선택 (최대 10명)</span>
                    <span className="text-[#e25c5c]">
                      {editDraft.adultCount !== null ? `${editDraft.adultCount}명` : "미선택"}
                    </span>
                  </div>

                  <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2 bg-[#faf9f7] p-3 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleModalAdultsChange(Math.max(1, (editDraft.adultCount || 2) - 1))}
                      disabled={(editDraft.adultCount || 1) <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="font-extrabold text-slate-900 text-lg block">
                        {editDraft.adultCount !== null ? `${editDraft.adultCount} ${editDraft.adultCount === 1 ? "Person" : "People"}` : "인원 선택"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleModalAdultsChange(Math.min(10, (editDraft.adultCount || 0) + 1))}
                      disabled={(editDraft.adultCount || 0) >= 10}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-2">인원 빠른 선택:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleModalAdultsChange(preset)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                            editDraft.adultCount === preset
                              ? "bg-[#e25c5c] border-[#e25c5c] text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {preset}명
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: 📍 여행 목적지 선택 */}
              {editTab === "CITIES" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>여행 목적지 선택 (최대 4곳)</span>
                    <span className="text-[#e25c5c]">다중 선택 ({editDraft.selectedCities.length}/4)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {ALL_CITY_OPTIONS.map((cityOpt) => {
                      const isSelected = editDraft.selectedCities.includes(cityOpt.key);
                      return (
                        <button
                          key={cityOpt.key}
                          type="button"
                          onClick={() => handleModalToggleCity(cityOpt.key)}
                          className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
                            isSelected
                              ? "bg-[#fdf2f2] border-2 border-[#e25c5c] text-slate-900 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 font-semibold hover:border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="text-[#e25c5c] font-bold">✓</span>}
                          <span>{cityOpt.nameKo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {(() => {
              const targetNights = editDraft.totalNights || 5;
              const currentAlloc = editDraft.cityNightAllocations || {};
              const allocatedSum = editDraft.selectedCities.reduce((sum, c) => sum + (currentAlloc[c] || 0), 0);
              const isComplete = allocatedSum === targetNights;
              const deficitNights = targetNights - allocatedSum;

              return (
                <div className="p-4 border-t border-slate-100 bg-[#faf9f7] flex items-center justify-between gap-3">
                  {/* Left: Reset Button */}
                  <button
                    type="button"
                    onClick={() => setEditDraft(draft)}
                    className="shrink-0 text-xs font-semibold text-slate-500 hover:text-[#e25c5c] flex items-center gap-1 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 transition-colors"
                  >
                    <span>↺ 초기화</span>
                  </button>

                  {/* Center: Deficit warning text in middle space between Reset and Apply buttons */}
                  <div className="flex-1 text-center px-2 min-w-0">
                    {!isComplete && (
                      <span className="text-[11px] sm:text-xs font-bold text-[#ef4444] animate-pulse leading-snug inline-block whitespace-nowrap overflow-hidden text-ellipsis">
                        ⚠️ {locale === "ko"
                          ? `도시별 박수를 총 ${targetNights}박에 맞춰주세요 (${deficitNights}박 미달)`
                          : `Match city nights to total ${targetNights}N (${deficitNights}N short)`}
                      </span>
                    )}
                  </div>

                  {/* Right: Apply Button */}
                  <button
                    type="button"
                    onClick={handleApplyTripDetailsEdit}
                    disabled={!isComplete}
                    className={`shrink-0 px-5 py-2 text-xs font-bold rounded-xl transition-colors ${
                      isComplete
                        ? "text-white bg-[#e25c5c] hover:bg-[#d14b4b] shadow-xs cursor-pointer"
                        : "text-slate-400 bg-slate-200 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {locale === "ko" ? "변경사항 적용하기" : "Apply Changes"}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 4. Large Attraction Image & Detail Modal */}
      {previewSpot && (() => {
        const spotKey = previewSpot.id.replace(/^kto_/, "");
        const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[spotKey];
        const name = locale === "ko" ? (bilingual?.nameKo || previewSpot.nameKo) : (bilingual?.nameEn || previewSpot.nameEn);
        const desc = locale === "ko"
          ? (bilingual?.descKo || previewSpot.descKo || previewSpot.descEn)
          : (bilingual?.descEn || previewSpot.descEn || previewSpot.descKo);
        const subway = locale === "ko"
          ? (bilingual?.subwayKo || previewSpot.subwayInfoKo || previewSpot.subwayInfo)
          : (bilingual?.subwayEn || previewSpot.subwayInfoEn || previewSpot.subwayInfo);
        const hours = locale === "ko"
          ? (bilingual?.hoursKo || previewSpot.openingHoursKo || previewSpot.openingHours)
          : (bilingual?.hoursEn || previewSpot.openingHoursEn || previewSpot.openingHours);
        const closed = locale === "ko"
          ? (bilingual?.closedKo || previewSpot.closedDaysKo || previewSpot.closedDays)
          : (bilingual?.closedEn || previewSpot.closedDaysEn || previewSpot.closedDays);

        const spotCity = previewSpot.cityCode || selectedCityTab || "seoul";
        const citySel = preferences.attractionSelections?.[spotCity] || { selectedCourseIds: [], individualSpotIds: [] };
        const isSpotSelected = (citySel.individualSpotIds || []).some((sid) => isSameSpot(sid, previewSpot.id));
        const isIncludedInCourse = (citySel.selectedCourseIds || []).some((cid) => {
          const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
          return course?.spotIds.some((sid) => isSameSpot(sid, previewSpot.id));
        });
        const hasImage = (previewSpot as any).imageUrl && (previewSpot as any).imageUrl !== "/assets/default-place.jpg";

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewSpot(null)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large Image Header */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-950 overflow-hidden shrink-0">
                {hasImage ? (
                  <img
                    src={(previewSpot as any).imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-r ${previewSpot.gradientBg} flex items-center justify-center`}>
                    <span className="text-6xl">{previewSpot.emoji}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewSpot(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer text-lg font-bold z-10"
                  title={locale === "ko" ? "닫기" : "Close"}
                >
                  ✕
                </button>

                {/* Price & Category badges */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  {(() => {
                    const spotKey = previewSpot.id.replace(/^kto_/, "");
                    const bilingual = SEOUL_LANDMARK_BILINGUAL_MAP[spotKey];
                    const cat = previewSpot.categoryType || bilingual?.categoryType;
                    if (!cat) return null;
                    const badgeConfig = {
                      명소: { bg: "bg-blue-600/90 text-white", icon: "🏛️", labelKo: "명소", labelEn: "Landmark" },
                      자연: { bg: "bg-emerald-600/90 text-white", icon: "🌿", labelKo: "자연", labelEn: "Nature" },
                      엔터: { bg: "bg-purple-600/90 text-white", icon: "🎡", labelKo: "엔터", labelEn: "Enter" },
                      쇼핑: { bg: "bg-amber-600/90 text-white", icon: "🛍️", labelKo: "쇼핑", labelEn: "Shopping" },
                    }[cat as "명소" | "자연" | "엔터" | "쇼핑"];
                    if (!badgeConfig) return null;
                    return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 ${badgeConfig.bg}`}>
                        <span>{badgeConfig.icon}</span>
                        <span>{locale === "ko" ? badgeConfig.labelKo : badgeConfig.labelEn}</span>
                      </span>
                    );
                  })()}
                  {previewSpot.priceStatus === "FREE" || previewSpot.price === 0 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md">
                      {locale === "ko" ? "무료 입장" : "Free Admission"}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/90 text-white shadow-md backdrop-blur-md">
                      {formatKrw(previewSpot.price)}
                    </span>
                  )}

                  {/* 로컬 명소 뱃지 (추후 문구/디자인 손쉽게 변경 가능) */}
                  {previewSpot.isLocal && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-md flex items-center gap-1">
                      <span>🇰🇷</span>
                      <span>로컬</span>
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
                {/* Detailed Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {locale === "ko" ? "관광지 소개" : "About"}
                  </h4>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                    {desc}
                  </p>
                </div>

                {/* Key Visitor Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {subway && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <span className="text-base shrink-0">🚇</span>
                      <div>
                        <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                          {locale === "ko" ? "지하철 / 교통" : "Transit"}
                        </span>
                        <span className="text-slate-600">{subway}</span>
                      </div>
                    </div>
                  )}
                  {closed && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <span className="text-base shrink-0">⏱️</span>
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
                      <span className="text-base shrink-0">🕒</span>
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
                <div>
                  {(() => {
                    const targetUrl = previewSpot.officialUrl || (locale === "ko"
                      ? `https://korean.visitkorea.or.kr/search/search_list.do?keyword=${encodeURIComponent(previewSpot.nameKo)}`
                      : `https://english.visitkorea.or.kr/svc/search/searchList.do?keyword=${encodeURIComponent(previewSpot.nameEn || previewSpot.nameKo)}`);
                    return (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 border border-slate-200 transition-colors shadow-2xs"
                      >
                        <span>🌐</span>
                        <span>{locale === "ko" ? "공식 홈페이지 방문" : "Official Website"}</span>
                      </a>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewSpot(null)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
                  >
                    {locale === "ko" ? "닫기" : "Close"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleToggleSpot(spotCity, previewSpot.id);
                    }}
                    className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xs ${
                      isSpotSelected || isIncludedInCourse
                        ? "bg-rose-500 text-white hover:bg-rose-600"
                        : "bg-[#0f172a] text-white hover:bg-slate-800"
                    }`}
                  >
                    {isSpotSelected || isIncludedInCourse
                      ? (locale === "ko" ? "✓ 예산에 담김" : "✓ In Budget")
                      : (locale === "ko" ? "예산에 담기" : "Add to Budget")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Budget Tier Switch Confirmation Modal */}
      <BudgetTierModal
        pendingBudgetTier={pendingBudgetTier}
        onClose={() => setPendingBudgetTier(null)}
        onConfirm={(tier) => {
          handleTargetBudgetTierChange(tier);
          setPendingBudgetTier(null);
        }}
        locale={locale}
      />
    </div>
  );
}
