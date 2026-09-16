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
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for dynamic glassmorphism texture
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change & prevent browser from restoring outdated scroll positions on refresh
  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
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
    { key: "report", label: (dict.navigation as any).report || dict.navigation.savedTrips, path: `/${locale}/report` },
  ] as const;

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl z-50 transition-all duration-300">
      <div
        className={`w-full rounded-full transition-all duration-300 px-4 sm:px-6 md:px-7 ${
          isScrolled
            ? "bg-white/70 backdrop-blur-xl border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
            : "bg-white/80 backdrop-blur-md border border-neutral-200/50 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between h-[56px] md:h-[64px] relative">
          
          {/* Mobile Left: Hamburger Toggle Button */}
          <div className="flex items-center md:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              type="button"
              className="p-2 text-neutral-700 hover:text-neutral-900 focus:outline-none rounded-full hover:bg-neutral-100/70 transition-all cursor-pointer"
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop Left: Logo */}
          <div className="hidden md:flex justify-start shrink-0 items-center">
            <Link
              href={`/${locale}`}
              className="text-xl font-black tracking-tight text-neutral-900 hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-teal-600 rounded-full py-1 shrink-0 whitespace-nowrap"
              aria-label={dict.common.logoAlt}
            >
              HypeHeritage
            </Link>
          </div>

          {/* Mobile Center: Logo */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 pointer-events-auto">
            <Link
              href={`/${locale}`}
              className="text-base font-black tracking-tight text-neutral-900 hover:opacity-80 transition-opacity rounded-full py-1 whitespace-nowrap"
              aria-label={dict.common.logoAlt}
            >
              HypeHeritage
            </Link>
          </div>

          {/* Desktop Center: Navigation with pill hover */}
          <nav className="hidden md:flex justify-center h-full items-center">
            <ul className="flex items-center gap-1.5 h-full">
              {navItems.map((item) => {
                const active = isActive(item.key);
                return (
                  <li key={item.key} className="h-full flex items-center">
                    <Link
                      href={item.path}
                      className={`text-[13px] tracking-tight transition-all rounded-full px-3.5 py-1.5 whitespace-nowrap flex items-center ${
                        active
                          ? "bg-neutral-900 text-white font-semibold shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70 font-medium"
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

          {/* Right: Controls (Segmented Locale Switcher & Profile) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Segmented Control Capsule Locale Switcher */}
            <div className="flex items-center text-[11px] font-medium border border-neutral-200/50 rounded-full p-1 bg-neutral-100/70 whitespace-nowrap">
              <Link
                href={getLanguageLink("ko")}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  locale === "ko"
                    ? "bg-white text-neutral-900 shadow-xs font-semibold"
                    : "text-neutral-500 hover:text-neutral-800 font-medium"
                }`}
                aria-label="한국어로 변경"
              >
                KO
              </Link>
              <Link
                href={getLanguageLink("en")}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  locale === "en"
                    ? "bg-white text-neutral-900 shadow-xs font-semibold"
                    : "text-neutral-500 hover:text-neutral-800 font-medium"
                }`}
                aria-label="Change language to English"
              >
                EN
              </Link>
            </div>

            {/* User Profile Avatar */}
            <button
              className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 shrink-0 cursor-pointer"
              aria-label={dict.common.userAccount}
              type="button"
            >
              <svg
                className="w-4 h-4 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
      </div>

      {/* Mobile Navigation Floating Dropdown Panel */}
      {isMobileMenuOpen && (
        <nav className="md:hidden mt-2 w-full rounded-3xl bg-white/95 backdrop-blur-xl border border-neutral-200/70 shadow-[0_12px_36px_rgba(0,0,0,0.08)] p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.key);
              return (
                <li key={item.key}>
                  <Link
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 text-sm rounded-2xl transition-colors ${
                      active
                        ? "bg-neutral-900 text-white font-semibold shadow-xs"
                        : "text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900 font-medium"
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
    </header>
  );
}
