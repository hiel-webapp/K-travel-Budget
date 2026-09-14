import { SupportedCity } from "../../../lib/trip-domain";
import { BudgetBasketId } from "../domain/types";

export type StayArchetypeId =
  | "HOSTEL_GUESTHOUSE"
  | "BUSINESS_HOTEL"
  | "HANOK_BOUTIQUE"
  | "LUXURY_SKYLINE";

export type OccupancyMode = "SOLO" | "SHARED_PAIR";

export interface StayArchetypeDefinition {
  id: StayArchetypeId;
  subCategory: string;
  icon: string;
  titleEn: string;
  titleKo: string;
  descEn: string;
  descKo: string;
  badgeEn?: string;
  badgeKo?: string;
  imageUrl: string;
  defaultPriceKrw: number;
  cityPrices: Record<SupportedCity, number>;
  deepLinkTemplate: string;
  otaProvider: "AGODA" | "AIRBNB";
}

/**
 * Agoda city code mapping for popular Korean destinations
 */
export const AGODA_CITY_IDS: Record<SupportedCity, number> = {
  SEOUL: 14690,
  BUSAN: 17172,
  JEJU: 16901,
  INCHEON: 17345,
  GYEONGJU: 18663,
  GANGNEUNG: 16904,
  JEONJU: 18665,
  SOKCHO: 16907,
  SUWON: 17349,
  YEOSU: 18666,
};

export const STAY_ARCHETYPES: StayArchetypeDefinition[] = [
  {
    id: "HOSTEL_GUESTHOUSE",
    subCategory: "Hostel_Guesthouse",
    icon: "🎒",
    titleEn: "Hostel & Guesthouse",
    titleKo: "호스텔 & 게스트하우스",
    descEn: "Social dorms and compact rooms for budget backpackers.",
    descKo: "배낭여행객을 위한 실속 도미토리 및 싱글룸",
    badgeEn: "Budget",
    badgeKo: "가성비 추천",
    imageUrl: "/assets/stays/hostel.jpg",
    defaultPriceKrw: 40000,
    cityPrices: {
      SEOUL: 40000,
      BUSAN: 35000,
      JEJU: 35000,
      INCHEON: 38000,
      GYEONGJU: 35000,
      GANGNEUNG: 38000,
      JEONJU: 35000,
      SOKCHO: 38000,
      SUWON: 38000,
      YEOSU: 36000,
    },
    deepLinkTemplate: "https://www.agoda.com/search?city={city_id}&priceCur=KRW&maxPrice=55000&tag=hypeheritage",
    otaProvider: "AGODA",
  },
  {
    id: "BUSINESS_HOTEL",
    subCategory: "Business_Hotel",
    icon: "🏢",
    titleEn: "Urban Business Hotel",
    titleKo: "도심 비즈니스 호텔",
    descEn: "Clean, private standard rooms near transit.",
    descKo: "역세권 이동이 편리한 쾌적한 표준 호텔",
    badgeEn: "Popular",
    badgeKo: "가장 인기",
    imageUrl: "/assets/stays/business_hotel.jpg",
    defaultPriceKrw: 120000,
    cityPrices: {
      SEOUL: 120000,
      BUSAN: 110000,
      JEJU: 105000,
      INCHEON: 115000,
      GYEONGJU: 100000,
      GANGNEUNG: 115000,
      JEONJU: 105000,
      SOKCHO: 110000,
      SUWON: 110000,
      YEOSU: 115000,
    },
    deepLinkTemplate: "https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=80000&maxPrice=160000&tag=hypeheritage",
    otaProvider: "AGODA",
  },
  {
    id: "HANOK_BOUTIQUE",
    subCategory: "Hanok_Boutique",
    icon: "🏡",
    titleEn: "Traditional Hanok & Boutique",
    titleKo: "전통 한옥 & 부티크",
    descEn: "Authentic hanok stays or cozy boutique rooms.",
    descKo: "고즈넉한 멋의 한옥 독채 및 감성 숙소",
    badgeEn: "K-Heritage",
    badgeKo: "한국 전통",
    imageUrl: "/assets/stays/hanok.jpg",
    defaultPriceKrw: 240000,
    cityPrices: {
      SEOUL: 240000,
      BUSAN: 220000,
      JEJU: 250000,
      INCHEON: 210000,
      GYEONGJU: 220000,
      GANGNEUNG: 230000,
      JEONJU: 200000,
      SOKCHO: 220000,
      SUWON: 200000,
      YEOSU: 230000,
    },
    deepLinkTemplate: "https://www.agoda.com/search?city={city_id}&priceCur=KRW&tag=hypeheritage",
    otaProvider: "AGODA",
  },
  {
    id: "LUXURY_SKYLINE",
    subCategory: "Luxury_Skyline",
    icon: "👑",
    titleEn: "5-Star Luxury Hotel",
    titleKo: "럭셔리 5성급 호텔",
    descEn: "World-class service and panoramic skyline views.",
    descKo: "특급 서비스와 파노라마 뷰의 럭셔리 호캉스",
    badgeEn: "Luxury",
    badgeKo: "프리미엄 럭셔리",
    imageUrl: "/assets/stays/luxury.jpg",
    defaultPriceKrw: 450000,
    cityPrices: {
      SEOUL: 450000,
      BUSAN: 420000,
      JEJU: 460000,
      INCHEON: 400000,
      GYEONGJU: 380000,
      GANGNEUNG: 430000,
      JEONJU: 360000,
      SOKCHO: 410000,
      SUWON: 380000,
      YEOSU: 420000,
    },
    deepLinkTemplate: "https://www.agoda.com/search?city={city_id}&priceCur=KRW&minPrice=350000&tag=hypeheritage",
    otaProvider: "AGODA",
  },
];

/**
 * Get 1-night price for a stay archetype in a given city
 */
export function getStayArchetypePrice(city: SupportedCity, archetypeId: StayArchetypeId): number {
  const archetype = STAY_ARCHETYPES.find((a) => a.id === archetypeId);
  if (!archetype) return 120000;
  return archetype.cityPrices[city] || archetype.defaultPriceKrw;
}

/**
 * Generate formatted OTA search URL with dynamic parameters
 */
export function generateStayOtaUrl(
  archetypeId: StayArchetypeId,
  city: SupportedCity
): string {
  const archetype = STAY_ARCHETYPES.find((a) => a.id === archetypeId);
  if (!archetype) return "https://www.agoda.com";

  const cityId = AGODA_CITY_IDS[city] || 14690;
  const cityName = city.toLowerCase();

  return archetype.deepLinkTemplate
    .replace("{city_id}", String(cityId))
    .replace("{city_name}", cityName);
}

/**
 * Map archetype to legacy BudgetBasketId for calculation engines
 */
export function mapArchetypeToBasketId(archetypeId: StayArchetypeId): BudgetBasketId {
  switch (archetypeId) {
    case "HOSTEL_GUESTHOUSE":
      return "BUDGET_STAY";
    case "BUSINESS_HOTEL":
      return "STANDARD_HOTEL";
    case "HANOK_BOUTIQUE":
    case "LUXURY_SKYLINE":
      return "PREMIUM_HERITAGE";
    default:
      return "STANDARD_HOTEL";
  }
}
