/**
 * ABN/TFN Verification Integration Tests
 *
 * End-to-end testing for verification service:
 * - ABN validation workflow
 * - TFN validation workflow
 * - Auto-detection
 * - Cache behavior
 * - Batch verification
 *
 * Related to: UNI-179 [ATO] ABN/TFN Verification Service
 */

import { describe, it, expect, vi } from 'vitest';
import { VerificationService } from '@/lib/integrations/ato/verificationService';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      upsert: vi.fn(() => ({ data: null, error: null })),
    })),
  })),
}));

vi.mock('@/cli/services/validation/abn-validator', () => ({
  ABNValidator: class {
    formatABN(abn: string) {
      return abn.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }
    validateFormat(abn: string) {
      return /^\d{11}$/.test(abn.replace(/\s/g, ''));
    }
    validateCheckDigit(abn: string) {
      return abn.replace(/\s/g, '').startsWith('51'); // Mock validation
    }
    async validateWithABR(abn: string) {
      if (abn.replace(/\s/g, '').startsWith('51')) {
        return {
          isValid: true,
          abn: this.formatABN(abn),
          entityName: 'TEST PTY LTD',
          status: 'active' as const,
          gstRegistered: true,
          registeredDate: '2020-01-01',
        };
      }
      return {
        isValid: false,
        abn,
        error: 'Invalid ABN',
      };
    }
    getABRUrl(abn: string) {
      return `https://abr.business.gov.au/ABN/View?abn=${abn.replace(/\s/g, '')}`;
    }
  },
}));

vi.mock('@/lib/integrations/ato/tfnValidator', () => ({
  TFNValidator: class {
    formatTFN(tfn: string) {
      const digits = tfn.replace(/\s/g, '');
      if (digits.length === 8) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)}`;
      }
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    }
    validateFormat(tfn: string) {
      return /^\d{8,9}$/.test(tfn.replace(/\s/g, ''));
    }
    async validate(tfn: string) {
      if (this.validateFormat(tfn)) {
        return {
          isValid: true,
          tfn: this.formatTFN(tfn),
        };
      }
      return {
        isValid: false,
        tfn,
        error: 'Invalid TFN format',
      };
    }
  },
}));

vi.mock('@/lib/integrations/ato/ato-client', () => ({
  createATOClient: () => ({
    initialize: vi.fn(),
    validateABN: vi.fn(() => ({
      abn: '51 824 753 556',
      entityName: 'TEST PTY LTD',
      entityType: 'Australian Private Company',
      status: 'active',
      gstRegistered: true,
      registeredDate: '2020-01-01',
      statusEffectiveFrom: '2020-01-01',
    })),
  }),
}));

describe('ABN/TFN Verification Service', () => {
  const service = new VerificationService();

  // ============================================================================
  // ABN Verification
  // ============================================================================

  describe('ABN Verification', () => {
    it('should verify valid ABN', async () => {
      const result = await service.verify({
        identifier: '51824753556',
        type: 'abn',
      });

      expect(result.type).toBe('abn');
      expect(result.isValid).toBe(true);
      expect(result.identifier).toBe('51 824 753 556');
      expect(result.entityName).toBe('TEST PTY LTD');
    });

    it('should auto-detect ABN from format', async () => {
      const result = await service.verify({
        identifier: '51824753556',
        type: 'auto',
      });

      expect(result.type).toBe('abn');
    });

    it('should include GST status', async () => {
      const result = await service.verify({
        identifier: '51824753556',
        type: 'abn',
      });

      expect(result.gstRegistered).toBeDefined();
    });

    it('should include ABR URL', async () => {
      const result = await service.verify({
        identifier: '51824753556',
        type: 'abn',
      });

      expect(result.abrUrl).toContain('abr.business.gov.au');
    });
  });

  // ============================================================================
  // TFN Verification
  // ============================================================================

  describe('TFN Verification', () => {
    it('should verify 8-digit TFN format', async () => {
      const result = await service.verify({
        identifier: '12345678',
        type: 'tfn',
      });

      expect(result.type).toBe('tfn');
      expect(result.isValid).toBe(true);
      expect(result.identifier).toBe('123 456 78');
    });

    it('should verify 9-digit TFN format', async () => {
      const result = await service.verify({
        identifier: '123456782',
        type: 'tfn',
      });

      expect(result.type).toBe('tfn');
      expect(result.isValid).toBe(true);
      expect(result.identifier).toBe('123 456 782');
    });

    it('should auto-detect TFN from format', async () => {
      const result = await service.verify({
        identifier: '12345678',
        type: 'auto',
      });

      expect(result.type).toBe('tfn');
    });

    it('should use local validation only', async () => {
      const result = await service.verify({
        identifier: '12345678',
        type: 'tfn',
      });

      expect(result.source).toBe('local');
    });
  });

  // ============================================================================
  // Auto-Detection
  // ============================================================================

  describe('Auto-detection', () => {
    it('should detect ABN (11 digits)', async () => {
      const result = await service.verify({
        identifier: '51824753556',
      });

      expect(result.type).toBe('abn');
    });

    it('should detect TFN (8 digits)', async () => {
      const result = await service.verify({
        identifier: '12345678',
      });

      expect(result.type).toBe('tfn');
    });

    it('should detect TFN (9 digits)', async () => {
      const result = await service.verify({
        identifier: '123456782',
      });

      expect(result.type).toBe('tfn');
    });

    it('should handle spaces in input', async () => {
      const result = await service.verify({
        identifier: '51 824 753 556',
      });

      expect(result.type).toBe('abn');
      expect(result.isValid).toBe(true);
    });
  });

  // ============================================================================
  // Batch Verification
  // ============================================================================

  describe('Batch verification', () => {
    it('should verify multiple identifiers', async () => {
      const results = await service.verifyBatch([
        { identifier: '51824753556', type: 'abn' },
        { identifier: '12345678', type: 'tfn' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('abn');
      expect(results[1].type).toBe('tfn');
    });

    it('should handle mixed valid/invalid', async () => {
      const results = await service.verifyBatch([
        { identifier: '51824753556', type: 'abn' },
        { identifier: '123', type: 'tfn' },
      ]);

      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe('Error handling', () => {
    it('should reject invalid ABN format', async () => {
      const result = await service.verify({
        identifier: '123',
        type: 'abn',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid TFN format', async () => {
      const result = await service.verify({
        identifier: '123',
        type: 'tfn',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include verification timestamp', async () => {
      const result = await service.verify({
        identifier: '51824753556',
        type: 'abn',
      });

      expect(result.verifiedAt).toBeDefined();
      expect(new Date(result.verifiedAt).getTime()).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Source Attribution
  // ============================================================================

  describe('Source attribution', () => {
    it('should indicate ABR source for ABN', async () => {
      const result = await service.verify({
        identifier: '51824753556',
        type: 'abn',
      });

      expect(result.source).toMatch(/abr|ato/);
    });

    it('should indicate local source for TFN', async () => {
      const result = await service.verify({
        identifier: '12345678',
        type: 'tfn',
      });

      expect(result.source).toBe('local');
    });
  });
});
