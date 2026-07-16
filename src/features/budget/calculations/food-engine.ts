import { SupportedCity } from "../../../lib/trip-domain";
import {
  MealSlot,
  BaseMealPlan,
  FoodItem,
  FoodOverrides,
  EffectiveMealSlot,
  FoodReplacementIssue,
  FoodReplacementIssueReason,
  CalculatedMealPlan,
  FoodCollectionId,
  FoodAddOnItem,
  FoodAddOnSelection,
  FoodAddOnOverrides,
  EffectiveFoodAddOn,
  FoodAddOnIssue,
} from "../domain/types";
import { MOCK_FOOD_ITEMS, MOCK_FOOD_ADD_ONS } from "../catalog/mock-catalog";

/**
 * 테마 컬렉션별로 음식을 조회합니다.
 */
export function getCollectionWishlist(
  catalog: FoodItem[] = MOCK_FOOD_ITEMS,
  theme: FoodCollectionId
): FoodItem[] {
  return catalog.filter((item) => item.collectionIds.includes(theme));
}

/**
 * 특정 도시와 식사 슬롯에 적용 가능한 음식을 카탈로그에서 조회합니다.
 */
export function findFoodItemsForCity(
  catalog: FoodItem[] = MOCK_FOOD_ITEMS,
  city: SupportedCity,
  slot: MealSlot
): FoodItem[] {
  return catalog.filter(
    (item) => item.applicableCities.includes(city) && item.applicableSlots.includes(slot)
  );
}

/**
 * 특정 음식을 해당 도시의 슬롯에 배정 가능한지 유효성을 검증합니다.
 */
export function isFoodAssignableToSlot(
  foodItem: FoodItem,
  city: SupportedCity,
  slot: MealSlot
): { assignable: boolean; reason?: FoodReplacementIssueReason } {
  if (!foodItem.applicableCities.includes(city)) {
    return { assignable: false, reason: "CITY_NOT_ALLOWED" };
  }
  if (!foodItem.applicableSlots.includes(slot)) {
    return { assignable: false, reason: "SLOT_NOT_ALLOWED" };
  }
  if (foodItem.pricingUnit !== "PER_PERSON") {
    return { assignable: false, reason: "UNSUPPORTED_PRICING_UNIT" };
  }
  return { assignable: true };
}

/**
 * foodOverrides 저장 맵의 구조와 유효성을 검증하여, 유효한 매핑과 반려(rejected) 매핑을 분류합니다.
 * 계산 수행 전, 순수 검증 단계로 활용됩니다.
 */
export function validateFoodOverrides(
  overrides: FoodOverrides,
  catalog: FoodItem[] = MOCK_FOOD_ITEMS,
  city: SupportedCity,
  nights: number
): { valid: FoodOverrides; rejected: FoodReplacementIssue[] } {
  const valid: FoodOverrides = {};
  const rejected: FoodReplacementIssue[] = [];

  for (const [slotId, foodItemId] of Object.entries(overrides)) {
    // 1. Key 포맷 검증 (MALFORMED_SELECTION)
    const match = slotId.match(/^([A-Z]+)_([0-9]+)_([A-Z_]+)$/);
    if (!match) {
      rejected.push({ slotId, foodItemId, reason: "MALFORMED_SELECTION" });
      continue;
    }

    const [, keyCity, dayStr, keySlot] = match;
    const dayIndex = parseInt(dayStr, 10);

    if (
      keyCity !== city ||
      isNaN(dayIndex) ||
      dayIndex < 0 ||
      dayIndex >= nights ||
      !["BREAKFAST", "LUNCH", "DINNER", "SNACK_CAFE"].includes(keySlot)
    ) {
      rejected.push({ slotId, foodItemId, reason: "SLOT_NOT_FOUND" });
      continue;
    }

    // 2. FoodItem 존재성 검증 (FOOD_NOT_FOUND)
    const foodItem = catalog.find((item) => item.id === foodItemId);
    if (!foodItem) {
      rejected.push({ slotId, foodItemId, reason: "FOOD_NOT_FOUND" });
      continue;
    }

    // 3. 배정 가능 여부 검증 (CITY, SLOT, PRICING_UNIT 등)
    const assignCheck = isFoodAssignableToSlot(foodItem, city, keySlot as MealSlot);
    if (!assignCheck.assignable) {
      rejected.push({ slotId, foodItemId, reason: assignCheck.reason! });
      continue;
    }

    valid[slotId] = foodItemId;
  }

  return { valid, rejected };
}

/**
 * Base Meal Plan에 음식 오버라이드 replacements를 반영하여 계산된 CalculatedMealPlan을 생성합니다.
 * 입력 객체(mealPlan, overrides, catalog)는 절대 변형하지 않습니다 (Pure Function).
 */
export function applyFoodReplacements(
  mealPlan: BaseMealPlan,
  overrides: FoodOverrides = {},
  catalog: FoodItem[] = MOCK_FOOD_ITEMS,
  adultCount: number
): CalculatedMealPlan {
  const slots: EffectiveMealSlot[] = [];
  let perPersonBaseTotalKrw = 0;
  const issues: FoodReplacementIssue[] = [];

  // 도시 및 nights 도출
  const firstSlot = mealPlan.slots[0];
  const city = firstSlot ? firstSlot.city : "SEOUL";
  const nights = firstSlot ? mealPlan.slots.filter((s) => s.slot === "BREAKFAST").length : 0;

  // 1. Overrides 검증 단계 구동
  const { valid, rejected } = validateFoodOverrides(overrides, catalog, city, nights);
  issues.push(...rejected);

  // 2. Meal Slots을 순회하며 Effective Price 결정
  mealPlan.slots.forEach((baseSlot) => {
    const foodItemId = valid[baseSlot.id];
    let unitPriceKrw = baseSlot.unitPriceKrw;
    let includedInBaseBudget = baseSlot.includedInBaseBudget;
    let replacedByFoodItemId: string | undefined = undefined;

    if (foodItemId) {
      const foodItem = catalog.find((item) => item.id === foodItemId);
      if (foodItem) {
        unitPriceKrw = foodItem.representativePriceKrw;
        replacedByFoodItemId = foodItem.id;
        includedInBaseBudget = true;
      }
    }

    slots.push({
      id: baseSlot.id,
      city: baseSlot.city,
      dayIndex: baseSlot.dayIndex,
      slot: baseSlot.slot,
      unitPriceKrw,
      includedInBaseBudget,
      replacedByFoodItemId,
      originalUnitPriceKrw: baseSlot.unitPriceKrw,
    });

    if (includedInBaseBudget) {
      perPersonBaseTotalKrw += unitPriceKrw;
    }
  });

  return {
    slots,
    perPersonBaseTotalKrw,
    lineTotalKrw: perPersonBaseTotalKrw * adultCount,
    issues,
  };
}

/**
 * 특정 parent 음식에 대한 Add-on 후보군을 조회합니다.
 */
export function findAddOnCandidatesForParent(
  addOnCatalog: FoodAddOnItem[] = MOCK_FOOD_ADD_ONS,
  parentFoodItemId: string
): FoodAddOnItem[] {
  return addOnCatalog.filter((item) => item.parentFoodItemIds.includes(parentFoodItemId));
}

/**
 * 7개 가격 단위 공식을 기반으로 단일 Add-on 가격을 계산합니다.
 */
export function calculateAddOnPrice(
  addOnItem: FoodAddOnItem,
  quantity: number,
  adultCount: number
): { adultCountApplied: boolean; multiplier: number; lineTotalKrw: number } {
  if (addOnItem.pricingUnit === "PER_PERSON") {
    const multiplier = adultCount * quantity;
    return {
      adultCountApplied: true,
      multiplier,
      lineTotalKrw: addOnItem.representativePriceKrw * multiplier,
    };
  } else {
    return {
      adultCountApplied: false,
      multiplier: quantity,
      lineTotalKrw: addOnItem.representativePriceKrw * quantity,
    };
  }
}

/**
 * 사용자 Add-on 선택값(selections)들의 런타임 구조와 유효성을 검사합니다.
 */
export function validateAddOnSelections(
  selections: FoodAddOnSelection[],
  addOnCatalog: FoodAddOnItem[] = MOCK_FOOD_ADD_ONS,
  parentFoodItemId: string | undefined,
  city: SupportedCity
): { valid: FoodAddOnSelection[]; rejected: FoodAddOnIssue[]; malformedCount: number } {
  const valid: FoodAddOnSelection[] = [];
  const rejected: FoodAddOnIssue[] = [];
  let malformedCount = 0;

  if (!Array.isArray(selections)) {
    return { valid: [], rejected: [], malformedCount: 1 };
  }

  const seenAddOnIds = new Set<string>();

  for (const selection of selections) {
    if (
      !selection ||
      typeof selection !== "object" ||
      typeof selection.addOnItemId !== "string" ||
      typeof selection.quantity !== "number"
    ) {
      malformedCount++;
      continue;
    }

    const { addOnItemId, quantity } = selection;

    if (
      isNaN(quantity) ||
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
      rejected.push({
        slotId: "",
        addOnItemId,
        parentFoodItemId,
        reason: "INVALID_QUANTITY",
      });
      continue;
    }

    const addOnItem = addOnCatalog.find((item) => item.id === addOnItemId);
    if (!addOnItem) {
      rejected.push({
        slotId: "",
        addOnItemId,
        parentFoodItemId,
        reason: "ADD_ON_NOT_FOUND",
      });
      continue;
    }

    if (
      typeof addOnItem.representativePriceKrw !== "number" ||
      isNaN(addOnItem.representativePriceKrw) ||
      addOnItem.representativePriceKrw <= 0 ||
      !Number.isInteger(addOnItem.representativePriceKrw)
    ) {
      rejected.push({
        slotId: "",
        addOnItemId,
        parentFoodItemId,
        reason: "INVALID_PRICE",
      });
      continue;
    }

    if (!parentFoodItemId || !addOnItem.parentFoodItemIds.includes(parentFoodItemId)) {
      rejected.push({
        slotId: "",
        addOnItemId,
        parentFoodItemId,
        reason: "ADD_ON_NOT_ALLOWED_FOR_PARENT",
      });
      continue;
    }

    if (!addOnItem.applicableCities.includes(city)) {
      rejected.push({
        slotId: "",
        addOnItemId,
        parentFoodItemId,
        reason: "CITY_NOT_ALLOWED",
      });
      continue;
    }

    if (quantity > addOnItem.maxQuantity) {
      rejected.push({
        slotId: "",
        addOnItemId,
        parentFoodItemId,
        reason: "QUANTITY_EXCEEDS_LIMIT",
      });
      continue;
    }

    if (seenAddOnIds.has(addOnItemId)) {
      rejected.push({
        slotId: "",
        addOnItemId,
        parentFoodItemId,
        reason: "MALFORMED_SELECTION",
      });
      continue;
    }

    seenAddOnIds.add(addOnItemId);
    valid.push(selection);
  }

  return { valid, rejected, malformedCount };
}

/**
 * CalculatedMealPlan에 음식 Add-on 계산 결과를 안전하게 누적 병합합니다.
 * 입력 객체들은 절대 mutation하지 않습니다 (Pure Function).
 */
export function applyFoodAddOns(
  calculatedMealPlan: CalculatedMealPlan,
  addOnOverrides: FoodAddOnOverrides = {},
  adultCount: number,
  addOnCatalog: FoodAddOnItem[] = MOCK_FOOD_ADD_ONS
): CalculatedMealPlan {
  const slots: EffectiveMealSlot[] = [];
  const addOnIssues: FoodAddOnIssue[] = [];
  let addOnsTotalKrw = 0;

  if (!addOnOverrides || typeof addOnOverrides !== "object" || Array.isArray(addOnOverrides)) {
    return {
      ...calculatedMealPlan,
      addOnIssues: [
        {
          slotId: "",
          addOnItemId: "",
          reason: "MALFORMED_SELECTION",
        },
      ],
      addOnsTotalKrw: 0,
    };
  }

  calculatedMealPlan.slots.forEach((baseSlot) => {
    const parentFoodItemId = baseSlot.replacedByFoodItemId;
    const selections = addOnOverrides[baseSlot.id] || [];

    if (!parentFoodItemId) {
      if (selections.length > 0) {
        selections.forEach((sel) => {
          if (sel && typeof sel === "object" && typeof sel.addOnItemId === "string") {
            addOnIssues.push({
              slotId: baseSlot.id,
              addOnItemId: sel.addOnItemId,
              reason: "PARENT_REPLACEMENT_NOT_APPLIED",
            });
          } else {
            addOnIssues.push({
              slotId: baseSlot.id,
              addOnItemId: "",
              reason: "MALFORMED_SELECTION",
            });
          }
        });
      }
      slots.push({ ...baseSlot, addOns: [], addOnsTotalKrw: 0 });
      return;
    }

    const { valid, rejected, malformedCount } = validateAddOnSelections(
      selections,
      addOnCatalog,
      parentFoodItemId,
      baseSlot.city
    );

    rejected.forEach((issue) => {
      addOnIssues.push({
        ...issue,
        slotId: baseSlot.id,
      });
    });

    for (let i = 0; i < malformedCount; i++) {
      addOnIssues.push({
        slotId: baseSlot.id,
        addOnItemId: "",
        parentFoodItemId,
        reason: "MALFORMED_SELECTION",
      });
    }

    const effectiveAddOns: EffectiveFoodAddOn[] = [];
    let slotAddOnsTotalKrw = 0;

    valid.forEach((sel) => {
      const addOnItem = addOnCatalog.find((item) => item.id === sel.addOnItemId)!;
      const calcResult = calculateAddOnPrice(addOnItem, sel.quantity, adultCount);

      effectiveAddOns.push({
        addOnItemId: addOnItem.id,
        nameKo: addOnItem.nameKo,
        nameEn: addOnItem.nameEn,
        unitPriceKrw: addOnItem.representativePriceKrw,
        quantity: sel.quantity,
        pricingUnit: addOnItem.pricingUnit,
        adultCountApplied: calcResult.adultCountApplied,
        multiplier: calcResult.multiplier,
        lineTotalKrw: calcResult.lineTotalKrw,
      });

      slotAddOnsTotalKrw += calcResult.lineTotalKrw;
    });

    addOnsTotalKrw += slotAddOnsTotalKrw;

    slots.push({
      ...baseSlot,
      addOns: effectiveAddOns,
      addOnsTotalKrw: slotAddOnsTotalKrw,
    });
  });

  return {
    ...calculatedMealPlan,
    slots,
    addOnIssues,
    addOnsTotalKrw,
    lineTotalKrw: calculatedMealPlan.lineTotalKrw + addOnsTotalKrw,
  };
}
