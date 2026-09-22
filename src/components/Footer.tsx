"use client";

import { useState } from "react";
import type { Dictionary } from "src/lib/i18n/dictionaries/ko";
import LegalModal, { LegalDocType } from "./legal/LegalModal";

interface FooterProps {
  dict: Dictionary;
}

export default function Footer({ dict }: FooterProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LegalDocType>("about");

  const isKo = dict.footer.about === "소개";

  const handleOpenLegal = (tab: LegalDocType) => {
    setActiveTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <footer className="w-full bg-[#faf9f6] border-t border-[#e2e8f0]/60 py-6 px-4 md:px-8 text-slate-500 text-xs mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Branding & Copyright */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0f172a] tracking-tight">K-Travel Budget</span>
            <span className="text-[10px] md:text-xs text-slate-400">© 2026</span>
          </div>

          {/* Right: Interactive Legal Links & Country */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => handleOpenLegal("about")}
              className="cursor-pointer text-slate-500 hover:text-slate-900 transition-colors underline-offset-4 hover:underline"
            >
              {dict.footer.about}
            </button>
            <button
              type="button"
              onClick={() => handleOpenLegal("terms")}
              className="cursor-pointer text-slate-500 hover:text-slate-900 transition-colors underline-offset-4 hover:underline"
            >
              {dict.footer.terms}
            </button>
            <button
              type="button"
              onClick={() => handleOpenLegal("privacy")}
              className="cursor-pointer text-slate-500 hover:text-slate-900 transition-colors underline-offset-4 hover:underline"
            >
              {dict.footer.privacy}
            </button>
            <span className="text-slate-300 font-light select-none hidden sm:inline">|</span>
            <span className="font-semibold text-[#0f172a]">{dict.footer.country}</span>
          </div>
        </div>
      </footer>

      {/* Legal Modal Dialog */}
      <LegalModal
        isOpen={modalOpen}
        initialTab={activeTab}
        onClose={() => setModalOpen(false)}
        isKo={isKo}
      />
    </>
  );
}

