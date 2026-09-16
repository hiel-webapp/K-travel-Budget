import { SupportedCity, TripDraft } from "../trip-domain";
import { BudgetBasketId, FoodBasketItemSelection } from "../../features/budget/domain/types";
import type { SavePlannerPreferencesInput } from "../storage-helper";

export type TravelPresetId = "K_TREND_VIBES" | "K_HERITAGE_SOUL" | "K_NATURE_CHILL";

export type TravelPresetPreferences = Omit<Partial<SavePlannerPreferencesInput>, "draft">;

export interface TravelPreset {
  id: TravelPresetId;
  badgeKo: string;
  badgeEn: string;
  titleKo: string;
  titleEn: string;
  taglineKo: string;
  taglineEn: string;
  summaryKo: string;
  summaryEn: string;
  accentColor: string;
  lightBg: string;
  badgeBg: string;
  badgeText: string;
  routeTextKo: string;
  routeTextEn: string;
  estimatedBudgetKrw: number;
  highlightTagsKo: string[];
  highlightTagsEn: string[];
  draft: TripDraft;
  preferences: TravelPresetPreferences;
}

export const TRAVEL_PRESETS: TravelPreset[] = [
  {
    id: "K_TREND_VIBES",
    badgeKo: "인기 No.1 핫플 투어",
    badgeEn: "Top Trend & Pop Vibes",
    titleKo: "도심 핫플 & K-컬처 투어",
    titleEn: "K-Trend & City Vibes Tour",
    taglineKo: "성수 팝업부터 광안리 드론쇼까지, 가장 트렌디한 한국",
    taglineEn: "From Seongsu pop-ups to Gwangalli night drones, experience modern Korea",
    summaryKo: "성수동·홍대 감성 카페와 K-패션 쇼핑, 부산 마린시티와 광안리 오션 야경을 아우르는 MZ 워너비 코스",
    summaryEn: "Trendy cafes in Seongsu & Hongdae, K-fashion shopping, and panoramic Marine City ocean nightscapes in Busan",
    accentColor: "#e25c5c",
    lightBg: "from-rose-50/70 via-white to-orange-50/40",
    badgeBg: "bg-rose-100/80 border-rose-200/90",
    badgeText: "text-rose-700",
    routeTextKo: "서울 3박 + 부산 2박 (5박 6일)",
    routeTextEn: "Seoul 3N + Busan 2N (5N 6D)",
    estimatedBudgetKrw: 1350000,
    highlightTagsKo: ["#성수팝업", "#홍대감성", "#광안리야경", "#비즈니스호텔"],
    highlightTagsEn: ["#SeongsuPopup", "#Hongdae", "#GwangalliNight", "#BusinessHotel"],
    draft: {
      totalNights: 5,
      adultCount: 2,
      budgetTier: "STANDARD",
      targetBudgetKrw: 2700000, // 2인 기준
      selectedCities: ["SEOUL", "BUSAN"],
      cityNightAllocations: {
        SEOUL: 3,
        BUSAN: 2,
      },
      schemaVersion: 1,
    },
    preferences: {
      accommodationByCity: {
        SEOUL: "BUSINESS_HOTEL",
        BUSAN: "BUSINESS_HOTEL",
      },
      foodBasketSelections: [
        { foodId: "nat_samgyeopsal", quantity: 2, cityCode: "SEOUL" },
        { foodId: "nat_chimaek", quantity: 1, cityCode: "SEOUL" },
        { foodId: "busan_dwaeji_gukbap", quantity: 2, cityCode: "BUSAN" },
      ],
      attractionSelections: {
        SEOUL: {
          selectedCourseIds: ["seoul_course_trend"],
          individualSpotIds: [],
        },
        BUSAN: {
          selectedCourseIds: ["busan_course_night_trend"],
          individualSpotIds: [],
        },
      },
    },
  },
  {
    id: "K_HERITAGE_SOUL",
    badgeKo: "고즈넉한 역사·전통",
    badgeEn: "Authentic Heritage",
    titleKo: "전통 한옥 & 헤리티지 감성 투어",
    titleEn: "K-Heritage & Hanok Soul Tour",
    taglineKo: "궁궐 야간개장과 한옥마을, 신라 천년의 숨결을 걷다",
    taglineEn: "Palace starlight walks, hanok village alleys, and UNESCO ancient dynasties",
    summaryKo: "서울 4대궁과 북촌, 전주 전통 한옥마을 슬로시티, 경주 불국사와 황리단길을 잇는 한국 전통 미학의 정석",
    summaryEn: "Seoul royal palaces & Bukchon, Jeonju slow-city Hanok village, and Gyeongju UNESCO temples & Hwangridan-gil",
    accentColor: "#b45309",
    lightBg: "from-amber-50/70 via-white to-stone-50/40",
    badgeBg: "bg-amber-100/80 border-amber-200/90",
    badgeText: "text-amber-800",
    routeTextKo: "서울 2박 + 전주 1박 + 경주 2박 (5박 6일)",
    routeTextEn: "Seoul 2N + Jeonju 1N + Gyeongju 2N (5N 6D)",
    estimatedBudgetKrw: 1450000,
    highlightTagsKo: ["#한옥스테이", "#경복궁한복", "#전주비빔밥", "#불국사대릉원"],
    highlightTagsEn: ["#HanokStay", "#HanbokPalace", "#JeonjuBibimbap", "#UNESCOBulguksa"],
    draft: {
      totalNights: 5,
      adultCount: 2,
      budgetTier: "STANDARD",
      targetBudgetKrw: 2900000, // 2인 기준
      selectedCities: ["SEOUL", "JEONJU", "GYEONGJU"],
      cityNightAllocations: {
        SEOUL: 2,
        JEONJU: 1,
        GYEONGJU: 2,
      },
      schemaVersion: 1,
    },
    preferences: {
      accommodationByCity: {
        SEOUL: "BUSINESS_HOTEL",
        JEONJU: "HANOK_BOUTIQUE",
        GYEONGJU: "HANOK_BOUTIQUE",
      },
      foodBasketSelections: [
        { foodId: "nat_bulgogi", quantity: 2, cityCode: "SEOUL" },
        { foodId: "nat_bibimbap", quantity: 2, cityCode: "JEONJU" },
      ],
      attractionSelections: {
        SEOUL: {
          selectedCourseIds: ["seoul_course_heritage"],
          individualSpotIds: [],
        },
        JEONJU: {
          selectedCourseIds: ["jeonju_course_highlight"],
          individualSpotIds: [],
        },
        GYEONGJU: {
          selectedCourseIds: ["gyeongju_course_unesco_heritage"],
          individualSpotIds: [],
        },
      },
    },
  },
  {
    id: "K_NATURE_CHILL",
    badgeKo: "푸른 바다 & 힐링 휴양",
    badgeEn: "Ocean & Coastal Chill",
    titleKo: "동해 바다 & 자연 힐링 투어",
    titleEn: "East Coast & Nature Chill Tour",
    taglineKo: "탁 트인 에메랄드 동해안과 솔향 그윽한 해변 커피 산책",
    taglineEn: "Panoramic emerald coastlines, pine forest breeze, and beachside specialty coffee",
    summaryKo: "서울의 상징적인 한강 랜드마크와 KTX로 1시간대 연결되는 강릉 안목해변 커피거리, 경포호 힐링 산책",
    summaryEn: "Seoul riverside icons seamlessly connected via KTX to Gangneung Anmok ocean coffee street & Gyeongpo lake",
    accentColor: "#0284c7",
    lightBg: "from-sky-50/70 via-white to-cyan-50/40",
    badgeBg: "bg-sky-100/80 border-sky-200/90",
    badgeText: "text-sky-800",
    routeTextKo: "서울 2박 + 강릉 3박 (5박 6일)",
    routeTextEn: "Seoul 2N + Gangneung 3N (5N 6D)",
    estimatedBudgetKrw: 1400000,
    highlightTagsKo: ["#안목커피거리", "#동해오션뷰", "#한강피크닉", "#KTX직통"],
    highlightTagsEn: ["#AnmokCoffee", "#EastSeaView", "#HangangPicnic", "#DirectKTX"],
    draft: {
      totalNights: 5,
      adultCount: 2,
      budgetTier: "STANDARD",
      targetBudgetKrw: 2800000, // 2인 기준
      selectedCities: ["SEOUL", "GANGNEUNG"],
      cityNightAllocations: {
        SEOUL: 2,
        GANGNEUNG: 3,
      },
      schemaVersion: 1,
    },
    preferences: {
      accommodationByCity: {
        SEOUL: "BUSINESS_HOTEL",
        GANGNEUNG: "BUSINESS_HOTEL",
      },
      foodBasketSelections: [
        { foodId: "nat_chimaek", quantity: 1, cityCode: "SEOUL" },
      ],
      attractionSelections: {
        SEOUL: {
          selectedCourseIds: ["seoul_course_river"],
          individualSpotIds: [],
        },
        GANGNEUNG: {
          selectedCourseIds: ["gangneung_course_highlight"],
          individualSpotIds: [],
        },
      },
    },
  },
];

export function getTravelPresetById(id: string): TravelPreset | undefined {
  return TRAVEL_PRESETS.find((p) => p.id === id);
}
