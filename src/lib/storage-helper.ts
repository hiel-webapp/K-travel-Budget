import {
  TripDraft,
  TripDraftStorageEnvelope,
  DEFAULT_TRIP_DRAFT,
  EMPTY_TRIP_DRAFT,
  validateTripDraft,
  migrateLegacyState,
  SupportedCity,
} from "./trip-domain";
import {
  PlannerPreferences,
  PlannerPreferencesEnvelope,
  AccommodationOverridesByCity,
  AttractionOverridesByCity,
  PlannerPreferencesV1,
  PlannerPreferencesV2,
  FoodOverrides,
  FoodAddOnOverrides,
} from "../features/budget/domain/types";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";

const NEW_STORAGE_KEY = "hypeheritage_trip_draft";
const LEGACY_STORAGE_KEY = "k_travel_state";
const PREFS_STORAGE_KEY = "hypeheritage_planner_preferences";
const SAVED_PLACE_IDS_STORAGE_KEY = "hypeheritage_saved_place_ids";

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
 * 실시간 변경 중인 TripDraft와 모바일 단계(mobileStep)를 미완합 상태까지 즉시 보존합니다.
 */
export function saveActiveDraft(draft: TripDraft, mobileStep: number = 1): boolean {
  if (!isClient()) return false;

  try {
    const envelope = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      tripDraft: draft,
      mobileStep,
    };

    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * 로컬스토리지로부터 저장된 실시간 TripDraft 및 mobileStep 상태를 복원합니다.
 */
export function loadActiveDraft(): { draft: TripDraft; mobileStep: number } {
  if (!isClient()) {
    return { draft: EMPTY_TRIP_DRAFT, mobileStep: 1 };
  }

  try {
    const rawNew = localStorage.getItem(NEW_STORAGE_KEY);
    if (rawNew) {
      const envelope = JSON.parse(rawNew);
      if (envelope && envelope.tripDraft) {
        return {
          draft: envelope.tripDraft,
          mobileStep: envelope.mobileStep || 1,
        };
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
        saveActiveDraft(migrated, 1);
        return { draft: migrated, mobileStep: 1 };
      }
    }
  } catch {
  }

  return { draft: EMPTY_TRIP_DRAFT, mobileStep: 1 };
}

/**
 * 작성 중인 일정 정보와 보존 데이터를 완전 초기화합니다.
 */
export function clearActiveDraft(): boolean {
  if (!isClient()) return false;

  try {
    localStorage.removeItem(NEW_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * 로컬스토리지로부터 TripDraft를 우선 로드하며, 필요 시 기존 레거시 상태를 마이그레이션합니다.
 */
export function loadTripDraft(): TripDraft {
  return loadActiveDraft().draft;
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
    schemaVersion: 4,
    tripFingerprint: generateTripFingerprint(draft),
    accommodationByCity: {},
    foodOverrides: {},
    addOnSelections: {},
    attractionByCity: {},
    emergencyFundKrw: 0,
  };

  const isEmergencyValValid = (val: unknown): val is number => {
    return typeof val === "number" && !isNaN(val) && isFinite(val) && val >= 0 && Number.isInteger(val);
  };

  if (rawJson === null) {
    return { status: "missing", preferences: defaultPrefs };
  }

  try {
    const rawObj = JSON.parse(rawJson);
    if (!rawObj || typeof rawObj !== "object" || !("schemaVersion" in rawObj)) {
      return { status: "invalid", preferences: defaultPrefs };
    }

    const rawVersion = rawObj.schemaVersion;

    // V1 마이그레이션 경로 (V1 ➔ V4)
    if (rawVersion === 1) {
      const prefsV1 = rawObj.preferences as PlannerPreferencesV1;
      if (!prefsV1 || prefsV1.schemaVersion !== 1 || !prefsV1.accommodationByCity) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      const currentFingerprint = generateTripFingerprint(draft);
      if (prefsV1.tripFingerprint !== currentFingerprint) {
        return { status: "fingerprint-mismatch", preferences: defaultPrefs };
      }

      const migratedPrefs: PlannerPreferences = {
        schemaVersion: 4,
        tripFingerprint: prefsV1.tripFingerprint,
        accommodationByCity: prefsV1.accommodationByCity,
        foodOverrides: {},
        addOnSelections: {},
        attractionByCity: {},
        emergencyFundKrw: 0,
      };

      if (!validateAccommodation(migratedPrefs.accommodationByCity, draft)) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      return { status: "valid", preferences: migratedPrefs };
    }

    // V2 마이그레이션 경로 (V2 ➔ V4)
    if (rawVersion === 2) {
      const prefsV2 = rawObj.preferences as PlannerPreferencesV2;
      if (!prefsV2 || prefsV2.schemaVersion !== 2 || !prefsV2.accommodationByCity || !prefsV2.foodOverrides) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      const currentFingerprint = generateTripFingerprint(draft);
      if (prefsV2.tripFingerprint !== currentFingerprint) {
        return { status: "fingerprint-mismatch", preferences: defaultPrefs };
      }

      const migratedPrefs: PlannerPreferences = {
        schemaVersion: 4,
        tripFingerprint: prefsV2.tripFingerprint,
        accommodationByCity: prefsV2.accommodationByCity,
        foodOverrides: prefsV2.foodOverrides,
        addOnSelections: {},
        attractionByCity: {},
        emergencyFundKrw: 0,
      };

      if (!validateAccommodation(migratedPrefs.accommodationByCity, draft)) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      return { status: "valid", preferences: migratedPrefs };
    }

    // V3 마이그레이션 경로 (V3 ➔ V4)
    if (rawVersion === 3) {
      const prefsV3 = rawObj.preferences;
      if (!prefsV3 || prefsV3.schemaVersion !== 3 || !prefsV3.accommodationByCity || !prefsV3.foodOverrides || !prefsV3.addOnSelections) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      const currentFingerprint = generateTripFingerprint(draft);
      if (prefsV3.tripFingerprint !== currentFingerprint) {
        return { status: "fingerprint-mismatch", preferences: defaultPrefs };
      }

      const migratedPrefs: PlannerPreferences = {
        schemaVersion: 4,
        tripFingerprint: prefsV3.tripFingerprint,
        accommodationByCity: prefsV3.accommodationByCity,
        foodOverrides: prefsV3.foodOverrides,
        addOnSelections: prefsV3.addOnSelections,
        attractionByCity: {},
        emergencyFundKrw: 0,
      };

      if (!validateAccommodation(migratedPrefs.accommodationByCity, draft)) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      return { status: "valid", preferences: migratedPrefs };
    }

    // V4 정상 경로
    if (rawVersion === 4) {
      const envelope = rawObj as PlannerPreferencesEnvelope;
      if (!envelope.preferences) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      const prefs = envelope.preferences;
      if (
        prefs.schemaVersion !== 4 ||
        !prefs.accommodationByCity ||
        !prefs.foodOverrides ||
        !prefs.addOnSelections ||
        !prefs.attractionByCity ||
        typeof prefs.foodOverrides !== "object" ||
        typeof prefs.addOnSelections !== "object" ||
        typeof prefs.attractionByCity !== "object"
      ) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      const currentFingerprint = generateTripFingerprint(draft);
      if (prefs.tripFingerprint !== currentFingerprint) {
        return { status: "fingerprint-mismatch", preferences: defaultPrefs };
      }

      if (!validateAccommodation(prefs.accommodationByCity, draft)) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      if (!validateAttraction(prefs.attractionByCity, draft)) {
        return { status: "invalid", preferences: defaultPrefs };
      }

      for (const [key, value] of Object.entries(prefs.foodOverrides)) {
        if (typeof key !== "string" || typeof value !== "string") {
          return { status: "invalid", preferences: defaultPrefs };
        }
      }

      for (const [key, list] of Object.entries(prefs.addOnSelections)) {
        if (typeof key !== "string" || !Array.isArray(list)) {
          return { status: "invalid", preferences: defaultPrefs };
        }
        for (const item of list) {
          if (
            !item ||
            typeof item !== "object" ||
            typeof item.addOnItemId !== "string" ||
            typeof item.quantity !== "number"
          ) {
            return { status: "invalid", preferences: defaultPrefs };
          }
        }
      }

      const returnPrefs: PlannerPreferences = {
        ...prefs,
        emergencyFundKrw: isEmergencyValValid(prefs.emergencyFundKrw) ? prefs.emergencyFundKrw : 0,
      };

      return { status: "valid", preferences: returnPrefs };
    }

    return { status: "invalid", preferences: defaultPrefs };
  } catch {
    return { status: "invalid", preferences: defaultPrefs };
  }
}

function validateAccommodation(
  acc: AccommodationOverridesByCity,
  draft: TripDraft
): boolean {
  for (const [cityKey, val] of Object.entries(acc)) {
    const city = cityKey as SupportedCity;

    if (!draft.selectedCities.includes(city)) {
      continue;
    }

    if (!val) continue;

    if (typeof val === "object" && val !== null && "kind" in val) {
      if (val.kind === "PLACE") {
        if (!val.placeId || typeof val.nightlyPriceKrw !== "number" || val.nightlyPriceKrw < 0) {
          return false;
        }
        continue;
      }
      const basket = MOCK_PRICE_CATALOG.find(
        (b) =>
          b.category === "ACCOMMODATION" &&
          b.id === val.basketId &&
          b.applicableCity === city &&
          b.isActive
      );
      if (!basket) return false;
      continue;
    }

    if (typeof val === "string") {
      const basket = MOCK_PRICE_CATALOG.find(
        (b) =>
          b.category === "ACCOMMODATION" &&
          b.id === val &&
          b.applicableCity === city &&
          b.isActive
      );
      if (!basket) return false;
    }
  }
  return true;
}

function validateAttraction(
  attr: AttractionOverridesByCity,
  draft: TripDraft
): boolean {
  for (const [cityKey, basketId] of Object.entries(attr)) {
    const city = cityKey as SupportedCity;

    if (!draft.selectedCities.includes(city)) {
      continue;
    }

    const basket = MOCK_PRICE_CATALOG.find(
      (b) =>
        b.category === "ATTRACTION" &&
        b.id === basketId &&
        b.applicableCity === city &&
        b.isActive
    );

    if (!basket) {
      return false;
    }
  }
  return true;
}

export interface SavePlannerPreferencesInput {
  accommodationByCity: AccommodationOverridesByCity;
  foodOverrides?: FoodOverrides;
  foodAddOnOverrides?: FoodAddOnOverrides;
  attractionByCity?: AttractionOverridesByCity;
  emergencyFundKrw?: number;
  draft: TripDraft;
}

/**
 * PlannerPreferences를 로컬스토리지에 envelope 형식으로 안전하게 저장합니다.
 */
export function savePlannerPreferences(input: SavePlannerPreferencesInput): boolean {
  if (!isClient()) return false;

  const {
    accommodationByCity,
    foodOverrides = {},
    foodAddOnOverrides = {},
    attractionByCity = {},
    draft,
  } = input;

  try {
    const isValValid = (val: unknown): val is number => {
      return typeof val === "number" && !isNaN(val) && isFinite(val) && val >= 0 && Number.isInteger(val);
    };

    const prefs: PlannerPreferences = {
      schemaVersion: 4,
      tripFingerprint: generateTripFingerprint(draft),
      accommodationByCity,
      foodOverrides,
      addOnSelections: foodAddOnOverrides,
      attractionByCity,
      emergencyFundKrw: isValValid(input.emergencyFundKrw) ? input.emergencyFundKrw : undefined,
    };

    const envelope: PlannerPreferencesEnvelope = {
      schemaVersion: 4,
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
  const defaultPrefs: PlannerPreferences = {
    schemaVersion: 4,
    tripFingerprint: generateTripFingerprint(draft),
    accommodationByCity: {},
    foodOverrides: {},
    addOnSelections: {},
    attractionByCity: {},
  };

  if (!isClient()) {
    return { status: "unavailable", preferences: defaultPrefs };
  }

  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return parsePlannerPreferences(raw, draft);
  } catch {
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

export interface SavedTripItem {
  id: string;
  title: string;
  savedAt: string;
  draft: TripDraft;
  preferences: PlannerPreferences;
  savedPlaceIds?: string[];
}

export interface SavedTripsEnvelope {
  schemaVersion: 1;
  savedAt: string;
  trips: SavedTripItem[];
}

/**
 * 현재 여행에 대한 저장된 장소 ID 목록을 로드합니다.
 * 비정상적인 값/중복은 안전하게 필터링합니다.
 */
export function loadSavedPlaceIds(): string[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(SAVED_PLACE_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    return Array.from(new Set(validIds));
  } catch {
    return [];
  }
}

/**
 * 저장 장소 ID 목록을 로컬스토리지에 유효성 및 중복을 방지하여 저장합니다.
 */
export function saveSavedPlaceIds(ids: string[]): boolean {
  if (!isClient()) return false;
  try {
    const validIds = ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    const uniqueIds = Array.from(new Set(validIds));
    localStorage.setItem(SAVED_PLACE_IDS_STORAGE_KEY, JSON.stringify(uniqueIds));
    return true;
  } catch {
    return false;
  }
}

/**
 * 특정 장소 ID의 저장 상태를 토글(저장/해제)합니다.
 */
export function toggleSavedPlaceId(id: string): { isSaved: boolean; currentIds: string[] } {
  if (!id || typeof id !== "string" || !id.trim()) {
    const current = loadSavedPlaceIds();
    return { isSaved: false, currentIds: current };
  }

  const currentIds = loadSavedPlaceIds();
  const index = currentIds.indexOf(id);
  let nextIds: string[];
  let isSaved: boolean;

  if (index >= 0) {
    nextIds = currentIds.filter((item) => item !== id);
    isSaved = false;
  } else {
    nextIds = [...currentIds, id];
    isSaved = true;
  }

  saveSavedPlaceIds(nextIds);
  return { isSaved, currentIds: nextIds };
}

/**
 * 특정 장소 ID가 저장되어 있는지 검사합니다.
 */
export function isPlaceSaved(id: string): boolean {
  if (!id) return false;
  const currentIds = loadSavedPlaceIds();
  return currentIds.includes(id);
}

export function loadSavedTrips(): SavedTripItem[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem("hypeheritage_saved_trips");
    if (!raw) return [];
    const envelope = JSON.parse(raw) as SavedTripsEnvelope;
    if (!envelope || envelope.schemaVersion !== 1 || !Array.isArray(envelope.trips)) {
      return [];
    }
    return envelope.trips.filter((trip) => {
      return (
        trip &&
        typeof trip === "object" &&
        typeof trip.id === "string" &&
        typeof trip.title === "string" &&
        typeof trip.savedAt === "string" &&
        trip.draft &&
        trip.preferences
      );
    }).map((trip) => {
      const placeIds = Array.isArray(trip.savedPlaceIds)
        ? trip.savedPlaceIds.filter((pid): pid is string => typeof pid === "string" && pid.trim().length > 0)
        : [];
      return {
        ...trip,
        savedPlaceIds: Array.from(new Set(placeIds)),
      };
    });
  } catch {
    return [];
  }
}

export function saveSavedTrip(
  title: string,
  draft: TripDraft,
  preferences: PlannerPreferences,
  savedPlaceIds?: string[]
): boolean {
  if (!isClient()) return false;
  try {
    const trips = loadSavedTrips();
    const id = generateTripFingerprint(draft);
    const nowStr = new Date().toISOString();

    const currentPlaceIds = savedPlaceIds !== undefined ? savedPlaceIds : loadSavedPlaceIds();
    const cleanPlaceIds = Array.from(
      new Set(currentPlaceIds.filter((pid): pid is string => typeof pid === "string" && pid.trim().length > 0))
    );

    const nextTrips = trips.filter((t) => t.id !== id);
    nextTrips.unshift({
      id,
      title: title || `Trip to ${draft.selectedCities.join(" & ")}`,
      savedAt: nowStr,
      draft,
      preferences,
      savedPlaceIds: cleanPlaceIds,
    });

    const envelope: SavedTripsEnvelope = {
      schemaVersion: 1,
      savedAt: nowStr,
      trips: nextTrips,
    };

    localStorage.setItem("hypeheritage_saved_trips", JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function deleteSavedTrip(id: string): boolean {
  if (!isClient()) return false;
  try {
    const trips = loadSavedTrips();
    const nextTrips = trips.filter((t) => t.id !== id);
    const envelope: SavedTripsEnvelope = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      trips: nextTrips,
    };
    localStorage.setItem("hypeheritage_saved_trips", JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function restoreSavedTrip(id: string): boolean {
  if (!isClient()) return false;
  try {
    const trips = loadSavedTrips();
    const found = trips.find((t) => t.id === id);
    if (!found) return false;

    const draftEnvelope = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      tripDraft: found.draft,
    };
    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(draftEnvelope));

    const prefsEnvelope = {
      schemaVersion: 4,
      savedAt: new Date().toISOString(),
      preferences: found.preferences,
    };
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefsEnvelope));

    // Restore saved place candidate IDs for this snapshot
    saveSavedPlaceIds(found.savedPlaceIds || []);

    return true;
  } catch {
    return false;
  }
}
