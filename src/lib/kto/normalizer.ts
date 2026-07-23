import { SupportedCity } from "../trip-domain";
import {
  CAFE_KEYWORD_REGEX,
  KTO_AREA_CODE_TO_CITY,
  KTO_CAT3_CAFE_CODES,
  KTO_CONTENT_TYPE,
} from "./constants";
import {
  KtoAreaBasedListItem,
  KtoDetailCommonItem,
  KtoLocale,
  NormalizedPlaceImage,
  NormalizedPlaceInput,
  NormalizedPlaceTranslation,
  PlaceCategory,
  PlaceQualityStatus,
} from "./types";

export interface NormalizerOptions {
  locale?: KtoLocale;
  overrideCity?: SupportedCity;
  description?: string;
}

/**
 * 관광공사 contentTypeId 및 소분류(cat3), 장소명을 기반으로 내부 서비스 카테고리를 판별합니다.
 */
export function resolvePlaceCategory(
  contentTypeId: string,
  cat3?: string,
  title?: string
): { category: PlaceCategory; isUncertainCafe: boolean } {
  // 숙박
  if (
    contentTypeId === KTO_CONTENT_TYPE.KOR.ACCOMMODATION ||
    contentTypeId === KTO_CONTENT_TYPE.ENG.ACCOMMODATION
  ) {
    return { category: "ACCOMMODATION", isUncertainCafe: false };
  }

  // 관광지
  if (
    contentTypeId === KTO_CONTENT_TYPE.KOR.ATTRACTION ||
    contentTypeId === KTO_CONTENT_TYPE.ENG.ATTRACTION
  ) {
    return { category: "ATTRACTION", isUncertainCafe: false };
  }

  // 문화시설
  if (
    contentTypeId === KTO_CONTENT_TYPE.KOR.CULTURE ||
    contentTypeId === KTO_CONTENT_TYPE.ENG.CULTURE
  ) {
    return { category: "CULTURE", isUncertainCafe: false };
  }

  // 음식점 / 카페
  if (
    contentTypeId === KTO_CONTENT_TYPE.KOR.RESTAURANT ||
    contentTypeId === KTO_CONTENT_TYPE.ENG.RESTAURANT
  ) {
    const isCat3Cafe = Boolean(cat3 && KTO_CAT3_CAFE_CODES.has(cat3));
    const isNameCafe = Boolean(title && CAFE_KEYWORD_REGEX.test(title));

    if (isCat3Cafe || isNameCafe) {
      return { category: "CAFE", isUncertainCafe: false };
    }

    // 확실하지 않은 경우 RESTAURANT로 설정하고 검토 필요(REVIEW_REQUIRED) 상태로 남김
    return { category: "RESTAURANT", isUncertainCafe: true };
  }

  // 매핑되지 않은 기타 유형은 기본 RESTAURANT 처리 + 불확실 표시
  return { category: "RESTAURANT", isUncertainCafe: true };
}

/**
 * 좌표 값(mapx, mapy)을 유효한 경도/위도 숫자로 변환합니다.
 */
export function parseCoordinates(
  mapx?: string,
  mapy?: string
): { latitude?: number; longitude?: number } {
  if (!mapx || !mapy) {
    return {};
  }

  const lng = parseFloat(mapx);
  const lat = parseFloat(mapy);

  if (isNaN(lng) || isNaN(lat) || lat === 0 || lng === 0) {
    return {};
  }

  // 한국 영역 좌표 범위 체크 (위도 33~39, 경도 124~132)
  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) {
    return {};
  }

  return { latitude: lat, longitude: lng };
}

/**
 * 관광공사 지역코드(areacode) 또는 오버라이드 도시를 기반으로 HypeHeritage 지원 도시(SEOUL/BUSAN)를 판별합니다.
 */
export function resolveSupportedCity(
  areaCode?: string,
  overrideCity?: SupportedCity
): SupportedCity | null {
  if (overrideCity === "SEOUL" || overrideCity === "BUSAN") {
    return overrideCity;
  }

  if (areaCode && KTO_AREA_CODE_TO_CITY[areaCode]) {
    return KTO_AREA_CODE_TO_CITY[areaCode];
  }

  return null;
}

/**
 * 관광공사 원본 목록/상세 응답 항목을 HypeHeritage Place 입력 모델로 정규화합니다.
 * 필수값인 contentid 또는 title이 누락된 경우 null을 반환하여 수집 대상에서 제외합니다.
 */
export function normalizeKtoPlace(
  rawItem: KtoAreaBasedListItem | KtoDetailCommonItem,
  options: NormalizerOptions = {}
): NormalizedPlaceInput | null {
  const contentId = rawItem.contentid?.trim();
  const title = rawItem.title?.trim();

  // 장소명 또는 콘텐츠 ID가 없으면 수집 대상에서 제외
  if (!contentId || !title) {
    return null;
  }

  const areaCode = "areacode" in rawItem ? rawItem.areacode : undefined;
  const city = resolveSupportedCity(areaCode, options.overrideCity);

  // 서울·부산 이외 지역은 허용하지 않고 제외
  if (!city) {
    return null;
  }

  const { category, isUncertainCafe } = resolvePlaceCategory(
    rawItem.contenttypeid,
    "cat3" in rawItem ? rawItem.cat3 : undefined,
    title
  );

  const { latitude, longitude } = parseCoordinates(rawItem.mapx, rawItem.mapy);
  const repImageUrl = rawItem.firstimage?.trim() || rawItem.firstimage2?.trim() || undefined;
  const address = rawItem.addr1?.trim() || undefined;
  const description = options.description?.trim() || ("overview" in rawItem ? rawItem.overview?.trim() : undefined);

  // 품질 상태 판별:
  // - 불확실한 카페/음식점: REVIEW_REQUIRED
  // - 좌표, 이미지, 설명 중 하나라도 누락된 경우: INCOMPLETE
  // - 모든 데이터 구비 시: READY
  let qualityStatus: PlaceQualityStatus = "READY";

  if (isUncertainCafe) {
    qualityStatus = "REVIEW_REQUIRED";
  } else if (!latitude || !longitude || !repImageUrl || !description) {
    qualityStatus = "INCOMPLETE";
  }

  const locale: KtoLocale = options.locale || "ko";
  const translation: NormalizedPlaceTranslation = {
    locale,
    title,
    description,
    address,
  };

  const images: NormalizedPlaceImage[] = [];
  if (repImageUrl) {
    images.push({
      imageUrl: repImageUrl,
      originUrl: repImageUrl,
      sortOrder: 0,
    });
  }

  return {
    contentId,
    sourceName: locale === "en" ? "KTO_ENG" : "KTO_KOR",
    city,
    category,
    address,
    latitude,
    longitude,
    repImageUrl,
    qualityStatus,
    rawUpdatedAt: "modifiedtime" in rawItem ? rawItem.modifiedtime : undefined,
    translations: [translation],
    images: images.length > 0 ? images : undefined,
    rawSourceData: rawItem as unknown as Record<string, unknown>,
  };
}
