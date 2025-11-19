/**
 * Tests for proposalService (Phase 3 Step 5)
 *
 * These tests verify the client proposal service functions
 * and their integration with the API endpoints.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getClientProposal,
  selectProposal,
  getClientProposals,
  type SelectProposalParams,
} from '../services/client/proposalService';

// Mock fetch globally
global.fetch = vi.fn();

// Mock Supabase auth
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token-123',
            user: { id: 'user-123', email: 'test@example.com' },
          },
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }),
  },
}));

describe('proposalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClientProposal', () => {
    const mockIdeaId = 'idea-uuid-123';

    it('should fetch proposal successfully', async () => {
      const mockProposal = {
        idea: {
          id: mockIdeaId,
          organizationId: 'org-123',
          clientId: 'client-123',
          title: 'Test Idea',
          description: 'Test description',
          createdAt: new Date().toISOString(),
        },
        sections: [
          { id: 's1', title: 'Overview', description: 'Test overview', order: 1 },
        ],
        packages: [
          {
            id: 'pkg-good',
            tier: 'good',
            label: 'Good',
            summary: 'Essential package',
            deliverables: ['Feature 1'],
            estimatedHours: 40,
            priceMin: 5000,
            priceMax: 7000,
          },
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          aiModel: 'Hybrid',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          proposal: mockProposal,
          metadata: {
            proposalId: 'proposal-123',
            status: 'sent',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      const result = await getClientProposal(mockIdeaId);

      expect(result.success).toBe(true);
      expect(result.proposal).toEqual(mockProposal);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.proposalId).toBe('proposal-123');
    });

    it('should include Authorization header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, proposal: {}, metadata: {} }),
      });

      await getClientProposal(mockIdeaId);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Authorization']).toBe('Bearer mock-token-123');
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Proposal not found' }),
      });

      const result = await getClientProposal(mockIdeaId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Proposal not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getClientProposal(mockIdeaId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle authentication errors', async () => {
      const { supabase } = await import('@/lib/supabase');
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: null },
        error: new Error('Not authenticated'),
      });

      const result = await getClientProposal(mockIdeaId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });
  });

  describe('selectProposal', () => {
    const mockParams: SelectProposalParams = {
      ideaId: 'idea-uuid-123',
      tier: 'better',
      packageId: 'pkg-better',
    };

    it('should select proposal successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          selection: {
            ideaId: mockParams.ideaId,
            tier: mockParams.tier,
            packageId: mockParams.packageId,
            packageLabel: 'Better',
          },
          nextStep: 'payment',
          message: 'Package selected successfully',
        }),
      });

      const result = await selectProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.selection).toBeDefined();
      expect(result.selection?.tier).toBe('better');
      expect(result.nextStep).toBe('payment');
    });

    it('should validate required parameters', async () => {
      const invalidParams = {
        ideaId: '',
        tier: 'better' as const,
        packageId: 'pkg-better',
      };

      const result = await selectProposal(invalidParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
    });

    it('should validate tier value', async () => {
      const invalidParams = {
        ideaId: 'idea-123',
        tier: 'invalid' as any,
        packageId: 'pkg-123',
      };

      const result = await selectProposal(invalidParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid tier');
    });

    it('should send correct request body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, selection: {}, nextStep: 'payment' }),
      });

      await selectProposal(mockParams);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.ideaId).toBe(mockParams.ideaId);
      expect(body.tier).toBe(mockParams.tier);
      expect(body.packageId).toBe(mockParams.packageId);
    });

    it('should handle API errors during selection', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid package selection' }),
      });

      const result = await selectProposal(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid package selection');
    });

    it('should include Authorization header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, selection: {}, nextStep: 'payment' }),
      });

      await selectProposal(mockParams);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Authorization']).toBe('Bearer mock-token-123');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should handle different next steps', async () => {
      const testCases: Array<{ nextStep: 'payment' | 'onboarding' | 'confirmation' }> = [
        { nextStep: 'payment' },
        { nextStep: 'onboarding' },
        { nextStep: 'confirmation' },
      ];

      for (const testCase of testCases) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            selection: {},
            nextStep: testCase.nextStep,
          }),
        });

        const result = await selectProposal(mockParams);

        expect(result.success).toBe(true);
        expect(result.nextStep).toBe(testCase.nextStep);
      }
    });
  });

  describe('getClientProposals', () => {
    it('should fetch all client proposals', async () => {
      const mockData = [
        {
          id: 'idea-1',
          title: 'Idea 1',
          status: 'scoped',
          proposal_scopes: [
            {
              id: 'proposal-1',
              status: 'sent',
              created_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'idea-2',
          title: 'Idea 2',
          status: 'package_selected',
          proposal_scopes: [
            {
              id: 'proposal-2',
              status: 'sent',
              created_at: new Date().toISOString(),
            },
          ],
        },
      ];

      const { supabase } = await import('@/lib/supabase');
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await getClientProposals();

      expect(result.success).toBe(true);
      expect(result.proposals).toBeDefined();
      expect(result.proposals?.length).toBe(2);
      expect(result.proposals?.[0].ideaTitle).toBe('Idea 1');
      expect(result.proposals?.[1].hasSelection).toBe(true);
    });

    it('should handle database errors', async () => {
      const { supabase } = await import('@/lib/supabase');
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await getClientProposals();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch proposals');
    });

    it('should filter out ideas without proposals', async () => {
      const mockData = [
        {
          id: 'idea-1',
          title: 'Idea 1',
          status: 'scoped',
          proposal_scopes: [
            {
              id: 'proposal-1',
              status: 'sent',
              created_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'idea-2',
          title: 'Idea 2',
          status: 'scoped',
          proposal_scopes: null, // No proposal
        },
      ];

      const { supabase } = await import('@/lib/supabase');
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await getClientProposals();

      expect(result.success).toBe(true);
      expect(result.proposals?.length).toBe(1);
      expect(result.proposals?.[0].ideaId).toBe('idea-1');
    });
  });
});
