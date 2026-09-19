"use client";

import { useState, useEffect } from "react";
import { DEFAULT_USD_KRW_RATE } from "../currency/currency-converter";

const CACHE_KEY = "k_travel_exchange_rate_usd_krw";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간 로컬 유효

interface ExchangeRateState {
  rate: number;
  isLoading: boolean;
  isFallback: boolean;
  lastUpdated?: string;
}

export function useExchangeRate(): ExchangeRateState {
  const [state, setState] = useState<ExchangeRateState>(() => {
    if (typeof window === "undefined") {
      return {
        rate: DEFAULT_USD_KRW_RATE,
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
            isLoading: false,
            isFallback: Boolean(parsed.isFallback),
            lastUpdated: parsed.lastUpdated,
          };
        }
      }
    } catch {
      // Ignore cache parse error
    }

    return {
      rate: DEFAULT_USD_KRW_RATE,
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
            isLoading: false,
            isFallback: Boolean(data.isFallback),
            lastUpdated: data.updatedAt,
          };
          setState(newState);

          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                rate: data.rateKrw,
                timestamp: Date.now(),
                isFallback: data.isFallback,
                lastUpdated: data.updatedAt,
              })
            );
          } catch {
            // Ignore storage write errors
          }
        }
      } catch (err) {
        console.warn("[useExchangeRate] Failed to fetch exchange rate, using fallback:", err);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
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
