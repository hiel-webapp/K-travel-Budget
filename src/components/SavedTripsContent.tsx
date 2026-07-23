"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  loadSavedTrips,
  deleteSavedTrip,
  restoreSavedTrip,
  SavedTripItem,
} from "../lib/storage-helper";
import { generateInitialBudgetPlan } from "../features/budget/calculations/engine";
import { MOCK_PRICE_CATALOG } from "../features/budget/catalog/mock-catalog";
import { formatKrw } from "../features/budget/presentation/formatters";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface SavedTripsContentProps {
  locale: Locale;
  dict: Dictionary;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function SavedTripsContent({ locale, dict }: SavedTripsContentProps) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [trips, setTrips] = useState<SavedTripItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return loadSavedTrips();
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLoadTrip = (id: string) => {
    const success = restoreSavedTrip(id);
    if (success) {
      setToastMessage(dict.planner.savedTripsSuccessLoad);
      setTimeout(() => {
        setToastMessage(null);
        router.push(`/${locale}/planner`);
      }, 1500);
    }
  };

  const handleDeleteTrip = (id: string) => {
    const confirmed = window.confirm(dict.planner.savedTripsConfirmDelete);
    if (confirmed) {
      const success = deleteSavedTrip(id);
      if (success) {
        setTrips(loadSavedTrips());
        setToastMessage(dict.planner.savedTripsDeleteSuccess);
        setTimeout(() => setToastMessage(null), 2000);
      }
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#e25c5c]"></div>
          <p className="text-sm font-medium text-slate-500">Loading saved trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-6">
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

      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-[#0f172a] sm:text-2xl tracking-tight">
          {dict.planner.savedTripsTitle}
        </h2>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-4">
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {dict.planner.savedTripsEmpty}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => router.push(`/${locale}/planner`)}
              className="inline-flex h-9 px-5 items-center justify-center rounded-xl bg-[#e25c5c] text-white hover:bg-[#d14b4b] font-bold text-xs transition-colors cursor-pointer"
            >
              {dict.navigation.planner || "Planner"}
            </button>
            <button
              onClick={() => router.push(`/${locale}/places`)}
              className="inline-flex h-9 px-5 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {dict.navigation.places || "장소 탐색"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((trip) => {
            // Budget Engine을 이용하여 파생 예산액을 안전하고 유기적으로 실시간 계산하여 바인딩
            const plan = generateInitialBudgetPlan(trip.draft, MOCK_PRICE_CATALOG, {
              accommodation: trip.preferences.accommodationByCity,
              food: trip.preferences.foodOverrides,
              foodAddOns: trip.preferences.addOnSelections,
              attraction: trip.preferences.attractionByCity,
            });

            const citiesStr = trip.draft.selectedCities
              .map((c) => (c === "SEOUL" ? "Seoul" : "Busan"))
              .join(" · ");

            const formattedDate = new Date(trip.savedAt).toLocaleString(
              locale === "ko" ? "ko-KR" : "en-US",
              {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-350 transition-colors flex flex-col justify-between h-56 space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-extrabold text-[#0f172a] truncate max-w-[70%]">
                      {trip.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dict.planner.savedTripsDateLabel}: {formattedDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cities & Duration
                      </span>
                      <span className="font-semibold text-slate-700">
                        {citiesStr} ({trip.draft.totalNights} nights)
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Travelers
                      </span>
                      <span className="font-semibold text-slate-700">
                        {trip.draft.adultCount} {trip.draft.adultCount === 1 ? "Adult" : "Adults"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Budget
                    </span>
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-extrabold text-[#e25c5c]">
                        {formatKrw(plan.grandTotalKrw)}
                      </strong>
                      {trip.savedPlaceIds && trip.savedPlaceIds.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                          ★ {trip.savedPlaceIds.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                    >
                      {dict.planner.savedTripsDeleteButton}
                    </button>
                    <button
                      onClick={() => handleLoadTrip(trip.id)}
                      className="h-8 px-3 rounded-lg bg-[#e25c5c] text-white hover:bg-[#d14b4b] font-bold text-xs cursor-pointer transition-colors"
                    >
                      {dict.planner.savedTripsLoadButton}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
