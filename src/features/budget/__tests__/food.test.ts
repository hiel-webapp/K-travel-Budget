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
});
