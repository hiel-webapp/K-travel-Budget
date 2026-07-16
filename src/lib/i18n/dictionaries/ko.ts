export const ko = {
  common: {
    title: "HypeHeritage - 한국 여행 예산 플래너",
    logoAlt: "HypeHeritage 로고",
    userAccount: "사용자 계정",
  },
  navigation: {
    planner: "여행 예산 플래너",
    trend: "K-트렌드",
    guide: "K-가이드",
    savedTrips: "저장한 여행",
  },
  footer: {
    copyright: "© 2026 HypeHeritage",
    about: "소개",
    terms: "이용약관",
    privacy: "개인정보처리방침",
    country: "대한민국",
  },
  landing: {
    heading: "HypeHeritage",
    tagline: "현지인처럼 선택하고, 믿을 수 있게 예산을 세워보세요.",
    cta: "내 한국 여행 예산 만들기",
    helper: "결제 없이 첫 번째 여행 예산을 만들어볼 수 있어요.",
    status: "한국 여행 예산 플래너를 준비하고 있습니다.",
    nextPhase: "다음 단계에서 랜딩 페이지를 구현합니다.",
    allocationSeoulBusan: "서울 {seoul}박 · 부산 {busan}박",
    allocationSeoulOnly: "서울 {seoul}박",
    allocationBusanOnly: "부산 {busan}박",
    validation: {
      invalidNights: "숙박 기간은 3박, 5박, 7박 중 하나여야 합니다.",
      invalidAdults: "여행 인원은 1명에서 4명 사이여야 합니다.",
      noCities: "최소 한 개의 도시를 선택해야 합니다.",
      invalidTargetBudget: "목표 예산은 양의 정수여야 합니다.",
      saveFailed: "일시적인 저장소 오류로 예산안을 저장하지 못했습니다.",
    },
  },
  planner: {
    missingState: "생성된 예산 조건이 없습니다. 랜딩 페이지에서 먼저 예산을 만들어보세요.",
    goBack: "랜딩 페이지로 가기",
    title: "여행 예산 플래너",
    status: "성공적으로 여행 정보를 로드했습니다:",
    // Missing state UI
    missingTitle: "여행 정보가 없습니다",
    missingDescription: "먼저 여행 조건을 입력한 후 예산 플래너를 시작해주세요.",
    missingButton: "여행 조건 입력하기",
    // Invalid state UI
    invalidTitle: "여행 정보를 불러올 수 없습니다",
    invalidDescription: "저장된 여행 정보가 올바르지 않습니다. 여행 조건을 다시 확인해주세요.",
    invalidButton: "여행 조건 다시 입력하기",
    // Calculation Error UI
    calculationErrorTitle: "예산을 계산할 수 없습니다",
    calculationErrorDescription: "여행 조건과 예산 데이터를 확인한 후 다시 시도해주세요.",
    calculationErrorButton: "여행 조건 확인하기",

    // Left workspace
    workspaceTitle: "한국 여행 예산 만들기",
    workspaceDescription: "여행 항목을 확인하고 원하는 예산 구성을 단계별로 조정해보세요.",
    editTripDetails: "여행 조건 수정",

    // Receipt
    receiptTitle: "내 한국 여행 영수증",
    statusDraft: "초안",
    budgetStyle: "예산 유형",
    targetBudget: "목표 예산",
    currentEstimate: "현재 예상",
    budgetUsage: "목표 예산 사용률",
    remainingBudget: "남은 예산",
    overBudget: "초과 예산",
    tripWideExpenses: "전체 여행 공통 비용",
    intercityTransportation: "도시 간 교통",
    estimatedTotal: "예상 총액",
    perTraveler: "1인당",
    dailyAverage: "하루 평균",
    mockDisclaimer: "현재 금액은 MVP Mock Price Catalog를 사용한 예상값이며 실제 가격이 아닙니다.",
    saveTrip: "여행 저장",
    shareReceipt: "영수증 공유",
    generateReport: "예산 리포트 만들기",
    notYetAvailable: "아직 제공되지 않는 기능입니다.",

    // Active Category Content
    accommodationTitle: "숙박 예산",
    accommodationDescription: "현재 여행 조건과 예산 유형에 따라 자동으로 선택된 숙박 예산입니다.",
    accommodationNotice: "이곳에서 도시별 숙박 옵션을 커스텀 변경하여 총액 예산을 조정해보세요.",

    // Stay override cards UI
    selectStayTitle: "도시별 숙소 유형 선택",
    selectStayDescription: "원하는 도시의 숙소 등급을 선택하시면 예산에 즉시 반영됩니다.",
    resetToRecommended: "추천 숙소로 초기화",

    // Accommodation Basket card descriptions
    budgetStayDesc: "저렴하고 대중교통 이용이 편리한 가성비 숙소",
    standardHotelDesc: "합리적인 가격의 편안한 3성급 비즈니스 호텔",
    premiumHeritageDesc: "고급 한옥 스테이 또는 5성급 럭셔리 호텔",

    foodTitle: "식비 예산",
    foodDescription: "현재 여행 조건과 예산 유형에 따라 제공되는 식비 예산입니다.",
    foodNotice: "현재 식비는 임시 일별 추정치이며, 이후 식사 플랜으로 세분화됩니다.",
    foodMealPlan: "음식 식사 계획",
    readOnlyNotice: "읽기 전용",
    dayLabel: "일차",
    mealSlotBreakfast: "아침 식사",
    mealSlotLunch: "점심 식사",
    mealSlotDinner: "저녁 식사",
    mealSlotSnack: "스낵 및 카페",
    baseMealLabel: "기본 식사",
    selectedReplacement: "선택된 대체 음식",
    addOnsLabel: "추가 메뉴 (Add-ons)",
    includedInBase: "기본 예산 포함",
    notIncludedInBase: "기본 예산 미포함",
    wishlistCollectionsTitle: "음식 위시리스트 컬렉션",
    emptyMealPlanNotice: "이 도시의 식사 계획 정보가 없습니다.",
    excludedSelectionNotice: "예산에서 제외된 선택이 있음",
    noWishlistCandidates: "추천 메뉴가 없습니다.",
    selectReplacementButton: "선택",
    changeReplacementButton: "이 음식으로 변경",
    restoreBaseMealButton: "기본 식사로 복원",
    unsupportedPriceUnitLabel: "기본 예산 미지원 요금제",
    saveFailedNotice: "설정 저장에 실패했습니다.",
    orphanAddOnWarning: "이전에 선택한 옵션(Add-on)의 상위 음식을 다시 선택하거나 옵션을 정리하세요.",

    transportTitle: "교통 예산",
    transportDescription: "체류 도시 내 이동을 위한 예산과 도시 간 이동을 위한 장거리 교통비가 포함되어 있습니다.",
    transportNotice: "도시 간 교통비는 서울과 부산을 모두 방문하는 멀티 시티 여행일 때 자동으로 추가됩니다.",

    attractionsTitle: "관광 예산",
    attractionsDescription: "현재 여행 조건과 예산 유형에 따라 제공되는 관광 예산입니다.",
    attractionsNotice: "명소 및 체험 활동 예산은 체류 일수가 아닌 인원수 기준으로 산정됩니다.",

    emergencyTitle: "비상금 예산",
    emergencyDescription: "안전하고 원활한 한국 여행을 위한 비상금 예산입니다.",
    emergencyNotice: "전체 여행에 대해 고정 금액으로 1회만 반영됩니다.",

    // Category labels
    categoryStay: "숙박",
    categoryFood: "음식",
    categoryTransport: "교통",
    categoryAttraction: "관광",
    categoryEmergency: "비상금",

    // Pricing units
    unitRoomNight: "객실/1박",
    unitPersonDay: "1인/1일",
    unitPersonMeal: "1인/1식",
    unitPersonOneWay: "1인/편도",
    unitPerPerson: "1인당",
    unitFixedAmount: "고정액",
    unitPercentage: "비율",

    // General labels
    representativePrice: "대표 가격",
    priceRange: "가격대",
    pricingUnit: "단위",
    nightsLabel: "숙박일",
    roomCountLabel: "객실 수",
    totalLabel: "총액",
    badgeMock: "MOCK",
    updatedAtLabel: "업데이트 날짜",
    sourceLabelText: "출처",
    allTabs: "전체",
  },
  placeholder: {
    notImplemented: "이 페이지는 다음 개발 단계에서 구현됩니다.",
  },
};

export interface Dictionary {
  common: {
    title: string;
    logoAlt: string;
    userAccount: string;
  };
  navigation: {
    planner: string;
    trend: string;
    guide: string;
    savedTrips: string;
  };
  footer: {
    copyright: string;
    about: string;
    terms: string;
    privacy: string;
    country: string;
  };
  landing: {
    heading: string;
    tagline: string;
    cta: string;
    helper: string;
    status: string;
    nextPhase: string;
    allocationSeoulBusan: string;
    allocationSeoulOnly: string;
    allocationBusanOnly: string;
    validation: {
      invalidNights: string;
      invalidAdults: string;
      noCities: string;
      invalidTargetBudget: string;
      saveFailed: string;
    };
  };
  planner: {
    missingState: string;
    goBack: string;
    title: string;
    status: string;
    missingTitle: string;
    missingDescription: string;
    missingButton: string;
    invalidTitle: string;
    invalidDescription: string;
    invalidButton: string;
    calculationErrorTitle: string;
    calculationErrorDescription: string;
    calculationErrorButton: string;
    workspaceTitle: string;
    workspaceDescription: string;
    editTripDetails: string;
    receiptTitle: string;
    statusDraft: string;
    budgetStyle: string;
    targetBudget: string;
    currentEstimate: string;
    budgetUsage: string;
    remainingBudget: string;
    overBudget: string;
    tripWideExpenses: string;
    intercityTransportation: string;
    estimatedTotal: string;
    perTraveler: string;
    dailyAverage: string;
    mockDisclaimer: string;
    saveTrip: string;
    shareReceipt: string;
    generateReport: string;
    notYetAvailable: string;
    accommodationTitle: string;
    accommodationDescription: string;
    accommodationNotice: string;
    selectStayTitle: string;
    selectStayDescription: string;
    resetToRecommended: string;
    budgetStayDesc: string;
    standardHotelDesc: string;
    premiumHeritageDesc: string;
    foodTitle: string;
    foodDescription: string;
    foodNotice: string;
    foodMealPlan: string;
    readOnlyNotice: string;
    dayLabel: string;
    mealSlotBreakfast: string;
    mealSlotLunch: string;
    mealSlotDinner: string;
    mealSlotSnack: string;
    baseMealLabel: string;
    selectedReplacement: string;
    addOnsLabel: string;
    includedInBase: string;
    notIncludedInBase: string;
    wishlistCollectionsTitle: string;
    emptyMealPlanNotice: string;
    excludedSelectionNotice: string;
    noWishlistCandidates: string;
    selectReplacementButton: string;
    changeReplacementButton: string;
    restoreBaseMealButton: string;
    unsupportedPriceUnitLabel: string;
    saveFailedNotice: string;
    orphanAddOnWarning: string;
    transportTitle: string;
    transportDescription: string;
    transportNotice: string;
    attractionsTitle: string;
    attractionsDescription: string;
    attractionsNotice: string;
    emergencyTitle: string;
    emergencyDescription: string;
    emergencyNotice: string;
    categoryStay: string;
    categoryFood: string;
    categoryTransport: string;
    categoryAttraction: string;
    categoryEmergency: string;
    unitRoomNight: string;
    unitPersonDay: string;
    unitPersonMeal: string;
    unitPersonOneWay: string;
    unitPerPerson: string;
    unitFixedAmount: string;
    unitPercentage: string;
    representativePrice: string;
    priceRange: string;
    pricingUnit: string;
    nightsLabel: string;
    roomCountLabel: string;
    totalLabel: string;
    badgeMock: string;
    updatedAtLabel: string;
    sourceLabelText: string;
    allTabs: string;
  };
  placeholder: {
    notImplemented: string;
  };
}
