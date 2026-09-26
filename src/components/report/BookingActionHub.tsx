"use client";

import React, { useMemo, useState } from "react";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripDraft, SupportedCity } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import type { TripBudgetSummary } from "src/features/budget/calculations/trip-budget-calculator";
import { formatKrw } from "src/features/budget/presentation/formatters";
import { formatPriceByLocale } from "src/lib/currency/currency-converter";
import {
  STAY_ARCHETYPES,
  AGODA_CITY_IDS,
  generateStayOtaUrl,
} from "src/features/budget/catalog/stay-archetypes";

export type BookingFilterCategory = "ALL" | "TRANSIT" | "STAY" | "ATTRACTION" | "ESSENTIAL";

export interface BookingRowItem {
  id: string;
  category: "TRANSIT" | "STAY" | "ATTRACTION" | "ESSENTIAL";
  categoryNameKo: string;
  categoryNameEn: string;
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
  priceText?: string;
  targetUrl: string;
  actionLabelKo: string;
  actionLabelEn: string;
  badgeKo: string;
  badgeEn: string;
  isOfficial: boolean;
}

export interface FreeSpotItem {
  id: string;
  city: SupportedCity;
  cityNameKo: string;
  cityNameEn: string;
  nameKo: string;
  nameEn: string;
  targetUrl: string;
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
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (catKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  // 사용자의 실제 영수증 및 선택 내역과 1:1 매핑되는 스마트 예약 항목 & 무료 명소 생성
  const { categorizedItems, totalCount, freeSpots } = useMemo(() => {
    const transit: BookingRowItem[] = [];
    const stay: BookingRowItem[] = [];
    const attraction: BookingRowItem[] = [];
    const essential: BookingRowItem[] = [];
    const free: FreeSpotItem[] = [];

    // -------------------------------------------------------------------------
    // 1. 교통 (Transit)
    // -------------------------------------------------------------------------
    // AREX 공항철도 직통열차 (서울/인천 경유 시)
    if (
      draft.selectedCities.includes("SEOUL") ||
      draft.selectedCities.includes("INCHEON")
    ) {
      transit.push({
        id: "transit-arex",
        category: "TRANSIT",
        categoryNameKo: "공항철도",
        categoryNameEn: "AREX",
        titleKo: "인천공항 ↔ 서울역 AREX 직통열차",
        titleEn: "Incheon Airport ↔ Seoul AREX Express",
        subtitleKo: "소요시간 43분 논스톱 고속철도 · 모바일 QR 승차권",
        subtitleEn: "43-min non-stop express · Mobile QR boarding",
        priceText: isKo ? "₩11,000 / 편도" : `${formatPriceByLocale(11000, locale, usdRate)} / one-way`,
        targetUrl: isKo
          ? "https://www.airportrailroad.com"
          : "https://www.arex.or.kr/main.do",
        actionLabelKo: "공식 예매",
        actionLabelEn: "Official",
        badgeKo: "공식",
        badgeEn: "Official",
        isOfficial: true,
      });
    }

    // KTX 고속철도 (복수 도시 여행 시)
    if (draft.selectedCities.length > 1) {
      transit.push({
        id: "transit-ktx",
        category: "TRANSIT",
        categoryNameKo: "고속열차",
        categoryNameEn: "KTX/SRT",
        titleKo: "코레일 KTX / SRT 전국 고속열차",
        titleEn: "Korail KTX Official Train Reservation",
        subtitleKo: "서울, 부산, 경주, 전주, 여수 전국 주요 도시 고속 이동",
        subtitleEn: "High-speed rail connecting major cities across Korea",
        priceText: isKo ? "구간별 실비 예매" : "Direct fare booking",
        targetUrl: isKo
          ? "https://www.letskorail.com"
          : "https://www.letskorail.com/ebizbf/EbizBfTicketSearch.do",
        actionLabelKo: "공식 예매",
        actionLabelEn: "Official",
        badgeKo: "공식",
        badgeEn: "Official",
        isOfficial: true,
      });
    }

    // 카카오T 모빌리티
    transit.push({
      id: "transit-kakaot",
      category: "TRANSIT",
      categoryNameKo: "택시/호출",
      categoryNameEn: "Taxi",
      titleKo: "카카오 T (택시 호출 & 바이크)",
      titleEn: "Kakao T (Taxi Hailing & Bike)",
      subtitleKo: "한국 어디서나 외국인 카드 및 카카오페이 간편 결제",
      subtitleEn: "Nationwide taxi dispatch with foreign card payment",
      priceText: isKo ? "미터기 요금" : "Metered Fare",
      targetUrl: "https://www.kakaocorp.com/page/service/service/KakaoT",
      actionLabelKo: "앱 바로가기",
      actionLabelEn: "Get App",
      badgeKo: "필수 앱",
      badgeEn: "Essential",
      isOfficial: true,
    });

    // -------------------------------------------------------------------------
    // 2. 숙소 (Stay) - 선택된 도시별 맞춤 링크
    // -------------------------------------------------------------------------
    draft.selectedCities.forEach((city) => {
      const cInfo = calculations.cityBreakdown?.[city];
      if (!cInfo || cInfo.nights === 0) return;

      const cityNameKo = CITY_KOREAN_NAMES[city] || city;
      const cityNameEn = CITY_ENGLISH_NAMES[city] || city;

      const cityId = AGODA_CITY_IDS[city] || 14690;
      const matchedArchetype = STAY_ARCHETYPES.find(
        (a) => a.titleKo === cInfo.stayItemLabel || a.titleEn === cInfo.stayItemLabel
      );
      const targetUrl = matchedArchetype
        ? generateStayOtaUrl(matchedArchetype.id, city)
        : `https://www.agoda.com/search?city=${cityId}&priceCur=KRW&tag=hypeheritage`;

      stay.push({
        id: `stay-${city.toLowerCase()}`,
        category: "STAY",
        categoryNameKo: "숙소",
        categoryNameEn: "Stay",
        titleKo: `${cityNameKo} 숙소 (${cInfo.stayItemLabel})`,
        titleEn: `${cityNameEn} Stays (${cInfo.stayItemLabel})`,
        subtitleKo: `1박 평균 ${formatKrw(cInfo.stayNightlyPrice)} 기준 · ${cInfo.nights}박 일정`,
        subtitleEn: `Avg. ${formatPriceByLocale(cInfo.stayNightlyPrice, locale, usdRate)} / night · ${cInfo.nights} nights`,
        priceText: formatPriceByLocale(cInfo.stayTotalKrw, locale, usdRate),
        targetUrl,
        actionLabelKo: "아고다 예약",
        actionLabelEn: "Book on Agoda",
        badgeKo: "아고다",
        badgeEn: "Agoda",
        isOfficial: false,
      });
    });

    // -------------------------------------------------------------------------
    // 3. 주요 명소 & 티켓 (Attraction) - 유료 입장권 및 무료 명소 분류
    // -------------------------------------------------------------------------
    draft.selectedCities.forEach((city) => {
      const cInfo = calculations.cityBreakdown?.[city];
      const spots = cInfo?.selectedSpots || [];
      const cityNameKo = CITY_KOREAN_NAMES[city] || city;
      const cityNameEn = CITY_ENGLISH_NAMES[city] || city;

      spots.forEach((spot) => {
        const spotNameKo = spot.nameKo;
        const spotNameEn = spot.nameEn || spotNameKo;
        const spotPrice = spot.price || 0;

        // 무료 입장 명소는 별도 무료 리스트로 분류
        if (spotPrice <= 0) {
          free.push({
            id: `free-${spot.id}`,
            city,
            cityNameKo,
            cityNameEn,
            nameKo: spotNameKo,
            nameEn: spotNameEn,
            targetUrl:
              spot.officialUrl ||
              `https://map.naver.com/v5/search/${encodeURIComponent(spotNameKo)}`,
          });
          return;
        }

        // 유료 입장권 및 사전 예매 명소
        const targetUrl =
          spot.officialUrl ||
          `https://www.klook.com/search/result/?query=${encodeURIComponent(spotNameEn)}`;

        attraction.push({
          id: `spot-${spot.id}`,
          category: "ATTRACTION",
          categoryNameKo: "입장권",
          categoryNameEn: "Ticket",
          titleKo: `${spotNameKo} 입장권 & 바우처`,
          titleEn: `${spotNameEn} Admission Ticket`,
          subtitleKo: spot.descKo || "현장 대기 없이 즉시 입장 가능한 모바일 티켓",
          subtitleEn: spot.descEn || "Fast-track mobile voucher & admissions",
          priceText: formatPriceByLocale(spotPrice, locale, usdRate),
          targetUrl,
          actionLabelKo: spot.officialUrl ? "공식 사이트" : "티켓 예매",
          actionLabelEn: spot.officialUrl ? "Official Site" : "Get Tickets",
          badgeKo: spot.officialUrl ? "공식 사이트" : "티켓 예매",
          badgeEn: spot.officialUrl ? "Official" : "Tickets",
          isOfficial: !!spot.officialUrl,
        });
      });
    });

    // -------------------------------------------------------------------------
    // 4. 여행 필수 준비물 (Essentials)
    // -------------------------------------------------------------------------
    essential.push({
      id: "essential-esim",
      category: "ESSENTIAL",
      categoryNameKo: "통신",
      categoryNameEn: "eSIM",
      titleKo: "한국 무제한 4G/5G eSIM (SKT · KT · LGU+)",
      titleEn: "Korea Unlimited 4G/5G eSIM",
      subtitleKo: "인천/김포/김해공항 수령 또는 즉시 QR 개통",
      subtitleEn: "Airport pickup or instant QR activation with local network",
      priceText: isKo ? "1일 ~₩3,000" : `From ~${formatPriceByLocale(3000, locale, usdRate)}/day`,
      targetUrl: "https://www.klook.com/search/result/?query=korea+esim",
      actionLabelKo: "신청하기",
      actionLabelEn: "Get eSIM",
      badgeKo: "필수품",
      badgeEn: "Essential",
      isOfficial: false,
    });

    essential.push({
      id: "essential-helpline",
      category: "ESSENTIAL",
      categoryNameKo: "안내 지원",
      categoryNameEn: "Support",
      titleKo: "1330 한국관광 통역안내 핫라인",
      titleEn: "1330 Korea Travel Hotline",
      subtitleKo: "24시간 4개 국어(한/영/일/중) 무료 관광 안내 및 긴급 통역",
      subtitleEn: "24/7 free multilingual travel assistance & interpretation",
      priceText: isKo ? "무료 안내" : "Free Service",
      targetUrl: "https://kto.visitkorea.or.kr/kor/customer/call1330.kto",
      actionLabelKo: "안내 보기",
      actionLabelEn: "View Info",
      badgeKo: "공공 서비스",
      badgeEn: "Gov. Service",
      isOfficial: true,
    });

    const total = transit.length + stay.length + attraction.length + essential.length;

    return {
      categorizedItems: {
        TRANSIT: transit,
        STAY: stay,
        ATTRACTION: attraction,
        ESSENTIAL: essential,
      },
      totalCount: total,
      freeSpots: free,
    };
  }, [calculations, draft, isKo, locale, usdRate]);

  // 카테고리 메타 정보 정의 (이모지 없음)
  const categoryMeta: Record<
    "TRANSIT" | "STAY" | "ATTRACTION" | "ESSENTIAL",
    { labelKo: string; labelEn: string }
  > = {
    TRANSIT: { labelKo: "교통편 예매", labelEn: "Transit Booking" },
    STAY: { labelKo: "도시별 숙소", labelEn: "Accommodations" },
    ATTRACTION: { labelKo: "명소 & 티켓", labelEn: "Attractions & Tickets" },
    ESSENTIAL: { labelKo: "여행 필수 준비물", labelEn: "Travel Essentials" },
  };

  const categoriesToRender: ("TRANSIT" | "STAY" | "ATTRACTION" | "ESSENTIAL")[] =
    activeCategory === "ALL"
      ? (["TRANSIT", "STAY", "ATTRACTION", "ESSENTIAL"] as const)
      : [activeCategory];

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            {isKo ? "스마트 여행 예약" : "Smart Travel Booking"}
          </h2>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {isKo
              ? "내 여행 일정에 맞춘 공식 예매 및 추천 예약 링크입니다."
              : "Official and verified booking links curated for your personalized itinerary."}
          </p>
        </div>

        <span className="text-[11px] font-bold text-slate-500 self-start sm:self-auto tabular-nums bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/70">
          {isKo ? `총 ${totalCount}개 예약 연동` : `${totalCount} Verified Links`}
        </span>
      </div>

      {/* Category Filter Tabs Bar (이모지 없이 심플한 텍스트 탭) */}
      <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
        {[
          { key: "ALL" as const, labelKo: "전체", labelEn: "All", count: totalCount },
          { key: "TRANSIT" as const, labelKo: "교통", labelEn: "Transit", count: categorizedItems.TRANSIT.length },
          { key: "STAY" as const, labelKo: "숙소", labelEn: "Stays", count: categorizedItems.STAY.length },
          { key: "ATTRACTION" as const, labelKo: "명소·티켓", labelEn: "Attractions", count: categorizedItems.ATTRACTION.length },
          { key: "ESSENTIAL" as const, labelKo: "필수 준비물", labelEn: "Essentials", count: categorizedItems.ESSENTIAL.length },
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
                    ? "bg-[#b93829] text-white border-[#b93829] shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80 hover:text-slate-900 shadow-2xs"
                }`}
              >
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

      {/* Categorized 1-Line Smart Rows */}
      <div className="space-y-6">
        {categoriesToRender.map((catKey) => {
          const items = categorizedItems[catKey];
          if (!items || items.length === 0) return null;

          const meta = categoryMeta[catKey];
          const isCollapsed = !!collapsedCategories[catKey];

          return (
            <div key={catKey} className="space-y-2.5">
              {/* Category Group Header (접기/펼치기 토글 버튼) */}
              <button
                type="button"
                onClick={() => toggleCategoryCollapse(catKey)}
                className="w-full flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80 hover:border-slate-300 transition-colors text-left cursor-pointer group select-none"
                aria-expanded={!isCollapsed}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-[#b93829] transition-colors tracking-tight">
                    {isKo ? meta.labelKo : meta.labelEn}
                  </h3>
                  <span className="text-[10.5px] font-bold text-slate-400 tabular-nums">
                    {items.length}{isKo ? "개" : " items"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-600 transition-colors text-[11px] font-bold">
                  <span>{isCollapsed ? (isKo ? "펼치기" : "Expand") : (isKo ? "접기" : "Collapse")}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
              </button>

              {/* 1-Line Compact Rows (접히지 않았을 때 노출) */}
              {!isCollapsed && (
                <div className="bg-slate-50/50 rounded-2xl border border-slate-200/70 divide-y divide-slate-200/60 overflow-hidden transition-all">
                  {items.map((item) => {
                    const title = isKo ? item.titleKo : item.titleEn;
                    const subtitle = isKo ? item.subtitleKo : item.subtitleEn;
                    const actionLabel = isKo ? item.actionLabelKo : item.actionLabelEn;

                    return (
                      <div
                        key={item.id}
                        className="px-3.5 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white transition-colors group"
                      >
                        {/* Left: Title + Subtitle */}
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#b93829] transition-colors truncate block">
                            {title}
                          </span>
                          <p className="text-[11px] text-slate-400 truncate">
                            {subtitle}
                          </p>
                        </div>

                        {/* Right: Price & Action Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                          {item.priceText && (
                            <span className="text-xs font-black text-slate-800 tabular-nums">
                              {item.priceText}
                            </span>
                          )}
                          <a
                            href={item.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-extrabold bg-white hover:bg-rose-50 text-slate-800 hover:text-[#b93829] border border-slate-200/90 hover:border-rose-300 shadow-2xs transition-all hover:translate-x-0.5 cursor-pointer shrink-0"
                          >
                            <span>{actionLabel}</span>
                            <span className="text-xs">↗</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 무료 명소 미니 블록 (방안 1: 사전 예약 없이 바로 가는 무료 명소) */}
      {freeSpots.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">
                {isKo ? "사전 예약 없이 바로 가는 무료 명소" : "Free Admission Spots (No Booking Needed)"}
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 tabular-nums">
                {freeSpots.length}{isKo ? "곳" : " spots"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isKo
                ? "별도 예매 없이 현장에서 자유롭게 방문할 수 있는 코스입니다."
                : "No advance tickets required. Walk in freely at your convenience."}
            </p>
          </div>

          {/* 무료 명소 인라인 칩 목록 */}
          <div className="flex flex-wrap gap-2 pt-1">
            {freeSpots.map((spot) => (
              <a
                key={spot.id}
                href={spot.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100/90 border border-slate-200 text-xs text-slate-800 transition-colors shadow-2xs group cursor-pointer"
              >
                <span className="text-[10px] font-bold text-slate-400">
                  [{isKo ? spot.cityNameKo : spot.cityNameEn}]
                </span>
                <span className="font-extrabold group-hover:text-rose-600 transition-colors">
                  {isKo ? spot.nameKo : spot.nameEn}
                </span>
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-rose-600 transition-colors">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Helper Footer Notice (이모지 없음) */}
      <div className="p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100 flex items-center justify-between gap-2 text-xs text-neutral-400">
        <span className="text-[11px]">
          {isKo
            ? "모든 링크는 새 창에서 열리며, 공식 사이트 및 사전 검증된 채널로 안전하게 연결됩니다."
            : "All links open in a new tab, securely connecting to official booking channels."}
        </span>
      </div>
    </div>
  );
}
