"use client";

import React, { useState, useEffect } from "react";
import { SupportedCity, TripDraft, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES, sortCitiesByStandardOrder } from "../lib/trip-domain";
import { IntercityTransportMode, IntercityFareInfo, getIntercityFareOptions } from "../lib/transport/intercity-fares";
import { formatKrw } from "../features/budget/presentation/formatters";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface TransportPlannerPanelProps {
  draft: TripDraft;
  intercityOverrides: Record<string, IntercityTransportMode>;
  onSelectIntercityOverride: (routeKey: string, mode: IntercityTransportMode) => void;
  onReorderCities?: (newCities: SupportedCity[]) => void;
  locale: Locale;
  dict: Dictionary;
}

export default function TransportPlannerPanel({
  draft,
  intercityOverrides,
  onSelectIntercityOverride,
  onReorderCities,
  locale,
  dict,
}: TransportPlannerPanelProps) {
  const selectedCities = draft.selectedCities || [];
  const adultCount = draft.adultCount || 1;
  const isMultiCity = selectedCities.length >= 2;

  // Real-time drag and drop state
  const [dragCity, setDragCity] = useState<SupportedCity | null>(null);
  const [isGhostCaptured, setIsGhostCaptured] = useState<boolean>(false);
  const [activeCities, setActiveCities] = useState<SupportedCity[]>(selectedCities);

  // Info popover state
  const [showRouteInfo, setShowRouteInfo] = useState<boolean>(false);

  // Keep state in sync with props when not dragging
  useEffect(() => {
    if (dragCity === null) {
      setActiveCities(selectedCities);
      setIsGhostCaptured(false);
    }
  }, [selectedCities, dragCity]);

  const getCityName = (city: SupportedCity) => {
    return locale === "ko"
      ? CITY_KOREAN_NAMES[city] || city
      : CITY_ENGLISH_NAMES[city] || city;
  };

  // 최적 동선 자동 정렬
  const handleOptimizeRoute = () => {
    if (!onReorderCities) return;
    const sorted = sortCitiesByStandardOrder(selectedCities);
    onReorderCities(sorted);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, city: SupportedCity) => {
    setDragCity(city);
    setIsGhostCaptured(false);
    setActiveCities([...selectedCities]);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", city);

    setTimeout(() => {
      setIsGhostCaptured(true);
    }, 0);
  };

  const handleDragOverCard = (e: React.DragEvent, targetCity: SupportedCity) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!dragCity || dragCity === targetCity) return;

    const currentList = [...activeCities];
    const fromIndex = currentList.indexOf(dragCity);
    const toIndex = currentList.indexOf(targetCity);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, dragCity);
      setActiveCities(currentList);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onReorderCities && activeCities.length > 0) {
      onReorderCities(activeCities);
    }
    setDragCity(null);
    setIsGhostCaptured(false);
  };

  const handleDragEnd = () => {
    if (onReorderCities && activeCities.length > 0) {
      onReorderCities(activeCities);
    }
    setDragCity(null);
    setIsGhostCaptured(false);
  };

  const displayCities = dragCity !== null ? activeCities : selectedCities;

  return (
    <div className="space-y-6">
      {/* 군더더기 없이 깨끗하고 심플한 단일 여행 동선 박스 */}
      <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
          {/* Left: Title & Info Button */}
          <div className="relative flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#0f172a]">
              {locale === "ko" ? "여행 동선" : "Travel Route"}
            </h3>
            <button
              type="button"
              onClick={() => setShowRouteInfo(!showRouteInfo)}
              className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                showRouteInfo
                  ? "bg-[#0f172a] text-white border-[#0f172a]"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={locale === "ko" ? "설명 보기" : "View Info"}
            >
              Info
            </button>

            {/* Info Popover Tooltip */}
            {showRouteInfo && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowRouteInfo(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-3.5 bg-slate-900 text-white text-[11px] font-normal leading-relaxed rounded-xl shadow-xl z-40 border border-slate-700 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-slate-200">
                    • {locale === "ko"
                      ? "도시 간 이동 구간별 최적의 교통 수단(KTX, 고속버스, 항공 등)을 선택하세요. 선택된 단가가 전체 여행 예산에 실시간 반영됩니다."
                      : "Select optimal transit options for each segment."}
                  </p>
                  {isMultiCity && (
                    <p className="text-slate-300">
                      • {locale === "ko"
                        ? "목적지 카드를 마우스로 끌어 이동하면 주변 카드가 실시간으로 밀려나며 순서가 변경됩니다."
                        : "Drag destination cards to rearrange the travel sequence in real-time."}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Auto Route Optimization Button */}
          {isMultiCity && onReorderCities && (
            <button
              type="button"
              onClick={handleOptimizeRoute}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              {locale === "ko" ? "최적 동선 자동 정렬" : "Auto Optimize Route"}
            </button>
          )}
        </div>

        {/* 섹션 중앙 정렬 (Center Alignment) 처리된 도시 카드 드래그 앤 드롭 목록 */}
        {isMultiCity && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={handleDrop}
            className="flex flex-wrap items-center justify-center gap-2 pt-1 min-h-[48px]"
          >
            {displayCities.map((city, idx) => {
              const isBeingDragged = dragCity === city;
              const isSlotHidden = isBeingDragged && isGhostCaptured;

              return (
                <div
                  key={city}
                  draggable={!!onReorderCities}
                  onDragStart={(e) => handleDragStart(e, city)}
                  onDragOver={(e) => handleDragOverCard(e, city)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 ease-out cursor-grab active:cursor-grabbing select-none shrink-0 ${
                    isSlotHidden
                      ? "opacity-0 border-transparent pointer-events-none"
                      : isBeingDragged
                      ? "bg-white border-slate-300 shadow-md"
                      : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/60"
                  }`}
                >
                  {/* Grip Icon */}
                  <div className="text-slate-300 group-hover:text-slate-400 text-xs font-bold flex flex-col gap-0.5 leading-none">
                    <span>⋮</span>
                    <span>⋮</span>
                  </div>

                  {/* Dynamic Step Number Badge */}
                  <span className="w-5 h-5 rounded-full bg-[#0f172a] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>

                  {/* City Name */}
                  <span className="text-xs font-extrabold text-[#0f172a] tracking-tight">
                    {getCityName(city)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Banner for Upcoming Auto-Optimization Feature */}
        {isMultiCity && (
          <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/70 text-[11px] text-blue-900 font-medium leading-relaxed flex items-center gap-2">
            <span className="font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] shrink-0">
              {locale === "ko" ? "기능 개발 예정" : "Upcoming Feature"}
            </span>
            <span>
              {locale === "ko"
                ? "추후 여행 리포트 기능 완성 시, 선택한 도시의 실제 관광 코스 정보 기반으로 최적 동선이 자동 연결될 예정입니다."
                : "Auto route optimization based on city tour courses will be supported with upcoming Trip Reports."}
            </span>
          </div>
        )}
      </div>

      {/* Part 1: 도시 간 이동 구간 카드 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-[#0f172a]">
              {locale === "ko" ? "도시 간 이동 구간" : "Intercity Transit Segments"}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200/60">
              {isMultiCity ? `${selectedCities.length - 1}${locale === "ko" ? "개 구간" : " segments"}` : locale === "ko" ? "단일 도시" : "Single City"}
            </span>
          </div>
        </div>

        {!isMultiCity ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
            <h5 className="text-xs font-bold text-[#0f172a]">
              {locale === "ko" ? "단일 도시 여행입니다" : "Single City Trip"}
            </h5>
            <p className="text-xs text-slate-500">
              {locale === "ko"
                ? `${getCityName(selectedCities[0])} 단일 탐방 일정으로 도시 간 이동 교통비가 별도로 발생하지 않습니다.`
                : `No intercity transportation required for single city trip to ${getCityName(selectedCities[0])}.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {Array.from({ length: selectedCities.length - 1 }).map((_, idx) => {
              const fromCity = selectedCities[idx];
              const toCity = selectedCities[idx + 1];
              const routeKey = `${fromCity}-${toCity}`;
              const options = getIntercityFareOptions(fromCity, toCity);

              const currentOverrideMode = intercityOverrides[routeKey] || intercityOverrides[`${toCity}-${fromCity}`];
              const activeOption = (currentOverrideMode && options.find((o) => o.mode === currentOverrideMode))
                || options.find((o) => o.isDefault)
                || options[0];

              const totalSegmentKrw = activeOption.oneWayPriceKrw * adultCount;

              return (
                <div
                  key={routeKey}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                >
                  {/* Route Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 font-black text-[#0f172a] text-sm">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs">
                        {getCityName(fromCity)}
                      </span>
                      <span className="text-slate-400 font-normal">──►</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs">
                        {getCityName(toCity)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-medium">
                        {locale === "ko" ? "소계:" : "Subtotal:"}
                      </span>
                      <strong className="text-[#e25c5c] font-black text-sm">
                        {formatKrw(totalSegmentKrw)}
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        ({formatKrw(activeOption.oneWayPriceKrw)} × {adultCount}{locale === "ko" ? "명" : ""})
                      </span>
                    </div>
                  </div>

                  {/* Mode Option Chips */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 block">
                      {locale === "ko" ? "이동 수단 선택" : "Select Transit Mode"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {options.map((opt) => {
                        const isSelected = activeOption.mode === opt.mode;
                        const badgeText = locale === "ko" ? opt.badgeTextKo : opt.badgeTextEn;

                        return (
                          <button
                            key={opt.mode}
                            type="button"
                            onClick={() => onSelectIntercityOverride(routeKey, opt.mode)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? "bg-[#0f172a] text-white border-[#0f172a] shadow-xs ring-1 ring-[#0f172a]"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center font-extrabold text-xs">
                                <span className={isSelected ? "text-white" : "text-[#0f172a]"}>
                                  {locale === "ko" ? opt.nameKo : opt.nameEn}
                                </span>
                              </div>
                              {badgeText && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight ${
                                    isSelected
                                      ? "bg-[#e25c5c] text-white"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {badgeText}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-medium opacity-90">
                              <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                                {locale === "ko" ? opt.durationTextKo : opt.durationTextEn}
                              </span>
                              <strong className={isSelected ? "text-amber-300 font-black text-xs" : "text-[#0f172a] font-extrabold text-xs"}>
                                {formatKrw(opt.oneWayPriceKrw)}
                              </strong>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Part 2: 도시 내 대중교통 정보 */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
          <h4 className="text-sm font-extrabold text-[#0f172a]">
            {locale === "ko" ? "도시 내 대중교통 알뜰 패스 정보" : "City Transit Info"}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {selectedCities.map((city) => (
            <div key={city} className="p-3 rounded-xl bg-[#faf9f6]/80 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#0f172a]">
                  {getCityName(city)} {locale === "ko" ? "시내 교통" : "Local Transit"}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  T-Money {locale === "ko" ? "연동" : "Compatible"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {locale === "ko"
                  ? `${getCityName(city)} 시내 이동은 지하철 및 시내버스 기본 알뜰 패스로 자유롭게 탐방 가능합니다.`
                  : `Subway and bus passes are available in ${getCityName(city)}.`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
