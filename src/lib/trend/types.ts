import { SupportedCity } from "../trip-domain";

export type TrendCategory =
  | "ALL"
  | "FOOD"
  | "CAFE"
  | "PLACE"
  | "CULTURE"
  | "BEAUTY"
  | "SHOPPING"
  | "EVENT"
  | "LEISURE";

export interface TrendTranslation {
  title: string;
  overview: string;
  tip: string;
  whyPopular?: string;
  reasonExplanation?: string;
  priceDisplay?: string;
  locationDisplay?: string;
}

export interface TrendItem {
  id: string;
  category: TrendCategory;
  categoryLabel?: {
    ko: string;
    en: string;
  };
  city: SupportedCity | "ALL";
  tags: string[];
  updatedAt: string;
  updatedText?: {
    ko: string;
    en: string;
  };
  badge?: {
    ko: string;
    en: string;
  };
  badgeType?: "HOT" | "EDITOR" | "RECENT" | "SEASON" | "TRENDING";
  imageUrl: string;
  isHero?: boolean;
  translations: Record<"ko" | "en", TrendTranslation>;
}

export interface PersonalizedTrendRecommendation {
  trend: TrendItem;
  reason: string;
}

