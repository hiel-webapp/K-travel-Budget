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
    <div className="flex flex-1 flex-col items-center justify-start w-full max-w-[1140px] mx-auto px-4 py-6 md:py-10">
      {/* Brand Title & Localized Tagline */}
      <div className="text-center mb-6 md:mb-8 space-y-2 md:space-y-2.5">
        <h1 className="text-[28px] sm:text-[36px] md:text-[42px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1d1d1f]">
          내 한국 여행 예산 만들기
        </h1>
        <p className="text-[15px] sm:text-[17px] text-[#666b73] leading-[1.5] max-w-xl mx-auto font-medium">
          {dict.landing.tagline}
        </p>
        <p className="text-[13px] sm:text-[14px] text-[#86868b] font-normal">
          아래 3개 단계를 선택하여 나만의 맞춤 한국 여행 예산을 구성해 보세요.
        </p>
      </div>

      {/* Interactive Travel Budget Calculator Form */}
      <LandingForm locale={locale as Locale} dict={dict} />
    </div>
  );
}
