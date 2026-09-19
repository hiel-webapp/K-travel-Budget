import type { Locale } from "../i18n/locales";
import { formatKrw } from "../../features/budget/presentation/formatters";

export const DEFAULT_USD_KRW_RATE = 1350;

/**
 * KRW 금액을 USD로 환산
 */
export function krwToUsd(amountKrw: number, rate: number = DEFAULT_USD_KRW_RATE): number {
  if (!amountKrw || amountKrw <= 0 || !rate || rate <= 0) return 0;
  return amountKrw / rate;
}

/**
 * USD 금액을 포맷팅 ($1,234 또는 소액일 경우 $1.50)
 */
export function formatUsd(amountUsd: number, options?: { showCents?: boolean }): string {
  if (amountUsd === 0) return "$0";

  // 10달러 미만 소액이거나 강제 옵션일 때 센트 표시
  const shouldShowCents = options?.showCents ?? (amountUsd > 0 && amountUsd < 10);

  if (shouldShowCents) {
    return `$${amountUsd.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${Math.round(amountUsd).toLocaleString("en-US")}`;
}

export interface FormatPriceOptions {
  showCents?: boolean;
  withSecondary?: boolean; // EN일 때 원화 병기 여부 ($1,713 (₩2,389,800))
  compact?: boolean;
}

/**
 * 언어(Locale) 및 환율에 따라 금액을 통화에 맞게 포맷팅
 * - ko: ₩ 2,389,800
 * - en: $1,713 (또는 $1,713 (₩ 2,389,800))
 */
export function formatPriceByLocale(
  amountKrw: number,
  locale: Locale,
  rate: number = DEFAULT_USD_KRW_RATE,
  options?: FormatPriceOptions
): string {
  if (locale === "ko") {
    return formatKrw(amountKrw);
  }

  const usd = krwToUsd(amountKrw, rate);
  const formattedUsd = formatUsd(usd, { showCents: options?.showCents });

  if (options?.withSecondary && amountKrw > 0) {
    return `${formattedUsd} (${formatKrw(amountKrw)})`;
  }

  return formattedUsd;
}

export function getExchangeRateNotice(rate: number = DEFAULT_USD_KRW_RATE, locale: Locale = "en"): string {
  const roundedRate = Math.round(rate).toLocaleString(locale === "ko" ? "ko-KR" : "en-US");
  if (locale === "ko") {
    return `기준 환율: $1 = ₩${roundedRate}`;
  }
  return `Exchange Rate: $1 ≈ ₩${roundedRate}`;
}
