import { MOCK_PLACES } from "./mock-places";
import { PlaceFilterOptions, PlaceItem } from "./types";
import { supabaseFetch } from "../supabase/client";
import { DbPlace, DbPlaceTranslation } from "../supabase/types";

export interface IPlacesService {
  getPlaces(options?: PlaceFilterOptions): Promise<PlaceItem[]>;
  getPlaceById(id: string): Promise<PlaceItem | null>;
}

export class PlacesService implements IPlacesService {
  async getPlaces(options: PlaceFilterOptions = {}): Promise<PlaceItem[]> {
    const { city = "ALL", category = "ALL", query = "", locale = "ko" } = options;

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
      // Supabase fetch error -> Fallback
    }

    return listPlaces(options);
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
