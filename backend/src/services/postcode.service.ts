import {
  normalizePostcode,
  validatePartialPostcode,
  extractPostcodePrefix,
} from "../utils/postcode.util";
import { cacheService } from "./infrastructure/redis-cache.service";

export interface PostcodeLookupResult {
  postcode: string;
  valid: boolean;
  canonical: string;
  compact: string;
  prefix: string;
  rawData?: any;
}

export interface PostcodeAutocompleteSuggestion {
  code: string;
  label: string;
}

export interface PostcodeAutocompleteResult {
  segment: string;
  suggestions: PostcodeAutocompleteSuggestion[];
}

export class PostcodeError extends Error {
  public statusCode: number;
  public code: string;
  public retryAfter?: number;
  public suggestion?: string;
  public isUpstreamUnavailable: boolean;

  constructor(options: {
    message: string;
    statusCode: number;
    code: string;
    retryAfter?: number;
    suggestion?: string;
    isUpstreamUnavailable?: boolean;
  }) {
    super(options.message);
    this.name = "PostcodeError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.retryAfter = options.retryAfter;
    this.suggestion = options.suggestion;
    this.isUpstreamUnavailable = !!options.isUpstreamUnavailable;
    Object.setPrototypeOf(this, PostcodeError.prototype);
  }
}

export class PostcodeService {
  private static getBaseUrl(): string {
    return process.env.POSTCODE_BASE_URL || "https://api.postcode.gov.ng";
  }

  private static getApiKey(): string | undefined {
    return process.env.POSTCODE_API_KEY;
  }

  /**
   * Masks API key for safe logging
   */
  private static maskKey(key: string | undefined): string {
    if (!key) return "[NOT_SET]";
    if (key.length <= 10) return "nipost_***";
    return `${key.slice(0, 10)}...${key.slice(-4)}`;
  }

  /**
   * Native fetch wrapper with 5s timeout and at most 1 retry on 5xx/timeout only.
   * Never retries 4xx.
   */
  private static async executeFetch(url: string, apiKey: string): Promise<Response> {
    const timeoutMs = 5000;
    const maxAttempts = 2; // initial + 1 retry on 5xx/timeout

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
            "Accept": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Retry on 5xx only
        if (response.status >= 500 && attempt < maxAttempts) {
          console.warn(`[NIPOST] Upstream ${response.status} on attempt ${attempt}. Retrying once in 500ms...`);
          await new Promise((res) => setTimeout(res, 500));
          continue;
        }

        return response;
      } catch (err: any) {
        clearTimeout(timer);
        const isAbort = err.name === "AbortError" || err.message?.includes("aborted");

        if (attempt < maxAttempts) {
          console.warn(`[NIPOST] ${isAbort ? "Timeout" : err.message} on attempt ${attempt}. Retrying once in 500ms...`);
          await new Promise((res) => setTimeout(res, 500));
          continue;
        }

        throw new PostcodeError({
          message: "Postcode verification service is temporarily unavailable",
          statusCode: 503,
          code: "UPSTREAM_TIMEOUT",
          isUpstreamUnavailable: true,
        });
      }
    }

    throw new PostcodeError({
      message: "Postcode verification service is temporarily unavailable",
      statusCode: 503,
      code: "UPSTREAM_UNAVAILABLE",
      isUpstreamUnavailable: true,
    });
  }

  /**
   * Segment-aware Autocomplete
   * Queries: GET /v1/search/autocomplete?q=...
   * Caches short-term (60s) to keep typing responsive while respecting rate limits.
   */
  static async autocomplete(partialQuery: string): Promise<PostcodeAutocompleteResult> {
    const validation = validatePartialPostcode(partialQuery);
    if (!validation.isValid) {
      throw new PostcodeError({
        message: validation.error || "Invalid search query",
        statusCode: 400,
        code: "INVALID_QUERY",
      });
    }

    const cacheKey = `postcode:ac:${validation.normalized}`;
    const cached = await cacheService.get<PostcodeAutocompleteResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn(`[NIPOST] POSTCODE_API_KEY is not configured (${this.maskKey(apiKey)})`);
      throw new PostcodeError({
        message: "Postcode verification service is temporarily unavailable",
        statusCode: 503,
        code: "KEY_NOT_CONFIGURED",
        isUpstreamUnavailable: true,
      });
    }

    const url = `${this.getBaseUrl()}/v1/search/autocomplete?q=${encodeURIComponent(validation.normalized)}`;
    const response = await this.executeFetch(url, apiKey);

    if (response.status === 401 || response.status === 403 || response.status === 402) {
      const errBody = await response.text().catch(() => "");
      console.error(`[NIPOST Auth/Credit Error] HTTP ${response.status}: ${errBody}`);
      throw new PostcodeError({
        message: "Postcode verification service is temporarily unavailable",
        statusCode: 503,
        code: "UPSTREAM_AUTH_ERROR",
        isUpstreamUnavailable: true,
      });
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
      throw new PostcodeError({
        message: "Rate limit exceeded. Please try again shortly.",
        statusCode: 429,
        code: "RATE_LIMITED",
        retryAfter,
      });
    }

    if (response.status >= 500) {
      throw new PostcodeError({
        message: "Postcode verification service is temporarily unavailable",
        statusCode: 503,
        code: "UPSTREAM_SERVER_ERROR",
        isUpstreamUnavailable: true,
      });
    }

    if (!response.ok) {
      throw new PostcodeError({
        message: "Postcode search failed",
        statusCode: response.status,
        code: "UPSTREAM_ERROR",
        isUpstreamUnavailable: response.status >= 500,
      });
    }

    const json = await response.json();
    const result: PostcodeAutocompleteResult = {
      segment: json.data?.segment || validation.activeSegment,
      suggestions: Array.isArray(json.data?.suggestions) ? json.data.suggestions : [],
    };

    // Cache autocomplete results for 60 seconds
    await cacheService.set(cacheKey, result, 60);
    return result;
  }

  /**
   * Postcode Verification (Level 1)
   * Queries: GET /v1/lookup?code=...&level=1
   * Cache rules:
   * - Positive lookup (valid: true): 10 minutes (600s)
   * - Negative lookup (404 / valid: false): 2 minutes (120s)
   * - 5xx / 429 / timeouts: Never cached
   */
  static async lookupPostcode(rawCode: string, level: number = 1): Promise<PostcodeLookupResult> {
    const norm = normalizePostcode(rawCode);
    if (!norm.isValid || !norm.canonical || !norm.compact || !norm.prefix) {
      throw new PostcodeError({
        message: norm.error || "Invalid postcode format",
        statusCode: 400,
        code: "INVALID_FORMAT",
        suggestion: norm.suggestion,
      });
    }

    const cacheKey = `postcode:lookup:${norm.canonical}`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      if (cached.notFound) {
        throw new PostcodeError({
          message: "Postcode not found in national registry",
          statusCode: 404,
          code: "NOT_FOUND",
        });
      }
      return cached as PostcodeLookupResult;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn(`[NIPOST] POSTCODE_API_KEY is not configured (${this.maskKey(apiKey)})`);
      throw new PostcodeError({
        message: "Postcode verification service is temporarily unavailable",
        statusCode: 503,
        code: "KEY_NOT_CONFIGURED",
        isUpstreamUnavailable: true,
      });
    }

    const url = `${this.getBaseUrl()}/v1/lookup?code=${encodeURIComponent(norm.canonical)}&level=1`;
    const response = await this.executeFetch(url, apiKey);

    // 404: Not found
    if (response.status === 404) {
      // Cache negative lookup for 2 minutes
      await cacheService.set(cacheKey, { notFound: true }, 120);
      throw new PostcodeError({
        message: "Postcode not found in national registry",
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    // Auth / Scope / Credits errors
    if (response.status === 401 || response.status === 403 || response.status === 402) {
      const errText = await response.text().catch(() => "");
      console.error(`[NIPOST Auth/Credit Error] HTTP ${response.status}: ${errText}`);
      throw new PostcodeError({
        message: "Postcode verification service is temporarily unavailable",
        statusCode: 503,
        code: "UPSTREAM_AUTH_ERROR",
        isUpstreamUnavailable: true,
      });
    }

    // 429: Rate limited
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
      throw new PostcodeError({
        message: "Rate limit exceeded. Please try again shortly.",
        statusCode: 429,
        code: "RATE_LIMITED",
        retryAfter,
      });
    }

    // 5xx: Server errors
    if (response.status >= 500) {
      throw new PostcodeError({
        message: "Postcode verification service is temporarily unavailable",
        statusCode: 503,
        code: "UPSTREAM_SERVER_ERROR",
        isUpstreamUnavailable: true,
      });
    }

    if (!response.ok) {
      throw new PostcodeError({
        message: `Postcode lookup failed with status ${response.status}`,
        statusCode: response.status,
        code: "UPSTREAM_ERROR",
        isUpstreamUnavailable: response.status >= 500,
      });
    }

    const json = await response.json();
    const data = json?.data;

    if (!data || data.valid !== true) {
      // Cache invalid/unfound response for 2 minutes
      await cacheService.set(cacheKey, { notFound: true }, 120);
      throw new PostcodeError({
        message: "Postcode is not valid in national registry",
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    const result: PostcodeLookupResult = {
      postcode: data.postcode || norm.canonical,
      valid: true,
      canonical: norm.canonical,
      compact: norm.compact,
      prefix: norm.prefix,
      rawData: data,
    };

    // Cache positive lookup for 10 minutes (600s)
    await cacheService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Order Placement Trust Guard:
   * Verifies postcode against cache/upstream.
   * If upstream is down/5xx/timeout/key missing -> silently falls back to manual per Decision 3.
   * If code is explicitly not found (404) or invalid (400) -> throws 400 error.
   */
  static async resolveAddressTrust(claimedPostcode?: string | null): Promise<{
    verified: boolean;
    deliveryPostcode: string | null;
    prefix: string | null;
    addressSource: "postcode" | "manual";
  }> {
    if (!claimedPostcode || !claimedPostcode.trim()) {
      return {
        verified: false,
        deliveryPostcode: null,
        prefix: null,
        addressSource: "manual",
      };
    }

    try {
      const lookup = await this.lookupPostcode(claimedPostcode, 1);
      return {
        verified: true,
        deliveryPostcode: lookup.canonical,
        prefix: lookup.prefix,
        addressSource: "postcode",
      };
    } catch (err: any) {
      // Upstream down / timeout / credit issue -> silent fallback per Decision 3
      if (err instanceof PostcodeError && err.isUpstreamUnavailable) {
        console.warn(`[NIPOST Fallback] Upstream unavailable (${err.code}). Silently falling back to manual entry.`);
        return {
          verified: false,
          deliveryPostcode: null,
          prefix: null,
          addressSource: "manual",
        };
      }

      // Explicit invalid structure or not found in registry -> Reject order
      if (err instanceof PostcodeError && (err.statusCode === 404 || err.statusCode === 400)) {
        throw err;
      }

      // Default fallback for unexpected errors
      console.error("[NIPOST Unexpected Error]", err);
      return {
        verified: false,
        deliveryPostcode: null,
        prefix: null,
        addressSource: "manual",
      };
    }
  }
}
