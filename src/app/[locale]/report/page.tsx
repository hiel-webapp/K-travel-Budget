import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";
import ReportContent from "src/components/ReportContent";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  const title = isKo
    ? "K-Travel Budget | 한국 여행 예산 리포트"
    : "K-Travel Budget | Korea Travel Budget Report";
  const description = isKo
    ? "내가 계획한 한국 여행 일정과 예상 경비 영수증을 확인해보세요! ✨"
    : "Check out my planned Korea trip budget report and smart receipt! ✨";

  const siteUrl = "https://ktravelbudget.com";
  const ogImageUrl = `${siteUrl}/images/og-report.jpg`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/report`,
      siteName: "K-Travel Budget",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: "K-Travel Budget Report Cover",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen bg-[#faf9f6] py-12 print:p-0 print:m-0 print:min-h-0 print:bg-white">
      <Suspense fallback={<div className="w-full min-h-[50vh] flex items-center justify-center text-slate-400 font-medium">Loading report...</div>}>
        <ReportContent locale={locale as Locale} dict={dict} />
      </Suspense>
    </div>
  );
}
