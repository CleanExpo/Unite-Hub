/**
 * Tests for projectCreator (Phase 3 Step 7)
 */

import { describe, it, expect } from 'vitest';
import {
  createProjectFromProposal,
  createProjectActivityLog,
  type ProjectCreationParams,
} from '../projects/projectCreator';
import type { ProposalScope } from '../projects/scope-planner';

describe('projectCreator', () => {
  const mockScope: ProposalScope = {
    idea: {
      id: 'idea-123',
      title: 'Restaurant Management App',
      description: 'Full-featured restaurant POS system',
    },
    packages: [
      {
        id: 'pkg-better',
        tier: 'better',
        label: 'Better Package',
        summary: 'Complete restaurant management solution',
        priceMin: 5000,
        priceMax: 7500,
        estimatedHours: 40,
        timeline: '4-6 weeks',
        deliverables: [
          'Core POS system',
          'Database setup',
          'API development',
          'Testing & QA',
        ],
      },
      {
        id: 'pkg-good',
        tier: 'good',
        label: 'Good Package',
        summary: 'Basic restaurant features',
        priceMin: 3000,
        priceMax: 4000,
        estimatedHours: 20,
        timeline: '2-3 weeks',
        deliverables: [],
      },
    ],
    metadata: {
      aiModel: 'Claude Hybrid',
    },
  };

  const mockParams: ProjectCreationParams = {
    proposalScopeId: 'scope-uuid-123',
    ideaId: 'idea-uuid-123',
    clientId: 'client-uuid-123',
    organizationId: 'org-uuid-123',
    tier: 'better',
    packageId: 'pkg-better',
    scope: mockScope,
  };

  describe('createProjectFromProposal', () => {
    it('should create project with correct metadata', () => {
      const project = createProjectFromProposal(mockParams);

      expect(project.id).toMatch(/^proj-/);
      expect(project.name).toBe('Restaurant Management App - Better Package');
      expect(project.description).toBe('Complete restaurant management solution');
      expect(project.status).toBe('active');
      expect(project.tier).toBe('better');
      expect(project.ideaId).toBe('idea-uuid-123');
      expect(project.proposalScopeId).toBe('scope-uuid-123');
      expect(project.clientId).toBe('client-uuid-123');
      expect(project.organizationId).toBe('org-uuid-123');
    });

    it('should set total estimated hours', () => {
      const project = createProjectFromProposal(mockParams);

      expect(project.totalEstimatedHours).toBe(40);
    });

    it('should calculate timeline from hours', () => {
      const project = createProjectFromProposal(mockParams);

      expect(project.startDate).toBeDefined();
      expect(project.estimatedEndDate).toBeDefined();

      const startDate = new Date(project.startDate);
      const endDate = new Date(project.estimatedEndDate!);

      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it('should calculate timeline from timeline string', () => {
      const project = createProjectFromProposal(mockParams);

      // Timeline is "4-6 weeks" so should be ~6 weeks
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.estimatedEndDate!);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Should be approximately 6 weeks (42 days)
      expect(diffDays).toBeGreaterThan(35);
      expect(diffDays).toBeLessThan(50);
    });

    it('should set AI-generated metadata', () => {
      const project = createProjectFromProposal(mockParams);

      expect(project.metadata.aiGenerated).toBe(true);
      expect(project.metadata.packageLabel).toBe('Better Package');
      expect(project.metadata.packageSummary).toBe('Complete restaurant management solution');
    });

    it('should throw error if package not found', () => {
      const invalidParams = {
        ...mockParams,
        packageId: 'non-existent-package',
      };

      expect(() => createProjectFromProposal(invalidParams)).toThrow('Selected package not found');
    });
  });

  describe('Task Generation - With Deliverables', () => {
    it('should generate tasks from deliverables', () => {
      const project = createProjectFromProposal(mockParams);

      expect(project.tasks.length).toBe(4);
      expect(project.tasks[0].title).toBe('Core POS system');
      expect(project.tasks[1].title).toBe('Database setup');
      expect(project.tasks[2].title).toBe('API development');
      expect(project.tasks[3].title).toBe('Testing & QA');
    });

    it('should distribute hours proportionally', () => {
      const project = createProjectFromProposal(mockParams);

      // 40 hours / 4 tasks = 10 hours each
      project.tasks.forEach(task => {
        expect(task.estimatedHours).toBe(10);
      });
    });

    it('should set task priorities', () => {
      const project = createProjectFromProposal(mockParams);

      // First task should be high priority (< 30% of total)
      expect(project.tasks[0].priority).toBe('high');

      // Middle tasks should be medium
      expect(project.tasks[1].priority).toBe('medium');
      expect(project.tasks[2].priority).toBe('medium');

      // Last task should be low priority (> 70% of total)
      expect(project.tasks[3].priority).toBe('low');
    });

    it('should set task order', () => {
      const project = createProjectFromProposal(mockParams);

      project.tasks.forEach((task, index) => {
        expect(task.order).toBe(index + 1);
      });
    });

    it('should set dependencies for core features', () => {
      const project = createProjectFromProposal(mockParams);

      // "Core POS system" contains "core" keyword, so task 2 should depend on task 1
      const task2 = project.tasks[1];
      expect(task2.dependencies).toBeDefined();
      if (task2.dependencies) {
        expect(task2.dependencies.length).toBeGreaterThan(0);
      }
    });

    it('should calculate start/due dates for tasks', () => {
      const project = createProjectFromProposal(mockParams);

      project.tasks.forEach(task => {
        expect(task.startDate).toBeDefined();
        expect(task.dueDate).toBeDefined();

        if (task.startDate && task.dueDate) {
          const start = new Date(task.startDate);
          const due = new Date(task.dueDate);
          expect(due.getTime()).toBeGreaterThanOrEqual(start.getTime());
        }
      });
    });
  });

  describe('Task Generation - Without Deliverables', () => {
    it('should generate generic tasks when no deliverables', () => {
      const paramsNoDeliverables: ProjectCreationParams = {
        ...mockParams,
        tier: 'good',
        packageId: 'pkg-good',
      };

      const project = createProjectFromProposal(paramsNoDeliverables);

      expect(project.tasks.length).toBe(4);
      expect(project.tasks[0].title).toBe('Project Setup');
      expect(project.tasks[1].title).toBe('Implementation');
      expect(project.tasks[2].title).toBe('Testing & QA');
      expect(project.tasks[3].title).toBe('Delivery');
    });

    it('should set dependencies for generic tasks', () => {
      const paramsNoDeliverables: ProjectCreationParams = {
        ...mockParams,
        tier: 'good',
        packageId: 'pkg-good',
      };

      const project = createProjectFromProposal(paramsNoDeliverables);

      // Implementation depends on Setup
      expect(project.tasks[1].dependencies).toContain('task-setup');

      // Testing depends on Implementation
      expect(project.tasks[2].dependencies).toContain('task-implementation');

      // Delivery depends on Testing
      expect(project.tasks[3].dependencies).toContain('task-testing');
    });

    it('should distribute hours correctly for generic tasks', () => {
      const paramsNoDeliverables: ProjectCreationParams = {
        ...mockParams,
        tier: 'good',
        packageId: 'pkg-good',
      };

      const project = createProjectFromProposal(paramsNoDeliverables);

      // Setup: 4 hours (fixed)
      expect(project.tasks[0].estimatedHours).toBe(4);

      // Implementation: 70% of total = 14 hours
      expect(project.tasks[1].estimatedHours).toBe(14);

      // Testing: 20% of total = 4 hours
      expect(project.tasks[2].estimatedHours).toBe(4);

      // Delivery: 10% of total = 2 hours
      expect(project.tasks[3].estimatedHours).toBe(2);
    });
  });

  describe('Priority Determination', () => {
    it('should set high priority for core keywords', () => {
      const scopeWithCore: ProposalScope = {
        ...mockScope,
        packages: [
          {
            ...mockScope.packages[0],
            deliverables: ['Core system', 'Essential features', 'Critical setup'],
          },
        ],
      };

      const project = createProjectFromProposal({
        ...mockParams,
        scope: scopeWithCore,
      });

      project.tasks.forEach(task => {
        expect(task.priority).toBe('high');
      });
    });

    it('should set low priority for optional keywords', () => {
      const scopeWithOptional: ProposalScope = {
        ...mockScope,
        packages: [
          {
            ...mockScope.packages[0],
            deliverables: ['Optional feature', 'Nice to have polish', 'Documentation'],
          },
        ],
      };

      const project = createProjectFromProposal({
        ...mockParams,
        scope: scopeWithOptional,
      });

      project.tasks.forEach(task => {
        expect(task.priority).toBe('low');
      });
    });
  });

  describe('createProjectActivityLog', () => {
    it('should create activity log entry', () => {
      const project = createProjectFromProposal(mockParams);
      const activityLog = createProjectActivityLog(project);

      expect(activityLog.action).toBe('project_created');
      expect(activityLog.description).toContain('Restaurant Management App - Better Package');
      expect(activityLog.description).toContain('better');
      expect(activityLog.timestamp).toBeDefined();
      expect(activityLog.metadata.projectId).toBe(project.id);
      expect(activityLog.metadata.tier).toBe('better');
      expect(activityLog.metadata.taskCount).toBe(4);
      expect(activityLog.metadata.estimatedHours).toBe(40);
      expect(activityLog.metadata.aiGenerated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle timeline with months', () => {
      const scopeWithMonths: ProposalScope = {
        ...mockScope,
        packages: [
          {
            ...mockScope.packages[0],
            timeline: '2-3 months',
          },
        ],
      };

      const project = createProjectFromProposal({
        ...mockParams,
        scope: scopeWithMonths,
      });

      const startDate = new Date(project.startDate);
      const endDate = new Date(project.estimatedEndDate!);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Should be approximately 3 months (90 days)
      expect(diffDays).toBeGreaterThan(75);
      expect(diffDays).toBeLessThan(105);
    });

    it('should handle missing timeline', () => {
      const scopeNoTimeline: ProposalScope = {
        ...mockScope,
        packages: [
          {
            ...mockScope.packages[0],
            timeline: undefined,
          },
        ],
      };

      const project = createProjectFromProposal({
        ...mockParams,
        scope: scopeNoTimeline,
      });

      // Should calculate from hours: 40 hours / 8 hours per day = 5 days
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.estimatedEndDate!);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(5);
    });

    it('should handle zero estimated hours', () => {
      const scopeNoHours: ProposalScope = {
        ...mockScope,
        packages: [
          {
            ...mockScope.packages[0],
            estimatedHours: undefined,
            timeline: undefined,
          },
        ],
      };

      const project = createProjectFromProposal({
        ...mockParams,
        scope: scopeNoHours,
      });

      // Should default to 4 weeks (28 days)
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.estimatedEndDate!);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(28);
    });
  });
});
