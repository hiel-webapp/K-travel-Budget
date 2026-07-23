import { SupportedCity } from "../trip-domain";
import { KtoAreaCode } from "./types";

export const KTO_BASE_URL_KOR = "https://apis.data.go.kr/B551011/KorService2";
export const KTO_BASE_URL_ENG = "https://apis.data.go.kr/B551011/EngService2";

export const KTO_ENDPOINTS = {
  AREA_CODE: "/areaCode2",
  AREA_BASED_LIST: "/areaBasedList2",
  DETAIL_COMMON: "/detailCommon2",
  DETAIL_INTRO: "/detailIntro2",
  DETAIL_IMAGE: "/detailImage2",
} as const;

export const CITY_TO_KTO_AREA_CODE: Record<SupportedCity, KtoAreaCode> = {
  SEOUL: "1",
  BUSAN: "6",
};

export const KTO_AREA_CODE_TO_CITY: Record<string, SupportedCity> = {
  "1": "SEOUL",
  "6": "BUSAN",
};

export const KTO_CONTENT_TYPE = {
  KOR: {
    ATTRACTION: "12",
    CULTURE: "14",
    ACCOMMODATION: "32",
    RESTAURANT: "39",
  },
  ENG: {
    ATTRACTION: "76",
    CULTURE: "78",
    ACCOMMODATION: "32",
    RESTAURANT: "39",
  },
} as const;

/**
 * 관광공사 소분류(cat3) 중 카페/찻집 카테고리 코드
 */
export const KTO_CAT3_CAFE_CODES = new Set([
  "A05020900", // 카페/찻집
  "A05020901", // 디저트카페
  "A05020902", // 북카페
  "A05020903", // 테마카페
]);

export const CAFE_KEYWORD_REGEX = /(카페|커피|다방|디저트|찻집|cafe|coffee|dessert|bakery)/i;
