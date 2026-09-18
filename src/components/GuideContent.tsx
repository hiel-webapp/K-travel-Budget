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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
      {/* 1. Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
          <span>K-Travel Survival Handbook</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
          Korea Travel Survival & Culture Guide
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Everything you need to know before landing: transit hacks, dining etiquette, and unwritten local rules.
        </p>
        {isKo && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            외국인 친구나 여행자에게 반드시 알려줘야 할 현실적인 한국 여행 생존 가이드
          </p>
        )}

        {/* Search Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKo
                  ? "검색어 입력 (예: Naver Map, eSIM, T-money, 팁, 1330)"
                  : "Search tips (e.g. Naver Map, 010 SIM, T-money, Call bell, Tax refund)..."
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-5 py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                Clear
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
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer snap-start ${
                  isSelected
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                <span>{isKo ? cat.labelKo : cat.labelEn}</span>
                {cat.key !== "all" && (
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
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
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-slate-100">{filteredCards.length}</strong> survival cards
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-teal-600 hover:underline"
          >
            Reset search
          </button>
        )}
      </div>

      {/* 3. Card Deck Grid Layout */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {isKo ? "검색 결과와 일치하는 가이드 카드가 없습니다." : "No survival cards found matching your criteria."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="mt-3 inline-block px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
          >
            {isKo ? "모든 카드 보기" : "View all cards"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <GuideCardItem key={card.id} card={card} isKo={isKo} />
          ))}
        </div>
      )}

      {/* Quick Emergency Numbers Bar */}
      <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white font-bold flex items-center justify-center shrink-0 text-sm">
            SOS
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Emergency Hotlines in Korea
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              24/7 Multi-language interpretation & emergency dispatch available from any phone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Tour Help</div>
            <div className="text-sm font-black text-rose-600 dark:text-rose-400">1330</div>
          </div>
          <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Police</div>
            <div className="text-sm font-black text-rose-600 dark:text-rose-400">112</div>
          </div>
          <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Medical/Fire</div>
            <div className="text-sm font-black text-rose-600 dark:text-rose-400">119</div>
          </div>
        </div>
      </div>

      {/* 4. Connected CTA Banner (Go to Budget Planner) */}
      <div className="mt-12 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800/80">
            HypeHeritage Planner
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Now ready to plan your trip budget?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Calculate your custom Korea travel budget in seconds. Pick cities, choose meal styles, simulate transit costs, and get tailored local tips.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href={`/${locale}/planner`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg hover:shadow-teal-500/20 transition duration-200 cursor-pointer"
          >
            <span>Go to Budget Planner</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Bottom Shortcuts */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link
          href={`/${locale}/planner`}
          className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          {dict?.planner?.plannerShortcutLink || "Budget Planner"}
        </Link>
        <span>&bull;</span>
        <Link
          href={`/${locale}/report`}
          className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          {dict?.planner?.reportShortcutLink || "Budget Report"}
        </Link>
        <span>&bull;</span>
        <Link
          href={`/${locale}`}
          className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
