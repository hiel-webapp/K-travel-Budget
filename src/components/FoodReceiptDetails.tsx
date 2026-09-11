"use client";

import React from "react";
import { CalculatedMealPlan, EffectiveMealSlot } from "../features/budget/domain/types";
import { Dictionary } from "../lib/i18n/dictionaries/ko";
import { formatKrw } from "../features/budget/presentation/formatters";
import { MOCK_FOOD_ITEMS } from "../features/budget/catalog/mock-catalog";
import { getFoodById } from "../features/budget/catalog/food-catalog";

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
  const basketPlan = mealPlan.foodBasketPlan;

  // 슬롯 이름 포맷터 (기존 fallback)
  const getSlotName = (slot: EffectiveMealSlot): string => {
    const dayNum = slot.dayIndex + 1;
    const dayStr = locale === "ko" ? `${dayNum}일차` : `Day ${dayNum}`;

    let slotTypeStr = "";
    if (slot.slot === "BREAKFAST") slotTypeStr = dict.planner?.mealSlotBreakfast || "아침";
    else if (slot.slot === "LUNCH") slotTypeStr = dict.planner?.mealSlotLunch || "점심";
    else if (slot.slot === "DINNER") slotTypeStr = dict.planner?.mealSlotDinner || "저녁";
    else if (slot.slot === "SNACK_CAFE") slotTypeStr = dict.planner?.mealSlotSnack || "스낵/카페";

    return `${dayStr} ${slotTypeStr}`;
  };

  return (
    <details
      className="mt-2.5 bg-slate-50/75 rounded-xl border border-slate-200/60 overflow-hidden transition-all text-[11px]"
      aria-label={dict.planner?.foodDetails || "식비 세부 내역"}
    >
      <summary className="px-3 py-2 text-slate-500 font-bold hover:bg-slate-100/50 cursor-pointer flex items-center justify-between transition-colors select-none focus-visible:outline-2 focus-visible:outline-[#e25c5c]">
        <span>{dict.planner?.mealBreakdown || "식비 상세 내역"}</span>
        <svg
          className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 rotate-0 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="p-3 border-t border-slate-200/50 space-y-3 divide-y divide-slate-150">
        {basketPlan ? (
          /* 신규 푸드 바스켓 명세 영수증 */
          <div className="space-y-2.5">
            <div className="text-[10px] text-slate-400 font-medium">
              {locale === "ko"
                ? `총 ${basketPlan.totalSelectedQuantity}개 메뉴 선택 (기준 예상 끼니: ${basketPlan.expectedMealsCount}식)`
                : `${basketPlan.totalSelectedQuantity} items selected (Standard expected: ${basketPlan.expectedMealsCount} meals)`}
            </div>

            {basketPlan.selectedItems.length > 0 ? (
              <div className="space-y-1.5">
                {basketPlan.selectedItems.map((item) => {
                  const name = locale === "ko" ? item.food.nameKo : item.food.nameEn;
                  return (
                    <div key={`${item.food.id}_${item.cityCode || ''}`} className="flex justify-between items-center text-slate-700">
                      <div className="space-x-1.5 truncate max-w-[200px]">
                        <span className="font-semibold text-slate-800">{name}</span>
                        <span className="text-[10px] text-slate-400">x{item.quantity}</span>
                      </div>
                      <span className="tabular-nums font-bold text-slate-800">
                        {formatKrw(item.subtotalKrw)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic py-1">
                {locale === "ko" ? "담은 대표 음식이 없습니다." : "No specialty foods selected yet."}
              </div>
            )}

            {/* 부족 끼니 자동 완충 식비 */}
            {basketPlan.uncoveredMealsCount > 0 && (
              <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center text-amber-700 bg-amber-50/60 p-2 rounded-lg text-[10px]">
                <div>
                  <span className="font-bold">
                    {locale === "ko" ? "남은 끼니 기본 일상 식비 완충" : "Base Meal Allowance Buffer"}
                  </span>
                  <span className="text-[9px] text-amber-600/80 block">
                    {locale === "ko"
                      ? `${basketPlan.uncoveredMealsCount}끼 x ₩${basketPlan.baseAllowanceUnitPriceKrw.toLocaleString()}`
                      : `${basketPlan.uncoveredMealsCount} meals x ₩${basketPlan.baseAllowanceUnitPriceKrw.toLocaleString()}`}
                  </span>
                </div>
                <span className="font-bold tabular-nums">
                  +{formatKrw(basketPlan.baseAllowanceTotalKrw)}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* 이전 슬롯 방식 Fallback */
          mealPlan.slots.map((slot) => {
            const slotName = getSlotName(slot);
            return (
              <div key={slot.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">{slotName}</span>
                  <span className="text-slate-500 tabular-nums">
                    {formatKrw(slot.unitPriceKrw)}
                  </span>
                </div>
                <div className="pl-2 border-l-2 border-slate-200 flex items-center justify-between text-slate-500 text-[10px]">
                  <div className="space-x-1.5">
                    <span className="font-semibold">
                      {slot.replacedByFoodItemId ? (() => {
                        const item = MOCK_FOOD_ITEMS.find((f) => f.id === slot.replacedByFoodItemId);
                        const name = item ? (locale === "ko" ? item.nameKo : item.nameEn) : "";
                        return <>[{dict.planner?.replacement || "선택"}] {name}</>;
                      })() : (
                        `[${dict.planner?.baseMeal || "기본식"}]`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* 도시별 FOOD subtotal */}
        <div className="pt-3 flex justify-between items-baseline font-bold text-slate-700 text-xs">
          <span>{dict.planner?.cityFoodSubtotal || "식비 합계"}</span>
          <span className="tabular-nums text-slate-900">
            {formatKrw(mealPlan.lineTotalKrw)}
          </span>
        </div>
      </div>
    </details>
  );
}

