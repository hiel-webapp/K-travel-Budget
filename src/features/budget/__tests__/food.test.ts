import { describe, it, expect } from "vitest";
import { TripDraft } from "../../../lib/trip-domain";
import {
  FoodOverrides,
} from "../domain/types";
import {
  MOCK_FOOD_ITEMS,
  MOCK_FOOD_COLLECTIONS,
  MOCK_PRICE_CATALOG,
} from "../catalog/mock-catalog";
import {
  findFoodItemsForCity,
  applyFoodReplacements,
  findAddOnCandidatesForParent,
  applyFoodAddOns,
} from "../calculations/food-engine";
import { generateInitialBudgetPlan, generateBaseMealPlan } from "../calculations/engine";

const defaultTrip: TripDraft = {
  totalNights: 5,
  adultCount: 2,
  selectedCities: ["SEOUL", "BUSAN"],
  cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
  budgetTier: "STANDARD",
  targetBudgetKrw: 3000000,
  schemaVersion: 1,
};

describe("HypeHeritage 10단계: Food Wishlist 및 Replacement 도메인 연산 테스트", () => {
  describe("1. Food Wishlist 카탈로그 & 컬렉션 필터", () => {
    it("should retrieve four theme collections correctly", () => {
      // 컬렉션 네 종류 확인
      const ids = MOCK_FOOD_COLLECTIONS.map((c) => c.id);
      expect(ids).toContain("ESSENTIALS");
      expect(ids).toContain("INTERNATIONAL");
      expect(ids).toContain("TRENDING");
      expect(ids).toContain("SPECIALTIES");
    });

    it("should support multiple collections and multiple cities for food items", () => {
      // 다중 컬렉션 소속 확인 (e.g. 삼겹살: ESSENTIALS & INTERNATIONAL)
      const kBBQ = MOCK_FOOD_ITEMS.find((item) => item.id === "K_BBQ");
      expect(kBBQ?.collectionIds).toContain("ESSENTIALS");
      expect(kBBQ?.collectionIds).toContain("INTERNATIONAL");

      // 다중 도시 적용 확인 (e.g. 삼겹살: SEOUL & BUSAN)
      expect(kBBQ?.applicableCities).toContain("SEOUL");
      expect(kBBQ?.applicableCities).toContain("BUSAN");
    });

    it("should filter food items by city and meal slot correctly", () => {
      const seoulDinnerItems = findFoodItemsForCity(MOCK_FOOD_ITEMS, "SEOUL", "DINNER");
      // 삼겹살, 김치찌개, 마라탕, 서울 설렁탕 등 포함되어야 함
      const ids = seoulDinnerItems.map((item) => item.id);
      expect(ids).toContain("K_BBQ");
      expect(ids).toContain("KIMCHI_STEW");
      expect(ids).toContain("SEOUL_SULLEONGTANG");
      // 부산 돼지국밥은 서울에 해당하지 않으므로 없어야 함
      expect(ids).not.toContain("BUSAN_PORK_SOUP");
    });
  });

  describe("2. Replacement 비즈니스 로직 및 예산 합산", () => {
    it("should replace base price with food price, prevent duplicate sum, and keep total meals count", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      // 서울 3박 ➔ 아침 3, 점심 3, 저녁 3, 스낵 3 = 총 12개 슬롯
      expect(seoulBasePlan.slots.filter((s) => s.slot === "DINNER").length).toBe(3);

      const overrides: FoodOverrides = {
        SEOUL_0_DINNER: "K_BBQ", // 삼겹살: ₩18,000 (Standard Base Dinner는 ₩12,000)
      };

      const result = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);

      // Dinner 슬롯 횟수 보존 (Dinner 3회 유지)
      expect(result.slots.filter((s) => s.slot === "DINNER").length).toBe(3);

      // 중복 합산 방지: 서울 Base Standard ₩84,000에서 1회 저녁(₩12,000)이 삼겹살(₩18,000)로 교체됨
      // 기대 1인 합계: ₩84,000 - ₩12,000 + ₩18,000 = ₩90,000
      expect(result.perPersonBaseTotalKrw).toBe(90000);
      expect(result.lineTotalKrw).toBe(180000); // 2인 기준: ₩90,000 * 2
      expect(result.slots[2].replacedByFoodItemId).toBe("K_BBQ");
    });

    it("should overwrite replacement atomically on same slot and restore base on removal", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");

      // 1. 재배정 (K_BBQ ➔ KIMCHI_STEW)
      const overrides1: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const res1 = applyFoodReplacements(seoulBasePlan, overrides1, MOCK_FOOD_ITEMS, 2);
      expect(res1.slots.find((s) => s.id === "SEOUL_0_DINNER")?.unitPriceKrw).toBe(18000);

      const overrides2: FoodOverrides = { SEOUL_0_DINNER: "KIMCHI_STEW" };
      const res2 = applyFoodReplacements(seoulBasePlan, overrides2, MOCK_FOOD_ITEMS, 2);
      expect(res2.slots.find((s) => s.id === "SEOUL_0_DINNER")?.unitPriceKrw).toBe(9000);

      // 2. 선택 제거 시 Base 복원
      const overridesEmpty: FoodOverrides = {};
      const resEmpty = applyFoodReplacements(seoulBasePlan, overridesEmpty, MOCK_FOOD_ITEMS, 2);
      expect(resEmpty.slots.find((s) => s.id === "SEOUL_0_DINNER")?.unitPriceKrw).toBe(12000); // 원래 Base 가격 복구
    });

    it("should guarantee city and date independence", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = {
        SEOUL_0_DINNER: "K_BBQ",
      };

      const result = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);

      // SEOUL_0_DINNER 만 교체되고, 다른 날짜의 저녁은 Base인 ₩12,000 유지
      expect(result.slots.find((s) => s.id === "SEOUL_0_DINNER")?.unitPriceKrw).toBe(18000);
      expect(result.slots.find((s) => s.id === "SEOUL_1_DINNER")?.unitPriceKrw).toBe(12000);
    });

    it("should include SNACK_CAFE in base budget only when replaced with valid FoodItem, and revert on removal", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      // 디폴트 스낵은 ₩0 (includedInBaseBudget = false)
      const defaultSnack = seoulBasePlan.slots.find((s) => s.slot === "SNACK_CAFE");
      expect(defaultSnack?.includedInBaseBudget).toBe(false);

      // 1. 유효 선택 반영 (크루키: ₩8,000)
      const overrides: FoodOverrides = {
        SEOUL_0_SNACK_CAFE: "CROOKIE",
      };
      const result = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);
      const effectiveSnack = result.slots.find((s) => s.id === "SEOUL_0_SNACK_CAFE");
      expect(effectiveSnack?.includedInBaseBudget).toBe(true);
      expect(effectiveSnack?.unitPriceKrw).toBe(8000);

      // 서울 1인 총합: Base ₩84,000 + 크루키 ₩8,000 = ₩92,000
      expect(result.perPersonBaseTotalKrw).toBe(92000);

      // 2. 선택 제거 시 복원
      const emptyResult = applyFoodReplacements(seoulBasePlan, {}, MOCK_FOOD_ITEMS, 2);
      const revertedSnack = emptyResult.slots.find((s) => s.id === "SEOUL_0_SNACK_CAFE");
      expect(revertedSnack?.includedInBaseBudget).toBe(false);
      expect(emptyResult.perPersonBaseTotalKrw).toBe(84000);
    });
  });

  describe("3. Invalid / Orphan Selection 진단 및 예산 제외", () => {
    it("should reject and log issue for unsupported pricing units", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = {
        SEOUL_0_DINNER: "SHARED_JOKBAL", // SHARED_DISH (Unsupported)
      };

      const result = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);

      // 공식 예산 연산에서 배제되고 원래 Base 가격(₩12,000) 유지
      expect(result.perPersonBaseTotalKrw).toBe(84000);
      expect(result.slots.find((s) => s.id === "SEOUL_0_DINNER")?.unitPriceKrw).toBe(12000);

      // 진단 이슈 리포팅 검증
      expect(result.issues.length).toBe(1);
      expect(result.issues[0].reason).toBe("UNSUPPORTED_PRICING_UNIT");
    });

    it("should reject and log issue for slots or food items that do not exist", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");

      const overrides: FoodOverrides = {
        SEOUL_9_DINNER: "K_BBQ",       // 존재하지 않는 날짜 인덱스
        SEOUL_0_DINNER: "GHOST_FOOD",   // 존재하지 않는 음식
      };

      const result = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);

      // 계산에 반영되지 않고 원래 Base 금액 유지
      expect(result.perPersonBaseTotalKrw).toBe(84000);
      expect(result.issues.some((i) => i.reason === "SLOT_NOT_FOUND")).toBe(true);
      expect(result.issues.some((i) => i.reason === "FOOD_NOT_FOUND")).toBe(true);
    });

    it("should reject and log issue for unallowed city or unallowed slot assignments", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");

      const overrides: FoodOverrides = {
        SEOUL_0_DINNER: "BUSAN_PORK_SOUP", // 부산 돼지국밥은 서울에 허용되지 않음
        SEOUL_0_BREAKFAST: "K_BBQ",        // 삼겹살은 아침 슬롯에 허용되지 않음
      };

      const result = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);

      expect(result.perPersonBaseTotalKrw).toBe(84000);
      expect(result.issues.some((i) => i.reason === "CITY_NOT_ALLOWED")).toBe(true);
      expect(result.issues.some((i) => i.reason === "SLOT_NOT_ALLOWED")).toBe(true);
    });

    it("should reject and log issue for malformed override keys", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = {
        "SEOUL-DINNER-CRAP": "K_BBQ",
      };

      const result = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);

      expect(result.perPersonBaseTotalKrw).toBe(84000);
      expect(result.issues[0].reason).toBe("MALFORMED_SELECTION");
    });
  });

  describe("4. Immutability, Determinism, and Invariant Verifications", () => {
    it("should ensure pure function immutability and determinism", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const basePlanClone = JSON.parse(JSON.stringify(seoulBasePlan));
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const overridesClone = JSON.parse(JSON.stringify(overrides));

      applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);

      // 입력 매개변수 불변 확인
      expect(seoulBasePlan).toEqual(basePlanClone);
      expect(overrides).toEqual(overridesClone);

      // 반복 호출 시 동일 출력 보장 (결정성)
      const res1 = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);
      const res2 = applyFoodReplacements(seoulBasePlan, overrides, MOCK_FOOD_ITEMS, 2);
      expect(res1).toEqual(res2);
    });

    it("should satisfy financial invariants and preserve the four approved grand totals", () => {
      const overrides: FoodOverrides = {
        SEOUL_0_DINNER: "K_BBQ",          // 서울: ₩18k (Base ₩12k 대비 +₩6,000)
        BUSAN_0_SNACK_CAFE: "BUSAN_SEED_HOTTEOK", // 부산: ₩5k (Base ₩0 대비 +₩5,000)
      };

      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        food: overrides,
      });

      // 1. perPersonBaseTotalKrw * adultCount = lineTotalKrw 관계 검증
      const seoulFood = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "FOOD");
      expect(seoulFood?.lineTotalKrw).toBe((seoulFood?.mealPlan?.perPersonBaseTotalKrw || 0) * 2);

      // 2. Category totals sum = grandTotalKrw 검증
      const categorySum = Object.values(plan.categoryTotals).reduce((sum, v) => sum + v, 0);
      expect(categorySum).toBe(plan.grandTotalKrw);

      // 3. City subtotals + common = grandTotalKrw 검증
      const seoulSub = plan.citySections.SEOUL?.subtotalKrw || 0;
      const busanSub = plan.citySections.BUSAN?.subtotalKrw || 0;
      const intercity = plan.intercitySection.subtotalKrw;
      const tripWide = plan.tripWideSection.subtotalKrw;
      expect(seoulSub + busanSub + intercity + tripWide).toBe(plan.grandTotalKrw);

      // 4. 기존 오버라이드 미사용 시 승인 예산 4가지 정상 보존 확인
      // Scenario A: Default standard
      const planA = generateInitialBudgetPlan(defaultTrip);
      expect(planA.grandTotalKrw).toBe(1392600);

      // Scenario B: Seoul stay override (BUDGET_STAY)
      const planB = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: { SEOUL: "BUDGET_STAY" },
      });
      expect(planB.grandTotalKrw).toBe(1212600);

      // Scenario C: Busan stay override (PREMIUM_HERITAGE)
      const planC = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: { BUSAN: "PREMIUM_HERITAGE" },
      });
      expect(planC.grandTotalKrw).toBe(1652600);

      // Scenario D: Combined stay overrides
      const planD = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: { SEOUL: "BUDGET_STAY", BUSAN: "PREMIUM_HERITAGE" },
      });
      expect(planD.grandTotalKrw).toBe(1472600);
    });
  });

  describe("5. 11단계 Food Add-on 비즈니스 로직 및 가격 계산 검증", () => {
    it("should retrieve add-on candidates for a parent food item", () => {
      const candidates = findAddOnCandidatesForParent(undefined, "K_BBQ");
      const ids = candidates.map((c) => c.id);
      expect(ids).toContain("RICE");
      expect(ids).toContain("KIMCHI_STEW_ADDON");
      expect(ids).not.toContain("GHOST_ADDON");
    });

    it("should filter out add-ons assigned to wrong parent", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      // SEOUL_0_DINNER 에 K_BBQ (삼겹살) 대신 KIMCHI_STEW 를 배치
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "KIMCHI_STEW" };
      const replaced = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2);

      // K_BBQ 전용인 RICE 애드온을 배치
      const addOnOverrides = {
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 1 }],
      };

      const result = applyFoodAddOns(replaced, addOnOverrides, 2);
      expect(result.addOnIssues?.some((i) => i.reason === "ADD_ON_NOT_ALLOWED_FOR_PARENT")).toBe(true);
      expect(result.addOnsTotalKrw).toBe(0);
    });

    it("should charge 0 for unselected add-ons and calculate single/multiple add-ons correctly", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const replaced = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2);

      // 1. 미선택 시 0원
      const res0 = applyFoodAddOns(replaced, {}, 2);
      expect(res0.addOnsTotalKrw).toBe(0);

      // 2. 단일 애드온 (공기밥 1인분, PER_PERSON 단가 ₩1,000 * 2명 * quantity 1 = ₩2,000)
      const res1 = applyFoodAddOns(replaced, {
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 1 }],
      }, 2);
      expect(res1.addOnsTotalKrw).toBe(2000);

      // 3. 다중 애드온 (공기밥 1 + 후식 김치찌개 1: PER_SERVING 단가 ₩7,000 * quantity 1 = ₩7,000)
      // 총합: ₩2,000 + ₩7,000 = ₩9,000
      const res2 = applyFoodAddOns(replaced, {
        SEOUL_0_DINNER: [
          { addOnItemId: "RICE", quantity: 1 },
          { addOnItemId: "KIMCHI_STEW_ADDON", quantity: 1 },
        ],
      }, 2);
      expect(res2.addOnsTotalKrw).toBe(9000);
    });

    it("should prevent duplicate add-ons in the same slot and issue error", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const replaced = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2);

      const addOnOverrides = {
        SEOUL_0_DINNER: [
          { addOnItemId: "RICE", quantity: 1 },
          { addOnItemId: "RICE", quantity: 2 }, // 중복 배정
        ],
      };

      const result = applyFoodAddOns(replaced, addOnOverrides, 2);
      // 첫 번째 RICE만 성공하고 두 번째는 MALFORMED_SELECTION 처리됨
      expect(result.addOnsTotalKrw).toBe(2000);
      expect(result.addOnIssues?.some((i) => i.reason === "MALFORMED_SELECTION")).toBe(true);
    });

    it("should validate quantities (NaN, negative, float, limit exceed) and invalid price", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const replaced = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2);

      // 1. quantity = 0 (INVALID_QUANTITY)
      const res0 = applyFoodAddOns(replaced, { SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 0 }] }, 2);
      expect(res0.addOnIssues?.some((i) => i.reason === "INVALID_QUANTITY")).toBe(true);

      // 2. quantity = -1 (INVALID_QUANTITY)
      const resNeg = applyFoodAddOns(replaced, { SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: -1 }] }, 2);
      expect(resNeg.addOnIssues?.some((i) => i.reason === "INVALID_QUANTITY")).toBe(true);

      // 3. quantity = 1.5 (INVALID_QUANTITY)
      const resFloat = applyFoodAddOns(replaced, { SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 1.5 }] }, 2);
      expect(resFloat.addOnIssues?.some((i) => i.reason === "INVALID_QUANTITY")).toBe(true);

      // 4. quantity > maxQuantity (LIMIT EXCEED, RICE max = 5)
      const resExceed = applyFoodAddOns(replaced, { SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 99 }] }, 2);
      expect(resExceed.addOnIssues?.some((i) => i.reason === "QUANTITY_EXCEEDS_LIMIT")).toBe(true);

      // 5. invalid price (BAD_PRICE_ADDON 단가 0)
      const resPrice = applyFoodAddOns(replaced, { SEOUL_0_DINNER: [{ addOnItemId: "BAD_PRICE_ADDON", quantity: 1 }] }, 2);
      expect(resPrice.addOnIssues?.some((i) => i.reason === "INVALID_PRICE")).toBe(true);
    });

    it("should flag orphan add-ons when parent replacement is not applied or changed", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");

      // 1. parent Replacement 가 아예 없는 경우
      const replacedEmpty = applyFoodReplacements(seoulBasePlan, {}, undefined, 2);
      const res1 = applyFoodAddOns(replacedEmpty, {
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 1 }],
      }, 2);
      expect(res1.addOnIssues?.some((i) => i.reason === "PARENT_REPLACEMENT_NOT_APPLIED")).toBe(true);
      expect(res1.addOnsTotalKrw).toBe(0);

      // 2. parent Replacement 가 다른 종류로 교체된 경우
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "SEOUL_SULLEONGTANG" }; // K_BBQ가 아님
      const replacedSul = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2);
      const res2 = applyFoodAddOns(replacedSul, {
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 1 }],
      }, 2);
      expect(res2.addOnIssues?.some((i) => i.reason === "ADD_ON_NOT_ALLOWED_FOR_PARENT")).toBe(true);
      expect(res2.addOnsTotalKrw).toBe(0);
    });

    it("should calculate correctly for 7 pricing units formula", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const replaced = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2); // 2명

      // 1. PER_PERSON (RICE: ₩1,000 * 2명 * quantity 2 = ₩4,000)
      const resPerson = applyFoodAddOns(replaced, {
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 2 }],
      }, 2);
      expect(resPerson.addOnsTotalKrw).toBe(4000);

      // 2. SHARED_DISH (SHARED_DISH_ADDON: ₩20,000 * quantity 1 = ₩20,000)
      const resShared = applyFoodAddOns(replaced, {
        SEOUL_0_DINNER: [{ addOnItemId: "SHARED_DISH_ADDON", quantity: 1 }],
      }, 2);
      expect(resShared.addOnsTotalKrw).toBe(20000);

      // 3. SET_MENU (SET_MENU_ADDON: ₩15,000 * quantity 1 = ₩15,000)
      const resSet = applyFoodAddOns(replaced, {
        SEOUL_0_DINNER: [{ addOnItemId: "SET_MENU_ADDON", quantity: 1 }],
      }, 2);
      expect(resSet.addOnsTotalKrw).toBe(15000);

      // 4. PER_TABLE (PER_TABLE_ADDON: ₩5,000 * quantity 2 = ₩10,000)
      const resTable = applyFoodAddOns(replaced, {
        SEOUL_0_DINNER: [{ addOnItemId: "PER_TABLE_ADDON", quantity: 2 }],
      }, 2);
      expect(resTable.addOnsTotalKrw).toBe(10000);
    });

    it("should never automatically include alcohol or beverages", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const replaced = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2);

      // 아무것도 선택하지 않으면 SOJU가 리스트에는 있으나 0원
      const res = applyFoodAddOns(replaced, {}, 2);
      expect(res.addOnsTotalKrw).toBe(0);
      expect(res.slots.some((s) => s.addOns && s.addOns.some((a) => a.addOnItemId === "SOJU_ADDON"))).toBe(false);
    });

    it("should maintain immutable inputs and return deterministic outputs", () => {
      const seoulBasePlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const overrides: FoodOverrides = { SEOUL_0_DINNER: "K_BBQ" };
      const replaced = applyFoodReplacements(seoulBasePlan, overrides, undefined, 2);
      const replacedClone = JSON.parse(JSON.stringify(replaced));

      const addOnOverrides = {
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 1 }],
      };
      const addOnOverridesClone = JSON.parse(JSON.stringify(addOnOverrides));

      applyFoodAddOns(replaced, addOnOverrides, 2);

      expect(replaced).toEqual(replacedClone);
      expect(addOnOverrides).toEqual(addOnOverridesClone);
    });

    it("should correctly accumulate and bubble up totals to Budget Engine", () => {
      const foodAddOnOverrides = {
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 2 }], // ₩1,000 * 2명 * 2개 = ₩4,000
      };

      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        food: { SEOUL_0_DINNER: "K_BBQ" },
        foodAddOns: foodAddOnOverrides,
      });

      // 서울 FOOD line total: Base(₩84,000) - ₩12,000 + ₩18,000 = ₩90,000 (성인 2명 ➔ ₩180,000)
      // + Add-on (₩4,000) ➔ 총합 ₩184,000
      const seoulFood = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "FOOD");
      expect(seoulFood?.lineTotalKrw).toBe(184000);

      // 전체 카테고리 합 = grandTotalKrw
      const categorySum = Object.values(plan.categoryTotals).reduce((sum, v) => sum + v, 0);
      expect(categorySum).toBe(plan.grandTotalKrw);
    });
  });
});
