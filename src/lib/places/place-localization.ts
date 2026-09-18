import { SupportedCity } from "../trip-domain";

/**
 * 한국어 지하철역/지명 영문 매핑 테이블
 */
const STATION_NAME_MAP: Record<string, string> = {
  안국역: "Anguk Station",
  경복궁역: "Gyeongbokgung Station",
  광화문역: "Gwanghwamun Station",
  종로5가역: "Jongno 5-ga Station",
  을지로4가역: "Euljiro 4-ga Station",
  명동역: "Myeong-dong Station",
  동대문역사문화공원역: "DDP (Dongdaemun) Station",
  성수역: "Seongsu Station",
  뚝섬역: "Ttukseom Station",
  홍대입구역: "Hongik Univ. Station",
  자갈치역: "Jagalchi Station",
  남포역: "Nampo Station",
  광안역: "Gwangan Station",
  금련산역: "Geumnyeonsan Station",
  해운대역: "Haeundae Station",
  중동역: "Jung-dong Station",
  동백역: "Dongbaek Station",
  문래역: "Mullae Station",
  여의나루역: "Yeouinaru Station",
  뚝섬유원지역: "Ttukseom Park Station",
  망원역: "Mangwon Station",
  양재시민의숲역: "Yangjae Citizen's Forest Station",
  북한산우이역: "Bukhansan Ui Station",
  잠실역: "Jamsil Station",
  토성역: "Toseong Station",
  범어사역: "Beomeosa Station",
  이촌역: "Ichon Station",
  회현역: "Hoehyeon Station",
  오시리아역: "Osiria Station",
  신경주역: "Singyeongju KTX Station",
  강릉역: "Gangneung Station",
  전주역: "Jeonju Station",
  수원역: "Suwon Station",
  여수엑스포역: "Yeosu Expo Station",
  충무로역: "Chungmuro Station",
  다대포해수욕장역: "Dadaepo Beach Station",
};

/**
 * 키워드 태그 영문 매핑 사전
 */
const TAG_KEYWORD_MAP: Record<string, string> = {
  // 카테고리
  쇼핑: "Shopping",
  명소: "Landmark",
  자연: "Nature",
  엔터: "Entertainment",
  숙소: "Accommodation",
  음식점: "Restaurant",
  카페: "Cafe",
  전통시장: "TraditionalMarket",
  "체험/휴식": "Experience",
  체험: "Experience",

  // 주요 명소/지역
  인사동: "Insadong",
  쌈지길: "Ssamzigil",
  전통공예: "TraditionalCraft",
  갤러리골목: "ArtGallery",
  경복궁: "Gyeongbokgung",
  한복체험: "HanbokExperience",
  북촌한옥마을: "BukchonHanok",
  북촌: "Bukchon",
  창덕궁: "Changdeokgung",
  후원: "SecretGarden",
  비원: "Biwon",
  광장시장: "GwangjangMarket",
  청계천: "Cheonggyecheon",
  남대문시장: "NamdaemunMarket",
  해운대: "Haeundae",
  광안리: "Gwangalli",
  드론라이트쇼: "DroneShow",
  드론쇼: "DroneShow",
  야경: "NightView",
  자갈치: "Jagalchi",
  자갈치시장: "JagalchiMarket",
  BIFF광장: "BIFFSquare",
  국제시장: "GukjeMarket",
  감천문화마을: "Gamcheon",
  블루라인파크: "BluelinePark",
  스카이캡슐: "SkyCapsule",
  흰여울문화마을: "Huinnyeoul",
  송도해상케이블카: "SongdoCableCar",
  태종대: "Taejongdae",
  성수동: "Seongsu",
  연무장길: "Yeonmujang",
  팝업스토어: "PopUpStores",
  홍대: "Hongdae",
  버스킹: "Busking",
  DDP: "DDP",
  동대문: "Dongdaemun",
  K뷰티: "KBeauty",
  "K-뷰티": "KBeauty",
  명동: "Myeongdong",
  N서울타워: "NSeoulTower",
  서울타워: "SeoulTower",
  여의도: "Yeouido",
  한강공원: "HangangPark",
  국립중앙박물관: "NationalMuseum",
  문래창작촌: "MullaeArtVillage",
  서촌: "Seochon",
  망리단길: "Mangridan",
  망원한강공원: "MangwonPark",
  양재천: "Yangjaecheon",
  북한산: "Bukhansan",
  우이동: "Uidong",
  성산일출봉: "SeongsanIlchulbong",
  비자림: "Bijarim",
  함덕해변: "HamdeokBeach",
  협재해변: "HyeopjaeBeach",
  섭지코지: "Seopjikoji",
  향호해변: "HyanghoBeach",
  BTS: "BTS",
  주문진: "Jumunjin",
  도깨비: "GoblinDrama",
  아르떼뮤지엄: "ArteMuseum",
  안목커피거리: "AnmokCoffeeStreet",
  경포호: "GyeongpoLake",
  불국사: "Bulguksa",
  석굴암: "Seokguram",
  대릉원: "Daereungwon",
  첨성대: "Cheomseongdae",
  동궁과월지: "DonggungAndWolji",
  안압지: "Anapji",
  전주한옥마을: "JeonjuHanok",
  전동성당: "JeondongCathedral",
  남부시장: "NambuMarket",
  청년몰: "YouthMall",
  야시장: "NightMarket",
};

/**
 * 교통 / 위치 정보 영문화 포맷터
 */
export function formatTransitInfo(
  subwayInfo?: string,
  locale: "ko" | "en" = "ko",
  fallbackAddress?: string
): string {
  if (!subwayInfo) return fallbackAddress || "";
  if (locale === "ko") return subwayInfo;

  let text = subwayInfo;

  // 1. 역 명칭 치환
  Object.entries(STATION_NAME_MAP).forEach(([ko, en]) => {
    text = text.replaceAll(ko, en);
  });

  // 2. 지하철 호선 치환
  text = text
    .replace(/2·4·5호선/g, "Line 2, 4, 5")
    .replace(/2·8호선/g, "Line 2 & 8")
    .replace(/3호선·신분당선/g, "Line 3 & Shinbundang Line")
    .replace(/1호선/g, "Line 1")
    .replace(/2호선/g, "Line 2")
    .replace(/3호선/g, "Line 3")
    .replace(/4호선/g, "Line 4")
    .replace(/5호선/g, "Line 5")
    .replace(/6호선/g, "Line 6")
    .replace(/7호선/g, "Line 7")
    .replace(/8호선/g, "Line 8")
    .replace(/9호선/g, "Line 9")
    .replace(/우이신설선/g, "Ui-Sinseol Line")
    .replace(/공항철도/g, "Airport Railroad")
    .replace(/동해선/g, "Donghae Line")
    .replace(/경의중앙선/g, "Gyeongui-Jungang Line");

  // 3. 출구 번호 치환
  text = text.replace(/(\d+)(,\s*\d+)*번\s*출구/g, (match) => {
    const numbers = match.replace(/번\s*출구/g, "").trim();
    return `Exit ${numbers}`;
  });

  // 4. 도보 시간 치환
  text = text
    .replace(/\(도보\s*(\d+)분\)/g, "($1-min walk)")
    .replace(/도보\s*(\d+)분/g, "$1-min walk")
    .replace(/직접\s*연결/g, "direct access")
    .replace(/직결/g, "direct access")
    .replace(/지하연결/g, "underground connection")
    .replace(/지하\s*연결/g, "underground connection");

  // 5. 버스 및 환승 패턴 치환
  text = text
    .replace(/제주국제공항\s*급행\s*([0-9,\s]+)번/g, "Jeju Airport Express Bus $1")
    .replace(/제주버스터미널\s*간선\s*([0-9,\s]+)번\s*버스/g, "Jeju Terminal Trunk Bus $1")
    .replace(/시내버스\s*([0-9,\s]+)번/g, "City Bus $1")
    .replace(/급행\s*([0-9,\s]+)번/g, "Express Bus $1")
    .replace(/버스\s*([0-9,\s]+)번/g, "Bus $1")
    .replace(/마을버스\s*([^\s]+)\s*([0-9-]+)번/g, "Local Bus $1-$2")
    .replace(/탑승\s*→\s*([^\s]+)\s*하차/g, "take bus → get off at $1")
    .replace(/하차/g, "get off")
    .replace(/환승/g, "transfer")
    .replace(/남산\s*케이블카/g, "Namsan Cable Car")
    .replace(/순환버스/g, "Circular Bus");

  return text;
}

/**
 * 휴무일 영문화 포맷터
 */
export function formatClosedDays(
  closedDays?: string,
  locale: "ko" | "en" = "ko"
): string {
  if (!closedDays) return "";
  if (locale === "ko") return closedDays;

  const trimmed = closedDays.trim();

  // 연중무휴 / 상시개방
  if (trimmed.includes("연중무휴") || trimmed.includes("연중 무휴")) {
    return "Open all year round";
  }
  if (trimmed.includes("상시개방") || trimmed.includes("연중개방")) {
    return "Open Year-round";
  }

  // 요일별 휴무
  if (trimmed.includes("매주 월요일")) return "Closed on Mondays";
  if (trimmed.includes("매주 화요일")) return "Closed on Tuesdays";
  if (trimmed.includes("매주 수요일")) return "Closed on Wednesdays";
  if (trimmed.includes("매주 목요일")) return "Closed on Thursdays";
  if (trimmed.includes("매주 금요일")) return "Closed on Fridays";
  if (trimmed.includes("매주 토요일")) return "Closed on Saturdays";
  if (trimmed.includes("매주 일요일")) return "Closed on Sundays";

  if (trimmed.includes("월요일")) return "Closed on Mondays";
  if (trimmed.includes("화요일")) return "Closed on Tuesdays";
  if (trimmed.includes("수요일")) return "Closed on Wednesdays";
  if (trimmed.includes("목요일")) return "Closed on Thursdays";

  if (trimmed.includes("설날") || trimmed.includes("추석") || trimmed.includes("명절")) {
    return "Closed on Seollal & Chuseok";
  }

  return trimmed;
}

/**
 * 운영 시간 영문화 포맷터
 */
export function formatOpeningHours(
  hours?: string,
  locale: "ko" | "en" = "ko"
): string {
  if (!hours) return "";
  if (locale === "ko") return hours;

  return hours
    .replace(/매일/g, "Daily")
    .replace(/평일/g, "Weekdays")
    .replace(/주말/g, "Weekends")
    .replace(/입장마감/g, "Last entry")
    .replace(/계절별\s*상이/g, "seasonal hours apply")
    .replace(/연중개방/g, "Open 24/7");
}

/**
 * 장소 태그 다국어 변환기
 * 한국어 슬래시 태그(예: "인사동/쌈지길/전통공예/갤러리골목")를 분해하여
 * 영문 모드일 때는 깔끔한 영문 태그 배열로 변환합니다.
 */
export function formatPlaceTags(
  tags: string[],
  locale: "ko" | "en" = "ko"
): string[] {
  if (!tags || tags.length === 0) return [];
  if (locale === "ko") return tags;

  const result: string[] = [];

  tags.forEach((t) => {
    if (!t) return;

    // 슬래시가 포함된 복합 태그인 경우 분해
    if (t.includes("/")) {
      const parts = t.split("/").map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        const en = TAG_KEYWORD_MAP[p] || p;
        if (!result.includes(en)) result.push(en);
      });
    } else {
      const en = TAG_KEYWORD_MAP[t] || t;
      if (!result.includes(en)) result.push(en);
    }
  });

  return result;
}
