import { NextResponse } from "next/server";

// Fallback 환율 (네트워크 장애 시 안전망)
const FALLBACK_USD_KRW_RATE = 1350;

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
      console.warn(`[ExchangeRate API] External fetch returned status ${response.status}. Using fallback.`);
      return NextResponse.json({
        success: true,
        base: "USD",
        rateKrw: FALLBACK_USD_KRW_RATE,
        updatedAt: new Date().toISOString(),
        isFallback: true,
      });
    }

    const data = await response.json();
    const rawRate = data.rates?.KRW ?? data.conversion_rates?.KRW;

    if (data.result === "success" && typeof rawRate === "number") {
      // 소수점 2자리로 깔끔하게 반올림 처리
      const rateKrw = Math.round(rawRate * 100) / 100;
      return NextResponse.json({
        success: true,
        base: "USD",
        rateKrw,
        updatedAt: data.time_last_update_utc || new Date().toISOString(),
        isFallback: false,
      });
    }

    console.warn("[ExchangeRate API] Invalid payload structure. Using fallback.");
    return NextResponse.json({
      success: true,
      base: "USD",
      rateKrw: FALLBACK_USD_KRW_RATE,
      updatedAt: new Date().toISOString(),
      isFallback: true,
    });
  } catch (error) {
    console.error("[ExchangeRate API] Fetch error:", error);
    return NextResponse.json({
      success: true,
      base: "USD",
      rateKrw: FALLBACK_USD_KRW_RATE,
      updatedAt: new Date().toISOString(),
      isFallback: true,
    });
  }
}
