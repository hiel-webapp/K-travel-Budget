import { SupportedCity, TripDraft, validateTripDraft, BudgetTier } from "../../../lib/trip-domain";
import {
  BudgetCategory,
  BudgetBasketDefinition,
  BudgetBasketId,
  BudgetLineItem,
  CityBudgetSection,
  IntercityBudgetSection,
  TripWideBudgetSection,
  BudgetPlan,
  BudgetPlanOverrides,
  MealSlot,
  BaseMealSlot,
  BaseMealPlan,
} from "../domain/types";
import {
  MOCK_PRICE_CATALOG,
  BUDGET_TIER_DEFAULT_BASKETS,
  MOCK_CATALOG_VERSION,
  MOCK_MEAL_SLOT_PRICES,
} from "../catalog/mock-catalog";
import { applyFoodReplacements, applyFoodAddOns } from "./food-engine";
import { ATTRACTION_SPOTS_CATALOG, TOUR_COURSE_PRESETS } from "../catalog/attraction-spots";

/**
 * TripDraft 입력을 기준으로 초기 BudgetPlan을 생성하는 순수 계산 엔진
 */
export function generateInitialBudgetPlan(
  tripDraft: TripDraft,
  catalog: BudgetBasketDefinition[] = MOCK_PRICE_CATALOG,
  overrides?: BudgetPlanOverrides
): BudgetPlan {
  // 1. 입력 검증 수행
  const validation = validateTripDraft(tripDraft);
  if (!validation.success) {
    throw new Error(`Invalid TripDraft: ${validation.errors.join(", ")}`);
  }

  const {
    selectedCities,
    cityNightAllocations,
    targetBudgetKrw,
  } = tripDraft;
  const budgetTier = tripDraft.budgetTier || "STANDARD";
  const adultCount = tripDraft.adultCount || 2;
  const totalNights = tripDraft.totalNights || 5;

  // 2. 도시별 섹션 연산
  const citySections: Partial<Record<SupportedCity, CityBudgetSection>> = {};

  const lineItems: BudgetLineItem[] = [];

  // 각 도시 순회하며 라인 아이템 생성
  for (const city of selectedCities) {
    const nights = cityNightAllocations[city] || 0;
    const cityLineItems: BudgetLineItem[] = [];

    // Accommodation, Food, City Transport, Attraction 카테고리
    const categories: BudgetCategory[] = ["ACCOMMODATION", "FOOD", "CITY_TRANSPORT", "ATTRACTION"];

    for (const category of categories) {
      let item: BudgetLineItem;

      if (category === "FOOD") {
        const basketId = BUDGET_TIER_DEFAULT_BASKETS[budgetTier][category];
        const basket = findBasket(catalog, basketId, category, city);

        if (!basket) {
          throw new Error(`Price catalog missing item for city: ${city}, category: ${category}, tier: ${budgetTier}`);
        }

        const baseMealPlan = generateBaseMealPlan(city, nights, budgetTier, MOCK_MEAL_SLOT_PRICES);
        const foodOverrides = overrides?.food || {};
        const foodAddOnOverrides = overrides?.foodAddOns || {};
        const replacedMealPlan = applyFoodReplacements(baseMealPlan, foodOverrides, undefined, adultCount);
        const mealPlan = applyFoodAddOns(replacedMealPlan, foodAddOnOverrides, adultCount);

        const lineTotalKrw = mealPlan.lineTotalKrw;
        const id = `${city}_${basket.id}`.toUpperCase();

        item = {
          id,
          basketId: basket.id,
          category: "FOOD",
          scope: "CITY",
          cityCode: city,
          route: null,
          unitPriceKrw: basket.representativePriceKrw,
          pricingUnit: "PERSON_DAY",
          quantity: adultCount,
          participantCount: adultCount,
          durationCount: nights,
          lineTotalKrw,
          priceMinKrw: basket.priceMinKrw * adultCount * nights,
          priceMaxKrw: basket.priceMaxKrw * adultCount * nights,
          confidence: basket.confidence,
          updatedAt: basket.updatedAt,
          sourceLabel: basket.sourceLabel,
          mealPlan,
        };
      } else {
        let basketId = BUDGET_TIER_DEFAULT_BASKETS[budgetTier][category];

        let accPlaceOverrideItem: BudgetLineItem | null = null;
        let attractionOverrideItem: BudgetLineItem | null = null;

        if (category === "ACCOMMODATION" && overrides?.accommodation?.[city]) {
          const accSelection = overrides.accommodation[city]!;
          if (typeof accSelection === "object" && accSelection !== null && "kind" in accSelection) {
            if (accSelection.kind === "PLACE") {
              const fallbackBasketId = accSelection.basketId || BUDGET_TIER_DEFAULT_BASKETS[budgetTier]["ACCOMMODATION"];
              const basket = findBasket(catalog, fallbackBasketId, category, city) || catalog.find((b) => b.category === "ACCOMMODATION");
              if (basket) {
                const baseItem = calculateLineItem({
                  basket,
                  cityCode: city,
                  route: null,
                  adultCount,
                  duration: nights,
                  cityCount: selectedCities.length,
                });
                accPlaceOverrideItem = {
                  ...baseItem,
                  unitPriceKrw: accSelection.nightlyPriceKrw,
                  lineTotalKrw: accSelection.nightlyPriceKrw * nights,
                  confidence: accSelection.priceSource,
                  sourceLabel: accSelection.placeNameKo,
                };
              }
            } else {
              basketId = accSelection.basketId;
            }
          } else {
            basketId = accSelection as BudgetBasketId;
          }
        } else if (category === "ATTRACTION") {
          if (overrides?.attraction?.[city]) {
            basketId = overrides.attraction[city]!;
          }

          const customDaily = overrides?.attractionCustomDailyKrw;
          const cityAttractionSel = overrides?.attractionSelections?.[city];

          if (typeof customDaily === "number" && !isNaN(customDaily) && customDaily >= 0) {
            const basket = findBasket(catalog, basketId, category, city) || catalog.find((b) => b.category === "ATTRACTION");
            if (basket) {
              const lineTotalKrw = customDaily * adultCount * nights;
              attractionOverrideItem = {
                id: `${city}_ATTRACTION_CUSTOM`.toUpperCase(),
                basketId: basket.id,
                category: "ATTRACTION",
                scope: "CITY",
                cityCode: city,
                route: null,
                unitPriceKrw: customDaily,
                pricingUnit: "PER_PERSON",
                quantity: adultCount,
                participantCount: adultCount,
                durationCount: nights,
                lineTotalKrw,
                priceMinKrw: lineTotalKrw,
                priceMaxKrw: lineTotalKrw,
                confidence: basket.confidence,
                updatedAt: basket.updatedAt,
                sourceLabel: basket.sourceLabel,
              };
            }
          } else if (cityAttractionSel && (cityAttractionSel.selectedCourseIds?.length > 0 || cityAttractionSel.individualSpotIds?.length > 0)) {
            const basket = findBasket(catalog, basketId, category, city);
            if (basket) {
              const baseItem = calculateLineItem({
                basket,
                cityCode: city,
                route: null,
                adultCount,
                duration: nights,
                cityCount: selectedCities.length,
              });

              // 수집 및 중복 제거
              const spotIdSet = new Set<string>();

              (cityAttractionSel.selectedCourseIds || []).forEach((courseId) => {
                const course = TOUR_COURSE_PRESETS.find((c) => c.id === courseId && c.cityCode === city);
                if (course) {
                  course.spotIds.forEach((sid) => spotIdSet.add(sid));
                }
              });

              (cityAttractionSel.individualSpotIds || []).forEach((sid) => spotIdSet.add(sid));

              let spotsPricePerPerson = 0;
              spotIdSet.forEach((sid) => {
                const spot = ATTRACTION_SPOTS_CATALOG.find((s) => s.id === sid && s.cityCode === city);
                if (spot && spot.priceStatus === "PAID") {
                  spotsPricePerPerson += spot.price;
                }
              });

              const spotsTotal = spotsPricePerPerson * adultCount;
              const bufferTotal = baseItem.lineTotalKrw;
              const finalLineTotal = spotsTotal + bufferTotal;

              attractionOverrideItem = {
                ...baseItem,
                unitPriceKrw: spotsPricePerPerson + baseItem.unitPriceKrw,
                lineTotalKrw: finalLineTotal,
                priceMinKrw: finalLineTotal,
                priceMaxKrw: finalLineTotal,
              };
            }
          }
        }

        if (accPlaceOverrideItem) {
          item = accPlaceOverrideItem;
        } else if (attractionOverrideItem) {
          item = attractionOverrideItem;
        } else {
          const basket = findBasket(catalog, basketId, category, city);

          if (!basket) {
            if (category === "ATTRACTION" && (basketId as string) === "NONE") {
              const fallbackBasket = catalog.find((b) => b.category === "ATTRACTION");
              item = {
                id: `${city}_ATTRACTION_NONE`.toUpperCase(),
                basketId: "NONE" as BudgetBasketId,
                category: "ATTRACTION",
                scope: "CITY",
                cityCode: city,
                route: null,
                unitPriceKrw: 0,
                pricingUnit: "PER_PERSON",
                quantity: adultCount,
                participantCount: adultCount,
                durationCount: nights,
                lineTotalKrw: 0,
                priceMinKrw: 0,
                priceMaxKrw: 0,
                confidence: fallbackBasket ? fallbackBasket.confidence : "MOCK",
                updatedAt: fallbackBasket?.updatedAt || "2026-01-01",
                sourceLabel: "자율 용돈 미설정",
              };
            } else {
              throw new Error(`Price catalog missing item for city: ${city}, category: ${category}, tier: ${budgetTier}`);
            }
          } else {
            item = calculateLineItem({
              basket,
              cityCode: city,
              route: null,
              adultCount,
              duration: category === "ACCOMMODATION" ? nights : Math.max(1, nights),
              cityCount: selectedCities.length,
            });
          }
        }
      }

      cityLineItems.push(item);
      lineItems.push(item);
    }

    const subtotalKrw = cityLineItems.reduce((sum, item) => sum + item.lineTotalKrw, 0);

    citySections[city] = {
      cityCode: city,
      nights,
      lineItems: cityLineItems,
      subtotalKrw,
    };
  }

  // 3. 도시 간 교통 섹션 연산
  const intercityLineItems: BudgetLineItem[] = [];
  if (selectedCities.length >= 2) {
    // 서울과 부산 간의 경로
    const route = selectedCities.join("-"); // e.g. "SEOUL-BUSAN"
    const category: BudgetCategory = "INTERCITY_TRANSPORT";
    const basketId = BUDGET_TIER_DEFAULT_BASKETS[budgetTier][category];

    // catalog에서 route에 맞는 바스켓 검색 (순서 무관하게 매칭 가능하도록 정렬 비교 등 수행)
    const basket = catalog.find(
      (b) =>
        b.category === category &&
        b.id === basketId &&
        b.isActive &&
        (b.applicableRoute === route ||
          b.applicableRoute === [...selectedCities].reverse().join("-") ||
          b.applicableRoute === "SEOUL-BUSAN" ||
          !b.applicableRoute)
    );

    if (!basket) {
      throw new Error(`Price catalog missing intercity transport item for route: ${route}`);
    }

    const item = calculateLineItem({
      basket,
      cityCode: null,
      route,
      adultCount,
      duration: 1, // KTX 이용 횟수는 도시 간 이동 횟수로 아래에서 quantity로 처리됨
      cityCount: selectedCities.length,
    });

    intercityLineItems.push(item);
    lineItems.push(item);
  }

  const intercitySubtotalKrw = intercityLineItems.reduce((sum, item) => sum + item.lineTotalKrw, 0);
  const intercitySection: IntercityBudgetSection = {
    lineItems: intercityLineItems,
    subtotalKrw: intercitySubtotalKrw,
  };

  // 4. 전체 공통 비용 섹션 연산
  const tripWideLineItems: BudgetLineItem[] = [];
  const wideCategory: BudgetCategory = "EMERGENCY_FUND";
  const emergencyBasketId = BUDGET_TIER_DEFAULT_BASKETS[budgetTier][wideCategory];
  const emergencyBasket = catalog.find(
    (b) => b.category === wideCategory && b.id === emergencyBasketId && b.isActive
  );

  if (!emergencyBasket) {
    throw new Error(`Price catalog missing emergency fund item`);
  }

  const isValValid = (val: unknown): val is number => {
    return typeof val === "number" && !isNaN(val) && isFinite(val) && val >= 0 && Number.isInteger(val);
  };
  const emergencyAmount = (overrides && isValValid(overrides.emergencyFundKrw)) ? overrides.emergencyFundKrw : 0;

  const emergencyItem = calculateLineItem({
    basket: emergencyBasket,
    cityCode: null,
    route: null,
    adultCount,
    duration: tripDraft.totalNights || 5,
    cityCount: selectedCities.length,
  });

  // 비상금 직접 입력 금액 반영 (없거나 유효하지 않으면 0원)
  emergencyItem.lineTotalKrw = emergencyAmount;
  emergencyItem.unitPriceKrw = emergencyAmount;
  emergencyItem.priceMinKrw = emergencyAmount;
  emergencyItem.priceMaxKrw = emergencyAmount;

  tripWideLineItems.push(emergencyItem);
  lineItems.push(emergencyItem);

  const tripWideSubtotalKrw = tripWideLineItems.reduce((sum, item) => sum + item.lineTotalKrw, 0);
  const tripWideSection: TripWideBudgetSection = {
    lineItems: tripWideLineItems,
    subtotalKrw: tripWideSubtotalKrw,
  };

  // 5. 불변식을 지키며 최종 합계 도출
  // 모든 섹션 소계 합산
  const citySubtotalSum = Object.values(citySections).reduce(
    (sum, section) => sum + (section ? section.subtotalKrw : 0),
    0
  );
  const grandTotalKrw = citySubtotalSum + intercitySubtotalKrw + tripWideSubtotalKrw;

  // 카테고리별 합계 계산 및 전체 검증
  const categoryTotals: Record<BudgetCategory, number> = {
    ACCOMMODATION: 0,
    FOOD: 0,
    CITY_TRANSPORT: 0,
    INTERCITY_TRANSPORT: 0,
    ATTRACTION: 0,
    EMERGENCY_FUND: 0,
  };

  for (const item of lineItems) {
    categoryTotals[item.category] += item.lineTotalKrw;
  }

  // 카테고리별 합계의 총합 검증 (Invariant check)
  const categoryTotalSum = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  if (grandTotalKrw !== categoryTotalSum) {
    throw new Error("Financial Invariant Mismatch: grandTotalKrw does not equal the sum of categoryTotals");
  }

  // 6. 예산 비교 지표 연산
  const perTravelerTotalKrw = Math.round(grandTotalKrw / adultCount);
  const dailyAverageKrw = Math.round(grandTotalKrw / (totalNights + 1));
  const targetBudgetUsagePercent = Math.round((grandTotalKrw / targetBudgetKrw) * 1000) / 10;
  const remainingBudgetKrw = Math.max(0, targetBudgetKrw - grandTotalKrw);
  const overBudgetAmountKrw = grandTotalKrw > targetBudgetKrw ? grandTotalKrw - targetBudgetKrw : 0;

  return {
    schemaVersion: 1,
    trip: tripDraft,
    citySections,
    intercitySection,
    tripWideSection,
    categoryTotals,
    grandTotalKrw,
    perTravelerTotalKrw,
    dailyAverageKrw,
    targetBudgetKrw,
    targetBudgetUsagePercent,
    remainingBudgetKrw,
    overBudgetAmountKrw,
    generatedFromCatalogVersion: MOCK_CATALOG_VERSION,
  };
}

/**
 * 카탈로그에서 도시, 카테고리, 바스켓 ID에 매칭되는 항목을 검색
 */
function findBasket(
  catalog: BudgetBasketDefinition[],
  basketId: BudgetBasketId,
  category: BudgetCategory,
  city: SupportedCity
): BudgetBasketDefinition | undefined {
  const directMatch = catalog.find(
    (b) =>
      b.category === category &&
      b.id === basketId &&
      b.applicableCity === city &&
      b.isActive
  );
  if (directMatch) return directMatch;

  return catalog.find(
    (b) =>
      b.category === category &&
      b.id === basketId &&
      (b.applicableCity === "SEOUL" || !b.applicableCity) &&
      b.isActive
  );
}

interface CalculateLineItemParams {
  basket: BudgetBasketDefinition;
  cityCode: SupportedCity | null;
  route: string | null;
  adultCount: number;
  duration: number; // 숙박 일수 또는 기간
  cityCount: number;
}

/**
 * 개별 라인 아이템 금액을 연산하는 순수 함수 (KRW 정수 연산)
 */
export function calculateLineItem({
  basket,
  cityCode,
  route,
  adultCount,
  duration,
  cityCount,
}: CalculateLineItemParams): BudgetLineItem {
  let quantity = 0;
  let participantCount = adultCount;
  let durationCount = duration;
  let lineTotalKrw = 0;
  let priceMinKrw = 0;
  let priceMaxKrw = 0;

  const unitPrice = basket.representativePriceKrw;

  switch (basket.calculationStrategy) {
    case "ROOM_NIGHT": {
      // HypeHeritage MVP: roomCount is fixed to exactly 1 room.
      const roomCount = 1;
      quantity = roomCount;
      lineTotalKrw = unitPrice * roomCount * duration;
      priceMinKrw = basket.priceMinKrw * roomCount * duration;
      priceMaxKrw = basket.priceMaxKrw * roomCount * duration;
      break;
    }
    case "PERSON_DAY": {
      quantity = adultCount;
      lineTotalKrw = unitPrice * adultCount * duration;
      priceMinKrw = basket.priceMinKrw * adultCount * duration;
      priceMaxKrw = basket.priceMaxKrw * adultCount * duration;
      break;
    }
    case "PERSON_MEAL": {
      // PERSON_MEAL은 추후 상세 식사 슬롯에 사용
      const mealsPerDay = 3;
      quantity = adultCount * mealsPerDay;
      lineTotalKrw = unitPrice * quantity * duration;
      priceMinKrw = basket.priceMinKrw * quantity * duration;
      priceMaxKrw = basket.priceMaxKrw * quantity * duration;
      break;
    }
    case "PERSON_ONE_WAY": {
      // 도시 간 교통: adultCount * (도시 개수 - 1)
      const trips = Math.max(0, cityCount - 1);
      quantity = trips;
      durationCount = 1;
      lineTotalKrw = unitPrice * adultCount * trips;
      priceMinKrw = basket.priceMinKrw * adultCount * trips;
      priceMaxKrw = basket.priceMaxKrw * adultCount * trips;
      break;
    }
    case "PER_PERSON_FIXED": {
      quantity = adultCount;
      durationCount = duration;
      lineTotalKrw = unitPrice * adultCount * duration;
      priceMinKrw = basket.priceMinKrw * adultCount * duration;
      priceMaxKrw = basket.priceMaxKrw * adultCount * duration;
      break;
    }
    case "FIXED_AMOUNT": {
      quantity = 1;
      durationCount = 1;
      participantCount = adultCount;
      lineTotalKrw = unitPrice;
      priceMinKrw = basket.priceMinKrw;
      priceMaxKrw = basket.priceMaxKrw;
      break;
    }
    case "PERCENTAGE_OF_SUBTOTAL": {
      // percentage calculations은 추후 사용을 위해 열어둠 (이번 MVP 디폴트 맵핑에선 미사용)
      quantity = 1;
      durationCount = 1;
      lineTotalKrw = unitPrice; // 호출부에서 처리하도록 고정값 설정
      priceMinKrw = basket.priceMinKrw;
      priceMaxKrw = basket.priceMaxKrw;
      break;
    }
    default: {
      throw new Error(`Unsupported calculation strategy: ${basket.calculationStrategy}`);
    }
  }

  // 무작위 UUID 대신 Stable ID 생성
  // 형식: scope_cityCodeOrRoute_basketId
  const sectionId = cityCode ? cityCode : route ? route.replace("-", "_") : "TRIP_WIDE";
  const id = `${sectionId}_${basket.id}`.toUpperCase();

  return {
    id,
    basketId: basket.id,
    category: basket.category,
    scope: basket.scope,
    cityCode,
    route,
    unitPriceKrw: unitPrice,
    pricingUnit: basket.pricingUnit,
    quantity,
    participantCount,
    durationCount,
    lineTotalKrw,
    priceMinKrw,
    priceMaxKrw,
    confidence: basket.confidence,
    updatedAt: basket.updatedAt,
    sourceLabel: basket.sourceLabel,
  };
}

/**
 * 특정 도시와 nights 기간에 대해 기본 식사 계획(Base Meal Plan)을 생성합니다.
 * 각 도시의 nights 횟수만큼 매일 BREAKFAST, LUNCH, DINNER, SNACK_CAFE 슬롯을 생성하되,
 * SNACK_CAFE는 includedInBaseBudget = false 로직을 통해 perPersonBaseTotalKrw 합산에서 제외합니다.
 */
export function generateBaseMealPlan(
  city: SupportedCity,
  nights: number,
  budgetTier: BudgetTier,
  prices: Record<SupportedCity, Record<BudgetTier, Record<MealSlot, number>>> = MOCK_MEAL_SLOT_PRICES
): BaseMealPlan {
  const slots: BaseMealSlot[] = [];
  let perPersonBaseTotalKrw = 0;

  const mealSlots: MealSlot[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK_CAFE"];
  // 0박(당일치기)인 경우 최소 1일치 식사 슬롯 생성
  const daysCount = Math.max(1, nights);

  for (let day = 0; day < daysCount; day++) {
    mealSlots.forEach((slot) => {
      const unitPrice = prices[city]?.[budgetTier]?.[slot] ?? 0;
      const id = `${city}_${day}_${slot}`.toUpperCase();
      const includedInBaseBudget = slot !== "SNACK_CAFE";

      slots.push({
        id,
        city,
        dayIndex: day,
        slot,
        unitPriceKrw: unitPrice,
        includedInBaseBudget,
      });

      if (includedInBaseBudget) {
        perPersonBaseTotalKrw += unitPrice;
      }
    });
  }

  return {
    slots,
    perPersonBaseTotalKrw,
  };
}
