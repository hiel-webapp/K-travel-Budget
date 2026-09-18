"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  GUIDE_CARDS,
  GUIDE_CATEGORIES,
  GuideCard,
  GuideCategory,
} from "src/data/guide-cards";
import { GuideCardItem } from "./guide/GuideCardItem";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface GuideContentProps {
  locale: Locale;
  dict: Dictionary;
}

export default function GuideContent({ locale, dict }: GuideContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | GuideCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isKo = locale === "ko";

  // Filter cards by category and search query
  const filteredCards = useMemo(() => {
    return GUIDE_CARDS.filter((card) => {
      const matchCategory =
        selectedCategory === "all" || card.category === selectedCategory;

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchEn =
        card.titleEn.toLowerCase().includes(q) ||
        card.summaryEn.toLowerCase().includes(q) ||
        card.proTipEn.toLowerCase().includes(q) ||
        card.detailsEn.some((d) => d.toLowerCase().includes(q));

      const matchKo =
        card.titleKo.toLowerCase().includes(q) ||
        card.summaryKo.toLowerCase().includes(q) ||
        card.proTipKo.toLowerCase().includes(q) ||
        card.detailsKo.some((d) => d.toLowerCase().includes(q));

      return matchEn || matchKo;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8">
      {/* 1. Hero Section - Brand Tone & Manner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce8e6] border border-[#f8c9c4] text-[#b93829] text-xs font-extrabold tracking-wide shadow-2xs">
          <span>{isKo ? "K-컬처 & 생존 실전 가이드" : "K-Travel Survival Handbook"}</span>
        </div>

        <h1 className="text-[26px] sm:text-[34px] md:text-[38px] font-extrabold leading-[1.25] tracking-[-0.02em] text-[#1d1d1f]">
          Korea Travel Survival & Culture Guide
        </h1>

        <p className="text-[13px] sm:text-[14px] text-[#86868b] leading-relaxed max-w-xl mx-auto">
          Everything you need to know before landing: transit hacks, dining etiquette, and unwritten local rules.
        </p>

        {isKo && (
          <p className="text-xs text-slate-500 font-medium">
            한국 여행 시 외국인이 겪는 현실적 고민(지도 길찾기, 010 웨이팅, 대중교통 하차 태그, 식당 호출벨, 즉시 면세 등)을 해결하는 핵심 가이드
          </p>
        )}

        {/* Search Bar with Brand Accent */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKo
                  ? "궁금한 내용을 검색해보세요 (예: Naver Map, 010 번호, T-money, 호출벨, 택스리펀)"
                  : "Search tips (e.g. Naver Map, 010 SIM, T-money, Call bell, Tax refund)..."
              }
              className="w-full bg-white border border-slate-200/80 shadow-xs rounded-full pl-11 pr-24 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b93829]/20 focus:border-[#b93829] transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <button
                type="button"
                className="bg-[#b93829] hover:bg-[#a12f22] text-white text-xs font-bold px-4 py-1.5 rounded-full absolute right-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {dict.guideSection?.searchButton || (isKo ? "검색" : "Search")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pill Tabs Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {GUIDE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-[13px] font-bold transition-all shrink-0 cursor-pointer snap-start flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#b93829] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-800 shadow-2xs"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isKo ? cat.labelKo : cat.labelEn}</span>
                {cat.key !== "all" && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {GUIDE_CARDS.filter((c) => c.category === cat.key).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Counter & Active Filter Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          {isKo ? "가이드 카드" : "Showing"}{" "}
          <strong className="text-slate-800 font-extrabold">{filteredCards.length}</strong>
          {isKo ? "개 표시 중" : " survival cards"}
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-[#b93829] hover:underline font-bold cursor-pointer"
          >
            {isKo ? "검색 초기화" : "Reset search"}
          </button>
        )}
      </div>

      {/* 3. Card Deck Grid Layout */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {isKo ? "일치하는 가이드 카드가 없습니다." : "No survival cards found matching your criteria."}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isKo ? "다른 검색어를 입력하거나 상단 카테고리를 변경해 보세요." : "Try searching another term or switch categories."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            {isKo ? "모든 카드 보기" : "View all cards"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredCards.map((card) => (
            <GuideCardItem key={card.id} card={card} isKo={isKo} />
          ))}
        </div>
      )}

      {/* 4. Quick Emergency Hotline Bar (Website Warm Tone) */}
      <div className="bg-[#fff8f6] border border-[#fce3de] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#c5221f] text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
            SOS
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#c5221f]">
              {dict.guideSection?.emergencyCardTitle || "24/7 한국 긴급 상황 직통 전화"}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {dict.guideSection?.emergencyCardDesc || "언제 어디서나 언어 장벽 없이 24시간 무료 다국어 통역 및 긴급 출동 지원"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <div className="bg-white px-3.5 py-2 rounded-xl border border-[#fce3de] text-center shadow-2xs">
            <div className="text-[10px] text-slate-500 font-bold uppercase">{dict.guideSection?.tourInfoLabel || "관광통역 (Tour)"}</div>
            <div className="text-sm font-extrabold text-[#c5221f]">1330</div>
          </div>
          <div className="bg-white px-3.5 py-2 rounded-xl border border-[#fce3de] text-center shadow-2xs">
            <div className="text-[10px] text-slate-500 font-bold uppercase">{dict.guideSection?.policeLabel || "경찰 (Police)"}</div>
            <div className="text-sm font-extrabold text-[#c5221f]">112</div>
          </div>
          <div className="bg-white px-3.5 py-2 rounded-xl border border-[#fce3de] text-center shadow-2xs">
            <div className="text-[10px] text-slate-500 font-bold uppercase">{dict.guideSection?.fireLabel || "화재·구급 (Ambulance)"}</div>
            <div className="text-sm font-extrabold text-[#c5221f]">119</div>
          </div>
        </div>
      </div>

      {/* 5. Connected CTA Banner (Brand Coral-Red Gradient) */}
      <div className="bg-gradient-to-r from-[#b93829] via-[#ad3022] to-[#8d2317] text-white rounded-3xl p-7 sm:p-9 shadow-lg border border-[#a62c1e] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-2 max-w-xl">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ffebe8] bg-white/15 px-3 py-1 rounded-full border border-white/20">
            HypeHeritage Travel Planner
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Now ready to plan your trip budget?
          </h2>
          <p className="text-xs sm:text-sm text-[#fce8e6] leading-relaxed">
            {isKo
              ? "방문할 도시, 식사 스타일, 대중교통 이용 패턴을 선택하고 나만의 한국 여행 맞춤 예산을 지금 완성해 보세요."
              : "Calculate your custom Korea travel budget in seconds. Pick cities, choose meal styles, simulate transit costs, and get tailored local tips."}
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href={`/${locale}/planner`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#b93829] hover:bg-[#fff0ed] font-extrabold text-sm rounded-2xl shadow-md transition-all duration-200 cursor-pointer active:scale-95"
          >
            <span>{dict.planner?.plannerShortcutLink || "Go to Budget Planner"}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation Shortcuts */}
      <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-500 pb-2">
        <Link
          href={`/${locale}/planner`}
          className="hover:text-[#b93829] transition-colors"
        >
          {dict?.planner?.plannerShortcutLink || "Budget Planner"}
        </Link>
        <span className="text-slate-300">&bull;</span>
        <Link
          href={`/${locale}/places`}
          className="hover:text-[#b93829] transition-colors"
        >
          {dict?.navigation?.places || "K-Places"}
        </Link>
        <span className="text-slate-300">&bull;</span>
        <Link
          href={`/${locale}/report`}
          className="hover:text-[#b93829] transition-colors"
        >
          {dict?.planner?.reportShortcutLink || "Budget Report"}
        </Link>
      </div>
    </div>
  );
}
