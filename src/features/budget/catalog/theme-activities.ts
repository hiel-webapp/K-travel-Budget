import { SupportedCity } from "../../../lib/trip-domain";
import { AttractionSpot } from "./attraction-spots";

export interface ThemeActivityItem {
  id: string;
  cityCode: SupportedCity;
  relatedSpotKey?: string;
  relatedSpotNameKo?: string;
  relatedSpotNameEn?: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  priceKrw: number;
  tag: string;
  categoryType: "엔터" | "명소" | "자연" | "쇼핑";
  imageUrl?: string;
  durationTextKo?: string;
  durationTextEn?: string;
  bookingTipKo?: string;
  bookingTipEn?: string;
  isActive?: boolean;
}

/**
 * 관광지 입장료와 중복되지 않는 순수 부가 체험 목록 (입장권 중복 과금 방지)
 */
export const THEME_ACTIVITIES_CATALOG: ThemeActivityItem[] = [
  {
    id: "act_seoul_hanbok",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_gyeongbokgung",
    relatedSpotNameKo: "경복궁",
    relatedSpotNameEn: "Gyeongbokgung Palace",
    nameKo: "경복궁 한복 대여",
    nameEn: "Gyeongbokgung Hanbok Rental",
    descKo: "경복궁 산책용 고급 한복 대여 및 헤어 손질 (한복 착용 시 4대궁 무료 입장).",
    descEn: "2-hour premium hanbok rental and traditional hairstyling with free palace admission.",
    priceKrw: 25000,
    tag: "K-컬처/인기",
    categoryType: "엔터",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/d5d6385b-9f49-44cf-a3c8-f29ab8482079/it11",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
    isActive: true,
  },
  {
    id: "act_seoul_gyobok",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_lotteworld",
    relatedSpotNameKo: "롯데월드 어드벤처",
    relatedSpotNameEn: "Lotte World Adventure",
    nameKo: "잠실 감성교복 대여",
    nameEn: "Jamsil Korean School Uniform Rental",
    descKo: "롯데월드와 석촌호수 인생샷을 위한 트렌디한 K-스쿨 교복 종일 대여 체험.",
    descEn: "Full-day rental of trendy Korean high school uniforms for photo sessions at Lotte World.",
    priceKrw: 20000,
    tag: "K-패션/체험",
    categoryType: "엔터",
    imageUrl: "https://adventure.lotteworld.com/api/upload/202509/09/202509091992d4d41d550",
    durationTextKo: "종일",
    durationTextEn: "Full day",
    isActive: true,
  },
  {
    id: "act_seoul_han_river_cruise",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_banpo_rainbow_fountain",
    relatedSpotNameKo: "반포대교 달빛무지개분수",
    relatedSpotNameEn: "Banpo Rainbow Fountain",
    nameKo: "한강 무지개분수 요트 투어",
    nameEn: "Han River Yacht Cruise",
    descKo: "세빛섬에서 출발하여 반포대교 달빛무지개 분수와 서울 야경을 감상하는 럭셔리 요트 투어.",
    descEn: "Sunset & night view luxury yacht cruise at Banpo Moonlight Rainbow Fountain.",
    priceKrw: 28000,
    tag: "야경/요트",
    categoryType: "자연",
    imageUrl: "https://tong.visitkorea.or.kr/cms/resource/34/4109634_image2_1.jpg",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
    isActive: true,
  },
  {
    id: "act_seoul_tea_class",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_bukchon",
    relatedSpotNameKo: "북촌한옥마을",
    relatedSpotNameEn: "Bukchon Hanok Village",
    nameKo: "북촌 한옥 다도 체험",
    nameEn: "Bukchon Hanok Tea Ceremony",
    descKo: "고즈넉한 북촌 한옥에서 한국 전통 녹차를 우리고 다과를 곁들이는 힐링 다도 클래스.",
    descEn: "Traditional tea ceremony experience with artisanal tea and refreshments in a historic hanok.",
    priceKrw: 35000,
    tag: "전통/힐링",
    categoryType: "명소",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/534832fc-4146-4bc5-8ada-6aaa96b4448e/it11",
    durationTextKo: "90분",
    durationTextEn: "90 mins",
    isActive: true,
  },
  {
    id: "act_seoul_n_tower",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_nseoultower",
    relatedSpotNameKo: "N서울타워 전망대",
    relatedSpotNameEn: "N Seoul Tower Observatory",
    nameKo: "남산 케이블카 왕복 탑승권",
    nameEn: "Namsan Cable Car Round-Trip",
    descKo: "명동에서 N서울타워까지 남산 절경을 파노라마로 감상하며 오르는 케이블카 왕복 탑승권.",
    descEn: "Round-trip Namsan cable car ticket offering panoramic scenic views over central Seoul.",
    priceKrw: 15000,
    tag: "케이블카",
    categoryType: "명소",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/0f19678f-494a-42c6-8920-32d1e00cc39d/it11",
    durationTextKo: "왕복",
    durationTextEn: "Round-trip",
    isActive: true,
  },
  {
    id: "act_busan_yacht",
    cityCode: "BUSAN",
    relatedSpotKey: "busan_thebay101",
    relatedSpotNameKo: "더베이101 & 마린시티",
    relatedSpotNameEn: "The Bay 101 & Marine City",
    nameKo: "광안대교 야경 요트 투어",
    nameEn: "Gwangandaegyo Night Yacht Tour",
    descKo: "마린시티와 광안대교 조명을 바다 한가운데서 즐기는 선셋 & 야경 럭셔리 요트 투어.",
    descEn: "Luxury yacht cruise overlooking the illuminated Gwangandaegyo Bridge and Marine City skyline.",
    priceKrw: 30000,
    tag: "야경/요트",
    categoryType: "엔터",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/29a5a4a2-4229-4210-abbd-ca19079c8844/it11",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
    isActive: true,
  },
  {
    id: "act_jeju_submarine",
    cityCode: "JEJU",
    relatedSpotKey: "jeju_cheonjiyeon",
    relatedSpotNameKo: "천지연폭포",
    relatedSpotNameEn: "Cheonjiyeon Falls",
    nameKo: "서귀포 잠수함 해저 투어",
    nameEn: "Seogwipo Submarine Tour",
    descKo: "유네스코 문섬 해저 40m로 잠항하여 난파선과 천연 산호초 군락을 관람하는 잠수함 투어.",
    descEn: "Real submarine deep-sea dive to 40 meters exploring shipwrecks and coral reefs off Seogwipo.",
    priceKrw: 65000,
    tag: "해양탐험",
    categoryType: "엔터",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/59c59e4a-55bd-407c-8b35-9692ffbbe356/it11",
    durationTextKo: "70분",
    durationTextEn: "70 mins",
    isActive: true,
  },
  {
    id: "act_jeju_soesokkak",
    cityCode: "JEJU",
    relatedSpotKey: "jeju_soesokkak",
    relatedSpotNameKo: "쇠소깍",
    relatedSpotNameEn: "Soesokkak Estuary",
    nameKo: "쇠소깍 전통 나룻배 체험",
    nameEn: "Soesokkak Wooden Boat Experience",
    descKo: "깊고 맑은 쇠소깍 계곡 물길 위를 노 저으며 기암괴석 절경을 즐기는 전통 조각배 체험.",
    descEn: "Traditional wooden rowing boat experience along the emerald gorge of Soesokkak.",
    priceKrw: 10000,
    tag: "카약/자연",
    categoryType: "자연",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/51230d71-a4be-4d0c-a699-8aa048df9536/it11",
    durationTextKo: "20분",
    durationTextEn: "20 mins",
    isActive: true,
  },
  {
    id: "act_jeju_udo_bike",
    cityCode: "JEJU",
    relatedSpotKey: "jeju_udo",
    relatedSpotNameKo: "우도",
    relatedSpotNameEn: "Udo Island",
    nameKo: "우도 삼륜 전기차 대여",
    nameEn: "Udo Island Electric Vehicle Rental",
    descKo: "에메랄드빛 우도 해안도로를 자유롭게 드라이브할 수 있는 2인용 전동차 2시간 대여.",
    descEn: "2-hour mini electric vehicle rental to explore the turquoise coastal roads of Udo.",
    priceKrw: 30000,
    tag: "전기차투어",
    categoryType: "자연",
    imageUrl: "https://tong.visitkorea.or.kr/cms/resource/56/3411156_image2_1.jpg",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
    isActive: true,
  },
  {
    id: "act_incheon_wolmido",
    cityCode: "INCHEON",
    relatedSpotKey: "incheon_wolmido",
    relatedSpotNameKo: "월미도 문화의거리 & 테마파크",
    relatedSpotNameEn: "Wolmido Theme Park",
    nameKo: "월미도 놀이기구 3종권",
    nameEn: "Wolmido Amusement Ride 3-Pass",
    descKo: "스릴 만점 원조 디스코팡팡과 2층 바이킹 등 월미도 명물 놀이기구 3종 탑승 할인권.",
    descEn: "3-ride pass for iconic Wolmido amusement rides including Disco Pang Pang and Viking.",
    priceKrw: 18000,
    tag: "테마파크/놀이기구",
    categoryType: "엔터",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/a139e369-3f43-4de9-909d-5084516d4d87/it11",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
    isActive: true,
  },
  {
    id: "act_sokcho_abai_boat",
    cityCode: "SOKCHO",
    relatedSpotKey: "sokcho_abai",
    relatedSpotNameKo: "속초 아바이마을 & 갯배 체험",
    relatedSpotNameEn: "Abai Village & Gaetbae",
    nameKo: "아바이마을 갯배 왕복 승선권",
    nameEn: "Abai Village Gaetbae Ferry Ticket",
    descKo: "손잡이 와이어를 직접 끌어 수로를 건너는 한국 유일의 무동력 전통 뗏목 갯배 왕복 체험.",
    descEn: "Unique human-powered traditional wire ferry connecting Sokcho port to Abai Village.",
    priceKrw: 1000,
    tag: "전통갯배",
    categoryType: "명소",
    imageUrl: "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/38baihrb-usjm-z68c-189s-d4p2ejmhs6f/it11",
    durationTextKo: "왕복",
    durationTextEn: "Round-trip",
    isActive: true,
  }
];

let dynamicActivitiesCache: ThemeActivityItem[] | null = null;

export function registerCustomThemeActivities(items: ThemeActivityItem[]) {
  dynamicActivitiesCache = items;
}

export function getAllThemeActivities(includeInactive = false): ThemeActivityItem[] {
  const list = dynamicActivitiesCache || THEME_ACTIVITIES_CATALOG;
  if (includeInactive) return list;
  return list.filter((a) => a.isActive !== false);
}

/**
 * 서울 4대궁 ID 목록: 한복 대여 착용 시 입장료 무료(0원) 혜택 대상
 */
export const PALACE_HANBOK_FREE_SPOT_IDS = new Set([
  "seoul_gyeongbokgung",     // 경복궁 (3,000원)
  "seoul_changdeokgung",     // 창덕궁 (3,000원)
  "seoul_changgyeonggung",   // 창경궁 (1,000원)
  "seoul_deoksugung",        // 덕수궁 (1,000원)
]);

/**
 * 주어진 ID가 서울 한복 대여 액티비티인지 판별합니다.
 */
export function isHanbokActivityId(id?: string): boolean {
  if (!id) return false;
  const clean = id.trim();
  return clean === "act_seoul_hanbok" || clean.endsWith("act_seoul_hanbok");
}

/**
 * 해당 스팟이 한복 착용 시 무료 입장 혜택을 받는 서울 4대궁(경복궁, 창덕궁, 창경궁, 덕수궁)인지 판별합니다.
 * (한복 대여 액티비티 자체는 대상이 아닙니다)
 */
export function isPalaceFreeSpot(spotId?: string, spotNameKo?: string): boolean {
  if (!spotId && !spotNameKo) return false;
  // 한복 대여 액티비티 자체는 제외
  if (spotId && (isHanbokActivityId(spotId) || spotId.startsWith("act_"))) return false;
  if (spotNameKo && (spotNameKo.includes("대여") || spotNameKo.includes("체험") || spotNameKo.includes("Rental"))) {
    return false;
  }

  const normalized = spotId
    ? spotId.replace(/^seoul_rep_/, "").replace(/^kto_custom_/, "").replace(/^kto_/, "").trim()
    : "";
  if (spotId && (PALACE_HANBOK_FREE_SPOT_IDS.has(spotId) || PALACE_HANBOK_FREE_SPOT_IDS.has(normalized))) {
    return true;
  }
  if (spotNameKo) {
    const clean = spotNameKo.replace(/\s+/g, "");
    if (clean.includes("경복궁") || clean.includes("창덕궁") || clean.includes("창경궁") || clean.includes("덕수궁")) {
      return true;
    }
  }
  return false;
}

/**
 * 주어진 spot ID 또는 명칭과 연계된 K-테마 액티비티를 검색합니다.
 */
export function getRelatedThemeActivity(spotId: string, spotName?: string): ThemeActivityItem | undefined {
  const normalized = spotId.replace(/^seoul_rep_/, "").replace(/^kto_custom_/, "").replace(/^kto_/, "").trim();
  const catalog = getAllThemeActivities();
  
  // 1. 정확한 spotId key 매칭
  const byKey = catalog.find((act) => act.relatedSpotKey && (act.relatedSpotKey === normalized || act.relatedSpotKey === spotId));
  if (byKey) return byKey;

  // 1-1. 서울 4대궁 한복 대여 연계 (창덕궁, 창경궁, 덕수궁에서도 한복 대여 연계 추천)
  if (PALACE_HANBOK_FREE_SPOT_IDS.has(normalized) || PALACE_HANBOK_FREE_SPOT_IDS.has(spotId)) {
    const hanbokAct = catalog.find((act) => act.id === "act_seoul_hanbok");
    if (hanbokAct) return hanbokAct;
  }

  // 2. 명칭 매칭 (보조 매칭)
  if (spotName) {
    const cleanName = spotName.replace(/\s+/g, "").toLowerCase();
    return catalog.find((act) => {
      if (!act.relatedSpotNameKo) return false;
      const actSpotName = act.relatedSpotNameKo.replace(/\s+/g, "").toLowerCase();
      return cleanName.includes(actSpotName) || actSpotName.includes(cleanName);
    });
  }

  return undefined;
}

/**
 * ThemeActivityItem을 AttractionSpot 인터페이스로 안전하게 변환
 */
export function themeActivityToAttractionSpot(act: ThemeActivityItem): AttractionSpot {
  return {
    id: act.id,
    cityCode: act.cityCode,
    nameKo: act.nameKo,
    nameEn: act.nameEn,
    descKo: act.descKo,
    descEn: act.descEn,
    price: act.priceKrw,
    priceStatus: act.priceKrw > 0 ? "PAID" : "FREE",
    tag: act.tag,
    emoji: "",
    gradientBg: "from-purple-500/15 to-indigo-500/15",
    isFeatured: true,
    categoryType: act.categoryType,
    imageUrl: act.imageUrl || "",
  };
}
