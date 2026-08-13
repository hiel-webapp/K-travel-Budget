"use client";

import React from "react";
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

  const getCityName = (city: SupportedCity) => {
    return locale === "ko"
      ? CITY_KOREAN_NAMES[city] || city
      : CITY_ENGLISH_NAMES[city] || city;
  };

  // 도시 순서 좌우 이동
  const handleMoveCity = (index: number, direction: "LEFT" | "RIGHT") => {
    if (!onReorderCities) return;
    const targetIdx = direction === "LEFT" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedCities.length) return;

    const nextCities = [...selectedCities];
    const temp = nextCities[index];
    nextCities[index] = nextCities[targetIdx];
    nextCities[targetIdx] = temp;
    onReorderCities(nextCities);
  };

  // 출발지 퀵 선택
  const handleSelectStartCity = (startCity: SupportedCity) => {
    if (!onReorderCities) return;
    const filtered = selectedCities.filter((c) => c !== startCity);
    onReorderCities([startCity, ...filtered]);
  };

  // 최적 동선 자동 정렬
  const handleOptimizeRoute = () => {
    if (!onReorderCities) return;
    const sorted = sortCitiesByStandardOrder(selectedCities);
    onReorderCities(sorted);
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

      {/* Part 0: 자율 동선 순서 재배치 컨트롤 (Route Sequence Reordering) */}
      {isMultiCity && (
        <div className="p-4.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h4 className="text-sm font-extrabold text-[#0f172a]">
                {locale === "ko" ? "여행 동선 및 방문 순서 설정" : "Trip Route & Visit Sequence"}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {locale === "ko"
                  ? "출발지와 방문 도시 순서를 자유롭게 변경할 수 있습니다."
                  : "Freely change your starting city and route order."}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
          </div>

          {/* Sequence Chips */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {selectedCities.map((city, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === selectedCities.length - 1;
                const badgeLabel = isFirst
                  ? (locale === "ko" ? "출발지" : "Start")
                  : isLast
                  ? (locale === "ko" ? "도착지" : "End")
                  : (locale === "ko" ? `경유 ${idx}` : `Stop ${idx}`);

                return (
                  <React.Fragment key={city}>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        isFirst
                          ? "bg-rose-500 text-white"
                          : isLast
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {badgeLabel}
                      </span>
                      <span className="text-xs font-black text-[#0f172a] px-1">
                        {getCityName(city)}
                      </span>

                      {onReorderCities && (
                        <div className="flex items-center gap-0.5 ml-1 border-l border-slate-200 pl-1.5">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveCity(idx, "LEFT")}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200 cursor-pointer"
                            title={locale === "ko" ? "앞으로 이동" : "Move left"}
                          >
                            ◄
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveCity(idx, "RIGHT")}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200 cursor-pointer"
                            title={locale === "ko" ? "뒤로 이동" : "Move right"}
                          >
                            ►
                          </button>
                        </div>
                      )}
                    </div>

                    {!isLast && (
                      <span className="text-slate-300 font-bold text-xs">──►</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
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
            <div key={city} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
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
