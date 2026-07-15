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
    status: "한국 여행 예산 플래너를 준비하고 있습니다.",
    nextPhase: "다음 단계에서 랜딩 페이지를 구현합니다.",
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
    status: string;
    nextPhase: string;
  };
  placeholder: {
    notImplemented: string;
  };
}
