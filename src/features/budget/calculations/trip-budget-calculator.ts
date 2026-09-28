import {
  TripDraft,
  SupportedCity,
  CITY_KOREAN_NAMES,
  CITY_ENGLISH_NAMES,
  validateTripDraft,
  sanitizeTripDraft,
  DEFAULT_TRIP_DRAFT,
  ensureTripStops,
  TripStop,
} from "../../../lib/trip-domain";
import { PlannerPreferences, BudgetCategory, BudgetBasketId, ShoppingOption, BudgetPlan } from "../domain/types";
import { generateInitialBudgetPlan, getDefaultCityTransitStyle } from "./engine";
import { MOCK_PRICE_CATALOG, LOCAL_TRANSIT_OPTIONS } from "../catalog/mock-catalog";
import { calculateFoodBasketPlan, calculateCityFoodBasketPlan } from "./food-engine";
import {
  ATTRACTION_SPOTS_CATALOG,
  TOUR_COURSE_PRESETS,
  AttractionSpot,
  isSameSpot,
  normalizeSpotKey,
  SEOUL_LANDMARK_BILINGUAL_MAP,
} from "../catalog/attraction-spots";
import {
  THEME_ACTIVITIES_CATALOG,
  themeActivityToAttractionSpot,
  PALACE_HANBOK_FREE_SPOT_IDS,
  isPalaceFreeSpot,
  isHanbokActivityId,
} from "../catalog/theme-activities";
import { STAY_ARCHETYPES } from "../catalog/stay-archetypes";
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

export interface StopCalculationBreakdown {
  stopId: string;
  city: SupportedCity;
  cityName: string;
  nights: number;
  isAdded?: boolean;
  stopIndex: number;
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
  stopBreakdown: StopCalculationBreakdown[];
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
) {
  let safeDraft = draft;
  const validation = validateTripDraft(draft);
  if (!validation.success) {
    safeDraft = sanitizeTripDraft(draft);
    const reValidation = validateTripDraft(safeDraft);
    if (!reValidation.success) {
      safeDraft = DEFAULT_TRIP_DRAFT;
    }
  }

  const adultCount = safeDraft.adultCount || 1;
  const totalNights = safeDraft.totalNights || 1;
  const travelDays = totalNights + 1;
  const occupancyModeByCity = preferences.occupancyModeByCity || {};

  // 1. 기본 플랜 (도시별 숙박, 시내교통, 도시 간/공항 교통, 푸드 바스켓 반영)
  const basePlan = generateInitialBudgetPlan(safeDraft, MOCK_PRICE_CATALOG, {
    accommodation: preferences.accommodationByCity,
    foodTier: preferences.foodTier,
    food: preferences.foodOverrides,
    foodAddOns: preferences.addOnSelections,
    foodBasketSelections: preferences.foodBasketSelections,
    attraction: safeDraft.selectedCities.reduce((acc, c) => ({ ...acc, [c]: "NONE" as BudgetBasketId }), {}),
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

  const uniqueCities = Array.from(new Set(draft.selectedCities));
  uniqueCities.forEach((city) => {
    const nights = draft.cityNightAllocations[city] || 0;
    const section = basePlan.citySections[city];

    const stayItem = section?.lineItems?.find((i) => i.category === "ACCOMMODATION");
    const stayTotal = stayItem?.lineTotalKrw || 0;
    const stayNightly = stayItem?.unitPriceKrw || 0;
    let stayLabel = stayItem?.sourceLabel || (stayTotal > 0 ? (locale === "ko" ? "선택 숙소" : "Selected Stay") : (locale === "ko" ? "선택된 숙소 없음" : "No stay selected"));
    if (locale === "en" && stayItem) {
      if (stayItem.sourceLabelEn) {
        stayLabel = stayItem.sourceLabelEn;
      } else {
        const arch = STAY_ARCHETYPES.find((a) => a.id === stayItem.basketId || a.titleKo === stayItem.sourceLabel);
        if (arch) {
          stayLabel = arch.titleEn;
        }
      }
    }
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

    const hasHanbokRental = Array.from(selectedSpotKeys).some((key) => isHanbokActivityId(key));

    const selectedSpotsList: AttractionSpot[] = [];
    let attractionTotal = 0;
    selectedSpotKeys.forEach((normKey) => {
      const spot =
        spotsForCity.find((s) => isSameSpot(s.id, normKey)) ||
        ATTRACTION_SPOTS_CATALOG.find((s) => isSameSpot(s.id, normKey));
      if (spot) {
        const isPalaceFree =
          city === "SEOUL" &&
          hasHanbokRental &&
          isPalaceFreeSpot(spot.id, spot.nameKo);

        const calculatedSpot: AttractionSpot = isPalaceFree
          ? {
              ...spot,
              price: 0,
              priceStatus: "FREE",
              descKo: `${spot.descKo} [한복 착용 무료 입장 혜택 적용]`,
            }
          : spot;

        selectedSpotsList.push(calculatedSpot);
        if (calculatedSpot.priceStatus === "PAID" && calculatedSpot.price > 0) {
          attractionTotal += calculatedSpot.price * adultCount;
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

  // 3-1. 정차지(Stop)별 상세 분할 계산 (동일 도시 재방문 및 분할 숙박 완벽 지원)
  const stops = ensureTripStops(draft);
  const stopBreakdown: StopCalculationBreakdown[] = [];

  const cityStopsMap: Record<string, TripStop[]> = {};
  stops.forEach((s) => {
    if (!cityStopsMap[s.city]) cityStopsMap[s.city] = [];
    cityStopsMap[s.city].push(s);
  });
  const cityVisitTracker: Record<string, number> = {};

  stops.forEach((stop, stopIdx) => {
    const city = stop.city;
    const sameCityStops = cityStopsMap[city] || [stop];
    const isRepeated = sameCityStops.length > 1;
    const visitIdx = (cityVisitTracker[city] = (cityVisitTracker[city] || 0) + 1) - 1;

    const cityName = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
    const nights = stop.nights;

    const isFirstVisitOfCity = visitIdx === 0 && !stop.isAdded;

    // A. 숙박 계산
    let stayTotal = 0;
    let stayNightly = 0;
    let stayLabel = locale === "ko" ? "당일치기 (숙박 없음)" : "Day trip (No stay)";
    let hasStay = false;

    if (nights > 0) {
      let accOverride = preferences.accommodationByCity?.[stop.id];
      if (!accOverride && isFirstVisitOfCity) {
        accOverride = preferences.accommodationByCity?.[city];
        if (isRepeated && accOverride && typeof accOverride === "object" && (accOverride as any).kind === "SPLIT") {
          const foundSeg = (accOverride as any).segments?.find((seg: any) => seg.segmentId === stop.id);
          accOverride = foundSeg ? {
            kind: "TIER",
            basketId: foundSeg.basketId,
            nightlyPriceKrw: foundSeg.nightlyPriceKrw,
            placeNameKo: foundSeg.placeNameKo,
            placeNameEn: foundSeg.placeNameEn,
          } as any : undefined;
        }
      }

      if (accOverride) {
        if (typeof accOverride === "object" && "nightlyPriceKrw" in accOverride && (accOverride as any).nightlyPriceKrw) {
          stayNightly = (accOverride as any).nightlyPriceKrw;
          stayLabel = (locale === "ko" ? (accOverride as any).placeNameKo : (accOverride as any).placeNameEn) || (accOverride as any).placeNameKo || (locale === "ko" ? "선택 숙소" : "Selected Stay");
        } else {
          const bId = typeof accOverride === "string" ? accOverride : (accOverride as any).basketId;
          let targetArchId = bId;
          if (bId === "HOSTEL_GUESTHOUSE" || bId === "BUDGET_STAY") targetArchId = "HOSTEL_GUESTHOUSE";
          else if (bId === "HANOK_BOUTIQUE") targetArchId = "HANOK_BOUTIQUE";
          else if (bId === "LUXURY_SKYLINE" || bId === "PREMIUM_HERITAGE") targetArchId = "LUXURY_SKYLINE";
          else if (bId === "BUSINESS_HOTEL" || bId === "STANDARD_HOTEL") targetArchId = "BUSINESS_HOTEL";

          const arch = STAY_ARCHETYPES.find((a) => a.id === targetArchId);
          if (arch) {
            stayNightly = arch.cityPrices[city] || arch.defaultPriceKrw;
            stayLabel = locale === "ko" ? arch.titleKo : arch.titleEn;
          }
        }
      } else if (isFirstVisitOfCity) {
        const defTier = draft.budgetTier || "STANDARD";
        const archId = defTier === "BUDGET" ? "HOSTEL_GUESTHOUSE" : defTier === "PREMIUM" ? "LUXURY_SKYLINE" : "BUSINESS_HOTEL";
        const arch = STAY_ARCHETYPES.find((a) => a.id === archId);
        if (arch) {
          stayNightly = arch.cityPrices[city] || arch.defaultPriceKrw;
          stayLabel = locale === "ko" ? arch.titleKo : arch.titleEn;
        }
      } else {
        stayNightly = 0;
        stayLabel = locale === "ko" ? "숙소 미선택" : "Accommodation Not Selected";
      }

      const isSolo = adultCount <= 1;
      const occupancyMode = preferences.occupancyModeByCity?.[city] || (adultCount > 1 ? "SHARED_PAIR" : "SOLO");
      const isPair = !isSolo && occupancyMode === "SHARED_PAIR";
      const sharedRoomCount = Math.ceil(adultCount / 2);
      const roomCount = isSolo ? 1 : isPair ? sharedRoomCount : adultCount;

      stayTotal = stayNightly * roomCount * nights;
      hasStay = stayTotal > 0;
    }

    // B. 음식 (사용자가 바스켓에 담은 메뉴 목록 및 수량 기준 100% 실비 합산, 박수 변경 시에도 식비 왜곡 없음)
    const cData = cityBreakdown[city];
    let foodTotal = 0;
    let stopFoodPlan: any = undefined;

    const stopFoodSelections = preferences.foodBasketSelectionsByStop?.[stop.id];
    if (stopFoodSelections !== undefined) {
      // 정차지 전용 바스켓이 명시된 경우 (빈 바스켓 포함)
      const stopFoodNights = Math.max(1, nights);
      const calcPlan = calculateFoodBasketPlan(stopFoodSelections, stopFoodNights, adultCount);
      foodTotal = stopFoodSelections.length > 0 ? calcPlan.grandTotalKrw : 0;
      stopFoodPlan = {
        ...calcPlan,
        subtotalKrw: foodTotal,
      };
    } else {
      if (isFirstVisitOfCity) {
        // 첫 방문 정차지에 해당 도시의 모든 바스켓 음식 실비 100% 배정 (박수 비례 감액 없이 실비 보존)
        foodTotal = cData ? cData.foodTotalKrw : 0;
        const allFoodItems = cData?.foodBasketPlan?.selectedItems || [];
        stopFoodPlan = cData?.foodBasketPlan ? {
          ...cData.foodBasketPlan,
          selectedItems: allFoodItems,
          subtotalKrw: foodTotal,
        } : undefined;
      } else {
        foodTotal = 0;
        stopFoodPlan = cData?.foodBasketPlan ? {
          ...cData.foodBasketPlan,
          selectedItems: [],
          subtotalKrw: 0,
        } : undefined;
      }
    }

    // C. 시내 교통 (각 정차지의 실제 체류 일수에 맞게 인가 요금 기반 실비 산출)
    const effectiveTransitStyle =
      preferences.cityTransitStyles?.[city] ||
      preferences.localTransitStyle ||
      getDefaultCityTransitStyle(city);
    const transitOpt =
      LOCAL_TRANSIT_OPTIONS.find((o) => o.style === effectiveTransitStyle) ||
      LOCAL_TRANSIT_OPTIONS[0];
    const stopTransitDays = Math.max(1, nights);
    const transportTotal = transitOpt.pricePerDayKrw * adultCount * stopTransitDays;

    // D. 관광지
    let stopSpots: AttractionSpot[] = [];
    const stopAttrSel = preferences.attractionSelectionsByStop?.[stop.id];
    if (stopAttrSel !== undefined) {
      // 정차지 전용 명소 선택이 명시된 경우 (빈 선택 포함)
      const selectedSpotKeys = new Set<string>();
      (stopAttrSel.selectedCourseIds || []).forEach((cid) => {
        const course = TOUR_COURSE_PRESETS.find((c) => c.id === cid);
        if (course) course.spotIds.forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));
      });
      (stopAttrSel.individualSpotIds || []).forEach((sid) => selectedSpotKeys.add(normalizeSpotKey(sid)));

      const spotsForCity = [
        ...budgetPlaces.filter((p) => p.city === city && !["ACCOMMODATION", "RESTAURANT", "CAFE"].includes(p.category)).map(placeToAttractionSpotHelper),
        ...(dbAttractionsByCity[city] || ATTRACTION_SPOTS_CATALOG.filter((s) => s.cityCode === city)),
        ...THEME_ACTIVITIES_CATALOG.filter((act) => act.cityCode === city).map(themeActivityToAttractionSpot),
      ];

      selectedSpotKeys.forEach((normKey) => {
        const spot = spotsForCity.find((s) => isSameSpot(s.id, normKey)) || ATTRACTION_SPOTS_CATALOG.find((s) => isSameSpot(s.id, normKey));
        if (spot) stopSpots.push(spot);
      });
    } else {
      if (isFirstVisitOfCity) {
        stopSpots = cData?.selectedSpots || [];
      } else {
        stopSpots = [];
      }
    }

    const attractionTotal = stopSpots.reduce((sum, s) => {
      if (s.priceStatus === "PAID" && s.price > 0) {
        return sum + s.price * adultCount;
      }
      return sum;
    }, 0);

    const subtotal = stayTotal + foodTotal + transportTotal + attractionTotal;

    stopBreakdown.push({
      stopId: stop.id,
      city,
      cityName,
      nights,
      isAdded: stop.isAdded,
      stopIndex: stopIdx,
      stayTotalKrw: stayTotal,
      stayItemLabel: stayLabel,
      stayNightlyPrice: stayNightly,
      hasStay,
      foodTotalKrw: foodTotal,
      foodBasketPlan: stopFoodPlan !== undefined ? stopFoodPlan : cData?.foodBasketPlan,
      transportTotalKrw: transportTotal,
      attractionTotalKrw: attractionTotal,
      selectedSpots: stopSpots,
      subtotalKrw: subtotal,
    });
  });

  // 복수 정차지(스탑) 구성 시 총합계 및 cityBreakdown을 stopBreakdown 기준으로 정밀 동기화
  if (stops.length > uniqueCities.length || stops.some((s) => s.isAdded)) {
    sumAccTotal = stopBreakdown.reduce((sum, s) => sum + s.stayTotalKrw, 0);
    sumFoodTotal = stopBreakdown.reduce((sum, s) => sum + s.foodTotalKrw, 0);
    sumTransportTotal = stopBreakdown.reduce((sum, s) => sum + s.transportTotalKrw, 0);
    sumAttractionTotal = stopBreakdown.reduce((sum, s) => sum + s.attractionTotalKrw, 0);
    sumCitySubtotals = stopBreakdown.reduce((sum, s) => sum + s.subtotalKrw, 0);

    uniqueCities.forEach((city) => {
      const cityStops = stopBreakdown.filter((s) => s.city === city);
      if (cityStops.length > 0 && cityBreakdown[city]) {
        const cityStayTotal = cityStops.reduce((sum, s) => sum + s.stayTotalKrw, 0);
        const cityFoodTotal = cityStops.reduce((sum, s) => sum + s.foodTotalKrw, 0);
        const cityTransportTotal = cityStops.reduce((sum, s) => sum + s.transportTotalKrw, 0);
        const cityAttractionTotal = cityStops.reduce((sum, s) => sum + s.attractionTotalKrw, 0);
        const cityNights = cityStops.reduce((sum, s) => sum + s.nights, 0);

        cityBreakdown[city].stayTotalKrw = cityStayTotal;
        cityBreakdown[city].foodTotalKrw = cityFoodTotal;
        cityBreakdown[city].transportTotalKrw = cityTransportTotal;
        cityBreakdown[city].attractionTotalKrw = cityAttractionTotal;
        cityBreakdown[city].nights = cityNights;
        cityBreakdown[city].hasStay = cityStayTotal > 0;
        cityBreakdown[city].subtotalKrw =
          cityStayTotal + cityFoodTotal + cityTransportTotal + cityAttractionTotal;
      }
    });
  }

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
      // 1순위: UI/플래너에서 이미 원화(KRW) 총액으로 정밀하게 산출된 값 우선 반영
      if (typeof preferences.shoppingAmountKrw === "number" && !isNaN(preferences.shoppingAmountKrw)) {
        return preferences.shoppingAmountKrw;
      }
      // 2순위: shoppingCustomInput이 전달된 경우 언어(locale)에 맞게 원화 환산
      if (preferences.shoppingCustomInput !== undefined && preferences.shoppingCustomInput !== "") {
        const rawDigits = parseInt(String(preferences.shoppingCustomInput).replace(/[^0-9]/g, ""), 10) || 0;
        const perPersonKrw = locale === "ko" ? rawDigits : Math.round(rawDigits * 1350);
        return perPersonKrw * adultCount;
      }
      return 0;
    }
    return typeof preferences.shoppingAmountKrw === "number" ? preferences.shoppingAmountKrw : 0;
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
    stopBreakdown,
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
