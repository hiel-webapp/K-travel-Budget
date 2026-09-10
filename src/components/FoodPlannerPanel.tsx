"use client";

import { useState, useMemo } from "react";
import { Locale } from "../lib/i18n/locales";
import { Dictionary } from "../lib/i18n/dictionaries/ko";
import { SupportedCity, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES } from "../lib/trip-domain";
import {
  FoodItemDefinition,
  FoodBasketItemSelection,
  CalculatedMealPlan,
  FoodCategoryTag,
} from "../features/budget/domain/types";
import {
  NATIONAL_K_FOODS,
  CITY_SPECIALTY_FOODS,
  ALL_FOOD_ITEMS,
  FOOD_CATALOG_BY_ID,
} from "../features/budget/catalog/food-catalog";
import { calculateFoodBasketPlan } from "../features/budget/calculations/food-engine";
import { formatKrw } from "../features/budget/presentation/formatters";

interface FoodPlannerPanelProps {
  locale: Locale;
  dict: Dictionary;
  currentCity?: SupportedCity;
  selectedCities?: SupportedCity[];
  travelNights?: number;
  adultCount?: number;
  basketSelections?: FoodBasketItemSelection[];
  foodBasketPlan?: import("../features/budget/domain/types").CalculatedFoodBasketPlan;
  onUpdateQuantity?: (foodId: string, delta: number) => void;
  onSetQuantity?: (foodId: string, quantity: number) => void;
  onClearBasket?: () => void;
  // 하위 호환성 레거시 props
  mealPlan?: CalculatedMealPlan;
  onSelectReplacement?: (slotId: string, foodItemId: string) => void;
  onClearReplacement?: (slotId: string) => void;
  onSelectAddOn?: (slotId: string, addOnItemId: string, quantity: number) => void;
  onRemoveAddOn?: (slotId: string, addOnItemId: string) => void;
  onChangeAddOnQuantity?: (slotId: string, addOnItemId: string, quantity: number) => void;
}

export default function FoodPlannerPanel({
  locale,
  dict,
  currentCity = "SEOUL",
  selectedCities = ["SEOUL"],
  travelNights = 3,
  adultCount = 1,
  basketSelections = [],
  onUpdateQuantity,
  onSetQuantity,
  onClearBasket,
}: FoodPlannerPanelProps) {
  const [activeTab, setActiveTab] = useState<"NATIONAL" | "CITY" | "BASKET">("CITY");
  const [activeCityTab, setActiveCityTab] = useState<SupportedCity>(currentCity);
  const [nationalCategoryFilter, setNationalCategoryFilter] = useState<"ALL" | FoodCategoryTag>("ALL");
  const [previewFood, setPreviewFood] = useState<FoodItemDefinition | null>(null);

  // 현재 활성화된 도시 목록 (전달된 selectedCities 기준 또는 기본 도시)
  const availableCities = useMemo(() => {
    return selectedCities && selectedCities.length > 0 ? selectedCities : [currentCity];
  }, [selectedCities, currentCity]);

  // 푸드 바스켓 연산 결과
  const basketPlan = useMemo(() => {
    return calculateFoodBasketPlan(basketSelections, travelNights, adultCount);
  }, [basketSelections, travelNights, adultCount]);

  // 선택된 항목 맵 (foodId -> quantity)
  const selectionMap = useMemo(() => {
    const map = new Map<string, number>();
    basketSelections.forEach((s) => {
      if (s.quantity > 0) map.set(s.foodId, s.quantity);
    });
    return map;
  }, [basketSelections]);

  // 활성 도시의 10대 대표 음식 (Top 3 vs 탐색 7선)
  const cityFoods = useMemo(() => {
    const list = CITY_SPECIALTY_FOODS[activeCityTab] || [];
    const top3 = list.filter((f) => f.isMustEatTop3);
    const explore7 = list.filter((f) => !f.isMustEatTop3);
    return { all: list, top3, explore7 };
  }, [activeCityTab]);

  // 한국 대표 음식 필터링
  const filteredNationalFoods = useMemo(() => {
    if (nationalCategoryFilter === "ALL") return NATIONAL_K_FOODS;
    return NATIONAL_K_FOODS.filter((f) => f.categoryTag === nationalCategoryFilter);
  }, [nationalCategoryFilter]);

  const handleAdd = (foodId: string) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(foodId, 1);
    }
  };

  const handleSubtract = (foodId: string) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(foodId, -1);
    }
  };

  const handleRemove = (foodId: string) => {
    if (onSetQuantity) {
      onSetQuantity(foodId, 0);
    }
  };

  const cityName =
    locale === "ko"
      ? CITY_KOREAN_NAMES[activeCityTab] || activeCityTab
      : CITY_ENGLISH_NAMES[activeCityTab] || activeCityTab;

  return (
    <div className="w-full space-y-5">
      {/* 1. 푸드 바스켓 요약 바 (Summary Bar) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍱</span>
              <h3 className="text-base sm:text-lg font-black text-[#0f172a] tracking-tight">
                {locale === "ko" ? "식도락 바스켓 플래너" : "Food Basket Planner"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-[#e25c5c] border border-rose-100">
                {locale === "ko" ? "장바구니 담기형" : "Wishlist Mode"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {locale === "ko"
                ? "먹고 싶은 음식을 자유롭게 담으면 일정에 맞춰 총 식비가 자동으로 계산됩니다."
                : "Add foods you wish to eat. Total budget auto-adjusts to your trip duration."}
            </p>
          </div>

          {/* 총 식비 표시 */}
          <div className="text-right flex items-baseline sm:flex-col sm:items-end justify-between gap-1">
            <span className="text-[11px] font-bold text-slate-400">
              {locale === "ko" ? `예상 식비 총액 (${adultCount}인)` : `Total Food Budget (${adultCount}p)`}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#e25c5c] tracking-tight">
              {formatKrw(basketPlan.grandTotalKrw)}
            </span>
          </div>
        </div>

        {/* 끼니 채움도 프로그레스 바 & 상태 뱃지 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <span>🍽️</span>
              <span>
                {locale === "ko" ? "여행 식사 계획 채움도:" : "Meal Schedule Coverage:"}
              </span>
              <span className="text-[#e25c5c] font-black">
                {basketPlan.totalSelectedQuantity} / {basketPlan.expectedMealsCount}
                {locale === "ko" ? " 끼니 선택됨" : " meals selected"}
              </span>
            </span>

            <button
              type="button"
              onClick={() => setActiveTab("BASKET")}
              className="text-[#e25c5c] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>🛒 {locale === "ko" ? "바스켓 보기" : "View Basket"}</span>
              <span className="bg-[#e25c5c] text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-black">
                {basketPlan.totalSelectedQuantity}
              </span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                basketPlan.status === "FOODIE_TOUR"
                  ? "bg-amber-500"
                  : basketPlan.status === "BALANCED"
                  ? "bg-emerald-500"
                  : "bg-rose-400"
              }`}
              style={{
                width: `${Math.min(100, Math.round((basketPlan.totalSelectedQuantity / Math.max(1, basketPlan.expectedMealsCount)) * 100))}%`,
              }}
            />
          </div>

          {/* 가이드 안내 알림 (과소 / 적정 / 과다) */}
          <div className="pt-1">
            {basketPlan.status === "UNDER_SELECTED" ? (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <span className="text-base shrink-0">ⓘ</span>
                <div>
                  <span className="font-bold block text-amber-950">
                    {locale === "ko" ? "부족한 끼니 기본 식비 자동 완충 중" : "Base Meal Allowance Auto-Applied"}
                  </span>
                  <span>
                    {locale === "ko"
                      ? `일정 대비 아직 지정되지 않은 ${basketPlan.uncoveredMealsCount}끼는 굶지 않고 여행할 수 있도록 한 끼 10,000원의 기본 일상 식비(총 ${formatKrw(basketPlan.baseAllowanceTotalKrw)})가 안전하게 포함되어 있습니다.`
                      : `The remaining ${basketPlan.uncoveredMealsCount} unplanned meals have been covered with a realistic base daily allowance of ₩10,000/meal so you don't travel hungry.`}
                  </span>
                </div>
              </div>
            ) : basketPlan.status === "FOODIE_TOUR" ? (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 leading-relaxed">
                <span className="text-base shrink-0">🔥</span>
                <div>
                  <span className="font-bold block text-purple-950">
                    {locale === "ko" ? "풍성한 식도락 집중 투어 모드" : "Foodie Gourmet Tour Mode"}
                  </span>
                  <span>
                    {locale === "ko"
                      ? `여행 끼니 수보다 많은 ${basketPlan.totalSelectedQuantity}개의 음식이 담겼습니다! 미식 위주 여행으로 산출되며 선택하신 모든 음식의 실비가 정직하게 합산되었습니다.`
                      : `You selected ${basketPlan.totalSelectedQuantity} dishes! All selected foods are calculated into your total budget for a feast-filled culinary adventure.`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 leading-relaxed">
                <span className="text-base shrink-0">✨</span>
                <div>
                  <span className="font-bold block text-emerald-950">
                    {locale === "ko" ? "균형 잡힌 완벽한 미식 플랜" : "Well-Balanced Meal Plan"}
                  </span>
                  <span>
                    {locale === "ko"
                      ? `여행 일정(${travelNights + 1}일)에 딱 맞는 완벽한 식사 조합입니다. 대표 미식과 로컬 음식을 골고루 즐길 수 있습니다.`
                      : `Great choice! Your food selections match your ${travelNights + 1}-day itinerary schedule perfectly.`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 네비게이션 탭 (도시별 로컬 10선 / 한국 대표 20선 / 내 바스켓) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* 도시별 대표 로컬 음식 탭 */}
          <button
            type="button"
            onClick={() => setActiveTab("CITY")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "CITY"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>🏙️</span>
            <span>{cityName} {locale === "ko" ? "대표 미식 (10선)" : "Specialties (10)"}</span>
          </button>

          {/* 한국 대표 20선 탭 */}
          <button
            type="button"
            onClick={() => setActiveTab("NATIONAL")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "NATIONAL"
                ? "bg-[#0f172a] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>🇰🇷</span>
            <span>{locale === "ko" ? "한국 대표 미식 (20선)" : "K-Signatures (20)"}</span>
          </button>

          {/* 담은 바스켓 탭 */}
          <button
            type="button"
            onClick={() => setActiveTab("BASKET")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "BASKET"
                ? "bg-[#e25c5c] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>🛒</span>
            <span>{locale === "ko" ? "담은 바스켓" : "My Basket"}</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20">
              {basketPlan.totalSelectedQuantity}
            </span>
          </button>
        </div>

        {/* 도시 전환 알약 버튼들 (다구간 여행 시) */}
        {activeTab === "CITY" && availableCities.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">도시 전환:</span>
            {availableCities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCityTab(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCityTab === c
                    ? "bg-rose-100 text-[#e25c5c] font-black border border-rose-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {locale === "ko" ? CITY_KOREAN_NAMES[c] || c : CITY_ENGLISH_NAMES[c] || c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3-A. [도시별 대표 로컬 음식] 탭 콘텐츠: 계층형 UI (★ 필수 Top 3 + 탐색 7선) */}
      {activeTab === "CITY" && (
        <div className="space-y-6">
          {/* 섹션 1: ★ Must-Eat Top 3 (필수 미식) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 font-extrabold text-sm">★</span>
                <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  {cityName} {locale === "ko" ? "방문 시 꼭 먹어야 할 3대 필수 미식" : "Must-Eat Top 3"}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  Top Pick
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {locale === "ko" ? "외국인이 가장 선호하는 시그니처" : "Top Foreigner Favorites"}
              </span>
            </div>

            {/* Top 3 강조 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {cityFoods.top3.map((food) => {
                const count = selectionMap.get(food.id) || 0;
                return (
                  <FoodItemCard
                    key={food.id}
                    food={food}
                    locale={locale}
                    count={count}
                    adultCount={adultCount}
                    isHighlighted={true}
                    onAdd={() => handleAdd(food.id)}
                    onSubtract={() => handleSubtract(food.id)}
                    onPreview={() => setPreviewFood(food)}
                  />
                );
              })}
            </div>
          </div>

          {/* 섹션 2: Explore More 7 (로컬 탐색 7선) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-sm">✦</span>
                <h4 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  {cityName} {locale === "ko" ? "로컬 추천 미식 탐색 (7선)" : "Explore Local Favorites (7)"}
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {locale === "ko" ? "취향에 따라 골라 담기" : "Explore by Preference"}
              </span>
            </div>

            {/* 탐색 7선 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cityFoods.explore7.map((food) => {
                const count = selectionMap.get(food.id) || 0;
                return (
                  <FoodItemCard
                    key={food.id}
                    food={food}
                    locale={locale}
                    count={count}
                    adultCount={adultCount}
                    isHighlighted={false}
                    onAdd={() => handleAdd(food.id)}
                    onSubtract={() => handleSubtract(food.id)}
                    onPreview={() => setPreviewFood(food)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3-B. [한국 대표 미식 20선] 탭 콘텐츠 */}
      {activeTab === "NATIONAL" && (
        <div className="space-y-4">
          {/* 카테고리 필터 태그 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: locale === "ko" ? "전체 (20)" : "All (20)" },
              { id: "MEAL", label: locale === "ko" ? "정식 & 찌개" : "Meals & Stews" },
              { id: "BBQ_FEAST", label: locale === "ko" ? "K-BBQ & 고기" : "K-BBQ & Meat" },
              { id: "STREET_SNACK", label: locale === "ko" ? "분식 & 길거리" : "Street Food" },
              { id: "DESSERT_CAFE", label: locale === "ko" ? "디저트 & 빙수" : "Dessert & Cafe" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setNationalCategoryFilter(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  nationalCategoryFilter === cat.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 한국 대표 음식 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNationalFoods.map((food) => {
              const count = selectionMap.get(food.id) || 0;
              return (
                <FoodItemCard
                  key={food.id}
                  food={food}
                  locale={locale}
                  count={count}
                  adultCount={adultCount}
                  isHighlighted={food.isMustEatTop3 || false}
                  onAdd={() => handleAdd(food.id)}
                  onSubtract={() => handleSubtract(food.id)}
                  onPreview={() => setPreviewFood(food)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 3-C. [담은 바스켓] 탭 콘텐츠 */}
      {activeTab === "BASKET" && (
        <div className="space-y-4">
          {basketPlan.selectedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
              <span className="text-4xl block">🛒</span>
              <h4 className="text-base font-bold text-slate-800">
                {locale === "ko" ? "아직 담은 음식이 없습니다" : "Your food basket is empty"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {locale === "ko"
                  ? "도시별 대표 미식이나 한국 대표 음식 탭에서 먹고 싶은 요리를 골라 담아보세요!"
                  : "Explore city specialties and national K-food favorites to add to your trip wishlist!"}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("CITY")}
                className="mt-2 px-4 py-2 bg-[#0f172a] text-white text-xs font-extrabold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                {cityName} {locale === "ko" ? "대표 음식 담으러 가기 ➔" : "Browse City Foods ➔"}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <span className="text-xs font-black text-slate-800">
                  {locale === "ko" ? "담은 음식 목록" : "Selected Food Items"} ({basketPlan.selectedItems.length}종, 총 {basketPlan.totalSelectedQuantity}개)
                </span>
                {onClearBasket && (
                  <button
                    type="button"
                    onClick={onClearBasket}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    {locale === "ko" ? "전체 비우기" : "Clear All"}
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {basketPlan.selectedItems.map(({ food, quantity, subtotalKrw }) => (
                  <div
                    key={food.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{food.emoji || "🍽️"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs sm:text-sm font-extrabold text-[#0f172a] truncate">
                            {locale === "ko" ? food.nameKo : food.nameEn}
                          </h5>
                          {food.scope === "CITY_LOCAL" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                              {food.cityCode}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          1인 ₩{food.unitPriceKrw.toLocaleString()} × {quantity}개 × {adultCount}인
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs sm:text-sm font-black text-[#e25c5c]">
                        {formatKrw(subtotalKrw)}
                      </span>

                      {/* Quantity Controller */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleSubtract(food.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-800">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdd(food.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(food.id)}
                        className="text-slate-300 hover:text-rose-500 font-bold text-sm cursor-pointer px-1"
                        title={locale === "ko" ? "삭제" : "Remove"}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 하단 완충 금액 및 총계 푸터 */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{locale === "ko" ? "선택한 음식 합계" : "Selected Food Subtotal"}:</span>
                  <span className="font-bold text-slate-800">{formatKrw(basketPlan.selectedFoodTotalKrw)}</span>
                </div>
                {basketPlan.uncoveredMealsCount > 0 && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>
                      {locale === "ko"
                        ? `남은 끼니 기본 일상 식비 (${basketPlan.uncoveredMealsCount}끼 × ₩10,000 × ${adultCount}인)`
                        : `Base Allowance for ${basketPlan.uncoveredMealsCount} Uncovered Meals`}:
                    </span>
                    <span className="font-bold">+{formatKrw(basketPlan.baseAllowanceTotalKrw)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-[#0f172a]">
                  <span>{locale === "ko" ? "최종 식비 합계" : "Total Food Budget"}:</span>
                  <span className="text-base sm:text-lg text-[#e25c5c]">
                    {formatKrw(basketPlan.grandTotalKrw)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. 음식 상세 모달 (Popup Modal) */}
      {previewFood && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewFood(null)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 고화질 KTO 실사 사진 배너 */}
            {previewFood.imageUrl && (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                <img
                  src={previewFood.imageUrl}
                  alt={locale === "ko" ? previewFood.nameKo : previewFood.nameEn}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-2.5 right-3 text-[10px] font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Photo: 한국관광공사 (TourAPI)
                </span>
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{previewFood.emoji || "🍽️"}</span>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-[#0f172a]">
                    {locale === "ko" ? previewFood.nameKo : previewFood.nameEn}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">
                    {previewFood.scope === "NATIONAL"
                      ? (locale === "ko" ? "🇰🇷 한국 대표 미식" : "🇰🇷 Korean National Dish")
                      : `🏙️ ${previewFood.cityCode} ${locale === "ko" ? "대표 로컬 미식" : "Local Specialty"}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFood(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {locale === "ko" ? previewFood.descKo : previewFood.descEn}
            </p>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs font-bold text-slate-700">
              <span>{locale === "ko" ? "1인 평균 가격" : "Estimated Price per Person"}:</span>
              <span className="text-sm font-black text-[#e25c5c]">
                {formatKrw(previewFood.unitPriceKrw)}
              </span>
            </div>

            {/* 액션 버튼 */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleAdd(previewFood.id);
                  setPreviewFood(null);
                }}
                className="w-full py-2.5 bg-[#e25c5c] hover:bg-[#c94949] text-white text-xs font-black rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                {locale === "ko" ? "바스켓에 담기 (+1)" : "Add to Basket (+1)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 공통 음식 아이템 카드 컴포넌트
// =========================================================================
function FoodItemCard({
  food,
  locale,
  count,
  adultCount,
  isHighlighted,
  onAdd,
  onSubtract,
  onPreview,
}: {
  food: FoodItemDefinition;
  locale: Locale;
  count: number;
  adultCount: number;
  isHighlighted?: boolean;
  onAdd: () => void;
  onSubtract: () => void;
  onPreview: () => void;
}) {
  const isSelected = count > 0;

  return (
    <div
      className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 bg-white overflow-hidden ${
        isHighlighted
          ? isSelected
            ? "border-rose-400 ring-2 ring-rose-200 shadow-md bg-rose-50/10"
            : "border-amber-300 shadow-xs hover:border-amber-400 hover:shadow-sm"
          : isSelected
          ? "border-rose-400 ring-1 ring-rose-200 shadow-xs bg-rose-50/10"
          : "border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div className="space-y-2">
        {/* KTO TourAPI 공식 실사 이미지 썸네일 */}
        {food.imageUrl ? (
          <div
            className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 cursor-pointer group shadow-2xs"
            onClick={onPreview}
          >
            <img
              src={food.imageUrl}
              alt={locale === "ko" ? food.nameKo : food.nameEn}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                // 이미지 로드 실패 시 숨김 처리
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            
            {food.isMustEatTop3 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-md">
                ★ Must-Eat
              </span>
            )}

            {food.scope === "CITY_LOCAL" && !food.isMustEatTop3 && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                로컬 7선
              </span>
            )}

            <span className="absolute bottom-1.5 right-2 text-[9px] font-medium text-white/80 drop-shadow-xs">
              KTO
            </span>
          </div>
        ) : null}

        {/* 상단 뱃지 및 가격 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{food.emoji || "🍽️"}</span>
            {!food.imageUrl && food.isMustEatTop3 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                ★ Must-Eat
              </span>
            )}
            {!food.imageUrl && food.scope === "CITY_LOCAL" && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                로컬
              </span>
            )}
          </div>

          <span className="text-xs font-black text-[#e25c5c]">
            {formatKrw(food.unitPriceKrw)}
          </span>
        </div>

        {/* 제목 & 설명 */}
        <div>
          <h5
            onClick={onPreview}
            className="text-xs sm:text-sm font-black text-[#0f172a] hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
            title={locale === "ko" ? food.nameKo : food.nameEn}
          >
            {locale === "ko" ? food.nameKo : food.nameEn}
          </h5>
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
            {locale === "ko" ? food.descKo : food.descEn}
          </p>
        </div>
      </div>

      {/* 하단 카운터 / 담기 버튼 */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onPreview}
          className="text-[10px] text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
        >
          {locale === "ko" ? "상세보기 🔍" : "Details 🔍"}
        </button>

        {isSelected ? (
          <div className="flex items-center border border-rose-200 rounded-lg bg-rose-50/50 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={onSubtract}
              className="w-6 h-6 flex items-center justify-center text-rose-700 hover:bg-rose-100 font-black text-xs cursor-pointer"
            >
              -
            </button>
            <span className="px-2 text-center text-xs font-black text-rose-800">
              {count}
            </span>
            <button
              type="button"
              onClick={onAdd}
              className="w-6 h-6 flex items-center justify-center text-rose-700 hover:bg-rose-100 font-black text-xs cursor-pointer"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="px-2.5 py-1 rounded-lg text-xs font-extrabold text-white bg-[#0f172a] hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <span>+</span>
            <span>{locale === "ko" ? "담기" : "Add"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
