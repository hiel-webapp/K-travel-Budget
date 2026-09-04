import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import fs from 'fs';

// .env.local 및 .env 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const SEOUL_KEY = process.env.SEOUL_OPEN_API_KEY || '6b496d6b5370616e3738646a506971';

export interface ForeignerAttractionSpot {
  id: string;
  category: string;
  nameKo: string;
  nameEn: string;
  subwayInfo: string;
  openingHours: string;
  closedDays: string;
  priceInfo: string;
  officialUrl: string;
  foreignerHighlights: string;
}

/**
 * 서울 열린데이터광장(data.seoul.go.kr) TbVwAttractions API를 실시간 호출하여
 * 외국인이 주로 찾는 6대 테마별 인기 서울 관광 명소 리스트를 생성합니다.
 */
export async function generateForeignerSeoulAttractions(): Promise<ForeignerAttractionSpot[]> {
  console.log('📡 [Seoul Open Data] 서울시 관광명소 전체 데이터 수집 시작 (인증키: ' + SEOUL_KEY.substring(0, 6) + '...)...');

  const p1 = axios.get(`http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/TbVwAttractions/1/1000/`);
  const p2 = axios.get(`http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/TbVwAttractions/1001/2000/`);
  const p3 = axios.get(`http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/TbVwAttractions/2001/2481/`);

  const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
  const allRows = [
    ...(r1.data?.TbVwAttractions?.row || []),
    ...(r2.data?.TbVwAttractions?.row || []),
    ...(r3.data?.TbVwAttractions?.row || []),
  ];

  console.log(`✅ [Seoul Open Data] 총 ${allRows.length}건의 관광 데이터 수집 완료.`);

  // 1. 주요 랜드마크 정의 및 OpenAPI 실시간 데이터 결합
  const curatedDefinitions = [
    // 🏛️ 테마 1: 왕실 궁궐 & 유네스코 문화유산
    {
      key: 'gyeongbokgung',
      category: '왕실 궁궐 & 유네스코 문화유산',
      nameKo: '경복궁 & 광화문',
      nameEn: 'Gyeongbokgung Palace & Gwanghwamun Gate',
      searchTerms: ['Gyeongbokgung', '경복궁'],
      priceInfo: '₩3,000 (한복 착용자 무료)',
      highlights: '조선 왕조 제1의 정궁, 수문장 교대의식(10:00, 14:00), 한복 체험 필수 코스',
    },
    {
      key: 'changdeokgung',
      category: '왕실 궁궐 & 유네스코 문화유산',
      nameKo: '창덕궁과 후원 (비원)',
      nameEn: 'Changdeokgung Palace & Secret Garden',
      searchTerms: ['Changdeokgung', '창덕궁'],
      priceInfo: '₩3,000 (후원 별도 ₩5,000)',
      highlights: '유네스코 세계문화유산, 자연과 조화를 이룬 비밀의 정원(사전예약 권장)',
    },
    {
      key: 'deoksugung',
      category: '왕실 궁궐 & 유네스코 문화유산',
      nameKo: '덕수궁 & 돌담길',
      nameEn: 'Deoksugung Palace & Stonewall Walkway',
      searchTerms: ['Deoksugung', '덕수궁'],
      priceInfo: '₩1,000 (야간개장 포함)',
      highlights: '도심 속 서양식 석조전과 전통 전각의 조화, 낭만적인 밤 산책로 돌담길',
    },
    {
      key: 'changgyeonggung',
      category: '왕실 궁궐 & 유네스코 문화유산',
      nameKo: '창경궁 & 대온실',
      nameEn: 'Changgyeonggung Palace & Grand Greenhouse',
      searchTerms: ['Changgyeonggung', '창경궁'],
      priceInfo: '₩1,000 (야간상시개방)',
      highlights: '한국 최초의 서양식 대온실과 춘당지 연못의 은은한 야경 명소',
    },
    {
      key: 'jongmyo',
      category: '왕실 궁궐 & 유네스코 문화유산',
      nameKo: '종묘',
      nameEn: 'Jongmyo Shrine',
      searchTerms: ['Jongmyo', '종묘'],
      priceInfo: '₩1,000',
      highlights: '유네스코 세계유산, 조선 역대 왕과 왕비의 신주를 모신 장엄한 유교 사당',
    },
    {
      key: 'bukchon',
      category: '왕실 궁궐 & 유네스코 문화유산',
      nameKo: '북촌한옥마을',
      nameEn: 'Bukchon Hanok Village',
      searchTerms: ['Bukchon', '북촌한옥마을'],
      priceInfo: '무료 (주민 거주지역)',
      highlights: '경복궁과 창덕궁 사이 600년 전통 한옥 보존 지구, 감고당길 골목 투어',
    },
    {
      key: 'namsangol',
      category: '왕실 궁궐 & 유네스코 문화유산',
      nameKo: '남산골한옥마을',
      nameEn: 'Namsangol Hanok Village',
      searchTerms: ['Namsangol', '남산골'],
      priceInfo: '무료',
      highlights: '남산 자락에 복원된 조선시대 사대부 가옥, 전통혼례 및 국악 문화 체험',
    },

    // 🗼 테마 2: 모던 랜드마크 & 360도 도심 전망대
    {
      key: 'nseoultower',
      category: '모던 랜드마크 & 도심 전망대',
      nameKo: 'N서울타워 전망대',
      nameEn: 'Namsan Seoul Tower Observatory',
      searchTerms: ['Namsan Seoul Tower', 'N Seoul Tower', 'N서울타워'],
      priceInfo: '₩21,000',
      highlights: '남산 정상에서 360도 서울 파노라마 조망, 사랑의 자물쇠 데크, 남산 케이블카',
    },
    {
      key: 'lotteworldtower',
      category: '모던 랜드마크 & 도심 전망대',
      nameKo: '롯데월드타워 서울스카이',
      nameEn: 'Lotte World Tower Seoul Sky',
      searchTerms: ['Lotte World Tower', '롯데월드타워'],
      priceInfo: '₩31,000',
      highlights: '국내 최고 높이 555m 118층 스카이데크 유리 바닥 전망대, 석촌호수 전경',
    },
    {
      key: 'ddp',
      category: '모던 랜드마크 & 도심 전망대',
      nameKo: '동대문디자인플라자 (DDP)',
      nameEn: 'Dongdaemun Design Plaza (DDP)',
      searchTerms: ['Dongdaemun Design Plaza', 'DDP'],
      priceInfo: '무료 (특별기획전 별도)',
      highlights: '자하 하디드 설계 은빛 비정형 곡선 건축물, 서울패션위크 및 밤 미디어아트',
    },
    {
      key: '63square',
      category: '모던 랜드마크 & 도심 전망대',
      nameKo: '63스퀘어 & 63 스카이피크닉',
      nameEn: '63 Square & Sky Observatory',
      searchTerms: ['63 Square', '63 Sky', '63스퀘어', '63 스카이피크닉'],
      priceInfo: '₩15,000 ~ ₩27,000',
      highlights: '여의도 황금빛 마천루, 한강과 도심 노을을 감상하는 예술 전시 전망대',
    },
    {
      key: 'starfield_library',
      category: '모던 랜드마크 & 도심 전망대',
      nameKo: '코엑스 별마당도서관',
      nameEn: 'Starfield Library COEX Mall',
      searchTerms: ['별마당', 'Starfield Library'],
      priceInfo: '무료',
      highlights: '13m 높이의 거대 서가와 7만여 권 책이 채워진 SNS 인생샷 핫플레이스',
    },
    {
      key: 'some_sevit',
      category: '모던 랜드마크 & 도심 전망대',
      nameKo: '세빛섬',
      nameEn: 'Some Sevit Floating Islands',
      searchTerms: ['Some Sevit', '세빛섬'],
      priceInfo: '무료 (튜브스터 요트 별도)',
      highlights: '반포한강공원 위 3개의 인공 부유섬, 야간 미디어아트 및 튜브스터 보트 체험',
    },

    // 🛍️ 테마 3: K-트렌드, 패션 & 쇼핑 핫플레이스
    {
      key: 'hongdae_fashion',
      category: 'K-트렌드 & 쇼핑 핫플레이스',
      nameKo: '홍대 걷고싶은거리 & R3 패션거리',
      nameEn: 'Hongdae Walking Street & R3 Fashion Street',
      searchTerms: ['Hongdae R3', 'HONGDAE', '홍대'],
      priceInfo: '무료 (쇼핑 자유)',
      highlights: 'K-POP 길거리 버스킹, 개성 넘치는 인디 패션 숍, 밤낮 활기찬 청춘 거리',
    },
    {
      key: 'seongsu',
      category: 'K-트렌드 & 쇼핑 핫플레이스',
      nameKo: '성수동 연무장길 (성수 팝업거리)',
      nameEn: 'Seongsu-dong Yeonmujang-gil Pop-up Street',
      searchTerms: ['Seongsu', '성수동'],
      priceInfo: '무료',
      highlights: '서울의 브루클린, 글로벌 명품·K-뷰티 플래그십 팝업스토어와 감성 카페 거리',
    },
    {
      key: 'hannam_hangangjin',
      category: 'K-트렌드 & 쇼핑 핫플레이스',
      nameKo: '한남동 꼼데가르송길 & 한강진역',
      nameEn: 'Hannam-dong Comme des Garçons Street',
      searchTerms: ['Hangangjin', '한강진역'],
      priceInfo: '무료',
      highlights: '글로벌 디자이너 브랜드 쇼룸, 리움미술관과 인접한 트렌디한 다이닝 거리',
    },
    {
      key: 'anyoung_insadong',
      category: 'K-트렌드 & 쇼핑 핫플레이스',
      nameKo: '인사동 쌈지길 & 안녕인사동',
      nameEn: 'Insadong Ssamzigil & Anyoung Insadong',
      searchTerms: ['Anyoung Insadong', 'Insadong', '인사동'],
      priceInfo: '무료',
      highlights: '전통 공예품, 찻집, 한국 기념품과 모던 복합문화몰이 어우러진 문화거리',
    },
    {
      key: 'gwanghwamun_square',
      category: 'K-트렌드 & 쇼핑 핫플레이스',
      nameKo: '광화문광장',
      nameEn: 'Gwanghwamun Square',
      searchTerms: ['Gwanghwamun Square', '광화문광장'],
      priceInfo: '무료',
      highlights: '세종대왕 및 이순신 장군 동상, 경복궁 앞 탁 트인 도심 문화 역사 광장',
    },

    // 🍲 테마 4: 전통 미식 & 로컬 시장 탐방
    {
      key: 'gwangjang_market',
      category: '전통 미식 & 로컬 시장',
      nameKo: '광장시장 먹자골목',
      nameEn: 'Gwangjang Traditional Food Market',
      searchTerms: ['Gwangjang', '광장시장'],
      priceInfo: '무료 (음식 ₩3,000~₩15,000)',
      highlights: '넷플릭스 길위의 미식가 방영지, 바삭한 빈대떡, 마약김밥, 육회 탕탕이 성지',
    },
    {
      key: 'namdaemun_market',
      category: '전통 미식 & 로컬 시장',
      nameKo: '남대문시장 & 숭례문',
      nameEn: 'Namdaemun Market & Sungnyemun Gate',
      searchTerms: ['Namdaemun', 'Sungnyemun', '남대문시장', '숭례문'],
      priceInfo: '무료 (쇼핑 자유)',
      highlights: '한국 최대 600년 전통 재래시장, 갈치조림골목, 씨앗호떡, 칼국수 골목',
    },
    {
      key: 'euljiro_nogari',
      category: '전통 미식 & 로컬 시장',
      nameKo: '을지로 노가리골목 (힙지로)',
      nameEn: 'Euljiro Nogari Alley (Hipjiro)',
      searchTerms: ['Euljiro', '을지로'],
      priceInfo: '무료 (노가리/생맥주 ₩1,500~)',
      highlights: '레트로한 야외 골목 테이블에서 시원한 생맥주와 바삭한 노가리를 즐기는 핫플레이스',
    },

    // 🎨 테마 5: 세계적 박물관 & 아트 갤러리
    {
      key: 'national_museum',
      category: '세계적 박물관 & 아트 갤러리',
      nameKo: '국립중앙박물관',
      nameEn: 'National Museum of Korea',
      searchTerms: ['National Museum of Korea', '국립중앙박물관'],
      priceInfo: '무료 (상설전시)',
      highlights: '아시아 최대 규모, 국보 반가사유상이 전시된 사유의 방(Room of Quiet Contemplation)',
    },
    {
      key: 'mmca_seoul',
      category: '세계적 박물관 & 아트 갤러리',
      nameKo: '국립현대미술관 서울관 (MMCA)',
      nameEn: 'National Museum of Modern and Contemporary Art (MMCA Seoul)',
      searchTerms: ['National Museum of Modern', 'MMCA', '국립현대미술관'],
      priceInfo: '₩4,000 ~ ₩5,000 (수/토 야간 무료)',
      highlights: '삼청동에 위치한 동시대 첨단 현대미술관, 감각적인 야외 마당과 전시',
    },
    {
      key: 'seoul_museum_art',
      category: '세계적 박물관 & 아트 갤러리',
      nameKo: '서울시립미술관 서소문본관 (SeMA)',
      nameEn: 'Seoul Museum of Art (SeMA Seosomun Main Building)',
      searchTerms: ['Museum of Art (Seosomun', '서울시립미술관'],
      priceInfo: '무료',
      highlights: '구 대법원 르네상스식 외벽을 보존한 유서 깊은 미술관, 천경자 화백 컬렉션',
    },

    // 🌊 테마 6: 한강 라이프스타일 & 도심 힐링 공원
    {
      key: 'yeouido_hangang',
      category: '한강 라이프스타일 & 도심 힐링 공원',
      nameKo: '여의도 한강공원 & 한강유람선',
      nameEn: 'Yeouido Hangang Park & River Cruise',
      searchTerms: ['Yeouido', '여의도 한강'],
      priceInfo: '무료 (유람선 ₩19,000~)',
      highlights: '외국인 필수 버킷리스트 한강 즉석 라면 먹방, 잔디밭 피크닉, 야간 유람선',
    },
    {
      key: 'banpo_rainbow',
      category: '한강 라이프스타일 & 도심 힐링 공원',
      nameKo: '반포대교 달빛무지개분수',
      nameEn: 'Banpo Bridge Moonlight Rainbow Fountain',
      searchTerms: ['Banpo', '반포대교'],
      priceInfo: '무료 (4~10월 매일 가동)',
      highlights: '기네스북 등재 세계 최장 교량 분수쇼, 세빛섬과 잠수교 야경이 어우러진 명소',
    },
    {
      key: 'ttukseom_hangang',
      category: '한강 라이프스타일 & 도심 힐링 공원',
      nameKo: '뚝섬 한강공원 (자벌레 문화공간)',
      nameEn: 'Ttukseom Hangang Park (J-Bug Cultural Complex)',
      searchTerms: ['Ttukseom', '뚝섬'],
      priceInfo: '무료',
      highlights: '원통형 자벌레 복합문화쉼터, 윈드서핑존, 사계절 테마 축제가 열리는 수변공원',
    },
    {
      key: 'cheonggyecheon',
      category: '한강 라이프스타일 & 도심 힐링 공원',
      nameKo: '청계천 도심 생태하천',
      nameEn: 'Cheonggyecheon Stream Walkway',
      searchTerms: ['Cheonggyecheon', '청계천'],
      priceInfo: '무료 (24시간 상시 개방)',
      highlights: '광화문에서 동대문까지 이어지는 5.8km 수변 산책로, 밤 징검다리와 조명',
    },
    {
      key: 'haneul_park',
      category: '한강 라이프스타일 & 도심 힐링 공원',
      nameKo: '하늘공원 (월드컵공원)',
      nameEn: 'Haneul Park (Sky Park) Night Views',
      searchTerms: ['Haneul Park', '하늘공원'],
      priceInfo: '무료',
      highlights: '가을 억새꽃 군락과 메타세쿼이아길, 한강과 북한산을 조망하는 노을 명소',
    },
  ];

  // 2. OpenAPI 데이터와 매핑하여 최종 정보 추출
  const finalizedSpots: ForeignerAttractionSpot[] = curatedDefinitions.map((def) => {
    // OpenAPI 데이터에서 가장 부합하는 항목 검색 (EN 우선, KO 보완)
    const matchedEn = allRows.find((r) =>
      r.LANG_CODE_ID === 'en' && def.searchTerms.some((t) => (r.POST_SJ || '').toLowerCase().includes(t.toLowerCase()))
    );
    const matchedKo = allRows.find((r) =>
      r.LANG_CODE_ID === 'ko' && def.searchTerms.some((t) => (r.POST_SJ || '').includes(t))
    );
    const matched = matchedEn || matchedKo;

    const rawSubway = matched?.SUBWAY_INFO?.trim().replace(/\r?\n/g, ' ') || '';
    const rawHours = matched?.CMMN_USE_TIME?.trim().replace(/\r?\n/g, ' ') || '';
    const rawClosed = matched?.CMMN_RSTDE?.trim().replace(/\r?\n/g, ' ') || '';
    const officialUrl = matched?.POST_URL?.trim() || matched?.CMMN_HMPG_URL?.trim() || 'https://korean.visitseoul.net';

    return {
      id: def.key,
      category: def.category,
      nameKo: def.nameKo,
      nameEn: def.nameEn,
      subwayInfo: rawSubway || '인근 지하철역 도보 연결',
      openingHours: rawHours || '상시 운영 (업장별 상이)',
      closedDays: rawClosed || '연중무휴',
      priceInfo: def.priceInfo,
      officialUrl,
      foreignerHighlights: def.highlights,
    };
  });

  // JSON 파일로 저장
  const outputPath = path.resolve(process.cwd(), 'scripts', 'foreigner_seoul_attractions.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalizedSpots, null, 2), 'utf8');
  console.log(`💾 [저장 완료] ${finalizedSpots.length}건의 외국인 인기 서울 명소 리스트가 ${outputPath} 에 저장되었습니다.`);

  return finalizedSpots;
}

if (require.main === module || process.argv[1]?.includes('generate-foreigner-spots')) {
  generateForeignerSeoulAttractions().catch((err) => console.error(err));
}
