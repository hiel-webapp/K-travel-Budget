"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GuideItem, GuideFAQ } from "../../lib/static-contents";
import GuideEditorModal from "./GuideEditorModal";
import FaqEditorModal from "./FaqEditorModal";

type GuideSubTab = "ARTICLES" | "FAQS";

const CATEGORIES = [
  { key: "ALL", label: "전체" },
  { key: "DINING", label: "식당·음식" },
  { key: "TRANSIT", label: "교통·공항" },
  { key: "PAYMENT", label: "결제·환승" },
  { key: "STAY", label: "숙소" },
  { key: "SHOPPING", label: "쇼핑" },
  { key: "COMMUNICATION", label: "소통·인터넷" },
  { key: "SAFETY", label: "안전·긴급" },
];

export default function GuideManagerPanel() {
  const [subTab, setSubTab] = useState<GuideSubTab>("ARTICLES");

  const [guidesKo, setGuidesKo] = useState<GuideItem[]>([]);
  const [guidesEn, setGuidesEn] = useState<GuideItem[]>([]);
  const [faqs, setFaqs] = useState<GuideFAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Guide Modal
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [editingGuideKo, setEditingGuideKo] = useState<GuideItem | null>(null);
  const [editingGuideEn, setEditingGuideEn] = useState<GuideItem | null>(null);

  // FAQ Modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<GuideFAQ | null>(null);

  const fetchGuideData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/catalog?type=ALL");
      const data = await res.json();
      if (data.success) {
        setGuidesKo(data.guidesKo || []);
        setGuidesEn(data.guidesEn || []);
        setFaqs(data.faqs || []);
      }
    } catch (err) {
      console.error("Failed to fetch guide data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuideData();
  }, []);

  // Filtered Articles
  const filteredGuides = useMemo(() => {
    return guidesKo.filter((g) => {
      if (selectedCategory !== "ALL" && g.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchOverview = g.overview.toLowerCase().includes(q);
        if (!matchTitle && !matchOverview) return false;
      }
      return true;
    });
  }, [guidesKo, selectedCategory, searchQuery]);

  // Current Hero Guide
  const heroGuide = useMemo(() => {
    return guidesKo.find((g) => g.isHero) || null;
  }, [guidesKo]);

  // Set Hero Guide
  const handleSetHero = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GUIDE_HERO",
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGuidesKo(guidesKo.map((g) => ({ ...g, isHero: g.id === id })));
        setGuidesEn(guidesEn.map((g) => ({ ...g, isHero: g.id === id })));
      } else {
        alert(`히어로 설정 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  // Open Guide Add
  const handleOpenAddGuide = () => {
    setEditingGuideKo(null);
    setEditingGuideEn(null);
    setIsGuideModalOpen(true);
  };

  // Open Guide Edit
  const handleOpenEditGuide = (guide: GuideItem) => {
    const en = guidesEn.find((g) => g.id === guide.id) || null;
    setEditingGuideKo(guide);
    setEditingGuideEn(en);
    setIsGuideModalOpen(true);
  };

  // Delete Guide
  const handleDeleteGuide = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`'${title}' 가이드를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/catalog?type=GUIDE&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setGuidesKo(guidesKo.filter((g) => g.id !== id));
        setGuidesEn(guidesEn.filter((g) => g.id !== id));
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  // Save Guide Callback
  const handleSaveGuideCallback = (savedKo: GuideItem, savedEn: GuideItem) => {
    // Ko 갱신
    const koIdx = guidesKo.findIndex((g) => g.id === savedKo.id);
    if (koIdx >= 0) {
      const nextKo = [...guidesKo];
      nextKo[koIdx] = savedKo;
      setGuidesKo(nextKo);
    } else {
      setGuidesKo([...guidesKo, savedKo]);
    }

    // En 갱신
    const enIdx = guidesEn.findIndex((g) => g.id === savedEn.id);
    if (enIdx >= 0) {
      const nextEn = [...guidesEn];
      nextEn[enIdx] = savedEn;
      setGuidesEn(nextEn);
    } else {
      setGuidesEn([...guidesEn, savedEn]);
    }
  };

  // Open FAQ Add
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setIsFaqModalOpen(true);
  };

  // Open FAQ Edit
  const handleOpenEditFaq = (faq: GuideFAQ) => {
    setEditingFaq(faq);
    setIsFaqModalOpen(true);
  };

  // Delete FAQ
  const handleDeleteFaq = async (id: string, q: string) => {
    if (!confirm(`'${q}' 질문을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/catalog?type=FAQ&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(faqs.filter((f) => f.id !== id));
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  // Save FAQ Callback
  const handleSaveFaqCallback = (saved: GuideFAQ) => {
    const idx = faqs.findIndex((f) => f.id === saved.id);
    if (idx >= 0) {
      const next = [...faqs];
      next[idx] = saved;
      setFaqs(next);
    } else {
      setFaqs([...faqs, saved]);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">K-가이드 관리 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Sub Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">📚 K-가이드 실전 여행 팁 관리</h2>
            <span className="bg-teal-500/20 border border-teal-400/50 text-teal-300 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
              총 {guidesKo.length}개 아티클 / FAQ {faqs.length}개
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            식당 에티켓, 공항철도(AREX), 대중교통 환승, 텍스리펀 등 방한 외국인을 위한 실전 가이드 CMS
          </p>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab("ARTICLES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "ARTICLES"
                ? "bg-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📖 가이드 아티클 ({guidesKo.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("FAQS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "FAQS"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ❓ 자주 묻는 질문 FAQ ({faqs.length})
          </button>
        </div>
      </div>

      {/* ================= SECTION A: ARTICLES ================= */}
      {subTab === "ARTICLES" && (
        <div className="space-y-5">
          {/* Hero Guide Banner Information */}
          {heroGuide && (
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                      현재 대표 히어로 가이드
                    </span>
                    <span className="text-xs font-bold text-white">{heroGuide.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{heroGuide.overview}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEditGuide(heroGuide)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-400/30 transition-colors shrink-0 cursor-pointer"
              >
                히어로 수정
              </button>
            </div>
          )}

          {/* Filter Bar & Add Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Category Chips */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.key
                      ? "bg-teal-500 text-slate-950 shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search & Add Action */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 키워드 검색..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 w-44 sm:w-56"
              />
              <button
                type="button"
                onClick={handleOpenAddGuide}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 whitespace-nowrap cursor-pointer"
              >
                + 새 가이드 등록
              </button>
            </div>
          </div>

          {/* Guide Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuides.map((guide) => {
              const isCurrentHero = guide.isHero;
              return (
                <div
                  key={guide.id}
                  onClick={() => handleOpenEditGuide(guide)}
                  className={`group bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:shadow-xl cursor-pointer ${
                    isCurrentHero
                      ? "border-amber-400/80 ring-1 ring-amber-400/50"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Card Thumbnail */}
                  <div className="relative h-40 w-full bg-slate-950 overflow-hidden">
                    {guide.imageUrl ? (
                      <img
                        src={guide.imageUrl}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl font-bold bg-slate-950">
                        HH
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30 pointer-events-none" />

                    {/* Category & Subtag */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md border border-white/20 text-white">
                        {guide.categoryLabel?.ko || guide.category}
                      </span>
                      {guide.subTag?.ko && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600/90 text-white shadow-xs">
                          {guide.subTag.ko}
                        </span>
                      )}
                    </div>

                    {/* Hero Badge */}
                    {isCurrentHero && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-md">
                        ★ HERO
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{guide.readTime || "3분 읽기"}</span>
                        <span>{guide.updatedDate || "최신"}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1 group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {guide.overview}
                      </p>
                    </div>

                    {/* Checklist info if available */}
                    {guide.checklist && guide.checklist.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-teal-400/90 font-medium">
                        <span>✓ 체크포인트 {guide.checklist.length}개</span>
                        <span className="text-slate-600">·</span>
                        <span>본문 {guide.details?.length || 1}단락</span>
                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleSetHero(guide.id, e)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                          isCurrentHero
                            ? "border-amber-400 text-amber-300 bg-amber-400/10"
                            : "border-slate-700 text-slate-400 hover:border-amber-400 hover:text-amber-300"
                        }`}
                      >
                        {isCurrentHero ? "★ 히어로 활성" : "☆ 히어로 지정"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditGuide(guide);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteGuide(guide.id, guide.title, e)}
                          className="px-2 py-1 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGuides.length === 0 && (
            <div className="py-16 text-center text-slate-500 space-y-2 bg-slate-900 rounded-3xl border border-slate-800">
              <span className="text-2xl">🔍</span>
              <p className="text-xs">조건에 해당하는 가이드 아티클이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION B: FAQS ================= */}
      {subTab === "FAQS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">외국인 여행자 필수 FAQ 목록</h3>
              <p className="text-xs text-slate-400">자주 묻는 질문 8~10선 및 실시간 답변 관리</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddFaq}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              + 새 FAQ 등록
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                      Q{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{faq.question.ko}</h4>
                      <p className="text-xs text-slate-400 font-medium">{faq.question.en}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditFaq(faq)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id, faq.question.ko)}
                      className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300 leading-relaxed">
                  <p className="text-slate-200">{faq.answer.ko}</p>
                  <p className="text-slate-400 text-[11.5px] border-t border-slate-800/60 pt-1.5">{faq.answer.en}</p>
                </div>
              </div>
            ))}
          </div>

          {faqs.length === 0 && (
            <div className="py-16 text-center text-slate-500 space-y-2 bg-slate-900 rounded-3xl border border-slate-800">
              <span className="text-2xl">❓</span>
              <p className="text-xs">등록된 FAQ가 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* Guide Editor Modal */}
      <GuideEditorModal
        isOpen={isGuideModalOpen}
        guideKo={editingGuideKo}
        guideEn={editingGuideEn}
        onClose={() => setIsGuideModalOpen(false)}
        onSave={handleSaveGuideCallback}
      />

      {/* FAQ Editor Modal */}
      <FaqEditorModal
        isOpen={isFaqModalOpen}
        faq={editingFaq}
        onClose={() => setIsFaqModalOpen(false)}
        onSave={handleSaveFaqCallback}
      />
    </div>
  );
}
