import fs from "fs";
import path from "path";
import { TRAVEL_PRESETS, TravelPreset, setDynamicPresets } from "../presets/travel-presets";
import { ALL_FOOD_ITEMS } from "../../features/budget/catalog/food-catalog";
import { ATTRACTION_SPOTS_CATALOG, AttractionSpot, TOUR_COURSE_PRESETS, TourCoursePreset } from "../../features/budget/catalog/attraction-spots";
import { FoodItemDefinition } from "../../features/budget/domain/types";
import { SupportedCity } from "../trip-domain";

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
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "admin-store.json");

let memoryCache: AdminStoreData | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
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
    lastUpdated: new Date().toISOString(),
  };
}

export function loadAdminStore(): AdminStoreData {
  if (memoryCache) {
    return memoryCache;
  }

  ensureDataDirectory();

  if (!fs.existsSync(STORE_FILE)) {
    const initial = getInitialStore();
    saveAdminStore(initial);
    memoryCache = initial;
    setDynamicPresets(initial.presets);
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AdminStoreData>;

    const merged: AdminStoreData = {
      presets: Array.isArray(parsed.presets) && parsed.presets.length > 0 ? parsed.presets : getInitialStore().presets,
      foodItems: Array.isArray(parsed.foodItems) && parsed.foodItems.length > 0 ? parsed.foodItems : getInitialStore().foodItems,
      attractionSpots: Array.isArray(parsed.attractionSpots) && parsed.attractionSpots.length > 0 ? parsed.attractionSpots : getInitialStore().attractionSpots,
      tourCourses: Array.isArray(parsed.tourCourses) && parsed.tourCourses.length > 0 ? parsed.tourCourses : getInitialStore().tourCourses,
      sortingRulesByCity: parsed.sortingRulesByCity || getInitialStore().sortingRulesByCity,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };

    memoryCache = merged;
    setDynamicPresets(merged.presets);
    return merged;
  } catch (error) {
    console.error("[AdminStore] Failed to read store file, falling back to base initial:", error);
    const initial = getInitialStore();
    memoryCache = initial;
    return initial;
  }
}

export function saveAdminStore(data: AdminStoreData): void {
  ensureDataDirectory();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  memoryCache = data;
  setDynamicPresets(data.presets);
}

// ==========================================
// 1. Preset Management API Methods
// ==========================================

export function getAdminPresets(includeInactive = true): TravelPreset[] {
  const store = loadAdminStore();
  const sorted = [...store.presets].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  if (includeInactive) return sorted;
  return sorted.filter((p) => p.isActive !== false);
}

export function createAdminPreset(newPreset: TravelPreset): TravelPreset {
  const store = loadAdminStore();
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

  saveAdminStore(store);
  return preset;
}

export function updateAdminPreset(id: string, updates: Partial<TravelPreset>): TravelPreset {
  const store = loadAdminStore();
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
  saveAdminStore(store);
  return updated;
}

export function deleteAdminPreset(id: string, hardDelete = false): void {
  const store = loadAdminStore();
  if (hardDelete) {
    store.presets = store.presets.filter((p) => p.id !== id);
  } else {
    const idx = store.presets.findIndex((p) => p.id === id);
    if (idx >= 0) {
      store.presets[idx].isActive = false;
    }
  }
  saveAdminStore(store);
}

export function reorderAdminPresets(orderedIds: string[]): TravelPreset[] {
  const store = loadAdminStore();
  orderedIds.forEach((id, idx) => {
    const p = store.presets.find((item) => item.id === id);
    if (p) {
      p.order = idx + 1;
    }
  });
  saveAdminStore(store);
  return getAdminPresets(true);
}

export function resetAdminPresets(): TravelPreset[] {
  const store = loadAdminStore();
  const initial = getInitialStore();
  store.presets = initial.presets;
  saveAdminStore(store);
  return store.presets;
}

// ==========================================
// 2. Food Management API Methods
// ==========================================

export function getAdminFoods(filter?: {
  city?: SupportedCity | "NATIONAL" | "ALL";
  scope?: PlacementScope | "ALL";
  includeInactive?: boolean;
}): FoodItemDefinition[] {
  const store = loadAdminStore();
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

export function saveAdminFood(item: FoodItemDefinition): FoodItemDefinition {
  const store = loadAdminStore();
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

  saveAdminStore(store);
  return targetItem;
}

export function deleteAdminFood(id: string): void {
  const store = loadAdminStore();
  store.foodItems = store.foodItems.filter((f) => f.id !== id);
  saveAdminStore(store);
}

// ==========================================
// 3. Attraction Management API Methods
// ==========================================

export function getAdminAttractions(filter?: {
  city?: SupportedCity | "ALL";
  scope?: PlacementScope | "ALL";
  includeInactive?: boolean;
}): AttractionSpot[] {
  const store = loadAdminStore();
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

export function saveAdminAttraction(spot: AttractionSpot): AttractionSpot {
  const store = loadAdminStore();
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

  saveAdminStore(store);
  return targetSpot;
}

export function deleteAdminAttraction(id: string): void {
  const store = loadAdminStore();
  store.attractionSpots = store.attractionSpots.filter((s) => s.id !== id);
  saveAdminStore(store);
}

// ==========================================
// 4. Tour Courses Management
// ==========================================

export function getAdminTourCourses(city?: SupportedCity | "ALL"): TourCoursePreset[] {
  const store = loadAdminStore();
  if (city && city !== "ALL") {
    return store.tourCourses.filter((c) => c.cityCode === city);
  }
  return store.tourCourses;
}

export function saveAdminTourCourse(course: TourCoursePreset): TourCoursePreset {
  const store = loadAdminStore();
  const idx = store.tourCourses.findIndex((c) => c.id === course.id);
  if (idx >= 0) {
    store.tourCourses[idx] = course;
  } else {
    store.tourCourses.push(course);
  }
  saveAdminStore(store);
  return course;
}

export function deleteAdminTourCourse(id: string): void {
  const store = loadAdminStore();
  store.tourCourses = store.tourCourses.filter((c) => c.id !== id);
  saveAdminStore(store);
}

// ==========================================
// 5. Sorting Rules Configuration
// ==========================================

export function getAdminSortingRules(): Record<string, SortingRuleType> {
  const store = loadAdminStore();
  return store.sortingRulesByCity;
}

export function saveAdminSortingRule(city: string, rule: SortingRuleType): void {
  const store = loadAdminStore();
  store.sortingRulesByCity[city] = rule;
  saveAdminStore(store);
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
