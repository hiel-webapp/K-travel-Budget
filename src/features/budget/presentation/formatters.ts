import { Dictionary } from "../../../lib/i18n/dictionaries/ko";
import {
  BudgetCategory,
  BudgetBasketId,
  PricingUnit,
  BudgetLineItem,
  BudgetPlan,
  PriceConfidence,
} from "../domain/types";

/**
 * 금액을 KRW 통화 기호('₩ ')와 천 단위 쉼표가 붙은 형식으로 포맷팅 (소수점 없음, ₩ 뒤 공백 1칸 적용)
 */
export function formatKrw(amount: number): string {
  const formatted = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return formatted.replace(/^₩\s*/, "₩ ");
}

/**
 * 예산 사용률을 소수점 첫째자리 백분율 스트링으로 반환
 */
export function formatPercentage(ratio: number): string {
  return `${ratio}%`;
}

/**
 * 여행 기간을 다국어(ko/en)에 알맞은 형식으로 포맷팅
 */
export function formatTripDuration(nights: number, dict: Dictionary, locale: "ko" | "en"): string {
  const days = nights + 1;
  if (locale === "ko") {
    return `${nights}박 ${days}일`;
  }
  return `${nights} nights · ${days} days`;
}

/**
 * 인원수를 다국어(ko/en)에 알맞은 형식으로 포맷팅
 */
export function formatTravelerCount(count: number, dict: Dictionary, locale: "ko" | "en"): string {
  if (locale === "ko") {
    return `성인 ${count}명`;
  }
  return `${count} ${count === 1 ? "person" : "people"}`;
}

/**
 * 도시별 숙박 배분 요약을 다국어(ko/en)에 알맞은 형식으로 포맷팅
 */
export function formatCityAllocationSummary(
  allocations: Record<string, number>,
  dict: Dictionary,
  locale: "ko" | "en"
): string {
  const cityKoMap: Record<string, string> = {
    SEOUL: "서울", BUSAN: "부산", JEJU: "제주", INCHEON: "인천",
    GYEONGJU: "경주", JEONJU: "전주", GANGNEUNG: "강릉", SUWON: "수원",
    YEOSU: "여수", SOKCHO: "속초",
  };
  const cityEnMap: Record<string, string> = {
    SEOUL: "Seoul", BUSAN: "Busan", JEJU: "Jeju", INCHEON: "Incheon",
    GYEONGJU: "Gyeongju", JEONJU: "Jeonju", GANGNEUNG: "Gangneung", SUWON: "Suwon",
    YEOSU: "Yeosu", SOKCHO: "Sokcho",
  };

  const activeCities = Object.entries(allocations)
    .filter(([_, nights]) => nights > 0)
    .map(([city]) => (locale === "ko" ? (cityKoMap[city] || city) : (cityEnMap[city] || city)));

  const totalNights = Object.values(allocations).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);
  const totalDays = totalNights + 1;

  if (activeCities.length === 0) return "";

  if (locale === "ko") {
    const citiesStr = activeCities.join(" · ");
    return `${citiesStr} / 총 ${totalNights}박 ${totalDays}일`;
  } else {
    const citiesStr = activeCities.join(", ");
    return `${citiesStr} / ${totalNights} Nights (${totalDays} Days)`;
  }
}

/**
 * PricingUnit의 다국어 레이블 반환
 */
export function getPricingUnitLabel(unit: PricingUnit, dict: Dictionary): string {
  switch (unit) {
    case "ROOM_NIGHT":
      return dict.planner.unitRoomNight;
    case "PERSON_DAY":
      return dict.planner.unitPersonDay;
    case "PERSON_MEAL":
      return dict.planner.unitPersonMeal;
    case "PERSON_ONE_WAY":
      return dict.planner.unitPersonOneWay;
    case "PER_PERSON":
      return dict.planner.unitPerPerson;
    case "FIXED_AMOUNT":
      return dict.planner.unitFixedAmount;
    case "PERCENTAGE":
      return dict.planner.unitPercentage;
    default:
      return String(unit);
  }
}

/**
 * BudgetCategory의 다국어 레이블 반환
 */
export function getCategoryLabel(category: BudgetCategory, dict: Dictionary): string {
  switch (category) {
    case "ACCOMMODATION":
      return dict.planner.categoryStay;
    case "FOOD":
      return dict.planner.categoryFood;
    case "CITY_TRANSPORT":
    case "INTERCITY_TRANSPORT":
      return dict.planner.categoryTransport;
    case "ATTRACTION":
      return dict.planner.categoryAttraction;
    case "EMERGENCY_FUND":
      return dict.planner.categoryEmergency;
    default:
      return String(category);
  }
}

/**
 * BudgetBasketId의 다국어 레이블 반환
 */
export function getBasketLabel(basketId: BudgetBasketId, dict: Dictionary, locale: "ko" | "en"): string {
  const mapping: Record<BudgetBasketId, { ko: string; en: string }> = {
    BUDGET_STAY: { ko: "실속형 숙소", en: "Budget Stay" },
    STANDARD_HOTEL: { ko: "스탠다드 호텔", en: "Standard Hotel" },
    PREMIUM_HERITAGE: { ko: "프리미엄 & 헤리티지", en: "Premium & Heritage" },
    BUDGET_MEAL_PLAN: { ko: "실속형 식비 플랜", en: "Budget Meal Plan" },
    STANDARD_MEAL_PLAN: { ko: "스탠다드 식비 플랜", en: "Standard Meal Plan" },
    PREMIUM_MEAL_PLAN: { ko: "프리미엄 식비 플랜", en: "Premium Meal Plan" },
    BASIC_CITY_TRANSPORT: { ko: "알뜰형 도시 대중교통", en: "Basic City Transport" },
    STANDARD_CITY_TRANSPORT: { ko: "일반형 도시 교통", en: "Standard City Transport" },
    COMFORT_CITY_TRANSPORT: { ko: "편안한 도시 교통", en: "Comfort City Transport" },
    MOSTLY_FREE: { ko: "실속형 체험 활동", en: "Mostly Free Attractions" },
    BALANCED: { ko: "균형 잡힌 체험 활동", en: "Balanced Attractions" },
    EXPERIENCE_RICH: { ko: "풍성한 체험 활동", en: "Experience-rich Attractions" },
    KTX_STANDARD: { ko: "KTX 일반실", en: "KTX Standard Class" },
    EMERGENCY_FIXED: { ko: "기본 비상금", en: "Basic Emergency Fund" },
  };

  const item = mapping[basketId];
  if (!item) return String(basketId);
  return locale === "ko" ? item.ko : item.en;
}

/**
 * 영수증 라인 아이템의 상세 단가 계산 수식을 생성
 */
export function getCalculationExpression(
  item: BudgetLineItem,
  dict: Dictionary,
  locale: "ko" | "en"
): string {
  const formattedPrice = formatKrw(item.unitPriceKrw);

  switch (item.pricingUnit) {
    case "ROOM_NIGHT": {
      const roomLabel = locale === "ko" ? "객실" : item.quantity === 1 ? "room" : "rooms";
      const nightLabel = locale === "ko" ? "박" : item.durationCount === 1 ? "night" : "nights";
      return `${formattedPrice} × ${item.quantity}${roomLabel} × ${item.durationCount}${nightLabel}`;
    }
    case "PERSON_DAY": {
      const personLabel = locale === "ko" ? "명" : item.quantity === 1 ? "person" : "people";
      const dayLabel = locale === "ko" ? "일" : item.durationCount === 1 ? "day" : "days";
      return `${formattedPrice} × ${item.quantity}${personLabel} × ${item.durationCount}${dayLabel}`;
    }
    case "PERSON_ONE_WAY": {
      const personLabel = locale === "ko" ? "명" : item.participantCount === 1 ? "person" : "people";
      const tripLabel = locale === "ko" ? "회 이동" : item.quantity === 1 ? "segment" : "segments";
      return `${formattedPrice} × ${item.participantCount}${personLabel} × ${item.quantity}${tripLabel}`;
    }
    case "PER_PERSON": {
      const personLabel = locale === "ko" ? "명" : item.participantCount === 1 ? "person" : "people";
      return `${formattedPrice} × ${item.participantCount}${personLabel}`;
    }
    case "FIXED_AMOUNT": {
      return formattedPrice;
    }
    default: {
      return `${formattedPrice} × ${item.quantity}`;
    }
  }
}

/**
 * 도시 교통비와 도시 간 교통비를 합산한 총 교통 소계(UI용)를 반환
 */
export function getCombinedTransportSubtotal(plan: BudgetPlan): number {
  const cityTransport = plan.categoryTotals.CITY_TRANSPORT || 0;
  const intercityTransport = plan.categoryTotals.INTERCITY_TRANSPORT || 0;
  return cityTransport + intercityTransport;
}

/**
 * PriceConfidence의 다국어 텍스트 매핑
 */
export function getConfidenceLabel(confidence: PriceConfidence, dict: Dictionary): string {
  if (confidence === "MOCK") {
    return dict.planner.badgeMock;
  }
  return String(confidence);
}

/**
 * 예산 요약 텍스트 생성
 */
export function generateBudgetSummaryText(
  plan: BudgetPlan,
  title: string,
  dict: Dictionary,
  locale: "ko" | "en"
): string {
  const { trip, grandTotalKrw, perTravelerTotalKrw, dailyAverageKrw, targetBudgetKrw, targetBudgetUsagePercent } = plan;
  const isOverBudget = grandTotalKrw > targetBudgetKrw;
  const diffAmount = Math.abs(grandTotalKrw - targetBudgetKrw);

  const getCityDisplayName = (c: string) => {
    const mapKo: Record<string, string> = {
      SEOUL: "서울", BUSAN: "부산", JEJU: "제주", INCHEON: "인천",
      GYEONGJU: "경주", JEONJU: "전주", GANGNEUNG: "강릉", SUWON: "수원",
      YEOSU: "여수", SOKCHO: "속초",
    };
    const mapEn: Record<string, string> = {
      SEOUL: "Seoul", BUSAN: "Busan", JEJU: "Jeju", INCHEON: "Incheon",
      GYEONGJU: "Gyeongju", JEONJU: "Jeonju", GANGNEUNG: "Gangneung", SUWON: "Suwon",
      YEOSU: "Yeosu", SOKCHO: "Sokcho",
    };
    return locale === "ko" ? (mapKo[c] || c) : (mapEn[c] || c);
  };

  const cityNamesSummary = trip.selectedCities.map(getCityDisplayName).join(" & ");

  // 여행 제목 및 기본 요약
  const tripTitle = title || (locale === "ko"
    ? `${cityNamesSummary} 여행 계획`
    : `Trip to ${cityNamesSummary}`);

  const durationStr = locale === "ko"
    ? `${trip.totalNights}박 ${trip.totalNights + 1}일`
    : `${trip.totalNights} nights, ${trip.totalNights + 1} days`;

  const travelerStr = locale === "ko"
    ? `${trip.adultCount}명`
    : `${trip.adultCount} ${trip.adultCount === 1 ? "traveler" : "travelers"}`;

  const citiesStr = trip.selectedCities.map(getCityDisplayName).join(", ");

  // 예산 차액/상태 구문
  let statusStr = "";
  if (targetBudgetKrw > 0) {
    const usageStr = `${formatPercentage(targetBudgetUsagePercent)}%`;
    if (isOverBudget) {
      statusStr = locale === "ko"
        ? `목표 예산 대비 초과: +${formatKrw(diffAmount)} (사용률: ${usageStr})`
        : `Over budget by: +${formatKrw(diffAmount)} (Usage: ${usageStr})`;
    } else {
      statusStr = locale === "ko"
        ? `목표 예산 대비 남음: -${formatKrw(diffAmount)} (사용률: ${usageStr})`
        : `Under budget by: -${formatKrw(diffAmount)} (Usage: ${usageStr})`;
    }
  } else {
    statusStr = locale === "ko" ? "설정된 목표 예산 없음" : "No target budget set";
  }

  // 도시별 소계
  const citySubtotals = trip.selectedCities
    .map((city) => {
      const section = plan.citySections[city];
      if (!section) return null;
      const name = getCityDisplayName(city);
      return ` - ${name}: ${formatKrw(section.subtotalKrw)}`;
    })
    .filter(Boolean)
    .join("\n");

  const intercitySubtotal = plan.intercitySection.subtotalKrw > 0
    ? `\n - Intercity Transit (KTX): ${formatKrw(plan.intercitySection.subtotalKrw)}`
    : "";

  const citySectionText = locale === "ko"
    ? `[도시별 소계]\n${citySubtotals}${intercitySubtotal}`
    : `[Subtotal by City]\n${citySubtotals}${intercitySubtotal}`;

  // 카테고리별 소계
  const categories: BudgetCategory[] = [
    "ACCOMMODATION",
    "FOOD",
    "CITY_TRANSPORT",
    "ATTRACTION",
    "EMERGENCY_FUND",
  ];
  const categorySubtotals = categories
    .map((cat) => {
      const name = getCategoryLabel(cat, dict);
      const amount = plan.categoryTotals[cat] || 0;
      return ` - ${name}: ${formatKrw(amount)}`;
    })
    .join("\n");

  const categorySectionText = locale === "ko"
    ? `[카테고리별 소계]\n${categorySubtotals}`
    : `[Subtotal by Category]\n${categorySubtotals}`;

  // 최종 텍스트 조립
  if (locale === "ko") {
    return `=== ${tripTitle} ===
기간: ${durationStr}
인원: ${travelerStr}
방문 도시: ${citiesStr}

총 예상 예산: ${formatKrw(grandTotalKrw)}
1인당 비용: ${formatKrw(perTravelerTotalKrw)}
하루 평균 비용: ${formatKrw(dailyAverageKrw)}
예산 상태: ${statusStr}

${citySectionText}

${categorySectionText}
====================`;
  } else {
    return `=== ${tripTitle} ===
Duration: ${durationStr}
Travelers: ${travelerStr}
Cities: ${citiesStr}

Estimated Total: ${formatKrw(grandTotalKrw)}
Per Traveler: ${formatKrw(perTravelerTotalKrw)}
Daily Average: ${formatKrw(dailyAverageKrw)}
Budget Status: ${statusStr}

${citySectionText}

${categorySectionText}
====================`;
  }
}
