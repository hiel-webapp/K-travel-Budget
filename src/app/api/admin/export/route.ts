import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadAdminStore } from "../../../../lib/admin/admin-store";

export async function POST(req: NextRequest) {
  try {
    const store = await loadAdminStore();
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

    // Also export guides & FAQs to static-contents.ts if available in admin store
    if (store.guideItemsKo && store.guideItemsEn && store.guideFaqs) {
      const staticContentsPath = path.join(process.cwd(), "src", "lib", "static-contents.ts");
      if (fs.existsSync(staticContentsPath)) {
        let content = fs.readFileSync(staticContentsPath, "utf-8");

        // Update K_GUIDE_FAQS
        const faqsCode = `export const K_GUIDE_FAQS: GuideFAQ[] = ${JSON.stringify(store.guideFaqs, null, 2)};`;
        content = content.replace(/export const K_GUIDE_FAQS: GuideFAQ\[\] = \[[\s\S]*?\];/m, faqsCode);

        // Update K_GUIDE_CONTENTS
        const guideContentsObj = {
          ko: store.guideItemsKo,
          en: store.guideItemsEn,
        };
        const guidesCode = `export const K_GUIDE_CONTENTS: Record<"ko" | "en", GuideItem[]> = ${JSON.stringify(guideContentsObj, null, 2)};`;
        content = content.replace(/export const K_GUIDE_CONTENTS: Record<"ko" \| "en", GuideItem\[\]> = \{[\s\S]*?\n\};/m, guidesCode);

        fs.writeFileSync(staticContentsPath, content, "utf-8");
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully synchronized presets, guides, and FAQs into source code",
      totalPresets: store.presets.length,
      totalGuides: store.guideItemsKo?.length || 0,
      totalFaqs: store.guideFaqs?.length || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
