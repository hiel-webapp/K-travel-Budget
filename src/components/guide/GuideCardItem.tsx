"use client";

import React, { useState } from "react";
import { GuideCard, GuideCategory } from "src/data/guide-cards";

interface GuideCardItemProps {
  card: GuideCard;
  isKo?: boolean;
}

const CATEGORY_LABELS: Record<
  GuideCategory,
  { en: string; ko: string; color: string }
> = {
  navigation: {
    en: "Navigation",
    ko: "길찾기·지도",
    color: "text-sky-700 bg-sky-50 border-sky-200",
  },
  money: {
    en: "Money & Cards",
    ko: "결제·환전",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  transit: {
    en: "Transit",
    ko: "대중교통",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
  dining: {
    en: "Dining Rules",
    ko: "식당·카페",
    color: "text-amber-800 bg-amber-50 border-amber-200",
  },
  emergency: {
    en: "Emergency",
    ko: "긴급·안전",
    color: "text-[#c5221f] bg-[#fce8e6] border-[#f8c9c4]",
  },
  saving_hacks: {
    en: "Saving Hacks",
    ko: "경비 절약",
    color: "text-teal-700 bg-teal-50 border-teal-200",
  },
};

function getBadgeStyle(badge: GuideCard["badge"]) {
  switch (badge) {
    case "Fatal Mistake":
      return "bg-[#fce8e6] text-[#c5221f] border-[#f8c9c4]";
    case "Money Saver":
      return "bg-[#e6f4ea] text-[#137333] border-[#ceead6]";
    case "Must-Know":
      return "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]";
    case "Local Rule":
      return "bg-[#fef7e0] text-[#b06000] border-[#fde293]";
    case "Essential":
      return "bg-[#f3e8fd] text-[#7627bb] border-[#e1bee7]";
    case "Pro Tip":
    default:
      return "bg-[#fff0ed] text-[#b93829] border-[#ffd5cc]";
  }
}

export const GuideCardItem: React.FC<GuideCardItemProps> = ({
  card,
  isKo = false,
}) => {
  const [copied, setCopied] = useState(false);
  const categoryInfo =
    CATEGORY_LABELS[card.category] || CATEGORY_LABELS.navigation;

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
    <article className="flex flex-col justify-between h-full bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Card Header & Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryInfo.color}`}
            >
              {isKo ? categoryInfo.ko : categoryInfo.en}
            </span>
            <span
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(
                card.badge
              )}`}
            >
              {card.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy tips"}
            className="text-[11px] font-bold text-slate-400 hover:text-[#b93829] hover:bg-[#fff0ed] transition px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
          >
            {copied ? (
              <span className="text-[#137333]">{isKo ? "복사완료" : "Copied"}</span>
            ) : (
              <span>{isKo ? "공유" : "Share"}</span>
            )}
          </button>
        </div>

        {/* Headlines */}
        <div className="mb-3">
          <h3 className="text-base sm:text-lg font-extrabold text-[#1d1d1f] tracking-tight leading-snug group-hover:text-[#b93829] transition-colors">
            {title}
          </h3>
          <p className="text-[11px] sm:text-xs text-[#86868b] font-medium mt-1">
            {subTitle}
          </p>
        </div>

        {/* Summary Callout Box */}
        <p className="text-xs sm:text-[13px] text-slate-700 mb-4 leading-relaxed bg-[#faf9f6] p-3 rounded-xl border border-slate-100 font-medium">
          {summary}
        </p>

        {/* Bullet details */}
        <ul className="space-y-2 mb-4 text-xs sm:text-[13px] text-slate-600 flex-1">
          {details.map((point, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#b93829] mt-1.5 shrink-0" />
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro-Tip Highlight Footer Box */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[#fff8f6] border-t border-[#fce3de] flex items-start gap-2.5">
        <span className="text-[#b93829] font-black text-[11px] uppercase tracking-wider shrink-0 mt-0.5 bg-[#fce8e6] px-1.5 py-0.5 rounded">
          PRO-TIP
        </span>
        <p className="text-xs text-[#7a2015] leading-relaxed font-semibold">
          {proTip}
        </p>
      </div>
    </article>
  );
};
