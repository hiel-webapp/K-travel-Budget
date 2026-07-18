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
  overview: string;
  details: string[];
  officialChannelNotice?: string;
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
    {
      id: "local-cafe",
      title: "로컬 카페 문화와 디저트",
      category: "Lifestyle",
      overview: "단순히 커피를 마시는 공간을 넘어 고유한 인테리어와 시그니처 베이커리를 즐기는 미식 문화입니다.",
      tip: "한옥 카페나 바다가 보이는 루프탑 카페 등 지역 테마별 카페 리스트를 탐색해보세요.",
      tags: ["Seoul", "Busan", "Food"],
    },
    {
      id: "nightlife",
      title: "한강공원 및 야간 피크닉",
      category: "Leisure",
      overview: "선선한 밤바람을 맞으며 한강변에서 배달 음식을 먹거나 밤바다를 걷는 낭만적인 야외 문화입니다.",
      tip: "한강 둔치 배달 구역을 활용하거나 즉석 라면 제조 기계를 체험해보는 재미가 쏠쏠합니다.",
      tags: ["Seoul", "Busan", "Activity"],
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
    {
      id: "local-cafe",
      title: "Local Cafe & Dessert Culture",
      category: "Lifestyle",
      overview: "A rich culinary scene emphasizing aesthetic interiors and signature pastries rather than simple coffee.",
      tip: "Check out Hanok (traditional houses) cafes in Seoul or beach-view rooftop cafes in Busan.",
      tags: ["Seoul", "Busan", "Food"],
    },
    {
      id: "nightlife",
      title: "Han River Parks & Night Picnic",
      category: "Leisure",
      overview: "Relaxing outdoors, eating delivered meals by the river at night, or walking along beautiful beaches.",
      tip: "Try utilizing dedicated delivery zones in Han River parks or cooking instant ramen using public vending boilers.",
      tags: ["Seoul", "Busan", "Activity"],
    },
  ],
};

export const K_GUIDE_CONTENTS: Record<"ko" | "en", GuideItem[]> = {
  ko: [
    {
      id: "arrival-transit",
      title: "공항 연결 및 대중교통 이용",
      category: "Transportation",
      overview: "인천공항 입국 후 지하철(공항철도), 버스, 택시를 이용해 목적지로 이동하는 핵심 실무 정보입니다.",
      details: [
        "지하철 및 버스 탑승 시 T-money 카드를 편의점에서 구매 후 현금으로 충전해 사용하는 편이 가장 경제적입니다.",
        "모바일 지도 앱으로 KakaoMap 이나 Naver Map을 사용해야 현지 노선과 소요 시간이 정확하게 안내됩니다.",
      ],
      officialChannelNotice: "대중교통의 실시간 최신 요금과 노선 정보는 공항철도 및 서울시 대중교통 사이트 등 공식 채널에서 반드시 재확인하시기 바랍니다.",
    },
    {
      id: "payment-exchange",
      title: "결제 방식 및 환전 수칙",
      category: "Finance",
      overview: "한국의 대부분 매장은 신용카드와 간편결제 기반이며, 전통시장 등 일부 상황에서 소액의 현금이 활용됩니다.",
      details: [
        "해외 발행 Visa, Mastercard 카드는 프랜차이즈 및 주요 소매점에서 무리 없이 작동합니다.",
        "소액의 예비 현금은 공항 내 은행이나 공인된 사설 환전소(명동 등)에서 환전하는 것이 수수료 관점에서 유리합니다.",
      ],
    },
    {
      id: "dining-etiquette",
      title: "식당 이용 및 주문 예절",
      category: "Dining",
      overview: "한국 식당 고유의 주문 방식 및 셀프 서비스 문화와 에티켓 가이드입니다.",
      details: [
        "대부분의 한식당에서는 기본 반찬(Kimchi 등)이 무료로 무제한 제공되며, 추가 반찬은 '셀프(Self)' 코너를 활용합니다.",
        "테이블 옆면 서랍을 열면 숟가락, 젓가락, 휴지가 정돈되어 있습니다.",
        "벨을 누르면 종업원이 응대하며, 결제는 기본적으로 나가실 때 출입구 카운터에서 진행됩니다.",
      ],
    },
    {
      id: "public-rules",
      title: "공공장소 기본 예절",
      category: "Etiquette",
      overview: "현지인들과 조화롭고 유쾌하게 어우러지기 위해 지켜야 할 일상생활 규정입니다.",
      details: [
        "지하철이나 버스 안에서는 공공 전화를 피하고 작은 목소리로 대화하는 것이 기본 매너입니다.",
        "에스컬레이터 탑승 시 한쪽 통행을 준수하며, 노약자 및 임산부 배려석은 가능한 비워둡니다.",
      ],
    },
    {
      id: "emergency-safety",
      title: "응급 상황 및 안전 가이드",
      category: "Safety",
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
      title: "숙소 이용 및 분리배출 요령",
      category: "Stay",
      overview: "공유 숙소 또는 레지던스 이용 시 환경 자원 보호를 위해 준수해야 할 필수 지침입니다.",
      details: [
        "음식물 쓰레기, 재활용품(플라스틱/유리/캔), 일반 쓰레기를 반드시 구분해서 정해진 수거 장소에 버려야 합니다.",
        "숙소 내부 규정을 확인하여 체크아웃 시 냉난방기와 조명을 모두 끄는 에너지 절약에 협조해주세요.",
      ],
    },
  ],
  en: [
    {
      id: "arrival-transit",
      title: "Airport Connections & Transit Guides",
      category: "Transportation",
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
      category: "Finance",
      overview: "Most merchants in Korea accept international credit cards, but keeping some cash is recommended for small shops.",
      details: [
        "Visa and Mastercard issued overseas work fine at franchise stores and major retail shops.",
        "For small emergency cash, exchange currencies at airport bank branches or authorized city exchange booths (e.g., Myeong-dong).",
      ],
    },
    {
      id: "dining-etiquette",
      title: "Restaurant Manners & Ordering Customs",
      category: "Dining",
      overview: "Common local ordering routines, self-service dining bars, and local restaurant etiquette.",
      details: [
        "Side dishes (Banchan, like Kimchi) are complimentary and refilled at self-service sidebars in most casual Korean diners.",
        "Utensils and napkins are usually kept in a sliding drawer on the side of your dining table.",
        "Press the call button on the table to summon a server, and pay at the counter near the entrance when exiting.",
      ],
    },
    {
      id: "public-rules",
      title: "Public Manners & Etiquettes",
      category: "Etiquette",
      overview: "Daily regulations and practices to harmonize with locals during your transit and sightseeing activities.",
      details: [
        "Avoid making phone calls inside subways or buses, and speak in low tones to maintain public quietness.",
        "Stand to the right side on escalators to clear pathways, and leave priority seats empty for elderly or pregnant passengers.",
      ],
    },
    {
      id: "emergency-safety",
      title: "Emergency Hotlines & Safety Assistance",
      category: "Safety",
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
      title: "Lodgings Rules & Trash Recycling",
      category: "Stay",
      overview: "Crucial practices regarding room checkout routines and mandatory recycling codes for shared accommodations.",
      details: [
        "Separate recyclables (plastic, glass, cans), food waste, and general waste into designated bins before discarding.",
        "Review host checkout notes and support energy saving by turning off air conditioners and heaters when leaving.",
      ],
    },
  ],
};
