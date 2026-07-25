import { describe, it, expect, vi } from "vitest";
import { validateIngestOptions, ingestKtoPlaces } from "../ingestor";
import { validateSupabaseEnv } from "../../supabase/client";
import { SupportedCity } from "../../trip-domain";

describe("KTO Ingestion & Supabase Client Unit Tests (Mock-based)", () => {
  describe("1. Environment & Option Validation", () => {
    it("should throw error without exposing secret keys when Supabase env vars are missing", () => {
      const origUrl = process.env.SUPABASE_URL;
      const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      try {
        expect(() => validateSupabaseEnv()).toThrowError(
          "[SUPABASE_CLIENT_ERROR] Missing required server environment variable(s)"
        );
      } finally {
        process.env.SUPABASE_URL = origUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
      }
    });

    it("should reject invalid city input", () => {
      expect(() => validateIngestOptions({ city: "INVALID_CITY" as unknown as SupportedCity })).toThrowError(
        "[KTO_INGEST_ERROR] Invalid city: 'INVALID_CITY'"
      );
    });

    it("should reject non-positive or non-integer limitPerCategory", () => {
      expect(() => validateIngestOptions({ limitPerCategory: 0 })).toThrowError(
        "[KTO_INGEST_ERROR] Invalid limitPerCategory: '0'"
      );
      expect(() => validateIngestOptions({ limitPerCategory: -5 })).toThrowError(
        "[KTO_INGEST_ERROR] Invalid limitPerCategory: '-5'"
      );
      expect(() => validateIngestOptions({ limitPerCategory: 1.5 })).toThrowError(
        "[KTO_INGEST_ERROR] Invalid limitPerCategory: '1.5'"
      );
    });

    it("should accept valid options for SEOUL, BUSAN, and ALL", () => {
      expect(validateIngestOptions({ city: "SEOUL", limitPerCategory: 5 })).toEqual({
        city: "SEOUL",
        limitPerCategory: 5,
        dryRun: false,
        categories: ["ACCOMMODATION", "RESTAURANT", "ATTRACTION", "CULTURE"],
      });

      expect(validateIngestOptions({ city: "BUSAN", limitPerCategory: 20 })).toEqual({
        city: "BUSAN",
        limitPerCategory: 20,
        dryRun: false,
        categories: ["ACCOMMODATION", "RESTAURANT", "ATTRACTION", "CULTURE"],
      });

      expect(validateIngestOptions({ city: "ALL", dryRun: true })).toEqual({
        city: "ALL",
        limitPerCategory: 10,
        dryRun: true,
        categories: ["ACCOMMODATION", "RESTAURANT", "ATTRACTION", "CULTURE"],
      });
    });
  });

  describe("2. Dry-Run Execution Mode", () => {
    it("should perform dry-run without requiring API credentials or DB connection", async () => {
      const result = await ingestKtoPlaces({
        dryRun: true,
        city: "SEOUL",
        limitPerCategory: 5,
      });

      expect(result.dryRun).toBe(true);
      expect(result.city).toBe("SEOUL");
      expect(result.status).toBe("COMPLETED");
      expect(result.totalFetched).toBe(0); // API mock call bypassed in dry-run
      expect(result.totalInserted).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("3. Ingestion Failure & Runner Status Handling", () => {
    it("should return FAILED status and not mark success when all 4 Seoul categories fail with 500 error", async () => {
      const origKey = process.env.KTO_API_KEY;
      const origUrl = process.env.SUPABASE_URL;
      const origServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.KTO_API_KEY = "mock_key";
      process.env.SUPABASE_URL = "http://localhost:54321";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_role_key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => `<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>`,
      });
      vi.stubGlobal("fetch", mockFetch);

      try {
        const result = await ingestKtoPlaces({
          dryRun: false,
          city: "SEOUL",
          limitPerCategory: 10,
        });

        expect(result.status).toBe("FAILED");
        expect(result.totalFetched).toBe(0);
        expect(result.totalFailed).toBe(4);
        expect(result.errors).toHaveLength(4);
        expect(result.errors[0]).toContain("[SEOUL/ACCOMMODATION] Fetch failed:");
        expect(result.errors[0]).toContain("status 500");
        expect(result.errors[0]).toContain("Code: 30, Msg: SERVICE ERROR");
        expect(result.errors[0]).not.toContain("mock_key");
        expect(result.errors[0]).not.toContain("mock_role_key");
      } finally {
        process.env.KTO_API_KEY = origKey;
        process.env.SUPABASE_URL = origUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceRole;
        vi.restoreAllMocks();
      }
    });

    it("should return FAILED status when API returns HTTP 200 with invalid response body structure", async () => {
      const origKey = process.env.KTO_API_KEY;
      const origUrl = process.env.SUPABASE_URL;
      const origServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.KTO_API_KEY = "mock_key";
      process.env.SUPABASE_URL = "http://localhost:54321";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_role_key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: "body" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      try {
        const result = await ingestKtoPlaces({
          dryRun: false,
          city: "SEOUL",
          limitPerCategory: 10,
        });

        expect(result.status).toBe("FAILED");
        expect(result.totalFetched).toBe(0);
        expect(result.totalFailed).toBe(4);
        expect(result.errors).toHaveLength(4);
        expect(result.errors[0]).toContain("missing response object");
      } finally {
        process.env.KTO_API_KEY = origKey;
        process.env.SUPABASE_URL = origUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceRole;
        vi.restoreAllMocks();
      }
    });

    it("should handle valid empty items list as COMPLETED with 0 fetched items", async () => {
      const origKey = process.env.KTO_API_KEY;
      const origUrl = process.env.SUPABASE_URL;
      const origServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.KTO_API_KEY = "mock_key";
      process.env.SUPABASE_URL = "http://localhost:54321";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_role_key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: "0000", resultMsg: "OK" },
            body: { items: "", numOfRows: 10, pageNo: 1, totalCount: 0 },
          },
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      try {
        const result = await ingestKtoPlaces({
          dryRun: false,
          city: "SEOUL",
          limitPerCategory: 10,
        });

        expect(result.status).toBe("COMPLETED");
        expect(result.totalFetched).toBe(0);
        expect(result.totalFailed).toBe(0);
        expect(result.allCategoriesZeroWarning).toBe(true);
        expect(result.errors).toHaveLength(0);
      } finally {
        process.env.KTO_API_KEY = origKey;
        process.env.SUPABASE_URL = origUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceRole;
        vi.restoreAllMocks();
      }
    });

    it("should fail when totalCount > 0 but parsed items is 0", async () => {
      const origKey = process.env.KTO_API_KEY;
      const origUrl = process.env.SUPABASE_URL;
      const origServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.KTO_API_KEY = "mock_key";
      process.env.SUPABASE_URL = "http://localhost:54321";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_role_key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: "0000", resultMsg: "OK" },
            body: { items: "", numOfRows: 10, pageNo: 1, totalCount: 15 },
          },
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      try {
        const result = await ingestKtoPlaces({
          dryRun: false,
          city: "SEOUL",
          limitPerCategory: 10,
        });

        expect(result.status).toBe("FAILED");
        expect(result.totalFetched).toBe(0);
        expect(result.totalFailed).toBe(4);
        expect(result.errors[0]).toContain("KTO API reported totalCount=15 but 0 items were parsed");
      } finally {
        process.env.KTO_API_KEY = origKey;
        process.env.SUPABASE_URL = origUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceRole;
        vi.restoreAllMocks();
      }
    });

    it("should not leak secret credentials in debug logs when debug mode is active", async () => {
      const origKey = process.env.KTO_API_KEY;
      const origUrl = process.env.SUPABASE_URL;
      const origServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const origDebug = process.env.KTO_INGEST_DEBUG;

      process.env.KTO_API_KEY = "SUPER_SECRET_KTO_KEY";
      process.env.SUPABASE_URL = "http://localhost:54321";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "SUPER_SECRET_SUPABASE_KEY";
      process.env.KTO_INGEST_DEBUG = "true";

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: {
            header: { resultCode: "0000", resultMsg: "OK" },
            body: { items: "", numOfRows: 10, pageNo: 1, totalCount: 0 },
          },
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      try {
        await ingestKtoPlaces({
          dryRun: true,
          city: "SEOUL",
          limitPerCategory: 10,
        });

        for (const call of consoleSpy.mock.calls) {
          const logMsg = call.join(" ");
          expect(logMsg).not.toContain("SUPER_SECRET_KTO_KEY");
          expect(logMsg).not.toContain("SUPER_SECRET_SUPABASE_KEY");
        }
      } finally {
        process.env.KTO_API_KEY = origKey;
        process.env.SUPABASE_URL = origUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceRole;
        process.env.KTO_INGEST_DEBUG = origDebug;
        consoleSpy.mockRestore();
        vi.restoreAllMocks();
      }
    });
  });
});
