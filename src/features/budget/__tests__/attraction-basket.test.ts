import { describe, it, expect } from "vitest";
import { generateInitialBudgetPlan } from "../calculations/engine";
import { MOCK_PRICE_CATALOG } from "../catalog/mock-catalog";
import { TripDraft } from "../../../lib/trip-domain";

describe("Attraction Kiosk Basket Unit Tests", () => {
  const sampleDraft: TripDraft = {
    schemaVersion: 1,
    totalNights: 3,
    adultCount: 2,
    selectedCities: ["SEOUL"],
    cityNightAllocations: { SEOUL: 3 },
    budgetTier: "STANDARD",
    targetBudgetKrw: 1500000,
  };

  it("should calculate default attraction budget for standard tier", () => {
    const plan = generateInitialBudgetPlan(sampleDraft, MOCK_PRICE_CATALOG, {});
    const attractionItem = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ATTRACTION");
    expect(attractionItem).toBeDefined();
    expect(attractionItem?.basketId).toBe("BALANCED");
    expect(attractionItem?.unitPriceKrw).toBe(30000);
    expect(attractionItem?.lineTotalKrw).toBe(30000 * 2 * 3); // 2 adults, 3 nights = 180,000
  });

  it("should update attraction budget when preset/basket choice changes", () => {
    const plan = generateInitialBudgetPlan(sampleDraft, MOCK_PRICE_CATALOG, {
      attraction: {
        SEOUL: "MOSTLY_FREE",
      },
    });

    const attractionItem = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ATTRACTION");
    expect(attractionItem?.basketId).toBe("MOSTLY_FREE");
    expect(attractionItem?.unitPriceKrw).toBe(10000);
    expect(attractionItem?.lineTotalKrw).toBe(10000 * 2 * 3); // 2 adults, 3 nights = 60,000
  });
});
