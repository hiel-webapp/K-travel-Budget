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
  // KTX INTERCITY
  // ==========================================
  {
    id: "transit-ktx-seoul-busan",
    code: "KTX_SEOUL_BUSAN",
    category: "INTERCITY_TRAIN",
    billingType: "PER_TRIP",
    city: "ALL",
    priceKrw: 59800,
    durationMins: 135,
    officialUrl: "https://www.letskorail.com",
    translations: {
      ko: {
        name: "KTX 고속철도 (서울역 ↔ 부산역)",
        routeInfo: "서울역 ↔ 부산역 (일반실 기준, 약 2시간 15분)",
        description: "한국의 수도 서울과 제2의 도시 부산을 최고 시속 305km로 가장 빠르고 안전하게 연결하는 고속열차.",
        tips: [
          "코레일 톡(Korail Talk) 앱 또는 레츠코레일 공식 웹사이트에서 1개월 전부터 예매 가능",
          "주말 및 공휴일 티켓은 조기 매진되므로 사전 예매 필수",
        ],
      },
      en: {
        name: "KTX High-Speed Rail (Seoul Station ↔ Busan Station)",
        routeInfo: "Seoul Station ↔ Busan Station (Standard Class, ~2 hrs 15 mins)",
        description: "Bullet train running at speeds up to 305 km/h, connecting Korea's capital Seoul and Busan comfortably and swiftly.",
        tips: [
          "Bookable up to 1 month in advance via official Korail website (letskorail.com) or Korail Talk app",
          "Weekend and holiday seats sell out rapidly; advance booking strongly recommended",
        ],
      },
    },
    tags: ["KTX", "고속철도", "서울부산", "코레일", "필수이동"],
    featured: true,
  },
];
