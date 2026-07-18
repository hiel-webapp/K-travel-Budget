import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TripDraft } from "../../../lib/trip-domain";
import {
  loadSavedTrips,
  saveSavedTrip,
  deleteSavedTrip,
  restoreSavedTrip,
  generateTripFingerprint,
} from "../../../lib/storage-helper";
import { PlannerPreferences } from "../domain/types";

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
    location: { hash: "" }
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
  foodOverrides: { SEOUL_0_DINNER: "K_BBQ" },
  addOnSelections: {
    SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 2 }],
  },
  attractionByCity: { SEOUL: "EXPERIENCE_RICH" },
};

describe("HypeHeritage 14단계: Saved Trips(저장한 여행) 로컬 스냅샷 기능 검증", () => {
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

  describe("1. CRUD 및 저장/로드 기능", () => {
    it("기본 스냅샷을 저장하고 불러오면 저장 시점의 데이터가 손실 없이 복원되어야 함", () => {
      const saved = saveSavedTrip("My Summer Trip", mockDraft, mockPreferences);
      expect(saved).toBe(true);

      const trips = loadSavedTrips();
      expect(trips.length).toBe(1);
      expect(trips[0].title).toBe("My Summer Trip");
      expect(trips[0].draft).toEqual(mockDraft);
      expect(trips[0].preferences.schemaVersion).toBe(4);
      expect(trips[0].preferences.attractionByCity).toEqual({ SEOUL: "EXPERIENCE_RICH" });
      expect(trips[0].preferences.foodOverrides).toEqual({ SEOUL_0_DINNER: "K_BBQ" });
      expect(trips[0].preferences.addOnSelections).toEqual({
        SEOUL_0_DINNER: [{ addOnItemId: "RICE", quantity: 2 }],
      });
    });

    it("동일한 지문(fingerprint)을 가진 여행을 중복 저장하면 덮어쓰기(갱신) 정책이 적용되어야 함", () => {
      // 1. 첫 번째 저장
      saveSavedTrip("First Saved Name", mockDraft, mockPreferences);

      // 2. 다른 제목으로 동일 조건 저장
      const success = saveSavedTrip("Updated Name", mockDraft, mockPreferences);
      expect(success).toBe(true);

      const trips = loadSavedTrips();
      // 개수가 2개로 증가하지 않고 1개로 유지되어야 함
      expect(trips.length).toBe(1);
      // 최신 저장 명칭으로 갱신
      expect(trips[0].title).toBe("Updated Name");
    });

    it("서로 다른 조건의 여행은 중복이 아니므로 독립적으로 각각 누적 저장되어야 함", () => {
      // 첫 번째 여행
      saveSavedTrip("Trip A", mockDraft, mockPreferences);

      // 두 번째 다른 여행 (인원 수 3명으로 변경)
      const mockDraftB: TripDraft = { ...mockDraft, adultCount: 3 };
      const mockPreferencesB: PlannerPreferences = {
        ...mockPreferences,
        tripFingerprint: generateTripFingerprint(mockDraftB),
      };

      saveSavedTrip("Trip B", mockDraftB, mockPreferencesB);

      const trips = loadSavedTrips();
      expect(trips.length).toBe(2);
      expect(trips[0].title).toBe("Trip B");
      expect(trips[1].title).toBe("Trip A");
    });

    it("삭제 요청 시, 특정 여행 항목만 지우고 다른 스냅샷은 그대로 보존해야 함", () => {
      saveSavedTrip("Trip A", mockDraft, mockPreferences);

      const mockDraftB: TripDraft = { ...mockDraft, adultCount: 3 };
      const mockPreferencesB: PlannerPreferences = {
        ...mockPreferences,
        tripFingerprint: generateTripFingerprint(mockDraftB),
      };
      saveSavedTrip("Trip B", mockDraftB, mockPreferencesB);

      const tripsBefore = loadSavedTrips();
      expect(tripsBefore.length).toBe(2);

      const idB = generateTripFingerprint(mockDraftB);
      const deleted = deleteSavedTrip(idB);
      expect(deleted).toBe(true);

      const tripsAfter = loadSavedTrips();
      expect(tripsAfter.length).toBe(1);
      expect(tripsAfter[0].title).toBe("Trip A");
    });
  });

  describe("2. 스냅샷 복구(Restore) 연동 및 손상 데이터 복합 복구 검증", () => {
    it("restoreSavedTrip 실행 시 전역 trip draft 및 planner preferences 가 해당 여행 조건으로 교체되어야 함", () => {
      if (typeof window === "undefined") return;

      const id = generateTripFingerprint(mockDraft);
      saveSavedTrip("Restore Test", mockDraft, mockPreferences);

      // 전역 스토리지 값 오염
      localStorage.setItem("hypeheritage_trip_draft", "corrupted data");

      const success = restoreSavedTrip(id);
      expect(success).toBe(true);

      // 복구 완료 검증
      const restoredDraftRaw = localStorage.getItem("hypeheritage_trip_draft");
      expect(restoredDraftRaw).not.toBeNull();
      const restoredDraft = JSON.parse(restoredDraftRaw!);
      expect(restoredDraft.tripDraft).toEqual(mockDraft);

      const restoredPrefsRaw = localStorage.getItem("hypeheritage_planner_preferences");
      expect(restoredPrefsRaw).not.toBeNull();
      const restoredPrefs = JSON.parse(restoredPrefsRaw!);
      expect(restoredPrefs.preferences).toEqual(mockPreferences);
    });

    it("로컬스토리지가 손상되었거나 오염된 데이터가 혼재할 경우, 앱 크래시 없이 오염된 항목만 무시하고 가딩해야 함", () => {
      if (typeof window === "undefined") return;

      // 정상 아이템 1개 적재
      saveSavedTrip("Normal Trip", mockDraft, mockPreferences);

      // 로컬스토리지를 강제로 깨뜨림 (비정상 JSON 포맷)
      localStorage.setItem("hypeheritage_saved_trips", "{ corrupted json }");

      const tripsCorrupted = loadSavedTrips();
      // 파싱 실패 시 안전하게 빈 배열 폴백
      expect(tripsCorrupted).toEqual([]);

      // 비정상 포맷의 배열 객체 적재
      const malformedEnvelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        trips: [
          null, // null 방어
          { title: "Malformed Item", draft: null }, // 필드 소실 방어
          {
            id: generateTripFingerprint(mockDraft),
            title: "Normal Inside Malformed Envelope",
            savedAt: new Date().toISOString(),
            draft: mockDraft,
            preferences: mockPreferences,
          },
        ],
      };
      localStorage.setItem("hypeheritage_saved_trips", JSON.stringify(malformedEnvelope));

      const tripsGarded = loadSavedTrips();
      // 유효성 필터를 거쳐 1개의 정상 데이터만 복원되어야 함
      expect(tripsGarded.length).toBe(1);
      expect(tripsGarded[0].title).toBe("Normal Inside Malformed Envelope");
    });
  });
});
