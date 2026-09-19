import { redirect } from "next/navigation";
import { Locale } from "../../../lib/i18n/locales";
// 당분간 숨김 처리: K-스팟 비공개 (추후 재활성화 가능하도록 보존)
// import { getDictionary } from "../../../lib/i18n/get-dictionary";
// import PlacesContent from "../../../components/PlacesContent";

interface PlacesPageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function PlacesPage({ params }: PlacesPageProps) {
  const { locale } = await params;

  // 당분간 K-스팟 페이지 비공개: 플래너 페이지로 안전하게 리다이렉트
  redirect(`/${locale}/planner`);

  // 추후 재활성화 시 아래 코드 복원
  // const dict = await getDictionary(locale);
  // return <PlacesContent locale={locale} dict={dict} />;
}

