"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  const [cards, setCards] = useState<GuideCard[]>(GUIDE_CARDS);
  const [selectedCategory, setSelectedCategory] = useState<"all" | GuideCategory>("all");
  const isKo = locale === "ko";

  // Load latest guide cards from admin store
  useEffect(() => {
    async function loadDynamicCards() {
      try {
        const res = await fetch("/api/admin/catalog?type=GUIDE_CARDS");
        const data = await res.json();
        if (data.success && Array.isArray(data.guideCards) && data.guideCards.length > 0) {
          setCards(data.guideCards);
        }
      } catch {}
    }
    loadDynamicCards();
  }, []);

  // Filter cards by category
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      return selectedCategory === "all" || card.category === selectedCategory;
    });
  }, [cards, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 space-y-6">
      {/* Header Banner Section (Matching Planner Standard) */}
      <div className="text-center space-y-2 pt-2">
        <span className="text-[#b93829] font-extrabold text-xs tracking-tight uppercase">
          HypeHeritage Guide
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isKo ? "한국 여행 실전 가이드 & 생존 사전" : "Korea Travel Survival & Culture Guide"}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {isKo
            ? "입국 전 꼭 알아야 할 길찾기, 대중교통 이용법, 식당 문화 및 로컬 규칙을 한눈에 확인하세요."
            : "Everything you need to know before landing: transit hacks, dining etiquette, and unwritten local rules."}
        </p>
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
                    {cards.filter((c) => c.category === cat.key).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Counter Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          {isKo ? (
            <>
              총 <strong className="text-slate-800 font-extrabold">{filteredCards.length}</strong>개의 가이드 카드
            </>
          ) : (
            <>
              Showing <strong className="text-slate-800 font-extrabold">{filteredCards.length}</strong> survival cards
            </>
          )}
        </span>
        {selectedCategory !== "all" && (
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="text-[#b93829] hover:underline font-bold cursor-pointer"
          >
            {isKo ? "전체 보기" : "View all"}
          </button>
        )}
      </div>

      {/* 3. Card Deck Grid Layout */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {isKo ? "해당 카테고리에 등록된 카드가 없습니다." : "No survival cards found in this category."}
          </h3>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            {isKo ? "전체 카드 보기" : "View all cards"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredCards.map((card) => (
            <GuideCardItem key={card.id} card={card} isKo={isKo} />
          ))}
        </div>
      )}

      {/* 4. Quick Emergency Hotline Bar */}
      <div className="bg-[#fff8f6] border border-[#fce3de] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#c5221f] text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
            SOS
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#c5221f]">
              {isKo ? "24시간 한국 긴급 상황 직통 전화" : "24/7 Emergency Hotlines in Korea"}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {isKo
                ? "언제 어디서나 언어 장벽 없이 24시간 무료 다국어 통역 및 긴급 출동 지원"
                : "Free 24/7 multi-language interpretation & emergency dispatch available nationwide"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <div className="bg-white px-3.5 py-2 rounded-xl border border-[#fce3de] text-center shadow-2xs">
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              {isKo ? "관광통역안내" : "Tourist Help"}
            </div>
            <div className="text-sm font-extrabold text-[#c5221f]">1330</div>
          </div>
          <div className="bg-white px-3.5 py-2 rounded-xl border border-[#fce3de] text-center shadow-2xs">
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              {isKo ? "경찰" : "Police"}
            </div>
            <div className="text-sm font-extrabold text-[#c5221f]">112</div>
          </div>
          <div className="bg-white px-3.5 py-2 rounded-xl border border-[#fce3de] text-center shadow-2xs">
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              {isKo ? "화재·구급" : "Medical / Fire"}
            </div>
            <div className="text-sm font-extrabold text-[#c5221f]">119</div>
          </div>
        </div>
      </div>

      {/* 5. Connected CTA Banner */}
      <div className="bg-gradient-to-r from-[#b93829] via-[#ad3022] to-[#8d2317] text-white rounded-3xl p-7 sm:p-9 shadow-lg border border-[#a62c1e] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-2 max-w-xl">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ffebe8] bg-white/15 px-3 py-1 rounded-full border border-white/20">
            {isKo ? "HypeHeritage 여행 플래너" : "HypeHeritage Travel Planner"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isKo ? "이제 맞춤 한국 여행 예산을 세워볼까요?" : "Now ready to plan your trip budget?"}
          </h2>
          <p className="text-xs sm:text-sm text-[#fce8e6] leading-relaxed">
            {isKo
              ? "방문할 도시, 식사 스타일, 대중교통 이용 패턴을 선택하고 나만의 한국 여행 예산을 몇 초 만에 완성해 보세요."
              : "Calculate your custom Korea travel budget in seconds. Pick cities, choose meal styles, simulate transit costs, and get tailored local tips."}
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href={`/${locale}/planner`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#b93829] hover:bg-[#fff0ed] font-extrabold text-sm rounded-2xl shadow-md transition-all duration-200 cursor-pointer active:scale-95"
          >
            <span>{isKo ? "예산 플래너 바로가기" : "Go to Budget Planner"}</span>
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
          {isKo ? "예산 플래너" : "Budget Planner"}
        </Link>
        <span className="text-slate-300">&bull;</span>
        <Link
          href={`/${locale}/places`}
          className="hover:text-[#b93829] transition-colors"
        >
          {isKo ? "K-장소 탐색" : "K-Places"}
        </Link>
        <span className="text-slate-300">&bull;</span>
        <Link
          href={`/${locale}/report`}
          className="hover:text-[#b93829] transition-colors"
        >
          {isKo ? "예산 리포트" : "Budget Report"}
        </Link>
        <span className="text-slate-300">&bull;</span>
        <Link
          href={`/${locale}`}
          className="hover:text-[#b93829] transition-colors"
        >
          {isKo ? "홈으로" : "Home"}
        </Link>
      </div>
    </div>
  );
}
