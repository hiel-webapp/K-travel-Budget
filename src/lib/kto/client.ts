import { KTO_BASE_URL_ENG, KTO_BASE_URL_KOR } from "./constants";
import { KtoApiResponse, KtoLocale } from "./types";

export interface KtoFetchParams {
  locale: KtoLocale;
  endpoint: string;
  params?: Record<string, string | number>;
}

/**
 * serviceKey 환경변수가 이미 URL 인코딩되어 있는 경우 URLSearchParams에 의해 %가 %25로 이중 인코딩되는 문제를 방지합니다.
 */
export function normalizeServiceKey(key: string): string {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

/**
 * 에러 메시지나 로그에서 비밀키(serviceKey) 파라미터가 노출되지 않도록 마스킹합니다.
 */
export function redactSensitiveParams(input: string): string {
  return input.replace(/serviceKey=[^&]*/gi, "serviceKey=[REDACTED]");
}

/**
 * KTO API 에러 응답(XML/JSON)에서 비밀값 없이 안전한 오류 코드 및 메시지만 추출합니다.
 */
export function parseSafeKtoErrorDetail(bodyText: string): string {
  if (!bodyText) return "";

  // 1. JSON 파싱 시도
  try {
    const parsed = JSON.parse(bodyText);
    const header = parsed?.response?.header || parsed?.header;
    if (header) {
      const code = header.resultCode || header.code || "";
      const msg = header.resultMsg || header.msg || "";
      if (code || msg) {
        return `Code: ${code}, Msg: ${msg}`;
      }
    }
  } catch {
    // JSON이 아닌 경우 (XML 또는 텍스트 에러)
  }

  // 2. XML 태그 추출 시도 (공공데이터 포털 / KTO 표준 에러 구조)
  const resultCodeMatch =
    bodyText.match(/<resultCode>(.*?)<\/resultCode>/i) ||
    bodyText.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/i);
  const resultMsgMatch =
    bodyText.match(/<resultMsg>(.*?)<\/resultMsg>/i) ||
    bodyText.match(/<errMsg>(.*?)<\/errMsg>/i) ||
    bodyText.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/i);

  const code = resultCodeMatch ? resultCodeMatch[1].trim() : "";
  const msg = resultMsgMatch ? resultMsgMatch[1].trim() : "";

  if (code || msg) {
    return `Code: ${code}, Msg: ${msg}`;
  }

  // 3. 기타 텍스트인 경우 민감 정보 마스킹 후 개행 정제
  const sanitized = redactSensitiveParams(bodyText)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);

  return sanitized;
}

export interface ParsedKtoItems<T> {
  rawItems: T[];
  totalCount: number;
}

/**
 * KTO API JSON 응답 body에서 items와 totalCount를 안전하게 추출합니다.
 * item이 배열이거나 단일 객체이거나 빈 문자열/객체인 모든 경우를 정밀히 지원합니다.
 */
export function extractKtoItemsAndCount<T>(body: unknown): ParsedKtoItems<T> {
  if (!body || typeof body !== "object") {
    return { rawItems: [], totalCount: 0 };
  }

  const b = body as Record<string, unknown>;

  let totalCount = 0;
  if (b.totalCount !== undefined && b.totalCount !== null) {
    const parsed = Number(b.totalCount);
    if (!isNaN(parsed)) {
      totalCount = parsed;
    }
  }

  const itemsField = b.items;
  let rawItems: T[] = [];

  if (itemsField && typeof itemsField === "object") {
    if ("item" in itemsField) {
      const itemVal = (itemsField as Record<string, unknown>).item;
      if (Array.isArray(itemVal)) {
        rawItems = itemVal as T[];
      } else if (itemVal && typeof itemVal === "object") {
        rawItems = [itemVal as T];
      } else {
        rawItems = [];
      }
    } else {
      rawItems = [];
    }
  } else {
    rawItems = [];
  }

  return { rawItems, totalCount };
}

export function getKtoCredentials() {
  const apiKey = process.env.KTO_API_KEY;
  const mobileApp = process.env.KTO_MOBILE_APP || "HypeHeritage";

  if (!apiKey) {
    throw new Error(
      "[KTO_CLIENT_ERROR] KTO_API_KEY environment variable is not configured."
    );
  }

  return { apiKey, mobileApp };
}

/**
 * 관광공사 OpenAPI를 호출하는 서버 전용 유틸리티 함수입니다.
 * 클라이언트(브라우저) 환경에서 호출되지 않으며 API 키를 외부에 노출하지 않습니다.
 */
export async function fetchKtoApi<T>({
  locale,
  endpoint,
  params = {},
}: KtoFetchParams): Promise<KtoApiResponse<T>> {
  if (typeof window !== "undefined") {
    throw new Error(
      "[KTO_CLIENT_ERROR] KTO API client can only be invoked on the server."
    );
  }

  const { apiKey, mobileApp } = getKtoCredentials();
  const baseUrl = locale === "en" ? KTO_BASE_URL_ENG : KTO_BASE_URL_KOR;

  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.append("serviceKey", normalizeServiceKey(apiKey));
  url.searchParams.append("MobileOS", "ETC");
  url.searchParams.append("MobileApp", mobileApp);
  url.searchParams.append("_type", "json");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 86400 }, // 24시간 캐싱
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const text = await response.text();
      errorDetail = parseSafeKtoErrorDetail(text);
    } catch {
      // ignore body read error
    }

    const detailMsg = errorDetail ? ` - ${errorDetail}` : "";
    throw new Error(
      `[KTO_CLIENT_ERROR] KTO API request failed with status ${response.status} (endpoint: ${endpoint})${detailMsg}`
    );
  }

  const data: KtoApiResponse<T> = await response.json();

  if (!data || typeof data !== "object" || !data.response) {
    throw new Error(
      `[KTO_CLIENT_ERROR] Invalid KTO response structure (missing response object) (endpoint: ${endpoint})`
    );
  }

  const header = data.response.header;
  if (!header) {
    throw new Error(
      `[KTO_CLIENT_ERROR] Invalid KTO response structure (missing header) (endpoint: ${endpoint})`
    );
  }

  const resultCode = header.resultCode;
  if (resultCode !== "0000") {
    const code = resultCode || "UNKNOWN";
    const msg = header.resultMsg || "Unknown error";
    throw new Error(
      `[KTO_CLIENT_ERROR] KTO API response error [${code}]: ${msg} (endpoint: ${endpoint})`
    );
  }

  if (data.response.body === undefined) {
    throw new Error(
      `[KTO_CLIENT_ERROR] Invalid KTO response structure (missing body) (endpoint: ${endpoint})`
    );
  }

  return data;
}
