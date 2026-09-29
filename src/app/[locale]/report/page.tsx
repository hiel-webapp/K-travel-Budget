import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";
import ReportContent from "src/components/ReportContent";

interface PageProps {
  params: Promise<{ locale: string }>;
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
