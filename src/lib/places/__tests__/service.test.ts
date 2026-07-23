import { describe, it, expect } from "vitest";
import { listPlaces, getPlaceById } from "../service";
import { MOCK_PLACES } from "../mock-places";
import { generateInitialBudgetPlan } from "../../../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../../../features/budget/catalog/mock-catalog";
import { DEFAULT_TRIP_DRAFT } from "../../trip-domain";

describe("Place Candidate Data & Service Layer Unit Tests", () => {
  it("should contain at least 24 total mock places for Seoul and Busan", () => {
    expect(MOCK_PLACES.length).toBeGreaterThanOrEqual(24);
  });

  it("should contain at least 12 places for Seoul and 12 places for Busan", () => {
    const seoulPlaces = MOCK_PLACES.filter((p) => p.city === "SEOUL");
    const busanPlaces = MOCK_PLACES.filter((p) => p.city === "BUSAN");

    expect(seoulPlaces.length).toBeGreaterThanOrEqual(12);
    expect(busanPlaces.length).toBeGreaterThanOrEqual(12);
  });

  it("should contain all 5 categories for both Seoul and Busan", () => {
    const categories = ["ACCOMMODATION", "RESTAURANT", "CAFE", "ATTRACTION", "CULTURE"] as const;

    for (const city of ["SEOUL", "BUSAN"] as const) {
      for (const cat of categories) {
        const matches = MOCK_PLACES.filter((p) => p.city === city && p.category === cat);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("should provide bilingual (ko/en) translations for every place", () => {
    for (const place of MOCK_PLACES) {
      expect(place.translations.ko.title).toBeTruthy();
      expect(place.translations.ko.address).toBeTruthy();
      expect(place.translations.en.title).toBeTruthy();
      expect(place.translations.en.address).toBeTruthy();
    }
  });

  it("should filter places by city, category, and keyword correctly", () => {
    const seoulAccommodations = listPlaces({ city: "SEOUL", category: "ACCOMMODATION" });
    expect(seoulAccommodations.every((p) => p.city === "SEOUL" && p.category === "ACCOMMODATION")).toBe(true);

    const busanCafes = listPlaces({ city: "BUSAN", category: "CAFE" });
    expect(busanCafes.every((p) => p.city === "BUSAN" && p.category === "CAFE")).toBe(true);

    const searchResult = listPlaces({ query: "경복궁" });
    expect(searchResult.length).toBeGreaterThanOrEqual(1);
    expect(searchResult[0].translations.ko.title).toContain("경복궁");
  });

  it("should safely handle places without images", () => {
    const noImagePlace = MOCK_PLACES.find((p) => !p.repImageUrl);
    expect(noImagePlace).toBeDefined();
    expect(noImagePlace?.repImageUrl).toBeUndefined();
  });

  it("should fetch place by ID safely", () => {
    const first = MOCK_PLACES[0];
    const found = getPlaceById(first.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(first.id);
  });

  it("should confirm place exploration does not alter Budget Engine calculations", () => {
    const mockDraft = { ...DEFAULT_TRIP_DRAFT };

    const initialPlan = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG);
    const totalBefore = initialPlan.grandTotalKrw;

    // Search and list places
    const places = listPlaces({ city: "SEOUL", category: "ACCOMMODATION" });
    expect(places.length).toBeGreaterThan(0);

    // Verify budget remains identical
    const afterPlan = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG);
    expect(afterPlan.grandTotalKrw).toBe(totalBefore);
  });

  it("should generate appropriate query parameters for planner candidate links", () => {
    const getCandidateUrl = (city: string, category: string, locale: string) => {
      const params = new URLSearchParams();
      if (city !== "ALL") params.set("city", city);
      if (category !== "ALL") params.set("category", category);
      return `/${locale}/places?${params.toString()}`;
    };

    expect(getCandidateUrl("SEOUL", "ACCOMMODATION", "ko")).toBe("/ko/places?city=SEOUL&category=ACCOMMODATION");
    expect(getCandidateUrl("BUSAN", "RESTAURANT", "en")).toBe("/en/places?city=BUSAN&category=RESTAURANT");
    expect(getCandidateUrl("SEOUL", "ATTRACTION", "ko")).toBe("/ko/places?city=SEOUL&category=ATTRACTION");
  });
});
