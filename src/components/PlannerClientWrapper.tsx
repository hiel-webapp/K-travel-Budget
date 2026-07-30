"use client";

import dynamic from "next/dynamic";
import type { Locale } from "../lib/i18n/locales";
import type { Dictionary } from "../lib/i18n/dictionaries/ko";

const PlannerContent = dynamic(() => import("./PlannerContent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#e25c5c]"></div>
        <p className="text-sm font-medium text-slate-500">Loading planner...</p>
      </div>
    </div>
  ),
});

export default function PlannerClientWrapper({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return <PlannerContent locale={locale} dict={dict} />;
}
