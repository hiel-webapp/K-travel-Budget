"use client";

import React, { useState, useEffect } from "react";
import { SupportedCity, TripDraft, CITY_KOREAN_NAMES, CITY_ENGLISH_NAMES, sortCitiesByStandardOrder } from "../lib/trip-domain";
import { IntercityTransportMode, IntercityFareInfo, getIntercityFareOptions, getAirportTransitOptions, AIRPORT_INFO_MAP } from "../lib/transport/intercity-fares";
import { LOCAL_TRANSIT_OPTIONS, LocalTransitOptionDef, getCityTransitEvidence } from "../features/budget/catalog/mock-catalog";
import { LocalTransitStyle } from "../features/budget/domain/types";
import { getDefaultCityTransitStyle, METRO_CONNECTED_CITIES } from "../features/budget/calculations/engine";
import { formatKrw } from "../features/budget/presentation/formatters";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface TransportPlannerPanelProps {
  draft: TripDraft;
  intercityOverrides: Record<string, IntercityTransportMode>;
  onSelectIntercityOverride: (routeKey: string, mode: IntercityTransportMode | string) => void;
  onReorderCities?: (newCities: SupportedCity[]) => void;
  localTransitStyle?: LocalTransitStyle;
  onSelectLocalTransitStyle?: (style: LocalTransitStyle) => void;
  cityTransitStyles?: Partial<Record<SupportedCity, LocalTransitStyle>>;
  onSelectCityTransitStyle?: (city: SupportedCity, style: LocalTransitStyle) => void;
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
  cityTransitStyles = {},
  onSelectCityTransitStyle,
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
  const [showEvidenceTooltip, setShowEvidenceTooltip] = useState<string | null>(null);

  // Custom airport selector state (default: Incheon)
  const [entryAirport, setEntryAirport] = useState<"INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT">("INCHEON");
  const [exitAirport, setExitAirport] = useState<"INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT">("INCHEON");
  const [showCustomAirportToggle, setShowCustomAirportToggle] = useState<boolean>(false);
  const [showExitAirportToggle, setShowExitAirportToggle] = useState<boolean>(false);
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({});

  const toggleSegmentDetails = (routeKey: string) => {
    setExpandedSegments((prev) => ({ ...prev, [routeKey]: !prev[routeKey] }));
  };

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

  const getSimplifiedTransportName = (nameKo: string, mode?: string, nameEn?: string) => {
    // 1. 항공 복합 환승 경로 우선 판별 (비행기가 포함된 노선은 반드시 항공 표시)
    if (nameKo.includes("항공") && (nameKo.includes("공항철도") || nameKo.includes("AREX"))) {
      return locale === "ko" ? "국내선 항공 + 공항철도" : "Domestic Flight + AREX";
    }
    if (nameKo.includes("항공") && (nameKo.includes("리무진") || nameKo.includes("공항 리무진") || nameKo.includes("공항리무진"))) {
      return locale === "ko" ? "국내선 항공 + 공항리무진" : "Domestic Flight + Limousine";
    }
    if (nameKo.includes("항공") && (nameKo.includes("KTX") || nameKo.includes("이음") || nameKo.includes("철도"))) {
      return locale === "ko" ? "국내선 항공 + KTX 고속철도" : "Domestic Flight + KTX";
    }
    if (nameKo.includes("항공") && (nameKo.includes("버스") || nameKo.includes("급행"))) {
      return locale === "ko" ? "국내선 항공 + 시외/급행버스" : "Domestic Flight + Bus";
    }

    // 2. 순수 항공 노선 (특가 vs 일반석 vs 직항)
    if (nameKo.includes("특가") || nameKo.includes("할인석")) {
      return locale === "ko" ? "국내선 항공 (특가/할인석)" : "Flight (Discount)";
    }
    if (nameKo.includes("일반석") || nameKo.includes("표준")) {
      return locale === "ko" ? "국내선 항공 (일반석)" : "Flight (Standard)";
    }
    if (mode === "FLIGHT" || (nameKo.includes("항공") && !nameKo.includes("철도") && !nameKo.includes("버스"))) {
      return locale === "ko" ? "국내선 항공" : "Domestic Flight";
    }

    // 3. 공항철도 및 철도 직통/환승
    if (nameKo.includes("KTX") && (nameKo.includes("공항철도") || nameKo.includes("직통") || nameKo.includes("AREX"))) {
      return locale === "ko" ? "KTX 고속철도 + 직통열차" : "KTX + AREX";
    }
    if (nameKo.includes("AREX") || nameKo.includes("직통열차")) {
      return locale === "ko" ? "공항철도 직통열차 (AREX)" : "AREX Express Train";
    }
    if (nameKo.includes("일반열차") || nameKo.includes("공항철도 일반")) {
      return locale === "ko" ? "공항철도 일반열차" : "AREX All-Stop Train";
    }

    // 4. 순수 공항 리무진 버스 (내륙 ➔ 공항 또는 공항 ➔ 도심)
    if (nameKo.includes("공항 리무진") || nameKo.includes("리무진")) {
      return locale === "ko" ? "공항 리무진 버스" : "Airport Limousine Bus";
    }

    // 5. 시내 대중교통
    if (nameKo.includes("시내버스") || nameKo.includes("지하철")) {
      return locale === "ko" ? "시내버스 / 지하철" : "Local Bus / Metro";
    }

    // 6. KTX / SRT 고속철도
    if (nameKo.includes("KTX")) {
      return locale === "ko" ? (nameKo.includes("환승") ? "KTX 고속철도 (환승)" : "KTX 고속철도") : (nameKo.includes("환승") ? "KTX (Transfer)" : "KTX High-Speed");
    }
    if (nameKo.includes("SRT")) {
      return locale === "ko" ? "SRT 고속철도" : "SRT High-Speed";
    }

    // 7. 시외/고속버스
    if (nameKo.includes("우등")) {
      return locale === "ko" ? "시외/고속버스 (우등)" : "Express Bus (Superior)";
    }
    if (nameKo.includes("시외버스") || nameKo.includes("시외")) {
      return locale === "ko" ? "시외버스" : "Intercity Bus";
    }
    if (nameKo.includes("고속버스") || nameKo.includes("고속")) {
      return locale === "ko" ? "고속버스" : "Express Bus";
    }

    // 8. 기타 괄호 정제
    if (locale === "ko") {
      const match = nameKo.match(/\((.*?)\)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return locale === "ko" ? nameKo : (nameEn || nameKo);
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
  const entryOptions = getAirportTransitOptions(entryAirport, firstCity, "ENTRY");
  const currentEntryOverride = intercityOverrides[entryRouteKey] || intercityOverrides[`ENTRY_AIRPORT-${firstCity}`] || intercityOverrides[`INCHEON-${firstCity}`];
  const activeEntryOption = (currentEntryOverride && entryOptions.find((o) => o.mode === currentEntryOverride))
    || entryOptions.find((o) => o.isDefault)
    || entryOptions[0];
  const entryTotalKrw = activeEntryOption.oneWayPriceKrw * adultCount;

  // 2. Exit Airport Transit Options
  const exitRouteKey = `EXIT_${lastCity}-${exitAirport}`;
  const exitOptions = getAirportTransitOptions(exitAirport, lastCity, "EXIT");
  const currentExitOverride = intercityOverrides[exitRouteKey] || intercityOverrides[`EXIT_${lastCity}-AIRPORT`] || intercityOverrides[`${lastCity}-INCHEON`];
  const activeExitOption = (currentExitOverride && exitOptions.find((o) => o.mode === currentExitOverride))
    || exitOptions.find((o) => o.isDefault)
    || exitOptions[0];
  const exitTotalKrw = activeExitOption.oneWayPriceKrw * adultCount;

  // 공항 선택 핸들러
  const handleSelectEntryAirport = (newAirport: "INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT") => {
    setEntryAirport(newAirport);
    const newOptions = getAirportTransitOptions(newAirport, firstCity, "ENTRY");
    const defaultMode = newOptions.find((o) => o.isDefault)?.mode || newOptions[0].mode;
    onSelectIntercityOverride(`ENTRY_${newAirport}-${firstCity}`, defaultMode);
  };

  const handleSelectExitAirport = (newAirport: "INCHEON" | "GIMPO" | "GIMHAE" | "JEJU_AIRPORT") => {
    setExitAirport(newAirport);
    const newOptions = getAirportTransitOptions(newAirport, lastCity, "EXIT");
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
        <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-2 text-xs font-bold text-slate-700 py-0.5">
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
              {locale === "ko" ? "입국 첫날" : "Arrival Day"}
            </span>
            <div className="flex items-center gap-1.5 font-extrabold text-[#0f172a] text-sm">
              <span>🛫 {getAirportDisplayName(entryAirport)}</span>
              <span className="text-slate-400 font-normal">──►</span>
              <span className="text-[#e25c5c]">{getCityName(firstCity)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">
              {locale === "ko" ? "1인 편도:" : "1-Person Fare:"}
            </span>
            <strong className="text-[#e25c5c] font-black text-sm sm:text-base">
              {formatKrw(activeEntryOption.oneWayPriceKrw)}
            </strong>
            {adultCount > 1 && (
              <span className="text-[11px] text-slate-400 font-medium ml-1">
                ({locale === "ko" ? `총 ${formatKrw(entryTotalKrw)} / ${adultCount}명` : `Total ${formatKrw(entryTotalKrw)} / ${adultCount}p`})
              </span>
            )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {entryOptions.map((opt) => {
              const isSelected = activeEntryOption.nameKo === opt.nameKo;
              const badgeText = locale === "ko" ? opt.badgeTextKo : opt.badgeTextEn;
              const simplifiedTitle = getSimplifiedTransportName(opt.nameKo, opt.mode, opt.nameEn);

              return (
                <button
                  key={opt.nameKo}
                  type="button"
                  onClick={() => onSelectIntercityOverride(entryRouteKey, opt.mode)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-[#fdf2f2] text-[#0f172a] border-[#e25c5c] shadow-2xs ring-1 ring-[#e25c5c]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-extrabold text-xs sm:text-[13px] ${isSelected ? "text-[#0f172a]" : "text-slate-800"}`}>
                      {simplifiedTitle}
                    </span>
                    {badgeText && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-tight ${
                          isSelected
                            ? "bg-rose-100 text-[#e25c5c] border border-rose-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className={isSelected ? "text-slate-500" : "text-slate-400"}>
                      ⏱ {locale === "ko" ? opt.durationTextKo : opt.durationTextEn}
                    </span>
                    <strong className={`font-black text-xs sm:text-sm ${isSelected ? "text-[#e25c5c]" : "text-[#0f172a]"}`}>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-[#0f172a]">
                {locale === "ko" ? "도시 간 이동 구간" : "Intercity Transit"}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200/60">
                {`${selectedCities.length - 1}${locale === "ko" ? "개 구간" : " segments"}`}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {Array.from({ length: selectedCities.length - 1 }).map((_, idx) => {
              const fromCity = selectedCities[idx];
              const toCity = selectedCities[idx + 1];
              const routeKey = `${fromCity}-${toCity}`;
              const options = getIntercityFareOptions(fromCity, toCity);

              const currentOverrideMode = (intercityOverrides[routeKey] || intercityOverrides[`${toCity}-${fromCity}`]) as string | undefined;
              const activeOption = (currentOverrideMode && options.find((o) => (o.mode as string) === currentOverrideMode || (o.optionType as string) === currentOverrideMode || o.nameKo === currentOverrideMode))
                || options.find((o) => o.isDefault)
                || options[0];

              const totalSegmentKrw = activeOption.oneWayPriceKrw * adultCount;
              const hasFlight = activeOption.mode === "FLIGHT" || activeOption.nameKo.includes("항공") || activeOption.legs?.some((l) => l.mode === "FLIGHT");
              const modeIcon = hasFlight ? "🛫" : (activeOption.mode === "EXPRESS_BUS" || activeOption.mode === "INTERCITY_BUS") ? "🚌" : activeOption.mode === "TRANSFER" ? "🔀" : "🚄";
              const displayName = getSimplifiedTransportName(activeOption.nameKo, activeOption.mode, activeOption.nameEn);
              const hasMultipleOptions = options.length > 1;
              const isExpanded = !!expandedSegments[routeKey];
              const hasLegs = activeOption.legs && activeOption.legs.length > 0;
              const hasTiers = (activeOption.tierDescriptionsKo && activeOption.tierDescriptionsKo.length > 0) || !!activeOption.priceRange;
              const canExpand = hasLegs || hasTiers;

              return (
                <div
                  key={routeKey}
                  className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* 2-Way 옵션 선택 탭 (환승/다중 옵션 시 상단 노출) */}
                  {hasMultipleOptions && (
                    <div className="px-3.5 pt-2.5 pb-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                        <span>🔀</span>
                        <span>{locale === "ko" ? "환승/이동 방식 선택:" : "Select Route Option:"}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {options.map((opt, optIdx) => {
                          const isSelected = activeOption.nameKo === opt.nameKo;
                          const optLabel = opt.badgeTextKo || (optIdx === 0 ? "⚡ 최단시간" : "💰 가성비/편의");
                          return (
                            <button
                              key={opt.nameKo}
                              type="button"
                              onClick={() => onSelectIntercityOverride(routeKey, opt.nameKo)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all border ${
                                isSelected
                                  ? "bg-[#fdf2f2] text-[#e25c5c] border-[#e25c5c] ring-1 ring-[#e25c5c] shadow-2xs font-black"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              {locale === "ko" ? optLabel : (opt.badgeTextEn || `Option ${optIdx + 1}`)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 메인 간결 요약 카드 */}
                  <div className="p-3.5 sm:p-4 flex items-center justify-between gap-4">
                    {/* 좌측: 도시 경로 + [1줄: 명칭 / 2줄: 소요시간 + 아코디언 토글 버튼] */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-800 font-extrabold text-xs whitespace-nowrap">
                          {getCityName(fromCity)}
                        </span>
                        <span className="text-slate-400 font-bold text-xs">➔</span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-800 font-extrabold text-xs whitespace-nowrap">
                          {getCityName(toCity)}
                        </span>
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-[13px] flex items-center gap-1 truncate">
                          <span className="shrink-0">{modeIcon}</span>
                          <span className="truncate">{displayName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                          <span>⏱ {locale === "ko" ? activeOption.durationTextKo : activeOption.durationTextEn}</span>
                          {canExpand && (
                            <button
                              type="button"
                              onClick={() => toggleSegmentDetails(routeKey)}
                              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-0.5 transition-colors"
                            >
                              {hasLegs ? (
                                <span>{isExpanded ? (locale === "ko" ? "▲ 상세 닫기" : "▲ Close") : (locale === "ko" ? "▼ 상세 경로" : "▼ Route Details")}</span>
                              ) : (
                                <span>{isExpanded ? (locale === "ko" ? "▲ 상세 닫기" : "▲ Close") : (locale === "ko" ? "▼ 운임 기준 & 특징 안내" : "▼ Fare Details & Features")}</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 우측: [1줄: 1인 단가 (메인) / 2줄: 소계 (서브)] */}
                    <div className="space-y-0.5 text-right shrink-0">
                      <div className="text-xs sm:text-[13px]">
                        <span className="text-slate-500 font-medium mr-1.5">
                          {locale === "ko" ? "1인 편도:" : "1-Person:"}
                        </span>
                        <strong className="text-[#e25c5c] font-black text-sm sm:text-base">
                          {formatKrw(activeOption.oneWayPriceKrw)}
                        </strong>
                      </div>
                      {adultCount > 1 && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {locale === "ko" ? "총" : "Total"} {formatKrw(totalSegmentKrw)} ({adultCount}{locale === "ko" ? "명" : "p"})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 아코디언 상세 보기: 1) 상세 환승 타임라인 */}
                  {isExpanded && activeOption.legs && activeOption.legs.length > 0 && (
                    <div className="px-4 pb-3.5 pt-2.5 bg-slate-50 border-t border-slate-100 space-y-2.5 text-xs">
                      <div className="font-extrabold text-slate-700 flex items-center gap-1.5">
                        <span>🗺</span>
                        <span>{locale === "ko" ? "상세 환승 이동 경로" : "Detailed Transfer Route"}</span>
                      </div>
                      <div className="space-y-2">
                        {activeOption.legs.map((leg, lIdx) => (
                          <div
                            key={leg.legOrder || lIdx}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                                {lIdx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1 truncate">
                                  <span>{leg.modeIcon}</span>
                                  <span>{locale === "ko" ? leg.transitNameKo : leg.transitNameEn}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {locale === "ko" ? leg.fromHubNameKo : leg.fromHubNameEn} ➔ {locale === "ko" ? leg.toHubNameKo : leg.toHubNameEn} (⏱ {locale === "ko" ? leg.durationTextKo : leg.durationTextEn})
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-slate-800 text-xs">
                                {formatKrw(leg.fareKrw)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 아코디언 상세 보기: 2) 항공권 운임 기준 및 좌석 특징 안내 */}
                  {isExpanded && activeOption.tierDescriptionsKo && activeOption.tierDescriptionsKo.length > 0 && (
                    <div className="px-4 pb-3.5 pt-3 bg-slate-50/90 border-t border-slate-100 space-y-3 text-xs">
                      {/* 운임 범위 및 시간대 기준 요약 박스 */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-slate-500">
                            {locale === "ko" ? "⏱ 운임 적용 기준 시간대" : "⏱ Flight Time Window"}
                          </div>
                          <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>{locale === "ko" ? (activeOption.subLabelKo || "선택된 좌석 기준") : (activeOption.subLabelEn || "Selected Seat Tier")}</span>
                          </div>
                        </div>

                        {activeOption.priceRange && (
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-slate-500">
                              {locale === "ko" ? "예상 운임 변동 범위" : "Estimated Fare Range"}
                            </div>
                            <div className="text-xs font-black text-slate-900">
                              {formatKrw(activeOption.priceRange.min)} ~ {formatKrw(activeOption.priceRange.max)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 좌석 등급별 특징 & 주의사항 리스트 */}
                      <div className="space-y-1.5">
                        <div className="font-extrabold text-slate-700 flex items-center gap-1.5 text-xs">
                          <span>📋</span>
                          <span>{locale === "ko" ? "좌석 등급 특징 및 예약 안내" : "Seat Tier Features & Booking Notice"}</span>
                        </div>
                        <div className="grid gap-1.5">
                          {(locale === "ko" ? activeOption.tierDescriptionsKo : (activeOption.tierDescriptionsEn || activeOption.tierDescriptionsKo)).map((desc, dIdx) => (
                            <div
                              key={dIdx}
                              className="px-3 py-2 rounded-lg bg-white/80 border border-slate-200/60 text-slate-700 text-[11px] flex items-start gap-2 leading-relaxed"
                            >
                              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                              <span>{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
              <span className="text-slate-400 font-bold">➔</span>
              <span className="text-blue-600 flex items-center gap-1">
                <span>🛫</span>
                <span>{getAirportDisplayName(exitAirport)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {locale === "ko" ? "1인 편도:" : "1-Person:"}
            </span>
            <strong className="text-sm font-black text-[#e25c5c]">
              {formatKrw(activeExitOption.oneWayPriceKrw)}
            </strong>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{locale === "ko" ? "마지막 여행지에서 공항 복귀 수단" : "Airport Return Transit Option"}</span>
            <button
              type="button"
              onClick={() => setShowExitAirportToggle(!showExitAirportToggle)}
              className="text-[11px] text-slate-400 hover:text-slate-700 underline cursor-pointer flex items-center gap-1"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {exitOptions.map((opt) => {
              const isSelected = activeExitOption.nameKo === opt.nameKo;
              const badgeText = locale === "ko" ? opt.badgeTextKo : opt.badgeTextEn;
              const simplifiedTitle = getSimplifiedTransportName(opt.nameKo, opt.mode, opt.nameEn);

              return (
                <button
                  key={opt.nameKo}
                  type="button"
                  onClick={() => onSelectIntercityOverride(exitRouteKey, opt.mode)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-[#fdf2f2] text-[#0f172a] border-[#e25c5c] shadow-2xs ring-1 ring-[#e25c5c]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-extrabold text-xs sm:text-[13px] ${isSelected ? "text-[#0f172a]" : "text-slate-800"}`}>
                      {simplifiedTitle}
                    </span>
                    {badgeText && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-tight ${
                          isSelected
                            ? "bg-rose-100 text-[#e25c5c] border border-rose-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className={isSelected ? "text-slate-500" : "text-slate-400"}>
                      ⏱ {locale === "ko" ? opt.durationTextKo : opt.durationTextEn}
                    </span>
                    <strong className={`font-black text-xs sm:text-sm ${isSelected ? "text-[#e25c5c]" : "text-[#0f172a]"}`}>
                      {formatKrw(opt.oneWayPriceKrw)}
                    </strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: 🚌 도시 내 이동 스타일 선택 (초슬림 간소화 디자인 + 스마트 기본값) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-extrabold text-[#0f172a]">
              {locale === "ko" ? "도시 내 이동 스타일" : "Local Transit Style"}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200/60">
              {locale === "ko" ? "1일 4회 이동 기준" : "4 trips/day"}
            </span>
          </div>

          {/* 전체 일괄 프리셋 버튼 (간소화) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
              {locale === "ko" ? "전체 일괄 변경:" : "Apply to All:"}
            </span>
            {LOCAL_TRANSIT_OPTIONS.map((opt) => (
              <button
                key={`all-${opt.style}`}
                type="button"
                onClick={() => onSelectLocalTransitStyle?.(opt.style)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold border bg-white text-slate-700 border-slate-200 hover:bg-[#faf5f5] hover:text-[#e25c5c] hover:border-[#fce8e8] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>{opt.style === "SUBWAY_BUS" ? "🚇" : opt.style === "STANDARD_MIX" ? "🔀" : "🚕"}</span>
                <span>{locale === "ko" ? opt.nameKo : opt.nameEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 도시별 개별 이동 스타일 카드 리스트 (초슬림 간소화 디자인) */}
        <div className="space-y-2.5">
          {selectedCities.map((city) => {
            const cityName = locale === "ko" ? CITY_KOREAN_NAMES[city] || city : CITY_ENGLISH_NAMES[city] || city;
            const isMetro = METRO_CONNECTED_CITIES.includes(city);
            const cityNights = draft.cityNightAllocations[city] ?? 0;
            const stayDays = Math.max(1, cityNights);
            const currentCityStyle = cityTransitStyles[city] || localTransitStyle || getDefaultCityTransitStyle(city);
            const selectedOpt = LOCAL_TRANSIT_OPTIONS.find((o) => o.style === currentCityStyle) || LOCAL_TRANSIT_OPTIONS[0];
            const totalCityTransit = selectedOpt.pricePerDayKrw * stayDays * adultCount;
            const isTooltipOpen = showEvidenceTooltip === `${city}-active`;

            return (
              <div
                key={city}
                className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
              >
                {/* 상단 1줄: 도시명 + 체류 일수 + 스마트 추천 뱃지 */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      {cityName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {cityNights === 0
                        ? (locale === "ko" ? "당일치기 (1일)" : "Day Trip (1d)")
                        : `${cityNights}${locale === "ko" ? "박 " : "N "}${cityNights + 1}${locale === "ko" ? "일 (" : "D ("}${stayDays}${locale === "ko" ? "일 체류)" : "d stay)"}`}
                    </span>
                  </div>

                  {/* 도시 맞춤 추천 특성 뱃지 */}
                  <div className="flex items-center gap-1.5">
                    {isMetro ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-extrabold flex items-center gap-1">
                        <span>🚇</span>
                        <span>{locale === "ko" ? "지하철 완비 (대중교통 추천)" : "Metro Available"}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] font-extrabold flex items-center gap-1">
                        <span>🚕</span>
                        <span>{locale === "ko" ? "관광지 분산 (대중교통+택시 추천)" : "Regional (Mix Recommended)"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 3대 스타일 선택 세그먼트 버튼 (초슬림 가로 배치) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {LOCAL_TRANSIT_OPTIONS.map((opt) => {
                    const isSelected = currentCityStyle === opt.style;

                    return (
                      <button
                        key={opt.style}
                        type="button"
                        onClick={() => onSelectCityTransitStyle?.(city, opt.style)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-[#fdf2f2] text-[#0f172a] border-[#e25c5c] shadow-2xs ring-1 ring-[#e25c5c]"
                            : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm shrink-0">
                            {opt.style === "SUBWAY_BUS" ? "🚇" : opt.style === "STANDARD_MIX" ? "🔀" : "🚕"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className={`font-black text-xs truncate ${isSelected ? "text-[#0f172a]" : "text-slate-800"}`}>
                                {locale === "ko" ? opt.nameKo : opt.nameEn}
                              </span>
                            </div>
                            <div className={`text-[10px] ${isSelected ? "text-slate-500 font-medium" : "text-slate-400"}`}>
                              {opt.taxiTripsPerDay > 0
                                ? `지하철 ${opt.subwayTripsPerDay}회 + 택시 ${opt.taxiTripsPerDay}회`
                                : `지하철/버스 ${opt.subwayTripsPerDay}회`}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <strong className={`font-black text-xs sm:text-sm block ${isSelected ? "text-[#e25c5c]" : "text-[#0f172a]"}`}>
                            {formatKrw(opt.pricePerDayKrw)}
                          </strong>
                          <span className="text-[9px] text-slate-400">
                            1일/1인
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 하단 1줄: 설명 + 산출근거 + 해당 도시 합계 */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 text-xs shrink-0">💡</span>
                    <span className="text-[11px] text-slate-600 truncate">
                      {locale === "ko" ? selectedOpt.descriptionKo : selectedOpt.descriptionEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEvidenceTooltip(isTooltipOpen ? null : `${city}-active`);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>ℹ</span>
                        <span>{locale === "ko" ? "산출 근거" : "Evidence"}</span>
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
                          <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-slate-900 text-white text-[11px] font-normal leading-relaxed rounded-xl shadow-xl z-40 border border-slate-700 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            {(() => {
                              const ev = getCityTransitEvidence(city, currentCityStyle, locale);
                              return (
                                <>
                                  <p className="font-extrabold text-amber-300 text-[11px]">
                                    {ev.title}
                                  </p>
                                  <p className="text-slate-200">
                                    {ev.evidence}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="text-[11px] font-medium text-slate-700">
                      <span>{locale === "ko" ? `${cityName} ${stayDays}일 합계:` : `${cityName} ${stayDays}d Total:`} </span>
                      <strong className="font-extrabold text-slate-900 text-xs">
                        {formatKrw(totalCityTransit)}
                      </strong>
                      {adultCount > 1 && (
                        <span className="text-[10px] text-slate-400"> ({adultCount}인 기준)</span>
                      )}
                    </div>
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
