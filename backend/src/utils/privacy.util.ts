/**
 * ============================================================================
 * PII PRIVACY & DATA MASKING UTILITIES
 * ============================================================================
 *
 * Implements:
 * 1. Post-Fulfillment Phone Masking (+234 803 *** 1726)
 * 2. Customer Email Obfuscation (o***y@gmail.com)
 * 3. Anonymized Public Courier & Buyer Display Names
 *
 * @module backend/src/utils/privacy.util
 */

export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length < 8) return cleaned;

  // Handles international (+2348039281726) or local (08039281726) formats
  const startLength = cleaned.startsWith("+") ? 7 : 4;
  const start = cleaned.slice(0, startLength);
  const end = cleaned.slice(-4);
  return `${start} *** ${end}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return email || "";
  const [user, domain] = email.split("@");
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}@${domain}`;
}

export function maskFullName(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}
