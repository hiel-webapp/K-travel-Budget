import { SupportedCity } from "../trip-domain";
import { PlaceCategory, PlaceQualityStatus } from "../kto/types";

export type DbPlacePriceStatus = "FREE" | "OFFICIAL_PRICE" | "NEEDS_CHECK";

export interface DbPlace {
  id?: string;
  content_id: string;
  source_name: string;
  city: SupportedCity;
  category: PlaceCategory;
  address?: string;
  latitude?: number;
  longitude?: number;
  rep_image_url?: string;
  quality_status: PlaceQualityStatus;
  price_status?: DbPlacePriceStatus;
  price_krw?: number;
  official_link?: string;
  tel?: string;
  use_time?: string;
  raw_updated_at?: string;
  ingested_at?: string;
  updated_at?: string;
}

export interface DbPlaceTranslation {
  id?: string;
  place_id: string;
  locale: "ko" | "en";
  title: string;
  description?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbPlaceImage {
  id?: string;
  place_id: string;
  image_url: string;
  origin_url?: string;
  caption?: string;
  sort_order: number;
  created_at?: string;
}

export interface DbPlaceSource {
  id?: string;
  place_id: string;
  source_name: string;
  source_content_id: string;
  raw_data: Record<string, unknown>;
  fetched_at?: string;
}

export interface DbIngestionRun {
  id?: string;
  source_name: string;
  city: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  total_fetched: number;
  total_inserted: number;
  total_updated: number;
  total_skipped: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface DbTripItinerary {
  id?: string;
  trip_id: string;
  day_index: number;
  place_id: string;
  memo?: string;
  sort_order: number;
  user_cost_override_krw?: number;
  created_at?: string;
  updated_at?: string;
}
