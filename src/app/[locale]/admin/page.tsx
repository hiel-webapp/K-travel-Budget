import { getDictionary } from "../../../lib/i18n/get-dictionary";
import { Locale } from "../../../lib/i18n/locales";
import AdminDashboard from "../../../components/admin/AdminDashboard";
import AdminAuthGuard from "../../../components/admin/AdminAuthGuard";

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
  const { locale } = await params;
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
