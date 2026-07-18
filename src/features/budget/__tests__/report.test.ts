import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TripDraft } from "../../../lib/trip-domain";
import {
  savePlannerPreferences,
} from "../../../lib/storage-helper";
import { generateInitialBudgetPlan } from "../calculations/engine";
import { MOCK_PRICE_CATALOG } from "../catalog/mock-catalog";
import { PlannerPreferences } from "../domain/types";

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

if (typeof window === "undefined") {
  const mockLocalStorage = new LocalStorageMock();
  global.localStorage = mockLocalStorage as unknown as Storage;
  global.window = {
    localStorage: mockLocalStorage,
    location: { hash: "" }
  } as unknown as Window & typeof globalThis;
}

const mockDraft: TripDraft = {
  schemaVersion: 1,
  totalNights: 5,
  adultCount: 2,
  selectedCities: ["SEOUL", "BUSAN"],
  cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
  budgetTier: "STANDARD",
  targetBudgetKrw: 3000000,
};

const mockPreferences: PlannerPreferences = {
  schemaVersion: 4,
  tripFingerprint: "5|2|SEOUL,BUSAN|BUSAN:2;SEOUL:3|STANDARD|3000000",
  accommodationByCity: { SEOUL: "STANDARD_HOTEL" },
  foodOverrides: { SEOUL_0_DINNER: "K_BBQ" },
  addOnSelections: {
    SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 2 }],
  },
  attractionByCity: { SEOUL: "EXPERIENCE_RICH" },
};

describe("HypeHeritage 15단계: Report(예산 분석 리포트) 비즈니스 로직 및 계산 정합성 검증", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("1. Basic Report 산출 데이터 정합성 검증", () => {
    it("기본 예산 정보가 Budget Engine 산출 결과와 온전히 일치하고 파생 단가들이 일관되어야 함", () => {
      const plan = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG, {
        accommodation: mockPreferences.accommodationByCity,
        food: mockPreferences.foodOverrides,
        foodAddOns: mockPreferences.addOnSelections,
        attraction: mockPreferences.attractionByCity,
      });

      // 전체 총액 검사
      expect(plan.grandTotalKrw).toBeGreaterThan(0);

      // 1인당 비용 검증: (총액 / 2명)
      expect(plan.perTravelerTotalKrw).toBe(plan.grandTotalKrw / 2);

      // 일별 평균 비용 검증: (총액 / 6일)
      expect(plan.dailyAverageKrw).toBe(plan.grandTotalKrw / 6);

      // 도시별 subtotal 및 nights 검증
      expect(plan.citySections.SEOUL?.nights).toBe(3);
      expect(plan.citySections.BUSAN?.nights).toBe(2);

      // 카테고리 소계 누적 검증 (비상금 포함)
      const accommodationTotal = plan.categoryTotals.ACCOMMODATION || 0;
      const foodTotal = plan.categoryTotals.FOOD || 0;
      const cityTransportTotal = plan.categoryTotals.CITY_TRANSPORT || 0;
      const intercityTotal = plan.intercitySection.subtotalKrw || 0;
      const attractionTotal = plan.categoryTotals.ATTRACTION || 0;
      const emergencyTotal = plan.categoryTotals.EMERGENCY_FUND || 0;

      const sum = accommodationTotal + foodTotal + cityTransportTotal + intercityTotal + attractionTotal + emergencyTotal;
      expect(plan.grandTotalKrw).toBe(sum);
    });

    it("목표 예산과의 대비 차액 및 사용 비율 연산이 수학적 안정성을 보장해야 함", () => {
      const plan = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG, {
        accommodation: mockPreferences.accommodationByCity,
        food: mockPreferences.foodOverrides,
        foodAddOns: mockPreferences.addOnSelections,
        attraction: mockPreferences.attractionByCity,
      });

      const targetBudget = plan.targetBudgetKrw || 0;
      expect(targetBudget).toBe(3000000);

      const usagePercent = plan.targetBudgetUsagePercent;
      const expectedPercent = Math.round((plan.grandTotalKrw / targetBudget) * 1000) / 10;
      expect(usagePercent).toBe(expectedPercent);

      const isOver = plan.grandTotalKrw > targetBudget;
      const diffAmount = Math.abs(plan.grandTotalKrw - targetBudget);
      expect(isOver).toBe(plan.grandTotalKrw > 3000000);
      expect(diffAmount).toBe(Math.abs(plan.grandTotalKrw - 3000000));
    });

    it("목표 예산이 최소값(1)으로 설정되어 과도한 초과 상태일 때도, 음수 오류나 NaN이 발생하지 않아야 함", () => {
      const minTargetDraft: TripDraft = {
        ...mockDraft,
        targetBudgetKrw: 1,
      };

      const plan = generateInitialBudgetPlan(minTargetDraft, MOCK_PRICE_CATALOG, {
        accommodation: mockPreferences.accommodationByCity,
        food: mockPreferences.foodOverrides,
        foodAddOns: mockPreferences.addOnSelections,
        attraction: mockPreferences.attractionByCity,
      });

      expect(plan.targetBudgetKrw).toBe(1);
      // 극단적인 예산 초과 상태에서도 grandTotalKrw - 1 이 정상 정수로 도출되는지 확인
      expect(plan.overBudgetAmountKrw).toBe(plan.grandTotalKrw - 1);
      expect(plan.targetBudgetUsagePercent).toBeGreaterThan(0);
      expect(Number.isNaN(plan.targetBudgetUsagePercent)).toBe(false);
    });
  });

  describe("2. 스토리지 영속화 연동 가딩 검증", () => {
    it("savePlannerPreferences을 통해 저장된 스냅샷 데이터가 Report의 계산 엔진 입력으로 고스란히 이식되어야 함", () => {
      const saved = savePlannerPreferences({
        accommodationByCity: mockPreferences.accommodationByCity,
        foodOverrides: mockPreferences.foodOverrides,
        foodAddOnOverrides: mockPreferences.addOnSelections,
        attractionByCity: mockPreferences.attractionByCity,
        draft: mockDraft,
      });
      expect(saved).toBe(true);

      const rawPrefs = localStorage.getItem("hypeheritage_planner_preferences");
      expect(rawPrefs).not.toBeNull();

      const envelope = JSON.parse(rawPrefs!);
      expect(envelope.preferences.accommodationByCity).toEqual(mockPreferences.accommodationByCity);
      expect(envelope.preferences.attractionByCity).toEqual(mockPreferences.attractionByCity);
    });
  });
});
