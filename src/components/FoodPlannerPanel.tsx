"use client";

import { Locale } from "../lib/i18n/locales";
import { Dictionary } from "../lib/i18n/dictionaries/ko";
import { CalculatedMealPlan, EffectiveMealSlot } from "../features/budget/domain/types";
import { formatKrw } from "../features/budget/presentation/formatters";
import { MOCK_FOOD_ITEMS } from "../features/budget/catalog/mock-catalog";

interface FoodPlannerPanelProps {
  locale: Locale;
  dict: Dictionary;
  mealPlan?: CalculatedMealPlan;
  onSelectReplacement?: (slotId: string, foodItemId: string) => void;
  onClearReplacement?: (slotId: string) => void;
}

export default function FoodPlannerPanel({
  locale,
  dict,
  mealPlan,
  onSelectReplacement,
  onClearReplacement,
}: FoodPlannerPanelProps) {
  if (!mealPlan || !mealPlan.slots || mealPlan.slots.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-200">
        <p className="text-sm font-medium text-slate-500">{dict.planner.emptyMealPlanNotice}</p>
      </div>
    );
  }

  // 1. dayIndex 기준으로 slots 그룹핑
  const daysMap: Record<number, EffectiveMealSlot[]> = {};
  mealPlan.slots.forEach((slot) => {
    if (!daysMap[slot.dayIndex]) {
      daysMap[slot.dayIndex] = [];
    }
    daysMap[slot.dayIndex].push(slot);
  });

  const sortedDayIndices = Object.keys(daysMap)
    .map(Number)
    .sort((a, b) => a - b);

  const slotOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK_CAFE"];

  const getSlotLabel = (slotType: string) => {
    switch (slotType) {
      case "BREAKFAST":
        return dict.planner.mealSlotBreakfast;
      case "LUNCH":
        return dict.planner.mealSlotLunch;
      case "DINNER":
        return dict.planner.mealSlotDinner;
      case "SNACK_CAFE":
        return dict.planner.mealSlotSnack;
      default:
        return slotType;
    }
  };

  const currentCity = mealPlan.slots[0].city;
  const currentCityLabel = currentCity === "SEOUL" ? "Seoul" : "Busan";

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
        <span>{dict.planner.foodMealPlan} ({currentCityLabel})</span>
      </div>

      {/* Day-by-Day Meal Slots */}
      <div className="space-y-4">
        {sortedDayIndices.map((dayIdx) => {
          const daySlots = [...daysMap[dayIdx]].sort(
            (a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot)
          );

          return (
            <div key={dayIdx} className="space-y-3">
              <h4 className="text-xs font-extrabold text-[#0f172a] tracking-wider uppercase">
                {dict.planner.dayLabel} {dayIdx + 1}
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {daySlots.map((slot) => {
                  const isReplaced = !!slot.replacedByFoodItemId;
                  const displayName = isReplaced
                    ? (locale === "ko"
                        ? MOCK_FOOD_ITEMS.find((f) => f.id === slot.replacedByFoodItemId)?.nameKo
                        : MOCK_FOOD_ITEMS.find((f) => f.id === slot.replacedByFoodItemId)?.nameEn) || slot.replacedByFoodItemId
                    : dict.planner.baseMealLabel;

                  const hasIssues =
                    mealPlan.issues?.some((i) => i.slotId === slot.id) ||
                    mealPlan.addOnIssues?.some((i) => i.slotId === slot.id);

                  const slotAddOnIssues = mealPlan.addOnIssues?.filter((i) => i.slotId === slot.id) || [];

                  return (
                    <div
                      key={slot.id}
                      className="p-4 rounded-xl border border-slate-150 bg-white shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                            {getSlotLabel(slot.slot)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isReplaced
                                ? "bg-[#faf5f5] text-[#e25c5c] border border-[#fce8e8]"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isReplaced ? dict.planner.selectedReplacement : dict.planner.baseMealLabel}
                          </span>
                          {slot.includedInBaseBudget ? (
                            <span className="text-[10px] bg-[#eef7f3] text-[#4d7c67] px-1.5 py-0.5 rounded font-bold">
                              {dict.planner.includedInBase}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-100">
                              {dict.planner.notIncludedInBase}
                            </span>
                          )}
                          {hasIssues && (
                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">
                              {dict.planner.excludedSelectionNotice}
                            </span>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">Per Person</span>
                          <strong className="text-sm font-extrabold text-[#0f172a]">
                            {formatKrw(slot.unitPriceKrw)}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
                        <span className="font-semibold text-slate-700">{displayName}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase scale-90">
                          {dict.planner.badgeMock}
                        </span>
                      </div>

                      {/* Add-ons read-only view */}
                      {slot.addOns && slot.addOns.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            {dict.planner.addOnsLabel}
                          </span>
                          <div className="space-y-1 pl-1.5 border-l border-slate-100">
                            {slot.addOns.map((addon) => {
                              const name = locale === "ko" ? addon.nameKo : addon.nameEn;
                              return (
                                <div key={addon.addOnItemId} className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>
                                    {name} (x{addon.quantity})
                                  </span>
                                  <strong className="font-semibold font-mono text-slate-700">
                                    +{formatKrw(addon.lineTotalKrw)}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Orphan Add-on warning banner */}
                      {slotAddOnIssues.length > 0 && (
                        <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-600 font-semibold leading-relaxed">
                          ⚠️ {dict.planner.orphanAddOnWarning}
                        </div>
                      )}

                      {/* Collapsible Food Wishlist Collections for THIS Slot */}
                      <div className="pt-2 border-t border-slate-100">
                        <details className="group space-y-3">
                          <summary className="flex items-center justify-between font-bold text-[11px] text-slate-500 cursor-pointer p-1 rounded hover:bg-slate-50/50 transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c]">
                            <span>{dict.planner.wishlistCollectionsTitle}</span>
                            <svg className="h-3 w-3 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>

                          <div className="pt-1.5 text-[10px] text-slate-400 leading-relaxed bg-[#faf9f6]/80 p-2.5 rounded-lg border border-slate-100 space-y-3">
                            {(["ESSENTIALS", "INTERNATIONAL", "TRENDING", "SPECIALTIES"] as const).map((colId) => {
                              // 현재 도시, 현재 슬롯, 컬렉션 세 가지를 모두 충족하는 음식 필터링
                              const items = MOCK_FOOD_ITEMS.filter(
                                (item) =>
                                  item.collectionIds.includes(colId) &&
                                  item.applicableCities.includes(currentCity) &&
                                  item.applicableSlots.includes(slot.slot)
                              );

                              // ID 기준 중복 제거
                              const uniqueItems = items.filter(
                                (value, index, self) => self.findIndex((t) => t.id === value.id) === index
                              );

                              return (
                                <div key={colId} className="space-y-1.5 border-t border-slate-100/60 pt-2 first:border-t-0 first:pt-0">
                                  <span className="font-extrabold text-slate-600 block">
                                    {colId === "ESSENTIALS" && "Essentials"}
                                    {colId === "INTERNATIONAL" && "Popular"}
                                    {colId === "TRENDING" && `Trending (${dict.planner.badgeMock})`}
                                    {colId === "SPECIALTIES" && `Specialties (${currentCityLabel})`}
                                  </span>

                                  {uniqueItems.length === 0 ? (
                                    <div className="text-[9px] text-slate-400 italic pl-1">
                                      {dict.planner.noWishlistCandidates}
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                      {uniqueItems.map((food) => {
                                        const name = locale === "ko" ? food.nameKo : food.nameEn;
                                        const isSupported = food.pricingUnit === "PER_PERSON";
                                        const isCurrentlySelected = slot.replacedByFoodItemId === food.id;
                                        const isAnyReplacementActive = !!slot.replacedByFoodItemId;

                                        let buttonText = dict.planner.selectReplacementButton;
                                        let buttonAction = () => onSelectReplacement?.(slot.id, food.id);
                                        let ariaLabel = locale === "ko"
                                          ? `${name}을 ${getSlotLabel(slot.slot)}으로 선택`
                                          : `Select ${name} for ${getSlotLabel(slot.slot)}`;

                                        if (isCurrentlySelected) {
                                          buttonText = dict.planner.restoreBaseMealButton;
                                          buttonAction = () => onClearReplacement?.(slot.id);
                                          ariaLabel = locale === "ko"
                                            ? `${name} 선택 해제하고 기본식으로 복원`
                                            : `Deselect ${name} and restore to base meal`;
                                        } else if (isAnyReplacementActive) {
                                          buttonText = dict.planner.changeReplacementButton;
                                          buttonAction = () => onSelectReplacement?.(slot.id, food.id);
                                          ariaLabel = locale === "ko"
                                            ? `${name}으로 대체 식사 변경`
                                            : `Change replacement meal to ${name}`;
                                        }

                                        if (!isSupported) {
                                          buttonText = dict.planner.unsupportedPriceUnitLabel;
                                          ariaLabel = locale === "ko"
                                            ? `${name} (기본 예산 미지원 요금제)`
                                            : `${name} (Pricing unit not supported)`;
                                        }

                                        return (
                                          <div
                                            key={food.id}
                                            className={`p-2.5 rounded border flex flex-col justify-between gap-2 transition-all ${
                                              isCurrentlySelected
                                                ? "border-emerald-500 bg-emerald-50/20"
                                                : "border-slate-100 bg-white"
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-1">
                                              <span className="font-semibold text-slate-800 text-[10px]">
                                                {name}
                                                {isCurrentlySelected && (
                                                  <span className="ml-1 text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">
                                                    {dict.planner.selectedReplacement}
                                                  </span>
                                                )}
                                              </span>
                                              <strong className="text-slate-900 shrink-0 text-[10px]">
                                                {formatKrw(food.representativePriceKrw)}
                                              </strong>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                              <button
                                                type="button"
                                                disabled={!isSupported}
                                                onClick={buttonAction}
                                                aria-pressed={isCurrentlySelected}
                                                aria-label={ariaLabel}
                                                className={`w-full py-1 px-2 rounded text-[9px] font-bold transition-all ${
                                                  !isSupported
                                                    ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed"
                                                    : isCurrentlySelected
                                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    : "bg-[#e25c5c] text-white hover:bg-[#d14b4b]"
                                                }`}
                                              >
                                                {buttonText}
                                              </button>
                                              {!isSupported && (
                                                <span className="text-[8px] text-red-500 font-semibold text-center leading-none">
                                                  *{dict.planner.unsupportedPriceUnitLabel}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
