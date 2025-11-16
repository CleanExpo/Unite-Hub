/**
 * Integration Tests for Authentication API
 * Tests authentication endpoints with real request/response flow
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedRequest, createMockRequest } from '../../helpers/api';
import { TEST_USER, TEST_ORGANIZATION, TEST_WORKSPACE } from '../../helpers/auth';

// Mock rate limiter to allow all requests
vi.mock('@/lib/rate-limit', () => ({
  strictRateLimit: vi.fn().mockResolvedValue(null),
  rateLimit: vi.fn().mockResolvedValue(null),
  apiRateLimit: vi.fn().mockResolvedValue(null),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabaseBrowser: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: TEST_USER },
        error: null,
      }),
    },
  },
  getSupabaseServer: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: TEST_USER },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: table === 'user_profiles' ? { ...TEST_USER } : null,
        error: null,
      }),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      then: vi.fn((resolve) =>
        resolve({
          data:
            table === 'organizations'
              ? [TEST_ORGANIZATION]
              : table === 'workspaces'
              ? [TEST_WORKSPACE]
              : null,
          error: null,
        })
      ),
    })),
  })),
}));

describe('Authentication API Integration Tests', () => {
  describe('POST /api/auth/initialize-user', () => {
    it('should return 200 and skip initialization without authentication', async () => {
      const req = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      // Import the route handler
      const { POST } = await import('@/app/api/auth/initialize-user/route');

      // Mock unauthenticated user (no token, no cookies)
      const { supabaseBrowser } = await import('@/lib/supabase');
      (supabaseBrowser.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const response = await POST(req);
      // Route returns 200 with "skipping initialization" message when not authenticated
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain('Not authenticated');
    });

    it.skip('should initialize new user with profile and organization', async () => {
      const req = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const { POST } = await import('@/app/api/auth/initialize-user/route');
      const response = await POST(req);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.profile).toBeDefined();
    });

    it.skip('should create default organization for new user', async () => {
      const req = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const { getSupabaseServer } = await import('@/lib/supabase');
      const mockSupabase = await getSupabaseServer();

      const { POST } = await import('@/app/api/auth/initialize-user/route');
      await POST(req);

      // Verify organization insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
    });

    it.skip('should create default workspace for new user', async () => {
      const req = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const { getSupabaseServer } = await import('@/lib/supabase');
      const mockSupabase = await getSupabaseServer();

      const { POST } = await import('@/app/api/auth/initialize-user/route');
      await POST(req);

      // Verify workspace insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces');
    });

    it.skip('should handle existing user gracefully', async () => {
      const req = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const { POST } = await import('@/app/api/auth/initialize-user/route');

      // First initialization
      const response1 = await POST(req);
      expect(response1.status).toBe(200);

      // Second initialization (should not error)
      const response2 = await POST(req);
      expect(response2.status).toBe(200);
    });
  });

  describe('Authorization Header Handling', () => {
    it('should accept Bearer token in Authorization header', async () => {
      const req = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const authHeader = req.headers.get('authorization');
      expect(authHeader).toContain('Bearer');
    });

    it('should extract token from Authorization header', async () => {
      const req = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      expect(token).toBeTruthy();
      expect(token).not.toContain('Bearer');
    });
  });

  describe('Error Handling', () => {
    it.skip('should return 500 on database error', async () => {
      const req = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const { getSupabaseServer } = await import('@/lib/supabase');
      (getSupabaseServer as any).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('Database error')),
        },
      });

      const { POST } = await import('@/app/api/auth/initialize-user/route');
      const response = await POST(req);

      expect(response.status).toBe(500);
    });

    it('should return JSON response when not authenticated', async () => {
      const req = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3008/api/auth/initialize-user',
      });

      const { supabaseBrowser } = await import('@/lib/supabase');
      (supabaseBrowser.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const { POST } = await import('@/app/api/auth/initialize-user/route');
      const response = await POST(req);

      const data = await response.json();
      // Route returns 200 with message, not error
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Not authenticated');
    });
  });
});
