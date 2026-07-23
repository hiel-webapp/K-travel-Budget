import { getDictionary } from "../../../lib/i18n/get-dictionary";
import { Locale } from "../../../lib/i18n/locales";
import PlacesContent from "../../../components/PlacesContent";

interface PlacesPageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function PlacesPage({ params }: PlacesPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <PlacesContent locale={locale} dict={dict} />;
}
