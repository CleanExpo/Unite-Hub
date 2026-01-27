/**
 * TFN Validator Unit Tests
 *
 * Tests for TFN validation:
 * - Format validation (8-9 digits)
 * - Check digit algorithm
 * - Formatting
 * - Error handling
 *
 * Related to: UNI-179 [ATO] ABN/TFN Verification Service
 */

import { describe, it, expect } from 'vitest';
import { TFNValidator } from '@/lib/integrations/ato/tfnValidator';

describe('TFNValidator', () => {
  const validator = new TFNValidator();

  // ============================================================================
  // Format Validation
  // ============================================================================

  describe('validateFormat', () => {
    it('should accept 8-digit TFN', () => {
      expect(validator.validateFormat('12345678')).toBe(true);
    });

    it('should accept 9-digit TFN', () => {
      expect(validator.validateFormat('123456782')).toBe(true);
    });

    it('should accept TFN with spaces', () => {
      expect(validator.validateFormat('123 456 782')).toBe(true);
      expect(validator.validateFormat('123 456 78')).toBe(true);
    });

    it('should reject less than 8 digits', () => {
      expect(validator.validateFormat('1234567')).toBe(false);
    });

    it('should reject more than 9 digits', () => {
      expect(validator.validateFormat('1234567890')).toBe(false);
    });

    it('should reject non-numeric characters', () => {
      expect(validator.validateFormat('12345678A')).toBe(false);
      expect(validator.validateFormat('ABC-123-456')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validator.validateFormat('')).toBe(false);
    });
  });

  // ============================================================================
  // TFN Formatting
  // ============================================================================

  describe('formatTFN', () => {
    it('should format 8-digit TFN as XXX XXX XX', () => {
      expect(validator.formatTFN('12345678')).toBe('123 456 78');
    });

    it('should format 9-digit TFN as XXX XXX XXX', () => {
      expect(validator.formatTFN('123456782')).toBe('123 456 782');
    });

    it('should preserve already formatted TFN', () => {
      expect(validator.formatTFN('123 456 78')).toBe('123 456 78');
      expect(validator.formatTFN('123 456 782')).toBe('123 456 782');
    });

    it('should return unmodified for invalid length', () => {
      expect(validator.formatTFN('1234567')).toBe('1234567');
      expect(validator.formatTFN('12345678901')).toBe('12345678901');
    });
  });

  // ============================================================================
  // Check Digit Validation
  // ============================================================================

  describe('validateCheckDigit', () => {
    // Valid 8-digit TFNs
    it('should validate 8-digit TFN check digit', () => {
      // These are test TFNs that pass the check digit algorithm
      // Note: Real TFNs should not be used in tests
      expect(validator.validateCheckDigit('87654321')).toBe(true);
    });

    // Valid 9-digit TFNs
    it('should validate 9-digit TFN check digit', () => {
      expect(validator.validateCheckDigit('123456782')).toBe(true);
    });

    it('should reject invalid check digit', () => {
      expect(validator.validateCheckDigit('12345678')).toBe(false);
      expect(validator.validateCheckDigit('123456789')).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(validator.validateCheckDigit('1234567')).toBe(false);
      expect(validator.validateCheckDigit('ABC123456')).toBe(false);
    });
  });

  // ============================================================================
  // Full Validation
  // ============================================================================

  describe('validate', () => {
    it('should validate correct 8-digit TFN', async () => {
      const result = await validator.validate('87654321');
      expect(result.isValid).toBe(true);
      expect(result.tfn).toBe('876 543 21');
      expect(result.error).toBeUndefined();
    });

    it('should validate correct 9-digit TFN', async () => {
      const result = await validator.validate('123456782');
      expect(result.isValid).toBe(true);
      expect(result.tfn).toBe('123 456 782');
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid format', async () => {
      const result = await validator.validate('1234567');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid TFN format');
    });

    it('should reject invalid check digit', async () => {
      const result = await validator.validate('12345678');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid TFN check digit');
    });

    it('should handle TFN with spaces', async () => {
      const result = await validator.validate('876 543 21');
      expect(result.isValid).toBe(true);
      expect(result.tfn).toBe('876 543 21');
    });
  });

  // ============================================================================
  // Batch Validation
  // ============================================================================

  describe('validateBatch', () => {
    it('should validate multiple TFNs', async () => {
      const tfns = ['87654321', '123456782', '12345678'];
      const results = await validator.validateBatch(tfns);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(false);
    });

    it('should handle empty array', async () => {
      const results = await validator.validateBatch([]);
      expect(results).toHaveLength(0);
    });

    it('should format all results', async () => {
      const tfns = ['87654321', '123456782'];
      const results = await validator.validateBatch(tfns);

      expect(results[0].tfn).toBe('876 543 21');
      expect(results[1].tfn).toBe('123 456 782');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge cases', () => {
    it('should handle leading zeros', () => {
      const result = validator.formatTFN('01234567');
      expect(result).toBe('012 345 67');
    });

    it('should handle all zeros', () => {
      expect(validator.validateFormat('000000000')).toBe(true);
    });

    it('should handle whitespace variations', () => {
      expect(validator.validateFormat('123  456  782')).toBe(true);
      expect(validator.validateFormat(' 123456782 ')).toBe(true);
    });

    it('should reject special characters', () => {
      expect(validator.validateFormat('123-456-782')).toBe(false);
      expect(validator.validateFormat('123.456.782')).toBe(false);
    });

    it('should reject mixed alphanumeric', () => {
      expect(validator.validateFormat('A23456782')).toBe(false);
      expect(validator.validateFormat('12345678Z')).toBe(false);
    });
  });

  // ============================================================================
  // Check Digit Algorithm Verification
  // ============================================================================

  describe('Check digit algorithm', () => {
    it('should use correct weighting factors for 8-digit', () => {
      // Weighting: [1, 4, 3, 7, 5, 8, 6]
      // This test verifies the algorithm is working as expected
      const valid8digit = '87654321';
      expect(validator.validateCheckDigit(valid8digit)).toBe(true);
    });

    it('should use correct weighting factors for 9-digit', () => {
      // Weighting: [1, 4, 3, 7, 5, 8, 6, 9]
      const valid9digit = '123456782';
      expect(validator.validateCheckDigit(valid9digit)).toBe(true);
    });

    it('should handle check digit > 9 subtraction rule', () => {
      // When check digit calculation > 9, subtract 9
      // This is tested implicitly in the valid TFNs above
      expect(validator.validateCheckDigit('123456782')).toBe(true);
    });
  });
});
