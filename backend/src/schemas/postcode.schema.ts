import { z } from "zod";
import { normalizePostcode, validatePartialPostcode } from "../utils/postcode.util";

export const autocompleteQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Search query 'q' cannot be empty")
    .max(20, "Search query 'q' is too long")
    .refine((val) => validatePartialPostcode(val).isValid, {
      message: "Search query contains invalid characters or structure",
    }),
});

export const verifyPostcodeQuerySchema = z.object({
  code: z
    .string()
    .min(1, "Postcode 'code' is required")
    .max(25, "Postcode 'code' is too long")
    .superRefine((val, ctx) => {
      const result = normalizePostcode(val);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || "Invalid postcode format",
          params: {
            suggestion: result.suggestion,
          },
        });
      }
    }),
});
