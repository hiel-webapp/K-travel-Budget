"use client";

import React, { useState, useEffect } from "react";

export type LegalDocType = "about" | "terms" | "privacy";

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalDocType;
  onClose: () => void;
  isKo?: boolean;
}

export default function LegalModal({
  isOpen,
  initialTab = "about",
  onClose,
  isKo = true,
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#faf9f6]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e25c5c]" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isKo ? "K-Travel Budget 정책 및 안내" : "K-Travel Budget Policies & Information"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "about"
                ? "border-[#e25c5c] text-[#e25c5c]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {isKo ? "서비스 소개" : "About Us"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "terms"
                ? "border-[#e25c5c] text-[#e25c5c]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {isKo ? "이용약관" : "Terms of Service"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "privacy"
                ? "border-[#e25c5c] text-[#e25c5c]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {isKo ? "개인정보처리방침" : "Privacy Policy"}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
          {activeTab === "about" && (
            <div className="space-y-4">
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-4">
                <h3 className="text-sm font-bold text-rose-950 mb-1">
                  {isKo ? "정직하고 투명한 한국 여행 예산 설계" : "Honest & Transparent Korea Travel Budget"}
                </h3>
                <p className="text-slate-600 text-xs leading-normal">
                  {isKo
                    ? "K-Travel Budget은 대한민국을 방문하는 여행객들이 겪는 바가지 요금 불안과 복잡한 경비 계산 문제를 해결하기 위해 공공데이터를 기반으로 개발된 스마트 트래블 플래너입니다."
                    : "K-Travel Budget is a smart travel planner built on open public data to resolve price uncertainty and overcharge anxieties for travelers visiting South Korea."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  {isKo ? "주요 제공 가치" : "Core Values"}
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-[13px]">
                  <li>
                    <strong>{isKo ? "현지인 체감 물가 검증: " : "Local Verified Living Prices: "}</strong>
                    {isKo
                      ? "한국소비자원 참가격 및 한국관광공사 TourAPI 공공데이터를 기반으로 왜곡 없는 정직한 예상 견적을 산출합니다."
                      : "Calculates honest estimates based on certified public data from the Korea Consumer Agency and KTO."}
                  </li>
                  <li>
                    <strong>{isKo ? "맞춤 분할 숙박 (Split Stay): " : "Flexible Split Stay: "}</strong>
                    {isKo
                      ? "호텔, 한옥스테이 등 다채로운 숙소를 체류 일정에 맞춰 쪼개어 조합하고 예산에 실시간 반영합니다."
                      : "Allows mixing hotel stays and traditional Hanok stays flexibly across your itinerary."}
                  </li>
                  <li>
                    <strong>{isKo ? "안전한 공식 채널 연계: " : "Official Booking Channels: "}</strong>
                    {isKo
                      ? "KTX, 고속버스, 숙소, 투어 티켓 등의 공식 예매처를 직접 안내하여 암표 및 피싱 피해를 예방합니다."
                      : "Directly connects official reservation links (KTX, express bus, official platforms) to prevent ticketing scams."}
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 text-slate-500 text-xs">
                <p>
                  {isKo
                    ? "데이터 출처: 한국관광공사 TourAPI 4.0, 한국소비자원 참가격, 국토교통부 TAGO"
                    : "Data Sources: Korea Tourism Organization TourAPI 4.0, Korea Consumer Agency, TAGO"}
                </p>
              </div>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제1조 (목적)" : "Article 1 (Purpose)"}
                </h4>
                <p className="text-slate-600 text-xs sm:text-[13px]">
                  {isKo
                    ? "본 약관은 K-Travel Budget(이하 '서비스')이 제공하는 여행 예산 시뮬레이션, 추천 코스 및 관련 제반 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다."
                    : "These terms govern the use of the travel budget simulation, itinerary curation, and related services provided by K-Travel Budget."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제2조 (서비스의 성격 및 한계)" : "Article 2 (Nature of Service & Limitations)"}
                </h4>
                <p className="text-slate-600 text-xs sm:text-[13px]">
                  {isKo
                    ? "본 서비스는 공공데이터 및 자체 큐레이션 데이터를 바탕으로 여행 예산과 동선 정보를 무료로 제공하는 정보 제공 목적의 서비스입니다. 본 서비스는 숙박 시설, 교통편, 관광지 입장권의 직접 판매자 또는 예약 대행 당사자가 아니며, 이용자의 편의를 위해 공식 예매 링크만을 안내합니다."
                    : "This service provides free travel budget simulations and itinerary guidance based on open data. We are not a direct vendor or booking agency for accommodations, transport, or attraction tickets."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제3조 (면책 조항 - 법적 책임의 제한)" : "Article 3 (Limitation of Liability & Disclaimer)"}
                </h4>
                <div className="text-slate-600 text-xs sm:text-[13px] space-y-1.5">
                  <p>
                    {isKo
                      ? "1. 예산 및 물가 정보의 참고성: 서비스 내 제공되는 식비, 숙박비, 교통비, 입장료 및 환율 정보는 공공데이터 및 시장 평균을 반영한 참고용 추정치이며, 현지 사정 및 성수기 요금 변동에 따라 실제 결제 금액과 차이가 발생할 수 있습니다. 서비스는 이에 따른 직접적·간접적 손해에 대해 법적 책임을 부담하지 않습니다."
                      : "1. Advisory Nature: All price figures and estimates are advisory reference values. Actual prices may fluctuate due to seasonal demand or currency volatility. The service assumes no legal liability for cost discrepancies."}
                  </p>
                  <p>
                    {isKo
                      ? "2. 제3자 거래 면책: 이용자가 서비스 내 안내된 외부 링크(코레일, 항공/숙박 예약 플랫폼 등)를 통해 진행한 실제 예약, 결제, 취소, 환불 과정에서 발생하는 모든 법적 분쟁은 해당 판매처와 이용자 간의 계약에 따르며, 본 서비스는 이에 관여하지 않습니다."
                      : "2. Third-Party Transactions: Bookings, payments, and cancellations conducted on external websites are governed entirely by those third-party providers. This service assumes no responsibility for third-party transactions."}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제4조 (지식재산권)" : "Article 4 (Intellectual Property)"}
                </h4>
                <p className="text-slate-600 text-xs sm:text-[13px]">
                  {isKo
                    ? "서비스가 자체 제작한 텍스트, 디자인, 로고, UI/UX 및 알고리즘에 대한 권리는 서비스에 귀속됩니다. 공공데이터 포털 및 한국관광공사가 제공한 공공저작물은 해당 라이선스 기준을 준수합니다."
                    : "Proprietary software, designs, algorithms, and content belong to K-Travel Budget. Public open data follows Public Information Open Licenses."}
                </p>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제1조 (개인정보의 수집 항목 및 방법)" : "Article 1 (Collection & Processing of Personal Data)"}
                </h4>
                <p className="text-slate-600 text-xs sm:text-[13px]">
                  {isKo
                    ? "1. 비회원 기반 무수집 원칙: 본 서비스는 별도의 회원가입이나 로그인 없이 모든 핵심 기능을 익명으로 이용할 수 있으며, 이용자의 주민번호, 이름, 연락처 등 고유식별정보를 일체 수집하거나 서버에 저장하지 않습니다."
                    : "1. Anonymous Usage: The service does not require sign-up or login. We do not collect or store personal identifiable information (PII) on our servers."}
                </p>
                <p className="text-slate-600 text-xs sm:text-[13px] mt-1.5">
                  {isKo
                    ? "2. 브라우저 로컬 저장소 활용: 사용자가 선택한 여행 기간, 인원수, 도시, 숙박 장바구니 등은 이용자의 기기 브라우저(LocalStorage)에만 보관되며, 언제든지 브라우저 캐시 삭제 또는 일정 초기화 버튼을 통해 즉시 삭제할 수 있습니다."
                    : "2. LocalStorage Storage: Your selected itinerary and budget items are kept solely in your browser's local storage and can be cleared at any time."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제2조 (개인정보의 제3자 제공 및 위탁)" : "Article 2 (Third-Party Provision & Entrustment)"}
                </h4>
                <p className="text-slate-600 text-xs sm:text-[13px]">
                  {isKo
                    ? "서비스는 이용자의 개인정보를 수집하지 않으므로 어떠한 경우에도 개인정보를 제3자에게 판매하거나 제공, 위탁하지 않습니다."
                    : "Because we do not store personal data, we never sell, share, or transfer user personal data to third parties."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제3조 (외부 링크 안내 및 보안)" : "Article 3 (External Links & Security)"}
                </h4>
                <p className="text-slate-600 text-xs sm:text-[13px]">
                  {isKo
                    ? "서비스는 이용자 편의를 위해 KTX, 네이버 지도, 공식 예매처 등의 링크를 연결합니다. 외부 링크로 이동 시 해당 사이트의 독자적인 개인정보처리방침이 적용되므로 방문하시는 사이트의 방침을 확인하시기 바랍니다."
                    : "When clicking external links to reservation sites or map portals, those external websites' own privacy policies apply."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {isKo ? "제4조 (개인정보 보호 책임자)" : "Article 4 (Contact & Responsible Officer)"}
                </h4>
                <p className="text-slate-600 text-xs sm:text-[13px]">
                  {isKo
                    ? "서비스 이용 중 약관 및 개인정보 처리에 관한 문의 사항은 서비스 내 피드백 및 공식 안내 채널을 통해 신속하게 답변받으실 수 있습니다."
                    : "For inquiries regarding terms and policies, please reach out via our official feedback channel."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1d1d1f] hover:bg-slate-800 text-white transition-all cursor-pointer shadow-xs"
          >
            {isKo ? "확인 및 닫기" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
