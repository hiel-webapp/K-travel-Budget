export type GuideCategory =
  | "navigation"
  | "money"
  | "transit"
  | "dining"
  | "emergency"
  | "saving_hacks";

export interface GuideCard {
  id: string;
  category: GuideCategory;
  badge: "Must-Know" | "Fatal Mistake" | "Local Rule" | "Money Saver" | "Essential" | "Pro Tip";
  titleEn: string;
  titleKo: string;
  summaryEn: string;
  summaryKo: string;
  detailsEn: string[];
  detailsKo: string[];
  proTipEn: string;
  proTipKo: string;
}

export const GUIDE_CATEGORIES: {
  key: "all" | GuideCategory;
  labelEn: string;
  labelKo: string;
  icon: string;
}[] = [
  { key: "all", labelEn: "All Topics", labelKo: "전체 가이드", icon: "✨" },
  { key: "navigation", labelEn: "Navigation", labelKo: "디지털 & 지도", icon: "🗺️" },
  { key: "money", labelEn: "Money & Cards", labelKo: "결제 & 환전", icon: "💳" },
  { key: "transit", labelEn: "Transit", labelKo: "대중교통", icon: "🚇" },
  { key: "dining", labelEn: "Dining Rules", labelKo: "식당 & 카페", icon: "🥢" },
  { key: "emergency", labelEn: "Emergency", labelKo: "긴급 상황 & 안전", icon: "🚨" },
  { key: "saving_hacks", labelEn: "Saving Hacks", labelKo: "경비 절약", icon: "💡" },
];

export const GUIDE_CARDS: GuideCard[] = [
  // =========================================================================
  // 1. Navigation (디지털 생존 & 지도)
  // =========================================================================
  {
    id: "nav_google_vs_naver",
    category: "navigation",
    badge: "Fatal Mistake",
    titleEn: "Google Maps vs Naver Map: The Navigation Dilemma",
    titleKo: "구글맵 vs 네이버 지도: 한국 길찾기 필수 상식",
    summaryEn: "Google Maps walking directions do NOT work accurately in South Korea due to national security spatial data regulations.",
    summaryKo: "한국에서는 국가 안보 법령으로 인해 구글 지도의 도보 내비게이션(Walking Directions)이 작동하지 않습니다.",
    detailsEn: [
      "Google Maps works for subway and bus transit routes, but pedestrian walking routes are either broken or completely disabled.",
      "Install Naver Map (네이버 지도) or KakaoMap (카카오맵) before landing. Both apps support English and Chinese interfaces.",
      "When searching in Naver Map English mode, searching in Korean (copy-pasted from Papago) yields 10x more accurate results than Romanized spelling.",
    ],
    detailsKo: [
      "구글 지도는 지하철·버스 환승 정보는 지원하지만, 실제 걷는 도보 길찾기는 비활성화되어 있거나 크게 우회합니다.",
      "입국 전 '네이버 지도(Naver Map)' 또는 '카카오맵(KakaoMap)'을 반드시 설치하세요. 영어 및 중국어 UI를 지원합니다.",
      "네이버 지도 영문 모드에서도 장소명을 한글로 복사·붙여넣기하여 검색하면 정확도가 10배 이상 높아집니다.",
    ],
    proTipEn: "Set Naver Map language to English in settings, but keep the Korean names handy in your notes app for 100% accurate search queries.",
    proTipKo: "네이버 지도 앱 언어를 영어로 설정하되, 가고 싶은 장소의 한글 이름을 메모장에 미리 복사해두면 오차 없는 검색이 가능합니다.",
  },
  {
    id: "nav_esim_010_number",
    category: "navigation",
    badge: "Must-Know",
    titleEn: "eSIM vs SIM: Why You Need a Korean 010 Mobile Number",
    titleKo: "데이터 전용 eSIM vs 010 수신 번호 SIM: 웨이팅 필수 팁",
    summaryEn: "Popular trendy restaurants and pop-up stores require a Korean 010 phone number to register on tablet waitlist kiosks.",
    summaryKo: "성수동 팝업스토어나 인기 맛집 현장 태블릿(캐치테이블, 테이블링)은 국내 010 번호가 없으면 대기 등록이 불가능합니다.",
    detailsEn: [
      "Data-only eSIMs are cheap and convenient, but you will be blocked from joining on-site digital queues (CatchTable / Tabling kiosks).",
      "If you plan to visit hot spots in Seongsu, Hongdae, or famous BBQ joints, purchase a SIM/eSIM that includes an incoming voice/SMS 010 number.",
      "CatchTable now offers a global version for foreign tourists, but many authentic local restaurants still only use the domestic 010 kiosk system.",
    ],
    detailsKo: [
      "데이터 전용 eSIM은 저렴하지만 현장 태블릿 대기 키오스크(캐치테이블, 테이블링) 접수가 불가능해 입장이 거부될 수 있습니다.",
      "성수동 팝업스토어나 인기 맛집 투어가 주 목적이라면 반드시 010 수신(문자/음성)이 포함된 유심/eSIM을 구매하세요.",
      "캐치테이블 글로벌 앱이 보급되고 있으나, 골목 로컬 맛집이나 한정 팝업은 여전히 국내 010 번호 인증을 요구합니다.",
    ],
    proTipEn: "If you only have a data eSIM, ask the restaurant staff politely: 'Oeguk-in-inde, daegi eotteoke haeyo?' (I'm a foreigner, how do I queue?). Many will write your name manually.",
    proTipKo: "데이터 전용 요금제라면 직원에게 '외국인인데 대기 어떻게 하나요?'라고 정중히 문의하면 수기로 명단을 작성해 주기도 합니다.",
  },
  {
    id: "nav_survival_apps",
    category: "navigation",
    badge: "Essential",
    titleEn: "Top 3 Survival Apps to Download Before Landing",
    titleKo: "한국 입국 전 무조건 설치해야 하는 생존 필수 앱 3선",
    summaryEn: "Forget Uber and Google Translate. Master Kakao T, Papago, and CatchTable Global for a seamless trip.",
    summaryKo: "우버와 구글 번역기 대신 카카오 T, 파파고, 캐치테이블 글로벌을 설치해야 여행이 편안해집니다.",
    detailsEn: [
      "Kakao T: Korea's dominant taxi app. Switch language to English to register overseas credit cards without needing a Korean payment account.",
      "Papago (by Naver): Significantly more accurate than Google Translate for Korean honorifics, food menus, and handwritten signs via image translate.",
      "CatchTable Global: Discover trending gourmet spots, make reservations in English, and bypass lines at foreigner-friendly venues.",
    ],
    detailsKo: [
      "카카오 T: 한국 1위 택시 호출 앱으로, 언어를 영어로 전환하면 국내 계좌 없이도 해외 신용카드로 다이렉트 호출이 가능합니다.",
      "네이버 파파고: 구글 번역 대비 한국어 경어체 및 음식 메뉴판 이미지 실시간 번역 정확도가 압도적입니다.",
      "캐치테이블 글로벌: 외국인 전용 예약 시스템을 지원하는 트렌디 레스토랑의 영어 예약 및 대기 관리를 지원합니다.",
    ],
    proTipEn: "Take a photo of complex restaurant wall menus inside Papago's Image Translate mode for instant, crystal-clear bilingual explanations.",
    proTipKo: "벽에 붙은 손글씨 메뉴판은 파파고 앱의 '이미지 실시간 번역' 기능을 켜고 비추기만 하면 한눈에 메뉴를 파악할 수 있습니다.",
  },

  // =========================================================================
  // 2. Money & Payments (결제 & 현금의 진실)
  // =========================================================================
  {
    id: "money_why_need_cash",
    category: "money",
    badge: "Fatal Mistake",
    titleEn: "Why You Still Need Physical Cash in a Cashless Country",
    titleKo: "카드 천국 한국에서 여전히 실물 현금이 꼭 필요한 이유",
    summaryEn: "Korea is 99% digital, but transit card reload machines and traditional market stalls ONLY accept Korean Won cash.",
    summaryKo: "한국은 카드 결제율 99% 국가지만, 대중교통 카드(티머니) 충전기와 전통시장·포토부스는 오직 원화 현금만 받습니다.",
    detailsEn: [
      "Subway station T-Money card reload kiosks accept ONLY physical Korean Won banknotes. Credit cards are strictly rejected at kiosks.",
      "Traditional street food markets (Gwangjang, Jagalchi), self photo booths (Life4Cuts), and lucky temple souvenirs require cash.",
      "Keep ₩50,000 to ₩100,000 (approx. $40–$75 USD) in small cash bills (₩1,000, ₩5,000, ₩10,000) inside your wallet at all times.",
    ],
    detailsKo: [
      "지하철역 내 티머니 충전기는 오직 원화 지폐 현금만 투입 가능하며, 해외 및 국내 신용카드는 충전기에 투입할 수 없습니다.",
      "광장시장·자갈치시장 등 전통시장 노점, 포토부스(인생네컷), 궁궐 앞 기념품 자판기는 현금 지불이 필수적입니다.",
      "지갑 속에 항상 5만 원~10만 원 상당의 소액 지폐(1천 원, 5천 원, 1만 원권)를 비상금으로 상시 소지하세요.",
    ],
    proTipEn: "Exchange just ₩50,000 at the airport ATM for your first subway ride, then exchange the rest at Myeongdong money changers for superior FX rates.",
    proTipKo: "공항에서는 첫 지하철 충전용으로 5만 원 정도만 인출하고, 나머지 경비는 환율 우대가 높은 명동 사설 환전소를 활용하세요.",
  },
  {
    id: "money_all_in_one_cards",
    category: "money",
    badge: "Must-Know",
    titleEn: "WOWPASS vs Climate Card vs T-Money: Which One?",
    titleKo: "와우패스(WOWPASS) vs 기후동행카드 vs 일반 티머니 완전 비교",
    summaryEn: "Choose the right card based on your itinerary: prepaid FX debit, unlimited Seoul subway rides, or pure transit.",
    summaryKo: "여행 일정에 맞춰 선불 외화카드, 서울 무제한 교통패스, 범용 교통카드 중 최적의 카드를 선택하세요.",
    detailsEn: [
      "WOWPASS: All-in-one prepaid debit card + T-Money. Load your home currency at airport/subway kiosks without ATM fees. Best for hassle-free shopping.",
      "Climate Card Tourist Pass (기후동행카드): Unlimited Seoul subway and bus rides for 1 to 5 days (₩5,000–₩15,000). Highly economical if staying within Seoul only.",
      "Standard T-Money Card: Nationwide transit card valid on all subways, buses, and taxis across Seoul, Busan, Jeju, and Gangneung.",
    ],
    detailsKo: [
      "와우패스 (WOWPASS): 무인 환전 선불카드 + 티머니 결합형. 자국 통화를 키오스크에 직접 투입하여 충전하며 쇼핑에 최적입니다.",
      "기후동행카드 관광권: 서울 시내 지하철과 버스를 1일~5일 동안 무제한 탑승(5,000원~15,000원). 서울 집중 여행 시 가성비 최고입니다.",
      "일반 티머니: 서울, 부산, 제주, 강릉 등 대한민국 전역의 지하철, 버스, 택시에서 사용 가능한 표준 교통카드입니다.",
    ],
    proTipEn: "If visiting Busan or Jeju, stick with WOWPASS or standard T-Money, as Seoul Climate Card is strictly invalid outside the capital area.",
    proTipKo: "기후동행카드는 서울 외곽(광역버스, 신분당선, 타 지역)에서 사용이 제한되므로 부산·제주 병행 시 일반 티머니/와우패스가 필수입니다.",
  },
  {
    id: "money_immediate_tax_refund",
    category: "money",
    badge: "Money Saver",
    titleEn: "Immediate Tax Refund: Save 7-9% On-the-Spot with Passport",
    titleKo: "현장 즉시 면세: 여권 제시로 7~9% 즉시 할인받는 법",
    summaryEn: "Show your physical passport at Olive Young, Daiso, and retail stores to deduct VAT directly at the cash register.",
    summaryKo: "올리브영, 다이소, 백화점에서 15,000원 이상 결제 시 여권을 제시하면 부가세(7~9%)가 계산대에서 즉시 차감됩니다.",
    detailsEn: [
      "Eligible on purchases over ₩15,000 ($11 USD) at certified tax-free stores across Korea.",
      "Airport refund counters have notorious lines. Immediate on-site refund saves you 45 minutes of airport queues on departure day.",
      "You MUST present your physical passport (copies or phone photos are usually not legally accepted for instant tax deduction).",
    ],
    detailsKo: [
      "사후면세점 지정 매장에서 1회 결제 금액 15,000원 이상 구매 시 즉시 면세 혜택이 적용됩니다.",
      "출국 당일 인천공항 세관 환급 창구의 긴 대기열을 피할 수 있어 최소 40분 이상의 출국 수속 시간을 절약해 줍니다.",
      "여권 사본이나 휴대폰 사진은 법적으로 인정되지 않으므로 반드시 '실물 여권'을 지참하여 결제 시 제시해야 합니다.",
    ],
    proTipEn: "Always carry your physical passport during shopping days in Myeongdong and Seongsu to take advantage of instant tax refunds every single time.",
    proTipKo: "명동, 성수, 홍대 등 쇼핑 중심지에서는 실물 여권을 항상 가방에 소지하여 결제 시마다 즉시 할인을 챙기세요.",
  },

  // =========================================================================
  // 3. Transit (대중교통 마스터)
  // =========================================================================
  {
    id: "transit_airport_transfer",
    category: "transit",
    badge: "Must-Know",
    titleEn: "Airport Transfer Showdown: AREX Express vs All-Stop vs Bus",
    titleKo: "인천공항 이동 3대 수단: AREX 직통 vs 일반열차 vs 공항 리무진",
    summaryEn: "Pick the optimal route between Incheon Airport and central Seoul based on your final hotel location and luggage volume.",
    summaryKo: "숙소 위치와 수하물 개수에 따라 직통열차, 통근형 일반열차, 호텔 직행 리무진 중 가장 편한 이동 수단을 선택하세요.",
    detailsEn: [
      "AREX Express Train (직통열차): 43 mins non-stop from Incheon T1 to Seoul Station (₩11,000). Reserved comfortable seating and free Wi-Fi.",
      "AREX All-Stop Train (일반열차): 59 mins stopping at 14 stations (₩4,450). Tap directly with T-Money. Ideal for stays in Hongdae or Gongdeok.",
      "Airport Limousine Bus: ₩17,000–₩18,000. Drops you right in front of major hotels in Myeongdong, Gangnam, and Dongdaemun without dragging heavy suitcases.",
    ],
    detailsKo: [
      "AREX 직통열차: 인천공항 T1에서 서울역까지 43분 논스톱 직행(11,000원). 지정좌석제, 무료 Wi-Fi, 전용 승차권 발권 필요.",
      "AREX 일반열차: 14개 역 모두 정차(59분, 4,450원). 티머니 즉시 태그 가능. 홍대입구·공덕 숙소인 경우 환승 없이 직행 가능.",
      "공항 리무진 버스: 17,000원~18,000원. 명동, 강남, 동대문 주요 호텔 바로 앞에 정차하여 무거운 캐리어를 끌지 않아도 됩니다.",
    ],
    proTipEn: "If your flight departs from Terminal 1/2 in the evening, express train ticket holders can check in bags and pass immigration at Seoul Station City Airport Terminal for free in the morning!",
    proTipKo: "귀국일 서울역 도심공항터미널에서 당일 항공권 사전 탑승수속 및 수하물 위탁, 출국심사를 무료로 마치면 공항에서 전용 출국 통로를 이용할 수 있습니다.",
  },
  {
    id: "transit_tag_off_rule",
    category: "transit",
    badge: "Fatal Mistake",
    titleEn: "The Tag-Off Rule: Why You Must Tap Out Every Single Time",
    titleKo: "하차 태그의 비밀: 내릴 때 카드를 안 찍으면 벌어지는 일",
    summaryEn: "Failing to tap your transit card when getting off a bus or subway cancels your free transfer discount and incurs maximum fare penalties.",
    summaryKo: "버스나 지하철에서 내릴 때 교통카드를 태그하지 않으면 환승 할인이 취소되고 최고 요금 페널티가 차감됩니다.",
    detailsEn: [
      "South Korea provides up to 4 FREE or discounted transfers within 30 minutes between subways and buses (up to 60 mins at night).",
      "If you forget to tap your card on the exit reader upon stepping off a bus, the system charges the maximum possible distance fee on your next ride.",
      "Always hear the pleasant voice confirm 'Hacha-imnida' (하차입니다) before exiting through the rear doors.",
    ],
    detailsKo: [
      "한국 대중교통은 지하철과 버스 간 30분 이내(야간 60분) 최대 4회까지 무료/할인 환승 혜택을 제공합니다.",
      "버스 하차 시 뒷문 단말기에 카드를 찍지 않고 그냥 내리면, 다음 승차 시 최대 이동 구간 요금이 추가 페널티로 청구됩니다.",
      "하차 태그 시 단말기에서 '하차입니다'라는 안내 음성과 차감 요금이 정상 표시되는지 반드시 확인하세요.",
    ],
    proTipEn: "Even if you are NOT transferring to another bus, always tap out when exiting the bus to prevent unexpected fare penalties.",
    proTipKo: "다른 버스나 지하철로 환승할 계획이 없더라도, 버스에서 내릴 때는 무조건 카드를 태그하는 습관을 들이세요.",
  },
  {
    id: "transit_subway_etiquette",
    category: "transit",
    badge: "Local Rule",
    titleEn: "Subway Seat Etiquette: Respecting the Unwritten Rules",
    titleKo: "지하철 좌석 매너: 빈자리라도 절대 앉으면 안 되는 곳",
    summaryEn: "Leave the designated elderly seats at car ends and pink carpet pregnant priority seats empty, even during crowded rush hours.",
    summaryKo: "전동차 양 끝의 노약자석과 분홍색 바닥의 임산부 배려석은 빈자리여도 앉지 않고 비워두는 것이 한국의 로컬 에티켓입니다.",
    detailsEn: [
      "Elderly / Disabled Priority Seats (노약자석): Located at both ends of each train car. Young locals will NEVER sit here, even on completely empty trains.",
      "Pink Carpet Seats (임산부 배려석): Marked with pink signs and flooring for expectant mothers. Avoid sitting here to respect local cultural norms.",
      "Backpack Etiquette: During packed morning/evening rush hours (8-9 AM, 6-7 PM), take your backpack off and hold it low or place it on overhead racks.",
    ],
    detailsKo: [
      "노약자 전용석: 차량 양 끝 3개 좌석. 전동차가 텅 비어 있어도 젊은 현지인들은 앉지 않고 비워두는 것이 불문율입니다.",
      "분홍색 임산부 배려석: 초기 임산부를 위한 지정석으로, 현지 문화 존중을 위해 다른 일반 좌석을 이용하는 것을 권장합니다.",
      "출퇴근 백팩 매너: 혼잡한 출퇴근 시간(08~09시, 18~19시)에는 백팩을 앞으로 메거나 발 아래로 내려 승객 통행을 배려하세요.",
    ],
    proTipEn: "If someone scolds you in Korean for sitting in the priority seats, don't panic—bow your head politely, say 'Joesonghamnida' (I'm sorry), and stand up immediately.",
    proTipKo: "혹시 실수로 노약자석에 앉아 어르신의 지적을 받았다면 당황하지 말고 '죄송합니다'라고 인사한 뒤 즉시 일어나면 됩니다.",
  },

  // =========================================================================
  // 4. Dining (식당 & 카페 로컬 룰)
  // =========================================================================
  {
    id: "dining_hidden_utensils_bells",
    category: "dining",
    badge: "Must-Know",
    titleEn: "Where Are My Spoons? Hidden Drawers & Call Bells",
    titleKo: "수저가 어디 있지? 테이블 슬라이딩 서랍과 호출벨의 비밀",
    summaryEn: "Don't search the restaurant for cutlery. Pull the sliding drawer under the tabletop, and press the call button to summon your server.",
    summaryKo: "수저통을 찾아 두리번거리지 마세요. 테이블 옆면 서랍 속에 수저와 휴지가 있으며, 벨을 누르면 직원이 옵니다.",
    detailsEn: [
      "90% of casual Korean restaurants store chopsticks, spoons, napkins, and bottle openers in a sleek sliding drawer mounted on the side of the table.",
      "There is usually a small electronic buzzer (호출벨) glued to the table surface or napkin holder. Press it once, and a chime will alert staff.",
      "If there is no buzzer, gently raise your hand and make eye contact while saying clearly: 'Jeogiyo!' (저기요 - Excuse me!). Never yell or snap fingers.",
    ],
    detailsKo: [
      "한국 식당의 90%는 테이블 옆면 하단에 슬라이딩 서랍이 있어, 서랍을 당기면 숟가락, 젓가락, 물티슈가 완비되어 있습니다.",
      "테이블 표면이나 티슈 박스에 호출벨이 부착되어 있습니다. 직원을 부르고 싶을 때는 손을 흔들지 말고 벨을 한 번만 누르세요.",
      "벨이 없는 노포 식당에서는 손을 가볍게 들며 '저기요!' 또는 '사장님!'이라고 부르면 친절하게 응대해 줍니다.",
    ],
    proTipEn: "Korean dining tables are self-serve for water and side dish refills. Look for signs saying 'Mul-eun Self' (물은 셀프 - Water is self-service).",
    proTipKo: "벽에 '물은 셀프' 또는 반찬 셀프바가 적혀 있다면 물과 추가 반찬은 직접 가져다 먹는 식당입니다.",
  },
  {
    id: "dining_solo_dining_reality",
    category: "dining",
    badge: "Fatal Mistake",
    titleEn: "Solo Dining Reality: The 2-Portion Minimum Order Rule",
    titleKo: "혼밥 여행자의 현실: 숯불 구이·전골 2인분 주문 룰",
    summaryEn: "Grill-at-the-table BBQ, Dakgalbi, and hot pots require a minimum 2-portion order, even if dining completely alone.",
    summaryKo: "삼겹살, 닭갈비, 부대찌개, 곱창 등 테이블에서 조리하는 요리는 혼자 방문해도 최소 2인분 이상 주문해야 합니다.",
    detailsEn: [
      "Korean dining culture is historically communal. Table charcoal grills and large gas burners operate on a minimum 2-person serving basis.",
      "Solo travelers CAN dine at BBQ spots, but you must pay for at least 2 meat portions (e.g., 2 x 150g pork belly).",
      "For true 1-person meals without extra cost, look for soups, stews, and noodle spots: Gukbap, Kimchi Jjigae, Kimbap, or Tonkatsu diners.",
    ],
    detailsKo: [
      "한국의 전통 숯불 구이와 전골 요리는 공유 문화 기반으로, 1인 방문 시에도 테이블 화로 운영상 최소 2인분 주문이 원칙입니다.",
      "혼자서 삼겹살을 드시고 싶다면 2인분을 시켜서 혼자 맛있게 다 드시면 얼마든지 입장이 가능합니다.",
      "1인 전용 혼밥을 원하신다면 국밥, 김치찌개, 백반, 분식(김밥/라면), 돈가스 전문점을 이용하시면 부담 없이 식사할 수 있습니다.",
    ],
    proTipEn: "Ask when entering: 'Honbap dwaeyo?' (혼밥 돼요? - Can I dine solo?). If they nod, you are warmly welcomed!",
    proTipKo: "식당 문을 열고 '혼밥 돼요?'라고 물어보세요. 직원이 반갑게 맞이해 주면 편안하게 식사할 수 있습니다.",
  },
  {
    id: "dining_zero_tipping_cups",
    category: "dining",
    badge: "Local Rule",
    titleEn: "Zero Tipping & The Strict Disposable Cup Ban",
    titleKo: "팁 문화 절대 금지와 매장 내 일회용 플라스틱 컵 법적 금지",
    summaryEn: "Never tip in South Korea—it is rejected and awkward. Also, drinking from plastic disposable cups inside cafes is illegal.",
    summaryKo: "한국은 팁 문화가 전혀 없으며 거스름돈을 남김없이 챙겨야 합니다. 또한 카페 매장 내 일회용 플라스틱 컵 사용은 법적으로 금지되어 있습니다.",
    detailsEn: [
      "Tipping: Absolutely 0%. The bill includes tax and service charge. Leaving extra cash on the table may cause waitstaff to chase you to return your forgotten money.",
      "Cafe Cup Law: Under strict Korean environmental law, cafes cannot serve beverages in single-use plastic cups if you choose 'For Here' (매장 이용).",
      "If you order 'Takeout' (테이크아웃) in a plastic cup, you are legally forbidden from sitting down at a cafe table to drink it.",
    ],
    detailsKo: [
      "팁(Tip) 문화: 0%입니다. 모든 메뉴판 가격에 부가세와 봉사료가 포함되어 있어, 돈을 더 두면 잊은 돈인 줄 알고 쫓아옵니다.",
      "카페 컵 법률: 자원재활용법에 따라 매장 내 취식 시에는 머그잔/유리잔만 제공되며, 일회용 플라스틱 컵 제공은 불법입니다.",
      "테이크아웃 일회용 컵으로 주문한 음료를 들고 매장 내 좌석에 착석하여 마시는 것은 과태료 부과 대상이므로 주의하세요.",
    ],
    proTipEn: "Always specify when ordering at a cafe: 'Deusigo gaseyo?' (For here?) vs 'Pojang-iyo' (Takeaway/To go).",
    proTipKo: "카페 주문 시 직원이 '드시고 가세요, 포장이세요?'라고 물어보면 매장은 '먹고 가요', 테이크아웃은 '포장이요'라고 답하세요.",
  },

  // =========================================================================
  // 5. Emergency (긴급 상황 & 안전)
  // =========================================================================
  {
    id: "emergency_magic_helpline_1330",
    category: "emergency",
    badge: "Must-Know",
    titleEn: "The Magic Helpline 1330: 24/7 Free 3-Way Translation",
    titleKo: "마법의 1330 관광통역안내: 24시간 무료 3자 실시간 통역",
    summaryEn: "Dial 1330 from any phone in Korea for free, 24/7 multilingual tourism advice and live interpretation with taxi drivers or police.",
    summaryKo: "어떤 전화기에서든 1330을 누르면 24시간 연중무휴 무료로 다국어 통역 및 택시 기사와의 실시간 3자 통역을 지원합니다.",
    detailsEn: [
      "1330 Korea Travel Helpline: Operated by the Korea Tourism Organization (KTO). Supports English, Japanese, Chinese, Russian, Vietnamese, and more.",
      "Live 3-Way Interpretation: If your taxi driver is lost or a pharmacist doesn't speak English, call 1330 and hand your phone over for instant translation.",
      "Emergency Numbers: Dial 112 for Police and 119 for Fire & Ambulance medical emergencies. Both services have English translation dispatch.",
    ],
    detailsKo: [
      "1330 관광통역안내전화: 한국관광공사에서 운영하는 24시간 연중무휴 무료 서비스로 영어, 일본어, 중국어 등 8개 국어를 지원합니다.",
      "실시간 3자 통역: 택시 기사와 목적지 소통이 안 되거나 약국에서 증상 설명이 어려울 때 1330 상담원에게 전화를 넘겨주면 해결됩니다.",
      "국가 긴급 번호: 경찰 112, 소방·구급·응급의료 119. 외국어 3자 통역 서비스가 즉시 연결되므로 신속히 도움을 요청하세요.",
    ],
    proTipEn: "Save '+82-2-1330' in your smartphone contacts right now before boarding your flight. It is the ultimate travel safety net.",
    proTipKo: "한국 입국 전 휴대폰 연락처에 '+82-2-1330'을 미리 저장해 두세요. 길을 잃거나 문제가 생겼을 때 최고의 해결책이 됩니다.",
  },
  {
    id: "emergency_late_night_medicine",
    category: "emergency",
    badge: "Essential",
    titleEn: "Late-Night Medicine: Over-the-Counter Convenience Drugs",
    titleKo: "심야 비상약: 24시간 편의점 안전상비의약품 13종 구매법",
    summaryEn: "Pharmacies close early in Korea, but 24-hour convenience stores (CU, GS25, 7-Eleven) stock essential emergency medicines.",
    summaryKo: "밤늦게 약국이 문을 닫아도 24시간 편의점(CU, GS25, 세븐일레븐) 계산대에서 13종의 비상 구급약을 24시간 구매할 수 있습니다.",
    detailsEn: [
      "Convenience Store Meds (안전상비의약품): Painkillers (Tylenol, Advil equivalent), Cold medicine (Panpyrin), Digestive pills (Bearse, Festal), and Muscle pain patches (Pas).",
      "Look behind the cashier counter: Convenience store medicines are not on open shelves; ask the cashier directly for 'Yak' (약).",
      "Daytime Pharmacies: Look for the big red cross sign '약' (Yak). Pharmacists in major Seoul districts frequently speak functional English.",
    ],
    detailsKo: [
      "편의점 상비약 13종: 해열진통제(타이레놀, 어린이부루펜), 감기약(판피린티), 소화제(베아제, 훼스탈), 파스(제일쿨파스) 등 구비.",
      "계산대 뒤편 진열: 의약품은 일반 진열대가 아닌 카운터 안쪽에 보관되어 있으므로 직원에게 '약 있어요?'라고 요청해야 합니다.",
      "주간 일반 약국: 빨간 글씨 '약' 간판을 찾으세요. 명동, 홍대, 강남 등 관광특구 약국은 대부분 기초 영어 소통이 가능합니다.",
    ],
    proTipEn: "For stomach upset after spicy Korean food, walk into any convenience store and buy 'Gas Whal Myung Su' (가스활명수) in a tiny green glass bottle.",
    proTipKo: "매운 음식을 먹고 속이 더부룩할 때는 편의점 온장고에 있는 초록색 병의 '까스활명수'를 사서 마시면 빠르게 진정됩니다.",
  },

  // =========================================================================
  // 6. Saving Hacks (K-Travel Budget 경비 절약 팁)
  // =========================================================================
  {
    id: "saving_hanbok_palace_pass",
    category: "saving_hacks",
    badge: "Money Saver",
    titleEn: "The Hanbok Free Palace Pass: Skip All Admission Fees",
    titleKo: "한복 착용 무료입장 패스: 서울 4대 궁궐 입장료 0원 팁",
    summaryEn: "Wear traditional Korean Hanbok dress to gain 100% free entrance to Gyeongbokgung, Changdeokgung, Deoksugung, and Changgyeonggung.",
    summaryKo: "한복을 대여해 입으면 경복궁, 창덕궁, 덕수궁, 창경궁, 종묘의 모든 입장료가 전액 면제(0원)되어 무료 프리패스 혜택을 받습니다.",
    detailsEn: [
      "Royal Palace Policy: Anyone wearing traditional or modern Hanbok enters royal Joseon palaces completely free without buying a ticket.",
      "Hanbok Rental Shops: Hundreds of rental boutiques line the alleys of Bukchon and Insadong (prices start around ₩15,000–₩25,000 for 2-4 hours, including hair styling).",
      "Night Openings: Hanbok free entry also grants priority admission to popular Gyeongbokgung Palace Moonlight Night Openings!",
    ],
    detailsKo: [
      "고궁 무료입장 제도: 전통 또는 퓨전 한복을 착용한 국내외 관광객은 매표소 발권 없이 개찰구에서 바로 무료입장할 수 있습니다.",
      "한복 대여점: 경복궁역과 안국역 골목에 수백 개 대여점이 성업 중이며(2~4시간 대여 1.5만~2.5만 원선, 헤어 스타일링 포함).",
      "야간 특별 관람: 예약이 치열한 경복궁 달빛 야간개장 행사에서도 한복 착용자는 별도 티켓 없이 현장 무료입장이 허용됩니다.",
    ],
    proTipEn: "Rent your Hanbok near Anguk Station in the morning, visit Gyeongbokgung first, then walk over to Bukchon Hanok Village for incredible cinematic photos.",
    proTipKo: "오전 일찍 안국역 근처에서 한복을 대여하여 경복궁을 둘러본 뒤, 북촌 한옥마을 골목길까지 걸어서 사진을 남기면 최고의 가성비 코스가 완성됩니다.",
  },
  {
    id: "saving_mega_coffee_vs_cafe",
    category: "saving_hacks",
    badge: "Money Saver",
    titleEn: "Mega Coffee vs Aesthetic Cafe: Save ₩5,000 Per Cup",
    titleKo: "메가커피 vs 감성 카페: 하루 커피값 1만 원 아끼는 비결",
    summaryEn: "Indie aesthetic cafes charge ₩6,000–₩8,000 for a latte, while Korean value chains offer massive Venti Iced Americanos for just ₩1,500.",
    summaryKo: "성수동 감성 카페 아메리카노(6,000~8,000원) 대비 메가커피, 컴포즈, 빽다방은 1,500원~2,000원에 대용량 벤티 사이즈를 제공합니다.",
    detailsEn: [
      "Korean Value Chains: Mega Coffee (메가커피), Compose Coffee (컴포즈커피), and Paik's Coffee (빽다방) are on literally every street corner in Korea.",
      "High-Quality Budget Caffeine: A giant 24oz 2-shot Iced Americano costs only ₩1,500 to ₩2,000 ($1.10–$1.50 USD).",
      "Strategy: Visit boutique aesthetic cafes once a day for interior vibes and photos, but fuel daily walking with budget takeout chains.",
    ],
    detailsKo: [
      "빅3 저가 커피 체인: 메가커피, 컴포즈커피, 빽다방은 한국 어느 지하철역과 번화가 골목에도 100m마다 입점해 있습니다.",
      "가성비 카페인 충전: 2샷 대용량 벤티 아이스 아메리카노가 1,500원~2,000원으로 테이크아웃에 최적화되어 있습니다.",
      "스마트 소비 전략: 인테리어 사진 촬영용 감성 카페는 하루 1곳만 방문하고, 이동 중 마실 데일리 커피는 저가 브랜드로 대체하세요.",
    ],
    proTipEn: "Try 'Ah-Ah' (Ice Americano) or 'Jocheong/Dal-gona Latte' at Mega Coffee using easy self-service touch-screen kiosks that support English.",
    proTipKo: "메가커피 키오스크에서 우측 상단 'English'를 누르면 간편하게 '아아(아이스 아메리카노)'를 주문하고 카드 결제할 수 있습니다.",
  },
  {
    id: "saving_5000_hangang_picnic",
    category: "saving_hacks",
    badge: "Pro Tip",
    titleEn: "The ₩5,000 Hangang Picnic: Instant Ramyeon & Sunset Waves",
    titleKo: "단돈 5,000원으로 즐기는 로맨틱 한강 피크닉: 즉석 라면 & 노을",
    summaryEn: "Skip overpriced tourist restaurants. Cook boiling ramen on an induction machine at Hangang park convenience stores for an unforgettable evening.",
    summaryKo: "비싼 식당 대신 한강공원 편의점 은박지 즉석 라면 조리기와 돗자리 대여로 최고의 서울 노을 피크닉을 즐겨보세요.",
    detailsEn: [
      "The Hangang Ramyeon Ritual: Buy an foil bowl ramen packet at Yeouido or Ttukseom Hangang convenience stores (₩3,500–₩4,500, egg included).",
      "Automatic Induction Cookers: Push one button, and boiling water fills the foil bowl to cook piping-hot ramen in exactly 3 minutes 30 seconds.",
      "Picnic Mat Rental: Picnic shops near subway stations (Yeouinaru Exit 2) rent comfortable picnic mats, folding tables, and LED mood lamps for ₩5,000.",
    ],
    detailsKo: [
      "한강 라면 필수 코스: 여의도나 뚝섬 한강공원 편의점에서 봉지 라면과 전용 은박지 용기를 구매합니다(계란 포함 약 4,000원선).",
      "자동 조리기 체험: 용기 바코드를 기계에 찍고 버튼을 누르면 정량 온수와 인덕션 가열로 3분 30초 만에 완벽한 꼬들면이 조리됩니다.",
      "피크닉 세트 대여: 여의나루역 2번 출구 앞 노점이나 대여점에서 돗자리와 미니 테이블을 5,000원선에 대여해 잔디밭 명당을 잡으세요.",
    ],
    proTipEn: "Visit Yeouido Hangang Park around 6:30 PM on a clear evening. Eating hot noodles while watching the golden sun sink into the Han River is pure movie magic.",
    proTipKo: "맑은 날 오후 6시 30분 여의도 한강공원에 방문하세요. 노을빛이 강물에 부서지는 황금빛 스카이라인 앞에서 먹는 라면은 최고의 추억이 됩니다.",
  },
];
