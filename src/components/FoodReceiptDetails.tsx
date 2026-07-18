"use client";

import React from "react";
import { CalculatedMealPlan, EffectiveMealSlot } from "../features/budget/domain/types";
import { Dictionary } from "../lib/i18n/dictionaries/ko";
import { formatKrw } from "../features/budget/presentation/formatters";
import { MOCK_FOOD_ITEMS } from "../features/budget/catalog/mock-catalog";

interface FoodReceiptDetailsProps {
  mealPlan: CalculatedMealPlan;
  locale: string;
  dict: Dictionary;
}

export default function FoodReceiptDetails({
  mealPlan,
  locale,
  dict,
}: FoodReceiptDetailsProps) {
  // 슬롯 이름 포맷터
  const getSlotName = (slot: EffectiveMealSlot): string => {
    const dayNum = slot.dayIndex + 1;
    const dayStr = locale === "ko" ? `${dayNum}일차` : `Day ${dayNum}`;

    let slotTypeStr = "";
    if (slot.slot === "BREAKFAST") slotTypeStr = dict.planner.mealSlotBreakfast;
    else if (slot.slot === "LUNCH") slotTypeStr = dict.planner.mealSlotLunch;
    else if (slot.slot === "DINNER") slotTypeStr = dict.planner.mealSlotDinner;
    else if (slot.slot === "SNACK_CAFE") slotTypeStr = dict.planner.mealSlotSnack;

    return `${dayStr} ${slotTypeStr}`;
  };

  return (
    <details
      className="mt-2.5 bg-slate-50/75 rounded-xl border border-slate-200/60 overflow-hidden transition-all text-[11px]"
      aria-label={dict.planner.foodDetails}
    >
      <summary className="px-3 py-2 text-slate-500 font-bold hover:bg-slate-100/50 cursor-pointer flex items-center justify-between transition-colors select-none focus-visible:outline-2 focus-visible:outline-[#e25c5c]">
        <span>{dict.planner.mealBreakdown}</span>
        <svg
          className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 rotate-0 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="p-3 border-t border-slate-200/50 space-y-3.5 divide-y divide-slate-150">
        {mealPlan.slots.map((slot) => {
          const slotName = getSlotName(slot);

          return (
            <div key={slot.id} className="pt-3 first:pt-0 space-y-2">
              {/* 슬롯 기본 헤더 */}
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-800">{slotName}</span>
                <span className="text-slate-500 font-mono">
                  {formatKrw(slot.unitPriceKrw)}
                </span>
              </div>

              {/* 기본식 또는 대체음식 명칭 & 포함 여부 */}
              <div className="pl-2 border-l-2 border-slate-200 flex items-center justify-between text-slate-500 text-[10px]">
                <div className="space-x-1.5">
                  <span className="font-semibold">
                    {slot.replacedByFoodItemId ? (() => {
                      const item = MOCK_FOOD_ITEMS.find((f) => f.id === slot.replacedByFoodItemId);
                      const name = item ? (locale === "ko" ? item.nameKo : item.nameEn) : "";
                      return (
                        <>
                          [{dict.planner.replacement}] {name}
                        </>
                      );
                    })() : (
                      `[${dict.planner.baseMeal}]`
                    )}
                  </span>
                  <span className="text-[9px] px-1 py-0.25 bg-slate-100 rounded text-slate-400">
                    {slot.includedInBaseBudget ? dict.planner.included : dict.planner.excludedFromBudget}
                  </span>
                </div>
              </div>

              {/* 적용된 Add-on 상세 목록 */}
              {slot.addOns && slot.addOns.length > 0 && (
                <div className="pl-3.5 space-y-1.5">
                  {slot.addOns.map((addOn) => {
                    const isOrphan = mealPlan.addOnIssues?.some(
                      (issue) => issue.slotId === slot.id && issue.addOnItemId === addOn.addOnItemId && issue.reason === "PARENT_REPLACEMENT_NOT_APPLIED"
                    );

                    const name = locale === "ko" ? addOn.nameKo : addOn.nameEn;
                    const priceExpression = addOn.adultCountApplied
                      ? `${formatKrw(addOn.unitPriceKrw)} x ${addOn.quantity}qty x ${addOn.multiplier / addOn.quantity}adults`
                      : `${formatKrw(addOn.unitPriceKrw)} x ${addOn.quantity}qty`;

                    return (
                      <div
                        key={addOn.addOnItemId}
                        className={`flex justify-between items-start text-[10px] p-1.5 rounded ${
                          isOrphan
                            ? "bg-rose-50/50 border border-rose-100/50 text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">
                              +{name} ({addOn.pricingUnit})
                            </span>
                            {isOrphan && (
                              <span className="text-[8px] bg-rose-100 text-rose-600 px-1 rounded font-extrabold uppercase shrink-0">
                                {dict.planner.issueNotice}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {priceExpression}
                          </span>
                        </div>
                        <span className={`font-mono font-bold ${isOrphan ? "line-through text-rose-400" : "text-slate-700"}`}>
                          {formatKrw(addOn.lineTotalKrw)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 도시별 FOOD subtotal 및 orphan 에러 경고 배너 */}
        <div className="pt-3.5 space-y-2">
          {mealPlan.addOnIssues && mealPlan.addOnIssues.length > 0 && (
            <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-600 font-semibold leading-relaxed">
              {dict.planner.orphanAddOnWarning}
            </div>
          )}

          <div className="flex justify-between items-baseline font-bold text-slate-700 pt-1 text-xs">
            <span>{dict.planner.cityFoodSubtotal}</span>
            <span className="font-mono text-slate-900">
              {formatKrw(mealPlan.lineTotalKrw)}
            </span>
          </div>
        </div>
      </div>
    </details>
  );
}
