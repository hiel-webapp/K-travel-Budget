import { describe, it, expect } from "vitest";
import {
  TripDraft,
  ensureTripStops,
  syncDraftFromStops,
  calculateDefaultNightAllocation,
  validateTripDraft,
} from "../../../lib/trip-domain";
import { generateInitialBudgetPlan } from "../calculations/engine";
import { BUDGET_CATALOG } from "../catalog/mock-catalog";
import { AccommodationSelection } from "../domain/types";

describe("TripStop Architecture: Split Stay & Round-Trip Itinerary Unit Tests", () => {
  it("동일 도시 재방문 순환 여정(서울 ➔ 전주 ➔ 경주 ➔ 서울) 유효성 검사 통과 검증", () => {
    const roundTripDraft: TripDraft = {
      totalNights: 8,
      adultCount: 2,
      selectedCities: ["SEOUL", "JEONJU", "GYEONGJU", "SEOUL"],
      cityNightAllocations: {
        SEOUL: 4,
        JEONJU: 2,
        GYEONGJU: 2,
      },
      budgetTier: "STANDARD",
      targetBudgetKrw: 4000000,
      schemaVersion: 1,
    };

    const validation = validateTripDraft(roundTripDraft);
    expect(validation.success).toBe(true);
    expect(validation.errors.length).toBe(0);

    const plan = generateInitialBudgetPlan(roundTripDraft, BUDGET_CATALOG);
    expect(plan).toBeDefined();
    expect(plan.grandTotalKrw).toBeGreaterThan(0);
  });

  it("연속 즉시 중복(서울 ➔ 서울)은 duplicate_cities 에러 반환 검증", () => {
    const invalidDraft: TripDraft = {
      totalNights: 4,
      adultCount: 2,
      selectedCities: ["SEOUL", "SEOUL"],
      cityNightAllocations: {
        SEOUL: 4,
      },
      budgetTier: "STANDARD",
      targetBudgetKrw: 2000000,
      schemaVersion: 1,
    };

    const validation = validateTripDraft(invalidDraft);
    expect(validation.success).toBe(false);
    expect(validation.errors).toContain("duplicate_cities");
  });

  it("순환 여정에 대한 calculateDefaultNightAllocation 누적 박수 분배 검증", () => {
    const cities = ["SEOUL", "JEONJU", "GYEONGJU", "SEOUL"] as const;
    const alloc = calculateDefaultNightAllocation([...cities], 8);

    // 8박을 4개 정차지에 2박씩 분배하므로 서울은 2 + 2 = 4박이 되어야 함
    expect(alloc.SEOUL).toBe(4);
    expect(alloc.JEONJU).toBe(2);
    expect(alloc.GYEONGJU).toBe(2);
  });

  it("ensureTripStops 및 syncDraftFromStops 상호 동기화 검증", () => {
    const initialDraft: TripDraft = {
      totalNights: 6,
      adultCount: 2,
      selectedCities: ["SEOUL", "BUSAN", "SEOUL"],
      cityNightAllocations: {
        SEOUL: 4,
        BUSAN: 2,
      },
      budgetTier: "STANDARD",
      targetBudgetKrw: 3000000,
      schemaVersion: 1,
    };

    const stops = ensureTripStops(initialDraft);
    expect(stops.length).toBe(3);
    expect(stops[0].city).toBe("SEOUL");
    expect(stops[0].label).toBe("1차");
    expect(stops[1].city).toBe("BUSAN");
    expect(stops[2].city).toBe("SEOUL");
    expect(stops[2].label).toBe("2차");

    // 정차지 순서 변경 후 동기화
    const modifiedStops = [
      { id: "stop_1", city: "SEOUL" as const, nights: 3 },
      { id: "stop_2", city: "JEONJU" as const, nights: 2 },
    ];
    const syncedDraft = syncDraftFromStops(initialDraft, modifiedStops);
    expect(syncedDraft.selectedCities).toEqual(["SEOUL", "JEONJU"]);
    expect(syncedDraft.totalNights).toBe(5);
    expect(syncedDraft.cityNightAllocations.SEOUL).toBe(3);
    expect(syncedDraft.cityNightAllocations.JEONJU).toBe(2);
  });

  it("동일 도시 내 숙소 분할(Split Stay) 계산 엔진 연산 검증", () => {
    // 서울 5박 중 3박은 1박 60,000원 호스텔, 2박은 1박 200,000원 한옥 스테이
    const splitAcc: AccommodationSelection = {
      kind: "SPLIT",
      segments: [
        {
          segmentId: "seg_1",
          basketId: "BUDGET_STAY",
          nights: 3,
          nightlyPriceKrw: 60000,
          placeNameKo: "실속 게스트하우스",
        },
        {
          segmentId: "seg_2",
          basketId: "PREMIUM_HERITAGE",
          nights: 2,
          nightlyPriceKrw: 200000,
          placeNameKo: "북촌 프리미엄 한옥",
        },
      ],
    };

    const plan = generateInitialBudgetPlan(
      {
        totalNights: 5,
        adultCount: 2,
        selectedCities: ["SEOUL"],
        cityNightAllocations: { SEOUL: 5 },
        budgetTier: "STANDARD",
        targetBudgetKrw: 3000000,
        schemaVersion: 1,
      },
      BUDGET_CATALOG,
      {
        accommodation: {
          SEOUL: splitAcc,
        },
        occupancyMode: {
          SEOUL: "SHARED_PAIR", // 2인 1실 (객실 1개)
        },
      }
    );

    // 2인 1실 기준:
    // 1차: 60,000원 * 1실 * 3박 = 180,000원
    // 2차: 200,000원 * 1실 * 2박 = 400,000원
    // 총 숙박비 = 580,000원
    const seoulAcc = plan.citySections.SEOUL?.lineItems.find(
      (i) => i.category === "ACCOMMODATION"
    );

    expect(seoulAcc).toBeDefined();
    expect(seoulAcc?.lineTotalKrw).toBe(580000);
    expect(seoulAcc?.sourceLabel).toContain("실속 게스트하우스 3박");
    expect(seoulAcc?.sourceLabel).toContain("북촌 프리미엄 한옥 2박");
  });
});
