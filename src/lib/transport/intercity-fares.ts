import { SupportedCity } from "../trip-domain";

export type IntercityTransportMode = "KTX" | "SRT" | "EXPRESS_BUS" | "FLIGHT" | "FERRY";

export interface IntercityFareInfo {
  mode: IntercityTransportMode;
  nameKo: string;
  nameEn: string;
  oneWayPriceKrw: number;
  durationTextKo: string;
  durationTextEn: string;
  isDefault?: boolean;
  badgeTextKo?: string;
  badgeTextEn?: string;
}

export interface RouteFareMapping {
  from: SupportedCity;
  to: SupportedCity;
  options: IntercityFareInfo[];
}

/**
 * 한국 주요 도시 간 이동 수단별 대표 1인 편도 요금 및 소요시간 상수 테이블
 * (기준: 2026년 공공 고시 요금 기준 정제 데이터)
 */
export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo[]> = {
  // 서울 - 부산
  "SEOUL-BUSAN": [
    { mode: "KTX", nameKo: "KTX (고속철도)", nameEn: "KTX Express Train", oneWayPriceKrw: 59800, durationTextKo: "2시간 40분", durationTextEn: "2h 40m", isDefault: true, badgeTextKo: "최단시간", badgeTextEn: "Fastest" },
    { mode: "SRT", nameKo: "SRT (수서발 고속철)", nameEn: "SRT Express Train", oneWayPriceKrw: 52000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m" },
    { mode: "EXPRESS_BUS", nameKo: "우등 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 36000, durationTextKo: "4시간 15분", durationTextEn: "4h 15m", badgeTextKo: "가성비", badgeTextEn: "Budget" },
    { mode: "FLIGHT", nameKo: "국내선 항공", nameEn: "Domestic Flight", oneWayPriceKrw: 78000, durationTextKo: "1시간 05분", durationTextEn: "1h 05m" },
  ],
  // 서울 - 강릉
  "SEOUL-GANGNEUNG": [
    { mode: "KTX", nameKo: "KTX-이음 (강릉선)", nameEn: "KTX-Eum Train", oneWayPriceKrw: 27600, durationTextKo: "2시간 00분", durationTextEn: "2h 00m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "고속버스", nameEn: "Express Bus", oneWayPriceKrw: 21500, durationTextKo: "2시간 40분", durationTextEn: "2h 40m" },
  ],
  // 서울 - 전주
  "SEOUL-JEONJU": [
    { mode: "KTX", nameKo: "KTX (전라선)", nameEn: "KTX Express Train", oneWayPriceKrw: 34600, durationTextKo: "1시간 40분", durationTextEn: "1h 40m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "우등 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 20100, durationTextKo: "2시간 40분", durationTextEn: "2h 40m" },
  ],
  // 서울 - 경주
  "SEOUL-GYEONGJU": [
    { mode: "KTX", nameKo: "KTX (신경주역)", nameEn: "KTX (Singyeongju)", oneWayPriceKrw: 49300, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "고속버스", nameEn: "Express Bus", oneWayPriceKrw: 32600, durationTextKo: "3시간 30분", durationTextEn: "3h 30m" },
  ],
  // 서울 - 여수
  "SEOUL-YEOSU": [
    { mode: "KTX", nameKo: "KTX (여수엑스포)", nameEn: "KTX (Yeosu Expo)", oneWayPriceKrw: 47200, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "우등 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 33200, durationTextKo: "4시간 15분", durationTextEn: "4h 15m" },
  ],
  // 서울 - 수원
  "SEOUL-SUWON": [
    { mode: "KTX", nameKo: "KTX / 무궁화호", nameEn: "KTX / Train", oneWayPriceKrw: 8400, durationTextKo: "30분", durationTextEn: "30m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "광역 / 시외버스", nameEn: "Express Bus", oneWayPriceKrw: 3000, durationTextKo: "45분", durationTextEn: "45m", badgeTextKo: "대중교통", badgeTextEn: "Public" },
  ],
  // 서울 - 속초
  "SEOUL-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "프리미엄 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 23000, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", isDefault: true, badgeTextKo: "직통추천", badgeTextEn: "Direct" },
    { mode: "KTX", nameKo: "KTX (강릉 연계 버스)", nameEn: "KTX via Gangneung", oneWayPriceKrw: 29000, durationTextKo: "2시간 10분", durationTextEn: "2h 10m" },
  ],
  // 수원 - 강릉
  "SUWON-GANGNEUNG": [
    { mode: "EXPRESS_BUS", nameKo: "시외 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 24500, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", isDefault: true, badgeTextKo: "직통", badgeTextEn: "Direct" },
    { mode: "KTX", nameKo: "KTX-이음 (청량리 환승)", nameEn: "KTX via Transfer", oneWayPriceKrw: 30800, durationTextKo: "2시간 20분", durationTextEn: "2h 20m" },
  ],
  // 수원 - 속초
  "SUWON-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "시외 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 24500, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", isDefault: true, badgeTextKo: "직통", badgeTextEn: "Direct" },
  ],
  // 부산 - 속초
  "BUSAN-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "시외 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 42000, durationTextKo: "5시간 00분", durationTextEn: "5h 00m", isDefault: true },
  ],
  // 부산 - 수원
  "BUSAN-SUWON": [
    { mode: "KTX", nameKo: "KTX 고속철도", nameEn: "KTX Train", oneWayPriceKrw: 52000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true },
    { mode: "EXPRESS_BUS", nameKo: "고속버스", nameEn: "Express Bus", oneWayPriceKrw: 34000, durationTextKo: "4시간 00분", durationTextEn: "4h 00m" },
  ],
  // 인천(공항) - 서울 (대표 게이트웨이 공항철도)
  "INCHEON-SEOUL": [
    { mode: "KTX", nameKo: "AREX 직통열차 (논스톱)", nameEn: "AREX Express Train (Non-stop)", oneWayPriceKrw: 11000, durationTextKo: "43분", durationTextEn: "43m", isDefault: true, badgeTextKo: "논스톱 직행", badgeTextEn: "Non-stop" },
    { mode: "SRT", nameKo: "AREX 일반열차 (지하철)", nameEn: "AREX All-Stop Train", oneWayPriceKrw: 4450, durationTextKo: "59분", durationTextEn: "59m", badgeTextKo: "T-Money", badgeTextEn: "T-Money" },
    { mode: "EXPRESS_BUS", nameKo: "공항 리무진 버스", nameEn: "Airport Limousine Bus", oneWayPriceKrw: 17000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", badgeTextKo: "호텔직행", badgeTextEn: "Hotel Door" },
  ],
  // 인천(공항) - 전주 (지방 첫 목적지 직행)
  "INCHEON-JEONJU": [
    { mode: "EXPRESS_BUS", nameKo: "공항 직행 우등 리무진", nameEn: "Direct Airport Limousine Bus", oneWayPriceKrw: 33000, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", isDefault: true, badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
    { mode: "KTX", nameKo: "AREX + KTX (용산역 환승)", nameEn: "AREX + KTX via Yongsan", oneWayPriceKrw: 45600, durationTextKo: "2시간 40분", durationTextEn: "2h 40m", badgeTextKo: "빠른도착", badgeTextEn: "Fastest" },
  ],
  // 인천(공항) - 부산
  "INCHEON-BUSAN": [
    { mode: "KTX", nameKo: "AREX + KTX (서울역 환승)", nameEn: "AREX + KTX via Seoul", oneWayPriceKrw: 70800, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "공항 직행 우등 고속버스", nameEn: "Direct Airport Bus", oneWayPriceKrw: 48000, durationTextKo: "5시간 00분", durationTextEn: "5h 00m" },
    { mode: "FLIGHT", nameKo: "국내선 항공 (김포-김해)", nameEn: "Domestic Flight", oneWayPriceKrw: 85000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m" },
  ],
  // 인천(공항) - 강릉
  "INCHEON-GANGNEUNG": [
    { mode: "KTX", nameKo: "AREX + KTX-이음 (서울역 환승)", nameEn: "AREX + KTX via Seoul", oneWayPriceKrw: 38600, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", isDefault: true, badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
    { mode: "EXPRESS_BUS", nameKo: "공항 직행 시외버스", nameEn: "Direct Airport Bus", oneWayPriceKrw: 30000, durationTextKo: "3시간 30분", durationTextEn: "3h 30m", badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
  ],
  // 인천(공항) - 경주
  "INCHEON-GYEONGJU": [
    { mode: "KTX", nameKo: "AREX + KTX (서울역 환승)", nameEn: "AREX + KTX via Seoul", oneWayPriceKrw: 60300, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "공항 직행 고속버스", nameEn: "Direct Airport Bus", oneWayPriceKrw: 44000, durationTextKo: "4시간 30분", durationTextEn: "4h 30m" },
  ],
  // 인천(공항) - 여수
  "INCHEON-YEOSU": [
    { mode: "KTX", nameKo: "AREX + KTX (용산역 환승)", nameEn: "AREX + KTX via Yongsan", oneWayPriceKrw: 58200, durationTextKo: "3시간 50분", durationTextEn: "3h 50m", isDefault: true, badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
    { mode: "EXPRESS_BUS", nameKo: "공항 직행 고속버스", nameEn: "Direct Airport Bus", oneWayPriceKrw: 42000, durationTextKo: "4시간 40분", durationTextEn: "4h 40m" },
  ],
  // 인천(공항) - 수원
  "INCHEON-SUWON": [
    { mode: "EXPRESS_BUS", nameKo: "공항 리무진 (4100번)", nameEn: "Airport Limousine Bus", oneWayPriceKrw: 13500, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "직통", badgeTextEn: "Direct" },
    { mode: "KTX", nameKo: "AREX + 지하철/KTX", nameEn: "AREX + Train", oneWayPriceKrw: 12850, durationTextKo: "1시간 20분", durationTextEn: "1h 20m" },
  ],
  // 인천(공항) - 속초
  "INCHEON-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "공항 직행 시외버스", nameEn: "Direct Airport Bus", oneWayPriceKrw: 32000, durationTextKo: "3시간 10분", durationTextEn: "3h 10m", isDefault: true, badgeTextKo: "직통", badgeTextEn: "Direct" },
  ],
  // 전주 - 부산 (영호남 횡단)
  "JEONJU-BUSAN": [
    { mode: "EXPRESS_BUS", nameKo: "시외 우등 고속버스", nameEn: "Intercity Express Bus", oneWayPriceKrw: 26000, durationTextKo: "3시간 10분", durationTextEn: "3h 10m", isDefault: true, badgeTextKo: "직통추천", badgeTextEn: "Direct" },
    { mode: "KTX", nameKo: "KTX (오송역 환승)", nameEn: "KTX via Osong", oneWayPriceKrw: 58000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m" },
  ],
  // 제주 포함 주요 노선
  "SEOUL-JEJU": [
    { mode: "FLIGHT", nameKo: "국내선 항공 (김포-제주)", nameEn: "Domestic Flight", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "항공필수", badgeTextEn: "Flight Required" },
  ],
  "BUSAN-JEJU": [
    { mode: "FLIGHT", nameKo: "국내선 항공 (김해-제주)", nameEn: "Domestic Flight", oneWayPriceKrw: 65000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true, badgeTextKo: "항공추천", badgeTextEn: "Flight" },
    { mode: "FERRY", nameKo: "제주 카페리 선박", nameEn: "Jeju Car Ferry", oneWayPriceKrw: 48000, durationTextKo: "11시간 00분", durationTextEn: "11h 00m", badgeTextKo: "배편", badgeTextEn: "Ferry" },
  ],
  "YEOSU-JEJU": [
    { mode: "FLIGHT", nameKo: "국내선 항공 (여수-제주)", nameEn: "Domestic Flight", oneWayPriceKrw: 68000, durationTextKo: "50분", durationTextEn: "50m", isDefault: true, badgeTextKo: "항공추천", badgeTextEn: "Flight" },
    { mode: "FERRY", nameKo: "여수-제주 초고속 쾌속선", nameEn: "Express Ferry", oneWayPriceKrw: 42000, durationTextKo: "2시간 40분", durationTextEn: "2h 40m", badgeTextKo: "해상 쾌속선", badgeTextEn: "Sea Ferry" },
  ],
};

/**
 * 두 도시 간의 요금 옵션 목록을 반환합니다. (양방향 대칭 및 제주 폴백 지원)
 */
export function getIntercityFareOptions(from: SupportedCity | "INCHEON", to: SupportedCity | "INCHEON"): IntercityFareInfo[] {
  if (from === "JEJU" || to === "JEJU") {
    const directKey = `${from}-${to}`;
    if (INTERCITY_FARE_TABLE[directKey]) return INTERCITY_FARE_TABLE[directKey];
    const reverseKey = `${to}-${from}`;
    if (INTERCITY_FARE_TABLE[reverseKey]) return INTERCITY_FARE_TABLE[reverseKey];
    return [
      { mode: "FLIGHT", nameKo: "국내선 항공", nameEn: "Domestic Flight", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "항공필수", badgeTextEn: "Flight Required" },
      { mode: "FERRY", nameKo: "연안 여객선/선박", nameEn: "Passenger Ferry", oneWayPriceKrw: 45000, durationTextKo: "4시간 00분", durationTextEn: "4h 00m", badgeTextKo: "선박", badgeTextEn: "Ferry" },
    ];
  }

  const directKey = `${from}-${to}`;
  if (INTERCITY_FARE_TABLE[directKey]) {
    return INTERCITY_FARE_TABLE[directKey];
  }

  const reverseKey = `${to}-${from}`;
  if (INTERCITY_FARE_TABLE[reverseKey]) {
    return INTERCITY_FARE_TABLE[reverseKey];
  }

  // 기본 폴백 (기타 육지 도시 구간)
  return [
    { mode: "KTX", nameKo: "KTX / K-철도", nameEn: "Express Train", oneWayPriceKrw: 35000, durationTextKo: "2시간 00분", durationTextEn: "2h 00m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "고속 / 시외버스", nameEn: "Express Bus", oneWayPriceKrw: 22000, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", badgeTextKo: "버스", badgeTextEn: "Bus" },
  ];
}

export const AIRPORT_INFO_MAP: Record<string, { nameKo: string; nameEn: string; code: string }> = {
  INCHEON: { nameKo: "인천국제공항", nameEn: "Incheon Int'l Airport", code: "ICN" },
  GIMPO: { nameKo: "김포국제공항", nameEn: "Gimpo Int'l Airport", code: "GMP" },
  GIMHAE: { nameKo: "김해국제공항 (부산)", nameEn: "Gimhae Int'l Airport (Busan)", code: "PUS" },
  JEJU_AIRPORT: { nameKo: "제주국제공항", nameEn: "Jeju Int'l Airport", code: "CJU" },
};

/**
 * 인천국제공항(ICN) 및 주요 공항에서 목적지 도시로의 공항 이동 옵션을 반환합니다.
 */
export function getAirportTransitOptions(
  airportCode: "INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT" = "INCHEON",
  targetCity: SupportedCity
): IntercityFareInfo[] {
  if (airportCode === "INCHEON") {
    return getIntercityFareOptions("INCHEON", targetCity);
  }

  if (airportCode === "GIMPO") {
    if (targetCity === "SEOUL") {
      return [
        { mode: "SRT", nameKo: "지하철 5·9호선 / 공항철도", nameEn: "Subway Lines 5/9/AREX", oneWayPriceKrw: 1600, durationTextKo: "25분", durationTextEn: "25m", isDefault: true, badgeTextKo: "지하철직행", badgeTextEn: "Subway" },
        { mode: "EXPRESS_BUS", nameKo: "도심 리무진 버스 (6000번대)", nameEn: "City Limousine Bus", oneWayPriceKrw: 9000, durationTextKo: "40분", durationTextEn: "40m" },
      ];
    }
    if (targetCity === "JEJU") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공 (김포 ➔ 제주)", nameEn: "Domestic Flight to Jeju", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "항공직항", badgeTextEn: "Direct" },
      ];
    }
    if (targetCity === "BUSAN") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공 (김포 ➔ 김해)", nameEn: "Domestic Flight to Busan", oneWayPriceKrw: 78000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true, badgeTextKo: "빠른항공", badgeTextEn: "Flight" },
        { mode: "KTX", nameKo: "공항철도 ➔ 서울역 KTX", nameEn: "AREX + Seoul KTX", oneWayPriceKrw: 61400, durationTextKo: "3시간 10분", durationTextEn: "3h 10m" },
      ];
    }
    if (targetCity === "JEONJU") {
      return [
        { mode: "KTX", nameKo: "공항철도 ➔ 용산역 KTX", nameEn: "AREX + Yongsan KTX", oneWayPriceKrw: 36200, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
        { mode: "EXPRESS_BUS", nameKo: "시외 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 21700, durationTextKo: "3시간 00분", durationTextEn: "3h 00m" },
      ];
    }
    // 기타 도시는 서울역/용산역 KTX 연계
    return [
      { mode: "KTX", nameKo: "공항철도 ➔ 서울역/용산역 KTX", nameEn: "AREX + KTX via Seoul", oneWayPriceKrw: 42000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true, badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
      { mode: "EXPRESS_BUS", nameKo: "고속 / 시외버스", nameEn: "Express Bus", oneWayPriceKrw: 25000, durationTextKo: "3시간 30분", durationTextEn: "3h 30m" },
    ];
  }

  if (airportCode === "GIMHAE") {
    if (targetCity === "BUSAN") {
      return [
        { mode: "SRT", nameKo: "김해 경전철 + 부산 지하철", nameEn: "Light Rail + Busan Metro", oneWayPriceKrw: 2100, durationTextKo: "45분", durationTextEn: "45m", isDefault: true, badgeTextKo: "가성비", badgeTextEn: "Budget" },
        { mode: "EXPRESS_BUS", nameKo: "공항 리무진 버스 (해운대/서면)", nameEn: "Airport Limousine Bus", oneWayPriceKrw: 8500, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", badgeTextKo: "직통", badgeTextEn: "Direct" },
      ];
    }
    if (targetCity === "GYEONGJU") {
      return [
        { mode: "EXPRESS_BUS", nameKo: "공항 직행 리무진 버스 (경주행)", nameEn: "Direct Bus to Gyeongju", oneWayPriceKrw: 11000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "직통추천", badgeTextEn: "Direct" },
        { mode: "KTX", nameKo: "부산역 이동 ➔ 신경주 KTX", nameEn: "Busan Metro + KTX", oneWayPriceKrw: 15100, durationTextKo: "1시간 20분", durationTextEn: "1h 20m" },
      ];
    }
    if (targetCity === "SEOUL") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공 (김해 ➔ 김포)", nameEn: "Domestic Flight to Gimpo", oneWayPriceKrw: 78000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true, badgeTextKo: "빠른항공", badgeTextEn: "Flight" },
        { mode: "KTX", nameKo: "부산역 이동 ➔ 서울 KTX", nameEn: "Busan Metro + Seoul KTX", oneWayPriceKrw: 61900, durationTextKo: "3시간 15분", durationTextEn: "3h 15m" },
      ];
    }
    if (targetCity === "JEONJU") {
      return [
        { mode: "EXPRESS_BUS", nameKo: "사상터미널 환승 ➔ 전주고속", nameEn: "Intercity Bus via Sasang", oneWayPriceKrw: 28100, durationTextKo: "3시간 30분", durationTextEn: "3h 30m", isDefault: true, badgeTextKo: "직통버스", badgeTextEn: "Bus" },
      ];
    }
    if (targetCity === "JEJU") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공 (김해 ➔ 제주)", nameEn: "Domestic Flight to Jeju", oneWayPriceKrw: 65000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true, badgeTextKo: "항공추천", badgeTextEn: "Flight" },
      ];
    }
    return [
      { mode: "EXPRESS_BUS", nameKo: "시외 우등 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 24000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true },
    ];
  }

  if (airportCode === "JEJU_AIRPORT") {
    if (targetCity === "JEJU") {
      return [
        { mode: "SRT", nameKo: "제주 급행 / 간선 시내버스", nameEn: "Jeju Express/City Bus", oneWayPriceKrw: 1500, durationTextKo: "25분", durationTextEn: "25m", isDefault: true, badgeTextKo: "대중교통", badgeTextEn: "Public" },
        { mode: "EXPRESS_BUS", nameKo: "공항 리무진 버스 (600번/800번)", nameEn: "Jeju Limousine (600/800)", oneWayPriceKrw: 5500, durationTextKo: "50분", durationTextEn: "50m", badgeTextKo: "중문/서귀포", badgeTextEn: "Direct" },
      ];
    }
    if (targetCity === "SEOUL") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공 (제주 ➔ 김포)", nameEn: "Domestic Flight to Gimpo", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "항공필수", badgeTextEn: "Flight" },
      ];
    }
    if (targetCity === "BUSAN") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공 (제주 ➔ 김해)", nameEn: "Domestic Flight to Gimhae", oneWayPriceKrw: 65000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true, badgeTextKo: "항공추천", badgeTextEn: "Flight" },
      ];
    }
    return [
      { mode: "FLIGHT", nameKo: "국내선 항공 연계", nameEn: "Domestic Flight Connection", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true },
    ];
  }

  return getIntercityFareOptions("INCHEON", targetCity);
}

