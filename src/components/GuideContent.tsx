"use client";

import Link from "next/link";
import { K_GUIDE_CONTENTS, GuideItem } from "../lib/static-contents";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";
import type { Locale } from "../lib/i18n/locales";

interface GuideContentProps {
  locale: Locale;
  dict: Dictionary;
}

export default function GuideContent({ locale, dict }: GuideContentProps) {
  const items: GuideItem[] = K_GUIDE_CONTENTS[locale] || K_GUIDE_CONTENTS.ko;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
          {dict.planner.guideHeroTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">
          {dict.planner.guideHeroSubtitle}
        </p>
      </div>

      {/* Accordion List using details/summary */}
      <div className="space-y-4">
        {items.map((item) => (
          <details
            key={item.id}
            className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 focus-within:ring-2 focus-within:ring-[#e25c5c]/40 transition-shadow duration-150 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex items-center justify-between cursor-pointer focus:outline-none select-none list-none">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {item.category}
                </span>
                <h3 className="text-base font-extrabold text-[#0f172a] group-hover:text-[#e25c5c] transition-colors">
                  {item.title}
                </h3>
              </div>
              <svg className="h-5 w-5 text-slate-400 transform group-open:rotate-180 transition-transform duration-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="pt-4 border-t border-slate-100 space-y-3.5 text-xs text-slate-600 leading-relaxed font-medium">
              <p className="font-bold text-[#0f172a] text-xs">
                {item.overview}
              </p>

              <ul className="space-y-2 list-disc pl-5">
                {item.details.map((detail, idx) => (
                  <li key={idx} className="text-slate-500">
                    {detail}
                  </li>
                ))}
              </ul>

              {/* Safety/Legality Official Notice Warning */}
              {item.officialChannelNotice && (
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/60 text-[11px] text-red-700 font-semibold flex items-start gap-2 mt-2">
                  <svg className="h-4 w-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{item.officialChannelNotice}</span>
                </div>
              )}
            </div>
          </details>
        ))}
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
