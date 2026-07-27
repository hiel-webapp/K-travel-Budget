import { notFound } from "next/navigation";
import { isLocale, Locale } from "src/lib/i18n/locales";
import { getDictionary } from "src/lib/i18n/get-dictionary";
import PlannerContent from "src/components/PlannerContent";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PlannerPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen bg-[#faf9f6] py-12">
      <PlannerContent locale={locale as Locale} dict={dict} />
    </div>
  );
}
