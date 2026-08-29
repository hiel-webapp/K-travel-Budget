import { SupportedCity } from "../trip-domain";
import {
  INTERCITY_FARE_TABLE,
  IntercityFareInfo,
  TransitLegInfo,
  getIntercityFareOptions,
  getAirportTransitOptions,
  AIRPORT_INFO_MAP,
} from "./intercity-fares";

export interface RouteOptionDetail {
  mode: string;
  nameKo: string;
  nameEn: string;
  priceKrw: number;
  durationTextKo: string;
  durationTextEn: string;
  isDefault: boolean;
  optionType?: "DIRECT" | "FASTEST" | "BUDGET" | "COMFORT";
  badgeTextKo?: string;
  badgeTextEn?: string;
  legs?: TransitLegInfo[];
}

export interface CityPairRouteResult {
  fromCity: SupportedCity | "INCHEON";
  toCity: SupportedCity | "INCHEON";
  routeKey: string;
  isDirect: boolean;
  options: RouteOptionDetail[];
  activeOption: RouteOptionDetail;
}

/**
 * 인접한 두 도시 간의 추천 경로 목록 및 기본 활성 옵션을 산출합니다.
 */
export function resolveRouteRecommendation(
  fromCity: SupportedCity | "INCHEON",
  toCity: SupportedCity | "INCHEON",
  userOverrideMode?: string
): CityPairRouteResult {
  const routeKey = `${fromCity}-${toCity}`;
  const rawOptions = getIntercityFareOptions(fromCity, toCity);

  const formattedOptions: RouteOptionDetail[] = rawOptions.map((opt) => ({
    mode: opt.mode,
    nameKo: opt.nameKo,
    nameEn: opt.nameEn,
    priceKrw: opt.oneWayPriceKrw,
    durationTextKo: opt.durationTextKo,
    durationTextEn: opt.durationTextEn,
    isDefault: !!opt.isDefault,
    optionType: opt.optionType || (opt.legs && opt.legs.length > 0 ? "FASTEST" : "DIRECT"),
    badgeTextKo: opt.badgeTextKo,
    badgeTextEn: opt.badgeTextEn,
    legs: opt.legs,
  }));

  const activeOption =
    (userOverrideMode && formattedOptions.find((o) => o.mode === userOverrideMode || o.nameKo === userOverrideMode)) ||
    formattedOptions.find((o) => o.isDefault) ||
    formattedOptions[0];

  const isDirect = !activeOption.legs || activeOption.legs.length <= 1;

  return {
    fromCity,
    toCity,
    routeKey,
    isDirect,
    options: formattedOptions,
    activeOption,
  };
}
