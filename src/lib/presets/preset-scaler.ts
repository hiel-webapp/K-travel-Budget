import { SupportedCity, TripDraft, CITY_KOREAN_NAMES } from "../trip-domain";
import { TravelPreset, TravelPresetId, getTravelPresetById } from "./travel-presets";
import {
  AccommodationOverridesByCity,
  BudgetBasketId,
  PlannerPreferences,
} from "../../features/budget/domain/types";
import { SavePlannerPreferencesInput } from "../storage-helper";

/**
 * 선택된 여행 테마 프리셋의 고유 규칙(숙소 등급, 식비 성향, 관광지 코스)을
 * 사용자가 변경한 새 도시 목록과 일정(박 수)에 맞춰 지능적으로 확장 및 상속하는 스케일러
 */
export function scalePresetPreferences(
  presetId: TravelPresetId,
  currentDraft: TripDraft
): SavePlannerPreferencesInput {
  const preset = getTravelPresetById(presetId);
  if (!preset) {
    return {
      draft: currentDraft,
      accommodationByCity: {},
      foodOverrides: {},
      foodAddOnOverrides: {},
      foodBasketSelections: [],
      attractionByCity: {},
      attractionSelections: {},
    };
  }

  const { preferences, draft: presetDraft } = preset;
  const targetCities = currentDraft.selectedCities;

  // 1. 프리셋의 기준 숙소 성향 파악 (예: 한옥 부티크 위주인가, 비즈니스 호텔인가, 고급 호텔인가)
  const baseAccMap = preferences.accommodationByCity || {};
  const dominantAccType: BudgetBasketId =
    (Object.values(baseAccMap)[0] as BudgetBasketId) || "BUSINESS_HOTEL";

  // 새 도시별 숙소 자동 매핑: 기존 도시면 프리셋 설정 유지, 새로 추가된 도시면 프리셋 성향 계승
  const scaledAccByCity: AccommodationOverridesByCity = {};
  for (const city of targetCities) {
    if (baseAccMap[city]) {
      scaledAccByCity[city] = baseAccMap[city];
    } else {
      // 도시 특성에 맞는 지능형 계승
      if (dominantAccType === "HANOK_BOUTIQUE") {
        // 한옥 테마인데 한옥이 없는 도시면 비즈니스/감성 숙소로 우아하게 폴백
        if (city === "JEONJU" || city === "GYEONGJU") {
          scaledAccByCity[city] = "HANOK_BOUTIQUE";
        } else {
          scaledAccByCity[city] = "BUSINESS_HOTEL";
        }
      } else {
        scaledAccByCity[city] = dominantAccType;
      }
    }
  }

  // 2. 관광지 코스 지능형 확장
  const baseAttractionSelections = preferences.attractionSelections || {};
  const scaledAttractionSelections: Record<string, { selectedCourseIds: string[]; individualSpotIds: string[] }> = {};

  for (const city of targetCities) {
    if (baseAttractionSelections[city]) {
      scaledAttractionSelections[city] = baseAttractionSelections[city];
    } else {
      // 새로 추가된 도시의 대표 테마 코스 매핑
      const defaultCourseId = getDefaultCourseForThemeAndCity(presetId, city);
      scaledAttractionSelections[city] = {
        selectedCourseIds: defaultCourseId ? [defaultCourseId] : [],
        individualSpotIds: [],
      };
    }
  }

  // 3. 식비 바스켓 복사 (기존 도시 유지)
  const scaledFoodBaskets = (preferences.foodBasketSelections || []).filter((fb) =>
    targetCities.includes(fb.cityCode as SupportedCity)
  );

  return {
    draft: currentDraft,
    accommodationByCity: scaledAccByCity,
    foodOverrides: preferences.foodOverrides || {},
    foodAddOnOverrides: preferences.foodAddOnOverrides || {},
    foodBasketSelections: scaledFoodBaskets,
    attractionByCity: preferences.attractionByCity || {},
    attractionSelections: scaledAttractionSelections,
    shoppingOption: preferences.shoppingOption,
    shoppingAmountKrw: preferences.shoppingAmountKrw,
    emergencyFundKrw: preferences.emergencyFundKrw,
    emergencyFundPct: preferences.emergencyFundPct !== undefined ? preferences.emergencyFundPct : (preferences.emergencyFundKrw ? undefined : 0.10),
    intercityTransportOverrides: preferences.intercityTransportOverrides,
  };
}

/**
 * 새로 추가된 도시에 대해 프리셋 테마에 부합하는 대표 코스 ID 자동 매핑
 */
function getDefaultCourseForThemeAndCity(presetId: TravelPresetId, city: SupportedCity): string | null {
  const courseThemeMap: Record<string, Partial<Record<SupportedCity, string>>> = {
    K_TREND_VIBES: {
      SEOUL: "seoul_course_trend",
      BUSAN: "busan_course_night_trend",
      JEJU: "jeju_course_east_unesco",
      GANGNEUNG: "gangneung_course_highlight",
      JEONJU: "jeonju_course_highlight",
      GYEONGJU: "gyeongju_course_unesco_heritage",
    },
    K_HERITAGE_SOUL: {
      SEOUL: "seoul_course_heritage",
      JEONJU: "jeonju_course_highlight",
      GYEONGJU: "gyeongju_course_unesco_heritage",
      BUSAN: "busan_course_nampo_culture",
      GANGNEUNG: "gangneung_course_highlight",
      JEJU: "jeju_course_east_unesco",
    },
    K_NATURE_CHILL: {
      SEOUL: "seoul_course_river",
      GANGNEUNG: "gangneung_course_highlight",
      JEJU: "jeju_course_east_unesco",
      BUSAN: "busan_course_night_trend",
      JEONJU: "jeonju_course_highlight",
      GYEONGJU: "gyeongju_course_unesco_heritage",
    },
    K_JEJU_ESCAPE: {
      SEOUL: "seoul_course_trend_myeongdong",
      JEJU: "jeju_course_east_unesco",
      BUSAN: "busan_course_night_trend",
      GANGNEUNG: "gangneung_course_highlight",
      JEONJU: "jeonju_course_highlight",
      GYEONGJU: "gyeongju_course_unesco_heritage",
    },
    K_FOODIE_GOURMET: {
      SEOUL: "seoul_course_foodie",
      JEONJU: "jeonju_course_foodie",
      BUSAN: "busan_course_foodie",
      GANGNEUNG: "gangneung_course_highlight",
      JEJU: "jeju_course_east_unesco",
      GYEONGJU: "gyeongju_course_unesco_heritage",
    },
  };

  return courseThemeMap[presetId]?.[city] || null;
}
