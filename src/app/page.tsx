export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] px-4 font-sans text-[#1e293b]">
      <main className="w-full max-w-md rounded-2xl border border-[#e2e8f0]/40 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#e25c5c]">
            Foundation Ready
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0f172a]">
            HypeHeritage
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Next.js migration foundation
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
          <p className="text-sm font-medium text-slate-700">
            기존 프로토타입은 <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-[#e25c5c]">legacy_prototype</code>에 보존되었습니다.
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          HypeHeritage Korea Travel Budget Planner MVP
        </div>
      </main>
    </div>
  );
}
