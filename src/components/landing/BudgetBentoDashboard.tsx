"use client";

import Image from "next/image";
import { SupportedCity, TripDraft, CITY_KOREAN_NAMES } from "src/lib/trip-domain";
import type { Locale } from "src/lib/i18n/locales";

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
  tagKo: string;
  tagEn: string;
}

const CITY_HIGHLIGHT_SPOTS: Record<string, HighlightSpot> = {
  SEOUL: {
    nameKo: "경복궁 & 북촌 골목길",
    nameEn: "Gyeongbokgung & Bukchon",
    descKo: "조선 궁궐의 웅장함과 고즈넉한 한옥 골목이 공존하는 K-헤리티지 명소",
    descEn: "Royal palace majesty meets timeless traditional hanok architecture",
    img: "/assets/gyeongbokgung-main.jpg",
    tagKo: "추천 K-스팟",
    tagEn: "Featured Spot",
  },
  BUSAN: {
    nameKo: "광안리 해변 & 마린시티",
    nameEn: "Gwangalli Beach & Marine City",
    descKo: "탁 트인 푸른 바다와 광안대교 야경을 품은 K-오션 랜드마크",
    descEn: "Breathtaking oceanfront skyline and Gwangan Bridge nightscapes",
    img: "/assets/n-seoul-tower.jpg",
    tagKo: "오션 랜드마크",
    tagEn: "Ocean Landmark",
  },
  JEONJU: {
    nameKo: "전주 경기전 & 한옥마을",
    nameEn: "Jeonju Hanok Village",
    descKo: "전통 한식과 700여 채의 한옥이 선사하는 슬로시티의 고요한 미학",
    descEn: "Authentic gastronomic capital surrounded by 700 hanok houses",
    img: "/assets/namsangol-hanok.jpg",
    tagKo: "슬로시티 한옥",
    tagEn: "Hanok Culture",
  },
  GANGNEUNG: {
    nameKo: "강릉 안목 커피거리 & 경포호",
    nameEn: "Gangneung Anmok Beach",
    descKo: "에메랄드빛 동해와 솔향 가득한 바닷가 스페셜티 커피 산책",
    descEn: "Emerald East Sea waves paired with beachside artisan roasteries",
    img: "/assets/hongdae-street.jpg",
    tagKo: "힐링 바다 산책",
    tagEn: "Coastal Chill",
  },
  GYEONGJU: {
    nameKo: "경주 불국사 & 대릉원",
    nameEn: "Gyeongju Bulguksa & Tumuli",
    descKo: "천년 신라 왕조의 찬란한 유네스코 세계문화유산 랜드마크",
    descEn: "Ancient Silla dynasty royal tombs and UNESCO World Heritage temples",
    img: "/assets/changdeokgung-hall.jpg",
    tagKo: "천년 헤리티지",
    tagEn: "UNESCO Heritage",
  },
  SUWON: {
    nameKo: "수원화성 & 행궁동 공방거리",
    nameEn: "Suwon Hwaseong Fortress",
    descKo: "조선 정조의 혁신적 성곽 건축과 감성 골목 상권의 조화",
    descEn: "UNESCO world heritage fortress and modern hipster boutique cafes",
    img: "/assets/gwanghwamun-square.jpg",
    tagKo: "역사 & 감성 골목",
    tagEn: "Historic Fortress",
  },
  JEJU: {
    nameKo: "제주 성산일출봉 & 해안도로",
    nameEn: "Jeju Seongsan Sunrise Peak",
    descKo: "유네스코 3관왕에 빛나는 화산섬의 청정 자연 힐링",
    descEn: "Pristine volcanic landscapes and turquoise coastal getaways",
    img: "/assets/seongsu-street.jpg",
    tagKo: "청정 자연 휴양",
    tagEn: "Island Nature",
  },
};

const DEFAULT_SPOT: HighlightSpot = {
  nameKo: "서울 N서울타워 파노라마",
  nameEn: "N Seoul Tower Vista",
  descKo: "도심 한복판에서 360도로 조망하는 대한민국 수도의 활기찬 스카이라인",
  descEn: "Panoramic 360-degree metropolitan skyline in the heart of Seoul",
  img: "/assets/n-seoul-tower.jpg",
  tagKo: "도시 랜드마크",
  tagEn: "City Landmark",
};

export default function BudgetBentoDashboard({ draft, locale }: BudgetBentoDashboardProps) {
  const nights = draft.totalNights || 5;
  const adults = draft.adultCount || 2;
  const totalBudgetKrw = draft.targetBudgetKrw || 2700000;
  const perPersonTotal = Math.round(totalBudgetKrw / adults);
  const perPersonDaily = Math.round(perPersonTotal / (nights || 1));

  // Category breakdown allocation weights
  const categories = [
    {
      key: "stay",
      labelKo: "숙박비",
      labelEn: "Stay",
      pct: 44,
      amount: Math.round(totalBudgetKrw * 0.44),
      color: "#0f766e", // teal-700
      ringColor: "stroke-teal-600",
      dotColor: "bg-teal-600",
    },
    {
      key: "food",
      labelKo: "식비·카페",
      labelEn: "Dining",
      pct: 26,
      amount: Math.round(totalBudgetKrw * 0.26),
      color: "#f59e0b", // amber-500
      ringColor: "stroke-amber-500",
      dotColor: "bg-amber-500",
    },
    {
      key: "attraction",
      labelKo: "관광·체험",
      labelEn: "Activities",
      pct: 18,
      amount: Math.round(totalBudgetKrw * 0.18),
      color: "#b93829", // coral-red
      ringColor: "stroke-[#b93829]",
      dotColor: "bg-[#b93829]",
    },
    {
      key: "transit",
      labelKo: "교통비",
      labelEn: "Transit",
      pct: 12,
      amount: Math.round(totalBudgetKrw * 0.12),
      color: "#6366f1", // indigo-500
      ringColor: "stroke-indigo-500",
      dotColor: "bg-indigo-500",
    },
  ];

  // Pick highlight spot based on first selected city
  const firstCity: SupportedCity = draft.selectedCities[0] || "SEOUL";
  const spotInfo = CITY_HIGHLIGHT_SPOTS[firstCity] || DEFAULT_SPOT;

  // SVG Donut calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="w-full max-w-5xl mx-auto my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-bold tracking-tight mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span>{locale === "ko" ? "실시간 예산 시뮬레이션 대시보드" : "Live Budget Bento Dashboard"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            {locale === "ko" ? "선택 일정 기반 예상 견적 벤토" : "Simulated Travel Cost Matrix"}
          </h2>
        </div>
        <div className="text-xs font-medium text-neutral-500 bg-neutral-100/70 px-3 py-1.5 rounded-full border border-neutral-200/50">
          {locale === "ko"
            ? `${nights}박 ${nights + 1}일 · ${adults}인 기준`
            : `${nights}N ${nights + 1}D · ${adults} Travelers`}
        </div>
      </div>

      {/* Bento Grid: 2-column or 3-column asymmetric layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        
        {/* ================= Card 1: Main Budget & Minimal Ring Chart (lg:col-span-2) ================= */}
        <div className="lg:col-span-2 rounded-3xl p-6 sm:p-7 bg-white/90 backdrop-blur-md border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_36px_rgb(0,0,0,0.07)]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {locale === "ko" ? "총 예상 지출 (KRW)" : "Estimated Total Budget"}
              </span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50/80 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                {locale === "ko" ? "실시간 연동" : "Live Synced"}
              </span>
            </div>

            {/* Bold Typography for Total Budget */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-6">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
                {totalBudgetKrw.toLocaleString()}
              </span>
              <span className="text-lg sm:text-xl font-bold text-neutral-500">
                KRW
              </span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200/60">
                {locale === "ko"
                  ? `1인당 약 ${perPersonTotal.toLocaleString()}원`
                  : `Approx. ${perPersonTotal.toLocaleString()} KRW/person`}
              </span>
            </div>
          </div>

          {/* Donut Chart & Category Breakdown Row */}
          <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* SVG Minimal Ring Donut Chart */}
            <div className="sm:col-span-5 flex items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-neutral-100"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  {/* Category Arcs */}
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
                        stroke={cat.color}
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
                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">
                    {locale === "ko" ? "1인 일일" : "Per Day"}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-neutral-900">
                    {Math.round(perPersonDaily / 10000)}만원
                  </span>
                </div>
              </div>
            </div>

            {/* Category Legend Pill Chips */}
            <div className="sm:col-span-7 grid grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="flex flex-col p-2.5 rounded-2xl bg-neutral-50/70 border border-neutral-200/50 hover:bg-neutral-100/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${cat.dotColor} shrink-0`} />
                    <span className="text-xs font-semibold text-neutral-700 truncate">
                      {locale === "ko" ? cat.labelKo : cat.labelEn}
                    </span>
                    <span className="text-[10px] font-extrabold text-neutral-400 ml-auto">
                      {cat.pct}%
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-neutral-900 tracking-tight">
                    {cat.amount.toLocaleString()} <span className="text-[10px] text-neutral-500 font-normal">원</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= Card 2: Image Highlight Card (lg:col-span-1) ================= */}
        <div className="lg:col-span-1 rounded-3xl overflow-hidden relative border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-neutral-900 group min-h-[300px] flex flex-col justify-end">
          {/* Background Image with Zoom on Hover */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={spotInfo.img}
              alt={locale === "ko" ? spotInfo.nameKo : spotInfo.nameEn}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              priority={false}
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent" />
          </div>

          {/* Top Tag & City Indicator */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-neutral-900 shadow-xs">
              {locale === "ko" ? spotInfo.tagKo : spotInfo.tagEn}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-neutral-900/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/20">
              {locale === "ko" ? (CITY_KOREAN_NAMES[firstCity] || firstCity) : firstCity}
            </span>
          </div>

          {/* Bottom Card Content */}
          <div className="relative z-10 p-5 sm:p-6 text-white space-y-1.5">
            <h3 className="text-lg font-black tracking-tight leading-snug">
              {locale === "ko" ? spotInfo.nameKo : spotInfo.nameEn}
            </h3>
            <p className="text-xs text-neutral-200 line-clamp-2 leading-relaxed">
              {locale === "ko" ? spotInfo.descKo : spotInfo.descEn}
            </p>
          </div>
        </div>

        {/* ================= Card 3: Insight & Smart Travel Tip Card (lg:col-span-3) ================= */}
        <div className="lg:col-span-3 rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-emerald-50/50 to-neutral-50/60 border border-teal-200/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                  {locale === "ko" ? "스마트 예산 절감 팁" : "Smart Budget Insight"}
                </span>
                <span className="text-[11px] font-semibold text-teal-600 bg-teal-100/60 px-2 py-0.5 rounded-full">
                  {locale === "ko" ? "추천" : "Tip"}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-neutral-700">
                {locale === "ko"
                  ? `비수기 평일 예약 시 숙박비를 최대 18% 절약할 수 있으며, 기후동행카드·티머니 활용 시 교통비를 최적화할 수 있습니다.`
                  : `Booking accommodations on weekdays can save up to 18%, and using the Climate Card or T-money will significantly reduce transit costs.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right">
              <span className="block text-[11px] font-medium text-neutral-500">
                {locale === "ko" ? "1인 1일 권장 지출" : "Recommended Daily"}
              </span>
              <span className="text-sm sm:text-base font-black text-teal-900">
                약 {perPersonDaily.toLocaleString()} KRW
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
