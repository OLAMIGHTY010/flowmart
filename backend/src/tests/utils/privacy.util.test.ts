/**
 * ============================================================================
 * UNIT TESTS: PII PRIVACY & DATA MASKING
 * ============================================================================
 */

import { maskPhoneNumber, maskEmail, maskFullName } from '../../utils/privacy.util';

describe('Privacy & PII Masking Utilities', () => {
  describe('maskPhoneNumber', () => {
    it('masks Nigerian international phone numbers preserving prefix and last 4 digits', () => {
      expect(maskPhoneNumber('+2348039281726')).toBe('+234803 *** 1726');
    });

    it('masks Nigerian local format numbers', () => {
      expect(maskPhoneNumber('08039281726')).toBe('0803 *** 1726');
    });

    it('handles null, undefined, and short strings gracefully', () => {
      expect(maskPhoneNumber(null)).toBe('');
      expect(maskPhoneNumber(undefined)).toBe('');
      expect(maskPhoneNumber('1234')).toBe('1234');
    });
  });

  describe('maskEmail', () => {
    it('masks standard email addresses properly', () => {
      expect(maskEmail('olamighty@gmail.com')).toBe('o****y@gmail.com');
      expect(maskEmail('john@flowmart.ng')).toBe('j**n@flowmart.ng');
    });

    it('handles short or malformed emails safely', () => {
      expect(maskEmail('ab@gmail.com')).toBe('a*@gmail.com');
      expect(maskEmail('')).toBe('');
      expect(maskEmail(null)).toBe('');
    });
  });

  describe('maskFullName', () => {
    it('abbreviates last name to initial for privacy', () => {
      expect(maskFullName('Tunde Adebayo')).toBe('Tunde A.');
      expect(maskFullName('Olusola Adeyemi')).toBe('Olusola A.');
    });

    it('preserves single names', () => {
      expect(maskFullName('Tunde')).toBe('Tunde');
      expect(maskFullName('')).toBe('');
    });
  });
});
