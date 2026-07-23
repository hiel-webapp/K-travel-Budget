import { SupportedCity } from "../trip-domain";

export type TrendCategory = "CULTURE" | "BEAUTY" | "FOOD" | "LEISURE";

export interface TrendTranslation {
  title: string;
  overview: string;
  tip: string;
  reasonExplanation?: string;
}

export interface TrendItem {
  id: string;
  category: TrendCategory;
  city: SupportedCity | "ALL";
  tags: string[];
  updatedAt: string;
  translations: Record<"ko" | "en", TrendTranslation>;
}

export interface PersonalizedTrendRecommendation {
  trend: TrendItem;
  reason: string;
}
