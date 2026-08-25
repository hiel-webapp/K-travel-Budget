export type TransitCategory = "AIRPORT_TRAIN" | "AIRPORT_BUS" | "SUBWAY" | "CITY_BUS" | "INTERCITY_TRAIN" | "PASS" | "TAXI";
export type TransitBillingType = "PER_TRIP" | "PER_DAY" | "PASS";

export interface TransitItem {
  id: string;
  code: string;
  category: TransitCategory;
  billingType: TransitBillingType;
  city: string; // 'SEOUL' | 'BUSAN' | 'JEJU' | 'ALL'
  priceKrw: number;
  durationMins?: number;
  officialUrl?: string;
  translations: {
    ko: {
      name: string;
      routeInfo: string;
      description: string;
      tips: string[];
    };
    en: {
      name: string;
      routeInfo: string;
      description: string;
      tips: string[];
    };
  };
  tags: string[];
  featured?: boolean;
}

export const TRANSIT_SEEDS: TransitItem[] = [
  // ==========================================
  // AIRPORT RAILROAD (AREX)
  // ==========================================
  {
    id: "transit-arex-express",
    code: "AREX_EXPRESS",
    category: "AIRPORT_TRAIN",
    billingType: "PER_TRIP",
    city: "SEOUL",
    priceKrw: 11000,
    durationMins: 43,
    officialUrl: "https://www.airportrailroad.com/train/express/introduce",
    translations: {
      ko: {
        name: "AREX 공항철도 직통열차 (Express Train)",
        routeInfo: "인천공항 T1/T2 ↔ 서울역 (논스톱 무정차)",
        description: "인천공항에서 서울역까지 단 43분 만에 주파하는 프리미엄 직통열차. 지정좌석제, 무료 Wi-Fi, 전용 수하물 칸 완비.",
        tips: [
          "T-money 일반 태그 탑승 불가 (전용 QR 승차권 또는 발권기 이용 필요)",
          "서울역 도심공항터미널에서 당일 출국 항공권 무료 사전 체크인 및 수하물 위탁 가능",
          "어린이 요금: ₩8,000 / 사전 온라인 예매 시 제휴 할인 가능",
        ],
      },
      en: {
        name: "AREX Airport Railroad Express Train (Non-Stop)",
        routeInfo: "Incheon Airport T1/T2 ↔ Seoul Station (Non-Stop)",
        description: "Premium express train connecting Incheon Airport to Seoul Station in just 43 minutes. Features reserved seating, free Wi-Fi, and luggage racks.",
        tips: [
          "Cannot tap standard T-Money at gates (Requires a separate dedicated QR or paper ticket)",
          "Free early check-in and baggage drop at Seoul Station City Airport Terminal for departing travelers",
          "Child fare: ₩8,000 / Discounted tickets available via official online booking",
        ],
      },
    },
    tags: ["공항철도", "직통열차", "서울역", "논스톱", "도심공항"],
    featured: true,
  },
  {
    id: "transit-arex-all-stop",
    code: "AREX_ALL_STOP",
    category: "AIRPORT_TRAIN",
    billingType: "PER_TRIP",
    city: "SEOUL",
    priceKrw: 4450,
    durationMins: 59,
    officialUrl: "https://www.airportrailroad.com/train/normal/fare",
    translations: {
      ko: {
        name: "AREX 공항철도 일반열차 (All-Stop Train)",
        routeInfo: "인천공항 T2/T1 ↔ 서울역 (14개 역 전체 정차)",
        description: "김포공항, 홍대입구, 공덕 등 주요 환승역에 정차하는 통근형 지하철. T-money, WOWPASS로 즉시 탑승 가능.",
        tips: [
          "T-money, WOWPASS, 신용카드(후불교통)로 개찰구 바로 태그 탑승",
          "홍대입구, 합정, 공덕 등 마포구 숙소로 갈 때는 직통열차보다 환승 없이 더 빠름",
          "수도권 지하철 및 시내버스와 환승 할인 혜택 적용",
        ],
      },
      en: {
        name: "AREX Airport Railroad All-Stop Train (Commuter)",
        routeInfo: "Incheon Airport T2/T1 ↔ Seoul Station (14 Stations)",
        description: "Standard commuter subway stopping at all 14 stations including Gimpo Airport, Hongik Univ. (Hongdae), and Gongdeok.",
        tips: [
          "Tap directly at turnstiles using T-Money, WOWPASS, or contactless transit cards",
          "Best choice if your accommodation is in Hongdae or Mapo (no transfer required)",
          "Eligible for Seoul metropolitan subway/bus transfer discounts",
        ],
      },
    },
    tags: ["공항철도", "일반열차", "홍대입구", "티머니", "환승할인"],
    featured: true,
  },

  // ==========================================
  // AIRPORT LIMOUSINE BUS
  // ==========================================
  {
    id: "transit-airport-limousine-6001",
    code: "AIRPORT_BUS_6001",
    category: "AIRPORT_BUS",
    billingType: "PER_TRIP",
    city: "SEOUL",
    priceKrw: 17000,
    durationMins: 70,
    officialUrl: "https://airportlimousine.co.kr",
    translations: {
      ko: {
        name: "공항 리무진 버스 (6001/6002/6015 등)",
        routeInfo: "인천공항 ↔ 명동 / 동대문 / 종로 도심 주요 호텔",
        description: "무거운 캐리어를 들고 계단을 오르내릴 필요 없이 호텔 정문 근처 정류장까지 바로 이동할 수 있는 우등 리무진.",
        tips: [
          "T-money 또는 현장 무인 발권기/신용카드로 탑승 가능",
          "출퇴근 러시아워(07:30~09:30, 17:30~19:30)에는 교통 체증으로 소요 시간이 늘어날 수 있음",
        ],
      },
      en: {
        name: "Airport Limousine Bus (Routes 6001, 6002, 6015)",
        routeInfo: "Incheon Airport ↔ Myeongdong, Dongdaemun, Downtown Hotels",
        description: "Comfortable limousine bus dropping you off right in front of major downtown hotels without subway stairs.",
        tips: [
          "Pay with T-Money or purchase tickets at airport ticket kiosks with credit cards",
          "May take longer during rush hours (07:30-09:30, 17:30-19:30) due to road traffic",
        ],
      },
    },
    tags: ["공항버스", "리무진", "명동", "동대문", "도어투도어"],
    featured: false,
  },

  // ==========================================
  // SEOUL CITY TRANSIT PASSES
  // ==========================================
  {
    id: "transit-climate-card-3d",
    code: "CLIMATE_CARD_3D",
    category: "PASS",
    billingType: "PASS",
    city: "SEOUL",
    priceKrw: 10000,
    officialUrl: "https://news.seoul.go.kr/traffic/archives/510613",
    translations: {
      ko: {
        name: "기후동행카드 외국인 단기권 (3일권)",
        routeInfo: "서울 시내 지하철 1~9호선 + 서울 시내/마을버스 무제한",
        description: "서울 시내 대중교통을 정해진 기간 동안 무제한 탑승할 수 있는 외국인 및 관광객 전용 정액 교통 패스.",
        tips: [
          "지하철 역사 고객안전실 또는 편의점에서 실물카드(₩3,000) 구매 후 역사 무인충전기에서 현금 충전",
          "신분당선 및 서울 시계 외 구간(공항철도 인천 구간 등)은 이용 불가",
        ],
      },
      en: {
        name: "Climate Card Tourist Short-term Pass (3-Day)",
        routeInfo: "Unlimited Seoul Subways (Lines 1-9) + Seoul City Buses",
        description: "Unlimited transit pass for Seoul metropolitan subway lines and city buses for a fixed duration.",
        tips: [
          "Buy physical card (₩3,000) at subway stations or convenience stores, then top up with cash at station kiosks",
          "Excludes Shinbundang Line and areas outside Seoul city boundaries",
        ],
      },
    },
    tags: ["기후동행카드", "무제한패스", "서울지하철", "3일권", "가성비"],
    featured: true,
  },

  // ==========================================
  // REGIONAL ENTRY TRANSIT (INCHEON TO REGIONS)
  // ==========================================
  {
    id: "transit-icn-to-jeonju-limousine",
    code: "AIRPORT_BUS_ICN_JEONJU",
    category: "AIRPORT_BUS",
    billingType: "PER_TRIP",
    city: "JEONJU",
    priceKrw: 33000,
    durationMins: 200,
    officialUrl: "https://txbus.t-money.co.kr",
    translations: {
      ko: {
        name: "인천공항 ↔ 전주 직행 리무진 버스",
        routeInfo: "인천공항 T1/T2 ↔ 전주 시외버스 터미널 (직행, 약 3시간 20분)",
        description: "인천공항에서 환승 없이 전주까지 가장 편안하게 직행하는 우등 리무진 버스. 무거운 짐이 있는 입국 첫날 최적의 선택.",
        tips: [
          "입국장 버스 매표소 또는 티머니GO(TmoneyGO) / 버스타고 앱에서 사전 예매 가능",
          "공항 1층 9번~10번 게이트 앞 지방행 버스 승차장에서 탑승",
          "심야 우등 요금: 약 ₩39,600 (22시 이후 출발)",
        ],
      },
      en: {
        name: "Incheon Airport ↔ Jeonju Direct Limousine Bus",
        routeInfo: "Incheon Airport T1/T2 ↔ Jeonju Bus Terminal (Non-Stop, ~3 hrs 20 mins)",
        description: "Direct premium limousine bus connecting Incheon Airport directly to Jeonju without train transfers. The most convenient route with heavy luggage.",
        tips: [
          "Purchase tickets at the 1F Arrival Hall bus counters or via the TmoneyGO app",
          "Departs from Regional Bus Platforms (near Gates 9-10 at T1)",
          "Late-night premium fare: ~₩39,600 (Departures after 22:00)",
        ],
      },
    },
    tags: ["전주직행", "공항리무진", "환승없음", "전주여행", "추천경로"],
    featured: true,
  },
  {
    id: "transit-ktx-yongsan-jeonju",
    code: "KTX_YONGSAN_JEONJU",
    category: "INTERCITY_TRAIN",
    billingType: "PER_TRIP",
    city: "JEONJU",
    priceKrw: 34600,
    durationMins: 95,
    officialUrl: "https://www.letskorail.com",
    translations: {
      ko: {
        name: "KTX 전라선 (용산역/서울역 ↔ 전주역)",
        routeInfo: "용산역/서울역 ↔ 전주역 (일반실 기준, 약 1시간 35분)",
        description: "서울 도심에서 전주 한옥마을의 관문 전주역까지 가장 빠르고 정시성을 보장하는 고속열차.",
        tips: [
          "인천공항에서 AREX 일반열차 탑승 후 공덕역/용산역에서 환승하면 편리",
          "전라선 KTX는 주로 용산역에서 출발하므로 출발역 확인 필수",
        ],
      },
      en: {
        name: "KTX Jeolla Line (Yongsan/Seoul Station ↔ Jeonju Station)",
        routeInfo: "Yongsan/Seoul Station ↔ Jeonju Station (Standard Class, ~1 hr 35 mins)",
        description: "The fastest high-speed train connecting downtown Seoul to Jeonju Station, the gateway to Jeonju Hanok Village.",
        tips: [
          "Take the AREX commuter train from Incheon Airport and transfer easily at Gongdeok or Yongsan",
          "Most Jeolla Line KTX trains depart from Yongsan Station rather than Seoul Station",
        ],
      },
    },
    tags: ["KTX", "전주역", "용산역", "고속열차", "한옥마을"],
    featured: true,
  },
  {
    id: "transit-icn-to-gwangmyeong-6770",
    code: "AIRPORT_BUS_ICN_GWANGMYEONG",
    category: "AIRPORT_BUS",
    billingType: "PER_TRIP",
    city: "ALL",
    priceKrw: 16000,
    durationMins: 50,
    officialUrl: "https://www.letskorail.com",
    translations: {
      ko: {
        name: "인천공항 ↔ KTX 광명역 KTX 공항셔틀버스 (6770번)",
        routeInfo: "인천공항 T1/T2 ↔ KTX 광명역 (직행 고속 셔틀, 약 50분)",
        description: "서울 도심을 거치지 않고 인천공항에서 바로 남행(부산/전주/경주/광주) KTX를 탈 수 있는 KORAIL 공식 고속 셔틀.",
        tips: [
          "KTX 승차권과 6770번 버스를 함께 예매 시 KTX 마일리지 적립 혜택",
          "광명역 도착 후 3분 만에 KTX 승강장으로 직결 환승 가능",
        ],
      },
      en: {
        name: "Incheon Airport ↔ KTX Gwangmyeong Station Shuttle Bus (No. 6770)",
        routeInfo: "Incheon Airport T1/T2 ↔ KTX Gwangmyeong Station (Express Shuttle, ~50 mins)",
        description: "Direct airport shuttle enabling travelers to bypass downtown Seoul and catch southbound KTX trains (Busan, Jeonju, Gyeongju) immediately.",
        tips: [
          "Seamless 3-minute direct transfer from the bus bay to KTX platforms at Gwangmyeong Station",
          "Can be booked together with KTX rail tickets on Korail website",
        ],
      },
    },
    tags: ["광명역", "KTX셔틀", "6770번", "지방직행", "빠른환승"],
    featured: false,
  },
  {
    id: "transit-bus-jeonju-busan",
    code: "INTERCITY_JEONJU_BUSAN",
    category: "CITY_BUS",
    billingType: "PER_TRIP",
    city: "ALL",
    priceKrw: 26000,
    durationMins: 190,
    officialUrl: "https://www.kobus.co.kr",
    translations: {
      ko: {
        name: "전주 ↔ 부산 시외고속버스 (우등)",
        routeInfo: "전주 고속버스터미널 ↔ 부산 노포/사상 터미널 (약 3시간 10분)",
        description: "전주에서 부산으로 이동할 때 환승 없이 한 번에 이동할 수 있는 편안한 우등 고속버스.",
        tips: [
          "코버스(KOBUS) 또는 티머니GO 앱에서 사전 좌석 지정 예매 권장",
          "중간 인삼랜드 휴게소에서 15분간 정차 휴식 제공",
        ],
      },
      en: {
        name: "Jeonju ↔ Busan Intercity Express Bus (Premium)",
        routeInfo: "Jeonju Bus Terminal ↔ Busan Terminal (Direct, ~3 hrs 10 mins)",
        description: "Comfortable intercity premium express bus connecting Jeonju directly to Busan without rail transfers.",
        tips: [
          "Book advance seats via the KOBUS or TmoneyGO mobile portal",
          "Includes a 15-minute scenic rest stop midway",
        ],
      },
    },
    tags: ["전주부산", "고속버스", "도시간이동", "우등버스"],
    featured: false,
  },
];
