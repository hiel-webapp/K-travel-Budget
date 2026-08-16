import { MOCK_PLACES } from "./mock-places";
import { PlaceFilterOptions, PlaceItem } from "./types";
import { supabaseFetch } from "../supabase/client";
import { DbPlace, DbPlaceTranslation } from "../supabase/types";
import { fetchKtoApi, extractKtoItemsAndCount } from "../kto/client";
import { CITY_TO_KTO_AREA_CODE, KTO_CONTENT_TYPE, KTO_ENDPOINTS } from "../kto/constants";
import { normalizeKtoPlace } from "../kto/normalizer";
import { KtoAreaBasedListItem } from "../kto/types";

export interface IPlacesService {
  getPlaces(options?: PlaceFilterOptions): Promise<PlaceItem[]>;
  getPlaceById(id: string): Promise<PlaceItem | null>;
}

export class PlacesService implements IPlacesService {
  async getPlaces(options: PlaceFilterOptions = {}): Promise<PlaceItem[]> {
    const { city = "ALL", category = "ALL", query = "", locale = "ko" } = options;

    // 1단계: Supabase DB 조회 시도
    try {
      if (process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        let endpoint = `places?select=*,place_translations(*)`;
        const filters: string[] = [];

        if (city !== "ALL") {
          filters.push(`city=eq.${city}`);
        }
        if (category !== "ALL") {
          filters.push(`category=eq.${category}`);
        }

        if (filters.length > 0) {
          endpoint += `&${filters.join("&")}`;
        }

        const dbPlaces = await supabaseFetch<(DbPlace & { place_translations?: DbPlaceTranslation[] })[]>(endpoint, {
          method: "GET",
        });

        if (dbPlaces && Array.isArray(dbPlaces) && dbPlaces.length > 0) {
          const items: PlaceItem[] = dbPlaces.map((dp) => {
            const koTrans = dp.place_translations?.find((t) => t.locale === "ko");
            const enTrans = dp.place_translations?.find((t) => t.locale === "en");

            return {
              id: dp.id || dp.content_id,
              contentId: dp.content_id,
              city: dp.city,
              category: dp.category,
              translations: {
                ko: {
                  title: koTrans?.title || dp.content_id,
                  description: koTrans?.description,
                  address: koTrans?.address || dp.address,
                },
                en: {
                  title: enTrans?.title || koTrans?.title || dp.content_id,
                  description: enTrans?.description || koTrans?.description,
                  address: enTrans?.address || koTrans?.address || dp.address,
                },
              },
              latitude: dp.latitude,
              longitude: dp.longitude,
              repImageUrl: dp.rep_image_url,
              rawUpdatedAt: dp.raw_updated_at,
              qualityStatus: dp.quality_status,
              tags: [dp.city, dp.category],
              sourceName: "KTO" as const,
              priceStatus: dp.price_status || "NEEDS_CHECK",
              priceKrw: dp.price_krw || 0,
              officialLink: dp.official_link,
              tel: dp.tel,
              useTime: dp.use_time,
            };
          });

          if (query.trim().length > 0) {
            const q = query.trim().toLowerCase();
            return items.filter((item) => {
              const trans = item.translations[locale] || item.translations.ko;
              return (
                trans.title.toLowerCase().includes(q) ||
                (trans.address && trans.address.toLowerCase().includes(q)) ||
                (trans.description && trans.description.toLowerCase().includes(q))
              );
            });
          }

          return items;
        }
      }
    } catch {
      // Supabase fetch error -> Fallthrough to KTO API
    }

    // 2단계: KTO TourAPI 4.0 실시간 프록시 조회 시도
    if (process.env.KTO_API_KEY) {
      try {
        const liveKtoPlaces = await this.fetchLiveKtoPlaces(options);
        if (liveKtoPlaces.length > 0) {
          return liveKtoPlaces;
        }
      } catch {
        // KTO API 호출 실패 시 3단계 Fallback 진행
      }
    }

    // 3단계: MOCK_PLACES 안전 Fallback
    return listPlaces(options);
  }

  /**
   * KTO TourAPI 4.0 실시간 조회 및 정규화
   */
  private async fetchLiveKtoPlaces(options: PlaceFilterOptions): Promise<PlaceItem[]> {
    const { city = "ALL", category = "ALL", query = "", locale = "ko" } = options;
    const ktoLocale = locale === "en" ? "en" : "ko";

    const params: Record<string, string | number> = {
      numOfRows: 30,
      pageNo: 1,
    };

    if (city !== "ALL" && CITY_TO_KTO_AREA_CODE[city]) {
      params.areaCode = CITY_TO_KTO_AREA_CODE[city];
    }

    if (category !== "ALL") {
      let contentTypeId: string | undefined = undefined;
      if (category === "ACCOMMODATION") contentTypeId = KTO_CONTENT_TYPE.KOR.ACCOMMODATION;
      else if (category === "ATTRACTION") contentTypeId = KTO_CONTENT_TYPE.KOR.ATTRACTION;
      else if (category === "CULTURE") contentTypeId = KTO_CONTENT_TYPE.KOR.CULTURE;
      else if (category === "RESTAURANT" || category === "CAFE") contentTypeId = KTO_CONTENT_TYPE.KOR.RESTAURANT;

      if (contentTypeId) {
        params.contentTypeId = contentTypeId;
      }
    }

    let endpoint: string = KTO_ENDPOINTS.AREA_BASED_LIST;
    if (query.trim().length > 0) {
      endpoint = KTO_ENDPOINTS.SEARCH_KEYWORD;
      params.keyword = query.trim();
    }

    const apiRes = await fetchKtoApi<KtoAreaBasedListItem>({
      locale: ktoLocale,
      endpoint,
      params,
    });

    const parsed = extractKtoItemsAndCount<KtoAreaBasedListItem>(apiRes.response?.body);
    if (!parsed.rawItems || parsed.rawItems.length === 0) {
      return [];
    }

    const items: PlaceItem[] = [];
    for (const raw of parsed.rawItems) {
      const normalized = normalizeKtoPlace(raw, {
        locale: ktoLocale,
        overrideCity: city !== "ALL" ? city : undefined,
      });

      if (!normalized) continue;

      const transKo = normalized.translations.find((t) => t.locale === "ko") || normalized.translations[0];
      const transEn = normalized.translations.find((t) => t.locale === "en") || transKo;

      items.push({
        id: normalized.contentId,
        contentId: normalized.contentId,
        city: normalized.city,
        category: normalized.category,
        translations: {
          ko: {
            title: transKo?.title || normalized.contentId,
            description: transKo?.description,
            address: transKo?.address || normalized.address,
          },
          en: {
            title: transEn?.title || transKo?.title || normalized.contentId,
            description: transEn?.description || transKo?.description,
            address: transEn?.address || transKo?.address || normalized.address,
          },
        },
        latitude: normalized.latitude,
        longitude: normalized.longitude,
        repImageUrl: normalized.repImageUrl,
        rawUpdatedAt: normalized.rawUpdatedAt,
        qualityStatus: normalized.qualityStatus,
        tags: [normalized.city, normalized.category],
        sourceName: "KTO",
        priceStatus: "NEEDS_CHECK",
        priceKrw: 0,
      });
    }

    return items;
  }

  async getPlaceById(id: string): Promise<PlaceItem | null> {
    return getPlaceById(id);
  }
}

/**
 * 동기 방식 하위 호환 장소 목록 검색 함수
 */
export function listPlaces(options: PlaceFilterOptions = {}): PlaceItem[] {
  const { city = "ALL", category = "ALL", query = "", locale = "ko" } = options;
  const normalizedQuery = query.trim().toLowerCase();

  return MOCK_PLACES.filter((place) => {
    if (city !== "ALL" && place.city !== city) return false;
    if (category !== "ALL" && place.category !== category) return false;

    if (normalizedQuery.length > 0) {
      const trans = place.translations[locale] || place.translations.ko;
      const titleMatch = trans.title?.toLowerCase().includes(normalizedQuery);
      const descMatch = trans.description?.toLowerCase().includes(normalizedQuery);
      const addrMatch = trans.address?.toLowerCase().includes(normalizedQuery);
      const tagMatch = place.tags.some((t) => t.toLowerCase().includes(normalizedQuery));

      if (!titleMatch && !descMatch && !addrMatch && !tagMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 동기 방식 하위 호환 장소 단건 조회 함수
 */
export function getPlaceById(id: string): PlaceItem | null {
  return MOCK_PLACES.find((p) => p.id === id || p.contentId === id) || null;
}

const defaultPlacesService = new PlacesService();

export function getPlacesService(): IPlacesService {
  return defaultPlacesService;
}
