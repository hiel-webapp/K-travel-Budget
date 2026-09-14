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
    titleEn: "K-Vibe Hostel & Guesthouse",
    titleKo: "가성비 호스텔 & 게스트하우스",
    descEn: "Social dorms and cozy guesthouses for budget backpackers.",
    descKo: "배낭여행객과 나홀로 여행자를 위한 가성비 도미토리 및 게스트하우스",
    badgeEn: "Budget Choice",
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
    titleEn: "Urban Business & Modern Hotel",
    titleKo: "도심형 비즈니스 & 스탠다드 호텔",
    descEn: "Clean, private, and transit-accessible standard hotel rooms.",
    descKo: "지하철역과 가까워 이동이 편리하고 쾌적한 3~4성급 표준 비즈니스 호텔",
    badgeEn: "Most Popular",
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
    titleEn: "K-Heritage Hanok & Boutique Stay",
    titleKo: "전통 한옥 스테이 & 부티크 숙소",
    descEn: "Authentic traditional hanok architecture or trendy boutique rooms.",
    descKo: "한국 전통의 멋을 느끼는 고즈넉한 한옥 독채 또는 감성 부티크 스테이",
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
    deepLinkTemplate: "https://www.airbnb.com/s/{city_name}/homes?property_type_id=hanok&tag=hypeheritage",
    otaProvider: "AIRBNB",
  },
  {
    id: "LUXURY_SKYLINE",
    subCategory: "Luxury_Skyline",
    icon: "👑",
    titleEn: "Luxury & Skyline 5-Star Hotel",
    titleKo: "럭셔리 5성급 & 파노라마 호텔",
    descEn: "World-class hospitality, premium wellness, and panoramic skyline views.",
    descKo: "특급 서비스, 수영장/스파, 도심 및 바다 파노라마 뷰를 갖춘 5성급 럭셔리 호캉스",
    badgeEn: "Premium Luxury",
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
