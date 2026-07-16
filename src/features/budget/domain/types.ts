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
  | "PERCENTAGE";

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
  citySections: Record<SupportedCity, CityBudgetSection | null>;
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
