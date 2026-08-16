import { SupportedCity } from "../lib/trip-domain";
import { PlaceCategory } from "../lib/kto/types";

export interface CuratedSeedItem {
  name: string;
  searchKeyword: string; // KTO API 검색에 최적화된 키워드
  city: SupportedCity;
  category: PlaceCategory;
  curationReason: {
    ko: string;
    en: string;
  };
  tags: string[];
  priceTier: "BUDGET" | "STANDARD" | "PREMIUM";
  estimatedPriceKrw?: number;
  featured?: boolean;
}

export const CURATED_PLACE_SEEDS: CuratedSeedItem[] = [
  // ==========================================
  // SEOUL - 명소 (ATTRACTION & CULTURE)
  // ==========================================
  {
    name: "경복궁",
    searchKeyword: "경복궁",
    city: "SEOUL",
    category: "ATTRACTION",
    curationReason: {
      ko: "조선 왕조 제일의 법궁으로, 웅장한 건축미와 한복 체험이 어우러진 서울 최고의 랜드마크",
      en: "The primary royal palace of the Joseon Dynasty, featuring magnificent architecture and iconic hanbok experiences.",
    },
    tags: ["조선왕궁", "한복체험", "서울필수", "사진명소"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 3000,
    featured: true,
  },
  {
    name: "N서울타워",
    searchKeyword: "N서울타워",
    city: "SEOUL",
    category: "ATTRACTION",
    curationReason: {
      ko: "남산 정상에서 360도로 펼쳐지는 서울의 주경과 화려한 야경을 한눈에 감상할 수 있는 명소",
      en: "An iconic tower atop Namsan offering breathtaking 360-degree panoramic day and night views of Seoul.",
    },
    tags: ["야경명소", "파노라마뷰", "남산", "데이트코스"],
    priceTier: "STANDARD",
    estimatedPriceKrw: 21000,
    featured: true,
  },
  {
    name: "북촌한옥마을",
    searchKeyword: "북촌한옥마을",
    city: "SEOUL",
    category: "CULTURE",
    curationReason: {
      ko: "경복궁과 창덕궁 사이에 위치하여 600년 역사의 전통 한옥 골목 정취를 고스란히 간직한 마을",
      en: "A historic village nestled between palaces, preserving 600 years of traditional Hanok alleyway charm.",
    },
    tags: ["한옥마을", "전통문화", "산책로", "인생샷"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 0,
    featured: true,
  },
  {
    name: "국립중앙박물관",
    searchKeyword: "국립중앙박물관",
    city: "SEOUL",
    category: "CULTURE",
    curationReason: {
      ko: "대한민국의 역사와 유물을 집대성한 세계적인 규모의 국립 박물관 (사유의 방 필수 관람)",
      en: "A world-class national museum showcasing Korea's rich cultural heritage, featuring the Room of Quiet Contemplation.",
    },
    tags: ["역사유물", "실내명소", "무료입장", "사유의방"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 0,
    featured: false,
  },
  {
    name: "동대문디자인플라자(DDP)",
    searchKeyword: "동대문디자인플라자",
    city: "SEOUL",
    category: "CULTURE",
    curationReason: {
      ko: "자하 하디드가 설계한 미래지향적 비정형 건축물로 패션과 문화 전시의 중심지",
      en: "A futuristic architectural masterpiece designed by Zaha Hadid, acting as the epicenter of fashion and design.",
    },
    tags: ["현대건축", "야경스팟", "디자인전시", "DDP"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 0,
    featured: false,
  },

  // ==========================================
  // SEOUL - 맛집 & 카페 (RESTAURANT & CAFE)
  // ==========================================
  {
    name: "광장시장 (순희네빈대떡)",
    searchKeyword: "광장시장",
    city: "SEOUL",
    category: "RESTAURANT",
    curationReason: {
      ko: "바삭한 녹두빈대떡과 신선한 육회, 마약김밥을 맛볼 수 있는 100년 전통의 서울 대표 길거리 미식 성지",
      en: "A historic 100-year-old street food haven celebrated for crispy bindaetteok, fresh yukhoe, and mini kimbap.",
    },
    tags: ["전통시장", "길거리음식", "육회", "빈대떡", "미식투어"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 15000,
    featured: true,
  },
  {
    name: "명동교자 본점",
    searchKeyword: "명동교자",
    city: "SEOUL",
    category: "RESTAURANT",
    curationReason: {
      ko: "진한 닭육수 칼국수와 만두, 중독성 강한 마늘김치로 미쉐린 빕 구르망에 연속 선정된 명소",
      en: "Michelin Bib Gourmand legend famous for rich chicken broth kalguksu, steamed dumplings, and garlic kimchi.",
    },
    tags: ["미쉐린", "칼국수", "만두", "명동맛집", "노포"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 12000,
    featured: true,
  },
  {
    name: "어니언 안국 (Cafe Onion)",
    searchKeyword: "어니언",
    city: "SEOUL",
    category: "CAFE",
    curationReason: {
      ko: "고즈넉한 한옥 공간에서 즐기는 시그니처 팡도르와 스페셜티 커피의 환상적인 조화",
      en: "Specialty coffee and iconic Pandoro pastry set within a serene, beautifully renovated traditional Hanok.",
    },
    tags: ["한옥카페", "베이커리", "팡도르", "안국역", "핫플레이스"],
    priceTier: "STANDARD",
    estimatedPriceKrw: 8000,
    featured: true,
  },
  {
    name: "우래옥",
    searchKeyword: "우래옥",
    city: "SEOUL",
    category: "RESTAURANT",
    curationReason: {
      ko: "진하고 깊은 순우육 육수의 정통 평양냉면과 한우 불고기를 선보이는 대한민국 냉면의 정점",
      en: "The zenith of authentic Pyongyang-style cold noodles and prime Hanwoo bulgogi with deep beef broth.",
    },
    tags: ["평양냉면", "한우불고기", "미쉐린", "전통노포"],
    priceTier: "PREMIUM",
    estimatedPriceKrw: 35000,
    featured: false,
  },

  // ==========================================
  // SEOUL - 숙소 (ACCOMMODATION)
  // ==========================================
  {
    name: "신라호텔 서울",
    searchKeyword: "서울신라호텔",
    city: "SEOUL",
    category: "ACCOMMODATION",
    curationReason: {
      ko: "한국 고유의 품격과 최고급 어메니티, 미쉐린 스타 다이닝을 자랑하는 럭셔리 헤리티지 호텔",
      en: "Korea's foremost luxury heritage hotel renowned for world-class hospitality and Michelin-starred dining.",
    },
    tags: ["5성급", "럭셔리호텔", "헤리티지", "어번아일랜드"],
    priceTier: "PREMIUM",
    estimatedPriceKrw: 550000,
    featured: true,
  },
  {
    name: "L7 명동 바이 롯데",
    searchKeyword: "L7명동",
    city: "SEOUL",
    category: "ACCOMMODATION",
    curationReason: {
      ko: "쇼핑과 관광의 중심 명동역 바로 앞에 위치한 트렌디하고 세련된 라이프스타일 호텔",
      en: "A chic lifestyle boutique hotel situated right at the heart of Myeongdong's shopping district.",
    },
    tags: ["라이프스타일", "명동역", "시티뷰", "가성비호텔"],
    priceTier: "STANDARD",
    estimatedPriceKrw: 180000,
    featured: true,
  },

  // ==========================================
  // BUSAN - 명소 (ATTRACTION & CULTURE)
  // ==========================================
  {
    name: "해운대해수욕장",
    searchKeyword: "해운대해수욕장",
    city: "BUSAN",
    category: "ATTRACTION",
    curationReason: {
      ko: "대한민국 대표 해변으로, 넓은 백사장과 동백섬 산책로, 마린시티 마천루가 어우러진 오션 랜드마크",
      en: "Korea's most celebrated beach flanked by Dongbaekseom Island trails and shimmering skyscrapers.",
    },
    tags: ["오션뷰", "해변산책", "부산필수", "동백섬"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 0,
    featured: true,
  },
  {
    name: "감천문화마을",
    searchKeyword: "감천문화마을",
    city: "BUSAN",
    category: "CULTURE",
    curationReason: {
      ko: "산자락을 따라 알록달록 계단식으로 늘어선 집들과 벽화, 골목 예술이 돋보이는 '한국의 마추픽추'",
      en: "A vibrant hillside village adorned with colorful terraced houses, artistic murals, and coastal viewpoints.",
    },
    tags: ["어린왕자", "벽화마을", "인생샷스팟", "골목투어"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 0,
    featured: true,
  },
  {
    name: "해운대 블루라인파크 (해변열차/스카이캡슐)",
    searchKeyword: "블루라인파크",
    city: "BUSAN",
    category: "ATTRACTION",
    curationReason: {
      ko: "동해남부선 폐선 부지를 활용해 미포-청사포-송정 해안 절경을 조망하는 인기 캡슐 열차",
      en: "A scenic coastal rail experience along cliffs offering panoramic East Sea views between Mipo and Songjeong.",
    },
    tags: ["스카이캡슐", "해변열차", "청사포", "오션뷰투어"],
    priceTier: "STANDARD",
    estimatedPriceKrw: 16000,
    featured: true,
  },
  {
    name: "자갈치시장",
    searchKeyword: "자갈치시장",
    city: "BUSAN",
    category: "ATTRACTION",
    curationReason: {
      ko: "생생한 활기와 싱싱한 활어회를 현장에서 바로 즐길 수 있는 대한민국 최대 수산시장",
      en: "Korea's largest seafood market buzzing with maritime energy and straight-from-the-sea sashimi dining.",
    },
    tags: ["수산시장", "활어회", "남포동", "로컬정취"],
    priceTier: "STANDARD",
    estimatedPriceKrw: 30000,
    featured: true,
  },
  {
    name: "흰여울문화마을",
    searchKeyword: "흰여울문화마을",
    city: "BUSAN",
    category: "CULTURE",
    curationReason: {
      ko: "영도 바다 절벽을 마주보고 이어진 아기자기한 카페와 해안 터널이 아름다운 힐링 명소",
      en: "A picturesque coastal cliff village in Yeongdo filled with boutique seaside cafes and a sea cave tunnel.",
    },
    tags: ["영도바다", "해안산책", "절벽카페", "감성포토"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 0,
    featured: false,
  },

  // ==========================================
  // BUSAN - 맛집 & 카페 (RESTAURANT & CAFE)
  // ==========================================
  {
    name: "본전돼지국밥",
    searchKeyword: "본전돼지국밥",
    city: "BUSAN",
    category: "RESTAURANT",
    curationReason: {
      ko: "부산역 앞 40년 전통의 깔끔하고 깊은 사골 국물과 야들야들한 수육이 일품인 대표 국밥집",
      en: "A 40-year Busan Station staple celebrated for its rich, clean pork broth soup and tender boiled pork slices.",
    },
    tags: ["돼지국밥", "부산역맛집", "로컬노포", "소울푸드"],
    priceTier: "BUDGET",
    estimatedPriceKrw: 10000,
    featured: true,
  },
  {
    name: "해운대암소갈비집",
    searchKeyword: "해운대암소갈비집",
    city: "BUSAN",
    category: "RESTAURANT",
    curationReason: {
      ko: "부드러운 한우 생갈비와 양념갈비, 불판에 졸여 먹는 시그니처 감자사리가 독보적인 부산 최고 명소",
      en: "An iconic destination legendary for prime Hanwoo beef ribs and savory potato noodles cooked on the brass grill.",
    },
    tags: ["한우갈비", "감자사리", "해운대맛집", "프리미엄다이닝"],
    priceTier: "PREMIUM",
    estimatedPriceKrw: 60000,
    featured: true,
  },
  {
    name: "초량1941",
    searchKeyword: "초량1941",
    city: "BUSAN",
    category: "CAFE",
    curationReason: {
      ko: "1941년 건립된 적산가옥을 개조하여 시그니처 바닐라/홍차 수제 우유를 제공하는 레트로 힐링 카페",
      en: "A historic 1941 heritage wooden house cafe renowned for artisanal flavored milks and vintage nostalgia.",
    },
    tags: ["레트로카페", "수제우유", "적산가옥", "초량동"],
    priceTier: "STANDARD",
    estimatedPriceKrw: 7500,
    featured: false,
  },

  // ==========================================
  // BUSAN - 숙소 (ACCOMMODATION)
  // ==========================================
  {
    name: "시그니엘 부산",
    searchKeyword: "시그니엘 부산",
    city: "BUSAN",
    category: "ACCOMMODATION",
    curationReason: {
      ko: "해운대 엘시티 타워에 위치하여 전 객실 발코니에서 환상적인 해운대 바다를 조망할 수 있는 럭셔리 호텔",
      en: "A pinnacle 5-star hotel in Haeundae LCT Tower featuring private balconies with ocean views.",
    },
    tags: ["5성급", "인피니티풀", "해운대오션뷰", "엘시티"],
    priceTier: "PREMIUM",
    estimatedPriceKrw: 480000,
    featured: true,
  },
  {
    name: "하운드 호텔 광안리",
    searchKeyword: "하운드호텔",
    city: "BUSAN",
    category: "ACCOMMODATION",
    curationReason: {
      ko: "광안대교의 찬란한 야경을 침대에서 바로 감상할 수 있는 감각적인 부티크 오션뷰 호텔",
      en: "A modern boutique hotel offering front-row views of the illuminated Gwangandaegyo Bridge.",
    },
    tags: ["광안리오션뷰", "광안대교야경", "가성비호텔", "부티크"],
    priceTier: "STANDARD",
    estimatedPriceKrw: 160000,
    featured: true,
  },
];
