import { describe, it, expect } from "vitest";
import { generateInitialBudgetPlan } from "../calculations/engine";
import { MOCK_PRICE_CATALOG } from "../catalog/mock-catalog";
import { TripDraft } from "../../../lib/trip-domain";
import { AccommodationSelection } from "../domain/types";

describe("Accommodation Place Override Engine Tests", () => {
  const sampleDraft: TripDraft = {
    schemaVersion: 1,
    totalNights: 3,
    adultCount: 2,
    selectedCities: ["SEOUL"],
    cityNightAllocations: { SEOUL: 3 },
    budgetTier: "STANDARD",
    targetBudgetKrw: 1500000,
  };

  it("should calculate standard tier average accommodation when no override is present", () => {
    const plan = generateInitialBudgetPlan(sampleDraft, MOCK_PRICE_CATALOG, {});
    const seoulAccItem = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ACCOMMODATION");
    expect(seoulAccItem).toBeDefined();
    expect(seoulAccItem?.basketId).toBe("STANDARD_HOTEL");
    expect(seoulAccItem?.unitPriceKrw).toBe(135000);
    expect(seoulAccItem?.lineTotalKrw).toBe(135000 * 3);
  });

  it("should prioritize PLACE override over TIER average when PLACE override is passed", () => {
    const placeOverride: AccommodationSelection = {
      kind: "PLACE",
      placeId: "place_lotte_hotel_seoul",
      basketId: "PREMIUM_HERITAGE",
      nightlyPriceKrw: 220000,
      priceSource: "VERIFIED_AVERAGE",
      placeNameKo: "서울 롯데호텔",
      placeNameEn: "Lotte Hotel Seoul",
      snapshotAt: new Date().toISOString(),
    };

    const plan = generateInitialBudgetPlan(sampleDraft, MOCK_PRICE_CATALOG, {
      accommodation: {
        SEOUL: placeOverride,
      },
    });

    const seoulAccItem = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ACCOMMODATION");
    expect(seoulAccItem).toBeDefined();
    expect(seoulAccItem?.unitPriceKrw).toBe(220000);
    expect(seoulAccItem?.lineTotalKrw).toBe(220000 * 3);
    expect(seoulAccItem?.sourceLabel).toBe("서울 롯데호텔");
    expect(seoulAccItem?.confidence).toBe("VERIFIED_AVERAGE");
  });

  it("should revert to TIER average when override is removed", () => {
    const planWithOverride = generateInitialBudgetPlan(sampleDraft, MOCK_PRICE_CATALOG, {
      accommodation: {
        SEOUL: {
          kind: "PLACE",
          placeId: "place_123",
          basketId: "STANDARD_HOTEL",
          nightlyPriceKrw: 300000,
          priceSource: "OFFICIAL",
          placeNameKo: "특급 호텔",
          placeNameEn: "Luxury Hotel",
          snapshotAt: new Date().toISOString(),
        },
      },
    });

    expect(planWithOverride.citySections.SEOUL?.lineItems[0].unitPriceKrw).toBe(300000);

    const planReverted = generateInitialBudgetPlan(sampleDraft, MOCK_PRICE_CATALOG, {
      accommodation: {
        SEOUL: undefined,
      },
    });

    expect(planReverted.citySections.SEOUL?.lineItems[0].unitPriceKrw).toBe(135000);
  });
});
