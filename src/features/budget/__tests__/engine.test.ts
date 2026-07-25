import { describe, it, expect } from "vitest";
import { generateInitialBudgetPlan, generateBaseMealPlan } from "../calculations/engine";
import { TripDraft } from "../../../lib/trip-domain";
import { MOCK_PRICE_CATALOG } from "../catalog/mock-catalog";
import { BudgetBasketDefinition, BudgetBasketId } from "../domain/types";

describe("Budget Calculation Engine - MVP Alignment", () => {
  const defaultTrip: TripDraft = {
    totalNights: 5,
    adultCount: 2,
    selectedCities: ["SEOUL", "BUSAN"],
    cityNightAllocations: {
      SEOUL: 3,
      BUSAN: 2,
    },
    budgetTier: "STANDARD",
    targetBudgetKrw: 3000000,
    schemaVersion: 1,
  };

  describe("1. Default Approved Calculation (Standard 5-Nights, 2 Adults, 1 Room)", () => {
    const plan = generateInitialBudgetPlan(defaultTrip);

    it("should calculate correct line items for Seoul section", () => {
      const seoulSection = plan.citySections.SEOUL;
      expect(seoulSection).not.toBeNull();

      // Accommodation: 135k * 1 room * 3 nights = 405,000
      const acc = seoulSection!.lineItems.find((item) => item.category === "ACCOMMODATION");
      expect(acc?.lineTotalKrw).toBe(405000);
      expect(acc?.quantity).toBe(1); // Exactly 1 room MVP rule

      // Food: 28k * 2 adults * 3 nights = 168,000
      const food = seoulSection!.lineItems.find((item) => item.category === "FOOD");
      expect(food?.lineTotalKrw).toBe(168000);

      // City Transport: 8k * 2 adults * 3 nights = 48,000
      const trans = seoulSection!.lineItems.find((item) => item.category === "CITY_TRANSPORT");
      expect(trans?.lineTotalKrw).toBe(48000);

      // Attractions: 50k * 2 adults = 100,000
      const attr = seoulSection!.lineItems.find((item) => item.category === "ATTRACTION");
      expect(attr?.lineTotalKrw).toBe(100000);

      // Seoul Subtotal: 405k + 168k + 48k + 100k = 721,000
      expect(seoulSection!.subtotalKrw).toBe(721000);
    });

    it("should calculate correct line items for Busan section", () => {
      const busanSection = plan.citySections.BUSAN;
      expect(busanSection).not.toBeNull();

      // Accommodation: 120k * 1 room * 2 nights = 240,000
      const acc = busanSection!.lineItems.find((item) => item.category === "ACCOMMODATION");
      expect(acc?.lineTotalKrw).toBe(240000);
      expect(acc?.quantity).toBe(1); // Exactly 1 room MVP rule

      // Food: 26k * 2 adults * 2 nights = 104,000
      const food = busanSection!.lineItems.find((item) => item.category === "FOOD");
      expect(food?.lineTotalKrw).toBe(104000);

      // City Transport: 7k * 2 adults * 2 nights = 28,000
      const trans = busanSection!.lineItems.find((item) => item.category === "CITY_TRANSPORT");
      expect(trans?.lineTotalKrw).toBe(28000);

      // Attractions: 40k * 2 adults = 80,000
      const attr = busanSection!.lineItems.find((item) => item.category === "ATTRACTION");
      expect(attr?.lineTotalKrw).toBe(80000);

      // Busan Subtotal: 240k + 104k + 28k + 80k = 452,000
      expect(busanSection!.subtotalKrw).toBe(452000);
    });

    it("should calculate correct intercity transportation", () => {
      // KTX: 59,800 * 2 adults * 1 trip = 119,600
      expect(plan.categoryTotals.INTERCITY_TRANSPORT).toBe(119600);
      expect(plan.intercitySection.subtotalKrw).toBe(119600);
      expect(plan.intercitySection.lineItems.length).toBe(1);
    });

    it("should calculate correct emergency fund", () => {
      // Emergency Fund: Default 0
      expect(plan.categoryTotals.EMERGENCY_FUND).toBe(0);
      expect(plan.tripWideSection.subtotalKrw).toBe(0);
    });

    it("should aggregate correct grand total and traveler average indicators", () => {
      // Seoul (721k) + Busan (452k) + KTX (119.6k) + Emergency (0) = 1,292,600
      expect(plan.grandTotalKrw).toBe(1292600);

      // Per traveler: 1,292,600 / 2 = 646,300
      expect(plan.perTravelerTotalKrw).toBe(646300);

      // Daily average: 1,292,600 / 6 days (5 nights + 1) = 215,433
      expect(plan.dailyAverageKrw).toBe(215433);

      // Remaining budget: 3,000,000 - 1,292,600 = 1,707,400
      expect(plan.remainingBudgetKrw).toBe(1707400);
      expect(plan.overBudgetAmountKrw).toBe(0);

      // Target-budget usage: (1,292,600 / 3,000,000) * 100 = 43.1%
      expect(plan.targetBudgetUsagePercent).toBe(43.1);
    });

    it("should use emergencyFundKrw value when it is valid", () => {
      const planWithEmergency = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        emergencyFundKrw: 150000,
      });
      expect(planWithEmergency.categoryTotals.EMERGENCY_FUND).toBe(150000);
      expect(planWithEmergency.tripWideSection.subtotalKrw).toBe(150000);
    });

    it("should default to 0 when emergencyFundKrw is not present, negative, or decimal", () => {
      const planNegative = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        emergencyFundKrw: -100,
      });
      expect(planNegative.categoryTotals.EMERGENCY_FUND).toBe(0);

      const planDecimal = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        emergencyFundKrw: 123.45,
      });
      expect(planDecimal.categoryTotals.EMERGENCY_FUND).toBe(0);

      const planNaN = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        emergencyFundKrw: NaN,
      });
      expect(planNaN.categoryTotals.EMERGENCY_FUND).toBe(0);
    });
  });

  describe("2. Financial Invariants", () => {
    it("should satisfy the Receipt Invariant: City + Intercity + TripWide = Grand Total", () => {
      const plan = generateInitialBudgetPlan(defaultTrip);
      const seoulSub = plan.citySections.SEOUL?.subtotalKrw || 0;
      const busanSub = plan.citySections.BUSAN?.subtotalKrw || 0;
      const intercitySub = plan.intercitySection.subtotalKrw;
      const tripWideSub = plan.tripWideSection.subtotalKrw;

      expect(plan.grandTotalKrw).toBe(seoulSub + busanSub + intercitySub + tripWideSub);
    });

    it("should satisfy the Category Sum Invariant: sum of categoryTotals = Grand Total", () => {
      const plan = generateInitialBudgetPlan(defaultTrip);
      const categorySum = Object.values(plan.categoryTotals).reduce((sum, val) => sum + val, 0);
      expect(plan.grandTotalKrw).toBe(categorySum);
    });

    it("should not mutate the input TripDraft", () => {
      const originalCopy = JSON.parse(JSON.stringify(defaultTrip));
      generateInitialBudgetPlan(defaultTrip);
      expect(defaultTrip).toEqual(originalCopy);
    });

    it("should not mutate the price catalog", () => {
      const originalCatalog = JSON.parse(JSON.stringify(MOCK_PRICE_CATALOG));
      generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG);
      expect(MOCK_PRICE_CATALOG).toEqual(originalCatalog);
    });

    it("should return deeply equivalent results for repeated calls", () => {
      const plan1 = generateInitialBudgetPlan(defaultTrip);
      const plan2 = generateInitialBudgetPlan(defaultTrip);
      expect(plan1).toEqual(plan2);
    });
  });

  describe("3. Single-City Trips", () => {
    it("should omit intercity transportation when only Seoul is selected", () => {
      const trip: TripDraft = {
        ...defaultTrip,
        selectedCities: ["SEOUL"],
        cityNightAllocations: { SEOUL: 5 },
      };
      const plan = generateInitialBudgetPlan(trip);

      expect(plan.citySections.SEOUL).toBeDefined();
      expect(plan.citySections.BUSAN).toBeUndefined();
      expect(plan.categoryTotals.INTERCITY_TRANSPORT).toBe(0);
      expect(plan.intercitySection.lineItems.length).toBe(0);
      expect(plan.tripWideSection.lineItems.length).toBe(1); // Emergency fund must appear exactly once
    });

    it("should omit intercity transportation when only Busan is selected", () => {
      const trip: TripDraft = {
        ...defaultTrip,
        selectedCities: ["BUSAN"],
        cityNightAllocations: { BUSAN: 5 },
      };
      const plan = generateInitialBudgetPlan(trip);

      expect(plan.citySections.SEOUL).toBeUndefined();
      expect(plan.citySections.BUSAN).toBeDefined();
      expect(plan.categoryTotals.INTERCITY_TRANSPORT).toBe(0);
      expect(plan.intercitySection.lineItems.length).toBe(0);
    });
  });

  describe("4. Budget Tiers", () => {
    it("should select BUDGET baskets for BUDGET tier", () => {
      const trip: TripDraft = { ...defaultTrip, budgetTier: "BUDGET" };
      const plan = generateInitialBudgetPlan(trip);

      const seoulAcc = plan.citySections.SEOUL?.lineItems.find((item) => item.category === "ACCOMMODATION");
      expect(seoulAcc?.basketId).toBe("BUDGET_STAY");
      expect(seoulAcc?.unitPriceKrw).toBe(75000); // Seoul Budget Stay
      expect(seoulAcc?.confidence).toBe("MOCK");
    });

    it("should select STANDARD baskets for STANDARD tier", () => {
      const trip: TripDraft = { ...defaultTrip, budgetTier: "STANDARD" };
      const plan = generateInitialBudgetPlan(trip);

      const seoulAcc = plan.citySections.SEOUL?.lineItems.find((item) => item.category === "ACCOMMODATION");
      expect(seoulAcc?.basketId).toBe("STANDARD_HOTEL");
      expect(seoulAcc?.unitPriceKrw).toBe(135000);
    });

    it("should select PREMIUM baskets for PREMIUM tier", () => {
      const trip: TripDraft = { ...defaultTrip, budgetTier: "PREMIUM" };
      const plan = generateInitialBudgetPlan(trip);

      const seoulAcc = plan.citySections.SEOUL?.lineItems.find((item) => item.category === "ACCOMMODATION");
      expect(seoulAcc?.basketId).toBe("PREMIUM_HERITAGE");
      expect(seoulAcc?.unitPriceKrw).toBe(290000);
    });
  });

  describe("5. Over-Budget Computations", () => {
    it("should return remainingBudgetKrw = 0 and calculate correct overBudgetAmount when target is low", () => {
      const trip: TripDraft = { ...defaultTrip, targetBudgetKrw: 1000000 }; // Grand total is 1,292,600
      const plan = generateInitialBudgetPlan(trip);

      expect(plan.remainingBudgetKrw).toBe(0);
      expect(plan.overBudgetAmountKrw).toBe(292600);
      expect(plan.targetBudgetUsagePercent).toBe(129.3); // 129.26% rounded
    });
  });

  describe("6. Intercity Transportation Routing", () => {
    it("should compute SEOUL to BUSAN routing correctly", () => {
      const trip: TripDraft = { ...defaultTrip, selectedCities: ["SEOUL", "BUSAN"] };
      const plan = generateInitialBudgetPlan(trip);
      const intercity = plan.intercitySection.lineItems[0];

      expect(intercity.route).toBe("SEOUL-BUSAN");
      expect(plan.citySections.SEOUL?.lineItems.some((item) => item.category === "INTERCITY_TRANSPORT")).toBe(false);
      expect(plan.citySections.BUSAN?.lineItems.some((item) => item.category === "INTERCITY_TRANSPORT")).toBe(false);
    });

    it("should compute BUSAN to SEOUL routing correctly", () => {
      const trip: TripDraft = {
        ...defaultTrip,
        selectedCities: ["BUSAN", "SEOUL"],
        cityNightAllocations: { BUSAN: 3, SEOUL: 2 },
      };
      const plan = generateInitialBudgetPlan(trip);
      const intercity = plan.intercitySection.lineItems[0];

      expect(intercity.route).toBe("BUSAN-SEOUL");
      expect(intercity.lineTotalKrw).toBe(119600); // Route reverse lookup fallback
    });
  });

  describe("7. Invalid Inputs Validation", () => {
    it("should throw error for zero or negative adult counts", () => {
      expect(() => generateInitialBudgetPlan({ ...defaultTrip, adultCount: 0 })).toThrow();
      expect(() => generateInitialBudgetPlan({ ...defaultTrip, adultCount: -1 })).toThrow();
    });

    it("should throw error for zero nights", () => {
      expect(() => generateInitialBudgetPlan({ ...defaultTrip, totalNights: 0 })).toThrow();
    });

    it("should throw error for empty city lists", () => {
      expect(() => generateInitialBudgetPlan({ ...defaultTrip, selectedCities: [] })).toThrow();
    });

    it("should throw error for duplicate cities in path", () => {
      expect(() =>
        generateInitialBudgetPlan({ ...defaultTrip, selectedCities: ["SEOUL", "SEOUL"] })
      ).toThrow();
    });

    it("should throw error when city allocations do not sum up to total nights", () => {
      expect(() =>
        generateInitialBudgetPlan({
          ...defaultTrip,
          cityNightAllocations: { SEOUL: 1, BUSAN: 2 }, // Total nights is 5
        })
      ).toThrow();
    });

    it("should throw error for negative night allocation", () => {
      expect(() =>
        generateInitialBudgetPlan({
          ...defaultTrip,
          cityNightAllocations: { SEOUL: 6, BUSAN: -1 },
        })
      ).toThrow();
    });

    it("should throw error for zero target budget", () => {
      expect(() => generateInitialBudgetPlan({ ...defaultTrip, targetBudgetKrw: 0 })).toThrow();
    });

    it("should throw error if unknown or inactive catalog item is requested", () => {
      // Inactive catalog test
      const badCatalog: BudgetBasketDefinition[] = MOCK_PRICE_CATALOG.map((item) => {
        if (item.id === "STANDARD_HOTEL" && item.applicableCity === "SEOUL") {
          return { ...item, isActive: false };
        }
        return item;
      });

      expect(() => generateInitialBudgetPlan(defaultTrip, badCatalog)).toThrow();
    });
  });

  describe("8. Accommodation Overrides System - Scenarios & Invariants", () => {
    it("should match approved Default scenario when no overrides are applied", () => {
      const plan = generateInitialBudgetPlan(defaultTrip);

      const seoulAcc = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ACCOMMODATION");
      const busanAcc = plan.citySections.BUSAN?.lineItems.find((i) => i.category === "ACCOMMODATION");

      expect(seoulAcc?.basketId).toBe("STANDARD_HOTEL");
      expect(seoulAcc?.lineTotalKrw).toBe(405000); // 135k * 3 nights
      expect(busanAcc?.basketId).toBe("STANDARD_HOTEL");
      expect(busanAcc?.lineTotalKrw).toBe(240000); // 120k * 2 nights

      expect(plan.categoryTotals.ACCOMMODATION).toBe(645000);
      expect(plan.grandTotalKrw).toBe(1292600);
    });

    it("should match approved Scenario A: Seoul Budget stay only", () => {
      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: {
          SEOUL: "BUDGET_STAY",
        },
      });

      const seoulAcc = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ACCOMMODATION");
      const busanAcc = plan.citySections.BUSAN?.lineItems.find((i) => i.category === "ACCOMMODATION");

      expect(seoulAcc?.basketId).toBe("BUDGET_STAY");
      expect(seoulAcc?.lineTotalKrw).toBe(225000); // 75k * 3 nights
      expect(busanAcc?.basketId).toBe("STANDARD_HOTEL");
      expect(busanAcc?.lineTotalKrw).toBe(240000); // 120k * 2 nights

      expect(plan.categoryTotals.ACCOMMODATION).toBe(465000);
      expect(plan.citySections.SEOUL?.subtotalKrw).toBe(541000);
      expect(plan.citySections.BUSAN?.subtotalKrw).toBe(452000);
      expect(plan.intercitySection.subtotalKrw).toBe(119600);
      expect(plan.tripWideSection.subtotalKrw).toBe(0);

      expect(plan.grandTotalKrw).toBe(1112600);
      expect(plan.perTravelerTotalKrw).toBe(556300);
      expect(plan.dailyAverageKrw).toBe(185433);
      expect(plan.remainingBudgetKrw).toBe(1887400);
      expect(plan.targetBudgetUsagePercent).toBe(37.1);
    });

    it("should match approved Scenario B: Busan Premium stay only", () => {
      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: {
          BUSAN: "PREMIUM_HERITAGE",
        },
      });

      const seoulAcc = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ACCOMMODATION");
      const busanAcc = plan.citySections.BUSAN?.lineItems.find((i) => i.category === "ACCOMMODATION");

      expect(seoulAcc?.basketId).toBe("STANDARD_HOTEL");
      expect(seoulAcc?.lineTotalKrw).toBe(405000);
      expect(busanAcc?.basketId).toBe("PREMIUM_HERITAGE");
      expect(busanAcc?.lineTotalKrw).toBe(500000); // 250k * 2 nights

      expect(plan.categoryTotals.ACCOMMODATION).toBe(905000);
      expect(plan.citySections.SEOUL?.subtotalKrw).toBe(721000);
      expect(plan.citySections.BUSAN?.subtotalKrw).toBe(712000);
      expect(plan.intercitySection.subtotalKrw).toBe(119600);
      expect(plan.tripWideSection.subtotalKrw).toBe(0);

      expect(plan.grandTotalKrw).toBe(1552600);
      expect(plan.perTravelerTotalKrw).toBe(776300);
      expect(plan.dailyAverageKrw).toBe(258767);
      expect(plan.remainingBudgetKrw).toBe(1447400);
      expect(plan.targetBudgetUsagePercent).toBe(51.8);
    });

    it("should match approved Scenario C: Seoul Budget and Busan Premium stay combined", () => {
      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: {
          SEOUL: "BUDGET_STAY",
          BUSAN: "PREMIUM_HERITAGE",
        },
      });

      expect(plan.categoryTotals.ACCOMMODATION).toBe(725000);
      expect(plan.citySections.SEOUL?.subtotalKrw).toBe(541000);
      expect(plan.citySections.BUSAN?.subtotalKrw).toBe(712000);
      expect(plan.intercitySection.subtotalKrw).toBe(119600);
      expect(plan.tripWideSection.subtotalKrw).toBe(0);

      expect(plan.grandTotalKrw).toBe(1372600);
      expect(plan.perTravelerTotalKrw).toBe(686300);
      expect(plan.dailyAverageKrw).toBe(228767);
      expect(plan.remainingBudgetKrw).toBe(1627400);
      expect(plan.targetBudgetUsagePercent).toBe(45.8);
    });

    it("should apply accommodation overrides correctly for Seoul Premium and Busan Budget", () => {
      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: {
          SEOUL: "PREMIUM_HERITAGE",
          BUSAN: "BUDGET_STAY",
        },
      });

      const seoulStay = plan.citySections.SEOUL?.lineItems.find((i) => i.category === "ACCOMMODATION");
      const busanStay = plan.citySections.BUSAN?.lineItems.find((i) => i.category === "ACCOMMODATION");

      expect(seoulStay?.basketId).toBe("PREMIUM_HERITAGE");
      expect(seoulStay?.lineTotalKrw).toBe(870000); // ??90,000 * 3
      expect(busanStay?.basketId).toBe("BUDGET_STAY");
      expect(busanStay?.lineTotalKrw).toBe(130000); // ??5,000 * 2

      expect(plan.categoryTotals.ACCOMMODATION).toBe(1000000);
    });

    it("should preserve all other category totals when accommodation is overridden", () => {
      const defaultPlan = generateInitialBudgetPlan(defaultTrip);
      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: {
          SEOUL: "BUDGET_STAY",
        },
      });

      expect(plan.categoryTotals.FOOD).toBe(defaultPlan.categoryTotals.FOOD);
      expect(plan.categoryTotals.CITY_TRANSPORT).toBe(defaultPlan.categoryTotals.CITY_TRANSPORT);
      expect(plan.categoryTotals.INTERCITY_TRANSPORT).toBe(defaultPlan.categoryTotals.INTERCITY_TRANSPORT);
      expect(plan.categoryTotals.ATTRACTION).toBe(defaultPlan.categoryTotals.ATTRACTION);
      expect(plan.categoryTotals.EMERGENCY_FUND).toBe(defaultPlan.categoryTotals.EMERGENCY_FUND);
    });

    it("should verify that exactly one accommodation item exists per city", () => {
      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: {
          SEOUL: "PREMIUM_HERITAGE",
        },
      });

      const seoulStayItems = plan.citySections.SEOUL?.lineItems.filter((i) => i.category === "ACCOMMODATION") || [];
      const busanStayItems = plan.citySections.BUSAN?.lineItems.filter((i) => i.category === "ACCOMMODATION") || [];

      expect(seoulStayItems.length).toBe(1);
      expect(busanStayItems.length).toBe(1);
    });

    it("should throw error for unknown basket id override", () => {
      expect(() =>
        generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
          accommodation: {
            SEOUL: "UNKNOWN_BASKET_ID" as BudgetBasketId,
          },
        })
      ).toThrow();
    });

    it("should throw error for non-accommodation basket id override", () => {
      expect(() =>
        generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
          accommodation: {
            SEOUL: "KTX_STANDARD",
          },
        })
      ).toThrow();
    });

    it("should safely ignore overrides for cities absent from the trip", () => {
      const plan = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: {
          // @ts-expect-error DAEJEON is unsupported city key
          DAEJEON: "STANDARD_HOTEL",
        },
      });

      expect(plan.grandTotalKrw).toBe(1292600);
    });

    it("should throw error for inactive basket id override", () => {
      const badCatalog: BudgetBasketDefinition[] = MOCK_PRICE_CATALOG.map((item) => {
        if (item.id === "PREMIUM_HERITAGE" && item.applicableCity === "SEOUL") {
          return { ...item, isActive: false };
        }
        return item;
      });

      expect(() =>
        generateInitialBudgetPlan(defaultTrip, badCatalog, {
          accommodation: {
            SEOUL: "PREMIUM_HERITAGE",
          },
        })
      ).toThrow();
    });

    it("should ensure input TripDraft and catalog and override objects are not mutated", () => {
      const tripClone = JSON.parse(JSON.stringify(defaultTrip));
      const catalogClone = JSON.parse(JSON.stringify(MOCK_PRICE_CATALOG));
      const overrideObj = {
        accommodation: {
          SEOUL: "BUDGET_STAY" as BudgetBasketId,
        },
      };

      generateInitialBudgetPlan(tripClone, catalogClone, overrideObj);

      expect(tripClone).toEqual(defaultTrip);
      expect(catalogClone).toEqual(MOCK_PRICE_CATALOG);
      expect(overrideObj.accommodation.SEOUL).toBe("BUDGET_STAY");
    });

    it("should return deeply equivalent results for repeated calls with same overrides", () => {
      const overrides = {
        accommodation: {
          SEOUL: "BUDGET_STAY" as BudgetBasketId,
        },
      };
      const res1 = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, overrides);
      const res2 = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, overrides);

      expect(res1).toEqual(res2);
    });
  });

  describe("9. Mock Price Catalog Quality Validation", () => {
    it("should satisfy catalog metadata requirements", () => {
      for (const entry of MOCK_PRICE_CATALOG) {
        expect(entry.confidence).toBe("MOCK");
        expect(entry.sourceLabel).toBe("MVP Mock Price Catalog");
        expect(entry.priceMinKrw).toBeLessThanOrEqual(entry.representativePriceKrw);
        expect(entry.representativePriceKrw).toBeLessThanOrEqual(entry.priceMaxKrw);

        // Scope validation
        if (["ACCOMMODATION", "FOOD", "CITY_TRANSPORT", "ATTRACTION"].includes(entry.category)) {
          expect(entry.scope).toBe("CITY");
        } else if (entry.category === "INTERCITY_TRANSPORT") {
          expect(entry.scope).toBe("INTERCITY");
        } else if (entry.category === "EMERGENCY_FUND") {
          expect(entry.scope).toBe("TRIP_WIDE");
        }

        // Pricing unit and strategy combination mapping checks
        if (entry.pricingUnit === "ROOM_NIGHT") {
          expect(entry.calculationStrategy).toBe("ROOM_NIGHT");
        } else if (entry.pricingUnit === "PERSON_DAY") {
          expect(entry.calculationStrategy).toBe("PERSON_DAY");
        } else if (entry.pricingUnit === "PERSON_ONE_WAY") {
          expect(entry.calculationStrategy).toBe("PERSON_ONE_WAY");
        } else if (entry.pricingUnit === "PER_PERSON") {
          expect(entry.calculationStrategy).toBe("PER_PERSON_FIXED");
        } else if (entry.pricingUnit === "FIXED_AMOUNT") {
          expect(entry.calculationStrategy).toBe("FIXED_AMOUNT");
        }

        // Date format check (YYYY-MM-DD)
        expect(entry.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it("should ensure no duplicate basket ids exist for the same city/route and category", () => {
      const keys = new Set<string>();
      for (const entry of MOCK_PRICE_CATALOG) {
        const uniqueKey = `${entry.category}_${entry.applicableCity || entry.applicableRoute || "TRIP"}_${entry.id}`;
        expect(keys.has(uniqueKey)).toBe(false);
        keys.add(uniqueKey);
      }
    });
  });

  describe("9. Food Base Meal Plan Engine", () => {
    it("should generate correct symmetric slots based on city nights allocation", () => {
      const seoulPlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const busanPlan = generateBaseMealPlan("BUSAN", 2, "STANDARD");

      // 1. MealSlot 네 종류가 생성되는지 검증
      const expectedSlots = ["BREAKFAST", "LUNCH", "DINNER", "SNACK_CAFE"];
      expectedSlots.forEach((slot) => {
        expect(seoulPlan.slots.some((s) => s.slot === slot)).toBe(true);
        expect(busanPlan.slots.some((s) => s.slot === slot)).toBe(true);
      });

      // 2. 서울 3박은 12개, 부산 2박은 8개 슬롯인지 검증
      expect(seoulPlan.slots.length).toBe(12);
      expect(busanPlan.slots.length).toBe(8);

      // 3. 서울 Meal Plan에 부산 슬롯이 없고 부산 Meal Plan에 서울 슬롯이 없는지 (도시 격리) 검증
      expect(seoulPlan.slots.every((s) => s.city === "SEOUL")).toBe(true);
      expect(busanPlan.slots.every((s) => s.city === "BUSAN")).toBe(true);

      // 4. 도시별 슬롯에 해당 도시 가격표가 적용되는지 검증
      // Standard 등급 기준 서울: Breakfast ₩7k, Lunch ₩9k, Dinner ₩12k, Snack ₩6k
      const firstSeoulBreakfast = seoulPlan.slots.find((s) => s.slot === "BREAKFAST");
      expect(firstSeoulBreakfast?.unitPriceKrw).toBe(7000);
      const firstSeoulSnack = seoulPlan.slots.find((s) => s.slot === "SNACK_CAFE");
      expect(firstSeoulSnack?.unitPriceKrw).toBe(6000);

      // Standard 등급 기준 부산: Breakfast ₩6.5k, Lunch ₩8.5k, Dinner ₩11k, Snack ₩5k
      const firstBusanBreakfast = busanPlan.slots.find((s) => s.slot === "BREAKFAST");
      expect(firstBusanBreakfast?.unitPriceKrw).toBe(6500);
      const firstBusanSnack = busanPlan.slots.find((s) => s.slot === "SNACK_CAFE");
      expect(firstBusanSnack?.unitPriceKrw).toBe(5000);

      // 5. BREAKFAST, LUNCH, DINNER는 includedInBaseBudget=true인지 검증
      seoulPlan.slots.forEach((s) => {
        if (s.slot !== "SNACK_CAFE") {
          expect(s.includedInBaseBudget).toBe(true);
        }
      });

      // 6. SNACK_CAFE는 양수 단가를 가지지만 includedInBaseBudget=false인지 검증
      const snackSlots = seoulPlan.slots.filter((s) => s.slot === "SNACK_CAFE");
      snackSlots.forEach((s) => {
        expect(s.unitPriceKrw).toBeGreaterThan(0);
        expect(s.includedInBaseBudget).toBe(false);
      });

      // 7. 합계가 includedInBaseBudget=true 슬롯만 합산하는지 검증
      // 서울 3박: (7k + 9k + 12k) * 3 = 84,000
      expect(seoulPlan.perPersonBaseTotalKrw).toBe(84000);
      // 부산 2박: (6.5k + 8.5k + 11k) * 2 = 52,000
      expect(busanPlan.perPersonBaseTotalKrw).toBe(52000);
    });

    it("should generate stable, uppercase identifier format for slots", () => {
      const seoulPlan = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const firstSlot = seoulPlan.slots[0];
      expect(firstSlot.id).toBe("SEOUL_0_BREAKFAST");
    });

    it("should verify food line totals, categories, and grand total invariants", () => {
      const plan = generateInitialBudgetPlan(defaultTrip);

      // 8. 서울 1인 합계 ₩84,000, 2인 lineTotal ₩168,000인지 검증
      const seoulFoodItem = plan.citySections.SEOUL?.lineItems.find((item) => item.category === "FOOD");
      expect(seoulFoodItem?.mealPlan?.perPersonBaseTotalKrw).toBe(84000);
      expect(seoulFoodItem?.lineTotalKrw).toBe(168000); // 84,000 * 2명

      // 9. 부산 1인 합계 ₩52,000, 2인 lineTotal ₩104,000인지 검증
      const busanFoodItem = plan.citySections.BUSAN?.lineItems.find((item) => item.category === "FOOD");
      expect(busanFoodItem?.mealPlan?.perPersonBaseTotalKrw).toBe(52000);
      expect(busanFoodItem?.lineTotalKrw).toBe(104000); // 52,000 * 2명

      // 10. 전체 FOOD category total이 ₩272,000인지 검증
      expect(plan.categoryTotals.FOOD).toBe(272000); // 168k + 104k

      // 11. 기본 grand total이 ₩1,292,600인지 검증
      expect(plan.grandTotalKrw).toBe(1292600);

      // 17. 모든 category total 합계가 grand total과 같은지 검증
      const categorySum = Object.values(plan.categoryTotals).reduce((sum, val) => sum + val, 0);
      expect(categorySum).toBe(plan.grandTotalKrw);

      // 18. 모든 도시 소계와 공통 비용 합계가 grand total과 같은지 검증
      const seoulSubtotal = plan.citySections.SEOUL?.subtotalKrw || 0;
      const busanSubtotal = plan.citySections.BUSAN?.subtotalKrw || 0;
      const intercitySubtotal = plan.intercitySection.subtotalKrw;
      const tripWideSubtotal = plan.tripWideSection.subtotalKrw;
      expect(seoulSubtotal + busanSubtotal + intercitySubtotal + tripWideSubtotal).toBe(plan.grandTotalKrw);
    });

    it("should preserve accommodation override scenarios and their grand totals", () => {
      // 12. 숙박 override 네 가지 승인 총액이 유지되는지 검증
      // Scenario A: Default standard
      const planA = generateInitialBudgetPlan(defaultTrip);
      expect(planA.grandTotalKrw).toBe(1292600);

      // Scenario B: Seoul stay override (BUDGET_STAY)
      const planB = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: { SEOUL: "BUDGET_STAY" },
      });
      expect(planB.grandTotalKrw).toBe(1112600);

      // Scenario C: Busan stay override (PREMIUM_HERITAGE)
      const planC = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: { BUSAN: "PREMIUM_HERITAGE" },
      });
      expect(planC.grandTotalKrw).toBe(1552600);

      // Scenario D: Combined stay overrides
      const planD = generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG, {
        accommodation: { SEOUL: "BUDGET_STAY", BUSAN: "PREMIUM_HERITAGE" },
      });
      expect(planD.grandTotalKrw).toBe(1372600);
    });

    it("should handle 0-night edge case input safely", () => {
      // 13. 0박 도시는 Meal Plan 슬롯과 FOOD 금액이 생성되지 않는지 검증
      const zeroNightDraft: TripDraft = {
        ...defaultTrip,
        totalNights: 3,
        cityNightAllocations: { SEOUL: 0, BUSAN: 3 },
      };
      const plan = generateInitialBudgetPlan(zeroNightDraft);
      const seoulFoodItem = plan.citySections.SEOUL?.lineItems.find((item) => item.category === "FOOD");
      expect(seoulFoodItem?.mealPlan?.slots.length).toBe(0);
      expect(seoulFoodItem?.lineTotalKrw).toBe(0);
    });

    it("should verify deterministic pure outputs and immutability of parameters", () => {
      // 14. 입력 TripDraft를 변경하지 않는지 검증
      const draftClone = JSON.parse(JSON.stringify(defaultTrip));
      generateBaseMealPlan("SEOUL", 3, "STANDARD");
      expect(draftClone).toEqual(defaultTrip);

      // 15. 가격 카탈로그를 변경하지 않는지 검증
      const catalogClone = JSON.parse(JSON.stringify(MOCK_PRICE_CATALOG));
      generateInitialBudgetPlan(defaultTrip, MOCK_PRICE_CATALOG);
      expect(MOCK_PRICE_CATALOG).toEqual(catalogClone);

      // 16. 반복 호출 결과가 동일한지 검증
      const res1 = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      const res2 = generateBaseMealPlan("SEOUL", 3, "STANDARD");
      expect(res1).toEqual(res2);
    });
  });
});
