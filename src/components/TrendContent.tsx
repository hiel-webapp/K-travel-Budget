"use client";

import { useState } from "react";
import Link from "next/link";
import { listTrends } from "../lib/trend";
import type { SupportedCity } from "../lib/trip-domain";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface TrendContentProps {
  locale: Locale;
  dict: Dictionary;
}

export default function TrendContent({ locale, dict }: TrendContentProps) {
  const [selectedCity, setSelectedCity] = useState<SupportedCity | "ALL">("ALL");

  const items = listTrends({ city: selectedCity });
  const lang = locale === "en" ? "en" : "ko";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="border-b border-slate-200 pb-6 space-y-3">
        <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
          {dict.planner.trendHeroTitle}
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          {dict.planner.trendHeroSubtitle}
        </p>

        {/* Boundary Banner */}
        <div className="bg-[#fdf8f6] p-4 rounded-xl border border-[#f5e6e1] text-xs text-[#8c483e] leading-relaxed flex items-start gap-2.5">
          <svg className="h-4 w-4 text-[#e25c5c] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="font-bold text-[#0f172a] block">K-Trend Notice:</strong>
            <span>{dict.trendSection.publicTrendNotice}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">{dict.trendSection.cityFilterLabel}:</span>
          <div className="flex gap-1.5">
            {(["ALL", "SEOUL", "BUSAN"] as const).map((city) => {
              const active = selectedCity === city;
              const label =
                city === "ALL"
                  ? dict.trendSection.allCitiesOption
                  : city === "SEOUL"
                  ? locale === "en"
                    ? "Seoul"
                    : "서울"
                  : locale === "en"
                  ? "Busan"
                  : "부산";

              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#0f172a] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {dict.trendSection.officialChannelNotice}
        </span>
      </div>

      {/* Grid of Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => {
          const trans = item.translations[lang] || item.translations.ko;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:border-slate-350 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#e25c5c] bg-[#fdf2f2] px-2.5 py-0.5 rounded-full border border-[#fce8e8] uppercase tracking-wide">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {dict.places.updatedAt}: {item.updatedAt}
                    </span>
                    <div className="flex gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <h2 className="text-base font-extrabold text-[#0f172a]">
                  {trans.title}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {trans.overview}
                </p>
              </div>

              {/* Traveler Tip Banner */}
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <strong className="font-bold text-[#0f172a] block">Traveler Tip:</strong>
                  <span>{trans.tip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Shortcuts Links */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-bold">
        <Link
          href={`/${locale}/planner`}
          className="text-slate-500 hover:text-[#e25c5c] transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c] rounded px-2 py-1"
        >
          {dict.planner.plannerShortcutLink}
        </Link>
        <Link
          href={`/${locale}/report`}
          className="text-slate-500 hover:text-[#e25c5c] transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c] rounded px-2 py-1"
        >
          {dict.planner.reportShortcutLink}
        </Link>
      </div>
    </div>
  );
}
