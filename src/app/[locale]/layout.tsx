import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";
import Header from "src/components/Header";
import Footer from "src/components/Footer";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HypeHeritage - Korea Travel Budget Planner",
  description: "Plan your trip to Korea with realistic budget estimation",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf9f6] text-[#1e293b] font-sans">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-[#e25c5c] focus:px-4 focus:py-2 focus:text-white focus:font-semibold focus:shadow-md focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Permanent Header */}
        <Header locale={locale as Locale} dict={dict} />

        {/* Main Content Area */}
        <main
          id="main-content"
          className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col justify-start focus:outline-none"
        >
          {children}
        </main>

        {/* Permanent Footer */}
        <Footer dict={dict} />
      </body>
    </html>
  );
}
