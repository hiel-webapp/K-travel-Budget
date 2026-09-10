import { PlaceItem } from "./types";
import { ATTRACTION_SPOTS_CATALOG } from "../../features/budget/catalog/attraction-spots";
import { PlaceCategory } from "../kto/types";
import { SHOW_LOCAL_SPOTS } from "../config/spots-visibility";

// 플래너 10대 도시 관광지 카탈로그 (각 도시별 완벽 분리 및 공식 웹사이트 연동)
// SHOW_LOCAL_SPOTS 플래그를 통해 로컬 명소 노출/숨김을 손쉽게 제어
export const ALL_CITY_CATALOG_PLACES: PlaceItem[] = ATTRACTION_SPOTS_CATALOG
  .filter((spot) => SHOW_LOCAL_SPOTS || !spot.isLocal)
  .map((spot) => {
    let category: PlaceCategory = "LANDMARK";
    if (spot.categoryType === "명소") category = "LANDMARK";
    else if (spot.categoryType === "자연") category = "NATURE";
    else if (spot.categoryType === "엔터") category = "ENTERTAINMENT";
    else if (spot.categoryType === "쇼핑") category = "SHOPPING";

    const repImg = spot.imageUrl || "/assets/gyeongbokgung-main.jpg";

    return {
      id: `catalog_${spot.id}`,
      contentId: spot.id,
      city: spot.cityCode,
      category,
      categoryType: spot.categoryType,
      sourceName: "KTO" as const,
      qualityStatus: "READY" as const,
      rawUpdatedAt: "2026-09-10",
      repImageUrl: repImg,
      tags: [spot.tag, spot.cityCode, spot.categoryType || "명소"],
      subwayInfo: spot.subwayInfo,
      openingHours: spot.openingHours,
      closedDays: spot.closedDays,
      priceStatus: spot.priceStatus === "PAID" ? ("OFFICIAL_PRICE" as const) : ("FREE" as const),
      priceKrw: spot.price,
      officialLink: spot.officialUrl,
      isLocal: spot.isLocal || false,
      translations: {
        ko: {
          title: spot.nameKo,
          description: spot.descKo,
          address: spot.subwayInfo || `${spot.cityCode}, 대한민국`,
        },
        en: {
          title: spot.nameEn,
          description: spot.descEn,
          address: spot.subwayInfo || `${spot.cityCode}, Republic of Korea`,
        },
      },
    };
  });

// 하위 호환성을 위해 서울 전용 목록 유지
export const SEOUL_30_REPRESENTATIVE_PLACES: PlaceItem[] = ALL_CITY_CATALOG_PLACES.filter(
  (p) => p.city === "SEOUL"
);

export const MOCK_PLACES: PlaceItem[] = [
  // ==========================================
  // ALL 10 Cities Representative Attractions (플래너 공식 카탈로그 동기화)
  // ==========================================
  ...ALL_CITY_CATALOG_PLACES,
];
