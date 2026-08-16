"use client";

import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Dictionary } from "../lib/i18n/dictionaries/ko";
import { Locale } from "../lib/i18n/locales";
import { PlaceItem } from "../lib/places";
import { SupportedCity, ALL_SUPPORTED_CITIES, CITY_ENGLISH_NAMES } from "../lib/trip-domain";
import { PlaceCategory } from "../lib/kto/types";
import { loadSavedPlaceIds, toggleSavedPlaceId } from "../lib/storage-helper";

interface PlacesContentProps {
  locale: Locale;
  dict: Dictionary;
}

export default function PlacesContent({ locale, dict }: PlacesContentProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#e25c5c]"></div>
        </div>
      }
    >
      <PlacesContentWrapper locale={locale} dict={dict} />
    </Suspense>
  );
}

function PlacesContentWrapper({ locale, dict }: PlacesContentProps) {
  const searchParams = useSearchParams();
  return <PlacesContentInner key={searchParams.toString()} locale={locale} dict={dict} />;
}

function PlacesContentInner({ locale, dict }: PlacesContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query Parameters Parsing
  const paramCity = (searchParams.get("city") as SupportedCity | "ALL") || "ALL";
  const paramCategory = (searchParams.get("category") as PlaceCategory | "ALL") || "ALL";
  const paramQuery = searchParams.get("query") || "";
  const paramSavedOnly = searchParams.get("savedOnly") === "true";

  const [selectedCity, setSelectedCity] = useState<SupportedCity | "ALL">(
    paramCity !== "ALL" && ALL_SUPPORTED_CITIES.includes(paramCity as SupportedCity) ? (paramCity as SupportedCity) : "ALL"
  );
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | "ALL">(
    paramCategory === "ACCOMMODATION" ||
      paramCategory === "RESTAURANT" ||
      paramCategory === "CAFE" ||
      paramCategory === "ATTRACTION" ||
      paramCategory === "CULTURE"
      ? paramCategory
      : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState<string>(paramQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(paramQuery);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(paramSavedOnly);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);

  // Places fetched from API
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved place candidate IDs state
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setSavedPlaceIds(loadSavedPlaceIds());
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch places from API
  const fetchPlaces = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (selectedCity !== "ALL") params.set("city", selectedCity);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (debouncedQuery.trim()) params.set("query", debouncedQuery.trim());
      params.set("locale", locale);

      const res = await fetch(`/api/places?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setPlaces(json.data);
      } else {
        setPlaces([]);
        if (json.error) setErrorMsg(json.error);
      }
    } catch {
      setErrorMsg("Failed to load places data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, selectedCategory, debouncedQuery, locale]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // Update URL Query Parameters
  const updateQueryParams = (
    city: SupportedCity | "ALL",
    category: PlaceCategory | "ALL",
    query: string,
    savedOnly: boolean
  ) => {
    const params = new URLSearchParams();
    if (city !== "ALL") params.set("city", city);
    if (category !== "ALL") params.set("category", category);
    if (query.trim()) params.set("query", query.trim());
    if (savedOnly) params.set("savedOnly", "true");

    const queryString = params.toString();
    const newPath = `/${locale}/places${queryString ? `?${queryString}` : ""}`;
    router.replace(newPath, { scroll: false });
  };

  const handleCityChange = (city: SupportedCity | "ALL") => {
    setSelectedCity(city);
    updateQueryParams(city, selectedCategory, searchQuery, showSavedOnly);
  };

  const handleCategoryChange = (cat: PlaceCategory | "ALL") => {
    setSelectedCategory(cat);
    updateQueryParams(selectedCity, cat, searchQuery, showSavedOnly);
  };

  const handleQueryChange = (q: string) => {
    setSearchQuery(q);
    updateQueryParams(selectedCity, selectedCategory, q, showSavedOnly);
  };

  const handleToggleSavedOnly = () => {
    const nextSavedOnly = !showSavedOnly;
    setShowSavedOnly(nextSavedOnly);
    updateQueryParams(selectedCity, selectedCategory, searchQuery, nextSavedOnly);
  };

  const handleToggleSavePlace = (placeId: string) => {
    const res = toggleSavedPlaceId(placeId);
    setSavedPlaceIds(res.currentIds);
    const msg = res.isSaved
      ? dict.places.placeSavedSuccess || "장소 후보가 내 여행에 저장되었습니다."
      : dict.places.placeUnsavedSuccess || "장소 후보 저장이 해제되었습니다.";
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Places by saved status
  const displayedPlaces = useMemo(() => {
    if (!showSavedOnly) return places;
    return places.filter((p) => savedPlaceIds.includes(p.id) || savedPlaceIds.includes(p.contentId));
  }, [places, showSavedOnly, savedPlaceIds]);

  const categories: Array<{ id: PlaceCategory | "ALL"; label: string }> = [
    { id: "ALL", label: dict.places.allCategories },
    { id: "ACCOMMODATION", label: dict.places.categoryAccommodation },
    { id: "RESTAURANT", label: dict.places.categoryRestaurant },
    { id: "CAFE", label: dict.places.categoryCafe },
    { id: "ATTRACTION", label: dict.places.categoryAttraction },
    { id: "CULTURE", label: dict.places.categoryCulture },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-[1280px] mx-auto px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/${locale}/planner`}
              className="text-xs font-bold text-[#e25c5c] hover:underline focus-visible:outline-2 focus-visible:outline-[#e25c5c]"
            >
              {"\u2190"} {dict.places.backToPlanner}
            </Link>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
            {dict.places.pageTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {dict.places.pageSubtitle}
          </p>
        </div>

        {/* Live KTO & DB Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {locale === "ko" ? "한국관광공사 TourAPI 4.0 실시간 결합" : "Live KTO TourAPI 4.0 Connected"}
          </span>
        </div>
      </div>

      {/* Disclaimers & Independent Budget Banner */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-2">
        <div className="flex items-start space-x-2 font-bold">
          <span className="text-amber-600 font-extrabold text-sm">ⓘ</span>
          <span>{dict.places.disclaimerTitle}</span>
        </div>
        <p className="text-amber-800 leading-relaxed pl-5">
          • {dict.places.disclaimerBudget}
        </p>
        <p className="text-amber-800 leading-relaxed pl-5">
          • {dict.places.disclaimerOfficial}
        </p>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* City Filter */}
          <div className="sm:col-span-3">
            <label htmlFor="place-city-filter" className="block text-xs font-bold text-slate-600 mb-1">
              {dict.places.filterCity}
            </label>
            <select
              id="place-city-filter"
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value as SupportedCity | "ALL")}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#e25c5c] focus:ring-1 focus:ring-[#e25c5c]"
            >
              <option value="ALL">{dict.places.allCities}</option>
              <option value="SEOUL">Seoul (서울)</option>
              <option value="BUSAN">Busan (부산)</option>
              <option value="JEJU">Jeju (제주)</option>
              <option value="INCHEON">Incheon (인천)</option>
              <option value="GYEONGJU">Gyeongju (경주)</option>
              <option value="JEONJU">Jeonju (전주)</option>
              <option value="GANGNEUNG">Gangneung (강릉)</option>
              <option value="SUWON">Suwon (수원)</option>
              <option value="YEOSU">Yeosu (여수)</option>
              <option value="SOKCHO">Sokcho (속초)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-4">
            <label htmlFor="place-category-filter" className="block text-xs font-bold text-slate-600 mb-1">
              {dict.places.filterCategory}
            </label>
            <select
              id="place-category-filter"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as PlaceCategory | "ALL")}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#e25c5c] focus:ring-1 focus:ring-[#e25c5c]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div className="sm:col-span-5">
            <label htmlFor="place-search-input" className="block text-xs font-bold text-slate-600 mb-1">
              {dict.places.searchLabel}
            </label>
            <div className="relative">
              <input
                id="place-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={dict.places.searchPlaceholder}
                className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#e25c5c] focus:ring-1 focus:ring-[#e25c5c]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Category Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id && !showSavedOnly;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (showSavedOnly) setShowSavedOnly(false);
                  handleCategoryChange(c.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#e25c5c] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleToggleSavedOnly}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              showSavedOnly
                ? "bg-[#0f172a] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>★</span>
            <span>
              {dict.places.filterSavedOnly} ({savedPlaceIds.length})
            </span>
          </button>
        </div>
      </div>

      {/* Result Count Banner */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs sm:text-sm font-extrabold text-slate-700">
          {dict.places.countResult.replace("{count}", String(displayedPlaces.length))}
        </span>
        <span className="text-xs text-slate-400">
          {dict.places.dataSourceNotice}
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/70 p-4 space-y-3 animate-pulse">
              <div className="h-44 bg-slate-200 rounded-xl w-full"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : displayedPlaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl font-bold">
            ?
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {dict.places.noResultsTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {errorMsg || dict.places.noResultsDesc}
          </p>
          {(searchQuery || selectedCity !== "ALL" || selectedCategory !== "ALL" || showSavedOnly) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCity("ALL");
                setSelectedCategory("ALL");
                setSearchQuery("");
                setShowSavedOnly(false);
                updateQueryParams("ALL", "ALL", "", false);
              }}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPlaces.map((place) => {
            const isSaved = savedPlaceIds.includes(place.id) || savedPlaceIds.includes(place.contentId);
            return (
              <PlaceCard
                key={place.id || place.contentId}
                place={place}
                locale={locale}
                dict={dict}
                isSaved={isSaved}
                onToggleSave={() => handleToggleSavePlace(place.id || place.contentId)}
                isExpanded={expandedPlaceId === (place.id || place.contentId)}
                onToggleExpand={() =>
                  setExpandedPlaceId(
                    expandedPlaceId === (place.id || place.contentId) ? null : place.id || place.contentId
                  )
                }
              />
            );
          })}
        </div>
      )}

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
    </div>
  );
}

interface PlaceCardProps {
  place: PlaceItem;
  locale: Locale;
  dict: Dictionary;
  isSaved: boolean;
  onToggleSave: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function PlaceCard({
  place,
  locale,
  dict,
  isSaved,
  onToggleSave,
  isExpanded,
  onToggleExpand,
}: PlaceCardProps) {
  const trans = place.translations[locale] || place.translations.ko;

  const categoryLabelMap: Record<string, string> = {
    ACCOMMODATION: dict.places.categoryAccommodation,
    RESTAURANT: dict.places.categoryRestaurant,
    CAFE: dict.places.categoryCafe,
    ATTRACTION: dict.places.categoryAttraction,
    CULTURE: dict.places.categoryCulture,
  };

  const categoryLabel = categoryLabelMap[place.category] || place.category;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:border-slate-300">
      {/* Thumbnail Image Container */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {place.repImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.repImageUrl}
            alt={trans.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-slate-400 space-y-1 text-center">
            <svg
              className="w-8 h-8 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-bold">{dict.places.noImage}</span>
          </div>
        )}

        {/* City & Category Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
            {CITY_ENGLISH_NAMES[place.city as SupportedCity] || place.city}
          </span>
          <span className="bg-[#e25c5c]/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
            {categoryLabel}
          </span>
        </div>

        {/* Save Toggle Button */}
        <button
          type="button"
          aria-pressed={isSaved}
          onClick={onToggleSave}
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-colors shadow-sm cursor-pointer flex items-center gap-1 ${
            isSaved
              ? "bg-[#e25c5c] text-white hover:bg-[#d14b4b]"
              : "bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white border border-slate-200"
          }`}
        >
          <span>{isSaved ? "★" : "☆"}</span>
          <span>
            {isSaved ? dict.places.unsavePlace : dict.places.savePlace}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-[#e25c5c] border border-rose-100">
              ★ Curated
            </span>
          </div>
          <h2 className="text-base font-extrabold text-[#0f172a] line-clamp-1">
            {trans.title}
          </h2>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {trans.description || dict.places.noDescription}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {place.tags && place.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Address */}
        <div className="text-[11px] text-slate-400 truncate border-t border-slate-100 pt-2">
          📍 {trans.address || dict.places.noAddress}
        </div>
      </div>

      {/* Expand Details Area */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onToggleExpand}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center justify-center space-x-1 border border-slate-200/60"
        >
          <span>{isExpanded ? dict.places.hideDetail : dict.places.viewDetail}</span>
          <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
        </button>

        {isExpanded && (
          <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-2 text-xs text-slate-700">
            <div>
              <strong className="block text-slate-500 font-bold text-[11px]">
                {dict.places.address}
              </strong>
              <span>{trans.address || "-"}</span>
            </div>
            {place.rawUpdatedAt && (
              <div>
                <strong className="block text-slate-500 font-bold text-[11px]">
                  {dict.places.updatedAt}
                </strong>
                <span>{place.rawUpdatedAt}</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-slate-200/50 text-[10px] text-amber-800 leading-tight">
              {dict.places.officialNotice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
