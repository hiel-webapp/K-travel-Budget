import { SupportedCity } from "../trip-domain";
import { extractKtoItemsAndCount, fetchKtoApi, getKtoCredentials } from "./client";
import { CITY_TO_KTO_AREA_CODE, KTO_CONTENT_TYPE, KTO_ENDPOINTS } from "./constants";
import { normalizeKtoPlace } from "./normalizer";
import { KtoAreaBasedListItem, KtoDetailCommonItem, PlaceCategory } from "./types";
import {
  createIngestionRun,
  replacePlaceImages,
  updateIngestionRun,
  upsertPlace,
  upsertPlaceSource,
  upsertPlaceTranslation,
  validateSupabaseEnv,
} from "../supabase";

export interface KtoIngestOptions {
  dryRun?: boolean;
  city?: SupportedCity | "ALL";
  categories?: PlaceCategory[];
  limitPerCategory?: number;
}

export interface KtoIngestResult {
  runId?: string;
  city: string;
  categories: PlaceCategory[];
  dryRun: boolean;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  allCategoriesZeroWarning?: boolean;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  errors: string[];
}

export function validateIngestOptions(options: KtoIngestOptions = {}) {
  const city = options.city || "SEOUL";
  const limitPerCategory = options.limitPerCategory ?? 10;
  const dryRun = options.dryRun ?? false;
  const categories = options.categories || [
    "ACCOMMODATION",
    "RESTAURANT",
    "ATTRACTION",
    "CULTURE",
  ];

  if (city !== "SEOUL" && city !== "BUSAN" && city !== "ALL") {
    throw new Error(
      `[KTO_INGEST_ERROR] Invalid city: '${city}'. Allowed values are SEOUL, BUSAN, or ALL.`
    );
  }

  if (
    typeof limitPerCategory !== "number" ||
    isNaN(limitPerCategory) ||
    limitPerCategory <= 0 ||
    !Number.isInteger(limitPerCategory)
  ) {
    throw new Error(
      `[KTO_INGEST_ERROR] Invalid limitPerCategory: '${limitPerCategory}'. Must be a positive integer.`
    );
  }

  return { city, limitPerCategory, dryRun, categories };
}

/**
 * 관광공사 (KTO) 장소 데이터를 수집하여 HypeHeritage Place DB에 정규화 저장하는 파이프라인 함수입니다.
 */
export async function ingestKtoPlaces(
  options: KtoIngestOptions = {}
): Promise<KtoIngestResult> {
  const { city, limitPerCategory, dryRun, categories } = validateIngestOptions(options);

  if (!dryRun) {
    validateSupabaseEnv();
    getKtoCredentials();
  }

  const targetCities: SupportedCity[] =
    city === "ALL" ? ["SEOUL", "BUSAN"] : [city];

  let runId: string | undefined = undefined;
  if (!dryRun) {
    try {
      const run = await createIngestionRun({
        source_name: "KTO",
        city: city,
        status: "RUNNING",
        total_fetched: 0,
        total_inserted: 0,
        total_updated: 0,
        total_skipped: 0,
      });
      runId = run.id;
    } catch {
      // Ingestion run 초기 기록 실패 시에도 진행 가능하도록 처리
    }
  }

  let totalFetched = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  for (const currentCity of targetCities) {
    const areaCode = CITY_TO_KTO_AREA_CODE[currentCity];

    for (const cat of categories) {
      let contentTypeId: string = KTO_CONTENT_TYPE.KOR.RESTAURANT;
      if (cat === "ACCOMMODATION") contentTypeId = KTO_CONTENT_TYPE.KOR.ACCOMMODATION;
      else if (cat === "ATTRACTION") contentTypeId = KTO_CONTENT_TYPE.KOR.ATTRACTION;
      else if (cat === "CULTURE") contentTypeId = KTO_CONTENT_TYPE.KOR.CULTURE;
      else if (cat === "RESTAURANT" || cat === "CAFE") contentTypeId = KTO_CONTENT_TYPE.KOR.RESTAURANT;

      let rawItems: KtoAreaBasedListItem[] = [];
      try {
        if (!dryRun) {
          const apiRes = await fetchKtoApi<KtoAreaBasedListItem>({
            locale: "ko",
            endpoint: KTO_ENDPOINTS.AREA_BASED_LIST,
            params: {
              areaCode,
              contentTypeId,
              numOfRows: limitPerCategory,
              pageNo: 1,
            },
          });

          const parsed = extractKtoItemsAndCount<KtoAreaBasedListItem>(
            apiRes.response?.body
          );
          rawItems = parsed.rawItems;

          const isDebugMode =
            dryRun || process.env.KTO_INGEST_DEBUG === "true";
          if (isDebugMode) {
            const resultCode = apiRes.response?.header?.resultCode || "UNKNOWN";
            const resultMsg = apiRes.response?.header?.resultMsg || "OK";
            console.log(
              `[KTO_DEBUG] [${currentCity}/${cat}] path=${KTO_ENDPOINTS.AREA_BASED_LIST} areaCode=${areaCode} contentTypeId=${contentTypeId} pageNo=1 numOfRows=${limitPerCategory} httpStatus=200 resultCode=${resultCode} resultMsg=${resultMsg} totalCount=${parsed.totalCount} parsedItems=${rawItems.length}`
            );
          }

          if (parsed.totalCount > 0 && rawItems.length === 0) {
            throw new Error(
              `[KTO_PARSE_ERROR] KTO API reported totalCount=${parsed.totalCount} but 0 items were parsed from response structure (path: ${KTO_ENDPOINTS.AREA_BASED_LIST})`
            );
          }
        }
      } catch (err: unknown) {
        totalFailed++;
        const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
        errors.push(`[${currentCity}/${cat}] Fetch failed: ${errMsg}`);
        continue;
      }

      totalFetched += rawItems.length;

      for (const item of rawItems) {
        const normalized = normalizeKtoPlace(item, {
          locale: "ko",
          overrideCity: currentCity,
        });

        if (!normalized) {
          totalSkipped++;
          continue;
        }

        if (dryRun) {
          totalInserted++;
          continue;
        }

        try {
          const { placeId, isNew } = await upsertPlace(normalized);
          if (isNew) {
            totalInserted++;
          } else {
            totalUpdated++;
          }

          // 1. 국문 번역 저장
          if (normalized.translations[0]) {
            await upsertPlaceTranslation({
              place_id: placeId,
              locale: "ko",
              title: normalized.translations[0].title,
              description: normalized.translations[0].description,
              address: normalized.translations[0].address,
            });
          }

          // 2. 원천 데이터 저장
          await upsertPlaceSource({
            place_id: placeId,
            source_name: "KTO_KOR",
            source_content_id: normalized.contentId,
            raw_data: normalized.rawSourceData || {},
          });

          // 3. 이미지 저장
          if (normalized.images && normalized.images.length > 0) {
            await replacePlaceImages(placeId, normalized.images);
          }

          // 4. 영문 관광정보 수집 (동일 contentId 기준)
          try {
            const engRes = await fetchKtoApi<KtoDetailCommonItem>({
              locale: "en",
              endpoint: KTO_ENDPOINTS.DETAIL_COMMON,
              params: {
                contentId: normalized.contentId,
                overviewYN: "Y",
                addrinfoYN: "Y",
                titleYN: "Y",
              },
            });

            const engItemsData = engRes.response?.body?.items;
            if (engItemsData && typeof engItemsData === "object" && "item" in engItemsData) {
              const rawEng = engItemsData.item;
              const engItem = Array.isArray(rawEng) ? rawEng[0] : rawEng;
              if (engItem && engItem.title) {
                const engNormalized = normalizeKtoPlace(engItem, {
                  locale: "en",
                  overrideCity: currentCity,
                });
                if (engNormalized && engNormalized.translations[0]) {
                  await upsertPlaceTranslation({
                    place_id: placeId,
                    locale: "en",
                    title: engNormalized.translations[0].title,
                    description: engNormalized.translations[0].description,
                    address: engNormalized.translations[0].address,
                  });
                }
              }
            }
          } catch {
            // 영문 정보 수집 실패 시 국문 정보 유지를 위해 계속 진행
          }

          // 과도한 API 호출 방지 소폭 지연
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (err: unknown) {
          totalFailed++;
          const msg = err instanceof Error ? err.message : "Upsert failed";
          errors.push(`[${currentCity}/${normalized.contentId}] ${msg}`);
        }
      }
    }
  }

  let status: "COMPLETED" | "PARTIAL" | "FAILED" = "COMPLETED";
  if (totalFailed > 0 || errors.length > 0) {
    if (totalFetched === 0 || (totalInserted === 0 && totalUpdated === 0 && totalSkipped === 0)) {
      status = "FAILED";
    } else {
      status = "PARTIAL";
    }
  }

  const allCategoriesZeroWarning = totalFetched === 0 && totalFailed === 0;

  const result: KtoIngestResult = {
    runId,
    city,
    categories,
    dryRun,
    status,
    allCategoriesZeroWarning,
    totalFetched,
    totalInserted,
    totalUpdated,
    totalSkipped,
    totalFailed,
    errors,
  };

  if (!dryRun && runId) {
    try {
      const dbStatus = status === "FAILED" ? "FAILED" : "COMPLETED";
      await updateIngestionRun(runId, {
        status: dbStatus,
        total_fetched: totalFetched,
        total_inserted: totalInserted,
        total_updated: totalUpdated,
        total_skipped: totalSkipped,
        error_message: errors.length > 0 ? errors.slice(0, 5).join(" | ") : undefined,
      });
    } catch {
      // Ingestion run 종료 상태 업데이트 실패 시 예외 무시
    }
  }

  return result;
}
