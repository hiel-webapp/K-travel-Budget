"use client";

import React, { useState, useEffect } from "react";
import { GuideFAQ } from "../../lib/static-contents";

interface FaqEditorModalProps {
  isOpen: boolean;
  faq: GuideFAQ | null;
  onClose: () => void;
  onSave: (saved: GuideFAQ) => void;
}

export default function FaqEditorModal({
  isOpen,
  faq,
  onClose,
  onSave,
}: FaqEditorModalProps) {
  const [id, setId] = useState("");
  const [questionKo, setQuestionKo] = useState("");
  const [questionEn, setQuestionEn] = useState("");
  const [answerKo, setAnswerKo] = useState("");
  const [answerEn, setAnswerEn] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (faq) {
      setId(faq.id);
      setQuestionKo(faq.question.ko || "");
      setQuestionEn(faq.question.en || "");
      setAnswerKo(faq.answer.ko || "");
      setAnswerEn(faq.answer.en || "");
    } else {
      setId(`faq-${Date.now()}`);
      setQuestionKo("");
      setQuestionEn("");
      setAnswerKo("");
      setAnswerEn("");
    }
  }, [faq, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionKo.trim()) {
      alert("한국어 질문을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    const updatedFaq: GuideFAQ = {
      id: id.trim() || `faq-${Date.now()}`,
      question: {
        ko: questionKo.trim(),
        en: questionEn.trim() || questionKo.trim(),
      },
      answer: {
        ko: answerKo.trim(),
        en: answerEn.trim() || answerKo.trim(),
      },
    };

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FAQ",
          data: updatedFaq,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSave(updatedFaq);
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
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">❓</span>
            <div>
              <h3 className="text-base font-bold text-white">
                {faq ? "자주 묻는 질문(FAQ) 수정" : "새 FAQ 등록"}
              </h3>
              <p className="text-xs text-slate-400">외국인 여행자가 자주 묻는 질문과 공식 답변</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* FAQ 식별자 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">FAQ 고유 ID</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={!!faq}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white disabled:opacity-50 font-mono"
              placeholder="예: faq-restaurant-call-server"
            />
          </div>

          {/* 질문 (한/영) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">
                질문 (한국어) *
              </label>
              <input
                type="text"
                value={questionKo}
                onChange={(e) => setQuestionKo(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                placeholder="식당에서 직원을 어떻게 부르나요?"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-300 mb-1">
                Question (English)
              </label>
              <input
                type="text"
                value={questionEn}
                onChange={(e) => setQuestionEn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                placeholder="How do I call a server at a restaurant?"
              />
            </div>
          </div>

          {/* 답변 (한/영) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">
                답변 (한국어) *
              </label>
              <textarea
                rows={5}
                value={answerKo}
                onChange={(e) => setAnswerKo(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed resize-none"
                placeholder="테이블에 호출벨이 있다면 눌러주세요. 벨이 없다면 손을 가볍게 들며 '저기요'라고 부르시면 됩니다."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-300 mb-1">
                Answer (English)
              </label>
              <textarea
                rows={5}
                value={answerEn}
                onChange={(e) => setAnswerEn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed resize-none"
                placeholder="Press the table call button if available. If not, raise your hand slightly and say 'Jeogiyo'."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-md"
            >
              {isSaving ? "저장 중..." : "FAQ 저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
