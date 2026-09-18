"use client";

import React, { useState } from "react";
import Link from "next/link";
import PresetManagerPanel from "./PresetManagerPanel";
import FoodCatalogPanel from "./FoodCatalogPanel";
import AttractionCatalogPanel from "./AttractionCatalogPanel";
import TourCoursePanel from "./TourCoursePanel";
import GuideManagerPanel from "./GuideManagerPanel";
import SortingConfigModal from "./SortingConfigModal";
import ChangePinModal from "./ChangePinModal";
import { useAdminAuth } from "./AdminAuthGuard";

type AdminTab = "PRESETS" | "FOODS" | "ATTRACTIONS" | "COURSES" | "GUIDES";

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("PRESETS");
  const [isSortingModalOpen, setIsSortingModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportToCode = async () => {
    if (!confirm("현재 관리자 대시보드에 설정된 프리셋 데이터를 소스코드 파일(travel-presets.ts)로 영구 반영하시겠습니까?")) return;

    setIsExporting(true);
    setExportNotice(null);
    try {
      const res = await fetch("/api/admin/export", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setExportNotice(`성공적으로 소스코드에 영구 반영되었습니다! (총 ${data.totalPresets}개 프리셋 직렬화 완료)`);
      } else {
        alert(`Export 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="admin-theme min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-700 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white drop-shadow-sm">HypeHeritage</span>
              <span className="rounded-md bg-indigo-500/25 border border-indigo-400/50 px-2 py-0.5 text-[11px] font-extrabold text-indigo-300">
                ADMIN CONSOLE
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 px-3 py-1 text-[11px] font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>원격 클라우드 DB 실시간 동기화 (저장 즉시 실제 웹 반영)</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-100 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🔑</span> PIN 변경
            </button>

            <button
              type="button"
              onClick={() => setIsSortingModalOpen(true)}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-100 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>⚙️</span> 정렬 규칙 설정
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportToCode}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>💾</span>
              <span>{isExporting ? "소스코드 반영 중..." : "소스코드 영구 반영 (Export)"}</span>
            </button>

            <Link
              href="/ko/planner"
              target="_blank"
              className="rounded-xl border border-indigo-400/50 bg-indigo-600/30 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-600/40 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>플래너 미리보기</span>
              <span>↗</span>
            </Link>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25 hover:text-rose-200 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-700/80">
          {[
            { id: "PRESETS", label: "🗺️ 프리셋 관리 (Presets)", desc: "5대 프리셋 및 커스텀 조립" },
            { id: "FOODS", label: "🍲 음식 카탈로그 (Food)", desc: "도시별 단가 & 노출 대상" },
            { id: "ATTRACTIONS", label: "🏛️ 관광지 명소 (Attractions)", desc: "입장료 & K-스팟 매핑" },
            { id: "COURSES", label: "🧭 투어 코스 (Courses)", desc: "도시별 스팟 바인딩" },
            { id: "GUIDES", label: "📚 K-가이드 관리 (Guides)", desc: "실전 여행팁 & FAQ CMS" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-indigo-400 text-white bg-indigo-500/20 shadow-sm"
                  : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Export Notice Banner */}
      {exportNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 p-3 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
          <span>✅</span>
          <span>{exportNotice}</span>
          <button
            onClick={() => setExportNotice(null)}
            className="ml-4 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "PRESETS" && <PresetManagerPanel />}
        {activeTab === "FOODS" && <FoodCatalogPanel />}
        {activeTab === "ATTRACTIONS" && <AttractionCatalogPanel />}
        {activeTab === "COURSES" && <TourCoursePanel />}
        {activeTab === "GUIDES" && <GuideManagerPanel />}
      </main>

      {/* Sorting Modal */}
      <SortingConfigModal
        isOpen={isSortingModalOpen}
        onClose={() => setIsSortingModalOpen(false)}
      />

      {/* PIN Change Modal */}
      <ChangePinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
}
