import { NextRequest, NextResponse } from "next/server";
import { getPlacesService } from "../../../lib/places/service";
import { SupportedCity, ALL_SUPPORTED_CITIES } from "../../../lib/trip-domain";
import { PlaceCategory } from "../../../lib/kto/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const cityParam = searchParams.get("city")?.toUpperCase();
    const categoryParam = searchParams.get("category")?.toUpperCase();
    const queryParam = searchParams.get("query")?.trim();
    const localeParam = searchParams.get("locale")?.toLowerCase();
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "20", 10);

    // 1. 파라미터 정규화 및 검증
    let city: SupportedCity | "ALL" = "ALL";
    if (cityParam && (cityParam === "ALL" || ALL_SUPPORTED_CITIES.includes(cityParam as SupportedCity))) {
      city = cityParam as SupportedCity | "ALL";
    }

    let category: PlaceCategory | "ALL" = "ALL";
    const allowedCategories: PlaceCategory[] = [
      "ACCOMMODATION",
      "RESTAURANT",
      "CAFE",
      "ATTRACTION",
      "CULTURE",
    ];
    if (categoryParam && (categoryParam === "ALL" || allowedCategories.includes(categoryParam as PlaceCategory))) {
      category = categoryParam as PlaceCategory | "ALL";
    }

    const locale: "ko" | "en" = localeParam === "en" ? "en" : "ko";
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(100, limitParam);

    // 2. Places Service를 통한 데이터 조회
    const service = getPlacesService();
    const result = await service.getPlaces({
      city,
      category,
      query: queryParam,
      locale,
    });

    // 3. 페이지네이션 처리
    const totalCount = result.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = result.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        city,
        category,
        query: queryParam || null,
        locale,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
