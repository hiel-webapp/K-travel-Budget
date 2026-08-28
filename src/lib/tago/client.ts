import { TagoTrainItem, TagoExpBusItem } from "./types";

const TAGO_BASE_URL = "http://apis.data.go.kr/1613000";

function getApiKey(): string {
  const key = process.env.TAGO_API_KEY || process.env.KTO_API_KEY || "";
  if (!key) {
    throw new Error("TAGO_API_KEY가 환경변수에 설정되어 있지 않습니다.");
  }
  return key.trim();
}

/**
 * 출발역 ID와 도착역 ID를 기반으로 당일/특정일자 열차 스케줄 및 공식 요금 목록을 조회합니다.
 */
export async function fetchTrainSchedule(
  depPlaceId: string,
  arrPlaceId: string,
  depPlandTime?: string // YYYYMMDD (생략 시 오늘)
): Promise<TagoTrainItem[]> {
  const serviceKey = getApiKey();
  let url = `${TAGO_BASE_URL}/TrainInfo/GetStrtpntAlocFndTrainInfo?serviceKey=${serviceKey}&depPlaceId=${depPlaceId}&arrPlaceId=${arrPlaceId}&_type=json&numOfRows=50`;
  
  if (depPlandTime) {
    url += `&depPlandTime=${depPlandTime}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[TAGO Train] HTTP 오류 ${res.status} for ${depPlaceId} -> ${arrPlaceId}`);
      return [];
    }

    const data = await res.json();
    if (data.response?.header?.resultCode !== "00") {
      return [];
    }

    const rawItems = data.response?.body?.items?.item;
    if (!rawItems) return [];
    return Array.isArray(rawItems) ? rawItems : [rawItems];
  } catch (err: any) {
    console.warn(`[TAGO Train] 조회 실패 (${depPlaceId} ➔ ${arrPlaceId}):`, err.message);
    return [];
  }
}

/**
 * 출발 터미널 ID와 도착 터미널 ID를 기반으로 고속버스 스케줄 및 공식 요금 목록을 조회합니다.
 */
export async function fetchExpBusSchedule(
  depTerminalId: string,
  arrTerminalId: string,
  depPlandTime?: string // YYYYMMDD (생략 시 오늘)
): Promise<TagoExpBusItem[]> {
  const serviceKey = getApiKey();
  let url = `${TAGO_BASE_URL}/ExpBusInfo/GetStrtpntAlocFndExpbusInfo?serviceKey=${serviceKey}&depTerminalId=${depTerminalId}&arrTerminalId=${arrTerminalId}&_type=json&numOfRows=50`;

  if (depPlandTime) {
    url += `&depPlandTime=${depPlandTime}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (data.response?.header?.resultCode !== "00") {
      return [];
    }

    const rawItems = data.response?.body?.items?.item;
    if (!rawItems) return [];
    return Array.isArray(rawItems) ? rawItems : [rawItems];
  } catch (err: any) {
    return [];
  }
}

/**
 * 출발 터미널 ID와 도착 터미널 ID를 기반으로 시외버스(SuburbsBus) 스케줄 및 공식 요금 목록을 조회합니다.
 */
export async function fetchSuburbsBusSchedule(
  depTerminalId: string,
  arrTerminalId: string,
  depPlandTime?: string // YYYYMMDD (생략 시 오늘)
): Promise<TagoExpBusItem[]> {
  const serviceKey = getApiKey();
  let url = `${TAGO_BASE_URL}/SuburbsBusInfoService/getStrtpntAlocFndSubrbBusInfo?serviceKey=${serviceKey}&depTerminalId=${depTerminalId}&arrTerminalId=${arrTerminalId}&_type=json&numOfRows=50`;

  if (depPlandTime) {
    url += `&depPlandTime=${depPlandTime}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (data.response?.header?.resultCode !== "00") {
      return [];
    }

    const rawItems = data.response?.body?.items?.item;
    if (!rawItems) return [];
    const list = Array.isArray(rawItems) ? rawItems : [rawItems];
    return list.map((i: any) => ({
      routeId: i.routeId || `${depTerminalId}-${arrTerminalId}`,
      depPlaceNm: i.depPlaceNm || i.depTerminalNm || "",
      arrPlaceNm: i.arrPlaceNm || i.arrTerminalNm || "",
      depPlandTime: i.depPlandTime,
      arrPlandTime: i.arrPlandTime,
      charge: i.charge || i.adultCharge || 0,
      gradeNm: i.gradeNm || "시외우등",
    }));
  } catch (err: any) {
    return [];
  }
}

/**
 * 2단계 버스 배차 통합 폴백 조회:
 * 1) 고속버스(KOBUS) 배차 조회 (배차 건수 > 0 이면 채택)
 * 2) 고속버스 배차가 0건이면 시외버스(SuburbsBus) 전산망 자동 폴백 조회
 */
export async function fetchBusScheduleWithFallback(
  depTerminalId: string,
  arrTerminalId: string,
  depPlandTime?: string
): Promise<{ items: TagoExpBusItem[]; networkType: "KOBUS" | "BUSTAGO" }> {
  // 1단계: 고속버스(KOBUS) 조회
  const expItems = await fetchExpBusSchedule(depTerminalId, arrTerminalId, depPlandTime);
  if (expItems.length > 0) {
    return { items: expItems, networkType: "KOBUS" };
  }

  // 2단계: 시외버스(SuburbsBus) 폴백 조회
  const subrbItems = await fetchSuburbsBusSchedule(depTerminalId, arrTerminalId, depPlandTime);
  if (subrbItems.length > 0) {
    return { items: subrbItems, networkType: "BUSTAGO" };
  }

  return { items: [], networkType: "KOBUS" };
}

/**
 * 소요 시간(분)을 사람이 읽기 편한 "2시간 40분" 형태의 한국어 및 영어 문자열로 변환
 */
export function formatDurationTexts(minutes: number): { ko: string; en: string } {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  let ko = "";
  let en = "";

  if (hrs > 0 && mins > 0) {
    ko = `${hrs}시간 ${mins}분`;
    en = `${hrs}h ${mins}m`;
  } else if (hrs > 0) {
    ko = `${hrs}시간 00분`;
    en = `${hrs}h 00m`;
  } else {
    ko = `${mins}분`;
    en = `${mins}m`;
  }

  return { ko, en };
}
