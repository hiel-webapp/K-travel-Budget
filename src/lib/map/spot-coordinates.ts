import { SupportedCity } from "../trip-domain";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SpotGeoInfo {
  lat: number;
  lng: number;
  addressKo?: string;
  addressEn?: string;
}

// 1. 지원 도시별 중심 기준 좌표
export const CITY_CENTER_COORDINATES: Record<SupportedCity, LatLng> = {
  SEOUL: { lat: 37.5665, lng: 126.978 },
  BUSAN: { lat: 35.1796, lng: 129.0756 },
  JEJU: { lat: 33.4996, lng: 126.5312 },
  GYEONGJU: { lat: 35.8562, lng: 129.2247 },
  GANGNEUNG: { lat: 37.7519, lng: 128.8761 },
  JEONJU: { lat: 35.8242, lng: 127.148 },
  INCHEON: { lat: 37.4563, lng: 126.7052 },
  SUWON: { lat: 37.2636, lng: 127.0286 },
  YEOSU: { lat: 34.7604, lng: 127.6622 },
  SOKCHO: { lat: 38.207, lng: 128.5918 },
};

// 2. 한국 주요 관광지 정밀 WGS84 좌표 딕셔너리
export const PRESET_SPOT_COORDINATES: Record<string, SpotGeoInfo> = {
  // --- 서울 (Seoul) ---
  경복궁: { lat: 37.5796, lng: 126.977 },
  창덕궁: { lat: 37.5794, lng: 126.991 },
  창경궁: { lat: 37.5788, lng: 126.995 },
  덕수궁: { lat: 37.5658, lng: 126.9751 },
  인사동: { lat: 37.5744, lng: 126.9856 },
  쌈지길: { lat: 37.5743, lng: 126.985 },
  북촌한옥마을: { lat: 37.5826, lng: 126.983 },
  서촌: { lat: 37.5801, lng: 126.9705 },
  광화문광장: { lat: 37.5724, lng: 126.9769 },
  청계천: { lat: 37.5692, lng: 126.9787 },
  N서울타워: { lat: 37.5512, lng: 126.9882 },
  남산타워: { lat: 37.5512, lng: 126.9882 },
  남산서울타워: { lat: 37.5512, lng: 126.9882 },
  명동거리: { lat: 37.5636, lng: 126.984 },
  명동성당: { lat: 37.5632, lng: 126.9873 },
  동대문디자인플라자: { lat: 37.5665, lng: 127.009 },
  DDP: { lat: 37.5665, lng: 127.009 },
  광장시장: { lat: 37.5701, lng: 126.9997 },
  익선동: { lat: 37.5742, lng: 126.9897 },
  익선동한옥마을: { lat: 37.5742, lng: 126.9897 },
  홍대: { lat: 37.5563, lng: 126.9237 },
  홍대걷고싶은거리: { lat: 37.5563, lng: 126.9237 },
  연남동: { lat: 37.5621, lng: 126.9248 },
  성수동: { lat: 37.5444, lng: 127.056 },
  성수동카페거리: { lat: 37.5444, lng: 127.056 },
  서울숲: { lat: 37.5443, lng: 127.0374 },
  여의도한강공원: { lat: 37.5284, lng: 126.9329 },
  더현대서울: { lat: 37.5259, lng: 126.9284 },
  코엑스: { lat: 37.5101, lng: 127.0599 },
  별마당도서관: { lat: 37.5101, lng: 127.0599 },
  롯데월드타워: { lat: 37.5126, lng: 127.1025 },
  롯데월드: { lat: 37.5112, lng: 127.0982 },
  석촌호수: { lat: 37.5091, lng: 127.1017 },
  국립중앙박물관: { lat: 37.524, lng: 126.9803 },
  남대문시장: { lat: 37.5592, lng: 126.9776 },
  노량진수산시장: { lat: 37.5152, lng: 126.9372 },

  // --- 부산 (Busan) ---
  해운대해수욕장: { lat: 35.1587, lng: 129.1604 },
  해운대: { lat: 35.1587, lng: 129.1604 },
  광안리해수욕장: { lat: 35.1532, lng: 129.1186 },
  광안리: { lat: 35.1532, lng: 129.1186 },
  광안대교: { lat: 35.148, lng: 129.135 },
  감천문화마을: { lat: 35.0975, lng: 129.0106 },
  흰여울문화마을: { lat: 35.0788, lng: 129.045 },
  자갈치시장: { lat: 35.0968, lng: 129.0306 },
  국제시장: { lat: 35.101, lng: 129.0283 },
  BIFF광장: { lat: 35.0986, lng: 129.0298 },
  용두산공원: { lat: 35.1015, lng: 129.0325 },
  해동용궁사: { lat: 35.1884, lng: 129.2234 },
  송도해수욕장: { lat: 35.076, lng: 129.0205 },
  송도해상케이블카: { lat: 35.076, lng: 129.0205 },
  태종대: { lat: 35.0531, lng: 129.0877 },
  전포카페거리: { lat: 35.1554, lng: 129.0664 },
  블루라인파크: { lat: 35.1617, lng: 129.1772 },
  오륙도스카이워크: { lat: 35.128, lng: 129.1235 },

  // --- 제주 (Jeju) ---
  성산일출봉: { lat: 33.4581, lng: 126.9426 },
  우도: { lat: 33.5043, lng: 126.9541 },
  섭지코지: { lat: 33.4244, lng: 126.9298 },
  협재해수욕장: { lat: 33.3941, lng: 126.2397 },
  금능해수욕장: { lat: 33.3892, lng: 126.2341 },
  애월한담산책로: { lat: 33.4623, lng: 126.3108 },
  한라산: { lat: 33.3617, lng: 126.5332 },
  한라산국립공원: { lat: 33.3617, lng: 126.5332 },
  중문관광단지: { lat: 33.2486, lng: 126.4124 },
  천지연폭포: { lat: 33.2447, lng: 126.5596 },
  정방폭포: { lat: 33.2448, lng: 126.5717 },
  동문재래시장: { lat: 33.5126, lng: 126.5284 },
  사려니숲길: { lat: 33.4077, lng: 126.643 },
  산굼부리: { lat: 33.4335, lng: 126.6875 },
  함덕해수욕장: { lat: 33.5434, lng: 126.6692 },

  // --- 경주 (Gyeongju) ---
  첨성대: { lat: 35.8347, lng: 129.219 },
  동궁과월지: { lat: 35.8341, lng: 129.2266 },
  안압지: { lat: 35.8341, lng: 129.2266 },
  불국사: { lat: 35.79, lng: 129.3321 },
  석굴암: { lat: 35.7948, lng: 129.3496 },
  대릉원: { lat: 35.8385, lng: 129.2104 },
  황리단길: { lat: 35.8377, lng: 129.2091 },
  월정교: { lat: 35.8295, lng: 129.2168 },
  보문관광단지: { lat: 35.8458, lng: 129.2801 },
  경주월드: { lat: 35.8415, lng: 129.2828 },
};

/**
 * 텍스트 정규화 키 생성
 */
function cleanKey(text: string): string {
  return text.toLowerCase().replace(/[^a-zA-Z0-9가-힣]/g, "");
}

/**
 * 스팟 명칭/ID를 기반으로 WGS84 좌표를 찾습니다.
 */
export function getSpotCoordinates(
  spotNameKo: string,
  spotNameEn: string,
  cityCode: SupportedCity,
  explicitLat?: number,
  explicitLng?: number,
  fallbackIndex: number = 0
): LatLng {
  // 1. 명시적 좌표가 유효한 경우 최우선 반환
  if (explicitLat && explicitLng && explicitLat > 30 && explicitLat < 40 && explicitLng > 120 && explicitLng < 135) {
    return { lat: explicitLat, lng: explicitLng };
  }

  // 2. 정확한 키 매칭
  if (PRESET_SPOT_COORDINATES[spotNameKo]) {
    return { lat: PRESET_SPOT_COORDINATES[spotNameKo].lat, lng: PRESET_SPOT_COORDINATES[spotNameKo].lng };
  }

  // 3. 부분 키 매칭 (정규화 비교)
  const cleanKo = cleanKey(spotNameKo);
  for (const [key, geo] of Object.entries(PRESET_SPOT_COORDINATES)) {
    const cleanPreset = cleanKey(key);
    if (cleanKo.includes(cleanPreset) || cleanPreset.includes(cleanKo)) {
      return { lat: geo.lat, lng: geo.lng };
    }
  }

  // 4. 도시 중심 좌표 기반 안전 폴백 (마커가 완전히 겹치지 않도록 미세 오프셋 분산)
  const center = CITY_CENTER_COORDINATES[cityCode] || { lat: 37.5665, lng: 126.978 };
  const offsetR = 0.008 * (Math.floor(fallbackIndex / 6) + 1);
  const angle = (fallbackIndex % 6) * (Math.PI / 3);
  return {
    lat: center.lat + offsetR * Math.cos(angle),
    lng: center.lng + offsetR * Math.sin(angle),
  };
}

/**
 * 두 좌표 간의 직선 거리(km) 계산 (하버사인 공식)
 */
export function calculateDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371; // 지구 반경 km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Nearest-Neighbor 알고리즘을 이용한 최적 동선(1, 2, 3...) 정렬
 */
export function optimizeSpotSequence<T extends { lat: number; lng: number }>(spots: T[]): T[] {
  if (spots.length <= 2) return [...spots];

  const remaining = [...spots];
  const optimized: T[] = [];

  // 가장 북서쪽(위도 높고 경도 낮은 지점)을 기점으로 첫 출발지 선정
  let currentIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < remaining.length; i++) {
    const score = remaining[i].lat - remaining[i].lng;
    if (score > bestScore) {
      bestScore = score;
      currentIdx = i;
    }
  }

  optimized.push(remaining.splice(currentIdx, 1)[0]);

  // 가장 가까운 인접 스팟 순차 탐색
  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceKm(current, remaining[i]);
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIdx = i;
      }
    }

    optimized.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return optimized;
}

/**
 * 카카오맵 길찾기 딥링크 URL 생성
 * - 단일 목적지: https://map.kakao.com/link/to/이름,lat,lng
 * - 앱 딥링크 스킴: kakaomap://route?ep=lat,lng
 */
export function getKakaoMapDirectLink(spotName: string, lat: number, lng: number): string {
  const encodedName = encodeURIComponent(spotName);
  return `https://map.kakao.com/link/to/${encodedName},${lat},${lng}`;
}
