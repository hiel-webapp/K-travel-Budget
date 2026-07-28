import { describe, it, expect } from "vitest";
import { getIntercityFareOptions } from "../../../lib/transport/intercity-fares";
import { generateInitialBudgetPlan } from "../calculations/engine";
import { MOCK_PRICE_CATALOG } from "../catalog/mock-catalog";
import { TripDraft } from "../../../lib/trip-domain";

describe("2-Tier Transport System Unit Tests", () => {
  it("should return valid intercity fares for Seoul to Busan", () => {
    const fares = getIntercityFareOptions("SEOUL", "BUSAN");
    expect(fares).toBeDefined();
    expect(fares.length).toBeGreaterThanOrEqual(2);
    expect(fares[0].mode).toBe("KTX");
    expect(fares[0].oneWayPriceKrw).toBe(59800);
  });

  it("should return valid intercity fares for Seoul to Suwon (reverse/fallback)", () => {
    const fares = getIntercityFareOptions("SUWON", "SEOUL");
    expect(fares).toBeDefined();
    expect(fares[0].oneWayPriceKrw).toBe(8400);
  });

  it("should calculate city transport line items correctly in multi-city trip", () => {
    const draft: TripDraft = {
      schemaVersion: 1,
      totalNights: 5,
      adultCount: 2,
      selectedCities: ["SEOUL", "BUSAN"],
      cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
      budgetTier: "STANDARD",
      targetBudgetKrw: 2000000,
    };

    const plan = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG, {});
    const seoulTransport = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "CITY_TRANSPORT");
    const busanTransport = plan.citySections.BUSAN?.lineItems.find((i) => i.category === "CITY_TRANSPORT");

    expect(seoulTransport).toBeDefined();
    expect(busanTransport).toBeDefined();
    expect(plan.intercitySection.lineItems.length).toBeGreaterThan(0);
  });
});
