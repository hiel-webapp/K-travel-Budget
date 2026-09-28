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

  it("3. 동일 도시 중복 방문(서울 1차 + 서울 2차 추가) 시 프리셋 음식 보존 및 2차 추가 도시의 음식 독립성 검증", () => {
    const roundDraft: TripDraft = {
      schemaVersion: 1,
      totalNights: 6,
      adultCount: 2,
      selectedCities: ["SEOUL", "BUSAN", "SEOUL"],
      cityNightAllocations: {
        SEOUL: 4,
        BUSAN: 2,
      },
      budgetTier: "STANDARD",
      targetBudgetKrw: 3000000,
    };

    const roundStops = ensureTripStops(roundDraft);
    expect(roundStops).toHaveLength(3);
    const stop1Seoul = roundStops[0];
    const stop2Busan = roundStops[1];
    const stop3Seoul = roundStops[2];

    // 서울 1차: 설렁탕 (1차에만 담김)
    const seoul1Foods: FoodBasketItemSelection[] = [
      { foodId: "seoul_seolleongtang", quantity: 2, cityCode: "SEOUL" },
    ];
    // 서울 2차(+추가): 삼계탕 (2차에만 담김)
    const seoul2Foods: FoodBasketItemSelection[] = [
      { foodId: "nat_samgyetang", quantity: 2, cityCode: "SEOUL" },
    ];
    // 부산: 돼지국밥
    const busanFoods: FoodBasketItemSelection[] = [
      { foodId: "busan_dwaeji_gukbap", quantity: 2, cityCode: "BUSAN" },
    ];

    const preferences: PlannerPreferences = {
      schemaVersion: 5,
      tripFingerprint: generateTripFingerprint(roundDraft),
      accommodationByCity: {
        [stop1Seoul.id]: { kind: "TIER", basketId: "STANDARD_HOTEL" },
        [stop2Busan.id]: { kind: "TIER", basketId: "STANDARD_HOTEL" },
        [stop3Seoul.id]: { kind: "TIER", basketId: "STANDARD_HOTEL" },
      },
      foodBasketSelectionsByStop: {
        [stop1Seoul.id]: seoul1Foods,
        [stop2Busan.id]: busanFoods,
        [stop3Seoul.id]: seoul2Foods,
      },
      foodBasketSelections: [...seoul1Foods, ...busanFoods, ...seoul2Foods],
      attractionSelectionsByStop: {},
      attractionSelections: {},
      foodOverrides: {},
      addOnSelections: {},
      attractionByCity: {},
    };

    const summary = calculateTripBudgetSummary(roundDraft, preferences, [], "ko", {});
    expect(summary.stopBreakdown).toHaveLength(3);

    const s1 = summary.stopBreakdown[0];
    const s2 = summary.stopBreakdown[1];
    const s3 = summary.stopBreakdown[2];

    // 1차 서울: 설렁탕만 1개 항목 존재
    expect(s1.city).toBe("SEOUL");
    expect(s1.foodBasketPlan?.selectedItems).toHaveLength(1);
    expect(s1.foodBasketPlan?.selectedItems[0].food.id).toBe("seoul_seolleongtang");

    // 부산: 돼지국밥만 1개 항목 존재
    expect(s2.city).toBe("BUSAN");
    expect(s2.foodBasketPlan?.selectedItems).toHaveLength(1);
    expect(s2.foodBasketPlan?.selectedItems[0].food.id).toBe("busan_dwaeji_gukbap");

    // 2차 서울: 1차 서울 설렁탕이 섞이지 않고 오직 삼계탕만 1개 항목 존재
    expect(s3.city).toBe("SEOUL");
    expect(s3.foodBasketPlan?.selectedItems).toHaveLength(1);
    expect(s3.foodBasketPlan?.selectedItems[0].food.id).toBe("nat_samgyetang");
  });
});
