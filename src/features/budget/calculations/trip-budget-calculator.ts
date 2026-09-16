import { TripDraft, SupportedCity, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import { PlannerPreferences, BudgetCategory, BudgetBasketId, ShoppingOption, BudgetPlan } from "../domain/types";
import { generateInitialBudgetPlan } from "./engine";
import { MOCK_PRICE_CATALOG } from "../catalog/mock-catalog";
import { calculateFoodBasketPlan, calculateCityFoodBasketPlan } from "./food-engine";
import {
  ATTRACTION_SPOTS_CATALOG,
  TOUR_COURSE_PRESETS,
  AttractionSpot,
  isSameSpot,
  normalizeSpotKey,
  SEOUL_LANDMARK_BILINGUAL_MAP,
} from "../catalog/attraction-spots";
import { THEME_ACTIVITIES_CATALOG, themeActivityToAttractionSpot } from "../catalog/theme-activities";
import type { PlaceItem } from "src/lib/places/types";
import type { Locale } from "src/lib/i18n/locales";

export interface CityCalculationBreakdown {
  city: SupportedCity;
  cityName: string;
  nights: number;
  stayTotalKrw: number;
  stayItemLabel: string;
  stayNightlyPrice: number;
  hasStay: boolean;
  foodTotalKrw: number;
  foodBasketPlan: any;
  transportTotalKrw: number;
  attractionTotalKrw: number;
  selectedSpots: AttractionSpot[];
  subtotalKrw: number;
}

export interface TripBudgetSummary {
  adultCount: number;
  totalNights: number;
  travelDays: number;
  basePlan: BudgetPlan;
  cityBreakdown: Record<string, CityCalculationBreakdown>;
  sumAccTotal: number;
  sumFoodTotal: number;
  sumTransportTotal: number;
  sumAttractionTotal: number;
  intercityTotal: number;
  sumCitySubtotals: number;
  baseTripExpensesKrw: number;
  shoppingOption: ShoppingOption;
  shoppingAmountKrw: number;
  dailyAllowancePerPerson: number;
  totalDailyAllowanceKrw: number;
  emergencyPct: number;
  computedEmergencyKrw: number;
  grandTotalKrw: number;
  perTravelerTotalKrw: number;
  dailyAverageKrw: number;
  categoryTotals: {
    stay: number;
    food: number;
    transport: number;
    flex: number;
  };
}

export function placeToAttractionSpotHelper(p: PlaceItem): AttractionSpot {
  const categoryTypeMap: Record<string, "명소" | "자연" | "엔터" | "쇼핑"> = {
    NATURE: "자연",
    ENTERTAINMENT: "엔터",
    SHOPPING: "쇼핑",
    ATTRACTION: "명소",
    CULTURE: "명소",
  };
  const categoryType = p.categoryType || categoryTypeMap[p.category] || "명소";
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
    emoji: "",
    gradientBg: "from-slate-700 to-slate-900",
    isFeatured: true,
    subwayInfo: p.subwayInfo,
    openingHours: p.openingHours,
    closedDays: p.closedDays,
    categoryType,
    imageUrl: p.repImageUrl || (p as any).imageUrl,
  };
}

/**
 * 플래너(PlannerContent)와 예산 리포트(ReportContent)가 100% 동일하게 공유하는 단일 종합 예산 계산 함수
 */
export function calculateTripBudgetSummary(
  draft: TripDraft,
  preferences: PlannerPreferences,
  budgetPlaces: PlaceItem[] = [],
  locale: Locale = "ko",
  dbAttractionsByCity: Record<string, AttractionSpot[]> = {}
): TripBudgetSummary {
  const adultCount = draft.adultCount || 1;
  const totalNights = draft.totalNights || 1;
  const travelDays = totalNights + 1;
  const occupancyModeByCity = preferences.occupancyModeByCity || {};

  // 1. 기본 플랜 (도시별 숙박, 시내교통, 도시 간/공항 교통, 푸드 바스켓 반영)
  const basePlan = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG, {
    accommodation: preferences.accommodationByCity,
    foodTier: preferences.foodTier,
    food: preferences.foodOverrides,
    foodAddOns: preferences.addOnSelections,
    foodBasketSelections: preferences.foodBasketSelections,
    attraction: draft.selectedCities.reduce((acc, c) => ({ ...acc, [c]: "NONE" as BudgetBasketId }), {}),
    attractionSelections: undefined,
    attractionCustomDailyKrw: undefined,
    emergencyFundKrw: 0,
    intercityTransportOverrides: preferences.intercityTransportOverrides,
    localTransitStyle: preferences.localTransitStyle,
    cityTransitStyles: preferences.cityTransitStyles,
    isKobusPassApplied: preferences.isKobusPassApplied,
    occupancyMode: occupancyModeByCity,
  });

  // 2. 전체 푸드 바스켓 연산 (사용자가 담은 음식 실비)
  const totalFoodBasketPlan = calculateFoodBasketPlan(
    preferences.foodBasketSelections || [],
    totalNights,
    adultCount
  );

  // 3. 도시별 상세 분할 계산
  const cityBreakdown: Record<string, CityCalculationBreakdown> = {};
  let sumAccTotal = 0;
  let sumFoodTotal = 0;
  let sumTransportTotal = 0;
  let sumAttractionTotal = 0;
  let sumCitySubtotals = 0;

  draft.selectedCities.forEach((city) => {
    const nights = draft.cityNightAllocations[city] || 0;
    const section = basePlan.citySections[city];

    // A. 숙박 (엔진에서 계산된 라인아이템의 실제 lineTotalKrw를 기준으로 100% 일치 보장)
    const stayItem = section?.lineItems?.find((i) => i.category === "ACCOMMODATION");
    const stayTotal = stayItem?.lineTotalKrw || 0;
    const stayNightly = stayItem?.unitPriceKrw || 0;
    const stayLabel =
      stayItem?.sourceLabel ||
      (stayTotal > 0
        ? locale === "ko"
          ? "선택 숙소"
          : "Selected Stay"
        : locale === "ko"
        ? "선택된 숙소 없음"
        : "No stay selected");
    const hasStay = stayTotal > 0;

    // B. 음식 (바스켓 음식 + 해당 도시의 K-스팟 맛집/카페)
    const cityFoodBasket = calculateCityFoodBasketPlan(
      city,
      nights,
      totalNights,
      totalFoodBasketPlan,
      adultCount
    );
    const cityCustomFoods = (budgetPlaces || []).filter(
      (p) => p.city === city && (p.category === "RESTAURANT" || p.category === "CAFE")
    );
    const customFoodTotal = cityCustomFoods.reduce(
      (sum, p) =>
        sum +
        (p.priceKrw ?? (p as any).estimatedPriceKrw ?? (p.category === "CAFE" ? 8000 : 18000)) *
          adultCount,
      0
    );
    const foodTotal = cityFoodBasket.grandTotalKrw + customFoodTotal;

    // C. 시내 교통
    const transportItems = section?.lineItems?.filter((i) => i.category === "CITY_TRANSPORT") || [];
    const transportTotal = transportItems.reduce((sum, i) => sum + i.lineTotalKrw, 0);

    // D. 관광 (선택된 투어 코스 + 개별 명소 + 테마 액티비티 + K-스팟 관광지)
    const citySel = preferences.attractionSelections?.[city] || {
      selectedCourseIds: [],
      individualSpotIds: [],
    };
    const customAttractionSpots = (budgetPlaces || [])
      .filter(
        (p) => p.city === city && !["ACCOMMODATION", "RESTAURANT", "CAFE"].includes(p.category)
      )
      .map(placeToAttractionSpotHelper);

    const spotsForCity: AttractionSpot[] = [
      ...customAttractionSpots,
      ...(dbAttractionsByCity[city] || ATTRACTION_SPOTS_CATALOG.filter((s) => s.cityCode === city)),
      ...THEME_ACTIVITIES_CATALOG.filter((act) => act.cityCode === city).map(
        themeActivityToAttractionSpot
      ),
    ];

    const selectedSpotKeys = new Set<string>();
    (citySel.selectedCourseIds || []).forEach((cid) => {
      const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
      if (course) course.spotIds.forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));
    });
    (citySel.individualSpotIds || []).forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));

    const selectedSpotsList: AttractionSpot[] = [];
    let attractionTotal = 0;
    selectedSpotKeys.forEach((normKey) => {
      const spot =
        spotsForCity.find((s) => isSameSpot(s.id, normKey)) ||
        ATTRACTION_SPOTS_CATALOG.find((s) => isSameSpot(s.id, normKey));
      if (spot) {
        selectedSpotsList.push(spot);
        if (spot.priceStatus === "PAID" && spot.price > 0) {
          attractionTotal += spot.price * adultCount;
        }
      }
    });

    const citySub = stayTotal + foodTotal + transportTotal + attractionTotal;

    cityBreakdown[city] = {
      city,
      cityName: locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city,
      nights,
      stayTotalKrw: stayTotal,
      stayItemLabel: stayLabel,
      stayNightlyPrice: stayNightly,
      hasStay,
      foodTotalKrw: foodTotal,
      foodBasketPlan: cityFoodBasket,
      transportTotalKrw: transportTotal,
      attractionTotalKrw: attractionTotal,
      selectedSpots: selectedSpotsList,
      subtotalKrw: citySub,
    };

    sumAccTotal += stayTotal;
    sumFoodTotal += foodTotal;
    sumTransportTotal += transportTotal;
    sumAttractionTotal += attractionTotal;
    sumCitySubtotals += citySub;
  });

  // 4. 도시 간 이동 교통 요금 및 공항 교통
  const intercityTotal = basePlan.intercitySection.subtotalKrw;

  // 5. 기본 여행 경비 = 모든 도시 순수 실비 + 도시 간/공항 이동
  const baseTripExpensesKrw = sumCitySubtotals + intercityTotal;

  // 6. 쇼핑 예산
  const shoppingOption: ShoppingOption = preferences.shoppingOption || "BEAUTY";
  const shoppingAmountKrw = (() => {
    if (shoppingOption === "NONE") return 0;
    if (shoppingOption === "BEAUTY") return 200000 * adultCount;
    if (shoppingOption === "FASHION") return 300000 * adultCount;
    if (shoppingOption === "SOUVENIR") return 100000 * adultCount;
    if (shoppingOption === "CUSTOM") {
      if (preferences.shoppingCustomInput !== undefined && preferences.shoppingCustomInput !== "") {
        return parseInt(preferences.shoppingCustomInput, 10) || 0;
      }
      return preferences.shoppingAmountKrw || 0;
    }
    return preferences.shoppingAmountKrw || 0;
  })();

  // 7. 일일 용돈
  const firstCity = draft.selectedCities[0];
  const currentBasket = preferences.attractionByCity?.[firstCity] ?? "BALANCED";
  const dailyAllowancePerPerson =
    preferences.attractionCustomDailyKrw !== undefined
      ? preferences.attractionCustomDailyKrw
      : (currentBasket as string) === "NONE"
      ? 0
      : currentBasket === "MOSTLY_FREE"
      ? 10000
      : currentBasket === "EXPERIENCE_RICH"
      ? 50000
      : 30000;
  const totalDailyAllowanceKrw = dailyAllowancePerPerson * adultCount * totalNights;

  // 8. 비상금
  const baseEmergencyGrandTotal = baseTripExpensesKrw + shoppingAmountKrw + totalDailyAllowanceKrw;
  const activeEmergencyPct =
    preferences.emergencyFundPct !== undefined
      ? preferences.emergencyFundPct
      : preferences.emergencyFundKrw === undefined || preferences.emergencyFundKrw === 0
      ? 0.10
      : undefined;

  const computedEmergencyKrw =
    activeEmergencyPct !== undefined && activeEmergencyPct > 0
      ? Math.round(((baseEmergencyGrandTotal / adultCount) * activeEmergencyPct) / 1000) * 1000 * adultCount
      : (preferences.emergencyFundKrw || 0) * adultCount;

  // 9. 최종 총액
  const grandTotalKrw =
    baseTripExpensesKrw + shoppingAmountKrw + totalDailyAllowanceKrw + computedEmergencyKrw;
  const perTravelerTotalKrw = Math.round(grandTotalKrw / adultCount);
  const dailyAverageKrw = Math.round(grandTotalKrw / travelDays);

  // 10. 4대 카테고리 집계 (도넛 차트 및 집계용, 합계 = grandTotalKrw)
  const categoryTotals = {
    stay: sumAccTotal,
    food: sumFoodTotal,
    transport: sumTransportTotal + intercityTotal,
    flex: sumAttractionTotal + shoppingAmountKrw + totalDailyAllowanceKrw + computedEmergencyKrw,
  };

  return {
    adultCount,
    totalNights,
    travelDays,
    basePlan,
    cityBreakdown,
    sumAccTotal,
    sumFoodTotal,
    sumTransportTotal,
    sumAttractionTotal,
    intercityTotal,
    sumCitySubtotals,
    baseTripExpensesKrw,
    shoppingOption,
    shoppingAmountKrw,
    dailyAllowancePerPerson,
    totalDailyAllowanceKrw,
    emergencyPct: activeEmergencyPct || 0,
    computedEmergencyKrw,
    grandTotalKrw,
    perTravelerTotalKrw,
    dailyAverageKrw,
    categoryTotals,
  };
}
