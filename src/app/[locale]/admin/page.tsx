import AdminPageClient from "../../../components/admin/AdminPageClient";
import { Locale } from "../../../lib/i18n/locales";

interface AdminPageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export const metadata = {
  title: "Admin Dashboard | HypeHeritage",
  description: "HypeHeritage Korea Travel Budget Planner Management System",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({ params }: AdminPageProps) {
  await params;
  return <AdminPageClient />;
}
