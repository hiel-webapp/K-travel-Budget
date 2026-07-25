import { Dictionary } from "../../../lib/i18n/dictionaries/ko";
import { SupportedCity } from "../../../lib/trip-domain";
import {
  BudgetCategory,
  BudgetBasketId,
  PricingUnit,
  BudgetLineItem,
  BudgetPlan,
  PriceConfidence,
} from "../domain/types";

/**
 * 도시별/예산등급별 지역 시그니처 퀴진 및 레저 체험 맞춤형 다국어 레이블 맵
 */
export const REGIONAL_BASKET_LABELS: Record<
  SupportedCity,
  Record<BudgetBasketId, { ko: string; en: string }>
> = {
  SEOUL: {
    BUDGET_STAY: { ko: "홍대/명동 가성비 호스텔 & 캡슐호텔", en: "Hongdae/Myeongdong Budget Hostel & Capsule Hotel" },
    STANDARD_HOTEL: { ko: "강남/인사동 모던 비즈니스 시티뷰 호텔", en: "Gangnam/Insadong Modern Business Hotel" },
    PREMIUM_HERITAGE: { ko: "광화문/남산 5성급 럭셔리 스파 호텔", en: "Gwanghwamun/Namsan 5-Star Luxury Spa Hotel" },
    BUDGET_MEAL_PLAN: { ko: "광장시장 떡볶이 & 마약김밥 & 뚝배기 한식", en: "Gwangjang Market Street Food & Local Eats" },
    STANDARD_MEAL_PLAN: { ko: "명동 삼겹살 & 인사동 한정식 & 감성 카페", en: "Myeongdong Samgyeopsal & Insadong Course" },
    PREMIUM_MEAL_PLAN: { ko: "강남 셰프 오마카세 & 광화문 프리미엄 다이닝", en: "Gangnam Chef Omakase & Premium Fine Dining" },
    BASIC_CITY_TRANSPORT: { ko: "T-money 지하철/버스 알뜰 패스", en: "T-money Subway & Bus Transit Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "지하철 + 시내 택시 자율 혼합", en: "Subway + City Taxi Mixed Transport" },
    COMFORT_CITY_TRANSPORT: { ko: "프리미엄 콜택시 & 모범택시 전용", en: "Premium Call Taxi & Deluxe Transport" },
    MOSTLY_FREE: { ko: "경복궁/청계천/한강공원 자율 탐방", en: "Gyeongbokgung & Hangang Park Free Exploration" },
    BALANCED: { ko: "N서울타워 전망대 & 한복 대여 체험", en: "N Seoul Tower & Hanbok Rental Experience" },
    EXPERIENCE_RICH: { ko: "한강 프라이빗 요트 & VIP 뮤지컬 관람", en: "Hangang Private Yacht & VIP Musical Show" },
    KTX_STANDARD: { ko: "KTX 고속철도 이동", en: "KTX High-Speed Rail" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  BUSAN: {
    BUDGET_STAY: { ko: "자갈치/남포 오션 가성비 게스트하우스", en: "Jagalchi/Nampo Ocean Budget Guesthouse" },
    STANDARD_HOTEL: { ko: "광안리 오션뷰 힐링 펜션 & 호텔", en: "Gwangalli Oceanview Healing Hotel" },
    PREMIUM_HERITAGE: { ko: "해운대 최고급 인피니티풀 오션 리조트", en: "Haeundae Luxury Infinity Pool Ocean Resort" },
    BUDGET_MEAL_PLAN: { ko: "자갈치 돼지국밥 & 부산밀면 & 씨앗호떡", en: "Jagalchi Dwaeji-gukbap & Milmyeon Street Food" },
    STANDARD_MEAL_PLAN: { ko: "민락수변공원 싱싱 제철 회 & 광안리 조개구이", en: "Minrak Raw Fish & Gwangalli Clam Bake" },
    PREMIUM_MEAL_PLAN: { ko: "해운대 암소갈비 & 고급 해산물 다이닝", en: "Haeundae Prime Beef & Seafood Dining" },
    BASIC_CITY_TRANSPORT: { ko: "부산 지하철/시내버스 알뜰 패스", en: "Busan Metro & Bus Transit Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "부산 지하철 + 해안 택시 혼합", en: "Busan Metro + Coastal Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "해안 도로 렌터카 & 프리미엄 택시", en: "Coastal Rental Car & Premium Taxi" },
    MOSTLY_FREE: { ko: "감천문화마을 & 광안리 해변 산책", en: "Gamcheon Culture Village & Beach Walk" },
    BALANCED: { ko: "해운대 블루라인파크 해변열차 & 요트투어", en: "Haeundae Blueline Park Train & Yacht Tour" },
    EXPERIENCE_RICH: { ko: "프라이빗 해운대 요트 스파 & 스카이캡슐 VIP", en: "Private Yacht Spa & Sky Capsule VIP" },
    KTX_STANDARD: { ko: "KTX 고속철도 이동", en: "KTX High-Speed Rail" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  JEJU: {
    BUDGET_STAY: { ko: "제주공항 근처 아담한 게스트하우스", en: "Jeju Airport Budget Guesthouse" },
    STANDARD_HOTEL: { ko: "애월/함덕 오션뷰 힐링 리조트", en: "Aewol/Hamdeok Oceanview Resort" },
    PREMIUM_HERITAGE: { ko: "중문 5성급 럭셔리 풀빌라 리조트", en: "Jungmun 5-Star Luxury Pool Villa" },
    BUDGET_MEAL_PLAN: { ko: "동문재래시장 흑돼지꼬치 & 고기국수", en: "Dongmun Market Black Pork & Meat Noodle" },
    STANDARD_MEAL_PLAN: { ko: "애월 참숯 흑돼지 구이 & 통갈치조림", en: "Aewol Black Pork BBQ & Cutlassfish Stew" },
    PREMIUM_MEAL_PLAN: { ko: "제주 로컬 셰프 흑돼지 다이닝 코스", en: "Jeju Chef Black Pork Fine Dining" },
    BASIC_CITY_TRANSPORT: { ko: "제주 간선 버스 패스", en: "Jeju Bus Transit Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "제주 자율 렌터카 / 콜택시", en: "Jeju Rental Car / Call Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "제주 고급 SUV 렌트 & 프라이빗 기사", en: "Jeju Luxury SUV & Private Chauffeur" },
    MOSTLY_FREE: { ko: "성산일출봉 & 용머리해안 산책", en: "Seongsan Ilchulbong & Coast Trail" },
    BALANCED: { ko: "제주 승마 체험 & 감귤 따기 체험", en: "Jeju Horseback Riding & Tangerine Picking" },
    EXPERIENCE_RICH: { ko: "제주 프라이빗 요트 투어 & 잠수함 탐험", en: "Jeju Private Yacht Tour & Submarine" },
    KTX_STANDARD: { ko: "KTX/항공 이동", en: "Flight / KTX Transport" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  JEONJU: {
    BUDGET_STAY: { ko: "한옥마을 아담한 뜰채 게스트하우스", en: "Jeonju Hanok Village Traditional Guesthouse" },
    STANDARD_HOTEL: { ko: "한옥마을 정취의 한옥 독채 스테이", en: "Hanok Village Traditional Private Stay" },
    PREMIUM_HERITAGE: { ko: "최고급 프라이빗 한옥 리조트 & 다도 스위트", en: "Luxury Private Hanok Resort & Tea Suite" },
    BUDGET_MEAL_PLAN: { ko: "전주 콩나물국밥 & 시장 전통비빔밥", en: "Jeonju Bean Sprout Soup & Bibimbap" },
    STANDARD_MEAL_PLAN: { ko: "전주 푸짐한 막걸리 한상 & 육회비빔밥", en: "Jeonju Makgeolli Table & Yukhoe Bibimbap" },
    PREMIUM_MEAL_PLAN: { ko: "전주 명인 궁중 한정식 풀코스 다이닝", en: "Jeonju Master Royal Hanjeongsik Course" },
    BASIC_CITY_TRANSPORT: { ko: "전주 시내버스 알뜰 패스", en: "Jeonju City Bus Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "전주 시내버스 + 도심 택시", en: "Jeonju City Bus + Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "전주 전용 콜택시 & 프리미엄 차", en: "Jeonju Premium Call Taxi" },
    MOSTLY_FREE: { ko: "전주 한옥마을 & 경기전 고즈넉한 산책", en: "Hanok Village & Gyeonggijeon Walk" },
    BALANCED: { ko: "한옥마을 명품 한복 체험 & 다도 교실", en: "Hanok Village Premium Hanbok & Tea Class" },
    EXPERIENCE_RICH: { ko: "전주 전통 공예 명인 클래스 & VIP 한옥 체험", en: "Jeonju Traditional Craft Master Class & VIP" },
    KTX_STANDARD: { ko: "KTX 고속철도 이동", en: "KTX High-Speed Rail" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  GYEONGJU: {
    BUDGET_STAY: { ko: "황리단길 감성 가성비 한옥 게스트하우스", en: "Hwangridan-gil Hanok Guesthouse" },
    STANDARD_HOTEL: { ko: "보문단지 호수뷰 힐링 호텔", en: "Bomun Lakeview Healing Hotel" },
    PREMIUM_HERITAGE: { ko: "보문단지 5성급 럭셔리 힐튼/라한 리조트", en: "Bomun 5-Star Luxury Resort" },
    BUDGET_MEAL_PLAN: { ko: "황리단길 십원빵 & 쌈밥 정식", en: "Hwangridan-gil Street Snack & Ssambap" },
    STANDARD_MEAL_PLAN: { ko: "경주 보문단지 떡갈비 정식 & 감성 카페", en: "Gyeongju Tteokgalbi Set & Cafe" },
    PREMIUM_MEAL_PLAN: { ko: "경주 수제 한우 갈비 & 프리미엄 다이닝", en: "Gyeongju Hanwoo Ribs & Premium Dining" },
    BASIC_CITY_TRANSPORT: { ko: "경주 시내버스 알뜰 패스", en: "Gyeongju City Bus Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "경주 시내버스 + 보문 택시", en: "Gyeongju Bus + Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "경주 관광 렌터카 / 프라이빗 택시", en: "Gyeongju Rental Car & Private Taxi" },
    MOSTLY_FREE: { ko: "첨성대 & 대릉원 고분군 산책", en: "Cheomseongdae & Daereungwon Walk" },
    BALANCED: { ko: "불국사/석굴암 전문 해설 가이드 투어", en: "Bulguksa & Seokguram Guided Tour" },
    EXPERIENCE_RICH: { ko: "동궁과 월지 야경 VIP 도슨트 & 신라 문화 체험", en: "Donggung & Wolji VIP Night Tour" },
    KTX_STANDARD: { ko: "KTX 고속철도 이동", en: "KTX High-Speed Rail" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  GANGNEUNG: {
    BUDGET_STAY: { ko: "안목해변 감성 미니멀 오션뷰 스테이", en: "Anmok Beach Minimal Oceanview Stay" },
    STANDARD_HOTEL: { ko: "경포대 오션뷰 힐링 펜션 & 모던 호텔", en: "Gyeongpo Oceanview Resort & Hotel" },
    PREMIUM_HERITAGE: { ko: "정동진/경포 럭셔리 인피니티풀 오션 리조트", en: "Jeongdongjin/Gyeongpo Luxury Ocean Resort" },
    BUDGET_MEAL_PLAN: { ko: "초당순두부 & 안목 커피거리 디저트", en: "Chodang Soft Tofu & Anmok Coffee" },
    STANDARD_MEAL_PLAN: { ko: "경포대 싱싱한 물회 & 섭국 한상", en: "Gyeongpo Cold Raw Fish Soup & Seafood" },
    PREMIUM_MEAL_PLAN: { ko: "강릉 대게 풀코스 & 해안 스페셜 다이닝", en: "Gangneung King Crab Full Course" },
    BASIC_CITY_TRANSPORT: { ko: "강릉 시내버스 알뜰 패스", en: "Gangneung City Bus Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "강릉 시내버스 + 해안 택시", en: "Gangneung Bus + Coastal Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "강릉 해안 도로 렌터카 / 전용 기사", en: "Coastal Drive Rental Car & Chauffeur" },
    MOSTLY_FREE: { ko: "안목 커피거리 & 경포호수 자전거 산책", en: "Anmok Coffee Street & Lake Walk" },
    BALANCED: { ko: "오죽헌·선교장 문화 투어 & 바다부채길", en: "Ojukheon & Sea Fan Road Tour" },
    EXPERIENCE_RICH: { ko: "강릉 럭셔리 해안 요트 투어 & 서핑 체험", en: "Gangneung Luxury Ocean Yacht & Surfing" },
    KTX_STANDARD: { ko: "KTX 고속철도 이동", en: "KTX High-Speed Rail" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  INCHEON: {
    BUDGET_STAY: { ko: "송도/월미도 가성비 비즈니스 스테이", en: "Songdo/Wolmido Budget Business Stay" },
    STANDARD_HOTEL: { ko: "송도 센트럴파크 시티뷰 호텔", en: "Songdo Central Park Cityview Hotel" },
    PREMIUM_HERITAGE: { ko: "영종도 파라다이스 5성급 럭셔리 리조트", en: "Yeongjongdo 5-Star Paradise Luxury Resort" },
    BUDGET_MEAL_PLAN: { ko: "차이나타운 원조 짜장면 & 공갈빵", en: "Chinatown Jajangmyeon & Street Food" },
    STANDARD_MEAL_PLAN: { ko: "월미도 조개구이 & 송도 센트럴 다이닝", en: "Wolmido Clam Bake & Songdo Dining" },
    PREMIUM_MEAL_PLAN: { ko: "파라다이스 호텔 뷔페 & 파인다이닝", en: "Paradise Hotel Buffet & Fine Dining" },
    BASIC_CITY_TRANSPORT: { ko: "인천 지하철/시내버스 패스", en: "Incheon Metro & Bus Transit Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "인천 지하철 + 도심 택시", en: "Incheon Metro + City Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "인천 리무진 & 프라이빗 픽업", en: "Incheon Limousine & Private Pickup" },
    MOSTLY_FREE: { ko: "차이나타운 & 송도 센트럴파크 산책", en: "Chinatown & Songdo Central Park Walk" },
    BALANCED: { ko: "월미도 테마파크 & 소래포구 수산시장", en: "Wolmido Theme Park & Sorae Market" },
    EXPERIENCE_RICH: { ko: "영종도 씨사이드 레일바이크 & 럭셔리 스파", en: "Yeongjongdo Railbike & Luxury Spa" },
    KTX_STANDARD: { ko: "공항철도 / KTX 이동", en: "Airport Express / KTX Transport" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  SUWON: {
    BUDGET_STAY: { ko: "수원 화성 행궁동 가성비 게스트하우스", en: "Suwon Haenggung-dong Budget Stay" },
    STANDARD_HOTEL: { ko: "수원 인계동/광교 시티뷰 호텔", en: "Suwon Gwanggyo Cityview Hotel" },
    PREMIUM_HERITAGE: { ko: "수원 코트야드 메리어트 5성급 호텔", en: "Suwon Courtyard Marriott 5-Star Hotel" },
    BUDGET_MEAL_PLAN: { ko: "수원 통닭거리 왕갈비통닭 & 분식", en: "Suwon Chicken Street Galbi Chicken" },
    STANDARD_MEAL_PLAN: { ko: "수원 전통 왕갈비 구이 정식", en: "Suwon Traditional Galbi BBQ Set" },
    PREMIUM_MEAL_PLAN: { ko: "수원 명가 프리미엄 한우 왕갈비 다이닝", en: "Suwon Premium Hanwoo Galbi Dining" },
    BASIC_CITY_TRANSPORT: { ko: "수원 시내버스/지하철 패스", en: "Suwon City Bus & Subway Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "수원 지하철 + 화성 택시", en: "Suwon Subway + City Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "수원 전용 콜택시 & 렌터카", en: "Suwon Premium Call Taxi" },
    MOSTLY_FREE: { ko: "수원화성 성곽길 & 방화수류정 산책", en: "Suwon Hwaseong Fortress Wall Walk" },
    BALANCED: { ko: "수원화성 어차 탑승 & 국궁 활쏘기 체험", en: "Hwaseong Trolley & Archery Experience" },
    EXPERIENCE_RICH: { ko: "수원화성 미디어아트 & 열기구 플라잉수원", en: "Flying Suwon Hot Air Balloon & Media Art" },
    KTX_STANDARD: { ko: "KTX/수원선 이동", en: "KTX Transport" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  YEOSU: {
    BUDGET_STAY: { ko: "여수 낭만포차 근처 가성비 게스트하우스", en: "Yeosu Romantic Pocha Budget Stay" },
    STANDARD_HOTEL: { ko: "여수 돌산 오션뷰 힐링 펜션", en: "Yeosu Dolsan Oceanview Resort" },
    PREMIUM_HERITAGE: { ko: "여수 소노캄 5성급 오션 리조트", en: "Yeosu Sono Calm 5-Star Ocean Resort" },
    BUDGET_MEAL_PLAN: { ko: "여수 게장백반 & 서대회무침", en: "Yeosu Crab Set & Seasoned Fish" },
    STANDARD_MEAL_PLAN: { ko: "여수 낭만포차 해물삼합 & 갓김치", en: "Yeosu Seafood Samhap & Mustard Kimchi" },
    PREMIUM_MEAL_PLAN: { ko: "여수 돌산 고급 하모회/새조개 샤브 다이닝", en: "Yeosu Premium Eel & Seafood Shabu" },
    BASIC_CITY_TRANSPORT: { ko: "여수 시내버스 알뜰 패스", en: "Yeosu City Bus Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "여수 시내버스 + 오션 택시", en: "Yeosu Bus + Ocean Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "여수 해안 렌터카 & 프리미엄 택시", en: "Yeosu Coastal Rental Car & Taxi" },
    MOSTLY_FREE: { ko: "오동도 & 하멜등대 해안 산책", en: "Odongdo & Hamel Lighthouse Walk" },
    BALANCED: { ko: "여수 해상케이블카 & 이순신광장 투어", en: "Yeosu Maritime Cable Car & Tour" },
    EXPERIENCE_RICH: { ko: "여수 밤바다 프라이빗 요트 & 불꽃 투어", en: "Yeosu Night Sea Private Yacht & Fireworks" },
    KTX_STANDARD: { ko: "KTX 고속철도 이동", en: "KTX High-Speed Rail" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
  SOKCHO: {
    BUDGET_STAY: { ko: "속초 중앙시장 근처 가성비 스테이", en: "Sokcho Central Market Budget Stay" },
    STANDARD_HOTEL: { ko: "속초 해수욕장 오션뷰 힐링 호텔", en: "Sokcho Beach Oceanview Hotel" },
    PREMIUM_HERITAGE: { ko: "속초 롯데/체스터톤스 럭셔리 온천 리조트", en: "Sokcho Lotte Luxury Spa Resort" },
    BUDGET_MEAL_PLAN: { ko: "속초 중앙시장 닭강정 & 오징어순대", en: "Sokcho Market Sweet Chicken & Squid Sundae" },
    STANDARD_MEAL_PLAN: { ko: "속초 물회 & 홍게찜 해산물 한상", en: "Sokcho Cold Fish Soup & Steamed Red Crab" },
    PREMIUM_MEAL_PLAN: { ko: "속초 대게 풀코스 & 프라이빗 해산물 오마카세", en: "Sokcho King Crab Full Course & Omakase" },
    BASIC_CITY_TRANSPORT: { ko: "속초 시내버스 알뜰 패스", en: "Sokcho City Bus Pass" },
    STANDARD_CITY_TRANSPORT: { ko: "속초 시내버스 + 해안 택시", en: "Sokcho Bus + Coastal Taxi" },
    COMFORT_CITY_TRANSPORT: { ko: "속초 설악산/해안 렌터카", en: "Sokcho Seoraksan Rental Car" },
    MOSTLY_FREE: { ko: "속초 해수욕장 & 영금정 일출 산책", en: "Sokcho Beach & Yeonggeumjeong Walk" },
    BALANCED: { ko: "설악산 케이블카 & 아바이마을 갯배 체험", en: "Seoraksan Cable Car & Abai Village Gaetbae" },
    EXPERIENCE_RICH: { ko: "속초 요트 마리나 & 설악 럭셔리 스파", en: "Sokcho Yacht Marina & Luxury Spa" },
    KTX_STANDARD: { ko: "고속버스 / KTX-이음 이동", en: "Express Bus / KTX Transport" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  },
};

/**
 * BudgetBasketId의 다국어 레이블 반환 (도시 코드가 주어지면 해당 도시의 지역 특색 명칭 반환)
 */
export function getBasketLabel(
  basketId: BudgetBasketId,
  dict: Dictionary,
  locale: "ko" | "en",
  cityCode?: SupportedCity
): string {
  if (cityCode && REGIONAL_BASKET_LABELS[cityCode]?.[basketId]) {
    const regional = REGIONAL_BASKET_LABELS[cityCode][basketId];
    return locale === "ko" ? regional.ko : regional.en;
  }

  const mapping: Record<BudgetBasketId, { ko: string; en: string }> = {
    BUDGET_STAY: { ko: "실속형 숙소", en: "Budget Stay" },
    STANDARD_HOTEL: { ko: "스탠다드 호텔", en: "Standard Hotel" },
    PREMIUM_HERITAGE: { ko: "프리미엄 & 헤리티지", en: "Premium & Heritage" },
    BUDGET_MEAL_PLAN: { ko: "실속형 식비 플랜", en: "Budget Meal Plan" },
    STANDARD_MEAL_PLAN: { ko: "스탠다드 식비 플랜", en: "Standard Meal Plan" },
    PREMIUM_MEAL_PLAN: { ko: "프리미엄 식비 플랜", en: "Premium Meal Plan" },
    BASIC_CITY_TRANSPORT: { ko: "알뜰형 도시 대중교통", en: "Basic City Transport" },
    STANDARD_CITY_TRANSPORT: { ko: "일반형 도시 교통", en: "Standard City Transport" },
    COMFORT_CITY_TRANSPORT: { ko: "편안한 도시 교통", en: "Comfort City Transport" },
    MOSTLY_FREE: { ko: "실속형 체험 활동", en: "Mostly Free Attractions" },
    BALANCED: { ko: "균형 잡힌 체험 활동", en: "Balanced Attractions" },
    EXPERIENCE_RICH: { ko: "풍성한 체험 활동", en: "Experience-rich Attractions" },
    KTX_STANDARD: { ko: "KTX 일반실", en: "KTX Standard Class" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  };

  const item = mapping[basketId];
  if (!item) return String(basketId);
  return locale === "ko" ? item.ko : item.en;
}

/**
 * 금액을 KRW 통화 기호('₩ ')와 천 단위 쉼표가 붙은 형식으로 포맷팅 (소수점 없음, ₩ 뒤 공백 1칸 적용)
 */
export function formatKrw(amount: number): string {
  const formatted = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return formatted.replace(/^₩\s*/, "₩ ");
}

/**
 * 예산 사용률을 소수점 첫째자리 백분율 스트링으로 반환
 */
export function formatPercentage(ratio: number): string {
  return `${ratio}%`;
}

/**
 * 여행 기간을 다국어(ko/en)에 알맞은 형식으로 포맷팅
 */
export function formatTripDuration(nights: number, dict: Dictionary, locale: "ko" | "en"): string {
  const days = nights + 1;
  if (locale === "ko") {
    return `${nights}박 ${days}일`;
  }
  return `${nights} nights · ${days} days`;
}

/**
 * 인원수를 다국어(ko/en)에 알맞은 형식으로 포맷팅
 */
export function formatTravelerCount(count: number, dict: Dictionary, locale: "ko" | "en"): string {
  if (locale === "ko") {
    return `성인 ${count}명`;
  }
  return `${count} ${count === 1 ? "person" : "people"}`;
}

/**
 * 도시별 숙박 배분 요약을 다국어(ko/en)에 알맞은 형식으로 포맷팅
 */
export function formatCityAllocationSummary(
  allocations: Record<string, number>,
  dict: Dictionary,
  locale: "ko" | "en"
): string {
  const cityKoMap: Record<string, string> = {
    SEOUL: "서울", BUSAN: "부산", JEJU: "제주", INCHEON: "인천",
    GYEONGJU: "경주", JEONJU: "전주", GANGNEUNG: "강릉", SUWON: "수원",
    YEOSU: "여수", SOKCHO: "속초",
  };
  const cityEnMap: Record<string, string> = {
    SEOUL: "Seoul", BUSAN: "Busan", JEJU: "Jeju", INCHEON: "Incheon",
    GYEONGJU: "Gyeongju", JEONJU: "Jeonju", GANGNEUNG: "Gangneung", SUWON: "Suwon",
    YEOSU: "Yeosu", SOKCHO: "Sokcho",
  };

  const activeCities = Object.entries(allocations)
    .filter(([_, nights]) => nights > 0)
    .map(([city]) => (locale === "ko" ? (cityKoMap[city] || city) : (cityEnMap[city] || city)));

  const totalNights = Object.values(allocations).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);
  const totalDays = totalNights + 1;

  if (activeCities.length === 0) return "";

  if (locale === "ko") {
    const citiesStr = activeCities.join(" · ");
    return `${citiesStr} / 총 ${totalNights}박 ${totalDays}일`;
  } else {
    const citiesStr = activeCities.join(", ");
    return `${citiesStr} / ${totalNights} Nights (${totalDays} Days)`;
  }
}

/**
 * PricingUnit의 다국어 레이블 반환
 */
export function getPricingUnitLabel(unit: PricingUnit, dict: Dictionary): string {
  switch (unit) {
    case "ROOM_NIGHT":
      return dict.planner.unitRoomNight;
    case "PERSON_DAY":
      return dict.planner.unitPersonDay;
    case "PERSON_MEAL":
      return dict.planner.unitPersonMeal;
    case "PERSON_ONE_WAY":
      return dict.planner.unitPersonOneWay;
    case "PER_PERSON":
      return dict.planner.unitPerPerson;
    case "FIXED_AMOUNT":
      return dict.planner.unitFixedAmount;
    case "PERCENTAGE":
      return dict.planner.unitPercentage;
    default:
      return String(unit);
  }
}

/**
 * BudgetCategory의 다국어 레이블 반환
 */
export function getCategoryLabel(category: BudgetCategory, dict: Dictionary): string {
  switch (category) {
    case "ACCOMMODATION":
      return dict.planner.categoryStay;
    case "FOOD":
      return dict.planner.categoryFood;
    case "CITY_TRANSPORT":
    case "INTERCITY_TRANSPORT":
      return dict.planner.categoryTransport;
    case "ATTRACTION":
      return dict.planner.categoryAttraction;
    case "EMERGENCY_FUND":
      return dict.planner.categoryEmergency;
    default:
      return String(category);
  }
}



/**
 * 영수증 라인 아이템의 상세 단가 계산 수식을 생성
 */
export function getCalculationExpression(
  item: BudgetLineItem,
  dict: Dictionary,
  locale: "ko" | "en"
): string {
  const formattedPrice = formatKrw(item.unitPriceKrw);

  switch (item.pricingUnit) {
    case "ROOM_NIGHT": {
      const roomLabel = locale === "ko" ? "객실" : item.quantity === 1 ? "room" : "rooms";
      const nightLabel = locale === "ko" ? "박" : item.durationCount === 1 ? "night" : "nights";
      return `${formattedPrice} × ${item.quantity}${roomLabel} × ${item.durationCount}${nightLabel}`;
    }
    case "PERSON_DAY": {
      const personLabel = locale === "ko" ? "명" : item.quantity === 1 ? "person" : "people";
      const dayLabel = locale === "ko" ? "일" : item.durationCount === 1 ? "day" : "days";
      return `${formattedPrice} × ${item.quantity}${personLabel} × ${item.durationCount}${dayLabel}`;
    }
    case "PERSON_ONE_WAY": {
      const personLabel = locale === "ko" ? "명" : item.participantCount === 1 ? "person" : "people";
      const tripLabel = locale === "ko" ? "회 이동" : item.quantity === 1 ? "segment" : "segments";
      return `${formattedPrice} × ${item.participantCount}${personLabel} × ${item.quantity}${tripLabel}`;
    }
    case "PER_PERSON": {
      const personLabel = locale === "ko" ? "명" : item.participantCount === 1 ? "person" : "people";
      return `${formattedPrice} × ${item.participantCount}${personLabel}`;
    }
    case "FIXED_AMOUNT": {
      return formattedPrice;
    }
    default: {
      return `${formattedPrice} × ${item.quantity}`;
    }
  }
}

/**
 * 도시 교통비와 도시 간 교통비를 합산한 총 교통 소계(UI용)를 반환
 */
export function getCombinedTransportSubtotal(plan: BudgetPlan): number {
  const cityTransport = plan.categoryTotals.CITY_TRANSPORT || 0;
  const intercityTransport = plan.categoryTotals.INTERCITY_TRANSPORT || 0;
  return cityTransport + intercityTransport;
}

/**
 * PriceConfidence의 다국어 텍스트 매핑
 */
export function getConfidenceLabel(confidence: PriceConfidence, dict: Dictionary): string {
  if (confidence === "MOCK") {
    return dict.planner.badgeMock;
  }
  return String(confidence);
}

/**
 * 예산 요약 텍스트 생성
 */
export function generateBudgetSummaryText(
  plan: BudgetPlan,
  title: string,
  dict: Dictionary,
  locale: "ko" | "en"
): string {
  const { trip, grandTotalKrw, perTravelerTotalKrw, dailyAverageKrw, targetBudgetKrw, targetBudgetUsagePercent } = plan;
  const isOverBudget = grandTotalKrw > targetBudgetKrw;
  const diffAmount = Math.abs(grandTotalKrw - targetBudgetKrw);

  const getCityDisplayName = (c: string) => {
    const mapKo: Record<string, string> = {
      SEOUL: "서울", BUSAN: "부산", JEJU: "제주", INCHEON: "인천",
      GYEONGJU: "경주", JEONJU: "전주", GANGNEUNG: "강릉", SUWON: "수원",
      YEOSU: "여수", SOKCHO: "속초",
    };
    const mapEn: Record<string, string> = {
      SEOUL: "Seoul", BUSAN: "Busan", JEJU: "Jeju", INCHEON: "Incheon",
      GYEONGJU: "Gyeongju", JEONJU: "Jeonju", GANGNEUNG: "Gangneung", SUWON: "Suwon",
      YEOSU: "Yeosu", SOKCHO: "Sokcho",
    };
    return locale === "ko" ? (mapKo[c] || c) : (mapEn[c] || c);
  };

  const cityNamesSummary = trip.selectedCities.map(getCityDisplayName).join(" & ");

  // 여행 제목 및 기본 요약
  const tripTitle = title || (locale === "ko"
    ? `${cityNamesSummary} 여행 계획`
    : `Trip to ${cityNamesSummary}`);

  const nights = trip.totalNights || 5;
  const adults = trip.adultCount || 2;

  const durationStr = locale === "ko"
    ? `${nights}박 ${nights + 1}일`
    : `${nights} nights, ${nights + 1} days`;

  const travelerStr = locale === "ko"
    ? `${adults}명`
    : `${adults} ${adults === 1 ? "traveler" : "travelers"}`;

  const citiesStr = trip.selectedCities.map(getCityDisplayName).join(", ");

  // 예산 차액/상태 구문
  let statusStr = "";
  if (targetBudgetKrw > 0) {
    const usageStr = `${formatPercentage(targetBudgetUsagePercent)}%`;
    if (isOverBudget) {
      statusStr = locale === "ko"
        ? `목표 예산 대비 초과: +${formatKrw(diffAmount)} (사용률: ${usageStr})`
        : `Over budget by: +${formatKrw(diffAmount)} (Usage: ${usageStr})`;
    } else {
      statusStr = locale === "ko"
        ? `목표 예산 대비 남음: -${formatKrw(diffAmount)} (사용률: ${usageStr})`
        : `Under budget by: -${formatKrw(diffAmount)} (Usage: ${usageStr})`;
    }
  } else {
    statusStr = locale === "ko" ? "설정된 목표 예산 없음" : "No target budget set";
  }

  // 도시별 소계
  const citySubtotals = trip.selectedCities
    .map((city) => {
      const section = plan.citySections[city];
      if (!section) return null;
      const name = getCityDisplayName(city);
      return ` - ${name}: ${formatKrw(section.subtotalKrw)}`;
    })
    .filter(Boolean)
    .join("\n");

  const intercitySubtotal = plan.intercitySection.subtotalKrw > 0
    ? `\n - Intercity Transit (KTX): ${formatKrw(plan.intercitySection.subtotalKrw)}`
    : "";

  const citySectionText = locale === "ko"
    ? `[도시별 소계]\n${citySubtotals}${intercitySubtotal}`
    : `[Subtotal by City]\n${citySubtotals}${intercitySubtotal}`;

  // 카테고리별 소계
  const categories: BudgetCategory[] = [
    "ACCOMMODATION",
    "FOOD",
    "CITY_TRANSPORT",
    "ATTRACTION",
    "EMERGENCY_FUND",
  ];
  const categorySubtotals = categories
    .map((cat) => {
      const name = getCategoryLabel(cat, dict);
      const amount = plan.categoryTotals[cat] || 0;
      return ` - ${name}: ${formatKrw(amount)}`;
    })
    .join("\n");

  const categorySectionText = locale === "ko"
    ? `[카테고리별 소계]\n${categorySubtotals}`
    : `[Subtotal by Category]\n${categorySubtotals}`;

  // 최종 텍스트 조립
  if (locale === "ko") {
    return `=== ${tripTitle} ===
기간: ${durationStr}
인원: ${travelerStr}
방문 도시: ${citiesStr}

총 예상 예산: ${formatKrw(grandTotalKrw)}
1인당 비용: ${formatKrw(perTravelerTotalKrw)}
하루 평균 비용: ${formatKrw(dailyAverageKrw)}
예산 상태: ${statusStr}

${citySectionText}

${categorySectionText}
====================`;
  } else {
    return `=== ${tripTitle} ===
Duration: ${durationStr}
Travelers: ${travelerStr}
Cities: ${citiesStr}

Estimated Total: ${formatKrw(grandTotalKrw)}
Per Traveler: ${formatKrw(perTravelerTotalKrw)}
Daily Average: ${formatKrw(dailyAverageKrw)}
Budget Status: ${statusStr}

${citySectionText}

${categorySectionText}
====================`;
  }
}
