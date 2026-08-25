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
    id: "faq-arex-express-vs-allstop",
    question: {
      ko: "AREX 공항철도 직통열차와 일반열차는 어떻게 다른가요?",
      en: "What is the difference between AREX Express and All-Stop Train?",
    },
    answer: {
      ko: "직통열차는 인천공항에서 서울역까지 43분 만에 무정차 직행(11,000원, 지정좌석, 전용 승차권 발권 필요, 서울역 도심공항터미널 이용 가능)하며, 일반열차는 14개 역에 모두 정차(4,450원, 약 59분, T-money/WOWPASS 즉시 태그 가능)합니다.",
      en: "The Express Train runs non-stop between Incheon Airport and Seoul Station in 43 mins (₩11,000, reserved seat, requires dedicated ticket, free City Airport check-in). The All-Stop Train stops at all 14 stations (₩4,450, ~59 mins, tap directly with T-Money/WOWPASS).",
    },
  },
  {
    id: "faq-arex-tmoney-express",
    question: {
      ko: "T-money 교통카드로 직통열차를 바로 탈 수 있나요?",
      en: "Can I tap a T-money card to ride the AREX Express Train?",
    },
    answer: {
      ko: "아닙니다. 직통열차는 지정좌석제이므로 공항철도 전용 승차권(온라인 QR 승차권 또는 역 발권기)을 별도로 발권하셔야 합니다. 반면 일반열차는 개찰구에 T-money를 바로 태그하여 탑승하실 수 있습니다.",
      en: "No. The Express Train has reserved seating and requires a separate dedicated ticket (online QR or station kiosk). Only the All-Stop Train allows direct tapping with T-Money.",
    },
  },
  {
    id: "faq-kobus-freepass",
    question: {
      ko: "외국인도 고속버스 프리패스(KOBUS)를 구매할 수 있나요?",
      en: "Can foreign tourists purchase the KOBUS Express Bus Free Pass?",
    },
    answer: {
      ko: "네, 외국인도 이용 가능합니다. 단, 오프라인 터미널 매표소에서는 프리패스를 판매하지 않으므로 코버스(kobus.co.kr) 공식 사이트 또는 앱에서 온라인 신용카드로 구매하셔야 합니다. 동일 구간은 편도 1회만 탑승 가능하므로 전국 순환 여행(서울➔전주➔부산➔서울) 시 극도의 가성비를 누릴 수 있습니다.",
      en: "Yes, foreign tourists can use it. However, the Free Pass cannot be purchased at terminal ticket counters—you must purchase it online via Kobus (kobus.co.kr) or the mobile app with a credit card. Since each route is limited to one-way per direction, it is best suited for nationwide circular itineraries (e.g., Seoul ➔ Jeonju ➔ Busan ➔ Seoul).",
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
      id: "arex-express-vs-allstop",
      title: "AREX 공항철도 완벽 가이드: 직통열차 vs 일반열차 비교 및 선택법",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통·공항",
        en: "Transit & Airport",
      },
      subTag: {
        ko: "공항 이동 필수",
        en: "Airport Essential",
      },
      subTagType: "TRANSIT",
      readTime: "3분 읽기",
      updatedDate: "2026년 8월",
      overview: "인천공항에서 서울 도심으로 이동할 때 직통열차(43분/11,000원)와 일반열차(59분/4,450원) 중 내 숙소와 일정에 맞는 최적의 열차를 확인하세요.",
      checklist: [
        "직통열차: 43분 논스톱 / ₩11,000 / 지정좌석제",
        "일반열차: 59분 (14개역 정차) / ₩4,450 / 교통카드 태그",
        "서울역 도심공항터미널: 직통 승차권 소지자 무료 이용",
        "홍대/공덕 숙소: 일반열차가 환승 없이 직행 가능",
      ],
      details: [
        "⚡ 직통열차 (Express Train): 인천공항(T1/T2) ↔ 서울역을 무정차 직행합니다. KTX급 지정좌석, 무료 Wi-Fi, 수하물 보관 공간이 완비되어 있습니다. 특히 서울역 도심공항터미널에서 당일 항공권 사전 탑승수속(체크인)과 수하물 위탁, 출국심사를 무료로 마칠 수 있어 귀국날 매우 편리합니다. (T-money 바로 태그 불가, 전용 승차권 발권 필요)",
        "🚇 일반열차 (All-Stop Train): 김포공항, 디지털미디어시티, 홍대입구, 공덕 등 14개 모든 역에 정차하는 통근형 지하철입니다. T-money, WOWPASS로 개찰구에 바로 태그하여 탑승할 수 있으며, 숙소가 홍대나 공덕 부근인 경우 직통열차보다 환승 없이 더 빠르게 도착할 수 있습니다.",
        "💡 공식 운임 안내 링크: 직통열차 운임 안내 (https://www.airportrailroad.com/train/express/introduce) | 일반열차 운임 안내 (https://www.airportrailroad.com/train/normal/fare)",
      ],
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
      officialChannelNotice: "공항철도 실시간 시간표 및 열차 예매는 AREX 공식 홈페이지(airportrailroad.com)에서 확인하실 수 있습니다.",
    },
    {
      id: "incheon-to-regional-cities",
      title: "인천공항에서 서울을 거치지 않고 지방 도시(전주·부산·강릉) 바로 가기",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통·공항",
        en: "Transit & Airport",
      },
      subTag: {
        ko: "지방 여행 팁",
        en: "Regional Route",
      },
      subTagType: "TRANSIT",
      readTime: "4분 읽기",
      updatedDate: "2026년 8월",
      overview: "첫 여행지가 서울이 아닌 전주, 부산, 강릉, 경주일 때, 서울 시내를 거치지 않고 공항에서 직행 리무진이나 KTX로 빠르게 이동하는 3가지 현실적인 경로입니다.",
      checklist: [
        "전주 직행: 인천공항 1층 9~10번 홈 직행 리무진 (환승 없이 3시간 20분 / ₩33,000)",
        "KTX 환승: AREX(공덕/서울역) ➔ 용산역 KTX 전라선 (2시간 40분 / ₩45,600)",
        "광명역 우회 셔틀: 6770번 버스(50분) ➔ KTX 광명역 ➔ 전주/부산 KTX (도심 정체 우회)",
        "티켓 예매: 티머니GO(시외버스) 및 레츠코레일(KTX) 사전 예매 권장",
      ],
      details: [
        "1. 직행 공항 리무진 버스 (추천 1순위): 인천공항 제1·2터미널 1층 지방행 버스 승차장에서 전주, 강릉, 대전, 광주 등으로 환승 없이 바로 이동할 수 있습니다. 짐이 많고 피로한 입국 첫날 가장 편안한 이동 수단입니다. (전주행 기준 약 3시간 20분 소요, ₩33,000)",
        "2. AREX + 용산/서울역 KTX 환승 (정시성 최고): 공항철도 탑승 후 서울역이나 용산역(전라선 전주행 KTX 전용 출발역)으로 이동하여 KTX로 환승합니다. 도로 정체 없이 정확한 도착 시간을 보장합니다. (AREX ₩11,000 + KTX ₩34,600 = 약 ₩45,600)",
        "3. KTX 광명역 고속 셔틀(6770번): 인천공항에서 서울 도심을 진입하지 않고 KTX 광명역으로 50분 만에 직행한 뒤, 광명역에서 전주/부산행 하행 KTX를 바로 탑승하는 스마트 우회 경로입니다.",
      ],
      imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop",
      officialChannelNotice: "지방행 공항버스 시간표는 인천국제공항 공식 포털(airport.kr) 교통안내 페이지에서 확인하실 수 있습니다.",
    },
    {
      id: "kobus-express-bus-freepass",
      title: "전국 고속버스 무제한 자유이용권: 코버스(KOBUS) 프리패스 완벽 가이드",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통·패스",
        en: "Transit & Pass",
      },
      subTag: {
        ko: "장거리 알뜰 패스",
        en: "Express Bus Pass",
      },
      subTagType: "TRANSIT",
      readTime: "4분 읽기",
      updatedDate: "2026년 8월",
      overview: "서울, 부산, 전주, 여수, 경주 등 전국을 장거리로 순회할 때 우등·일반 고속버스를 정해진 기간 동안 무제한 이용할 수 있는 코버스(KOBUS) 프리패스(3/4/5/7일권) 총정리입니다.",
      checklist: [
        "3일권 (주말포함): ₩88,000 / 4일권 (주중전용): ₩81,000",
        "5일권 (주말포함): ₩110,000 / 7일권 (주말포함): ₩132,000",
        "이용 등급: 우등고속 및 일반고속 무제한 (프리미엄 고속 제외)",
        "동일 노선 편도 1회 제한: 서울 ➔ 전주 ➔ 부산 ➔ 서울 등 '전국 순환 코스'에 최적화",
        "구매 방법: 코버스(kobus.co.kr) 홈페이지/앱에서 온라인 신용카드 결제 (터미널 창구 구매 불가)",
      ],
      details: [
        "🎫 패스 종류 및 요금: 3일권(₩88,000, 주말포함), 4일권(₩81,000, 월~목 주중 전용), 5일권(₩110,000, 주말포함), 7일권(₩132,000, 주말포함). 편도 3.5만~4만 원에 달하는 서울-부산/여수 우등버스를 왕복 1회 이상 탑승하고 중간 도시를 경유하면 개별 발권 대비 매우 경제적입니다.",
        "⚠️ 핵심 이용 규칙 (동일 노선 편도 1회): 유효기간 내 동일 구간은 편도 1회(왕복 1회)만 이용할 수 있습니다. (예: 서울➔부산 1회 탑승 후 동일한 서울➔부산 재탑승 불가, 부산➔서울 복귀 편도는 1회 가능). 따라서 단일 도시 단순 왕복보다는 여러 도시를 거치는 순환형 여행에 적합합니다.",
        "🏢 적용 운송사 및 터미널 유의: 8대 고속버스 회사(금호, 동부, 동양, 삼화, 속리산, 중앙, 천일, 한일) 운행 차량에만 적용됩니다. 한국은 시외버스터미널과 고속버스터미널이 분리된 도시가 많으므로, 코버스(Kobus) 예매 노선인지 반드시 확인 후 탑승하세요.",
        "💡 공식 프리패스 안내 링크: 코버스 고속버스 프리패스 안내 (https://www.kobus.co.kr/adtnprdnew/frps/frpsPrchGd.do)",
      ],
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
      officialChannelNotice: "프리패스 잔여 좌석 조회 및 실시간 예매는 코버스(kobus.co.kr) 공식 사이트에서만 가능합니다.",
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
      id: "arex-express-vs-allstop",
      title: "AREX Airport Railroad: Express vs. All-Stop Train Guide",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통·공항",
        en: "Transit & Airport",
      },
      subTag: {
        ko: "공항 이동 필수",
        en: "Airport Essential",
      },
      subTagType: "TRANSIT",
      readTime: "3 min read",
      updatedDate: "August 2026",
      overview: "Traveling from Incheon Airport to downtown Seoul? Compare the Non-stop Express Train (43 mins / ₩11,000) and Commuter All-Stop Train (59 mins / ₩4,450) to pick the best option.",
      checklist: [
        "Express: 43 mins Non-stop / ₩11,000 / Reserved seating",
        "All-Stop: 59 mins (14 stops) / ₩4,450 / Tap T-Money",
        "City Airport Terminal: Free early check-in at Seoul Station for Express ticket holders",
        "Hongdae/Gongdeok hotel: All-Stop train takes you directly without subway transfer",
      ],
      details: [
        "⚡ Express Train: Runs non-stop between Incheon Airport (T1/T2) and Seoul Station. Features high-speed KTX-style reserved seating, complimentary Wi-Fi, and spacious luggage racks. Bonus: Enjoy free early flight check-in and immigration clearance at the Seoul Station City Airport Terminal on your departure day. (Requires dedicated ticket; T-Money cannot be tapped directly at turnstiles).",
        "🚇 All-Stop Train: A commuter subway stopping at all 14 stations including Gimpo Airport, Digital Media City, Hongik Univ. (Hongdae), and Gongdeok. Seamlessly tap with your T-money or WOWPASS card. If your hotel is located in Hongdae or Mapo, this is often faster than transferring from Seoul Station.",
        "💡 Official Fare & Information Links: AREX Express Train Fare Guide (https://www.airportrailroad.com/train/express/introduce) | AREX All-Stop Train Fare Guide (https://www.airportrailroad.com/train/normal/fare)",
      ],
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
      officialChannelNotice: "Real-time timetables and ticket reservations are accessible via the official AREX website (airportrailroad.com).",
    },
    {
      id: "incheon-to-regional-cities",
      title: "Traveling Directly from Incheon Airport to Regional Cities (Jeonju, Busan, Gangneung)",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통·공항",
        en: "Transit & Airport",
      },
      subTag: {
        ko: "지방 여행 팁",
        en: "Regional Route",
      },
      subTagType: "TRANSIT",
      readTime: "4 min read",
      updatedDate: "August 2026",
      overview: "If your first travel destination is not Seoul but a regional gem like Jeonju, Busan, or Gangneung, here are the 3 most practical ways to travel directly from Incheon Airport.",
      checklist: [
        "Direct Bus to Jeonju: Departs from 1F Regional Bus Platforms (Non-stop in 3h 20m / ₩33,000)",
        "KTX Transfer: AREX to Gongdeok/Seoul ➔ Yongsan Station KTX Jeolla Line (2h 40m / ₩45,600)",
        "Gwangmyeong Shuttle: Bus No. 6770 (50m) ➔ KTX Gwangmyeong ➔ Southbound KTX",
        "Advance Tickets: TmoneyGO app (Buses) & letskorail.com (KTX)",
      ],
      details: [
        "1. Direct Airport Limousine Bus (Top Recommendation): Board regional buses directly at the 1F Arrival Hall of T1/T2 to cities like Jeonju, Gangneung, Daejeon, and Gwangju. The most stress-free option with heavy luggage without navigating train transfers. (~3 hrs 20 mins to Jeonju, ₩33,000)",
        "2. AREX + Yongsan/Seoul Station KTX (Fastest & Guaranteed Schedule): Take the AREX train into Seoul and transfer to a KTX train at Yongsan Station (dedicated departure terminal for Jeonju/Jeolla line) or Seoul Station. Completely immune to highway traffic. (AREX ₩11,000 + KTX ₩34,600 = ~₩45,600)",
        "3. KTX Gwangmyeong Station Shuttle (Route 6770): An express shuttle linking Incheon Airport to KTX Gwangmyeong Station in 50 minutes, letting you bypass central Seoul congestion and catch southbound KTX bullet trains immediately.",
      ],
      imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop",
      officialChannelNotice: "Check regional airport bus timetables directly on the Incheon International Airport portal (airport.kr).",
    },
    {
      id: "kobus-express-bus-freepass",
      title: "Nationwide Unlimited Express Bus Travel: KOBUS Free Pass Guide",
      category: "TRANSIT",
      categoryLabel: {
        ko: "교통·패스",
        en: "Transit & Pass",
      },
      subTag: {
        ko: "장거리 알뜰 패스",
        en: "Express Bus Pass",
      },
      subTagType: "TRANSIT",
      readTime: "4 min read",
      updatedDate: "August 2026",
      overview: "Travel across Korea (Seoul, Busan, Jeonju, Yeosu, Gyeongju) with unlimited rides on Superior (우등) and Standard (일반) Express Buses using the KOBUS Free Pass (3, 4, 5, or 7 Days).",
      checklist: [
        "3-Day Pass (All Days): ₩88,000 / 4-Day Pass (Weekday Only): ₩81,000",
        "5-Day Pass (All Days): ₩110,000 / 7-Day Pass (All Days): ₩132,000",
        "Valid Classes: Unlimited rides on Superior & Standard Express buses (Excludes Premium)",
        "One-way per route limit: Ideal for circular routes (Seoul ➔ Jeonju ➔ Busan ➔ Seoul)",
        "Online booking required: Purchase & reserve seats via Kobus (kobus.co.kr) website/app",
      ],
      details: [
        "🎫 Pass Types & Fares: 3-Day (₩88,000, incl. weekends), 4-Day (₩81,000, Mon-Thu weekdays only), 5-Day (₩110,000), 7-Day (₩132,000). Highly cost-effective when combining long-distance trips like Seoul-Busan or Seoul-Yeosu (regular ~₩35,000-40,000 one-way each).",
        "⚠️ One-Way Per Route Rule: You can only travel once per direction on the same route during the pass validity (e.g., you cannot take Seoul ➔ Busan twice, but you can take Busan ➔ Seoul once). Designed specifically for multi-city circular travel rather than daily point-to-point commuting.",
        "🏢 8 Participating Companies: Valid only on buses operated by the 8 major express bus carriers (Kumho, Dongbu, Dongyang, Samhwa, Songnisan, Jungang, Cheonil, and Hanil). Always verify departure terminal (Express vs. Intercity).",
        "💡 Official Pass Guide Link: KOBUS Express Bus Free Pass Guide (https://www.kobus.co.kr/adtnprdnew/frps/frpsPrchGd.do)",
      ],
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
      officialChannelNotice: "Seat reservations and real-time pass issuance are supported exclusively through the official Kobus portal (kobus.co.kr).",
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
