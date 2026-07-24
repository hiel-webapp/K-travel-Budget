"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { K_GUIDE_CONTENTS, K_GUIDE_FAQS, GuideItem, GuideFAQ } from "../lib/static-contents";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface GuideContentProps {
  locale: Locale;
  dict: Dictionary;
}

export default function GuideContent({ locale, dict }: GuideContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"RECOMMEND" | "RECENT">("RECOMMEND");
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null);
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lang = locale === "en" ? "en" : "ko";
  const items: GuideItem[] = K_GUIDE_CONTENTS[lang] || K_GUIDE_CONTENTS.ko;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const toggleBookmark = (id: string, title: string) => {
    setBookmarkedIds((prev) => {
      const next = !prev[id];
      showToast(
        next
          ? lang === "en"
            ? `'${title}' guide bookmarked.`
            : `'${title}' 가이드가 저장되었습니다.`
          : lang === "en"
          ? `'${title}' guide removed from bookmarks.`
          : `'${title}' 가이드 저장이 해제되었습니다.`
      );
      return { ...prev, [id]: next };
    });
  };

  // 필터링된 가이드 항목
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (showSavedOnly && !bookmarkedIds[item.id]) return false;
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchOverview = item.overview.toLowerCase().includes(q);
        const matchDetails = item.details.some((d) => d.toLowerCase().includes(q));
        if (!matchTitle && !matchOverview && !matchDetails) return false;
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery, showSavedOnly, bookmarkedIds]);

  // 히어로 가이드 및 그리드 가이드 분리
  const heroGuide = useMemo(() => {
    if (selectedCategory !== "ALL" || searchQuery.trim() || showSavedOnly) return null;
    return filteredItems.find((item) => item.isHero) || filteredItems[0] || null;
  }, [filteredItems, selectedCategory, searchQuery, showSavedOnly]);

  const gridGuides = useMemo(() => {
    if (heroGuide && selectedCategory === "ALL" && !searchQuery.trim() && !showSavedOnly) {
      return filteredItems.filter((item) => item.id !== heroGuide.id);
    }
    return filteredItems;
  }, [filteredItems, heroGuide, selectedCategory, searchQuery, showSavedOnly]);

  const categories = [
    { key: "ALL", label: dict.trendSection?.allTabs || "전체" },
    { key: "DINING", label: lang === "en" ? "Dining" : "식당·음식" },
    { key: "TRANSIT", label: lang === "en" ? "Transit" : "교통" },
    { key: "PAYMENT", label: lang === "en" ? "Payment" : "결제·환승" },
    { key: "STAY", label: lang === "en" ? "Stay" : "숙박" },
    { key: "SHOPPING", label: lang === "en" ? "Shopping" : "쇼핑" },
    { key: "COMMUNICATION", label: lang === "en" ? "Communication" : "소통" },
    { key: "SAFETY", label: lang === "en" ? "Safety" : "안전·긴급" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="text-center space-y-2 pt-2">
        <span className="text-[#b93829] font-extrabold text-xs tracking-tight uppercase">
          {dict.guideSection?.topTag || "한국 여행이 더 쉬워지는 실전 정보"}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {dict.planner.guideHeroTitle}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          식당 이용법부터 교통, 결제, 긴급 상황까지 한국 여행에 꼭 필요한 정보를 빠르게 확인하세요.<br />
          여행 전 확인하고, 현지에서 다시 찾아보세요.
        </p>

        {/* Central Search Bar */}
        <div className="max-w-2xl mx-auto relative mt-6 flex items-center">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              dict.guideSection?.searchPlaceholder ||
              "궁금한 내용을 검색해보세요. 예: 식당 호출벨, 교통카드, 택스리펀"
            }
            className="w-full bg-white border border-slate-200 shadow-xs rounded-full pl-11 pr-24 py-3 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b93829]/20 transition-all"
          />
          <button
            type="button"
            onClick={() => setSearchQuery(searchQuery)}
            className="bg-[#b93829] hover:bg-[#a12f22] text-white text-xs font-bold px-5 py-2 rounded-full absolute right-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {dict.guideSection?.searchButton || "검색"}
          </button>
        </div>
      </div>

      {/* 4 Quick Situation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Situation 1 */}
        <div
          onClick={() => setSelectedCategory("DINING")}
          className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group ${
            selectedCategory === "DINING" ? "border-[#b93829] ring-2 ring-[#b93829]/10" : "border-slate-200/80"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
            🍴
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#b93829] transition-colors">
              {dict.guideSection?.situationDiningTitle || "식당에 있어요"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {dict.guideSection?.situationDiningSub || "주문, 호출벨, 반찬, 결제 방법"}
            </p>
          </div>
        </div>

        {/* Situation 2 */}
        <div
          onClick={() => setSelectedCategory("TRANSIT")}
          className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group ${
            selectedCategory === "TRANSIT" ? "border-[#b93829] ring-2 ring-[#b93829]/10" : "border-slate-200/80"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#f1f3f4] text-slate-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
            🚌
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#b93829] transition-colors">
              {dict.guideSection?.situationTransitTitle || "이동 중이에요"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {dict.guideSection?.situationTransitSub || "교통카드, 환승, 택시, 길 찾기"}
            </p>
          </div>
        </div>

        {/* Situation 3 */}
        <div
          onClick={() => setSelectedCategory("PAYMENT")}
          className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group ${
            selectedCategory === "PAYMENT" ? "border-[#b93829] ring-2 ring-[#b93829]/10" : "border-slate-200/80"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#fce8e6] text-[#c5221f] flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
            💳
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#b93829] transition-colors">
              {dict.guideSection?.situationPaymentTitle || "결제하려고 해요"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {dict.guideSection?.situationPaymentSub || "카드, 현금, 환전, 팁 문화"}
            </p>
          </div>
        </div>

        {/* Situation 4 */}
        <div
          onClick={() => setSelectedCategory("SAFETY")}
          className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group ${
            selectedCategory === "SAFETY" ? "border-[#b93829] ring-2 ring-[#b93829]/10" : "border-slate-200/80"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#fce8e6] text-[#c5221f] flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
            🆘
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#b93829] transition-colors">
              {dict.guideSection?.situationHelpTitle || "도움이 필요해요"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {dict.guideSection?.situationHelpSub || "분실, 병원, 경찰, 긴급 연락"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Action Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
        {/* Category Capsule Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setShowSavedOnly(false);
                }}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  active && !showSavedOnly
                    ? "bg-[#b93829] text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-xs"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Sort Select */}
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSortBy("RECOMMEND")}
              className={`cursor-pointer ${sortBy === "RECOMMEND" ? "text-slate-900 font-extrabold" : "text-slate-400"}`}
            >
              {dict.guideSection?.sortRecommend || "추천순"}
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setSortBy("RECENT")}
              className={`cursor-pointer ${sortBy === "RECENT" ? "text-slate-900 font-extrabold" : "text-slate-400"}`}
            >
              {dict.guideSection?.sortRecent || "최신순"}
            </button>
          </div>

          {/* Bookmarked Filter Button */}
          <button
            type="button"
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              showSavedOnly
                ? "bg-[#b93829] text-white border-[#b93829]"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
            }`}
          >
            <span>{dict.guideSection?.savedGuideButton || "🔖 저장한 가이드"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Main Featured Card & Guide Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero Featured Card */}
          {heroGuide && (
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all grid grid-cols-1 md:grid-cols-12">
              {/* Image Column */}
              <div className="md:col-span-5 relative min-h-[220px] md:min-h-[280px]">
                <img
                  src={heroGuide.imageUrl || "https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=800&auto=format&fit=crop"}
                  alt={heroGuide.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details Column */}
              <div className="md:col-span-7 p-5 md:p-6 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  {/* Tags */}
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">
                      {heroGuide.categoryLabel?.[lang] || "식당·음식"}
                    </span>
                    <span className="bg-[#fce8e6] text-[#c5221f] px-2 py-0.5 rounded text-[11px] font-bold">
                      {heroGuide.subTag?.[lang] || "여행 전 필수"}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {heroGuide.title}
                  </h2>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {heroGuide.overview}
                  </p>

                  {/* Checklist */}
                  {heroGuide.checklist && (
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 font-medium pt-1">
                      {heroGuide.checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="text-[#b93829] font-bold">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-3">
                    <span>⏱ {heroGuide.readTime || "3분 읽기"}</span>
                    <span>•</span>
                    <span>🔄 {heroGuide.updatedDate || "2026년 7월"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedGuideId(expandedGuideId === heroGuide.id ? null : heroGuide.id)}
                    className="text-[#b93829] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{expandedGuideId === heroGuide.id ? (lang === "en" ? "Close" : "접기") : (lang === "en" ? "Read Guide" : "가이드 보기")}</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>

              {/* Expanded Guide Content */}
              {expandedGuideId === heroGuide.id && (
                <div className="md:col-span-12 p-6 bg-[#faf9f6] border-t border-slate-200/80 space-y-3 text-xs text-slate-700 leading-relaxed">
                  <h4 className="font-extrabold text-slate-900 text-sm">상세 이용 지침 및 에티켓</h4>
                  <ul className="space-y-2 list-disc pl-5">
                    {heroGuide.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 2-Column Guide Cards Grid */}
          {gridGuides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gridGuides.map((guide) => {
                const isExpanded = expandedGuideId === guide.id;
                const isBookmarked = bookmarkedIds[guide.id] || false;

                return (
                  <div
                    key={guide.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      {/* Meta Tags & Read Time */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">
                            {guide.categoryLabel?.[lang] || guide.category}
                          </span>
                          {guide.subTag?.[lang] && (
                            <span className="bg-[#fce8e6] text-[#c5221f] px-2 py-0.5 rounded text-[11px] font-bold">
                              {guide.subTag[lang]}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          ⏱ {guide.readTime || "3분"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#b93829] transition-colors">
                        {guide.title}
                      </h3>

                      {/* Overview */}
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {guide.overview}
                      </p>
                    </div>

                    {/* Footer Action */}
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-bold text-[#b93829]">
                      <button
                        type="button"
                        onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? (lang === "en" ? "Close" : "접기") : (dict.guideSection?.viewGuideLink || "가이드 보기 ➔")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(guide.id, guide.title)}
                        className={`text-sm cursor-pointer ${isBookmarked ? "text-[#b93829]" : "text-slate-300 hover:text-slate-500"}`}
                        title="Bookmark guide"
                      >
                        🔖
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 bg-[#faf9f6] p-3 rounded-xl">
                        <ul className="space-y-1.5 list-disc pl-4">
                          {guide.details.map((detail, idx) => (
                            <li key={idx}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <h3 className="text-sm font-bold text-slate-800">검색된 가이드가 없습니다</h3>
              <p className="text-xs text-slate-500">다른 검색어를 입력하시거나 카테고리 필터를 변경해보세요.</p>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Emergency Contacts & FAQ Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Emergency Contacts Card */}
          <div className="bg-[#fff8f6] border border-[#fce3de] rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#c5221f] flex items-center gap-1.5">
                <span>{dict.guideSection?.emergencyCardTitle || "⚠️ 긴급 상황 연락처"}</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {dict.guideSection?.emergencyCardDesc || "긴급 상황에서는 현재 위치와 필요한 도움을 먼저 알려주세요."}
              </p>
            </div>

            {/* Hotline Numbers */}
            <div className="space-y-2">
              {/* Police */}
              <div className="bg-white rounded-xl p-3 border border-[#fce3de] flex items-center justify-between text-xs font-bold text-slate-800 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span>🚨</span>
                  <span>{dict.guideSection?.policeLabel || "경찰 (Police)"}</span>
                </div>
                <span className="text-[#c5221f] font-extrabold text-sm">112</span>
              </div>

              {/* Fire/Ambulance */}
              <div className="bg-white rounded-xl p-3 border border-[#fce3de] flex items-center justify-between text-xs font-bold text-slate-800 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span>🚒</span>
                  <span>{dict.guideSection?.fireLabel || "화재·구급 (Fire/Ambulance)"}</span>
                </div>
                <span className="text-[#c5221f] font-extrabold text-sm">119</span>
              </div>

              {/* Tourist Info */}
              <div className="bg-white rounded-xl p-3 border border-[#fce3de] flex items-center justify-between text-xs font-bold text-slate-800 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span>🗣️</span>
                  <span>{dict.guideSection?.tourInfoLabel || "관광통역안내"}</span>
                </div>
                <span className="text-[#c5221f] font-extrabold text-sm">1330</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("SAFETY");
                showToast(lang === "en" ? "Showing Emergency & Safety Guides." : "안전·긴급 가이드 항목이 표시됩니다.");
              }}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl text-center shadow-xs transition-colors cursor-pointer block"
            >
              {dict.guideSection?.emergencyActionBtn || "상세 행동 요령 보기"}
            </button>
          </div>

          {/* Frequently Asked Questions (Q&A) Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900">
              {dict.guideSection?.faqCardTitle || "자주 찾는 질문 (Q&A)"}
            </h3>

            <div className="space-y-1">
              {K_GUIDE_FAQS.map((faq) => {
                const isOpen = activeFaqId === faq.id;
                return (
                  <div key={faq.id} className="border-b border-slate-100 last:border-0 pb-2 pt-1">
                    <div
                      onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                      className="text-xs text-slate-700 font-semibold py-1.5 flex items-center justify-between hover:text-[#b93829] cursor-pointer transition-colors"
                    >
                      <span className="pr-2">{faq.question[lang]}</span>
                      <span className="text-slate-400 text-sm font-normal">{isOpen ? "▲" : "›"}</span>
                    </div>

                    {isOpen && (
                      <div className="bg-[#faf9f6] p-3 rounded-xl text-xs text-slate-600 leading-relaxed mt-1 animate-in fade-in duration-200">
                        {faq.answer[lang]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => showToast(lang === "en" ? "More Q&As are coming soon." : "추가 Q&A 항목이 보강 중입니다.")}
              className="text-xs font-extrabold text-[#b93829] hover:underline text-center block w-full pt-1 cursor-pointer"
            >
              {dict.guideSection?.faqMoreLink || "더 많은 Q&A 보기"}
            </button>
          </div>
        </div>
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
