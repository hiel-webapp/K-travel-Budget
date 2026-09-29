import LZString from "lz-string";
import type { TripDraft, SupportedCity } from "./trip-domain";
import { ensureTripStops, DEFAULT_TRIP_DRAFT } from "./trip-domain";
import type { PlannerPreferences } from "../features/budget/domain/types";

export interface CompactSharedPlan {
  v: 1;
  c: SupportedCity[];
  na: Record<string, number>;
  a: number;
  tn: number;
  bt?: string;
  tb?: number;
  st?: any[];

  // Preferences
  acc?: Record<string, any>;
  fb?: Record<string, any>;
  att?: Record<string, any>;
  tr?: Record<string, any>;
  ico?: Record<string, any>;
  sh?: string;
  da?: number;
  em?: string;
}

/**
 * TripDraft 및 PlannerPreferences 객체를 초경량 URL-Safe 압축 문자열로 인코딩
 */
export function encodePlanToUrl(
  draft: TripDraft,
  preferences?: PlannerPreferences | null
): string {
  try {
    const compact: CompactSharedPlan = {
      v: 1,
      c: draft.selectedCities || [],
      na: draft.cityNightAllocations || {},
      a: draft.adultCount || 1,
      tn: draft.totalNights || 0,
      bt: draft.budgetTier || undefined,
      tb: draft.targetBudgetKrw,
      st: draft.stops,
    };

    if (preferences) {
      if (preferences.accommodationByCity) compact.acc = preferences.accommodationByCity;
      if (preferences.foodBasketSelectionsByStop) compact.fb = preferences.foodBasketSelectionsByStop;
      if (preferences.attractionSelectionsByStop) compact.att = preferences.attractionSelectionsByStop;
      if (preferences.cityTransitStyles) compact.tr = preferences.cityTransitStyles;
      if (preferences.intercityTransportOverrides) compact.ico = preferences.intercityTransportOverrides;
      if (preferences.shoppingOption) compact.sh = preferences.shoppingOption;
      if (preferences.shoppingAmountKrw !== undefined) compact.da = preferences.shoppingAmountKrw;
      if (preferences.emergencyFundKrw !== undefined) compact.em = String(preferences.emergencyFundKrw);
    }

    const jsonStr = JSON.stringify(compact);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (err) {
    console.error("[SharePlan] 인코딩 오류:", err);
    return "";
  }
}

/**
 * URL-Safe 압축 문자열로부터 TripDraft 및 PlannerPreferences 복원
 */
export function decodePlanFromUrl(
  encodedStr: string
): { draft: TripDraft; preferences: PlannerPreferences } | null {
  try {
    if (!encodedStr || typeof encodedStr !== "string") return null;

    const jsonStr = LZString.decompressFromEncodedURIComponent(encodedStr);
    if (!jsonStr) return null;

    const compact: CompactSharedPlan = JSON.parse(jsonStr);
    if (!compact || compact.v !== 1 || !Array.isArray(compact.c) || compact.c.length === 0) {
      return null;
    }

    // TripDraft 복원
    const draft: TripDraft = {
      ...DEFAULT_TRIP_DRAFT,
      selectedCities: compact.c,
      cityNightAllocations: compact.na || {},
      adultCount: compact.a || 1,
      totalNights: compact.tn || 0,
      budgetTier: (compact.bt as any) || "STANDARD",
      targetBudgetKrw: compact.tb || 0,
      stops: compact.st && Array.isArray(compact.st) && compact.st.length > 0 ? compact.st : [],
    };
    draft.stops = ensureTripStops(draft);

    // PlannerPreferences 복원
    const preferences: PlannerPreferences = {
      schemaVersion: 5,
      tripFingerprint: "",
      accommodationByCity: compact.acc || {},
      foodOverrides: {},
      addOnSelections: {},
      foodBasketSelectionsByStop: compact.fb || {},
      attractionSelectionsByStop: compact.att || {},
      cityTransitStyles: compact.tr || {},
      intercityTransportOverrides: compact.ico || {},
      shoppingOption: (compact.sh as any) || "MODERATE",
      shoppingAmountKrw: compact.da,
      emergencyFundKrw: compact.em ? Number(compact.em) : undefined,
    };

    return { draft, preferences };
  } catch (err) {
    console.error("[SharePlan] 디코딩 오류:", err);
    return null;
  }
}
