import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TripDraft } from "../../trip-domain";
import {
  loadSavedPlaceIds,
  saveSavedPlaceIds,
  toggleSavedPlaceId,
  isPlaceSaved,
  saveSavedTrip,
  loadSavedTrips,
  restoreSavedTrip,
} from "../../storage-helper";
import { PlannerPreferences } from "../../../features/budget/domain/types";
import { generateInitialBudgetPlan } from "../../../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../../../features/budget/catalog/mock-catalog";

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

if (typeof window === "undefined") {
  const mockLocalStorage = new LocalStorageMock();
  global.localStorage = mockLocalStorage as unknown as Storage;
  global.window = {
    localStorage: mockLocalStorage,
  } as unknown as Window & typeof globalThis;
}

const mockDraft: TripDraft = {
  schemaVersion: 1,
  totalNights: 5,
  adultCount: 2,
  selectedCities: ["SEOUL", "BUSAN"],
  cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
  budgetTier: "STANDARD",
  targetBudgetKrw: 3000000,
};

const mockPreferences: PlannerPreferences = {
  schemaVersion: 4,
  tripFingerprint: "5|2|SEOUL,BUSAN|BUSAN:2;SEOUL:3|STANDARD|3000000",
  accommodationByCity: { SEOUL: "STANDARD_HOTEL" },
  foodOverrides: {},
  addOnSelections: {},
  attractionByCity: {},
};

describe("여행별 장소 후보 저장 기능 (Saved Place Candidates) 검증", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  describe("1. 장소 ID CRUD 및 데이터 정독/중복 방지 검증", () => {
    it("장소 ID 저장, 조회, 토글, 해제 동작이 유효하게 수행되어야 함", () => {
      expect(loadSavedPlaceIds()).toEqual([]);

      const added = toggleSavedPlaceId("mock-seoul-stay-01");
      expect(added.isSaved).toBe(true);
      expect(added.currentIds).toEqual(["mock-seoul-stay-01"]);
      expect(isPlaceSaved("mock-seoul-stay-01")).toBe(true);

      const removed = toggleSavedPlaceId("mock-seoul-stay-01");
      expect(removed.isSaved).toBe(false);
      expect(removed.currentIds).toEqual([]);
      expect(isPlaceSaved("mock-seoul-stay-01")).toBe(false);
    });

    it("중복 ID 및 비정상(빈 문자열, null 등) 입력은 안전하게 필터링되어야 함", () => {
      saveSavedPlaceIds(["place-a", "place-a", "", "  ", null as unknown as string, "place-b"]);
      const loaded = loadSavedPlaceIds();
      expect(loaded).toEqual(["place-a", "place-b"]);
    });
  });

  describe("2. Saved Trips 스냅샷 연동 및 하위 호환성 검증", () => {
    it("Saved Trip 저장 시 현재 저장 장소 ID 목록이 스냅샷에 포함되고, 복원 시 스토리지에 복원되어야 함", () => {
      saveSavedPlaceIds(["mock-seoul-stay-01", "mock-busan-food-01"]);

      saveSavedTrip("My Heritage Trip", mockDraft, mockPreferences);

      const trips = loadSavedTrips();
      expect(trips.length).toBe(1);
      expect(trips[0].savedPlaceIds).toEqual(["mock-seoul-stay-01", "mock-busan-food-01"]);

      // 스토리지의 현재 저장 장소 지우기
      saveSavedPlaceIds([]);
      expect(loadSavedPlaceIds()).toEqual([]);

      // 스냅샷 복원
      const restored = restoreSavedTrip(trips[0].id);
      expect(restored).toBe(true);
      expect(loadSavedPlaceIds()).toEqual(["mock-seoul-stay-01", "mock-busan-food-01"]);
    });

    it("기존 Saved Trip 스냅샷에 savedPlaceIds 필드가 없을 때 빈 배열로 안전하게 처리되어야 함", () => {
      const legacyEnvelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        trips: [
          {
            id: "legacy-trip-id",
            title: "Legacy Trip Without Saved Places",
            savedAt: new Date().toISOString(),
            draft: mockDraft,
            preferences: mockPreferences,
          },
        ],
      };
      localStorage.setItem("hypeheritage_saved_trips", JSON.stringify(legacyEnvelope));

      const trips = loadSavedTrips();
      expect(trips.length).toBe(1);
      expect(trips[0].savedPlaceIds).toEqual([]);

      const restored = restoreSavedTrip("legacy-trip-id");
      expect(restored).toBe(true);
      expect(loadSavedPlaceIds()).toEqual([]);
    });
  });

  describe("3. Budget Engine 독립성 검증", () => {
    it("장소 후보 저장 상태(유효한 ID 또는 유효하지 않은 ID)는 Budget Engine 총액 및 연산 결과에 일절 영향을 주지 않아야 함", () => {
      const planBefore = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG);

      // 장소 후보 저장 수행 및 존재하지 않는 고스트 ID 추가
      toggleSavedPlaceId("mock-seoul-stay-01");
      toggleSavedPlaceId("ghost-invalid-place-999");

      const planAfter = generateInitialBudgetPlan(mockDraft, MOCK_PRICE_CATALOG);

      expect(planAfter.grandTotalKrw).toBe(planBefore.grandTotalKrw);
      expect(planAfter.citySections).toEqual(planBefore.citySections);
    });
  });
});
