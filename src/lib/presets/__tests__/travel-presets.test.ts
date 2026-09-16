import { describe, it, expect } from "vitest";
import {
  TRAVEL_PRESETS,
  getTravelPresetById,
  TravelPresetId,
} from "../travel-presets";
import { validateTripDraft } from "../../trip-domain";

describe("Travel Presets Unit Tests", () => {
  it("3대 여행 스타일 프리셋이 정확히 3개 정의되어 있어야 함", () => {
    expect(TRAVEL_PRESETS.length).toBe(3);
    const ids = TRAVEL_PRESETS.map((p) => p.id);
    expect(ids).toEqual(["K_TREND_VIBES", "K_HERITAGE_SOUL", "K_NATURE_CHILL"]);
  });

  it("모든 프리셋의 TripDraft는 검증 규칙(validateTripDraft)을 통과해야 함", () => {
    for (const preset of TRAVEL_PRESETS) {
      const validation = validateTripDraft(preset.draft);
      expect(validation.success).toBe(true);
      expect(validation.errors).toHaveLength(0);
    }
  });

  it("모든 프리셋의 도시별 체류 박수(cityNightAllocations)의 합계는 totalNights와 일치해야 함", () => {
    for (const preset of TRAVEL_PRESETS) {
      const { totalNights, cityNightAllocations, selectedCities } = preset.draft;
      expect(totalNights).toBeGreaterThan(0);
      expect(selectedCities.length).toBeGreaterThanOrEqual(1);

      const allocatedNightsSum = Object.values(cityNightAllocations).reduce(
        (acc: number, nights) => acc + (nights || 0),
        0
      );
      expect(allocatedNightsSum).toBe(totalNights);
    }
  });

  it("각 프리셋은 필수 한국어 및 영어 메타데이터(제목, 태그라인, 뱃지, 경로 텍스트, 권장 예산)를 포함해야 함", () => {
    for (const preset of TRAVEL_PRESETS) {
      expect(preset.titleKo).toBeTruthy();
      expect(preset.titleEn).toBeTruthy();
      expect(preset.taglineKo).toBeTruthy();
      expect(preset.taglineEn).toBeTruthy();
      expect(preset.badgeKo).toBeTruthy();
      expect(preset.badgeEn).toBeTruthy();
      expect(preset.routeTextKo).toBeTruthy();
      expect(preset.routeTextEn).toBeTruthy();
      expect(preset.estimatedBudgetKrw).toBeGreaterThan(0);
      expect(preset.highlightTagsKo.length).toBeGreaterThan(0);
      expect(preset.highlightTagsEn.length).toBeGreaterThan(0);
    }
  });

  it("각 프리셋은 플래너 초기 바스켓(숙소 등)을 사전에 정의하고 있어야 함", () => {
    for (const preset of TRAVEL_PRESETS) {
      expect(preset.preferences.accommodationByCity).toBeDefined();
      for (const city of preset.draft.selectedCities) {
        expect(preset.preferences.accommodationByCity?.[city]).toBeDefined();
      }
    }
  });

  it("getTravelPresetById는 존재하는 ID에 대해 프리셋을 반환하고, 알 수 없는 ID에 대해 undefined를 반환해야 함", () => {
    const trend = getTravelPresetById("K_TREND_VIBES");
    expect(trend).toBeDefined();
    expect(trend?.titleKo).toBe("도심 핫플 & K-컬처 투어");

    const unknown = getTravelPresetById("UNKNOWN_PRESET" as TravelPresetId);
    expect(unknown).toBeUndefined();
  });
});
