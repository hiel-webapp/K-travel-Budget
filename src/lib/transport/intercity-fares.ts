import { SupportedCity } from "../trip-domain";

export type IntercityTransportMode = "KTX" | "SRT" | "EXPRESS_BUS" | "FLIGHT";

export interface IntercityFareInfo {
  mode: IntercityTransportMode;
  nameKo: string;
  nameEn: string;
  oneWayPriceKrw: number;
  durationTextKo: string;
  durationTextEn: string;
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
    { mode: "KTX", nameKo: "KTX (고속철도)", nameEn: "KTX Express Train", oneWayPriceKrw: 59800, durationTextKo: "2시간 40분", durationTextEn: "2h 40m" },
    { mode: "SRT", nameKo: "SRT (수서발 고속철)", nameEn: "SRT Express Train", oneWayPriceKrw: 52000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m" },
    { mode: "EXPRESS_BUS", nameKo: "우등 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 36000, durationTextKo: "4시간 15분", durationTextEn: "4h 15m" },
    { mode: "FLIGHT", nameKo: "국내선 항공", nameEn: "Domestic Flight", oneWayPriceKrw: 78000, durationTextKo: "1시간 05분", durationTextEn: "1h 05m" },
  ],
  // 서울 - 수원
  "SEOUL-SUWON": [
    { mode: "KTX", nameKo: "KTX / 무궁화호", nameEn: "KTX / Train", oneWayPriceKrw: 8400, durationTextKo: "30분", durationTextEn: "30m" },
    { mode: "EXPRESS_BUS", nameKo: "광역 / 시외버스", nameEn: "Express Bus", oneWayPriceKrw: 3000, durationTextKo: "45분", durationTextEn: "45m" },
  ],
  // 서울 - 속초
  "SEOUL-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "프리미엄 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 23000, durationTextKo: "2시간 20분", durationTextEn: "2h 20m" },
    { mode: "KTX", nameKo: "KTX (강릉 연계)", nameEn: "KTX via Gangneung", oneWayPriceKrw: 29000, durationTextKo: "2시간 10분", durationTextEn: "2h 10m" },
  ],
  // 수원 - 속초
  "SUWON-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "시외 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 24500, durationTextKo: "2시간 50분", durationTextEn: "2h 50m" },
  ],
  // 부산 - 전주 / 속초
  "BUSAN-SOKCHO": [
    { mode: "EXPRESS_BUS", nameKo: "시외 고속버스", nameEn: "Express Bus", oneWayPriceKrw: 42000, durationTextKo: "5시간 00분", durationTextEn: "5h 00m" },
  ],
  "BUSAN-SUWON": [
    { mode: "KTX", nameKo: "KTX 고속철도", nameEn: "KTX Train", oneWayPriceKrw: 52000, durationTextKo: "2시간 30분", durationTextEn: "2h 30m" },
    { mode: "EXPRESS_BUS", nameKo: "고속버스", nameEn: "Express Bus", oneWayPriceKrw: 34000, durationTextKo: "4시간 00분", durationTextEn: "4h 00m" },
  ],
};

/**
 * 두 도시 간의 요금 옵션 목록을 반환합니다. (양방향 대칭 지원)
 */
export function getIntercityFareOptions(from: SupportedCity, to: SupportedCity): IntercityFareInfo[] {
  const directKey = `${from}-${to}`;
  if (INTERCITY_FARE_TABLE[directKey]) {
    return INTERCITY_FARE_TABLE[directKey];
  }

  const reverseKey = `${to}-${from}`;
  if (INTERCITY_FARE_TABLE[reverseKey]) {
    return INTERCITY_FARE_TABLE[reverseKey];
  }

  // 기본 폴백 (기타 구간)
  return [
    { mode: "KTX", nameKo: "KTX / K-철도", nameEn: "Express Train", oneWayPriceKrw: 35000, durationTextKo: "2시간 00분", durationTextEn: "2h 00m" },
    { mode: "EXPRESS_BUS", nameKo: "고속 / 시외버스", nameEn: "Express Bus", oneWayPriceKrw: 22000, durationTextKo: "3시간 00분", durationTextEn: "3h 00m" },
  ];
}
