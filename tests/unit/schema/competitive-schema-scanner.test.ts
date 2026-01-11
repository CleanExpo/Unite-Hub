import { describe, it, expect, vi } from 'vitest';
import {
  generateCompetitiveComparison,
  generateCompetitiveIntelligenceReport,
} from '@/lib/schema/competitive-schema-scanner';

describe('Competitive Schema Scanner', () => {
  const mockAnalysis = {
    competitorUrl: 'https://competitor1.com',
    analyzedAt: '2026-01-12T10:00:00Z',
    schemaTypes: ['LocalBusiness', 'Review'],
    schemaCount: 8,
    schemaCoverage: 35,
    contentMetrics: {
      totalPages: 45,
      pagesWithSchema: 16,
      avgWordsPerPage: 600,
      multimediaCount: {
        images: 120,
        videos: 3,
        total: 123,
      },
      internalLinkCount: 180,
    },
    subfolderStructure: {
      depth: 3,
      folders: ['services', 'blog', 'team'],
      estimatedArchitecture: 'Standard marketing site',
    },
    missingSchemas: [
      {
        schemaType: 'VideoObject',
        whereCompetitorHasIt: false,
        whereWeCouldAdd: ['testimonials', 'tutorial pages'],
        potentialImpact: 'high' as const,
        reason: 'Video improves E-E-A-T signals significantly',
      },
      {
        schemaType: 'FAQPage',
        whereCompetitorHasIt: false,
        whereWeCouldAdd: ['FAQ section'],
        potentialImpact: 'medium' as const,
        reason: 'FAQ helps with voice search optimization',
      },
    ],
    opportunities: [
      {
        area: 'Video testimonials',
        competitorScore: 10,
        ourCurrentScore: 80,
        gap: 70,
        action: 'Add 10+ video testimonials',
        estimatedImpact: 'Could rank for 20+ keywords',
      },
      {
        area: 'FAQ automation',
        competitorScore: 5,
        ourCurrentScore: 60,
        gap: 55,
        action: 'Create FAQ schema system',
        estimatedImpact: 'Could rank for 15+ questions',
      },
    ],
    depthScore: 45,
    technicalScore: 60,
    recommendations: [
      'Add VideoObject schema',
      'Create FAQPage schema',
      'Expand subfolder structure',
    ],
  };

  const ourMetrics = {
    schemaTypes: ['LocalBusiness', 'Review', 'VideoObject', 'FAQPage'],
    schemaCoverage: 85,
    contentMetrics: {
      totalPages: 120,
      pagesWithSchema: 102,
      avgWordsPerPage: 1200,
      multimediaCount: {
        images: 450,
        videos: 35,
        total: 485,
      },
      internalLinkCount: 680,
    },
    depthScore: 90,
    technicalScore: 92,
  };

  describe('Competitive Comparison', () => {
    it('should generate accurate comparison metrics', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      expect(comparison.competitor).toBe('https://competitor1.com');
      expect(comparison.areWeAhead).toBe(true);

      expect(comparison.metrics.schemaCoverage.ours).toBe(85);
      expect(comparison.metrics.schemaCoverage.theirs).toBe(35);
      expect(comparison.metrics.schemaCoverage.gap).toBe(50);
      expect(comparison.metrics.schemaCoverage.advantage).toBe('us');
    });

    it('should identify depth advantages', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      expect(comparison.metrics.depthScore.gap).toBe(45);
      expect(comparison.metrics.depthScore.advantage).toBe('us');
    });

    it('should identify technical advantages', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      expect(comparison.metrics.technicalScore.gap).toBe(32);
      expect(comparison.metrics.technicalScore.advantage).toBe('us');
    });

    it('should count content pages advantage', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      expect(comparison.metrics.contentPages.ours).toBe(120);
      expect(comparison.metrics.contentPages.theirs).toBe(45);
      expect(comparison.metrics.contentPages.gap).toBe(75);
    });

    it('should include top opportunities', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      expect(comparison.topOpportunities).toHaveLength(2);
      expect(comparison.topOpportunities[0].area).toBe('Video testimonials');
    });

    it('should generate action items from gaps', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      expect(comparison.actionItems.length).toBeGreaterThan(0);

      // High priority items should come first
      const highPriorityItems = comparison.actionItems.filter((a) => a.priority === 'high');
      expect(highPriorityItems.length).toBeGreaterThan(0);

      // Should include VideoObject (high impact gap)
      const videoAction = comparison.actionItems.find((a) =>
        a.action.toUpperCase().includes('VIDEOOBJECT')
      );
      expect(videoAction?.priority).toBe('high');
    });

    it('should correctly identify when competitor is ahead', () => {
      const behindMetrics = {
        schemaTypes: ['LocalBusiness'],
        schemaCoverage: 20,
        contentMetrics: {
          totalPages: 30,
          pagesWithSchema: 6,
          avgWordsPerPage: 400,
          multimediaCount: { images: 50, videos: 1, total: 51 },
          internalLinkCount: 80,
        },
        depthScore: 25,
        technicalScore: 40,
      };

      const comparison = generateCompetitiveComparison(mockAnalysis, behindMetrics);

      expect(comparison.areWeAhead).toBe(false);
      expect(comparison.metrics.schemaCoverage.advantage).toBe('them');
    });
  });

  describe('Competitive Intelligence Report', () => {
    const analysis2 = {
      ...mockAnalysis,
      competitorUrl: 'https://competitor2.com',
      schemaCoverage: 40,
      depthScore: 50,
      technicalScore: 65,
    };

    const analysis3 = {
      ...mockAnalysis,
      competitorUrl: 'https://competitor3.com',
      schemaCoverage: 30,
      depthScore: 40,
      technicalScore: 55,
    };

    it('should aggregate metrics across competitors', () => {
      const report = generateCompetitiveIntelligenceReport([
        mockAnalysis,
        analysis2,
        analysis3,
      ]);

      expect(report.competitorCount).toBe(3);
      expect(report.avgMetrics.schemaCoverage).toBe(35); // (35 + 40 + 30) / 3
      expect(report.avgMetrics.depthScore).toBe(45); // (45 + 50 + 40) / 3
      expect(report.avgMetrics.technicalScore).toBe(60); // (60 + 65 + 55) / 3
    });

    it('should identify top opportunities across all competitors', () => {
      const report = generateCompetitiveIntelligenceReport([
        mockAnalysis,
        analysis2,
        analysis3,
      ]);

      expect(report.topOpportunities.length).toBeGreaterThan(0);
      expect(report.topOpportunities[0].gap).toBeGreaterThanOrEqual(
        (report.topOpportunities[1]?.gap || 0)
      );
    });

    it('should find common missing schemas', () => {
      const report = generateCompetitiveIntelligenceReport([
        mockAnalysis,
        analysis2,
        analysis3,
      ]);

      expect(report.commonMissingSchemas.length).toBeGreaterThan(0);
      const top = report.commonMissingSchemas[0];
      expect(top.frequency).toBeGreaterThan(0);
    });

    it('should generate contextual strategy recommendations', () => {
      const report = generateCompetitiveIntelligenceReport([
        mockAnalysis,
        analysis2,
        analysis3,
      ]);

      expect(report.strategyRecommendation).toBeTruthy();
      expect(report.strategyRecommendation.length).toBeGreaterThan(20);
    });

    it('should recommend schema focus when coverage is low', () => {
      const lowCoverageAnalysis = [
        { ...mockAnalysis, schemaCoverage: 20 },
        { ...analysis2, schemaCoverage: 25 },
        { ...analysis3, schemaCoverage: 30 },
      ];

      const report = generateCompetitiveIntelligenceReport(lowCoverageAnalysis);

      expect(report.strategyRecommendation.toLowerCase()).toContain('schema');
    });

    it('should recommend content depth when depth is low', () => {
      const lowDepthAnalysis = [
        { ...mockAnalysis, depthScore: 30 },
        { ...analysis2, depthScore: 35 },
        { ...analysis3, depthScore: 30 },
      ];

      const report = generateCompetitiveIntelligenceReport(lowDepthAnalysis);

      expect(report.strategyRecommendation.toLowerCase()).toContain('depth');
    });

    it('should highlight high-frequency missing schemas', () => {
      const report = generateCompetitiveIntelligenceReport([
        mockAnalysis,
        analysis2,
        analysis3,
      ]);

      if (report.commonMissingSchemas.length > 0) {
        const topMissing = report.commonMissingSchemas[0];
        expect(report.strategyRecommendation).toContain(topMissing.schema);
      }
    });

    it('should generate report with current timestamp', () => {
      const report = generateCompetitiveIntelligenceReport([mockAnalysis]);

      expect(report.generatedAt).toBeTruthy();
      const reportDate = new Date(report.generatedAt);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - reportDate.getTime());
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });
  });

  describe('Action Item Generation', () => {
    it('should prioritize high-impact schema gaps', () => {
      const analysis = {
        ...mockAnalysis,
        missingSchemas: [
          {
            schemaType: 'VideoObject',
            whereCompetitorHasIt: false,
            whereWeCouldAdd: ['all pages'],
            potentialImpact: 'high' as const,
            reason: 'Critical for E-E-A-T',
          },
        ],
      };

      const comparison = generateCompetitiveComparison(analysis, ourMetrics);
      const actionItems = comparison.actionItems;

      const videoAction = actionItems.find((a) =>
        a.action.toUpperCase().includes('VIDEOOBJECT')
      );
      expect(videoAction?.priority).toBe('high');
    });

    it('should order actions by priority', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      for (let i = 0; i < comparison.actionItems.length - 1; i++) {
        const priorityMap = { high: 0, medium: 1, low: 2 };
        const current = priorityMap[comparison.actionItems[i].priority];
        const next = priorityMap[comparison.actionItems[i + 1].priority];
        expect(current).toBeLessThanOrEqual(next);
      }
    });

    it('should estimate realistic timelines', () => {
      const comparison = generateCompetitiveComparison(mockAnalysis, ourMetrics);

      comparison.actionItems.forEach((item) => {
        expect(item.timeline).toMatch(/\d+-\d+\s*weeks?/);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle competitor with no schema', () => {
      const noSchemaAnalysis = {
        ...mockAnalysis,
        schemaCoverage: 0,
        schemaCount: 0,
        schemaTypes: [],
      };

      const comparison = generateCompetitiveComparison(noSchemaAnalysis, ourMetrics);

      expect(comparison.areWeAhead).toBe(true);
      expect(comparison.metrics.schemaCoverage.gap).toBe(85);
    });

    it('should handle identical metrics', () => {
      const identicalMetrics = {
        schemaTypes: mockAnalysis.schemaTypes,
        schemaCoverage: mockAnalysis.schemaCoverage,
        contentMetrics: mockAnalysis.contentMetrics,
        depthScore: mockAnalysis.depthScore,
        technicalScore: mockAnalysis.technicalScore,
      };

      const comparison = generateCompetitiveComparison(mockAnalysis, identicalMetrics);

      expect(comparison.metrics.schemaCoverage.gap).toBe(0);
      expect(comparison.areWeAhead).toBe(false);
    });

    it('should handle single competitor analysis', () => {
      const report = generateCompetitiveIntelligenceReport([mockAnalysis]);

      expect(report.competitorCount).toBe(1);
      expect(report.avgMetrics.schemaCoverage).toBe(35);
    });
  });
});
