import { SupportedCity } from "../trip-domain";
import { PlaceCategory, PlaceQualityStatus } from "../kto/types";

export type PlacePriceStatus = "FREE" | "OFFICIAL_PRICE" | "NEEDS_CHECK";

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
  sourceName: "MOCK" | "KTO";
  priceStatus?: PlacePriceStatus;
  priceKrw?: number;
  officialLink?: string;
  tel?: string;
  useTime?: string;
  subwayInfo?: string;
  openingHours?: string;
  closedDays?: string;
  categoryType?: "명소" | "자연" | "엔터" | "쇼핑";
  isLocal?: boolean;
}

export interface PlaceFilterOptions {
  city?: SupportedCity | "ALL";
  category?: PlaceCategory | "ALL";
  query?: string;
  locale?: "ko" | "en";
}

export interface TripItineraryItem {
  id: string;
  tripId: string;
  dayIndex: number;
  placeId: string;
  place?: PlaceItem;
  memo?: string;
  sortOrder: number;
  userCostOverrideKrw?: number;
  createdAt: string;
  updatedAt: string;
}
