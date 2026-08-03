"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getLocalizedPath, Locale } from "src/lib/i18n/locales";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export default function Header({ locale, dict }: HeaderProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#e2e8f0]/40">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-[64px] md:h-[72px] relative">
          
          {/* Mobile Left: Hamburger Toggle Button */}
          <div className="flex items-center md:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              type="button"
              className="p-2 text-slate-700 hover:text-[#b93829] focus:outline-none rounded-lg hover:bg-slate-100 transition-colors"
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop Left: Logo */}
          <div className="hidden md:flex justify-start shrink-0">
            <Link
              href={`/${locale}`}
              className="text-2xl font-black tracking-tight text-[#0f172a] hover:text-[#b93829] transition-colors focus-visible:outline-2 focus-visible:outline-[#b93829] rounded-md py-1 shrink-0 whitespace-nowrap"
              aria-label={dict.common.logoAlt}
            >
              HypeHeritage
            </Link>
          </div>

          {/* Mobile Center: Logo (Centered on mobile) */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 pointer-events-auto">
            <Link
              href={`/${locale}`}
              className="text-lg font-black tracking-tight text-[#0f172a] hover:text-[#b93829] transition-colors rounded-md py-1 whitespace-nowrap"
              aria-label={dict.common.logoAlt}
            >
              HypeHeritage
            </Link>
          </div>

          {/* Desktop Center: Navigation */}
          <nav className="hidden md:flex justify-center h-full items-center">
            <ul className="flex items-center gap-6 h-full">
              {navItems.map((item) => {
                const active = isActive(item.key);
                return (
                  <li key={item.key} className="h-full flex items-center relative">
                    <Link
                      href={item.path}
                      className={`text-sm font-bold tracking-tight transition-colors hover:text-[#b93829] focus-visible:outline-2 focus-visible:outline-[#b93829] rounded-md px-2 py-1 whitespace-nowrap flex items-center ${
                        active ? "text-[#b93829] font-extrabold" : "text-slate-700"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right: Controls (Locale Switcher & Profile) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Locale Switcher */}
            <div className="flex items-center text-[10px] md:text-xs font-bold border border-slate-200 rounded-full p-0.5 bg-slate-50/50 whitespace-nowrap">
              <Link
                href={getLanguageLink("ko")}
                className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full transition-colors ${
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
                className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full transition-colors ${
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
              className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-[#e25c5c] shrink-0"
              aria-label={dict.common.userAccount}
              type="button"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-slate-500"
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

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-100 py-3 bg-white">
            <ul className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.key);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                        active
                          ? "bg-[#b93829]/10 text-[#b93829] font-extrabold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

      </div>
    </header>
  );
}
