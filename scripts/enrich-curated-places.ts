import dotenv from "dotenv";
import path from "path";
import { CURATED_PLACE_SEEDS, CuratedSeedItem } from "../src/data/curated-seeds";
import { fetchKtoApi, extractKtoItemsAndCount } from "../src/lib/kto/client";
import { CITY_TO_KTO_AREA_CODE, KTO_CONTENT_TYPE, KTO_ENDPOINTS } from "../src/lib/kto/constants";
import { KtoAreaBasedListItem, KtoDetailCommonItem } from "../src/lib/kto/types";
import {
  upsertPlace,
  upsertPlaceTranslation,
  upsertPlaceSource,
  replacePlaceImages,
  validateSupabaseEnv,
} from "../src/lib/supabase";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runCurationEnrichment() {
  console.log("==================================================");
  console.log("🌟 HypeHeritage Curated Places & KTO Enrichment");
  console.log("==================================================");

  try {
    validateSupabaseEnv();
  } catch (err: any) {
    console.error("❌ Supabase 환경변수 오류:", err.message);
    process.exit(1);
  }

  const apiKey = process.env.KTO_API_KEY;
  if (!apiKey) {
    console.error("❌ KTO_API_KEY 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  console.log(`총 ${CURATED_PLACE_SEEDS.length}개 큐레이션 시드 장소 데이터 처리 시작...\n`);

  let successCount = 0;
  let fallbackCount = 0;
  let failCount = 0;

  for (let i = 0; i < CURATED_PLACE_SEEDS.length; i++) {
    const seed = CURATED_PLACE_SEEDS[i];
    const areaCode = CITY_TO_KTO_AREA_CODE[seed.city];
    console.log(`[${i + 1}/${CURATED_PLACE_SEEDS.length}] [${seed.city}] ${seed.name} (검색어: ${seed.searchKeyword})`);

    let ktoItem: KtoAreaBasedListItem | null = null;
    let engOverview = "";
    let engTitle = "";
    let engAddr = "";

    try {
      // 1. KTO 국문 searchKeyword2 검색
      const searchRes = await fetchKtoApi<KtoAreaBasedListItem>({
        locale: "ko",
        endpoint: KTO_ENDPOINTS.SEARCH_KEYWORD,
        params: {
          areaCode,
          keyword: seed.searchKeyword,
          numOfRows: 5,
          pageNo: 1,
        },
      });

      const { rawItems } = extractKtoItemsAndCount<KtoAreaBasedListItem>(searchRes.response?.body);
      if (rawItems.length > 0) {
        // 첫 번째 또는 이름이 가장 근접한 매칭 장소 선택
        ktoItem = rawItems.find((r) => r.title.includes(seed.searchKeyword)) || rawItems[0];
      }

      // 2. KTO 영문 detailCommon2 조회
      if (ktoItem && ktoItem.contentid) {
        try {
          const engRes = await fetchKtoApi<KtoDetailCommonItem>({
            locale: "en",
            endpoint: KTO_ENDPOINTS.DETAIL_COMMON,
            params: {
              contentId: ktoItem.contentid,
              overviewYN: "Y",
              addrinfoYN: "Y",
              titleYN: "Y",
            },
          });
          const engItemsData = engRes.response?.body?.items;
          if (engItemsData && typeof engItemsData === "object" && "item" in engItemsData) {
            const rawEng = (engItemsData as any).item;
            const item = Array.isArray(rawEng) ? rawEng[0] : rawEng;
            if (item) {
              engTitle = item.title || "";
              engOverview = item.overview || "";
              engAddr = item.addr1 || "";
            }
          }
        } catch {
          // 영문 정보 없을 경우 무시
        }
      }
    } catch (err: any) {
      console.warn(`  ⚠️ KTO API 조회 실패 (기본 큐레이션 정보로 적재): ${err.message}`);
    }

    const contentId = ktoItem?.contentid || `curated-${seed.city.toLowerCase()}-${i + 1}`;
    const repImageUrl = ktoItem?.firstimage || ktoItem?.firstimage2 || undefined;
    const address = ktoItem?.addr1 || (seed.city === "SEOUL" ? "서울특별시" : "부산광역시");
    const latitude = ktoItem?.mapy ? parseFloat(ktoItem.mapy) : undefined;
    const longitude = ktoItem?.mapx ? parseFloat(ktoItem.mapx) : undefined;
    const tel = ktoItem?.tel || undefined;

    const koTitle = seed.name;
    const koDescription = seed.curationReason.ko;
    const enTitle = engTitle || seed.name;
    const enDescription = seed.curationReason.en;

    try {
      // 3. Supabase places 테이블 Upsert
      const { placeId, isNew } = await upsertPlace({
        contentId,
        sourceName: "KTO",
        city: seed.city,
        category: seed.category,
        address,
        latitude: !isNaN(Number(latitude)) ? latitude : undefined,
        longitude: !isNaN(Number(longitude)) ? longitude : undefined,
        repImageUrl,
        qualityStatus: "READY",
        translations: [
          { locale: "ko", title: koTitle, description: koDescription, address },
          { locale: "en", title: enTitle, description: enDescription, address: engAddr || address },
        ],
      });

      // 4. place_translations (국문/영문) Upsert
      await upsertPlaceTranslation({
        place_id: placeId,
        locale: "ko",
        title: koTitle,
        description: koDescription,
        address,
      });

      await upsertPlaceTranslation({
        place_id: placeId,
        locale: "en",
        title: enTitle,
        description: enDescription,
        address: engAddr || address,
      });

      // 5. place_sources 원천 데이터 저장
      await upsertPlaceSource({
        place_id: placeId,
        source_name: "KTO",
        source_content_id: contentId,
        raw_data: {
          seed,
          ktoItem,
          curated: true,
          priceTier: seed.priceTier,
          tags: seed.tags,
          estimatedPriceKrw: seed.estimatedPriceKrw,
        },
      });

      // 6. 이미지 저장
      if (repImageUrl) {
        await replacePlaceImages(placeId, [
          {
            imageUrl: repImageUrl,
            originUrl: repImageUrl,
            caption: seed.name,
            sortOrder: 0,
          },
        ]);
      }

      if (ktoItem) {
        console.log(`  ✅ KTO 결합 완료 (ID: ${contentId}, 사진: ${repImageUrl ? "있음" : "없음"}) -> DB 저장 성공`);
        successCount++;
      } else {
        console.log(`  ℹ️ 큐레이션 기본 정보로 DB 저장 완료 (ID: ${contentId})`);
        fallbackCount++;
      }
    } catch (dbErr: any) {
      console.error(`  ❌ DB 저장 오류: ${dbErr.message}`);
      failCount++;
    }

    // KTO 호출 간 소폭 딜레이
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("\n==================================================");
  console.log("🎉 큐레이션 및 KTO 데이터 결합 적재 완료!");
  console.log(`- KTO 결합 성공: ${successCount}건`);
  console.log(`- 시드 기본 적재: ${fallbackCount}건`);
  console.log(`- 실패: ${failCount}건`);
  console.log("==================================================");
}

runCurationEnrichment();
