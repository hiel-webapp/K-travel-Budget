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
    "taglineKo": "성수 팝업부터 광안리 드론쇼까지, 가장 트렌디한 한국",
    "taglineEn": "From Seongsu pop-ups to Gwangalli night drones, experience modern Korea",
    "summaryKo": "성수동·홍대 감성 카페와 K-패션 쇼핑, 부산 마린시티와 광안리 오션 야경을 아우르는 MZ 워너비 코스",
    "summaryEn": "Trendy cafes in Seongsu & Hongdae, K-fashion shopping, and panoramic Marine City ocean nightscapes in Busan",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/10/3518610_image2_1.jpg",
    "accentColor": "#e25c5c",
    "lightBg": "from-rose-50/70 via-white to-orange-50/40",
    "badgeBg": "bg-rose-100/80 border-rose-200/90",
    "badgeText": "text-rose-700",
    "routeTextKo": "서울 3박 + 부산 2박 (5박 6일)",
    "routeTextEn": "Seoul 3N + Busan 2N (5N 6D)",
    "estimatedBudgetKrw": 1380000,
    "highlightTagsKo": [
      "#성수팝업",
      "#홍대감성",
      "#광안리야경",
      "#비즈니스호텔"
    ],
    "highlightTagsEn": [
      "#SeongsuPopup",
      "#Hongdae",
      "#GwangalliNight",
      "#BusinessHotel"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 2760000,
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
          "foodId": "seoul_cafe_latte",
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
          "foodId": "busan_street_snack",
          "quantity": 1,
          "cityCode": "BUSAN"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_course_trend"
          ],
          "individualSpotIds": [
            "seoul_seongsu_popup",
            "seoul_ddp_hongdae",
            "seoul_n_tower"
          ]
        },
        "BUSAN": {
          "selectedCourseIds": [
            "busan_course_night_trend"
          ],
          "individualSpotIds": [
            "busan_blueline_park",
            "busan_ocean_night"
          ]
        }
      },
      "emergencyFundKrw": 50000,
      "intercityTransportOverrides": {
        "SEOUL-BUSAN": "KTX"
      }
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
    "taglineKo": "궁궐 야간개장과 한옥마을, 신라 천년의 숨결을 걷다",
    "taglineEn": "Palace starlight walks, hanok village alleys, and UNESCO ancient dynasties",
    "summaryKo": "서울 4대궁과 북촌, 전주 전통 한옥마을 슬로시티, 경주 불국사와 황리단길을 잇는 한국 전통 미학의 정석",
    "summaryEn": "Seoul royal palaces & Bukchon, Jeonju slow-city Hanok village, and Gyeongju UNESCO temples & Hwangridan-gil",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/04/3304404_image2_1.jpg",
    "accentColor": "#b45309",
    "lightBg": "from-amber-50/70 via-white to-stone-50/40",
    "badgeBg": "bg-amber-100/80 border-amber-200/90",
    "badgeText": "text-amber-800",
    "routeTextKo": "서울 2박 + 전주 1박 + 경주 2박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Jeonju 1N + Gyeongju 2N (5N 6D)",
    "estimatedBudgetKrw": 1700000,
    "highlightTagsKo": [
      "#한옥스테이",
      "#경복궁한복",
      "#전주비빔밥",
      "#불국사대릉원"
    ],
    "highlightTagsEn": [
      "#HanokStay",
      "#HanbokPalace",
      "#JeonjuBibimbap",
      "#UNESCOBulguksa"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 3400000,
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
          "foodId": "nat_bibimbap",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "jeonju_choco_pie",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "gyeongju_ssambap",
          "quantity": 1,
          "cityCode": "GYEONGJU"
        },
        {
          "foodId": "hwangnam_bread",
          "quantity": 1,
          "cityCode": "GYEONGJU"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_course_heritage"
          ],
          "individualSpotIds": [
            "seoul_palace_hanbok",
            "seoul_changdeok_secret",
            "seoul_insadong_ssamzi"
          ]
        },
        "JEONJU": {
          "selectedCourseIds": [
            "jeonju_course_highlight"
          ],
          "individualSpotIds": [
            "jeonju_hanok_heritage",
            "jeonju_gyeonggijeon"
          ]
        },
        "GYEONGJU": {
          "selectedCourseIds": [
            "gyeongju_course_unesco_heritage"
          ],
          "individualSpotIds": [
            "gyeongju_unesco_temple",
            "gyeongju_daereungwon_night"
          ]
        }
      },
      "emergencyFundKrw": 50000
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
    "summaryKo": "서울의 상징적인 한강 랜드마크와 KTX로 1시간대 연결되는 강릉 안목해변 커피거리, 경포호 힐링 산책",
    "summaryEn": "Seoul riverside icons seamlessly connected via KTX to Gangneung Anmok ocean coffee street & Gyeongpo lake",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/99/3546099_image2_1.jpg",
    "accentColor": "#0284c7",
    "lightBg": "from-sky-50/70 via-white to-cyan-50/40",
    "badgeBg": "bg-sky-100/80 border-sky-200/90",
    "badgeText": "text-sky-800",
    "routeTextKo": "서울 2박 + 강릉 3박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Gangneung 3N (5N 6D)",
    "estimatedBudgetKrw": 1300000,
    "highlightTagsKo": [
      "#안목커피거리",
      "#동해오션뷰",
      "#BTS버스정류장",
      "#KTX직통"
    ],
    "highlightTagsEn": [
      "#AnmokCoffee",
      "#EastSeaView",
      "#BTSBusStop",
      "#DirectKTX"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 2600000,
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
          "foodId": "seoul_korean_toast",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "gangneung_sundubu",
          "quantity": 1,
          "cityCode": "GANGNEUNG"
        },
        {
          "foodId": "anmok_ocean_cafe",
          "quantity": 1,
          "cityCode": "GANGNEUNG"
        },
        {
          "foodId": "jumunjin_seafood_market",
          "quantity": 1,
          "cityCode": "GANGNEUNG"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_course_river"
          ],
          "individualSpotIds": [
            "seoul_hangang_healing",
            "seoul_n_tower"
          ]
        },
        "GANGNEUNG": {
          "selectedCourseIds": [
            "gangneung_course_highlight"
          ],
          "individualSpotIds": [
            "gangneung_bts_bus_stop",
            "gangneung_arte_museum",
            "gangneung_anmok_gyeongpo"
          ]
        }
      },
      "emergencyFundKrw": 50000,
      "intercityTransportOverrides": {
        "SEOUL-GANGNEUNG": "KTX"
      }
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
    "summaryKo": "서울의 다이나믹한 매력과 유네스코 자연유산 제주의 환상적인 해안 도로, 흑돼지 미식을 함께 즐기는 완벽한 휴양",
    "summaryEn": "Dynamic Seoul combined with Jeju UNESCO natural wonders, coastal drives, and premium black pork gourmet",
    "imageUrl": "https://tong.visitkorea.or.kr/cms/resource/66/3096066_image2_1.jpg",
    "accentColor": "#059669",
    "lightBg": "from-emerald-50/70 via-white to-teal-50/40",
    "badgeBg": "bg-emerald-100/80 border-emerald-200/90",
    "badgeText": "text-emerald-800",
    "routeTextKo": "서울 2박 + 제주 3박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Jeju 3N (5N 6D)",
    "estimatedBudgetKrw": 1550000,
    "highlightTagsKo": [
      "#성산일출봉",
      "#비자림숲길",
      "#제주흑돼지",
      "#에메랄드해변"
    ],
    "highlightTagsEn": [
      "#SeongsanPeak",
      "#BijarimForest",
      "#JejuBlackPork",
      "#EmeraldBeach"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 3100000,
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
          "foodId": "jeju_hallabong_dessert",
          "quantity": 1,
          "cityCode": "JEJU"
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_course_trend_myeongdong"
          ],
          "individualSpotIds": [
            "seoul_seongsu_popup",
            "seoul_ddp_myeongdong"
          ]
        },
        "JEJU": {
          "selectedCourseIds": [
            "jeju_course_east_unesco"
          ],
          "individualSpotIds": [
            "jeju_seongsan_ilchulbong",
            "jeju_bijarim_forest",
            "jeju_beaches_seopji"
          ]
        }
      },
      "emergencyFundKrw": 50000,
      "intercityTransportOverrides": {
        "SEOUL-JEJU": "FLIGHT"
      }
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
    "taglineKo": "광장시장 육회·빈대떡부터 전주비빔밥, 부산 자갈치 해산물까지",
    "taglineEn": "From Gwangjang market street bites to authentic Jeonju bibimbap and Busan Jagalchi seafood",
    "summaryKo": "서울의 100년 전통시장 먹거리부터 전주 미식 명가, 부산 바닷가 신선한 해산물 야식까지 한국 맛의 정수 섭렵",
    "summaryEn": "A culinary journey covering 100-year traditional market delicacies, UNESCO gourmet city Jeonju, and fresh ocean feasts in Busan",
    "imageUrl": "https://conlab.visitkorea.or.kr/api/depot/public/depot-flow/query/download-image/ee3b8a7f-8453-45e2-9968-ac214c6bb688/it11",
    "accentColor": "#d97706",
    "lightBg": "from-orange-50/70 via-white to-amber-50/40",
    "badgeBg": "bg-orange-100/80 border-orange-200/90",
    "badgeText": "text-orange-800",
    "routeTextKo": "서울 2박 + 전주 1박 + 부산 2박 (5박 6일)",
    "routeTextEn": "Seoul 2N + Jeonju 1N + Busan 2N (5N 6D)",
    "estimatedBudgetKrw": 1380000,
    "highlightTagsKo": [
      "#광장시장먹방",
      "#전주비빔밥",
      "#자갈치해산물",
      "#치맥나이트"
    ],
    "highlightTagsEn": [
      "#GwangjangFood",
      "#JeonjuBibimbap",
      "#JagalchiSeafood",
      "#ChimaekNight"
    ],
    "draft": {
      "totalNights": 5,
      "adultCount": 2,
      "budgetTier": "STANDARD",
      "targetBudgetKrw": 2760000,
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
          "foodId": "gwangjang_yukhoe_bindaetteok",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "nat_chimaek",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "myeongdong_kfood_snack",
          "quantity": 1,
          "cityCode": "SEOUL"
        },
        {
          "foodId": "nat_bibimbap",
          "quantity": 1,
          "cityCode": "JEONJU"
        },
        {
          "foodId": "jeonju_gamaek_culture",
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
        }
      ],
      "attractionSelections": {
        "SEOUL": {
          "selectedCourseIds": [
            "seoul_course_foodie"
          ],
          "individualSpotIds": [
            "seoul_gwangjang_market",
            "seoul_palace_hanok"
          ]
        },
        "JEONJU": {
          "selectedCourseIds": [
            "jeonju_course_foodie"
          ],
          "individualSpotIds": [
            "jeonju_hanok_night_food"
          ]
        },
        "BUSAN": {
          "selectedCourseIds": [
            "busan_course_foodie"
          ],
          "individualSpotIds": [
            "busan_jagalchi_biff",
            "busan_gwangalli_night"
          ]
        }
      },
      "emergencyFundKrw": 50000
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
