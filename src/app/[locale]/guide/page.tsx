import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";
import GuideContent from "src/components/GuideContent";
import { getAdminGuideCards } from "src/lib/admin/admin-store";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function GuidePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  // 서버 사이드에서 최신 관리자 가이드 카드 데이터를 사전 로드하여 초기 플리커링 원천 방지
  const initialCards = await getAdminGuideCards();

  return (
    <div className="min-h-screen bg-[#faf9f6] py-12">
      <GuideContent locale={locale as Locale} dict={dict} initialCards={initialCards} />
    </div>
  );
}
