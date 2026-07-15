"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { TripDraft } from "src/lib/trip-domain";
import { loadTripDraft } from "src/lib/storage-helper";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import type { Locale } from "src/lib/i18n/locales";

interface PlannerContentProps {
  locale: Locale;
  dict: Dictionary;
}

// useSyncExternalStore용 stable no-op subscribe 및 스냅샷 함수
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function PlannerContent({ locale, dict }: PlannerContentProps) {
  // React 표준 useSyncExternalStore로 Hydration 감지
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isHydrated) {
    // 1. 서버 렌더링 및 최초 Hydration 상태: 단순 뼈대 표시
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">
          {dict.navigation.planner}
        </h2>
        <p className="mt-4 text-sm text-slate-500">...</p>
      </div>
    );
  }

  // 2. Hydration 완료 후: 클라이언트 사이드 동적 콘텐츠 제공
  return <HydratedPlannerContent locale={locale} dict={dict} />;
}

/**
 * 클라이언트 단에서 안전하게 로컬스토리지 데이터를 Lazy 로드하여 렌더링하는 컴포넌트
 */
function HydratedPlannerContent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  // Lazy Initial State를 통해 렌더 시점 동기식으로 단 1회 로컬스토리지를 검사하고 값을 획득합니다.
  const [draft] = useState<TripDraft | null>(() => {
    const hasDraftKey =
      localStorage.getItem("hypeheritage_trip_draft") !== null ||
      localStorage.getItem("k_travel_state") !== null;

    return hasDraftKey ? loadTripDraft() : null;
  });

  // 상태가 없거나 마이그레이션 실패 시 대체 랜딩 복귀 UI 제공
  if (!draft) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm text-center space-y-6">
        <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">
          {dict.navigation.planner}
        </h2>
        <p className="text-sm text-[#ef4444] font-medium leading-relaxed px-2">
          {dict.planner.missingState}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-block h-10 px-6 rounded-xl bg-[#e25c5c] text-white font-bold leading-10 shadow hover:bg-[#d14b4b] transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c]"
        >
          {dict.planner.goBack}
        </Link>
      </div>
    );
  }

  const seoulNights = draft.cityNightAllocations.SEOUL || 0;
  const busanNights = draft.cityNightAllocations.BUSAN || 0;
  
  const getCitiesDisplay = () => {
    if (draft.selectedCities.includes("SEOUL") && draft.selectedCities.includes("BUSAN")) {
      return "Seoul and Busan";
    }
    if (draft.selectedCities.includes("SEOUL")) {
      return "Seoul";
    }
    return "Busan";
  };

  const budgetDisplay = draft.budgetTier.charAt(0) + draft.budgetTier.slice(1).toLowerCase();

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm text-center space-y-6">
      <div>
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[#e25c5c]">
          {dict.planner.title}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#0f172a]">
          {dict.planner.status}
        </h2>
      </div>

      <div className="bg-[#faf9f6] p-6 rounded-xl border border-slate-100 text-left space-y-3">
        <p className="text-sm text-slate-700 leading-relaxed">
          <strong className="text-[#0f172a]">Trip Formula:</strong> I&apos;m planning a {draft.totalNights}-night trip for {draft.adultCount} {draft.adultCount === 1 ? "adult" : "adults"} to {getCitiesDisplay()} with a {budgetDisplay} budget.
        </p>
        <div className="border-t border-slate-200/60 my-2 pt-2 text-xs text-slate-500 space-y-1">
          <p><strong>Nights Allocation:</strong> Seoul ({seoulNights} nights), Busan ({busanNights} nights)</p>
          <p><strong>Target Budget:</strong> ₩{draft.targetBudgetKrw.toLocaleString()}</p>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs text-slate-400">
          {dict.placeholder.notImplemented}
        </p>
      </div>
    </div>
  );
}
