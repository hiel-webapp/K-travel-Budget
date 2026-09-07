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
      paramCategory === "LANDMARK" ||
      paramCategory === "NATURE" ||
      paramCategory === "ENTERTAINMENT" ||
      paramCategory === "SHOPPING" ||
      paramCategory === "ATTRACTION" ||
      paramCategory === "CULTURE"
      ? paramCategory
      : "ALL"
  );
  const [searchQuery, setSearchQuery] = useState<string>(paramQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(paramQuery);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(paramSavedOnly);
  const [previewPlace, setPreviewPlace] = useState<PlaceItem | null>(null);

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
      params.set("limit", "100");

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

  const categories: Array<{ id: PlaceCategory | "ALL"; label: string; icon?: string }> = [
    { id: "ALL", label: dict.places.allCategories, icon: "" },
    { id: "ACCOMMODATION", label: dict.places.categoryAccommodation || "숙소", icon: "🏨" },
    { id: "RESTAURANT", label: dict.places.categoryRestaurant || "음식점", icon: "🍽️" },
    { id: "CAFE", label: dict.places.categoryCafe || "카페", icon: "☕" },
    { id: "LANDMARK", label: (dict.places as any).categoryLandmark || "명소", icon: "🏛️" },
    { id: "NATURE", label: (dict.places as any).categoryNature || "자연", icon: "🌿" },
    { id: "ENTERTAINMENT", label: (dict.places as any).categoryEntertainment || "엔터", icon: "🎡" },
    { id: "SHOPPING", label: (dict.places as any).categoryShopping || "쇼핑", icon: "🛍️" },
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-[#e25c5c] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.icon && <span>{c.icon}</span>}
                <span>{c.label}</span>
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
                onPreview={() => setPreviewPlace(place)}
              />
            );
          })}
        </div>
      )}

      {/* City Attraction Large Detail Modal (플래너와 동일한 대형 팝업창) */}
      {previewPlace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewPlace(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative w-full aspect-[16/10] bg-slate-900 shrink-0">
              {previewPlace.repImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewPlace.repImageUrl}
                  alt={previewPlace.translations[locale]?.title || previewPlace.translations.ko.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white text-4xl">
                  🏛️
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewPlace(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer text-lg font-bold z-10"
                title={locale === "ko" ? "닫기" : "Close"}
              >
                ✕
              </button>

              {/* Category & Price badges */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                {(() => {
                  const cat = previewPlace.categoryType || (
                    previewPlace.category === "LANDMARK" ? "명소" :
                    previewPlace.category === "NATURE" ? "자연" :
                    previewPlace.category === "ENTERTAINMENT" ? "엔터" :
                    previewPlace.category === "SHOPPING" ? "쇼핑" :
                    previewPlace.category === "ACCOMMODATION" ? "숙소" :
                    previewPlace.category === "RESTAURANT" ? "음식점" :
                    previewPlace.category === "CAFE" ? "카페" : "명소"
                  );
                  const badgeMap: Record<string, { label: string; icon: string; bg: string }> = {
                    명소: { label: (dict.places as any).categoryLandmark || "명소", icon: "🏛️", bg: "bg-blue-600/90 text-white" },
                    자연: { label: (dict.places as any).categoryNature || "자연", icon: "🌿", bg: "bg-emerald-600/90 text-white" },
                    엔터: { label: (dict.places as any).categoryEntertainment || "엔터", icon: "🎡", bg: "bg-purple-600/90 text-white" },
                    쇼핑: { label: (dict.places as any).categoryShopping || "쇼핑", icon: "🛍️", bg: "bg-pink-600/90 text-white" },
                    숙소: { label: dict.places.categoryAccommodation || "숙소", icon: "🏨", bg: "bg-indigo-600/90 text-white" },
                    음식점: { label: dict.places.categoryRestaurant || "음식점", icon: "🍽️", bg: "bg-rose-600/90 text-white" },
                    카페: { label: dict.places.categoryCafe || "카페", icon: "☕", bg: "bg-amber-600/90 text-white" },
                  };
                  const badge = badgeMap[cat] || badgeMap["명소"];
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1 ${badge.bg}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}

                {previewPlace.priceKrw && previewPlace.priceKrw > 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/90 text-white shadow-md backdrop-blur-md">
                    ₩{previewPlace.priceKrw.toLocaleString()}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md">
                    {locale === "ko" ? "무료 입장" : "Free Admission"}
                  </span>
                )}
              </div>

              {/* Title on bottom of image */}
              <div className="absolute bottom-4 left-5 right-5 text-white z-10">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  {CITY_ENGLISH_NAMES[previewPlace.city as SupportedCity] || previewPlace.city}
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                  {previewPlace.translations[locale]?.title || previewPlace.translations.ko.title}
                </h3>
              </div>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Detailed Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {locale === "ko" ? "장소 소개" : "About"}
                </h4>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  {previewPlace.translations[locale]?.description ||
                    previewPlace.translations.ko.description ||
                    dict.places.noDescription}
                </p>
              </div>

              {/* Key Visitor Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                {(previewPlace.subwayInfo || previewPlace.translations[locale]?.address || previewPlace.translations.ko.address) && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <span className="text-base shrink-0">🚇</span>
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                        {locale === "ko" ? "교통 / 위치" : "Transit / Location"}
                      </span>
                      <span className="text-slate-600">
                        {previewPlace.subwayInfo || previewPlace.translations[locale]?.address || previewPlace.translations.ko.address}
                      </span>
                    </div>
                  </div>
                )}
                {previewPlace.closedDays && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <span className="text-base shrink-0">⏱️</span>
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                        {locale === "ko" ? "휴무일" : "Closed Days"}
                      </span>
                      <span className="text-slate-600">{previewPlace.closedDays}</span>
                    </div>
                  </div>
                )}
                {(previewPlace.openingHours || previewPlace.useTime) && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 sm:col-span-2">
                    <span className="text-base shrink-0">🕒</span>
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">
                        {locale === "ko" ? "운영시간 / 이용정보" : "Opening Hours"}
                      </span>
                      <span className="text-slate-600">{previewPlace.openingHours || previewPlace.useTime}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {previewPlace.tags && previewPlace.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {previewPlace.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {previewPlace.officialLink && (
                  <a
                    href={previewPlace.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50/50 border border-slate-200 transition-colors"
                  >
                    <span>🗺️</span>
                    <span>{locale === "ko" ? "네이버 지도" : "Map Link"}</span>
                    <span>↗</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleSavePlace(previewPlace.id || previewPlace.contentId);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    savedPlaceIds.includes(previewPlace.id) || savedPlaceIds.includes(previewPlace.contentId)
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{savedPlaceIds.includes(previewPlace.id) || savedPlaceIds.includes(previewPlace.contentId) ? "★" : "☆"}</span>
                  <span>
                    {savedPlaceIds.includes(previewPlace.id) || savedPlaceIds.includes(previewPlace.contentId)
                      ? (locale === "ko" ? "저장됨" : "Saved")
                      : (locale === "ko" ? "후보 저장" : "Save")}
                  </span>
                </button>
              </div>

              <Link
                href={`/${locale}/planner`}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-[#0f172a] hover:bg-slate-800 transition-colors shadow-sm"
              >
                {locale === "ko" ? "플래너로 이동 ➔" : "Go to Planner ➔"}
              </Link>
            </div>
          </div>
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
  onPreview: () => void;
}

function PlaceCard({
  place,
  locale,
  dict,
  isSaved,
  onToggleSave,
  onPreview,
}: PlaceCardProps) {
  const trans = place.translations[locale] || place.translations.ko;

  const categoryBadgeMap: Record<string, { label: string; icon: string; bg: string }> = {
    LANDMARK: { label: (dict.places as any).categoryLandmark || "명소", icon: "🏛️", bg: "bg-blue-50 text-blue-700 border-blue-200/90" },
    NATURE: { label: (dict.places as any).categoryNature || "자연", icon: "🌿", bg: "bg-emerald-50 text-emerald-700 border-emerald-200/90" },
    ENTERTAINMENT: { label: (dict.places as any).categoryEntertainment || "엔터", icon: "🎡", bg: "bg-purple-50 text-purple-700 border-purple-200/90" },
    SHOPPING: { label: (dict.places as any).categoryShopping || "쇼핑", icon: "🛍️", bg: "bg-pink-50 text-pink-700 border-pink-200/90" },
    ACCOMMODATION: { label: dict.places.categoryAccommodation || "숙소", icon: "🏨", bg: "bg-indigo-50 text-indigo-700 border-indigo-200/90" },
    RESTAURANT: { label: dict.places.categoryRestaurant || "음식점", icon: "🍽️", bg: "bg-rose-50 text-rose-700 border-rose-200/90" },
    CAFE: { label: dict.places.categoryCafe || "카페", icon: "☕", bg: "bg-amber-50 text-amber-700 border-amber-200/90" },
    ATTRACTION: { label: (dict.places as any).categoryLandmark || "명소", icon: "🏛️", bg: "bg-blue-50 text-blue-700 border-blue-200/90" },
    CULTURE: { label: (dict.places as any).categoryEntertainment || "엔터", icon: "🎡", bg: "bg-purple-50 text-purple-700 border-purple-200/90" },
  };

  const badge = categoryBadgeMap[place.category] || {
    label: place.category,
    icon: "📍",
    bg: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      {/* Thumbnail Image Container */}
      <div
        onClick={onPreview}
        className="relative h-48 w-full bg-slate-100 overflow-hidden flex items-center justify-center cursor-pointer"
        title={locale === "ko" ? "클릭하여 사진 및 상세정보 크게 보기" : "Click to view photo & details"}
      >
        {place.repImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.repImageUrl}
            alt={trans.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=600&q=80";
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-slate-400 space-y-1 text-center">
            <span className="text-3xl">{badge.icon}</span>
            <span className="text-xs font-bold">{dict.places.noImage}</span>
          </div>
        )}

        {/* Hover zoom overlay hint */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[1px]">
          <span className="text-base">🔍</span>
          <span>{locale === "ko" ? "크게 보기" : "Zoom"}</span>
        </div>

        {/* City & Category Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
          <span className="bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
            {CITY_ENGLISH_NAMES[place.city as SupportedCity] || place.city}
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border backdrop-blur-md flex items-center gap-0.5 ${badge.bg}`}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Save Toggle Button */}
        <button
          type="button"
          aria-pressed={isSaved}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-colors shadow-sm cursor-pointer flex items-center gap-1 z-10 ${
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
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-[#e25c5c] border border-rose-100">
              ★ Curated Spot
            </span>
            {place.priceKrw !== undefined && place.priceKrw > 0 ? (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                ₩{place.priceKrw.toLocaleString()}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {locale === "ko" ? "무료 입장" : "Free"}
              </span>
            )}
          </div>
          <h2
            onClick={onPreview}
            className="text-base font-extrabold text-[#0f172a] line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {trans.title}
          </h2>
          <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
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

        {/* Address / Subway */}
        <div className="text-[11px] text-slate-500 truncate border-t border-slate-100 pt-2">
          {place.subwayInfo ? `🚇 ${place.subwayInfo}` : `📍 ${trans.address || dict.places.noAddress}`}
        </div>
      </div>
    </div>
  );
}
