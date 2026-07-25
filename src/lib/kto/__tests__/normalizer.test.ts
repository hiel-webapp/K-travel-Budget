import { describe, it, expect } from "vitest";
import {
  normalizeKtoPlace,
  parseCoordinates,
  resolvePlaceCategory,
  resolveSupportedCity,
} from "../normalizer";
import { KtoAreaBasedListItem } from "../types";

describe("KTO Normalizer Unit Tests", () => {
  describe("1. City Mapping", () => {
    it("should map areaCode '1' to SEOUL and '6' to BUSAN", () => {
      expect(resolveSupportedCity("1")).toBe("SEOUL");
      expect(resolveSupportedCity("6")).toBe("BUSAN");
    });

    it("should return null for non-supported areaCodes like '99' or undefined", () => {
      expect(resolveSupportedCity("99")).toBeNull();
      expect(resolveSupportedCity(undefined)).toBeNull();
    });

    it("should respect overrideCity if provided", () => {
      expect(resolveSupportedCity("31", "SEOUL")).toBe("SEOUL");
      expect(resolveSupportedCity(undefined, "BUSAN")).toBe("BUSAN");
    });
  });

  describe("2. Category & Cafe Uncertainty Mapping", () => {
    it("should map contenttypeid 32 to ACCOMMODATION", () => {
      const res = resolvePlaceCategory("32");
      expect(res.category).toBe("ACCOMMODATION");
      expect(res.isUncertainCafe).toBe(false);
    });

    it("should map contenttypeid 12 (Kor) and 76 (Eng) to ATTRACTION", () => {
      expect(resolvePlaceCategory("12").category).toBe("ATTRACTION");
      expect(resolvePlaceCategory("76").category).toBe("ATTRACTION");
    });

    it("should map contenttypeid 14 (Kor) and 78 (Eng) to CULTURE", () => {
      expect(resolvePlaceCategory("14").category).toBe("CULTURE");
      expect(resolvePlaceCategory("78").category).toBe("CULTURE");
    });

    it("should map restaurant to CAFE if cat3 code matches cafe", () => {
      const res = resolvePlaceCategory("39", "A05020900", "아기자기 카페");
      expect(res.category).toBe("CAFE");
      expect(res.isUncertainCafe).toBe(false);
    });

    it("should map restaurant to CAFE if title includes cafe keyword even without cat3", () => {
      const res = resolvePlaceCategory("39", undefined, "해운대 오션뷰 Cafe");
      expect(res.category).toBe("CAFE");
      expect(res.isUncertainCafe).toBe(false);
    });

    it("should map general restaurant to RESTAURANT with isUncertainCafe=true when cafe is not certain", () => {
      const res = resolvePlaceCategory("39", "A05020100", "원조 삼겹살 전문점");
      expect(res.category).toBe("RESTAURANT");
      expect(res.isUncertainCafe).toBe(true);
    });
  });

  describe("3. Coordinate Parsing", () => {
    it("should correctly parse valid mapx and mapy in Korea bounds", () => {
      const coords = parseCoordinates("126.9780", "37.5665");
      expect(coords.longitude).toBe(126.978);
      expect(coords.latitude).toBe(37.5665);
    });

    it("should return empty object for missing or out-of-bound coordinates", () => {
      expect(parseCoordinates(undefined, "37.5665")).toEqual({});
      expect(parseCoordinates("0", "0")).toEqual({});
      expect(parseCoordinates("500", "500")).toEqual({});
    });
  });

  describe("4. Item Exclusion & Quality Status Logic", () => {
    it("should exclude items with missing contentid or title (return null)", () => {
      const missingTitle: KtoAreaBasedListItem = {
        contentid: "12345",
        contenttypeid: "32",
        title: "",
        areacode: "1",
      };
      const missingId: KtoAreaBasedListItem = {
        contentid: "",
        contenttypeid: "32",
        title: "호텔 서울",
        areacode: "1",
      };

      expect(normalizeKtoPlace(missingTitle)).toBeNull();
      expect(normalizeKtoPlace(missingId)).toBeNull();
    });

    it("should exclude items outside supported 10 cities", () => {
      const unsupportedItem: KtoAreaBasedListItem = {
        contentid: "99999",
        contenttypeid: "32",
        title: "해외 호텔",
        areacode: "99",
      };
      expect(normalizeKtoPlace(unsupportedItem)).toBeNull();
    });

    it("should mark item qualityStatus as INCOMPLETE when coords/images/description are missing", () => {
      const incompleteItem: KtoAreaBasedListItem = {
        contentid: "10001",
        contenttypeid: "32",
        title: "서울 게스트하우스",
        areacode: "1",
        addr1: "서울특별시 종로구",
      };

      const normalized = normalizeKtoPlace(incompleteItem);
      expect(normalized).not.toBeNull();
      expect(normalized?.category).toBe("ACCOMMODATION");
      expect(normalized?.qualityStatus).toBe("INCOMPLETE");
    });

    it("should mark item qualityStatus as REVIEW_REQUIRED for uncertain restaurant/cafe", () => {
      const uncertainItem: KtoAreaBasedListItem = {
        contentid: "10002",
        contenttypeid: "39",
        title: "맛있는 집",
        areacode: "6",
        addr1: "부산광역시 해운대구",
        mapx: "129.158",
        mapy: "35.158",
        firstimage: "http://example.com/img.jpg",
      };

      const normalized = normalizeKtoPlace(uncertainItem, { description: "부산 해운대 맛집입니다." });
      expect(normalized).not.toBeNull();
      expect(normalized?.category).toBe("RESTAURANT");
      expect(normalized?.qualityStatus).toBe("REVIEW_REQUIRED");
    });

    it("should mark complete item with clear category as READY", () => {
      const completeItem: KtoAreaBasedListItem = {
        contentid: "10003",
        contenttypeid: "12",
        title: "경복궁",
        areacode: "1",
        addr1: "서울특별시 종로구 사직로 161",
        mapx: "126.977",
        mapy: "37.579",
        firstimage: "http://example.com/gbg.jpg",
      };

      const normalized = normalizeKtoPlace(completeItem, { description: "조선의 으뜸 궁궐입니다." });
      expect(normalized).not.toBeNull();
      expect(normalized?.category).toBe("ATTRACTION");
      expect(normalized?.qualityStatus).toBe("READY");
    });
  });

  describe("5. Korean / English Translation Normalization", () => {
    it("should normalize Korean place input", () => {
      const item: KtoAreaBasedListItem = {
        contentid: "20001",
        contenttypeid: "32",
        title: "부산 신라호텔",
        areacode: "6",
        addr1: "부산광역시 해운대구",
      };

      const normalized = normalizeKtoPlace(item, { locale: "ko" });
      expect(normalized?.sourceName).toBe("KTO_KOR");
      expect(normalized?.translations).toHaveLength(1);
      expect(normalized?.translations[0]).toEqual({
        locale: "ko",
        title: "부산 신라호텔",
        description: undefined,
        address: "부산광역시 해운대구",
      });
    });

    it("should normalize English place input", () => {
      const item: KtoAreaBasedListItem = {
        contentid: "20002",
        contenttypeid: "76",
        title: "Haeundae Beach",
        areacode: "6",
        addr1: "Haeundae-gu, Busan",
      };

      const normalized = normalizeKtoPlace(item, { locale: "en" });
      expect(normalized?.sourceName).toBe("KTO_ENG");
      expect(normalized?.category).toBe("ATTRACTION");
      expect(normalized?.translations[0]).toEqual({
        locale: "en",
        title: "Haeundae Beach",
        description: undefined,
        address: "Haeundae-gu, Busan",
      });
    });
  });
});
