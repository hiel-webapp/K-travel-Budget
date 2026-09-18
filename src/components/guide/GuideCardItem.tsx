"use client";

import React, { useState } from "react";
import { GuideCard, GuideCategory } from "src/data/guide-cards";

interface GuideCardItemProps {
  card: GuideCard;
  isKo?: boolean;
}

const CATEGORY_LABELS: Record<GuideCategory, { en: string; ko: string; color: string }> = {
  navigation: { en: "Navigation", ko: "길찾기·지도", color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800" },
  money: { en: "Money & Cards", ko: "결제·환전", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
  transit: { en: "Transit", ko: "대중교통", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800" },
  dining: { en: "Dining Rules", ko: "식당·카페", color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" },
  emergency: { en: "Emergency", ko: "긴급·안전", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800" },
  saving_hacks: { en: "Saving Hacks", ko: "경비 절약", color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800" },
};

function getBadgeStyle(badge: GuideCard["badge"]) {
  switch (badge) {
    case "Fatal Mistake":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800";
    case "Money Saver":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
    case "Must-Know":
      return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800";
    case "Local Rule":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800";
    case "Essential":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800";
    case "Pro Tip":
    default:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800";
  }
}

export const GuideCardItem: React.FC<GuideCardItemProps> = ({ card, isKo = false }) => {
  const [copied, setCopied] = useState(false);
  const categoryInfo = CATEGORY_LABELS[card.category] || CATEGORY_LABELS.navigation;

  const title = isKo ? card.titleKo : card.titleEn;
  const subTitle = isKo ? card.titleEn : card.titleKo;
  const summary = isKo ? card.summaryKo : card.summaryEn;
  const details = isKo ? card.detailsKo : card.detailsEn;
  const proTip = isKo ? card.proTipKo : card.proTipEn;

  const handleCopy = () => {
    const textToCopy = `[HypeHeritage K-Guide] ${card.titleEn}\n\n${card.summaryEn}\n\nKey Points:\n${card.detailsEn.map((d) => `- ${d}`).join("\n")}\n\nPro-Tip: ${card.proTipEn}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="flex flex-col justify-between h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
      {/* Card Header & Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${categoryInfo.color}`}
            >
              {isKo ? categoryInfo.ko : categoryInfo.en}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(
                card.badge
              )}`}
            >
              {card.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy card tips"}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {copied ? (isKo ? "복사됨" : "Copied") : (isKo ? "공유" : "Share")}
          </button>
        </div>

        {/* Headlines */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {subTitle}
          </p>
        </div>

        {/* Summary */}
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          {summary}
        </p>

        {/* Bullet details */}
        <ul className="space-y-2 mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex-1">
          {details.map((point, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
              <span className="leading-normal">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro-Tip Highlight Footer Box */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-amber-500/10 dark:bg-amber-950/30 border-t border-amber-200/60 dark:border-amber-800/50 flex items-start gap-2.5">
        <span className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider shrink-0 mt-0.5">
          PRO-TIP
        </span>
        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
          {proTip}
        </p>
      </div>
    </article>
  );
};
