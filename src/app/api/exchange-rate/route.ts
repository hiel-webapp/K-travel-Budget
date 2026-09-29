import { NextResponse } from "next/server";

// Fallback 기본값 (극단적 초기 기동 시 안전망)
const INITIAL_FALLBACK_RATE = 1350;

// 서버 메모리 보존: 가장 최근에 성공한 정상 환율 (어제/직전 환율)
let lastSuccessfulServerRate = INITIAL_FALLBACK_RATE;
let lastSuccessfulUpdatedAt: string | null = null;

// 키가 필요 없는 공식 오픈 엔드포인트 (영구 무료/무제한)
const OPEN_API_URL = "https://open.er-api.com/v6/latest/USD";

export async function GET() {
  try {
    // 12시간(43,200초) 캐싱 적용 -> 백그라운드 자동 갱신
    const response = await fetch(OPEN_API_URL, {
      next: { revalidate: 43200 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[ExchangeRate API] External fetch returned status ${response.status}. Using last known rate: ${lastSuccessfulServerRate}`);
      return NextResponse.json({
        success: true,
        base: "USD",
        rateKrw: lastSuccessfulServerRate,
        updatedAt: lastSuccessfulUpdatedAt || new Date().toISOString(),
        isFallback: true,
      });
    }

    const data = await response.json();
    const rawRate = data.rates?.KRW ?? data.conversion_rates?.KRW;

    if (data.result === "success" && typeof rawRate === "number") {
      // 소수점 2자리로 깔끔하게 반올림 처리
      const rateKrw = Math.round(rawRate * 100) / 100;
      
      // 최신 성공 환율 갱신 보존
      lastSuccessfulServerRate = rateKrw;
      lastSuccessfulUpdatedAt = data.time_last_update_utc || new Date().toISOString();

      return NextResponse.json({
        success: true,
        base: "USD",
        rateKrw,
        updatedAt: lastSuccessfulUpdatedAt,
        isFallback: false,
      });
    }

    console.warn("[ExchangeRate API] Invalid payload structure. Using last known rate:", lastSuccessfulServerRate);
    return NextResponse.json({
      success: true,
      base: "USD",
      rateKrw: lastSuccessfulServerRate,
      updatedAt: lastSuccessfulUpdatedAt || new Date().toISOString(),
      isFallback: true,
    });
  } catch (error) {
    console.error("[ExchangeRate API] Fetch error. Using last known rate:", error);
    return NextResponse.json({
      success: true,
      base: "USD",
      rateKrw: lastSuccessfulServerRate,
      updatedAt: lastSuccessfulUpdatedAt || new Date().toISOString(),
      isFallback: true,
    });
  }
}
