import { TripDraft, SupportedCity } from "../trip-domain";
import { PlannerPreferences } from "../../features/budget/domain/types";
import { getPlaceById } from "../places";
import { TrendItem, TrendCategory, PersonalizedTrendRecommendation } from "./types";
import { MOCK_TRENDS } from "./mock-trends";

export interface ListTrendsFilter {
  city?: SupportedCity | "ALL";
  category?: TrendCategory | "ALL";
}

/**
 * 공개 K-Trend 항목들을 필터 조건에 따라 조회합니다.
 */
export function listTrends(filter: ListTrendsFilter = {}): TrendItem[] {
  const { city = "ALL", category = "ALL" } = filter;

  return MOCK_TRENDS.filter((item) => {
    if (city !== "ALL" && item.city !== "ALL" && item.city !== city) {
      return false;
    }
    if (category !== "ALL" && item.category !== category) {
      return false;
    }
    return true;
  });
}

export interface PersonalizedTrendInput {
  draft: TripDraft;
  preferences?: PlannerPreferences | null;
  savedPlaceIds?: string[];
  locale?: "ko" | "en";
}

/**
 * Paid One-Stop Report를 위해 사용자의 방문 도시, 체류 일수, 저장 장소 카테고리를 기반으로
 * 개인화된 K-Trend 제안 목록(최대 3개)을 파생합니다.
 */
export function getPersonalizedTrendRecommendations(
  input: PersonalizedTrendInput
): PersonalizedTrendRecommendation[] {
  const { draft, savedPlaceIds = [], locale = "ko" } = input;
  const lang = locale === "en" ? "en" : "ko";

  if (!draft || !draft.selectedCities || draft.selectedCities.length === 0) {
    return [];
  }

  // 저장 장소 후보의 카테고리/도시 분석
  const savedPlaces = savedPlaceIds
    .map((id) => getPlaceById(id))
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  const hasFoodSaved = savedPlaces.some((p) => p.category === "RESTAURANT" || p.category === "CAFE");
  const hasCultureSaved = savedPlaces.some((p) => p.category === "CULTURE" || p.category === "ATTRACTION");

  const results: PersonalizedTrendRecommendation[] = [];

  for (const trend of MOCK_TRENDS) {
    // 1. 도시 적합성 검사
    if (trend.city !== "ALL" && !draft.selectedCities.includes(trend.city)) {
      continue;
    }

    let reason = trend.translations[lang].reasonExplanation || "";

    if (trend.category === "CULTURE" && hasCultureSaved) {
      reason = lang === "en" ? "Matched with your saved Culture & Attraction places" : "저장한 문화/관광 장소 후보와 관련됨";
    } else if (trend.category === "FOOD" && hasFoodSaved) {
      reason = lang === "en" ? "Matched with your saved Food & Cafe places" : "저장한 맛집/카페 후보 장소와 관련됨";
    } else if (trend.city !== "ALL") {
      const cityName = trend.city === "SEOUL" ? (lang === "en" ? "Seoul" : "서울") : (lang === "en" ? "Busan" : "부산");
      reason = lang === "en" ? `Personalized for your ${cityName} stay itinerary` : `${cityName} 체류 일정 및 방문 도시와 연관됨`;
    }

    results.push({
      trend,
      reason,
    });

    if (results.length >= 3) break;
  }

  return results;
}
