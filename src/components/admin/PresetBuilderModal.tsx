"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TravelPreset, TravelPresetId } from "../../lib/presets/travel-presets";
import { SupportedCity, ALL_SUPPORTED_CITIES, CITY_KOREAN_NAMES } from "../../lib/trip-domain";
import { BudgetBasketId, FoodBasketItemSelection, FoodItemDefinition } from "../../features/budget/domain/types";
import { AttractionSpot, TourCoursePreset } from "../../features/budget/catalog/attraction-spots";
import { getStayArchetypePrice } from "../../features/budget/catalog/stay-archetypes";

interface PresetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (preset: TravelPreset) => void;
  initialData?: TravelPreset | null;
}

const ACCOMMODATION_TIERS: { id: BudgetBasketId; labelKo: string; approxKrw: number }[] = [
  { id: "HOSTEL_GUESTHOUSE", labelKo: "호스텔 & 게스트하우스", approxKrw: 40000 },
  { id: "BUSINESS_HOTEL", labelKo: "도심 비즈니스 호텔", approxKrw: 120000 },
  { id: "HANOK_BOUTIQUE", labelKo: "전통 한옥 & 부티크", approxKrw: 240000 },
  { id: "LUXURY_SKYLINE", labelKo: "럭셔리 5성급 호텔", approxKrw: 450000 },
];

export default function PresetBuilderModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: PresetBuilderModalProps) {
  const [step, setStep] = useState<number>(1);

  // Meta
  const [id, setId] = useState<string>("");
  const [badgeKo, setBadgeKo] = useState<string>("신규 추천 테마");
  const [badgeEn, setBadgeEn] = useState<string>("New Curated Theme");
  const [titleKo, setTitleKo] = useState<string>("");
  const [titleEn, setTitleEn] = useState<string>("");
  const [taglineKo, setTaglineKo] = useState<string>("");
  const [taglineEn, setTaglineEn] = useState<string>("");
  const [summaryKo, setSummaryKo] = useState<string>("");
  const [summaryEn, setSummaryEn] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("https://tong.visitkorea.or.kr/cms/resource/66/3092766_image2_1.jpg");
  const [accentColor, setAccentColor] = useState<string>("#e25c5c");
  const [highlightTagsKo, setHighlightTagsKo] = useState<string>("#K-컬처, #추천코스");

  // Route & Nights
  const [selectedCities, setSelectedCities] = useState<SupportedCity[]>(["SEOUL", "BUSAN"]);
  const [nightsByCity, setNightsByCity] = useState<Record<string, number>>({ SEOUL: 3, BUSAN: 2 });
  const [travelersCount, setTravelersCount] = useState<number>(2);

  // Accommodation
  const [accByCity, setAccByCity] = useState<Record<string, BudgetBasketId>>({
    SEOUL: "BUSINESS_HOTEL",
    BUSAN: "BUSINESS_HOTEL",
  });

  // Food Selections: map of `${city}:::${foodId}` -> { foodId, quantity, cityCode }
  const [foodSelections, setFoodSelections] = useState<Record<string, { foodId: string; quantity: number; cityCode: SupportedCity }>>({});

  // Attraction Selections: per city courseIds and individualSpotIds
  const [courseByCity, setCourseByCity] = useState<Record<string, string[]>>({});
  const [spotsByCity, setSpotsByCity] = useState<Record<string, string[]>>({});

  // Budget
  const [estimatedBudgetKrw, setEstimatedBudgetKrw] = useState<number>(1200000);
  const [emergencyFundKrw, setEmergencyFundKrw] = useState<number>(50000);

  // Catalog data loaded from API
  const [catalogFoods, setCatalogFoods] = useState<FoodItemDefinition[]>([]);
  const [catalogAttractions, setCatalogAttractions] = useState<AttractionSpot[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<TourCoursePreset[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset or initialize
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setId(initialData.id);
      setBadgeKo(initialData.badgeKo || "추천 테마");
      setBadgeEn(initialData.badgeEn || "Curated Theme");
      setTitleKo(initialData.titleKo || "");
      setTitleEn(initialData.titleEn || "");
      setTaglineKo(initialData.taglineKo || "");
      setTaglineEn(initialData.taglineEn || "");
      setSummaryKo(initialData.summaryKo || "");
      setSummaryEn(initialData.summaryEn || "");
      setImageUrl(initialData.imageUrl || "");
      setAccentColor(initialData.accentColor || "#e25c5c");
      setHighlightTagsKo((initialData.highlightTagsKo || []).join(", "));
      setSelectedCities(initialData.draft?.selectedCities || ["SEOUL"]);
      setNightsByCity((initialData.draft?.cityNightAllocations as any) || { SEOUL: 3 });
      setTravelersCount(initialData.draft?.adultCount || 2);
      setEstimatedBudgetKrw(initialData.estimatedBudgetKrw || 1000000);
      setEmergencyFundKrw(initialData.preferences?.emergencyFundKrw || 50000);

      // Acc
      const acc = (initialData.preferences?.accommodationByCity as any) || {};
      setAccByCity(acc);

      // Food: 도시별 독립 키(`${city}:::${foodId}`)로 매핑
      const foodMap: Record<string, { foodId: string; quantity: number; cityCode: SupportedCity }> = {};
      const targetCities = initialData.draft?.selectedCities || ["SEOUL"];
      (initialData.preferences?.foodBasketSelections || []).forEach((item) => {
        const city = (item.cityCode || targetCities[0] || "SEOUL") as SupportedCity;
        const key = `${city}:::${item.foodId}`;
        foodMap[key] = { foodId: item.foodId, quantity: item.quantity, cityCode: city };
      });
      setFoodSelections(foodMap);

      // Attractions
      const courses: Record<string, string[]> = {};
      const spots: Record<string, string[]> = {};
      const attMap = initialData.preferences?.attractionSelections || {};
      Object.entries(attMap).forEach(([city, sel]) => {
        courses[city] = sel.selectedCourseIds || [];
        spots[city] = sel.individualSpotIds || [];
      });
      setCourseByCity(courses);
      setSpotsByCity(spots);
    } else {
      // New Preset default
      const newId = `K_CUSTOM_${Date.now().toString().slice(-5)}`;
      setId(newId);
      setTitleKo("");
      setTitleEn("");
      setTaglineKo("");
      setTaglineEn("");
      setSummaryKo("");
      setSummaryEn("");
      setSelectedCities(["SEOUL", "BUSAN"]);
      setNightsByCity({ SEOUL: 3, BUSAN: 2 });
      setAccByCity({ SEOUL: "BUSINESS_HOTEL", BUSAN: "BUSINESS_HOTEL" });
      setFoodSelections({});
      setCourseByCity({});
      setSpotsByCity({});
      setStep(1);
    }

    // Load full catalog
    setIsLoadingCatalog(true);
    fetch("/api/admin/catalog?type=ALL")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCatalogFoods(data.foods || []);
          setCatalogAttractions(data.attractions || []);
          setCatalogCourses(data.courses || []);
        }
      })
      .finally(() => setIsLoadingCatalog(false));
  }, [isOpen, initialData]);

  const totalNights = useMemo(() => {
    return selectedCities.reduce((sum, c) => sum + (nightsByCity[c] || 0), 0);
  }, [selectedCities, nightsByCity]);

  // Live Budget Calculation from selected accommodation + foods + attractions
  const calculatedBudget = useMemo(() => {
    let accomTotal = 0;
    selectedCities.forEach((city) => {
      const nights = nightsByCity[city] || 1;
      const tierId = accByCity[city] || "BUSINESS_HOTEL";
      const tierInfo = ACCOMMODATION_TIERS.find((t) => t.id === tierId);
      const nightly = getStayArchetypePrice(city, tierId as any) || tierInfo?.approxKrw || 120000;
      accomTotal += nights * nightly;
    });

    let foodTotal = 0;
    Object.values(foodSelections).forEach((item) => {
      const catalogItem = catalogFoods.find((f) => f.id === item.foodId);
      const price = catalogItem?.unitPriceKrw || 15000;
      foodTotal += price * item.quantity;
    });

    let attractionTotal = 0;
    selectedCities.forEach((city) => {
      const spotIds = spotsByCity[city] || [];
      spotIds.forEach((sId) => {
        const spot = catalogAttractions.find((s) => s.id === sId);
        if (spot && spot.price > 0) {
          attractionTotal += spot.price * travelersCount;
        }
      });
    });

    const subtotal = accomTotal + foodTotal + attractionTotal + emergencyFundKrw;
    // 1인당 권장 예산
    const perPersonEstimated = Math.round(subtotal / (travelersCount || 1));
    return {
      accomTotal,
      foodTotal,
      attractionTotal,
      emergencyFundKrw,
      subtotal,
      perPersonEstimated,
    };
  }, [selectedCities, nightsByCity, accByCity, foodSelections, spotsByCity, catalogFoods, catalogAttractions, emergencyFundKrw, travelersCount]);

  const toggleCity = (city: SupportedCity) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length <= 1) return; // at least 1 city
      setSelectedCities(selectedCities.filter((c) => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
      if (!nightsByCity[city]) {
        setNightsByCity({ ...nightsByCity, [city]: 2 });
      }
      if (!accByCity[city]) {
        setAccByCity({ ...accByCity, [city]: "BUSINESS_HOTEL" });
      }
    }
  };

  const handleToggleFood = (food: FoodItemDefinition, city: SupportedCity) => {
    const key = `${city}:::${food.id}`;
    const existing = foodSelections[key];
    if (existing) {
      const next = { ...foodSelections };
      delete next[key];
      setFoodSelections(next);
    } else {
      setFoodSelections({
        ...foodSelections,
        [key]: { foodId: food.id, quantity: travelersCount, cityCode: city },
      });
    }
  };

  const handleToggleSpot = (spotId: string, city: SupportedCity) => {
    const currentList = spotsByCity[city] || [];
    if (currentList.includes(spotId)) {
      setSpotsByCity({
        ...spotsByCity,
        [city]: currentList.filter((id) => id !== spotId),
      });
    } else {
      setSpotsByCity({
        ...spotsByCity,
        [city]: [...currentList, spotId],
      });
    }
  };

  const handleToggleCourse = (courseId: string, city: SupportedCity) => {
    const currentList = courseByCity[city] || [];
    const course = catalogCourses.find((c) => c.id === courseId);

    if (currentList.includes(courseId)) {
      setCourseByCity({
        ...courseByCity,
        [city]: currentList.filter((id) => id !== courseId),
      });
    } else {
      setCourseByCity({
        ...courseByCity,
        [city]: [...currentList, courseId],
      });
      // Automatically add course spots to city spots
      if (course && course.spotIds) {
        const citySpots = spotsByCity[city] || [];
        const merged = Array.from(new Set([...citySpots, ...course.spotIds]));
        setSpotsByCity({ ...spotsByCity, [city]: merged });
      }
    }
  };

  const handleSubmit = async () => {
    if (!id || !titleKo) {
      alert("프리셋 ID와 국문 제목은 필수입니다.");
      return;
    }

    setIsSubmitting(true);

    const routeKo = selectedCities.map((c) => `${CITY_KOREAN_NAMES[c]} ${nightsByCity[c] || 1}박`).join(" + ") + ` (${totalNights}박 ${totalNights + 1}일)`;
    const routeEn = selectedCities.map((c) => `${c} ${nightsByCity[c] || 1}N`).join(" + ") + ` (${totalNights}N ${totalNights + 1}D)`;

    const attractionSelectionsPayload: Record<string, { selectedCourseIds: string[]; individualSpotIds: string[] }> = {};
    selectedCities.forEach((city) => {
      attractionSelectionsPayload[city] = {
        selectedCourseIds: courseByCity[city] || [],
        individualSpotIds: spotsByCity[city] || [],
      };
    });

    const foodBasketSelectionsPayload: FoodBasketItemSelection[] = Object.values(foodSelections).map((item) => ({
      foodId: item.foodId,
      quantity: item.quantity,
      cityCode: item.cityCode,
    }));

    const newPreset: TravelPreset = {
      id,
      badgeKo,
      badgeEn,
      titleKo,
      titleEn: titleEn || titleKo,
      taglineKo,
      taglineEn: taglineEn || taglineKo,
      summaryKo: summaryKo || taglineKo,
      summaryEn: summaryEn || taglineEn || taglineKo,
      imageUrl: imageUrl || "https://tong.visitkorea.or.kr/cms/resource/66/3092766_image2_1.jpg",
      accentColor: accentColor || "#e25c5c",
      lightBg: "from-rose-50/70 via-white to-orange-50/40",
      badgeBg: "bg-rose-100/80 border-rose-200/90",
      badgeText: "text-rose-700",
      routeTextKo: routeKo,
      routeTextEn: routeEn,
      estimatedBudgetKrw: estimatedBudgetKrw > 0 ? estimatedBudgetKrw : calculatedBudget.perPersonEstimated,
      highlightTagsKo: highlightTagsKo.split(",").map((t) => t.trim()).filter(Boolean),
      highlightTagsEn: highlightTagsKo.split(",").map((t) => t.trim().replace(/^#/, "#K-")).filter(Boolean),
      draft: {
        totalNights,
        adultCount: travelersCount,
        selectedCities,
        cityNightAllocations: nightsByCity as any,
        budgetTier: "STANDARD",
        targetBudgetKrw: (estimatedBudgetKrw > 0 ? estimatedBudgetKrw : calculatedBudget.perPersonEstimated) * travelersCount,
        schemaVersion: 1,
      },
      preferences: {
        accommodationByCity: accByCity,
        foodBasketSelections: foodBasketSelectionsPayload,
        attractionSelections: attractionSelectionsPayload,
        emergencyFundKrw,
      },
      isActive: true,
      isCustom: true,
    };

    try {
      const res = await fetch("/api/admin/presets", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData ? { id, updates: newPreset } : { preset: newPreset }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(newPreset);
        onClose();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <span className="rounded-full bg-indigo-500/25 border border-indigo-400/50 px-3 py-0.5 text-xs font-bold text-indigo-300">
              Preset Builder Wizard
            </span>
            <h2 className="mt-1.5 text-xl font-black text-white drop-shadow-sm">
              {initialData ? "프리셋 상세 수정" : "카탈로그 기반 새 프리셋 조립 & 생성"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-950/80 px-6 py-2">
          {[
            { s: 1, label: "1. 기본 & 동선" },
            { s: 2, label: "2. 숙소 티어" },
            { s: 3, label: "3. 음식 바스켓" },
            { s: 4, label: "4. 관광지/코스" },
            { s: 5, label: "5. 예산 검토 및 발행" },
          ].map((item) => (
            <button
              key={item.s}
              onClick={() => setStep(item.s)}
              className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition-all ${
                step === item.s
                  ? "border-indigo-400 text-white bg-indigo-500/20 shadow-sm"
                  : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingCatalog ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* STEP 1: Basic Meta & Route */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-200">프리셋 ID (영문 고유키)</label>
                      <input
                        type="text"
                        value={id}
                        disabled={!!initialData}
                        onChange={(e) => setId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                        placeholder="예: K_KPOP_TOUR"
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-200">대표 뱃지 (한국어)</label>
                      <input
                        type="text"
                        value={badgeKo}
                        onChange={(e) => setBadgeKo(e.target.value)}
                        placeholder="예: 2026 MZ 성지 순례"
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-200">테마 명칭 (한국어) *</label>
                      <input
                        type="text"
                        value={titleKo}
                        onChange={(e) => setTitleKo(e.target.value)}
                        placeholder="예: K-컬처 & 핫플레이스 투어"
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-200">테마 명칭 (영어)</label>
                      <input
                        type="text"
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        placeholder="e.g. K-Culture & Hotspot Tour"
                        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-300">슬로건 / 태그라인 (한국어)</label>
                      <input
                        type="text"
                        value={taglineKo}
                        onChange={(e) => setTaglineKo(e.target.value)}
                        placeholder="예: 성수 팝업부터 광안리 드론쇼까지 가장 트렌디한 한국 여행"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">대표 이미지 URL</label>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">해시태그 (쉼표 구분)</label>
                      <input
                        type="text"
                        value={highlightTagsKo}
                        onChange={(e) => setHighlightTagsKo(e.target.value)}
                        placeholder="#성수팝업, #광안리야경"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Cities Selection */}
                  <div className="border-t border-slate-800 pt-4">
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      방문 도시 선택 및 박수 배분 (총 {totalNights}박)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {ALL_SUPPORTED_CITIES.map((city) => {
                        const isSelected = selectedCities.includes(city);
                        return (
                          <div
                            key={city}
                            className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500/10 text-white"
                                : "border-slate-800 bg-slate-800/40 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{CITY_KOREAN_NAMES[city]}</span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCity(city)}
                                className="h-4 w-4 rounded accent-indigo-500"
                              />
                            </div>
                            {isSelected && (
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-slate-400">체류 박수:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={14}
                                  value={nightsByCity[city] || 1}
                                  onChange={(e) =>
                                    setNightsByCity({
                                      ...nightsByCity,
                                      [city]: Math.max(1, parseInt(e.target.value) || 1),
                                    })
                                  }
                                  className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-center text-xs font-bold text-white"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Accommodation Tier */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    각 도시별 숙소 테마 등급을 지정하세요. 프리셋 적용 시 영수증 계산 엔진이 해당 등급의 1박 요금을 자동 적용합니다.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCities.map((city) => (
                      <div key={city} className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-white text-base">{CITY_KOREAN_NAMES[city]} ({nightsByCity[city] || 1}박)</h3>
                          <span className="text-xs text-indigo-400 font-semibold">{city}</span>
                        </div>
                        <div className="space-y-2">
                          {ACCOMMODATION_TIERS.map((tier) => {
                            const isChecked = (accByCity[city] || "BUSINESS_HOTEL") === tier.id;
                            const cityPrice = getStayArchetypePrice(city, tier.id as any) || tier.approxKrw;
                            return (
                              <label
                                key={tier.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                                  isChecked
                                    ? "border-indigo-500 bg-indigo-500/10 text-white"
                                    : "border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`acc_${city}`}
                                    checked={isChecked}
                                    onChange={() => setAccByCity({ ...accByCity, [city]: tier.id })}
                                    className="accent-indigo-500"
                                  />
                                  <span className="text-xs font-semibold">{tier.labelKo}</span>
                                </div>
                                <span className="text-xs text-slate-400">
                                  약 ₩{cityPrice.toLocaleString()}/박
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Food Basket from Catalog */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      카탈로그에 등록된 음식을 클릭하여 프리셋 기본 바스켓으로 담으세요.
                    </p>
                    <span className="text-xs font-semibold text-emerald-400">
                      선택된 음식: {Object.keys(foodSelections).length}개 (총 ₩{calculatedBudget.foodTotal.toLocaleString()})
                    </span>
                  </div>

                  {selectedCities.map((city) => {
                    const cityLocalFoods = catalogFoods.filter(
                      (f) => f.cityCode === city && f.scope !== "NATIONAL"
                    );
                    const nationalFoods = catalogFoods.filter(
                      (f) => f.scope === "NATIONAL"
                    );
                    const citySelectedCount = Object.values(foodSelections).filter(
                      (item) => item.cityCode === city
                    ).length;

                    return (
                      <div key={city} className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>🏙️ {CITY_KOREAN_NAMES[city]} 추천 음식</span>
                            <span className="text-xs font-normal text-slate-400">
                              (선택: {citySelectedCount}개 · 로컬 {cityLocalFoods.length}개 + 한국 대표 {nationalFoods.length}개)
                            </span>
                          </h3>
                        </div>

                        {/* 1. 해당 도시 대표 로컬 음식 섹션 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-700/60">
                            <span className="text-xs font-bold text-indigo-300">
                              🏙️ {CITY_KOREAN_NAMES[city]} 대표 로컬 음식 ({cityLocalFoods.length}선)
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {cityLocalFoods.map((food) => {
                              const isSelected = !!foodSelections[`${city}:::${food.id}`];
                              return (
                                <div
                                  key={food.id}
                                  onClick={() => handleToggleFood(food, city)}
                                  className={`cursor-pointer rounded-xl border p-2.5 transition-all flex items-center gap-3 ${
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                                      : "border-slate-800 bg-slate-800/60 hover:border-slate-700"
                                  }`}
                                >
                                  {food.imageUrl ? (
                                    <img
                                      src={food.imageUrl}
                                      alt={food.nameKo}
                                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                                      🍽️
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold text-xs text-white truncate">{food.nameKo}</span>
                                      {food.isMustEatTop3 && (
                                        <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[10px] text-rose-400 font-bold">
                                          Top3
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                                      ₩{food.unitPriceKrw?.toLocaleString()}
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="h-4 w-4 rounded accent-emerald-500 flex-shrink-0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. 전국 공통 한국 대표 시그니처 음식 섹션 */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-700/60">
                            <span className="text-xs font-bold text-amber-300">
                              🇰🇷 전국 공통 한국 대표 시그니처 ({nationalFoods.length}선)
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {nationalFoods.map((food) => {
                              const isSelected = !!foodSelections[`${city}:::${food.id}`];
                              return (
                                <div
                                  key={food.id}
                                  onClick={() => handleToggleFood(food, city)}
                                  className={`cursor-pointer rounded-xl border p-2.5 transition-all flex items-center gap-3 ${
                                    isSelected
                                      ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                                      : "border-slate-800 bg-slate-800/60 hover:border-slate-700"
                                  }`}
                                >
                                  {food.imageUrl ? (
                                    <img
                                      src={food.imageUrl}
                                      alt={food.nameKo}
                                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                                      🍲
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold text-xs text-white truncate">{food.nameKo}</span>
                                      {food.isMustEatTop3 && (
                                        <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[10px] text-rose-400 font-bold">
                                          Top3
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                                      ₩{food.unitPriceKrw?.toLocaleString()}
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="h-4 w-4 rounded accent-amber-500 flex-shrink-0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 4: Attractions & Courses from Catalog */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      도시별 투어 코스 및 명소를 선택하세요. 코스를 선택하면 포함된 스팟들이 자동 바인딩됩니다.
                    </p>
                    <span className="text-xs font-semibold text-purple-400">
                      입장료 총액: ₩{calculatedBudget.attractionTotal.toLocaleString()}
                    </span>
                  </div>

                  {selectedCities.map((city) => {
                    const cityCourses = catalogCourses.filter((c) => c.cityCode === city);
                    const citySpots = catalogAttractions.filter((s) => s.cityCode === city).slice(0, 15); // limit preview
                    const activeCourses = courseByCity[city] || [];
                    const activeSpots = spotsByCity[city] || [];

                    return (
                      <div key={city} className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-3">
                        <h3 className="font-bold text-white text-sm">
                          📍 {CITY_KOREAN_NAMES[city]} 관광 코스 & 명소 매핑
                        </h3>

                        {/* Courses */}
                        {cityCourses.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-indigo-400 mb-1.5">추천 투어 코스</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {cityCourses.map((c) => {
                                const isSelected = activeCourses.includes(c.id);
                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => handleToggleCourse(c.id, city)}
                                    className={`cursor-pointer rounded-lg border p-2.5 text-xs transition-all ${
                                      isSelected
                                        ? "border-indigo-500 bg-indigo-500/15 text-white"
                                        : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span>{c.nameKo}</span>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="accent-indigo-500"
                                      />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{c.descKo}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Individual Spots */}
                        <div>
                          <div className="text-xs font-semibold text-slate-400 mb-1.5">개별 명소 선택</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {citySpots.map((spot) => {
                              const isSelected = activeSpots.includes(spot.id);
                              return (
                                <div
                                  key={spot.id}
                                  onClick={() => handleToggleSpot(spot.id, city)}
                                  className={`cursor-pointer rounded-lg border p-2 text-xs flex items-center justify-between transition-all ${
                                    isSelected
                                      ? "border-purple-500 bg-purple-500/15 text-white"
                                      : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                                  }`}
                                >
                                  <div className="truncate pr-2">
                                    <span className="font-semibold block truncate">{spot.nameKo}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {spot.price === 0 ? "무료" : `₩${spot.price.toLocaleString()}`}
                                    </span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="accent-purple-500 flex-shrink-0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 5: Budget Summary & Publish */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">
                      📊 선택 항목 기반 실시간 예산 산정 결과
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="rounded-xl bg-slate-800/80 p-3">
                        <div className="text-xs text-slate-400">총 숙박비 ({totalNights}박)</div>
                        <div className="text-base font-bold text-white mt-1">₩{calculatedBudget.accomTotal.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-3">
                        <div className="text-xs text-slate-400">총 식비 ({Object.keys(foodSelections).length}개)</div>
                        <div className="text-base font-bold text-emerald-400 mt-1">₩{calculatedBudget.foodTotal.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-3">
                        <div className="text-xs text-slate-400">관광지 입장료</div>
                        <div className="text-base font-bold text-purple-400 mt-1">₩{calculatedBudget.attractionTotal.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-3">
                        <div className="text-xs text-slate-400">비상금 (설정값)</div>
                        <div className="text-base font-bold text-amber-400 mt-1">₩{emergencyFundKrw.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-indigo-500/20 pt-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-400">합산 총 예산 (기준 {travelersCount}인)</div>
                        <div className="text-2xl font-black text-white">
                          ₩{calculatedBudget.subtotal.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-xs text-slate-300 block mb-1">
                            1인 권장 예산 (직접 지정 가능)
                          </label>
                          <input
                            type="number"
                            value={estimatedBudgetKrw}
                            onChange={(e) => setEstimatedBudgetKrw(parseInt(e.target.value) || 0)}
                            className="rounded-xl border border-indigo-500 bg-slate-900 px-3 py-1.5 text-base font-bold text-indigo-400 text-right w-44"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setEstimatedBudgetKrw(calculatedBudget.perPersonEstimated)}
                          className="rounded-lg bg-indigo-600/30 border border-indigo-500/40 px-2.5 py-1.5 text-xs text-indigo-300 hover:bg-indigo-600/50"
                        >
                          자동값 적용
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      프리셋 최종 요약
                    </h4>
                    <div className="text-sm text-slate-200">
                      <span className="font-bold text-white">{titleKo}</span> ({id}) · {totalNights}박 {totalNights + 1}일
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      동선: {selectedCities.map((c) => `${CITY_KOREAN_NAMES[c]} ${nightsByCity[c] || 1}박`).join(" + ")}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/60">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          >
            ← 이전 단계
          </button>

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(5, s + 1))}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
              >
                다음 단계 →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50"
              >
                {isSubmitting ? "저장 중..." : initialData ? "수정사항 저장하기" : "새 프리셋 발행하기"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
