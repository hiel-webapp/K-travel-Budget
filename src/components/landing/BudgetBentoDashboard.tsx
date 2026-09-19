"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SupportedCity, TripDraft, CITY_KOREAN_NAMES } from "src/lib/trip-domain";
import type { Locale } from "src/lib/i18n/locales";
import { useCountUp } from "src/lib/hooks/useCountUp";

interface BudgetBentoDashboardProps {
  draft: TripDraft;
  locale: Locale;
}

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

export default function BudgetBentoDashboard({ draft, locale }: BudgetBentoDashboardProps) {
  const [showToast, setShowToast] = useState(false);

  const nights = draft.totalNights || 5;
  const adults = draft.adultCount || 2;
  const targetBudgetKrw = draft.targetBudgetKrw || 2700000;
  const targetDailyAverage = Math.round(targetBudgetKrw / (nights || 1));

  // Rolling counter animations with ease-out quart curve
  const animatedTotalBudget = useCountUp(targetBudgetKrw, 1100);
  const animatedDailyAverage = useCountUp(targetDailyAverage, 1100);
  const animatedPerPersonTotal = Math.round(animatedTotalBudget / adults);

  // Category breakdown allocation weights (Teal, Coral, Slate, Amber)
  const categories = [
    {
      key: "stay",
      labelKo: "숙소",
      labelEn: "Stay",
      pct: 42,
      amount: Math.round(animatedTotalBudget * 0.42),
      hexColor: "#0d9488", // Teal
      textColorClass: "text-teal-500",
      dotColorClass: "bg-teal-500",
    },
    {
      key: "food",
      labelKo: "식비",
      labelEn: "Dining",
      pct: 28,
      amount: Math.round(animatedTotalBudget * 0.28),
      hexColor: "#fb7185", // Coral / Rose-400
      textColorClass: "text-rose-400",
      dotColorClass: "bg-rose-400",
    },
    {
      key: "attraction",
      labelKo: "쇼핑·체험",
      labelEn: "Activities",
      pct: 18,
      amount: Math.round(animatedTotalBudget * 0.18),
      hexColor: "#475569", // Slate-600
      textColorClass: "text-slate-600",
      dotColorClass: "bg-slate-600",
    },
    {
      key: "transit",
      labelKo: "교통",
      labelEn: "Transit",
      pct: 12,
      amount: Math.round(animatedTotalBudget * 0.12),
      hexColor: "#f59e0b", // Amber-500
      textColorClass: "text-amber-500",
      dotColorClass: "bg-amber-500",
    },
  ];

  // Pick highlight spot based on first selected city
  const firstCity: SupportedCity = draft.selectedCities[0] || "SEOUL";
  const spot = CITY_HIGHLIGHT_SPOTS[firstCity] || DEFAULT_SPOT;

  // SVG Donut calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      } catch (e) {
        console.error("Clipboard write error:", e);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 max-w-5xl mx-auto mt-8 sm:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 px-1 sm:px-0">
        
        {/* ========================================================================= */}
        {/* 1. Card A: 총 예산 및 카테고리 링 차트 (col-span-1 md:col-span-2 p-6 sm:p-8) */}
        {/* ========================================================================= */}
        <div className="col-span-1 md:col-span-2 p-5 sm:p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
          <div>
            {/* Top Label */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                TOTAL ESTIMATED BUDGET (KRW)
              </span>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                {locale === "ko" ? `${nights}박 ${adults}인 견적` : `${nights}N · ${adults} Travelers`}
              </span>
            </div>

            {/* Main Amount with Rolling Counter */}
            <div className="mt-2 flex items-baseline gap-2 sm:gap-3 flex-nowrap overflow-visible">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 tabular-nums shrink-0">
                {animatedTotalBudget.toLocaleString()}
              </span>
              <span className="text-base sm:text-lg font-bold text-neutral-500 shrink-0">
                KRW
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 bg-neutral-100/80 px-2.5 py-0.5 rounded-full border border-neutral-200/60 whitespace-nowrap shrink-0">
                {locale === "ko"
                  ? `1인당 ${animatedPerPersonTotal.toLocaleString()}원`
                  : `${animatedPerPersonTotal.toLocaleString()} KRW/person`}
              </span>
            </div>
          </div>

          {/* Center Content: Minimal SVG Donut / Ring Chart & Legend */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* SVG Ring Donut Chart */}
            <div className="sm:col-span-5 flex items-center justify-center">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track background */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-neutral-100"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  {/* Colored Arcs */}
                  {categories.map((cat) => {
                    const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                    accumulatedPercent += cat.pct;
                    return (
                      <circle
                        key={cat.key}
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={cat.hexColor}
                        strokeWidth="11"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    );
                  })}
                </svg>
                {/* Center Donut Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {locale === "ko" ? "지출 비중" : "Breakdown"}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-800">
                    4대 카테고리
                  </span>
                </div>
              </div>
            </div>

            {/* Legend Grid */}
            <div className="sm:col-span-7 grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="flex flex-col p-2 sm:p-2.5 rounded-2xl bg-neutral-50/60 border border-neutral-200/50 hover:bg-neutral-100/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${cat.dotColorClass} shrink-0`} />
                    <span className="text-[11px] sm:text-xs font-semibold text-neutral-700 truncate">
                      {locale === "ko" ? cat.labelKo : cat.labelEn}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400 ml-auto">
                      {cat.pct}%
                    </span>
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-neutral-900 tracking-tight tabular-nums">
                    {cat.amount.toLocaleString()} <span className="text-[10px] font-normal text-neutral-500">원</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Card B: 추천 K-스팟 하이라이트 (col-span-1 p-6 flex flex-col justify-between) */}
        {/* ========================================================================= */}
        <div className="col-span-1 p-5 sm:p-6 flex flex-col justify-between bg-white/80 backdrop-blur-md rounded-3xl border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300">
          <div>
            {/* Top Label */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                SUGGESTED SPOT
              </span>
              <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/50">
                {locale === "ko" ? (CITY_KOREAN_NAMES[firstCity] || firstCity) : firstCity}
              </span>
            </div>

            {/* Center Image Thumbnail with micro zoom */}
            <div className="rounded-2xl overflow-hidden aspect-video relative mt-3 mb-3 bg-neutral-100">
              <Image
                src={spot.img}
                alt={locale === "ko" ? spot.nameKo : spot.nameEn}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Spot Description */}
            <h3 className="text-sm sm:text-[15px] font-bold text-neutral-900 tracking-tight leading-snug line-clamp-1">
              {locale === "ko" ? spot.nameKo : spot.nameEn}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
              {locale === "ko" ? spot.descKo : spot.descEn}
            </p>
          </div>

          {/* 당분간 숨김 처리: K-스팟 비공개 (추후 재활성화 가능하도록 보존) */}
          {/*
          <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
            <Link
              href={`/${locale}/places?city=${firstCity}`}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 group-hover:underline cursor-pointer active:scale-[0.97] transition-transform duration-150 ease-out"
            >
              <span>{locale === "ko" ? "K-스팟 전체 둘러보기" : "Explore K-Spots"}</span>
              <span className="text-sm transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          */}
        </div>

        {/* ========================================================================= */}
        {/* 3. Card C: 일일 권장 지출 인사이트 (col-span-1 p-6) */}
        {/* ========================================================================= */}
        <div className="col-span-1 p-5 sm:p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
          <div>
            {/* Top Label */}
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
              DAILY EXPENSE INSIGHT
            </span>

            {/* Metric with Rolling Counter */}
            <div className="mt-3">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-neutral-900 block tabular-nums">
                ~{animatedDailyAverage.toLocaleString()} KRW
              </span>
              <span className="text-xs text-neutral-500 font-medium block mt-0.5">
                {locale === "ko" ? `/ 1일 전체 예상 지출` : `/ day total estimate`}
              </span>
            </div>

            {/* Badge: 합리적인 여행가 플랜 */}
            <div className="mt-4">
              <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-1 rounded-full font-medium inline-block">
                {locale === "ko" ? "합리적인 여행가 플랜" : "Smart Budget Plan"}
              </span>
            </div>
          </div>

          {/* Footer info note */}
          <p className="text-[11px] text-neutral-400 mt-4 leading-relaxed">
            {locale === "ko"
              ? `1인당 1일 약 ${Math.round(animatedDailyAverage / adults).toLocaleString()}원으로 여유롭게 즐길 수 있는 추천 견적입니다.`
              : `Comfortable daily pacing of approx. ${Math.round(animatedDailyAverage / adults).toLocaleString()} KRW per traveler.`}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 4. Card D: HypeHeritage 여행 꿀팁 & 공유 액션 (col-span-1 md:col-span-2 p-6) */}
        {/* ========================================================================= */}
        <div className="col-span-1 md:col-span-2 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/80 rounded-3xl border border-neutral-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(0,0,0,0.06)] transition-all duration-300">
          {/* Left: Info Text & Bullet Points */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-900">
                {locale === "ko" ? "내 여행 예산 리포트 저장 및 공유하기" : "Save & Share Travel Budget Report"}
              </span>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
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
                <span>{locale === "ko" ? "예산 초과 방지 스마트 영수증 및 상세 플래너 연동" : "Smart receipt breakdown & seamless planner integration"}</span>
              </li>
            </ul>
          </div>

          {/* Right: Action Button with haptic scale */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.97] px-5 py-2.5 rounded-full text-sm font-medium transition-transform duration-150 ease-out shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
