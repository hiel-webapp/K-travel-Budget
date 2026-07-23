import { MOCK_PLACES } from "./mock-places";
import { PlaceFilterOptions, PlaceItem } from "./types";

/**
 * 장소 목록을 검색 필터 조건에 따라 조회합니다.
 * 추후 Supabase DB repository로 전환 시 인터페이스를 그대로 유지할 수 있도록 설계되었습니다.
 */
export function listPlaces(options: PlaceFilterOptions = {}): PlaceItem[] {
  const { city = "ALL", category = "ALL", query = "", locale = "ko" } = options;

  const normalizedQuery = query.trim().toLowerCase();

  return MOCK_PLACES.filter((place) => {
    // 1. 도시 필터
    if (city !== "ALL" && place.city !== city) {
      return false;
    }

    // 2. 카테고리 필터
    if (category !== "ALL" && place.category !== category) {
      return false;
    }

    // 3. 검색어 필터 (장소명, 설명, 주소, 태그)
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
 * 특정 장소 단건을 ID 기준으로 조회합니다.
 */
export function getPlaceById(id: string): PlaceItem | null {
  return MOCK_PLACES.find((p) => p.id === id || p.contentId === id) || null;
}
