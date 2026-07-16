# HypeHeritage Planner Preferences & Accommodation Overrides 명세서

이 문서는 사용자가 여행의 전역 예산 등급(Budget Tier)과는 별개로 개별 도시의 숙박(Accommodation) 등급을 커스텀 변경하여 총합 예산을 조정할 수 있는 오버라이드 시스템의 아키텍처 및 영속화 방식을 정의합니다.

## 1. TripDraft와 Planner Preferences 분리 설계 이유
- **관심사 분리 (Separation of Concerns)**: `TripDraft`는 여행 일수, 인원, 타겟 예산, 방문 도시 등의 "핵심 여행 조건"을 담고 있습니다. 반면, 플래너 내의 숙박 등급 변경은 그 조건 안에서 조율되는 "개별 카테고리 구성 선호도"입니다.
- **영속 관리 격리**: 핵심 조건이 바뀔 경우 이전의 개별 설정(오버라이드)은 무효화되어야 합니다. 이를 TripDraft 모델에 강제로 병합하지 않고 독립된 별도 상태(`PlannerPreferences`)로 관리함으로써, 데이터 모델의 무결성을 깨끗하게 보호합니다.

## 2. 저장소 및 스키마 명세
- **로컬스토리지 Key**: `hypeheritage_planner_preferences`

### 3. Envelope Schema (V2)
스토리지에는 마이그레이션과 하위 호환성을 위해 versioned Envelope 형태로 저장되며, 음식 오버라이드 기능 도입에 따라 스키마 버전이 **2**로 상향되었습니다.
```json
{
  "schemaVersion": 2,
  "savedAt": "2026-07-16T04:22:00.000Z",
  "preferences": {
    "schemaVersion": 2,
    "tripFingerprint": "5|2|SEOUL,BUSAN|BUSAN:2;SEOUL:3|STANDARD|3000000",
    "accommodationByCity": {
      "SEOUL": "BUDGET_STAY",
      "BUSAN": "PREMIUM_HERITAGE"
    },
    "foodOverrides": {
      "SEOUL_0_DINNER": "K_BBQ"
    }
  }
}
```

### 4. Preferences Schema & 5. Trip Fingerprint Fields
`PlannerPreferences`는 다음 필드들을 가집니다:
- `schemaVersion`: 2 (정수형 스키마 버전)
- `tripFingerprint`: 핵심 여행 조건이 변경되었는지 감지하기 위한 해시 세그먼트입니다.
  - **포함 필드**: `totalNights | adultCount | selectedCities(순서 보존) | cityNightAllocations(정렬된 맵) | budgetTier | targetBudgetKrw`
  - 여행 일수, 인원수, 도시 방문 순서, 도시별 숙박 분배, 예산 등급, 목표 예산이 변경되면 fingerprint가 달라집니다. 단, 다국어 locale 전환은 fingerprint에 영향을 주지 않습니다.
- `accommodationByCity`: 각 도시(`SEOUL`, `BUSAN`)의 오버라이드된 숙박 Basket ID 매핑 딕셔너리.
- `foodOverrides`: 각 식사 슬롯 ID를 키로, 선택된 음식 Item ID를 값으로 하는 맵 객체 (`Record<string, string>`).
  - Key: `CITY_DAYINDEX_SLOT` (e.g. `SEOUL_0_BREAKFAST`)
  - Value: `FoodItem.id` (e.g. `SEOUL_SULLEONGTANG`)

## 5-1. V1 to V2 마이그레이션 정책
- 로컬스토리지를 로드할 때 이전 V1 포맷(`schemaVersion: 1`)이 발견되면, 기존의 `accommodationByCity` 데이터는 고스란히 보존한 채, `foodOverrides: {}` 빈 객체를 자동 병합하여 메모리 상에서 V2 포맷으로 자동 변환(마이그레이션)합니다.
- 이 마이그레이션 과정에서 스토리지 자동 쓰기(Write side-effect)는 방지하며, 유저가 저장을 명시적으로 실행하는 시점에만 V2 Envelope 형태로 스토리지에 영구 저장됩니다.
- Preferences 로딩 시 V2 envelope 구조가 손상된 경우(`malformed V2`)에는 default V2 포맷으로 안전하게 폴백(status: "invalid")하며, fingerprint가 다른 경우(`fingerprint-mismatch`)에는 mismatch 지표(status: "fingerprint-mismatch")를 리턴하여 여행 조건 변경을 별도 감지하도록 설계합니다.

## 6. 숙박 오버라이드 검증 및 7. 엔진 흐름
1. 플래너 로드 시, 로컬스토리지를 조회하여 `parsePlannerPreferences`를 구동합니다.
2. `tripFingerprint` 검증을 통해 현재 로드된 `TripDraft` 조건과 일치하는지 대조합니다.
3. `accommodationByCity` 내의 각 `basketId`가 실제 카탈로그(`MOCK_PRICE_CATALOG`) 내의 active하고 `ACCOMMODATION` 카테고리인 바스켓인지 검사합니다.
4. 검증을 통과한 오버라이드는 순수 계산 엔진인 `generateInitialBudgetPlan(draft, catalog, overrides)`에 인자로 전달됩니다.
5. 계산 엔진은 overrides에 지정된 basketId를 우선 사용하여 요금, 소계, 사용률을 재연산합니다.

## 8. 도시별 1객실 숙박 불변식
오버라이드를 통해 등급을 변경하더라도, HypeHeritage MVP 계산 공식인 `roomCount = 1` 규칙은 엄격히 유지됩니다. 각 도시당 숙박 라인 아이템은 중복 생성되지 않고 **정확히 1개**만 존재해야 합니다.

## 9. 도시별 Reset 및 10. All 탭 제한
- **도시별 Reset**: `SEOUL` 또는 `BUSAN` 등 개별 도시 탭에서만 `추천 숙소로 초기화` (`Reset to Recommended Stay`) 기능이 제공되며, 해당 도시의 오버라이드 정보만 preferences에서 안전하게 삭제합니다.
- **All 탭**: `ALL` 탭에서는 추천 숙소 초기화 기능 및 등급 변경 카드 세트가 노출되지 않으며, 도시별 숙박 상태에 대한 단순 읽기 전용 요약 정보만 노출합니다.

## 11. 스토리지 무파생 규칙 (No-derived-totals)
스토리지에는 소계, 세금, 총 예산액 등 연산에 의한 파생 값을 일절 저장하지 않음으로써, 수동 계산 오류나 데이터 불일치를 원천 차단합니다. 모든 금액은 로드 시 계산 엔진에 의해 신선하게 재계산됩니다.

## 12. 상태 복원 및 13. 예외 처리
- **새로고침 & 언어 전환**: 로컬스토리지를 조회하여 기존 등급 선택을 무손실 복구하므로, 새로고침이나 `/ko/planner` ➔ `/en/planner` 전환 시에도 선택이 완벽히 유지됩니다.
- **Fingerprint Mismatch & Invalid preferences**: 여행 조건이 변경되어 fingerprint가 일치하지 않거나 바스켓 정보가 무효할 경우, 이전 오버라이드를 억지로 적용하지 않고 안전하게 무시하며 UI 상에서 "불러올 수 없음" 에러 화면(또는 초기화)을 띄우고 기존 데이터는 함부로 삭제하지 않습니다.

## 14. 편집 및 미구현 기능
- **현재 편집 가능 카테고리**: 숙박(ACCOMMODATION) 카테고리만 개별 등급 선택 카드가 활성화되어 편집을 지원합니다.
- **읽기 전용 유지**: 식비, 교통, 관광, 비상금은 계속 읽기 전용으로 동작합니다.
- **제외 사항**: 실 호텔 브랜드명, 예약 및 제휴 링크, Supabase 및 외부 결제 모듈 등은 MVP 스펙에 따라 전면 배제되었습니다.
- **MOCK 카탈로그**: 예산 플래너 전체에서 표출되는 대표 가격 및 가격대는 Mock Price Catalog를 참조한 임시값입니다.
