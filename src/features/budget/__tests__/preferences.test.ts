import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TripDraft } from "../../../lib/trip-domain";
import { BudgetBasketId } from "../domain/types";
import {
  generateTripFingerprint,
  parsePlannerPreferences,
  savePlannerPreferences,
  loadPlannerPreferencesEx,
} from "../../../lib/storage-helper";

const defaultTrip: TripDraft = {
  schemaVersion: 1,
  totalNights: 5,
  adultCount: 2,
  selectedCities: ["SEOUL", "BUSAN"],
  cityNightAllocations: { SEOUL: 3, BUSAN: 2 },
  budgetTier: "STANDARD",
  targetBudgetKrw: 3000000,
};

describe("Planner Preferences & Storage Domain", () => {
  describe("1. Trip Fingerprinting", () => {
    it("should generate a stable fingerprint for a valid TripDraft", () => {
      const fp = generateTripFingerprint(defaultTrip);
      expect(fp).toBe("5|2|SEOUL,BUSAN|BUSAN:2;SEOUL:3|STANDARD|3000000");
    });

    it("should remain unchanged on locale changes (which do not exist in TripDraft)", () => {
      const fp1 = generateTripFingerprint(defaultTrip);
      const fp2 = generateTripFingerprint({ ...defaultTrip });
      expect(fp1).toBe(fp2);
    });

    it("should change when total nights change", () => {
      const fp1 = generateTripFingerprint(defaultTrip);
      const fp2 = generateTripFingerprint({
        ...defaultTrip,
        totalNights: 7,
        cityNightAllocations: { SEOUL: 5, BUSAN: 2 },
      });
      expect(fp1).not.toBe(fp2);
    });

    it("should change when adult count changes", () => {
      const fp1 = generateTripFingerprint(defaultTrip);
      const fp2 = generateTripFingerprint({ ...defaultTrip, adultCount: 3 });
      expect(fp1).not.toBe(fp2);
    });

    it("should change when city visiting order changes", () => {
      const fp1 = generateTripFingerprint(defaultTrip);
      const fp2 = generateTripFingerprint({
        ...defaultTrip,
        selectedCities: ["BUSAN", "SEOUL"],
        cityNightAllocations: { BUSAN: 3, SEOUL: 2 },
      });
      expect(fp1).not.toBe(fp2);
    });

    it("should change when city night allocation shifts", () => {
      const fp1 = generateTripFingerprint(defaultTrip);
      const fp2 = generateTripFingerprint({
        ...defaultTrip,
        cityNightAllocations: { SEOUL: 4, BUSAN: 1 },
      });
      expect(fp1).not.toBe(fp2);
    });

    it("should change when budget tier changes", () => {
      const fp1 = generateTripFingerprint(defaultTrip);
      const fp2 = generateTripFingerprint({ ...defaultTrip, budgetTier: "PREMIUM" });
      expect(fp1).not.toBe(fp2);
    });

    it("should change when target budget changes", () => {
      const fp1 = generateTripFingerprint(defaultTrip);
      const fp2 = generateTripFingerprint({ ...defaultTrip, targetBudgetKrw: 5000000 });
      expect(fp1).not.toBe(fp2);
    });
  });

  describe("2. Preferences Envelope Parsing & Validation", () => {
    it("should return missing status when storage raw JSON is null", () => {
      const res = parsePlannerPreferences(null, defaultTrip);
      expect(res.status).toBe("missing");
      expect(res.preferences.accommodationByCity).toEqual({});
    });

    it("should return invalid status on corrupted JSON", () => {
      const res = parsePlannerPreferences("{ bad json", defaultTrip);
      expect(res.status).toBe("invalid");
    });

    it("should return invalid status when envelope schema version is mismatch", () => {
      const badEnvelope = {
        schemaVersion: 99,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 1,
          tripFingerprint: generateTripFingerprint(defaultTrip),
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
        },
      };
      const res = parsePlannerPreferences(JSON.stringify(badEnvelope), defaultTrip);
      expect(res.status).toBe("invalid");
    });

    it("should return invalid status when preferences schema version is mismatch", () => {
      const badEnvelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 99,
          tripFingerprint: generateTripFingerprint(defaultTrip),
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
        },
      };
      const res = parsePlannerPreferences(JSON.stringify(badEnvelope), defaultTrip);
      expect(res.status).toBe("invalid");
    });

    it("should return fingerprint-mismatch status when fingerprint does not match", () => {
      const oldEnvelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 1,
          tripFingerprint: "old-fingerprint-etc",
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
        },
      };
      const res = parsePlannerPreferences(JSON.stringify(oldEnvelope), defaultTrip);
      expect(res.status).toBe("fingerprint-mismatch");
    });

    it("should return invalid when containing invalid basket id for a city", () => {
      const badEnvelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 1,
          tripFingerprint: generateTripFingerprint(defaultTrip),
          accommodationByCity: { SEOUL: "KTX_STANDARD" as BudgetBasketId }, // KTX is transport, not accommodation
        },
      };
      const res = parsePlannerPreferences(JSON.stringify(badEnvelope), defaultTrip);
      expect(res.status).toBe("invalid");
    });

    it("should return valid status and extract overrides successfully when all checks pass", () => {
      const goodEnvelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 1,
          tripFingerprint: generateTripFingerprint(defaultTrip),
          accommodationByCity: { SEOUL: "BUDGET_STAY", BUSAN: "PREMIUM_HERITAGE" },
        },
      };
      const res = parsePlannerPreferences(JSON.stringify(goodEnvelope), defaultTrip);
      expect(res.status).toBe("valid");
      expect(res.preferences.accommodationByCity.SEOUL).toBe("BUDGET_STAY");
      expect(res.preferences.accommodationByCity.BUSAN).toBe("PREMIUM_HERITAGE");
    });

    it("should ensure preferences serialization does not store derived financial totals", () => {
      const goodEnvelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 1,
          tripFingerprint: generateTripFingerprint(defaultTrip),
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
        },
      };
      const raw = JSON.stringify(goodEnvelope);

      // ?ろ啝毽�? 甑�“???岇儩 臧?grandTotal, subtotal ?????れ柎臧€?滊姅 ????      expect(raw).not.toContain("grandTotal");
      expect(raw).not.toContain("subtotal");
      expect(raw).not.toContain("categoryTotals");
      expect(raw).not.toContain("BudgetPlan");
    });
  });

  describe("3. LocalStorage Side-Effects (Mocked environment)", () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      vi.stubGlobal("localStorage", {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, val: string) => {
          mockStorage[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
      });
      // window defined to simulate client environment
      vi.stubGlobal("window", {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should restore successfully using loadPlannerPreferencesEx", () => {
      const acc = { SEOUL: "BUDGET_STAY" as BudgetBasketId };
      savePlannerPreferences({ accommodationByCity: acc, draft: defaultTrip });

      const res = loadPlannerPreferencesEx(defaultTrip);
      expect(res.status).toBe("valid");
      expect(res.preferences.accommodationByCity.SEOUL).toBe("BUDGET_STAY");
      expect(res.preferences.foodOverrides).toEqual({});
    });

    it("should return unavailable status when localStorage throws storage error", () => {
      // Mock setItem/getItem to throw to simulate storage unavailable (disabled cookies, full quota etc)
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const res = loadPlannerPreferencesEx(defaultTrip);
      expect(res.status).toBe("unavailable");
      expect(res.preferences.accommodationByCity).toEqual({});
    });

    it("should not delete TripDraft or legacy storage when loading preferences", () => {
      localStorage.setItem("hypeheritage_trip_draft", "some-trip");
      localStorage.setItem("k_travel_state", "legacy-trip");

      loadPlannerPreferencesEx(defaultTrip);

      expect(localStorage.getItem("hypeheritage_trip_draft")).toBe("some-trip");
      expect(localStorage.getItem("k_travel_state")).toBe("legacy-trip");
    });

    it("should migrate V1 envelope to V2 envelope successfully", () => {
      const v1Envelope = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 1,
          tripFingerprint: generateTripFingerprint(defaultTrip),
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
        },
      };

      const setItemSpy = vi.spyOn(localStorage, "setItem");

      const res = parsePlannerPreferences(JSON.stringify(v1Envelope), defaultTrip);

      // 마이그레이션 확인
      expect(res.status).toBe("valid");
      expect(res.preferences.schemaVersion).toBe(2);
      expect(res.preferences.accommodationByCity.SEOUL).toBe("BUDGET_STAY");
      expect(res.preferences.foodOverrides).toEqual({});

      // 자동 저장이 발생하지 않았음을 확인
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it("should return invalid on malformed V2 preferences", () => {
      const badV2Envelope = {
        schemaVersion: 2,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 2,
          tripFingerprint: generateTripFingerprint(defaultTrip),
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
        },
      };

      const res = parsePlannerPreferences(JSON.stringify(badV2Envelope), defaultTrip);
      expect(res.status).toBe("invalid");
    });

    it("should return fingerprint-mismatch on fingerprint mismatch in V2", () => {
      const badV2Envelope = {
        schemaVersion: 2,
        savedAt: new Date().toISOString(),
        preferences: {
          schemaVersion: 2,
          tripFingerprint: "mismatched-fingerprint",
          accommodationByCity: { SEOUL: "BUDGET_STAY" },
          foodOverrides: {},
        },
      };

      const res = parsePlannerPreferences(JSON.stringify(badV2Envelope), defaultTrip);
      expect(res.status).toBe("fingerprint-mismatch");
    });

    it("should save envelope as V2 formatting", () => {
      const acc = { SEOUL: "BUDGET_STAY" as BudgetBasketId };
      const food = { SEOUL_0_DINNER: "K_BBQ" };

      savePlannerPreferences({
        accommodationByCity: acc,
        foodOverrides: food,
        draft: defaultTrip,
      });

      const raw = localStorage.getItem("hypeheritage_planner_preferences");
      expect(raw).not.toBeNull();

      const envelope = JSON.parse(raw!);
      expect(envelope.schemaVersion).toBe(2);
      expect(envelope.preferences.schemaVersion).toBe(2);
      expect(envelope.preferences.foodOverrides).toEqual(food);
      expect(envelope.preferences.accommodationByCity).toEqual(acc);
      expect(envelope.preferences.tripFingerprint).toBe(generateTripFingerprint(defaultTrip));
    });
  });
});
