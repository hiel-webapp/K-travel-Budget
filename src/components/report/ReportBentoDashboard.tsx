"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { TripDraft } from "src/lib/trip-domain";
import { CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "src/lib/trip-domain";
import { useCountUp } from "src/lib/hooks/useCountUp";
import { formatKrw, formatPercentage } from "src/features/budget/presentation/formatters";

interface HighlightSpot {
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  img: string;
}

const CITY_HIGHLIGHT_SPOTS: Record<string, HighlightSpot> = {
  SEOUL: {
    nameKo: "경복궁 & 서촌 감성 카페 투어",
    nameEn: "Gyeongbokgung & Seochon Cafe Walk",
    descKo: "조선의 궁궐과 아늑한 골목 카페가 공존하는 K-헤리티지 명소",
    descEn: "Royal palaces paired with cozy boutique cafes in Seochon alleys",
    img: "/assets/gyeongbokgung-main.jpg",
  },
  BUSAN: {
    nameKo: "광안리 해변 & 민락 수변공원",
    nameEn: "Gwangalli Beach & Millak Park",
    descKo: "탁 트인 동해 바다와 광안대교 야경을 즐기는 K-오션 스팟",
    descEn: "Ocean breezes and panoramic Gwangan Bridge nightscapes",
    img: "/assets/n-seoul-tower.jpg",
  },
  JEONJU: {
    nameKo: "전주 경기전 & 한옥마을 다도",
    nameEn: "Jeonju Hanok Village & Tea House",
    descKo: "700여 채의 한옥과 슬로시티의 고요한 전통 미학",
    descEn: "Authentic gastronomic charm surrounded by traditional hanok alleys",
    img: "/assets/namsangol-hanok.jpg",
  },
  GANGNEUNG: {
    nameKo: "강릉 안목 커피거리 & 경포 솔숲",
    nameEn: "Gangneung Anmok Beach & Pine Path",
    descKo: "청량한 동해 파도 소리와 솔향 머금은 스페셜티 커피",
    descEn: "Refreshing ocean waves alongside beachfront artisan roasteries",
    img: "/assets/hongdae-street.jpg",
  },
  GYEONGJU: {
    nameKo: "경주 첨성대 & 황리단길 골목",
    nameEn: "Gyeongju Cheomseongdae & Hwangridan",
    descKo: "천년 신라 왕조 유적과 트렌디한 한옥 숍의 감성 조화",
    descEn: "Historic UNESCO observatory meets trendy boutique alleyways",
    img: "/assets/changdeokgung-hall.jpg",
  },
  SUWON: {
    nameKo: "수원화성 방화수류정 피크닉",
    nameEn: "Suwon Hwaseong Fortress & Pond",
    descKo: "조선 정조의 혁신적 성곽 건축과 연못가의 평화로운 정취",
    descEn: "Peaceful pavilion pond views inside a UNESCO World Heritage fortress",
    img: "/assets/gwanghwamun-square.jpg",
  },
  JEJU: {
    nameKo: "제주 성산일출봉 & 에메랄드 해안",
    nameEn: "Jeju Seongsan Sunrise Peak Coast",
    descKo: "유네스코 세계자연유산 화산섬의 청정 오션 힐링",
    descEn: "Pristine coastal waves and dramatic volcanic landscapes",
    img: "/assets/seongsu-street.jpg",
  },
};

const DEFAULT_SPOT: HighlightSpot = {
  nameKo: "N서울타워 전망대 & 남산 산책로",
  nameEn: "N Seoul Tower & Namsan Trail",
  descKo: "도심 한복판에서 360도로 조망하는 대한민국 수도의 스카이라인",
  descEn: "360-degree panoramic view of the Seoul metropolitan skyline",
  img: "/assets/n-seoul-tower.jpg",
};

export interface ReportBentoDashboardProps {
  calculations: {
    grandTotalKrw: number;
    perTravelerTotalKrw: number;
    dailyAverageKrw: number;
    sumAccTotal: number;
    sumFoodTotal: number;
    sumTransportTotal: number;
    intercityTotal: number;
    sumAttractionTotal: number;
    shoppingAmountKrw: number;
    totalDailyAllowanceKrw: number;
    computedEmergencyKrw: number;
    adultCount: number;
    totalNights: number;
    travelDays: number;
    basePlan: any;
    cityBreakdown: Record<string, any>;
  };
  draft: TripDraft;
  locale: Locale;
  dict: Dictionary;
}

export default function ReportBentoDashboard({
  calculations,
  draft,
  locale,
  dict,
}: ReportBentoDashboardProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  const nights = draft.totalNights || 1;
  const travelDays = calculations.travelDays || nights + 1;
  const adults = calculations.adultCount || 1;
  const grandTotalKrw = calculations.grandTotalKrw || 0;
  const dailyAverageKrw = calculations.dailyAverageKrw || 0;
  const perTravelerTotalKrw = calculations.perTravelerTotalKrw || 0;

  // Rolling counter animations with ease-out quart curve
  const animatedGrandTotal = useCountUp(grandTotalKrw, 1100);
  const animatedDailyAverage = useCountUp(dailyAverageKrw, 1100);
  const animatedPerTraveler = Math.round(animatedGrandTotal / adults);

  // Real Category Breakdown Calculation
  const totalForPct = Math.max(1, grandTotalKrw);
  const stayAmount = calculations.sumAccTotal || 0;
  const foodAmount = calculations.sumFoodTotal || 0;
  const transportAmount = (calculations.sumTransportTotal || 0) + (calculations.intercityTotal || 0);
  const flexAmount =
    (calculations.sumAttractionTotal || 0) +
    (calculations.shoppingAmountKrw || 0) +
    (calculations.totalDailyAllowanceKrw || 0) +
    (calculations.computedEmergencyKrw || 0);

  const stayPct = Math.round((stayAmount / totalForPct) * 100);
  const foodPct = Math.round((foodAmount / totalForPct) * 100);
  const transportPct = Math.round((transportAmount / totalForPct) * 100);
  const flexPct = Math.max(0, 100 - stayPct - foodPct - transportPct);

  const categories = [
    {
      key: "stay",
      labelKo: "숙소",
      labelEn: "Stay",
      pct: stayPct,
      amount: stayAmount,
      hexColor: "#0d9488", // Teal
      textColorClass: "text-teal-600",
      dotColorClass: "bg-teal-600",
    },
    {
      key: "food",
      labelKo: "식비",
      labelEn: "Dining",
      pct: foodPct,
      amount: foodAmount,
      hexColor: "#fb7185", // Coral / Rose
      textColorClass: "text-rose-500",
      dotColorClass: "bg-rose-500",
    },
    {
      key: "transport",
      labelKo: "교통",
      labelEn: "Transit",
      pct: transportPct,
      amount: transportAmount,
      hexColor: "#6366f1", // Indigo
      textColorClass: "text-indigo-600",
      dotColorClass: "bg-indigo-600",
    },
    {
      key: "flex",
      labelKo: "쇼핑·체험·비상금",
      labelEn: "Activities & Flex",
      pct: flexPct,
      amount: flexAmount,
      hexColor: "#f59e0b", // Amber
      textColorClass: "text-amber-600",
      dotColorClass: "bg-amber-500",
    },
  ];

  // SVG Ring Chart calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // 339.292

  let accumulatedOffset = 0;
  const segments = categories.map((cat) => {
    const dashLength = (cat.pct / 100) * circumference;
    const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += dashLength;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Highlighted spot (from user's actual selections or signature city spot)
  const firstCity = draft.selectedCities[0] || "SEOUL";
  const userFirstSpot = calculations.cityBreakdown?.[firstCity]?.selectedSpots?.[0];
  const defaultCitySpot = CITY_HIGHLIGHT_SPOTS[firstCity] || DEFAULT_SPOT;

  const spot = userFirstSpot
    ? {
        nameKo: userFirstSpot.nameKo,
        nameEn: userFirstSpot.nameEn,
        descKo: userFirstSpot.summaryKo || "내 일정에 직접 담은 추천 K-명소",
        descEn: userFirstSpot.summaryEn || "Custom chosen highlight spot from your itinerary",
        img: userFirstSpot.imageUrl || defaultCitySpot.img,
      }
    : defaultCitySpot;

  const cityName =
    locale === "ko"
      ? CITY_KOREAN_NAMES[firstCity] || firstCity
      : CITY_ENGLISH_NAMES[firstCity] || firstCity;

  // Target Health Metrics
  const targetBudget = calculations.basePlan?.targetBudgetKrw || 0;
  const isOverBudget = targetBudget > 0 && grandTotalKrw > targetBudget;
  const diffAmount = Math.abs(grandTotalKrw - targetBudget);
  const targetUsagePercent = targetBudget > 0 ? (grandTotalKrw / targetBudget) * 100 : 0;

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 2500);
      }
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  return (
    <div className="w-full relative">
      {/* Asymmetric Bento Grid (Apple / Craft.do Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
        
        {/* ========================================================================= */}
        {/* 1. Card A: 총 예상 경비 & 4대 카테고리 링 차트 (col-span-1 md:col-span-2) */}
        {/* ========================================================================= */}
        <div className="col-span-1 md:col-span-2 p-5 sm:p-7 md:p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
          <div>
            {/* Top Badge & Header */}
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                TOTAL ESTIMATED BUDGET (KRW)
              </span>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
                {nights}{locale === "ko" ? "박 " : "N "}{travelDays}{locale === "ko" ? "일 " : "D "}· {adults}{locale === "ko" ? "인 견적" : " Pax"}
              </span>
            </div>

            {/* Big Rolling Metric */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 tabular-nums">
                {formatKrw(animatedGrandTotal)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60">
                {locale === "ko"
                  ? `1인당 ${formatKrw(animatedPerTraveler)}`
                  : `${formatKrw(animatedPerTraveler)} / person`}
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium mt-1">
              {locale === "ko"
                ? "플래너에서 직접 담은 숙소, 식비, 교통, 명소 및 비상금이 100% 반영된 종합 실비입니다."
                : "Comprehensive actual breakdown based on your selected stays, meals, transit, and activities."}
            </p>
          </div>

          {/* SVG Ring Donut Chart & Category Breakdown Legend */}
          <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Left: SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Circle */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  className="stroke-neutral-100"
                  strokeWidth="15"
                  fill="transparent"
                />
                {/* Colored Segments */}
                {segments.map((seg) => {
                  if (seg.pct <= 0) return null;
                  return (
                    <circle
                      key={seg.key}
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke={seg.hexColor}
                      strokeWidth="15"
                      fill="transparent"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
              </svg>
              {/* Center Donut Capsule Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                <span className="text-[10px] font-medium text-neutral-400 block leading-tight">
                  {locale === "ko" ? "지출 비중" : "Breakdown"}
                </span>
                <span className="text-[12px] font-bold text-neutral-800 leading-tight">
                  {locale === "ko" ? "4대 카테고리" : "4 Sectors"}
                </span>
              </div>
            </div>

            {/* Right: Category Legend Grid (2x2) */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="p-2.5 rounded-2xl bg-neutral-50/70 border border-neutral-100 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cat.dotColorClass}`} />
                      <span className="font-semibold text-neutral-700 text-[11px]">
                        {locale === "ko" ? cat.labelKo : cat.labelEn}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-neutral-400 tabular-nums">
                      {cat.pct}%
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-neutral-900 tabular-nums">
                    {formatKrw(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Card B: 내 일정 맞춤 하이라이트 K-스팟 (col-span-1) */}
        {/* ========================================================================= */}
        <div className="col-span-1 p-5 sm:p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between group">
          <div>
            {/* Top Label & City Pill */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                SUGGESTED SPOT
              </span>
              <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200/60">
                {cityName}
              </span>
            </div>

            {/* Spot Thumbnail Image */}
            <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/40">
              <Image
                src={spot.img}
                alt={locale === "ko" ? spot.nameKo : spot.nameEn}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2.5 right-2.5">
                <span className="text-[10px] font-semibold text-white/90 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {userFirstSpot ? (locale === "ko" ? "내 담은 명소" : "Chosen Spot") : (locale === "ko" ? "도시 시그니처" : "Signature Spot")}
                </span>
              </div>
            </div>

            {/* Spot Details */}
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base mt-3 group-hover:text-teal-700 transition-colors line-clamp-1">
              {locale === "ko" ? spot.nameKo : spot.nameEn}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
              {locale === "ko" ? spot.descKo : spot.descEn}
            </p>
          </div>

          {/* Bottom Action Link Button */}
          <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
            <Link
              href={`/${locale}/places?city=${firstCity}`}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 group-hover:underline cursor-pointer active:scale-[0.97] transition-transform duration-150 ease-out"
            >
              <span>{locale === "ko" ? "K-스팟 전체 둘러보기" : "Explore K-Spots"}</span>
              <span className="text-sm transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Card C: 일일 권장 지출 & 목표 예산 건강성 (col-span-1) */}
        {/* ========================================================================= */}
        <div className="col-span-1 p-5 sm:p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
          <div>
            {/* Top Label */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                DAILY EXPENSE INSIGHT
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/60">
                {travelDays}{locale === "ko" ? "일간 페이싱" : " Days Pacing"}
              </span>
            </div>

            {/* Metric with Rolling Counter */}
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 block tabular-nums">
                ~{formatKrw(animatedDailyAverage)}
              </span>
              <span className="text-xs text-neutral-500 font-medium block mt-0.5">
                {locale === "ko" ? `/ 1일 전체 예상 지출` : `/ day total estimate`}
              </span>
            </div>

            {/* Target Budget Health or Smart Plan Badge */}
            <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600">
                  {targetBudget > 0 ? (locale === "ko" ? "목표 예산 비교" : "Target Health") : (locale === "ko" ? "예산 플랜 유형" : "Plan Type")}
                </span>
                {targetBudget > 0 ? (
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isOverBudget
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-teal-50 text-teal-700 border-teal-200"
                    }`}
                  >
                    {isOverBudget ? (locale === "ko" ? "예산 초과" : "Over Budget") : (locale === "ko" ? "안전 권역" : "Within Target")}
                  </span>
                ) : (
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    {locale === "ko" ? "합리적인 여행가" : "Smart Traveler"}
                  </span>
                )}
              </div>

              {targetBudget > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                    <span className="text-neutral-500">{formatPercentage(targetUsagePercent)}</span>
                    <span className={isOverBudget ? "text-rose-600" : "text-teal-700"}>
                      {isOverBudget ? `+ ${formatKrw(diffAmount)}` : `- ${formatKrw(diffAmount)}`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverBudget ? "bg-rose-500" : "bg-teal-600"
                      }`}
                      style={{ width: `${Math.min(targetUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer info note */}
          <p className="text-[11px] text-neutral-400 mt-4 leading-relaxed">
            {locale === "ko"
              ? `1인당 1일 약 ${formatKrw(Math.round(dailyAverageKrw / adults))}으로 계획된 균형 잡힌 일정입니다.`
              : `Comfortable daily pacing of approx. ${formatKrw(Math.round(dailyAverageKrw / adults))} per traveler.`}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 4. Card D: HypeHeritage 리포트 저장 및 공유 액션 바 (col-span-1 md:col-span-2) */}
        {/* ========================================================================= */}
        <div className="col-span-1 md:col-span-2 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/90 rounded-3xl border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300">
          {/* Left: Info Text & Bullet Points */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-900">
                {locale === "ko" ? "내 여행 예산 리포트 저장 및 공유하기" : "Save & Share Travel Budget Report"}
              </span>
              <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                {locale === "ko" ? "원클릭" : "One-Click"}
              </span>
            </div>
            <ul className="text-xs text-neutral-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>{locale === "ko" ? "동행자와 간편한 일정 링크 실시간 공유" : "Instant link sharing with travel companions"}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span>{locale === "ko" ? "인쇄 및 PDF 파일로 간편 다운로드 보관" : "Print & download PDF report for offline reference"}</span>
              </li>
            </ul>
          </div>

          {/* Right: Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Print / PDF button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 active:scale-[0.97] text-neutral-700 font-bold text-xs transition-all duration-150 ease-out cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>{locale === "ko" ? "인쇄 / PDF" : "Print / PDF"}</span>
            </button>

            {/* Back to Planner button */}
            <button
              type="button"
              onClick={() => router.push(`/${locale}/planner`)}
              className="px-4 py-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 active:scale-[0.97] text-neutral-700 font-bold text-xs transition-all duration-150 ease-out cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>{locale === "ko" ? "플래너 수정" : "Edit Plan"}</span>
            </button>

            {/* One-Click Share button */}
            <button
              type="button"
              onClick={handleShare}
              className="bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.97] px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-150 ease-out shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{locale === "ko" ? "공유하기 / 링크 복사" : "Share / Copy Link"}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Floating Glassmorphism Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-neutral-900/90 text-white text-xs sm:text-sm font-semibold backdrop-blur-xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>
              {locale === "ko"
                ? "여행 예산 리포트 링크가 복사되었습니다 ✨"
                : "Trip budget report link copied to clipboard ✨"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
