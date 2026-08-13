"use client";

import React, { useState } from "react";
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

  // Drag and drop state for insertion line between cards
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropSlotIdx, setDropSlotIdx] = useState<number | null>(null);

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
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleSlotDragOver = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropSlotIdx !== slotIdx) {
      setDropSlotIdx(slotIdx);
    }
  };

  const handleSlotDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || !onReorderCities) {
      setDraggedIdx(null);
      setDropSlotIdx(null);
      return;
    }

    // Adjust target slot index when moving forward
    let targetIdx = slotIdx;
    if (draggedIdx < slotIdx) {
      targetIdx = slotIdx - 1;
    }

    if (draggedIdx !== targetIdx) {
      const nextCities = [...selectedCities];
      const [movedItem] = nextCities.splice(draggedIdx, 1);
      nextCities.splice(targetIdx, 0, movedItem);
      onReorderCities(nextCities);
    }

    setDraggedIdx(null);
    setDropSlotIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDropSlotIdx(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Banner */}
      <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#0f172a]">
              {locale === "ko" ? "교통수단 맞춤 설계" : "Transport Planner"}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#e25c5c] border border-rose-200/80 text-[10px] font-black">
              {locale === "ko" ? "실시간 연동" : "Live Sync"}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            {locale === "ko" ? `성인 ${adultCount}명 기준` : `For ${adultCount} travelers`}
          </span>
        </div>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {locale === "ko"
            ? "도시 간 이동 구간별 최적의 교통 수단(KTX, 고속버스, 항공 등)을 선택하세요. 선택된 단가가 전체 여행 예산에 실시간 반영됩니다."
            : "Select the optimal transit option (KTX, Express Bus, Flight) for each segment."}
        </p>
      </div>

      {/* Part 0: 직관적인 드래그 앤 드롭 카드 사이 삽입(Between Insertion) 동선 설정 */}
      {isMultiCity && (
        <div className="p-4.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h4 className="text-sm font-extrabold text-[#0f172a]">
                {locale === "ko" ? "여행 동선 및 목적지 순서" : "Trip Destination Sequence"}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {locale === "ko"
                  ? "목적지 카드를 카드 사이 원하는 위치로 드래그하여 순서를 변경하세요."
                  : "Drag destination cards between items to rearrange travel sequence."}
              </p>
            </div>
            {onReorderCities && (
              <button
                type="button"
                onClick={handleOptimizeRoute}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
              >
                {locale === "ko" ? "최적 동선 자동 정렬" : "Auto Optimize Route"}
              </button>
            )}
          </div>

          {/* Interactive Drag & Drop Between-Insertion Area */}
          <div className="flex flex-wrap items-center gap-1 pt-1 min-h-[52px]">
            {selectedCities.map((city, idx) => {
              const isDragging = draggedIdx === idx;

              return (
                <React.Fragment key={city}>
                  {/* Drop Slot BEFORE this card (Slot index = idx) */}
                  <div
                    onDragOver={(e) => handleSlotDragOver(e, idx)}
                    onDrop={(e) => handleSlotDrop(e, idx)}
                    className={`h-10 transition-all duration-150 flex items-center justify-center ${
                      dropSlotIdx === idx && draggedIdx !== idx && draggedIdx !== idx - 1
                        ? "w-6"
                        : "w-2.5 hover:w-4"
                    }`}
                  >
                    <div
                      className={`h-9 rounded-full transition-all duration-150 ${
                        dropSlotIdx === idx && draggedIdx !== idx && draggedIdx !== idx - 1
                          ? "w-1.5 bg-[#e25c5c] ring-4 ring-rose-200 scale-y-110 animate-pulse shadow-sm"
                          : "w-0.5 bg-slate-200/50 opacity-0 hover:opacity-100"
                      }`}
                    />
                  </div>

                  {/* Draggable City Card */}
                  <div
                    draggable={!!onReorderCities}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleSlotDragOver(e, idx)}
                    onDrop={(e) => handleSlotDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                      isDragging
                        ? "opacity-30 bg-slate-100 border-dashed border-slate-400 scale-95"
                        : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Grip Icon */}
                    <div className="text-slate-300 group-hover:text-slate-400 text-xs font-bold flex flex-col gap-0.5 leading-none">
                      <span>⋮</span>
                      <span>⋮</span>
                    </div>

                    {/* Step Number Badge */}
                    <span className="w-5 h-5 rounded-full bg-[#0f172a] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* City Name */}
                    <span className="text-xs font-extrabold text-[#0f172a] tracking-tight">
                      {getCityName(city)}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Drop Slot AFTER the last card (Slot index = selectedCities.length) */}
            <div
              onDragOver={(e) => handleSlotDragOver(e, selectedCities.length)}
              onDrop={(e) => handleSlotDrop(e, selectedCities.length)}
              className={`h-10 transition-all duration-150 flex items-center justify-center ${
                dropSlotIdx === selectedCities.length && draggedIdx !== selectedCities.length - 1
                  ? "w-6"
                  : "w-2.5 hover:w-4"
              }`}
            >
              <div
                className={`h-9 rounded-full transition-all duration-150 ${
                  dropSlotIdx === selectedCities.length && draggedIdx !== selectedCities.length - 1
                    ? "w-1.5 bg-[#e25c5c] ring-4 ring-rose-200 scale-y-110 animate-pulse shadow-sm"
                    : "w-0.5 bg-slate-200/50 opacity-0 hover:opacity-100"
                }`}
              />
            </div>
          </div>

          {/* Info Banner for Upcoming Auto-Optimization Feature */}
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
        </div>
      )}

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
