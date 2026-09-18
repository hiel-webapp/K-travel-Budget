"use client";

import React, { useState, useEffect } from "react";
import { GuideItem } from "../../lib/static-contents";

interface GuideEditorModalProps {
  isOpen: boolean;
  guideKo: GuideItem | null;
  guideEn: GuideItem | null;
  onClose: () => void;
  onSave: (savedKo: GuideItem, savedEn: GuideItem) => void;
}

const CATEGORIES = [
  { key: "DINING", labelKo: "식당·음식", labelEn: "Dining & Food" },
  { key: "TRANSIT", labelKo: "교통·공항", labelEn: "Transit & Airport" },
  { key: "PAYMENT", labelKo: "결제·환승", labelEn: "Payment & Cards" },
  { key: "STAY", labelKo: "숙소·체크인", labelEn: "Stay & Lodging" },
  { key: "SHOPPING", labelKo: "쇼핑·텍스리펀", labelEn: "Shopping & Tax Refund" },
  { key: "COMMUNICATION", labelKo: "소통·인터넷", labelEn: "SIM & Communication" },
  { key: "SAFETY", labelKo: "안전·긴급", labelEn: "Safety & Emergency" },
];

const SUB_TAG_TYPES = [
  { key: "ESSENTIAL", label: "여행 전 필수 (Essential)" },
  { key: "TRANSIT", label: "교통 이동 (Transit)" },
  { key: "CULTURE", label: "문화 에티켓 (Culture)" },
  { key: "SHOPPING", label: "쇼핑 노하우 (Shopping)" },
  { key: "EMERGENCY", label: "안전/긴급 (Emergency)" },
];

export default function GuideEditorModal({
  isOpen,
  guideKo,
  guideEn,
  onClose,
  onSave,
}: GuideEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"BASIC" | "CHECKLIST" | "DETAILS" | "PREVIEW">("BASIC");

  // 메타 정보
  const [id, setId] = useState("");
  const [category, setCategory] = useState("DINING");
  const [categoryLabelKo, setCategoryLabelKo] = useState("식당·음식");
  const [categoryLabelEn, setCategoryLabelEn] = useState("Dining & Food");
  const [subTagType, setSubTagType] = useState<"ESSENTIAL" | "BASIC" | "TRANSIT" | "CULTURE" | "SHOPPING" | "EMERGENCY">("ESSENTIAL");
  const [subTagKo, setSubTagKo] = useState("");
  const [subTagEn, setSubTagEn] = useState("");
  const [readTimeKo, setReadTimeKo] = useState("3분 읽기");
  const [readTimeEn, setReadTimeEn] = useState("3 min read");
  const [updatedDateKo, setUpdatedDateKo] = useState("2026년 9월");
  const [updatedDateEn, setUpdatedDateEn] = useState("Sep 2026");
  const [imageUrl, setImageUrl] = useState("");
  const [isHero, setIsHero] = useState(false);

  // 텍스트 콘텐츠 (한/영)
  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [overviewKo, setOverviewKo] = useState("");
  const [overviewEn, setOverviewEn] = useState("");
  const [noticeKo, setNoticeKo] = useState("");
  const [noticeEn, setNoticeEn] = useState("");

  // 체크리스트
  const [checklistKo, setChecklistKo] = useState<string[]>([]);
  const [newChecklistInputKo, setNewChecklistInputKo] = useState("");

  // 본문 문단 (단락별)
  const [detailsKo, setDetailsKo] = useState<string[]>([""]);
  const [detailsEn, setDetailsEn] = useState<string[]>([""]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (guideKo) {
      setId(guideKo.id);
      setCategory(guideKo.category || "DINING");
      setCategoryLabelKo(guideKo.categoryLabel?.ko || "식당·음식");
      setCategoryLabelEn(guideKo.categoryLabel?.en || "Dining & Food");
      setSubTagType(guideKo.subTagType || "ESSENTIAL");
      setSubTagKo(guideKo.subTag?.ko || "");
      setSubTagEn(guideKo.subTag?.en || "");
      setReadTimeKo(guideKo.readTime || "3분 읽기");
      setReadTimeEn(guideEn?.readTime || "3 min read");
      setUpdatedDateKo(guideKo.updatedDate || "2026년 9월");
      setUpdatedDateEn(guideEn?.updatedDate || "Sep 2026");
      setImageUrl(guideKo.imageUrl || "");
      setIsHero(guideKo.isHero || false);

      setTitleKo(guideKo.title || "");
      setTitleEn(guideEn?.title || "");
      setOverviewKo(guideKo.overview || "");
      setOverviewEn(guideEn?.overview || "");
      setNoticeKo(guideKo.officialChannelNotice || "");
      setNoticeEn(guideEn?.officialChannelNotice || "");

      setChecklistKo(guideKo.checklist || []);
      setDetailsKo(guideKo.details && guideKo.details.length > 0 ? [...guideKo.details] : [""]);
      setDetailsEn(guideEn?.details && guideEn.details.length > 0 ? [...guideEn.details] : [""]);
    } else {
      setId(`guide-${Date.now()}`);
      setCategory("DINING");
      setCategoryLabelKo("식당·음식");
      setCategoryLabelEn("Dining & Food");
      setSubTagType("ESSENTIAL");
      setSubTagKo("여행 전 필수");
      setSubTagEn("Essential");
      setReadTimeKo("3분 읽기");
      setReadTimeEn("3 min read");
      setUpdatedDateKo("2026년 9월");
      setUpdatedDateEn("Sep 2026");
      setImageUrl("https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=800&auto=format&fit=crop");
      setIsHero(false);

      setTitleKo("");
      setTitleEn("");
      setOverviewKo("");
      setOverviewEn("");
      setNoticeKo("");
      setNoticeEn("");
      setChecklistKo(["체크포인트 1", "체크포인트 2"]);
      setDetailsKo(["첫 번째 안내 단락을 입력하세요."]);
      setDetailsEn(["Enter the first paragraph in English."]);
    }
    setActiveTab("BASIC");
  }, [guideKo, guideEn, isOpen]);

  if (!isOpen) return null;

  const handleCategorySelect = (catKey: string) => {
    setCategory(catKey);
    const matched = CATEGORIES.find((c) => c.key === catKey);
    if (matched) {
      setCategoryLabelKo(matched.labelKo);
      setCategoryLabelEn(matched.labelEn);
    }
  };

  const handleAddChecklist = () => {
    if (!newChecklistInputKo.trim()) return;
    setChecklistKo([...checklistKo, newChecklistInputKo.trim()]);
    setNewChecklistInputKo("");
  };

  const handleRemoveChecklist = (idx: number) => {
    setChecklistKo(checklistKo.filter((_, i) => i !== idx));
  };

  const handleAddParagraph = () => {
    setDetailsKo([...detailsKo, ""]);
    setDetailsEn([...detailsEn, ""]);
  };

  const handleRemoveParagraph = (idx: number) => {
    if (detailsKo.length <= 1) return;
    setDetailsKo(detailsKo.filter((_, i) => i !== idx));
    setDetailsEn(detailsEn.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleKo.trim()) {
      alert("한국어 제목을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    const safeId = id.trim() || `guide-${Date.now()}`;
    const cleanDetailsKo = detailsKo.filter((d) => d.trim().length > 0);
    const cleanDetailsEn = detailsEn.filter((d) => d.trim().length > 0);

    const newGuideKo: GuideItem = {
      id: safeId,
      title: titleKo.trim(),
      category,
      categoryLabel: { ko: categoryLabelKo, en: categoryLabelEn },
      subTag: { ko: subTagKo.trim() || "필수", en: subTagEn.trim() || "Essential" },
      subTagType,
      readTime: readTimeKo,
      updatedDate: updatedDateKo,
      overview: overviewKo.trim(),
      checklist: checklistKo,
      details: cleanDetailsKo.length > 0 ? cleanDetailsKo : [overviewKo.trim()],
      imageUrl: imageUrl.trim() || undefined,
      isHero,
      officialChannelNotice: noticeKo.trim() || undefined,
    };

    const newGuideEn: GuideItem = {
      id: safeId,
      title: titleEn.trim() || titleKo.trim(),
      category,
      categoryLabel: { ko: categoryLabelKo, en: categoryLabelEn },
      subTag: { ko: subTagKo.trim() || "필수", en: subTagEn.trim() || "Essential" },
      subTagType,
      readTime: readTimeEn,
      updatedDate: updatedDateEn,
      overview: overviewEn.trim() || overviewKo.trim(),
      checklist: checklistKo,
      details: cleanDetailsEn.length > 0 ? cleanDetailsEn : cleanDetailsKo,
      imageUrl: imageUrl.trim() || undefined,
      isHero,
      officialChannelNotice: noticeEn.trim() || noticeKo.trim() || undefined,
    };

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GUIDE",
          data: {
            ko: newGuideKo,
            en: newGuideEn,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSave(newGuideKo, newGuideEn);
        onClose();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {guideKo ? "K-가이드 아티클 수정" : "새 K-가이드 아티클 등록"}
                </h3>
                {isHero && (
                  <span className="bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ★ 히어로 가이드
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">외국인 방한 여행자를 위한 실전 가이드 CMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2">
          {[
            { id: "BASIC", label: "1. 기본 정보 & 메타" },
            { id: "CHECKLIST", label: "2. 체크리스트" },
            { id: "DETAILS", label: "3. 본문 단락 에디터" },
            { id: "PREVIEW", label: "4. 실시간 미리보기" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-teal-400 text-teal-300 bg-teal-500/10"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: 기본 정보 & 메타 */}
          {activeTab === "BASIC" && (
            <div className="space-y-4">
              {/* ID & 히어로 토글 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">아티클 고유 ID</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    disabled={!!guideKo}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono disabled:opacity-50"
                    placeholder="예: dining-etiquette"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">상단 히어로 지정</label>
                  <button
                    type="button"
                    onClick={() => setIsHero(!isHero)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isHero
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm"
                        : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span>{isHero ? "★ 대표 히어로 지정됨" : "☆ 일반 가이드"}</span>
                  </button>
                </div>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">카테고리 분류 (7대 카테고리)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleCategorySelect(cat.key)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        category === cat.key
                          ? "bg-teal-500/20 border-teal-400 text-teal-300 shadow-sm"
                          : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span>{cat.labelKo}</span>
                      <span className="text-[10px] opacity-70">{cat.key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 서브태그 유형 & 텍스트 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">서브태그 유형 (뱃지 스타일)</label>
                  <select
                    value={subTagType}
                    onChange={(e: any) => setSubTagType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {SUB_TAG_TYPES.map((st) => (
                      <option key={st.key} value={st.key}>{st.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">서브태그 문구 (한국어)</label>
                  <input
                    type="text"
                    value={subTagKo}
                    onChange={(e) => setSubTagKo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="예: 여행 전 필수"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-300 mb-1">Subtag (English)</label>
                  <input
                    type="text"
                    value={subTagEn}
                    onChange={(e) => setSubTagEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="e.g. Essential"
                  />
                </div>
              </div>

              {/* 제목 (한/영) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">가이드 제목 (한국어) *</label>
                  <input
                    type="text"
                    value={titleKo}
                    onChange={(e) => setTitleKo(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    placeholder="한국 식당에서 당황하지 않는 기본 이용법"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-300 mb-1">Guide Title (English)</label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    placeholder="Dining Etiquette & Restaurant Guide in Korea"
                  />
                </div>
              </div>

              {/* 개요 (한/영) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">요약 개요 (한국어) *</label>
                  <textarea
                    rows={3}
                    value={overviewKo}
                    onChange={(e) => setOverviewKo(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed resize-none"
                    placeholder="직원을 부르는 방법, 기본 반찬, 추가 주문 등 주요 상황을 요약합니다."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-300 mb-1">Overview (English)</label>
                  <textarea
                    rows={3}
                    value={overviewEn}
                    onChange={(e) => setOverviewEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed resize-none"
                    placeholder="How to call staff, side dishes, ordering, and payment policies."
                  />
                </div>
              </div>

              {/* 이미지 URL & 소요 시간 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">대표 실사 이미지 URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">읽기 소요 시간</label>
                  <input
                    type="text"
                    value={readTimeKo}
                    onChange={(e) => setReadTimeKo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="예: 3분 읽기"
                  />
                </div>
              </div>

              {/* 공식 채널 안내문구 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">공식 채널 안내 (한국어, 선택)</label>
                  <input
                    type="text"
                    value={noticeKo}
                    onChange={(e) => setNoticeKo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="실시간 시간표는 코버스 공식 사이트에서 확인 가능합니다."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Official Notice (English, Optional)</label>
                  <input
                    type="text"
                    value={noticeEn}
                    onChange={(e) => setNoticeEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Please check real-time schedules via official website."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 체크리스트 */}
          {activeTab === "CHECKLIST" && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <span>✓</span>
                  <span>핵심 체크포인트 관리 (Checklist)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  가이드 상단 체크리스트 박스에 노출되는 3~4가지 핵심 요약 태그입니다.
                </p>

                {/* 입력 및 추가 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistInputKo}
                    onChange={(e) => setNewChecklistInputKo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklist();
                      }
                    }}
                    placeholder="새 체크포인트 입력 (예: 테이블 호출벨 확인)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklist}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    + 항목 추가
                  </button>
                </div>

                {/* 태그 목록 */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {checklistKo.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-200"
                    >
                      <span className="text-teal-400">✓</span>
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklist(idx)}
                        className="text-slate-400 hover:text-rose-400 ml-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {checklistKo.length === 0 && (
                    <span className="text-xs text-slate-500 italic">등록된 체크포인트가 없습니다.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 본문 단락 에디터 */}
          {activeTab === "DETAILS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">단계별 본문 문단 블록</h4>
                  <p className="text-xs text-slate-400">문단 단위로 내용을 구조화하여 가독성을 극대화합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddParagraph}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>+ 문단 추가</span>
                </button>
              </div>

              <div className="space-y-4">
                {detailsKo.map((_, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800/80 pb-2">
                      <span className="text-teal-400">단락 #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        {detailsKo.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParagraph(idx)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                          >
                            문단 삭제
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-400/90 mb-1">
                          한국어 문단 내용
                        </label>
                        <textarea
                          rows={3}
                          value={detailsKo[idx] || ""}
                          onChange={(e) => {
                            const next = [...detailsKo];
                            next[idx] = e.target.value;
                            setDetailsKo(next);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white leading-relaxed resize-none"
                          placeholder="해당 단락의 상세 설명을 입력하세요."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-300/90 mb-1">
                          English Paragraph Content
                        </label>
                        <textarea
                          rows={3}
                          value={detailsEn[idx] || ""}
                          onChange={(e) => {
                            const next = [...detailsEn];
                            next[idx] = e.target.value;
                            setDetailsEn(next);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white leading-relaxed resize-none"
                          placeholder="Enter English description for this block."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 실시간 미리보기 */}
          {activeTab === "PREVIEW" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400">실제 사용자 가이드 카드 뷰</span>
              <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 overflow-hidden shadow-xl max-w-xl mx-auto">
                {imageUrl && (
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img src={imageUrl} alt={titleKo} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-white">
                        {categoryLabelKo}
                      </span>
                      {subTagKo && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-600/90 text-white">
                          {subTagKo}
                        </span>
                      )}
                    </div>
                    {isHero && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-amber-500 text-slate-950">
                        ★ HERO
                      </span>
                    )}
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{readTimeKo}</span>
                    <span>{updatedDateKo}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{titleKo || "제목 미입력"}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{overviewKo || "요약 개요가 표시됩니다."}</p>

                  {checklistKo.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">핵심 체크포인트:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {checklistKo.map((c, i) => (
                          <span key={i} className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-teal-700 font-medium">
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-800">본문 문단 ({detailsKo.length}개):</span>
                    {detailsKo.slice(0, 2).map((d, i) => (
                      <p key={i} className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg">
                        {d || "단락 내용 없음"}
                      </p>
                    ))}
                    {detailsKo.length > 2 && (
                      <span className="text-[11px] text-slate-400 block">+ 외 {detailsKo.length - 2}개 문단...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between sticky bottom-0 z-20">
          <div className="text-xs text-slate-400">
            {isHero ? "★ 히어로 가이드로 설정됩니다." : "일반 가이드로 등록됩니다."}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 transition-colors shadow-lg shadow-teal-600/20 cursor-pointer"
            >
              {isSaving ? "저장 중..." : "가이드 아티클 저장하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
