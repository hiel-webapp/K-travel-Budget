"use client";

import { useState, useEffect } from "react";
import { DEFAULT_USD_KRW_RATE } from "../currency/currency-converter";

const CACHE_KEY = "k_travel_exchange_rate_usd_krw";
const LAST_KNOWN_KEY = "k_travel_last_known_good_rate";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간 로컬 유효

interface ExchangeRateState {
  rate: number;
  usdRate: number;
  isLoading: boolean;
  isFallback: boolean;
  lastUpdated?: string;
}

function getStoredLastKnownRate(): number {
  if (typeof window === "undefined") return DEFAULT_USD_KRW_RATE;
  try {
    const stored = localStorage.getItem(LAST_KNOWN_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.rate === "number" && parsed.rate > 500 && parsed.rate < 3000) {
        return parsed.rate;
      }
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_USD_KRW_RATE;
}

export function useExchangeRate(): ExchangeRateState {
  const [state, setState] = useState<ExchangeRateState>(() => {
    if (typeof window === "undefined") {
      return {
        rate: DEFAULT_USD_KRW_RATE,
        usdRate: DEFAULT_USD_KRW_RATE,
        isLoading: true,
        isFallback: false,
      };
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        if (parsed.rate && now - parsed.timestamp < CACHE_TTL_MS) {
          return {
            rate: parsed.rate,
            usdRate: parsed.rate,
            isLoading: false,
            isFallback: Boolean(parsed.isFallback),
            lastUpdated: parsed.lastUpdated,
          };
        }
      }
    } catch {
      // Ignore cache parse error
    }

    // 캐시가 없거나 만료되었을 때, 직전 성공 환율을 1순위 비상 환율로 사용
    const lastKnownRate = getStoredLastKnownRate();

    return {
      rate: lastKnownRate,
      usdRate: lastKnownRate,
      isLoading: true,
      isFallback: false,
    };
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchRate() {
      try {
        const res = await fetch("/api/exchange-rate");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (isMounted && data.success && typeof data.rateKrw === "number") {
          const newState = {
            rate: data.rateKrw,
            usdRate: data.rateKrw,
            isLoading: false,
            isFallback: Boolean(data.isFallback),
            lastUpdated: data.updatedAt,
          };
          setState(newState);

          try {
            // 6시간 임시 캐시 갱신
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                rate: data.rateKrw,
                timestamp: Date.now(),
                isFallback: data.isFallback,
                lastUpdated: data.updatedAt,
              })
            );

            // 실시간 정상 조회인 경우, 영구 비상 환율(어제 환율) 저장소 갱신
            if (!data.isFallback) {
              localStorage.setItem(
                LAST_KNOWN_KEY,
                JSON.stringify({
                  rate: data.rateKrw,
                  updatedAt: data.updatedAt,
                })
              );
            }
          } catch {
            // Ignore storage write errors
          }
        }
      } catch (err) {
        console.warn("[useExchangeRate] Failed to fetch exchange rate, using last known good rate:", err);
        if (isMounted) {
          const fallbackRate = getStoredLastKnownRate();
          setState((prev) => ({
            ...prev,
            rate: fallbackRate,
            usdRate: fallbackRate,
            isLoading: false,
            isFallback: true,
          }));
        }
      }
    }

    fetchRate();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
