import { describe, it, expect } from "vitest";
import { TripDraft, ensureTripStops, SupportedCity } from "../../../lib/trip-domain";
import {
  savePlannerPreferences,
  parsePlannerPreferences,
  generateTripFingerprint,
} from "../../../lib/storage-helper";
import { calculateTripBudgetSummary } from "../calculations/trip-budget-calculator";
import { PlannerPreferences, FoodBasketItemSelection } from "../domain/types";

describe("추가 도시 음식 선택 격리 및 예산 리포트 영수증 정합성 검증", () => {
  const baseDraft: TripDraft = {
    schemaVersion: 1,
    totalNights: 4,
    adultCount: 2,
    selectedCities: ["SEOUL", "GANGNEUNG"],
    cityNightAllocations: {
      SEOUL: 2,
      GANGNEUNG: 2,
    },
    budgetTier: "STANDARD",
    targetBudgetKrw: 2000000,
  };

  const stops = ensureTripStops(baseDraft);
  const seoulStop = stops[0];
  const gangneungStop = stops[1];

  it("1. 추가 도시의 음식이 1차 도시로 흡수되지 않고 세션 스토리지 파싱 후에도 보존되어야 함", () => {
    // 서울에는 삼겹살 2개, 강릉에는 초당순두부 2개
    const seoulFood: FoodBasketItemSelection[] = [
      { foodId: "nat_samgyeopsal", quantity: 2, cityCode: "SEOUL" },
    ];
    const gangneungFood: FoodBasketItemSelection[] = [
      { foodId: "gangneung_chodang_sundubu", quantity: 2, cityCode: "GANGNEUNG" },
    ];

    const prefsToSave: PlannerPreferences = {
      schemaVersion: 5,
      tripFingerprint: generateTripFingerprint(baseDraft),
      accommodationByCity: {
        [seoulStop.id]: { kind: "TIER", basketId: "STANDARD_HOTEL" },
        [gangneungStop.id]: { kind: "TIER", basketId: "STANDARD_HOTEL" },
      },
      foodBasketSelectionsByStop: {
        [seoulStop.id]: seoulFood,
        [gangneungStop.id]: gangneungFood,
      },
      foodBasketSelections: [...seoulFood, ...gangneungFood],
      attractionSelectionsByStop: {
        [seoulStop.id]: { selectedCourseIds: [], individualSpotIds: ["gyeongbokgung"] },
        [gangneungStop.id]: { selectedCourseIds: [], individualSpotIds: ["anmok_beach"] },
      },
      attractionSelections: {},
      foodOverrides: {},
      addOnSelections: {},
      attractionByCity: {},
    };

    const rawJson = JSON.stringify({
      schemaVersion: 5,
      savedAt: new Date().toISOString(),
      preferences: prefsToSave,
    });

    // parsePlannerPreferences로 복원
    const restored = parsePlannerPreferences(rawJson, baseDraft);
    expect(restored.status).toBe("valid");

    // 핵심 검증: foodBasketSelectionsByStop 및 attractionSelectionsByStop이 소실되지 않고 완벽히 복원되는지
    expect(restored.preferences.foodBasketSelectionsByStop).toBeDefined();
    expect(restored.preferences.foodBasketSelectionsByStop?.[gangneungStop.id]).toHaveLength(1);
    expect(restored.preferences.foodBasketSelectionsByStop?.[gangneungStop.id][0].foodId).toBe("gangneung_chodang_sundubu");

    expect(restored.preferences.attractionSelectionsByStop).toBeDefined();
    expect(restored.preferences.attractionSelectionsByStop?.[gangneungStop.id].individualSpotIds).toContain("anmok_beach");
  });

  it("2. 예산 계산 및 여행 영수증(stopBreakdown)에서 추가 도시의 음식, 숙소, 관광이 정확히 분리 계산되어야 함", () => {
    const seoulFood: FoodBasketItemSelection[] = [
      { foodId: "nat_samgyeopsal", quantity: 2, cityCode: "SEOUL" },
    ];
    const gangneungFood: FoodBasketItemSelection[] = [
      { foodId: "gangneung_chodang_sundubu", quantity: 2, cityCode: "GANGNEUNG" },
    ];

    const preferences: PlannerPreferences = {
      schemaVersion: 5,
      tripFingerprint: generateTripFingerprint(baseDraft),
      accommodationByCity: {
        [seoulStop.id]: { kind: "TIER", basketId: "STANDARD_HOTEL" },
        [gangneungStop.id]: { kind: "TIER", basketId: "STANDARD_HOTEL" },
      },
      foodBasketSelectionsByStop: {
        [seoulStop.id]: seoulFood,
        [gangneungStop.id]: gangneungFood,
      },
      foodBasketSelections: [...seoulFood, ...gangneungFood],
      attractionSelectionsByStop: {
        [seoulStop.id]: { selectedCourseIds: [], individualSpotIds: ["gyeongbokgung"] },
        [gangneungStop.id]: { selectedCourseIds: [], individualSpotIds: [] },
      },
      attractionSelections: {},
      foodOverrides: {},
      addOnSelections: {},
      attractionByCity: {},
    };

    const summary = calculateTripBudgetSummary(baseDraft, preferences, [], "ko", {});

    expect(summary.stopBreakdown).toHaveLength(2);

    const seoulBreakdown = summary.stopBreakdown[0];
    const gangneungBreakdown = summary.stopBreakdown[1];

    // 서울 정차지 검증
    expect(seoulBreakdown.city).toBe("SEOUL");
    expect(seoulBreakdown.foodTotalKrw).toBeGreaterThan(0);
    expect(seoulBreakdown.foodBasketPlan?.selectedItems).toHaveLength(1);
    expect(seoulBreakdown.foodBasketPlan?.selectedItems[0].food.id).toBe("nat_samgyeopsal");

    // 강릉(추가 도시) 정차지 검증: 서울 음식으로 덮어씌워지지 않고 강릉의 순두부만 독립 계산되어야 함
    expect(gangneungBreakdown.city).toBe("GANGNEUNG");
    expect(gangneungBreakdown.foodTotalKrw).toBeGreaterThan(0);
    expect(gangneungBreakdown.foodBasketPlan?.selectedItems).toHaveLength(1);
    expect(gangneungBreakdown.foodBasketPlan?.selectedItems[0].food.id).toBe("gangneung_chodang_sundubu");

    // 숙소도 서울과 강릉 모두 정상 계산되어야 함
    expect(seoulBreakdown.hasStay).toBe(true);
    expect(gangneungBreakdown.hasStay).toBe(true);
    expect(gangneungBreakdown.stayTotalKrw).toBeGreaterThan(0);
  });
});
