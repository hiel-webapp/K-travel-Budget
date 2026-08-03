"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getLocalizedPath, Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export default function Header({ locale, dict }: HeaderProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  const getLanguageLink = (targetLocale: Locale) => {
    const paramsStr = searchParams ? searchParams.toString() : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    return getLocalizedPath(pathname, targetLocale, paramsStr, hash);
  };

  const isActive = (pathSegment: string) => {
    const parts = pathname.split("/");
    return parts[2] === pathSegment;
  };

  const navItems = [
    { key: "planner", label: dict.navigation.planner, path: `/${locale}/planner` },
    { key: "places", label: dict.navigation.places, path: `/${locale}/places` },
    { key: "trend", label: dict.navigation.trend, path: `/${locale}/trend` },
    { key: "guide", label: dict.navigation.guide, path: `/${locale}/guide` },
    { key: "saved-trips", label: dict.navigation.savedTrips, path: `/${locale}/saved-trips` },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full h-[64px] md:h-[72px] bg-white border-b border-[#e2e8f0]/40 px-3 sm:px-6 md:px-8">
      <div className="flex items-center justify-between w-full h-full max-w-[1280px] mx-auto gap-1 sm:gap-4">
        {/* Left: Logo */}
        <div className="flex justify-start shrink-0">
          <Link
            href={`/${locale}`}
            className="text-[17px] sm:text-xl md:text-2xl font-black tracking-tight text-[#0f172a] hover:text-[#b93829] transition-colors focus-visible:outline-2 focus-visible:outline-[#b93829] rounded-md py-1 shrink-0 whitespace-nowrap"
            aria-label={dict.common.logoAlt}
          >
            HypeHeritage
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="flex justify-center h-full items-center">
          <ul className="flex items-center gap-1 sm:gap-3 md:gap-6 h-full">
            {navItems.map((item) => {
              const active = isActive(item.key);
              return (
                <li key={item.key} className="h-full flex items-center relative">
                  <Link
                    href={item.path}
                    className={`text-[11px] sm:text-xs md:text-sm font-bold tracking-tight transition-colors hover:text-[#b93829] focus-visible:outline-2 focus-visible:outline-[#b93829] rounded-md px-1 sm:px-2 py-1 whitespace-nowrap flex items-center ${
                      active ? "text-[#b93829] font-extrabold" : "text-slate-700"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#b93829] rounded-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Locale Switcher */}
          <div className="flex items-center text-[9px] sm:text-[10px] md:text-xs font-bold border border-slate-200 rounded-full p-0.5 bg-slate-50/50 whitespace-nowrap">
            <Link
              href={getLanguageLink("ko")}
              className={`px-1.5 sm:px-2.5 md:px-3 py-0.5 md:py-1 rounded-full transition-colors ${
                locale === "ko"
                  ? "bg-white text-[#b93829] shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900 font-bold"
              }`}
              aria-label="한국어로 변경"
            >
              KO
            </Link>
            <span className="text-slate-300 select-none px-0.5">/</span>
            <Link
              href={getLanguageLink("en")}
              className={`px-1.5 sm:px-2.5 md:px-3 py-0.5 md:py-1 rounded-full transition-colors ${
                locale === "en"
                  ? "bg-white text-[#b93829] shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900 font-bold"
              }`}
              aria-label="Change language to English"
            >
              EN
            </Link>
          </div>

          {/* User Profile Placeholder */}
          <button
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c] shrink-0"
            aria-label={dict.common.userAccount}
            type="button"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
