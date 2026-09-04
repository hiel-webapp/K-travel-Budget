import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// .env.local 및 .env 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// 1. 환경변수 및 키 인코딩 안전 처리
const RAW_KEY = process.env.KTO_SERVICE_KEY || process.env.KTO_API_KEY || '';
const KTO_API_KEY = decodeURIComponent(RAW_KEY);

// 공공데이터포털 관광공사 영문 서비스 URL (EngService1 폐기 대비 EngService2 스마트 자동 전환 지원)
const BASE_URL_V1 = 'http://apis.data.go.kr/B551011/EngService1';
const BASE_URL_V2 = 'https://apis.data.go.kr/B551011/EngService2';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface KTOItem {
  contentid: string;
  title: string;
  firstimage?: string;
  firstimage2?: string;
  addr1?: string;
  areacode: string;
  contenttypeid: string;
}

export interface CatalogItemPayload {
  content_id?: string;
  budget_partition: string;
  area_code: number;
  main_category: string;
  sub_category: string;
  title_en: string;
  desc_en: string;
  price_krw: number;
  image_url: string;
  deep_link_template: string;
  last_synced_at?: string;
}

// 2. 관광지 상세 소개정보(입장료 확인용) 조회 함수 (v1 및 v2 호환)
async function fetchPlaceFee(contentId: string, apiVersion: 'v1' | 'v2' = 'v2'): Promise<{ price: number; desc: string }> {
  const baseUrl = apiVersion === 'v1' ? BASE_URL_V1 : BASE_URL_V2;
  const endpoint = apiVersion === 'v1' ? 'detailIntro1' : 'detailIntro2';

  try {
    const res = await axios.get(`${baseUrl}/${endpoint}`, {
      params: {
        serviceKey: KTO_API_KEY,
        contentId: contentId,
        contentTypeId: '76', // 영어 관광지 코드: 76
        MobileOS: 'ETC',
        MobileApp: process.env.KTO_MOBILE_APP || 'HypeHeritage',
        _type: 'json',
      },
      timeout: 6000,
    });

    const intro = res.data?.response?.body?.items?.item?.[0];
    const feeInfo: string = intro?.usefee || '';

    // "Free" 또는 "무료" 감지 시 0원 처리
    if (!feeInfo || /free|무료/i.test(feeInfo)) {
      return { price: 0, desc: 'Free Admission. Enjoy K-Heritage.' };
    }

    // 숫자 파싱 (예: "Adults: 3,000 won" -> 3000)
    const match = feeInfo.replace(/,/g, '').match(/\d+/);
    const parsedPrice = match ? parseInt(match[0], 10) : 0;

    return { 
      price: parsedPrice, 
      desc: feeInfo.length > 120 ? feeInfo.substring(0, 117) + '...' : feeInfo 
    };
  } catch (error) {
    return { price: 0, desc: 'Popular sightseeing spot in Seoul.' };
  }
}

// 3. Supabase DB (Hype_Catalog_Items) 동기화 함수
async function syncToSupabase(catalogList: CatalogItemPayload[]): Promise<{ success: boolean; count: number; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ [Supabase] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 DB 저장을 건너뜁니다.');
    return { success: false, count: 0, error: 'Missing Supabase credentials' };
  }

  console.log(`\n📡 [Supabase] ${catalogList.length}건의 데이터를 Hype_Catalog_Items 테이블에 동기화 중...`);

  try {
    const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/Hype_Catalog_Items`;
    const response = await axios.post(endpoint, catalogList, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      timeout: 10000,
    });

    console.log(`✅ [Supabase] Hype_Catalog_Items 테이블 동기화 성공! (HTTP 상태코드: ${response.status})`);
    return { success: true, count: catalogList.length };
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.response?.data || err.message;
    console.error('❌ [Supabase] 동기화 실패 (테이블 구조/RLS 확인 권장):', errorMsg);
    return { success: false, count: 0, error: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg) };
  }
}

// 4. 서울 지역 인기 관광지 20개 수집 및 매핑 배치 실행
export async function syncKTOPlacesToHypeHeritage() {
  if (!KTO_API_KEY) {
    console.error('❌ .env에 KTO_SERVICE_KEY (또는 KTO_API_KEY)가 설정되어 있지 않습니다.');
    return [];
  }

  console.log('🚀 [HypeHeritage] 한국관광공사 TourAPI 데이터 수집 시작...');

  let items: KTOItem[] = [];
  let usedVersion: 'v1' | 'v2' = 'v1';

  // 4-1. 1차: EngService1/areaBasedList1 시도
  try {
    console.log('🔍 [1단계] EngService1/areaBasedList1 호출 시도...');
    const response = await axios.get(`${BASE_URL_V1}/areaBasedList1`, {
      params: {
        serviceKey: KTO_API_KEY,
        numOfRows: 20,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: process.env.KTO_MOBILE_APP || 'HypeHeritage',
        _type: 'json',
        listYN: 'Y',
        arrange: 'Q',        // 인기순 정렬
        contentTypeId: '76', // 76: 관광지
        areaCode: '1',       // 1: 서울
      },
      timeout: 8000,
    });

    if (response.data?.response?.body?.items?.item) {
      items = response.data.response.body.items.item;
      usedVersion = 'v1';
    } else if (response.data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnReasonCode === '12') {
      throw new Error('EngService1 deprecated (code 12)');
    }
  } catch (err: any) {
    console.log('ℹ️ EngService1 서비스가 제공되지 않거나 만료되어 최신 EngService2로 자동 전환합니다.');
    
    try {
      const responseV2 = await axios.get(`${BASE_URL_V2}/areaBasedList2`, {
        params: {
          serviceKey: KTO_API_KEY,
          numOfRows: 20,
          pageNo: 1,
          MobileOS: 'ETC',
          MobileApp: process.env.KTO_MOBILE_APP || 'HypeHeritage',
          _type: 'json',
          arrange: 'Q',        // 인기순 정렬
          contentTypeId: '76', // 76: 관광지
          areaCode: '1',       // 1: 서울
        },
        timeout: 8000,
      });

      const body = responseV2.data?.response?.body;
      const rawItem = body?.items?.item;
      if (Array.isArray(rawItem)) {
        items = rawItem;
      } else if (rawItem && typeof rawItem === 'object') {
        items = [rawItem];
      } else {
        items = [];
      }
      usedVersion = 'v2';
    } catch (errV2: any) {
      console.error('❌ TourAPI EngService2 수집 실패:', errV2.response?.data || errV2.message);
      return [];
    }
  }

  console.log(`✅ [${usedVersion.toUpperCase()}] 서울 인기 관광지 ${items.length}건 데이터 수신 완료.`);

  if (items.length === 0) {
    console.warn('⚠️ 수신된 관광지 데이터가 없습니다.');
    return [];
  }

  const catalogList: CatalogItemPayload[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await delay(120); // API 과부하 방지 안전 딜레이
    const { price, desc } = await fetchPlaceFee(item.contentid, usedVersion);

    const catalogItem: CatalogItemPayload = {
      content_id: item.contentid,
      budget_partition: 'CITY_SPECIFIC',
      area_code: 1,
      main_category: 'Sightseeing',
      sub_category: 'Attraction',
      title_en: item.title,
      desc_en: desc,
      price_krw: price,
      image_url: item.firstimage || item.firstimage2 || '/assets/default-place.jpg',
      deep_link_template: 'https://www.klook.com/city/14-seoul-things-to-do/?spm=HypeHeritage',
      last_synced_at: new Date().toISOString(),
    };

    catalogList.push(catalogItem);
    console.log(`  [${String(i + 1).padStart(2, '0')}/20] ${catalogItem.title_en} ➔ ₩${catalogItem.price_krw.toLocaleString()}`);
  }

  console.log('\n🎉 [데이터 변환 완료] DB 인입 준비 완료된 데이터 수량:', catalogList.length);

  // 5. DB 동기화 (Hype_Catalog_Items)
  await syncToSupabase(catalogList);

  return catalogList;
}

// 직접 스크립트 실행 시 검증된 20대 서울 랜드마크 데이터셋 동기화 호출
if (require.main === module || process.argv[1]?.includes('fetch-kto-places')) {
  import('./sync-kto-places').then((m) => m.syncCleanVerifiedLandmarks());
}
