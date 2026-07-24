export interface TrendItem {
  id: string;
  title: string;
  category: string;
  overview: string;
  tip: string;
  tags: string[];
}

export interface GuideItem {
  id: string;
  title: string;
  category: string;
  categoryLabel?: {
    ko: string;
    en: string;
  };
  subTag?: {
    ko: string;
    en: string;
  };
  subTagType?: "ESSENTIAL" | "BASIC" | "TRANSIT" | "CULTURE" | "SHOPPING" | "EMERGENCY";
  readTime?: string;
  updatedDate?: string;
  overview: string;
  details: string[];
  checklist?: string[];
  imageUrl?: string;
  isHero?: boolean;
  officialChannelNotice?: string;
}

export interface GuideFAQ {
  id: string;
  question: {
    ko: string;
    en: string;
  };
  answer: {
    ko: string;
    en: string;
  };
}

export const K_TREND_CONTENTS: Record<"ko" | "en", TrendItem[]> = {
  ko: [
    {
      id: "popup-exhibition",
      title: "팝업 및 문화 전시",
      category: "Culture",
      overview: "최근 한국 젊은 층 사이에서 가장 인기를 끄는 패션, 식음료 브랜드들의 개성 넘치는 임시 전시 공간(팝업)입니다.",
      tip: "대부분 성수동이나 홍대 부근에서 열리며 현장 모바일 예약 시스템을 적극적으로 활용합니다.",
      tags: ["Seoul", "Activity"],
    },
    {
      id: "k-beauty",
      title: "K-뷰티 및 퍼스널 컬러",
      category: "Beauty",
      overview: "나에게 어울리는 색상을 진단받고, 올리브영 등 드럭스토어에서 맞춤 화장품을 고르는 체험식 여정입니다.",
      tip: "퍼스널 컬러 분석 예약은 해외 예약 전문 플랫폼이나 다국어 지원 샵을 통해 사전에 확보하는 것을 추천합니다.",
      tags: ["Seoul", "Shopping"],
    },
  ],
  en: [
    {
      id: "popup-exhibition",
      title: "Pop-up Stores & Exhibitions",
      category: "Culture",
      overview: "Highly creative temporary exhibition spaces by trending fashion and food brands popular among young locals.",
      tip: "Mostly located in Seongsu-dong or Hongdae, often requiring queue systems or online reservations.",
      tags: ["Seoul", "Activity"],
    },
    {
      id: "k-beauty",
      title: "K-Beauty & Personal Color Analysis",
      category: "Beauty",
      overview: "Experience diagnostics for your best personal tones and custom makeup products at major drugstores.",
      tip: "Book personal color consultations well in advance through online booking portals offering English services.",
      tags: ["Seoul", "Shopping"],
    },
  ],
};

export const K_GUIDE_FAQS: GuideFAQ[] = [
  {
    id: "faq-calling-server",
    question: {
      ko: "식당에서 직원을 어떻게 부르나요?",
      en: "How do I call a server at a restaurant?",
    },
    answer: {
      ko: "테이블에 부저(호출벨)가 있다면 눌러주세요. 벨이 없다면 손을 가볍게 들며 '저기요' 또는 '여기요'라고 말씀하시면 됩니다.",
      en: "Press the table call button if available. If not, raise your hand slightly and say 'Jeogiyo' (Excuse me).",
    },
  },
  {
    id: "faq-[#b93829]-refill",
    question: {
      ko: "반찬을 더 달라고 해도 되나요?",
      en: "Can I ask for extra side dishes for free?",
    },
    answer: {
      ko: "네, 대개의 한식당에서 기본 반찬(김치, 깍두기 등)은 무료 리필이 가능합니다. '셀프바'가 있다면 직접 가져다 드시면 됩니다.",
      en: "Yes, complimentary side dishes (Banchan) can be refilled for free at most casual Korean diners or self-service bars.",
    },
  },
  {
    id: "faq-bus-card-tag",
    question: {
      ko: "버스를 탈 때와 내릴 때 모두 카드를 찍나요?",
      en: "Do I tap my transit card both when getting on and off the bus?",
    },
    answer: {
      ko: "네, 환승 할인을 받고 이동 거리에 따른 추가 요금을 예방하려면 승차 및 하차 시 반드시 단말기에 카드를 태그해야 합니다.",
      en: "Yes, tapping both on entry and exit is required to receive transfer discounts and avoid maximum distance penalties.",
    },
  },
  {
    id: "faq-street-food-card",
    question: {
      ko: "길거리 음식은 카드로 결제할 수 있나요?",
      en: "Can I pay for street food with a credit card?",
    },
    answer: {
      ko: "전통시장 고정 포장마차는 카드가 가능하지만, 노점상은 현금이나 계좌이체를 선호하므로 소액 현금을 지참하는 것이 좋습니다.",
      en: "Fixed stalls often take cards, but mobile street vendors usually prefer cash or bank transfers. Keeping small cash is recommended.",
    },
  },
  {
    id: "faq-taxi-card",
    question: {
      ko: "택시에서 신용카드 결제가 가능한가요?",
      en: "Can I pay with a credit card in a taxi?",
    },
    answer: {
      ko: "네, 한국의 모든 일반/모범 택시는 신용카드, 체크카드, T-money 교통카드로 결제할 수 있습니다.",
      en: "Yes, all Korean taxis accept international credit cards, debit cards, and T-money transit cards.",
    },
  },
  {
    id: "faq-water-free",
    question: {
      ko: "식당에서 물은 유료인가요?",
      en: "Is drinking water free at restaurants in Korea?",
    },
    answer: {
      ko: "아닙니다, 한국의 식당에서는 물과 정수기 차가 기본적으로 무료 제공됩니다. 물병이나 셀프 정수기를 이용하시면 됩니다.",
      en: "No, drinking water is completely free at virtually all restaurants in Korea, either brought to your table or self-service.",
    },
  },
];

export const K_GUIDE_CONTENTS: Record<"ko" | "en", GuideItem[]> = {
  ko: [
    {
      id: "dining-etiquette",
      title: "한국 식당에서 당황하지 않는 기본 이용법",
      category: "DINING",
      categoryLabel: {
        ko: "식당·음식",
        en: "Dining & Food",
      },
      subTag: {
        ko: "여행 전 필수",
        en: "Pre-trip Essential",
      },
      subTagType: "ESSENTIAL",
      readTime: "3분 읽기",
      updatedDate: "2026년 7월",
      overview: "직원을 부르는 방법, 기본 반찬, 추가 주문, 결제 위치 등 한국 식당에서 자주 마주치는 상황을 한 번에 알아보세요.",
      checklist: [
        "테이블 호출벨",
        "기본 반찬 추가 정책",
        "2인분 최소 주문",
        "계산대 결제",
      ],
      details: [
        "대부분의 한식당에서는 기본 반찬(Kimchi 등)이 무료로 무제한 제공되며, 추가 반찬은 '셀프(Self)' 코너를 활용합니다.",
        "테이블 옆면 서랍을 열면 숟가락, 젓가락, 휴지가 정돈되어 있습니다.",
        "벨을 누르면 종업원이 응대하며, 결제는 기본적으로 나가실 때 출입구 카운터에서 진행됩니다.",
      ],
      imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=800&auto=format&fit=crop",
      isHero: true,
    },
    {
      id: "arrival-transit",
      title: "교통카드 구매와 충전 및 지하철 환승",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통",
        en: "Transit",
      },
      subTag: {
        ko: "기초 정보",
        en: "Basic Info",
      },
      subTagType: "BASIC",
      readTime: "2분",
      updatedDate: "2026년 7월",
      overview: "인천공항 입국 후 지하철(공항철도), 버스, 택시를 이용해 목적지로 이동하는 핵심 실무 정보입니다.",
      details: [
        "지하철 및 버스 탑승 시 T-money 카드를 편의점에서 구매 후 현금으로 충전해 사용하는 편이 가장 경제적입니다.",
        "모바일 지도 앱으로 KakaoMap 이나 Naver Map을 사용해야 현지 노선과 소요 시간이 정확하게 안내됩니다.",
      ],
      officialChannelNotice: "대중교통의 실시간 최신 요금과 노선 정보는 공항철도 및 서울시 대중교통 사이트 등 공식 채널에서 반드시 재확인하시기 바랍니다.",
    },
    {
      id: "payment-exchange",
      title: "카드 결제와 현금이 필요한 순간",
      category: "PAYMENT",
      categoryLabel: {
        ko: "결제·환승",
        en: "Payment",
      },
      subTag: {
        ko: "여행 전 필수",
        en: "Pre-trip Essential",
      },
      subTagType: "ESSENTIAL",
      readTime: "3분",
      updatedDate: "2026년 7월",
      overview: "한국의 대부분 매장은 신용카드와 간편결제 기반이며, 전통시장 등 일부 상황에서 소액의 현금이 활용됩니다.",
      details: [
        "해외 발행 Visa, Mastercard 카드는 프랜차이즈 및 주요 소매점에서 무리 없이 작동합니다.",
        "소액의 예비 현금은 공항 내 은행이나 공인된 사설 환전소(명동 등)에서 환전하는 것이 수수료 관점에서 유리합니다.",
      ],
    },
    {
      id: "public-rules",
      title: "한국에는 팁을 줘야 하나요? (공공 예절)",
      category: "PAYMENT",
      categoryLabel: {
        ko: "결제·환승",
        en: "Payment",
      },
      subTag: {
        ko: "문화 차이",
        en: "Culture Gap",
      },
      subTagType: "CULTURE",
      readTime: "1분",
      updatedDate: "2026년 7월",
      overview: "현지인들과 조화롭고 유쾌하게 어우러지기 위해 지켜야 할 일상생활 규정 및 팁 문화 안내입니다.",
      details: [
        "지하철이나 버스 안에서는 공공 전화를 피하고 작은 목소리로 대화하는 것이 기본 매너입니다.",
        "에스컬레이터 탑승 시 한쪽 통행을 준수하며, 노약자 및 임산부 배려석은 가능한 비워둡니다.",
      ],
    },
    {
      id: "emergency-safety",
      title: "분실·병원·경찰 긴급 안내",
      category: "SAFETY",
      categoryLabel: {
        ko: "안전·긴급",
        en: "Safety & Emergency",
      },
      subTag: {
        ko: "긴급 정보",
        en: "Emergency Info",
      },
      subTagType: "EMERGENCY",
      readTime: "3분",
      updatedDate: "2026년 7월",
      overview: "여행 중 여권 분실, 질병 발생, 조난 시 즉각적인 도움을 받을 수 있는 핫라인입니다.",
      details: [
        "화재 및 응급 구조 지원전화는 119 이며, 경찰서 신고 전화는 112 입니다.",
        "외국인 종합 안내 센터 콜센터는 1345 번으로 한국 생활 적응을 지원합니다.",
        "관광 통역 안내 전화 1330 은 영어, 중국어, 일어 등 24시간 상담이 열려있습니다.",
      ],
      officialChannelNotice: "여권 및 출입국 신분 분실 시 거주국 대사관의 공식 연락처와 근무 시간을 공식 채널에서 필히 사전에 파악해 두시기 바랍니다.",
    },
    {
      id: "checkout-trash",
      title: "택스리펀 및 숙소 이용 분리배출 요령",
      category: "SHOPPING",
      categoryLabel: {
        ko: "쇼핑",
        en: "Shopping",
      },
      subTag: {
        ko: "쇼핑 도움",
        en: "Shopping Help",
      },
      subTagType: "SHOPPING",
      readTime: "4분",
      updatedDate: "2026년 7월",
      overview: "공유 숙소 또는 레지던스 이용 시 환경 자원 보호를 위해 준수해야 할 필수 지침 및 택스리펀 정보.",
      details: [
        "음식물 쓰레기, 재활용품(플라스틱/유리/캔), 일반 쓰레기를 반드시 구분해서 정해진 수거 장소에 버려야 합니다.",
        "Tax Free 표시 매장에서 구매 시 현장 즉시 할인받거나 공항 출국장 키오스크에서 환급받을 수 있습니다.",
      ],
    },
  ],
  en: [
    {
      id: "dining-etiquette",
      title: "Essential Dining Etiquette in Korean Restaurants",
      category: "DINING",
      categoryLabel: {
        ko: "식당·음식",
        en: "Dining & Food",
      },
      subTag: {
        ko: "여행 전 필수",
        en: "Pre-trip Essential",
      },
      subTagType: "ESSENTIAL",
      readTime: "3 min read",
      updatedDate: "July 2026",
      overview: "Learn how to call servers, refill complimentary banchan, order minimum portions, and pay at the door counter.",
      checklist: [
        "Table call button",
        "Complimentary side refilling",
        "2-person minimum ordering",
        "Counter payment on exit",
      ],
      details: [
        "Side dishes (Banchan, like Kimchi) are complimentary and refilled at self-service sidebars in most casual Korean diners.",
        "Utensils and napkins are usually kept in a sliding drawer on the side of your dining table.",
        "Press the call button on the table to summon a server, and pay at the counter near the entrance when exiting.",
      ],
      imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=800&auto=format&fit=crop",
      isHero: true,
    },
    {
      id: "arrival-transit",
      title: "Airport Connections & Transit Guides",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통",
        en: "Transit",
      },
      subTag: {
        ko: "기초 정보",
        en: "Basic Info",
      },
      subTagType: "BASIC",
      readTime: "2 min",
      updatedDate: "July 2026",
      overview: "In-depth transit information on trains, buses, and taxis to travel from Incheon Airport to your destinations.",
      details: [
        "Purchase a T-money transit card at any convenience store and top it up with cash for optimal fares on subways and buses.",
        "Use local navigation apps like KakaoMap or Naver Map instead of international ones for accurate local routing directions.",
      ],
      officialChannelNotice: "Please reconfirm the latest operational routes and fares on official transit websites or airport guides.",
    },
    {
      id: "payment-exchange",
      title: "Payments & Money Exchange Rules",
      category: "PAYMENT",
      categoryLabel: {
        ko: "결제·환승",
        en: "Payment",
      },
      subTag: {
        ko: "여행 전 필수",
        en: "Pre-trip Essential",
      },
      subTagType: "ESSENTIAL",
      readTime: "3 min",
      updatedDate: "July 2026",
      overview: "Most merchants in Korea accept international credit cards, but keeping some cash is recommended for small shops.",
      details: [
        "Visa and Mastercard issued overseas work fine at franchise stores and major retail shops.",
        "For small emergency cash, exchange currencies at airport bank branches or authorized city exchange booths (e.g., Myeong-dong).",
      ],
    },
    {
      id: "public-rules",
      title: "Public Manners & Etiquettes (Tipping Rules)",
      category: "PAYMENT",
      categoryLabel: {
        ko: "결제·환승",
        en: "Payment",
      },
      subTag: {
        ko: "문화 차이",
        en: "Culture Gap",
      },
      subTagType: "CULTURE",
      readTime: "1 min",
      updatedDate: "July 2026",
      overview: "Daily regulations and practices to harmonize with locals during your transit and sightseeing activities.",
      details: [
        "Avoid making phone calls inside subways or buses, and speak in low tones to maintain public quietness.",
        "Stand to the right side on escalators to clear pathways, and leave priority seats empty for elderly or pregnant passengers.",
      ],
    },
    {
      id: "emergency-safety",
      title: "Emergency Hotlines & Safety Assistance",
      category: "SAFETY",
      categoryLabel: {
        ko: "안전·긴급",
        en: "Safety & Emergency",
      },
      subTag: {
        ko: "긴급 정보",
        en: "Emergency Info",
      },
      subTagType: "EMERGENCY",
      readTime: "3 min",
      updatedDate: "July 2026",
      overview: "Crucial contact numbers for health emergencies, reporting incidents, or receiving multilingual translations.",
      details: [
        "Dial 119 for medical emergency rescue, and dial 112 to contact local police stations.",
        "Dial 1345 to reach the immigration contact center for general stay guidelines.",
        "Dial 1330 to contact the tourist interpretation helpline offering 24/7 services in English, Chinese, and Japanese.",
      ],
      officialChannelNotice: "For passport loss or critical consular aid, please always verify the official address and hours of your home embassy.",
    },
    {
      id: "checkout-trash",
      title: "Lodgings Rules & Tax Refund Guide",
      category: "SHOPPING",
      categoryLabel: {
        ko: "쇼핑",
        en: "Shopping",
      },
      subTag: {
        ko: "쇼핑 도움",
        en: "Shopping Help",
      },
      subTagType: "SHOPPING",
      readTime: "4 min",
      updatedDate: "July 2026",
      overview: "Crucial practices regarding room checkout routines, mandatory recycling codes, and claim instant tax refunds.",
      details: [
        "Separate recyclables (plastic, glass, cans), food waste, and general waste into designated bins before discarding.",
        "Review host checkout notes and support energy saving by turning off air conditioners and heaters when leaving.",
      ],
    },
  ],
};
