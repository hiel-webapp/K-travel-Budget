# Legacy State Migration Plan (기존 로컬스토리지 상태 마이그레이션 계획)

이 문서는 기존 Stitch 기반 정적 프로토타입에서 사용되던 `k_travel_state` 로컬스토리지 데이터를 Next.js 환경으로 안전하게 마이그레이션하기 위한 규칙과 필드 분류를 정의합니다.

## 1. 기존 Schema 예시

과거 정적 프로토타입에서는 다음과 같은 비구조화된 단일 JSON 객체 형태로 상태를 관리하였습니다.
```json
{
  "cities": ["Seoul", "Busan"],
  "nights": 5,
  "seoulNights": 3,
  "busanNights": 2,
  "people": 2,
  "budgetType": "Standard",
  "budgetGoal": 2000000,
  "accommodationType": "Standard Hotel",
  "hasCustomMeal": true,
  "customMeal": "Samgyeopsal",
  "customMealPortions": 2,
  "customMealPrice": 36000,
  "seoulAccCost": 450000,
  "busanAccCost": 260000,
  "ktxCost": 117600,
  "mealCost": 400000,
  "activityCost": 150000,
  "flightCost": 1200000,
  "finalTotal": 2613600
}
```

---

## 2. 필드 분류

기존 로컬스토리지 필드는 데이터 성격에 따라 세 개의 카테고리로 분류하여 처리합니다.

### A. 안전하게 이관 가능한 사용자 입력 (User Inputs)
사용자가 화면에서 명시적으로 선택하거나 입력한 순수 설정 데이터입니다. 마이그레이션 시 그대로 신뢰하여 복원할 수 있습니다.
*   `cities` (선택 도시 목록)
*   `nights` (총 여행 박수)
*   `seoulNights` (서울 숙박 일수)
*   `busanNights` (부산 숙박 일수)
*   `people` (여행 인원수)
*   `budgetType` (예산 등급: Budget, Standard, Premium)
*   `budgetGoal` (목표 예산액)
*   `accommodationType` (선택 숙소 타입)
*   `hasCustomMeal` (커스텀 식사 계획 포함 여부)
*   `customMeal` (선택한 커스텀 식사 식별자/이름)
*   `customMealPortions` (선택 식사 제공량/인분)

### B. 재계산해야 하는 파생값 (Derived Values)
원시 입력값을 기준으로 산출되는 연산 비용입니다. 마이그레이션 시 기존 저장된 값을 신뢰하지 않고, **새로운 계산 엔진을 통해 전체 재연산**을 거쳐야 합니다.
*   `customMealPrice` (커스텀 식사 가격)
*   `seoulAccCost` (서울 숙박 추정 비용)
*   `busanAccCost` (부산 숙박 추정 비용)
*   `ktxCost` (도시 간 이동 비용)
*   `mealCost` (총 식비)
*   `activityCost` (액티비티/관광 비용)
*   `finalTotal` (최종 합계 비용)

### C. 자동 이관 금지 legacy prototype 값 (Prohibited Legacy Values)
새 서비스 구조에 불합리하거나 신뢰하기 어려운 임의 지정형 고정 비용 데이터입니다.
*   `flightCost` (항공비: 출발 국가나 예매 시점별 편차가 매우 크며, 프로토타입의 임의 고정값을 복원할 경우 실질적인 예산 신뢰성을 저해함)
*   사용자가 명시적으로 입력하지 않은 임의의 고정 비용 및 신뢰 근거가 없는 모든 값

---

## 3. 향후 Migration 및 아키텍처 원칙

1.  **기존 localStorage 값 불신**:
    *   사용자 로컬 브라우저에 임의로 조작되었거나 깨진 데이터가 들어있을 수 있으므로 검증 없이 상태 엔진에 로드하지 않습니다.
2.  **스키마 버전 관리 (Schema Versioning)**:
    *   새 로컬스토리지 데이터 구조에 `schemaVersion: 1`을 도입합니다.
    *   버전 정보가 없거나 일치하지 않는 기존 `k_travel_state` 데이터는 마이그레이션 핸들러를 거치도록 설계합니다.
3.  **데이터 스키마 유효성 검증 (Schema Validation)**:
    *   `Zod` 등을 통해 가져온 스키마 구조의 형태와 타입을 런타임에 엄격히 확인합니다.
4.  **자동 재계산 적용 (Recalculation Over Snapshot)**:
    *   이전 프로토타입에서 저장된 합계(`finalTotal`)나 카테고리별 비용을 그대로 노출(Snapshot)하지 않고, 이관된 사용자 입력 데이터를 기반으로 새 계산 모듈을 호출하여 값을 재생성(Recalculation)합니다.
5.  **항공비 자동 반영 제외 원칙**:
    *   항공 비용은 신규 예산 생성 시 기본 포함하지 않으며, 사용자가 마이그레이션 완료 후 명시적으로 본인의 실제 항공비를 입력할 수 있는 안내 영역만 제공합니다.
6.  **예외 상황 처리**:
    *   데이터 구조 오류나 타입 오류 등 마이그레이션 실패 시, 원래 브라우저에 있던 로컬스토리지 데이터를 바로 삭제(Delete)하지 않고 보존하여 롤백이 가능하도록 지원합니다. (사용자 데이터를 조용히 파괴하지 않는 원칙)
