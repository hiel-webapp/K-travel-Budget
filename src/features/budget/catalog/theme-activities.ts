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

export const THEME_ACTIVITIES_CATALOG: ThemeActivityItem[] = [
  // ========================================================
  // 1. 서울 (SEOUL)
  // ========================================================
  {
    id: "act_seoul_hanbok",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_gyeongbokgung",
    relatedSpotNameKo: "경복궁",
    relatedSpotNameEn: "Gyeongbokgung Palace",
    nameKo: "경복궁 한복 대여",
    nameEn: "Gyeongbokgung Hanbok Rental",
    descKo: "경복궁 산책용 고급 한복 대여 및 헤어 손질 (한복 착용 시 경복궁 무료 입장).",
    descEn: "2-hour premium hanbok rental and traditional hairstyling with free palace admission.",
    priceKrw: 25000,
    tag: "K-컬처/인기",
    categoryType: "엔터",
    imageUrl: "",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },
  {
    id: "act_seoul_lotteworld",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_lotteworld",
    relatedSpotNameKo: "롯데월드 어드벤처",
    relatedSpotNameEn: "Lotte World Adventure",
    nameKo: "롯데월드 종합이용권",
    nameEn: "Lotte World All-Day Pass",
    descKo: "실내 어드벤처와 석촌호수 매직아일랜드를 자유롭게 이용하는 1일 종합이용권.",
    descEn: "Full-day unlimited pass to world's largest indoor theme park and outdoor lake attractions.",
    priceKrw: 62000,
    tag: "테마파크",
    categoryType: "엔터",
    imageUrl: "",
    durationTextKo: "종일",
    durationTextEn: "Full day",
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
    imageUrl: "",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
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
    imageUrl: "",
    durationTextKo: "90분",
    durationTextEn: "90 mins",
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
    imageUrl: "",
    durationTextKo: "왕복",
    durationTextEn: "Round-trip",
  },
  {
    id: "act_seoul_personal_color",
    cityCode: "SEOUL",
    relatedSpotKey: "seoul_hongdae",
    relatedSpotNameKo: "홍대 거리",
    relatedSpotNameEn: "Hongdae Street",
    nameKo: "홍대 퍼스널 컬러 진단",
    nameEn: "Hongdae Personal Color Analysis",
    descKo: "홍대 전문 뷰티 스튜디오에서 웜/쿨톤 세부 진단 및 맞춤 화장품 추천.",
    descEn: "Comprehensive personal color diagnosis and Korean makeup cosmetics recommendation.",
    priceKrw: 85000,
    tag: "K-뷰티",
    categoryType: "쇼핑",
    imageUrl: "",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },

  // ========================================================
  // 2. 부산 (BUSAN)
  // ========================================================
  {
    id: "act_busan_blueline",
    cityCode: "BUSAN",
    relatedSpotKey: "busan_blueline",
    relatedSpotNameKo: "해운대 블루라인파크",
    relatedSpotNameEn: "Haeundae Blueline Park",
    nameKo: "해운대 블루라인 해변열차",
    nameEn: "Haeundae Beach Train",
    descKo: "미포에서 송정까지 동해안 해안 절경을 따라 달리는 낭만적인 해변열차 탑승권.",
    descEn: "Scenic coastal train ride linking Mipo to Songjeong beach along the Busan shoreline.",
    priceKrw: 12000,
    tag: "해변열차",
    categoryType: "자연",
    imageUrl: "",
    durationTextKo: "90분",
    durationTextEn: "90 mins",
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
    imageUrl: "",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },
  {
    id: "act_busan_aircruise",
    cityCode: "BUSAN",
    relatedSpotKey: "busan_songdo_cablecar",
    relatedSpotNameKo: "송도 해상케이블카 & 구름산책로",
    relatedSpotNameEn: "Songdo Marine Cable Car",
    nameKo: "송도 해상케이블카 크리스탈",
    nameEn: "Songdo Cable Car Crystal Cabin",
    descKo: "바닥이 투명한 유리 캐빈으로 송도 앞바다 86m 상공을 가로지르는 왕복 탑승권.",
    descEn: "Glass-bottom ocean cable car soaring 86m above Songdo beach waters.",
    priceKrw: 22000,
    tag: "해상케이블카",
    categoryType: "명소",
    imageUrl: "",
    durationTextKo: "40분",
    durationTextEn: "40 mins",
  },
  {
    id: "act_busan_spaland",
    cityCode: "BUSAN",
    relatedSpotKey: "busan_centum_spaland",
    relatedSpotNameKo: "신세계 센텀시티 & 스파랜드",
    relatedSpotNameEn: "Centum City Spaland",
    nameKo: "센텀 스파랜드 찜질스파 이용권",
    nameEn: "Centum City Spaland Admission",
    descKo: "18개 테마 온천과 13개 찜질방을 갖춘 한국 최대 규모 프리미엄 K-스파 4시간 이용권.",
    descEn: "4-hour pass to world-class Korean spa facility with 18 thermal baths and 13 themed saunas.",
    priceKrw: 23000,
    tag: "K-스파/힐링",
    categoryType: "엔터",
    imageUrl: "",
    durationTextKo: "4시간",
    durationTextEn: "4 hours",
  },

  // ========================================================
  // 3. 제주 (JEJU)
  // ========================================================
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
    imageUrl: "",
    durationTextKo: "70분",
    durationTextEn: "70 mins",
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
    imageUrl: "",
    durationTextKo: "20분",
    durationTextEn: "20 mins",
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
    imageUrl: "",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },

  // ========================================================
  // 4. 인천 (INCHEON)
  // ========================================================
  {
    id: "act_incheon_luge",
    cityCode: "INCHEON",
    relatedSpotKey: "incheon_ganghwa_luge",
    relatedSpotNameKo: "강화 루지 (강화씨사이드리조트)",
    relatedSpotNameEn: "Ganghwa Seaside Luge",
    nameKo: "강화 씨사이드 루지 탑승권",
    nameEn: "Ganghwa Seaside Luge Ride",
    descKo: "아시아 최장 1.8km 트랙을 서해 바다를 바라보며 질주하는 곤돌라+루지 1회 탑승권.",
    descEn: "Thrilling 1.8km downhill gravity ride with coastal panorama via scenic gondola.",
    priceKrw: 19000,
    tag: "루지/레포츠",
    categoryType: "엔터",
    imageUrl: "",
    durationTextKo: "40분",
    durationTextEn: "40 mins",
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
    imageUrl: "",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },

  // ========================================================
  // 5. 수원 (SUWON)
  // ========================================================
  {
    id: "act_suwon_flying",
    cityCode: "SUWON",
    relatedSpotKey: "suwon_flying_suwon",
    relatedSpotNameKo: "플라잉 수원 (헬륨 열기구)",
    relatedSpotNameEn: "Flying Suwon",
    nameKo: "플라잉 수원 헬륨기구 탑승권",
    nameEn: "Flying Suwon Helium Balloon",
    descKo: "150m 상공으로 솟아올라 수원화성 성곽과 도심 전체의 낭만적인 야경을 감상하는 계류식 열기구.",
    descEn: "Tethered helium balloon flight reaching 150m above ground with night view over Hwaseong Fortress.",
    priceKrw: 20000,
    tag: "열기구/전망",
    categoryType: "명소",
    imageUrl: "",
    durationTextKo: "15분",
    durationTextEn: "15 mins",
  },
  {
    id: "act_suwon_archery",
    cityCode: "SUWON",
    relatedSpotKey: "suwon_yeonmudae_archery",
    relatedSpotNameKo: "연무대(동장대) & 국궁 활쏘기 체험",
    relatedSpotNameEn: "Yeonmudae Archery Experience",
    nameKo: "수원화성 연무대 국궁 체험",
    nameEn: "Suwon Fortress Traditional Archery",
    descKo: "조선시대 군사 훈련장 연무대에서 사두에게 직접 배우는 전통 한국 국궁 10발 사격.",
    descEn: "Authentic Korean traditional archery practice with 10 arrows guided by master instructors.",
    priceKrw: 20000,
    tag: "전통무예/국궁",
    categoryType: "명소",
    imageUrl: "",
    durationTextKo: "20분",
    durationTextEn: "20 mins",
  },
  {
    id: "act_suwon_hanbok",
    cityCode: "SUWON",
    relatedSpotKey: "suwon_haenggung",
    relatedSpotNameKo: "화성행궁",
    relatedSpotNameEn: "Hwaseong Haenggung Palace",
    nameKo: "화성행궁 전통 한복 대여",
    nameEn: "Suwon Hwaseong Palace Hanbok Rental",
    descKo: "정조대왕의 화성행궁과 행리단길 산책을 위한 단아한 전통 및 퓨전 한복 대여.",
    descEn: "Traditional hanbok rental for historic palace walks and trendy Haengnidan-gil street tours.",
    priceKrw: 20000,
    tag: "한복체험",
    categoryType: "명소",
    imageUrl: "",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },

  // ========================================================
  // 6. 경주 (GYEONGJU)
  // ========================================================
  {
    id: "act_gyeongju_hanbok",
    cityCode: "GYEONGJU",
    relatedSpotKey: "gyeongju_hwangridan",
    relatedSpotNameKo: "황리단길",
    relatedSpotNameEn: "Hwangnidan-gil",
    nameKo: "황리단길 신라복 & 한복 대여",
    nameEn: "Hwangnidan-gil Silla Hanbok Rental",
    descKo: "천년고도 경주 대릉원과 황리단길에서 특별한 신라 귀족 복식 및 한복 대여.",
    descEn: "Ancient Silla kingdom royal costume and hanbok rental for historic park strolling.",
    priceKrw: 20000,
    tag: "신라복식/전통",
    categoryType: "명소",
    imageUrl: "",
    durationTextKo: "2시간",
    durationTextEn: "2 hours",
  },

  // ========================================================
  // 7. 전주 (JEONJU)
  // ========================================================
  {
    id: "act_jeonju_bibimbap_class",
    cityCode: "JEONJU",
    relatedSpotKey: "jeonju_hanok_village",
    relatedSpotNameKo: "전주 한옥마을",
    relatedSpotNameEn: "Jeonju Hanok Village",
    nameKo: "전주 전통비빔밥 만들기 체험",
    nameEn: "Jeonju Bibimbap Cooking Class",
    descKo: "전통 장류와 제철 나물로 만드는 명품 전주비빔밥 조리 및 한약재 발효 모주 시음.",
    descEn: "Hands-on culinary class preparing authentic Jeonju bibimbap and herbal moju wine.",
    priceKrw: 35000,
    tag: "쿠킹클래스/미식",
    categoryType: "엔터",
    imageUrl: "",
    durationTextKo: "90분",
    durationTextEn: "90 mins",
  },

  // ========================================================
  // 8. 강릉 (GANGNEUNG)
  // ========================================================
  {
    id: "act_gangneung_coffee_class",
    cityCode: "GANGNEUNG",
    relatedSpotKey: "gangneung_anmok",
    relatedSpotNameKo: "안목해변 커피거리",
    relatedSpotNameEn: "Anmok Beach Coffee Street",
    nameKo: "안목해변 커피 드립 클래스",
    nameEn: "Anmok Beach Hand-Drip Coffee Class",
    descKo: "한국 커피의 성지 안목해변에서 전문 바리스타에게 배우는 핸드드립 추출과 원두 테이스팅.",
    descEn: "Specialty coffee brewing and tasting session guided by artisan baristas on Gangneung coast.",
    priceKrw: 25000,
    tag: "커피체험",
    categoryType: "엔터",
    imageUrl: "",
    durationTextKo: "60분",
    durationTextEn: "60 mins",
  },

  // ========================================================
  // 9. 속초 (SOKCHO)
  // ========================================================
  {
    id: "act_sokcho_sokchoeye",
    cityCode: "SOKCHO",
    relatedSpotKey: "sokcho_sokchoeye",
    relatedSpotNameKo: "속초아이 대관람차",
    relatedSpotNameEn: "Sokcho Eye Ferris Wheel",
    nameKo: "속초아이 대관람차 탑승권",
    nameEn: "Sokcho Eye Ferris Wheel Pass",
    descKo: "동해안 최초 해변 대관람차로 해발 65m에서 속초 바다와 설악산 울산바위를 한눈에 조망.",
    descEn: "Ride the iconic 65-meter coastal Ferris wheel overlooking Sokcho beach and Mt. Seorak.",
    priceKrw: 12000,
    tag: "대관람차/오션뷰",
    categoryType: "명소",
    imageUrl: "",
    durationTextKo: "15분",
    durationTextEn: "15 mins",
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
    imageUrl: "",
    durationTextKo: "왕복",
    durationTextEn: "Round-trip",
  },

  // ========================================================
  // 10. 여수 (YEOSU)
  // ========================================================
  {
    id: "act_yeosu_cablecar",
    cityCode: "YEOSU",
    relatedSpotKey: "yeosu_marine_cablecar",
    relatedSpotNameKo: "여수 해상케이블카",
    relatedSpotNameEn: "Yeosu Marine Cable Car",
    nameKo: "여수 해상케이블카 크리스탈 왕복",
    nameEn: "Yeosu Marine Cable Car Crystal Cabin",
    descKo: "돌산공원과 자산공원을 잇는 바다 위 80m 높이에서 즐기는 바닥 투명 크리스탈 캐빈 왕복 승차권.",
    descEn: "Round-trip ticket on transparent glass-floor marine cable car 80m over the sea.",
    priceKrw: 24000,
    tag: "해상케이블카/야경",
    categoryType: "명소",
    imageUrl: "",
    durationTextKo: "30분",
    durationTextEn: "30 mins",
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
  
  // 1. 정확한 spotId key 매칭
  const byKey = catalog.find((act) => act.relatedSpotKey && (act.relatedSpotKey === normalized || act.relatedSpotKey === spotId));
  if (byKey) return byKey;

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
