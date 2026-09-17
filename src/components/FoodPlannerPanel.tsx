"use client";

import { useState, useMemo, useEffect } from "react";
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
  registerCustomFoodItems,
} from "../features/budget/catalog/food-catalog";
import { calculateFoodBasketPlan, calculateCityFoodBasketPlan } from "../features/budget/calculations/food-engine";
import { formatKrw } from "../features/budget/presentation/formatters";

interface FoodPlannerPanelProps {
  locale: Locale;
  dict: Dictionary;
  currentCity?: SupportedCity;
  cityNights?: number;
  selectedCities?: SupportedCity[];
  travelNights?: number;
  adultCount?: number;
  basketSelections?: FoodBasketItemSelection[];
  foodBasketPlan?: import("../features/budget/domain/types").CalculatedFoodBasketPlan;
  onUpdateQuantity?: (foodId: string, delta: number, cityCode?: SupportedCity) => void;
  onSetQuantity?: (foodId: string, quantity: number, cityCode?: SupportedCity) => void;
  onClearBasket?: (cityCode?: SupportedCity) => void;
  // 하위 호환성 레거시 props
  mealPlan?: CalculatedMealPlan;
  onSelectReplacement?: (slotId: string, foodItemId: string) => void;
  onClearReplacement?: (slotId: string) => void;
  onSelectAddOn?: (slotId: string, addOnItemId: string, quantity: number) => void;
  onRemoveAddOn?: (slotId: string, addOnItemId: string) => void;
  onChangeAddOnQuantity?: (slotId: string, addOnItemId: string, quantity: number) => void;
  hideHeader?: boolean;
}

export default function FoodPlannerPanel({
  locale,
  dict,
  currentCity = "SEOUL",
  cityNights,
  selectedCities = ["SEOUL"],
  travelNights = 3,
  adultCount = 1,
  basketSelections = [],
  foodBasketPlan,
  onUpdateQuantity,
  onSetQuantity,
  onClearBasket,
  hideHeader = false,
}: FoodPlannerPanelProps) {
  const [activeTab, setActiveTab] = useState<"NATIONAL" | "CITY" | "BASKET">("CITY");
  const [activeCityTab, setActiveCityTab] = useState<SupportedCity>(currentCity);
  const [nationalCategoryFilter, setNationalCategoryFilter] = useState<"ALL" | FoodCategoryTag>("ALL");
  const [previewFood, setPreviewFood] = useState<FoodItemDefinition | null>(null);
  const [dynamicFoods, setDynamicFoods] = useState<FoodItemDefinition[]>([]);

  // 관리자 / Supabase 실시간 동적 카탈로그 로드
  useEffect(() => {
    fetch("/api/admin/catalog?type=FOOD")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.foods) && data.foods.length > 0) {
          registerCustomFoodItems(data.foods);
          setDynamicFoods(data.foods);
        }
      })
      .catch(() => {});
  }, []);

  // 현재 활성화된 도시 목록 (전달된 selectedCities 기준 또는 기본 도시)
  const availableCities = useMemo(() => {
    return selectedCities && selectedCities.length > 0 ? selectedCities : [currentCity];
  }, [selectedCities, currentCity]);

  // 상단 탭에서 도시 변경 시 내부 활성 도시 즉시 동기화
  useEffect(() => {
    setActiveCityTab(currentCity);
  }, [currentCity]);

  const safeCityNights = Math.max(1, cityNights ?? Math.floor(travelNights / Math.max(1, selectedCities.length)));

  // 푸드 바스켓 연산 결과: 해당 활성 도시 기준 연산 (다른 도시 선택 항목과 철저 분리)
  const basketPlan = useMemo(() => {
    const totalPlan = calculateFoodBasketPlan(basketSelections, travelNights, adultCount);
    return calculateCityFoodBasketPlan(activeCityTab, safeCityNights, travelNights, totalPlan, adultCount);
  }, [basketSelections, travelNights, adultCount, activeCityTab, safeCityNights]);

  // 원클릭 토글 핸들러 (담기 / 취소)
  const handleToggle = (foodId: string) => {
    const currentQty = selectionMap.get(foodId) || 0;
    if (currentQty > 0) {
      if (onSetQuantity) onSetQuantity(foodId, 0, activeCityTab);
      else if (onUpdateQuantity) onUpdateQuantity(foodId, -currentQty, activeCityTab);
    } else {
      if (onSetQuantity) onSetQuantity(foodId, 1, activeCityTab);
      else if (onUpdateQuantity) onUpdateQuantity(foodId, 1, activeCityTab);
    }
  };

  // 선택된 항목 맵 (foodId -> quantity): 오직 현재 activeCityTab에 담긴 음식만 매핑
  const selectionMap = useMemo(() => {
    const map = new Map<string, number>();
    basketSelections.forEach((s) => {
      if (s.quantity <= 0) return;
      const foodDef = FOOD_CATALOG_BY_ID.get(s.foodId);
      const targetCity = s.cityCode || foodDef?.cityCode || currentCity;
      if (targetCity === activeCityTab) {
        map.set(s.foodId, (map.get(s.foodId) || 0) + s.quantity);
      }
    });
    return map;
  }, [basketSelections, activeCityTab, currentCity]);

  // 활성 도시의 10대 대표 음식 (Top 3 vs 탐색 7선) - K-스팟 전용 아이템은 제외
  const cityFoods = useMemo(() => {
    let list: FoodItemDefinition[];
    if (dynamicFoods.length > 0) {
      list = dynamicFoods.filter(
        (f) => f.cityCode === activeCityTab && f.targetScope !== "K_SPOT" && f.isActive !== false
      );
    } else {
      list = (CITY_SPECIALTY_FOODS[activeCityTab] || []).filter(
        (f) => f.targetScope !== "K_SPOT" && f.isActive !== false
      );
    }
    const top3 = list.filter((f) => f.isMustEatTop3);
    const explore7 = list.filter((f) => !f.isMustEatTop3);
    return { all: list, top3, explore7 };
  }, [activeCityTab, dynamicFoods]);

  // 한국 대표 음식 필터링 - K-스팟 전용 아이템은 제외
  const filteredNationalFoods = useMemo(() => {
    let base: FoodItemDefinition[];
    if (dynamicFoods.length > 0) {
      base = dynamicFoods.filter(
        (f) => f.scope === "NATIONAL" && f.targetScope !== "K_SPOT" && f.isActive !== false
      );
    } else {
      base = NATIONAL_K_FOODS.filter((f) => f.targetScope !== "K_SPOT" && f.isActive !== false);
    }
    if (nationalCategoryFilter === "ALL") return base;
    return base.filter((f) => f.categoryTag === nationalCategoryFilter);
  }, [nationalCategoryFilter, dynamicFoods]);

  const handleAdd = (foodId: string, cityCode?: SupportedCity) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(foodId, 1, cityCode || activeCityTab);
    }
  };

  const handleSubtract = (foodId: string, cityCode?: SupportedCity) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(foodId, -1, cityCode || activeCityTab);
    }
  };

  const handleRemove = (foodId: string, cityCode?: SupportedCity) => {
    const targetCity = cityCode || activeCityTab;
    if (onSetQuantity) {
      onSetQuantity(foodId, 0, targetCity);
    } else if (onUpdateQuantity) {
      const currentQty = selectionMap.get(foodId) || 1;
      onUpdateQuantity(foodId, -currentQty, targetCity);
    }
  };

  const cityName =
    locale === "ko"
      ? CITY_KOREAN_NAMES[activeCityTab] || activeCityTab
      : CITY_ENGLISH_NAMES[activeCityTab] || activeCityTab;

  return (
    <div className="w-full space-y-5">
      {/* 1. 푸드 바스켓 요약 바 (Summary Bar) */}
      {!hideHeader && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#0f172a] tracking-tight">
                  {cityName} {locale === "ko" ? "음식 바스켓" : "Food Basket"}
                </h3>
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
                {locale === "ko" ? `${cityName} 예상 식비 (${adultCount}인)` : `${cityName} Food Budget (${adultCount}p)`}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#e25c5c] tracking-tight">
                {formatKrw(basketPlan.grandTotalKrw)}
              </span>
            </div>
          </div>

          {/* 끼니 채움도 프로그레스 바 & 상태 뱃지 */}
          <div className="space-y-2">
            {(() => {
              const isExceeded = basketPlan.totalSelectedQuantity > basketPlan.expectedMealsCount;
              return (
                <>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span>
                        {locale === "ko" ? "담은 음식:" : "Selected Foods:"}
                      </span>
                      <span className={`font-black ${isExceeded ? "text-rose-600" : "text-emerald-600"}`}>
                        {basketPlan.totalSelectedQuantity}
                        {locale === "ko" ? "개 담김" : " items"}
                      </span>
                      <span className={`text-[11px] ${isExceeded ? "text-rose-500 font-bold" : "text-slate-400 font-normal"}`}>
                        ({locale === "ko" ? `일정 권장 ${basketPlan.expectedMealsCount}끼` : `Target: ${basketPlan.expectedMealsCount} meals`}
                        {isExceeded ? (locale === "ko" ? ` · ${basketPlan.totalSelectedQuantity - basketPlan.expectedMealsCount}끼 초과` : ` · +${basketPlan.totalSelectedQuantity - basketPlan.expectedMealsCount} exceeded`) : ""})
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar: 권장 끼니 초과 시 선명한 빨간색(bg-rose-500)으로 변경 */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isExceeded
                          ? "bg-rose-500 shadow-xs shadow-rose-200"
                          : basketPlan.totalSelectedQuantity === 0
                          ? "bg-slate-300"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((basketPlan.totalSelectedQuantity / Math.max(1, basketPlan.expectedMealsCount)) * 100))}%`,
                      }}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

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
            <span>{cityName} {locale === "ko" ? "대표 음식" : "Specialties"}</span>
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
            <span>{locale === "ko" ? "한국 대표 음식" : "K-Signatures"}</span>
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
            <span>{locale === "ko" ? "담은 바스켓" : "My Basket"}</span>
            <span
              className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "BASKET"
                  ? "bg-white/25 text-white"
                  : basketPlan.totalSelectedQuantity > 0
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {basketPlan.totalSelectedQuantity}
            </span>
          </button>
        </div>

        
      </div>

      {/* 3-A. [도시별 대표 로컬 음식] 탭 콘텐츠: 계층형 UI (필수 Top 3 + 탐색 7선) */}
      {/* 3-A. [도시별 대표 음식] 탭 콘텐츠 (카테고리 분리 없이 단일 대표 미식 리스트) */}
      {activeTab === "CITY" && (
        <div className="space-y-4">
          <div className="min-h-[36px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {cityName} {locale === "ko" ? "대표 음식 리스트" : "Signature Food List"}
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              {locale === "ko" ? "취향에 따라 골라 담기" : "Explore by Preference"}
            </span>
          </div>

          {/* 대표 미식 통합 카드 그리드: 1줄에 2개씩 배열 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cityFoods.all.map((food) => {
              const count = selectionMap.get(food.id) || 0;
              return (
                <FoodItemCard
                  key={food.id}
                  food={food}
                  locale={locale}
                  count={count}
                  adultCount={adultCount}
                  isHighlighted={food.isMustEatTop3 || false}
                  onToggle={() => handleToggle(food.id)}
                  onPreview={() => setPreviewFood(food)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 3-B. [한국 대표 미식 20선] 탭 콘텐츠 */}
      {activeTab === "NATIONAL" && (
        <div className="space-y-4">
          {/* 카테고리 필터 태그 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: locale === "ko" ? `전체 (${NATIONAL_K_FOODS.length})` : `All (${NATIONAL_K_FOODS.length})` },
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

          {/* 한국 대표 음식 그리드: 1줄에 2개씩 배열 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  onToggle={() => handleToggle(food.id)}
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
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {locale === "ko" ? "아직 담은 음식이 없습니다" : "Your food basket is empty"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {locale === "ko"
                  ? "도시별 대표 음식이나 한국 대표 음식 탭에서 먹고 싶은 요리를 골라 담아보세요!"
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
                    onClick={() => onClearBasket(activeCityTab)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    {locale === "ko" ? `${cityName} 바스켓 비우기` : `Clear ${cityName} Basket`}
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {basketPlan.selectedItems.map(({ food, quantity, subtotalKrw, cityCode }) => (
                  <div
                    key={`${food.id}_${cityCode || activeCityTab}`}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs sm:text-sm font-extrabold text-[#0f172a] truncate">
                            {locale === "ko" ? food.nameKo : food.nameEn}
                          </h5>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                            {CITY_KOREAN_NAMES[cityCode || activeCityTab] || cityCode || activeCityTab}
                          </span>
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

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(food.id, cityCode || activeCityTab)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>✕</span>
                        <span>{locale === "ko" ? "취소" : "Remove"}</span>
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

      {/* 4. 음식 상세 모달 (Popup Modal: 관광 팝업과 동일한 max-w-2xl 프리미엄 규격) */}
      {previewFood && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewFood(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Large Image Header */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-950 overflow-hidden shrink-0">
              {previewFood.imageUrl ? (
                <img
                  src={previewFood.imageUrl}
                  alt={locale === "ko" ? previewFood.nameKo : previewFood.nameEn}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-rose-500/80 to-amber-500/80 flex items-center justify-center">
                  <span className="text-2xl font-black text-white/40 tracking-wider uppercase">K-FOOD</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewFood(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer text-lg font-bold z-10"
                title={locale === "ko" ? "닫기" : "Close"}
              >
                ✕
              </button>

              {/* Category badges */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap">
                {previewFood.scope === "NATIONAL" ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600/90 text-white shadow-md backdrop-blur-md">
                    {locale === "ko" ? "한국 대표 음식" : "National Dish"}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-600/90 text-white shadow-md backdrop-blur-md">
                    {locale === "ko" ? `${CITY_KOREAN_NAMES[previewFood.cityCode || activeCityTab] || previewFood.cityCode} 로컬 추천` : `${previewFood.cityCode} Specialty`}
                  </span>
                )}
                {previewFood.isMustEatTop3 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-md">
                    Must-Eat
                  </span>
                )}
              </div>

              {/* Title on bottom of image */}
              <div className="absolute bottom-4 left-5 right-5 text-white z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                    {locale === "ko" ? previewFood.nameKo : previewFood.nameEn}
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Detailed Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {locale === "ko" ? "음식 소개" : "About"}
                </h4>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  {locale === "ko" ? previewFood.descKo : previewFood.descEn}
                </p>
              </div>

              {/* Key Food Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                      {locale === "ko" ? "1인 기준 권장 예산" : "Price per Person"}
                    </span>
                    <span className="text-[#e25c5c] font-black">{formatKrw(previewFood.unitPriceKrw)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                      {locale === "ko" ? "추천 지역 / 권역" : "Recommended Region"}
                    </span>
                    <span className="text-slate-600 font-medium">
                      {previewFood.scope === "NATIONAL"
                        ? (locale === "ko" ? "전국 어디서나 쉽게 즐김" : "Nationwide Available")
                        : (CITY_KOREAN_NAMES[previewFood.cityCode || activeCityTab] || previewFood.cityCode || "현지 로컬")}
                    </span>
                  </div>
                </div>

                {previewFood.imageUrl && (
                  <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>출처 / 라이선스</span>
                    <span>
                      {previewFood.imageUrl.includes("wikimedia") ? "Wikimedia Commons" : previewFood.imageUrl.startsWith("/assets") ? "Photo" : "한국관광공사 (TourAPI)"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
              <div>
                {(() => {
                  const searchKeyword = locale === "ko" ? previewFood.nameKo : (previewFood.nameKo || previewFood.nameEn);
                  const kakaoMapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(searchKeyword)}`;
                  return (
                    <a
                      href={kakaoMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-amber-600 bg-white hover:bg-amber-50/50 border border-slate-200 transition-colors shadow-2xs"
                    >
                      <span>{locale === "ko" ? "카카오맵 지도 검색" : "Search on Kakao Map"}</span>
                      <span className="text-slate-400 text-xs">↗</span>
                    </a>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFood(null)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
                >
                  {locale === "ko" ? "닫기" : "Close"}
                </button>

                {(() => {
                  const isSelected = (selectionMap.get(previewFood.id) || 0) > 0;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggle(previewFood.id);
                      }}
                      className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? "bg-rose-500 text-white hover:bg-rose-600"
                          : "bg-[#0f172a] text-white hover:bg-slate-800"
                      }`}
                    >
                      {isSelected
                        ? (locale === "ko" ? "✓ 예산에 담김" : "✓ In Budget")
                        : (locale === "ko" ? "예산에 담기" : "Add to Budget")}
                    </button>
                  );
                })()}
              </div>
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
  onToggle,
  onPreview,
}: {
  food: FoodItemDefinition;
  locale: Locale;
  count: number;
  adultCount: number;
  isHighlighted?: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const isSelected = count > 0;

  return (
    <div
      onClick={onToggle}
      className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 overflow-hidden cursor-pointer group ${
        isSelected
          ? "bg-[#fff7f7] border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-xs"
          : isHighlighted
          ? "bg-white border-amber-300 shadow-xs hover:border-amber-400 hover:shadow-sm"
          : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div className="space-y-2">
        {/* KTO TourAPI 공식 실사 이미지 썸네일 */}
        {food.imageUrl ? (
          <div
            className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 shadow-2xs"
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
            
            {/* 선택 시 체크마크 배지 */}
            {isSelected && (
              <div className="absolute top-2 left-2 z-10">
                <span className="w-5 h-5 rounded-full bg-[#e25c5c] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  ✓
                </span>
              </div>
            )}

            {food.isMustEatTop3 && !isSelected && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-md">
                Must-Eat
              </span>
            )}

            <span className="absolute bottom-1.5 right-2 text-[9px] font-medium text-white/80 drop-shadow-xs">
              {food.imageUrl.includes("wikimedia") ? "Wikimedia" : food.imageUrl.startsWith("/assets") ? "Photo" : "KTO"}
            </span>
          </div>
        ) : null}

        {/* 제목 & 가격: [음식명]             [가격] */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {!food.imageUrl && isSelected && (
              <span className="w-4 h-4 rounded-full bg-[#e25c5c] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                ✓
              </span>
            )}
            {!food.imageUrl && !isSelected && food.isMustEatTop3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white shadow-2xs shrink-0">
                Must-Eat
              </span>
            )}
            <h5
              className={`text-xs sm:text-sm font-black transition-colors line-clamp-1 ${
                isSelected ? "text-[#e25c5c]" : "text-[#0f172a] group-hover:text-indigo-600"
              }`}
              title={locale === "ko" ? food.nameKo : food.nameEn}
            >
              {locale === "ko" ? food.nameKo : food.nameEn}
            </h5>
          </div>

          <span className="text-xs sm:text-sm font-black text-[#e25c5c] shrink-0 whitespace-nowrap">
            {formatKrw(food.unitPriceKrw)}
          </span>
        </div>

        {/* 설명 */}
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {locale === "ko" ? food.descKo : food.descEn}
        </p>
      </div>

      {/* 하단 카운터 / 담기 버튼 */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors border border-slate-200/80 cursor-pointer"
        >
          <span>{locale === "ko" ? "상세보기" : "Details"}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
            isSelected
              ? "bg-[#e25c5c] text-white hover:bg-[#c94949] ring-1 ring-rose-200"
              : "bg-[#0f172a] text-white hover:bg-slate-800"
          }`}
        >
          {isSelected ? (
            <>
              <span className="font-bold">✓</span>
              <span>{locale === "ko" ? "담김" : "Added"}</span>
            </>
          ) : (
            <>
              <span className="font-bold">+</span>
              <span>{locale === "ko" ? "담기" : "Add"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
