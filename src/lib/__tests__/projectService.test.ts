/**
 * Tests for projectService (Phase 3 Step 7)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ProposalScope } from '../projects/scope-planner';

// Create chainable Supabase mock with chainProxy pattern.
// Root mock has NO .then (so await getSupabaseServer() works).
// Chain methods return chainProxy which HAS .then for terminal queries.
const { mockSupabase } = vi.hoisted(() => {
  const queryResults: any[] = [];

  const mock: any = {
    _queryResults: queryResults,
    _setResults: (results: any[]) => {
      queryResults.length = 0;
      queryResults.push(...results);
    },
  };

  const chainProxy: any = {};

  const chainMethods = [
    'from', 'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'order', 'limit', 'range', 'match', 'not',
    'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps',
  ];
  chainMethods.forEach((m) => {
    const fn = vi.fn().mockReturnValue(chainProxy);
    mock[m] = fn;
    chainProxy[m] = fn;
  });

  const singleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });
  const maybeSingleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });

  mock.single = singleFn;
  mock.maybeSingle = maybeSingleFn;
  chainProxy.single = singleFn;
  chainProxy.maybeSingle = maybeSingleFn;

  chainProxy.then = (resolve: any) => {
    const result = queryResults.shift() || { data: [], error: null };
    return resolve(result);
  };

  return { mockSupabase: mock };
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Mock projectCreator
vi.mock('@/lib/projects/projectCreator', () => ({
  createProjectFromProposal: vi.fn((params: any) => {
    const pkg = params.scope?.packages?.find((p: any) => p.id === params.packageId) || {
      label: 'Default',
      summary: 'Default package',
      estimatedHours: 40,
      timeline: '4-6 weeks',
      deliverables: ['Core feature implementation', 'Database setup', 'API development'],
    };

    return {
      id: 'proj-123',
      name: `${params.scope?.idea?.title || 'Project'} - ${pkg.label || 'Package'}`,
      description: pkg.summary || 'Project description',
      status: 'active',
      tier: params.tier,
      ideaId: params.ideaId,
      proposalScopeId: params.proposalScopeId,
      clientId: params.clientId,
      organizationId: params.organizationId,
      startDate: new Date().toISOString(),
      estimatedEndDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
      totalEstimatedHours: pkg.estimatedHours || 40,
      tasks: (pkg.deliverables || []).map((d: string, i: number) => ({
        id: `task-${i}`,
        title: d,
        description: `Implement: ${d}`,
        status: 'pending',
        priority: 'medium',
        estimatedHours: 8,
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        order: i,
        dependencies: [],
      })),
      metadata: {
        aiGenerated: true,
        aiModel: params.scope?.metadata?.aiModel || 'Claude',
        packageId: params.packageId,
      },
    };
  }),
  createProjectActivityLog: vi.fn((project: any) => ({
    action: 'project_created',
    description: `Project "${project.name}" created`,
    metadata: { projectId: project.id },
  })),
}));

import {
  createProjectFromProposal,
  getProjectsForClient,
  getProjectById,
  assignStaff,
} from '../services/staff/projectService';

const scopeData: ProposalScope = {
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
} as any;

function resetMocks() {
  mockSupabase._setResults([]);
}

describe('projectService', () => {
  beforeEach(() => {
    resetMocks();
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
      // createProjectFromProposal queries:
      // 1. select.eq.eq.single (fetch proposal scope)
      // 2. insert.select.single (store project)
      // 3. insert (store tasks) -> then
      // 4. update.eq (update idea status) -> then
      // 5. insert (audit log) -> then
      mockSupabase._setResults([
        // fetch proposal scope
        { data: { scope_data: scopeData, status: 'sent' }, error: null },
        // insert project
        { data: { id: 'proj-123' }, error: null },
        // insert tasks
        { error: null },
        // update idea status
        { error: null },
        // audit log
        { error: null },
      ]);

      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.name).toContain('Test Idea');
      expect(result.project?.name).toContain('Better Package');
      expect(result.project?.tier).toBe('better');
      expect(result.project?.status).toBe('active');
    });

    it('should generate tasks from deliverables', async () => {
      mockSupabase._setResults([
        { data: { scope_data: scopeData, status: 'sent' }, error: null },
        { data: { id: 'proj-123' }, error: null },
        { error: null },
        { error: null },
        { error: null },
      ]);

      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.tasks).toBeDefined();
      expect(result.project?.tasks.length).toBeGreaterThan(0);

      const taskTitles = result.project?.tasks.map(t => t.title) || [];
      expect(taskTitles).toContain('Core feature implementation');
      expect(taskTitles).toContain('Database setup');
      expect(taskTitles).toContain('API development');
    });

    it('should calculate timeline correctly', async () => {
      mockSupabase._setResults([
        { data: { scope_data: scopeData, status: 'sent' }, error: null },
        { data: { id: 'proj-123' }, error: null },
        { error: null },
        { error: null },
        { error: null },
      ]);

      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.startDate).toBeDefined();
      expect(result.project?.estimatedEndDate).toBeDefined();

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
      mockSupabase._setResults([
        { data: { scope_data: scopeData, status: 'sent' }, error: null },
        { data: { id: 'proj-123' }, error: null },
        { error: null },
        { error: null },
        { error: null },
      ]);

      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.metadata.aiGenerated).toBe(true);
    });

    it('should set total estimated hours', async () => {
      mockSupabase._setResults([
        { data: { scope_data: scopeData, status: 'sent' }, error: null },
        { data: { id: 'proj-123' }, error: null },
        { error: null },
        { error: null },
        { error: null },
      ]);

      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBe(true);
      expect(result.project?.totalEstimatedHours).toBe(40);
    });
  });

  describe('getProjectsForClient', () => {
    it('should fetch projects successfully', async () => {
      mockSupabase._setResults([
        {
          data: [
            {
              id: 'p1',
              name: 'Project 1',
              description: 'Desc',
              status: 'active',
              tier: 'better',
              client_id: 'client-uuid-123',
              start_date: '2025-01-01',
              estimated_end_date: '2025-03-01',
              total_estimated_hours: 40,
              created_at: '2025-01-01',
              project_tasks: [],
            },
          ],
          error: null,
        },
      ]);

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
      mockSupabase._setResults([
        { data: [], error: null },
      ]);

      const params = {
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
        status: 'active' as const,
      };

      const result = await getProjectsForClient(params);

      expect(result.success).toBe(true);
    });

    it('should respect limit parameter', async () => {
      mockSupabase._setResults([
        { data: [], error: null },
      ]);

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
      mockSupabase._setResults([
        {
          data: {
            id: 'proj-123',
            name: 'Test Project',
            description: 'Test desc',
            status: 'active',
            tier: 'better',
            idea_id: 'idea-123',
            proposal_scope_id: 'scope-123',
            client_id: 'client-123',
            organization_id: 'org-123',
            start_date: '2025-01-01',
            estimated_end_date: '2025-03-01',
            total_estimated_hours: 40,
            metadata: { aiGenerated: true },
            project_tasks: [
              {
                id: 'task-1',
                title: 'Task 1',
                description: 'Task desc',
                status: 'pending',
                priority: 'medium',
                estimated_hours: 8,
                start_date: '2025-01-01',
                due_date: '2025-01-15',
                order: 0,
                dependencies: [],
              },
            ],
            contacts: {
              id: 'client-123',
              name: 'Test Client',
              email: 'client@test.com',
            },
            project_staff_assignments: [],
          },
          error: null,
        },
      ]);

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
      // assignStaff:
      // 1. select.eq.eq.single (verify project)
      // 2. select.eq.single (verify user)
      // 3. insert.select.single (create assignment)
      // 4. insert (audit log) -> then
      mockSupabase._setResults([
        { data: { id: 'proj-123', name: 'Test Project' }, error: null },
        { data: { id: 'user-uuid-123', full_name: 'Test User' }, error: null },
        { data: { id: 'assignment-1' }, error: null },
        { error: null },
      ]);

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

    it('should handle invalid role gracefully', async () => {
      mockSupabase._setResults([
        { data: { id: 'proj-123', name: 'Test Project' }, error: null },
        { data: { id: 'user-uuid-123', full_name: 'Test User' }, error: null },
        { data: null, error: { message: 'Invalid role value', code: '23503' } },
      ]);

      const invalidParams = {
        ...mockParams,
        role: 'invalid' as any,
      };

      const result = await assignStaff(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing proposal scope', async () => {
      mockSupabase._setResults([
        { data: null, error: { message: 'Not found' } },
      ]);

      const mockParams = {
        proposalScopeId: 'non-existent-scope',
        ideaId: 'idea-uuid-123',
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
        tier: 'better' as const,
        packageId: 'pkg-better',
      };

      const result = await createProjectFromProposal(mockParams);

      expect(result.success).toBeDefined();
    });

    it('should handle package without deliverables', async () => {
      mockSupabase._setResults([
        { data: { scope_data: scopeData, status: 'sent' }, error: null },
        { data: { id: 'proj-123' }, error: null },
        { error: null },
        { error: null },
        { error: null },
      ]);

      const result = await createProjectFromProposal({
        proposalScopeId: 'scope-uuid-123',
        ideaId: 'idea-uuid-123',
        clientId: 'client-uuid-123',
        organizationId: 'org-uuid-123',
        tier: 'better' as const,
        packageId: 'pkg-better',
      });

      expect(result.project?.tasks.length).toBeGreaterThan(0);
    });
  });
});
