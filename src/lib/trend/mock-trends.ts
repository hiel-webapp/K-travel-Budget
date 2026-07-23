import { TrendItem } from "./types";

export const MOCK_TRENDS: TrendItem[] = [
  {
    id: "popup-exhibition",
    category: "CULTURE",
    city: "SEOUL",
    tags: ["Seoul", "Culture", "Activity"],
    updatedAt: "2026-07-01",
    translations: {
      ko: {
        title: "팝업 및 문화 전시",
        overview: "최근 한국 젊은 층 사이에서 가장 인기를 끄는 패션, 식음료 브랜드들의 개성 넘치는 임시 전시 공간(팝업)입니다.",
        tip: "대부분 성수동이나 홍대 부근에서 열리며 현장 모바일 예약 시스템을 적극적으로 활용합니다.",
        reasonExplanation: "서울 방문 및 문화·액티비티 관심사 연관",
      },
      en: {
        title: "Pop-up Stores & Exhibitions",
        overview: "Highly creative temporary exhibition spaces by trending fashion and food brands popular among young locals.",
        tip: "Mostly located in Seongsu-dong or Hongdae, often requiring queue systems or online reservations.",
        reasonExplanation: "Matched with Seoul visit & Culture interest",
      },
    },
  },
  {
    id: "k-beauty",
    category: "BEAUTY",
    city: "SEOUL",
    tags: ["Seoul", "Shopping", "Beauty"],
    updatedAt: "2026-07-01",
    translations: {
      ko: {
        title: "K-뷰티 및 퍼스널 컬러",
        overview: "나에게 어울리는 색상을 진단받고, 드럭스토어에서 맞춤 화장품을 고르는 체험식 여정입니다.",
        tip: "퍼스널 컬러 분석 예약은 해외 예약 전문 플랫폼이나 다국어 지원 샵을 통해 사전에 확보하는 것을 추천합니다.",
        reasonExplanation: "서울 방문 및 쇼핑·뷰티 관심사 연관",
      },
      en: {
        title: "K-Beauty & Personal Color Analysis",
        overview: "Experience diagnostics for your best personal tones and custom makeup products at major drugstores.",
        tip: "Book personal color consultations well in advance through online booking portals offering English services.",
        reasonExplanation: "Matched with Seoul visit & Shopping interest",
      },
    },
  },
  {
    id: "local-cafe",
    category: "FOOD",
    city: "ALL",
    tags: ["Seoul", "Busan", "Food", "Cafe"],
    updatedAt: "2026-07-01",
    translations: {
      ko: {
        title: "로컬 카페 문화와 디저트",
        overview: "단순히 커피를 마시는 공간을 넘어 고유한 인테리어와 시그니처 베이커리를 즐기는 미식 문화입니다.",
        tip: "한옥 카페나 바다가 보이는 루프탑 카페 등 지역 테마별 카페 리스트를 탐색해보세요.",
        reasonExplanation: "식비 예산 및 카페·음식 후보 저장 연관",
      },
      en: {
        title: "Local Cafe & Dessert Culture",
        overview: "A rich culinary scene emphasizing aesthetic interiors and signature pastries rather than simple coffee.",
        tip: "Check out Hanok (traditional houses) cafes in Seoul or beach-view rooftop cafes in Busan.",
        reasonExplanation: "Matched with Food budget & Cafe saved candidate",
      },
    },
  },
  {
    id: "nightlife",
    category: "LEISURE",
    city: "ALL",
    tags: ["Seoul", "Busan", "Leisure", "Night"],
    updatedAt: "2026-07-01",
    translations: {
      ko: {
        title: "한강공원 및 야간 피크닉",
        overview: "선선한 밤바람을 맞으며 한강변에서 배달 음식을 먹거나 밤바다를 걷는 낭만적인 야외 문화입니다.",
        tip: "한강 둔치 배달 구역을 활용하거나 즉석 라면 제조 기계를 체험해보는 재미가 쏠쏠합니다.",
        reasonExplanation: "서울/부산 일정 및 야간 야외 활동 연관",
      },
      en: {
        title: "Han River Parks & Night Picnic",
        overview: "Relaxing outdoors, eating delivered meals by the river at night, or walking along beautiful beaches.",
        tip: "Try utilizing dedicated delivery zones in Han River parks or cooking instant ramen using public vending boilers.",
        reasonExplanation: "Matched with Seoul/Busan trip duration & Night outdoor leisure",
      },
    },
  },
];
