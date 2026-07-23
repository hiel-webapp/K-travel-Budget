import { SupportedCity } from "../trip-domain";
import { PlaceCategory, PlaceQualityStatus } from "../kto/types";

export interface PlaceItem {
  id: string;
  contentId: string;
  city: SupportedCity;
  category: PlaceCategory;
  translations: {
    ko: { title: string; description?: string; address?: string };
    en: { title: string; description?: string; address?: string };
  };
  latitude?: number;
  longitude?: number;
  repImageUrl?: string;
  rawUpdatedAt?: string;
  qualityStatus: PlaceQualityStatus;
  tags: string[];
  sourceName: "MOCK";
}

export interface PlaceFilterOptions {
  city?: SupportedCity | "ALL";
  category?: PlaceCategory | "ALL";
  query?: string;
  locale?: "ko" | "en";
}
