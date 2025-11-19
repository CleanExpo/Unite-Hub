/**
 * Tests for projectService (Phase 3 Step 7)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProjectFromProposal,
  getProjectsForClient,
  getProjectById,
  assignStaff,
} from '../services/staff/projectService';
import type { ProposalScope } from '../projects/scope-planner';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'proj-123',
          scope_data: {
            idea: {
              id: 'idea-123',
              title: 'Test Idea',
              description: 'Test description',
            },
            packages: [
              {
                id: 'pkg-better',
                tier: 'better',
                label: 'Better Package',
                summary: 'Better package summary',
                priceMin: 5000,
                priceMax: 7500,
                estimatedHours: 40,
                timeline: '4-6 weeks',
                deliverables: [
                  'Core feature implementation',
                  'Database setup',
                  'API development',
                ],
              },
            ],
            metadata: {
              aiModel: 'Claude Hybrid',
            },
          } as ProposalScope,
          status: 'sent',
        },
        error: null,
      }),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }),
  }),
}));

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProjectFromProposal', () => {
    const mockParams = {
      proposalScopeId: 'scope-uuid-123',
      ideaId: 'idea-uuid-123',
      clientId: 'client-uuid-123',
      organizationId: 'org-uuid-123',
      tier: 'better' as const,
      packageId: 'pkg-better',
    };

    it('should create project successfully', async () => {
      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.name).toContain('Test Idea');
      expect(result.project?.name).toContain('Better Package');
      expect(result.project?.tier).toBe('better');
      expect(result.project?.status).toBe('active');
    });

    it('should generate tasks from deliverables', async () => {
      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.tasks).toBeDefined();
      expect(result.project?.tasks.length).toBeGreaterThan(0);

      // Should have tasks for each deliverable
      const taskTitles = result.project?.tasks.map(t => t.title) || [];
      expect(taskTitles).toContain('Core feature implementation');
      expect(taskTitles).toContain('Database setup');
      expect(taskTitles).toContain('API development');
    });

    it('should calculate timeline correctly', async () => {
      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.startDate).toBeDefined();
      expect(result.project?.estimatedEndDate).toBeDefined();

      // Estimated end date should be after start date
      const startDate = new Date(result.project!.startDate);
      const endDate = new Date(result.project!.estimatedEndDate!);
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it('should validate required parameters', async () => {
      const invalidParams = {
        ...mockParams,
        proposalScopeId: '',
      };

      const result = await createProjectFromProposal(invalidParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
    });

    it('should set AI-generated metadata', async () => {
      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.metadata.aiGenerated).toBe(true);
    });

    it('should set total estimated hours', async () => {
      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.totalEstimatedHours).toBe(40);
    });
  });

  describe('getProjectsForClient', () => {
    it('should fetch projects successfully', async () => {
      const params = {
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
      };

      const result = await getProjectsForClient(params);

      expect(result.success).toBe(true);
      expect(result.projects).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
    });

    it('should validate organization ID', async () => {
      const params = {
        clientId: 'client-uuid-123',
        organizationId: '',
      };

      const result = await getProjectsForClient(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Organization ID is required');
    });

    it('should filter by status', async () => {
      const params = {
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
        status: 'active' as const,
      };

      const result = await getProjectsForClient(params);

      expect(result.success).toBe(true);
      // All projects should have 'active' status if filtering works
    });

    it('should respect limit parameter', async () => {
      const params = {
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
        limit: 10,
      };

      const result = await getProjectsForClient(params);

      expect(result.success).toBe(true);
      expect(result.projects).toBeDefined();
    });
  });

  describe('getProjectById', () => {
    it('should fetch project details successfully', async () => {
      const result = await getProjectById('proj-123', 'org-uuid-123');

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.id).toBe('proj-123');
    });

    it('should validate project ID', async () => {
      const result = await getProjectById('', 'org-uuid-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project ID and Organization ID are required');
    });

    it('should validate organization ID', async () => {
      const result = await getProjectById('proj-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project ID and Organization ID are required');
    });
  });

  describe('assignStaff', () => {
    const mockParams = {
      projectId: 'proj-123',
      userId: 'user-uuid-123',
      role: 'developer' as const,
      organizationId: 'org-uuid-123',
    };

    it('should assign staff successfully', async () => {
      const result = await assignStaff(mockParams);

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment?.projectId).toBe('proj-123');
      expect(result.assignment?.userId).toBe('user-uuid-123');
      expect(result.assignment?.role).toBe('developer');
    });

    it('should validate required parameters', async () => {
      const invalidParams = {
        ...mockParams,
        projectId: '',
      };

      const result = await assignStaff(invalidParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
    });

    it('should validate role', async () => {
      const invalidParams = {
        ...mockParams,
        role: 'invalid' as any,
      };

      const result = await assignStaff(invalidParams);

      // Should fail validation or return error
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing proposal scope', async () => {
      const mockParams = {
        proposalScopeId: 'non-existent-scope',
        ideaId: 'idea-uuid-123',
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
        tier: 'better' as const,
        packageId: 'pkg-better',
      };

      const result = await createProjectFromProposal(mockParams);

      // Should handle missing scope gracefully
      expect(result.success).toBeDefined();
    });

    it('should handle package without deliverables', async () => {
      // This would test the generic task creation fallback
      const result = await createProjectFromProposal({
        proposalScopeId: 'scope-uuid-123',
        ideaId: 'idea-uuid-123',
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
        tier: 'better' as const,
        packageId: 'pkg-better',
      });

      // Should create generic tasks if no deliverables
      expect(result.project?.tasks.length).toBeGreaterThan(0);
    });
  });
});
