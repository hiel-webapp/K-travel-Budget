import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractKtoItemsAndCount,
  fetchKtoApi,
  getKtoCredentials,
  normalizeServiceKey,
  parseSafeKtoErrorDetail,
  redactSensitiveParams,
} from "../client";

describe("KTO Client Unit Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      KTO_API_KEY: "test_encoded_key%2F123%3D%3D",
      KTO_MOBILE_APP: "HypeHeritageTest",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("1. Credentials & Double-Encoding Prevention", () => {
    it("should extract credentials from env", () => {
      const creds = getKtoCredentials();
      expect(creds.mobileApp).toBe("HypeHeritageTest");
      expect(creds.apiKey).toBe("test_encoded_key%2F123%3D%3D");
    });

    it("should normalize pre-encoded service keys to prevent double encoding", () => {
      const encoded = "abc%2F123%3D%3D";
      const normalized = normalizeServiceKey(encoded);
      expect(normalized).toBe("abc/123==");

      const params = new URLSearchParams();
      params.append("serviceKey", normalized);
      expect(params.toString()).toBe("serviceKey=abc%2F123%3D%3D");
    });

    it("should handle unencoded service keys cleanly", () => {
      const unencoded = "abc/123==";
      const normalized = normalizeServiceKey(unencoded);
      expect(normalized).toBe("abc/123==");

      const params = new URLSearchParams();
      params.append("serviceKey", normalized);
      expect(params.toString()).toBe("serviceKey=abc%2F123%3D%3D");
    });
  });

  describe("2. Safe Error Masking & Parsing", () => {
    it("should redact serviceKey values from query strings or log text", () => {
      const input = "https://apis.data.go.kr/test?serviceKey=SECRET_KEY_123&MobileOS=ETC";
      const redacted = redactSensitiveParams(input);
      expect(redacted).not.toContain("SECRET_KEY_123");
      expect(redacted).toBe("https://apis.data.go.kr/test?serviceKey=[REDACTED]&MobileOS=ETC");
    });

    it("should parse safe error detail from XML error responses", () => {
      const xmlError = `<OpenAPI_ServiceResponse>
        <cmmMsgHeader>
          <errMsg>SERVICE ERROR</errMsg>
          <returnAuthMsg>HTTP_ERROR</returnAuthMsg>
          <returnReasonCode>30</returnReasonCode>
        </cmmMsgHeader>
      </OpenAPI_ServiceResponse>`;

      const detail = parseSafeKtoErrorDetail(xmlError);
      expect(detail).toBe("Code: 30, Msg: SERVICE ERROR");
    });

    it("should parse safe error detail from JSON error responses", () => {
      const jsonError = JSON.stringify({
        response: {
          header: {
            resultCode: "30",
            resultMsg: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR",
          },
        },
      });

      const detail = parseSafeKtoErrorDetail(jsonError);
      expect(detail).toBe("Code: 30, Msg: SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
    });
  });

  describe("3. API Call & Parameter Verification (Mocked)", () => {
    it("should construct request URL with correct mandatory params and KorService2 endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: "0000", resultMsg: "OK" },
            body: { items: { item: [] }, numOfRows: 10, pageNo: 1, totalCount: 0 },
          },
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await fetchKtoApi({
        locale: "ko",
        endpoint: "/areaBasedList2",
        params: {
          areaCode: "1",
          contentTypeId: "39",
          numOfRows: 10,
          pageNo: 1,
        },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestedUrl = mockFetch.mock.calls[0][0];
      const parsedUrl = new URL(requestedUrl);

      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://apis.data.go.kr/B551011/KorService2/areaBasedList2"
      );
      expect(parsedUrl.searchParams.get("MobileOS")).toBe("ETC");
      expect(parsedUrl.searchParams.get("MobileApp")).toBe("HypeHeritageTest");
      expect(parsedUrl.searchParams.get("_type")).toBe("json");
      expect(parsedUrl.searchParams.get("areaCode")).toBe("1");
      expect(parsedUrl.searchParams.get("contentTypeId")).toBe("39");
      expect(parsedUrl.searchParams.get("numOfRows")).toBe("10");
      expect(parsedUrl.searchParams.get("pageNo")).toBe("1");
      expect(parsedUrl.searchParams.get("serviceKey")).toBe("test_encoded_key/123==");
    });

    it("should throw error when HTTP 200 but resultCode is not 0000", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: "20", resultMsg: "NO_DATA_ERROR" },
            body: "",
          },
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        fetchKtoApi({
          locale: "ko",
          endpoint: "/areaBasedList2",
          params: { areaCode: "1", contentTypeId: "12" },
        })
      ).rejects.toThrowError(
        "[KTO_CLIENT_ERROR] KTO API response error [20]: NO_DATA_ERROR (endpoint: /areaBasedList2)"
      );
    });

    it("should throw error when HTTP 200 but response structure is missing", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: "structure" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        fetchKtoApi({
          locale: "ko",
          endpoint: "/areaBasedList2",
          params: { areaCode: "1", contentTypeId: "12" },
        })
      ).rejects.toThrowError(
        "[KTO_CLIENT_ERROR] Invalid KTO response structure (missing response object) (endpoint: /areaBasedList2)"
      );
    });
  });

  describe("4. KTO Items & TotalCount Response Parsing", () => {
    it("should parse array item and number totalCount correctly", () => {
      const body = {
        totalCount: 15,
        items: {
          item: [{ contentid: "1" }, { contentid: "2" }],
        },
      };
      const res = extractKtoItemsAndCount(body);
      expect(res.totalCount).toBe(15);
      expect(res.rawItems).toHaveLength(2);
    });

    it("should parse single object item and string totalCount correctly", () => {
      const body = {
        totalCount: "1",
        items: {
          item: { contentid: "100" },
        },
      };
      const res = extractKtoItemsAndCount(body);
      expect(res.totalCount).toBe(1);
      expect(res.rawItems).toHaveLength(1);
      expect((res.rawItems[0] as { contentid: string }).contentid).toBe("100");
    });

    it("should return empty array for empty items string or empty object", () => {
      const body1 = { totalCount: 0, items: "" };
      const res1 = extractKtoItemsAndCount(body1);
      expect(res1.totalCount).toBe(0);
      expect(res1.rawItems).toHaveLength(0);

      const body2 = { totalCount: "0", items: {} };
      const res2 = extractKtoItemsAndCount(body2);
      expect(res2.totalCount).toBe(0);
      expect(res2.rawItems).toHaveLength(0);
    });
  });
});
