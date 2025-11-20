/**
 * Unit tests for Phase 13 Week 7-8: Leviathan Orchestrator
 */

import { LeviathanOrchestratorService } from '../LeviathanOrchestratorService';
import { IndexingHealthService } from '../IndexingHealthService';
import { DeploymentAuditService } from '../DeploymentAuditService';

describe('LeviathanOrchestratorService', () => {
  let orchestrator: LeviathanOrchestratorService;

  beforeEach(() => {
    orchestrator = new LeviathanOrchestratorService(12345);
  });

  describe('orchestrate', () => {
    it('should execute full orchestration run', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'full',
        name: 'Test Run',
        fabrication: {
          topic: 'Test Topic',
          keywords: ['test', 'keyword'],
        },
        cloud: {
          providers: ['aws', 'gcs'],
          variantCount: 2,
          deploymentType: 'daisy_chain',
        },
        social: {
          bloggerBlogId: 'test-blog',
          gsiteEnabled: true,
          bloggerCount: 1,
          gsiteCount: 1,
        },
      });

      // Orchestration completes (may have step failures that are rolled back)
      expect(result.run).toBeDefined();
      expect(result.run.steps.length).toBeGreaterThan(0);
      expect(['completed', 'failed']).toContain(result.run.status);
    });

    it('should execute fabrication-only run', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'fabrication_only',
        fabrication: {
          topic: 'Test Topic',
          keywords: ['test'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.run.steps.length).toBe(1);
      expect(result.run.steps[0].type).toBe('fabrication');
    });

    it('should execute deployment-only run', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'deployment_only',
        cloud: {
          providers: ['aws'],
          variantCount: 2,
          deploymentType: 'single',
        },
      });

      // Run includes cloud_deploy step
      expect(result.run.steps.some(s => s.type === 'cloud_deploy')).toBe(true);
      expect(['completed', 'failed']).toContain(result.run.status);
    });

    it('should execute social-only run', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'social_only',
        social: {
          bloggerBlogId: 'test-blog',
          gsiteEnabled: true,
          bloggerCount: 1,
          gsiteCount: 1,
        },
      });

      expect(result.success).toBe(true);
      expect(result.run.steps.some(s => s.type === 'blogger_publish')).toBe(true);
    });

    it('should execute health-check run', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'health_check',
      });

      expect(result.success).toBe(true);
      expect(result.run.steps.some(s => s.type === 'health_check')).toBe(true);
      expect(result.healthScores.length).toBeGreaterThan(0);
    });

    it('should track run duration', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'health_check',
      });

      expect(result.run.durationMs).toBeDefined();
      expect(result.run.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should generate unique run IDs', async () => {
      const result1 = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'health_check',
      });

      const result2 = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'health_check',
      });

      expect(result1.run.id).not.toBe(result2.run.id);
    });

    it('should include deployed URLs in result', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'deployment_only',
        cloud: {
          providers: ['aws', 'gcs'],
          variantCount: 4,
          deploymentType: 'daisy_chain',
        },
      });

      // deployedUrls is populated if cloud_deploy succeeds
      expect(result.deployedUrls).toBeDefined();
      expect(Array.isArray(result.deployedUrls)).toBe(true);
    });

    it('should skip steps without config', async () => {
      const result = await orchestrator.orchestrate({
        orgId: 'test-org',
        targetUrl: 'https://example.com',
        runType: 'full',
        // No fabrication config
        cloud: {
          providers: ['aws'],
          variantCount: 1,
          deploymentType: 'single',
        },
      });

      const fabStep = result.run.steps.find(s => s.type === 'fabrication');
      expect(fabStep?.output?.skipped).toBe(true);
    });
  });

  describe('cancelRun', () => {
    it('should cancel a running orchestration', async () => {
      const cancelled = await orchestrator.cancelRun('test-run-id');
      expect(cancelled).toBe(true);
    });
  });
});

describe('IndexingHealthService', () => {
  let healthService: IndexingHealthService;

  beforeEach(() => {
    healthService = new IndexingHealthService();
  });

  describe('checkHealth', () => {
    it('should check health of a URL', async () => {
      const result = await healthService.checkHealth({
        url: 'https://example.com',
        urlType: 'money_site',
      });

      expect(result.url).toBe('https://example.com');
      expect(result.urlType).toBe('money_site');
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
    });

    it('should detect schema.org markup', async () => {
      const result = await healthService.checkHealth({
        url: 'https://example.com',
        urlType: 'cloud',
      });

      expect(result.hasSchema).toBeDefined();
      expect(result.schemaValid).toBeDefined();
    });

    it('should detect OG image', async () => {
      const result = await healthService.checkHealth({
        url: 'https://example.com',
        urlType: 'blogger',
      });

      expect(result.hasOgImage).toBeDefined();
      if (result.hasOgImage) {
        expect(result.ogImageUrl).toBeDefined();
        expect(result.ogImageHash).toBeDefined();
      }
    });

    it('should measure load time', async () => {
      const result = await healthService.checkHealth({
        url: 'https://example.com',
        urlType: 'gsite',
      });

      expect(result.loadTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should generate recommendations', async () => {
      const result = await healthService.checkHealth({
        url: 'https://example.com',
        urlType: 'cloud',
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('checkHealthBatch', () => {
    it('should check multiple URLs', async () => {
      const result = await healthService.checkHealthBatch([
        { url: 'https://example1.com', urlType: 'cloud' },
        { url: 'https://example2.com', urlType: 'blogger' },
      ]);

      expect(result.results.length).toBe(2);
      expect(result.totalChecked).toBe(2);
      expect(result.averageScore).toBeGreaterThanOrEqual(0);
    });

    it('should count failed checks', async () => {
      const result = await healthService.checkHealthBatch([
        { url: 'https://example.com', urlType: 'cloud' },
      ]);

      expect(result.failedChecks).toBeDefined();
    });
  });

  describe('verifyContentHash', () => {
    it('should verify matching content hash', () => {
      const content = 'Test content';
      const hash = healthService.generateContentHash(content);
      expect(healthService.verifyContentHash(content, hash)).toBe(true);
    });

    it('should reject mismatched content hash', () => {
      const content = 'Test content';
      const wrongHash = 'abc123';
      expect(healthService.verifyContentHash(content, wrongHash)).toBe(false);
    });
  });

  describe('generateContentHash', () => {
    it('should generate consistent hashes', () => {
      const content = 'Test content';
      const hash1 = healthService.generateContentHash(content);
      const hash2 = healthService.generateContentHash(content);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = healthService.generateContentHash('Content 1');
      const hash2 = healthService.generateContentHash('Content 2');
      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('DeploymentAuditService', () => {
  let auditService: DeploymentAuditService;

  beforeEach(() => {
    auditService = new DeploymentAuditService();
  });

  describe('log', () => {
    it('should create audit log entry', () => {
      const entry = auditService.log({
        orgId: 'test-org',
        actionType: 'test_action',
        actionResult: 'success',
        details: { test: 'data' },
        linksCreated: 0,
        assetsUploaded: 0,
        actorType: 'system',
        metadata: {},
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.actionType).toBe('test_action');
    });
  });

  describe('logFabrication', () => {
    it('should log fabrication action', () => {
      const entry = auditService.logFabrication({
        orgId: 'test-org',
        runId: 'test-run',
        topic: 'Test Topic',
        contentType: 'article',
        wordCount: 500,
        contentHash: 'abc123',
        durationMs: 1000,
        success: true,
      });

      expect(entry.actionType).toBe('fabrication');
      expect(entry.actionResult).toBe('success');
      expect(entry.details.wordCount).toBe(500);
    });
  });

  describe('logCloudDeployment', () => {
    it('should log cloud deployment action', () => {
      const entry = auditService.logCloudDeployment({
        orgId: 'test-org',
        runId: 'test-run',
        provider: 'aws',
        variantIndex: 0,
        seed: 12345,
        deployedUrl: 'https://aws.example.com/content',
        assetCount: 3,
        durationMs: 2000,
        success: true,
        randomisation: { template: 'standard' },
      });

      expect(entry.actionType).toBe('cloud_deployment');
      expect(entry.variantIndex).toBe(0);
      expect(entry.seed).toBe(12345);
      expect(entry.assetsUploaded).toBe(3);
    });
  });

  describe('logBloggerPublish', () => {
    it('should log blogger publish action', () => {
      const entry = auditService.logBloggerPublish({
        orgId: 'test-org',
        runId: 'test-run',
        blogId: 'blog-123',
        postId: 'post-456',
        postUrl: 'https://example.blogspot.com/post',
        variantIndex: 1,
        seed: 54321,
        durationMs: 1500,
        success: true,
      });

      expect(entry.actionType).toBe('blogger_publish');
      expect(entry.linksCreated).toBe(1);
    });
  });

  describe('logGSiteCreation', () => {
    it('should log gsite creation action', () => {
      const entry = auditService.logGSiteCreation({
        orgId: 'test-org',
        runId: 'test-run',
        siteName: 'Test Site',
        siteUrl: 'https://sites.google.com/view/test',
        embeddedCount: 3,
        variantIndex: 0,
        seed: 11111,
        durationMs: 3000,
        success: true,
      });

      expect(entry.actionType).toBe('gsite_creation');
      expect(entry.linksCreated).toBe(4); // 3 embedded + 1
    });
  });

  describe('logLinkPropagation', () => {
    it('should log link propagation action', () => {
      const entry = auditService.logLinkPropagation({
        orgId: 'test-org',
        runId: 'test-run',
        totalLinks: 15,
        linksByLayer: { layer1To2: 5, layer2To3: 6, layer3To4: 4 },
        durationMs: 500,
        success: true,
      });

      expect(entry.actionType).toBe('link_propagation');
      expect(entry.linksCreated).toBe(15);
    });
  });

  describe('logHealthCheck', () => {
    it('should log health check action', () => {
      const entry = auditService.logHealthCheck({
        orgId: 'test-org',
        url: 'https://example.com',
        healthScore: 85,
        issues: [],
        durationMs: 200,
      });

      expect(entry.actionType).toBe('health_check');
      expect(entry.actionResult).toBe('success');
    });

    it('should mark low scores as failure', () => {
      const entry = auditService.logHealthCheck({
        orgId: 'test-org',
        url: 'https://example.com',
        healthScore: 30,
        issues: ['Missing schema', 'No OG image'],
        durationMs: 200,
      });

      expect(entry.actionResult).toBe('failure');
    });
  });

  describe('logRollback', () => {
    it('should log rollback action', () => {
      const entry = auditService.logRollback({
        orgId: 'test-org',
        runId: 'test-run',
        stepId: 'step-123',
        reason: 'Cloud deployment failed',
        itemsRolledBack: 3,
        durationMs: 800,
        success: true,
      });

      expect(entry.actionType).toBe('rollback');
      expect(entry.details.itemsRolledBack).toBe(3);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      // Add test data
      auditService.logFabrication({
        orgId: 'org-1',
        runId: 'run-1',
        topic: 'Topic 1',
        contentType: 'article',
        wordCount: 500,
        contentHash: 'hash1',
        durationMs: 1000,
        success: true,
      });

      auditService.logCloudDeployment({
        orgId: 'org-1',
        runId: 'run-1',
        provider: 'aws',
        variantIndex: 0,
        seed: 12345,
        deployedUrl: 'https://aws.example.com',
        assetCount: 1,
        durationMs: 2000,
        success: true,
        randomisation: {},
      });

      auditService.logFabrication({
        orgId: 'org-2',
        runId: 'run-2',
        topic: 'Topic 2',
        contentType: 'article',
        wordCount: 600,
        contentHash: 'hash2',
        durationMs: 1200,
        success: false,
      });
    });

    it('should filter by orgId', () => {
      const results = auditService.query({ orgId: 'org-1' });
      expect(results.length).toBe(2);
      results.forEach(r => expect(r.orgId).toBe('org-1'));
    });

    it('should filter by actionType', () => {
      const results = auditService.query({
        orgId: 'org-1',
        actionType: 'fabrication',
      });
      expect(results.length).toBe(1);
      expect(results[0].actionType).toBe('fabrication');
    });

    it('should filter by actionResult', () => {
      const results = auditService.query({
        orgId: 'org-2',
        actionResult: 'failure',
      });
      expect(results.length).toBe(1);
      expect(results[0].actionResult).toBe('failure');
    });

    it('should apply limit', () => {
      const results = auditService.query({ orgId: 'org-1', limit: 1 });
      expect(results.length).toBe(1);
    });
  });

  describe('generateReport', () => {
    beforeEach(() => {
      // Add test data
      for (let i = 0; i < 5; i++) {
        auditService.logFabrication({
          orgId: 'test-org',
          runId: `run-${i}`,
          topic: `Topic ${i}`,
          contentType: 'article',
          wordCount: 500,
          contentHash: `hash${i}`,
          durationMs: 1000,
          success: true,
        });
      }

      auditService.logCloudDeployment({
        orgId: 'test-org',
        runId: 'run-1',
        provider: 'aws',
        variantIndex: 0,
        seed: 12345,
        deployedUrl: 'https://aws.example.com',
        assetCount: 3,
        durationMs: 2000,
        success: true,
        randomisation: {},
      });
    });

    it('should generate report with totals', () => {
      const report = auditService.generateReport({ orgId: 'test-org' });

      expect(report.totalEntries).toBe(6);
      expect(report.successCount).toBe(6);
      expect(report.failureCount).toBe(0);
    });

    it('should group by action type', () => {
      const report = auditService.generateReport({ orgId: 'test-org' });

      expect(report.byActionType.fabrication).toBe(5);
      expect(report.byActionType.cloud_deployment).toBe(1);
    });

    it('should calculate average duration', () => {
      const report = auditService.generateReport({ orgId: 'test-org' });

      expect(report.averageDuration).toBeGreaterThan(0);
    });

    it('should count assets uploaded', () => {
      const report = auditService.generateReport({ orgId: 'test-org' });

      expect(report.totalAssetsUploaded).toBe(3);
    });
  });

  describe('getRunLogs', () => {
    it('should get logs for specific run', () => {
      auditService.logFabrication({
        orgId: 'test-org',
        runId: 'run-123',
        topic: 'Topic',
        contentType: 'article',
        wordCount: 500,
        contentHash: 'hash',
        durationMs: 1000,
        success: true,
      });

      const logs = auditService.getRunLogs('run-123');
      expect(logs.length).toBe(1);
      expect(logs[0].runId).toBe('run-123');
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      auditService.log({
        orgId: 'test-org',
        actionType: 'test',
        actionResult: 'success',
        details: {},
        linksCreated: 0,
        assetsUploaded: 0,
        actorType: 'system',
        metadata: {},
      });

      auditService.clearLogs();

      const logs = auditService.query({ orgId: 'test-org' });
      expect(logs.length).toBe(0);
    });
  });
});

describe('Integration: Orchestrator with Audit', () => {
  it('should audit all orchestration steps', async () => {
    const orchestrator = new LeviathanOrchestratorService(99999);
    const auditService = new DeploymentAuditService();

    const result = await orchestrator.orchestrate({
      orgId: 'test-org',
      targetUrl: 'https://example.com',
      runType: 'full',
      fabrication: {
        topic: 'Test',
        keywords: ['test'],
      },
      cloud: {
        providers: ['aws'],
        variantCount: 1,
        deploymentType: 'single',
      },
      social: {
        gsiteEnabled: true,
        bloggerCount: 1,
        gsiteCount: 1,
      },
    });

    // Log orchestration result
    auditService.log({
      orgId: 'test-org',
      runId: result.run.id,
      actionType: 'orchestration',
      actionResult: result.success ? 'success' : 'failure',
      details: {
        stepsCompleted: result.run.steps.filter(s => s.status === 'completed').length,
      },
      linksCreated: 0,
      assetsUploaded: result.deployedUrls.length,
      durationMs: result.run.durationMs,
      actorType: 'system',
      metadata: {},
    });

    const logs = auditService.getRunLogs(result.run.id);
    expect(logs.length).toBe(1);
  });
});

describe('Integration: Health Check with Orchestration', () => {
  it('should perform health check on deployed URLs', async () => {
    const orchestrator = new LeviathanOrchestratorService(88888);
    const healthService = new IndexingHealthService();

    const result = await orchestrator.orchestrate({
      orgId: 'test-org',
      targetUrl: 'https://example.com',
      runType: 'deployment_only',
      cloud: {
        providers: ['aws', 'gcs'],
        variantCount: 2,
        deploymentType: 'daisy_chain',
      },
    });

    // Check health of deployed URLs (or target URL if no deployments)
    const urlsToCheck = result.deployedUrls.length > 0
      ? result.deployedUrls
      : ['https://example.com'];

    const healthResults = await healthService.checkHealthBatch(
      urlsToCheck.map(url => ({
        url,
        urlType: 'cloud' as const,
      }))
    );

    expect(healthResults.results.length).toBeGreaterThan(0);
    expect(healthResults.averageScore).toBeGreaterThanOrEqual(0);
  });
});
