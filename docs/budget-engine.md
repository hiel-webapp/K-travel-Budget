# HypeHeritage Budget Calculation Engine

본 문서는 HypeHeritage의 예산 수립 비즈니스 로직을 처리하는 순수 계산 엔진(Pure Calculation Engine)의 명세서 및 가이드라인입니다.

---

## 1. 목적 및 도메인 경계 (Purpose & Domain Boundary)

HypeHeritage 예산 계산 엔진은 사용자가 입력한 여행 조건(TripDraft)을 바탕으로 한국 여행 시 예상되는 예산을 산출합니다. 
본 계산 모듈은 UI(React), 라우팅(Next.js), 로컬스토리지, 외부 연동 API(Supabase, 환율 등)와 완벽히 격리된 **순수 함수 형태**로 설계되었습니다.

### 제외 대상 (Exclusions)
*   **항공비 (Flight Cost)**: 국가별 편차가 크므로 계산에서 철저히 제외합니다.
*   **공항 픽업 및 샌딩**: 개별 편차에 대응하기 전까지 기본 예산에 포함하지 않습니다.
*   **eSIM 및 여행자 보험**: 사용자의 선택 옵션이므로 기본 예산 산정 합계에 포함하지 않습니다.

---

## 2. 도메인 타입 구성 (Categories & Scopes)

### 예산 카테고리 (BudgetCategory)
1.  `ACCOMMODATION`: 숙소 비용
2.  `FOOD`: 기본 식사 비용 (Base Meal Plan)
3.  `CITY_TRANSPORT`: 도시 내 대중교통 및 이동 요금 allowance
4.  `INTERCITY_TRANSPORT`: 도시 간 장거리 교통 (KTX 등)
5.  `ATTRACTION`: 관광지 입장료 및 액티비티 비용
6.  `EMERGENCY_FUND`: 예비비

### 비용 적용 범위 (BudgetScope)
*   `TRIP_WIDE`: 전체 여행 공통 적용 (예: 비상금)
*   `CITY`: 특정 도시 체류 기간에 비례해 적용 (예: 숙박, 식비, 도시 교통, 명소)
*   `INTERCITY`: 도시 간 이동 시 적용 (예: KTX 요금)

---

## 3. 가격 단위 및 계산 전략 (Pricing Units & Strategies)

계산 엔진은 다음 단가 전략에 맞춰 비용을 연산합니다.

| 가격 단위 (PricingUnit) | 계산 전략 (CalculationStrategy) | 설명 |
| :--- | :--- | :--- |
| `ROOM_NIGHT` | `ROOM_NIGHT` | 객실 단가 × 객실 수 × 도시 숙박일수 |
| `PERSON_DAY` | `PERSON_DAY` | 인당 일별 단가 × 인원수 × 도시 숙박일수 |
| `PERSON_ONE_WAY` | `PERSON_ONE_WAY` | 인당 편도 단가 × 인원수 × 이동 횟수 |
| `PER_PERSON` | `PER_PERSON_FIXED` | 인당 고정 단가 × 인원수 (체류 일수와 무관) |
| `FIXED_AMOUNT` | `FIXED_AMOUNT` | 여행 단위 전체 고정 금액 |

---

## 4. 예산 등급별 기본 매핑 (Tier-to-Basket Mappings)

사용자의 예산 선호 등급에 따라 아래의 기본 Basket ID가 자동으로 선택됩니다.

| 카테고리 | BUDGET 등급 | STANDARD 등급 | PREMIUM 등급 |
| :--- | :--- | :--- | :--- |
| **ACCOMMODATION** | `BUDGET_STAY` | `STANDARD_HOTEL` | `PREMIUM_HERITAGE` |
| **FOOD** | `BUDGET_MEAL_PLAN` | `STANDARD_MEAL_PLAN` | `PREMIUM_MEAL_PLAN` |
| **CITY_TRANSPORT** | `BASIC_CITY_TRANSPORT` | `STANDARD_CITY_TRANSPORT` | `COMFORT_CITY_TRANSPORT` |
| **ATTRACTION** | `MOSTLY_FREE` | `BALANCED` | `EXPERIENCE_RICH` |
| **INTERCITY_TRANSPORT** | `KTX_STANDARD` | `KTX_STANDARD` | `KTX_STANDARD` |
| **EMERGENCY_FUND** | `EMERGENCY_FIXED` | `EMERGENCY_FIXED` | `EMERGENCY_FIXED` |

---

## 5. 승인된 MVP 기본 여행 계산 예시 (Default 1-Room MVP Calculation)

### 여행 조건
*   **기간**: 5박 6일 (체류 6일)
*   **인원**: 성인 2명
*   **방문 도시 및 배분**: 서울 3박, 부산 2박
*   **예산 등급**: STANDARD
*   **목표 예산**: ₩3,000,000
*   **객실 수**: **MVP 1객실 고정** (`roomCount = 1`)

### 상세 계산 내역

#### [1] 서울 체류 (3박) 소계: ₩721,000
*   **Accommodation** (`STANDARD_HOTEL`): ₩135,000 × 1객실 × 3박 = ₩405,000
*   **Food** (`STANDARD_MEAL_PLAN`): ₩28,000 × 2명 × 3박 = ₩168,000
*   **City Transport** (`STANDARD_CITY_TRANSPORT`): ₩8,000 × 2명 × 3박 = ₩48,000
*   **Attractions** (`BALANCED`): ₩50,000 × 2명 = ₩100,000

#### [2] 부산 체류 (2박) 소계: ₩452,000
*   **Accommodation** (`STANDARD_HOTEL`): ₩120,000 × 1객실 × 2박 = ₩240,000
*   **Food** (`STANDARD_MEAL_PLAN`): ₩26,000 × 2명 × 2박 = ₩104,000
*   **City Transport** (`STANDARD_CITY_TRANSPORT`): ₩7,000 × 2명 × 2박 = ₩28,000
*   **Attractions** (`BALANCED`): ₩40,000 × 2명 = ₩80,000

#### [3] 도시 간 교통 소계: ₩119,600
*   **Intercity Transport** (`KTX_STANDARD`): ₩59,800 × 2명 × 1회 이동 = ₩119,600

#### [4] 전체 공통 비용 소계: ₩100,000
*   **Emergency Fund** (`EMERGENCY_FIXED`): 고정 ₩100,000

#### [5] 최종 요약 지표
*   **최종 총합 (Grand Total)**: ₩721,000 + ₩452,000 + ₩119,600 + ₩100,000 = **₩1,392,600**
*   **인당 비용 (Per Traveler)**: ₩1,392,600 / 2명 = **₩696,300**
*   **하루 평균 비용 (Daily Average)**: ₩1,392,600 / 6일 = **₩232,100** (5박 6일의 경우 6일로 나눔)
*   **잔여 예산 (Remaining Budget)**: ₩3,000,000 - ₩1,392,600 = **₩1,607,400**
*   **초과 예산 (Over-budget Amount)**: **₩0**
*   **목표 예산 사용률 (Usage Percent)**: (₩1,392,600 / ₩3,000,000) × 100 = **46.4%** (소수점 첫째자리 연산)

---

## 6. 수학적 불변식 및 설계 규칙 (Invariants & Rules)

### 정수 연산 및 반올림 정책
*   모든 KRW 금액은 원화 정수형으로 반올림 연산 처리하여 부동소수점 오차를 방지합니다.
*   일평균 비용(`dailyAverageKrw`) 계산 시, 나누는 분모는 여행 일수(`totalNights + 1`)를 사용하여 하루 단위를 엄밀히 보장합니다.
*   목표 예산 대비 사용 비율(`targetBudgetUsagePercent`)은 백분율 소수점 첫째자리까지 처리합니다 (`Math.round(ratio * 1000) / 10`).

### 영수증 불변식 (Receipt Invariants)
1.  **섹션 불변식**: `모든 도시별 소계` + `도시 간 교통 소계` + `공통 소계` = `최종 합계(grandTotalKrw)`
2.  **카테고리 불변식**: `6가지 카테고리별 요금 합산` = `최종 합계(grandTotalKrw)`

### 도시 간 이동 노선 연산 규칙
*   여행 경로(Visit Order) 상 2개 이상의 도시를 순차적으로 방문할 때에만 KTX 요금 1회(`selectedCities.length - 1`회)를 부과합니다.
*   도시를 1개 이하로 선택한 경우, 도시 간 교통비 라인 아이템은 생성되지 않으며 소계는 ₩0이 됩니다.
*   경로 역순(e.g., 부산 ➔ 서울)도 KTX_STANDARD에 맞춰 동일한 편도 비용을 매핑하여 계산합니다.

### 비상금(Emergency Fund) 연산 규칙
*   기본 매핑에서는 고정 액수(`₩100,000`) 1회를 청구하며, 여행 기간에 곱해지지 않습니다.

---

## 7. Mock Catalog 경고 및 제약 사항

> [!WARNING]
> *   현재 사용되는 단가 카탈로그 버전(`mock-v1`)은 **순수 검증용 가짜 데이터(MOCK)**입니다.
> *   본 데이터를 공식 프로덕션 환경의 실제 한국 여행 물가 또는 보증 가격으로 노출하거나 가장해서는 안 됩니다.

### 임시 제약
*   **식비(Food)**: 현재 ₩28,000 등 일별 추정 단가 기반의 `PERSON_DAY` 방식을 임시 사용 중입니다. 향후 Base Meal Plan 및 meal-slot 대체 연산 방식으로 고도화될 예정입니다.

---

## 8. 향후 고도화 로직 계획 (Future Work Roadmap)
1.  **실제 가격 정보(Verified Price) 대체**: Supabase 데이터베이스 적재 후 실시간 또는 검증된 제휴 파트너 단가 정보로 전환합니다.
2.  **카테고리별 상세 재지정 (Override)**: 숙소만 Premium을 고르고 식비는 Budget을 고르는 등의 카테고리별 예산 등급 세분화 대응.
3.  **다중 객실(Multi-room) 로직**: 여행 인원에 따른 자동 객실 배정 및 수동 변경 대응.
