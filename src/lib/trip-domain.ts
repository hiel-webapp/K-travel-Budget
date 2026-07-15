export type SupportedCity = "SEOUL" | "BUSAN";
export type BudgetTier = "BUDGET" | "STANDARD" | "PREMIUM";

export type CityNightAllocation = Partial<Record<SupportedCity, number>>;

export interface TripDraft {
  totalNights: number;
  adultCount: number;
  selectedCities: SupportedCity[];
  cityNightAllocations: CityNightAllocation;
  budgetTier: BudgetTier;
  targetBudgetKrw: number;
  schemaVersion: number;
}

export interface TripDraftStorageEnvelope {
  schemaVersion: number;
  savedAt: string;
  tripDraft: TripDraft;
}

export const DEFAULT_TRIP_DRAFT: TripDraft = {
  totalNights: 5,
  adultCount: 2,
  selectedCities: ["SEOUL", "BUSAN"],
  cityNightAllocations: {
    SEOUL: 3,
    BUSAN: 2,
  },
  budgetTier: "STANDARD",
  targetBudgetKrw: 3000000,
  schemaVersion: 1,
};

/**
 * 예산 등급에 따른 문장 조립용 Phrase 매핑 정보
 */
export const BUDGET_TIER_PHRASES: Record<BudgetTier, string> = {
  BUDGET: "on a Budget plan.",
  STANDARD: "with a Standard budget.",
  PREMIUM: "with a Premium budget.",
};

/**
 * 예산 등급 선택기 옵션에 나타날 영어 레이블 매핑 정보
 */
export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  BUDGET: "Budget",
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

/**
 * 도시 리스트에 따른 영어 완성 레이블 매핑
 */
export function getCitiesSentenceLabel(cities: SupportedCity[]): string {
  const hasSeoul = cities.includes("SEOUL");
  const hasBusan = cities.includes("BUSAN");
  if (hasSeoul && hasBusan) {
    return "Seoul and Busan";
  }
  if (hasSeoul) {
    return "Seoul";
  }
  if (hasBusan) {
    return "Busan";
  }
  return "";
}

/**
 * TripDraft 도메인 모델로부터 자연스럽고 문법에 맞는 완성된 영어 여행 문장을 생성합니다.
 */
export function formatTripSentence(draft: TripDraft): string {
  const nightsPhrase = `${draft.totalNights}-night`;
  const travelersPhrase = draft.adultCount === 1 ? "1 adult" : `${draft.adultCount} adults`;
  const citiesPhrase = getCitiesSentenceLabel(draft.selectedCities);
  const budgetPhrase = BUDGET_TIER_PHRASES[draft.budgetTier];

  return `I'm planning a ${nightsPhrase} trip for ${travelersPhrase} to ${citiesPhrase} ${budgetPhrase}`;
}

/**
 * 도시 선택과 총 숙박일에 따라 기본 숙박 배분을 연산합니다.
 */
export function calculateDefaultNightAllocation(
  cities: SupportedCity[],
  totalNights: number
): CityNightAllocation {
  const allocation: CityNightAllocation = {};

  if (cities.length === 0) {
    return allocation;
  }

  if (cities.length === 1) {
    allocation[cities[0]] = totalNights;
    return allocation;
  }

  // 서울과 부산이 둘 다 선택된 경우 (현재 2개 도시로 제한됨)
  // 서울을 첫 도시로 보고 올림(ceil), 부산을 내림(floor)으로 자동 배분
  if (cities.includes("SEOUL") && cities.includes("BUSAN")) {
    const seoulNights = Math.ceil(totalNights / 2);
    const busanNights = Math.floor(totalNights / 2);
    allocation.SEOUL = seoulNights;
    allocation.BUSAN = busanNights;
  }

  return allocation;
}

/**
 * TripDraft 도메인 모델의 비즈니스 무결성을 검증합니다.
 */
export function validateTripDraft(draft: unknown): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!draft || typeof draft !== "object") {
    return { success: false, errors: ["invalid_draft"] };
  }

  const d = draft as Record<string, unknown>;

  // 1. totalNights 검증
  const allowedNights = [3, 5, 7];
  const totalNights = d.totalNights as number;
  if (!allowedNights.includes(totalNights)) {
    errors.push("invalid_nights");
  }

  // 2. adultCount 검증
  const adultCount = d.adultCount as number;
  if (
    typeof adultCount !== "number" ||
    adultCount < 1 ||
    adultCount > 4
  ) {
    errors.push("invalid_adults");
  }

  // 3. selectedCities 검증
  const selectedCities = d.selectedCities as SupportedCity[];
  if (
    !Array.isArray(selectedCities) ||
    selectedCities.length === 0 ||
    selectedCities.length > 2
  ) {
    errors.push("invalid_cities_count");
  } else {
    const validCities: SupportedCity[] = ["SEOUL", "BUSAN"];
    const uniqueCities = new Set(selectedCities);
    
    if (uniqueCities.size !== selectedCities.length) {
      errors.push("duplicate_cities");
    }
    
    for (const city of selectedCities) {
      if (!validCities.includes(city)) {
        errors.push("invalid_city");
      }
    }
  }

  // 4. cityNightAllocations 검증
  const cityNightAllocations = d.cityNightAllocations as CityNightAllocation;
  if (!cityNightAllocations || typeof cityNightAllocations !== "object") {
    errors.push("invalid_allocations");
  } else {
    let allocatedSum = 0;
    const selectedCitiesList = selectedCities || [];

    // 선택하지 않은 도시의 할당이 존재하는지 확인
    for (const city in cityNightAllocations) {
      if (!selectedCitiesList.includes(city as SupportedCity)) {
        errors.push("unselected_city_allocated");
      }
      const nights = cityNightAllocations[city as SupportedCity];
      if (typeof nights !== "number" || nights < 0 || !Number.isInteger(nights)) {
        errors.push("invalid_allocation_nights");
      } else {
        allocatedSum += nights;
      }
    }

    // 할당 합계와 totalNights 일치 여부 확인
    if (errors.length === 0 && allocatedSum !== totalNights) {
      errors.push("allocation_sum_mismatch");
    }
  }

  // 5. budgetTier 검증
  const allowedTiers: BudgetTier[] = ["BUDGET", "STANDARD", "PREMIUM"];
  const budgetTier = d.budgetTier as BudgetTier;
  if (!allowedTiers.includes(budgetTier)) {
    errors.push("invalid_budget_tier");
  }

  // 6. targetBudgetKrw 검증
  const targetBudgetKrw = d.targetBudgetKrw as number;
  if (
    typeof targetBudgetKrw !== "number" ||
    targetBudgetKrw <= 0 ||
    !Number.isInteger(targetBudgetKrw)
  ) {
    errors.push("invalid_target_budget");
  }

  // 7. schemaVersion 검증
  const schemaVersion = d.schemaVersion as number;
  if (schemaVersion !== 1) {
    errors.push("invalid_schema_version");
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * 기존 k_travel_state 로컬스토리지 데이터를 안전하게 TripDraft 타입으로 이관합니다.
 * 이관 실패 또는 유효하지 않은 데이터인 경우 null을 반환합니다.
 */
export function migrateLegacyState(legacy: unknown): TripDraft | null {
  if (!legacy || typeof legacy !== "object") {
    return null;
  }

  const l = legacy as Record<string, unknown>;

  try {
    // 1. 도시 목록 파싱 및 변환
    let selectedCities: SupportedCity[] = [];
    const rawCities = l.cities as unknown;
    if (rawCities === "seoul_busan" || (Array.isArray(rawCities) && rawCities.includes("Seoul") && rawCities.includes("Busan"))) {
      selectedCities = ["SEOUL", "BUSAN"];
    } else if (rawCities === "seoul" || (Array.isArray(rawCities) && rawCities.includes("Seoul"))) {
      selectedCities = ["SEOUL"];
    } else if (rawCities === "busan" || (Array.isArray(rawCities) && rawCities.includes("Busan"))) {
      selectedCities = ["BUSAN"];
    } else {
      // 기존 도시가 없거나 다른 포맷이면 기본값
      selectedCities = ["SEOUL", "BUSAN"];
    }

    // 2. nights 파싱
    let totalNights = parseInt(l.nights as string, 10);
    if (isNaN(totalNights) || ![3, 5, 7].includes(totalNights)) {
      totalNights = 5;
    }

    // 3. adultCount (people) 파싱
    let adultCount = parseInt(l.people as string, 10);
    if (isNaN(adultCount) || adultCount < 1 || adultCount > 4) {
      adultCount = 2;
    }

    // 4. budgetTier (budgetType) 파싱
    let budgetTier: BudgetTier = "STANDARD";
    const rawBudgetType = String(l.budgetType || "").toUpperCase();
    if (rawBudgetType === "BUDGET") {
      budgetTier = "BUDGET";
    } else if (rawBudgetType === "PREMIUM") {
      budgetTier = "PREMIUM";
    } else {
      budgetTier = "STANDARD";
    }

    // 5. targetBudgetKrw (budgetGoal) 파싱 및 기본값 대조
    let targetBudgetKrw = 3000000;
    const rawBudgetGoal = parseInt(l.budgetGoal as string, 10);
    // 기존 목표 예산이 유효하고, 새로 승인된 정책 금액(3000000)과 일치하면 유지.
    // 기존 1500000 등 신규 정책과 충돌되는 금액은 신규 기준인 3000000으로 리셋.
    if (!isNaN(rawBudgetGoal) && rawBudgetGoal === 3000000) {
      targetBudgetKrw = rawBudgetGoal;
    }

    // 6. 숙박 배분 복구
    let cityNightAllocations: CityNightAllocation = {};
    const seoulNights = parseInt(l.seoulNights as string, 10);
    const busanNights = parseInt(l.busanNights as string, 10);

    // 선택된 도시에 대해서만 기존 배분 값을 가져옴
    if (selectedCities.includes("SEOUL") && !isNaN(seoulNights)) {
      cityNightAllocations.SEOUL = seoulNights;
    }
    if (selectedCities.includes("BUSAN") && !isNaN(busanNights)) {
      cityNightAllocations.BUSAN = busanNights;
    }

    // 할당 합계가 totalNights와 다르면 자동 균등 분배 호출
    const allocatedSum = (cityNightAllocations.SEOUL || 0) + (cityNightAllocations.BUSAN || 0);
    if (allocatedSum !== totalNights) {
      cityNightAllocations = calculateDefaultNightAllocation(selectedCities, totalNights);
    }

    const draft: TripDraft = {
      totalNights,
      adultCount,
      selectedCities,
      cityNightAllocations,
      budgetTier,
      targetBudgetKrw,
      schemaVersion: 1,
    };

    const validation = validateTripDraft(draft);
    return validation.success ? draft : null;
  } catch {
    return null;
  }
}
