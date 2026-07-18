# HypeHeritage Food Add-on 및 공유 음식 계산 명세서

이 문서는 사용자가 개별 식사 슬롯에 적용된 음식(Replacement)에 종속되는 추가 메뉴(Add-on) 및 다인용/공유 음식 계산 시스템의 도메인 분석과 비즈니스 규칙을 정의합니다.

## 1. Add-on과 Replacement의 도메인 경계
- **Replacement (음식 대체)**: Base Meal Slot 자체의 디폴트 가격 모델을 다른 단일 음식 가격으로 완전히 교체합니다.
- **Add-on (추가 메뉴)**: 해당 식사 슬롯에 유효한 Replacement가 적용되어 있을 때만 종속되어 비용이 가산되는 추가적인 단품/사이드 메뉴 항목들입니다.
- **의존 생명주기**:
  - parent Replacement가 해제되거나, Add-on 후보군을 지원하지 않는 다른 음식으로 교체되는 경우 기존의 Add-on 정보는 영속화 스토리지에서 즉시 삭제되지 않고 연산 엔진에서 필터링되어 계산 비용 ₩0(진단 이슈 `PARENT_REPLACEMENT_NOT_APPLIED` 또는 `ADD_ON_NOT_ALLOWED_FOR_PARENT`)으로 처리됩니다.
  - 술과 음료를 포함한 모든 Add-on 항목은 디폴트로 자동 선택되지 않으며, 오직 유저의 명시적인 selection에 의해서만 비용이 책정됩니다.

## 2. 수량(Quantity) 정책
- **명시적 정수형 수량**: 계산 엔진은 오직 사용자가 입력한 양의 정수(`quantity: number`)를 그대로 최종 계산식에 대입합니다.
- **유효성 가드**: 수량이 누락되거나, `0`, 음수, 소수, `NaN`, 또는 카탈로그에 정의된 `maxQuantity`를 초과하는 수량 정보는 연산에서 안전하게 배제하고 진단 이슈(`INVALID_QUANTITY` 또는 `QUANTITY_EXCEEDS_LIMIT`)에 올립니다.
- **메타데이터 보존**: `servingCapacity`, `peoplePerSet`, `tableCapacity` 등의 공유 및 세트/테이블 정보는 향후 프론트엔드 UI 단에서 최적의 추천/권장 수량을 유저에게 제시하기 위한 참고용 메타데이터로만 활용되며, 계산 엔진 내부에서 암묵적으로 계산 수량을 강제 변경(Auto-adjust)하지 않습니다.

## 3. 가격 단위(PricingUnit)별 공식
Add-on 연산 엔진은 다음 공식에 의거하여 단일 애드온의 line total을 도출합니다:
- **`PER_PERSON` (인당 계산)**: `unitPriceKrw * adultCount * quantity`
  - 여행 인원수(`adultCount`)와 선택 수량을 모두 곱합니다.
- **나머지 6개 가격 단위** (`PER_SERVING`, `SHARED_DISH`, `SET_MENU`, `PER_ITEM`, `PER_CUP`, `PER_TABLE`): `unitPriceKrw * quantity`
  - 인원수 반영 없이 단가에 선택 수량만 다이렉트 곱하여 단품 주문 금액처럼 산출합니다.

## 4. invalid/orphan 진단 사유
Add-on 계산 수행 시 발견되는 유효성 결격 사항은 크래시를 내지 않고 다음과 같이 진단 이슈(`addOnIssues` 리스트)로 반환되어 예산 계산에서 제외됩니다:
- `SLOT_NOT_FOUND`: 존재하지 않는 날짜 또는 슬롯 ID.
- `PARENT_FOOD_NOT_FOUND`: parent 음식 자체가 카탈로그에 존재하지 않는 경우.
- `PARENT_REPLACEMENT_NOT_APPLIED`: 유효한 대체(Replacement) 음식 배정이 없는 슬롯에 Add-on이 강제로 등록된 경우.
- `ADD_ON_NOT_FOUND`: 카탈로그에 존재하지 않는 Add-on ID.
- `ADD_ON_NOT_ALLOWED_FOR_PARENT`: 해당 parent 음식에 배정 불가능한 Add-on 종류인 경우.
- `CITY_NOT_ALLOWED`: 해당 도시에 판매되지 않는 메뉴인 경우.
- `INVALID_QUANTITY`: 0 이하의 값, 정수가 아닌 수량.
- `QUANTITY_EXCEEDS_LIMIT`: 카탈로그의 최대 수량을 넘긴 경우.
- `INVALID_PRICE`: Add-on의 representativePriceKrw가 양의 정수가 아닌 경우.
- `MALFORMED_SELECTION`: 동일 슬롯 내에서 동일한 `addOnItemId`가 중복 발견되어 중복 합산이 우려되는 경우 등.
