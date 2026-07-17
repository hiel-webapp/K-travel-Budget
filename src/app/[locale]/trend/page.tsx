import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TrendPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="flex flex-1 items-center justify-center py-12 md:py-24">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">
          {dict.navigation.trend}
        </h2>
        <p className="mt-4 text-sm text-slate-500">
          {dict.placeholder.notImplemented}
        </p>
      </div>
    </div>
  );
}
