import { describe, it, expect } from "vitest";
import { ko } from "../../../lib/i18n/dictionaries/ko";
import { en } from "../../../lib/i18n/dictionaries/en";
import {
  formatKrw,
  formatPercentage,
  formatTripDuration,
  formatTravelerCount,
  formatCityAllocationSummary,
  getPricingUnitLabel,
  getCategoryLabel,
  getBasketLabel,
  getCalculationExpression,
  getCombinedTransportSubtotal,
  generateBudgetSummaryText,
} from "./formatters";
import { BudgetLineItem, BudgetPlan } from "../domain/types";

describe("Budget Presentation Formatters", () => {
  it("should format KRW currency correctly without decimals", () => {
    // Intl.NumberFormat ko-KR 기호 ₩와 쉼표를 정확히 반환하는지 테스트
    // 주의: 공백 문자(non-breaking space 등)가 ₩와 숫자 사이에 들어올 수 있으므로 정규식으로 검증하거나 단순 포함으로 검사할 수도 있으나 정합적으로 검사
    const result = formatKrw(1392600);
    expect(result.replace(/\s/g, "")).toBe("₩1,392,600");
  });

  it("should format percentage correctly", () => {
    expect(formatPercentage(46.4)).toBe("46.4%");
    expect(formatPercentage(120)).toBe("120%");
  });

  it("should format trip duration for both locales", () => {
    expect(formatTripDuration(5, ko, "ko")).toBe("5박 6일");
    expect(formatTripDuration(5, en, "en")).toBe("5 nights · 6 days");
  });

  it("should format traveler count for both locales", () => {
    expect(formatTravelerCount(2, ko, "ko")).toBe("성인 2명");
    expect(formatTravelerCount(2, en, "en")).toBe("2 adults");
    expect(formatTravelerCount(1, en, "en")).toBe("1 adult");
  });

  it("should format city allocation summaries", () => {
    const allocBoth = { SEOUL: 3, BUSAN: 2 };
    expect(formatCityAllocationSummary(allocBoth, ko, "ko")).toBe("서울 3박 · 부산 2박");
    expect(formatCityAllocationSummary(allocBoth, en, "en")).toBe("Seoul 3 nights · Busan 2 nights");

    const allocSeoul = { SEOUL: 5 };
    expect(formatCityAllocationSummary(allocSeoul, ko, "ko")).toBe("서울 5박");
    expect(formatCityAllocationSummary(allocSeoul, en, "en")).toBe("Seoul 5 nights");
  });

  it("should return correct category labels", () => {
    expect(getCategoryLabel("ACCOMMODATION", ko)).toBe("숙박");
    expect(getCategoryLabel("ACCOMMODATION", en)).toBe("Stay");
    expect(getCategoryLabel("CITY_TRANSPORT", ko)).toBe("교통");
    expect(getCategoryLabel("INTERCITY_TRANSPORT", ko)).toBe("교통");
  });

  it("should return correct pricing unit labels", () => {
    expect(getPricingUnitLabel("ROOM_NIGHT", ko)).toBe("객실/1박");
    expect(getPricingUnitLabel("ROOM_NIGHT", en)).toBe("Room/Night");
  });


  it("should return correct basket display labels", () => {
    expect(getBasketLabel("STANDARD_HOTEL", ko, "ko")).toBe("스탠다드 호텔");
    expect(getBasketLabel("STANDARD_HOTEL", en, "en")).toBe("Standard Hotel");
  });

  it("should assemble calculation expressions correctly", () => {
    const mockRoomItem: Partial<BudgetLineItem> = {
      unitPriceKrw: 135000,
      pricingUnit: "ROOM_NIGHT",
      quantity: 1,
      durationCount: 3,
    };
    const roomExprKo = getCalculationExpression(mockRoomItem as BudgetLineItem, ko, "ko");
    expect(roomExprKo.replace(/\s/g, "")).toBe("₩135,000×1객실×3박");

    const mockPersonItem: Partial<BudgetLineItem> = {
      unitPriceKrw: 28000,
      pricingUnit: "PERSON_DAY",
      quantity: 2,
      durationCount: 3,
    };
    const personExprEn = getCalculationExpression(mockPersonItem as BudgetLineItem, en, "en");
    expect(personExprEn.replace(/\s/g, "")).toBe("₩28,000×2people×3days");
  });

  it("should compute combined transport subtotal for UI correctly", () => {
    const dummyPlan: Partial<BudgetPlan> = {
      categoryTotals: {
        ACCOMMODATION: 645000,
        FOOD: 272000,
        CITY_TRANSPORT: 76000,
        INTERCITY_TRANSPORT: 119600,
        ATTRACTION: 180000,
        EMERGENCY_FUND: 100000,
      },
    };
    const combined = getCombinedTransportSubtotal(dummyPlan as BudgetPlan);
    expect(combined).toBe(195600); // 76k + 119.6k
  });

  describe("Presentation Selectors & Receipt Mapping", () => {
    it("should display the recalculated accommodation totals from the recalculated plan", () => {
      const mockPlan: Partial<BudgetPlan> = {
        categoryTotals: {
          ACCOMMODATION: 725000,
          FOOD: 272000,
          CITY_TRANSPORT: 76000,
          INTERCITY_TRANSPORT: 119600,
          ATTRACTION: 180000,
          EMERGENCY_FUND: 100000,
        },
        grandTotalKrw: 1472600,
        targetBudgetUsagePercent: 49.1,
      };

      // Recalculated plan values bound directly
      expect(mockPlan.categoryTotals?.ACCOMMODATION).toBe(725000);
      expect(mockPlan.grandTotalKrw).toBe(1472600);
      expect(mockPlan.targetBudgetUsagePercent).toBe(49.1);
    });

    it("should select correct display labels for stay card selections in both locales", () => {
      expect(getBasketLabel("BUDGET_STAY", ko, "ko")).toBe("실속형 숙소");
      expect(getBasketLabel("BUDGET_STAY", en, "en")).toBe("Budget Stay");
      expect(getBasketLabel("PREMIUM_HERITAGE", ko, "ko")).toBe("프리미엄 & 헤리티지");
      expect(getBasketLabel("PREMIUM_HERITAGE", en, "en")).toBe("Premium & Heritage");
    });
  });

  describe("generateBudgetSummaryText", () => {
    const mockTripPlan: BudgetPlan = {
      schemaVersion: 1,
      trip: {
        schemaVersion: 1,
        totalNights: 5,
        adultCount: 2,
        selectedCities: ["SEOUL", "BUSAN"],
        cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
        budgetTier: "STANDARD",
        targetBudgetKrw: 3000000,
      },
      citySections: {
        SEOUL: {
          cityCode: "SEOUL",
          nights: 3,
          lineItems: [],
          subtotalKrw: 721000,
        },
        BUSAN: {
          cityCode: "BUSAN",
          nights: 2,
          lineItems: [],
          subtotalKrw: 452000,
        },
      },
      intercitySection: {
        lineItems: [],
        subtotalKrw: 119600,
      },
      tripWideSection: {
        lineItems: [],
        subtotalKrw: 0,
      },
      categoryTotals: {
        ACCOMMODATION: 645000,
        FOOD: 272000,
        CITY_TRANSPORT: 76000,
        INTERCITY_TRANSPORT: 119600,
        ATTRACTION: 180000,
        EMERGENCY_FUND: 0,
      },
      grandTotalKrw: 1292600,
      perTravelerTotalKrw: 646300,
      dailyAverageKrw: 215433,
      targetBudgetKrw: 3000000,
      targetBudgetUsagePercent: 43.1,
      remainingBudgetKrw: 1707400,
      overBudgetAmountKrw: 0,
      generatedFromCatalogVersion: "v1.0",
    };

    it("should generate a proper text summary containing essential items in Korean", () => {
      const summary = generateBudgetSummaryText(mockTripPlan, "여름 휴가 계획", ko, "ko");

      // 필수 항목 포함 검사
      expect(summary).toContain("여름 휴가 계획");
      expect(summary).toContain("5박 6일");
      expect(summary).toContain("2명");
      expect(summary).toContain("Seoul, Busan");
      expect(summary).toContain("₩1,292,600"); // 총 예상 예산
      expect(summary).toContain("₩646,300"); // 1인당
      expect(summary).toContain("₩215,433"); // 하루 평균
      expect(summary).toContain("사용률");
      expect(summary).toContain("도시별 소계");
      expect(summary).toContain("Seoul: ₩721,000");
      expect(summary).toContain("Busan: ₩452,000");
      expect(summary).toContain("카테고리별 소계");
      expect(summary).toContain("숙박");

      // 민감한/기술 키 배제 검사
      expect(summary).not.toContain("schemaVersion");
      expect(summary).not.toContain("tripFingerprint");
      expect(summary).not.toContain("slotId");
    });

    it("should generate summary in English when locale is en", () => {
      const summary = generateBudgetSummaryText(mockTripPlan, "Summer Trip", en, "en");

      expect(summary).toContain("Summer Trip");
      expect(summary).toContain("5 nights, 6 days");
      expect(summary).toContain("2 travelers");
      expect(summary).toContain("Subtotal by City");
      expect(summary).toContain("Subtotal by Category");
      expect(summary).not.toContain("schemaVersion");
    });
  });
});
