import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadAdminStore } from "../../../../lib/admin/admin-store";

export async function POST(req: NextRequest) {
  try {
    const store = loadAdminStore();
    const presetsPath = path.join(process.cwd(), "src", "lib", "presets", "travel-presets.ts");

    // Format presets into clean TS string
    const presetsTsCode = `import { SupportedCity, TripDraft } from "../trip-domain";
import { BudgetBasketId, FoodBasketItemSelection } from "../../features/budget/domain/types";
import type { SavePlannerPreferencesInput } from "../storage-helper";

export type TravelPresetId = string;

export type TravelPresetPreferences = Omit<Partial<SavePlannerPreferencesInput>, "draft">;

export interface TravelPreset {
  id: TravelPresetId;
  badgeKo: string;
  badgeEn: string;
  titleKo: string;
  titleEn: string;
  taglineKo: string;
  taglineEn: string;
  summaryKo: string;
  summaryEn: string;
  imageUrl: string;
  accentColor: string;
  lightBg: string;
  badgeBg: string;
  badgeText: string;
  routeTextKo: string;
  routeTextEn: string;
  estimatedBudgetKrw: number;
  highlightTagsKo: string[];
  highlightTagsEn: string[];
  draft: TripDraft;
  preferences: TravelPresetPreferences;
  isActive?: boolean;
  order?: number;
  isCustom?: boolean;
}

export const TRAVEL_PRESETS: TravelPreset[] = ${JSON.stringify(store.presets, null, 2)};

let dynamicPresetsCache: TravelPreset[] | null = null;

export function setDynamicPresets(presets: TravelPreset[]) {
  dynamicPresetsCache = presets;
}

export function getTravelPresets(includeInactive = false): TravelPreset[] {
  const list = dynamicPresetsCache ?? TRAVEL_PRESETS;
  if (includeInactive) return list;
  return list.filter((p) => p.isActive !== false);
}

export function getTravelPresetById(id: string): TravelPreset | undefined {
  const list = dynamicPresetsCache ?? TRAVEL_PRESETS;
  return list.find((p) => p.id === id);
}
`;

    fs.writeFileSync(presetsPath, presetsTsCode, "utf-8");

    return NextResponse.json({
      success: true,
      message: "Successfully synchronized presets into src/lib/presets/travel-presets.ts",
      totalPresets: store.presets.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
