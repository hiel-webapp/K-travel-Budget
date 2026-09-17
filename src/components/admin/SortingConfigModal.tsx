"use client";

import React, { useState, useEffect } from "react";
import { SortingRuleType } from "../../lib/admin/admin-store";
import { ALL_SUPPORTED_CITIES, CITY_KOREAN_NAMES } from "../../lib/trip-domain";

interface SortingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SORTING_OPTIONS: { val: SortingRuleType; label: string; desc: string }[] = [
  { val: "RECOMMENDED", label: "🌟 추천 우선 (Must-Eat & Top Spot)", desc: "외국인 필수 추천 및 인기 핫플을 최우선으로 배치" },
  { val: "CUSTOM_ORDER", label: "🔢 관리자 우선순위 (sortOrder 순)", desc: "관리자가 수동 입력한 sortOrder 숫자 기준 오름차순" },
  { val: "PRICE_ASC", label: "💰 가격 낮은 순 (가성비 우선)", desc: "단가 및 입장료가 저렴한 순서대로 정렬" },
  { val: "PRICE_DESC", label: "💎 가격 높은 순 (프리미엄 우선)", desc: "단가 및 입장료가 높은 순서대로 정렬" },
  { val: "NAME_ASC", label: "🔤 가나다 / 알파벳 순", desc: "한국어 명칭 기준 사전순 정렬" },
  { val: "LATEST", label: "⏱️ 최신 등록 순", desc: "가장 최근에 추가된 아이템부터 역순 배치" },
];

export default function SortingConfigModal({ isOpen, onClose }: SortingConfigModalProps) {
  const [sortingRules, setSortingRules] = useState<Record<string, SortingRuleType>>({});
  const [selectedCity, setSelectedCity] = useState<string>("DEFAULT");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/catalog?type=SORTING")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sortingRules) {
          setSortingRules(data.sortingRules);
        }
      });
  }, [isOpen]);

  const handleSetRule = async (rule: SortingRuleType) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SORTING_RULE",
          city: selectedCity,
          rule,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSortingRules({ ...sortingRules, [selectedCity]: rule });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentRule = sortingRules[selectedCity] || "RECOMMENDED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2 drop-shadow-sm">
              <span>⚙️</span> 도시별 카탈로그 정렬 규칙 설정
            </h3>
            <p className="text-xs text-slate-200 font-medium mt-1">
              플래너 도시 탭 및 K-스팟에 표시되는 음식과 관광지의 기본 노출 순서 규칙을 정의합니다.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white font-bold p-1">✕</button>
        </div>

        {/* City Select */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-200 block mb-2">
            규칙을 적용할 도시 선택
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCity("DEFAULT")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedCity === "DEFAULT"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}
            >
              전체 기본값 (DEFAULT)
            </button>
            {ALL_SUPPORTED_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedCity === c
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {CITY_KOREAN_NAMES[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Rule Options */}
        <div className="space-y-2.5">
          {SORTING_OPTIONS.map((opt) => {
            const isSelected = currentRule === opt.val;
            return (
              <div
                key={opt.val}
                onClick={() => handleSetRule(opt.val)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-indigo-400 bg-indigo-500/25 text-white shadow-md"
                    : "border-slate-700 bg-slate-800/90 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{opt.label}</span>
                  <input
                    type="radio"
                    name="sorting_rule"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-indigo-500"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-300 mt-1">{opt.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
