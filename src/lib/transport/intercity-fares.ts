import { SupportedCity } from "../trip-domain";

export type IntercityTransportMode = "KTX" | "SRT" | "EXPRESS_BUS" | "INTERCITY_BUS" | "FLIGHT" | "TRANSFER";

export interface TransitLegInfo {
  legOrder: number;
  fromHubNameKo: string;
  fromHubNameEn: string;
  toHubNameKo: string;
  toHubNameEn: string;
  mode: IntercityTransportMode;
  modeIcon: string;
  transitNameKo: string;
  transitNameEn: string;
  fareKrw: number;
  durationTextKo: string;
  durationTextEn: string;
  bookingPlatform: "KORAIL" | "KOBUS" | "BUSTAGO" | "AIRLINE" | "TMONEY";
  bookingUrl: string;
}

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
  optionType?: "DIRECT" | "FASTEST" | "BUDGET" | "COMFORT";
  legs?: TransitLegInfo[];
  summaryRouteKo?: string;
  summaryRouteEn?: string;
  priceRange?: { min: number; max: number };
  subLabelKo?: string;
  subLabelEn?: string;
  tierDescriptionsKo?: string[];
  tierDescriptionsEn?: string[];
}

export interface RouteFareTier {
  label: string;
  subLabel: string;
  priceRange: { min: number; max: number };
  averagePrice: number;
  description: string[];
}

export interface RouteFareInfo {
  routeCode: string;
  routeName: string;
  duration: string;
  tiers: {
    discount: RouteFareTier;
    standard: RouteFareTier;
  };
}

export const GMP_CJU_FLIGHT_DATA: RouteFareInfo = {
  routeCode: "GMP-CJU",
  routeName: "김포(GMP) ↔ 제주(CJU)",
  duration: "1시간 10분",
  tiers: {
    discount: {
      label: "특가 / 할인석 (실속형)",
      subLabel: "평일 낮/오후 & 사전 예매",
      priceRange: { min: 32000, max: 68000 },
      averagePrice: 48000,
      description: [
        "조기 예매 및 평일·오후 시간대 중심 최저가 운임",
        "저비용 항공사(LCC) 위주 편성",
        "예약 변경/취소 수수료 규정이 상대적으로 엄격함",
      ],
    },
    standard: {
      label: "일반석 (표준/정규형)",
      subLabel: "오전 피크 & 주말/선호 시간대",
      priceRange: { min: 85000, max: 112000 },
      averagePrice: 95000,
      description: [
        "오전 골든타임 및 주말 선호 시간대 기본 배정 운임",
        "대형 항공사(FSC) 및 LCC 정규 운임 포함",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 높음",
      ],
    },
  },
};

export const PUS_CJU_FLIGHT_DATA: RouteFareInfo = {
  routeCode: "PUS-CJU",
  routeName: "김해(PUS) ↔ 제주(CJU)",
  duration: "1시간 00분",
  tiers: {
    discount: {
      label: "특가 / 할인석 (실속형)",
      subLabel: "오후/야간 & 사전 예매",
      priceRange: { min: 38000, max: 65000 },
      averagePrice: 45000,
      description: [
        "오후(13:00 이후) 및 야간 시간대 중심 실속 최저가 운임",
        "에어부산, 진에어, 제주항공, 이스타 등 LCC 위주 편성",
        "예약 변경/취소 수수료 규정이 상대적으로 엄격함",
      ],
    },
    standard: {
      label: "일반석 (표준/정규형)",
      subLabel: "오전 피크 & 주말/선호 시간대",
      priceRange: { min: 81000, max: 131000 },
      averagePrice: 92000,
      description: [
        "오전 출발(06:55~12:30) 및 주요 시간대 기본 정규 운임",
        "대한항공, 아시아나(에어부산 공동운항) 및 LCC 일반석 포함",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 높음",
      ],
    },
  },
};

export const RSU_CJU_FLIGHT_DATA: RouteFareInfo = {
  routeCode: "RSU-CJU",
  routeName: "여수(RSU) ↔ 제주(CJU)",
  duration: "55분",
  tiers: {
    discount: {
      label: "특가 / 할인석 (실속형)",
      subLabel: "낮/오후 잔여 & 사전 예매",
      priceRange: { min: 58000, max: 82000 },
      averagePrice: 65000,
      description: [
        "대한항공 특가석 및 아시아나항공 할인석 중심 실속 운임",
        "운항 편수가 적어(일 4편 내외) 조기 마감 가능성 높음",
        "취소 및 변경 규정 확인 필요",
      ],
    },
    standard: {
      label: "일반석 (표준/정규형)",
      subLabel: "선호 시간대 & 정규 운임",
      priceRange: { min: 73000, max: 119000 },
      averagePrice: 85000,
      description: [
        "진에어 일반석(7.3만~) 및 대한항공·아시아나 정규 일반석",
        "위탁 수하물 기본 포함 및 일정 변경 유연성 확보",
        "잔여 좌석 여유가 있는 표준 예약 기준",
      ],
    },
  },
};

export const KUV_CJU_FLIGHT_DATA: RouteFareInfo = {
  routeCode: "KUV-CJU",
  routeName: "군산(KUV) ↔ 제주(CJU)",
  duration: "1시간 00분",
  tiers: {
    discount: {
      label: "특가 / 할인석 (실속형)",
      subLabel: "오후/저녁 잔여 & 사전 예매",
      priceRange: { min: 58000, max: 72000 },
      averagePrice: 65000,
      description: [
        "진에어 할인석 및 대한항공 공동운항 할인 운임 (5.8만~7.2만)",
        "오후(15:55) 및 저녁(17:30) 편 중심 실속 예매",
        "운항 편수 제한(일 3편)으로 사전 예매 필수",
      ],
    },
    standard: {
      label: "일반석 (표준/정규형)",
      subLabel: "오전 피크 & 정규 일반석",
      priceRange: { min: 87000, max: 88000 },
      averagePrice: 87900,
      description: [
        "진에어 고정 정규 일반석 (87,900원 단일가 형성)",
        "오전 첫 비행기(11:10) 및 전 시간대 정규 운임",
        "위탁 수하물 기본 포함 및 취소/환불 규정 유연",
      ],
    },
  },
};

export const WJU_CJU_FLIGHT_DATA: RouteFareInfo = {
  routeCode: "WJU-CJU",
  routeName: "원주(WJU) ↔ 제주(CJU)",
  duration: "1시간 15분",
  tiers: {
    discount: {
      label: "특가 / 할인석 (실속형)",
      subLabel: "오후/저녁 잔여 & 사전 예매",
      priceRange: { min: 55000, max: 86000 },
      averagePrice: 65000,
      description: [
        "진에어 할인석(55,800원~) 및 대한항공 공동운항 할인 운임",
        "저녁(17:20) 편 중심 실속 예매",
        "일 2편 소수 운항으로 특가/할인석 조기 마감 주의",
      ],
    },
    standard: {
      label: "일반석 (표준/정규형)",
      subLabel: "오전 피크 & 정규 일반석",
      priceRange: { min: 100000, max: 101000 },
      averagePrice: 100500,
      description: [
        "진에어 정규 일반석 (100,500원 고정가 형성)",
        "오전 첫 비행기(11:15) 및 전 시간대 정규 운임",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 확보",
      ],
    },
  },
};

export const KWJ_CJU_FLIGHT_DATA: RouteFareInfo = {
  routeCode: "KWJ-CJU",
  routeName: "광주(KWJ) ↔ 제주(CJU)",
  duration: "55분 ~ 1시간",
  tiers: {
    discount: {
      label: "특가 / 할인석 (실속형)",
      subLabel: "오후/저녁 시간대 & 사전 예매",
      priceRange: { min: 28000, max: 77500 },
      averagePrice: 48000,
      description: [
        "진에어 최저가(2.8만~) 및 대형사/LCC 특가·할인석 (2.8만~7.7만)",
        "오후 13시~18시대 다수 편성으로 가성비 선택 폭 넓음",
        "특가석은 위탁 수하물 및 취소 규정 사전 확인 필요",
      ],
    },
    standard: {
      label: "일반석 (표준/정규형)",
      subLabel: "오전 피크 & 정규 일반석",
      priceRange: { min: 73300, max: 117300 },
      averagePrice: 85000,
      description: [
        "진에어·제주항공(7.3만~) 및 아시아나(8.7만)·대한항공(11.7만) 정규 일반석",
        "오전 첫 비행기(10:00) 및 전 시간대 정규 운임",
        "위탁 수하물 기본 포함 및 취소/환불 유연성 확보",
      ],
    },
  },
};

export const KPO_CJU_FLIGHT_DATA: RouteFareInfo = {
  routeCode: "KPO-CJU",
  routeName: "포항경주(KPO) ↔ 제주(CJU)",
  duration: "1시간 05분",
  tiers: {
    discount: {
      label: "특가 / 할인석 (실속형)",
      subLabel: "오후 잔여 & 사전 예매",
      priceRange: { min: 59000, max: 78000 },
      averagePrice: 65000,
      description: [
        "진에어 할인석(59,200원~) 및 대한항공 공동운항 할인 운임(77,900원)",
        "오후(14:00) 편 중심 실속 예매",
        "일 2편 소수 운항으로 할인석 조기 마감 주의",
      ],
    },
    standard: {
      label: "일반석 (표준/정규형)",
      subLabel: "오전 피크 & 정규 일반석",
      priceRange: { min: 91000, max: 92000 },
      averagePrice: 91400,
      description: [
        "진에어 정규 일반석 (91,400원 고정가 형성)",
        "오전 첫 비행기(10:30) 및 전 시간대 정규 운임",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 확보",
      ],
    },
  },
};

/**
 * 대한민국 10대 도시 및 13개 국내선 공항 연계 도시 간 교통 테이블
 * (코레일, 버스타고, KOBUS, 인천공항 airport.kr, 경기공항리무진 사용자 검증 최신 인가 요금 전수 반영)
 */
export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo[]> = {
  // =========================================================================
  // 1. 서울(SEOUL) 기점 도시 간 이동
  // =========================================================================
  "SEOUL-BUSAN": [
    { mode: "KTX", nameKo: "서울역 ➔ 부산역 (KTX 고속철도)", nameEn: "Seoul Stn ➔ Busan Stn (KTX Express)", oneWayPriceKrw: 59800, durationTextKo: "2시간 37분", durationTextEn: "2h 37m", isDefault: true, optionType: "DIRECT" },
  ],
  "BUSAN-SEOUL": [
    { mode: "KTX", nameKo: "부산역 ➔ 서울역 (KTX 고속철도)", nameEn: "Busan Stn ➔ Seoul Stn (KTX Express)", oneWayPriceKrw: 59800, durationTextKo: "2시간 37분", durationTextEn: "2h 37m", isDefault: true, optionType: "DIRECT" },
  ],
  "SEOUL-JEJU": [
    {
      mode: "FLIGHT",
      nameKo: "김포공항 ➔ 제주공항 (일반석 표준/정규형)",
      nameEn: "Gimpo ➔ Jeju (Flight Standard Regular)",
      oneWayPriceKrw: 95000,
      durationTextKo: "1시간 10분",
      durationTextEn: "1h 10m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "일반석(표준)",
      badgeTextEn: "Standard Class",
      priceRange: { min: 85000, max: 112000 },
      subLabelKo: "오전 피크 & 주말/선호 시간대",
      subLabelEn: "Peak Morning & Weekend Preferred Times",
      tierDescriptionsKo: [
        "오전 골든타임 및 주말 선호 시간대 기본 배정 운임",
        "대형 항공사(FSC) 및 LCC 정규 운임 포함",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 높음",
      ],
      tierDescriptionsEn: [
        "Standard regular fare for peak morning & weekend golden hours",
        "Includes major FSC and regular LCC fares",
        "Includes checked baggage with higher rescheduling/cancellation flexibility",
      ],
    },
    {
      mode: "FLIGHT",
      nameKo: "김포공항 ➔ 제주공항 (특가/할인석 실속형)",
      nameEn: "Gimpo ➔ Jeju (Flight Discount Economy)",
      oneWayPriceKrw: 48000,
      durationTextKo: "1시간 10분",
      durationTextEn: "1h 10m",
      optionType: "BUDGET",
      badgeTextKo: "특가/실속",
      badgeTextEn: "Discount Fare",
      priceRange: { min: 32000, max: 68000 },
      subLabelKo: "평일 낮/오후 & 사전 예매",
      subLabelEn: "Weekday Daytime/Afternoon & Early Booking",
      tierDescriptionsKo: [
        "조기 예매 및 평일·오후 시간대 중심 최저가 운임",
        "저비용 항공사(LCC) 위주 편성",
        "예약 변경/취소 수수료 규정이 상대적으로 엄격함",
      ],
      tierDescriptionsEn: [
        "Lowest fares focusing on early bookings and weekday afternoons",
        "Primarily budget LCC carrier operations",
        "Strict rules regarding schedule changes and cancellations",
      ],
    },
  ],
  "JEJU-SEOUL": [
    {
      mode: "FLIGHT",
      nameKo: "제주공항 ➔ 김포공항 (일반석 표준/정규형)",
      nameEn: "Jeju ➔ Gimpo (Flight Standard Regular)",
      oneWayPriceKrw: 95000,
      durationTextKo: "1시간 10분",
      durationTextEn: "1h 10m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "일반석(표준)",
      badgeTextEn: "Standard Class",
      priceRange: { min: 85000, max: 112000 },
      subLabelKo: "오전 피크 & 주말/선호 시간대",
      subLabelEn: "Peak Morning & Weekend Preferred Times",
      tierDescriptionsKo: [
        "오전 골든타임 및 주말 선호 시간대 기본 배정 운임",
        "대형 항공사(FSC) 및 LCC 정규 운임 포함",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 높음",
      ],
      tierDescriptionsEn: [
        "Standard regular fare for peak morning & weekend golden hours",
        "Includes major FSC and regular LCC fares",
        "Includes checked baggage with higher rescheduling/cancellation flexibility",
      ],
    },
    {
      mode: "FLIGHT",
      nameKo: "제주공항 ➔ 김포공항 (특가/할인석 실속형)",
      nameEn: "Jeju ➔ Gimpo (Flight Discount Economy)",
      oneWayPriceKrw: 48000,
      durationTextKo: "1시간 10분",
      durationTextEn: "1h 10m",
      optionType: "BUDGET",
      badgeTextKo: "특가/실속",
      badgeTextEn: "Discount Fare",
      priceRange: { min: 32000, max: 68000 },
      subLabelKo: "평일 낮/오후 & 사전 예매",
      subLabelEn: "Weekday Daytime/Afternoon & Early Booking",
      tierDescriptionsKo: [
        "조기 예매 및 평일·오후 시간대 중심 최저가 운임",
        "저비용 항공사(LCC) 위주 편성",
        "예약 변경/취소 수수료 규정이 상대적으로 엄격함",
      ],
      tierDescriptionsEn: [
        "Lowest fares focusing on early bookings and weekday afternoons",
        "Primarily budget LCC carrier operations",
        "Strict rules regarding schedule changes and cancellations",
      ],
    },
  ],
  "SEOUL-JEONJU": [
    { mode: "KTX", nameKo: "용산역 ➔ 전주역 (KTX 고속철도)", nameEn: "Yongsan Stn ➔ Jeonju Stn (KTX Express)", oneWayPriceKrw: 34400, durationTextKo: "1시간 40분", durationTextEn: "1h 40m", isDefault: true, optionType: "DIRECT" },
  ],
  "JEONJU-SEOUL": [
    { mode: "KTX", nameKo: "전주역 ➔ 용산역 (KTX 고속철도)", nameEn: "Jeonju Stn ➔ Yongsan Stn (KTX Express)", oneWayPriceKrw: 34400, durationTextKo: "1시간 40분", durationTextEn: "1h 40m", isDefault: true, optionType: "DIRECT" },
  ],
  "SEOUL-GYEONGJU": [
    { mode: "KTX", nameKo: "서울역 ➔ 신경주역 (KTX 고속철도)", nameEn: "Seoul Stn ➔ Singyeongju Stn (KTX Express)", oneWayPriceKrw: 49300, durationTextKo: "2시간 02분", durationTextEn: "2h 02m", isDefault: true, optionType: "DIRECT" },
  ],
  "GYEONGJU-SEOUL": [
    { mode: "KTX", nameKo: "신경주역 ➔ 서울역 (KTX 고속철도)", nameEn: "Singyeongju Stn ➔ Seoul Stn (KTX Express)", oneWayPriceKrw: 49300, durationTextKo: "2시간 02분", durationTextEn: "2h 02m", isDefault: true, optionType: "DIRECT" },
  ],
  "SEOUL-GANGNEUNG": [
    { mode: "KTX", nameKo: "서울/청량리역 ➔ 강릉역 (KTX-이음)", nameEn: "Seoul/Cheongnyangni ➔ Gangneung (KTX-Eum)", oneWayPriceKrw: 27600, durationTextKo: "1시간 57분", durationTextEn: "1h 57m", isDefault: true, optionType: "DIRECT" },
  ],
  "GANGNEUNG-SEOUL": [
    { mode: "KTX", nameKo: "강릉역 ➔ 서울/청량리역 (KTX-이음)", nameEn: "Gangneung ➔ Seoul/Cheongnyangni (KTX-Eum)", oneWayPriceKrw: 27600, durationTextKo: "1시간 57분", durationTextEn: "1h 57m", isDefault: true, optionType: "DIRECT" },
  ],
  "SEOUL-YEOSU": [
    { mode: "KTX", nameKo: "용산역 ➔ 여수엑스포역 (KTX 고속철도)", nameEn: "Yongsan Stn ➔ Yeosu Expo Stn (KTX Express)", oneWayPriceKrw: 47200, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", isDefault: true, optionType: "DIRECT" },
  ],
  "YEOSU-SEOUL": [
    { mode: "KTX", nameKo: "여수엑스포역 ➔ 용산역 (KTX 고속철도)", nameEn: "Yeosu Expo Stn ➔ Yongsan Stn (KTX Express)", oneWayPriceKrw: 47200, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", isDefault: true, optionType: "DIRECT" },
  ],
  "SEOUL-SUWON": [
    { mode: "KTX", nameKo: "서울역 ➔ 수원역 (KTX / ITX-새마을)", nameEn: "Seoul Stn ➔ Suwon Stn (KTX / Train)", oneWayPriceKrw: 8400, durationTextKo: "30분", durationTextEn: "30m", isDefault: true, optionType: "DIRECT" },
  ],
  "SUWON-SEOUL": [
    { mode: "KTX", nameKo: "수원역 ➔ 서울역 (KTX / ITX-새마을)", nameEn: "Suwon Stn ➔ Seoul Stn (KTX / Train)", oneWayPriceKrw: 8400, durationTextKo: "30분", durationTextEn: "30m", isDefault: true, optionType: "DIRECT" },
  ],
  "SEOUL-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "서울경부터미널 ➔ 속초고속터미널 (우등 고속버스)", nameEn: "Seoul Terminal ➔ Sokcho Terminal (Express Bus)", oneWayPriceKrw: 22300, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", isDefault: true, optionType: "DIRECT" },
  ],
  "SOKCHO-SEOUL": [
    { mode: "EXPRESS_BUS", nameKo: "속초고속터미널 ➔ 서울경부터미널 (우등 고속버스)", nameEn: "Sokcho Terminal ➔ Seoul Terminal (Express Bus)", oneWayPriceKrw: 22300, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", isDefault: true, optionType: "DIRECT" },
  ],

  // =========================================================================
  // 2. 제주(JEJU) 연계 이동 (13개 공항 및 정밀 시외버스/전철 연계)
  // =========================================================================
  "JEJU-SUWON": [
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 김포공항 ➔ 수원 (국내선 항공 + 리무진 4300번)",
      nameEn: "Jeju ➔ Gimpo Airport ➔ Suwon (Flight + Bus 4300)",
      oneWayPriceKrw: 104500,
      durationTextKo: "2시간 00분",
      durationTextEn: "2h 00m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "직통리무진",
      badgeTextEn: "Direct Limousine",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "김포국제공항", toHubNameEn: "Gimpo Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔김포)", transitNameEn: "Domestic Flight", fareKrw: 95000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "김포국제공항", fromHubNameEn: "Gimpo Airport", toHubNameKo: "수원역/수원터미널/영통", toHubNameEn: "Suwon Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "공항 리무진 버스 (4300번 직통)", transitNameEn: "Airport Limousine (4300)", fareKrw: 9500, durationTextKo: "50분", durationTextEn: "50m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    },
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 청주공항 ➔ 수원 (국내선 항공 + 시외버스/기차)",
      nameEn: "Jeju ➔ Cheongju Airport ➔ Suwon (Flight + Train/Bus)",
      oneWayPriceKrw: 78000,
      durationTextKo: "2시간 20분",
      durationTextEn: "2h 20m",
      optionType: "BUDGET",
      badgeTextKo: "충청경유",
      badgeTextEn: "Via Cheongju",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "청주국제공항", toHubNameEn: "Cheongju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔청주)", transitNameEn: "Domestic Flight", fareKrw: 68000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "청주국제공항", fromHubNameEn: "Cheongju Airport", toHubNameKo: "수원역/터미널", toHubNameEn: "Suwon Stn/Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "시외버스 / 충북선 열차", transitNameEn: "Intercity Bus / Train", fareKrw: 10000, durationTextKo: "1시간 20분", durationTextEn: "1h 20m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    }
  ],
  "SUWON-JEJU": [
    {
      mode: "TRANSFER",
      nameKo: "수원 ➔ 김포공항 ➔ 제주공항 (리무진 4300번 + 국내선 항공)",
      nameEn: "Suwon ➔ Gimpo Airport ➔ Jeju (Bus 4300 + Flight)",
      oneWayPriceKrw: 104500,
      durationTextKo: "2시간 00분",
      durationTextEn: "2h 00m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "직통리무진",
      badgeTextEn: "Direct Limousine",
      legs: [
        { legOrder: 1, fromHubNameKo: "수원역/수원터미널/영통", fromHubNameEn: "Suwon Terminal", toHubNameKo: "김포국제공항", toHubNameEn: "Gimpo Airport", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "공항 리무진 버스 (4300번 직통)", transitNameEn: "Airport Limousine (4300)", fareKrw: 9500, durationTextKo: "50분", durationTextEn: "50m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
        { legOrder: 2, fromHubNameKo: "김포국제공항", fromHubNameEn: "Gimpo Airport", toHubNameKo: "제주국제공항", toHubNameEn: "Jeju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (김포➔제주)", transitNameEn: "Domestic Flight", fareKrw: 95000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
      ]
    }
  ],
  "JEJU-BUSAN": [
    {
      mode: "FLIGHT",
      nameKo: "제주공항 ➔ 김해공항 (일반석 표준/정규형)",
      nameEn: "Jeju ➔ Gimhae (Flight Standard Regular)",
      oneWayPriceKrw: 92000,
      durationTextKo: "1시간 00분",
      durationTextEn: "1h 00m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "일반석(표준)",
      badgeTextEn: "Standard Class",
      priceRange: { min: 81000, max: 131000 },
      subLabelKo: "오전 피크 & 주말/선호 시간대",
      subLabelEn: "Peak Morning & Weekend Preferred Times",
      tierDescriptionsKo: [
        "오전 출발(06:55~12:30) 및 주요 시간대 기본 정규 운임",
        "대한항공, 아시아나(에어부산 공동운항) 및 LCC 일반석 포함",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 높음",
      ],
      tierDescriptionsEn: [
        "Standard regular fare for morning departures (06:55~12:30) & peak weekend flights",
        "Includes major carriers (Korean Air, Asiana) and LCC standard seats",
        "Includes checked baggage with higher rescheduling/cancellation flexibility",
      ],
    },
    {
      mode: "FLIGHT",
      nameKo: "제주공항 ➔ 김해공항 (특가/할인석 실속형)",
      nameEn: "Jeju ➔ Gimhae (Flight Discount Economy)",
      oneWayPriceKrw: 45000,
      durationTextKo: "1시간 00분",
      durationTextEn: "1h 00m",
      optionType: "BUDGET",
      badgeTextKo: "특가/실속",
      badgeTextEn: "Discount Fare",
      priceRange: { min: 38000, max: 65000 },
      subLabelKo: "오후/야간 & 사전 예매",
      subLabelEn: "Afternoon/Night & Early Booking",
      tierDescriptionsKo: [
        "오후(13:00 이후) 및 야간 시간대 중심 실속 최저가 운임",
        "에어부산, 진에어, 제주항공, 이스타 등 LCC 위주 편성",
        "예약 변경/취소 수수료 규정이 상대적으로 엄격함",
      ],
      tierDescriptionsEn: [
        "Budget-friendly fares for afternoon (after 13:00) and evening departures",
        "Primarily operated by LCC carriers (Air Busan, Jin Air, Jeju Air, Eastar)",
        "Strict rules regarding schedule changes and cancellations",
      ],
    },
  ],
  "BUSAN-JEJU": [
    {
      mode: "FLIGHT",
      nameKo: "김해공항 ➔ 제주공항 (일반석 표준/정규형)",
      nameEn: "Gimhae ➔ Jeju (Flight Standard Regular)",
      oneWayPriceKrw: 92000,
      durationTextKo: "1시간 00분",
      durationTextEn: "1h 00m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "일반석(표준)",
      badgeTextEn: "Standard Class",
      priceRange: { min: 81000, max: 131000 },
      subLabelKo: "오전 피크 & 주말/선호 시간대",
      subLabelEn: "Peak Morning & Weekend Preferred Times",
      tierDescriptionsKo: [
        "오전 출발(06:55~12:30) 및 주요 시간대 기본 정규 운임",
        "대한항공, 아시아나(에어부산 공동운항) 및 LCC 일반석 포함",
        "위탁 수하물 기본 포함 및 일정 변경/취소 유연성 높음",
      ],
      tierDescriptionsEn: [
        "Standard regular fare for morning departures (06:55~12:30) & peak weekend flights",
        "Includes major carriers (Korean Air, Asiana) and LCC standard seats",
        "Includes checked baggage with higher rescheduling/cancellation flexibility",
      ],
    },
    {
      mode: "FLIGHT",
      nameKo: "김해공항 ➔ 제주공항 (특가/할인석 실속형)",
      nameEn: "Gimhae ➔ Jeju (Flight Discount Economy)",
      oneWayPriceKrw: 45000,
      durationTextKo: "1시간 00분",
      durationTextEn: "1h 00m",
      optionType: "BUDGET",
      badgeTextKo: "특가/실속",
      badgeTextEn: "Discount Fare",
      priceRange: { min: 38000, max: 65000 },
      subLabelKo: "오후/야간 & 사전 예매",
      subLabelEn: "Afternoon/Night & Early Booking",
      tierDescriptionsKo: [
        "오후(13:00 이후) 및 야간 시간대 중심 실속 최저가 운임",
        "에어부산, 진에어, 제주항공, 이스타 등 LCC 위주 편성",
        "예약 변경/취소 수수료 규정이 상대적으로 엄격함",
      ],
      tierDescriptionsEn: [
        "Budget-friendly fares for afternoon (after 13:00) and evening departures",
        "Primarily operated by LCC carriers (Air Busan, Jin Air, Jeju Air, Eastar)",
        "Strict rules regarding schedule changes and cancellations",
      ],
    },
  ],
  "JEJU-JEONJU": [
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 군산공항 ➔ 전주 (국내선 항공 + 버스타고 시외버스)",
      nameEn: "Jeju ➔ Gunsan Airport ➔ Jeonju (Flight + Intercity Bus)",
      oneWayPriceKrw: 94500,
      durationTextKo: "2시간 10분",
      durationTextEn: "2h 10m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "전북직결",
      badgeTextEn: "Direct Link",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "군산공항", toHubNameEn: "Gunsan Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔군산)", transitNameEn: "Domestic Flight", fareKrw: 87900, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "군산공항", fromHubNameEn: "Gunsan Airport", toHubNameKo: "전주시외터미널", toHubNameEn: "Jeonju Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "군산공항 ➔ 전주 시외버스", transitNameEn: "Airport Intercity Bus", fareKrw: 6600, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    },
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 광주공항 ➔ 전주 (국내선 항공 + KTX/ITX)",
      nameEn: "Jeju ➔ Gwangju Airport ➔ Jeonju (Flight + KTX/ITX)",
      oneWayPriceKrw: 104000,
      durationTextKo: "1시간 50분",
      durationTextEn: "1h 50m",
      optionType: "COMFORT",
      badgeTextKo: "배차다수",
      badgeTextEn: "Frequent Flights",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "광주공항", toHubNameEn: "Gwangju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔광주)", transitNameEn: "Domestic Flight", fareKrw: 85000, durationTextKo: "55분", durationTextEn: "55m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "광주송정역", fromHubNameEn: "Gwangju Songjeong", toHubNameKo: "익산역", toHubNameEn: "Iksan Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 고속철도", transitNameEn: "KTX Rail", fareKrw: 14200, durationTextKo: "35분", durationTextEn: "35m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 3, fromHubNameKo: "익산역", fromHubNameEn: "Iksan Stn", toHubNameKo: "전주역", toHubNameEn: "Jeonju Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "ITX-새마을 / 마음", transitNameEn: "ITX Train", fareKrw: 4800, durationTextKo: "14분", durationTextEn: "14m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "JEONJU-JEJU": [
    {
      mode: "TRANSFER",
      nameKo: "전주 ➔ 군산공항 ➔ 제주공항 (버스타고 시외버스 + 국내선 항공)",
      nameEn: "Jeju ➔ Gunsan Airport ➔ Jeonju (Intercity Bus + Flight)",
      oneWayPriceKrw: 94500,
      durationTextKo: "2시간 10분",
      durationTextEn: "2h 10m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "전북직결",
      badgeTextEn: "Direct Link",
      legs: [
        { legOrder: 1, fromHubNameKo: "전주시외터미널", fromHubNameEn: "Jeonju Terminal", toHubNameKo: "군산공항", toHubNameEn: "Gunsan Airport", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "전주 ➔ 군산공항 시외버스", transitNameEn: "Airport Intercity Bus", fareKrw: 6600, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
        { legOrder: 2, fromHubNameKo: "군산공항", fromHubNameEn: "Gunsan Airport", toHubNameKo: "제주국제공항", toHubNameEn: "Jeju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (군산➔제주)", transitNameEn: "Domestic Flight", fareKrw: 87900, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
      ]
    }
  ],
  "JEJU-GYEONGJU": [
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 김해공항 ➔ 경주 (국내선 항공 + 공항 리무진)",
      nameEn: "Jeju ➔ Gimhae Airport ➔ Gyeongju (Flight + Limousine)",
      oneWayPriceKrw: 101500,
      durationTextKo: "2시간 10분",
      durationTextEn: "2h 10m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "배차풍부",
      badgeTextEn: "Best Choice",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "김해국제공항", toHubNameEn: "Gimhae Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔김해)", transitNameEn: "Domestic Flight", fareKrw: 92000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "김해국제공항", fromHubNameEn: "Gimhae Airport", toHubNameKo: "경주시외터미널", toHubNameEn: "Gyeongju Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "공항 직행 리무진 버스 (금아)", transitNameEn: "Airport Direct Bus", fareKrw: 9500, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    },
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 포항경주공항 ➔ 경주 (국내선 항공 + 급행 1000번 버스)",
      nameEn: "Jeju ➔ Pohang Gyeongju Airport ➔ Gyeongju (Flight + Bus 1000)",
      oneWayPriceKrw: 93100,
      durationTextKo: "2시간 15분",
      durationTextEn: "2h 15m",
      optionType: "BUDGET",
      badgeTextKo: "가성비급행",
      badgeTextEn: "Budget Express",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "포항경주공항", toHubNameEn: "Pohang Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔포항경주)", transitNameEn: "Domestic Flight", fareKrw: 91400, durationTextKo: "1시간 05분", durationTextEn: "1h 05m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "포항경주공항", fromHubNameEn: "Pohang Airport", toHubNameKo: "경주보문단지/시외터미널", toHubNameEn: "Gyeongju Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "공항 급행버스 (1000번)", transitNameEn: "Airport Express Bus (1000)", fareKrw: 1700, durationTextKo: "1시간 15분", durationTextEn: "1h 15m", bookingPlatform: "TMONEY", bookingUrl: "https://txbus.t-money.co.kr" },
      ]
    }
  ],
  "GYEONGJU-JEJU": [
    {
      mode: "TRANSFER",
      nameKo: "경주 ➔ 김해공항 ➔ 제주공항 (공항 리무진 + 국내선 항공)",
      nameEn: "Gyeongju ➔ Gimhae Airport ➔ Jeju (Limousine + Flight)",
      oneWayPriceKrw: 101500,
      durationTextKo: "2시간 10분",
      durationTextEn: "2h 20m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "경주시외터미널", fromHubNameEn: "Gyeongju Terminal", toHubNameKo: "김해국제공항", toHubNameEn: "Gimhae Airport", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "공항 직행 리무진 버스 (금아)", transitNameEn: "Airport Direct Bus", fareKrw: 9500, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
        { legOrder: 2, fromHubNameKo: "김해국제공항", fromHubNameEn: "Gimhae Airport", toHubNameKo: "제주국제공항", toHubNameEn: "Jeju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (김해➔제주)", transitNameEn: "Domestic Flight", fareKrw: 92000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
      ]
    }
  ],
  "JEJU-GANGNEUNG": [
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 원주(만종) ➔ 강릉 (국내선 항공 + KTX-이음)",
      nameEn: "Jeju ➔ Wonju(Manjong) ➔ Gangneung (Flight + KTX-Eum)",
      oneWayPriceKrw: 116800,
      durationTextKo: "2시간 00분",
      durationTextEn: "2h 00m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "강원도내공항",
      badgeTextEn: "Wonju Link",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "원주공항(횡성)", toHubNameEn: "Wonju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔원주)", transitNameEn: "Domestic Flight", fareKrw: 100500, durationTextKo: "1시간 15분", durationTextEn: "1h 15m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "만종(원주)역", fromHubNameEn: "Manjong/Wonju Stn", toHubNameKo: "강릉역", toHubNameEn: "Gangneung Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX-이음 고속철도", transitNameEn: "KTX-Eum", fareKrw: 16300, durationTextKo: "44분", durationTextEn: "44m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    },
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 김포공항 ➔ 강릉역 (국내선 항공 + 서울역 KTX)",
      nameEn: "Jeju ➔ Gimpo Airport ➔ Gangneung (Flight + KTX)",
      oneWayPriceKrw: 122600,
      durationTextKo: "3시간 20분",
      durationTextEn: "3h 20m",
      optionType: "COMFORT",
      badgeTextKo: "정시성KTX",
      badgeTextEn: "Via Seoul KTX",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "김포국제공항", toHubNameEn: "Gimpo Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔김포)", transitNameEn: "Domestic Flight", fareKrw: 95000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "서울역/청량리역", fromHubNameEn: "Seoul Stn", toHubNameKo: "강릉역", toHubNameEn: "Gangneung Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX-이음 고속철도", transitNameEn: "KTX-Eum Rail", fareKrw: 27600, durationTextKo: "1시간 57분", durationTextEn: "1h 57m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "GANGNEUNG-JEJU": [
    {
      mode: "TRANSFER",
      nameKo: "강릉역 ➔ 원주(만종) ➔ 제주공항 (KTX-이음 + 국내선 항공)",
      nameEn: "Gangneung ➔ Wonju(Manjong) ➔ Jeju (KTX-Eum + Flight)",
      oneWayPriceKrw: 116800,
      durationTextKo: "2시간 00분",
      durationTextEn: "2h 00m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "강릉역", fromHubNameEn: "Gangneung Stn", toHubNameKo: "만종(원주)역", toHubNameEn: "Manjong/Wonju Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX-이음 고속철도", transitNameEn: "KTX-Eum", fareKrw: 16300, durationTextKo: "44분", durationTextEn: "44m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "원주공항(횡성)", fromHubNameEn: "Wonju Airport", toHubNameKo: "제주국제공항", toHubNameEn: "Jeju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (원주➔제주)", transitNameEn: "Domestic Flight", fareKrw: 100500, durationTextKo: "1시간 15분", durationTextEn: "1h 15m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
      ]
    }
  ],
  "JEJU-YEOSU": [
    {
      mode: "FLIGHT",
      nameKo: "제주공항 ➔ 여수공항 (일반석 표준/정규형)",
      nameEn: "Jeju ➔ Yeosu (Flight Standard Regular)",
      oneWayPriceKrw: 85000,
      durationTextKo: "55분",
      durationTextEn: "55m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "일반석(표준)",
      badgeTextEn: "Standard Class",
      priceRange: { min: 73000, max: 119000 },
      subLabelKo: "선호 시간대 & 정규 운임",
      subLabelEn: "Preferred Times & Regular Fares",
      tierDescriptionsKo: [
        "진에어 일반석(7.3만~) 및 대한항공·아시아나 정규 일반석",
        "위탁 수하물 기본 포함 및 일정 변경 유연성 확보",
        "잔여 좌석 여유가 있는 표준 예약 기준",
      ],
      tierDescriptionsEn: [
        "Jin Air standard (from 73k) & FSC regular standard economy seats",
        "Includes checked baggage with higher rescheduling flexibility",
        "Standard booking rate with ample available seats",
      ],
    },
    {
      mode: "FLIGHT",
      nameKo: "제주공항 ➔ 여수공항 (특가/할인석 실속형)",
      nameEn: "Jeju ➔ Yeosu (Flight Discount Economy)",
      oneWayPriceKrw: 65000,
      durationTextKo: "55분",
      durationTextEn: "55m",
      optionType: "BUDGET",
      badgeTextKo: "특가/실속",
      badgeTextEn: "Discount Fare",
      priceRange: { min: 58000, max: 82000 },
      subLabelKo: "낮/오후 잔여 & 사전 예매",
      subLabelEn: "Daytime/Afternoon & Early Booking",
      tierDescriptionsKo: [
        "대한항공 특가석 및 아시아나항공 할인석 중심 실속 운임",
        "운항 편수가 적어(일 4편 내외) 조기 마감 가능성 높음",
        "취소 및 변경 규정 확인 필요",
      ],
      tierDescriptionsEn: [
        "FSC discount tickets and promotional early-bird fares",
        "Limited daily flights (approx. 4 flights/day) with high sell-out rate",
        "Strict rules regarding schedule changes and cancellations",
      ],
    },
  ],
  "YEOSU-JEJU": [
    {
      mode: "FLIGHT",
      nameKo: "여수공항 ➔ 제주공항 (일반석 표준/정규형)",
      nameEn: "Yeosu ➔ Jeju (Flight Standard Regular)",
      oneWayPriceKrw: 85000,
      durationTextKo: "55분",
      durationTextEn: "55m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "일반석(표준)",
      badgeTextEn: "Standard Class",
      priceRange: { min: 73000, max: 119000 },
      subLabelKo: "선호 시간대 & 정규 운임",
      subLabelEn: "Preferred Times & Regular Fares",
      tierDescriptionsKo: [
        "진에어 일반석(7.3만~) 및 대한항공·아시아나 정규 일반석",
        "위탁 수하물 기본 포함 및 일정 변경 유연성 확보",
        "잔여 좌석 여유가 있는 표준 예약 기준",
      ],
      tierDescriptionsEn: [
        "Jin Air standard (from 73k) & FSC regular standard economy seats",
        "Includes checked baggage with higher rescheduling flexibility",
        "Standard booking rate with ample available seats",
      ],
    },
    {
      mode: "FLIGHT",
      nameKo: "여수공항 ➔ 제주공항 (특가/할인석 실속형)",
      nameEn: "Yeosu ➔ Jeju (Flight Discount Economy)",
      oneWayPriceKrw: 65000,
      durationTextKo: "55분",
      durationTextEn: "55m",
      optionType: "BUDGET",
      badgeTextKo: "특가/실속",
      badgeTextEn: "Discount Fare",
      priceRange: { min: 58000, max: 82000 },
      subLabelKo: "낮/오후 잔여 & 사전 예매",
      subLabelEn: "Daytime/Afternoon & Early Booking",
      tierDescriptionsKo: [
        "대한항공 특가석 및 아시아나항공 할인석 중심 실속 운임",
        "운항 편수가 적어(일 4편 내외) 조기 마감 가능성 높음",
        "취소 및 변경 규정 확인 필요",
      ],
      tierDescriptionsEn: [
        "FSC discount tickets and promotional early-bird fares",
        "Limited daily flights (approx. 4 flights/day) with high sell-out rate",
        "Strict rules regarding schedule changes and cancellations",
      ],
    },
  ],
  "JEJU-SOKCHO": [
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 양양공항 ➔ 속초 (국내선 항공 + 버스타고 시외버스)",
      nameEn: "Jeju ➔ Yangyang Airport ➔ Sokcho (Flight + Intercity Bus)",
      oneWayPriceKrw: 78200,
      durationTextKo: "1시간 40분",
      durationTextEn: "1h 40m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "인근공항",
      badgeTextEn: "Fastest Airport",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "양양국제공항", toHubNameEn: "Yangyang Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔양양)", transitNameEn: "Domestic Flight", fareKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "양양국제공항/터미널", fromHubNameEn: "Yangyang Airport/Terminal", toHubNameKo: "속초시외버스터미널", toHubNameEn: "Sokcho Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "양양공항 ➔ 속초 시외버스", transitNameEn: "Intercity Bus", fareKrw: 3200, durationTextKo: "30분", durationTextEn: "30m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    },
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 김포공항 ➔ 속초 (국내선 항공 + 우등 고속버스)",
      nameEn: "Jeju ➔ Gimpo Airport ➔ Sokcho (Flight + Express Bus)",
      oneWayPriceKrw: 97300,
      durationTextKo: "3시간 30분",
      durationTextEn: "3h 30m",
      optionType: "COMFORT",
      badgeTextKo: "배차다수",
      badgeTextEn: "Via Seoul",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "김포국제공항", toHubNameEn: "Gimpo Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (제주➔김포)", transitNameEn: "Domestic Flight", fareKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "서울경부터미널", fromHubNameEn: "Seoul Terminal", toHubNameKo: "속초고속터미널", toHubNameEn: "Sokcho Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "우등 고속버스", transitNameEn: "Express Bus", fareKrw: 22300, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", bookingPlatform: "KOBUS", bookingUrl: "https://www.kobus.co.kr" },
      ]
    }
  ],
  "SOKCHO-JEJU": [
    {
      mode: "TRANSFER",
      nameKo: "속초 ➔ 양양공항 ➔ 제주공항 (버스타고 시외버스 + 국내선 항공)",
      nameEn: "Sokcho ➔ Yangyang Airport ➔ Jeju (Intercity Bus + Flight)",
      oneWayPriceKrw: 78200,
      durationTextKo: "1시간 40분",
      durationTextEn: "1h 40m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "속초시외버스터미널", fromHubNameEn: "Sokcho Terminal", toHubNameKo: "양양국제공항", toHubNameEn: "Yangyang Airport", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "속초 ➔ 양양공항 시외버스", transitNameEn: "Intercity Bus", fareKrw: 3200, durationTextKo: "30분", durationTextEn: "30m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
        { legOrder: 2, fromHubNameKo: "양양국제공항", fromHubNameEn: "Yangyang Airport", toHubNameKo: "제주국제공항", toHubNameEn: "Jeju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "국내선 항공 (양양➔제주)", transitNameEn: "Domestic Flight", fareKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
      ]
    }
  ],
  "JEJU-INCHEON": [
    {
      mode: "TRANSFER",
      nameKo: "제주공항 ➔ 김포공항 ➔ 인천 (국내선 항공 + 공항철도)",
      nameEn: "Jeju ➔ Gimpo Airport ➔ Incheon (Flight + AREX)",
      oneWayPriceKrw: 96600,
      durationTextKo: "1시간 40분",
      durationTextEn: "1h 40m",
      isDefault: true,
      badgeTextKo: "추천경로",
      badgeTextEn: "Recommended",
      legs: [
        { legOrder: 1, fromHubNameKo: "제주국제공항", fromHubNameEn: "Jeju Airport", toHubNameKo: "김포공항", toHubNameEn: "Gimpo Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "제주 ➔ 김포 항공 (일반석)", transitNameEn: "Jeju ➔ Gimpo Flight", fareKrw: 95000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
        { legOrder: 2, fromHubNameKo: "김포공항역", fromHubNameEn: "Gimpo Airport", toHubNameKo: "계양/검암/인천", toHubNameEn: "Incheon", mode: "SRT", modeIcon: "🚆", transitNameKo: "공항철도 일반열차", transitNameEn: "AREX Local", fareKrw: 1600, durationTextKo: "10분", durationTextEn: "10m", bookingPlatform: "TMONEY", bookingUrl: "https://www.arex.or.kr" },
      ]
    },
  ],
  "INCHEON-JEJU": [
    {
      mode: "TRANSFER",
      nameKo: "인천 ➔ 김포공항 ➔ 제주공항 (공항철도 + 국내선 항공)",
      nameEn: "Incheon ➔ Gimpo Airport ➔ Jeju (AREX + Flight)",
      oneWayPriceKrw: 96600,
      durationTextKo: "1시간 40분",
      durationTextEn: "1h 40m",
      isDefault: true,
      badgeTextKo: "추천경로",
      badgeTextEn: "Recommended",
      legs: [
        { legOrder: 1, fromHubNameKo: "계양/검암역", fromHubNameEn: "Gyeyang/Geomam", toHubNameKo: "김포공항역", toHubNameEn: "Gimpo Airport", mode: "SRT", modeIcon: "🚆", transitNameKo: "공항철도 일반열차", transitNameEn: "AREX Local", fareKrw: 1600, durationTextKo: "10분", durationTextEn: "10m", bookingPlatform: "TMONEY", bookingUrl: "https://www.arex.or.kr" },
        { legOrder: 2, fromHubNameKo: "김포공항", fromHubNameEn: "Gimpo Airport", toHubNameKo: "제주국제공항", toHubNameEn: "Jeju Airport", mode: "FLIGHT", modeIcon: "🛫", transitNameKo: "김포 ➔ 제주 항공 (일반석)", transitNameEn: "Gimpo ➔ Jeju Flight", fareKrw: 95000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "AIRLINE", bookingUrl: "https://flight.naver.com" },
      ]
    },
  ],

  // =========================================================================
  // 3. 부산(BUSAN) 기점 도시 간 이동 (버스타고 27,000원, KOBUS 22,800원 전수 반영)
  // =========================================================================
  "BUSAN-GYEONGJU": [
    { mode: "KTX", nameKo: "부산역 ➔ 신경주역 (KTX 고속철도)", nameEn: "Busan Stn ➔ Singyeongju Stn (KTX Express)", oneWayPriceKrw: 11000, durationTextKo: "27분", durationTextEn: "27m", isDefault: true, optionType: "DIRECT" },
  ],
  "GYEONGJU-BUSAN": [
    { mode: "KTX", nameKo: "신경주역 ➔ 부산역 (KTX 고속철도)", nameEn: "Singyeongju Stn ➔ Busan Stn (KTX Express)", oneWayPriceKrw: 11000, durationTextKo: "27분", durationTextEn: "27m", isDefault: true, optionType: "DIRECT" },
  ],
  "BUSAN-JEONJU": [
    { mode: "INTERCITY_BUS", nameKo: "부산사상터미널 ➔ 전주시외터미널 (버스타고 시외 우등)", nameEn: "Busan Sasang ➔ Jeonju Terminal (Bustago Intercity Bus)", oneWayPriceKrw: 27000, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "JEONJU-BUSAN": [
    { mode: "INTERCITY_BUS", nameKo: "전주시외터미널 ➔ 부산사상터미널 (버스타고 시외 우등)", nameEn: "Jeonju Terminal ➔ Busan Sasang (Bustago Intercity Bus)", oneWayPriceKrw: 27000, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "BUSAN-YEOSU": [
    { mode: "EXPRESS_BUS", nameKo: "부산사상터미널 ➔ 여수종합터미널 (KOBUS 고속 우등)", nameEn: "Busan Sasang ➔ Yeosu Terminal (KOBUS Express Bus)", oneWayPriceKrw: 22800, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "YEOSU-BUSAN": [
    { mode: "EXPRESS_BUS", nameKo: "여수종합터미널 ➔ 부산사상터미널 (KOBUS 고속 우등)", nameEn: "Yeosu Terminal ➔ Busan Sasang (KOBUS Express Bus)", oneWayPriceKrw: 22800, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "BUSAN-GANGNEUNG": [
    { mode: "KTX", nameKo: "부전역 ➔ 강릉역 (동해선 KTX-이음 직통열차)", nameEn: "Bujeon Stn ➔ Gangneung Stn (Donghae KTX-Eum)", oneWayPriceKrw: 46800, durationTextKo: "3시간 40분", durationTextEn: "3h 40m", isDefault: true, optionType: "DIRECT", badgeTextKo: "동해선직통", badgeTextEn: "Direct Train" },
  ],
  "GANGNEUNG-BUSAN": [
    { mode: "KTX", nameKo: "강릉역 ➔ 부전역 (동해선 KTX-이음 직통열차)", nameEn: "Gangneung Stn ➔ Bujeon Stn (Donghae KTX-Eum)", oneWayPriceKrw: 46800, durationTextKo: "3시간 40분", durationTextEn: "3h 40m", isDefault: true, optionType: "DIRECT", badgeTextKo: "동해선직통", badgeTextEn: "Direct Train" },
  ],
  "BUSAN-SUWON": [
    { mode: "KTX", nameKo: "부산역 ➔ 수원역 (KTX 고속철도 직통)", nameEn: "Busan Stn ➔ Suwon Stn (KTX Express Direct)", oneWayPriceKrw: 46300, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true, optionType: "DIRECT" },
  ],
  "SUWON-BUSAN": [
    { mode: "KTX", nameKo: "수원역 ➔ 부산역 (KTX 고속철도 직통)", nameEn: "Suwon Stn ➔ Busan Stn (KTX Express Direct)", oneWayPriceKrw: 46300, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true, optionType: "DIRECT" },
  ],
  "BUSAN-SOKCHO": [
    {
      mode: "TRANSFER",
      nameKo: "부산역 ➔ 대구 ➔ 속초 (KTX + 대구북부 시외직통)",
      nameEn: "Busan ➔ Daegu ➔ Sokcho (KTX + Intercity Bus)",
      oneWayPriceKrw: 59800,
      durationTextKo: "5시간 40분",
      durationTextEn: "5h 40m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "추천환승",
      badgeTextEn: "Best Route",
      legs: [
        { legOrder: 1, fromHubNameKo: "부산역", fromHubNameEn: "Busan Stn", toHubNameKo: "동대구역", toHubNameEn: "Dongdaegu Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 고속철도", transitNameEn: "KTX Express", fareKrw: 17100, durationTextKo: "40분", durationTextEn: "40m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "대구북부시외버스터미널", fromHubNameEn: "Daegu Bukbu Terminal", toHubNameKo: "속초시외버스터미널", toHubNameEn: "Sokcho Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "대구북부 ➔ 속초 시외버스", transitNameEn: "Intercity Bus", fareKrw: 42700, durationTextKo: "5시간 00분", durationTextEn: "5h 00m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    },
    {
      mode: "TRANSFER",
      nameKo: "부산종합터미널 ➔ 포항/강릉 ➔ 속초 (동해선 직행 시외버스)",
      nameEn: "Busan Terminal ➔ Gangneung ➔ Sokcho (Intercity Bus)",
      oneWayPriceKrw: 42000,
      durationTextKo: "5시간 10분",
      durationTextEn: "5h 10m",
      optionType: "BUDGET",
      badgeTextKo: "환승편의",
      badgeTextEn: "Coast Scenic",
      legs: [
        { legOrder: 1, fromHubNameKo: "부산종합터미널(노포)", fromHubNameEn: "Busan Terminal", toHubNameKo: "속초고속터미널", toHubNameEn: "Sokcho Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "동해선 직행 시외버스", transitNameEn: "Intercity Bus", fareKrw: 42000, durationTextKo: "5시간 00분", durationTextEn: "5h 00m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    }
  ],
  "SOKCHO-BUSAN": [
    {
      mode: "TRANSFER",
      nameKo: "속초 ➔ 대구 ➔ 부산역 (대구북부 시외직통 + KTX)",
      nameEn: "Sokcho ➔ Daegu ➔ Busan (Intercity Bus + KTX)",
      oneWayPriceKrw: 59800,
      durationTextKo: "5시간 40분",
      durationTextEn: "5h 40m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "추천환승",
      badgeTextEn: "Best Route",
      legs: [
        { legOrder: 1, fromHubNameKo: "속초시외버스터미널", fromHubNameEn: "Sokcho Terminal", toHubNameKo: "대구북부시외버스터미널", toHubNameEn: "Daegu Bukbu Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "속초 ➔ 대구북부 시외버스", transitNameEn: "Intercity Bus", fareKrw: 42700, durationTextKo: "5시간 00분", durationTextEn: "5h 00m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
        { legOrder: 2, fromHubNameKo: "동대구역", fromHubNameEn: "Dongdaegu Stn", toHubNameKo: "부산역", toHubNameEn: "Busan Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 고속철도", transitNameEn: "KTX Express", fareKrw: 17100, durationTextKo: "40분", durationTextEn: "40m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],

  // =========================================================================
  // 4. 전주/경주/강원/전남 구간 (버스타고 및 KTX 환승 최적화 반영)
  // =========================================================================
  "JEONJU-YEOSU": [
    { mode: "KTX", nameKo: "전주역 ➔ 여수엑스포역 (KTX 고속철도)", nameEn: "Jeonju Stn ➔ Yeosu Expo Stn (KTX Express)", oneWayPriceKrw: 16100, durationTextKo: "1시간 20분", durationTextEn: "1h 20m", isDefault: true, optionType: "DIRECT" },
  ],
  "YEOSU-JEONJU": [
    { mode: "KTX", nameKo: "여수엑스포역 ➔ 전주역 (KTX 고속철도)", nameEn: "Yeosu Expo Stn ➔ Jeonju Stn (KTX Express)", oneWayPriceKrw: 16100, durationTextKo: "1시간 20분", durationTextEn: "1h 20m", isDefault: true, optionType: "DIRECT" },
  ],
  "JEONJU-GYEONGJU": [
    {
      mode: "TRANSFER",
      nameKo: "전주역 ➔ 오송역 ➔ 신경주역 (KTX 고속철도 환승)",
      nameEn: "Jeonju Stn ➔ Osong ➔ Singyeongju (KTX + KTX)",
      oneWayPriceKrw: 47300,
      durationTextKo: "2시간 10분",
      durationTextEn: "2h 10m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "최단철도",
      badgeTextEn: "Fastest Rail",
      legs: [
        { legOrder: 1, fromHubNameKo: "전주역", fromHubNameEn: "Jeonju Stn", toHubNameKo: "오송역", toHubNameEn: "Osong Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 호남선", transitNameEn: "KTX Honam", fareKrw: 16600, durationTextKo: "50분", durationTextEn: "50m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "오송역", fromHubNameEn: "Osong Stn", toHubNameKo: "신경주역", toHubNameEn: "Singyeongju Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 경부선", transitNameEn: "KTX Gyeongbu", fareKrw: 30700, durationTextKo: "1시간 20분", durationTextEn: "1h 20m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    },
    {
      mode: "TRANSFER",
      nameKo: "전주 ➔ 서대구 ➔ 신경주역 (KOBUS 고속버스 + KTX)",
      nameEn: "Jeonju Terminal ➔ Daegu ➔ Gyeongju (Bus + KTX)",
      oneWayPriceKrw: 29600,
      durationTextKo: "3시간 07분",
      durationTextEn: "3h 07m",
      optionType: "BUDGET",
      badgeTextKo: "가성비",
      badgeTextEn: "Budget Choice",
      legs: [
        { legOrder: 1, fromHubNameKo: "전주고속버스터미널", fromHubNameEn: "Jeonju Express Terminal", toHubNameKo: "서대구고속버스터미널", toHubNameEn: "Seodaegu Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "전주 ➔ 서대구 고속버스", transitNameEn: "Express Bus", fareKrw: 21200, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", bookingPlatform: "KOBUS", bookingUrl: "https://www.kobus.co.kr" },
        { legOrder: 2, fromHubNameKo: "동대구역/서대구역", fromHubNameEn: "Daegu Stn", toHubNameKo: "신경주역", toHubNameEn: "Singyeongju Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 고속철도", transitNameEn: "KTX Express", fareKrw: 8400, durationTextKo: "17분", durationTextEn: "17m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "GYEONGJU-JEONJU": [
    {
      mode: "TRANSFER",
      nameKo: "신경주역 ➔ 오송역 ➔ 전주역 (KTX 고속철도 환승)",
      nameEn: "Singyeongju ➔ Osong ➔ Jeonju (KTX + KTX)",
      oneWayPriceKrw: 47300,
      durationTextKo: "2시간 10분",
      durationTextEn: "2h 10m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "신경주역", fromHubNameEn: "Singyeongju Stn", toHubNameKo: "오송역", toHubNameEn: "Osong Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 경부선", transitNameEn: "KTX Gyeongbu", fareKrw: 30700, durationTextKo: "1시간 20분", durationTextEn: "1h 20m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "오송역", fromHubNameEn: "Osong Stn", toHubNameKo: "전주역", toHubNameEn: "Jeonju Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 호남선", transitNameEn: "KTX Honam", fareKrw: 16600, durationTextKo: "50분", durationTextEn: "50m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "JEONJU-GANGNEUNG": [
    { mode: "INTERCITY_BUS", nameKo: "전주시외터미널 ➔ 강릉시외터미널 (버스타고 시외 우등)", nameEn: "Jeonju Terminal ➔ Gangneung Terminal (Bustago Intercity Bus)", oneWayPriceKrw: 36800, durationTextKo: "3시간 35분", durationTextEn: "3h 35m", isDefault: true, optionType: "DIRECT", badgeTextKo: "환승없음", badgeTextEn: "Direct Bus" },
    {
      mode: "TRANSFER",
      nameKo: "전주역 ➔ 서울/청량리역 ➔ 강릉역 (KTX 고속철도 환승)",
      nameEn: "Jeonju ➔ Seoul Stn ➔ Gangneung (KTX + KTX-Eum)",
      oneWayPriceKrw: 62000,
      durationTextKo: "4시간 10분",
      durationTextEn: "4h 10m",
      optionType: "COMFORT",
      badgeTextKo: "쾌적철도",
      badgeTextEn: "Comfort Rail",
      legs: [
        { legOrder: 1, fromHubNameKo: "전주역", fromHubNameEn: "Jeonju Stn", toHubNameKo: "용산/서울역", toHubNameEn: "Seoul Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 고속철도", transitNameEn: "KTX Express", fareKrw: 34400, durationTextKo: "1시간 40분", durationTextEn: "1h 40m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "서울/청량리역", fromHubNameEn: "Seoul/Cheongnyangni", toHubNameKo: "강릉역", toHubNameEn: "Gangneung Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX-이음 고속철도", transitNameEn: "KTX-Eum", fareKrw: 27600, durationTextKo: "1시간 57분", durationTextEn: "1h 57m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "GANGNEUNG-JEONJU": [
    { mode: "INTERCITY_BUS", nameKo: "강릉시외터미널 ➔ 전주시외터미널 (버스타고 시외 우등)", nameEn: "Gangneung Terminal ➔ Jeonju Terminal (Bustago Intercity Bus)", oneWayPriceKrw: 36800, durationTextKo: "3시간 35분", durationTextEn: "3h 35m", isDefault: true, optionType: "DIRECT", badgeTextKo: "환승없음", badgeTextEn: "Direct Bus" },
  ],
  "JEONJU-SUWON": [
    { mode: "KTX", nameKo: "전주역 ➔ 수원역 (ITX-새마을 / ITX-마음 직통)", nameEn: "Jeonju Stn ➔ Suwon Stn (ITX Train Direct)", oneWayPriceKrw: 22500, durationTextKo: "2시간 40분", durationTextEn: "2h 40m", isDefault: true, optionType: "DIRECT" },
  ],
  "SUWON-JEONJU": [
    { mode: "KTX", nameKo: "수원역 ➔ 전주역 (ITX-새마을 / ITX-마음 직통)", nameEn: "Suwon Stn ➔ Jeonju Stn (ITX Train Direct)", oneWayPriceKrw: 22500, durationTextKo: "2시간 40분", durationTextEn: "2h 40m", isDefault: true, optionType: "DIRECT" },
  ],
  "JEONJU-SOKCHO": [
    {
      mode: "TRANSFER",
      nameKo: "전주역 ➔ 서울(KTX) ➔ 속초(고속버스 환승)",
      nameEn: "Jeonju ➔ Seoul(KTX) ➔ Sokcho(Express Bus)",
      oneWayPriceKrw: 56700,
      durationTextKo: "4시간 00분",
      durationTextEn: "4h 00m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "최단시간",
      badgeTextEn: "Fastest Transfer",
      legs: [
        { legOrder: 1, fromHubNameKo: "전주역", fromHubNameEn: "Jeonju Stn", toHubNameKo: "용산/서울역", toHubNameEn: "Seoul Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 고속철도", transitNameEn: "KTX Express", fareKrw: 34400, durationTextKo: "1시간 40분", durationTextEn: "1h 40m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "서울경부터미널(강남)", fromHubNameEn: "Seoul Express Terminal", toHubNameKo: "속초고속터미널", toHubNameEn: "Sokcho Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "우등 고속버스 (서울➔속초)", transitNameEn: "Express Bus", fareKrw: 22300, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", bookingPlatform: "KOBUS", bookingUrl: "https://www.kobus.co.kr" },
      ]
    },
    {
      mode: "INTERCITY_BUS",
      nameKo: "전주시외터미널 ➔ 속초시외터미널 (직행 시외버스)",
      nameEn: "Jeonju Terminal ➔ Sokcho Terminal (Intercity Bus)",
      oneWayPriceKrw: 38000,
      durationTextKo: "4시간 30분",
      durationTextEn: "4h 30m",
      optionType: "BUDGET",
      badgeTextKo: "환승없음",
      badgeTextEn: "Direct Bus"
    }
  ],
  "SOKCHO-JEONJU": [
    {
      mode: "TRANSFER",
      nameKo: "속초(고속버스) ➔ 서울 ➔ 전주역(KTX 환승)",
      nameEn: "Sokcho(Express Bus) ➔ Seoul ➔ Jeonju(KTX)",
      oneWayPriceKrw: 56700,
      durationTextKo: "4시간 00분",
      durationTextEn: "4h 00m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "최단시간",
      badgeTextEn: "Fastest Transfer",
      legs: [
        { legOrder: 1, fromHubNameKo: "속초고속터미널", fromHubNameEn: "Sokcho Terminal", toHubNameKo: "서울경부터미널(강남)", toHubNameEn: "Seoul Express Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "우등 고속버스 (속초➔서울)", transitNameEn: "Express Bus", fareKrw: 22300, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", bookingPlatform: "KOBUS", bookingUrl: "https://www.kobus.co.kr" },
        { legOrder: 2, fromHubNameKo: "용산/서울역", fromHubNameEn: "Seoul Stn", toHubNameKo: "전주역", toHubNameEn: "Jeonju Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 고속철도", transitNameEn: "KTX Express", fareKrw: 34400, durationTextKo: "1시간 40분", durationTextEn: "1h 40m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "GYEONGJU-GANGNEUNG": [
    { mode: "KTX", nameKo: "신경주역 ➔ 강릉역 (동해선 KTX-이음 직통)", nameEn: "Singyeongju Stn ➔ Gangneung Stn (Donghae Line)", oneWayPriceKrw: 34300, durationTextKo: "2시간 44분", durationTextEn: "2h 44m", isDefault: true, optionType: "DIRECT" },
  ],
  "GANGNEUNG-GYEONGJU": [
    { mode: "KTX", nameKo: "강릉역 ➔ 신경주역 (동해선 KTX-이음 직통)", nameEn: "Gangneung Stn ➔ Singyeongju Stn (Donghae Line)", oneWayPriceKrw: 34300, durationTextKo: "2시간 44분", durationTextEn: "2h 44m", isDefault: true, optionType: "DIRECT" },
  ],
  "GYEONGJU-YEOSU": [
    { mode: "INTERCITY_BUS", nameKo: "경주시외터미널 ➔ 여수종합터미널 (버스타고 시외 우등)", nameEn: "Gyeongju Terminal ➔ Yeosu Terminal (Bustago Intercity Bus)", oneWayPriceKrw: 32000, durationTextKo: "3시간 50분", durationTextEn: "3h 50m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "YEOSU-GYEONGJU": [
    { mode: "INTERCITY_BUS", nameKo: "여수종합터미널 ➔ 경주시외터미널 (버스타고 시외 우등)", nameEn: "Yeosu Terminal ➔ Gyeongju Terminal (Bustago Intercity Bus)", oneWayPriceKrw: 32000, durationTextKo: "3시간 50분", durationTextEn: "3h 50m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "GYEONGJU-SUWON": [
    { mode: "KTX", nameKo: "신경주역 ➔ 수원역 (KTX 경부선 직통)", nameEn: "Singyeongju Stn ➔ Suwon Stn (KTX Express)", oneWayPriceKrw: 36600, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true, optionType: "DIRECT" },
  ],
  "SUWON-GYEONGJU": [
    { mode: "KTX", nameKo: "수원역 ➔ 신경주역 (KTX 경부선 직통)", nameEn: "Suwon Stn ➔ Singyeongju Stn (KTX Express)", oneWayPriceKrw: 36600, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true, optionType: "DIRECT" },
  ],
  "GYEONGJU-SOKCHO": [
    {
      mode: "TRANSFER",
      nameKo: "신경주역 ➔ 강릉역(KTX) ➔ 속초(버스타고 시외버스)",
      nameEn: "Singyeongju ➔ Gangneung(KTX) ➔ Sokcho(Bus)",
      oneWayPriceKrw: 42000,
      durationTextKo: "3시간 54분",
      durationTextEn: "3h 54m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "최단시간",
      badgeTextEn: "Fastest Route",
      legs: [
        { legOrder: 1, fromHubNameKo: "신경주역", fromHubNameEn: "Singyeongju Stn", toHubNameKo: "강릉역", toHubNameEn: "Gangneung Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "동해선 KTX-이음", transitNameEn: "Donghae KTX-Eum", fareKrw: 34300, durationTextKo: "2시간 44분", durationTextEn: "2h 44m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "강릉시외터미널", fromHubNameEn: "Gangneung Terminal", toHubNameKo: "속초시외터미널", toHubNameEn: "Sokcho Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "동해안 직행 시외버스", transitNameEn: "Intercity Bus", fareKrw: 7700, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
      ]
    },
    {
      mode: "INTERCITY_BUS",
      nameKo: "경주시외터미널 ➔ 속초고속터미널 (동해선 시외버스 직통)",
      nameEn: "Gyeongju Terminal ➔ Sokcho Terminal (Intercity Bus Direct)",
      oneWayPriceKrw: 36000,
      durationTextKo: "4시간 10분",
      durationTextEn: "4h 10m",
      optionType: "BUDGET",
      badgeTextKo: "환승없음",
      badgeTextEn: "Direct Bus"
    }
  ],
  "SOKCHO-GYEONGJU": [
    {
      mode: "TRANSFER",
      nameKo: "속초(시외버스) ➔ 강릉역 ➔ 신경주역(KTX 환승)",
      nameEn: "Sokcho(Bus) ➔ Gangneung ➔ Singyeongju(KTX)",
      oneWayPriceKrw: 42000,
      durationTextKo: "3시간 54분",
      durationTextEn: "3h 54m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "최단시간",
      badgeTextEn: "Fastest Route",
      legs: [
        { legOrder: 1, fromHubNameKo: "속초시외터미널", fromHubNameEn: "Sokcho Terminal", toHubNameKo: "강릉시외터미널", toHubNameEn: "Gangneung Terminal", mode: "INTERCITY_BUS", modeIcon: "🚌", transitNameKo: "동해안 직행 시외버스", transitNameEn: "Intercity Bus", fareKrw: 7700, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", bookingPlatform: "BUSTAGO", bookingUrl: "https://www.bustago.or.kr" },
        { legOrder: 2, fromHubNameKo: "강릉역", fromHubNameEn: "Gangneung Stn", toHubNameKo: "신경주역", toHubNameEn: "Singyeongju Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "동해선 KTX-이음", transitNameEn: "Donghae KTX-Eum", fareKrw: 34300, durationTextKo: "2시간 44분", durationTextEn: "2h 44m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "GANGNEUNG-SOKCHO": [
    { mode: "INTERCITY_BUS", nameKo: "강릉시외터미널 ➔ 속초시외터미널 (버스타고 직행 시외버스)", nameEn: "Gangneung Terminal ➔ Sokcho Terminal (Bustago Direct Bus)", oneWayPriceKrw: 7700, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, optionType: "DIRECT" },
  ],
  "SOKCHO-GANGNEUNG": [
    { mode: "INTERCITY_BUS", nameKo: "속초시외터미널 ➔ 강릉시외터미널 (버스타고 직행 시외버스)", nameEn: "Sokcho Terminal ➔ Gangneung Terminal (Bustago Direct Bus)", oneWayPriceKrw: 7700, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, optionType: "DIRECT" },
  ],
  "GANGNEUNG-SUWON": [
    { mode: "INTERCITY_BUS", nameKo: "강릉시외터미널 ➔ 수원버스터미널 (버스타고 시외 우등)", nameEn: "Gangneung Terminal ➔ Suwon Terminal (Bustago Express Bus)", oneWayPriceKrw: 22800, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "SUWON-GANGNEUNG": [
    { mode: "INTERCITY_BUS", nameKo: "수원버스터미널 ➔ 강릉시외터미널 (버스타고 시외 우등)", nameEn: "Suwon Terminal ➔ Gangneung Terminal (Bustago Express Bus)", oneWayPriceKrw: 22800, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", isDefault: true, optionType: "DIRECT", badgeTextKo: "직통우등", badgeTextEn: "Direct Bus" },
  ],
  "GANGNEUNG-YEOSU": [
    {
      mode: "TRANSFER",
      nameKo: "강릉역 ➔ 서울역 ➔ 여수엑스포역 (KTX 고속철도 환승)",
      nameEn: "Gangneung Stn ➔ Seoul ➔ Yeosu Expo (KTX via Seoul)",
      oneWayPriceKrw: 74800,
      durationTextKo: "5시간 00분",
      durationTextEn: "5h 00m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "강릉역", fromHubNameEn: "Gangneung Stn", toHubNameKo: "서울역", toHubNameEn: "Seoul Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX-이음 고속철도", transitNameEn: "KTX-Eum", fareKrw: 27600, durationTextKo: "1시간 57분", durationTextEn: "1h 57m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "서울/용산역", fromHubNameEn: "Seoul/Yongsan", toHubNameKo: "여수엑스포역", toHubNameEn: "Yeosu Expo", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 전라선", transitNameEn: "KTX Express", fareKrw: 47200, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "YEOSU-GANGNEUNG": [
    {
      mode: "TRANSFER",
      nameKo: "여수엑스포역 ➔ 서울역 ➔ 강릉역 (KTX 고속철도 환승)",
      nameEn: "Yeosu Expo ➔ Seoul ➔ Gangneung Stn (KTX via Seoul)",
      oneWayPriceKrw: 74800,
      durationTextKo: "5시간 00분",
      durationTextEn: "5h 00m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "여수엑스포역", fromHubNameEn: "Yeosu Expo", toHubNameKo: "서울/용산역", toHubNameEn: "Seoul/Yongsan", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 전라선", transitNameEn: "KTX Express", fareKrw: 47200, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "서울역", fromHubNameEn: "Seoul Stn", toHubNameKo: "강릉역", toHubNameEn: "Gangneung Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX-이음 고속철도", transitNameEn: "KTX-Eum", fareKrw: 27600, durationTextKo: "1시간 57분", durationTextEn: "1h 57m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "SUWON-SOKCHO": [
    { mode: "INTERCITY_BUS", nameKo: "수원버스터미널 ➔ 속초시외버스터미널 (버스타고 시외 우등)", nameEn: "Suwon Terminal ➔ Sokcho Terminal (Bustago Express Bus)", oneWayPriceKrw: 35400, durationTextKo: "3시간 30분", durationTextEn: "3h 30m", isDefault: true, optionType: "DIRECT" },
  ],
  "SOKCHO-SUWON": [
    { mode: "INTERCITY_BUS", nameKo: "속초시외버스터미널 ➔ 수원버스터미널 (버스타고 시외 우등)", nameEn: "Sokcho Terminal ➔ Suwon Terminal (Bustago Express Bus)", oneWayPriceKrw: 35400, durationTextKo: "3시간 30분", durationTextEn: "3h 30m", isDefault: true, optionType: "DIRECT" },
  ],
  "SUWON-YEOSU": [
    {
      mode: "TRANSFER",
      nameKo: "수원 ➔ 천안아산 ➔ 여수엑스포역 (1호선 + KTX 환승)",
      nameEn: "Suwon ➔ Cheonan-Asan ➔ Yeosu (Line 1 + KTX)",
      oneWayPriceKrw: 37950,
      durationTextKo: "3시간 27분",
      durationTextEn: "3h 27m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "최적환승",
      badgeTextEn: "Best Transfer",
      legs: [
        { legOrder: 1, fromHubNameKo: "수원역", fromHubNameEn: "Suwon Stn", toHubNameKo: "천안아산역", toHubNameEn: "Cheonan-Asan Stn", mode: "SRT", modeIcon: "🚇", transitNameKo: "수도권 1호선 전철", transitNameEn: "Seoul Metro Line 1", fareKrw: 2750, durationTextKo: "1시간 04분", durationTextEn: "1h 04m", bookingPlatform: "TMONEY", bookingUrl: "https://txbus.t-money.co.kr" },
        { legOrder: 2, fromHubNameKo: "천안아산역", fromHubNameEn: "Cheonan-Asan Stn", toHubNameKo: "여수엑스포역", toHubNameEn: "Yeosu Expo", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 전라선", transitNameEn: "KTX Express", fareKrw: 35200, durationTextKo: "2시간 23분", durationTextEn: "2h 23m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],
  "YEOSU-SUWON": [
    {
      mode: "TRANSFER",
      nameKo: "여수엑스포역 ➔ 천안아산 ➔ 수원 (KTX + 1호선 환승)",
      nameEn: "Yeosu ➔ Cheonan-Asan ➔ Suwon (KTX + Line 1)",
      oneWayPriceKrw: 37950,
      durationTextKo: "3시간 27분",
      durationTextEn: "3h 27m",
      isDefault: true,
      optionType: "FASTEST",
      badgeTextKo: "최적환승",
      badgeTextEn: "Best Transfer",
      legs: [
        { legOrder: 1, fromHubNameKo: "여수엑스포역", fromHubNameEn: "Yeosu Expo", toHubNameKo: "천안아산역", toHubNameEn: "Cheonan-Asan Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 전라선", transitNameEn: "KTX Express", fareKrw: 35200, durationTextKo: "2시간 23분", durationTextEn: "2h 23m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "천안아산역", fromHubNameEn: "Cheonan-Asan Stn", toHubNameKo: "수원역", toHubNameEn: "Suwon Stn", mode: "SRT", modeIcon: "🚇", transitNameKo: "수도권 1호선 전철", transitNameEn: "Seoul Metro Line 1", fareKrw: 2750, durationTextKo: "1시간 04분", durationTextEn: "1h 04m", bookingPlatform: "TMONEY", bookingUrl: "https://txbus.t-money.co.kr" },
      ]
    }
  ],
  "YEOSU-SOKCHO": [
    {
      mode: "TRANSFER",
      nameKo: "여수 ➔ 서울(KTX) ➔ 속초(고속버스)",
      nameEn: "Yeosu ➔ Seoul(KTX) ➔ Sokcho(Bus)",
      oneWayPriceKrw: 69500,
      durationTextKo: "5시간 30분",
      durationTextEn: "5h 30m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "여수엑스포역", fromHubNameEn: "Yeosu Expo", toHubNameKo: "용산/서울역", toHubNameEn: "Seoul Stn", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 전라선", transitNameEn: "KTX Express", fareKrw: 47200, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
        { legOrder: 2, fromHubNameKo: "서울경부터미널", fromHubNameEn: "Seoul Terminal", toHubNameKo: "속초고속터미널", toHubNameEn: "Sokcho Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "우등 고속버스", transitNameEn: "Express Bus", fareKrw: 22300, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", bookingPlatform: "KOBUS", bookingUrl: "https://www.kobus.co.kr" },
      ]
    }
  ],
  "SOKCHO-YEOSU": [
    {
      mode: "TRANSFER",
      nameKo: "속초 ➔ 서울(고속버스) ➔ 여수(KTX)",
      nameEn: "Sokcho ➔ Seoul(Bus) ➔ Yeosu(KTX)",
      oneWayPriceKrw: 69500,
      durationTextKo: "5시간 30분",
      durationTextEn: "5h 30m",
      isDefault: true,
      optionType: "FASTEST",
      legs: [
        { legOrder: 1, fromHubNameKo: "속초고속터미널", fromHubNameEn: "Sokcho Terminal", toHubNameKo: "서울경부터미널", toHubNameEn: "Seoul Terminal", mode: "EXPRESS_BUS", modeIcon: "🚌", transitNameKo: "우등 고속버스", transitNameEn: "Express Bus", fareKrw: 22300, durationTextKo: "2시간 20분", durationTextEn: "2h 20m", bookingPlatform: "KOBUS", bookingUrl: "https://www.kobus.co.kr" },
        { legOrder: 2, fromHubNameKo: "용산/서울역", fromHubNameEn: "Seoul Stn", toHubNameKo: "여수엑스포역", toHubNameEn: "Yeosu Expo", mode: "KTX", modeIcon: "🚄", transitNameKo: "KTX 전라선", transitNameEn: "KTX Express", fareKrw: 47200, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", bookingPlatform: "KORAIL", bookingUrl: "https://www.letskorail.com" },
      ]
    }
  ],

  // =========================================================================
  // 5. 인천공항(INCHEON) 입국 및 출국 게이트웨이
  // =========================================================================
  "INCHEON-SEOUL": [
    { mode: "KTX", nameKo: "인천공항 ➔ 서울역 (AREX 직통열차 논스톱)", nameEn: "Incheon Airport ➔ Seoul Stn (AREX Non-stop)", oneWayPriceKrw: 13000, durationTextKo: "43분", durationTextEn: "43m", isDefault: true, badgeTextKo: "논스톱 직행", badgeTextEn: "Non-stop" },
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 도심/호텔 (공항 리무진 6000번대)", nameEn: "Incheon Airport ➔ Hotels (Limousine Bus 6000)", oneWayPriceKrw: 17000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", badgeTextKo: "호텔문앞", badgeTextEn: "Hotel Door" },
  ],
  "INCHEON-SUWON": [
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 수원역/영통 (공항 리무진 4100번 직통)", nameEn: "Incheon Airport ➔ Suwon/Yeongtong (Limousine 4100)", oneWayPriceKrw: 15000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "직통추천", badgeTextEn: "Direct Bus" },
    { mode: "KTX", nameKo: "인천공항 ➔ 서울역 ➔ 수원역 (AREX + KTX/지하철)", nameEn: "Incheon Airport ➔ Seoul ➔ Suwon (AREX + Train)", oneWayPriceKrw: 14850, durationTextKo: "1시간 20분", durationTextEn: "1h 20m", badgeTextKo: "철도연계", badgeTextEn: "Rail Link" },
  ],
  "INCHEON-JEONJU": [
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 전주시외터미널 (전북혁신도시 경유 시외버스)", nameEn: "Incheon Airport ➔ Jeonju (via Innovation City)", oneWayPriceKrw: 30700, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", isDefault: true, badgeTextKo: "시외직통", badgeTextEn: "Direct Bus" },
    { mode: "KTX", nameKo: "인천공항 ➔ 서울/용산역 ➔ 전주역 (AREX + KTX 고속철도)", nameEn: "Incheon Airport ➔ Seoul/Yongsan ➔ Jeonju (AREX + KTX)", oneWayPriceKrw: 47400, durationTextKo: "2시간 40분", durationTextEn: "2h 40m", badgeTextKo: "빠른도착", badgeTextEn: "Fastest" },
  ],
  "INCHEON-BUSAN": [
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 부산해운대 (직행 우등 고속버스)", nameEn: "Incheon Airport ➔ Busan Haeundae (Direct Express)", oneWayPriceKrw: 53500, durationTextKo: "5시간 30분", durationTextEn: "5h 30m", isDefault: true, badgeTextKo: "해운대직행", badgeTextEn: "Haeundae Direct" },
    { mode: "KTX", nameKo: "인천공항 ➔ 서울역 ➔ 부산역 (AREX + KTX 고속철도)", nameEn: "Incheon Airport ➔ Seoul Stn ➔ Busan (AREX + KTX)", oneWayPriceKrw: 72800, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", badgeTextKo: "추천 1위", badgeTextEn: "Best Choice" },
  ],
  "INCHEON-GANGNEUNG": [
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 강릉시외터미널 (직행 시외 우등버스)", nameEn: "Incheon Airport ➔ Gangneung (Direct Intercity Bus)", oneWayPriceKrw: 37600, durationTextKo: "3시간 30분", durationTextEn: "3h 30m", isDefault: true, badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
    { mode: "KTX", nameKo: "인천공항 ➔ 서울역 ➔ 강릉역 (AREX + KTX-이음 고속철도)", nameEn: "Incheon Airport ➔ Seoul Stn ➔ Gangneung (AREX + KTX-Eum)", oneWayPriceKrw: 40600, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
  ],
  "INCHEON-GYEONGJU": [
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 경주시외터미널 (포항행 직행 우등버스)", nameEn: "Incheon Airport ➔ Gyeongju (via Pohang Route)", oneWayPriceKrw: 50300, durationTextKo: "4시간 30분", durationTextEn: "4h 30m", isDefault: true, badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
    { mode: "KTX", nameKo: "인천공항 ➔ 서울역 ➔ 신경주역 (AREX + KTX 고속철도)", nameEn: "Incheon Airport ➔ Seoul Stn ➔ Gyeongju (AREX + KTX)", oneWayPriceKrw: 62300, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", badgeTextKo: "추천 1위", badgeTextEn: "Best Choice" },
  ],
  "INCHEON-YEOSU": [
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 여수종합터미널 (직행 우등 고속버스)", nameEn: "Incheon Airport ➔ Yeosu (Direct Express Bus)", oneWayPriceKrw: 50000, durationTextKo: "4시간 40분", durationTextEn: "4h 40m", isDefault: true, badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
    { mode: "KTX", nameKo: "인천공항 ➔ 용산역 ➔ 여수엑스포역 (AREX + KTX 고속철도)", nameEn: "Incheon Airport ➔ Yongsan Stn ➔ Yeosu (AREX + KTX)", oneWayPriceKrw: 60200, durationTextKo: "3시간 50분", durationTextEn: "3h 50m", badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
  ],
  "INCHEON-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "인천공항 ➔ 속초시외터미널 (직행 시외버스)", nameEn: "Incheon Airport ➔ Sokcho (Direct Intercity Bus)", oneWayPriceKrw: 36400, durationTextKo: "3시간 10분", durationTextEn: "3h 10m", isDefault: true, badgeTextKo: "직통버스", badgeTextEn: "Direct Bus" },
  ],
  "INCHEON-INCHEON": [
    {
      mode: "SRT",
      nameKo: "인천공항 ➔ 인천 시내/송도 (공항철도/시내버스 303번)",
      nameEn: "Incheon Airport ➔ Incheon City / Songdo (AREX Local / Bus 303)",
      oneWayPriceKrw: 3500,
      durationTextKo: "35분",
      durationTextEn: "35m",
      isDefault: true,
      badgeTextKo: "대중교통",
      badgeTextEn: "Transit",
    },
    {
      mode: "EXPRESS_BUS",
      nameKo: "인천공항 ➔ 송도국제도시 (공항 리무진 6777번 직통)",
      nameEn: "Incheon Airport ➔ Songdo (Limousine Bus 6777)",
      oneWayPriceKrw: 7000,
      durationTextKo: "25분",
      durationTextEn: "25m",
      badgeTextKo: "송도직통",
      badgeTextEn: "Songdo Direct",
    },
  ],

  // 출국
  "SEOUL-INCHEON": [
    { mode: "KTX", nameKo: "서울역 ➔ 인천공항 (AREX 직통열차 논스톱)", nameEn: "Seoul Stn ➔ Incheon Airport (AREX Non-stop)", oneWayPriceKrw: 13000, durationTextKo: "43분", durationTextEn: "43m", isDefault: true, badgeTextKo: "논스톱 직행", badgeTextEn: "Non-stop" },
    { mode: "EXPRESS_BUS", nameKo: "도심/호텔 ➔ 인천공항 (공항 리무진 6000번대)", nameEn: "Hotels ➔ Incheon Airport (Limousine Bus 6000)", oneWayPriceKrw: 17000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", badgeTextKo: "호텔문앞", badgeTextEn: "Hotel Door" },
  ],
  "SUWON-INCHEON": [
    { mode: "EXPRESS_BUS", nameKo: "수원역/영통 ➔ 인천공항 (공항 리무진 4100번 직통)", nameEn: "Suwon/Yeongtong ➔ Incheon Airport (Limousine 4100)", oneWayPriceKrw: 15000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "직통추천", badgeTextEn: "Direct Bus" },
    { mode: "KTX", nameKo: "수원역 ➔ 서울역 ➔ 인천공항 (KTX/지하철 + AREX)", nameEn: "Suwon ➔ Seoul ➔ Incheon Airport (Train + AREX)", oneWayPriceKrw: 14850, durationTextKo: "1시간 20분", durationTextEn: "1h 20m", badgeTextKo: "철도연계", badgeTextEn: "Rail Link" },
  ],
  "JEONJU-INCHEON": [
    { mode: "EXPRESS_BUS", nameKo: "전주시외터미널 ➔ 인천공항 (전북혁신도시 경유 시외버스)", nameEn: "Jeonju ➔ Incheon Airport (via Innovation City)", oneWayPriceKrw: 30700, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", isDefault: true, badgeTextKo: "시외직통", badgeTextEn: "Direct Bus" },
    { mode: "KTX", nameKo: "전주역 ➔ 용산/서울역 ➔ 인천공항 (KTX 고속철도 + AREX)", nameEn: "Jeonju ➔ Yongsan/Seoul ➔ Incheon Airport (KTX + AREX)", oneWayPriceKrw: 47400, durationTextKo: "2시간 40분", durationTextEn: "2h 40m", badgeTextKo: "빠른도착", badgeTextEn: "Fastest" },
  ],
  "BUSAN-INCHEON": [
    { mode: "EXPRESS_BUS", nameKo: "부산해운대 ➔ 인천공항 (직행 우등 고속버스)", nameEn: "Busan Haeundae ➔ Incheon Airport (Direct Express)", oneWayPriceKrw: 53500, durationTextKo: "5시간 30분", durationTextEn: "5h 30m", isDefault: true, badgeTextKo: "해운대직행", badgeTextEn: "Haeundae Direct" },
    { mode: "KTX", nameKo: "부산역 ➔ 서울역 ➔ 인천공항 (KTX 고속철도 + AREX)", nameEn: "Busan ➔ Seoul Stn ➔ Incheon Airport (KTX + AREX)", oneWayPriceKrw: 72800, durationTextKo: "3시간 20분", durationTextEn: "3h 20m", badgeTextKo: "추천 1위", badgeTextEn: "Best Choice" },
  ],
  "GANGNEUNG-INCHEON": [
    { mode: "EXPRESS_BUS", nameKo: "강릉시외터미널 ➔ 인천공항 (직행 시외 우등버스)", nameEn: "Gangneung ➔ Incheon Airport (Direct Intercity Bus)", oneWayPriceKrw: 37600, durationTextKo: "3시간 30분", durationTextEn: "3h 30m", isDefault: true, badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
    { mode: "KTX", nameKo: "강릉역 ➔ 서울역 ➔ 인천공항 (KTX-이음 고속철도 + AREX)", nameEn: "Gangneung ➔ Seoul Stn ➔ Incheon Airport (KTX-Eum + AREX)", oneWayPriceKrw: 40600, durationTextKo: "2시간 50분", durationTextEn: "2h 50m", badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
  ],
  "GYEONGJU-INCHEON": [
    { mode: "EXPRESS_BUS", nameKo: "경주시외터미널 ➔ 인천공항 (포항행 직행 우등버스)", nameEn: "Gyeongju ➔ Incheon Airport (via Pohang Route)", oneWayPriceKrw: 50300, durationTextKo: "4시간 30분", durationTextEn: "4h 30m", isDefault: true, badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
    { mode: "KTX", nameKo: "신경주역 ➔ 서울역 ➔ 인천공항 (KTX 고속철도 + AREX)", nameEn: "Gyeongju ➔ Seoul Stn ➔ Incheon Airport (KTX + AREX)", oneWayPriceKrw: 62300, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", badgeTextKo: "추천 1위", badgeTextEn: "Best Choice" },
  ],
  "YEOSU-INCHEON": [
    { mode: "EXPRESS_BUS", nameKo: "여수종합터미널 ➔ 인천공항 (직행 우등 고속버스)", nameEn: "Yeosu ➔ Incheon Airport (Direct Express Bus)", oneWayPriceKrw: 50000, durationTextKo: "4시간 40분", durationTextEn: "4h 40m", isDefault: true, badgeTextKo: "환승없음", badgeTextEn: "Non-stop" },
    { mode: "KTX", nameKo: "여수엑스포역 ➔ 용산역 ➔ 인천공항 (KTX 고속철도 + AREX)", nameEn: "Yeosu ➔ Yongsan Stn ➔ Incheon Airport (KTX + AREX)", oneWayPriceKrw: 60200, durationTextKo: "3시간 50분", durationTextEn: "3h 50m", badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
  ],
  "SOKCHO-INCHEON": [
    { mode: "EXPRESS_BUS", nameKo: "속초시외터미널 ➔ 인천공항 (직행 시외버스)", nameEn: "Sokcho ➔ Incheon Airport (Direct Intercity Bus)", oneWayPriceKrw: 36400, durationTextKo: "3시간 10분", durationTextEn: "3h 10m", isDefault: true, badgeTextKo: "직통버스", badgeTextEn: "Direct Bus" },
  ],
};

/**
 * 두 도시 간의 요금 옵션 목록을 반환합니다. (직통 1개 또는 환승 2-Way)
 */
export function getIntercityFareOptions(from: SupportedCity | "INCHEON", to: SupportedCity | "INCHEON"): IntercityFareInfo[] {
  const directKey = `${from}-${to}`;
  if (INTERCITY_FARE_TABLE[directKey]) {
    return INTERCITY_FARE_TABLE[directKey];
  }

  const reverseKey = `${to}-${from}`;
  if (INTERCITY_FARE_TABLE[reverseKey]) {
    return INTERCITY_FARE_TABLE[reverseKey].map((opt) => ({
      ...opt,
      nameKo: `${from} ➔ ${to} (${opt.mode === "KTX" ? "KTX 고속철도" : opt.mode === "FLIGHT" ? "국내선 항공" : opt.mode === "INTERCITY_BUS" ? "시외버스" : "고속버스"})`,
      nameEn: `${from} ➔ ${to} (${opt.mode === "KTX" ? "KTX Express" : opt.mode === "FLIGHT" ? "Flight" : opt.mode === "INTERCITY_BUS" ? "Intercity Bus" : "Express Bus"})`,
    }));
  }

  // 폴백
  return [
    { mode: "KTX", nameKo: `${from} ➔ ${to} (KTX 고속철도)`, nameEn: `${from} ➔ ${to} (KTX Express Rail)`, oneWayPriceKrw: 38000, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true, optionType: "DIRECT" },
  ];
}

export const AIRPORT_INFO_MAP: Record<string, { nameKo: string; nameEn: string; code: string }> = {
  INCHEON: { nameKo: "인천국제공항", nameEn: "Incheon Int'l Airport", code: "ICN" },
  GIMPO: { nameKo: "김포국제공항", nameEn: "Gimpo Int'l Airport", code: "GMP" },
  GIMHAE: { nameKo: "김해국제공항 (부산)", nameEn: "Gimhae Int'l Airport (Busan)", code: "PUS" },
  JEJU_AIRPORT: { nameKo: "제주국제공항", nameEn: "Jeju Int'l Airport", code: "CJU" },
};

/**
 * 주요 게이트웨이 공항에서 목적지 도시로(입국), 또는 목적지 도시에서 공항으로(출국)의 공항 이동 옵션을 반환합니다.
 */
export function getAirportTransitOptions(
  airportCode: "INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT" = "INCHEON",
  targetCity: SupportedCity,
  direction: "ENTRY" | "EXIT" = "ENTRY"
): IntercityFareInfo[] {
  if (airportCode === "INCHEON") {
    return direction === "ENTRY"
      ? getIntercityFareOptions("INCHEON", targetCity)
      : getIntercityFareOptions(targetCity, "INCHEON");
  }

  if (airportCode === "GIMPO") {
    if (targetCity === "SEOUL") {
      return direction === "ENTRY"
        ? [
            { mode: "SRT", nameKo: "김포공항 ➔ 서울 도심 (지하철 5·9호선/공항철도 일반)", nameEn: "Gimpo Airport ➔ Seoul (Subway 5/9/AREX Local)", oneWayPriceKrw: 1600, durationTextKo: "25분", durationTextEn: "25m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "김포공항 ➔ 도심/호텔 (공항 리무진 6000번대)", nameEn: "Gimpo Airport ➔ Hotels (Limousine 6000)", oneWayPriceKrw: 9000, durationTextKo: "40분", durationTextEn: "40m" },
          ]
        : [
            { mode: "SRT", nameKo: "서울 도심 ➔ 김포공항 (지하철 5·9호선/공항철도 일반)", nameEn: "Seoul ➔ Gimpo Airport (Subway 5/9/AREX Local)", oneWayPriceKrw: 1600, durationTextKo: "25분", durationTextEn: "25m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "도심/호텔 ➔ 김포공항 (공항 리무진 6000번대)", nameEn: "Hotels ➔ Gimpo Airport (Limousine 6000)", oneWayPriceKrw: 9000, durationTextKo: "40분", durationTextEn: "40m" },
          ];
    }
    if (targetCity === "SUWON") {
      return direction === "ENTRY"
        ? [{ mode: "EXPRESS_BUS", nameKo: "김포공항 ➔ 수원역/수원터미널/영통 (공항 리무진 4300번 직통)", nameEn: "Gimpo Airport ➔ Suwon (Limousine 4300)", oneWayPriceKrw: 9500, durationTextKo: "50분", durationTextEn: "50m", isDefault: true }]
        : [{ mode: "EXPRESS_BUS", nameKo: "수원역/수원터미널/영통 ➔ 김포공항 (공항 리무진 4300번 직통)", nameEn: "Suwon ➔ Gimpo Airport (Limousine 4300)", oneWayPriceKrw: 9500, durationTextKo: "50분", durationTextEn: "50m", isDefault: true }];
    }
    if (targetCity === "JEJU") {
      return direction === "ENTRY"
        ? [{ mode: "FLIGHT", nameKo: "김포공항 ➔ 제주공항 (국내선 항공)", nameEn: "Gimpo Airport ➔ Jeju (Flight)", oneWayPriceKrw: 95000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }]
        : [{ mode: "FLIGHT", nameKo: "제주공항 ➔ 김포공항 (국내선 항공)", nameEn: "Jeju ➔ Gimpo Airport (Flight)", oneWayPriceKrw: 95000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }];
    }
    if (targetCity === "BUSAN") {
      return direction === "ENTRY"
        ? [{ mode: "FLIGHT", nameKo: "김포공항 ➔ 김해공항 (국내선 항공)", nameEn: "Gimpo Airport ➔ Gimhae Airport (Flight)", oneWayPriceKrw: 78000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true }]
        : [{ mode: "FLIGHT", nameKo: "김해공항 ➔ 김포공항 (국내선 항공)", nameEn: "Gimhae Airport ➔ Gimpo Airport (Flight)", oneWayPriceKrw: 78000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true }];
    }
    return direction === "ENTRY"
      ? [{ mode: "KTX", nameKo: `김포공항 ➔ 서울역 ➔ ${targetCity} (공항철도 + KTX)`, nameEn: `Gimpo ➔ Seoul ➔ ${targetCity} (AREX + KTX)`, oneWayPriceKrw: 42000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true }]
      : [{ mode: "KTX", nameKo: `${targetCity} ➔ 서울역 ➔ 김포공항 (KTX + 공항철도)`, nameEn: `${targetCity} ➔ Seoul ➔ Gimpo (KTX + AREX)`, oneWayPriceKrw: 42000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true }];
  }

  if (airportCode === "GIMHAE") {
    if (targetCity === "BUSAN") {
      return direction === "ENTRY"
        ? [
            { mode: "SRT", nameKo: "김해공항 ➔ 부산 도심 (김해경전철 + 부산지하철)", nameEn: "Gimhae Airport ➔ Busan (Light Rail + Metro)", oneWayPriceKrw: 2100, durationTextKo: "45분", durationTextEn: "45m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "김해공항 ➔ 해운대/서면 (공항 리무진 버스)", nameEn: "Gimhae Airport ➔ Haeundae (Limousine Bus)", oneWayPriceKrw: 8500, durationTextKo: "1시간 00분", durationTextEn: "1h 00m" },
          ]
        : [
            { mode: "SRT", nameKo: "부산 도심 ➔ 김해공항 (부산지하철 + 김해경전철)", nameEn: "Busan ➔ Gimhae Airport (Metro + Light Rail)", oneWayPriceKrw: 2100, durationTextKo: "45분", durationTextEn: "45m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "해운대/서면 ➔ 김해공항 (공항 리무진 버스)", nameEn: "Haeundae ➔ Gimhae Airport (Limousine Bus)", oneWayPriceKrw: 8500, durationTextKo: "1시간 00분", durationTextEn: "1h 00m" },
          ];
    }
    if (targetCity === "GYEONGJU") {
      return direction === "ENTRY"
        ? [{ mode: "EXPRESS_BUS", nameKo: "김해공항 ➔ 경주시외터미널 (직행 공항리무진 금아)", nameEn: "Gimhae Airport ➔ Gyeongju (Direct Limousine)", oneWayPriceKrw: 9500, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }]
        : [{ mode: "EXPRESS_BUS", nameKo: "경주시외터미널 ➔ 김해공항 (직행 공항리무진 금아)", nameEn: "Gyeongju ➔ Gimhae Airport (Direct Limousine)", oneWayPriceKrw: 9500, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }];
    }
    if (targetCity === "JEJU") {
      return direction === "ENTRY"
        ? [{ mode: "FLIGHT", nameKo: "김해공항 ➔ 제주공항 (국내선 항공)", nameEn: "Gimhae Airport ➔ Jeju (Flight)", oneWayPriceKrw: 92000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true }]
        : [{ mode: "FLIGHT", nameKo: "제주공항 ➔ 김해공항 (국내선 항공)", nameEn: "Jeju ➔ Gimhae Airport (Flight)", oneWayPriceKrw: 92000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true }];
    }
  }

  if (airportCode === "JEJU_AIRPORT") {
    if (targetCity === "JEJU") {
      return direction === "ENTRY"
        ? [
            { mode: "SRT", nameKo: "제주공항 ➔ 제주시내 (급행/간선 시내버스)", nameEn: "Jeju Airport ➔ Jeju City (Express Bus)", oneWayPriceKrw: 1500, durationTextKo: "25분", durationTextEn: "25m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "제주공항 ➔ 중문/서귀포 (공항 리무진 600번)", nameEn: "Jeju Airport ➔ Jungmun (Limousine 600)", oneWayPriceKrw: 5500, durationTextKo: "50분", durationTextEn: "50m" },
          ]
        : [
            { mode: "SRT", nameKo: "제주시내 ➔ 제주공항 (급행/간선 시내버스)", nameEn: "Jeju City ➔ Jeju Airport (Express Bus)", oneWayPriceKrw: 1500, durationTextKo: "25분", durationTextEn: "25m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "중문/서귀포 ➔ 제주공항 (공항 리무진 600번)", nameEn: "Jungmun ➔ Jeju Airport (Limousine 600)", oneWayPriceKrw: 5500, durationTextKo: "50분", durationTextEn: "50m" },
          ];
    }
  }

  return direction === "ENTRY"
    ? getIntercityFareOptions("INCHEON", targetCity)
    : getIntercityFareOptions(targetCity, "INCHEON");
}
