import type { Dictionary } from "src/lib/i18n/dictionaries/ko";

interface FooterProps {
  dict: Dictionary;
}

export default function Footer({ dict }: FooterProps) {
  return (
    <footer className="w-full bg-[#faf9f6] border-t border-[#e2e8f0]/60 py-6 px-4 md:px-8 text-slate-500 text-xs mt-auto">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Copyright */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#0f172a] tracking-tight">HypeHeritage</span>
          <span className="text-[10px] md:text-xs">{dict.footer.copyright}</span>
        </div>

        {/* Right: Legal Placeholder Links & Country */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2">
          {/* 가짜 URL 대신 텍스트 스팬으로 표시하여 클릭 비활성화, 추후 링크 교체가 편리하도록 설계 */}
          <span className="cursor-default hover:text-slate-800 transition-colors">
            {dict.footer.about}
          </span>
          <span className="cursor-default hover:text-slate-800 transition-colors">
            {dict.footer.terms}
          </span>
          <span className="cursor-default hover:text-slate-800 transition-colors">
            {dict.footer.privacy}
          </span>
          <span className="text-slate-300 font-light select-none hidden sm:inline">|</span>
          <span className="font-semibold text-[#0f172a]">{dict.footer.country}</span>
        </div>
      </div>
    </footer>
  );
}
