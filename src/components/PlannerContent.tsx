"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TripDraft, validateTripDraft, SupportedCity, BudgetTier, CITY_ENGLISH_NAMES, CITY_KOREAN_NAMES, calculateDefaultNightAllocation } from "../lib/trip-domain";
import { loadTripDraft, saveTripDraft, loadPlannerPreferencesEx, savePlannerPreferences, saveSavedTrip, loadSavedPlaceIds } from "../lib/storage-helper";

import { BudgetLineItem, BudgetCategory, BudgetBasketId, PlannerPreferences, isCalculatedMealPlan } from "../features/budget/domain/types";
import { generateInitialBudgetPlan } from "../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";
import FoodPlannerPanel from "./FoodPlannerPanel";
import FoodReceiptDetails from "./FoodReceiptDetails";
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
  generateBudgetSummaryText,
} from "../features/budget/presentation/formatters";

interface PlannerContentProps {
  locale: Locale;
  dict: Dictionary;
}

type PlannerState =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "calculation-error" }
  | { status: "ready"; draft: TripDraft; preferences: PlannerPreferences };

export default function PlannerContent({ locale, dict }: PlannerContentProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsHydrated(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#e25c5c]"></div>
          <p className="text-sm font-medium text-slate-500">Loading planner...</p>
        </div>
      </div>
    );
  }

  return <HydratedPlannerContent locale={locale} dict={dict} />;
}

const ALL_CITY_OPTIONS: { key: SupportedCity; nameKo: string; nameEn: string }[] = [
  { key: "SEOUL", nameKo: "서울", nameEn: "Seoul" },
  { key: "BUSAN", nameKo: "부산", nameEn: "Busan" },
  { key: "JEJU", nameKo: "제주", nameEn: "Jeju" },
  { key: "INCHEON", nameKo: "인천", nameEn: "Incheon" },
  { key: "GYEONGJU", nameKo: "경주", nameEn: "Gyeongju" },
  { key: "JEONJU", nameKo: "전주", nameEn: "Jeonju" },
  { key: "GANGNEUNG", nameKo: "강릉", nameEn: "Gangneung" },
  { key: "SUWON", nameKo: "수원", nameEn: "Suwon" },
  { key: "YEOSU", nameKo: "여수", nameEn: "Yeosu" },
  { key: "SOKCHO", nameKo: "속초", nameEn: "Sokcho" },
];

function HydratedPlannerContent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [state, setState] = useState<PlannerState>(() => {
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

      const res = loadPlannerPreferencesEx(draft);
      if (res.status === "invalid") {
        return { status: "invalid" };
      }

      const preferences = res.preferences;
      if (res.status === "fingerprint-mismatch" || res.status === "missing") {
        savePlannerPreferences({
          draft,
          accommodationByCity: {},
          foodOverrides: {},
          foodAddOnOverrides: {},
          attractionByCity: {},
        });
      }

      return { status: "ready", draft, preferences };
    } catch (error) {
      console.error("Failed to load planner:", error);
      return { status: "calculation-error" };
    }
  });

  const [selectedCityTab, setSelectedCityTab] = useState<"ALL" | SupportedCity>("ALL");
  const [activeCategory, setActiveCategory] = useState<BudgetCategory>("ACCOMMODATION");
  const [saveError, setSaveError] = useState<boolean>(false);

  const latestPrefsRef = useRef<PlannerPreferences | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedPlaceCount, setSavedPlaceCount] = useState<number>(0);

  // 여행 조건 수정 팝오버 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTab, setEditTab] = useState<"NIGHTS" | "ADULTS" | "CITIES">("NIGHTS");
  const [editDraft, setEditDraft] = useState<TripDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const handleModalNightsChange = (newNights: number) => {
    if (!editDraft) return;
    const newAllocations = calculateDefaultNightAllocation(editDraft.selectedCities, newNights);
    setEditDraft({
      ...editDraft,
      totalNights: newNights,
      cityNightAllocations: newAllocations,
    });
  };

  const handleModalAdultsChange = (newAdults: number) => {
    if (!editDraft) return;
    setEditDraft({
      ...editDraft,
      adultCount: newAdults,
    });
  };

  const handleModalToggleCity = (cityCode: SupportedCity) => {
    if (!editDraft) return;
    let nextCities: SupportedCity[];
    if (editDraft.selectedCities.includes(cityCode)) {
      nextCities = editDraft.selectedCities.filter((c) => c !== cityCode);
    } else {
      if (editDraft.selectedCities.length >= 4) return;
      nextCities = [...editDraft.selectedCities, cityCode];
    }
    const newAllocations = calculateDefaultNightAllocation(nextCities, editDraft.totalNights);
    setEditDraft({
      ...editDraft,
      selectedCities: nextCities,
      cityNightAllocations: newAllocations,
    });
  };

  const handleApplyTripDetailsEdit = () => {
    if (!editDraft) return;
    setEditError(null);

    const validation = validateTripDraft(editDraft);
    if (!validation.success) {
      const firstError = validation.errors[0];
      let errMsg = "여행 정보를 올바르게 입력해 주세요.";
      if (firstError === "invalid_nights") errMsg = "여행 기간은 1박~14박 사이로 설정해 주세요.";
      if (firstError === "invalid_adults") errMsg = "여행 인원은 1명~10명 사이로 설정해 주세요.";
      if (firstError === "invalid_cities_count" || firstError === "invalid_city") errMsg = "여행 목적지는 최소 1곳 이상 선택해 주세요.";
      setEditError(errMsg);
      return;
    }

    saveTripDraft(editDraft);
    if (state.status === "ready") {
      savePlannerPreferences({
        accommodationByCity: state.preferences.accommodationByCity,
        foodOverrides: state.preferences.foodOverrides,
        foodAddOnOverrides: state.preferences.addOnSelections,
        attractionByCity: state.preferences.attractionByCity,
        draft: editDraft,
      });
    }

    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        draft: editDraft,
      };
    });

    setIsEditModalOpen(false);
    setToastMessage("여행 조건이 반영되어 예산이 실시간 재계산되었습니다.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setSavedPlaceCount(loadSavedPlaceIds().length);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (state.status === "ready") {
      latestPrefsRef.current = state.preferences;
    }
  }, [state]);

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

  const { draft, preferences } = state;
  const plan = generateInitialBudgetPlan(draft, MOCK_PRICE_CATALOG, {
    accommodation: preferences.accommodationByCity,
    food: preferences.foodOverrides,
    foodAddOns: preferences.addOnSelections,
    attraction: preferences.attractionByCity,
    emergencyFundKrw: preferences.emergencyFundKrw,
  });

  const handleCopySummary = () => {
    try {
      const summaryText = generateBudgetSummaryText(plan, "", dict, locale);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryText)
          .then(() => {
            setToastMessage(dict.planner.copySummarySuccess);
            setTimeout(() => setToastMessage(null), 3000);
          })
          .catch(() => {
            setToastMessage(dict.planner.copySummaryError);
            setTimeout(() => setToastMessage(null), 3000);
          });
      } else {
        setToastMessage(dict.planner.copySummaryError);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      setToastMessage(dict.planner.copySummaryError);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const availableTabs: ("ALL" | SupportedCity)[] = ["ALL"];
  draft.selectedCities.forEach((city) => {
    if (!availableTabs.includes(city)) {
      availableTabs.push(city);
    }
  });

  const getFilteredItems = (category: BudgetCategory): BudgetLineItem[] => {
    const items: BudgetLineItem[] = [];
    if (category === "EMERGENCY_FUND") {
      items.push(...plan.tripWideSection.lineItems);
    }
    if (category === "CITY_TRANSPORT") {
      if (selectedCityTab === "ALL") {
        items.push(...plan.intercitySection.lineItems);
      }
    }
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

  const budgetStyleLabel =
    draft.budgetTier === "BUDGET"
      ? (locale === "ko" ? "실속형" : "Budget")
      : draft.budgetTier === "PREMIUM"
        ? (locale === "ko" ? "프리미엄" : "Premium")
        : (locale === "ko" ? "일반형" : "Standard");

  const isOverBudget = plan.grandTotalKrw > plan.targetBudgetKrw;
  const clampedUsage = Math.min(100, (plan.grandTotalKrw / plan.targetBudgetKrw) * 100);

  const handleStayOverride = (city: SupportedCity, basketId: BudgetBasketId) => {
    const nextAcc = {
      ...preferences.accommodationByCity,
      [city]: basketId,
    };

    const saved = savePlannerPreferences({
      accommodationByCity: nextAcc,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            accommodationByCity: nextAcc,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleBudgetTierChange = (newTier: BudgetTier) => {
    const nextDraft: TripDraft = {
      ...draft,
      budgetTier: newTier,
    };
    saveTripDraft(nextDraft);
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        draft: nextDraft,
      };
    });
  };

  const handleResetStay = (cityTarget: SupportedCity) => {
    const nextAcc = { ...preferences.accommodationByCity };
    delete nextAcc[cityTarget];

    const saved = savePlannerPreferences({
      accommodationByCity: nextAcc,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: preferences.attractionByCity,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            accommodationByCity: nextAcc,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleAttractionOverride = (city: SupportedCity, basketId: BudgetBasketId) => {
    const nextAttr = {
      ...preferences.attractionByCity,
      [city]: basketId,
    };

    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: nextAttr,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            attractionByCity: nextAttr,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleResetAttraction = (cityTarget: SupportedCity) => {
    const nextAttr = { ...preferences.attractionByCity };
    delete nextAttr[cityTarget];

    const saved = savePlannerPreferences({
      accommodationByCity: preferences.accommodationByCity,
      foodOverrides: preferences.foodOverrides,
      foodAddOnOverrides: preferences.addOnSelections,
      attractionByCity: nextAttr,
      draft,
    });

    if (saved) {
      setSaveError(false);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            attractionByCity: nextAttr,
          },
        };
      });
    } else {
      setSaveError(true);
    }
  };



  const handleSaveTripPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestPrefsRef.current) return;
    const success = saveSavedTrip(saveTitle, draft, latestPrefsRef.current);
    if (success) {
      setToastMessage(dict.planner.saveTripSuccess);
      setIsSaveModalOpen(false);
      setSaveTitle("");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSelectFoodReplacement = (slotId: string, foodItemId: string) => {
    if (!latestPrefsRef.current) return;

    const currentFood = latestPrefsRef.current.foodOverrides;
    const nextFood = {
      ...currentFood,
      [slotId]: foodItemId,
    };

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: nextFood,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        foodOverrides: nextFood,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleClearFoodReplacement = (slotId: string) => {
    if (!latestPrefsRef.current) return;

    const currentFood = latestPrefsRef.current.foodOverrides;
    const nextFood = { ...currentFood };
    delete nextFood[slotId];

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: nextFood,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        foodOverrides: nextFood,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleSelectAddOn = (slotId: string, addOnItemId: string, quantity: number) => {
    if (!latestPrefsRef.current) return;

    const currentAddOns = latestPrefsRef.current.addOnSelections || {};
    const slotAddOns = currentAddOns[slotId] ? [...currentAddOns[slotId]] : [];

    if (slotAddOns.some((item) => item.addOnItemId === addOnItemId)) return;

    const nextAddOns = {
      ...currentAddOns,
      [slotId]: [...slotAddOns, { addOnItemId, quantity }],
    };

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: nextAddOns,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        addOnSelections: nextAddOns,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleRemoveAddOn = (slotId: string, addOnItemId: string) => {
    if (!latestPrefsRef.current) return;

    const currentAddOns = latestPrefsRef.current.addOnSelections || {};
    if (!currentAddOns[slotId]) return;

    const slotAddOns = currentAddOns[slotId].filter((item) => item.addOnItemId !== addOnItemId);
    const nextAddOns = { ...currentAddOns };

    if (slotAddOns.length > 0) {
      nextAddOns[slotId] = slotAddOns;
    } else {
      delete nextAddOns[slotId];
    }

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: nextAddOns,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        addOnSelections: nextAddOns,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleChangeAddOnQuantity = (slotId: string, addOnItemId: string, quantity: number) => {
    if (!latestPrefsRef.current) return;

    const currentAddOns = latestPrefsRef.current.addOnSelections || {};
    if (!currentAddOns[slotId]) return;

    const nextAddOns = {
      ...currentAddOns,
      [slotId]: currentAddOns[slotId].map((item) =>
        item.addOnItemId === addOnItemId ? { ...item, quantity } : item
      ),
    };

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: nextAddOns,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        addOnSelections: nextAddOns,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const handleEmergencyFundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!latestPrefsRef.current) return;

    const valStr = e.target.value;
    const val = valStr === "" ? 0 : Number(valStr);

    const isValValid = (v: unknown): v is number => {
      return typeof v === "number" && !isNaN(v) && isFinite(v) && v >= 0 && Number.isInteger(v);
    };

    if (!isValValid(val)) {
      setSaveError(true);
      return;
    }

    const saved = savePlannerPreferences({
      accommodationByCity: latestPrefsRef.current.accommodationByCity,
      foodOverrides: latestPrefsRef.current.foodOverrides,
      foodAddOnOverrides: latestPrefsRef.current.addOnSelections,
      attractionByCity: latestPrefsRef.current.attractionByCity,
      emergencyFundKrw: val,
      draft,
    });

    if (saved) {
      setSaveError(false);
      latestPrefsRef.current = {
        ...latestPrefsRef.current,
        emergencyFundKrw: val,
      };
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          preferences: latestPrefsRef.current!,
        };
      });
    } else {
      setSaveError(true);
    }
  };

  const getCatalogStayPrice = (city: SupportedCity, basketId: BudgetBasketId): number => {
    const cityMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ACCOMMODATION" && b.id === basketId && b.applicableCity === city
    );
    if (cityMatch) return cityMatch.representativePriceKrw;
    const fallbackMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ACCOMMODATION" && b.id === basketId
    );
    return fallbackMatch ? fallbackMatch.representativePriceKrw : 0;
  };

  const getCatalogAttractionPrice = (city: SupportedCity, basketId: BudgetBasketId): number => {
    const cityMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ATTRACTION" && b.id === basketId && b.applicableCity === city
    );
    if (cityMatch) return cityMatch.representativePriceKrw;
    const fallbackMatch = MOCK_PRICE_CATALOG.find(
      (b) => b.category === "ATTRACTION" && b.id === basketId
    );
    return fallbackMatch ? fallbackMatch.representativePriceKrw : 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 space-y-6">
      <h1 className="sr-only">{dict.common.title}</h1>

      {/* Header Banner Section */}
      <div className="text-center space-y-2 pt-2">
        <span className="text-[#b93829] font-extrabold text-xs tracking-tight uppercase">
          HypeHeritage Planner
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {dict.planner.workspaceTitle}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {dict.planner.workspaceDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* ================= LEFT WORKSPACE (60%) ================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Title Banner */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 text-xs text-slate-600 font-medium">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  {formatTripDuration(draft.totalNights || 5, dict, locale)}
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  {formatTravelerCount(draft.adultCount || 2, dict, locale)}
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  {formatCityAllocationSummary(draft.cityNightAllocations, dict, locale)}
                </span>
                <span className="bg-[#faf5f5] text-[#e25c5c] px-2.5 py-1 rounded-lg border border-[#fce8e8]">
                  {budgetStyleLabel}
                </span>
                <span className="bg-[#eef2ff] text-[#4f46e5] font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-[#e0e7ff] flex items-center gap-1">
                  <span>🏛️</span>
                  <span>{locale === "ko" ? "공공데이터 검증 (KTO Verified)" : "KTO Official Verified"}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditDraft(draft);
                  setEditTab("NIGHTS");
                  setEditError(null);
                  setIsEditModalOpen(true);
                }}
                className="text-xs font-bold text-[#e25c5c] hover:underline hover:text-[#d14b4b] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e25c5c] p-1 flex items-center gap-1 transition-colors"
              >
                <span>{dict.planner.editTripDetails}</span>
                <span>→</span>
              </button>
            </div>

            {/* Interactive Budget Tier Selector Switch */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {locale === "ko" ? "💎 예산 스타일 1초 비교/전환:" : "💎 Budget Style 1-sec Compare/Switch:"}
                </span>
                <span className="text-[11px] text-[#e25c5c] font-semibold">
                  {locale === "ko" ? "선택 시 전체 예산 즉시 재계산" : "Recalculate budget instantly upon click"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "BUDGET", label: locale === "ko" ? "💡 실속형" : "💡 Budget" },
                  { key: "STANDARD", label: locale === "ko" ? "⭐️ 일반형" : "⭐️ Standard" },
                  { key: "PREMIUM", label: locale === "ko" ? "👑 프리미엄" : "👑 Premium" },
                ].map((tierOpt) => {
                  const isSelected = (draft.budgetTier || "STANDARD") === tierOpt.key;
                  return (
                    <button
                      key={tierOpt.key}
                      type="button"
                      onClick={() => handleBudgetTierChange(tierOpt.key as BudgetTier)}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? "bg-[#fdf2f2] border-2 border-[#e25c5c] text-[#0f172a] font-extrabold shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs">{tierOpt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* City Visit Tabs */}
          <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-px" role="tablist" aria-label="City tabs">
            {availableTabs.map((tab) => {
              const isActive = selectedCityTab === tab;
              const label =
                tab === "ALL"
                  ? dict.planner.allTabs
                  : locale === "ko"
                    ? CITY_KOREAN_NAMES[tab as SupportedCity] || tab
                    : CITY_ENGLISH_NAMES[tab as SupportedCity] || tab;

              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={isActive}
                  id={`city-tab-${tab}`}
                  aria-controls={`city-panel-${tab}`}
                  onClick={() => setSelectedCityTab(tab)}
                  className={`h-9 px-4 rounded-t-xl text-sm font-bold border-t border-x transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#e25c5c] focus-visible:z-10 ${isActive
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
                  className={`flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#e25c5c] ${isActive
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

          {/* Active Category Panel */}
          <div
            className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6"
            role="tabpanel"
            id={`cat-panel-${activeCategory}`}
            aria-labelledby={`cat-tab-${activeCategory}`}
            aria-live="polite"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#0f172a]">
                  {activeCategory === "ACCOMMODATION" && dict.planner.accommodationTitle}
                  {activeCategory === "FOOD" && dict.planner.foodTitle}
                  {activeCategory === "CITY_TRANSPORT" && dict.planner.transportTitle}
                  {activeCategory === "ATTRACTION" && dict.planner.attractionOverrideTitle}
                  {activeCategory === "EMERGENCY_FUND" && dict.planner.emergencyTitle}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  {activeCategory === "ACCOMMODATION" && dict.planner.accommodationDescription}
                  {activeCategory === "FOOD" && dict.planner.foodDescription}
                  {activeCategory === "CITY_TRANSPORT" && dict.planner.transportDescription}
                  {activeCategory === "ATTRACTION" && dict.planner.attractionOverrideDesc}
                  {activeCategory === "EMERGENCY_FUND" && dict.planner.emergencyDescription}
                </p>
              </div>

              {(activeCategory === "ACCOMMODATION" || activeCategory === "FOOD" || activeCategory === "ATTRACTION") && (
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                  {savedPlaceCount > 0 && (
                    <Link
                      href={`/${locale}/places?savedOnly=true`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0f172a] bg-amber-100/70 hover:bg-amber-200/70 px-3 py-2 rounded-xl border border-amber-300/60 transition-colors"
                    >
                      <span>★</span>
                      <span>
                        {(dict.places?.savedCountBadge || "저장한 후보 {count}개").replace(
                          "{count}",
                          String(savedPlaceCount)
                        )}
                      </span>
                    </Link>
                  )}
                  <Link
                    href={`/${locale}/places?${
                      selectedCityTab !== "ALL" ? `city=${selectedCityTab}&` : ""
                    }category=${
                      activeCategory === "ACCOMMODATION"
                        ? "ACCOMMODATION"
                        : activeCategory === "FOOD"
                        ? "RESTAURANT"
                        : "ATTRACTION"
                    }`}
                    className="inline-flex items-center justify-center text-xs font-bold text-[#e25c5c] bg-[#faf5f5] hover:bg-[#fdeeed] px-3 py-2 rounded-xl border border-[#fce8e8] transition-colors"
                  >
                    {dict.places?.exploreCandidatePlaces || "실제 후보 장소 탐색 →"}
                  </Link>
                </div>
              )}
            </div>

            {activeCategory === "ACCOMMODATION" && (
              <div className="space-y-6 pt-2 border-t border-slate-100">

                {/* 1. ALL Tab: Interactive Comparison Matrix Table by City */}
                {selectedCityTab === "ALL" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
                          <span>📊</span>
                          <span>{locale === "ko" ? "도시별 숙박 예산 대조 비교표" : "Stay Budget Comparison Table"}</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {locale === "ko"
                            ? "선택한 모든 도시의 숙박 유형, 대표 단가, 총액을 한눈에 대조하고 바로 조절하세요."
                            : "Compare and adjust stay options, rates, and subtotals across all selected cities."}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="p-3.5 w-40 shrink-0">{locale === "ko" ? "비교 항목" : "Comparison Item"}</th>
                            {draft.selectedCities.map((city) => {
                              const nights = draft.cityNightAllocations[city] || 0;
                              return (
                                <th key={city} className="p-3.5 min-w-[150px] border-l border-slate-200/60">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-slate-900">
                                      {locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city)}
                                    </span>
                                    <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                      {nights}{locale === "ko" ? "박" : "N"}
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="p-3.5 min-w-[140px] border-l border-slate-200 text-right bg-slate-100/60 font-extrabold text-slate-900">
                              {locale === "ko" ? "전체 숙박 합계" : "Total Stay"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {/* Row 1: 선택 숙박 유형 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                              {locale === "ko" ? "선택 숙박 유형" : "Selected Tier"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.accommodationByCity[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.basketId;
                              const name = getBasketLabel(activeBasketId as BudgetBasketId, dict, locale, city);
                              return (
                                <td key={city} className="p-3.5 border-l border-slate-200/60 font-extrabold text-[#0f172a]">
                                  {name}
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-400 bg-slate-50/30">
                              -
                            </td>
                          </tr>

                          {/* Row 2: 1박당 대표 단가 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                              {locale === "ko" ? "1박당 대표 단가" : "Per Room / Night"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.accommodationByCity[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.basketId;
                              const price = getCatalogStayPrice(city, activeBasketId as BudgetBasketId);
                              return (
                                <td key={city} className="p-3.5 border-l border-slate-200/60 font-semibold text-slate-800">
                                  {formatKrw(price)}
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-600 bg-slate-50/30">
                              {formatKrw(
                                Math.round(
                                  draft.selectedCities.reduce((acc, city) => {
                                    const bId =
                                      preferences.accommodationByCity[city] ||
                                      plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.basketId;
                                    return acc + getCatalogStayPrice(city, bId as BudgetBasketId);
                                  }, 0) / Math.max(1, draft.selectedCities.length)
                                )
                              )} <span className="text-[10px] text-slate-400 font-normal">({locale === "ko" ? "평균" : "Avg"})</span>
                            </td>
                          </tr>

                          {/* Row 3: 체류 박 수 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                              {locale === "ko" ? "숙박 수" : "Nights"}
                            </td>
                            {draft.selectedCities.map((city) => (
                              <td key={city} className="p-3.5 border-l border-slate-200/60">
                                {draft.cityNightAllocations[city] || 0}{locale === "ko" ? "박" : " Nights"}
                              </td>
                            ))}
                            <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-700 bg-slate-50/30">
                              {draft.totalNights || 5}{locale === "ko" ? "박" : " Nights"}
                            </td>
                          </tr>

                          {/* Row 4: 도시별 총 숙박비 */}
                          <tr className="bg-[#faf9f6]/70">
                            <td className="p-3.5 font-extrabold text-[#0f172a]">
                              {locale === "ko" ? "도시별 총 숙박비" : "City Subtotal"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.accommodationByCity[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.basketId;
                              const price = getCatalogStayPrice(city, activeBasketId as BudgetBasketId);
                              const nights = draft.cityNightAllocations[city] || 0;
                              const total = price * nights;
                              return (
                                <td key={city} className="p-3.5 border-l border-slate-200/60 font-black text-[#e25c5c] text-sm">
                                  {formatKrw(total)}
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right font-black text-[#0f172a] text-sm bg-slate-100/60">
                              {formatKrw(plan.categoryTotals["ACCOMMODATION"] || 0)}
                            </td>
                          </tr>

                          {/* Row 5: 유형 즉시 조절/스위치 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600 align-middle">
                              {locale === "ko" ? "유형 비교 및 선택" : "Compare & Select"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.accommodationByCity[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.basketId;
                              return (
                                <td key={city} className="p-3 border-l border-slate-200/60">
                                  <div className="flex flex-col gap-1.5">
                                    {(["BUDGET_STAY", "STANDARD_HOTEL", "PREMIUM_HERITAGE"] as BudgetBasketId[]).map((opt) => {
                                      const isSel = activeBasketId === opt;
                                      const name = getBasketLabel(opt, dict, locale, city);
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => handleStayOverride(city, opt)}
                                          className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between ${
                                            isSel
                                              ? "bg-[#faf5f5] border-[#e25c5c] text-[#e25c5c] shadow-2xs"
                                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          <span>{name}</span>
                                          {isSel && <span className="text-[10px]">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right bg-slate-50/30 text-slate-400 text-[11px]">
                              {locale === "ko" ? "도시별 즉시 변경" : "Instantly editable"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. City-Specific Tabs: Editable Card Sets with Reset */}
                {selectedCityTab !== "ALL" && (() => {
                  const city = selectedCityTab;
                  const hasOverride = !!preferences.accommodationByCity[city];

                  const activeBasketId =
                    preferences.accommodationByCity[city] ||
                    plan.citySections[city]?.lineItems.find((i) => i.category === "ACCOMMODATION")?.basketId;

                  const basketOptions: BudgetBasketId[] = ["BUDGET_STAY", "STANDARD_HOTEL", "PREMIUM_HERITAGE"];

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0f172a]">
                            {CITY_KOREAN_NAMES[city] || city} {dict.planner.selectStayTitle}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {dict.planner.selectStayDescription}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResetStay(city)}
                          disabled={!hasOverride}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${hasOverride
                              ? "text-[#e25c5c] border-[#fce8e8] bg-[#faf5f5] hover:bg-[#fdeeed]"
                              : "text-slate-355 border-slate-100 bg-slate-50 cursor-not-allowed"
                            }`}
                        >
                          {dict.planner.resetToRecommended}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {basketOptions.map((opt) => {
                          const isSelected = activeBasketId === opt;
                          const name = getBasketLabel(opt, dict, locale, city);
                          const price = getCatalogStayPrice(city, opt);

                          let desc = dict.planner.standardHotelDesc;
                          if (opt === "BUDGET_STAY") desc = dict.planner.budgetStayDesc;
                          if (opt === "PREMIUM_HERITAGE") desc = dict.planner.premiumHeritageDesc;

                          return (
                            <button
                              key={opt}
                              onClick={() => handleStayOverride(city, opt)}
                              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-155 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e25c5c] ${isSelected
                                  ? "bg-white border-[#e25c5c] shadow-sm text-slate-800"
                                  : "bg-white/60 border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-white"
                                }`}
                            >
                              <div>
                                <span className={`text-[11px] font-extrabold tracking-tight ${isSelected ? "text-[#e25c5c]" : "text-slate-600"}`}>
                                  {name}
                                </span>
                                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                                  {desc}
                                </p>
                              </div>
                              <div className="mt-3 flex items-baseline justify-between w-full border-t border-slate-50 pt-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Per Room/Night</span>
                                <span className="text-xs font-extrabold text-slate-800">{formatKrw(price)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}

            {activeCategory === "ATTRACTION" && (
              <div className="space-y-6 pt-2 border-t border-slate-100">
                {/* 1. ALL Tab: Interactive Comparison Matrix Table by City */}
                {selectedCityTab === "ALL" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
                          <span>📊</span>
                          <span>{locale === "ko" ? "도시별 관광 예산 대조 비교표" : "Attractions Budget Comparison Table"}</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {locale === "ko"
                            ? "선택한 모든 도시의 관광 패키지, 1인당 단가, 총액을 한눈에 대조하고 바로 조절하세요."
                            : "Compare and adjust attraction tiers, rates, and subtotals across all selected cities."}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="p-3.5 w-40 shrink-0">{locale === "ko" ? "비교 항목" : "Comparison Item"}</th>
                            {draft.selectedCities.map((city) => {
                              const nights = draft.cityNightAllocations[city] || 0;
                              return (
                                <th key={city} className="p-3.5 min-w-[150px] border-l border-slate-200/60">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-slate-900">
                                      {locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city)}
                                    </span>
                                    <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                      {nights}{locale === "ko" ? "박" : "N"}
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="p-3.5 min-w-[140px] border-l border-slate-200 text-right bg-slate-100/60 font-extrabold text-slate-900">
                              {locale === "ko" ? "전체 관광 합계" : "Total Attractions"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {/* Row 1: 선택 관광 유형 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                              {locale === "ko" ? "선택 관광 유형" : "Selected Tier"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.attractionByCity?.[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ATTRACTION")?.basketId;
                              const name = getBasketLabel(activeBasketId as BudgetBasketId, dict, locale, city);
                              return (
                                <td key={city} className="p-3.5 border-l border-slate-200/60 font-extrabold text-[#0f172a]">
                                  {name}
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-400 bg-slate-50/30">
                              -
                            </td>
                          </tr>

                          {/* Row 2: 1인당 대표 단가 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                              {locale === "ko" ? "1인당 대표 단가" : "Per Person"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.attractionByCity?.[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ATTRACTION")?.basketId;
                              const price = getCatalogAttractionPrice(city, activeBasketId as BudgetBasketId);
                              return (
                                <td key={city} className="p-3.5 border-l border-slate-200/60 font-semibold text-slate-800">
                                  {formatKrw(price)}
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-600 bg-slate-50/30">
                              {formatKrw(
                                Math.round(
                                  draft.selectedCities.reduce((acc, city) => {
                                    const bId =
                                      preferences.attractionByCity?.[city] ||
                                      plan.citySections[city]?.lineItems.find((i) => i.category === "ATTRACTION")?.basketId;
                                    return acc + getCatalogAttractionPrice(city, bId as BudgetBasketId);
                                  }, 0) / Math.max(1, draft.selectedCities.length)
                                )
                              )} <span className="text-[10px] text-slate-400 font-normal">({locale === "ko" ? "평균" : "Avg"})</span>
                            </td>
                          </tr>

                          {/* Row 3: 인원 수 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                              {locale === "ko" ? "여행 인원" : "Travelers"}
                            </td>
                            {draft.selectedCities.map((city) => (
                              <td key={city} className="p-3.5 border-l border-slate-200/60">
                                {draft.adultCount || 2}{locale === "ko" ? "명" : " Persons"}
                              </td>
                            ))}
                            <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-700 bg-slate-50/30">
                              {draft.adultCount || 2}{locale === "ko" ? "명" : " Persons"}
                            </td>
                          </tr>

                          {/* Row 4: 도시별 총 관광비 */}
                          <tr className="bg-[#faf9f6]/70">
                            <td className="p-3.5 font-extrabold text-[#0f172a]">
                              {locale === "ko" ? "도시별 총 관광비" : "City Subtotal"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.attractionByCity?.[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ATTRACTION")?.basketId;
                              const price = getCatalogAttractionPrice(city, activeBasketId as BudgetBasketId);
                              const adults = draft.adultCount || 2;
                              const total = price * adults;
                              return (
                                <td key={city} className="p-3.5 border-l border-slate-200/60 font-black text-[#e25c5c] text-sm">
                                  {formatKrw(total)}
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right font-black text-[#0f172a] text-sm bg-slate-100/60">
                              {formatKrw(plan.categoryTotals["ATTRACTION"] || 0)}
                            </td>
                          </tr>

                          {/* Row 5: 유형 즉시 조절/스위치 */}
                          <tr>
                            <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600 align-middle">
                              {locale === "ko" ? "유형 비교 및 선택" : "Compare & Select"}
                            </td>
                            {draft.selectedCities.map((city) => {
                              const activeBasketId =
                                preferences.attractionByCity?.[city] ||
                                plan.citySections[city]?.lineItems.find((i) => i.category === "ATTRACTION")?.basketId;
                              return (
                                <td key={city} className="p-3 border-l border-slate-200/60">
                                  <div className="flex flex-col gap-1.5">
                                    {(["MOSTLY_FREE", "BALANCED", "EXPERIENCE_RICH"] as BudgetBasketId[]).map((opt) => {
                                      const isSel = activeBasketId === opt;
                                      const name = getBasketLabel(opt, dict, locale, city);
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => handleAttractionOverride(city, opt)}
                                          className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between ${
                                            isSel
                                              ? "bg-[#faf5f5] border-[#e25c5c] text-[#e25c5c] shadow-2xs"
                                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          <span>{name}</span>
                                          {isSel && <span className="text-[10px]">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-3.5 border-l border-slate-200 text-right bg-slate-50/30 text-slate-400 text-[11px]">
                              {locale === "ko" ? "도시별 즉시 변경" : "Instantly editable"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. City-Specific Tabs: Editable Card Sets with Reset */}
                {selectedCityTab !== "ALL" && (() => {
                  const city = selectedCityTab;
                  const hasOverride = !!preferences.attractionByCity?.[city];

                  const activeBasketId =
                    preferences.attractionByCity?.[city] ||
                    plan.citySections[city]?.lineItems.find((i) => i.category === "ATTRACTION")?.basketId;

                  const basketOptions: BudgetBasketId[] = ["MOSTLY_FREE", "BALANCED", "EXPERIENCE_RICH"];

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0f172a]">
                            {CITY_KOREAN_NAMES[city] || city} {dict.planner.selectAttractionTitle}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {dict.planner.selectAttractionDescription}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResetAttraction(city)}
                          disabled={!hasOverride}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${hasOverride
                              ? "text-[#e25c5c] border-[#fce8e8] bg-[#faf5f5] hover:bg-[#fdeeed]"
                              : "text-slate-355 border-slate-100 bg-slate-50 cursor-not-allowed"
                            }`}
                        >
                          {dict.planner.resetToRecommendedAttraction}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {basketOptions.map((opt) => {
                          const isSelected = activeBasketId === opt;
                          const name = getBasketLabel(opt, dict, locale, city);
                          const price = getCatalogAttractionPrice(city, opt);

                          let desc = dict.planner.balancedDesc;
                          if (opt === "MOSTLY_FREE") desc = dict.planner.mostlyFreeDesc;
                          if (opt === "EXPERIENCE_RICH") desc = dict.planner.experienceRichDesc;

                          return (
                            <button
                              key={opt}
                              onClick={() => handleAttractionOverride(city, opt)}
                              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-155 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e25c5c] ${isSelected
                                  ? "bg-white border-[#e25c5c] shadow-sm text-slate-800"
                                  : "bg-white/60 border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-white"
                                }`}
                            >
                              <div>
                                <span className={`text-[11px] font-extrabold tracking-tight ${isSelected ? "text-[#e25c5c]" : "text-slate-600"}`}>
                                  {name}
                                </span>
                                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                                  {desc}
                                </p>
                              </div>
                              <div className="mt-3 flex items-baseline justify-between w-full border-t border-slate-50 pt-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Per Person</span>
                                <span className="text-xs font-extrabold text-slate-800">{formatKrw(price)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeCategory === "FOOD" && selectedCityTab !== "ALL" && (() => {
              const city = selectedCityTab;
              const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
              return (
                <div className="space-y-6 pt-2 border-t border-slate-100">
                  {saveError && (
                    <div role="alert" className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                      {dict.planner.saveFailedNotice}
                    </div>
                  )}
                  <FoodPlannerPanel
                    locale={locale}
                    dict={dict}
                    mealPlan={isCalculatedMealPlan(foodLine?.mealPlan) ? foodLine.mealPlan : undefined}
                    onSelectReplacement={handleSelectFoodReplacement}
                    onClearReplacement={handleClearFoodReplacement}
                    onSelectAddOn={handleSelectAddOn}
                    onRemoveAddOn={handleRemoveAddOn}
                    onChangeAddOnQuantity={handleChangeAddOnQuantity}
                  />
                </div>
              );
            })()}

            {activeCategory === "FOOD" && selectedCityTab === "ALL" && (
              <div className="space-y-6 pt-2 border-t border-slate-100">
                {/* Food Budget Comparison Matrix */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
                        <span>🍱</span>
                        <span>{locale === "ko" ? "도시별 음식 예산 대조 비교표" : "Food Budget Comparison Table"}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {locale === "ko"
                          ? "도시별 식사 구성과 특색 커스텀 음식, 식비 총액을 한눈에 비교해보세요."
                          : "Compare meal slots, custom food choices, and subtotals across cities."}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="p-3.5 w-40 shrink-0">{locale === "ko" ? "비교 항목" : "Comparison Item"}</th>
                          {draft.selectedCities.map((city) => {
                            const nights = draft.cityNightAllocations[city] || 0;
                            return (
                              <th key={city} className="p-3.5 min-w-[150px] border-l border-slate-200/60">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-900">
                                    {locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city)}
                                  </span>
                                  <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                    {nights + 1}{locale === "ko" ? "일" : "D"}
                                  </span>
                                </div>
                              </th>
                            );
                          })}
                          <th className="p-3.5 min-w-[140px] border-l border-slate-200 text-right bg-slate-100/60 font-extrabold text-slate-900">
                            {locale === "ko" ? "전체 식비 합계" : "Total Food"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {/* Row 1: 기본 제공 식사 슬롯 */}
                        <tr>
                          <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                            {locale === "ko" ? "기본 제공 식사" : "Base Meal Slots"}
                          </td>
                          {draft.selectedCities.map((city) => {
                            const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
                            const mp = foodLine && isCalculatedMealPlan(foodLine.mealPlan) ? foodLine.mealPlan : null;
                            const totalSlots = mp ? mp.slots.length : 0;
                            return (
                              <td key={city} className="p-3.5 border-l border-slate-200/60 font-bold text-slate-800">
                                {totalSlots}{locale === "ko" ? "끼 (아침/점심/저녁)" : " meals"}
                              </td>
                            );
                          })}
                          <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-700 bg-slate-50/30">
                            {draft.selectedCities.reduce((acc, city) => {
                              const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
                              const mp = foodLine && isCalculatedMealPlan(foodLine.mealPlan) ? foodLine.mealPlan : null;
                              return acc + (mp ? mp.slots.length : 0);
                            }, 0)}{locale === "ko" ? "끼" : " meals"}
                          </td>
                        </tr>

                        {/* Row 2: 특색/대체 커스텀 메뉴 */}
                        <tr>
                          <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                            {locale === "ko" ? "선택/대체 커스텀 메뉴" : "Custom Food Choices"}
                          </td>
                          {draft.selectedCities.map((city) => {
                            const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
                            const mp = foodLine && isCalculatedMealPlan(foodLine.mealPlan) ? foodLine.mealPlan : null;
                            const customItems = mp ? mp.slots.filter((s) => s.replacedByFoodItemId) : [];
                            return (
                              <td key={city} className="p-3.5 border-l border-slate-200/60">
                                {customItems.length > 0 ? (
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-extrabold text-[#e25c5c] block">
                                      {customItems.length}{locale === "ko" ? "개 음식 선택됨" : " selected"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">{locale === "ko" ? "기본 식단" : "Standard Menu"}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-600 bg-slate-50/30">
                            {draft.selectedCities.reduce((acc, city) => {
                              const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
                              const mp = foodLine && isCalculatedMealPlan(foodLine.mealPlan) ? foodLine.mealPlan : null;
                              return acc + (mp ? mp.slots.filter((s) => s.replacedByFoodItemId).length : 0);
                            }, 0)}{locale === "ko" ? "개 메뉴" : " items"}
                          </td>
                        </tr>

                        {/* Row 3: 도시별 식비 총액 */}
                        <tr className="bg-[#faf9f6]/70">
                          <td className="p-3.5 font-extrabold text-[#0f172a]">
                            {locale === "ko" ? "도시별 총 식비" : "City Subtotal"}
                          </td>
                          {draft.selectedCities.map((city) => {
                            const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
                            const total = foodLine ? foodLine.lineTotalKrw : 0;
                            return (
                              <td key={city} className="p-3.5 border-l border-slate-200/60 font-black text-[#e25c5c] text-sm">
                                {formatKrw(total)}
                              </td>
                            );
                          })}
                          <td className="p-3.5 border-l border-slate-200 text-right font-black text-[#0f172a] text-sm bg-slate-100/60">
                            {formatKrw(plan.categoryTotals["FOOD"] || 0)}
                          </td>
                        </tr>

                        {/* Row 4: 도시별 세부 식단 조정 바로가기 */}
                        <tr>
                          <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600 align-middle">
                            {locale === "ko" ? "세부 식단 조정" : "Adjust Food Menu"}
                          </td>
                          {draft.selectedCities.map((city) => (
                            <td key={city} className="p-3 border-l border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => setSelectedCityTab(city)}
                                className="px-3 py-1.5 rounded-lg border border-[#fce8e8] bg-[#faf5f5] hover:bg-[#fdeeed] text-[#e25c5c] font-extrabold text-[11px] transition-colors cursor-pointer w-full text-center"
                              >
                                {locale === "ko" ? `${CITY_KOREAN_NAMES[city] || city} 식단 편집 →` : `Edit ${city} →`}
                              </button>
                            </td>
                          ))}
                          <td className="p-3.5 border-l border-slate-200 text-right bg-slate-50/30 text-slate-400 text-[11px]">
                            {locale === "ko" ? "도시 탭 클릭 시 편집 가능" : "Click city tab to edit"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* City-by-city Detailed Food Panels */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {locale === "ko" ? "도시별 세부 식단 요약" : "Detailed Meal Plan Summaries"}
                  </h4>
                  {draft.selectedCities.map((city) => {
                    const foodLine = plan.citySections[city]?.lineItems.find((i) => i.category === "FOOD");
                    if (!foodLine || !isCalculatedMealPlan(foodLine.mealPlan)) return null;
                    return (
                      <div key={city} className="border border-slate-200/70 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-slate-800 text-sm">
                            📍 {locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedCityTab(city)}
                            className="text-xs font-bold text-[#e25c5c] hover:underline"
                          >
                            {locale === "ko" ? "이 도시 메뉴 편집하기 →" : "Edit Menu →"}
                          </button>
                        </div>
                        <FoodPlannerPanel
                          locale={locale}
                          dict={dict}
                          mealPlan={foodLine.mealPlan}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeCategory === "CITY_TRANSPORT" && selectedCityTab === "ALL" && (
              <div className="space-y-6 pt-2 border-t border-slate-100">
                {/* Transport Budget Comparison Matrix */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-1.5">
                        <span>🚌</span>
                        <span>{locale === "ko" ? "도시별 교통 예산 대조 비교표" : "Transport Budget Comparison Table"}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {locale === "ko"
                          ? "도시별 시내 대중교통 예산과 KTX/공항 이동 경비를 한눈에 대조해보세요."
                          : "Compare city transit allowances and intercity train/airport costs across cities."}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="p-3.5 w-40 shrink-0">{locale === "ko" ? "비교 항목" : "Comparison Item"}</th>
                          {draft.selectedCities.map((city) => {
                            const nights = draft.cityNightAllocations[city] || 0;
                            return (
                              <th key={city} className="p-3.5 min-w-[150px] border-l border-slate-200/60">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-900">
                                    {locale === "ko" ? (CITY_KOREAN_NAMES[city] || city) : (CITY_ENGLISH_NAMES[city] || city)}
                                  </span>
                                  <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                    {nights + 1}{locale === "ko" ? "일" : "D"}
                                  </span>
                                </div>
                              </th>
                            );
                          })}
                          <th className="p-3.5 min-w-[150px] border-l border-slate-200 bg-slate-50/90 font-bold text-slate-700">
                            {locale === "ko" ? "도시간 이동 & 공항" : "Intercity & Airport"}
                          </th>
                          <th className="p-3.5 min-w-[140px] border-l border-slate-200 text-right bg-slate-100/60 font-extrabold text-slate-900">
                            {locale === "ko" ? "전체 교통 합계" : "Total Transport"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {/* Row 1: 교통 수단 유형 */}
                        <tr>
                          <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                            {locale === "ko" ? "주요 교통 수단" : "Transit Mode"}
                          </td>
                          {draft.selectedCities.map((city) => (
                            <td key={city} className="p-3.5 border-l border-slate-200/60 font-bold text-slate-800">
                              {locale === "ko" ? "지하철 · 시내버스 (T-Money)" : "Subway & Bus (T-Money)"}
                            </td>
                          ))}
                          <td className="p-3.5 border-l border-slate-200 font-bold text-indigo-700">
                            {locale === "ko" ? "KTX 고속열차 / AREX" : "KTX Express / AREX"}
                          </td>
                          <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-400 bg-slate-50/30">
                            -
                          </td>
                        </tr>

                        {/* Row 2: 1일/1회당 단가 */}
                        <tr>
                          <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                            {locale === "ko" ? "일일 / 편도 단가" : "Daily / One-way Rate"}
                          </td>
                          {draft.selectedCities.map((city) => {
                            const line = plan.citySections[city]?.lineItems.find((i) => i.category === "CITY_TRANSPORT");
                            const dailyRate = line ? line.unitPriceKrw : 10000;
                            return (
                              <td key={city} className="p-3.5 border-l border-slate-200/60 text-slate-800">
                                {formatKrw(dailyRate)} <span className="text-[10px] text-slate-400">({locale === "ko" ? "1인 1일" : "Per Person/Day"})</span>
                              </td>
                            );
                          })}
                          <td className="p-3.5 border-l border-slate-200 text-slate-700">
                            {formatKrw(plan.intercitySection?.subtotalKrw || 0)} <span className="text-[10px] text-slate-400">({locale === "ko" ? "구간 합계" : "Intercity"})</span>
                          </td>
                          <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-400 bg-slate-50/30">
                            -
                          </td>
                        </tr>

                        {/* Row 3: 체류/이동 일수 */}
                        <tr>
                          <td className="p-3.5 bg-slate-50/40 font-bold text-slate-600">
                            {locale === "ko" ? "체류 / 이동 일수" : "Days / Trips"}
                          </td>
                          {draft.selectedCities.map((city) => {
                            const nights = draft.cityNightAllocations[city] || 0;
                            return (
                              <td key={city} className="p-3.5 border-l border-slate-200/60">
                                {nights + 1}{locale === "ko" ? "일" : " Days"}
                              </td>
                            );
                          })}
                          <td className="p-3.5 border-l border-slate-200 text-slate-700">
                            {draft.selectedCities.length > 1 ? `${draft.selectedCities.length - 1}${locale === "ko" ? "회 도시 이동" : " Intercity Transfers"}` : locale === "ko" ? "공항 이동" : "Airport Transfer"}
                          </td>
                          <td className="p-3.5 border-l border-slate-200 text-right font-bold text-slate-700 bg-slate-50/30">
                            {(draft.totalNights || 5) + 1}{locale === "ko" ? "일 전체" : " Total Days"}
                          </td>
                        </tr>

                        {/* Row 4: 도시별 & 도시간 교통비 총액 */}
                        <tr className="bg-[#faf9f6]/70">
                          <td className="p-3.5 font-extrabold text-[#0f172a]">
                            {locale === "ko" ? "구간별 교통비 총액" : "Subtotal Amount"}
                          </td>
                          {draft.selectedCities.map((city) => {
                            const line = plan.citySections[city]?.lineItems.find((i) => i.category === "CITY_TRANSPORT");
                            const total = line ? line.lineTotalKrw : 0;
                            return (
                              <td key={city} className="p-3.5 border-l border-slate-200/60 font-black text-[#e25c5c] text-sm">
                                {formatKrw(total)}
                              </td>
                            );
                          })}
                          <td className="p-3.5 border-l border-slate-200 font-black text-indigo-700 text-sm">
                            {formatKrw(plan.intercitySection?.subtotalKrw || 0)}
                          </td>
                          <td className="p-3.5 border-l border-slate-200 text-right font-black text-[#0f172a] text-sm bg-slate-100/60">
                            {formatKrw(getCombinedTransportSubtotal(plan))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === "EMERGENCY_FUND" && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-2">
                  <label htmlFor="emergency-fund-input" className="text-sm font-bold text-slate-700">
                    {dict.planner.emergencyFundManualInput}
                  </label>
                  <div className="relative rounded-xl shadow-sm max-w-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">₩</span>
                    </div>
                    <input
                      type="number"
                      name="emergencyFund"
                      id="emergency-fund-input"
                      min="0"
                      step="1"
                      className="block w-full rounded-xl border-slate-300 pl-7 pr-3 py-2 text-sm focus:border-[#e25c5c] focus:ring-[#e25c5c] focus-visible:outline-none"
                      placeholder="0"
                      value={preferences.emergencyFundKrw === 0 ? "" : (preferences.emergencyFundKrw ?? "")}
                      onChange={handleEmergencyFundChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3.5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                {locale === "ko" ? "선택된 예산 상세 정보" : "Selected Budget Details"}
              </h4>
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
                        <span>•</span>
                        <span>{dict.planner.updatedAtLabel}: {item.updatedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between md:text-right gap-4">
                      <span className="text-xs text-slate-400 italic tabular-nums md:block">
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
                {activeCategory === "ATTRACTION" && dict.planner.attractionOverrideNotice}
                {activeCategory === "EMERGENCY_FUND" && dict.planner.emergencyNotice}
              </p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT STICKY SMART RECEIPT (40%) ================= */}
        <div className="lg:col-span-4 lg:sticky lg:top-[76px] space-y-6">
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
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-[10px] bg-[#eef2ff] text-[#4f46e5] border border-[#e0e7ff] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  <span>🏛️</span>
                  <span>{locale === "ko" ? "공공데이터 검증 (KTO Verified)" : "KTO Official Verified"}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {locale === "ko" ? "한국관광공사 TourAPI 4.0 연동" : "TourAPI 4.0 Verified"}
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
                  <span className={`tabular-nums font-extrabold ${isOverBudget ? "text-red-500" : "text-[#4d7c67]"}`}>
                    {formatPercentage(plan.targetBudgetUsagePercent)}
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={plan.targetBudgetUsagePercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? "bg-red-500" : "bg-[#4d7c67]"
                      }`}
                    style={{ width: `${clampedUsage}%` }}
                  ></div>
                </div>

                <div className="text-xs flex items-center justify-between font-bold">
                  {isOverBudget ? (
                    <>
                      <span className="text-red-500">{dict.planner.overBudget}</span>
                      <span className="text-red-500 tabular-nums">+{formatKrw(plan.overBudgetAmountKrw)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400">{dict.planner.remainingBudget}</span>
                      <span className="text-[#4d7c67] tabular-nums">{formatKrw(plan.remainingBudgetKrw)}</span>
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
                      <span className="font-sans tabular-nums font-bold text-[#0f172a]">{formatKrw(item.lineTotalKrw)}</span>
                    </div>
                  ))}
                </div>
              )}

              {draft.selectedCities.map((city) => {
                const section = plan.citySections[city];
                if (!section || section.lineItems.length === 0) return null;

                const label = CITY_KOREAN_NAMES[city] || city;
                const cityNights = section.nights;

                return (
                  <div key={city} className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-extrabold text-[#0f172a]">
                        {label} <span className="text-[11px] font-bold text-slate-400">({cityNights}박)</span>
                      </h4>
                      <span className="text-xs font-extrabold text-slate-800">{formatKrw(section.subtotalKrw)}</span>
                    </div>

                    <div className="space-y-2.5 pl-1.5 border-l border-slate-100">
                      {section.lineItems.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <span className="text-slate-600 block">{getBasketLabel(item.basketId, dict, locale, item.cityCode || city)}</span>
                              <span className="text-[10px] text-slate-400 italic">{getCalculationExpression(item, dict, locale)}</span>
                            </div>
                            <span className="font-sans tabular-nums font-semibold text-slate-700">{formatKrw(item.lineTotalKrw)}</span>
                          </div>
                          {item.category === "FOOD" && isCalculatedMealPlan(item.mealPlan) && (
                            <FoodReceiptDetails
                              mealPlan={item.mealPlan}
                              locale={locale}
                              dict={dict}
                            />
                          )}
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
                        <span className="font-sans tabular-nums font-semibold text-slate-700">{formatKrw(item.lineTotalKrw)}</span>
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
                  <span className="font-sans tabular-nums font-bold text-slate-600">{formatKrw(plan.perTravelerTotalKrw)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{dict.planner.dailyAverage}</span>
                  <span className="font-sans tabular-nums font-bold text-slate-600">{formatKrw(plan.dailyAverageKrw)}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed bg-[#faf9f6] p-2.5 rounded-lg border border-slate-100">
                {dict.planner.mockDisclaimer}
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCopySummary}
                  className="w-full h-10 px-4 rounded-xl bg-white border border-slate-350 text-[#0f172a] hover:bg-slate-50 font-bold text-sm text-center transition-colors cursor-pointer"
                >
                  <span>{dict.planner.copySummaryButton}</span>
                </button>
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="w-full h-10 px-4 rounded-xl bg-[#e25c5c] text-white hover:bg-[#d14b4b] active:bg-[#c03a3a] font-bold text-sm text-center transition-colors cursor-pointer"
                >
                  <span>{dict.planner.saveTrip}</span>
                </button>
                <button
                  onClick={() => router.push(`/${locale}/report`)}
                  className="w-full h-10 px-4 rounded-xl bg-white border border-slate-350 text-[#0f172a] hover:bg-slate-50 font-bold text-sm text-center transition-colors cursor-pointer"
                >
                  <span>{dict.planner.generateReport}</span>
                </button>
                {[
                  { label: dict.planner.shareReceipt, key: "share" }
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

      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-xl shadow-lg border border-slate-700/60 font-semibold text-xs flex items-center gap-2"
        >
          <svg className="h-4 w-4 text-[#e25c5c] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Save Trip Modal */}
      {isSaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-trip-modal-title"
        >
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200/80 shadow-2xl p-6 space-y-4">
            <h3 id="save-trip-modal-title" className="text-base font-extrabold text-[#0f172a]">
              {dict.planner.saveTripModalTitle}
            </h3>
            <form onSubmit={handleSaveTripPlan} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="trip-title-input" className="text-xs font-bold text-slate-500 block">
                  {dict.planner.saveTripModalLabel}
                </label>
                <input
                  id="trip-title-input"
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder={dict.planner.saveTripModalPlaceholder}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#e25c5c] text-sm text-[#0f172a] bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSaveModalOpen(false);
                    setSaveTitle("");
                  }}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  {dict.planner.saveTripModalCancel}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-[#e25c5c] text-white hover:bg-[#d14b4b] font-bold text-xs cursor-pointer"
                >
                  {dict.planner.saveTripModalSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= ✈️ 여행 조건 수정 탭 분리형 스마트 팝오버 모달 ================= */}
      {isEditModalOpen && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#faf9f7]">
              <div>
                <h3 className="text-lg font-extrabold text-[#0f172a]">✈️ 여행 조건 수정</h3>
                <p className="text-xs text-slate-500 mt-0.5">기간, 인원, 목적지를 수정한 후 적용하여 실시간 예산을 재계산하세요.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setEditTab("NIGHTS")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  editTab === "NIGHTS"
                    ? "bg-white text-[#e25c5c] shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🗓️ 기간 ({editDraft.totalNights ? `${editDraft.totalNights}박` : "미선택"})
              </button>

              <button
                type="button"
                onClick={() => setEditTab("ADULTS")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  editTab === "ADULTS"
                    ? "bg-white text-[#e25c5c] shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👥 인원 ({editDraft.adultCount ? `${editDraft.adultCount}명` : "미선택"})
              </button>

              <button
                type="button"
                onClick={() => setEditTab("CITIES")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  editTab === "CITIES"
                    ? "bg-white text-[#e25c5c] shadow-xs border border-slate-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📍 목적지 ({editDraft.selectedCities.length}곳)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-white">
              {editError && (
                <div className="text-xs text-[#ef4444] font-semibold p-2.5 bg-red-50 border border-red-200 rounded-xl text-center">
                  ⚠️ {editError}
                </div>
              )}

              {/* Tab 1: 🗓️ 여행 기간 설정 */}
              {editTab === "NIGHTS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>여행 기간 설정 (1박 ~ 14박)</span>
                    <span className="text-[#e25c5c]">
                      {editDraft.totalNights !== null ? `${editDraft.totalNights}박 ${editDraft.totalNights + 1}일` : "미선택"}
                    </span>
                  </div>

                  <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2 bg-[#faf9f7] p-3 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleModalNightsChange(Math.max(1, (editDraft.totalNights || 5) - 1))}
                      disabled={(editDraft.totalNights || 1) <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="font-extrabold text-slate-900 text-lg block">
                        {editDraft.totalNights !== null ? `${editDraft.totalNights} Nights` : "기간 선택"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleModalNightsChange(Math.min(14, (editDraft.totalNights || 0) + 1))}
                      disabled={(editDraft.totalNights || 0) >= 14}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-2">일정 빠른 선택:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 5, 7, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleModalNightsChange(preset)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                            editDraft.totalNights === preset
                              ? "bg-[#e25c5c] border-[#e25c5c] text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {preset}박
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 👥 여행 인원 선택 */}
              {editTab === "ADULTS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>여행 인원 선택 (최대 10명)</span>
                    <span className="text-[#e25c5c]">
                      {editDraft.adultCount !== null ? `${editDraft.adultCount}명` : "미선택"}
                    </span>
                  </div>

                  <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2 bg-[#faf9f7] p-3 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleModalAdultsChange(Math.max(1, (editDraft.adultCount || 2) - 1))}
                      disabled={(editDraft.adultCount || 1) <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="font-extrabold text-slate-900 text-lg block">
                        {editDraft.adultCount !== null ? `${editDraft.adultCount} ${editDraft.adultCount === 1 ? "Person" : "People"}` : "인원 선택"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleModalAdultsChange(Math.min(10, (editDraft.adultCount || 0) + 1))}
                      disabled={(editDraft.adultCount || 0) >= 10}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white hover:bg-[#e25c5c] hover:text-white disabled:opacity-30 text-slate-800 font-bold text-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-2">인원 빠른 선택:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleModalAdultsChange(preset)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                            editDraft.adultCount === preset
                              ? "bg-[#e25c5c] border-[#e25c5c] text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {preset}명
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: 📍 여행 목적지 선택 */}
              {editTab === "CITIES" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>여행 목적지 선택 (최대 4곳)</span>
                    <span className="text-[#e25c5c]">다중 선택 ({editDraft.selectedCities.length}/4)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {ALL_CITY_OPTIONS.map((cityOpt) => {
                      const isSelected = editDraft.selectedCities.includes(cityOpt.key);
                      return (
                        <button
                          key={cityOpt.key}
                          type="button"
                          onClick={() => handleModalToggleCity(cityOpt.key)}
                          className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
                            isSelected
                              ? "bg-[#fdf2f2] border-2 border-[#e25c5c] text-slate-900 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 font-semibold hover:border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="text-[#e25c5c] font-bold">✓</span>}
                          <span>{cityOpt.nameKo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-[#faf9f7] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEditDraft(draft)}
                className="text-xs font-semibold text-slate-500 hover:text-[#e25c5c] flex items-center gap-1 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 transition-colors"
              >
                <span>↺ 초기화</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApplyTripDetailsEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#e25c5c] hover:bg-[#d14b4b] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  변경사항 적용하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
