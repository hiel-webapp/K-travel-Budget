export const ko = {
  common: {
    title: "HypeHeritage - 한국 여행 예산 플래너",
    logoAlt: "HypeHeritage 로고",
    userAccount: "사용자 계정",
  },
  navigation: {
    planner: "여행 예산 플래너",
    trend: "K-트렌드",
    guide: "K-가이드",
    savedTrips: "저장한 여행",
  },
  footer: {
    copyright: "© 2026 HypeHeritage",
    about: "소개",
    terms: "이용약관",
    privacy: "개인정보처리방침",
    country: "대한민국",
  },
  landing: {
    heading: "HypeHeritage",
    tagline: "현지인처럼 선택하고, 믿을 수 있게 예산을 세워보세요.",
    cta: "내 한국 여행 예산 만들기",
    helper: "결제 없이 첫 번째 여행 예산을 만들어볼 수 있어요.",
    status: "한국 여행 예산 플래너를 준비하고 있습니다.",
    nextPhase: "다음 단계에서 랜딩 페이지를 구현합니다.",
    allocationSeoulBusan: "서울 {seoul}박 · 부산 {busan}박",
    allocationSeoulOnly: "서울 {seoul}박",
    allocationBusanOnly: "부산 {busan}박",
    validation: {
      invalidNights: "숙박 기간은 3박, 5박, 7박 중 하나여야 합니다.",
      invalidAdults: "여행 인원은 1명에서 4명 사이여야 합니다.",
      noCities: "최소 한 개의 도시를 선택해야 합니다.",
      invalidTargetBudget: "목표 예산은 양의 정수여야 합니다.",
      saveFailed: "일시적인 저장소 오류로 예산안을 저장하지 못했습니다.",
    },
  },
  planner: {
    missingState: "생성된 예산 조건이 없습니다. 랜딩 페이지에서 먼저 예산을 만들어보세요.",
    goBack: "랜딩 페이지로 가기",
    title: "여행 예산 플래너",
    status: "성공적으로 여행 정보를 로드했습니다:",
  },
  placeholder: {
    notImplemented: "이 페이지는 다음 개발 단계에서 구현됩니다.",
  },
} as const;

export interface Dictionary {
  common: {
    title: string;
    logoAlt: string;
    userAccount: string;
  };
  navigation: {
    planner: string;
    trend: string;
    guide: string;
    savedTrips: string;
  };
  footer: {
    copyright: string;
    about: string;
    terms: string;
    privacy: string;
    country: string;
  };
  landing: {
    heading: string;
    tagline: string;
    cta: string;
    helper: string;
    status: string;
    nextPhase: string;
    allocationSeoulBusan: string;
    allocationSeoulOnly: string;
    allocationBusanOnly: string;
    validation: {
      invalidNights: string;
      invalidAdults: string;
      noCities: string;
      invalidTargetBudget: string;
      saveFailed: string;
    };
  };
  planner: {
    missingState: string;
    goBack: string;
    title: string;
    status: string;
  };
  placeholder: {
    notImplemented: string;
  };
}
