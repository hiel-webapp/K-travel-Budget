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
    <div className="flex flex-1 flex-col items-center justify-start w-[min(100%-32px,720px)] mx-auto px-0 py-6 md:py-12">
      {/* Brand Title & Localized Tagline */}
      <div className="text-center mb-8 md:mb-10 space-y-3 md:space-y-4">
        <h1 className="text-[32px] md:text-[48px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1d1d1f]">
          HypeHeritage
        </h1>
        <p className="text-[16px] md:text-[18px] text-[#666b73] leading-[1.6] max-w-xl mx-auto font-normal">
          {dict.landing.tagline}
        </p>
      </div>

      {/* Interactive Travel Budget Calculator Form */}
      <LandingForm locale={locale as Locale} dict={dict} />
    </div>
  );
}
