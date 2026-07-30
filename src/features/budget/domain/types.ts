/**
 * HypeHeritage Budget Basket MVP:
 * - Room count is fixed to 1 for all travelers.
 * - Integer operations are used for all KRW calculations.
 */
import { SupportedCity, BudgetTier, TripDraft } from "../../../lib/trip-domain";

export type BudgetCategory =
  | "ACCOMMODATION"
  | "FOOD"
  | "CITY_TRANSPORT"
  | "INTERCITY_TRANSPORT"
  | "ATTRACTION"
  | "EMERGENCY_FUND";

export type BudgetScope = "TRIP_WIDE" | "CITY" | "INTERCITY";

export type PricingUnit =
  | "ROOM_NIGHT"
  | "PERSON_DAY"
  | "PERSON_MEAL"
  | "PERSON_ONE_WAY"
  | "PER_PERSON"
  | "FIXED_AMOUNT"
  | "PERCENTAGE"
  | "PER_SERVING"
  | "SHARED_DISH"
  | "SET_MENU"
  | "PER_ITEM"
  | "PER_CUP"
  | "PER_TABLE";

export type CalculationStrategy =
  | "ROOM_NIGHT"
  | "PERSON_DAY"
  | "PERSON_MEAL"
  | "PERSON_ONE_WAY"
  | "PER_PERSON_FIXED"
  | "FIXED_AMOUNT"
  | "PERCENTAGE_OF_SUBTOTAL";

export type BudgetBasketId =
  // Accommodation
  | "BUDGET_STAY"
  | "STANDARD_HOTEL"
  | "PREMIUM_HERITAGE"
  // Food
  | "BUDGET_MEAL_PLAN"
  | "STANDARD_MEAL_PLAN"
  | "PREMIUM_MEAL_PLAN"
  // City Transportation
  | "BASIC_CITY_TRANSPORT"
  | "STANDARD_CITY_TRANSPORT"
  | "COMFORT_CITY_TRANSPORT"
  // Attractions
  | "MOSTLY_FREE"
  | "BALANCED"
  | "EXPERIENCE_RICH"
  // Intercity
  | "KTX_STANDARD"
  // Emergency
  | "EMERGENCY_FIXED";

export type PriceConfidence = "MOCK" | "ESTIMATED" | "VERIFIED_AVERAGE" | "OFFICIAL";

export interface BudgetBasketDefinition {
  id: BudgetBasketId;
  category: BudgetCategory;
  scope: BudgetScope;
  supportedBudgetTier: BudgetTier;
  applicableCity?: SupportedCity;
  applicableRoute?: string;
  representativePriceKrw: number;
  priceMinKrw: number;
  priceMaxKrw: number;
  pricingUnit: PricingUnit;
  calculationStrategy: CalculationStrategy;
  confidence: PriceConfidence;
  updatedAt: string;
  sourceLabel: string;
  isActive: boolean;
}

export interface BudgetLineItem {
  id: string; // Stable identifier, e.g. `${cityCode}_${basketId}`
  basketId: BudgetBasketId;
  category: BudgetCategory;
  scope: BudgetScope;
  cityCode?: SupportedCity | null;
  route?: string | null;
  unitPriceKrw: number;
  pricingUnit: PricingUnit;
  quantity: number;
  participantCount: number;
  durationCount: number;
  lineTotalKrw: number;
  priceMinKrw: number;
  priceMaxKrw: number;
  confidence: PriceConfidence;
  updatedAt: string;
  sourceLabel: string;
  mealPlan?: BaseMealPlan | CalculatedMealPlan;
}

export function isCalculatedMealPlan(
  mealPlan?: BaseMealPlan | CalculatedMealPlan
): mealPlan is CalculatedMealPlan {
  if (!mealPlan) return false;
  return "lineTotalKrw" in mealPlan && Array.isArray(mealPlan.issues);
}

export interface CityBudgetSection {
  cityCode: SupportedCity;
  nights: number;
  lineItems: BudgetLineItem[];
  subtotalKrw: number;
}

export interface IntercityBudgetSection {
  lineItems: BudgetLineItem[];
  subtotalKrw: number;
}

export interface TripWideBudgetSection {
  lineItems: BudgetLineItem[];
  subtotalKrw: number;
}

export interface BudgetPlan {
  schemaVersion: number;
  trip: TripDraft;
  citySections: Partial<Record<SupportedCity, CityBudgetSection | null>>;
  intercitySection: IntercityBudgetSection;
  tripWideSection: TripWideBudgetSection;
  categoryTotals: Record<BudgetCategory, number>;
  grandTotalKrw: number;
  perTravelerTotalKrw: number;
  dailyAverageKrw: number;
  targetBudgetKrw: number;
  targetBudgetUsagePercent: number;
  remainingBudgetKrw: number;
  overBudgetAmountKrw: number;
  generatedFromCatalogVersion: string;
}

export type AccommodationSelection =
  | { kind: "TIER"; basketId: BudgetBasketId }
  | {
      kind: "PLACE";
      placeId: string;
      basketId: BudgetBasketId;
      nightlyPriceKrw: number;
      priceSource: PriceConfidence;
      placeNameKo: string;
      placeNameEn: string;
      snapshotAt: string;
    };

export type AccommodationOverridesByCity = Partial<Record<SupportedCity, AccommodationSelection | BudgetBasketId>>;
export type AttractionOverridesByCity = Partial<Record<SupportedCity, BudgetBasketId>>;

export interface AttractionSelections {
  selectedCourseIds: string[];
  individualSpotIds: string[];
}
export type AttractionSelectionsByCity = Partial<Record<SupportedCity, AttractionSelections>>;

export interface BudgetPlanOverrides {
  accommodation?: AccommodationOverridesByCity;
  food?: FoodOverrides;
  foodAddOns?: FoodAddOnOverrides;
  attraction?: AttractionOverridesByCity;
  attractionSelections?: AttractionSelectionsByCity;
  emergencyFundKrw?: number;
}

export type FoodCollectionId = "ESSENTIALS" | "INTERNATIONAL" | "TRENDING" | "SPECIALTIES";

export interface FoodWishlistCollection {
  id: FoodCollectionId;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
}

export interface FoodItem {
  id: string;
  nameKo: string;
  nameEn: string;
  collectionIds: FoodCollectionId[];
  applicableCities: SupportedCity[];
  applicableSlots: MealSlot[];
  representativePriceKrw: number;
  pricingUnit: PricingUnit;
  confidence: PriceConfidence;
  updatedAt: string;
  sourceLabel: string;
}

export type FoodOverrides = Record<string, string>;

export interface FoodAddOnItem {
  id: string;
  nameKo: string;
  nameEn: string;
  parentFoodItemIds: string[];
  applicableCities: SupportedCity[];
  representativePriceKrw: number;
  pricingUnit: PricingUnit;
  maxQuantity: number;
  servingCapacity?: number;
  peoplePerSet?: number;
  tableCapacity?: number;
  isAlcohol: boolean;
  isBeverage: boolean;
  confidence: PriceConfidence;
  updatedAt: string;
  sourceLabel: string;
}

export interface FoodAddOnSelection {
  addOnItemId: string;
  quantity: number;
}

export type FoodAddOnOverrides = Record<string, FoodAddOnSelection[]>;

export interface EffectiveFoodAddOn {
  addOnItemId: string;
  nameKo: string;
  nameEn: string;
  unitPriceKrw: number;
  quantity: number;
  pricingUnit: PricingUnit;
  adultCountApplied: boolean;
  multiplier: number;
  lineTotalKrw: number;
}

export interface EffectiveMealSlot {
  id: string;
  city: SupportedCity;
  dayIndex: number;
  slot: MealSlot;
  unitPriceKrw: number;
  includedInBaseBudget: boolean;
  replacedByFoodItemId?: string;
  originalUnitPriceKrw: number;
  addOns?: EffectiveFoodAddOn[];
  addOnsTotalKrw?: number;
}

export type FoodReplacementIssueReason =
  | "SLOT_NOT_FOUND"
  | "FOOD_NOT_FOUND"
  | "CITY_NOT_ALLOWED"
  | "SLOT_NOT_ALLOWED"
  | "UNSUPPORTED_PRICING_UNIT"
  | "MALFORMED_SELECTION";

export interface FoodReplacementIssue {
  slotId: string;
  foodItemId: string;
  reason: FoodReplacementIssueReason;
}

export type FoodAddOnIssueReason =
  | "SLOT_NOT_FOUND"
  | "PARENT_FOOD_NOT_FOUND"
  | "PARENT_REPLACEMENT_NOT_APPLIED"
  | "ADD_ON_NOT_FOUND"
  | "ADD_ON_NOT_ALLOWED_FOR_PARENT"
  | "CITY_NOT_ALLOWED"
  | "INVALID_QUANTITY"
  | "QUANTITY_EXCEEDS_LIMIT"
  | "INVALID_PRICE"
  | "UNSUPPORTED_PRICING_UNIT"
  | "MALFORMED_SELECTION";

export interface FoodAddOnIssue {
  slotId: string;
  addOnItemId: string;
  parentFoodItemId?: string;
  reason: FoodAddOnIssueReason;
}

export interface CalculatedMealPlan {
  slots: EffectiveMealSlot[];
  perPersonBaseTotalKrw: number;
  lineTotalKrw: number;
  issues: FoodReplacementIssue[];
  addOnIssues?: FoodAddOnIssue[];
  addOnsTotalKrw?: number;
}

export interface PlannerPreferencesV1 {
  schemaVersion: 1;
  tripFingerprint: string;
  accommodationByCity: AccommodationOverridesByCity;
}

export interface PlannerPreferencesV2 {
  schemaVersion: 2;
  tripFingerprint: string;
  accommodationByCity: Partial<Record<SupportedCity, BudgetBasketId>>;
  foodOverrides: FoodOverrides;
}

export interface PlannerPreferencesV4 {
  schemaVersion: 4;
  tripFingerprint: string;
  accommodationByCity: AccommodationOverridesByCity;
  foodOverrides: FoodOverrides;
  addOnSelections: FoodAddOnOverrides;
  attractionByCity?: AttractionOverridesByCity;
  emergencyFundKrw?: number;
}

export interface PlannerPreferencesV5 {
  schemaVersion: 5;
  tripFingerprint: string;
  accommodationByCity: AccommodationOverridesByCity;
  foodOverrides: FoodOverrides;
  addOnSelections: FoodAddOnOverrides;
  attractionByCity?: AttractionOverridesByCity;
  attractionSelections?: AttractionSelectionsByCity;
  emergencyFundKrw?: number;
}

export interface PlannerPreferences {
  schemaVersion: number;
  tripFingerprint: string;
  accommodationByCity: AccommodationOverridesByCity;
  foodOverrides: FoodOverrides;
  addOnSelections: FoodAddOnOverrides;
  attractionByCity?: AttractionOverridesByCity;
  attractionSelections?: AttractionSelectionsByCity;
  emergencyFundKrw?: number;
  emergencyFundPct?: number;
}

export interface PlannerPreferencesEnvelope {
  schemaVersion: number;
  savedAt: string;
  preferences: PlannerPreferences;
}

export type MealSlot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK_CAFE";

export interface BaseMealSlot {
  id: string;
  city: SupportedCity;
  dayIndex: number;
  slot: MealSlot;
  unitPriceKrw: number;
  includedInBaseBudget: boolean;
}

export interface BaseMealPlan {
  slots: BaseMealSlot[];
  perPersonBaseTotalKrw: number;
}
