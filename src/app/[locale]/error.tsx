"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-[#e25c5c] flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            일시적인 오류가 발생했습니다
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            데이터를 불러오거나 이동하는 중 문제가 발생했습니다. 다시 시도하시거나 이전 페이지로 돌아가실 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 h-11 px-4 rounded-xl bg-[#0f172a] text-white hover:bg-slate-800 font-extrabold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            다시 시도 (Retry)
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
          >
            새로고침 (Reload)
          </button>
        </div>
      </div>
    </div>
  );
}
