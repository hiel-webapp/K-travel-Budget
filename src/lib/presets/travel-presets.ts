import { SupportedCity, TripDraft } from "../trip-domain";
import { BudgetBasketId, FoodBasketItemSelection } from "../../features/budget/domain/types";
import type { SavePlannerPreferencesInput } from "../storage-helper";

export type TravelPresetId = string;

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
  imageUrl: string;
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
  isActive?: boolean;
  order?: number;
  isCustom?: boolean;
}

export const TRAVEL_PRESETS: TravelPreset[] = [
  {
    "id": "K_TREND_VIBES",
    "badgeKo": "인기 No.1 핫플 투어",
    "badgeEn": "Top Trend & Pop Vibes",
    "titleKo": "도심 핫플 & K-컬처 투어",
    "titleEn": "K-Trend & City Vibes Tour",
    "taglineKo": "반포 무지개분수 요트부터 광안리 오션 야경까지, 가장 트렌디한 한국",
    "taglineEn": "From Han River rainbow fountain yacht to Gwangalli ocean nightscape, experience modern Korea",
    "summaryKo": "한강 달빛 요트와 강남·잠실 랜드마크, 부산 광안리 오션 라이프와 해운대 블루라인파크를 아우르는 MZ 워너비 코스",
    "summaryEn": "Han River moonlit yacht, Gangnam-Jamsil icons, panoramic Gwangalli nightscape, and Haeundae Blueline coastal train in Busan",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/10/3518610_image2_1.jpg",
    "accentColor": "#e25c5c",
    "lightBg": "from-rose-50/70 via-white to-orange-50/40",
    "badgeBg": "bg-rose-100/80 border-rose-200/90",
    "badgeText": "text-rose-700",
    "routeTextKo": "서울 3박 + 부산 2박 (5박 6일)",
    "routeTextEn": "Seoul 3N + Busan 2N (5N 6D)",
    "estimatedBudgetKrw": 1450000,
    "highlightTagsKo": [
      "#한강요트",
      "#광안리야경",
      "#블루라인파크",
      "#비즈니스호텔"
    ],
    "highlightTagsEn": [
      "#HanRiverYacht",
      "#GwangalliNight",
      "#BluelinePark",
      "#BusinessHotel"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 2900000,
      "selectedCities": [
        "SEOUL",
        "BUSAN"
      ],
      "cityNightAllocations": {
        "SEOUL": 3,
        "BUSAN": 2
      },
      "schemaVersion": 1
    },
    "preferences": {
      "accommodationByCity": {
        "SEOUL": "BUSINESS_HOTEL",
        "BUSAN": "BUSINESS_HOTEL"
      },
      "foodBasketSelections": [
        {
          "foodId": "nat_samgyeopsal",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "nat_chimaek",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "seoul_sindang_tteokbokki",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "myeongdong_street_snack",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "busan_dwaeji_gukbap",
          "quantity": 1,
          "cityCode": "BUSAN"
        },
        {
          "foodId": "busan_seafood_night",
          "quantity": 1,
          "cityCode": "BUSAN"
        },
        {
          "foodId": "busan_milmyeon",
          "quantity": 1,
          "cityCode": "BUSAN"
        },
        {
          "foodId": "busan_street_snack",
          "quantity": 1,
          "cityCode": "BUSAN"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_hangang_night",
            "seoul_gangnam_jamsil"
          ],
          "individualSpotIds": [
            "seoul_yeouido_hangang",
            "seoul_banpo_rainbow_fountain",
            "seoul_coex_starfield_library",
            "seoul_lotteworld",
            "act_seoul_han_river_cruise"
          ]
        },
        "BUSAN": {
          "selectedCourseIds": [
            "busan_gwangalli_trend",
            "busan_haeundae_ocean"
          ],
          "individualSpotIds": [
            "busan_gwangalli",
            "busan_thebay101",
            "busan_blueline",
            "act_busan_yacht"
          ]
        }
      },
      "intercityTransportOverrides": {
        "SEOUL-BUSAN": "KTX"
      },
      "emergencyFundPct": 0.1
    },
    "isActive": true,
    "order": 1,
    "isCustom": false
  },
  {
    "id": "K_HERITAGE_SOUL",
    "badgeKo": "고즈넉한 역사·전통",
    "badgeEn": "Authentic Heritage",
    "titleKo": "전통 한옥 & 헤리티지 감성 투어",
    "titleEn": "K-Heritage & Hanok Soul Tour",
    "taglineKo": "궁궐 한복 산책과 전주 한옥마을, 신라 천년의 달빛을 걷다",
    "taglineEn": "Palace hanbok strolls, Jeonju Hanok alleys, and Millennium Silla moonlit UNESCO dynasties",
    "summaryKo": "서울 4대궁 한복 무료체험과 북촌·인사동, 전주 전통 한옥마을 슬로시티, 경주 불국사와 동궁과 월지 야경을 잇는 한국 전통 미학의 정석",
    "summaryEn": "Seoul royal palaces with free hanbok admission, Jeonju slow-city Hanok village, and Gyeongju UNESCO temples & Donggung moonlit lake",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/04/3304404_image2_1.jpg",
    "accentColor": "#b45309",
    "lightBg": "from-amber-50/70 via-white to-stone-50/40",
    "badgeBg": "bg-amber-100/80 border-amber-200/90",
    "badgeText": "text-amber-800",
    "routeTextKo": "서울 2박 + 전주 1박 + 경주 2박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Jeonju 1N + Gyeongju 2N (5N 6D)",
    "estimatedBudgetKrw": 1550000,
    "highlightTagsKo": [
      "#경복궁한복",
      "#전주한옥스테이",
      "#황리단길야경",
      "#불국사세계유산"
    ],
    "highlightTagsEn": [
      "#HanbokPalace",
      "#JeonjuHanokStay",
      "#HwangridanNight",
      "#UNESCOBulguksa"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 3100000,
      "selectedCities": [
        "SEOUL",
        "JEONJU",
        "GYEONGJU"
      ],
      "cityNightAllocations": {
        "SEOUL": 2,
        "JEONJU": 1,
        "GYEONGJU": 2
      },
      "schemaVersion": 1
    },
    "preferences": {
      "accommodationByCity": {
        "SEOUL": "BUSINESS_HOTEL",
        "JEONJU": "HANOK_BOUTIQUE",
        "GYEONGJU": "HANOK_BOUTIQUE"
      },
      "foodBasketSelections": [
        {
          "foodId": "nat_bulgogi",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "insadong_traditional_tea",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "jeonju_bibimbap",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "jeonju_chocopie",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "jeonju_kongnamul_gukbap",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "gyeongju_hanwoo_mulhoe",
          "quantity": 1,
          "cityCode": "GYEONGJU"
        },
        {
          "foodId": "gyeongju_10won_bread",
          "quantity": 1,
          "cityCode": "GYEONGJU"
        },
        {
          "foodId": "gyeongju_hwangnambbang",
          "quantity": 1,
          "cityCode": "GYEONGJU"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_heritage_palace"
          ],
          "individualSpotIds": [
            "seoul_gyeongbokgung",
            "seoul_bukchon",
            "seoul_insadong_ssamzigil",
            "act_seoul_hanbok"
          ]
        },
        "JEONJU": {
          "selectedCourseIds": [
            "jeonju_hanok_heritage"
          ],
          "individualSpotIds": [
            "jeonju_hanok_village",
            "jeonju_gyeonggijeon",
            "act_jeonju_bibimbap_class"
          ]
        },
        "GYEONGJU": {
          "selectedCourseIds": [
            "gyeongju_silla_moonlight",
            "gyeongju_unesco_heritage"
          ],
          "individualSpotIds": [
            "gyeongju_daereungwon",
            "gyeongju_hwangridan",
            "gyeongju_donggung_wolji",
            "gyeongju_bulguksa",
            "act_gyeongju_hanbok"
          ]
        }
      },
      "emergencyFundPct": 0.1
    },
    "isActive": true,
    "order": 2,
    "isCustom": false
  },
  {
    "id": "K_NATURE_CHILL",
    "badgeKo": "푸른 바다 & 힐링 휴양",
    "badgeEn": "Ocean & Coastal Chill",
    "titleKo": "동해 바다 & 자연 힐링 투어",
    "titleEn": "East Coast & Nature Chill Tour",
    "taglineKo": "탁 트인 에메랄드 동해안과 솔향 그윽한 해변 커피 산책",
    "taglineEn": "Panoramic emerald coastlines, pine forest breeze, and beachside specialty coffee",
    "summaryKo": "서울 한강의 상쾌한 휴식과 KTX로 1시간대 연결되는 강릉 안목해변 커피거리, 아르떼뮤지엄, 주문진 BTS 정류장을 잇는 감성 힐링",
    "summaryEn": "Seoul riverside relaxation seamlessly connected via KTX to Gangneung Anmok ocean coffee street, Arte Museum, and Jumunjin BTS stop",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/99/3546099_image2_1.jpg",
    "accentColor": "#0284c7",
    "lightBg": "from-sky-50/70 via-white to-cyan-50/40",
    "badgeBg": "bg-sky-100/80 border-sky-200/90",
    "badgeText": "text-sky-800",
    "routeTextKo": "서울 2박 + 강릉 3박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Gangneung 3N (5N 6D)",
    "estimatedBudgetKrw": 1350000,
    "highlightTagsKo": [
      "#안목커피거리",
      "#BTS버스정류장",
      "#아르떼뮤지엄",
      "#KTX직통"
    ],
    "highlightTagsEn": [
      "#AnmokCoffeeStreet",
      "#BTSBusStop",
      "#ArteMuseum",
      "#DirectKTX"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 2700000,
      "selectedCities": [
        "SEOUL",
        "GANGNEUNG"
      ],
      "cityNightAllocations": {
        "SEOUL": 2,
        "GANGNEUNG": 3
      },
      "schemaVersion": 1
    },
    "preferences": {
      "accommodationByCity": {
        "SEOUL": "BUSINESS_HOTEL",
        "GANGNEUNG": "BUSINESS_HOTEL"
      },
      "foodBasketSelections": [
        {
          "foodId": "nat_chimaek",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "nat_street_toast",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "gangneung_chodang_sundubu",
          "quantity": 1,
          "cityCode": "GANGNEUNG"
        },
        {
          "foodId": "gangneung_jang_kalguksu",
          "quantity": 1,
          "cityCode": "GANGNEUNG"
        },
        {
          "foodId": "jumunjin_seafood_market",
          "quantity": 1,
          "cityCode": "GANGNEUNG"
        },
        {
          "foodId": "gangneung_ojingeo_sundae",
          "quantity": 1,
          "cityCode": "GANGNEUNG"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_hangang_night"
          ],
          "individualSpotIds": [
            "seoul_yeouido_hangang",
            "seoul_some_sevit"
          ]
        },
        "GANGNEUNG": {
          "selectedCourseIds": [
            "gangneung_coffee_market",
            "gangneung_jumunjin_bts",
            "gangneung_gyeongpo_ocean_art"
          ],
          "individualSpotIds": [
            "gangneung_anmok",
            "gangneung_bts_busstop",
            "gangneung_arte",
            "gangneung_gyeongpo",
            "act_gangneung_coffee_class"
          ]
        }
      },
      "intercityTransportOverrides": {
        "SEOUL-GANGNEUNG": "KTX"
      },
      "emergencyFundPct": 0.1
    },
    "isActive": true,
    "order": 3,
    "isCustom": false
  },
  {
    "id": "K_JEJU_ESCAPE",
    "badgeKo": "에메랄드 바다 & 제주 힐링",
    "badgeEn": "Jeju Emerald Island",
    "titleKo": "제주 에메랄드 & 힐링 아일랜드",
    "titleEn": "Jeju Emerald Island & Healing Tour",
    "taglineKo": "성산일출봉과 협재 에메랄드 바다, 이국적인 섬 힐링",
    "taglineEn": "Seongsan Ilchulbong sunrise, Hyeopjae emerald seas, and exotic island relaxation",
    "summaryKo": "서울 도심 쇼핑·엔터와 유네스코 자연유산 제주의 환상적인 성산일출봉, 비자림 숲길, 협재 에메랄드 바다, 흑돼지 미식을 함께 즐기는 완벽한 휴양",
    "summaryEn": "Dynamic Seoul combined with Jeju UNESCO natural wonders, Bijarim sacred forest, Hyeopjae emerald beaches, and authentic black pork gourmet",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/66/3096066_image2_1.jpg",
    "accentColor": "#059669",
    "lightBg": "from-emerald-50/70 via-white to-teal-50/40",
    "badgeBg": "bg-emerald-100/80 border-emerald-200/90",
    "badgeText": "text-emerald-800",
    "routeTextKo": "서울 2박 + 제주 3박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Jeju 3N (5N 6D)",
    "estimatedBudgetKrw": 1600000,
    "highlightTagsKo": [
      "#성산일출봉",
      "#우도전기차",
      "#제주흑돼지",
      "#협재에메랄드"
    ],
    "highlightTagsEn": [
      "#SeongsanPeak",
      "#UdoElectricBike",
      "#JejuBlackPork",
      "#HyeopjaeEmerald"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 3200000,
      "selectedCities": [
        "SEOUL",
        "JEJU"
      ],
      "cityNightAllocations": {
        "SEOUL": 2,
        "JEJU": 3
      },
      "schemaVersion": 1
    },
    "preferences": {
      "accommodationByCity": {
        "SEOUL": "BUSINESS_HOTEL",
        "JEJU": "BUSINESS_HOTEL"
      },
      "foodBasketSelections": [
        {
          "foodId": "nat_samgyeopsal",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "myeongdong_street_snack",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "jeju_black_pork",
          "quantity": 1,
          "cityCode": "JEJU"
        },
        {
          "foodId": "jeju_seafood_ramyeon",
          "quantity": 1,
          "cityCode": "JEJU"
        },
        {
          "foodId": "jeju_gogi_guksu",
          "quantity": 1,
          "cityCode": "JEJU"
        },
        {
          "foodId": "jeju_ttaksaewoo_sashimi",
          "quantity": 1,
          "cityCode": "JEJU"
        },
        {
          "foodId": "jeju_galchi_jorim",
          "quantity": 1,
          "cityCode": "JEJU"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_namsan_myeongdong"
          ],
          "individualSpotIds": [
            "seoul_myeongdong_shopping",
            "seoul_nseoultower",
            "act_seoul_n_tower"
          ]
        },
        "JEJU": {
          "selectedCourseIds": [
            "jeju_east_unesco",
            "jeju_northeast_beach_forest",
            "jeju_west_sunset"
          ],
          "individualSpotIds": [
            "jeju_seongsan",
            "jeju_bijarim",
            "jeju_hamdeok",
            "jeju_hyeopjae",
            "jeju_udo",
            "act_jeju_udo_bike"
          ]
        }
      },
      "intercityTransportOverrides": {
        "SEOUL-JEJU": "FLIGHT"
      },
      "emergencyFundPct": 0.1
    },
    "isActive": true,
    "order": 4,
    "isCustom": false
  },
  {
    "id": "K_FOODIE_GOURMET",
    "badgeKo": "입맛 저격 미식 기행",
    "badgeEn": "Authentic Foodie Crawl",
    "titleKo": "K-미식 & 시장 탐방 스트릿 투어",
    "titleEn": "K-Gourmet & Street Foodie Tour",
    "taglineKo": "광장시장 육회·빈대떡부터 전주 남부야시장, 부산 자갈치 활어회까지",
    "taglineEn": "From Gwangjang market yukhoe & bindaetteok to Jeonju Nambu night market and Busan Jagalchi seafood",
    "summaryKo": "서울 100년 광장시장의 먹거리부터 유네스코 미식도시 전주의 비빔밥과 피순대, 부산 자갈치 바닷가 활어회와 돼지국밥까지 한국 3대 미식 성지 완전정복",
    "summaryEn": "A culinary journey covering 100-year traditional market delicacies in Seoul, UNESCO gourmet city Jeonju, and fresh ocean seafood feasts in Busan",
    "imageUrl": "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/ee3b8a7f-8453-45e2-9968-ac214c6bb688/it11",
    "accentColor": "#d97706",
    "lightBg": "from-orange-50/70 via-white to-amber-50/40",
    "badgeBg": "bg-orange-100/80 border-orange-200/90",
    "badgeText": "text-orange-800",
    "routeTextKo": "서울 2박 + 전주 1박 + 부산 2박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Jeonju 1N + Busan 2N (5N 6D)",
    "estimatedBudgetKrw": 1500000,
    "highlightTagsKo": [
      "#광장시장육회",
      "#전주남부야시장",
      "#자갈치활어회",
      "#전통미식기행"
    ],
    "highlightTagsEn": [
      "#GwangjangYukhoe",
      "#JeonjuNightMarket",
      "#JagalchiSeafood",
      "#KFoodieCrawl"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 3000000,
      "selectedCities": [
        "SEOUL",
        "JEONJU",
        "BUSAN"
      ],
      "cityNightAllocations": {
        "SEOUL": 2,
        "JEONJU": 1,
        "BUSAN": 2
      },
      "schemaVersion": 1
    },
    "preferences": {
      "accommodationByCity": {
        "SEOUL": "BUSINESS_HOTEL",
        "JEONJU": "HANOK_BOUTIQUE",
        "BUSAN": "BUSINESS_HOTEL"
      },
      "foodBasketSelections": [
        {
          "foodId": "food_724803",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "seoul_gwangjang_pancake",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "nat_chimaek",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "seoul_euljiro_golbaengi",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "jeonju_bibimbap",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "jeonju_pi_sundae",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "jeonju_moju_pajeon",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "jeonju_chocopie",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "busan_dwaeji_gukbap",
          "quantity": 1,
          "cityCode": "BUSAN"
        },
        {
          "foodId": "jagalchi_raw_fish",
          "quantity": 1,
          "cityCode": "BUSAN"
        },
        {
          "foodId": "busan_nampo_street_snack",
          "quantity": 1,
          "cityCode": "BUSAN"
        },
        {
          "foodId": "busan_milmyeon",
          "quantity": 1,
          "cityCode": "BUSAN"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_namsan_myeongdong",
            "seoul_heritage_palace"
          ],
          "individualSpotIds": [
            "seoul_namdaemun",
            "seoul_insadong_ssamzigil",
            "act_seoul_tea_class"
          ]
        },
        "JEONJU": {
          "selectedCourseIds": [
            "jeonju_mural_night_market",
            "jeonju_hanok_heritage"
          ],
          "individualSpotIds": [
            "jeonju_nambu_market",
            "jeonju_hanok_village",
            "act_jeonju_bibimbap_class"
          ]
        },
        "BUSAN": {
          "selectedCourseIds": [
            "busan_nampo_culture",
            "busan_gwangalli_trend"
          ],
          "individualSpotIds": [
            "busan_jagalchi",
            "busan_biff_gukje",
            "busan_gwangalli",
            "act_busan_yacht"
          ]
        }
      },
      "emergencyFundPct": 0.1
    },
    "isActive": true,
    "order": 5,
    "isCustom": false
  }
];

let dynamicPresetsCache: TravelPreset[] | null = null;

export function setDynamicPresets(presets: TravelPreset[]) {
  dynamicPresetsCache = presets;
}

export function getTravelPresets(includeInactive = false): TravelPreset[] {
  const list = dynamicPresetsCache ?? TRAVEL_PRESETS;
  if (includeInactive) return list;
  return list.filter((p) => p.isActive !== false);
}

export function getTravelPresetById(id: string): TravelPreset | undefined {
  const list = dynamicPresetsCache ?? TRAVEL_PRESETS;
  return list.find((p) => p.id === id);
}
