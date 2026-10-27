/**
 * Nigeria National Digital Alphanumeric Postcode (NIPOST) Utilities
 *
 * Postcode Structure: AA-99-H77-BB-55 (11 alphanumeric characters, 15 with hyphens)
 * - Segment 1 (State): 2 uppercase alpha characters (e.g., 'EK')
 * - Segment 2 (LGA): 2 numeric digits, zero-filled 01-99 (e.g., '01')
 * - Segment 3 (District): 3 alphanumeric characters (e.g., 'A03')
 * - Segment 4 (Area): 2 uppercase alpha characters (e.g., 'FK')
 * - Segment 5 (Building Unit): 2 numeric digits, zero-filled 01-99 (e.g., '01')
 *
 * Canonical Prefix: AA-99 (first two segments e.g. 'EK-01')
 */

export interface PostcodeSegments {
  state: string;
  lga: string;
  district: string;
  area: string;
  unit: string;
}

export interface PostcodeValidationResult {
  isValid: boolean;
  canonical?: string;       // AA-99-H77-BB-55
  compact?: string;         // AA99H77BB55
  display?: string;         // AA 99 H77 BB 55
  prefix?: string;          // AA-99
  segments?: PostcodeSegments;
  error?: string;
  suggestion?: string;      // "Did you mean..." when look-alike characters detected
}

export interface PartialPostcodeResult {
  isValid: boolean;
  raw: string;
  normalized: string;
  activeSegment: 'state' | 'lga' | 'district' | 'area' | 'unit';
  error?: string;
  suggestion?: string;
}

// Look-alike mappings
const DIGIT_TO_ALPHA: Record<string, string> = {
  '0': 'O',
  '1': 'I',
  '5': 'S',
  '8': 'B',
};

const ALPHA_TO_DIGIT: Record<string, string> = {
  'O': '0',
  'I': '1',
  'L': '1',
  'S': '5',
  'B': '8',
};

const STATE_REGEX = /^[A-Z]{2}$/;
const LGA_REGEX = /^(0[1-9]|[1-9][0-9])$/; // 01 - 99, never 00
const DISTRICT_REGEX = /^[A-Z0-9]{3}$/;
const AREA_REGEX = /^[A-Z]{2}$/;
const UNIT_REGEX = /^(0[1-9]|[1-9][0-9])$/; // 01 - 99, never 00

/**
 * Splits input into 5 candidate raw segments either from delimiters or compact string
 */
function extractRawSegments(cleaned: string): string[] | null {
  // If separated by hyphens or spaces
  if (/[\s\-]/.test(cleaned)) {
    const parts = cleaned.split(/[\s\-]+/).filter(Boolean);
    if (parts.length === 5) {
      return parts;
    }
    return null;
  }

  // Compact string (exactly 11 characters)
  if (cleaned.length === 11) {
    return [
      cleaned.slice(0, 2),
      cleaned.slice(2, 4),
      cleaned.slice(4, 7),
      cleaned.slice(7, 9),
      cleaned.slice(9, 11),
    ];
  }

  return null;
}

/**
 * Checks for look-alike character confusion in position-specific segments
 */
function detectLookAlike(parts: string[]): { hasLookAlike: boolean; corrected: string[] } {
  const corrected = [...parts];
  let hasLookAlike = false;

  const fixAlpha = (str: string): string => {
    let res = '';
    for (const char of str.toUpperCase()) {
      if (DIGIT_TO_ALPHA[char]) {
        res += DIGIT_TO_ALPHA[char];
        hasLookAlike = true;
      } else {
        res += char;
      }
    }
    return res;
  };

  const fixNumeric = (str: string): string => {
    let res = '';
    for (const char of str.toUpperCase()) {
      if (ALPHA_TO_DIGIT[char]) {
        res += ALPHA_TO_DIGIT[char];
        hasLookAlike = true;
      } else {
        res += char;
      }
    }
    return res;
  };

  // Segment 0: State (alpha)
  corrected[0] = fixAlpha(parts[0]);

  // Segment 1: LGA (numeric)
  corrected[1] = fixNumeric(parts[1]);

  // Segment 2: District (usually Letter + 2 Digits)
  if (parts[2].length === 3) {
    const char0 = fixAlpha(parts[2][0]);
    const char1 = fixNumeric(parts[2][1]);
    const char2 = fixNumeric(parts[2][2]);
    corrected[2] = char0 + char1 + char2;
  }

  // Segment 3: Area (alpha)
  corrected[3] = fixAlpha(parts[3]);

  // Segment 4: Building unit (numeric)
  corrected[4] = fixNumeric(parts[4]);

  return { hasLookAlike, corrected };
}

/**
 * Normalizes and validates a Nigerian Postcode offline.
 * Does not replace look-alike characters silently; produces a "Did you mean" suggestion.
 */
export function normalizePostcode(rawInput: string | undefined | null): PostcodeValidationResult {
  if (rawInput === undefined || rawInput === null) {
    return {
      isValid: false,
      error: 'Postcode is required',
    };
  }

  if (typeof rawInput !== 'string') {
    return {
      isValid: false,
      error: 'Postcode must be a string',
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Postcode cannot be empty',
    };
  }

  // Check for invalid punctuation other than hyphen or space
  if (/[^A-Za-z0-9\s\-]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Postcode contains invalid characters (letters, numbers, hyphens, and spaces only)',
    };
  }

  const rawParts = extractRawSegments(trimmed);

  if (!rawParts) {
    // Check if user provided an 11-char string with look-alikes or bad separators
    const compactOnly = trimmed.replace(/[\s\-]/g, '');
    if (compactOnly.length === 11) {
      const parts = [
        compactOnly.slice(0, 2),
        compactOnly.slice(2, 4),
        compactOnly.slice(4, 7),
        compactOnly.slice(7, 9),
        compactOnly.slice(9, 11),
      ];
      const { hasLookAlike, corrected } = detectLookAlike(parts);
      if (hasLookAlike) {
        const suggested = corrected.join('-');
        return {
          isValid: false,
          error: `Invalid postcode format. Did you mean "${suggested}"?`,
          suggestion: suggested,
        };
      }
    }

    return {
      isValid: false,
      error: `Invalid postcode structure. Expected 11 alphanumeric characters across 5 segments (template: AA-99-H77-BB-55). Received: "${trimmed}"`,
    };
  }

  // Check segment lengths
  const expectedLengths = [2, 2, 3, 2, 2];
  for (let i = 0; i < 5; i++) {
    if (rawParts[i].length !== expectedLengths[i]) {
      return {
        isValid: false,
        error: `Segment ${i + 1} has invalid length (${rawParts[i].length}). Expected length ${expectedLengths[i]} (segment: "${rawParts[i]}").`,
      };
    }
  }

  const upperParts = rawParts.map((p) => p.toUpperCase());

  // Check for look-alike characters before evaluating validity
  const { hasLookAlike, corrected } = detectLookAlike(upperParts);
  if (hasLookAlike) {
    const isCandidateValid =
      STATE_REGEX.test(corrected[0]) &&
      LGA_REGEX.test(corrected[1]) &&
      DISTRICT_REGEX.test(corrected[2]) &&
      AREA_REGEX.test(corrected[3]) &&
      UNIT_REGEX.test(corrected[4]);

    if (isCandidateValid) {
      const suggested = corrected.join('-');
      return {
        isValid: false,
        error: `Invalid postcode format. Did you mean "${suggested}"?`,
        suggestion: suggested,
      };
    }
  }

  // Validate strict segment regex rules
  if (!STATE_REGEX.test(upperParts[0])) {
    return {
      isValid: false,
      error: `State segment must be 2 letters (A-Z). Received: "${upperParts[0]}"`,
    };
  }

  if (upperParts[1] === '00') {
    return {
      isValid: false,
      error: 'LGA segment cannot be 00 (must be 01-99)',
    };
  }

  if (!LGA_REGEX.test(upperParts[1])) {
    return {
      isValid: false,
      error: `LGA segment must be 2 digits (01-99). Received: "${upperParts[1]}"`,
    };
  }

  if (!DISTRICT_REGEX.test(upperParts[2])) {
    return {
      isValid: false,
      error: `District segment must be 3 alphanumeric characters. Received: "${upperParts[2]}"`,
    };
  }

  if (!AREA_REGEX.test(upperParts[3])) {
    return {
      isValid: false,
      error: `Area segment must be 2 letters (A-Z). Received: "${upperParts[3]}"`,
    };
  }

  if (upperParts[4] === '00') {
    return {
      isValid: false,
      error: 'Building unit segment cannot be 00 (must be 01-99)',
    };
  }

  if (!UNIT_REGEX.test(upperParts[4])) {
    return {
      isValid: false,
      error: `Building unit segment must be 2 digits (01-99). Received: "${upperParts[4]}"`,
    };
  }

  const canonical = upperParts.join('-');
  const compact = upperParts.join('');
  const display = upperParts.join(' ');
  const prefix = `${upperParts[0]}-${upperParts[1]}`;

  return {
    isValid: true,
    canonical,
    compact,
    display,
    prefix,
    segments: {
      state: upperParts[0],
      lga: upperParts[1],
      district: upperParts[2],
      area: upperParts[3],
      unit: upperParts[4],
    },
  };
}

/**
 * Normalizes a partial postcode query for autocomplete.
 * Supports partial inputs like 'EK', 'EK 01', 'EK-01-A'.
 */
export function validatePartialPostcode(rawInput: string | undefined | null): PartialPostcodeResult {
  if (rawInput === undefined || rawInput === null) {
    return {
      isValid: false,
      raw: '',
      normalized: '',
      activeSegment: 'state',
      error: 'Query parameter q is required',
    };
  }

  if (typeof rawInput !== 'string') {
    return {
      isValid: false,
      raw: '',
      normalized: '',
      activeSegment: 'state',
      error: 'Query parameter q must be a string',
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      raw: trimmed,
      normalized: '',
      activeSegment: 'state',
      error: 'Query cannot be empty',
    };
  }

  // Reject unsupported punctuation
  if (/[^A-Za-z0-9\s\-]/.test(trimmed)) {
    return {
      isValid: false,
      raw: trimmed,
      normalized: trimmed,
      activeSegment: 'state',
      error: 'Query contains invalid characters',
    };
  }

  const compact = trimmed.replace(/[\s\-]/g, '').toUpperCase();
  if (compact.length > 11) {
    return {
      isValid: false,
      raw: trimmed,
      normalized: compact,
      activeSegment: 'unit',
      error: 'Partial postcode exceeds maximum length (11 characters)',
    };
  }

  // Determine active segment based on compact length
  let activeSegment: 'state' | 'lga' | 'district' | 'area' | 'unit' = 'state';
  if (compact.length <= 2) {
    activeSegment = 'state';
  } else if (compact.length <= 4) {
    activeSegment = 'lga';
  } else if (compact.length <= 7) {
    activeSegment = 'district';
  } else if (compact.length <= 9) {
    activeSegment = 'area';
  } else {
    activeSegment = 'unit';
  }

  // Construct a clean display search query (space-separated segments as user types)
  const segments: string[] = [];
  if (compact.length >= 2) segments.push(compact.slice(0, 2));
  else if (compact.length > 0) segments.push(compact);

  if (compact.length >= 4) segments.push(compact.slice(2, 4));
  else if (compact.length > 2) segments.push(compact.slice(2));

  if (compact.length >= 7) segments.push(compact.slice(4, 7));
  else if (compact.length > 4) segments.push(compact.slice(4));

  if (compact.length >= 9) segments.push(compact.slice(7, 9));
  else if (compact.length > 7) segments.push(compact.slice(7));

  if (compact.length > 9) segments.push(compact.slice(9));

  const normalized = segments.join(' ');

  return {
    isValid: true,
    raw: trimmed,
    normalized,
    activeSegment,
  };
}

/**
 * Extracts canonical prefix (e.g. 'EK-01') from any valid postcode or prefix string
 */
export function extractPostcodePrefix(postcode: string): string | null {
  const result = normalizePostcode(postcode);
  if (result.isValid && result.prefix) {
    return result.prefix;
  }

  // If already a prefix candidate e.g. "EK-01" or "EK 01" or "ek01"
  const cleaned = postcode.trim().replace(/[\s\-]/g, '').toUpperCase();
  if (cleaned.length >= 4) {
    const state = cleaned.slice(0, 2);
    const lga = cleaned.slice(2, 4);
    if (STATE_REGEX.test(state) && LGA_REGEX.test(lga)) {
      return `${state}-${lga}`;
    }
  }

  return null;
}
