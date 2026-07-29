import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TripDraft } from "../../../lib/trip-domain";
import {
  generateTripFingerprint,
  parsePlannerPreferences,
  savePlannerPreferences,
  loadPlannerPreferencesEx,
} from "../../../lib/storage-helper";
import { generateInitialBudgetPlan } from "../calculations/engine";

const defaultTrip: TripDraft = {
  schemaVersion: 1,
  totalNights: 5,
  adultCount: 2,
  selectedCities: ["SEOUL", "BUSAN"],
  cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
  budgetTier: "STANDARD",
  targetBudgetKrw: 3000000,
};

describe("HypeHeritage 13단계: Attraction(관광) 오버라이드 및 스키마 V4 검증", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  describe("1. Budget Engine 관광 계산 및 오버라이드 검증", () => {
    it("오버라이드가 없는 경우, STANDARD 등급의 BALANCED 명소 요금이 올바르게 반영되어야 함", () => {
      const plan = generateInitialBudgetPlan(defaultTrip);

      const seoulAttraction = plan.citySections.SEOUL?.lineItems.find(
        (i) => i.category === "ATTRACTION"
      );
      const busanAttraction = plan.citySections.BUSAN?.lineItems.find(
        (i) => i.category === "ATTRACTION"
      );

      // BALANCED 서울: ₩50,000 * 2명 = ₩100,000
      expect(seoulAttraction).toBeDefined();
      expect(seoulAttraction?.basketId).toBe("BALANCED");
      expect(seoulAttraction?.lineTotalKrw).toBe(100000);

      // BALANCED 부산: ₩40,000 * 2명 = ₩80,000
      expect(busanAttraction).toBeDefined();
      expect(busanAttraction?.basketId).toBe("BALANCED");
      expect(busanAttraction?.lineTotalKrw).toBe(80000);

      // 수학적 불변식 검사
      const calculatedSum =
        plan.citySections.SEOUL!.subtotalKrw +
        plan.citySections.BUSAN!.subtotalKrw +
        plan.intercitySection.subtotalKrw +
        plan.tripWideSection.subtotalKrw;
      expect(plan.grandTotalKrw).toBe(calculatedSum);
    });

    it("관광지 오버라이드를 적용할 시, 변경된 등급(Mostly Free, Experience Rich)의 단가로 재계산되어야 함", () => {
      const plan = generateInitialBudgetPlan(defaultTrip, undefined, {
        attraction: {
          SEOUL: "MOSTLY_FREE",
          BUSAN: "EXPERIENCE_RICH",
        },
      });

      const seoulAttraction = plan.citySections.SEOUL?.lineItems.find(
        (i) => i.category === "ATTRACTION"
      );
      const busanAttraction = plan.citySections.BUSAN?.lineItems.find(
        (i) => i.category === "ATTRACTION"
      );

      // MOSTLY_FREE 서울: ₩10,000 * 2명 = ₩20,000
      expect(seoulAttraction?.basketId).toBe("MOSTLY_FREE");
      expect(seoulAttraction?.lineTotalKrw).toBe(20000);

      // EXPERIENCE_RICH 부산: ₩100,000 * 2명 = ₩200,000
      expect(busanAttraction?.basketId).toBe("EXPERIENCE_RICH");
      expect(busanAttraction?.lineTotalKrw).toBe(200000);
    });
  });

  describe("2. Preferences V4 마이그레이션 및 파싱", () => {
    it("V1 로컬스토리지가 있는 경우, V4 형태(attractionByCity: {})로 자동 마이그레이션되어야 함", () => {
      const fp = generateTripFingerprint(defaultTrip);
      const legacyV1 = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 1,
          tripFingerprint: fp,
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
        },
      };

      const res = parsePlannerPreferences(JSON.stringify(legacyV1), defaultTrip);
      expect(res.status).toBe("valid");
      expect(res.preferences.schemaVersion).toBe(5);
      expect(res.preferences.accommodationByCity).toEqual({ SEOUL: "BUDGET_STAY" });
      expect(res.preferences.foodOverrides).toEqual({});
      expect(res.preferences.addOnSelections).toEqual({});
      expect(res.preferences.attractionByCity).toEqual({});
    });

    it("V2 로컬스토리지가 있는 경우, V4 형태(attractionByCity: {})로 자동 마이그레이션되어야 함", () => {
      const fp = generateTripFingerprint(defaultTrip);
      const legacyV2 = {
        schemaVersion: 2,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 2,
          tripFingerprint: fp,
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
          foodOverrides: { SEOUL_0_DINNER: "K_BBQ" },
        },
      };

      const res = parsePlannerPreferences(JSON.stringify(legacyV2), defaultTrip);
      expect(res.status).toBe("valid");
      expect(res.preferences.schemaVersion).toBe(5);
      expect(res.preferences.foodOverrides).toEqual({ SEOUL_0_DINNER: "K_BBQ" });
      expect(res.preferences.addOnSelections).toEqual({});
      expect(res.preferences.attractionByCity).toEqual({});
    });

    it("V3 로컬스토리지가 있는 경우, V4 형태(attractionByCity: {})로 자동 마이그레이션되어야 함", () => {
      const fp = generateTripFingerprint(defaultTrip);
      const legacyV3 = {
        schemaVersion: 3,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 3,
          tripFingerprint: fp,
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
          foodOverrides: { SEOUL_0_DINNER: "K_BBQ" },
          addOnSelections: {
            SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 2 }],
          },
        },
      };

      const res = parsePlannerPreferences(JSON.stringify(legacyV3), defaultTrip);
      expect(res.status).toBe("valid");
      expect(res.preferences.schemaVersion).toBe(5);
      expect(res.preferences.addOnSelections).toEqual({
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 2 }],
      });
      expect(res.preferences.attractionByCity).toEqual({});
    });

    it("V4 로컬스토리지는 오버라이드 유효성 검사 후 정상적으로 valid 반환해야 함", () => {
      const fp = generateTripFingerprint(defaultTrip);
      const envelopeV4 = {
        schemaVersion: 4,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 4,
          tripFingerprint: fp,
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
          foodOverrides: {},
          addOnSelections: {},
          attractionByCity: { SEOUL: "MOSTLY_FREE" },
        },
      };

      const res = parsePlannerPreferences(JSON.stringify(envelopeV4), defaultTrip);
      expect(res.status).toBe("valid");
      expect(res.preferences.schemaVersion).toBe(5);
      expect(res.preferences.attractionByCity).toEqual({ SEOUL: "MOSTLY_FREE" });
    });
  });

  describe("3. Storage Read/Write 연동 검증", () => {
    it("savePlannerPreferences로 저장하고 loadPlannerPreferencesEx로 로드할 시 V4 규격으로 완전 동기화되어야 함", () => {
      if (typeof window === "undefined") return;

      const saved = savePlannerPreferences({
        accommodationByCity: { SEOUL: "STANDARD_HOTEL" },
        foodOverrides: { SEOUL_0_DINNER: "K_BBQ" },
        foodAddOnOverrides: {
          SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 1 }],
        },
        attractionByCity: { SEOUL: "EXPERIENCE_RICH" },
        draft: defaultTrip,
      });

      expect(saved).toBe(true);

      const loaded = loadPlannerPreferencesEx(defaultTrip);
      expect(loaded.status).toBe("valid");
      expect(loaded.preferences.schemaVersion).toBe(4);
      expect(loaded.preferences.attractionByCity).toEqual({ SEOUL: "EXPERIENCE_RICH" });
    });
  });
});
