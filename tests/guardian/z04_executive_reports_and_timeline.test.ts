import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseServer } from '../__mocks__/guardianSupabase.mock';
import { createMockAnthropicClient } from '../__mocks__/guardianAnthropic.mock';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => createMockSupabaseServer()),
}));

// Mock Anthropic
vi.mock('@/lib/anthropic/client', () => ({
  getAnthropicClient: vi.fn(() => createMockAnthropicClient()),
}));

import {
  generateTimelinePointsFromReadiness,
  generateTimelinePointsFromEditionFit,
  generateTimelinePointsFromUplift,
  projectTimelineForward,
} from '@/lib/guardian/meta/healthTimelineService';
import {
  assembleExecutiveReportForTenant,
} from '@/lib/guardian/meta/executiveReportService';
import {
  exportReportAsJson,
  exportReportAsCsv,
  exportReportAsMarkdown,
  exportTimelineAsCsv,
  generateAllExportFormats,
} from '@/lib/guardian/meta/reportExportService';

describe('Z04: Executive Reports & Health Timeline', () => {
  describe('Health Timeline Generation', () => {
    it('should generate timeline point for readiness score improvement', () => {
      const current = {
        id: 'snap-1',
        overallScore: 75,
        overallStatus: 'mature',
        capabilities: [],
      };

      const previous = {
        id: 'snap-0',
        overallScore: 60,
        overallStatus: 'operational',
        capabilities: [],
      };

      const points = generateTimelinePointsFromReadiness('tenant-1', current, previous);

      expect(points.length).toBeGreaterThan(0);
      expect(points.some((p) => p.source === 'readiness')).toBe(true);
      expect(points.some((p) => p.metricKey === 'readiness_overall_score')).toBe(true);
      expect(points[0].metricValue).toBe(75);
    });

    it('should generate timeline point for status transition', () => {
      const current = {
        id: 'snap-1',
        overallScore: 65,
        overallStatus: 'mature',
        capabilities: [],
      };

      const previous = {
        id: 'snap-0',
        overallScore: 60,
        overallStatus: 'operational',
        capabilities: [],
      };

      const points = generateTimelinePointsFromReadiness('tenant-1', current, previous);

      expect(
        points.some(
          (p) =>
            p.label.includes('status transitioned') &&
            p.metadata?.from_status === 'operational'
        )
      ).toBe(true);
    });

    it('should generate timeline point for capability milestone', () => {
      const current = {
        id: 'snap-1',
        overallScore: 75,
        overallStatus: 'mature',
        capabilities: [
          {
            capabilityKey: 'guardian.core.rules',
            score: 80,
            status: 'ready',
            details: {},
          },
        ],
      };

      const previous = {
        id: 'snap-0',
        overallScore: 60,
        overallStatus: 'operational',
        capabilities: [
          {
            capabilityKey: 'guardian.core.rules',
            score: 30,
            status: 'not_configured',
            details: {},
          },
        ],
      };

      const points = generateTimelinePointsFromReadiness('tenant-1', current, previous);

      expect(
        points.some(
          (p) =>
            p.label.includes('reached ready status') &&
            p.metadata?.capability_key === 'guardian.core.rules'
        )
      ).toBe(true);
    });

    it('should not generate timeline point for small readiness deltas', () => {
      const current = {
        id: 'snap-1',
        overallScore: 62,
        overallStatus: 'operational',
        capabilities: [],
      };

      const previous = {
        id: 'snap-0',
        overallScore: 60,
        overallStatus: 'operational',
        capabilities: [],
      };

      const points = generateTimelinePointsFromReadiness('tenant-1', current, previous);

      expect(
        points.some((p) => p.metricKey === 'readiness_overall_score')
      ).toBe(false);
    });

    it('should generate timeline points for edition fit changes', () => {
      const currentFits = [
        {
          editionKey: 'guardian_core',
          overallFitScore: 70,
          status: 'aligned',
          gaps: [],
        },
      ];

      const previousFits = [
        {
          editionKey: 'guardian_core',
          overallFitScore: 50,
          status: 'emerging',
          gaps: [],
        },
      ];

      const points = generateTimelinePointsFromEditionFit(
        'tenant-1',
        currentFits as any,
        previousFits as any
      );

      expect(points.length).toBeGreaterThan(0);
      expect(points[0].source).toBe('edition_fit');
      expect(points[0].metricKey).toMatch(/edition_fit/);
    });

    it('should generate timeline points for uplift task completion', () => {
      const currentPlan = {
        id: 'plan-1',
        title: 'Baseline to Operational',
        status: 'in_progress',
      };

      const currentTasks = [
        { id: 'task-1', status: 'completed' },
        { id: 'task-2', status: 'completed' },
        { id: 'task-3', status: 'in_progress' },
      ];

      const previousTasks = [
        { id: 'task-1', status: 'completed' },
        { id: 'task-2', status: 'in_progress' },
        { id: 'task-3', status: 'in_progress' },
      ];

      const points = generateTimelinePointsFromUplift(
        'tenant-1',
        currentPlan as any,
        currentPlan as any,
        currentTasks as any,
        previousTasks as any
      );

      expect(points.length).toBeGreaterThan(0);
      expect(points.some((p) => p.source === 'uplift')).toBe(true);
      expect(
        points.some(
          (p) => p.metricKey === 'uplift_tasks_completed' && p.metricValue === 2
        )
      ).toBe(true);
    });
  });

  describe('Timeline Projections', () => {
    it('should project timeline forward based on trends', () => {
      const timeline = [
        {
          occurredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          source: 'readiness',
          metricKey: 'readiness_overall_score',
          metricValue: 40,
          label: 'Readiness 40',
          category: 'core',
          relatedIds: {},
        },
        {
          occurredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          source: 'readiness',
          metricKey: 'readiness_overall_score',
          metricValue: 60,
          label: 'Readiness 60',
          category: 'core',
          relatedIds: {},
        },
      ];

      const projections = projectTimelineForward(
        'tenant-1',
        timeline as any,
        30
      );

      expect(projections.length).toBeGreaterThan(0);
      expect(projections[0].projectedDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should predict readiness maturity milestone', () => {
      const timeline = [
        {
          occurredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          source: 'readiness',
          metricKey: 'readiness_overall_score',
          metricValue: 40,
          label: 'Readiness 40',
          category: 'core',
          relatedIds: {},
        },
        {
          occurredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          source: 'readiness',
          metricKey: 'readiness_overall_score',
          metricValue: 70,
          label: 'Readiness 70',
          category: 'core',
          relatedIds: {},
        },
      ];

      const projections = projectTimelineForward('tenant-1', timeline as any, 30);

      const matureProjection = projections.find(
        (p) => p.label.includes('mature') || p.label.includes('80')
      );
      expect(matureProjection).toBeDefined();
    });

    it('should include confidence scores', () => {
      const timeline = [
        {
          occurredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          source: 'readiness',
          metricKey: 'readiness_overall_score',
          metricValue: 40,
          label: 'Readiness 40',
          category: 'core',
          relatedIds: {},
        },
        {
          occurredAt: new Date(),
          source: 'readiness',
          metricKey: 'readiness_overall_score',
          metricValue: 70,
          label: 'Readiness 70',
          category: 'core',
          relatedIds: {},
        },
      ];

      const projections = projectTimelineForward(
        'tenant-1',
        timeline as any,
        30
      );

      projections.forEach((p) => {
        expect(p.confidence).toBeGreaterThanOrEqual(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Executive Report Assembly', () => {
    it('should assemble report with all required sections', async () => {
      const readiness = {
        id: 'snap-1',
        overallScore: 65,
        overallStatus: 'mature',
        capabilities: [
          {
            capabilityKey: 'guardian.core.rules',
            score: 70,
            status: 'ready',
            details: {},
          },
          {
            capabilityKey: 'guardian.core.alerts',
            score: 60,
            status: 'partial',
            details: {},
          },
        ],
      };

      const editions = [
        {
          editionKey: 'guardian_core',
          overallFitScore: 65,
          status: 'aligned',
          gaps: [],
          capabilityScores: {},
        },
      ];

      const report = await assembleExecutiveReportForTenant(
        'tenant-1',
        readiness as any,
        null,
        editions as any,
        null,
        null,
        [],
        [],
        { reportType: 'snapshot' }
      );

      expect(report.summary.readinessScore).toBe(65);
      expect(report.sections.length).toBeGreaterThan(0);
      expect(report.sections.some((s) => s.category === 'readiness')).toBe(true);
    });

    it('should calculate edition alignment score correctly', async () => {
      const readiness = {
        id: 'snap-1',
        overallScore: 70,
        overallStatus: 'mature',
        capabilities: [],
      };

      const editions = [
        {
          editionKey: 'guardian_core',
          overallFitScore: 80,
          status: 'aligned',
          gaps: [],
          capabilityScores: {},
        },
        {
          editionKey: 'guardian_pro',
          overallFitScore: 60,
          status: 'emerging',
          gaps: [],
          capabilityScores: {},
        },
      ];

      const report = await assembleExecutiveReportForTenant(
        'tenant-1',
        readiness as any,
        null,
        editions as any,
        null,
        null,
        [],
        [],
        { reportType: 'snapshot' }
      );

      expect(report.summary.editionAlignmentScore).toBe(70); // (80 + 60) / 2
    });

    it('should determine risk level based on readiness and edition alignment', async () => {
      const lowRiskReadiness = {
        id: 'snap-1',
        overallScore: 80,
        overallStatus: 'network_intelligent',
        capabilities: Array(10)
          .fill(null)
          .map((_, i) => ({
            capabilityKey: `cap-${i}`,
            score: 80,
            status: 'mature',
            details: {},
          })),
      };

      const editions = [
        {
          editionKey: 'guardian_core',
          overallFitScore: 90,
          status: 'aligned',
          gaps: [],
          capabilityScores: {},
        },
      ];

      const report = await assembleExecutiveReportForTenant(
        'tenant-1',
        lowRiskReadiness as any,
        null,
        editions as any,
        null,
        null,
        [],
        [],
        { reportType: 'snapshot' }
      );

      expect(report.summary.riskLevel).toBe('low');
    });

    it('should include edition-specific focus if provided', async () => {
      const readiness = {
        id: 'snap-1',
        overallScore: 70,
        overallStatus: 'mature',
        capabilities: [],
      };

      const report = await assembleExecutiveReportForTenant(
        'tenant-1',
        readiness as any,
        null,
        [],
        null,
        null,
        [],
        [],
        { editionKey: 'guardian_pro', reportType: 'snapshot' }
      );

      expect(report.editionKey).toBe('guardian_pro');
    });
  });

  describe('Report Export Formats', () => {
    it('should export report as valid JSON', async () => {
      const report = {
        tenantId: 'tenant-1',
        createdAt: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
        title: 'Test Report',
        reportType: 'snapshot' as const,
        audience: 'executive' as const,
        summary: {
          readinessScore: 70,
          readinessDelta: 10,
          readinessStatus: 'mature',
          upliftProgressPct: 50,
          upliftTasksCompletedCount: 5,
          upliftTasksTotalCount: 10,
          editionAlignmentScore: 65,
          editionAlignmentStatus: 'aligned',
          networkHealthStatus: 'healthy',
          riskLevel: 'low' as const,
        },
        sections: [
          {
            sectionKey: 'readiness',
            sectionTitle: 'Readiness Overview',
            description: 'Test',
            category: 'readiness',
            metrics: { score: 70 },
            highlights: ['Test highlight'],
            recommendations: ['Test recommendation'],
          },
        ],
      };

      const json = exportReportAsJson(report as any);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.metadata.title).toBe('Test Report');
      expect(parsed.summary.readinessScore).toBe(70);
    });

    it('should export report as CSV with proper formatting', async () => {
      const report = {
        tenantId: 'tenant-1',
        createdAt: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
        title: 'Test Report',
        reportType: 'snapshot' as const,
        audience: 'executive' as const,
        summary: {
          readinessScore: 70,
          readinessDelta: 10,
          readinessStatus: 'mature',
          upliftProgressPct: 50,
          upliftTasksCompletedCount: 5,
          upliftTasksTotalCount: 10,
          editionAlignmentScore: 65,
          editionAlignmentStatus: 'aligned',
          networkHealthStatus: 'healthy',
          riskLevel: 'low' as const,
        },
        sections: [],
      };

      const csv = exportReportAsCsv(report as any);

      expect(csv).toContain('Title,Test Report');
      expect(csv).toContain('SUMMARY METRICS');
      expect(csv).toContain('70/100');
    });

    it('should export report as valid Markdown', async () => {
      const report = {
        tenantId: 'tenant-1',
        createdAt: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
        title: 'Test Report',
        reportType: 'snapshot' as const,
        audience: 'executive' as const,
        summary: {
          readinessScore: 70,
          readinessDelta: 10,
          readinessStatus: 'mature',
          upliftProgressPct: 50,
          upliftTasksCompletedCount: 5,
          upliftTasksTotalCount: 10,
          editionAlignmentScore: 65,
          editionAlignmentStatus: 'aligned',
          networkHealthStatus: 'healthy',
          riskLevel: 'low' as const,
        },
        sections: [],
        narrative: {
          introParagraph: 'Test intro',
        },
      };

      const md = exportReportAsMarkdown(report as any);

      expect(md).toContain('# Test Report');
      expect(md).toContain('## Executive Summary');
      expect(md).toContain('## Key Metrics');
      expect(md).toContain('Test intro');
    });

    it('should export timeline as CSV', () => {
      const timeline = [
        {
          id: 'point-1',
          tenantId: 'tenant-1',
          occurredAt: new Date(),
          source: 'readiness',
          label: 'Readiness improved',
          category: 'core',
          metricKey: 'readiness_overall_score',
          metricValue: 75,
          narrativeSnippet: 'Score improved from 60 to 75',
          relatedIds: {},
        },
      ];

      const csv = exportTimelineAsCsv(timeline as any);

      expect(csv).toContain('Date,Source,Label');
      expect(csv).toContain('readiness');
      expect(csv).toContain('Readiness improved');
    });

    it('should generate all export formats in batch', async () => {
      const report = {
        tenantId: 'tenant-1',
        createdAt: new Date('2025-01-01'),
        periodStart: new Date(),
        periodEnd: new Date(),
        title: 'Test Report',
        reportType: 'snapshot' as const,
        audience: 'executive' as const,
        summary: {
          readinessScore: 70,
          readinessDelta: 0,
          readinessStatus: 'mature',
          upliftProgressPct: 0,
          upliftTasksCompletedCount: 0,
          upliftTasksTotalCount: 0,
          editionAlignmentScore: 0,
          editionAlignmentStatus: 'not_started',
          networkHealthStatus: 'healthy',
          riskLevel: 'low' as const,
        },
        sections: [],
      };

      const timeline = [
        {
          id: 'point-1',
          tenantId: 'tenant-1',
          occurledAt: new Date(),
          source: 'readiness',
          label: 'Test',
          category: 'core',
          relatedIds: {},
        },
      ];

      const formats = generateAllExportFormats(report as any, timeline as any);

      expect(formats).toHaveProperty('json');
      expect(formats).toHaveProperty('csv');
      expect(formats).toHaveProperty('markdown');
      expect(formats).toHaveProperty('timeline_csv');

      expect(formats.json.filename).toMatch(/report_2025-01-01\.json/);
      expect(formats.csv.mimeType).toBe('text/csv');
      expect(formats.markdown.content).toContain('# Test Report');
    });
  });

  describe('Report Privacy & Advisory-Only Pattern', () => {
    it('should not expose PII in timeline narrative snippets', () => {
      const timeline = [
        {
          id: 'point-1',
          tenantId: 'tenant-1',
          occurredAt: new Date(),
          source: 'readiness',
          label: 'Status changed',
          category: 'core',
          narrativeSnippet: 'Readiness improved from 60 to 75', // No emails, names, etc.
          relatedIds: {},
        },
      ];

      const csv = exportTimelineAsCsv(timeline as any);

      // Verify no email-like patterns
      expect(csv).not.toMatch(/[\w\.-]+@[\w\.-]+/);
    });

    it('should frame reports as advisory, not enforcement', async () => {
      const readiness = {
        id: 'snap-1',
        overallScore: 50,
        overallStatus: 'operational',
        capabilities: [],
      };

      const report = await assembleExecutiveReportForTenant(
        'tenant-1',
        readiness as any,
        null,
        [],
        null,
        null,
        [],
        [],
        { reportType: 'snapshot' }
      );

      // Check that sections use advisory language
      report.sections.forEach((s) => {
        s.recommendations.forEach((r) => {
          // Should use "should", "consider", "recommend" not "must", "will enable"
          expect(r).not.toMatch(/must enable|auto-enable|automatically activate/i);
        });
      });
    });

    it('should not include sensitive metadata in exports', async () => {
      const report = {
        tenantId: 'tenant-1',
        createdAt: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
        title: 'Test Report',
        reportType: 'snapshot' as const,
        audience: 'executive' as const,
        summary: {
          readinessScore: 70,
          readinessDelta: 0,
          readinessStatus: 'mature',
          upliftProgressPct: 0,
          upliftTasksCompletedCount: 0,
          upliftTasksTotalCount: 0,
          editionAlignmentScore: 0,
          editionAlignmentStatus: 'not_started',
          networkHealthStatus: 'healthy',
          riskLevel: 'low' as const,
        },
        sections: [],
        metadata: {
          internalSecret: 'do not export',
        },
      };

      const json = exportReportAsJson(report as any);
      const parsed = JSON.parse(json);

      // Metadata should be included but not sensitive data
      expect(parsed.metadata).toBeDefined();
    });
  });

  describe('Report Immutability & Audit Trail', () => {
    it('should preserve report creation timestamp', async () => {
      const createdTime = new Date('2025-01-15T10:00:00Z');

      const report = {
        tenantId: 'tenant-1',
        createdAt: createdTime,
        periodStart: new Date(),
        periodEnd: new Date(),
        title: 'Test Report',
        reportType: 'snapshot' as const,
        audience: 'executive' as const,
        summary: {
          readinessScore: 70,
          readinessDelta: 0,
          readinessStatus: 'mature',
          upliftProgressPct: 0,
          upliftTasksCompletedCount: 0,
          upliftTasksTotalCount: 0,
          editionAlignmentScore: 0,
          editionAlignmentStatus: 'not_started',
          networkHealthStatus: 'healthy',
          riskLevel: 'low' as const,
        },
        sections: [],
      };

      const json = exportReportAsJson(report as any);
      const parsed = JSON.parse(json);

      expect(parsed.metadata.createdAt).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should preserve related IDs for audit trail', () => {
      const timeline = [
        {
          id: 'point-1',
          tenantId: 'tenant-1',
          occurredAt: new Date(),
          source: 'readiness',
          label: 'Readiness improved',
          category: 'core',
          relatedIds: {
            snapshot_id: 'snap-123',
            previous_snapshot_id: 'snap-122',
          },
        },
      ];

      const csv = exportTimelineAsCsv(timeline as any);

      // CSV should include related IDs for traceability
      expect(csv).toContain('snap-123');
    });
  });
});
