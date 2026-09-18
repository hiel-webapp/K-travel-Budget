"use client";

import React, { useState, useEffect } from "react";
import { GuideCard, GuideCategory, GUIDE_CATEGORIES } from "src/data/guide-cards";
import { GuideCardItem } from "../guide/GuideCardItem";

interface GuideEditorModalProps {
  isOpen: boolean;
  card: GuideCard | null;
  onClose: () => void;
  onSave: (savedCard: GuideCard) => void;
}

const BADGES: { key: GuideCard["badge"]; labelKo: string; labelEn: string }[] = [
  { key: "Fatal Mistake", labelKo: "주의 필수 (Fatal Mistake)", labelEn: "Fatal Mistake" },
  { key: "Money Saver", labelKo: "경비 절약 (Money Saver)", labelEn: "Money Saver" },
  { key: "Must-Know", labelKo: "필수 상식 (Must-Know)", labelEn: "Must-Know" },
  { key: "Local Rule", labelKo: "로컬 룰 (Local Rule)", labelEn: "Local Rule" },
  { key: "Essential", labelKo: "핵심 팁 (Essential)", labelEn: "Essential" },
  { key: "Pro Tip", labelKo: "추천 팁 (Pro Tip)", labelEn: "Pro Tip" },
];

export default function GuideEditorModal({
  isOpen,
  card,
  onClose,
  onSave,
}: GuideEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"KO" | "EN" | "PREVIEW">("KO");

  // Meta
  const [id, setId] = useState("");
  const [category, setCategory] = useState<GuideCategory>("navigation");
  const [badge, setBadge] = useState<GuideCard["badge"]>("Must-Know");

  // Korean
  const [titleKo, setTitleKo] = useState("");
  const [summaryKo, setSummaryKo] = useState("");
  const [detailsKo, setDetailsKo] = useState<string[]>([""]);
  const [proTipKo, setProTipKo] = useState("");

  // English
  const [titleEn, setTitleEn] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [detailsEn, setDetailsEn] = useState<string[]>([""]);
  const [proTipEn, setProTipEn] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setId(card.id || "");
      setCategory(card.category || "navigation");
      setBadge(card.badge || "Must-Know");

      setTitleKo(card.titleKo || "");
      setSummaryKo(card.summaryKo || "");
      setDetailsKo(card.detailsKo && card.detailsKo.length > 0 ? [...card.detailsKo] : [""]);
      setProTipKo(card.proTipKo || "");

      setTitleEn(card.titleEn || "");
      setSummaryEn(card.summaryEn || "");
      setDetailsEn(card.detailsEn && card.detailsEn.length > 0 ? [...card.detailsEn] : [""]);
      setProTipEn(card.proTipEn || "");
    } else {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      setId(`guide_${randomSuffix}`);
      setCategory("navigation");
      setBadge("Must-Know");

      setTitleKo("");
      setSummaryKo("");
      setDetailsKo([""]);
      setProTipKo("");

      setTitleEn("");
      setSummaryEn("");
      setDetailsEn([""]);
      setProTipEn("");
    }
    setActiveTab("KO");
  }, [card, isOpen]);

  if (!isOpen) return null;

  const handleDetailChange = (lang: "ko" | "en", index: number, value: string) => {
    if (lang === "ko") {
      const next = [...detailsKo];
      next[index] = value;
      setDetailsKo(next);
    } else {
      const next = [...detailsEn];
      next[index] = value;
      setDetailsEn(next);
    }
  };

  const handleAddDetail = (lang: "ko" | "en") => {
    if (lang === "ko") {
      setDetailsKo([...detailsKo, ""]);
    } else {
      setDetailsEn([...detailsEn, ""]);
    }
  };

  const handleRemoveDetail = (lang: "ko" | "en", index: number) => {
    if (lang === "ko") {
      if (detailsKo.length <= 1) return;
      setDetailsKo(detailsKo.filter((_, i) => i !== index));
    } else {
      if (detailsEn.length <= 1) return;
      setDetailsEn(detailsEn.filter((_, i) => i !== index));
    }
  };

  const previewCard: GuideCard = {
    id: id || "preview_id",
    category,
    badge,
    titleKo: titleKo || "제목을 입력하세요",
    titleEn: titleEn || "Please enter title",
    summaryKo: summaryKo || "핵심 요약문을 입력하세요.",
    summaryEn: summaryEn || "Please enter summary.",
    detailsKo: detailsKo.filter((d) => d.trim().length > 0),
    detailsEn: detailsEn.filter((d) => d.trim().length > 0),
    proTipKo: proTipKo || "프로 팁을 입력하세요.",
    proTipEn: proTipEn || "Please enter pro-tip.",
  };

  const handleSave = async () => {
    if (!id.trim()) {
      alert("카드 ID를 입력해주세요.");
      return;
    }
    if (!titleKo.trim() && !titleEn.trim()) {
      alert("최소 한 개 이상의 언어로 제목을 입력해주세요.");
      return;
    }

    const cleanedDetailsKo = detailsKo.filter((d) => d.trim().length > 0);
    const cleanedDetailsEn = detailsEn.filter((d) => d.trim().length > 0);

    const targetCard: GuideCard = {
      id: id.trim(),
      category,
      badge,
      titleKo: titleKo.trim() || titleEn.trim(),
      titleEn: titleEn.trim() || titleKo.trim(),
      summaryKo: summaryKo.trim() || summaryEn.trim(),
      summaryEn: summaryEn.trim() || summaryKo.trim(),
      detailsKo: cleanedDetailsKo.length > 0 ? cleanedDetailsKo : ["기본 행동 수칙"],
      detailsEn: cleanedDetailsEn.length > 0 ? cleanedDetailsEn : ["Standard local guidance"],
      proTipKo: proTipKo.trim() || proTipEn.trim() || "현지 수칙 준수",
      proTipEn: proTipEn.trim() || proTipKo.trim() || "Follow local recommendations",
    };

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GUIDE_CARD",
          data: targetCard,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSave(targetCard);
        onClose();
      } else {
        alert(`저장 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (err: any) {
      alert(`네트워크 통신 오류: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              {card ? "K-가이드 카드 수정" : "새 K-가이드 카드 등록"}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              외국인 여행자를 위한 6대 카테고리 반응형 카드 덱 콘텐츠를 편집합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Top Fixed Meta Fields */}
        <div className="px-6 py-4 bg-slate-800/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">카드 고유 식별자 (ID)</label>
            <input
              type="text"
              value={id}
              disabled={!!card}
              onChange={(e) => setId(e.target.value)}
              placeholder="예: nav_google_vs_naver"
              className="w-full text-xs font-mono font-medium px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#b93829] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GuideCategory)}
              className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-[#b93829]"
            >
              {GUIDE_CATEGORIES.filter((c) => c.key !== "all").map((cat) => (
                <option key={cat.key} value={cat.key} className="bg-slate-800 text-white">
                  {cat.icon} {cat.labelKo} ({cat.labelEn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">상태 배지 (Badge)</label>
            <select
              value={badge}
              onChange={(e) => setBadge(e.target.value as GuideCard["badge"])}
              className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-[#b93829]"
            >
              {BADGES.map((b) => (
                <option key={b.key} value={b.key} className="bg-slate-800 text-white">
                  {b.labelKo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="px-6 pt-3 flex border-b border-slate-800 gap-2 bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab("KO")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "KO"
                ? "border-[#b93829] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            한국어 콘텐츠 (Korean)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EN")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "EN"
                ? "border-[#b93829] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            영어 콘텐츠 (English)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PREVIEW")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "PREVIEW"
                ? "border-[#b93829] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            실시간 카드 미리보기
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === "KO" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  한국어 제목 <span className="text-[#b93829]">*</span>
                </label>
                <input
                  type="text"
                  value={titleKo}
                  onChange={(e) => setTitleKo(e.target.value)}
                  placeholder="예: 구글맵 vs 네이버 지도: 한국 길찾기 필수 상식"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#b93829]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  핵심 요약 (한 줄 설명) <span className="text-[#b93829]">*</span>
                </label>
                <textarea
                  rows={2}
                  value={summaryKo}
                  onChange={(e) => setSummaryKo(e.target.value)}
                  placeholder="한국에서는 국가 안보 법령으로 인해 구글 지도의 도보 내비게이션이 작동하지 않습니다."
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#b93829]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-200">
                    상세 행동 수칙 및 핵심 포인트 (불릿 리스트)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddDetail("ko")}
                    className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    + 포인트 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {detailsKo.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-400 w-4 text-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => handleDetailChange("ko", idx, e.target.value)}
                        placeholder={`포인트 ${idx + 1} 내용`}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#b93829]"
                      />
                      {detailsKo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDetail("ko", idx)}
                          className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 cursor-pointer"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  핵심 팁 (PRO-TIP) 하이라이트 박스
                </label>
                <input
                  type="text"
                  value={proTipKo}
                  onChange={(e) => setProTipKo(e.target.value)}
                  placeholder="예: 네이버 지도 앱 언어를 영어로 설정하되, 가고 싶은 장소의 한글 이름을 메모장에 미리 복사해두면 오차 없는 검색이 가능합니다."
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-200 placeholder-amber-500/50 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {activeTab === "EN" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  English Title <span className="text-[#b93829]">*</span>
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Google Maps vs Naver Map: The Navigation Dilemma"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#b93829]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Summary (One-liner) <span className="text-[#b93829]">*</span>
                </label>
                <textarea
                  rows={2}
                  value={summaryEn}
                  onChange={(e) => setSummaryEn(e.target.value)}
                  placeholder="Google Maps walking directions do NOT work accurately in South Korea."
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#b93829]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-200">
                    Key Bullet Points & Survival Guidelines
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddDetail("en")}
                    className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    + Add Point
                  </button>
                </div>
                <div className="space-y-2">
                  {detailsEn.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-400 w-4 text-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => handleDetailChange("en", idx, e.target.value)}
                        placeholder={`Guideline point ${idx + 1}`}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#b93829]"
                      />
                      {detailsEn.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDetail("en", idx)}
                          className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Pro-Tip Highlight Box
                </label>
                <input
                  type="text"
                  value={proTipEn}
                  onChange={(e) => setProTipEn(e.target.value)}
                  placeholder="e.g. Set Naver Map language to English, but keep Korean names handy."
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-200 placeholder-amber-500/50 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {activeTab === "PREVIEW" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    한국어 버전 렌더링 미리보기
                  </h4>
                  <div className="bg-[#faf9f6] p-4 rounded-3xl border border-slate-800">
                    <GuideCardItem card={previewCard} isKo={true} />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    English Version Rendering Preview
                  </h4>
                  <div className="bg-[#faf9f6] p-4 rounded-3xl border border-slate-800">
                    <GuideCardItem card={previewCard} isKo={false} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
          >
            취소
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-[#b93829] hover:bg-[#a12f22] text-xs font-extrabold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "가이드 카드 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
