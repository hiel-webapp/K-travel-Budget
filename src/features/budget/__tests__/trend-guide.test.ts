import { describe, it, expect } from "vitest";
import { K_TREND_CONTENTS, K_GUIDE_CONTENTS } from "../../../lib/static-contents";

describe("HypeHeritage 16단계: K-Trend & K-Guide 정적 다국어 콘텐츠 정합성 검증", () => {
  describe("1. K-Trend 콘텐츠 무결성", () => {
    it("ko와 en 로케일 각각에 대해 유효한 트렌드 데이터가 정의되어 있어야 함", () => {
      const koTrends = K_TREND_CONTENTS.ko;
      const enTrends = K_TREND_CONTENTS.en;

      expect(koTrends).toBeDefined();
      expect(koTrends.length).toBeGreaterThan(0);
      expect(enTrends.length).toBe(koTrends.length);

      // 각 필드가 필수 규격을 만족하는지 검사
      koTrends.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.overview).toBeDefined();
        expect(item.tip).toBeDefined();
        expect(Array.isArray(item.tags)).toBe(true);
      });
    });

    it("영어 트렌드 콘텐츠에는 한국어로 직역된 내용 대신 이해하기 쉬운 영어 설명이 적재되어 있어야 함", () => {
      const enTrends = K_TREND_CONTENTS.en;
      const exhibition = enTrends.find((i) => i.id === "popup-exhibition");

      expect(exhibition).toBeDefined();
      expect(exhibition?.title).toBe("Pop-up Stores & Exhibitions");
      expect(exhibition?.overview).toContain("exhibition spaces");
    });
  });

  describe("2. K-Guide 콘텐츠 무결성 및 안전 공지 가딩", () => {
    it("ko와 en 로케일 각각에 대해 필수 가이드 토픽들이 모두 정돈되어 있어야 함", () => {
      const koGuides = K_GUIDE_CONTENTS.ko;
      const enGuides = K_GUIDE_CONTENTS.en;

      expect(koGuides.length).toBe(6); // 6대 가이드 토픽
      expect(enGuides.length).toBe(6);

      koGuides.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.overview).toBeDefined();
        expect(Array.isArray(item.details)).toBe(true);
        expect(item.details.length).toBeGreaterThan(0);
      });
    });

    it("교통(Transportation) 및 응급상황(Safety) 가이드에는 공식 채널 확인 권고 공지가 부착되어야 함", () => {
      const koGuides = K_GUIDE_CONTENTS.ko;

      const transit = koGuides.find((i) => i.id === "arrival-transit");
      const safety = koGuides.find((i) => i.id === "emergency-safety");

      expect(transit?.officialChannelNotice).toBeDefined();
      expect(transit?.officialChannelNotice).toContain("공식 채널");

      expect(safety?.officialChannelNotice).toBeDefined();
      expect(safety?.officialChannelNotice).toContain("공식 채널");
    });

    it("결제(Finance) 등 기타 비자민감 가이드에는 법적/의무적 책임을 주장하는 단정적 고위험 단어가 배제되어야 함", () => {
      const koGuides = K_GUIDE_CONTENTS.ko;
      const payment = koGuides.find((i) => i.id === "payment-exchange");

      expect(payment).toBeDefined();
      // 단정적 어조 대신 '작동합니다', '유리합니다' 와 같이 사용자 친화적인 설명조 확인
      expect(payment?.overview).toContain("활용됩니다");
      expect(payment?.details[0]).toContain("작동합니다");
    });
  });
});
