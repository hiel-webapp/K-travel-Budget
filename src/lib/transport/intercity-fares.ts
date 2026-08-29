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
}

/**
 * 대한민국 10대 도시 및 13개 국내선 공항 연계 도시 간 교통 테이블
 * - 직통 노선: 1개 단일 추천
 * - 직통 부재 환승 구간: 2-Way 옵션 ([⚡ 최단시간] vs [💰 가성비/편의])
 * - 제주도: 13개 국내선 공항 기반 지상+항공 연계
 */
export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo[]> = {
  "SEOUL-BUSAN": [
    {
      "mode": "KTX",
      "nameKo": "서울역 ➔ 부산역 (KTX 고속철도)",
      "nameEn": "Seoul Stn ➔ Busan Stn (KTX Express)",
      "oneWayPriceKrw": 59800,
      "durationTextKo": "2시간 37분",
      "durationTextEn": "2h 37m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "BUSAN-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "부산역 ➔ 서울역 (KTX 고속철도)",
      "nameEn": "Busan Stn ➔ Seoul Stn (KTX Express)",
      "oneWayPriceKrw": 59800,
      "durationTextKo": "2시간 37분",
      "durationTextEn": "2h 37m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SEOUL-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "김포공항 ➔ 제주공항 (국내선 항공 직항)",
      "nameEn": "Gimpo Airport ➔ Jeju Airport (Flight)",
      "oneWayPriceKrw": 75000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "JEJU-SEOUL": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김포공항 (국내선 항공 직항)",
      "nameEn": "Jeju Airport ➔ Gimpo Airport (Flight)",
      "oneWayPriceKrw": 75000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SEOUL-JEONJU": [
    {
      "mode": "KTX",
      "nameKo": "용산역 ➔ 전주역 (KTX 고속철도)",
      "nameEn": "Yongsan Stn ➔ Jeonju Stn (KTX Express)",
      "oneWayPriceKrw": 23700,
      "durationTextKo": "59분",
      "durationTextEn": "59m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "JEONJU-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "전주역 ➔ 용산역 (KTX 고속철도)",
      "nameEn": "Jeonju Stn ➔ Yongsan Stn (KTX Express)",
      "oneWayPriceKrw": 34600,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SEOUL-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "서울역 ➔ 신경주역 (KTX 고속철도)",
      "nameEn": "Seoul Stn ➔ Singyeongju Stn (KTX Express)",
      "oneWayPriceKrw": 49300,
      "durationTextKo": "2시간 2분",
      "durationTextEn": "2h 2m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GYEONGJU-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "신경주역 ➔ 서울역 (KTX 고속철도)",
      "nameEn": "Singyeongju Stn ➔ Seoul Stn (KTX Express)",
      "oneWayPriceKrw": 49300,
      "durationTextKo": "2시간 02분",
      "durationTextEn": "2h 02m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SEOUL-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "서울/청량리역 ➔ 강릉역 (KTX-이음)",
      "nameEn": "Seoul/Cheongnyangni ➔ Gangneung (KTX-Eum)",
      "oneWayPriceKrw": 27600,
      "durationTextKo": "1시간 57분",
      "durationTextEn": "1h 57m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GANGNEUNG-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "강릉역 ➔ 서울/청량리역 (KTX-이음)",
      "nameEn": "Gangneung ➔ Seoul/Cheongnyangni (KTX-Eum)",
      "oneWayPriceKrw": 27600,
      "durationTextKo": "1시간 57분",
      "durationTextEn": "1h 57m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SEOUL-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "용산역 ➔ 여수엑스포역 (KTX 고속철도)",
      "nameEn": "Yongsan Stn ➔ Yeosu Expo Stn (KTX Express)",
      "oneWayPriceKrw": 47200,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "YEOSU-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "여수엑스포역 ➔ 용산역 (KTX 고속철도)",
      "nameEn": "Yeosu Expo Stn ➔ Yongsan Stn (KTX Express)",
      "oneWayPriceKrw": 47200,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SEOUL-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "서울역 ➔ 수원역 (KTX / ITX-새마을)",
      "nameEn": "Seoul Stn ➔ Suwon Stn (KTX / Train)",
      "oneWayPriceKrw": 8400,
      "durationTextKo": "30분",
      "durationTextEn": "30m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SUWON-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "수원역 ➔ 서울역 (KTX / ITX-새마을)",
      "nameEn": "Suwon Stn ➔ Seoul Stn (KTX / Train)",
      "oneWayPriceKrw": 8400,
      "durationTextKo": "30분",
      "durationTextEn": "30m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SEOUL-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "서울경부터미널 ➔ 속초고속터미널 (우등 고속버스)",
      "nameEn": "Seoul Terminal ➔ Sokcho Terminal (Express Bus)",
      "oneWayPriceKrw": 22300,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SOKCHO-SEOUL": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초고속터미널 ➔ 서울경부터미널 (우등 고속버스)",
      "nameEn": "Sokcho Terminal ➔ Seoul Terminal (Express Bus)",
      "oneWayPriceKrw": 22300,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "JEJU-SUWON": [
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 수원 (국내선 항공 + 리무진 4300번)",
      "nameEn": "Jeju ➔ Gimpo Airport ➔ Suwon (Flight + Bus 4300)",
      "oneWayPriceKrw": 83000,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "직통리무진",
      "badgeTextEn": "Direct Limousine",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "김포국제공항",
          "toHubNameEn": "Gimpo Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔김포)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 75000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "김포국제공항",
          "fromHubNameEn": "Gimpo Airport",
          "toHubNameKo": "수원버스터미널",
          "toHubNameEn": "Suwon Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "공항 리무진 버스 (4300번 직통)",
          "transitNameEn": "Airport Limousine (4300)",
          "fareKrw": 8000,
          "durationTextKo": "50분",
          "durationTextEn": "50m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        }
      ]
    },
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 청주공항 ➔ 수원 (국내선 항공 + 시외버스/기차)",
      "nameEn": "Jeju ➔ Cheongju Airport ➔ Suwon (Flight + Train/Bus)",
      "oneWayPriceKrw": 78000,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "optionType": "BUDGET",
      "badgeTextKo": "충청경유",
      "badgeTextEn": "Via Cheongju",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "청주국제공항",
          "toHubNameEn": "Cheongju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔청주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 68000,
          "durationTextKo": "1시간 00분",
          "durationTextEn": "1h 00m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "청주국제공항",
          "fromHubNameEn": "Cheongju Airport",
          "toHubNameKo": "수원역/터미널",
          "toHubNameEn": "Suwon Stn/Terminal",
          "mode": "INTERCITY_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "시외버스 / 충북선 열차",
          "transitNameEn": "Intercity Bus / Train",
          "fareKrw": 10000,
          "durationTextKo": "1시간 20분",
          "durationTextEn": "1h 20m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        }
      ]
    }
  ],
  "SUWON-JEJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "수원 ➔ 김포공항 ➔ 제주공항 (리무진 4300번 + 국내선 항공)",
      "nameEn": "Suwon ➔ Gimpo Airport ➔ Jeju (Bus 4300 + Flight)",
      "oneWayPriceKrw": 83000,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "직통리무진",
      "badgeTextEn": "Direct Limousine",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "수원버스터미널",
          "fromHubNameEn": "Suwon Terminal",
          "toHubNameKo": "김포국제공항",
          "toHubNameEn": "Gimpo Airport",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "공항 리무진 버스 (4300번 직통)",
          "transitNameEn": "Airport Limousine (4300)",
          "fareKrw": 8000,
          "durationTextKo": "50분",
          "durationTextEn": "50m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "김포국제공항",
          "fromHubNameEn": "Gimpo Airport",
          "toHubNameKo": "제주국제공항",
          "toHubNameEn": "Jeju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (김포➔제주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 75000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        }
      ]
    }
  ],
  "JEJU-BUSAN": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김해공항 (국내선 항공 직항)",
      "nameEn": "Jeju Airport ➔ Gimhae Airport (Direct Flight)",
      "oneWayPriceKrw": 65000,
      "durationTextKo": "1시간 00분",
      "durationTextEn": "1h 00m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "BUSAN-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "김해공항 ➔ 제주공항 (국내선 항공 직항)",
      "nameEn": "Gimhae Airport ➔ Jeju Airport (Direct Flight)",
      "oneWayPriceKrw": 65000,
      "durationTextKo": "1시간 00분",
      "durationTextEn": "1h 00m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "JEJU-JEONJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 군산공항 ➔ 전주 (국내선 항공 + 시외 직통버스)",
      "nameEn": "Jeju ➔ Gunsan Airport ➔ Jeonju (Flight + Intercity Bus)",
      "oneWayPriceKrw": 72000,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "전북직결",
      "badgeTextEn": "Direct Link",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "군산공항",
          "toHubNameEn": "Gunsan Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔군산)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 65000,
          "durationTextKo": "1시간 00분",
          "durationTextEn": "1h 00m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "군산공항",
          "fromHubNameEn": "Gunsan Airport",
          "toHubNameKo": "전주시외터미널",
          "toHubNameEn": "Jeonju Terminal",
          "mode": "INTERCITY_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "군산공항 ➔ 전주 직통 시외버스",
          "transitNameEn": "Airport Direct Bus",
          "fareKrw": 7000,
          "durationTextKo": "40분",
          "durationTextEn": "40m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        }
      ]
    },
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 광주공항 ➔ 전주 (국내선 항공 + KTX/시외버스)",
      "nameEn": "Jeju ➔ Gwangju Airport ➔ Jeonju (Flight + KTX/Bus)",
      "oneWayPriceKrw": 74500,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "optionType": "COMFORT",
      "badgeTextKo": "배차다수",
      "badgeTextEn": "Frequent Flights",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "광주공항",
          "toHubNameEn": "Gwangju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔광주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 62000,
          "durationTextKo": "50분",
          "durationTextEn": "50m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "광주송정역",
          "fromHubNameEn": "Gwangju Songjeong",
          "toHubNameKo": "전주역",
          "toHubNameEn": "Jeonju Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 고속철도",
          "transitNameEn": "KTX Rail",
          "fareKrw": 12500,
          "durationTextKo": "40분",
          "durationTextEn": "40m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "JEONJU-JEJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "전주 ➔ 군산공항 ➔ 제주공항 (시외 직통버스 + 국내선 항공)",
      "nameEn": "Jeonju ➔ Gunsan Airport ➔ Jeju (Intercity Bus + Flight)",
      "oneWayPriceKrw": 72000,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "전북직결",
      "badgeTextEn": "Direct Link",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "전주시외터미널",
          "fromHubNameEn": "Jeonju Terminal",
          "toHubNameKo": "군산공항",
          "toHubNameEn": "Gunsan Airport",
          "mode": "INTERCITY_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "전주 ➔ 군산공항 직통 시외버스",
          "transitNameEn": "Airport Direct Bus",
          "fareKrw": 7000,
          "durationTextKo": "40분",
          "durationTextEn": "40m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "군산공항",
          "fromHubNameEn": "Gunsan Airport",
          "toHubNameKo": "제주국제공항",
          "toHubNameEn": "Jeju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (군산➔제주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 65000,
          "durationTextKo": "1시간 00분",
          "durationTextEn": "1h 00m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        }
      ]
    }
  ],
  "JEJU-GYEONGJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 김해공항 ➔ 경주 (국내선 항공 + 공항 리무진)",
      "nameEn": "Jeju ➔ Gimhae Airport ➔ Gyeongju (Flight + Limousine)",
      "oneWayPriceKrw": 76000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "배차풍부",
      "badgeTextEn": "Best Choice",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "김해국제공항",
          "toHubNameEn": "Gimhae Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔김해)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 65000,
          "durationTextKo": "1시간 00분",
          "durationTextEn": "1h 00m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "김해국제공항",
          "fromHubNameEn": "Gimhae Airport",
          "toHubNameKo": "경주시외터미널",
          "toHubNameEn": "Gyeongju Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "공항 직행 리무진 버스",
          "transitNameEn": "Airport Direct Bus",
          "fareKrw": 11000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        }
      ]
    },
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 포항경주공항 ➔ 경주 (국내선 항공 + 시내/시외버스)",
      "nameEn": "Jeju ➔ Pohang Gyeongju Airport ➔ Gyeongju (Flight + Bus)",
      "oneWayPriceKrw": 73000,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "optionType": "BUDGET",
      "badgeTextKo": "최단거리",
      "badgeTextEn": "Closest Airport",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "포항경주공항",
          "toHubNameEn": "Pohang Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔포항경주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 68000,
          "durationTextKo": "1시간 00분",
          "durationTextEn": "1h 00m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "포항경주공항",
          "fromHubNameEn": "Pohang Airport",
          "toHubNameKo": "경주보문단지/터미널",
          "toHubNameEn": "Gyeongju Terminal",
          "mode": "INTERCITY_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "경주 직행 버스",
          "transitNameEn": "Gyeongju Bus",
          "fareKrw": 5000,
          "durationTextKo": "40분",
          "durationTextEn": "40m",
          "bookingPlatform": "TMONEY",
          "bookingUrl": "https://txbus.t-money.co.kr"
        }
      ]
    }
  ],
  "GYEONGJU-JEJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "경주 ➔ 김해공항 ➔ 제주공항 (공항 리무진 + 국내선 항공)",
      "nameEn": "Gyeongju ➔ Gimhae Airport ➔ Jeju (Limousine + Flight)",
      "oneWayPriceKrw": 76000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 20m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "경주시외터미널",
          "fromHubNameEn": "Gyeongju Terminal",
          "toHubNameKo": "김해국제공항",
          "toHubNameEn": "Gimhae Airport",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "공항 직행 리무진 버스",
          "transitNameEn": "Airport Direct Bus",
          "fareKrw": 11000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "김해국제공항",
          "fromHubNameEn": "Gimhae Airport",
          "toHubNameKo": "제주국제공항",
          "toHubNameEn": "Jeju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (김해➔제주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 65000,
          "durationTextKo": "1시간 00분",
          "durationTextEn": "1h 00m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        }
      ]
    }
  ],
  "JEJU-GANGNEUNG": [
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 원주공항 ➔ 강릉 (국내선 항공 + 시외버스/KTX)",
      "nameEn": "Jeju ➔ Wonju Airport ➔ Gangneung (Flight + Bus/KTX)",
      "oneWayPriceKrw": 82000,
      "durationTextKo": "2시간 30분",
      "durationTextEn": "2h 30m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "강원도내공항",
      "badgeTextEn": "Wonju Link",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "원주공항(횡성)",
          "toHubNameEn": "Wonju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔원주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 70000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "원주공항/만종역",
          "fromHubNameEn": "Wonju/Manjong",
          "toHubNameKo": "강릉역/터미널",
          "toHubNameEn": "Gangneung Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX-이음 / 시외버스",
          "transitNameEn": "KTX / Bus",
          "fareKrw": 12000,
          "durationTextKo": "50분",
          "durationTextEn": "50m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    },
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 강릉역 (국내선 항공 + 서울역 KTX)",
      "nameEn": "Jeju ➔ Gimpo Airport ➔ Gangneung (Flight + KTX)",
      "oneWayPriceKrw": 102600,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "optionType": "COMFORT",
      "badgeTextKo": "정시성KTX",
      "badgeTextEn": "Via Seoul KTX",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "김포국제공항",
          "toHubNameEn": "Gimpo Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔김포)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 75000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "서울역/청량리역",
          "fromHubNameEn": "Seoul Stn",
          "toHubNameKo": "강릉역",
          "toHubNameEn": "Gangneung Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX-이음 고속철도",
          "transitNameEn": "KTX-Eum Rail",
          "fareKrw": 27600,
          "durationTextKo": "1시간 57분",
          "durationTextEn": "1h 57m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "GANGNEUNG-JEJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "강릉 ➔ 원주공항 ➔ 제주공항 (시외버스/KTX + 국내선 항공)",
      "nameEn": "Gangneung ➔ Wonju Airport ➔ Jeju (Bus/KTX + Flight)",
      "oneWayPriceKrw": 82000,
      "durationTextKo": "2시간 30분",
      "durationTextEn": "2h 30m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "강릉역/터미널",
          "fromHubNameEn": "Gangneung Stn",
          "toHubNameKo": "원주공항/만종역",
          "toHubNameEn": "Wonju/Manjong",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX-이음 / 시외버스",
          "transitNameEn": "KTX / Bus",
          "fareKrw": 12000,
          "durationTextKo": "50분",
          "durationTextEn": "50m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "원주공항(횡성)",
          "fromHubNameEn": "Wonju Airport",
          "toHubNameKo": "제주국제공항",
          "toHubNameEn": "Jeju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (원주➔제주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 70000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        }
      ]
    }
  ],
  "JEJU-YEOSU": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 여수공항 (국내선 항공 직항)",
      "nameEn": "Jeju Airport ➔ Yeosu Airport (Direct Flight)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "YEOSU-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "여수공항 ➔ 제주공항 (국내선 항공 직항)",
      "nameEn": "Yeosu Airport ➔ Jeju Airport (Direct Flight)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "JEJU-SOKCHO": [
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 양양공항/원주공항 ➔ 속초 (국내선 항공 + 시외버스)",
      "nameEn": "Jeju ➔ Yangyang/Wonju Airport ➔ Sokcho (Flight + Bus)",
      "oneWayPriceKrw": 85000,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "인근공항",
      "badgeTextEn": "Fastest Airport",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "양양국제공항/원주",
          "toHubNameEn": "Yangyang Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 75000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "양양터미널",
          "fromHubNameEn": "Yangyang Terminal",
          "toHubNameKo": "속초고속/시외터미널",
          "toHubNameEn": "Sokcho Terminal",
          "mode": "INTERCITY_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "동해안 시외버스",
          "transitNameEn": "Intercity Bus",
          "fareKrw": 10000,
          "durationTextKo": "30분",
          "durationTextEn": "30m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        }
      ]
    },
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 속초 (국내선 항공 + 우등 고속버스)",
      "nameEn": "Jeju ➔ Gimpo Airport ➔ Sokcho (Flight + Express Bus)",
      "oneWayPriceKrw": 98000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "optionType": "COMFORT",
      "badgeTextKo": "배차다수",
      "badgeTextEn": "Via Seoul",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "제주국제공항",
          "fromHubNameEn": "Jeju Airport",
          "toHubNameKo": "김포국제공항",
          "toHubNameEn": "Gimpo Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (제주➔김포)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 75000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "서울경부터미널",
          "fromHubNameEn": "Seoul Terminal",
          "toHubNameKo": "속초고속터미널",
          "toHubNameEn": "Sokcho Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "우등 고속버스",
          "transitNameEn": "Express Bus",
          "fareKrw": 22300,
          "durationTextKo": "2시간 20분",
          "durationTextEn": "2h 20m",
          "bookingPlatform": "KOBUS",
          "bookingUrl": "https://www.kobus.co.kr"
        }
      ]
    }
  ],
  "SOKCHO-JEJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "속초 ➔ 양양/원주공항 ➔ 제주공항 (시외버스 + 국내선 항공)",
      "nameEn": "Sokcho ➔ Airport ➔ Jeju (Bus + Flight)",
      "oneWayPriceKrw": 85000,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "속초고속/시외터미널",
          "fromHubNameEn": "Sokcho Terminal",
          "toHubNameKo": "양양국제공항/원주",
          "toHubNameEn": "Yangyang Airport",
          "mode": "INTERCITY_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "동해안 시외버스",
          "transitNameEn": "Intercity Bus",
          "fareKrw": 10000,
          "durationTextKo": "30분",
          "durationTextEn": "30m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "양양/원주공항",
          "fromHubNameEn": "Airport",
          "toHubNameKo": "제주국제공항",
          "toHubNameEn": "Jeju Airport",
          "mode": "FLIGHT",
          "modeIcon": "🛫",
          "transitNameKo": "국내선 항공 (공항➔제주)",
          "transitNameEn": "Domestic Flight",
          "fareKrw": 75000,
          "durationTextKo": "1시간 10분",
          "durationTextEn": "1h 10m",
          "bookingPlatform": "AIRLINE",
          "bookingUrl": "https://flight.naver.com"
        }
      ]
    }
  ],
  "JEJU-INCHEON": [
    {
      "mode": "TRANSFER",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 인천공항 (국내선 항공 + 공항철도)",
      "nameEn": "Jeju Airport ➔ Gimpo ➔ Incheon (Flight + AREX)",
      "oneWayPriceKrw": 77500,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "INCHEON-JEJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "인천공항 ➔ 김포공항 ➔ 제주공항 (공항철도 + 국내선 항공)",
      "nameEn": "Incheon ➔ Gimpo ➔ Jeju Airport (AREX + Flight)",
      "oneWayPriceKrw": 77500,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "BUSAN-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "부산역 ➔ 신경주역 (KTX 고속철도)",
      "nameEn": "Busan Stn ➔ Singyeongju Stn (KTX Express)",
      "oneWayPriceKrw": 11000,
      "durationTextKo": "27분",
      "durationTextEn": "27m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GYEONGJU-BUSAN": [
    {
      "mode": "KTX",
      "nameKo": "신경주역 ➔ 부산역 (KTX 고속철도)",
      "nameEn": "Singyeongju Stn ➔ Busan Stn (KTX Express)",
      "oneWayPriceKrw": 11000,
      "durationTextKo": "27분",
      "durationTextEn": "27m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "BUSAN-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "부산사상터미널 ➔ 전주시외터미널 (시외 우등버스)",
      "nameEn": "Busan Sasang ➔ Jeonju Terminal (Intercity Bus)",
      "oneWayPriceKrw": 28900,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "직통우등",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "JEONJU-BUSAN": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "전주시외터미널 ➔ 부산사상터미널 (시외 우등버스)",
      "nameEn": "Jeonju Terminal ➔ Busan Sasang (Intercity Bus)",
      "oneWayPriceKrw": 28900,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "직통우등",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "BUSAN-YEOSU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "부산사상터미널 ➔ 여수종합터미널 (시외 우등버스)",
      "nameEn": "Busan Sasang ➔ Yeosu Terminal (Intercity Bus)",
      "oneWayPriceKrw": 23600,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "직통우등",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "YEOSU-BUSAN": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "여수종합터미널 ➔ 부산사상터미널 (시외 우등버스)",
      "nameEn": "Yeosu Terminal ➔ Busan Sasang (Intercity Bus)",
      "oneWayPriceKrw": 23600,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "직통우등",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "BUSAN-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "부산역 ➔ 강릉역 (동해선 ITX-마음 직통열차)",
      "nameEn": "Busan Stn ➔ Gangneung Stn (Donghae Line Train)",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "3시간 40분",
      "durationTextEn": "3h 40m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "동해선직통",
      "badgeTextEn": "Direct Train"
    }
  ],
  "GANGNEUNG-BUSAN": [
    {
      "mode": "KTX",
      "nameKo": "강릉역 ➔ 부산역 (동해선 ITX-마음 직통열차)",
      "nameEn": "Gangneung Stn ➔ Busan Stn (Donghae Line Train)",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "3시간 40분",
      "durationTextEn": "3h 40m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "동해선직통",
      "badgeTextEn": "Direct Train"
    }
  ],
  "BUSAN-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "부산역 ➔ 수원역 (KTX 고속철도 직통)",
      "nameEn": "Busan Stn ➔ Suwon Stn (KTX Express Direct)",
      "oneWayPriceKrw": 52000,
      "durationTextKo": "2시간 30분",
      "durationTextEn": "2h 30m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SUWON-BUSAN": [
    {
      "mode": "KTX",
      "nameKo": "수원역 ➔ 부산역 (KTX 고속철도 직통)",
      "nameEn": "Suwon Stn ➔ Busan Stn (KTX Express Direct)",
      "oneWayPriceKrw": 52000,
      "durationTextKo": "2시간 30분",
      "durationTextEn": "2h 30m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "BUSAN-SOKCHO": [
    {
      "mode": "TRANSFER",
      "nameKo": "부산역 ➔ 동대구역 ➔ 속초 (KTX + 우등 고속버스)",
      "nameEn": "Busan ➔ Dongdaegu ➔ Sokcho (KTX + Express Bus)",
      "oneWayPriceKrw": 49800,
      "durationTextKo": "4시간 25분",
      "durationTextEn": "4h 25m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "최단시간",
      "badgeTextEn": "Fastest Link",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "부산역",
          "fromHubNameEn": "Busan Stn",
          "toHubNameKo": "동대구역",
          "toHubNameEn": "Dongdaegu Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 고속철도",
          "transitNameEn": "KTX Express",
          "fareKrw": 17100,
          "durationTextKo": "45분",
          "durationTextEn": "45m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "동대구터미널",
          "fromHubNameEn": "Dongdaegu Terminal",
          "toHubNameKo": "속초시외/고속터미널",
          "toHubNameEn": "Sokcho Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "우등 고속버스 (동대구➔속초)",
          "transitNameEn": "Express Bus",
          "fareKrw": 32700,
          "durationTextKo": "3시간 30분",
          "durationTextEn": "3h 30m",
          "bookingPlatform": "KOBUS",
          "bookingUrl": "https://www.kobus.co.kr"
        }
      ]
    },
    {
      "mode": "TRANSFER",
      "nameKo": "부산종합터미널 ➔ 포항/강릉 ➔ 속초 (동해선 직행 시외버스)",
      "nameEn": "Busan Terminal ➔ Gangneung ➔ Sokcho (Intercity Bus)",
      "oneWayPriceKrw": 42000,
      "durationTextKo": "5시간 10분",
      "durationTextEn": "5h 10m",
      "optionType": "BUDGET",
      "badgeTextKo": "환승편의",
      "badgeTextEn": "Coast Scenic",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "부산종합터미널(노포)",
          "fromHubNameEn": "Busan Terminal",
          "toHubNameKo": "속초고속터미널",
          "toHubNameEn": "Sokcho Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "동해선 직행 시외버스",
          "transitNameEn": "Intercity Bus",
          "fareKrw": 42000,
          "durationTextKo": "5시간 00분",
          "durationTextEn": "5h 00m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        }
      ]
    }
  ],
  "SOKCHO-BUSAN": [
    {
      "mode": "TRANSFER",
      "nameKo": "속초 ➔ 동대구역 ➔ 부산역 (우등 고속버스 + KTX)",
      "nameEn": "Sokcho ➔ Dongdaegu ➔ Busan (Express Bus + KTX)",
      "oneWayPriceKrw": 49800,
      "durationTextKo": "4시간 25분",
      "durationTextEn": "4h 25m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "최단시간",
      "badgeTextEn": "Fastest Link",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "속초시외/고속터미널",
          "fromHubNameEn": "Sokcho Terminal",
          "toHubNameKo": "동대구터미널",
          "toHubNameEn": "Dongdaegu Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "우등 고속버스 (속초➔동대구)",
          "transitNameEn": "Express Bus",
          "fareKrw": 32700,
          "durationTextKo": "3시간 30분",
          "durationTextEn": "3h 30m",
          "bookingPlatform": "KOBUS",
          "bookingUrl": "https://www.kobus.co.kr"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "동대구역",
          "fromHubNameEn": "Dongdaegu Stn",
          "toHubNameKo": "부산역",
          "toHubNameEn": "Busan Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 고속철도",
          "transitNameEn": "KTX Express",
          "fareKrw": 17100,
          "durationTextKo": "45분",
          "durationTextEn": "45m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "JEONJU-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "전주역 ➔ 여수엑스포역 (KTX / ITX-새마을)",
      "nameEn": "Jeonju Stn ➔ Yeosu Expo Stn (KTX / Train)",
      "oneWayPriceKrw": 14200,
      "durationTextKo": "1시간 20분",
      "durationTextEn": "1h 20m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "YEOSU-JEONJU": [
    {
      "mode": "KTX",
      "nameKo": "여수엑스포역 ➔ 전주역 (KTX / ITX-새마을)",
      "nameEn": "Yeosu Expo Stn ➔ Jeonju Stn (KTX / Train)",
      "oneWayPriceKrw": 14200,
      "durationTextKo": "1시간 20분",
      "durationTextEn": "1h 20m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "JEONJU-GYEONGJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "전주역 ➔ 오송역 ➔ 신경주역 (KTX 고속철도 환승)",
      "nameEn": "Jeonju Stn ➔ Osong ➔ Singyeongju (KTX + KTX)",
      "oneWayPriceKrw": 47800,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true,
      "optionType": "FASTEST",
      "badgeTextKo": "최단철도",
      "badgeTextEn": "Fastest Rail",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "전주역",
          "fromHubNameEn": "Jeonju Stn",
          "toHubNameKo": "오송역",
          "toHubNameEn": "Osong Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 호남선",
          "transitNameEn": "KTX Honam",
          "fareKrw": 18500,
          "durationTextKo": "45분",
          "durationTextEn": "45m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "오송역",
          "fromHubNameEn": "Osong Stn",
          "toHubNameKo": "신경주역",
          "toHubNameEn": "Singyeongju Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 경부선",
          "transitNameEn": "KTX Gyeongbu",
          "fareKrw": 29300,
          "durationTextKo": "55분",
          "durationTextEn": "55m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    },
    {
      "mode": "TRANSFER",
      "nameKo": "전주시외터미널 ➔ 대구서부 ➔ 신경주역 (시외버스 + KTX)",
      "nameEn": "Jeonju Terminal ➔ Daegu ➔ Gyeongju (Bus + KTX)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 40분",
      "durationTextEn": "2h 40m",
      "optionType": "BUDGET",
      "badgeTextKo": "가성비",
      "badgeTextEn": "Budget Choice",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "전주시외터미널",
          "fromHubNameEn": "Jeonju Terminal",
          "toHubNameKo": "서대구/동대구터미널",
          "toHubNameEn": "Daegu Terminal",
          "mode": "INTERCITY_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "시외 우등버스",
          "transitNameEn": "Intercity Bus",
          "fareKrw": 16100,
          "durationTextKo": "2시간 00분",
          "durationTextEn": "2h 00m",
          "bookingPlatform": "BUSTAGO",
          "bookingUrl": "https://www.bustago.or.kr"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "동대구역",
          "fromHubNameEn": "Dongdaegu Stn",
          "toHubNameKo": "신경주역",
          "toHubNameEn": "Singyeongju Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 고속철도",
          "transitNameEn": "KTX Express",
          "fareKrw": 8400,
          "durationTextKo": "17분",
          "durationTextEn": "17m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "GYEONGJU-JEONJU": [
    {
      "mode": "TRANSFER",
      "nameKo": "신경주역 ➔ 오송역 ➔ 전주역 (KTX 고속철도 환승)",
      "nameEn": "Singyeongju ➔ Osong ➔ Jeonju (KTX + KTX)",
      "oneWayPriceKrw": 47800,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "신경주역",
          "fromHubNameEn": "Singyeongju Stn",
          "toHubNameKo": "오송역",
          "toHubNameEn": "Osong Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 경부선",
          "transitNameEn": "KTX Gyeongbu",
          "fareKrw": 29300,
          "durationTextKo": "55분",
          "durationTextEn": "55m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "오송역",
          "fromHubNameEn": "Osong Stn",
          "toHubNameKo": "전주역",
          "toHubNameEn": "Jeonju Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 호남선",
          "transitNameEn": "KTX Honam",
          "fareKrw": 18500,
          "durationTextKo": "45분",
          "durationTextEn": "45m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "JEONJU-GANGNEUNG": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "전주시외터미널 ➔ 강릉시외터미널 (시외 우등버스)",
      "nameEn": "Jeonju Terminal ➔ Gangneung Terminal (Intercity Bus)",
      "oneWayPriceKrw": 34000,
      "durationTextKo": "4시간 00분",
      "durationTextEn": "4h 00m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "TRANSFER",
      "nameKo": "전주역 ➔ 서울/청량리역 ➔ 강릉역 (KTX 고속철도 환승)",
      "nameEn": "Jeonju ➔ Seoul Stn ➔ Gangneung (KTX + KTX-Eum)",
      "oneWayPriceKrw": 62200,
      "durationTextKo": "4시간 10분",
      "durationTextEn": "4h 10m",
      "optionType": "COMFORT",
      "badgeTextKo": "쾌적철도",
      "badgeTextEn": "Comfort Rail",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "전주역",
          "fromHubNameEn": "Jeonju Stn",
          "toHubNameKo": "용산/서울역",
          "toHubNameEn": "Seoul Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 고속철도",
          "transitNameEn": "KTX Express",
          "fareKrw": 34600,
          "durationTextKo": "1시간 40분",
          "durationTextEn": "1h 40m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "서울/청량리역",
          "fromHubNameEn": "Seoul/Cheongnyangni",
          "toHubNameKo": "강릉역",
          "toHubNameEn": "Gangneung Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX-이음 고속철도",
          "transitNameEn": "KTX-Eum",
          "fareKrw": 27600,
          "durationTextKo": "1시간 57분",
          "durationTextEn": "1h 57m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "GANGNEUNG-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "강릉시외터미널 ➔ 전주시외터미널 (시외 우등버스)",
      "nameEn": "Gangneung Terminal ➔ Jeonju Terminal (Intercity Bus)",
      "oneWayPriceKrw": 34000,
      "durationTextKo": "4시간 00분",
      "durationTextEn": "4h 00m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "JEONJU-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "전주역 ➔ 수원역 (KTX / ITX-새마을 직통)",
      "nameEn": "Jeonju Stn ➔ Suwon Stn (KTX / Train Direct)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "1시간 45분",
      "durationTextEn": "1h 45m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SUWON-JEONJU": [
    {
      "mode": "KTX",
      "nameKo": "수원역 ➔ 전주역 (KTX / ITX-새마을 직통)",
      "nameEn": "Suwon Stn ➔ Jeonju Stn (KTX / Train Direct)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "1시간 45분",
      "durationTextEn": "1h 45m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "JEONJU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "전주시외터미널 ➔ 속초고속터미널 (시외 우등버스)",
      "nameEn": "Jeonju Terminal ➔ Sokcho Terminal (Intercity Bus)",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SOKCHO-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초고속터미널 ➔ 전주시외터미널 (시외 우등버스)",
      "nameEn": "Sokcho Terminal ➔ Jeonju Terminal (Intercity Bus)",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GYEONGJU-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "신경주역 ➔ 강릉역 (동해선 ITX-마음 / KTX)",
      "nameEn": "Singyeongju Stn ➔ Gangneung Stn (Donghae Line)",
      "oneWayPriceKrw": 34300,
      "durationTextKo": "2시간 44분",
      "durationTextEn": "2h 44m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GANGNEUNG-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "강릉역 ➔ 신경주역 (동해선 ITX-마음 / KTX)",
      "nameEn": "Gangneung Stn ➔ Singyeongju Stn (Donghae Line)",
      "oneWayPriceKrw": 34300,
      "durationTextKo": "2시간 44분",
      "durationTextEn": "2h 44m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GYEONGJU-YEOSU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "경주시외터미널 ➔ 여수종합터미널 (시외 우등버스)",
      "nameEn": "Gyeongju Terminal ➔ Yeosu Terminal (Intercity Bus)",
      "oneWayPriceKrw": 26000,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "YEOSU-GYEONGJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "여수종합터미널 ➔ 경주시외터미널 (시외 우등버스)",
      "nameEn": "Yeosu Terminal ➔ Gyeongju Terminal (Intercity Bus)",
      "oneWayPriceKrw": 26000,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GYEONGJU-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "신경주역 ➔ 수원역 (KTX 고속철도)",
      "nameEn": "Singyeongju Stn ➔ Suwon Stn (KTX Express)",
      "oneWayPriceKrw": 41000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SUWON-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "수원역 ➔ 신경주역 (KTX 고속철도)",
      "nameEn": "Suwon Stn ➔ Singyeongju Stn (KTX Express)",
      "oneWayPriceKrw": 41000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GYEONGJU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "경주시외터미널 ➔ 속초고속터미널 (동해선 시외버스)",
      "nameEn": "Gyeongju Terminal ➔ Sokcho Terminal (Intercity Bus)",
      "oneWayPriceKrw": 36000,
      "durationTextKo": "4시간 10분",
      "durationTextEn": "4h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SOKCHO-GYEONGJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초고속터미널 ➔ 경주시외터미널 (동해선 시외버스)",
      "nameEn": "Sokcho Terminal ➔ Gyeongju Terminal (Intercity Bus)",
      "oneWayPriceKrw": 36000,
      "durationTextKo": "4시간 10분",
      "durationTextEn": "4h 10m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GANGNEUNG-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "강릉시외터미널 ➔ 속초시외터미널 (동해안 직행버스)",
      "nameEn": "Gangneung Terminal ➔ Sokcho Terminal (Direct Bus)",
      "oneWayPriceKrw": 7500,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SOKCHO-GANGNEUNG": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초시외터미널 ➔ 강릉시외터미널 (동해안 직행버스)",
      "nameEn": "Sokcho Terminal ➔ Gangneung Terminal (Direct Bus)",
      "oneWayPriceKrw": 7500,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "GANGNEUNG-SUWON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "강릉시외터미널 ➔ 수원버스터미널 (시외 우등버스)",
      "nameEn": "Gangneung Terminal ➔ Suwon Terminal (Express Bus)",
      "oneWayPriceKrw": 22800,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "직통우등",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "SUWON-GANGNEUNG": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "수원버스터미널 ➔ 강릉시외터미널 (시외 우등버스)",
      "nameEn": "Suwon Terminal ➔ Gangneung Terminal (Express Bus)",
      "oneWayPriceKrw": 22800,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "optionType": "DIRECT",
      "badgeTextKo": "직통우등",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "GANGNEUNG-YEOSU": [
    {
      "mode": "TRANSFER",
      "nameKo": "강릉역 ➔ 서울역 ➔ 여수엑스포역 (KTX 고속철도 환승)",
      "nameEn": "Gangneung Stn ➔ Seoul ➔ Yeosu Expo (KTX via Seoul)",
      "oneWayPriceKrw": 74800,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "강릉역",
          "fromHubNameEn": "Gangneung Stn",
          "toHubNameKo": "서울역",
          "toHubNameEn": "Seoul Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX-이음 고속철도",
          "transitNameEn": "KTX-Eum",
          "fareKrw": 27600,
          "durationTextKo": "1시간 57분",
          "durationTextEn": "1h 57m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "서울/용산역",
          "fromHubNameEn": "Seoul/Yongsan",
          "toHubNameKo": "여수엑스포역",
          "toHubNameEn": "Yeosu Expo",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 전라선",
          "transitNameEn": "KTX Express",
          "fareKrw": 47200,
          "durationTextKo": "3시간 00분",
          "durationTextEn": "3h 00m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "YEOSU-GANGNEUNG": [
    {
      "mode": "TRANSFER",
      "nameKo": "여수엑스포역 ➔ 서울역 ➔ 강릉역 (KTX 고속철도 환승)",
      "nameEn": "Yeosu Expo ➔ Seoul ➔ Gangneung Stn (KTX via Seoul)",
      "oneWayPriceKrw": 74800,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "여수엑스포역",
          "fromHubNameEn": "Yeosu Expo",
          "toHubNameKo": "서울/용산역",
          "toHubNameEn": "Seoul/Yongsan",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 전라선",
          "transitNameEn": "KTX Express",
          "fareKrw": 47200,
          "durationTextKo": "3시간 00분",
          "durationTextEn": "3h 00m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "서울역",
          "fromHubNameEn": "Seoul Stn",
          "toHubNameKo": "강릉역",
          "toHubNameEn": "Gangneung Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX-이음 고속철도",
          "transitNameEn": "KTX-Eum",
          "fareKrw": 27600,
          "durationTextKo": "1시간 57분",
          "durationTextEn": "1h 57m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "SUWON-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "수원버스터미널 ➔ 속초고속터미널 (시외 우등버스)",
      "nameEn": "Suwon Terminal ➔ Sokcho Terminal (Express Bus)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SOKCHO-SUWON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초고속터미널 ➔ 수원버스터미널 (시외 우등버스)",
      "nameEn": "Sokcho Terminal ➔ Suwon Terminal (Express Bus)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "SUWON-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "수원역 ➔ 여수엑스포역 (KTX 고속철도 직통)",
      "nameEn": "Suwon Stn ➔ Yeosu Expo Stn (KTX Express)",
      "oneWayPriceKrw": 43000,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "YEOSU-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "여수엑스포역 ➔ 수원역 (KTX 고속철도 직통)",
      "nameEn": "Yeosu Expo Stn ➔ Suwon Stn (KTX Express)",
      "oneWayPriceKrw": 43000,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "optionType": "DIRECT"
    }
  ],
  "YEOSU-SOKCHO": [
    {
      "mode": "TRANSFER",
      "nameKo": "여수 ➔ 서울(KTX) ➔ 속초(고속버스)",
      "nameEn": "Yeosu ➔ Seoul(KTX) ➔ Sokcho(Bus)",
      "oneWayPriceKrw": 69500,
      "durationTextKo": "5시간 30분",
      "durationTextEn": "5h 30m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "여수엑스포역",
          "fromHubNameEn": "Yeosu Expo",
          "toHubNameKo": "용산/서울역",
          "toHubNameEn": "Seoul Stn",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 전라선",
          "transitNameEn": "KTX Express",
          "fareKrw": 47200,
          "durationTextKo": "3시간 00분",
          "durationTextEn": "3h 00m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "서울경부터미널",
          "fromHubNameEn": "Seoul Terminal",
          "toHubNameKo": "속초고속터미널",
          "toHubNameEn": "Sokcho Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "우등 고속버스",
          "transitNameEn": "Express Bus",
          "fareKrw": 22300,
          "durationTextKo": "2시간 20분",
          "durationTextEn": "2h 20m",
          "bookingPlatform": "KOBUS",
          "bookingUrl": "https://www.kobus.co.kr"
        }
      ]
    }
  ],
  "SOKCHO-YEOSU": [
    {
      "mode": "TRANSFER",
      "nameKo": "속초 ➔ 서울(고속버스) ➔ 여수(KTX)",
      "nameEn": "Sokcho ➔ Seoul(Bus) ➔ Yeosu(KTX)",
      "oneWayPriceKrw": 69500,
      "durationTextKo": "5시간 30분",
      "durationTextEn": "5h 30m",
      "isDefault": true,
      "optionType": "FASTEST",
      "legs": [
        {
          "legOrder": 1,
          "fromHubNameKo": "속초고속터미널",
          "fromHubNameEn": "Sokcho Terminal",
          "toHubNameKo": "서울경부터미널",
          "toHubNameEn": "Seoul Terminal",
          "mode": "EXPRESS_BUS",
          "modeIcon": "🚌",
          "transitNameKo": "우등 고속버스",
          "transitNameEn": "Express Bus",
          "fareKrw": 22300,
          "durationTextKo": "2시간 20분",
          "durationTextEn": "2h 20m",
          "bookingPlatform": "KOBUS",
          "bookingUrl": "https://www.kobus.co.kr"
        },
        {
          "legOrder": 2,
          "fromHubNameKo": "용산/서울역",
          "fromHubNameEn": "Seoul Stn",
          "toHubNameKo": "여수엑스포역",
          "toHubNameEn": "Yeosu Expo",
          "mode": "KTX",
          "modeIcon": "🚄",
          "transitNameKo": "KTX 전라선",
          "transitNameEn": "KTX Express",
          "fareKrw": 47200,
          "durationTextKo": "3시간 00분",
          "durationTextEn": "3h 00m",
          "bookingPlatform": "KORAIL",
          "bookingUrl": "https://www.letskorail.com"
        }
      ]
    }
  ],
  "INCHEON-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "인천공항 ➔ 서울역 (AREX 직통열차 논스톱)",
      "nameEn": "Incheon Airport ➔ Seoul Stn (AREX Non-stop)",
      "oneWayPriceKrw": 11000,
      "durationTextKo": "43분",
      "durationTextEn": "43m",
      "isDefault": true,
      "badgeTextKo": "논스톱 직행",
      "badgeTextEn": "Non-stop"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 도심/호텔 (공항 리무진 6000번대)",
      "nameEn": "Incheon Airport ➔ Hotels (Limousine Bus 6000)",
      "oneWayPriceKrw": 17000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "badgeTextKo": "호텔문앞",
      "badgeTextEn": "Hotel Door"
    }
  ],
  "INCHEON-SUWON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 수원버스터미널 (공항 리무진 4100번 직통)",
      "nameEn": "Incheon Airport ➔ Suwon (Limousine 4100 Direct)",
      "oneWayPriceKrw": 13500,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "인천공항 ➔ 서울역 ➔ 수원역 (AREX + KTX/지하철)",
      "nameEn": "Incheon Airport ➔ Seoul ➔ Suwon (AREX + Train)",
      "oneWayPriceKrw": 12850,
      "durationTextKo": "1시간 20분",
      "durationTextEn": "1h 20m",
      "badgeTextKo": "철도연계",
      "badgeTextEn": "Rail Link"
    }
  ],
  "INCHEON-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 전주시외터미널 (직행 우등 리무진 버스)",
      "nameEn": "Incheon Airport ➔ Jeonju (Direct Limousine Bus)",
      "oneWayPriceKrw": 33000,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    },
    {
      "mode": "KTX",
      "nameKo": "인천공항 ➔ 서울/용산역 ➔ 전주역 (AREX + KTX 고속철도)",
      "nameEn": "Incheon Airport ➔ Seoul/Yongsan ➔ Jeonju (AREX + KTX)",
      "oneWayPriceKrw": 45600,
      "durationTextKo": "2시간 40분",
      "durationTextEn": "2h 40m",
      "badgeTextKo": "빠른도착",
      "badgeTextEn": "Fastest"
    }
  ],
  "INCHEON-BUSAN": [
    {
      "mode": "KTX",
      "nameKo": "인천공항 ➔ 서울역 ➔ 부산역 (AREX + KTX 고속철도)",
      "nameEn": "Incheon Airport ➔ Seoul Stn ➔ Busan (AREX + KTX)",
      "oneWayPriceKrw": 70800,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 부산종합터미널 (직행 우등 고속버스)",
      "nameEn": "Incheon Airport ➔ Busan (Direct Express Bus)",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "INCHEON-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "인천공항 ➔ 서울역 ➔ 강릉역 (AREX + KTX-이음 고속철도)",
      "nameEn": "Incheon Airport ➔ Seoul Stn ➔ Gangneung (AREX + KTX-Eum)",
      "oneWayPriceKrw": 38600,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 강릉시외터미널 (직행 시외 고속버스)",
      "nameEn": "Incheon Airport ➔ Gangneung (Direct Express Bus)",
      "oneWayPriceKrw": 30000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "INCHEON-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "인천공항 ➔ 서울역 ➔ 신경주역 (AREX + KTX 고속철도)",
      "nameEn": "Incheon Airport ➔ Seoul Stn ➔ Gyeongju (AREX + KTX)",
      "oneWayPriceKrw": 60300,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 경주시외터미널 (직행 우등 고속버스)",
      "nameEn": "Incheon Airport ➔ Gyeongju (Direct Express Bus)",
      "oneWayPriceKrw": 44000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "INCHEON-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "인천공항 ➔ 용산역 ➔ 여수엑스포역 (AREX + KTX 고속철도)",
      "nameEn": "Incheon Airport ➔ Yongsan Stn ➔ Yeosu (AREX + KTX)",
      "oneWayPriceKrw": 58200,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 여수종합터미널 (직행 우등 고속버스)",
      "nameEn": "Incheon Airport ➔ Yeosu (Direct Express Bus)",
      "oneWayPriceKrw": 42000,
      "durationTextKo": "4시간 40분",
      "durationTextEn": "4h 40m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "INCHEON-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "인천공항 ➔ 속초시외터미널 (직행 시외버스)",
      "nameEn": "Incheon Airport ➔ Sokcho (Direct Intercity Bus)",
      "oneWayPriceKrw": 32000,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "badgeTextKo": "직통버스",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "SEOUL-INCHEON": [
    {
      "mode": "KTX",
      "nameKo": "서울역 ➔ 인천공항 (AREX 직통열차 논스톱)",
      "nameEn": "Seoul Stn ➔ Incheon Airport (AREX Non-stop)",
      "oneWayPriceKrw": 11000,
      "durationTextKo": "43분",
      "durationTextEn": "43m",
      "isDefault": true,
      "badgeTextKo": "논스톱 직행",
      "badgeTextEn": "Non-stop"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "도심/호텔 ➔ 인천공항 (공항 리무진 6000번대)",
      "nameEn": "Hotels ➔ Incheon Airport (Limousine Bus 6000)",
      "oneWayPriceKrw": 17000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "badgeTextKo": "호텔문앞",
      "badgeTextEn": "Hotel Door"
    }
  ],
  "SUWON-INCHEON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "수원버스터미널 ➔ 인천공항 (공항 리무진 4100번 직통)",
      "nameEn": "Suwon ➔ Incheon Airport (Limousine 4100 Direct)",
      "oneWayPriceKrw": 13500,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "수원역 ➔ 서울역 ➔ 인천공항 (KTX/지하철 + AREX)",
      "nameEn": "Suwon ➔ Seoul ➔ Incheon Airport (Train + AREX)",
      "oneWayPriceKrw": 12850,
      "durationTextKo": "1시간 20분",
      "durationTextEn": "1h 20m",
      "badgeTextKo": "철도연계",
      "badgeTextEn": "Rail Link"
    }
  ],
  "JEONJU-INCHEON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "전주시외터미널 ➔ 인천공항 (직행 우등 리무진 버스)",
      "nameEn": "Jeonju ➔ Incheon Airport (Direct Limousine Bus)",
      "oneWayPriceKrw": 33000,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    },
    {
      "mode": "KTX",
      "nameKo": "전주역 ➔ 용산/서울역 ➔ 인천공항 (KTX 고속철도 + AREX)",
      "nameEn": "Jeonju ➔ Yongsan/Seoul ➔ Incheon Airport (KTX + AREX)",
      "oneWayPriceKrw": 45600,
      "durationTextKo": "2시간 40분",
      "durationTextEn": "2h 40m",
      "badgeTextKo": "빠른도착",
      "badgeTextEn": "Fastest"
    }
  ],
  "BUSAN-INCHEON": [
    {
      "mode": "KTX",
      "nameKo": "부산역 ➔ 서울역 ➔ 인천공항 (KTX 고속철도 + AREX)",
      "nameEn": "Busan ➔ Seoul Stn ➔ Incheon Airport (KTX + AREX)",
      "oneWayPriceKrw": 70800,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "부산종합터미널 ➔ 인천공항 (직행 우등 고속버스)",
      "nameEn": "Busan ➔ Incheon Airport (Direct Express Bus)",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "GANGNEUNG-INCHEON": [
    {
      "mode": "KTX",
      "nameKo": "강릉역 ➔ 서울역 ➔ 인천공항 (KTX-이음 고속철도 + AREX)",
      "nameEn": "Gangneung ➔ Seoul Stn ➔ Incheon Airport (KTX-Eum + AREX)",
      "oneWayPriceKrw": 38600,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "강릉시외터미널 ➔ 인천공항 (직행 시외 고속버스)",
      "nameEn": "Gangneung ➔ Incheon Airport (Direct Express Bus)",
      "oneWayPriceKrw": 30000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "GYEONGJU-INCHEON": [
    {
      "mode": "KTX",
      "nameKo": "신경주역 ➔ 서울역 ➔ 인천공항 (KTX 고속철도 + AREX)",
      "nameEn": "Gyeongju ➔ Seoul Stn ➔ Incheon Airport (KTX + AREX)",
      "oneWayPriceKrw": 60300,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "경주시외터미널 ➔ 인천공항 (직행 우등 고속버스)",
      "nameEn": "Gyeongju ➔ Incheon Airport (Direct Express Bus)",
      "oneWayPriceKrw": 44000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "YEOSU-INCHEON": [
    {
      "mode": "KTX",
      "nameKo": "여수엑스포역 ➔ 용산역 ➔ 인천공항 (KTX 고속철도 + AREX)",
      "nameEn": "Yeosu ➔ Yongsan Stn ➔ Incheon Airport (KTX + AREX)",
      "oneWayPriceKrw": 58200,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "여수종합터미널 ➔ 인천공항 (직행 우등 고속버스)",
      "nameEn": "Yeosu ➔ Incheon Airport (Direct Express Bus)",
      "oneWayPriceKrw": 42000,
      "durationTextKo": "4시간 40분",
      "durationTextEn": "4h 40m",
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    }
  ],
  "SOKCHO-INCHEON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초시외터미널 ➔ 인천공항 (직행 시외버스)",
      "nameEn": "Sokcho ➔ Incheon Airport (Direct Intercity Bus)",
      "oneWayPriceKrw": 32000,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "badgeTextKo": "직통버스",
      "badgeTextEn": "Direct Bus"
    }
  ]
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
      nameKo: `${from} ➔ ${to} (${opt.mode === "KTX" ? "KTX 고속철도" : opt.mode === "FLIGHT" ? "국내선 항공" : "고속/시외버스"})`,
      nameEn: `${from} ➔ ${to} (${opt.mode === "KTX" ? "KTX Express" : opt.mode === "FLIGHT" ? "Flight" : "Express Bus"})`,
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
            { mode: "SRT", nameKo: "김포공항 ➔ 서울 도심 (지하철 5·9호선/공항철도)", nameEn: "Gimpo Airport ➔ Seoul (Subway 5/9/AREX)", oneWayPriceKrw: 1600, durationTextKo: "25분", durationTextEn: "25m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "김포공항 ➔ 도심/호텔 (공항 리무진 6000번대)", nameEn: "Gimpo Airport ➔ Hotels (Limousine 6000)", oneWayPriceKrw: 9000, durationTextKo: "40분", durationTextEn: "40m" },
          ]
        : [
            { mode: "SRT", nameKo: "서울 도심 ➔ 김포공항 (지하철 5·9호선/공항철도)", nameEn: "Seoul ➔ Gimpo Airport (Subway 5/9/AREX)", oneWayPriceKrw: 1600, durationTextKo: "25분", durationTextEn: "25m", isDefault: true },
            { mode: "EXPRESS_BUS", nameKo: "도심/호텔 ➔ 김포공항 (공항 리무진 6000번대)", nameEn: "Hotels ➔ Gimpo Airport (Limousine 6000)", oneWayPriceKrw: 9000, durationTextKo: "40분", durationTextEn: "40m" },
          ];
    }
    if (targetCity === "SUWON") {
      return direction === "ENTRY"
        ? [{ mode: "EXPRESS_BUS", nameKo: "김포공항 ➔ 수원버스터미널 (공항 리무진 4300번 직통)", nameEn: "Gimpo Airport ➔ Suwon (Limousine 4300)", oneWayPriceKrw: 8000, durationTextKo: "50분", durationTextEn: "50m", isDefault: true }]
        : [{ mode: "EXPRESS_BUS", nameKo: "수원버스터미널 ➔ 김포공항 (공항 리무진 4300번 직통)", nameEn: "Suwon ➔ Gimpo Airport (Limousine 4300)", oneWayPriceKrw: 8000, durationTextKo: "50분", durationTextEn: "50m", isDefault: true }];
    }
    if (targetCity === "JEJU") {
      return direction === "ENTRY"
        ? [{ mode: "FLIGHT", nameKo: "김포공항 ➔ 제주공항 (국내선 항공)", nameEn: "Gimpo Airport ➔ Jeju (Flight)", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }]
        : [{ mode: "FLIGHT", nameKo: "제주공항 ➔ 김포공항 (국내선 항공)", nameEn: "Jeju ➔ Gimpo Airport (Flight)", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }];
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
        ? [{ mode: "EXPRESS_BUS", nameKo: "김해공항 ➔ 경주시외터미널 (직행 공항리무진)", nameEn: "Gimhae Airport ➔ Gyeongju (Direct Limousine)", oneWayPriceKrw: 11000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }]
        : [{ mode: "EXPRESS_BUS", nameKo: "경주시외터미널 ➔ 김해공항 (직행 공항리무진)", nameEn: "Gyeongju ➔ Gimhae Airport (Direct Limousine)", oneWayPriceKrw: 11000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true }];
    }
    if (targetCity === "JEJU") {
      return direction === "ENTRY"
        ? [{ mode: "FLIGHT", nameKo: "김해공항 ➔ 제주공항 (국내선 항공)", nameEn: "Gimhae Airport ➔ Jeju (Flight)", oneWayPriceKrw: 65000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true }]
        : [{ mode: "FLIGHT", nameKo: "제주공항 ➔ 김해공항 (국내선 항공)", nameEn: "Jeju ➔ Gimhae Airport (Flight)", oneWayPriceKrw: 65000, durationTextKo: "1시간 00분", durationTextEn: "1h 00m", isDefault: true }];
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
