import { NextRequest, NextResponse } from "next/server";
import { supabaseFetch } from "../../../../lib/supabase/client";
import { SupportedCity } from "../../../../lib/trip-domain";
import { AttractionSpot, parseAttractionMetadata } from "../../../../features/budget/catalog/attraction-spots";

const CITY_TO_AREA_CODE: Record<string, number> = {
  SEOUL: 1,
  INCHEON: 2,
  SUWON: 31,
  GANGNEUNG: 32,
  SOKCHO: 32,
  JEONJU: 35,
  YEOSU: 36,
  GYEONGJU: 37,
  BUSAN: 6,
  JEJU: 39,
};

interface DbCatalogItem {
  id: number;
  content_id: string;
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

/**
 * "Seoul Cruise (서울크루즈)" 형태에서 한글명과 영문명을 분리 추출합니다.
 */
function parseBilingualTitle(title: string): { nameKo: string; nameEn: string } {
  const match = title.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return {
      nameEn: match[1].trim(),
      nameKo: match[2].trim(),
    };
  }
  return {
    nameKo: title,
    nameEn: title,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = (searchParams.get("city") || "SEOUL").toUpperCase();
    const areaCode = CITY_TO_AREA_CODE[city];
    if (!areaCode) {
      return NextResponse.json({
        success: true,
        source: "EMPTY",
        data: [],
      });
    }

    // 1. Supabase Hype_Catalog_Items 테이블에서 관광지 데이터 조회
    let dbRows: DbCatalogItem[] = [];
    try {
      dbRows = await supabaseFetch<DbCatalogItem[]>("Hype_Catalog_Items", {
        method: "GET",
        query: {
          select: "*",
          budget_partition: "eq.CITY_SPECIFIC",
          area_code: `eq.${areaCode}`,
          main_category: "eq.Sightseeing",
          order: "id.asc",
          limit: "50",
        },
      });
    } catch {
      try {
        dbRows = await supabaseFetch<DbCatalogItem[]>("hype_catalog_items", {
          method: "GET",
          query: {
            select: "*",
            budget_partition: "eq.CITY_SPECIFIC",
            area_code: `eq.${areaCode}`,
            main_category: "eq.Sightseeing",
            order: "item_id.asc",
            limit: "50",
          },
        });
      } catch (dbErr: any) {
        console.warn("[API/Catalog] Supabase DB 조회 실패:", dbErr.message);
      }
    }

    if (!dbRows || !Array.isArray(dbRows) || dbRows.length === 0) {
      return NextResponse.json({
        success: true,
        source: "EMPTY",
        data: [],
      });
    }

    // 2. AttractionSpot 규격으로 변환
    const spots: AttractionSpot[] = dbRows.map((row, idx) => {
      const { nameKo, nameEn } = parseBilingualTitle(row.title_en);
      const isPaid = (row.price_krw || 0) > 0;
      const meta = parseAttractionMetadata(row.desc_en || "");

      // 시각적 테마 그라디언트 순환
      const gradients = [
        "from-rose-500/15 to-pink-500/15",
        "from-blue-500/15 to-indigo-500/15",
        "from-emerald-500/15 to-teal-500/15",
        "from-amber-500/15 to-orange-500/15",
        "from-purple-500/15 to-fuchsia-500/15",
      ];
      const emojis = ["🎡", "🏞️", "🏙️", "🏛️", "☕", "📸", "🌉", "🎨"];

      return {
        id: `kto_${row.content_id || row.id}`,
        cityCode: city as SupportedCity,
        nameKo,
        nameEn,
        descKo: meta.cleanDesc || "한국관광공사 선정 추천 명소",
        descEn: meta.cleanDesc || `Popular sightseeing spot in ${city}`,
        price: row.price_krw || 0,
        priceStatus: isPaid ? "PAID" : "FREE",
        tag: row.sub_category || "Attraction",
        emoji: emojis[idx % emojis.length],
        gradientBg: gradients[idx % gradients.length],
        isFeatured: true,
        imageUrl: row.image_url,
        deepLink: row.deep_link_template,
        subwayInfo: meta.subwayInfo,
        openingHours: meta.openingHours,
        closedDays: meta.closedDays,
        officialUrl: meta.officialUrl,
      };
    });

    return NextResponse.json(
      {
        success: true,
        source: "SUPABASE_DB",
        count: spots.length,
        data: spots,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[API/Catalog] 에러:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
