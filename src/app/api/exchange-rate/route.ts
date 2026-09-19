import { NextResponse } from "next/server";

// Fallback 환율 (네트워크 장애 또는 쿼터 초과 시 안전망)
const FALLBACK_USD_KRW_RATE = 1350;
const API_KEY = process.env.EXCHANGERATE_API_KEY || "cd9e88beb29973365f9df6ca";
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

export async function GET() {
  try {
    // 12시간(43,200초) 캐싱 적용 -> 월 60회 내외로 호출되어 무료 쿼터(1,500회)의 약 4%만 사용
    const response = await fetch(API_URL, {
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

    if (data.result === "success" && data.conversion_rates && typeof data.conversion_rates.KRW === "number") {
      const rateKrw = data.conversion_rates.KRW;
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
