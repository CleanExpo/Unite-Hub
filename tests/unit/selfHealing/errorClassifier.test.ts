/**
 * Error Classifier Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  classifyError,
  ClassifiedError,
  getSeverityPriority,
  isProductionCritical,
} from '@/lib/selfHealing/errorClassifier';

describe('errorClassifier', () => {
  describe('classifyError', () => {
    it('classifies RLS errors correctly', () => {
      const result = classifyError({
        route: '/api/contacts',
        errorMessage: 'new row violates row level security policy',
      });

      expect(result.category).toBe('RLS_VIOLATION');
      expect(result.severity).toBe('HIGH');
      expect(result.suggestedAction).toContain('RLS policies');
    });

    it('classifies auth errors by message', () => {
      const result = classifyError({
        route: '/api/me',
        errorMessage: 'JWT expired',
      });

      expect(result.category).toBe('AUTH_FAILURE');
      expect(result.severity).toBe('HIGH');
    });

    it('classifies auth errors by status code', () => {
      const result = classifyError({
        route: '/api/protected',
        statusCode: 401,
      });

      expect(result.category).toBe('AUTH_FAILURE');
      expect(result.severity).toBe('HIGH');
    });

    it('classifies SSR hydration errors', () => {
      const result = classifyError({
        route: '/dashboard',
        errorMessage: 'Text content did not match. Server: "foo" Client: "bar"',
      });

      expect(result.category).toBe('SSR_HYDRATION');
      expect(result.severity).toBe('MEDIUM');
    });

    it('classifies API schema/validation errors', () => {
      const result = classifyError({
        route: '/api/contacts',
        statusCode: 400,
        errorMessage: 'Zod validation failed: required field missing',
      });

      expect(result.category).toBe('API_SCHEMA');
      expect(result.severity).toBe('MEDIUM');
    });

    it('classifies performance/timeout errors', () => {
      const result = classifyError({
        route: '/api/reports',
        errorMessage: 'Request timeout after 30000ms',
      });

      expect(result.category).toBe('PERFORMANCE');
      expect(result.severity).toBe('HIGH');
    });

    it('classifies redirect loop errors as CRITICAL', () => {
      const result = classifyError({
        route: '/dashboard',
        errorMessage: 'ERR_TOO_MANY_REDIRECTS',
      });

      expect(result.category).toBe('REDIRECT_LOOP');
      expect(result.severity).toBe('CRITICAL');
    });

    it('classifies database errors', () => {
      const result = classifyError({
        route: '/api/contacts',
        errorMessage: 'duplicate key value violates unique constraint "contacts_email_key"',
      });

      expect(result.category).toBe('DB_ERROR');
      expect(result.severity).toBe('HIGH');
    });

    it('classifies network errors', () => {
      const result = classifyError({
        route: '/api/external',
        errorMessage: 'ECONNREFUSED',
      });

      expect(result.category).toBe('NETWORK_ERROR');
      expect(result.severity).toBe('MEDIUM');
    });

    it('classifies rate limit errors', () => {
      const result = classifyError({
        route: '/api/ai',
        statusCode: 429,
        errorMessage: 'Rate limit exceeded',
      });

      expect(result.category).toBe('RATE_LIMIT');
      expect(result.severity).toBe('MEDIUM');
    });

    it('classifies UI/JavaScript bugs', () => {
      const result = classifyError({
        route: '/dashboard',
        errorMessage: "Cannot read properties of undefined (reading 'map')",
      });

      expect(result.category).toBe('UI_BUG');
      expect(result.severity).toBe('MEDIUM');
    });

    it('returns UNKNOWN for unrecognized errors', () => {
      const result = classifyError({
        route: '/api/test',
        errorMessage: 'Something completely unexpected happened',
      });

      expect(result.category).toBe('UNKNOWN');
      expect(result.severity).toBe('MEDIUM');
    });

    it('generates unique signatures for deduplication', () => {
      const result1 = classifyError({
        route: '/api/contacts/123e4567-e89b-12d3-a456-426614174000',
        errorMessage: 'Not found',
      });

      const result2 = classifyError({
        route: '/api/contacts/987fcdeb-51a2-3bc4-d567-890123456789',
        errorMessage: 'Not found',
      });

      // Signatures should be the same (UUIDs normalized)
      expect(result1.signature).toBe(result2.signature);
    });

    it('handles null/undefined input gracefully', () => {
      const result = classifyError(null);

      expect(result.category).toBe('UNKNOWN');
      expect(result.summary).toBe('Unknown error');
    });
  });

  describe('getSeverityPriority', () => {
    it('returns correct priority values', () => {
      expect(getSeverityPriority('CRITICAL')).toBe(4);
      expect(getSeverityPriority('HIGH')).toBe(3);
      expect(getSeverityPriority('MEDIUM')).toBe(2);
      expect(getSeverityPriority('LOW')).toBe(1);
    });
  });

  describe('isProductionCritical', () => {
    it('returns true for CRITICAL severity', () => {
      const error: ClassifiedError = {
        category: 'REDIRECT_LOOP',
        severity: 'CRITICAL',
        signature: 'test',
        summary: 'test',
        context: {},
      };

      expect(isProductionCritical(error)).toBe(true);
    });

    it('returns true for HIGH severity auth failures', () => {
      const error: ClassifiedError = {
        category: 'AUTH_FAILURE',
        severity: 'HIGH',
        signature: 'test',
        summary: 'test',
        context: {},
      };

      expect(isProductionCritical(error)).toBe(true);
    });

    it('returns false for MEDIUM severity', () => {
      const error: ClassifiedError = {
        category: 'SSR_HYDRATION',
        severity: 'MEDIUM',
        signature: 'test',
        summary: 'test',
        context: {},
      };

      expect(isProductionCritical(error)).toBe(false);
    });
  });
});
