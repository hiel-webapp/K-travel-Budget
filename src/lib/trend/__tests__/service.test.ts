import { describe, it, expect } from "vitest";
import { listTrends, getPersonalizedTrendRecommendations } from "../service";
import { TripDraft } from "../../trip-domain";
import { PlannerPreferences } from "../../../features/budget/domain/types";
import { generateInitialBudgetPlan } from "../../../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../../../features/budget/catalog/mock-catalog";

describe("Trend Service & Personalized Recommendation Engine", () => {
  const mockDraft: TripDraft = {
    schemaVersion: 1,
    selectedCities: ["SEOUL", "BUSAN"],
    adultCount: 2,
    cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
    totalNights: 5,
    budgetTier: "STANDARD",
    targetBudgetKrw: 2000000,
  };

  const mockPreferences: PlannerPreferences = {
    schemaVersion: 1,
    tripFingerprint: "mock-fingerprint",
    accommodationByCity: { SEOUL: "STANDARD_HOTEL", BUSAN: "STANDARD_HOTEL" },
    foodOverrides: {},
    addOnSelections: {},
    attractionByCity: { SEOUL: "BALANCED", BUSAN: "BALANCED" },
    emergencyFundKrw: 100000,
  };

  it("should list trends filtered by city", () => {
    const allTrends = listTrends({ city: "ALL" });
    const seoulTrends = listTrends({ city: "SEOUL" });

    expect(allTrends.length).toBeGreaterThan(0);
    expect(seoulTrends.every((t) => t.city === "SEOUL" || t.city === "ALL")).toBe(true);
  });

  it("should generate personalized trend recommendations based on draft & saved places", () => {
    const recs = getPersonalizedTrendRecommendations({
      draft: mockDraft,
      preferences: mockPreferences,
      savedPlaceIds: ["seoul-popup-1", "seoul-cafe-1"],
      locale: "ko",
    });

    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(3);
    expect(recs[0]).toHaveProperty("trend");
    expect(recs[0]).toHaveProperty("reason");
    expect(typeof recs[0].reason).toBe("string");
  });

  it("should safely handle empty saved places without throwing errors", () => {
    const recs = getPersonalizedTrendRecommendations({
      draft: mockDraft,
      preferences: mockPreferences,
      savedPlaceIds: [],
      locale: "en",
    });

    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it("should return empty array gracefully when draft is invalid", () => {
    const invalidDraft = { ...mockDraft, selectedCities: [] };
    const recs = getPersonalizedTrendRecommendations({
      draft: invalidDraft,
      preferences: mockPreferences,
      savedPlaceIds: [],
      locale: "ko",
    });

    expect(recs).toEqual([]);
  });

  it("should ensure Budget Engine calculation results remain completely unchanged by trend recommendation", () => {
    const planBefore = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG, {
      accommodation: mockPreferences.accommodationByCity,
      food: mockPreferences.foodOverrides,
      foodAddOns: mockPreferences.addOnSelections,
      attraction: mockPreferences.attractionByCity,
    });

    // Run trend recommendation
    getPersonalizedTrendRecommendations({
      draft: mockDraft,
      preferences: mockPreferences,
      savedPlaceIds: ["seoul-popup-1"],
      locale: "ko",
    });

    const planAfter = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG, {
      accommodation: mockPreferences.accommodationByCity,
      food: mockPreferences.foodOverrides,
      foodAddOns: mockPreferences.addOnSelections,
      attraction: mockPreferences.attractionByCity,
    });

    expect(planBefore.grandTotalKrw).toBe(planAfter.grandTotalKrw);
    expect(planBefore.dailyAverageKrw).toBe(planAfter.dailyAverageKrw);
    expect(planBefore.perTravelerTotalKrw).toBe(planAfter.perTravelerTotalKrw);
  });
});
