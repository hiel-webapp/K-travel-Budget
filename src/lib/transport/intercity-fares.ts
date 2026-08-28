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

/**
 * 대한민국 10대 여행 도시 간 최적 추천 1개 이동 수단 및 공항 게이트웨이 옵션 테이블
 * [표기 규칙: 출발지(역/터미널) ➔ 도착지(역/공항) (탑승 수단)]
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
      "isDefault": true
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
      "isDefault": true
    }
  ],
  "SEOUL-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "김포공항 ➔ 제주공항 (국내선 항공)",
      "nameEn": "Gimpo Airport ➔ Jeju Airport (Flight)",
      "oneWayPriceKrw": 75000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true
    }
  ],
  "JEJU-SEOUL": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김포공항 (국내선 항공)",
      "nameEn": "Jeju Airport ➔ Gimpo Airport (Flight)",
      "oneWayPriceKrw": 75000,
      "durationTextKo": "1시간 10분",
      "durationTextEn": "1h 10m",
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
    }
  ],
  "JEJU-SUWON": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 수원 (국내선 항공 + 4300번 버스)",
      "nameEn": "Jeju Airport ➔ Gimpo Airport ➔ Suwon (Flight + Bus 4300)",
      "oneWayPriceKrw": 83000,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true
    }
  ],
  "SUWON-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "수원 ➔ 김포공항 ➔ 제주공항 (4300번 버스 + 국내선 항공)",
      "nameEn": "Suwon ➔ Gimpo Airport ➔ Jeju Airport (Bus 4300 + Flight)",
      "oneWayPriceKrw": 83000,
      "durationTextKo": "2시간 00분",
      "durationTextEn": "2h 00m",
      "isDefault": true
    }
  ],
  "JEJU-BUSAN": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김해공항 (국내선 항공)",
      "nameEn": "Jeju Airport ➔ Gimhae Airport (Flight)",
      "oneWayPriceKrw": 65000,
      "durationTextKo": "1시간 00분",
      "durationTextEn": "1h 00m",
      "isDefault": true
    }
  ],
  "BUSAN-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "김해공항 ➔ 제주공항 (국내선 항공)",
      "nameEn": "Gimhae Airport ➔ Jeju Airport (Flight)",
      "oneWayPriceKrw": 65000,
      "durationTextKo": "1시간 00분",
      "durationTextEn": "1h 00m",
      "isDefault": true
    }
  ],
  "JEJU-JEONJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 군산공항 ➔ 전주 (국내선 항공 + 시외버스)",
      "nameEn": "Jeju Airport ➔ Gunsan Airport ➔ Jeonju (Flight + Bus)",
      "oneWayPriceKrw": 72000,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true
    }
  ],
  "JEONJU-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "전주 ➔ 군산공항 ➔ 제주공항 (시외버스 + 국내선 항공)",
      "nameEn": "Jeonju ➔ Gunsan Airport ➔ Jeju Airport (Bus + Flight)",
      "oneWayPriceKrw": 72000,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true
    }
  ],
  "JEJU-GYEONGJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김해공항 ➔ 경주 (국내선 항공 + 공항리무진)",
      "nameEn": "Jeju Airport ➔ Gimhae Airport ➔ Gyeongju (Flight + Bus)",
      "oneWayPriceKrw": 76000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true
    }
  ],
  "GYEONGJU-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "경주 ➔ 김해공항 ➔ 제주공항 (공항리무진 + 국내선 항공)",
      "nameEn": "Gyeongju ➔ Gimhae Airport ➔ Jeju Airport (Bus + Flight)",
      "oneWayPriceKrw": 76000,
      "durationTextKo": "2시간 10분",
      "durationTextEn": "2h 10m",
      "isDefault": true
    }
  ],
  "JEJU-GANGNEUNG": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 강릉역 (국내선 항공 + 서울역 KTX)",
      "nameEn": "Jeju Airport ➔ Gimpo Airport ➔ Gangneung (Flight + KTX)",
      "oneWayPriceKrw": 102600,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true
    }
  ],
  "GANGNEUNG-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "강릉역 ➔ 서울역 ➔ 김포공항 ➔ 제주공항 (KTX + 국내선 항공)",
      "nameEn": "Gangneung ➔ Seoul Stn ➔ Gimpo Airport ➔ Jeju (KTX + Flight)",
      "oneWayPriceKrw": 102600,
      "durationTextKo": "3시간 20분",
      "durationTextEn": "3h 20m",
      "isDefault": true
    }
  ],
  "JEJU-YEOSU": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 여수공항 (국내선 직항 항공)",
      "nameEn": "Jeju Airport ➔ Yeosu Airport (Direct Flight)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true
    }
  ],
  "YEOSU-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "여수공항 ➔ 제주공항 (국내선 직항 항공)",
      "nameEn": "Yeosu Airport ➔ Jeju Airport (Direct Flight)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "50분",
      "durationTextEn": "50m",
      "isDefault": true
    }
  ],
  "JEJU-SOKCHO": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 속초 (국내선 항공 + 고속버스)",
      "nameEn": "Jeju Airport ➔ Gimpo Airport ➔ Sokcho (Flight + Bus)",
      "oneWayPriceKrw": 98000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "isDefault": true
    }
  ],
  "SOKCHO-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "속초 ➔ 김포공항 ➔ 제주공항 (고속버스 + 국내선 항공)",
      "nameEn": "Sokcho ➔ Gimpo Airport ➔ Jeju Airport (Bus + Flight)",
      "oneWayPriceKrw": 98000,
      "durationTextKo": "3시간 30분",
      "durationTextEn": "3h 30m",
      "isDefault": true
    }
  ],
  "JEJU-INCHEON": [
    {
      "mode": "FLIGHT",
      "nameKo": "제주공항 ➔ 김포공항 ➔ 인천공항 (국내선 항공 + 공항철도)",
      "nameEn": "Jeju Airport ➔ Gimpo Airport ➔ Incheon Airport (Flight + AREX)",
      "oneWayPriceKrw": 77500,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true
    }
  ],
  "INCHEON-JEJU": [
    {
      "mode": "FLIGHT",
      "nameKo": "인천공항 ➔ 김포공항 ➔ 제주공항 (공항철도 + 국내선 항공)",
      "nameEn": "Incheon Airport ➔ Gimpo Airport ➔ Jeju Airport (AREX + Flight)",
      "oneWayPriceKrw": 77500,
      "durationTextKo": "1시간 40분",
      "durationTextEn": "1h 40m",
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
    }
  ],
  "BUSAN-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "부산종합터미널 ➔ 속초고속터미널 (동해선 시외버스)",
      "nameEn": "Busan Terminal ➔ Sokcho Terminal (Intercity Bus)",
      "oneWayPriceKrw": 42000,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m",
      "isDefault": true
    }
  ],
  "SOKCHO-BUSAN": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초고속터미널 ➔ 부산종합터미널 (동해선 시외버스)",
      "nameEn": "Sokcho Terminal ➔ Busan Terminal (Intercity Bus)",
      "oneWayPriceKrw": 42000,
      "durationTextKo": "5시간 00분",
      "durationTextEn": "5h 00m",
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
    }
  ],
  "JEONJU-GYEONGJU": [
    {
      "mode": "KTX",
      "nameKo": "전주역 ➔ 오송역 ➔ 신경주역 (KTX 고속철도)",
      "nameEn": "Jeonju Stn ➔ Osong ➔ Singyeongju (KTX Express)",
      "oneWayPriceKrw": 25800,
      "durationTextKo": "1시간 1분",
      "durationTextEn": "1h 1m",
      "isDefault": true
    }
  ],
  "GYEONGJU-JEONJU": [
    {
      "mode": "KTX",
      "nameKo": "신경주역 ➔ 오송역 ➔ 전주역 (KTX 고속철도)",
      "nameEn": "Singyeongju ➔ Osong ➔ Jeonju Stn (KTX Express)",
      "oneWayPriceKrw": 25800,
      "durationTextKo": "1시간 01분",
      "durationTextEn": "1h 01m",
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
    }
  ],
  "JEONJU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "전주시외터미널 ➔ 속초고속터미널 (시외버스)",
      "nameEn": "Jeonju Terminal ➔ Sokcho Terminal (Intercity Bus)",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "isDefault": true
    }
  ],
  "SOKCHO-JEONJU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초고속터미널 ➔ 전주시외터미널 (시외버스)",
      "nameEn": "Sokcho Terminal ➔ Jeonju Terminal (Intercity Bus)",
      "oneWayPriceKrw": 38000,
      "durationTextKo": "4시간 30분",
      "durationTextEn": "4h 30m",
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
    }
  ],
  "GANGNEUNG-SUWON": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "강릉시외터미널 ➔ 수원버스터미널 (시외 우등버스)",
      "nameEn": "Gangneung Terminal ➔ Suwon Terminal (Express Bus)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true
    }
  ],
  "SUWON-GANGNEUNG": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "수원버스터미널 ➔ 강릉시외터미널 (시외 우등버스)",
      "nameEn": "Suwon Terminal ➔ Gangneung Terminal (Express Bus)",
      "oneWayPriceKrw": 24500,
      "durationTextKo": "2시간 50분",
      "durationTextEn": "2h 50m",
      "isDefault": true
    }
  ],
  "GANGNEUNG-YEOSU": [
    {
      "mode": "KTX",
      "nameKo": "강릉역 ➔ 서울역 ➔ 여수엑스포역 (KTX 고속철도 환승)",
      "nameEn": "Gangneung Stn ➔ Seoul ➔ Yeosu Expo (KTX via Seoul)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "4시간 20분",
      "durationTextEn": "4h 20m",
      "isDefault": true
    }
  ],
  "YEOSU-GANGNEUNG": [
    {
      "mode": "KTX",
      "nameKo": "여수엑스포역 ➔ 서울역 ➔ 강릉역 (KTX 고속철도 환승)",
      "nameEn": "Yeosu Expo ➔ Seoul ➔ Gangneung Stn (KTX via Seoul)",
      "oneWayPriceKrw": 68000,
      "durationTextKo": "4시간 20분",
      "durationTextEn": "4h 20m",
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
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
      "isDefault": true
    }
  ],
  "YEOSU-SOKCHO": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "여수종합터미널 ➔ 서울 ➔ 속초고속터미널 (고속버스 연계)",
      "nameEn": "Yeosu Terminal ➔ Seoul ➔ Sokcho (Express Bus via Seoul)",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "6시간 00분",
      "durationTextEn": "6h 00m",
      "isDefault": true
    }
  ],
  "SOKCHO-YEOSU": [
    {
      "mode": "EXPRESS_BUS",
      "nameKo": "속초고속터미널 ➔ 서울 ➔ 여수종합터미널 (고속버스 연계)",
      "nameEn": "Sokcho ➔ Seoul ➔ Yeosu Terminal (Express Bus via Seoul)",
      "oneWayPriceKrw": 48000,
      "durationTextKo": "6시간 00분",
      "durationTextEn": "6h 00m",
      "isDefault": true
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
 * 두 도시 간의 요금 옵션 목록을 반환합니다. (방향성 100% 보장)
 */
export function getIntercityFareOptions(from: SupportedCity | "INCHEON", to: SupportedCity | "INCHEON"): IntercityFareInfo[] {
  const directKey = `${from}-${to}`;
  if (INTERCITY_FARE_TABLE[directKey]) {
    return INTERCITY_FARE_TABLE[directKey];
  }

  const reverseKey = `${to}-${from}`;
  if (INTERCITY_FARE_TABLE[reverseKey]) {
    // 역방향일 경우 명칭 방향성을 자동 역전하여 생성
    return INTERCITY_FARE_TABLE[reverseKey].map((opt) => ({
      ...opt,
      nameKo: `${from} ➔ ${to} (${opt.mode === "KTX" ? "KTX 고속철도" : opt.mode === "FLIGHT" ? "국내선 항공" : "고속/시외버스"})`,
      nameEn: `${from} ➔ ${to} (${opt.mode === "KTX" ? "KTX Express" : opt.mode === "FLIGHT" ? "Flight" : "Express Bus"})`,
    }));
  }

  // 제주 관련 등록되지 않은 지선 (항공 + 공항 연계)
  if (from === "JEJU" || to === "JEJU") {
    return [
      { mode: "FLIGHT", nameKo: `${from} ➔ ${to} (국내선 항공 + 연계 교통)`, nameEn: `${from} ➔ ${to} (Flight + Ground Transit)`, oneWayPriceKrw: 85000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m", isDefault: true },
    ];
  }

  // 육지 도시 간 기본 현실 폴백 (KTX 고속철도)
  return [
    { mode: "KTX", nameKo: `${from} ➔ ${to} (KTX 고속철도)`, nameEn: `${from} ➔ ${to} (KTX Express Rail)`, oneWayPriceKrw: 38000, durationTextKo: "2시간 10분", durationTextEn: "2h 10m", isDefault: true },
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
    if (direction === "ENTRY") {
      return getIntercityFareOptions("INCHEON", targetCity);
    } else {
      return getIntercityFareOptions(targetCity, "INCHEON");
    }
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
