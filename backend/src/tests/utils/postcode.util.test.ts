import {
  normalizePostcode,
  validatePartialPostcode,
  extractPostcodePrefix,
} from "../../utils/postcode.util";
import {
  autocompleteQuerySchema,
  verifyPostcodeQuerySchema,
} from "../../schemas/postcode.schema";

describe("Postcode Utility - Table-Driven Unit Tests", () => {
  describe("normalizePostcode", () => {
    // 1. Valid inputs in various formats
    test.each([
      {
        input: "EK-01-A03-FK-01",
        expectedCanonical: "EK-01-A03-FK-01",
        expectedCompact: "EK01A03FK01",
        expectedPrefix: "EK-01",
        desc: "canonical hyphenated",
      },
      {
        input: "ek-01-a03-fk-01",
        expectedCanonical: "EK-01-A03-FK-01",
        expectedCompact: "EK01A03FK01",
        expectedPrefix: "EK-01",
        desc: "lowercase hyphenated",
      },
      {
        input: "EK 01 A03 FK 01",
        expectedCanonical: "EK-01-A03-FK-01",
        expectedCompact: "EK01A03FK01",
        expectedPrefix: "EK-01",
        desc: "space separated",
      },
      {
        input: "EK01A03FK01",
        expectedCanonical: "EK-01-A03-FK-01",
        expectedCompact: "EK01A03FK01",
        expectedPrefix: "EK-01",
        desc: "compact uppercase",
      },
      {
        input: "ek01a03fk01",
        expectedCanonical: "EK-01-A03-FK-01",
        expectedCompact: "EK01A03FK01",
        expectedPrefix: "EK-01",
        desc: "compact lowercase",
      },
      {
        input: "  LA-11-W06-TC-10  ",
        expectedCanonical: "LA-11-W06-TC-10",
        expectedCompact: "LA11W06TC10",
        expectedPrefix: "LA-11",
        desc: "hyphenated with extra whitespace",
      },
      {
        input: "FC-01-A01-KP-27",
        expectedCanonical: "FC-01-A01-KP-27",
        expectedCompact: "FC01A01KP27",
        expectedPrefix: "FC-01",
        desc: "NIPOST sandbox test postcode",
      },
    ])("should successfully normalize $desc: $input", ({ input, expectedCanonical, expectedCompact, expectedPrefix }) => {
      const res = normalizePostcode(input);
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe(expectedCanonical);
      expect(res.compact).toBe(expectedCompact);
      expect(res.prefix).toBe(expectedPrefix);
      expect(res.segments).toBeDefined();
      expect(res.segments?.state).toBe(expectedCanonical.split("-")[0]);
      expect(res.segments?.lga).toBe(expectedCanonical.split("-")[1]);
      expect(res.segments?.district).toBe(expectedCanonical.split("-")[2]);
      expect(res.segments?.area).toBe(expectedCanonical.split("-")[3]);
      expect(res.segments?.unit).toBe(expectedCanonical.split("-")[4]);
    });

    // 2. Look-alike character detection ("Did you mean...")
    test.each([
      {
        input: "EK-O1-A03-FK-01", // 'O' in LGA instead of '0'
        expectedSuggestion: "EK-01-A03-FK-01",
        desc: "letter 'O' in LGA segment",
      },
      {
        input: "0K-01-A03-FK-01", // '0' in State instead of 'O'
        expectedSuggestion: "OK-01-A03-FK-01",
        desc: "digit '0' in State segment",
      },
      {
        input: "EK-01-A03-FK-OI", // 'O' and 'I' in building unit instead of '01'
        expectedSuggestion: "EK-01-A03-FK-01",
        desc: "letters 'O' and 'I' in building unit",
      },
      {
        input: "EK-01-A03-5K-01", // '5' in Area segment instead of 'S'
        expectedSuggestion: "EK-01-A03-SK-01",
        desc: "digit '5' in Area segment",
      },
      {
        input: "EK-01-A03-8K-01", // '8' in Area segment instead of 'B'
        expectedSuggestion: "EK-01-A03-BK-01",
        desc: "digit '8' in Area segment",
      },
      {
        input: "EKO1A03FKO1", // compact with look-alikes
        expectedSuggestion: "EK-01-A03-FK-01",
        desc: "compact with multiple 'O' characters in numeric positions",
      },
    ])("should detect look-alikes and suggest correction for $desc", ({ input, expectedSuggestion }) => {
      const res = normalizePostcode(input);
      expect(res.isValid).toBe(false);
      expect(res.suggestion).toBe(expectedSuggestion);
      expect(res.error).toContain(`Did you mean "${expectedSuggestion}"?`);
    });

    // 3. Invalid inputs
    test.each([
      { input: "", expectedError: "Postcode cannot be empty", desc: "empty string" },
      { input: "   ", expectedError: "Postcode cannot be empty", desc: "whitespace string" },
      { input: null as any, expectedError: "Postcode is required", desc: "null input" },
      { input: undefined as any, expectedError: "Postcode is required", desc: "undefined input" },
      { input: "EK-00-A03-FK-01", expectedError: "cannot be 00", desc: "LGA segment 00" },
      { input: "EK-01-A03-FK-00", expectedError: "cannot be 00", desc: "Unit segment 00" },
      { input: "EK-01-A03-FK", expectedError: "Invalid postcode structure", desc: "too short (4 segments)" },
      { input: "EK-01-A03-FK-01-99", expectedError: "Invalid postcode structure", desc: "too long (6 segments)" },
      { input: "EK-01-A03-FK-01@!", expectedError: "invalid characters", desc: "illegal punctuation" },
      { input: "SOMEOTHERSTRING", expectedError: "Invalid postcode structure", desc: "arbitrary alphanumeric string" },
    ])("should reject invalid input: $desc", ({ input, expectedError }) => {
      const res = normalizePostcode(input);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain(expectedError);
    });
  });

  describe("extractPostcodePrefix", () => {
    test("extracts prefix from formatted postcode", () => {
      expect(extractPostcodePrefix("EK-01-A03-FK-01")).toBe("EK-01");
    });

    test("extracts prefix from compact postcode", () => {
      expect(extractPostcodePrefix("la11w06tc10")).toBe("LA-11");
    });

    test("extracts prefix directly from 4-character prefix string", () => {
      expect(extractPostcodePrefix("FC-01")).toBe("FC-01");
      expect(extractPostcodePrefix("fc01")).toBe("FC-01");
      expect(extractPostcodePrefix("FC 01")).toBe("FC-01");
    });

    test("returns null for invalid prefix candidate", () => {
      expect(extractPostcodePrefix("INVALID")).toBeNull();
      expect(extractPostcodePrefix("00-01")).toBeNull();
    });
  });

  describe("validatePartialPostcode", () => {
    test.each([
      { q: "E", expectedSegment: "state", expectedNormalized: "E" },
      { q: "EK", expectedSegment: "state", expectedNormalized: "EK" },
      { q: "EK 0", expectedSegment: "lga", expectedNormalized: "EK 0" },
      { q: "EK 01", expectedSegment: "lga", expectedNormalized: "EK 01" },
      { q: "EK-01-A", expectedSegment: "district", expectedNormalized: "EK 01 A" },
      { q: "EK 01 A03", expectedSegment: "district", expectedNormalized: "EK 01 A03" },
      { q: "EK 01 A03 F", expectedSegment: "area", expectedNormalized: "EK 01 A03 F" },
      { q: "EK 01 A03 FK", expectedSegment: "area", expectedNormalized: "EK 01 A03 FK" },
      { q: "EK 01 A03 FK 0", expectedSegment: "unit", expectedNormalized: "EK 01 A03 FK 0" },
    ])("identifies active segment and normalizes query: $q", ({ q, expectedSegment, expectedNormalized }) => {
      const res = validatePartialPostcode(q);
      expect(res.isValid).toBe(true);
      expect(res.activeSegment).toBe(expectedSegment);
      expect(res.normalized).toBe(expectedNormalized);
    });

    test("rejects partial queries that exceed 11 compact characters", () => {
      const res = validatePartialPostcode("EK01A03FK019999");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("exceeds maximum length");
    });

    test("rejects partial queries with illegal punctuation", () => {
      const res = validatePartialPostcode("EK*01");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("invalid characters");
    });
  });

  describe("Zod Postcode Schemas", () => {
    test("autocompleteQuerySchema validates correct query", () => {
      const parsed = autocompleteQuerySchema.safeParse({ q: "EK 01 A" });
      expect(parsed.success).toBe(true);
    });

    test("autocompleteQuerySchema rejects empty or invalid query", () => {
      const empty = autocompleteQuerySchema.safeParse({ q: "" });
      expect(empty.success).toBe(false);

      const invalid = autocompleteQuerySchema.safeParse({ q: "EK$$$" });
      expect(invalid.success).toBe(false);
    });

    test("verifyPostcodeQuerySchema parses valid postcode", () => {
      const parsed = verifyPostcodeQuerySchema.safeParse({ code: "EK-01-A03-FK-01" });
      expect(parsed.success).toBe(true);
    });

    test("verifyPostcodeQuerySchema rejects invalid postcode and preserves look-alike suggestion", () => {
      const parsed = verifyPostcodeQuerySchema.safeParse({ code: "EK-O1-A03-FK-01" });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('Did you mean "EK-01-A03-FK-01"?');
      }
    });
  });
});
