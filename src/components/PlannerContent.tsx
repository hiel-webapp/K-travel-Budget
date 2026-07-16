"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { TripDraft, validateTripDraft } from "../lib/trip-domain";
import { loadTripDraft } from "../lib/storage-helper";
import { BudgetPlan, BudgetLineItem, BudgetCategory } from "../features/budget/domain/types";
import { generateInitialBudgetPlan } from "../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";
import {
  formatKrw,
  formatPercentage,
  formatTripDuration,
  formatTravelerCount,
  formatCityAllocationSummary,
  getCategoryLabel,
  getBasketLabel,
  getCalculationExpression,
  getCombinedTransportSubtotal,
} from "../features/budget/presentation/formatters";

interface PlannerContentProps {
  locale: Locale;
  dict: Dictionary;
}

// 5?®Í≥Ñ Ï¥àÍ∏∞???ÅÌÉú Î™®Îç∏
type PlannerState =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "calculation-error" }
  | { status: "ready"; draft: TripDraft; plan: BudgetPlan };

// useSyncExternalStore??stable no-op subscribe Î∞??§ÎÉÖ???®Ïàò
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function PlannerContent({ locale, dict }: PlannerContentProps) {
  // React ?úÏ? useSyncExternalStoreÎ°?Hydration ?ÑÎ£å ?¨Î?Î•??àÏ†Ñ?òÍ≤å Í∞êÏ?
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isHydrated) {
    // 1. ?úÎ≤Ñ ?åÎçîÎß?Î∞?ÏµúÏ¥à Hydration ?ÅÌÉú: Î°úÎî© ?îÎ©¥ ?åÎçîÎß?    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#e25c5c]"></div>
          <p className="text-sm font-medium text-slate-500">Loading planner...</p>
        </div>
      </div>
    );
  }

  // 2. Hydration ?ÑÎ£å ?? ?ôÏ†Å Î°úÏª¨?§ÌÜ†Î¶¨Ï?Î•?lazy loading?òÏó¨ Î∞îÏù∏??  return <HydratedPlannerContent locale={locale} dict={dict} />;
}

/**
 * Hydration ?ÑÎ£å ??Î°úÏª¨?§ÌÜ†Î¶¨Ï?Î•?Lazy Loading ?òÏó¨ Íµ¨Îèô?òÎäî Planner Íµ¨ÏÑ± Ïª¥Ìè¨?åÌä∏
 */
function HydratedPlannerContent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  // Lazy Initial StateÎ•??µÌï¥ ?Ä?¥Î®∏/Effect ?ÜÏù¥ ?ôÍ∏∞?ÅÏúºÎ°?Î°úÏª¨?§ÌÜ†Î¶¨Ï?Î•???1???àÏ†Ñ?òÍ≤å Î°úÎî© Î∞?Ï£ºÏûÖ
  const [state] = useState<PlannerState>(() => {
    const hasDraftKey =
      localStorage.getItem("hypeheritage_trip_draft") !== null ||
      localStorage.getItem("k_travel_state") !== null;

    if (!hasDraftKey) {
      return { status: "missing" };
    }

    try {
      const draft = loadTripDraft();
      const validation = validateTripDraft(draft);

      if (!validation.success) {
        return { status: "invalid" };
      }

      const plan = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG);
      return { status: "ready", draft, plan };
    } catch (error) {
      console.error("Budget calculations failed:", error);
      return { status: "calculation-error" };
    }
  });

  // Left Workspace Tab States
  const [selectedCityTab, setSelectedCityTab] = useState<"ALL" | "SEOUL" | "BUSAN" >("ALL");
  const [activeCategory, setActiveCategory] = useState<BudgetCategory>("ACCOMMODATION");

  // --- 1. Missing State ---
  if (state.status === "missing") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#e25c5c]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#0f172a]">{dict.planner.missingTitle}</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{dict.planner.missingDescription}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-block w-full h-11 px-6 rounded-xl bg-[#e25c5c] text-white font-bold leading-[44px] shadow hover:bg-[#d14b4b] transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:outline-offset-2"
        >
          {dict.planner.missingButton}
        </Link>
      </div>
    );
  }

  // --- 2. Invalid State ---
  if (state.status === "invalid") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#0f172a]">{dict.planner.invalidTitle}</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{dict.planner.invalidDescription}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-block w-full h-11 px-6 rounded-xl bg-[#e25c5c] text-white font-bold leading-[44px] shadow hover:bg-[#d14b4b] transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:outline-offset-2"
        >
          {dict.planner.invalidButton}
        </Link>
      </div>
    );
  }

  // --- 3. Calculation Error State ---
  if (state.status === "calculation-error") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#0f172a]">{dict.planner.calculationErrorTitle}</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{dict.planner.calculationErrorDescription}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-block w-full h-11 px-6 rounded-xl bg-[#e25c5c] text-white font-bold leading-[44px] shadow hover:bg-[#d14b4b] transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:outline-offset-2"
        >
          {dict.planner.calculationErrorButton}
        </Link>
      </div>
    );
  }

  // --- 4. Ready State ---
  const { draft, plan } = state;

  // City list filter tabs
  const availableTabs: ("ALL" | "SEOUL" | "BUSAN")[] = ["ALL"];
  if (draft.selectedCities.includes("SEOUL")) availableTabs.push("SEOUL");
  if (draft.selectedCities.includes("BUSAN")) availableTabs.push("BUSAN");

  // Filtering category items by active city tab
  const getFilteredItems = (category: BudgetCategory): BudgetLineItem[] => {
    const items: BudgetLineItem[] = [];

    // 1. Trip Wide Section
    if (category === "EMERGENCY_FUND") {
      items.push(...plan.tripWideSection.lineItems);
    }

    // 2. Intercity Section
    if (category === "CITY_TRANSPORT") {
      if (selectedCityTab === "ALL") {
        items.push(...plan.intercitySection.lineItems);
      }
    }

    // 3. City Sections
    draft.selectedCities.forEach((city) => {
      if (selectedCityTab !== "ALL" && selectedCityTab !== city) {
        return;
      }
      const section = plan.citySections[city];
      if (section) {
        if (category === "CITY_TRANSPORT") {
          const transItems = section.lineItems.filter(
            (i) => i.category === "CITY_TRANSPORT"
          );
          items.push(...transItems);
        } else {
          const catItems = section.lineItems.filter((i) => i.category === category);
          items.push(...catItems);
        }
      }
    });

    return items;
  };

  const activeItems = getFilteredItems(activeCategory);

  // Budget style localized label
  const budgetStyleLabel =
    draft.budgetTier === "BUDGET"
      ? "Budget"
      : draft.budgetTier === "PREMIUM"
      ? "Premium"
      : "Standard";

  const isOverBudget = plan.grandTotalKrw > plan.targetBudgetKrw;
  const clampedUsage = Math.min(100, (plan.grandTotalKrw / plan.targetBudgetKrw) * 100);

  return (
    <div className="w-full max-w-7xl px-4 py-8 md:px-8">
      {/* H1 header (Hidden but accessible for Screen Readers) */}
      <h1 className="sr-only">{dict.common.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* ================= LEFT WORKSPACE (60%) ================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Title Banner */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#e25c5c]">
                HypeHeritage Planner
              </span>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl">
                {dict.planner.workspaceTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {dict.planner.workspaceDescription}
              </p>
            </div>

            {/* Trip Parameters Summary Bar */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 items-center justify-between">
              <div className="flex flex-wrap gap-2 text-xs text-slate-600 font-medium">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  {formatTripDuration(draft.totalNights, dict, locale)}
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  {formatTravelerCount(draft.adultCount, dict, locale)}
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  {formatCityAllocationSummary(draft.cityNightAllocations, dict, locale)}
                </span>
                <span className="bg-[#faf5f5] text-[#e25c5c] px-2.5 py-1 rounded-lg border border-[#fce8e8]">
                  {budgetStyleLabel}
                </span>
              </div>

              <Link
                href={`/${locale}`}
                className="text-xs font-bold text-[#e25c5c] hover:underline focus-visible:outline-2 focus-visible:outline-[#e25c5c] p-1"
              >
                {dict.planner.editTripDetails} &rarr;
              </Link>
            </div>
          </div>

          {/* City Visit Tabs */}
          <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-px" role="tablist" aria-label="City tabs">
            {availableTabs.map((tab) => {
              const isActive = selectedCityTab === tab;
              const label =
                tab === "ALL"
                  ? dict.planner.allTabs
                  : tab === "SEOUL"
                  ? "Seoul"
                  : "Busan";

              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={isActive}
                  id={`city-tab-${tab}`}
                  aria-controls={`city-panel-${tab}`}
                  onClick={() => setSelectedCityTab(tab)}
                  className={`h-9 px-4 rounded-t-xl text-sm font-bold border-t border-x transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:z-10 ${
                    isActive
                      ? "bg-white text-[#e25c5c] border-slate-200 border-b-white"
                      : "bg-[#faf9f6]/40 text-slate-500 border-transparent hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Category Tabs / Cards */}
          <div className="grid grid-cols-5 gap-2" role="tablist" aria-label="Budget categories">
            {(["ACCOMMODATION", "FOOD", "CITY_TRANSPORT", "ATTRACTION", "EMERGENCY_FUND"] as BudgetCategory[]).map((cat) => {
              const isActive = activeCategory === cat;
              const label = getCategoryLabel(cat, dict);

              // Sum calculation for Transport
              const amount =
                cat === "CITY_TRANSPORT"
                  ? getCombinedTransportSubtotal(plan)
                  : plan.categoryTotals[cat] || 0;

              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  id={`cat-tab-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#e25c5c] ${
                    isActive
                      ? "bg-white border-[#e25c5c] shadow-sm text-[#0f172a]"
                      : "bg-white border-slate-200/80 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <div className={`h-1 w-6 rounded-full mb-1.5 ${isActive ? "bg-[#e25c5c]" : "bg-slate-200"}`}></div>
                  <span className="text-[11px] font-bold tracking-tight block sm:text-xs">
                    {label}
                  </span>
                  <span className="mt-1 text-[11px] sm:text-[13px] font-extrabold text-[#0f172a] block">
                    {formatKrw(amount)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Category Read-Only Content Panel */}
          <div
            className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6"
            role="tabpanel"
            id={`cat-panel-${activeCategory}`}
            aria-labelledby={`cat-tab-${activeCategory}`}
            aria-live="polite"
          >
            <div>
              <h3 className="text-lg font-bold text-[#0f172a]">
                {activeCategory === "ACCOMMODATION" && dict.planner.accommodationTitle}
                {activeCategory === "FOOD" && dict.planner.foodTitle}
                {activeCategory === "CITY_TRANSPORT" && dict.planner.transportTitle}
                {activeCategory === "ATTRACTION" && dict.planner.attractionsTitle}
                {activeCategory === "EMERGENCY_FUND" && dict.planner.emergencyTitle}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-450">
                {activeCategory === "ACCOMMODATION" && dict.planner.accommodationDescription}
                {activeCategory === "FOOD" && dict.planner.foodDescription}
                {activeCategory === "CITY_TRANSPORT" && dict.planner.transportDescription}
                {activeCategory === "ATTRACTION" && dict.planner.attractionsDescription}
                {activeCategory === "EMERGENCY_FUND" && dict.planner.emergencyDescription}
              </p>
            </div>

            <div className="space-y-3.5">
              {activeItems.map((item) => {
                const displayName = getBasketLabel(item.basketId, dict, locale);
                const cityLabel = item.cityCode ? (item.cityCode === "SEOUL" ? "Seoul" : "Busan") : "";

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-100 bg-[#faf9f6]/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800 font-bold">{displayName}</strong>
                        {cityLabel && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                            {cityLabel}
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                          {item.confidence}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 space-x-2">
                        <span>{dict.planner.pricingUnit}: {item.pricingUnit}</span>
                        <span>??/span>
                        <span>{dict.planner.updatedAtLabel}: {item.updatedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between md:text-right gap-4">
                      <span className="text-xs text-slate-400 italic font-mono md:block">
                        {getCalculationExpression(item, dict, locale)}
                      </span>
                      <strong className="text-base font-extrabold text-[#0f172a]">
                        {formatKrw(item.lineTotalKrw)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-400">
              <svg className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="leading-relaxed">
                {activeCategory === "ACCOMMODATION" && dict.planner.accommodationNotice}
                {activeCategory === "FOOD" && dict.planner.foodNotice}
                {activeCategory === "CITY_TRANSPORT" && dict.planner.transportNotice}
                {activeCategory === "ATTRACTION" && dict.planner.attractionsNotice}
                {activeCategory === "EMERGENCY_FUND" && dict.planner.emergencyNotice}
              </p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT STICKY SMART RECEIPT (40%) ================= */}
        <div className="lg:col-span-4 lg:sticky lg:top-[96px] space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#e25c5c] to-[#e25c5c]/60"></div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mt-2">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-[#0f172a]">
                  {dict.planner.receiptTitle}
                </h3>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  {dict.planner.statusDraft}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-600 block">
                  {dict.planner.badgeMock}
                </span>
              </div>
            </div>

            <div className="py-4 border-b border-slate-100 space-y-3.5">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    {dict.planner.budgetStyle}
                  </span>
                  <span className="mt-0.5 block text-slate-700 text-sm">{budgetStyleLabel}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    {dict.planner.targetBudget}
                  </span>
                  <span className="mt-0.5 block text-slate-700 text-sm">{formatKrw(plan.targetBudgetKrw)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">
                    {dict.planner.budgetUsage}
                  </span>
                  <span className={`font-mono font-extrabold ${isOverBudget ? "text-red-500" : "text-[#4d7c67]"}`}>
                    {formatPercentage(plan.targetBudgetUsagePercent)}
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={plan.targetBudgetUsagePercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverBudget ? "bg-red-500" : "bg-[#4d7c67]"
                    }`}
                    style={{ width: `${clampedUsage}%` }}
                  ></div>
                </div>

                <div className="text-xs flex items-center justify-between font-bold">
                  {isOverBudget ? (
                    <>
                      <span className="text-red-500">{dict.planner.overBudget}</span>
                      <span className="text-red-500 font-mono">+{formatKrw(plan.overBudgetAmountKrw)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400">{dict.planner.remainingBudget}</span>
                      <span className="text-[#4d7c67] font-mono">{formatKrw(plan.remainingBudgetKrw)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="py-4 space-y-5 max-h-[360px] overflow-y-auto pr-1">

              {plan.tripWideSection.lineItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {dict.planner.tripWideExpenses}
                  </h4>
                  {plan.tripWideSection.lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs">
                      <div>
                        <span className="text-slate-800 font-bold block">{getBasketLabel(item.basketId, dict, locale)}</span>
                        <span className="text-[10px] text-slate-400 italic">{getCalculationExpression(item, dict, locale)}</span>
                      </div>
                      <span className="font-mono font-bold text-[#0f172a]">{formatKrw(item.lineTotalKrw)}</span>
                    </div>
                  ))}
                </div>
              )}

              {draft.selectedCities.map((city) => {
                const section = plan.citySections[city];
                if (!section || section.lineItems.length === 0) return null;

                const label = city === "SEOUL" ? "Seoul" : "Busan";
                const cityNights = section.nights;

                return (
                  <div key={city} className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-extrabold text-[#0f172a]">
                        {label} <span className="text-[11px] font-bold text-slate-400">({cityNights}Î∞?</span>
                      </h4>
                      <span className="text-xs font-extrabold text-slate-800">{formatKrw(section.subtotalKrw)}</span>
                    </div>

                    <div className="space-y-2.5 pl-1.5 border-l border-slate-100">
                      {section.lineItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-xs">
                          <div>
                            <span className="text-slate-600 block">{getBasketLabel(item.basketId, dict, locale)}</span>
                            <span className="text-[10px] text-slate-400 italic">{getCalculationExpression(item, dict, locale)}</span>
                          </div>
                          <span className="font-mono font-semibold text-slate-700">{formatKrw(item.lineTotalKrw)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {plan.intercitySection.lineItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-extrabold text-[#0f172a]">
                      {dict.planner.intercityTransportation}
                    </h4>
                    <span className="text-xs font-extrabold text-slate-800">{formatKrw(plan.intercitySection.subtotalKrw)}</span>
                  </div>

                  <div className="space-y-2 pl-1.5 border-l border-slate-100">
                    {plan.intercitySection.lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-xs">
                        <div>
                          <span className="text-slate-600 block">{getBasketLabel(item.basketId, dict, locale)}</span>
                          <span className="text-[10px] text-slate-400 italic">{getCalculationExpression(item, dict, locale)}</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-700">{formatKrw(item.lineTotalKrw)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-dashed border-slate-200 space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-500">{dict.planner.estimatedTotal}</span>
                  <span className="text-2xl font-extrabold tracking-tight text-[#0f172a]">
                    {formatKrw(plan.grandTotalKrw)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{dict.planner.perTraveler}</span>
                  <span className="font-mono font-bold text-slate-600">{formatKrw(plan.perTravelerTotalKrw)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{dict.planner.dailyAverage}</span>
                  <span className="font-mono font-bold text-slate-600">{formatKrw(plan.dailyAverageKrw)}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed bg-[#faf9f6] p-2.5 rounded-lg border border-slate-100">
                {dict.planner.mockDisclaimer}
              </div>

              <div className="space-y-2 pt-1">
                {[
                  { label: dict.planner.saveTrip, key: "save" },
                  { label: dict.planner.shareReceipt, key: "share" },
                  { label: dict.planner.generateReport, key: "report" }
                ].map((btn) => (
                  <button
                    key={btn.key}
                    disabled
                    aria-describedby="future-features-info"
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-slate-400 bg-slate-50 font-bold text-sm text-center relative cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    <span>{btn.label}</span>
                    <span className="absolute -top-1.5 right-2 bg-slate-200 text-slate-500 text-[8px] font-bold px-1 py-0.5 rounded scale-90">
                      Coming Soon
                    </span>
                  </button>
                ))}
                <span id="future-features-info" className="sr-only">
                  {dict.planner.notYetAvailable}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
