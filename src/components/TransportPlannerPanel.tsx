"use client";

import React, { useState, useEffect } from "react";
import { SupportedCity, TripDraft, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES, sortCitiesByStandardOrder } from "../lib/trip-domain";
import { IntercityTransportMode, IntercityFareInfo, getIntercityFareOptions, getAirportTransitOptions, AIRPORT_INFO_MAP } from "../lib/transport/intercity-fares";
import { LOCAL_TRANSIT_OPTIONS, LocalTransitOptionDef } from "../features/budget/catalog/mock-catalog";
import { LocalTransitStyle } from "../features/budget/domain/types";
import { formatKrw } from "../features/budget/presentation/formatters";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface TransportPlannerPanelProps {
  draft: TripDraft;
  intercityOverrides: Record<string, IntercityTransportMode>;
  onSelectIntercityOverride: (routeKey: string, mode: IntercityTransportMode) => void;
  onReorderCities?: (newCities: SupportedCity[]) => void;
  localTransitStyle?: LocalTransitStyle;
  onSelectLocalTransitStyle?: (style: LocalTransitStyle) => void;
  locale: Locale;
  dict: Dictionary;
}

export default function TransportPlannerPanel({
  draft,
  intercityOverrides,
  onSelectIntercityOverride,
  onReorderCities,
  localTransitStyle = "STANDARD_MIX",
  onSelectLocalTransitStyle,
  locale,
  dict,
}: TransportPlannerPanelProps) {
  const selectedCities = draft.selectedCities || [];
  const adultCount = draft.adultCount || 1;
  const isMultiCity = selectedCities.length >= 2;

  const firstCity = selectedCities[0] || "SEOUL";
  const lastCity = selectedCities[selectedCities.length - 1] || "SEOUL";

  // Real-time drag and drop state
  const [dragCity, setDragCity] = useState<SupportedCity | null>(null);
  const [isGhostCaptured, setIsGhostCaptured] = useState<boolean>(false);
  const [activeCities, setActiveCities] = useState<SupportedCity[]>(selectedCities);

  // Info popover state
  const [showRouteInfo, setShowRouteInfo] = useState<boolean>(false);
  const [showEvidenceTooltip, setShowEvidenceTooltip] = useState<LocalTransitStyle | null>(null);

  // Custom airport selector state (default: Incheon)
  const [entryAirport, setEntryAirport] = useState<"INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT">("INCHEON");
  const [exitAirport, setExitAirport] = useState<"INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT">("INCHEON");
  const [showCustomAirportToggle, setShowCustomAirportToggle] = useState<boolean>(false);
  const [showExitAirportToggle, setShowExitAirportToggle] = useState<boolean>(false);

  // Keep state in sync with props when not dragging
  useEffect(() => {
    if (dragCity === null) {
      setActiveCities(selectedCities);
      setIsGhostCaptured(false);
    }
  }, [selectedCities, dragCity]);

  const getCityName = (city: SupportedCity | "INCHEON") => {
    if (city === "INCHEON") return locale === "ko" ? "인천국제공항" : "Incheon Int'l Airport";
    return locale === "ko"
      ? CITY_KOREAN_NAMES[city] || city
      : CITY_ENGLISH_NAMES[city] || city;
  };

  const getAirportDisplayName = (airportKey: string) => {
    const info = AIRPORT_INFO_MAP[airportKey] || AIRPORT_INFO_MAP.INCHEON;
    return locale === "ko" ? info.nameKo : `${info.nameEn} (${info.code})`;
  };

  // 최적 동선 자동 정렬
  const handleOptimizeRoute = () => {
    if (!onReorderCities) return;
    const sorted = sortCitiesByStandardOrder(selectedCities);
    onReorderCities(sorted);
  };

  // Drag & Drop Handlers with Clean Drag Image
  const handleDragStart = (e: React.DragEvent, city: SupportedCity) => {
    setDragCity(city);
    setIsGhostCaptured(false);
    setActiveCities([...selectedCities]);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", city);

    const ghostEl = document.createElement("div");
    ghostEl.style.position = "absolute";
    ghostEl.style.top = "-9999px";
    ghostEl.style.left = "-9999px";
    ghostEl.style.padding = "8px 14px";
    ghostEl.style.borderRadius = "12px";
    ghostEl.style.backgroundColor = "#ffffff";
    ghostEl.style.border = "1.5px solid #cbd5e1";
    ghostEl.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
    ghostEl.style.fontSize = "12px";
    ghostEl.style.fontWeight = "800";
    ghostEl.style.color = "#0f172a";
    ghostEl.style.display = "flex";
    ghostEl.style.alignItems = "center";
    ghostEl.style.gap = "8px";
    ghostEl.innerHTML = `<span style="color:#94a3b8;font-weight:bold;">⋮⋮</span><span>${getCityName(city)}</span>`;
    document.body.appendChild(ghostEl);

    e.dataTransfer.setDragImage(ghostEl, 20, 20);

    setTimeout(() => {
      document.body.removeChild(ghostEl);
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

  // 1. Entry Airport Transit Options
  const entryRouteKey = `ENTRY_${entryAirport}-${firstCity}`;
  const entryOptions = getAirportTransitOptions(entryAirport, firstCity);
  const currentEntryOverride = intercityOverrides[entryRouteKey] || intercityOverrides[`ENTRY_AIRPORT-${firstCity}`] || intercityOverrides[`INCHEON-${firstCity}`];
  const activeEntryOption = (currentEntryOverride && entryOptions.find((o) => o.mode === currentEntryOverride))
    || entryOptions.find((o) => o.isDefault)
    || entryOptions[0];
  const entryTotalKrw = activeEntryOption.oneWayPriceKrw * adultCount;

  // 2. Exit Airport Transit Options
  const exitRouteKey = `EXIT_${lastCity}-${exitAirport}`;
  const exitOptions = getAirportTransitOptions(exitAirport, lastCity);
  const currentExitOverride = intercityOverrides[exitRouteKey] || intercityOverrides[`EXIT_${lastCity}-AIRPORT`] || intercityOverrides[`${lastCity}-INCHEON`];
  const activeExitOption = (currentExitOverride && exitOptions.find((o) => o.mode === currentExitOverride))
    || exitOptions.find((o) => o.isDefault)
    || exitOptions[0];
  const exitTotalKrw = activeExitOption.oneWayPriceKrw * adultCount;

  // 공항 선택 핸들러
  const handleSelectEntryAirport = (newAirport: "INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT") => {
    setEntryAirport(newAirport);
    const newOptions = getAirportTransitOptions(newAirport, firstCity);
    const defaultMode = newOptions.find((o) => o.isDefault)?.mode || newOptions[0].mode;
    onSelectIntercityOverride(`ENTRY_${newAirport}-${firstCity}`, defaultMode);
  };

  const handleSelectExitAirport = (newAirport: "INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT") => {
    setExitAirport(newAirport);
    const newOptions = getAirportTransitOptions(newAirport, lastCity);
    const defaultMode = newOptions.find((o) => o.isDefault)?.mode || newOptions[0].mode;
    onSelectIntercityOverride(`EXIT_${lastCity}-${newAirport}`, defaultMode);
  };

  return (
    <div className="space-y-6">
      {/* 여행 동선 개요 박스 */}
      <div className="bg-[#faf5f5] border border-[#fce8e8] p-4 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 border-b border-[#fce8e8] pb-2.5">
          <div className="relative flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-[#0f172a]">
              {locale === "ko" ? "여행 전체 동선 (공항 ➔ 도시 ➔ 공항)" : "Travel Route Sequence"}
            </h4>
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

            {showRouteInfo && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowRouteInfo(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-3.5 bg-slate-900 text-white text-[11px] font-normal leading-relaxed rounded-xl shadow-xl z-40 border border-slate-700 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-slate-200">
                    • {locale === "ko"
                      ? "한국 입국 시 공항 이동부터 도시 간 이동, 귀국 공항 복귀까지의 전 여정 교통비가 1원 단위로 정확히 계산됩니다."
                      : "Accurate transit cost calculation from airport arrival, intercity travel, to airport departure."}
                  </p>
                  {isMultiCity && (
                    <p className="text-slate-300">
                      • {locale === "ko"
                        ? "도시 카드를 마우스로 끌어 이동하면 방문 순서가 실시간으로 변경됩니다."
                        : "Drag destination cards to rearrange the travel sequence in real-time."}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

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

        {/* 방문 도시 순서 (드래그 앤 드롭) */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-700 overflow-x-auto no-scrollbar py-0.5">
          <span className="px-2.5 py-1 rounded-lg bg-[#0f172a] text-white flex items-center gap-1 shrink-0 text-[11px] sm:text-xs font-extrabold shadow-2xs">
            <span>🛫</span>
            <span className="whitespace-nowrap">{getAirportDisplayName(entryAirport)}</span>
          </span>
          <span className="text-slate-300 shrink-0 text-[11px]">➔</span>

          {displayCities.map((city, idx) => (
            <React.Fragment key={city}>
              <div
                draggable={!!onReorderCities && isMultiCity}
                onDragStart={(e) => handleDragStart(e, city)}
                onDragOver={(e) => handleDragOverCard(e, city)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 shadow-2xs flex items-center gap-1.5 cursor-grab active:cursor-grabbing shrink-0 text-[11px] sm:text-xs font-extrabold hover:border-slate-300 transition-all"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-rose-100 text-[#e25c5c] text-[9px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="whitespace-nowrap">{getCityName(city)}</span>
              </div>
              {idx < displayCities.length - 1 && (
                <span className="text-slate-300 shrink-0 text-[11px]">➔</span>
              )}
            </React.Fragment>
          ))}

          <span className="text-slate-300 shrink-0 text-[11px]">➔</span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0f172a] text-white flex items-center gap-1 shrink-0 text-[11px] sm:text-xs font-extrabold shadow-2xs">
            <span>🛫</span>
            <span className="whitespace-nowrap">{getAirportDisplayName(exitAirport)}</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: 🛫 입국 공항 ➔ 첫 목적지 이동 */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black tracking-tight uppercase">
              {locale === "ko" ? "입국 첫날" : "Day 1 Arrival"}
            </span>
            <div className="flex items-center gap-1.5 font-extrabold text-[#0f172a] text-sm">
              <span>🛫 {getAirportDisplayName(entryAirport)}</span>
              <span className="text-slate-400 font-normal">──►</span>
              <span className="text-[#e25c5c]">{getCityName(firstCity)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">
              {locale === "ko" ? "입국 교통비:" : "Entry Transit Cost:"}
            </span>
            <strong className="text-[#e25c5c] font-black text-sm">
              {formatKrw(entryTotalKrw)}
            </strong>
            <span className="text-[11px] text-slate-400">
              ({formatKrw(activeEntryOption.oneWayPriceKrw)} × {adultCount}{locale === "ko" ? "명" : ""})
            </span>
          </div>
        </div>

        {/* Entry Options Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 block">
              {locale === "ko" ? "공항에서 첫 목적지까지 이동 수단" : "Select Airport Arrival Transit Mode"}
            </label>
            <button
              type="button"
              onClick={() => setShowCustomAirportToggle(!showCustomAirportToggle)}
              className="text-[11px] font-bold text-[#e25c5c] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>⚙</span>
              <span>{locale === "ko" ? "다른 공항으로 입국하시나요? ▾" : "Arriving at another airport? ▾"}</span>
            </button>
          </div>

          {showCustomAirportToggle && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-extrabold text-slate-700">{locale === "ko" ? "입국 공항 변경:" : "Change Arrival Gateway:"}</span>
              <select
                value={entryAirport}
                onChange={(e) => handleSelectEntryAirport(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs shadow-2xs focus:ring-2 focus:ring-[#0f172a] outline-hidden cursor-pointer"
              >
                <option value="INCHEON">{locale === "ko" ? "인천국제공항 (ICN, 수도권/전국)" : "Incheon Int'l Airport (ICN, Default)"}</option>
                <option value="GIMPO">{locale === "ko" ? "김포국제공항 (GMP, 서울 도심 직결)" : "Gimpo Int'l Airport (GMP, Seoul)"}</option>
                <option value="GIMHAE">{locale === "ko" ? "김해국제공항 (PUS, 부산/동남권)" : "Gimhae Int'l Airport (PUS, Busan)"}</option>
                <option value="JEJU_AIRPORT">{locale === "ko" ? "제주국제공항 (CJU, 제주)" : "Jeju Int'l Airport (CJU, Jeju)"}</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {entryOptions.map((opt) => {
              const isSelected = activeEntryOption.nameKo === opt.nameKo;
              const badgeText = locale === "ko" ? opt.badgeTextKo : opt.badgeTextEn;

              return (
                <button
                  key={opt.nameKo}
                  type="button"
                  onClick={() => onSelectIntercityOverride(entryRouteKey, opt.mode)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-[#0f172a] text-white border-[#0f172a] shadow-xs ring-1 ring-[#0f172a]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs">
                      {locale === "ko" ? opt.nameKo : opt.nameEn}
                    </span>
                    {badgeText && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight ${
                          isSelected
                            ? "bg-[#e25c5c] text-white"
                            : "bg-slate-100 text-[#0f172a] border border-slate-200 font-bold"
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium opacity-90">
                    <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                      ⏱ {locale === "ko" ? opt.durationTextKo : opt.durationTextEn}
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

      {/* SECTION 2: 🚆 도시 간 이동 구간 (다중 도시일 때) */}
      {isMultiCity && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-[#0f172a]">
                {locale === "ko" ? "도시 간 이동 구간" : "Intercity Transit Segments"}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200/60">
                {`${selectedCities.length - 1}${locale === "ko" ? "개 구간" : " segments"}`}
              </span>
            </div>
          </div>

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
                  className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs space-y-3 transition-all"
                >
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
                        {locale === "ko" ? "구간 소계:" : "Segment Subtotal:"}
                      </span>
                      <strong className="text-[#e25c5c] font-black text-sm">
                        {formatKrw(totalSegmentKrw)}
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        ({formatKrw(activeOption.oneWayPriceKrw)} × {adultCount}{locale === "ko" ? "명" : ""})
                      </span>
                    </div>
                  </div>

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
                              <span className="font-extrabold text-xs">
                                {locale === "ko" ? opt.nameKo : opt.nameEn}
                              </span>
                              {badgeText && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight ${
                                    isSelected
                                      ? "bg-[#e25c5c] text-white"
                                      : "bg-slate-100 text-[#0f172a] border border-slate-200 font-bold"
                                  }`}
                                >
                                  {badgeText}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-medium opacity-90">
                              <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                                ⏱ {locale === "ko" ? opt.durationTextKo : opt.durationTextEn}
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
        </div>
      )}

      {/* SECTION 3: 🛫 마지막 목적지 ➔ 공항 귀국 이동 */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-black tracking-tight uppercase">
              {locale === "ko" ? "귀국/출국일" : "Departure Day"}
            </span>
            <div className="flex items-center gap-1.5 font-extrabold text-[#0f172a] text-sm">
              <span className="text-[#0f172a]">{getCityName(lastCity)}</span>
              <span className="text-slate-400 font-normal">──►</span>
              <span className="text-[#e25c5c]">🛫 {getAirportDisplayName(exitAirport)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">
              {locale === "ko" ? "귀국 교통비:" : "Departure Transit Cost:"}
            </span>
            <strong className="text-[#e25c5c] font-black text-sm">
              {formatKrw(exitTotalKrw)}
            </strong>
            <span className="text-[11px] text-slate-400">
              ({formatKrw(activeExitOption.oneWayPriceKrw)} × {adultCount}{locale === "ko" ? "명" : ""})
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 block">
              {locale === "ko" ? "마지막 여행지에서 공항 복귀 수단" : "Select Airport Departure Transit Mode"}
            </label>
            <button
              type="button"
              onClick={() => setShowExitAirportToggle(!showExitAirportToggle)}
              className="text-[11px] font-bold text-[#e25c5c] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>⚙</span>
              <span>{locale === "ko" ? "다른 공항으로 출국하시나요? ▾" : "Departing from another airport? ▾"}</span>
            </button>
          </div>

          {showExitAirportToggle && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-extrabold text-slate-700">{locale === "ko" ? "출국 공항 변경:" : "Change Departure Gateway:"}</span>
              <select
                value={exitAirport}
                onChange={(e) => handleSelectExitAirport(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs shadow-2xs focus:ring-2 focus:ring-[#0f172a] outline-hidden cursor-pointer"
              >
                <option value="INCHEON">{locale === "ko" ? "인천국제공항 (ICN, 수도권/전국)" : "Incheon Int'l Airport (ICN, Default)"}</option>
                <option value="GIMPO">{locale === "ko" ? "김포국제공항 (GMP, 서울 도심 직결)" : "Gimpo Int'l Airport (GMP, Seoul)"}</option>
                <option value="GIMHAE">{locale === "ko" ? "김해국제공항 (PUS, 부산/동남권)" : "Gimhae Int'l Airport (PUS, Busan)"}</option>
                <option value="JEJU_AIRPORT">{locale === "ko" ? "제주국제공항 (CJU, 제주)" : "Jeju Int'l Airport (CJU, Jeju)"}</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {exitOptions.map((opt) => {
              const isSelected = activeExitOption.nameKo === opt.nameKo;
              const badgeText = locale === "ko" ? opt.badgeTextKo : opt.badgeTextEn;

              return (
                <button
                  key={opt.nameKo}
                  type="button"
                  onClick={() => onSelectIntercityOverride(exitRouteKey, opt.mode)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-[#0f172a] text-white border-[#0f172a] shadow-xs ring-1 ring-[#0f172a]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs">
                      {locale === "ko" ? opt.nameKo : opt.nameEn}
                    </span>
                    {badgeText && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight ${
                          isSelected
                            ? "bg-[#e25c5c] text-white"
                            : "bg-slate-100 text-[#0f172a] border border-slate-200 font-bold"
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium opacity-90">
                    <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                      ⏱ {locale === "ko" ? opt.durationTextKo : opt.durationTextEn}
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

      {/* SECTION 4: 🚌 도시 내 시내 교통 스타일 선택 (1일 4회 이동 기준) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-[#0f172a]">
              {locale === "ko" ? "도시 내 시내 이동 스타일" : "Local City Transit Style"}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200/60">
              {locale === "ko" ? "1일 평균 4회 이동 기준" : "Based on 4 trips/day"}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {locale === "ko" ? "한국관광공사 외래관광객 실태 통계 기반" : "Based on KTO tourist travel data"}
          </span>
        </div>

        {/* 3대 스타일 선택 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {LOCAL_TRANSIT_OPTIONS.map((opt) => {
            const isSelected = localTransitStyle === opt.style;
            const badge = locale === "ko" ? opt.badgeKo : opt.badgeEn;
            const isTooltipOpen = showEvidenceTooltip === opt.style;

            return (
              <div
                key={opt.style}
                onClick={() => onSelectLocalTransitStyle?.(opt.style)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-[#0f172a] text-white border-[#0f172a] shadow-md ring-2 ring-[#0f172a]"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-black text-xs sm:text-sm ${isSelected ? "text-white" : "text-[#0f172a]"}`}>
                      {locale === "ko" ? opt.nameKo : opt.nameEn}
                    </span>
                    {badge && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        isSelected
                          ? "bg-[#e25c5c] text-white"
                          : "bg-rose-50 text-[#e25c5c] border border-rose-200"
                      }`}>
                        {badge}
                      </span>
                    )}
                  </div>

                  <p className={`text-[11px] leading-relaxed line-clamp-2 ${isSelected ? "text-slate-300" : "text-slate-600"}`}>
                    {locale === "ko" ? opt.descriptionKo : opt.descriptionEn}
                  </p>

                  {/* 1일 이동 구성 뱃지 */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
                    }`}>
                      🚇 {locale === "ko" ? `지하철/버스 ${opt.subwayTripsPerDay}회` : `Metro ${opt.subwayTripsPerDay}x`}
                    </span>
                    {opt.taxiTripsPerDay > 0 && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        isSelected ? "bg-amber-900/60 text-amber-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        🚕 {locale === "ko" ? `택시 ${opt.taxiTripsPerDay}회` : `Taxi ${opt.taxiTripsPerDay}x`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100/20 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-[11px] font-medium ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      {locale === "ko" ? "1인 1일 예산" : "Per Person / Day"}
                    </span>
                    <strong className={`font-black text-sm ${isSelected ? "text-amber-300" : "text-[#0f172a]"}`}>
                      {formatKrw(opt.pricePerDayKrw)}
                    </strong>
                  </div>

                  {/* 산출 근거 툴팁 토글 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEvidenceTooltip(isTooltipOpen ? null : opt.style);
                      }}
                      className={`text-[10px] font-bold underline flex items-center gap-1 cursor-pointer ${
                        isSelected ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>ℹ</span>
                      <span>{locale === "ko" ? "산출 근거 및 공식 요금 기준" : "Calculation Evidence"}</span>
                    </button>

                    {isTooltipOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEvidenceTooltip(null);
                          }}
                        />
                        <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] font-normal leading-relaxed rounded-xl shadow-xl z-40 border border-slate-700 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                          <p className="font-extrabold text-amber-300 text-[11px]">
                            {locale === "ko" ? "📊 일평균 4회 이동 통계 근거" : "📊 4-Trip Tourist Pattern"}
                          </p>
                          <p className="text-slate-200">
                            {locale === "ko" ? opt.evidenceKo : opt.evidenceEn}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
