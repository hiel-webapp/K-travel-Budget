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
 * 대한민국 10대 여행 도시 간 최적 추천 1개 이동 수단 및 인천공항 게이트웨이 옵션 테이블
 * (원칙: 도시 간 이동은 외국인에게 가장 안전하고 빠른 1개 최적 수단 단일 노출,
 *        공항 입출국은 AREX/철도 vs 직행 공항리무진 2개 옵션 제공)
 */
export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo[]> = {
  "SEOUL-BUSAN": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (서울역 ➔ 부산역)",
      "nameEn": "KTX Express Train (Seoul ➔ Busan)",
      "oneWayPriceKrw": 59800,
      "durationTextKo": "2시간 37분",
      "durationTextEn": "2h 37m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    }
  ],
  "SEOUL-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 (김포공항 ➔ 제주공항)",
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
      "nameKo": "KTX 고속철도 (용산역 ➔ 전주역)",
      "nameEn": "KTX Express (Yongsan ➔ Jeonju)",
      "oneWayPriceKrw": 23700,
      "durationTextKo": "59분",
      "durationTextEn": "59m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    }
  ],
  "SEOUL-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (서울역 ➔ 신경주역)",
      "nameEn": "KTX Express (Seoul ➔ Singyeongju)",
      "oneWayPriceKrw": 49300,
      "durationTextKo": "2시간 2분",
      "durationTextEn": "2h 2m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    }
  ],
  "SEOUL-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "KTX-이음 고속철도 (서울/청량리 ➔ 강릉)",
      "nameEn": "KTX-Eum (Seoul/Cheongnyangni ➔ Gangneung)",
      "oneWayPriceKrw": 27600,
      "durationTextKo": "1시간 57분",
      "durationTextEn": "1h 57m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    }
  ],
  "SEOUL-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (용산역 ➔ 여수엑스포역)",
      "nameEn": "KTX Express (Yongsan ➔ Yeosu Expo)",
      "oneWayPriceKrw": 47200,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    }
  ],
  "SEOUL-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "KTX / ITX-새마을 (서울역 ➔ 수원역)",
      "nameEn": "KTX / Fast Train (Seoul ➔ Suwon)",
      "oneWayPriceKrw": 8400,
      "durationTextKo": "30분",
      "durationTextEn": "30m",
      "isDefault": true,
      "badgeTextKo": "철도직통",
      "badgeTextEn": "Fast Train"
    }
  ],
  "SEOUL-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "우등 고속버스 (서울경부/동서울 ➔ 속초)",
      "nameEn": "Express Bus (Seoul ➔ Sokcho)",
      "oneWayPriceKrw": 22300,
      "durationTextKo": "2시간 20분",
      "durationTextEn": "2h 20m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "JEJU-SUWON": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(제주➔김포) + 수원 리무진 버스(4300번)",
      "nameEn": "Flight (CJU➔GMP) + Airport Limousine (4300)",
      "oneWayPriceKrw": 83000,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true,
      "badgeTextKo": "현실추천",
      "badgeTextEn": "Recommended"
    }
  ],
  "JEJU-BUSAN": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 (제주공항 ➔ 김해공항)",
      "nameEn": "Domestic Flight (CJU ➔ PUS)",
      "oneWayPriceKrw": 65000,
      "durationTextKo": "1시간 00분",
      "durationTextEn": "1h 00m",
      "isDefault": true,
      "badgeTextKo": "항공직항",
      "badgeTextEn": "Direct Flight"
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
    }
  ],
  "JEJU-GYEONGJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(김해공항) + 경주 직행 리무진",
      "nameEn": "Flight to Gimhae + Gyeongju Limousine",
      "oneWayPriceKrw": 76000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Recommended"
    }
  ],
  "JEJU-GANGNEUNG": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(김포공항) + 서울역 KTX-이음",
      "nameEn": "Flight to Gimpo + KTX-Eum to Gangneung",
      "oneWayPriceKrw": 102600,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Recommended"
    }
  ],
  "JEJU-YEOSU": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공 (제주공항 ➔ 여수공항 직항)",
      "nameEn": "Domestic Flight (CJU ➔ RSU Direct)",
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
      "nameKo": "국내선 항공(김포공항) + 속초 고속버스",
      "nameEn": "Flight to Gimpo + Sokcho Express Bus",
      "oneWayPriceKrw": 98000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Recommended"
    }
  ],
  "JEJU-INCHEON": [
    {
      "mode": "FLIGHT",
      "nameKo": "국내선 항공(김포공항) + 공항철도(인천)",
      "nameEn": "Flight to Gimpo + AREX to Incheon",
      "oneWayPriceKrw": 77500,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
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
    }
  ],
  "BUSAN-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (부산사상 ➔ 전주)",
      "nameEn": "Intercity Express Bus (Sasang ➔ Jeonju)",
      "oneWayPriceKrw": 28900,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "BUSAN-YEOSU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (부산사상 ➔ 여수)",
      "nameEn": "Intercity Express Bus (Sasang ➔ Yeosu)",
      "oneWayPriceKrw": 23600,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "BUSAN-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "동해선 ITX-마음 직통열차 (부산 ➔ 강릉)",
      "nameEn": "Donghae Line Train (Busan ➔ Gangneung)",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "3시간 40분",
      "durationTextEn": "3h 40m",
      "isDefault": true,
      "badgeTextKo": "해안철도",
      "badgeTextEn": "Coastal Rail"
    }
  ],
  "BUSAN-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (부산역 ➔ 수원역 직통)",
      "nameEn": "KTX Train (Busan ➔ Suwon Direct)",
      "oneWayPriceKrw": 52000,
      "durationTextKo": "2시간 30분",
      "durationTextEn": "2h 30m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    }
  ],
  "BUSAN-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (동해선 직행)",
      "nameEn": "Direct Intercity Bus (Busan ➔ Sokcho)",
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
      "nameKo": "KTX / ITX-새마을 (전주역 ➔ 여수엑스포역)",
      "nameEn": "KTX / Fast Train (Jeonju ➔ Yeosu)",
      "oneWayPriceKrw": 14200,
      "durationTextKo": "1시간 20분",
      "durationTextEn": "1h 20m",
      "isDefault": true,
      "badgeTextKo": "철도직통",
      "badgeTextEn": "Direct Train"
    }
  ],
  "JEONJU-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (전주역 ➔ 신경주역)",
      "nameEn": "KTX (Jeonju ➔ Singyeongju)",
      "oneWayPriceKrw": 25800,
      "durationTextKo": "1시간 1분",
      "durationTextEn": "1h 1m",
      "isDefault": true,
      "badgeTextKo": "고속철도",
      "badgeTextEn": "Fast Train"
    }
  ],
  "JEONJU-GANGNEUNG": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (전주 ➔ 강릉 직통)",
      "nameEn": "Intercity Bus (Jeonju ➔ Gangneung)",
      "oneWayPriceKrw": 34000,
      "durationTextKo": "4시간 00분",
      "durationTextEn": "4h 00m",
      "isDefault": true,
      "badgeTextKo": "직통버스",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "JEONJU-SUWON": [
    {
      "mode": "KTX",
      "nameKo": "KTX / ITX-새마을 (전주역 ➔ 수원역 직통)",
      "nameEn": "KTX / Fast Train (Jeonju ➔ Suwon)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "1시간 45분",
      "durationTextEn": "1h 45m",
      "isDefault": true,
      "badgeTextKo": "철도직통",
      "badgeTextEn": "Direct Train"
    }
  ],
  "JEONJU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 고속버스 (전주 ➔ 속초 환승연계)",
      "nameEn": "Intercity Bus to Sokcho",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "isDefault": true,
      "badgeTextKo": "추천",
      "badgeTextEn": "Recommended"
    }
  ],
  "GYEONGJU-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "KTX-이음 / ITX-마음 (신경주 ➔ 강릉)",
      "nameEn": "Donghae Line Train (Gyeongju ➔ Gangneung)",
      "oneWayPriceKrw": 34300,
      "durationTextKo": "2시간 44분",
      "durationTextEn": "2h 44m",
      "isDefault": true,
      "badgeTextKo": "철도직통",
      "badgeTextEn": "Direct Rail"
    }
  ],
  "GYEONGJU-YEOSU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (경주 ➔ 여수)",
      "nameEn": "Intercity Bus (Gyeongju ➔ Yeosu)",
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
      "nameKo": "KTX 고속철도 (신경주역 ➔ 수원역)",
      "nameEn": "KTX (Singyeongju ➔ Suwon)",
      "oneWayPriceKrw": 41000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    }
  ],
  "GYEONGJU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (동해선 직행)",
      "nameEn": "Intercity Bus (Gyeongju ➔ Sokcho)",
      "oneWayPriceKrw": 36000,
      "durationTextKo": "4시간 10분",
      "durationTextEn": "4h 10m",
      "isDefault": true,
      "badgeTextKo": "직통",
      "badgeTextEn": "Direct"
    }
  ],
  "GANGNEUNG-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "동해안 시외 직행버스 (강릉 ➔ 속초)",
      "nameEn": "Coastal Intercity Bus (Gangneung ➔ Sokcho)",
      "oneWayPriceKrw": 7500,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true,
      "badgeTextKo": "직통 50분",
      "badgeTextEn": "Direct 50m"
    }
  ],
  "GANGNEUNG-SUWON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (강릉 ➔ 수원 직통)",
      "nameEn": "Express Bus (Gangneung ➔ Suwon)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "직통버스",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "GANGNEUNG-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (강릉 ➔ 서울역 환승 ➔ 여수)",
      "nameEn": "KTX via Seoul Transfer (Gangneung ➔ Yeosu)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "4시간 20분",
      "durationTextEn": "4h 20m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    }
  ],
  "SUWON-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 우등 고속버스 (수원 ➔ 속초 직통)",
      "nameEn": "Express Bus (Suwon ➔ Sokcho)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "직통버스",
      "badgeTextEn": "Direct Bus"
    }
  ],
  "SUWON-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "KTX 고속철도 (수원역 ➔ 여수엑스포역 직통)",
      "nameEn": "KTX Train (Suwon ➔ Yeosu Direct)",
      "oneWayPriceKrw": 43000,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "철도직통",
      "badgeTextEn": "Direct Rail"
    }
  ],
  "YEOSU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "시외 고속버스 (여수 ➔ 서울 환승 ➔ 속초)",
      "nameEn": "Intercity Bus via Seoul (Yeosu ➔ Sokcho)",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "6시간 00분",
      "durationTextEn": "6h 00m",
      "isDefault": true,
      "badgeTextKo": "환승연계",
      "badgeTextEn": "Transfer Link"
    }
  ],
  "INCHEON-SEOUL": [
    {
      "mode": "KTX",
      "nameKo": "AREX 직통열차 (인천공항 ➔ 서울역 논스톱)",
      "nameEn": "AREX Express Train (Airport ➔ Seoul Stn)",
      "oneWayPriceKrw": 11000,
      "durationTextKo": "43분",
      "durationTextEn": "43m",
      "isDefault": true,
      "badgeTextKo": "논스톱 직행",
      "badgeTextEn": "Non-stop"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 리무진 버스 (6000번대 호텔 직행)",
      "nameEn": "Airport Limousine Bus (To Hotels)",
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
      "nameKo": "공항 리무진 버스 (4100번 직통)",
      "nameEn": "Airport Limousine Bus (4100 Direct)",
      "oneWayPriceKrw": 13500,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true,
      "badgeTextKo": "직통추천",
      "badgeTextEn": "Direct Bus"
    },
    {
      "mode": "KTX",
      "nameKo": "AREX + 서울역 KTX/지하철 연계",
      "nameEn": "AREX + Train via Seoul",
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
      "nameKo": "공항 직행 우등 리무진 버스 (전주행)",
      "nameEn": "Direct Airport Limousine Bus to Jeonju",
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
      "nameKo": "AREX + 서울역 KTX 고속철도 (부산행)",
      "nameEn": "AREX + KTX to Busan via Seoul",
      "oneWayPriceKrw": 70800,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 우등 고속버스 (부산행)",
      "nameEn": "Direct Airport Bus to Busan",
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
      "nameKo": "AREX + 서울역 KTX-이음 환승 (강릉행)",
      "nameEn": "AREX + KTX-Eum to Gangneung",
      "oneWayPriceKrw": 38600,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 시외 고속버스 (강릉행)",
      "nameEn": "Direct Airport Bus to Gangneung",
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
      "nameKo": "AREX + 서울역 KTX 환승 (신경주행)",
      "nameEn": "AREX + KTX to Gyeongju via Seoul",
      "oneWayPriceKrw": 60300,
      "durationTextKo": "3시간 00분",
      "durationTextEn": "3h 00m",
      "isDefault": true,
      "badgeTextKo": "추천 1위",
      "badgeTextEn": "Best Choice"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 우등 고속버스 (경주행)",
      "nameEn": "Direct Airport Bus to Gyeongju",
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
      "nameKo": "AREX + 용산역 KTX 환승 (여수행)",
      "nameEn": "AREX + KTX to Yeosu via Yongsan",
      "oneWayPriceKrw": 58200,
      "durationTextKo": "3시간 50분",
      "durationTextEn": "3h 50m",
      "isDefault": true,
      "badgeTextKo": "KTX연계",
      "badgeTextEn": "KTX Link"
    },
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "공항 직행 우등 고속버스 (여수행)",
      "nameEn": "Direct Airport Bus to Yeosu",
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
      "nameKo": "공항 직행 시외버스 (속초행)",
      "nameEn": "Direct Airport Bus to Sokcho",
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
 * 두 도시 간의 요금 옵션 목록을 반환합니다. (양방향 대칭 및 지능형 매핑)
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

  // 제주 관련 등록되지 않은 지선 (항공 + 공항 연계)
  if (from === "JEJU" || to === "JEJU") {
    const otherCity = from === "JEJU" ? to : from;
    return [
      { mode: "FLIGHT", nameKo: `국내선 항공 + ${otherCity} 연계 교통`, nameEn: "Domestic Flight + Ground Transit", oneWayPriceKrw: 85000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true, badgeTextKo: "항공연계", badgeTextEn: "Flight Link" },
    ];
  }

  // 육지 도시 간 기본 현실 폴백 (KTX 고속철도)
  return [
    { mode: "KTX", nameKo: "KTX / K-철도 고속이동", nameEn: "KTX / Rail Transit", oneWayPriceKrw: 38000, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true, badgeTextKo: "추천 1위", badgeTextEn: "Recommended" },
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
      ];
    }
    return [
      { mode: "KTX", nameKo: "공항철도 ➔ 서울역/용산역 KTX", nameEn: "AREX + KTX via Seoul", oneWayPriceKrw: 42000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true, badgeTextKo: "KTX연계", badgeTextEn: "KTX Link" },
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
