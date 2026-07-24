"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { listTrends } from "../lib/trend";
import type { SupportedCity } from "../lib/trip-domain";
import type { TrendCategory, TrendItem } from "../lib/trend/types";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface TrendContentProps {
  locale: Locale;
  dict: Dictionary;
}

export default function TrendContent({ locale, dict }: TrendContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"POPULAR" | "RECENT">("POPULAR");
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lang = locale === "en" ? "en" : "ko";

  // 트렌드 아이템 목록 조회
  const allItems = useMemo(() => {
    return listTrends({
      category: selectedCategory,
      searchQuery,
      sortBy,
    });
  }, [selectedCategory, searchQuery, sortBy]);

  // 히어로 트렌드 카드 (isHero인 첫 번째 항목이거나 전체의 첫 번째 항목)
  const heroItem = useMemo(() => {
    if (selectedCategory !== "ALL" || searchQuery.trim() !== "") return null;
    return allItems.find((item) => item.isHero) || allItems[0] || null;
  }, [allItems, selectedCategory, searchQuery]);

  // 그리드 트렌드 카탈로그 (히어로 항목 제외 또는 전체)
  const gridItems = useMemo(() => {
    if (heroItem && selectedCategory === "ALL" && !searchQuery.trim()) {
      return allItems.filter((item) => item.id !== heroItem.id);
    }
    return allItems;
  }, [allItems, heroItem, selectedCategory, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const toggleBookmark = (id: string, title: string) => {
    setBookmarkedIds((prev) => {
      const next = !prev[id];
      if (next) {
        showToast(
          lang === "en"
            ? `'${title}' has been saved to your bookmarks!`
            : `'${title}' 항목이 북마크에 저장되었습니다.`
        );
      }
      return { ...prev, [id]: next };
    });
  };

  const handleAddCost = (title: string) => {
    showToast(
      lang === "en"
        ? `'${title}' estimated cost has been referenced for your budget calculation.`
        : `'${title}' 항목이 예상 비용 참고 목록에 추가되었습니다.`
    );
  };

  const categories: { key: TrendCategory; label: string }[] = [
    { key: "ALL", label: dict.trendSection.allTabs || "전체" },
    { key: "FOOD", label: lang === "en" ? "Food" : "음식" },
    { key: "CAFE", label: lang === "en" ? "Cafe" : "카페" },
    { key: "PLACE", label: lang === "en" ? "Place" : "장소" },
    { key: "CULTURE", label: lang === "en" ? "Culture" : "문화" },
    { key: "BEAUTY", label: lang === "en" ? "Beauty" : "뷰티" },
    { key: "SHOPPING", label: lang === "en" ? "Shopping" : "쇼핑" },
    { key: "EVENT", label: lang === "en" ? "Event" : "이벤트" },
  ];

  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case "HOT":
      case "TRENDING":
        return "bg-[#b93829] text-white";
      case "EDITOR":
        return "bg-[#2d5a43] text-white";
      case "RECENT":
        return "bg-[#1e3a8a] text-white";
      case "SEASON":
        return "bg-[#0284c7] text-white";
      default:
        return "bg-[#b93829] text-white";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 space-y-7">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner Section */}
      <div className="text-center space-y-2 pt-2">
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <span className="text-[#b93829] font-extrabold text-xs tracking-tight uppercase">
            {dict.trendSection.trendTopTag || "지금 한국이 주목하는 것"}
          </span>
          <span className="bg-[#fdf2f2] text-[#b93829] border border-[#fce8e8] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            {dict.trendSection.trendWeeklyUpdate || "⏱ 매주 업데이트"}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {dict.planner.trendHeroTitle}
        </h1>

        <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {dict.planner.trendHeroSubtitle}
        </p>
      </div>

      {/* Search & Category Filter Box */}
      <div className="bg-[#f4f4f5] p-3.5 md:p-4 rounded-2xl flex items-center justify-between gap-4 flex-wrap border border-slate-200/60 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-[#b93829] text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-xs"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.trendSection.trendSearchPlaceholder || "트렌드 검색"}
              className="w-full bg-white border border-slate-200 text-xs rounded-full pl-9 pr-4 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b93829]/20 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "POPULAR" | "RECENT")}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-full px-3.5 py-1.5 hover:bg-slate-50 cursor-pointer shadow-xs focus:outline-none"
          >
            <option value="POPULAR">{dict.trendSection.trendSortPopular || "지금 인기순"}</option>
            <option value="RECENT">{dict.trendSection.trendSortRecent || "최신순"}</option>
          </select>
        </div>
      </div>

      {/* Main Featured Hero Trend Card */}
      {heroItem && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 md:p-6 shadow-xs hover:shadow-md transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Hero Image */}
            <div className="lg:col-span-7 relative min-h-[260px] md:min-h-[340px] rounded-2xl overflow-hidden group">
              <img
                src={heroItem.imageUrl}
                alt={heroItem.translations[lang].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3.5 left-3.5">
                <span className="bg-[#b93829] text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  {heroItem.badge?.[lang] || "🔥 인기 상승 중"}
                </span>
              </div>
            </div>

            {/* Hero Details */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Category & City tags */}
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">
                    {heroItem.categoryLabel?.[lang] || heroItem.category}
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">
                    {heroItem.translations[lang].locationDisplay?.split(",")[0] ||
                      (heroItem.city === "SEOUL" ? (lang === "en" ? "Seoul" : "서울") : (lang === "en" ? "Busan" : "부산"))}
                  </span>
                </div>

                {/* Hero Title */}
                <h2 className="text-2xl font-extrabold text-slate-900 leading-snug">
                  {heroItem.translations[lang].title}
                </h2>

                {/* Why Popular Box */}
                <div className="bg-[#fff8f6] border border-[#fce3de] rounded-2xl p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-[#b93829] flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#b93829]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{dict.trendSection.trendWhyPopularTitle || "왜 인기 있나요?"}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {heroItem.translations[lang].whyPopular || heroItem.translations[lang].overview}
                  </p>
                </div>
              </div>

              {/* Price & Location Meta */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 flex-wrap">
                  <span className="flex items-center gap-1">
                    💳 {heroItem.translations[lang].priceDisplay || "₩ 15,000~ (1인 기준)"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    📍 {heroItem.translations[lang].locationDisplay || "서울 주요 지역"}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddCost(heroItem.translations[lang].title)}
                    className="flex-1 bg-[#b93829] hover:bg-[#a12f22] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{dict.trendSection.trendViewDetail || "트렌드 자세히 보기"}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddCost(heroItem.translations[lang].title)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {dict.trendSection.trendAddCost || "+ 예상 비용 추가"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Section Title */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <svg className="w-5 h-5 text-[#b93829]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <h2>{dict.trendSection.trendExploreAllTitle || "모든 트렌드 탐색"}</h2>
        </div>

        {/* Catalog 3-Column Grid */}
        {gridItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridItems.map((item) => {
              const trans = item.translations[lang] || item.translations.ko;
              const isBookmarked = bookmarkedIds[item.id] || false;
              const badgeStyle = getBadgeStyle(item.badgeType);

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Card Image Header */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={trans.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Left Badge */}
                    {item.badge?.[lang] && (
                      <div className="absolute top-3 left-3">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-xs ${badgeStyle}`}
                        >
                          {item.badge[lang]}
                        </span>
                      </div>
                    )}

                    {/* Top Right Bookmark Button */}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id, trans.title)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center transition-all cursor-pointer ${
                        isBookmarked ? "text-[#b93829]" : "text-slate-500 hover:text-[#b93829] hover:bg-white"
                      }`}
                      title="Bookmark trend"
                    >
                      <svg
                        className="w-4 h-4"
                        fill={isBookmarked ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      {/* Sub-meta (Category · Location) */}
                      <div className="text-[11px] font-extrabold text-[#b93829] flex items-center gap-1">
                        <span>{item.categoryLabel?.[lang] || item.category}</span>
                        <span>•</span>
                        <span>{trans.locationDisplay || (item.city === "ALL" ? "전국" : item.city)}</span>
                      </div>

                      {/* Card Title */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#b93829] transition-colors line-clamp-1">
                        {trans.title}
                      </h3>

                      {/* Overview */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                        {trans.overview}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {/* Price & Updated Info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2.5">
                        <span className="font-bold text-slate-700">
                          {trans.priceDisplay || "무료"}
                        </span>
                        <span className="text-slate-400">
                          {item.updatedText?.[lang] || item.updatedAt}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddCost(trans.title)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs py-2 rounded-xl text-center transition-colors cursor-pointer"
                        >
                          {lang === "en" ? "View Details" : "자세히 보기"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddCost(trans.title)}
                          className="w-9 h-9 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Add cost"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="text-base font-bold text-slate-800">
              {lang === "en" ? "No trends found" : "검색 조건에 맞는 트렌드가 없습니다"}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === "en" ? "Try searching with a different keyword or category." : "다른 검색어나 카테고리를 선택해 보세요."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-[#b93829] hover:underline cursor-pointer pt-2 inline-block"
            >
              {lang === "en" ? "Reset Filters" : "필터 초기화"}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Shortcuts Links */}
      <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-bold pb-4">
        <Link
          href={`/${locale}/planner`}
          className="text-slate-500 hover:text-[#b93829] transition-colors rounded px-2 py-1"
        >
          {dict.planner.plannerShortcutLink}
        </Link>
        <Link
          href={`/${locale}/report`}
          className="text-slate-500 hover:text-[#b93829] transition-colors rounded px-2 py-1"
        >
          {dict.planner.reportShortcutLink}
        </Link>
      </div>
    </div>
  );
}
