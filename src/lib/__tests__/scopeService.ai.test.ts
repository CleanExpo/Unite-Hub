/**
 * Tests for scopeService AI integration (Phase 3 Step 4)
 *
 * These tests verify the AI scope generation helper and its integration
 * with the hybrid AI pipeline.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateAIScope, type GenerateAIScopeParams } from '../services/staff/scopeService';
import type { ClientIdea } from '../projects/scope-planner';

// Mock fetch globally
global.fetch = vi.fn();

describe('scopeService AI Integration', () => {
  const mockIdea: ClientIdea = {
    id: 'test-idea-123',
    organizationId: 'org-test-456',
    clientId: 'client-test-789',
    title: 'Build a Professional Website',
    description: 'I need a modern, responsive website for my consulting business.',
    createdAt: new Date().toISOString(),
  };

  const mockParams: GenerateAIScopeParams = {
    idea: mockIdea,
    organizationId: 'org-test-456',
    workspaceId: 'workspace-test-789',
    clientId: 'client-test-789',
    accessToken: 'test-token-123',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('generateAIScope', () => {
    it('should call the AI generation API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        scope: {
          idea: mockIdea,
          sections: [],
          packages: [],
          metadata: {
            generatedAt: new Date().toISOString(),
            aiModel: 'Hybrid',
          },
        },
        metadata: {
          totalCost: 0.059,
          totalTokens: 8500,
          pipelineStages: 4,
          generationTime: 12000,
          aiModel: 'Hybrid (Claude 3.5 Sonnet → GPT-4 → Gemini 2.5 → Claude Haiku)',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateAIScope(mockParams);

      // Verify fetch was called with correct URL and headers
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/staff/scope-ai/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-123',
          },
        })
      );

      // Verify result structure
      expect(result.success).toBe(true);
      expect(result.scope).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should return scope with metadata on success', async () => {
      const mockResponse = {
        success: true,
        scope: {
          idea: mockIdea,
          sections: [{ id: 's1', title: 'Overview', description: 'Test', order: 1 }],
          packages: [
            { id: 'p1', tier: 'good', label: 'Good', summary: 'Basic', deliverables: [] },
          ],
          metadata: {
            generatedAt: new Date().toISOString(),
            totalCost: 0.059,
            totalTokens: 8500,
          },
        },
        metadata: {
          totalCost: 0.059,
          totalTokens: 8500,
          pipelineStages: 4,
          generationTime: 12000,
          aiModel: 'Hybrid',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(true);
      expect(result.scope).toBeDefined();
      expect(result.scope?.sections).toHaveLength(1);
      expect(result.scope?.packages).toHaveLength(1);
      expect(result.metadata?.totalCost).toBe(0.059);
      expect(result.metadata?.totalTokens).toBe(8500);
      expect(result.metadata?.pipelineStages).toBe(4);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'AI generation failed', details: 'Model timeout' }),
      });

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI generation failed');
      expect(result.message).toContain('Model timeout');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.message).toContain('Failed to generate AI scope');
    });

    it('should handle malformed responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(false);
      // When json() throws, the catch fallback returns { error: 'Unknown error' }
      expect(result.error).toContain('Unknown error');
    });

    it('should include Authorization header with Bearer token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, scope: {}, metadata: {} }),
      });

      await generateAIScope(mockParams);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Authorization']).toBe('Bearer test-token-123');
    });

    it('should send all required parameters in request body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, scope: {}, metadata: {} }),
      });

      await generateAIScope(mockParams);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.idea).toEqual(mockIdea);
      expect(body.organizationId).toBe('org-test-456');
      expect(body.workspaceId).toBe('workspace-test-789');
      expect(body.clientId).toBe('client-test-789');
    });

    it('should handle 401 Unauthorized responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized - Invalid token' }),
      });

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should preserve success message on successful generation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          scope: { idea: mockIdea, sections: [], packages: [] },
          metadata: { totalCost: 0.05, totalTokens: 8000 },
        }),
      });

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(true);
      expect(result.message).toBe('AI scope generated successfully');
    });
  });

  describe('Error Recovery Patterns', () => {
    it('should return detailed error for debugging', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'OpenRouter API error',
          details: 'Model anthropic/claude-3.5-sonnet returned 503',
        }),
      });

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenRouter API error');
      expect(result.message).toContain('503');
    });

    it('should handle timeout errors', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.reject(new Error('Request timeout after 30000ms'))
      );

      const result = await generateAIScope(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Integration Shape Tests', () => {
    it('should return structure compatible with UI expectations', async () => {
      const mockResponse = {
        success: true,
        scope: {
          idea: mockIdea,
          sections: [
            { id: 's1', title: 'Overview', description: 'Test overview', order: 1 },
            { id: 's2', title: 'Objectives', description: 'Test objectives', order: 2 },
          ],
          packages: [
            {
              id: 'good',
              tier: 'good',
              label: 'Essential',
              summary: 'Basic package',
              deliverables: ['Feature 1', 'Feature 2'],
              estimatedHours: 40,
              priceMin: 7800,
              priceMax: 9360,
            },
            {
              id: 'better',
              tier: 'better',
              label: 'Professional',
              summary: 'Standard package',
              deliverables: ['Feature 1', 'Feature 2', 'Feature 3'],
              estimatedHours: 80,
            },
          ],
          metadata: {
            generatedAt: new Date().toISOString(),
            aiModel: 'Hybrid (Claude 3.5 Sonnet → GPT-4 → Gemini 2.5 → Claude Haiku)',
            totalCost: 0.059,
            totalTokens: 8500,
          },
        },
        metadata: {
          totalCost: 0.059,
          totalTokens: 8500,
          pipelineStages: 4,
          generationTime: 12000,
          aiModel: 'Hybrid',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateAIScope(mockParams);

      // Verify UI can safely access all expected fields
      expect(result.success).toBe(true);
      expect(result.scope?.idea.id).toBe(mockIdea.id);
      expect(result.scope?.sections).toBeInstanceOf(Array);
      expect(result.scope?.packages).toBeInstanceOf(Array);
      expect(result.scope?.metadata?.aiModel).toBeDefined();
      expect(result.metadata?.totalCost).toBeDefined();
      expect(result.metadata?.totalTokens).toBeDefined();
      expect(result.metadata?.generationTime).toBeDefined();
    });
  });
});
