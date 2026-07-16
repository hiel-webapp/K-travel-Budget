# HypeHeritage Food Replacement & Wishlist 도메인 명세서

이 문서는 사용자가 개별 식사 슬롯(아침, 점심, 저녁, 스낵/카페)의 기본 제공 식사 계획(Base Meal Plan) 대신, 음식 위시리스트 카탈로그 내의 특정 한식 메뉴로 음식을 변경 및 교체하여 나만의 커스텀 예산 플랜을 구성할 수 있는 음식 대체(Replacement) 도메인의 아키텍처 및 순수 계산 공식을 정의합니다.

## 1. Food Wishlist 카탈로그 및 테마 컬렉션
음식 정보는 Fake official 이나 실시간 데이터가 아니라, MVP 스펙에 정의된 `MOCK_FOOD_ITEMS` 카탈로그 상수를 기반으로 제공됩니다.
- **4대 테마 컬렉션**:
  - `ESSENTIALS` (한국 대표 식단)
  - `INTERNATIONAL` (외국인 선호 식단)
  - `TRENDING` (최신 트렌드 푸드)
  - `SPECIALTIES` (도시별 로컬 별미)
- **다중 구조 매핑**:
  - 1개의 음식은 여러 테마 컬렉션에 소속될 수 있습니다 (`collectionIds: FoodCollectionId[]`).
  - 1개의 음식은 여러 도시에 동시 적용 가능합니다 (`applicableCities: SupportedCity[]`).
  - 아침, 점심, 저녁, 스낵 중 허용되는 슬롯 리스트가 배열로 고정됩니다 (`applicableSlots: MealSlot[]`).

## 2. 가격 단위별 계산 및 범위 정책
- **정적 가격 단위 종류**: `PER_PERSON`, `PER_SERVING`, `SHARED_DISH`, `SET_MENU`, `PER_ITEM`, `PER_CUP`, `PER_TABLE`
- **10단계 공식 Replacement 계산 범위**:
  - 오직 `PER_PERSON` (인당 계산) 단가만을 계산식에 반영합니다.
  - 나머지 단가(예: `SHARED_DISH`, `PER_TABLE` 등)는 10단계에서 임의로 환산하지 않고 공식 예산 연산에서 배제한 뒤 진단 이슈(`UNSUPPORTED_PRICING_UNIT`)에 등록하여 다음 11단계 Add-on/공유음식 연산 파트로 연산 역할을 명확히 격리 위임합니다.

## 3. Replacement 가격 합산 및 중복 방지 규칙
- **Pure Function 원칙**: 입력인 `BaseMealPlan`, `FoodOverrides`, `FoodItem[]` 등은 계산 도중 절대 변경(Mutation)하지 않고, 매번 완전히 동일한 결과(결정론적 구조)를 반환하는 순수 함수 `applyFoodReplacements`를 활용합니다.
- **다이렉트 Effective Price 산출**:
  - 일반 슬롯: 해당 슬롯에 유효한 Replacement가 배정된 경우, 기본 식사 가격을 먼저 더하고 차감하는 우회 연산 대신, 해당 슬롯의 단가를 교체된 음식 가격으로 **한 번만 결정하여 합산**합니다 (중복 합산 원천 차단).
  - SNACK_CAFE 슬롯: 디폴트 optional(₩0) 이지만, 유효한 Replacement가 매핑되면 **해당 슬롯을 공식 예산에 즉각적으로 반영(includedInBaseBudget = true)** 처리하여 스낵 음식을 line total에 가산시킵니다. 선택을 해제하면 자연스럽게 Base ₩0 상태로 원복합니다.
- **수량 불변식**: 음식을 대체하더라도 아침, 점심, 저녁의 슬롯 개수와 종류별 횟수는 변동 없이 엄격히 보존됩니다.

## 4. Invalid / Orphan Selection 진단 및 이슈 반환
사용자의 여행 조건 축소(nights 감소) 등으로 인해 보관되던 오버라이드 매핑 키가 계산 시점에 생성되지 않거나 부적합할 때, 계산 엔진은 크래시를 내지 않고 아래 코드를 통해 진단 이슈(`issues` 배열)를 반환합니다.
- `SLOT_NOT_FOUND`: 존재하지 않는 날짜 또는 슬롯 ID.
- `FOOD_NOT_FOUND`: 카탈로그에 존재하지 않는 음식 ID.
- `CITY_NOT_ALLOWED`: 해당 도시에 적용 불가능한 음식.
- `SLOT_NOT_ALLOWED`: 해당 식사 시간(슬롯)에 적용 불가능한 음식.
- `UNSUPPORTED_PRICING_UNIT`: PER_PERSON 이외의 가격 단위를 소유한 음식.
- `MALFORMED_SELECTION`: 키/값 문자열의 정형 구조 깨짐.
- 계산 엔진은 이 rejected selection 데이터를 스토리지에서 함부로 강제 삭제하지 않고, 예산 연산에서만 조용히 배제하여 보존 유연성을 유지합니다.
