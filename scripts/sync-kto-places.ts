import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// .env.local 및 .env 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// 1. 환경변수 및 키 인코딩 안전 처리
const RAW_KEY = process.env.KTO_SERVICE_KEY || process.env.KTO_API_KEY || '';
const KTO_API_KEY = decodeURIComponent(RAW_KEY);

const BASE_URL_V1 = 'http://apis.data.go.kr/B551011/EngService1';
const BASE_URL_V2 = 'https://apis.data.go.kr/B551011/EngService2';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aqfvmuytaukrkdmememh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZnZtdXl0YXVrcmtkbWVtZW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2OTM0MzUsImV4cCI6MjEwMDI2OTQzNX0.he2Fy3OJ4RQEANKy2cuN2sb0BcfgQRhmZ9KJHTngaBs';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CatalogItemPayload {
  content_id: string;
  budget_partition: 'CITY_SPECIFIC' | 'COMMON';
  area_code: number;
  main_category: 'Sightseeing';
  sub_category: 'Attraction' | 'Heritage' | 'Market' | 'Shopping';
  title_en: string;
  desc_en: string;
  price_krw: number;
  image_url: string;
  deep_link_template: string;
  created_at?: string;
}

// 2. 사설 공방 / 개인 소규모 점포 등 배제용 필터 키워드
const EXCLUDE_PATTERNS = [
  /폰케이스|phone case/i,
  /공방|workshop|woodwork/i,
  /도예|ceramics/i,
  /이스케이프|방탈출|escape/i,
  /한의원|clinic/i,
  /사설|개인/i,
  /네일|nail|미용실|헤어/i,
  /룸카페|사주|타로/i,
];

// 3. 필수 공공/역사/상권 랜드마크 큐레이션 데이터 (API 누락 대비 최우선 보장)
const MUST_HAVE_LANDMARKS: CatalogItemPayload[] = [
  {
    content_id: 'kto_core_gyeongbokgung',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Heritage',
    title_en: 'Gyeongbokgung Palace (경복궁)',
    desc_en: 'Main royal palace of the Joseon Dynasty built in 1395. Free admission when wearing Hanbok.',
    price_krw: 3000,
    image_url: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_changdeokgung',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Heritage',
    title_en: 'Changdeokgung Palace & Secret Garden (창덕궁과 후원)',
    desc_en: 'UNESCO World Heritage palace renowned for its harmonious architecture and picturesque Secret Garden.',
    price_krw: 8000,
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_deoksugung',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Heritage',
    title_en: 'Deoksugung Palace & Stonewall Walkway (덕수궁 & 돌담길)',
    desc_en: 'Historic royal palace featuring Western-style buildings, beautiful nocturnal illumination, and iconic stonewall paths.',
    price_krw: 1000,
    image_url: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_nseoultower',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Attraction',
    title_en: 'N Seoul Tower Observatory (N서울타워 전망대)',
    desc_en: 'Seoul landmark perched atop Namsan Mountain offering breathtaking 360-degree panoramic skyline views.',
    price_krw: 21000,
    image_url: 'https://images.unsplash.com/photo-1506812574058-fc75fa93fead?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_lotteworldtower',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Attraction',
    title_en: 'Lotte World Tower Seoul Sky (롯데월드타워 서울스카이)',
    desc_en: '555m tall skyscraper observatory on the 117th–123rd floors with glass skywalk and breathtaking views.',
    price_krw: 31000,
    image_url: 'https://images.unsplash.com/photo-1538669715315-155098f6dd47?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_ddp',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Attraction',
    title_en: 'Dongdaemun Design Plaza - DDP (동대문디자인플라자)',
    desc_en: 'Futuristic architectural masterpiece designed by Zaha Hadid, hosting global art exhibitions and night markets.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_bukchon',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Heritage',
    title_en: 'Bukchon Hanok Village (북촌한옥마을)',
    desc_en: 'Traditional village with hundreds of preserved Korean Hanok houses dating back to the Joseon Dynasty.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_seongsu',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Shopping',
    title_en: 'Seongsu-dong Yeonmujang-gil (성수동 연무장길)',
    desc_en: 'The "Brooklyn of Seoul" famous for trendy pop-up stores, art cafes, and iconic fashion flagship boutiques.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_hongdae',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Attraction',
    title_en: 'Hongdae Walking Street (홍대 걷고싶은거리)',
    desc_en: 'Youthful cultural epicenter vibrant with street buskers, live indie music, indie fashion, and nightlife.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_gwangjang',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Market',
    title_en: 'Gwangjang Traditional Market (광장시장)',
    desc_en: "Historic century-old market famous for authentic street food such as Bindaetteok and Mayak Kimbap.",
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_namdaemun',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Market',
    title_en: 'Namdaemun Market (남대문시장)',
    desc_en: 'The largest traditional market in Korea offering wholesale goods, street food alleys, and historic Korean souvenirs.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_yeouido_hangang',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Attraction',
    title_en: 'Yeouido Hangang Park (여의도 한강공원)',
    desc_en: 'Iconic riverside park along the Han River popular for picnic mats, Han River instant ramen, and water sports.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_museum_korea',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Heritage',
    title_en: 'National Museum of Korea (국립중앙박물관)',
    desc_en: 'Flagship national museum showcasing the rich cultural heritage and history of Korea from ancient to modern times.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_cheonggyecheon',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Attraction',
    title_en: 'Cheonggyecheon Stream (청계천)',
    desc_en: 'Scenic 11km urban eco-restoration stream coursing through downtown Seoul, perfect for peaceful evening walks.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1546874177-9e664107314e?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
  {
    content_id: 'kto_core_starfield_library',
    budget_partition: 'CITY_SPECIFIC',
    area_code: 1,
    main_category: 'Sightseeing',
    sub_category: 'Attraction',
    title_en: 'Starfield Library COEX (코엑스 별마당도서관)',
    desc_en: 'Breathtaking open public library inside Starfield COEX Mall featuring magnificent 13-meter-tall glowing bookshelves.',
    price_krw: 0,
    image_url: 'https://images.unsplash.com/photo-1507842229452-9b2f6ef3f707?auto=format&fit=crop&w=800&q=80',
    deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
  },
];

// 4. KTO 관광지 상세 입장료 파싱 함수
async function fetchPlaceFee(contentId: string, apiVersion: 'v1' | 'v2' = 'v2'): Promise<{ price: number; desc: string }> {
  const baseUrl = apiVersion === 'v1' ? BASE_URL_V1 : BASE_URL_V2;
  const endpoint = apiVersion === 'v1' ? 'detailIntro1' : 'detailIntro2';

  try {
    const res = await axios.get(`${baseUrl}/${endpoint}`, {
      params: {
        serviceKey: KTO_API_KEY,
        contentId: contentId,
        contentTypeId: '76',
        MobileOS: 'ETC',
        MobileApp: 'HypeHeritage',
        _type: 'json',
      },
      timeout: 6000,
    });

    const intro = res.data?.response?.body?.items?.item?.[0];
    const feeInfo: string = intro?.usefee || '';

    if (!feeInfo || /free|무료/i.test(feeInfo)) {
      return { price: 0, desc: 'Free Admission. Public landmark.' };
    }

    const match = feeInfo.replace(/,/g, '').match(/\d+/);
    const parsedPrice = match ? parseInt(match[0], 10) : 0;

    return {
      price: parsedPrice,
      desc: feeInfo.length > 120 ? feeInfo.substring(0, 117) + '...' : feeInfo,
    };
  } catch (err) {
    return { price: 0, desc: 'Popular sightseeing spot in Seoul.' };
  }
}

// 5. Supabase UPSERT 함수
async function upsertToSupabase(items: CatalogItemPayload[]): Promise<number> {
  let savedCount = 0;
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  // 1) hype_catalog_items (소문자 표준 테이블)
  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/hype_catalog_items?on_conflict=content_id`;
    const res = await axios.post(url, items, { headers, timeout: 10000 });
    console.log(`✅ [Supabase] hype_catalog_items 테이블에 ${items.length}건 UPSERT 완료 (HTTP ${res.status})`);
    savedCount += items.length;
  } catch (err: any) {
    console.warn('ℹ️ hype_catalog_items 테이블이 아직 없거나 뷰 상태입니다. Hype_Catalog_Items 테이블로 동기화합니다.');
  }

  // 2) Hype_Catalog_Items (기존 테이블 호환)
  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/Hype_Catalog_Items?on_conflict=content_id`;
    const res = await axios.post(url, items, { headers, timeout: 10000 });
    console.log(`✅ [Supabase] Hype_Catalog_Items 테이블에 ${items.length}건 UPSERT 완료 (HTTP ${res.status})`);
    if (savedCount === 0) savedCount += items.length;
  } catch (err: any) {
    console.error('❌ Hype_Catalog_Items 저장 에러:', err.response?.data?.message || err.message);
  }

  return savedCount;
}

// 6. 메인 동기화 함수
export async function syncKTOPlaces() {
  console.log('🚀 [KTO Sync] 한국관광공사(KTO) OpenAPI 서울 관광지 데이터 수집 시작...');

  const gatheredList: CatalogItemPayload[] = [];
  const addedContentIds = new Set<string>();

  // (1) 필수 15대 랜드마크 우선 등록
  MUST_HAVE_LANDMARKS.forEach((item) => {
    gatheredList.push(item);
    addedContentIds.add(item.content_id);
    console.log(`⭐ [핵심 랜드마크 등록] ${item.title_en} (${item.price_krw === 0 ? 'FREE' : '₩' + item.price_krw.toLocaleString()})`);
  });

  // (2) KTO TourAPI areaBasedList2 호출 (조회순 'P' 및 인기순 'Q')
  if (KTO_API_KEY) {
    try {
      console.log('\n📡 [KTO API] areaBasedList2 인기순 조회 중...');
      const res = await axios.get(`${BASE_URL_V2}/areaBasedList2`, {
        params: {
          serviceKey: KTO_API_KEY,
          numOfRows: 35,
          pageNo: 1,
          MobileOS: 'ETC',
          MobileApp: 'HypeHeritage',
          _type: 'json',
          arrange: 'P',
          contentTypeId: '76',
          areaCode: '1',
        },
        timeout: 8000,
      });

      const rawItems = res.data?.response?.body?.items?.item || [];
      const apiItems = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

      for (const item of apiItems) {
        if (!item.title || !item.contentid) continue;
        if (addedContentIds.has(item.contentid) || addedContentIds.has(`kto_${item.contentid}`)) continue;

        // 사설 공방 / 개인 소규모 점포 등 필터링 배제
        const isExcluded = EXCLUDE_PATTERNS.some((pattern) => pattern.test(item.title));
        if (isExcluded) {
          console.log(`  [제외] 사설/소규모 공방 배제: ${item.title}`);
          continue;
        }

        await delay(150); // 레이트 리밋 방어 150ms 딜레이
        const { price, desc } = await fetchPlaceFee(item.contentid, 'v2');

        const catalogItem: CatalogItemPayload = {
          content_id: item.contentid,
          budget_partition: 'CITY_SPECIFIC',
          area_code: 1,
          main_category: 'Sightseeing',
          sub_category: 'Attraction',
          title_en: item.title,
          desc_en: desc || 'Popular public sightseeing spot in Seoul.',
          price_krw: price,
          image_url: item.firstimage || item.firstimage2 || '/assets/default-place.jpg',
          deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
        };

        gatheredList.push(catalogItem);
        addedContentIds.add(item.contentid);
        console.log(`  [KTO 수집] ${catalogItem.title_en} ➔ ₩${catalogItem.price_krw.toLocaleString()}`);

        if (gatheredList.length >= 30) break;
      }
    } catch (apiErr: any) {
      console.warn('⚠️ KTO API 수집 중 경고:', apiErr.message);
    }
  }

  console.log(`\n🎉 총 ${gatheredList.length}건의 선별 랜드마크 준비 완료.`);

  // (3) Supabase DB 적재
  await upsertToSupabase(gatheredList);
  return gatheredList;
}

if (require.main === module || process.argv[1]?.includes('sync-kto-places')) {
  syncKTOPlaces().catch((err) => console.error('Fatal error:', err));
}
