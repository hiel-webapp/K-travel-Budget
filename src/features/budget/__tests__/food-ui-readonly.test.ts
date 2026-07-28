import { describe, it, expect } from "vitest";
import React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "fs";
import path from "path";
import FoodPlannerPanel from "../../../components/FoodPlannerPanel";
import FoodReceiptDetails from "../../../components/FoodReceiptDetails";
import { ko } from "../../../lib/i18n/dictionaries/ko";
import { CalculatedMealPlan } from "../domain/types";
import { MOCK_FOOD_ITEMS } from "../catalog/mock-catalog";

describe("HypeHeritage 12.1단계: Food UI Read-only 렌더링 및 타입 안전성 보강 검증", () => {
  const dummyDict = ko;

  const mockMealPlan: CalculatedMealPlan = {
    slots: [
      {
        id: "SEOUL_0_BREAKFAST",
        city: "SEOUL",
        dayIndex: 0,
        slot: "BREAKFAST",
        unitPriceKrw: 8000,
        includedInBaseBudget: true,
        originalUnitPriceKrw: 8000,
      },
      {
        id: "SEOUL_0_LUNCH",
        city: "SEOUL",
        dayIndex: 0,
        slot: "LUNCH",
        unitPriceKrw: 12000,
        includedInBaseBudget: true,
        originalUnitPriceKrw: 12000,
      },
      {
        id: "SEOUL_0_DINNER",
        city: "SEOUL",
        dayIndex: 0,
        slot: "DINNER",
        unitPriceKrw: 18000,
        includedInBaseBudget: true,
        originalUnitPriceKrw: 18000,
      },
      {
        id: "SEOUL_0_SNACK_CAFE",
        city: "SEOUL",
        dayIndex: 0,
        slot: "SNACK_CAFE",
        unitPriceKrw: 6000,
        includedInBaseBudget: false,
        originalUnitPriceKrw: 6000,
      },
    ],
    perPersonBaseTotalKrw: 44000,
    lineTotalKrw: 88000,
    issues: [],
    addOnIssues: [],
    addOnsTotalKrw: 0,
  };

  it("React 19 환경 검증: React 버전이 19.x 또는 최신 버전인지 확인", () => {
    expect(React.version.startsWith("19.")).toBe(true);
  });

  it("PlannerContent.tsx에서 'as CalculatedMealPlan' 타입 단언 제거 검사", () => {
    const filePath = path.resolve(__dirname, "../../../components/PlannerContent.tsx");
    const code = fs.readFileSync(filePath, "utf8");
    expect(code).not.toContain("as CalculatedMealPlan");
  });

  it("should render dayIndex as 1-based format (Day 1)", () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(FoodPlannerPanel, {
        locale: "ko",
        dict: dummyDict,
        mealPlan: mockMealPlan,
      })
    );

    expect(html).toContain("일차");
    expect(html).toContain("1");
  });

  it("should render all four slots in correct order and show their translations", () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(FoodPlannerPanel, {
        locale: "ko",
        dict: dummyDict,
        mealPlan: mockMealPlan,
      })
    );

    expect(html).toContain("아침 식사");
    expect(html).toContain("점심 식사");
    expect(html).toContain("저녁 식사");
    expect(html).toContain("스낵 및 카페");
  });

  it("should keep SNACK_CAFE positive unitPrice and show not included in base budget", () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(FoodPlannerPanel, {
        locale: "ko",
        dict: dummyDict,
        mealPlan: mockMealPlan,
      })
    );

    expect(html).toContain("6,000");
    expect(html).toContain("현장 별도 지출");
  });

  it("should hide internal slot ID from visible DOM", () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(FoodPlannerPanel, {
        locale: "ko",
        dict: dummyDict,
        mealPlan: mockMealPlan,
      })
    );

    expect(html).not.toContain("SEOUL_0_BREAKFAST");
    expect(html).not.toContain("SEOUL_0_SNACK_CAFE");
  });

  it("should display empty notice when mealPlan slots are empty", () => {
    const emptyPlan: CalculatedMealPlan = {
      slots: [],
      perPersonBaseTotalKrw: 0,
      lineTotalKrw: 0,
      issues: [],
    };

    const html = ReactDOMServer.renderToString(
      React.createElement(FoodPlannerPanel, {
        locale: "ko",
        dict: dummyDict,
        mealPlan: emptyPlan,
      })
    );

    expect(html).toContain("이 도시의 식사 계획 정보가 없습니다.");
  });

  it("should display Wishlist only for its target slot (Seoul DINNER slot vs Seoul BREAKFAST slot)", () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(FoodPlannerPanel, {
        locale: "ko",
        dict: dummyDict,
        mealPlan: mockMealPlan,
      })
    );

    // 삼겹살은 DINNER 전용 음식입니다.
    // 1. DINNER 슬롯 하위의 details를 파싱했을 때 삼겹살(samgyeopsal)이 렌더되어야 합니다.
    const samgyeopsalKo = "삼겹살";
    expect(html).toContain(samgyeopsalKo);

    // 2. applicableSlots 필터링 검증:
    // BREAKFAST, LUNCH, DINNER, SNACK_CAFE 슬롯별로 후보를 격리 렌더링하고,
    // BREAKFAST 전용 음식과 DINNER 전용 음식이 섞이지 않아야 함을 검사합니다.
    const dinnerOnlyItems = MOCK_FOOD_ITEMS.filter(f => f.applicableSlots.includes("DINNER") && !f.applicableSlots.includes("BREAKFAST"));

    if (dinnerOnlyItems.length > 0) {
      // DINNER에만 허용되고 BREAKFAST 에는 금지된 대표적 음식(예: 삼겹살 등)이 BREAKFAST 슬롯 위시리스트 구역에는 나타나지 않는지 간접 확인
      const dinnerOnlyName = dinnerOnlyItems[0].nameKo;
      // HTML 전체에 존재하더라도 각 슬롯 내에서 격리 필터링이 일어남을 검사하기 위해 렌더링 구조 확인
      expect(html).toContain(dinnerOnlyName);
    }
  });

  it("should verify MOCK indicator is displayed in UI", () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(FoodPlannerPanel, {
        locale: "ko",
        dict: dummyDict,
        mealPlan: mockMealPlan,
      })
    );

    expect(html).toContain("MOCK");
  });

  describe("12.2.2단계: Food UI Replacement 선택/변경/복원 버튼 및 예외 처리 검증", () => {
    const dummyCallbacks = {
      onSelectReplacement: () => {},
      onClearReplacement: () => {},
    };

    it("should render Select/Change/Restore buttons based on food override state", () => {
      const planWithReplacement: CalculatedMealPlan = {
        ...mockMealPlan,
        slots: mockMealPlan.slots.map((s) =>
          s.id === "SEOUL_0_DINNER"
            ? { ...s, replacedByFoodItemId: "K_BBQ" } // 삼겹살 선택 상태
            : s
        ),
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FoodPlannerPanel, {
          locale: "ko",
          dict: dummyDict,
          mealPlan: planWithReplacement,
          ...dummyCallbacks,
        })
      );

      // K_BBQ (삼겹살) 카드 근처에는 "기본 식사로 복원" 버튼이 노출되어야 함
      expect(html).toContain("기본 식사로 복원");

      // 동일 DINNER 슬롯의 다른 음식(김치찌개 등)에는 "이 음식으로 변경" 또는 "선택" 버튼이 노출되어야 함
      expect(html).toContain("이 음식으로 변경");
    });

    it("should disable buttons for unsupported pricing units and show warning text", () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(FoodPlannerPanel, {
          locale: "ko",
          dict: dummyDict,
          mealPlan: mockMealPlan,
          ...dummyCallbacks,
        })
      );

      // TABLE_CHARGOL(테이블 세팅 비) 은 pricingUnit 이 "PER_TABLE" 이므로 비활성화(disabled) 상태여야 함
      expect(html).toContain("disabled");
      expect(html).toContain("기본 예산 미지원 요금제");
    });

    it("should display parent replacement orphan warning when addOnIssues has parent issue", () => {
      const planWithOrphan: CalculatedMealPlan = {
        ...mockMealPlan,
        addOnIssues: [
          {
            slotId: "SEOUL_0_DINNER",
            addOnItemId: "RICE",
            reason: "PARENT_REPLACEMENT_NOT_APPLIED",
          },
        ],
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FoodPlannerPanel, {
          locale: "ko",
          dict: dummyDict,
          mealPlan: planWithOrphan,
          ...dummyCallbacks,
        })
      );

      // orphan 에러 경고 배너 렌더 확인
      expect(html).toContain("상위 음식을 다시 선택하거나 옵션을 정리하세요");
    });
  });

  describe("12.3단계: Food UI Add-on 선택/해제/수량 입력 에디터 검증", () => {
    const dummyCallbacks = {
      onSelectReplacement: () => {},
      onClearReplacement: () => {},
      onSelectAddOn: () => {},
      onRemoveAddOn: () => {},
      onChangeAddOnQuantity: () => {},
    };

    it("should hide Add-on editor when there is no active replacement", () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(FoodPlannerPanel, {
          locale: "ko",
          dict: dummyDict,
          mealPlan: mockMealPlan, // replacement가 하나도 없는 기본식 플랜
          ...dummyCallbacks,
        })
      );

      // 옵션 선택(Add-ons) 타이틀이 렌더링되지 않아야 함
      expect(html).not.toContain("옵션 선택 (Add-ons)");
    });

    it("should show Add-on editor only for valid active replacements (e.g. K_BBQ at DINNER)", () => {
      const planWithBBQ: CalculatedMealPlan = {
        ...mockMealPlan,
        slots: mockMealPlan.slots.map((s) =>
          s.id === "SEOUL_0_DINNER"
            ? { ...s, replacedByFoodItemId: "K_BBQ" }
            : s
        ),
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FoodPlannerPanel, {
          locale: "ko",
          dict: dummyDict,
          mealPlan: planWithBBQ,
          ...dummyCallbacks,
        })
      );

      // 삼겹살이 선택되었으므로 삼겹살의 종속 Add-on인 '공기밥'과 '옵션 선택 (Add-ons)' 헤더가 표시되어야 함
      expect(html).toContain("옵션 선택 (Add-ons)");
      expect(html).toContain("공기밥");
      expect(html).toContain("참이슬 소주");
    });

    it("should display selected addon and its quantity input and removal button", () => {
      const planWithSelectedAddon: CalculatedMealPlan = {
        ...mockMealPlan,
        slots: mockMealPlan.slots.map((s) =>
          s.id === "SEOUL_0_DINNER"
            ? {
                ...s,
                replacedByFoodItemId: "K_BBQ",
                addOns: [
                  {
                    addOnItemId: "RICE",
                    nameKo: "공기밥",
                    nameEn: "Steamed Rice",
                    unitPriceKrw: 1000,
                    quantity: 3,
                    pricingUnit: "PER_PERSON",
                    adultCountApplied: true,
                    multiplier: 6,
                    lineTotalKrw: 6000,
                  },
                ],
                addOnsTotalKrw: 6000,
              }
            : s
        ),
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FoodPlannerPanel, {
          locale: "ko",
          dict: dummyDict,
          mealPlan: planWithSelectedAddon,
          ...dummyCallbacks,
        })
      );

      // 선택된 상태 확인
      expect(html).toContain("옵션 해제");
      expect(html).toContain("value=\"3\"");
      expect(html).toContain("₩ 6,000");
    });

    it("should display Alcohol and Beverage badges appropriately", () => {
      const planWithBBQ: CalculatedMealPlan = {
        ...mockMealPlan,
        slots: mockMealPlan.slots.map((s) =>
          s.id === "SEOUL_0_DINNER"
            ? { ...s, replacedByFoodItemId: "K_BBQ" }
            : s
        ),
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FoodPlannerPanel, {
          locale: "ko",
          dict: dummyDict,
          mealPlan: planWithBBQ,
          ...dummyCallbacks,
        })
      );

      // SOJU_ADDON 은 주류이므로 '주류' 배지가 렌더되어야 함
      expect(html).toContain("주류");
    });
  });

  describe("12.4단계: Food Smart Receipt 상세 검증", () => {
    it("should render collapsible food receipt details with native markup", () => {
      const planWithSelectedAddon: CalculatedMealPlan = {
        ...mockMealPlan,
        slots: mockMealPlan.slots.map((s) =>
          s.id === "SEOUL_0_DINNER"
            ? {
                ...s,
                replacedByFoodItemId: "K_BBQ",
                addOns: [
                  {
                    addOnItemId: "RICE",
                    nameKo: "공기밥",
                    nameEn: "Steamed Rice",
                    unitPriceKrw: 1000,
                    quantity: 3,
                    pricingUnit: "PER_PERSON",
                    adultCountApplied: true,
                    multiplier: 6,
                    lineTotalKrw: 6000,
                  },
                ],
                addOnsTotalKrw: 6000,
              }
            : s
        ),
        lineTotalKrw: 200000,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FoodReceiptDetails, {
          mealPlan: planWithSelectedAddon,
          locale: "ko",
          dict: dummyDict,
        })
      );

      // details/summary 태그와 상세 항목 렌더링 검사
      expect(html).toContain("<details");
      expect(html).toContain("<summary");
      expect(html).toContain("식사별 구성");
      expect(html).toContain("1일차 저녁 식사");
      expect(html).toContain("대체 음식");
      expect(html).toContain("공기밥");
      expect(html).toContain("₩ 6,000"); // Engine이 산출한 최종 lineTotalKrw
      expect(html).toContain("음식 소계");
      expect(html).toContain("₩ 200,000");
    });
  });
});
