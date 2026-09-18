"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GuideCard, GuideCategory, GUIDE_CATEGORIES } from "src/data/guide-cards";
import { GuideFAQ } from "../../lib/static-contents";
import GuideEditorModal from "./GuideEditorModal";
import FaqEditorModal from "./FaqEditorModal";

type GuideSubTab = "CARDS" | "FAQS";

export default function GuideManagerPanel() {
  const [subTab, setSubTab] = useState<GuideSubTab>("CARDS");

  // GuideCards state
  const [guideCards, setGuideCards] = useState<GuideCard[]>([]);
  const [faqs, setFaqs] = useState<GuideFAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<"all" | GuideCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<GuideCard | null>(null);

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<GuideFAQ | null>(null);

  const fetchGuideData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/catalog?type=ALL");
      const data = await res.json();
      if (data.success) {
        setGuideCards(data.guideCards || []);
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

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return guideCards.filter((card) => {
      if (selectedCategory !== "all" && card.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitleKo = card.titleKo.toLowerCase().includes(q);
        const matchTitleEn = card.titleEn.toLowerCase().includes(q);
        const matchSummaryKo = card.summaryKo?.toLowerCase().includes(q);
        const matchSummaryEn = card.summaryEn?.toLowerCase().includes(q);
        const matchId = card.id.toLowerCase().includes(q);
        if (!matchTitleKo && !matchTitleEn && !matchSummaryKo && !matchSummaryEn && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [guideCards, selectedCategory, searchQuery]);

  // Handle Delete Card
  const handleDeleteCard = async (id: string, titleKo: string) => {
    if (!confirm(`'${titleKo}' (${id}) 가이드 카드를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/catalog?type=GUIDE_CARD&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setGuideCards((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(`삭제 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (err: any) {
      alert(`삭제 오류: ${err.message}`);
    }
  };

  // Reset to default 16 cards
  const handleResetCards = async () => {
    if (!confirm("기본 16개 가이드 카드 프리셋으로 초기화하시겠습니까? 기존 변경사항이 덮어씌워질 수 있습니다.")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "RESET_GUIDE_CARDS" }),
      });
      const data = await res.json();
      if (data.success && data.guideCards) {
        setGuideCards(data.guideCards);
        alert("기본 16개 가이드 카드로 복원되었습니다.");
      }
    } catch (err: any) {
      alert(`초기화 오류: ${err.message}`);
    }
  };

  // Handle Save Callback
  const handleSaveCard = (savedCard: GuideCard) => {
    setGuideCards((prev) => {
      const idx = prev.findIndex((c) => c.id === savedCard.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedCard;
        return next;
      }
      return [savedCard, ...prev];
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce8e6] border border-[#f8c9c4] text-[#b93829] text-xs font-extrabold mb-2">
            <span>K-Guide Management</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#1d1d1f]">
            K-가이드 실전 카드 덱 관리자
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            외국인 여행자가 겪는 현실적 문제를 해결하는 6대 카테고리 카드 뉴스 및 FAQ를 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setSubTab("CARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              subTab === "CARDS"
                ? "bg-white text-[#b93829] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            실전 가이드 카드 ({guideCards.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("FAQS")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              subTab === "FAQS"
                ? "bg-white text-[#b93829] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            자주 묻는 질문 FAQ ({faqs.length})
          </button>
        </div>
      </div>

      {subTab === "CARDS" ? (
        <div className="space-y-6">
          {/* Controls Bar: Category Filter, Search, and Action Buttons */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID, 카드 제목, 요약문 검색..."
                  className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#b93829]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCards}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                  title="기본 16개 카드로 재설정"
                >
                  기본 카드 복원
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCard(null);
                    setIsGuideModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#b93829] hover:bg-[#a12f22] text-white text-xs font-extrabold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ 새 가이드 카드 추가</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
              {GUIDE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const count =
                  cat.key === "all"
                    ? guideCards.length
                    : guideCards.filter((c) => c.category === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#b93829] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.labelKo}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected ? "bg-white/25 text-white" : "bg-white text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Table / Grid */}
          {isLoading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center">
              <div className="w-8 h-8 mx-auto border-3 border-slate-200 border-t-[#b93829] rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-bold">가이드 카드 데이터를 불러오는 중...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">일치하는 가이드 카드가 없습니다.</p>
              <p className="text-xs text-slate-400">카테고리 필터를 변경하거나 검색어를 비워보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCards.map((card) => {
                const catInfo = GUIDE_CATEGORIES.find((c) => c.key === card.category);
                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Meta badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {catInfo?.icon} {catInfo?.labelKo || card.category}
                          </span>
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#fce8e6] text-[#c5221f] border border-[#f8c9c4]">
                            {card.badge}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                          {card.id}
                        </span>
                      </div>

                      {/* Titles */}
                      <h3 className="text-sm font-extrabold text-[#1d1d1f] leading-snug">
                        {card.titleKo}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 mb-2">
                        {card.titleEn}
                      </p>

                      {/* Summary */}
                      <p className="text-xs text-slate-600 bg-[#faf9f6] p-2.5 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed mb-3">
                        {card.summaryKo}
                      </p>

                      {/* Pro-Tip Preview */}
                      <div className="text-[11px] text-[#7a2015] bg-[#fff8f6] px-3 py-1.5 rounded-lg border border-[#fce3de] flex items-center gap-1.5 mb-3">
                        <span className="text-[#b93829] font-black shrink-0">PRO-TIP:</span>
                        <span className="truncate">{card.proTipKo}</span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        포인트: 한글 {card.detailsKo?.length || 0}개 / 영문 {card.detailsEn?.length || 0}개
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCard(card);
                            setIsGuideModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id, card.titleKo)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* FAQ SubTab */
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#1d1d1f]">자주 묻는 질문 (FAQ) 목록</h3>
            <button
              type="button"
              onClick={() => {
                setEditingFaq(null);
                setIsFaqModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#b93829] hover:bg-[#a12f22] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              + 새 FAQ 추가
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-4 transition"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    FAQ
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">{faq.question.ko}</h4>
                  <p className="text-[11px] text-slate-500">{faq.question.en}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFaq(faq);
                      setIsFaqModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                  >
                    수정
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide Card Editor Modal */}
      <GuideEditorModal
        isOpen={isGuideModalOpen}
        card={editingCard}
        onClose={() => setIsGuideModalOpen(false)}
        onSave={handleSaveCard}
      />

      {/* FAQ Editor Modal */}
      <FaqEditorModal
        isOpen={isFaqModalOpen}
        faq={editingFaq}
        onClose={() => setIsFaqModalOpen(false)}
        onSave={() => fetchGuideData()}
      />
    </div>
  );
}
