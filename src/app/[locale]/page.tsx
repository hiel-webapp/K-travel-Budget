import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";
import LandingForm from "src/components/LandingForm";
import { getAdminPresets } from "src/lib/admin/admin-store";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);
  // 서버 사이드에서 최신 프리셋(Supabase/AdminStore)을 사전에 직접 조회하여 클라이언트 플리커링 원천 방지
  const initialPresets = await getAdminPresets(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-start w-full max-w-[1140px] mx-auto px-4 py-6 md:py-10">
      {/* Brand Title */}
      <div className="text-center mb-6 md:mb-8 space-y-2 md:space-y-2.5">
        <h1 className="text-[28px] sm:text-[36px] md:text-[42px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1d1d1f]">
          {locale === "ko" ? "내 한국 여행 예산 만들기" : "Build My Korea Travel Budget"}
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#86868b] font-normal max-w-xl mx-auto">
          {locale === "ko"
            ? "나만의 맞춤 여행 예산을 완성해 보세요."
            : "Create your personalized Korea travel budget."}
        </p>
      </div>

      {/* Interactive Travel Budget Calculator Form */}
      <LandingForm locale={locale as Locale} dict={dict} initialPresets={initialPresets} />
    </div>
  );
}
