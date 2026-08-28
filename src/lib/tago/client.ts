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
      console.warn(`[TAGO ExpBus] HTTP 오류 ${res.status} for ${depTerminalId} -> ${arrTerminalId}`);
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
    console.warn(`[TAGO ExpBus] 조회 실패 (${depTerminalId} ➔ ${arrTerminalId}):`, err.message);
    return [];
  }
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
