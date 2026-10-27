import { PostcodeService, PostcodeError } from "../../services/postcode.service";
import { cacheService } from "../../services/infrastructure/redis-cache.service";

describe("PostcodeService Unit Tests (Mocked HTTP Layer)", () => {
  const originalEnv = process.env;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    await cacheService.clear();
    process.env = {
      ...originalEnv,
      POSTCODE_API_KEY: "nipost_test_dummy_key_12345678",
      POSTCODE_BASE_URL: "https://api.postcode.gov.ng",
    };
  });

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
    process.env = originalEnv;
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  describe("lookupPostcode", () => {
    test("200 OK: successfully resolves valid postcode and caches for 10 minutes", async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          data: {
            postcode: "EK-01-A03-FK-01",
            valid: true,
          },
        }),
      } as any);

      const result = await PostcodeService.lookupPostcode("ek-01-a03-fk-01", 1);
      expect(result.valid).toBe(true);
      expect(result.canonical).toBe("EK-01-A03-FK-01");
      expect(result.compact).toBe("EK01A03FK01");
      expect(result.prefix).toBe("EK-01");
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Verify cached: Second call must return from cache without calling fetch
      const cachedResult = await PostcodeService.lookupPostcode("EK01A03FK01", 1);
      expect(cachedResult.canonical).toBe("EK-01-A03-FK-01");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    test("404 Not Found: throws 404 and caches negative lookup for 2 minutes", async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 404,
        ok: false,
        text: async () => JSON.stringify({ error: { code: "not_found", message: "Not found" } }),
      } as any);

      await expect(PostcodeService.lookupPostcode("EK-01-A03-FK-01", 1)).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Second call should fail from negative cache without calling fetch again
      await expect(PostcodeService.lookupPostcode("EK-01-A03-FK-01", 1)).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    test("401/403/402: maps upstream auth/credit failure to 503 and does not cache", async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 403,
        ok: false,
        text: async () => JSON.stringify({ error: { code: "level_not_granted", message: "Forbidden" } }),
      } as any);

      await expect(PostcodeService.lookupPostcode("EK-01-A03-FK-01", 1)).rejects.toMatchObject({
        statusCode: 503,
        code: "UPSTREAM_AUTH_ERROR",
        isUpstreamUnavailable: true,
      });

      // Confirm not cached: next call should execute fetch again
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ data: { postcode: "EK-01-A03-FK-01", valid: true } }),
      } as any);

      const retryRes = await PostcodeService.lookupPostcode("EK-01-A03-FK-01", 1);
      expect(retryRes.valid).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    test("429 Rate Limited: preserves Retry-After header and does not cache", async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 429,
        ok: false,
        headers: new Headers({ "Retry-After": "15" }),
      } as any);

      await expect(PostcodeService.lookupPostcode("EK-01-A03-FK-01", 1)).rejects.toMatchObject({
        statusCode: 429,
        code: "RATE_LIMITED",
        retryAfter: 15,
      });
    });

    test("500 Server Error: retries once with backoff before throwing 503", async () => {
      fetchSpy = jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({ status: 502, ok: false } as any)
        .mockResolvedValueOnce({ status: 503, ok: false } as any);

      await expect(PostcodeService.lookupPostcode("EK-01-A03-FK-01", 1)).rejects.toMatchObject({
        statusCode: 503,
        code: "UPSTREAM_SERVER_ERROR",
        isUpstreamUnavailable: true,
      });
      expect(fetchSpy).toHaveBeenCalledTimes(2); // Initial attempt + 1 retry
    });

    test("Timeout: retries once on abort/timeout before throwing 503", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";

      fetchSpy = jest.spyOn(global, "fetch")
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError);

      await expect(PostcodeService.lookupPostcode("EK-01-A03-FK-01", 1)).rejects.toMatchObject({
        statusCode: 503,
        code: "UPSTREAM_TIMEOUT",
        isUpstreamUnavailable: true,
      });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    test("Look-alike typo returns 400 with suggestion without calling API", async () => {
      fetchSpy = jest.spyOn(global, "fetch");

      await expect(PostcodeService.lookupPostcode("EK-O1-A03-FK-01", 1)).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_FORMAT",
        suggestion: "EK-01-A03-FK-01",
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("autocomplete", () => {
    test("returns suggestions and caches response for 60s", async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          data: {
            segment: "district",
            suggestions: [
              { code: "A01", label: "Ado Central" },
              { code: "A02", label: "Ado North" },
            ],
          },
        }),
      } as any);

      const res = await PostcodeService.autocomplete("EK 01 A");
      expect(res.segment).toBe("district");
      expect(res.suggestions).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Cached call
      const cached = await PostcodeService.autocomplete("EK 01 A");
      expect(cached.suggestions).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("resolveAddressTrust (Order placement trust guard)", () => {
    test("valid verified postcode returns addressSource = 'postcode'", async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ data: { postcode: "EK-01-A03-FK-01", valid: true } }),
      } as any);

      const res = await PostcodeService.resolveAddressTrust("EK-01-A03-FK-01");
      expect(res.verified).toBe(true);
      expect(res.addressSource).toBe("postcode");
      expect(res.deliveryPostcode).toBe("EK-01-A03-FK-01");
      expect(res.prefix).toBe("EK-01");
    });

    test("silent fallback to manual entry if upstream is 503 / down", async () => {
      fetchSpy = jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({ status: 503, ok: false } as any)
        .mockResolvedValueOnce({ status: 503, ok: false } as any);

      const res = await PostcodeService.resolveAddressTrust("EK-01-A03-FK-01");
      expect(res.verified).toBe(false);
      expect(res.addressSource).toBe("manual");
      expect(res.deliveryPostcode).toBeNull();
      expect(res.prefix).toBeNull();
    });

    test("rejects order if postcode is explicitly not found (404)", async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        status: 404,
        ok: false,
        text: async () => JSON.stringify({ error: { code: "not_found" } }),
      } as any);

      await expect(PostcodeService.resolveAddressTrust("EK-01-A03-FK-01")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    test("empty claimed postcode defaults safely to manual", async () => {
      const res = await PostcodeService.resolveAddressTrust("");
      expect(res.verified).toBe(false);
      expect(res.addressSource).toBe("manual");
      expect(res.deliveryPostcode).toBeNull();
    });
  });
});
