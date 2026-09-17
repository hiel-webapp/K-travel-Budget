"use client";

import React, { useState, useEffect } from "react";

const ADMIN_PIN_KEY = "hh_admin_session_auth";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem(ADMIN_PIN_KEY);
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg("PIN 코드를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY",
          pin: pinInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem(ADMIN_PIN_KEY, "true");
        setIsAuthenticated(true);
        setErrorMsg("");
      } else {
        setErrorMsg(data.error || "관리자 인증 PIN 번호가 일치하지 않습니다.");
      }
    } catch {
      setErrorMsg("인증 서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_PIN_KEY);
    setIsAuthenticated(false);
    setPinInput("");
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">HypeHeritage Admin</h1>
            <p className="mt-1 text-sm text-slate-400">데이터 및 프리셋 관리를 위해 관리자 PIN을 입력하세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                관리자 PIN 코드
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN 코드 입력"
                autoFocus
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-center text-xl tracking-widest text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "인증 확인 중..." : "대시보드 접속"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute right-4 top-4 z-50">
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
        >
          관리자 로그아웃
        </button>
      </div>
      {children}
    </div>
  );
}
