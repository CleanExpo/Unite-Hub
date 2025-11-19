/**
 * Phase 1 Authentication Tests
 * Tests for new Supabase staff authentication
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { staffLogin, staffLogout, getStaffSession } from '@/next/core/auth/supabase';

describe('Phase 1 Staff Authentication', () => {
  describe('staffLogin', () => {
    it('should reject invalid credentials', async () => {
      const result = await staffLogin('invalid@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should require staff role in database', async () => {
      // Test that non-staff users are rejected even with valid Supabase credentials
      // This test requires mock data setup
    });

    it('should reject inactive staff accounts', async () => {
      // Test that active=false staff accounts are rejected
      // This test requires mock data setup
    });
  });

  describe('staffLogout', () => {
    it('should successfully logout', async () => {
      const result = await staffLogout();

      expect(result.success).toBe(true);
    });
  });

  describe('getStaffSession', () => {
    it('should return null when not authenticated', async () => {
      const { session } = await getStaffSession();

      expect(session).toBeNull();
    });
  });
});
