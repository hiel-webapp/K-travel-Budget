"use client";

import React, { useMemo, useState } from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripDraft, SupportedCity } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import type { TripBudgetSummary } from "src/features/budget/calculations/trip-budget-calculator";
import { formatKrw } from "src/features/budget/presentation/formatters";
import { formatPriceByLocale } from "src/lib/currency/currency-converter";

export type BookingFilterCategory = "ALL" | "TRANSIT" | "STAY" | "ATTRACTION" | "ESSENTIAL";

export interface BookingVoucherItem {
  id: string;
  category: "TRANSIT" | "STAY" | "ATTRACTION" | "ESSENTIAL";
  categoryLabelKo: string;
  categoryLabelEn: string;
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
  priceText?: string;
  targetUrl: string;
  badgeKo: string;
  badgeEn: string;
  isOfficial: boolean;
  accentColor: string; // Tailwind color classes
}

export interface BookingActionHubProps {
  calculations: TripBudgetSummary;
  draft: TripDraft;
  locale: Locale;
  dict: Dictionary;
  usdRate?: number;
}

export default function BookingActionHub({
  calculations,
  draft,
  locale,
  usdRate = 1387,
}: BookingActionHubProps) {
  const isKo = locale === "ko";
  const [activeCategory, setActiveCategory] = useState<BookingFilterCategory>("ALL");

  // 사용자의 실제 영수증 및 선택 내역과 1:1 매핑되는 바우처 아이템 생성
  const voucherList = useMemo<BookingVoucherItem[]>(() => {
    const list: BookingVoucherItem[] = [];

    // -------------------------------------------------------------------------
    // 1. 교통 부문 (Transit)
    // -------------------------------------------------------------------------
    // AREX 공항철도 직통열차 (서울/인천 경유 시)
    if (
      draft.selectedCities.includes("SEOUL") ||
      draft.selectedCities.includes("INCHEON")
    ) {
      list.push({
        id: "transit-arex",
        category: "TRANSIT",
        categoryLabelKo: "공항 교통",
        categoryLabelEn: "Airport Transit",
        titleKo: "인천공항 ↔ 서울역 AREX 직통열차",
        titleEn: "Incheon Airport ↔ Seoul AREX Express",
        subtitleKo: "소요시간 43분 논스톱 고속철도 · 모바일 QR 승차권",
        subtitleEn: "43-min non-stop express train · Mobile QR boarding",
        priceText: isKo ? "₩11,000 / 편도" : `${formatPriceByLocale(11000, locale, usdRate)} / one-way`,
        targetUrl: isKo
          ? "https://www.airportrailroad.com"
          : "https://www.arex.or.kr/main.do",
        badgeKo: "공식 예매",
        badgeEn: "Official",
        isOfficial: true,
        accentColor: "bg-blue-50 text-blue-700 border-blue-200",
      });
    }

    // KTX 고속철도 (복수 도시 여행 시)
    if (draft.selectedCities.length > 1) {
      list.push({
        id: "transit-ktx",
        category: "TRANSIT",
        categoryLabelKo: "도시 간 이동",
        categoryLabelEn: "Intercity Transit",
        titleKo: "코레일 KTX / SRT 전국 고속열차",
        titleEn: "Korail KTX Official Train Reservation",
        subtitleKo: "서울, 부산, 경주, 전주, 여수 전국 도시 고속 이동",
        subtitleEn: "High-speed rail connecting Seoul, Busan, Gyeongju & more",
        priceText: isKo ? "구간별 실비 예매" : "Direct fare booking",
        targetUrl: isKo
          ? "https://www.letskorail.com"
          : "https://www.letskorail.com/ebizbf/EbizBfTicketSearch.do",
        badgeKo: "공식 예매",
        badgeEn: "Official",
        isOfficial: true,
        accentColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      });
    }

    // 카카오T 모빌리티
    list.push({
      id: "transit-kakaot",
      category: "TRANSIT",
      categoryLabelKo: "시내 모빌리티",
      categoryLabelEn: "City Mobility",
      titleKo: "카카오 T (택시 호출 & 바이크)",
      titleEn: "Kakao T (Taxi Hailing & Bike)",
      subtitleKo: "한국 어디서나 외국인 카드 및 카카오페이 결제 지원",
      subtitleEn: "Nationwide taxi dispatch with foreign card payment",
      priceText: isKo ? "미터기 요금 결제" : "Metered Fare",
      targetUrl: "https://www.kakaocorp.com/page/service/service/KakaoT",
      badgeKo: "필수 앱",
      badgeEn: "Essential App",
      isOfficial: true,
      accentColor: "bg-amber-50 text-amber-800 border-amber-200",
    });

    // -------------------------------------------------------------------------
    // 2. 숙소 부문 (Stay) - 선택된 도시별 맞춤 링크
    // -------------------------------------------------------------------------
    draft.selectedCities.forEach((city) => {
      const cInfo = calculations.cityBreakdown?.[city];
      if (!cInfo || cInfo.nights === 0) return;

      const cityNameKo = CITY_KOREAN_NAMES[city] || city;
      const cityNameEn = CITY_ENGLISH_NAMES[city] || city;

      list.push({
        id: `stay-${city.toLowerCase()}`,
        category: "STAY",
        categoryLabelKo: "숙소 예약",
        categoryLabelEn: "Accommodations",
        titleKo: `${cityNameKo} 숙소 (${cInfo.stayItemLabel})`,
        titleEn: `${cityNameEn} Stays (${cInfo.stayItemLabel})`,
        subtitleKo: `1박 평균 ${formatKrw(cInfo.stayNightlyPrice)} 기준 · ${cInfo.nights}박 일정`,
        subtitleEn: `Avg. ${formatPriceByLocale(cInfo.stayNightlyPrice, locale, usdRate)} / night · ${cInfo.nights} nights`,
        priceText: formatPriceByLocale(cInfo.stayTotalKrw, locale, usdRate),
        targetUrl: `https://www.trip.com/hotels/list?city=${encodeURIComponent(cityNameEn)}`,
        badgeKo: "예약 링크",
        badgeEn: "Check Rates",
        isOfficial: false,
        accentColor: "bg-teal-50 text-teal-700 border-teal-200",
      });
    });

    // -------------------------------------------------------------------------
    // 3. 관광/명소 부문 (Attractions) - 사용자가 직접 담은 스팟 1:1 매핑
    // -------------------------------------------------------------------------
    draft.selectedCities.forEach((city) => {
      const cInfo = calculations.cityBreakdown?.[city];
      const spots = cInfo?.selectedSpots || [];

      spots.forEach((spot) => {
        const spotNameKo = spot.nameKo;
        const spotNameEn = spot.nameEn || spotNameKo;
        const spotPrice = spot.price || 0;

        // 공식 사이트 링크가 있거나 유료 입장권인 경우 우선 바우처 등록
        const targetUrl =
          spot.officialUrl ||
          `https://www.klook.com/search/result/?query=${encodeURIComponent(spotNameEn)}`;

        list.push({
          id: `spot-${spot.id}`,
          category: "ATTRACTION",
          categoryLabelKo: "명소 / 티켓",
          categoryLabelEn: "Ticket / Tour",
          titleKo: `${spotNameKo} 입장권 & 바우처`,
          titleEn: `${spotNameEn} Admission Ticket`,
          subtitleKo: spot.descKo || "현장 대기 없이 즉시 입장 가능한 모바일 티켓",
          subtitleEn: spot.descEn || "Fast-track mobile voucher & admissions",
          priceText:
            spotPrice > 0
              ? formatPriceByLocale(spotPrice, locale, usdRate)
              : isKo
              ? "무료 입장"
              : "Free Entry",
          targetUrl,
          badgeKo: spot.officialUrl ? "공식 사이트" : "티켓 예매",
          badgeEn: spot.officialUrl ? "Official Site" : "Get Tickets",
          isOfficial: !!spot.officialUrl,
          accentColor: "bg-rose-50 text-rose-700 border-rose-200",
        });
      });
    });

    // -------------------------------------------------------------------------
    // 4. 여행자 필수 서비스 (Essentials)
    // -------------------------------------------------------------------------
    list.push({
      id: "essential-esim",
      category: "ESSENTIAL",
      categoryLabelKo: "통신 필수",
      categoryLabelEn: "Connectivity",
      titleKo: "한국 무제한 eSIM / USIM (SKT · KT · LGU+)",
      titleEn: "Korea Unlimited 4G/5G eSIM",
      subtitleKo: "인천/김포/김해공항 수령 또는 즉시 QR 개통",
      subtitleEn: "Airport pickup or instant QR activation with local number",
      priceText: isKo ? "1일 ~₩3,000" : `From ~${formatPriceByLocale(3000, locale, usdRate)}/day`,
      targetUrl: "https://www.klook.com/search/result/?query=korea+esim",
      badgeKo: "필수 준비물",
      badgeEn: "Must Have",
      isOfficial: false,
      accentColor: "bg-purple-50 text-purple-700 border-purple-200",
    });

    return list;
  }, [calculations, draft, isKo]);

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              One-Stop Booking & Voucher Hub
            </span>
            <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
              {isKo
                ? "원스톱 예약 & 공식 안내 링크 허브"
                : "One-Stop Booking & Action Hub"}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {isKo
              ? "영수증에 포함된 항목별 공식 예매 사이트와 다이렉트 예약 링크를 바우처 형태로 1:1 제공합니다."
              : "Direct official booking links and voucher cards mapped 1:1 with your itemized expenses."}
          </p>
        </div>

        <span className="text-[11px] font-bold text-slate-400 self-start sm:self-auto tabular-nums">
          {isKo
            ? `총 ${voucherList.length}개 바우처 연동`
            : `${voucherList.length} Vouchers Ready`}
        </span>
      </div>

      {/* Category Filter Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
        {[
          { key: "ALL" as const, labelKo: "전체", labelEn: "All", emoji: "✨", count: voucherList.length },
          { key: "TRANSIT" as const, labelKo: "교통 (KTX·버스·택시)", labelEn: "Transit", emoji: "🚆", count: voucherList.filter((v) => v.category === "TRANSIT").length },
          { key: "STAY" as const, labelKo: "숙소", labelEn: "Stays", emoji: "🏨", count: voucherList.filter((v) => v.category === "STAY").length },
          { key: "ATTRACTION" as const, labelKo: "관광·입장권", labelEn: "Attractions", emoji: "🎫", count: voucherList.filter((v) => v.category === "ATTRACTION").length },
          { key: "ESSENTIAL" as const, labelKo: "여행 필수품", labelEn: "Essentials", emoji: "📱", count: voucherList.filter((v) => v.category === "ESSENTIAL").length },
        ]
          .filter((tab) => tab.key === "ALL" || tab.count > 0)
          .map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200/80 hover:text-neutral-900"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{isKo ? tab.labelKo : tab.labelEn}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    isActive ? "bg-white/20 text-white" : "bg-neutral-200/70 text-neutral-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
      </div>

      {/* Vouchers Grid (반응형 2열 카드) */}
      {(() => {
        const filteredList =
          activeCategory === "ALL"
            ? voucherList
            : voucherList.filter((v) => v.category === activeCategory);

        if (filteredList.length === 0) {
          return (
            <div className="py-12 text-center text-xs text-neutral-400">
              {isKo ? "해당 카테고리의 예약 바우처가 없습니다." : "No vouchers in this category."}
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredList.map((voucher) => {
              const categoryLabel = isKo
                ? voucher.categoryLabelKo
                : voucher.categoryLabelEn;
              const title = isKo ? voucher.titleKo : voucher.titleEn;
              const subtitle = isKo ? voucher.subtitleKo : voucher.subtitleEn;
              const badge = isKo ? voucher.badgeKo : voucher.badgeEn;

              return (
                <div
                  key={voucher.id}
                  className="p-4 rounded-2xl bg-neutral-50/60 hover:bg-white border border-neutral-200/70 hover:border-neutral-900/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-3 group"
                >
                  {/* Card Top: Category & Badge */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase ${voucher.accentColor}`}
                      >
                        {categoryLabel}
                      </span>
                      {voucher.priceText && (
                        <span className="text-xs font-black text-neutral-900 tabular-nums">
                          {voucher.priceText}
                        </span>
                      )}
                    </div>

                    {/* Card Title & Description */}
                    <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                      {title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {subtitle}
                    </p>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400">
                      <span>{voucher.isOfficial ? "🔒" : "⚡"}</span>
                      <span>{voucher.isOfficial ? (isKo ? "공식 파트너" : "Official") : (isKo ? "다이렉트 예약" : "Direct Link")}</span>
                    </div>

                    <a
                      href={voucher.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-black text-neutral-900 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all"
                    >
                      <span>{badge}</span>
                      <span className="text-xs">↗</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Helper Footer Notice */}
      <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between gap-2 text-xs text-neutral-500">
        <span className="text-[11px]">
          {isKo
            ? "💡 모든 링크는 새 창에서 열리며, 공식 사이트 및 사전 승인된 결제 시스템으로 안전하게 연결됩니다."
            : "💡 All links open in a new tab, securely connecting to official booking sites."}
        </span>
      </div>
    </div>
  );
}
