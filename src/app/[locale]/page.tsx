import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";
import LandingForm from "src/components/LandingForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full max-w-[960px] mx-auto px-4 py-8 md:py-16">
      {/* Brand Title & Localized Tagline */}
      <div className="text-center mb-10 md:mb-14 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0f172a] sm:text-6xl">
          HypeHeritage
        </h1>
        <p className="text-base md:text-lg font-medium text-slate-500 max-w-2xl mx-auto">
          {dict.landing.tagline}
        </p>
      </div>

      {/* Interactive Mad-libs Card Form */}
      <LandingForm locale={locale as Locale} dict={dict} />
    </div>
  );
}
