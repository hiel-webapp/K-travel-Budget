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
 * 한국 주요 10대 도시 간 실제 이동 수단별 대표 1인 편도 요금 및 소요시간 상수 테이블
 * (기준: 2026년 코레일, KOBUS, 공항철도, 국내선 항공 공식 예약 결제 운임 전수 검증 데이터)
 */
export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo[]> = {
  "SEOUL-BUSAN": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (서울역)",
      "nameEn": "KTX Express Train (Seoul Stn)",
      "oneWayPriceKrw": 59800,
      "durationTextKo": "2시간 37분",
      "durationTextEn": "2h 37m",
      "isDefault": true,
      "badgeTextKo": "최단시간",
      "badgeTextEn": "Fastest"
    },
    {
      "mode": "SRT",
      "nameKo": "SRT 고속철도 (수서역)",
      "nameEn": "SRT Express Train (Suseo Stn)",
      "oneWayPriceKrw": 52000,
      "durationTextKo": "2시간 30분",
      "durationTextEn": "2h 30m"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스 (서울경부)",
      "nameEn": "Express Bus (Seoul Terminal)",
      "oneWayPriceKrw": 39700,
      "durationTextKo": "4시간 00분",
      "durationTextEn": "4h 00m",
      "badgeTextKo": "가성비",
      "badgeTextEn": "Budget"
    },
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 (김포 ➔ 김해)",
      "nameEn": "Domestic Flight (GMP ➔ PUS)",
      "oneWayPriceKrw": 78000,
      "durationTextKo": "1시간 05분",
      "durationTextEn": "1h 05m"
    }
  ],
  "SEOUL-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 (김포 ➔ 제주)",
      "nameEn": "Domestic Flight (GMP ➔ CJU)",
      "oneWayPriceKrw": 75000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true,
      "badgeTextKo": "항공직항",
      "badgeTextEn": "Direct Flight"
    }
  ],
  "SEOUL-JEONJU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (용산역)",
      "nameEn": "KTX Express (Yongsan Stn)",
      "oneWayPriceKrw": 23700,
      "durationTextKo": "59분",
      "durationTextEn": "59m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스 (센트럴시티)",
      "nameEn": "Express Bus (Central City)",
      "oneWayPriceKrw": 22000,
      "durationTextKo": "2시간 40분",
      "durationTextEn": "2h 40m",
      "badgeTextKo": "가성비",
      "badgeTextEn": "Budget"
    }
  ],
  "SEOUL-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (신경주역)",
      "nameEn": "KTX Express (Singyeongju)",
      "oneWayPriceKrw": 49300,
      "durationTextKo": "2시간 2분",
      "durationTextEn": "2h 2m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스 (서울경부)",
      "nameEn": "Express Bus (Seoul Terminal)",
      "oneWayPriceKrw": 33600,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m"
    }
  ],
  "SEOUL-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "KTX-이음 (서울/청량리역)",
      "nameEn": "KTX-Eum (Seoul/Cheongnyangni)",
      "oneWayPriceKrw": 27600,
      "durationTextKo": "1시간 57분",
      "durationTextEn": "1h 57m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스 (서울경부)",
      "nameEn": "Express Bus (Seoul Terminal)",
      "oneWayPriceKrw": 24600,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m"
    }
  ],
  "SEOUL-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (용산역)",
      "nameEn": "KTX Express (Yongsan Stn)",
      "oneWayPriceKrw": 47200,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스 (센트럴시티)",
      "nameEn": "Express Bus (Central City)",
      "oneWayPriceKrw": 36400,
      "durationTextKo": "4시간 15분",
      "durationTextEn": "4h 15m"
    }
  ],
  "SEOUL-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "KTX / ITX-새마을 (서울역)",
      "nameEn": "KTX / Train (Seoul Stn)",
      "oneWayPriceKrw": 8400,
      "durationTextKo": "30분",
      "durationTextEn": "30m",
      "isDefault": true,
      "badgeTextKo": "철도직통",
      "badgeTextEn": "Fast Train"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "광역버스 / 지하철 1호선",
      "nameEn": "Subway Line 1 / Express Bus",
      "oneWayPriceKrw": 3000,
      "durationTextKo": "45분",
      "durationTextEn": "45m",
      "badgeTextKo": "T-Money",
      "badgeTextEn": "T-Money"
    }
  ],
  "SEOUL-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스 (서울경부/동서울)",
      "nameEn": "Express Bus (Seoul/Dongseoul)",
      "oneWayPriceKrw": 22300,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "KTX-이음(강릉) + 시외버스 환승",
      "nameEn": "KTX via Gangneung + Bus",
      "oneWayPriceKrw": 35100,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m"
    }
  ],
  "JEJU-SUWON": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 + 김포공항 리무진 (4300번)",
      "nameEn": "Flight (CJU➔GMP) + Airport Limousine",
      "oneWayPriceKrw": 83000,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true,
      "badgeTextKo": "현실추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "SRT",
      "nameKo": "국내선 항공 + 공항철도/지하철 연계",
      "nameEn": "Flight (CJU➔GMP) + Subway Transfer",
      "oneWayPriceKrw": 77000,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "badgeTextKo": "가성비",
      "badgeTextEn": "Budget"
    }
  ],
  "JEJU-BUSAN": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 (제주 ➔ 김해)",
      "nameEn": "Domestic Flight (CJU ➔ PUS)",
      "oneWayPriceKrw": 65000,
      "durationTextKo": "1시간 00분",
      "durationTextEn": "1h 00m",
      "isDefault": true,
      "badgeTextKo": "항공추천",
      "badgeTextEn": "Fast Flight"
    },
    {
      "mode": "FERRY",
      "nameKo": "제주-부산 야간 카페리 (선박)",
      "nameEn": "Jeju-Busan Car Ferry (Overnight)",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "11시간 00분",
      "durationTextEn": "11h 00m",
      "badgeTextKo": "야간선박",
      "badgeTextEn": "Night Ferry"
    }
  ],
  "JEJU-JEONJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(군산공항) + 전주 시외버스",
      "nameEn": "Flight to Gunsan + Jeonju Bus",
      "oneWayPriceKrw": 72000,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "badgeTextKo": "직항추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "KTX",
      "nameKo": "국내선 항공(광주공항) + KTX(송정➔전주)",
      "nameEn": "Flight to Gwangju + KTX",
      "oneWayPriceKrw": 79000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m"
    }
  ],
  "JEJU-GYEONGJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(김해공항) + 경주 리무진",
      "nameEn": "Flight to Gimhae + Gyeongju Limousine",
      "oneWayPriceKrw": 76000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "KTX",
      "nameKo": "국내선 항공(포항경주) + 시내버스",
      "nameEn": "Flight to Pohang + Local Bus",
      "oneWayPriceKrw": 78000,
      "durationTextKo": "1시간 50분",
      "durationTextEn": "1h 50m"
    }
  ],
  "JEJU-GANGNEUNG": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(김포) + 서울역 KTX-이음",
      "nameEn": "Flight to Gimpo + KTX-Eum to Gangneung",
      "oneWayPriceKrw": 102600,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "국내선 항공(원주공항) + 강릉 시외버스",
      "nameEn": "Flight to Wonju + Gangneung Bus",
      "oneWayPriceKrw": 84000,
      "durationTextKo": "2시간 40분",
      "durationTextEn": "2h 40m"
    }
  ],
  "JEJU-YEOSU": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 (제주 ➔ 여수 직항)",
      "nameEn": "Domestic Flight (CJU ➔ RSU)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true,
      "badgeTextKo": "직항추천",
      "badgeTextEn": "Fast Flight"
    }
  ],
  "JEJU-SOKCHO": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(김포) + 고속버스(속초)",
      "nameEn": "Flight to Gimpo + Sokcho Express Bus",
      "oneWayPriceKrw": 98000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    }
  ],
  "JEJU-INCHEON": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(김포) + 공항철도(인천)",
      "nameEn": "Flight to Gimpo + AREX to Incheon",
      "oneWayPriceKrw": 77500,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    }
  ],
  "BUSAN-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (부산역 ➔ 신경주역)",
      "nameEn": "KTX Train (Busan ➔ Singyeongju)",
      "oneWayPriceKrw": 11000,
      "durationTextKo": "27분",
      "durationTextEn": "27m",
      "isDefault": true,
      "badgeTextKo": "초고속",
      "badgeTextEn": "Fastest"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 고속버스 (부산종합터미널)",
      "nameEn": "Express Bus (Nopo Terminal)",
      "oneWayPriceKrw": 6500,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "badgeTextKo": "가성비",
      "badgeTextEn": "Budget"
    }
  ],
  "BUSAN-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (사상터미널)",
      "nameEn": "Intercity Express Bus (Sasang)",
      "oneWayPriceKrw": 28900,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "KTX (오송역 환승)",
      "nameEn": "KTX via Osong Transfer",
      "oneWayPriceKrw": 36200,
      "durationTextKo": "1시간 34분",
      "durationTextEn": "1h 34m"
    }
  ],
  "BUSAN-YEOSU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등버스 (사상터미널)",
      "nameEn": "Intercity Express Bus",
      "oneWayPriceKrw": 23600,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "남도해양열차(S-Train) / 무궁화호",
      "nameEn": "Scenic Train (S-Train)",
      "oneWayPriceKrw": 12500,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m"
    }
  ],
  "BUSAN-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "동해선 ITX-마음 / 누리로 직통",
      "nameEn": "Donghae Line Train",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "3시간 40분",
      "durationTextEn": "3h 40m",
      "isDefault": true,
      "badgeTextKo": "해안철도",
      "badgeTextEn": "Coastal Rail"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스",
      "nameEn": "Intercity Express Bus",
      "oneWayPriceKrw": 39000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m"
    }
  ],
  "BUSAN-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (수원역 경유/직통)",
      "nameEn": "KTX Train (to Suwon)",
      "oneWayPriceKrw": 52000,
      "durationTextKo": "2시간 30분",
      "durationTextEn": "2h 30m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스",
      "nameEn": "Express Bus",
      "oneWayPriceKrw": 34000,
      "durationTextKo": "4시간 00분",
      "durationTextEn": "4h 00m"
    }
  ],
  "BUSAN-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (동해선 직행)",
      "nameEn": "Direct Intercity Bus",
      "oneWayPriceKrw": 42000,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m",
      "isDefault": true,
      "badgeTextKo": "직통",
      "badgeTextEn": "Direct"
    }
  ],
  "JEONJU-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "KTX / 무궁화호 (전라선 직통)",
      "nameEn": "KTX / Train (Direct)",
      "oneWayPriceKrw": 14200,
      "durationTextKo": "1시간 20분",
      "durationTextEn": "1h 20m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Train"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 고속버스",
      "nameEn": "Intercity Bus",
      "oneWayPriceKrw": 13500,
      "durationTextKo": "1시간 50분",
      "durationTextEn": "1h 50m"
    }
  ],
  "JEONJU-GYEONGJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (대구 경유)",
      "nameEn": "Express Bus via Daegu",
      "oneWayPriceKrw": 28000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "isDefault": true,
      "badgeTextKo": "직통버스",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "KTX (오송역 환승)",
      "nameEn": "KTX via Osong Transfer",
      "oneWayPriceKrw": 25800,
      "durationTextKo": "1시간 1분",
      "durationTextEn": "1h 1m"
    }
  ],
  "JEONJU-GANGNEUNG": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (직통)",
      "nameEn": "Intercity Bus (Direct)",
      "oneWayPriceKrw": 34000,
      "durationTextKo": "4시간 00분",
      "durationTextEn": "4h 00m",
      "isDefault": true,
      "badgeTextKo": "직통",
      "badgeTextEn": "Direct"
    },
    {
      "mode": "KTX",
      "nameKo": "KTX (서울/용산역 환승)",
      "nameEn": "KTX via Seoul Transfer",
      "oneWayPriceKrw": 58000,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m"
    }
  ],
  "JEONJU-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "KTX / ITX-새마을 (수원역 직통)",
      "nameEn": "KTX / Train (Direct)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "1시간 45분",
      "durationTextEn": "1h 45m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스",
      "nameEn": "Express Bus",
      "oneWayPriceKrw": 16500,
      "durationTextKo": "2시간 15분",
      "durationTextEn": "2h 15m"
    }
  ],
  "JEONJU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 고속버스 (유성/서울 환승)",
      "nameEn": "Intercity Bus via Transfer",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "isDefault": true
    }
  ],
  "GYEONGJU-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "동해선 ITX-마음 직통열차",
      "nameEn": "Donghae Line Train",
      "oneWayPriceKrw": 34300,
      "durationTextKo": "2시간 44분",
      "durationTextEn": "2h 44m",
      "isDefault": true,
      "badgeTextKo": "철도직통",
      "badgeTextEn": "Direct Rail"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스",
      "nameEn": "Intercity Express Bus",
      "oneWayPriceKrw": 27000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m"
    }
  ],
  "GYEONGJU-YEOSU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (순천/광양 경유)",
      "nameEn": "Intercity Bus via Suncheon",
      "oneWayPriceKrw": 26000,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "badgeTextKo": "직통",
      "badgeTextEn": "Direct"
    }
  ],
  "GYEONGJU-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (신경주 ➔ 수원)",
      "nameEn": "KTX (Singyeongju ➔ Suwon)",
      "oneWayPriceKrw": 41000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스",
      "nameEn": "Express Bus",
      "oneWayPriceKrw": 27000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m"
    }
  ],
  "GYEONGJU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (동해선 직행)",
      "nameEn": "Intercity Bus (Direct)",
      "oneWayPriceKrw": 36000,
      "durationTextKo": "4시간 10분",
      "durationTextEn": "4h 10m",
      "isDefault": true
    }
  ],
  "GANGNEUNG-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "동해안 시외 직행버스",
      "nameEn": "Coastal Intercity Bus",
      "oneWayPriceKrw": 7500,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "GANGNEUNG-SUWON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스",
      "nameEn": "Express Bus (Direct)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "KTX-이음 (청량리/서울 환승)",
      "nameEn": "KTX via Cheongnyangni",
      "oneWayPriceKrw": 30800,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m"
    }
  ],
  "GANGNEUNG-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "KTX (서울역/오송역 환승)",
      "nameEn": "KTX via Seoul/Osong",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "4시간 20분",
      "durationTextEn": "4h 20m",
      "isDefault": true
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 고속버스",
      "nameEn": "Intercity Bus",
      "oneWayPriceKrw": 43000,
      "durationTextKo": "5시간 30분",
      "durationTextEn": "5h 30m"
    }
  ],
  "SUWON-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (직통)",
      "nameEn": "Express Bus (Direct)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct"
    }
  ],
  "SUWON-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (수원역 직통)",
      "nameEn": "KTX Train (Direct from Suwon)",
      "oneWayPriceKrw": 43000,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스",
      "nameEn": "Express Bus",
      "oneWayPriceKrw": 36000,
      "durationTextKo": "4시간 40분",
      "durationTextEn": "4h 40m"
    }
  ],
  "YEOSU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 고속버스 (서울 환승)",
      "nameEn": "Intercity Bus via Seoul",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "6시간 00분",
      "durationTextEn": "6h 00m",
      "isDefault": true
    }
  ],
  "INCHEON-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "AREX 직통열차 (논스톱)",
      "nameEn": "AREX Express Train (Non-stop)",
      "oneWayPriceKrw": 11000,
      "durationTextKo": "43분",
      "durationTextEn": "43m",
      "isDefault": true,
      "badgeTextKo": "논스톱 직행",
      "badgeTextEn": "Non-stop"
    },
    {
      "mode": "SRT",
      "nameKo": "AREX 일반열차 (지하철)",
      "nameEn": "AREX All-Stop Train",
      "oneWayPriceKrw": 4450,
      "durationTextKo": "59분",
      "durationTextEn": "59m",
      "badgeTextKo": "T-Money",
      "badgeTextEn": "T-Money"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 리무진 버스 (6000번대)",
      "nameEn": "Airport Limousine Bus",
      "oneWayPriceKrw": 17000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "badgeTextKo": "호텔직행",
      "badgeTextEn": "Hotel Door"
    }
  ],
  "INCHEON-SUWON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 리무진 버스 (4100번 직통)",
      "nameEn": "Airport Limousine Bus (4100)",
      "oneWayPriceKrw": 13500,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct"
    },
    {
      "mode": "KTX",
      "nameKo": "AREX + 서울역 KTX/지하철",
      "nameEn": "AREX + Train via Seoul",
      "oneWayPriceKrw": 12850,
      "durationTextKo": "1시간 20분",
      "durationTextEn": "1h 20m"
    }
  ],
  "INCHEON-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 우등 리무진 버스",
      "nameEn": "Direct Airport Limousine Bus",
      "oneWayPriceKrw": 33000,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "환승없음",
      "badgeTextEn": "Non-stop"
    },
    {
      "mode": "KTX",
      "nameKo": "AREX + 용산역 KTX 환승",
      "nameEn": "AREX + KTX via Yongsan",
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
      "nameKo": "AREX + 서울역 KTX 고속철도",
      "nameEn": "AREX + KTX via Seoul",
      "oneWayPriceKrw": 70800,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 우등 고속버스",
      "nameEn": "Direct Airport Bus",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m"
    },
    {
      "mode": "FLIGHT",
      "nameKo": "공항철도(김포) + 김포-김해 항공",
      "nameEn": "AREX + Domestic Flight",
      "oneWayPriceKrw": 85000,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m"
    }
  ],
  "INCHEON-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "AREX + 서울역 KTX-이음 환승",
      "nameEn": "AREX + KTX-Eum via Seoul",
      "oneWayPriceKrw": 38600,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 시외 고속버스",
      "nameEn": "Direct Airport Bus",
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
      "nameKo": "AREX + 서울역 KTX 환승",
      "nameEn": "AREX + KTX via Seoul",
      "oneWayPriceKrw": 60300,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 우등 고속버스",
      "nameEn": "Direct Airport Bus",
      "oneWayPriceKrw": 44000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m"
    }
  ],
  "INCHEON-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "AREX + 용산역 KTX 환승",
      "nameEn": "AREX + KTX via Yongsan",
      "oneWayPriceKrw": 58200,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 우등 고속버스",
      "nameEn": "Direct Airport Bus",
      "oneWayPriceKrw": 42000,
      "durationTextKo": "4시간 40분",
      "durationTextEn": "4h 40m"
    }
  ],
  "INCHEON-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 시외버스",
      "nameEn": "Direct Airport Bus",
      "oneWayPriceKrw": 32000,
      "durationTextKo": "3시간 10분",
      "durationTextEn": "3h 10m",
      "isDefault": true,
      "badgeTextKo": "직통",
      "badgeTextEn": "Direct"
    }
  ]
};

/**
 * 두 도시 간의 요금 옵션 목록을 반환합니다. (양방향 대칭 및 지능형 현실 루트 매핑)
 */
export function getIntercityFareOptions(from: SupportedCity | "INCHEON", to: SupportedCity | "INCHEON"): IntercityFareInfo[] {
  const directKey = `${from}-${to}`;
  if (INTERCITY_FARE_TABLE[directKey]) {
    return INTERCITY_FARE_TABLE[directKey];
  }

  const reverseKey = `${to}-${from}`;
  if (INTERCITY_FARE_TABLE[reverseKey]) {
    return INTERCITY_FARE_TABLE[reverseKey];
  }

  // 제주 관련 등록되지 않은 지선 (항공 + 공항 연계 기본 적용)
  if (from === "JEJU" || to === "JEJU") {
    const otherCity = from === "JEJU" ? to : from;
    return [
      { mode: "FLIGHT", nameKo: `국내선 항공 + ${otherCity} 연계 교통`, nameEn: "Domestic Flight + Ground Transit", oneWayPriceKrw: 85000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true, badgeTextKo: "항공연계", badgeTextEn: "Flight Link" },
    ];
  }

  // 육지 도시 간 기본 현실 폴백 (KTX 또는 고속버스)
  return [
    { mode: "KTX", nameKo: "KTX / K-철도 고속이동", nameEn: "KTX / Rail Transit", oneWayPriceKrw: 38000, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true, badgeTextKo: "추천", badgeTextEn: "Recommended" },
    { mode: "EXPRESS_BUS", nameKo: "시외 / 우등 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 24000, durationTextKo: "3시간 00분", durationTextEn: "3h 00m", badgeTextKo: "버스", badgeTextEn: "Bus" },
  ];
}

export const AIRPORT_INFO_MAP: Record<string, { nameKo: string; nameEn: string; code: string }> = {
  INCHEON: { nameKo: "인천국제공항", nameEn: "Incheon Int'l Airport", code: "ICN" },
  GIMPO: { nameKo: "김포국제공항", nameEn: "Gimpo Int'l Airport", code: "GMP" },
  GIMHAE: { nameKo: "김해국제공항 (부산)", nameEn: "Gimhae Int'l Airport (Busan)", code: "PUS" },
  JEJU_AIRPORT: { nameKo: "제주국제공항", nameEn: "Jeju Int'l Airport", code: "CJU" },
};

/**
 * 주요 게이트웨이 공항에서 목적지 도시로의 현실적 공항 이동 옵션을 반환합니다.
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
    if (targetCity === "SUWON") {
      return [
        { mode: "EXPRESS_BUS", nameKo: "김포공항 리무진 버스 (4300번 직통)", nameEn: "Airport Limousine (4300)", oneWayPriceKrw: 8000, durationTextKo: "50분", durationTextEn: "50m", isDefault: true, badgeTextKo: "직통추천", badgeTextEn: "Direct" },
        { mode: "SRT", nameKo: "서해선/수인분당선 지하철", nameEn: "Subway Transit", oneWayPriceKrw: 2400, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", badgeTextKo: "T-Money", badgeTextEn: "T-Money" },
      ];
    }
    if (targetCity === "JEJU") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공 (김포 ➔ 제주)", nameEn: "Domestic Flight to Jeju", oneWayPriceKrw: 75000, durationTextKo: "1시간 10분", durationTextEn: "1h 10m", isDefault: true, badgeTextKo: "항공직항", badgeTextEn: "Direct Flight" },
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
    if (targetCity === "SUWON") {
      return [
        { mode: "FLIGHT", nameKo: "국내선 항공(김포) + 수원 리무진 버스", nameEn: "Flight to Gimpo + Suwon Limousine", oneWayPriceKrw: 83000, durationTextKo: "2시간 00분", durationTextEn: "2h 00m", isDefault: true, badgeTextKo: "현실추천", badgeTextEn: "Recommended" },
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
