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
  imageUrl: string;
  durationTextKo?: string;
  durationTextEn?: string;
  bookingTipKo?: string;
  bookingTipEn?: string;
  isActive?: boolean;
}

export const THEME_ACTIVITIES_CATALOG: ThemeActivityItem[] = [
  // === SEOUL ===
  {
    id: "act_seoul_hanbok",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_gyeongbokgung",
    relatedSpotNameKo: "경복궁",
    relatedSpotNameEn: "Gyeongbokgung Palace",
    nameKo: "경복궁 프리미엄 한복 대여 & 헤어 스타일링",
    nameEn: "Gyeongbokgung Premium Hanbok Rental",
    descKo: "경복궁·북촌 한옥마을 산책용 고급 한복 대여(2시간) 및 전통 헤어 손질. 한복 착용 시 4대궁 무료 입장 혜택.",
    descEn: "2-hour premium hanbok rental and traditional hairstyling. Free admission to royal palaces while wearing hanbok.",
    priceKrw: 25000,
    tag: "K-컬처/인기",
    categoryType: "엔터",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },
  {
    id: "act_seoul_lotteworld",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_seoulsky",
    relatedSpotNameKo: "롯데월드타워 서울스카이",
    relatedSpotNameEn: "Lotte World Tower",
    nameKo: "롯데월드 어드벤처 & 매직아일랜드 종일 자유이용권",
    nameEn: "Lotte World Adventure All-Day Pass",
    descKo: "세계 최대 규모의 실내 테마파크 어드벤처와 석촌호수 위 야외 매직아일랜드를 자유롭게 즐기는 1일권.",
    descEn: "Full-day unlimited pass to world's largest indoor theme park and outdoor lake attractions.",
    priceKrw: 62000,
    tag: "테마파크/어트랙션",
    categoryType: "엔터",
    imageUrl: "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "반일/종일",
    durationTextEn: "Half/Full day",
  },
  {
    id: "act_seoul_han_river_cruise",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_mangwon",
    relatedSpotNameKo: "망원한강공원",
    relatedSpotNameEn: "Hangang River Park",
    nameKo: "한강 반포 달빛무지개 분수 요트 투어",
    nameEn: "Han River Sunset & Fountain Yacht Cruise",
    descKo: "반포한강공원 세빛섬에서 출발하여 반포대교 달빛무지개 분수와 서울 야경을 감상하는 럭셔리 요트 투어.",
    descEn: "Sunset & night view luxury yacht cruise at Banpo Moonlight Rainbow Fountain.",
    priceKrw: 28000,
    tag: "야경/크루즈",
    categoryType: "자연",
    imageUrl: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },
  {
    id: "act_seoul_tea_class",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_bukchon",
    relatedSpotNameKo: "북촌한옥마을",
    relatedSpotNameEn: "Bukchon Hanok Village",
    nameKo: "북촌 한옥 전통 다도 & 다과 원데이 클래스",
    nameEn: "Bukchon Hanok Traditional Tea Ceremony",
    descKo: "고즈넉한 북촌 한옥에서 한국 전통 녹차 및 발효차를 우리고 전통 한과를 맛보는 힐링 다도 체험.",
    descEn: "Traditional tea ceremony experience with artisanal tea and refreshments in a historic hanok.",
    priceKrw: 35000,
    tag: "전통/힐링",
    categoryType: "명소",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "90분",
    durationTextEn: "90 mins",
  },
  {
    id: "act_seoul_n_tower",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_nseoultower",
    relatedSpotNameKo: "N서울타워 전망대",
    relatedSpotNameEn: "N Seoul Tower Observatory",
    nameKo: "N서울타워 전망대 입장권 & 남산 케이블카 왕복",
    nameEn: "N Seoul Tower Observatory & Cable Car",
    descKo: "서울의 상징 남산 케이블카 탑승과 해발 479m 전망대에서 360도 서울 도심 파노라마 뷰 감상.",
    descEn: "Round-trip Namsan cable car ride and admission to 360-degree observatory deck.",
    priceKrw: 26000,
    tag: "랜드마크/전망대",
    categoryType: "명소",
    imageUrl: "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },
  {
    id: "act_seoul_personal_color",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_hongdae",
    relatedSpotNameKo: "홍대 걷고싶은거리",
    relatedSpotNameEn: "Hongdae Walking Street",
    nameKo: "K-뷰티 1:1 퍼스널 컬러 진단 & 파우치 컨설팅",
    nameEn: "K-Beauty 1:1 Personal Color Analysis",
    descKo: "홍대/강남 전문 스튜디오에서 웜톤/쿨톤 세부 진단 및 어울리는 한국 립스틱/메이크업 제품 추천.",
    descEn: "Comprehensive personal color diagnosis and Korean makeup cosmetics recommendation.",
    priceKrw: 85000,
    tag: "K-뷰티/체험",
    categoryType: "쇼핑",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },

  // === BUSAN ===
  {
    id: "act_busan_blueline",
    cityCode: "BUSAN",
    relatedSpotKey: "busan_blueline",
    relatedSpotNameKo: "해운대 블루라인파크",
    relatedSpotNameEn: "Haeundae Blueline Park",
    nameKo: "해운대 블루라인파크 해변열차 왕복 탑승권",
    nameEn: "Haeundae Blueline Beach Train Pass",
    descKo: "미포에서 송정까지 4.8km 동해안 해안 절경을 따라 달리는 낭만적인 해변열차 왕복 승차권.",
    descEn: "Scenic coastal train ride linking Mipo to Songjeong beach along the Busan shoreline.",
    priceKrw: 12000,
    tag: "해변열차/뷰맛집",
    categoryType: "자연",
    imageUrl: "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "90분",
    durationTextEn: "90 mins",
  },
  {
    id: "act_busan_yacht",
    cityCode: "BUSAN",
    relatedSpotKey: "busan_haeundae",
    relatedSpotNameKo: "해운대 해수욕장",
    relatedSpotNameEn: "Haeundae Beach",
    nameKo: "해운대 더베이101 광안대교 야경 요트 투어",
    nameEn: "Haeundae Gwangandaegyo Night Yacht Tour",
    descKo: "마린시티와 광안대교 다이아몬드 브릿지 조명을 바다 위에서 바로 조망하는 선셋 & 야경 요트.",
    descEn: "Luxury yacht cruise overlooking the illuminated Gwangandaegyo Bridge and Marine City skyline.",
    priceKrw: 30000,
    tag: "야경/요트",
    categoryType: "엔터",
    imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },
  {
    id: "act_busan_aircruise",
    cityCode: "BUSAN",
    relatedSpotKey: "busan_songdo_cablecar",
    relatedSpotNameKo: "송도 해상케이블카 & 구름산책로",
    relatedSpotNameEn: "Songdo Marine Cable Car",
    nameKo: "송도 해상케이블카 크리스탈크루즈 (바닥 투명)",
    nameEn: "Songdo Marine Cable Car Crystal Cabin",
    descKo: "송도해수욕장 바다 위 86m 상공을 가로지르는 투명 바닥 캐빈 케이블카 왕복 탑승권.",
    descEn: "Glass-bottom ocean cable car soaring 86m above Songdo beach waters.",
    priceKrw: 22000,
    tag: "해상케이블카",
    categoryType: "명소",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "40분",
    durationTextEn: "40 mins",
  },

  // === JEJU ===
  {
    id: "act_jeju_submarine",
    cityCode: "JEJU",
    relatedSpotKey: "jeju_seogwipo_market",
    relatedSpotNameKo: "서귀포 매일올레시장",
    relatedSpotNameEn: "Seogwipo Olle Market",
    nameKo: "서귀포 잠수함 해저 40m 난파선 & 산호초 탐험",
    nameEn: "Seogwipo Submarine 40m Ocean Tour",
    descKo: "유네스코 생물권보전지역 문섬 해저 40m로 잠항하여 수중 난파선과 천연 산호초 군락을 관람.",
    descEn: "Real submarine deep-sea dive to 40 meters exploring shipwrecks and coral reefs off Seogwipo.",
    priceKrw: 65000,
    tag: "잠수함/해양",
    categoryType: "엔터",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "70분",
    durationTextEn: "70 mins",
  },
  {
    id: "act_jeju_arte_museum",
    cityCode: "JEJU",
    relatedSpotKey: "jeju_arte_museum",
    relatedSpotNameKo: "아르떼뮤지엄 제주",
    relatedSpotNameEn: "ARTE Museum Jeju",
    nameKo: "아르떼뮤지엄 제주 몰입형 미디어아트 전시",
    nameEn: "ARTE Museum Jeju Immersive Media Art",
    descKo: "빛과 소리가 만드는 웅장한 시각적 몰입. 한국 대표 현대 미디어아트 상설 전시관.",
    descEn: "Spectacular immersive digital media art exhibition featuring light, sound, and nature themes.",
    priceKrw: 17000,
    tag: "미디어아트/실내",
    categoryType: "명소",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },

  // === GYEONGJU ===
  {
    id: "act_gyeongju_hanbok",
    cityCode: "GYEONGJU",
    relatedSpotKey: "gyeongju_hwangridan",
    relatedSpotNameKo: "황리단길",
    relatedSpotNameEn: "Hwangnidan-gil",
    nameKo: "황리단길 신라 전통복식 & 한복 산책",
    nameEn: "Hwangnidan-gil Silla Royal Costume Experience",
    descKo: "천년고도 경주 대릉원과 황리단길에서 특별한 신라 귀족 복식 및 한복 대여.",
    descEn: "Ancient Silla kingdom royal costume and hanbok rental for historic park strolling.",
    priceKrw: 20000,
    tag: "신라복식/전통",
    categoryType: "명소",
    imageUrl: "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },

  // === JEONJU ===
  {
    id: "act_jeonju_bibimbap_class",
    cityCode: "JEONJU",
    relatedSpotKey: "jeonju_hanok_village",
    relatedSpotNameKo: "전주 한옥마을",
    relatedSpotNameEn: "Jeonju Hanok Village",
    nameKo: "전주 한옥마을 전통 전주비빔밥 & 모주 쿠킹 클래스",
    nameEn: "Jeonju Hanok Village Bibimbap Cooking Class",
    descKo: "전통 장류와 제철 나물로 만드는 명품 전주비빔밥 조리 및 한약재 발효 모주 빚기 체험.",
    descEn: "Hands-on culinary class preparing authentic Jeonju bibimbap and herbal moju wine.",
    priceKrw: 35000,
    tag: "쿠킹클래스/미식",
    categoryType: "엔터",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "90분",
    durationTextEn: "90 mins",
  },

  // === GANGNEUNG ===
  {
    id: "act_gangneung_coffee_class",
    cityCode: "GANGNEUNG",
    relatedSpotKey: "gangneung_anmok",
    relatedSpotNameKo: "안목해변 커피거리",
    relatedSpotNameEn: "Anmok Beach Coffee Street",
    nameKo: "안목해변 스페셜티 커피 핸드드립 & 로스팅 체험",
    nameEn: "Anmok Beach Specialty Hand-Drip Coffee Class",
    descKo: "한국 커피의 성지 강릉 안목해변에서 바리스타에게 배우는 핸드드립 추출 및 원두 테이스팅.",
    descEn: "Specialty coffee brewing and tasting session guided by artisan baristas on Gangneung coast.",
    priceKrw: 25000,
    tag: "커피체험/원데이",
    categoryType: "엔터",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },
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
 * 주어진 spot ID 또는 명칭과 연계된 K-테마 액티비티를 검색합니다.
 */
export function getRelatedThemeActivity(spotId: string, spotName?: string): ThemeActivityItem | undefined {
  const normalized = spotId.replace(/^seoul_rep_/, "").replace(/^kto_custom_/, "").replace(/^kto_/, "").trim();
  const catalog = getAllThemeActivities();
  
  // 1. 정확한 key 매칭
  const byKey = catalog.find((act) => act.relatedSpotKey && act.relatedSpotKey === normalized);
  if (byKey) return byKey;

  // 2. 명칭 유사도 매칭 (보조 매칭)
  if (spotName) {
    const cleanName = spotName.replace(/\s+/g, "");
    return catalog.find((act) => {
      if (!act.relatedSpotNameKo) return false;
      const actSpotName = act.relatedSpotNameKo.replace(/\s+/g, "");
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
    imageUrl: act.imageUrl,
  };
}
