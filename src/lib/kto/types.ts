import { SupportedCity } from "../trip-domain";

export type KtoAreaCode = "1" | "2" | "6" | "31" | "32" | "34" | "35" | "36" | "37" | "39";
export type KtoLocale = "ko" | "en";


export interface KtoApiHeader {
  resultCode: string;
  resultMsg: string;
}

export interface KtoApiBody<T> {
  items: { item: T[] | T | "" } | "";
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

export interface KtoApiResponse<T> {
  response: {
    header: KtoApiHeader;
    body: KtoApiBody<T>;
  };
}

export interface KtoAreaBasedListItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1?: string;
  addr2?: string;
  areacode?: string;
  sigungucode?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  mlevel?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  modifiedtime?: string;
  tel?: string;
}

export interface KtoDetailCommonItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  overview?: string;
  homepage?: string;
  addr1?: string;
  areacode?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
}

export interface KtoDetailIntroItem {
  contentid: string;
  contenttypeid: string;
  [key: string]: unknown;
}

export interface KtoDetailImageItem {
  contentid: string;
  originimgurl?: string;
  smallimageurl?: string;
  imgname?: string;
}

export type PlaceCategory =
  | "ACCOMMODATION"
  | "RESTAURANT"
  | "CAFE"
  | "ATTRACTION"
  | "CULTURE";

export type PlaceQualityStatus =
  | "READY"
  | "INCOMPLETE"
  | "REVIEW_REQUIRED";

export interface NormalizedPlaceTranslation {
  locale: "ko" | "en";
  title: string;
  description?: string;
  address?: string;
}

export interface NormalizedPlaceImage {
  imageUrl: string;
  originUrl?: string;
  caption?: string;
  sortOrder: number;
}

export interface NormalizedPlaceInput {
  contentId: string;
  sourceName: string;
  city: SupportedCity;
  category: PlaceCategory;
  address?: string;
  latitude?: number;
  longitude?: number;
  repImageUrl?: string;
  qualityStatus: PlaceQualityStatus;
  rawUpdatedAt?: string;
  translations: NormalizedPlaceTranslation[];
  images?: NormalizedPlaceImage[];
  rawSourceData?: Record<string, unknown>;
}
