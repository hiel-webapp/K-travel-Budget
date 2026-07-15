import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";

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
    <div className="flex flex-1 items-center justify-center py-12 md:py-24">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm text-center">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[#e25c5c]">
          {dict.landing.heading}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl">
          HypeHeritage
        </h2>
        <p className="mt-4 text-sm md:text-base font-medium text-slate-700 leading-relaxed">
          {dict.landing.status}
        </p>
        <div className="mt-6 rounded-xl bg-[#faf9f6] p-4 border border-slate-100">
          <p className="text-xs text-slate-500">
            {dict.landing.nextPhase}
          </p>
        </div>
      </div>
    </div>
  );
}
