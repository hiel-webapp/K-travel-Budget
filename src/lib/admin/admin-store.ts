import fs from "fs";
import path from "path";
import { TRAVEL_PRESETS, TravelPreset, setDynamicPresets } from "../presets/travel-presets";
import { ALL_FOOD_ITEMS } from "../../features/budget/catalog/food-catalog";
import { ATTRACTION_SPOTS_CATALOG, AttractionSpot, TOUR_COURSE_PRESETS, TourCoursePreset } from "../../features/budget/catalog/attraction-spots";
import { FoodItemDefinition } from "../../features/budget/domain/types";
import { SupportedCity } from "../trip-domain";
import { K_GUIDE_CONTENTS, K_GUIDE_FAQS, GuideItem, GuideFAQ } from "../static-contents";
import { GUIDE_CARDS, GuideCard } from "../../data/guide-cards";

export type PlacementScope = "CITY_PLANNER" | "K_SPOT" | "BOTH";

export type SortingRuleType =
  | "CUSTOM_ORDER"
  | "RECOMMENDED"
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "NAME_ASC"
  | "LATEST";

export interface AdminStoreData {
  presets: TravelPreset[];
  foodItems: FoodItemDefinition[];
  attractionSpots: AttractionSpot[];
  tourCourses: TourCoursePreset[];
  sortingRulesByCity: Record<string, SortingRuleType>;
  guideItemsKo?: GuideItem[];
  guideItemsEn?: GuideItem[];
  guideFaqs?: GuideFAQ[];
  guideCards?: GuideCard[];
  adminPin?: string;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "admin-store.json");

const SUPABASE_STORAGE_URL = "https://aqfvmuytaukrkdmememh.supabase.co/storage/v1/object/admin_data/admin-store.json";
const SUPABASE_PUBLIC_URL = "https://aqfvmuytaukrkdmememh.supabase.co/storage/v1/object/public/admin_data/admin-store.json";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZnZtdXl0YXVrcmtkbWVtZW1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY5MzQzNSwiZXhwIjoyMTAwMjY5NDM1fQ.p6Dqme9d0QdKyg5ijvvmeEwT0BJ5fdi8vATCc_IkW7Q";

let memoryCache: AdminStoreData | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30초 캐시로 불필요한 중복 원격 fetch 방지

function ensureDataDirectory() {
  try {
    if (typeof fs !== "undefined" && fs.existsSync && !fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function getInitialStore(): AdminStoreData {
  const initialPresets: TravelPreset[] = TRAVEL_PRESETS.map((preset, idx) => ({
    ...preset,
    isActive: true,
    order: idx + 1,
    isCustom: false,
  }));

  const initialFoods: FoodItemDefinition[] = ALL_FOOD_ITEMS.map((item, idx) => ({
    ...item,
    targetScope: item.targetScope || "BOTH",
    sortOrder: item.sortOrder ?? idx + 1,
    isActive: item.isActive !== false,
  }));

  const initialAttractions: AttractionSpot[] = ATTRACTION_SPOTS_CATALOG.map((spot, idx) => ({
    ...spot,
    targetScope: spot.targetScope || "BOTH",
    sortOrder: spot.sortOrder ?? idx + 1,
    isActive: spot.isActive !== false,
  }));

  const initialCourses: TourCoursePreset[] = [...TOUR_COURSE_PRESETS];

  const defaultSorting: Record<string, SortingRuleType> = {
    DEFAULT: "RECOMMENDED",
    SEOUL: "RECOMMENDED",
    BUSAN: "RECOMMENDED",
    JEJU: "RECOMMENDED",
    JEONJU: "RECOMMENDED",
    GANGNEUNG: "RECOMMENDED",
    GYEONGJU: "RECOMMENDED",
  };

  return {
    presets: initialPresets,
    foodItems: initialFoods,
    attractionSpots: initialAttractions,
    tourCourses: initialCourses,
    sortingRulesByCity: defaultSorting,
    guideItemsKo: [...K_GUIDE_CONTENTS.ko],
    guideItemsEn: [...K_GUIDE_CONTENTS.en],
    guideFaqs: [...K_GUIDE_FAQS],
    guideCards: [...GUIDE_CARDS],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Supabase Storage에서 실시간 최신 데이터를 다운로드합니다.
 */
async function fetchFromSupabase(): Promise<AdminStoreData | null> {
  try {
    const res = await fetch(`${SUPABASE_PUBLIC_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (res.ok) {
      const data = (await res.json()) as AdminStoreData;
      if (data && Array.isArray(data.presets) && data.presets.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("[AdminStore] Supabase live fetch failed, fallback to local:", err);
  }
  return null;
}

/**
 * Supabase Storage로 실시간 업로드하여 전 세계에 즉시 배포합니다.
 */
async function uploadToSupabase(data: AdminStoreData): Promise<void> {
  try {
    await fetch(SUPABASE_STORAGE_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("[AdminStore] Supabase live upload failed:", err);
  }
}

/**
 * 비동기 로드: 메모리 캐시(30초 TTL)를 먼저 확인하고, 만료되었을 때 Supabase 원격 DB를 조회합니다.
 */
export async function loadAdminStore(): Promise<AdminStoreData> {
  const now = Date.now();
  if (memoryCache && now - lastCacheFetchTime < CACHE_TTL_MS) {
    return memoryCache;
  }

  const remote = await fetchFromSupabase();
  if (remote) {
    memoryCache = remote;
    lastCacheFetchTime = now;
    setDynamicPresets(remote.presets);
    ensureDataDirectory();
    try {
      if (typeof fs !== "undefined" && fs.writeFileSync) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(remote, null, 2), "utf-8");
      }
    } catch {}
    return remote;
  }

  if (memoryCache) {
    return memoryCache;
  }

  ensureDataDirectory();

  if (typeof fs !== "undefined" && fs.existsSync && fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as AdminStoreData;
      memoryCache = parsed;
      lastCacheFetchTime = now;
      setDynamicPresets(parsed.presets);
      return parsed;
    } catch {}
  }

  const initial = getInitialStore();
  memoryCache = initial;
  lastCacheFetchTime = now;
  setDynamicPresets(initial.presets);
  return initial;
}

/**
 * 비동기 저장: 로컬 파일 및 메모리에 저장 후, Supabase Storage로 즉시 실시간 동기화합니다.
 */
export async function saveAdminStore(data: AdminStoreData): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  memoryCache = data;
  lastCacheFetchTime = Date.now();
  setDynamicPresets(data.presets);

  ensureDataDirectory();
  try {
    if (typeof fs !== "undefined" && fs.writeFileSync) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch {}

  // 정적 travel-presets.ts 파일도 최신 프리셋과 동기화하여 빌드 및 SSR 단계의 플리커링 영구 방지
  try {
    const presetsPath = path.join(process.cwd(), "src", "lib", "presets", "travel-presets.ts");
    if (fs.existsSync(presetsPath)) {
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

export const TRAVEL_PRESETS: TravelPreset[] = ${JSON.stringify(data.presets, null, 2)};

let dynamicPresetsCache: TravelPreset[] | null = null;

export function setDynamicPresets(presets: TravelPreset[]) {
  dynamicPresetsCache = presets;
}

export function getTravelPresets(includeInactive = false): TravelPreset[] {
  const list = dynamicPresetsCache ?? TRAVEL_PRESETS;
  if (includeInactive) return list;
  return list.filter((p) => p.isActive !== false);
}

export function getTravelPresetById(id: TravelPresetId): TravelPreset | undefined {
  const list = dynamicPresetsCache ?? TRAVEL_PRESETS;
  return list.find((p) => p.id === id);
}
`;
      fs.writeFileSync(presetsPath, presetsTsCode, "utf-8");
    }
  } catch (syncErr) {
    console.warn("[AdminStore] travel-presets.ts sync skipped:", syncErr);
  }

  // Supabase 원격 실시간 저장
  await uploadToSupabase(data);
}

// ==========================================
// 1. Preset Management API Methods
// ==========================================

export async function getAdminPresets(includeInactive = true): Promise<TravelPreset[]> {
  const store = await loadAdminStore();
  const sorted = [...store.presets].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  if (includeInactive) return sorted;
  return sorted.filter((p) => p.isActive !== false);
}

export async function createAdminPreset(newPreset: TravelPreset): Promise<TravelPreset> {
  const store = await loadAdminStore();
  const maxOrder = store.presets.reduce((max, p) => Math.max(max, p.order ?? 0), 0);
  const preset: TravelPreset = {
    ...newPreset,
    order: newPreset.order ?? maxOrder + 1,
    isActive: newPreset.isActive ?? true,
    isCustom: true,
  };

  const existingIdx = store.presets.findIndex((p) => p.id === preset.id);
  if (existingIdx >= 0) {
    store.presets[existingIdx] = preset;
  } else {
    store.presets.push(preset);
  }

  await saveAdminStore(store);
  return preset;
}

export async function updateAdminPreset(id: string, updates: Partial<TravelPreset>): Promise<TravelPreset> {
  const store = await loadAdminStore();
  const idx = store.presets.findIndex((p) => p.id === id);
  if (idx === -1) {
    throw new Error(`Preset with ID ${id} not found`);
  }

  const updated: TravelPreset = {
    ...store.presets[idx],
    ...updates,
    id, // protect ID
  };

  store.presets[idx] = updated;
  await saveAdminStore(store);
  return updated;
}

export async function deleteAdminPreset(id: string, hardDelete = false): Promise<void> {
  const store = await loadAdminStore();
  if (hardDelete) {
    store.presets = store.presets.filter((p) => p.id !== id);
  } else {
    const idx = store.presets.findIndex((p) => p.id === id);
    if (idx >= 0) {
      store.presets[idx].isActive = false;
    }
  }
  await saveAdminStore(store);
}

export async function reorderAdminPresets(orderedIds: string[]): Promise<TravelPreset[]> {
  const store = await loadAdminStore();
  orderedIds.forEach((id, idx) => {
    const p = store.presets.find((item) => item.id === id);
    if (p) {
      p.order = idx + 1;
    }
  });
  await saveAdminStore(store);
  return getAdminPresets(true);
}

export async function resetAdminPresets(): Promise<TravelPreset[]> {
  const store = await loadAdminStore();
  const initial = getInitialStore();
  store.presets = initial.presets;
  await saveAdminStore(store);
  return store.presets;
}

// ==========================================
// 2. Food Management API Methods
// ==========================================

export async function getAdminFoods(filter?: {
  city?: SupportedCity | "NATIONAL" | "ALL";
  scope?: PlacementScope | "ALL";
  includeInactive?: boolean;
}): Promise<FoodItemDefinition[]> {
  const store = await loadAdminStore();
  let items = [...store.foodItems];

  if (!filter?.includeInactive) {
    items = items.filter((f) => f.isActive !== false);
  }

  if (filter?.city && filter.city !== "ALL") {
    if (filter.city === "NATIONAL") {
      items = items.filter((f) => f.scope === "NATIONAL");
    } else {
      items = items.filter((f) => f.cityCode === filter.city || f.scope === "NATIONAL");
    }
  }

  if (filter?.scope && filter.scope !== "ALL") {
    items = items.filter((f) => {
      const target = f.targetScope || "BOTH";
      return target === "BOTH" || target === filter.scope;
    });
  }

  const cityKey = (filter?.city && filter.city !== "ALL" && filter.city !== "NATIONAL") ? filter.city : "DEFAULT";
  const rule = store.sortingRulesByCity[cityKey] || "RECOMMENDED";
  return applyFoodSorting(items, rule);
}

export async function saveAdminFood(item: FoodItemDefinition): Promise<FoodItemDefinition> {
  const store = await loadAdminStore();
  const targetItem: FoodItemDefinition = {
    ...item,
    targetScope: item.targetScope || "BOTH",
    isActive: item.isActive ?? true,
  };

  const idx = store.foodItems.findIndex((f) => f.id === targetItem.id);
  if (idx >= 0) {
    store.foodItems[idx] = { ...store.foodItems[idx], ...targetItem };
  } else {
    store.foodItems.push(targetItem);
  }

  await saveAdminStore(store);
  return targetItem;
}

export async function deleteAdminFood(id: string): Promise<void> {
  const store = await loadAdminStore();
  store.foodItems = store.foodItems.filter((f) => f.id !== id);
  await saveAdminStore(store);
}

// ==========================================
// 3. Attraction Management API Methods
// ==========================================

export async function getAdminAttractions(filter?: {
  city?: SupportedCity | "ALL";
  scope?: PlacementScope | "ALL";
  includeInactive?: boolean;
}): Promise<AttractionSpot[]> {
  const store = await loadAdminStore();
  let items = [...store.attractionSpots];

  if (!filter?.includeInactive) {
    items = items.filter((s) => s.isActive !== false);
  }

  if (filter?.city && filter.city !== "ALL") {
    items = items.filter((s) => s.cityCode === filter.city);
  }

  if (filter?.scope && filter.scope !== "ALL") {
    items = items.filter((s) => {
      const target = s.targetScope || "BOTH";
      return target === "BOTH" || target === filter.scope;
    });
  }

  const cityKey = filter?.city && filter.city !== "ALL" ? filter.city : "DEFAULT";
  const rule = store.sortingRulesByCity[cityKey] || "RECOMMENDED";
  return applyAttractionSorting(items, rule);
}

export async function saveAdminAttraction(spot: AttractionSpot): Promise<AttractionSpot> {
  const store = await loadAdminStore();
  const targetSpot: AttractionSpot = {
    ...spot,
    targetScope: spot.targetScope || "BOTH",
    isActive: spot.isActive ?? true,
  };

  const idx = store.attractionSpots.findIndex((s) => s.id === targetSpot.id);
  if (idx >= 0) {
    store.attractionSpots[idx] = { ...store.attractionSpots[idx], ...targetSpot };
  } else {
    store.attractionSpots.push(targetSpot);
  }

  await saveAdminStore(store);
  return targetSpot;
}

export async function deleteAdminAttraction(id: string): Promise<void> {
  const store = await loadAdminStore();
  store.attractionSpots = store.attractionSpots.filter((s) => s.id !== id);
  await saveAdminStore(store);
}

// ==========================================
// 4. Tour Courses Management
// ==========================================

export async function getAdminTourCourses(
  city?: SupportedCity | "ALL",
  includeInactive = true
): Promise<TourCoursePreset[]> {
  const store = await loadAdminStore();
  let list = [...store.tourCourses];
  if (!includeInactive) {
    list = list.filter((c) => c.isActive !== false);
  }
  if (city && city !== "ALL") {
    return list.filter((c) => c.cityCode === city);
  }
  return list;
}

export async function saveAdminTourCourse(course: TourCoursePreset): Promise<TourCoursePreset> {
  const store = await loadAdminStore();
  const targetCourse: TourCoursePreset = {
    ...course,
    isActive: course.isActive ?? true,
  };
  const idx = store.tourCourses.findIndex((c) => c.id === targetCourse.id);
  if (idx >= 0) {
    store.tourCourses[idx] = targetCourse;
  } else {
    store.tourCourses.push(targetCourse);
  }
  await saveAdminStore(store);
  return targetCourse;
}

export async function deleteAdminTourCourse(id: string): Promise<void> {
  const store = await loadAdminStore();
  store.tourCourses = store.tourCourses.filter((c) => c.id !== id);
  await saveAdminStore(store);
}

// ==========================================
// 5. Sorting Rules Configuration
// ==========================================

export async function getAdminSortingRules(): Promise<Record<string, SortingRuleType>> {
  const store = await loadAdminStore();
  return store.sortingRulesByCity;
}

export async function saveAdminSortingRule(city: string, rule: SortingRuleType): Promise<void> {
  const store = await loadAdminStore();
  store.sortingRulesByCity[city] = rule;
  await saveAdminStore(store);
}

// ==========================================
// Sorting Helpers
// ==========================================

function applyFoodSorting(items: FoodItemDefinition[], rule: SortingRuleType): FoodItemDefinition[] {
  const list = [...items];
  switch (rule) {
    case "CUSTOM_ORDER":
      return list.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    case "RECOMMENDED":
      return list.sort((a, b) => {
        if (a.isMustEatTop3 && !b.isMustEatTop3) return -1;
        if (!a.isMustEatTop3 && b.isMustEatTop3) return 1;
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      });
    case "PRICE_ASC":
      return list.sort((a, b) => a.unitPriceKrw - b.unitPriceKrw);
    case "PRICE_DESC":
      return list.sort((a, b) => b.unitPriceKrw - a.unitPriceKrw);
    case "NAME_ASC":
      return list.sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
    case "LATEST":
      return list.reverse();
    default:
      return list;
  }
}

function applyAttractionSorting(items: AttractionSpot[], rule: SortingRuleType): AttractionSpot[] {
  const list = [...items];
  switch (rule) {
    case "CUSTOM_ORDER":
      return list.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    case "RECOMMENDED":
      return list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      });
    case "PRICE_ASC":
      return list.sort((a, b) => a.price - b.price);
    case "PRICE_DESC":
      return list.sort((a, b) => b.price - a.price);
    case "NAME_ASC":
      return list.sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
    case "LATEST":
      return list.reverse();
    default:
      return list;
  }
}

// ==========================================
// 6. Admin Authentication & PIN Management
// ==========================================

export async function getAdminPin(): Promise<string> {
  const store = await loadAdminStore();
  return process.env.ADMIN_PIN || store.adminPin || "1234";
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const currentPin = await getAdminPin();
  return currentPin.trim() === pin.trim();
}

export async function updateAdminPin(newPin: string): Promise<boolean> {
  if (!newPin || newPin.trim().length < 4) {
    throw new Error("PIN 번호는 최소 4자리 이상이어야 합니다.");
  }
  const store = await loadAdminStore();
  store.adminPin = newPin.trim();
  await saveAdminStore(store);
  return true;
}

// ==========================================
// 7. K-Guide Articles & FAQs Management
// ==========================================

export async function getAdminGuides(locale: "ko" | "en" = "ko"): Promise<GuideItem[]> {
  const store = await loadAdminStore();
  if (locale === "en") {
    return store.guideItemsEn || [...K_GUIDE_CONTENTS.en];
  }
  return store.guideItemsKo || [...K_GUIDE_CONTENTS.ko];
}

export async function getAdminBilingualGuide(id: string): Promise<{ ko?: GuideItem; en?: GuideItem } | null> {
  const store = await loadAdminStore();
  const koList = store.guideItemsKo || [...K_GUIDE_CONTENTS.ko];
  const enList = store.guideItemsEn || [...K_GUIDE_CONTENTS.en];
  const ko = koList.find((g) => g.id === id);
  const en = enList.find((g) => g.id === id);
  if (!ko && !en) return null;
  return { ko, en };
}

export async function saveAdminGuide(guideKo: GuideItem, guideEn?: GuideItem): Promise<boolean> {
  const store = await loadAdminStore();
  if (!store.guideItemsKo) store.guideItemsKo = [...K_GUIDE_CONTENTS.ko];
  if (!store.guideItemsEn) store.guideItemsEn = [...K_GUIDE_CONTENTS.en];

  // 한국어 가이드 저장/업데이트
  const koIdx = store.guideItemsKo.findIndex((g) => g.id === guideKo.id);
  if (koIdx >= 0) {
    store.guideItemsKo[koIdx] = { ...guideKo };
  } else {
    store.guideItemsKo.push({ ...guideKo });
  }

  // 영문 가이드 저장/업데이트
  if (guideEn) {
    const enIdx = store.guideItemsEn.findIndex((g) => g.id === guideEn.id);
    if (enIdx >= 0) {
      store.guideItemsEn[enIdx] = { ...guideEn };
    } else {
      store.guideItemsEn.push({ ...guideEn });
    }
  }

  await saveAdminStore(store);
  return true;
}

export async function setHeroGuide(id: string): Promise<boolean> {
  const store = await loadAdminStore();
  if (!store.guideItemsKo) store.guideItemsKo = [...K_GUIDE_CONTENTS.ko];
  if (!store.guideItemsEn) store.guideItemsEn = [...K_GUIDE_CONTENTS.en];

  store.guideItemsKo = store.guideItemsKo.map((g) => ({
    ...g,
    isHero: g.id === id,
  }));

  store.guideItemsEn = store.guideItemsEn.map((g) => ({
    ...g,
    isHero: g.id === id,
  }));

  await saveAdminStore(store);
  return true;
}

export async function deleteAdminGuide(id: string): Promise<boolean> {
  const store = await loadAdminStore();
  if (!store.guideItemsKo) store.guideItemsKo = [...K_GUIDE_CONTENTS.ko];
  if (!store.guideItemsEn) store.guideItemsEn = [...K_GUIDE_CONTENTS.en];

  store.guideItemsKo = store.guideItemsKo.filter((g) => g.id !== id);
  store.guideItemsEn = store.guideItemsEn.filter((g) => g.id !== id);

  await saveAdminStore(store);
  return true;
}

export async function getAdminFaqs(): Promise<GuideFAQ[]> {
  const store = await loadAdminStore();
  return store.guideFaqs || [...K_GUIDE_FAQS];
}

export async function saveAdminFaq(faq: GuideFAQ): Promise<boolean> {
  const store = await loadAdminStore();
  if (!store.guideFaqs) store.guideFaqs = [...K_GUIDE_FAQS];

  const idx = store.guideFaqs.findIndex((f) => f.id === faq.id);
  if (idx >= 0) {
    store.guideFaqs[idx] = { ...faq };
  } else {
    store.guideFaqs.push({ ...faq });
  }

  await saveAdminStore(store);
  return true;
}

export async function deleteAdminFaq(id: string): Promise<boolean> {
  const store = await loadAdminStore();
  if (!store.guideFaqs) store.guideFaqs = [...K_GUIDE_FAQS];

  store.guideFaqs = store.guideFaqs.filter((f) => f.id !== id);
  await saveAdminStore(store);
  return true;
}

// ==========================================
// 8. 6-Category GuideCard Deck Management
// ==========================================

export async function getAdminGuideCards(): Promise<GuideCard[]> {
  const store = await loadAdminStore();
  if (store.guideCards && Array.isArray(store.guideCards) && store.guideCards.length > 0) {
    return store.guideCards;
  }
  return [...GUIDE_CARDS];
}

export async function saveAdminGuideCard(card: GuideCard): Promise<boolean> {
  const store = await loadAdminStore();
  if (!store.guideCards || !Array.isArray(store.guideCards) || store.guideCards.length === 0) {
    store.guideCards = [...GUIDE_CARDS];
  }

  const idx = store.guideCards.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    store.guideCards[idx] = { ...card };
  } else {
    store.guideCards.push({ ...card });
  }

  await saveAdminStore(store);
  return true;
}

export async function deleteAdminGuideCard(id: string): Promise<boolean> {
  const store = await loadAdminStore();
  if (!store.guideCards || !Array.isArray(store.guideCards) || store.guideCards.length === 0) {
    store.guideCards = [...GUIDE_CARDS];
  }

  store.guideCards = store.guideCards.filter((c) => c.id !== id);
  await saveAdminStore(store);
  return true;
}

export async function resetAdminGuideCards(): Promise<GuideCard[]> {
  const store = await loadAdminStore();
  store.guideCards = [...GUIDE_CARDS];
  await saveAdminStore(store);
  return store.guideCards;
}


