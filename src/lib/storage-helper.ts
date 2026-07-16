import {
  TripDraft,
  TripDraftStorageEnvelope,
  DEFAULT_TRIP_DRAFT,
  validateTripDraft,
  migrateLegacyState,
  SupportedCity,
} from "./trip-domain";
import {
  PlannerPreferences,
  PlannerPreferencesEnvelope,
  AccommodationOverridesByCity,
} from "../features/budget/domain/types";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";

const NEW_STORAGE_KEY = "hypeheritage_trip_draft";
const LEGACY_STORAGE_KEY = "k_travel_state";
const PREFS_STORAGE_KEY = "hypeheritage_planner_preferences";

export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * TripDraft를 기준으로 고유한 fingerprint 해시 문자열을 생성합니다.
 */
export function generateTripFingerprint(draft: TripDraft): string {
  const cities = [...draft.selectedCities].join(",");
  const allocations = Object.entries(draft.cityNightAllocations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([city, nights]) => `${city}:${nights}`)
    .join(";");
  return `${draft.totalNights}|${draft.adultCount}|${cities}|${allocations}|${draft.budgetTier}|${draft.targetBudgetKrw}`;
}

/**
 * TripDraft를 로컬스토리지에 envelope 형식으로 안전하게 저장합니다.
 */
export function saveTripDraft(draft: TripDraft): boolean {
  if (!isClient()) return false;

  try {
    const validation = validateTripDraft(draft);
    if (!validation.success) {
      return false;
    }

    const envelope: TripDraftStorageEnvelope = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      tripDraft: draft,
    };

    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * 로컬스토리지로부터 TripDraft를 우선 로드하며, 필요 시 기존 레거시 상태를 마이그레이션합니다.
 */
export function loadTripDraft(): TripDraft {
  if (!isClient()) {
    return DEFAULT_TRIP_DRAFT;
  }

  try {
    const rawNew = localStorage.getItem(NEW_STORAGE_KEY);
    if (rawNew) {
      const envelope = JSON.parse(rawNew) as TripDraftStorageEnvelope;
      if (
        envelope &&
        envelope.schemaVersion === 1 &&
        envelope.tripDraft
      ) {
        const validation = validateTripDraft(envelope.tripDraft);
        if (validation.success) {
          return envelope.tripDraft;
        }
      }
    }
  } catch {
  }

  try {
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      const legacyObj = JSON.parse(rawLegacy);
      const migrated = migrateLegacyState(legacyObj);
      if (migrated) {
        saveTripDraft(migrated);
        return migrated;
      }
    }
  } catch {
  }

  return DEFAULT_TRIP_DRAFT;
}

/**
 * 주어진 raw JSON 스트링을 파싱하고, TripDraft 지표를 기준으로
 * schemaVersion, tripFingerprint, basket 유효성을 철저히 순수 함수로 검증합니다.
 */
export function parsePlannerPreferences(
  rawJson: string | null,
  draft: TripDraft
): {
  status: "valid" | "missing" | "invalid" | "fingerprint-mismatch" | "unavailable";
  preferences: PlannerPreferences;
} {
  const defaultPrefs: PlannerPreferences = {
    schemaVersion: 1,
    tripFingerprint: generateTripFingerprint(draft),
    accommodationByCity: {},
  };

  if (rawJson === null) {
    return { status: "missing", preferences: defaultPrefs };
  }

  try {
    const envelope = JSON.parse(rawJson) as PlannerPreferencesEnvelope;
    if (!envelope || envelope.schemaVersion !== 1 || !envelope.preferences) {
      return { status: "invalid", preferences: defaultPrefs };
    }

    const prefs = envelope.preferences;
    if (prefs.schemaVersion !== 1 || !prefs.accommodationByCity) {
      return { status: "invalid", preferences: defaultPrefs };
    }

    const currentFingerprint = generateTripFingerprint(draft);
    if (prefs.tripFingerprint !== currentFingerprint) {
      return { status: "fingerprint-mismatch", preferences: defaultPrefs };
    }

    const acc = prefs.accommodationByCity;
    for (const [cityKey, basketId] of Object.entries(acc)) {
      const city = cityKey as SupportedCity;

      if (!draft.selectedCities.includes(city)) {
        continue;
      }

      const basket = MOCK_PRICE_CATALOG.find(
        (b) =>
          b.category === "ACCOMMODATION" &&
          b.id === basketId &&
          b.applicableCity === city &&
          b.isActive
      );

      if (!basket) {
        return { status: "invalid", preferences: defaultPrefs };
      }
    }

    return { status: "valid", preferences: prefs };
  } catch {
    return { status: "invalid", preferences: defaultPrefs };
  }
}

/**
 * PlannerPreferences를 로컬스토리지에 envelope 형식으로 안전하게 저장합니다.
 */
export function savePlannerPreferences(
  accommodationByCity: AccommodationOverridesByCity,
  draft: TripDraft
): boolean {
  if (!isClient()) return false;

  try {
    const prefs: PlannerPreferences = {
      schemaVersion: 1,
      tripFingerprint: generateTripFingerprint(draft),
      accommodationByCity,
    };

    const envelope: PlannerPreferencesEnvelope = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      preferences: prefs,
    };

    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * 로컬스토리지로부터 PlannerPreferences의 검증 상태와 Preferences 데이터를 반환합니다.
 */
export function loadPlannerPreferencesEx(
  draft: TripDraft
): {
  status: "valid" | "missing" | "invalid" | "fingerprint-mismatch" | "unavailable";
  preferences: PlannerPreferences;
} {
  if (!isClient()) {
    const defaultPrefs: PlannerPreferences = {
      schemaVersion: 1,
      tripFingerprint: generateTripFingerprint(draft),
      accommodationByCity: {},
    };
    return { status: "unavailable", preferences: defaultPrefs };
  }

  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return parsePlannerPreferences(raw, draft);
  } catch {
    const defaultPrefs: PlannerPreferences = {
      schemaVersion: 1,
      tripFingerprint: generateTripFingerprint(draft),
      accommodationByCity: {},
    };
    return { status: "unavailable", preferences: defaultPrefs };
  }
}

/**
 * 하위 호환성 및 기존 UI 바인딩용 래퍼 함수
 */
export function loadPlannerPreferences(): PlannerPreferences {
  const draft = loadTripDraft();
  const res = loadPlannerPreferencesEx(draft);
  return res.preferences;
}
