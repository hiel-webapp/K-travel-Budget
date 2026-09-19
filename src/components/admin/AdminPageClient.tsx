"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const AdminDashboard = dynamic(
  () => import("./AdminDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-400 font-medium">관리자 대시보드 로딩 중...</p>
      </div>
    ),
  }
);

const AdminAuthGuard = dynamic(
  () => import("./AdminAuthGuard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-400 font-medium">보안 인증 확인 중...</p>
      </div>
    ),
  }
);

export default function AdminPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-400 font-medium">관리자 페이지 초기화 중...</p>
      </div>
    );
  }

  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
