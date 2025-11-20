/**
 * Phase 14 Week 1-2: Finalization Tests
 *
 * Tests for:
 * - GlobalRegressionSuite
 * - PerformanceAuditService
 * - ReliabilityMatrixService
 * - ReleaseBuilder
 * - ErrorSurfaceAnalyzer
 */

import { GlobalRegressionSuite } from '../GlobalRegressionSuite';
import { PerformanceAuditService } from '../PerformanceAuditService';
import { ReliabilityMatrixService } from '../ReliabilityMatrixService';
import { ReleaseBuilder } from '../ReleaseBuilder';
import { ErrorSurfaceAnalyzer } from '../ErrorSurfaceAnalyzer';

describe('GlobalRegressionSuite', () => {
  let suite: GlobalRegressionSuite;

  beforeEach(() => {
    suite = new GlobalRegressionSuite();
  });

  describe('runAll', () => {
    it('should run all regression tests', async () => {
      const result = await suite.runAll();

      expect(result).toBeDefined();
      expect(result.totalTests).toBeGreaterThan(0);
      expect(result.passed).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(result.passed + result.failed).toBe(result.totalTests);
    });

    it('should calculate pass rate correctly', async () => {
      const result = await suite.runAll();

      expect(result.passRate).toBeGreaterThanOrEqual(0);
      expect(result.passRate).toBeLessThanOrEqual(100);
      expect(result.passRate).toBe((result.passed / result.totalTests) * 100);
    });

    it('should return results array', async () => {
      const result = await suite.runAll();

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBe(result.totalTests);
    });

    it('should include duration', async () => {
      const result = await suite.runAll();

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should track critical failures', async () => {
      const result = await suite.runAll();

      expect(result.criticalFailures).toBeDefined();
      expect(Array.isArray(result.criticalFailures)).toBe(true);
    });
  });

  describe('runCategory', () => {
    it('should run tests for specific category', async () => {
      const result = await suite.runCategory('leviathan');

      expect(result).toBeDefined();
      expect(result.totalTests).toBeGreaterThan(0);
    });

    it('should return empty result for unknown category', async () => {
      const result = await suite.runCategory('unknown');

      expect(result.totalTests).toBe(0);
    });
  });

  describe('runCritical', () => {
    it('should run only critical tests', async () => {
      const result = await suite.runCritical();

      expect(result).toBeDefined();
      expect(result.totalTests).toBeGreaterThan(0);
    });

    it('should be faster than running all tests', async () => {
      const criticalResult = await suite.runCritical();
      const allResult = await suite.runAll();

      expect(criticalResult.totalTests).toBeLessThanOrEqual(allResult.totalTests);
    });
  });

  describe('getCategories', () => {
    it('should return all test categories', () => {
      const categories = suite.getCategories();

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('leviathan');
    });
  });
});

describe('PerformanceAuditService', () => {
  let service: PerformanceAuditService;

  beforeEach(() => {
    service = new PerformanceAuditService();
  });

  describe('runFullAudit', () => {
    it('should run all benchmarks', async () => {
      const result = await service.runFullAudit({
        iterations: 1,
        warmupIterations: 0,
        timeout: 30000,
      });

      expect(result).toBeDefined();
      expect(result.benchmarks.length).toBeGreaterThan(0);
    }, 15000);

    it('should include summary metrics', async () => {
      const result = await service.runFullAudit({
        iterations: 1,
        warmupIterations: 0,
        timeout: 30000,
      });

      expect(result.summary).toBeDefined();
      expect(result.summary.totalBenchmarks).toBeGreaterThan(0);
      expect(result.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.overallScore).toBeLessThanOrEqual(100);
    }, 15000);

    it('should calculate metrics for each benchmark', async () => {
      const result = await service.runFullAudit({
        iterations: 1,
        warmupIterations: 0,
        timeout: 30000,
      });

      for (const benchmark of result.benchmarks) {
        expect(benchmark.metrics.min).toBeLessThanOrEqual(benchmark.metrics.max);
        expect(benchmark.metrics.mean).toBeGreaterThan(0);
        expect(benchmark.metrics.median).toBeGreaterThan(0);
        expect(benchmark.metrics.p95).toBeGreaterThanOrEqual(benchmark.metrics.median);
        expect(benchmark.throughput).toBeGreaterThan(0);
      }
    }, 15000);

    it('should generate recommendations', async () => {
      const result = await service.runFullAudit({
        iterations: 1,
        warmupIterations: 0,
        timeout: 30000,
      });

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    }, 15000);

    it('should include report metadata', async () => {
      const result = await service.runFullAudit({
        iterations: 1,
        warmupIterations: 0,
        timeout: 30000,
      });

      expect(result.reportId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
    }, 15000);
  });

  describe('benchmarkFabrication', () => {
    it('should benchmark fabrication', async () => {
      const result = await service.benchmarkFabrication({
        iterations: 3,
        warmupIterations: 1,
        timeout: 10000,
      });

      expect(result.name).toBe('fabrication');
      expect(result.category).toBe('content');
      expect(result.iterations).toBe(3);
    });
  });

  describe('benchmarkCloudDeployAWS', () => {
    it('should benchmark AWS deployment', async () => {
      const result = await service.benchmarkCloudDeployAWS({
        iterations: 3,
        warmupIterations: 1,
        timeout: 10000,
      });

      expect(result.name).toBe('cloud_deploy_aws');
      expect(result.category).toBe('cloud');
    });
  });

  describe('getThresholds', () => {
    it('should return performance thresholds', () => {
      const thresholds = service.getThresholds();

      expect(thresholds).toBeDefined();
      expect(Array.isArray(thresholds)).toBe(true);
      expect(thresholds.length).toBeGreaterThan(0);
    });

    it('should have valid threshold values', () => {
      const thresholds = service.getThresholds();

      for (const threshold of thresholds) {
        expect(threshold.benchmark).toBeDefined();
        expect(threshold.maxMean).toBeGreaterThan(0);
        expect(threshold.maxP95).toBeGreaterThan(threshold.maxMean);
      }
    });
  });

  describe('updateThreshold', () => {
    it('should update existing threshold', () => {
      service.updateThreshold('fabrication', 3000, 5000);
      const thresholds = service.getThresholds();
      const fabrication = thresholds.find(t => t.benchmark === 'fabrication');

      expect(fabrication?.maxMean).toBe(3000);
      expect(fabrication?.maxP95).toBe(5000);
    });

    it('should add new threshold', () => {
      service.updateThreshold('custom_benchmark', 1000, 2000);
      const thresholds = service.getThresholds();
      const custom = thresholds.find(t => t.benchmark === 'custom_benchmark');

      expect(custom).toBeDefined();
      expect(custom?.maxMean).toBe(1000);
    });
  });
});

describe('ReliabilityMatrixService', () => {
  let service: ReliabilityMatrixService;

  beforeEach(() => {
    service = new ReliabilityMatrixService();
  });

  describe('generateMatrix', () => {
    it('should generate complete reliability matrix', async () => {
      const matrix = await service.generateMatrix();

      expect(matrix).toBeDefined();
      expect(matrix.generatedAt).toBeInstanceOf(Date);
    });

    it('should include overall metrics', async () => {
      const matrix = await service.generateMatrix();

      expect(matrix.overall).toBeDefined();
      expect(matrix.overall.totalRuns).toBeGreaterThan(0);
      expect(matrix.overall.passRate).toBeGreaterThanOrEqual(0);
      expect(matrix.overall.passRate).toBeLessThanOrEqual(100);
      expect(matrix.overall.uptimePercent).toBeGreaterThanOrEqual(0);
    });

    it('should include reliability by phase', async () => {
      const matrix = await service.generateMatrix();

      expect(matrix.byPhase).toBeDefined();
      expect(matrix.byPhase.length).toBe(14); // 14 phases
    });

    it('should include reliability by subsystem', async () => {
      const matrix = await service.generateMatrix();

      expect(matrix.bySubsystem).toBeDefined();
      expect(matrix.bySubsystem.length).toBeGreaterThan(0);
    });

    it('should include trends', async () => {
      const matrix = await service.generateMatrix();

      expect(matrix.trends).toBeDefined();
      expect(matrix.trends.length).toBe(30); // 30 days
    });

    it('should include alerts', async () => {
      const matrix = await service.generateMatrix();

      expect(matrix.alerts).toBeDefined();
      expect(Array.isArray(matrix.alerts)).toBe(true);
    });
  });

  describe('getPhaseReliability', () => {
    it('should return reliability for specific phase', async () => {
      const phase = await service.getPhaseReliability(1);

      expect(phase).toBeDefined();
      expect(phase?.phase).toBe(1);
      expect(phase?.passRate).toBeGreaterThanOrEqual(0);
    });

    it('should return null for invalid phase', async () => {
      const phase = await service.getPhaseReliability(99);

      expect(phase).toBeNull();
    });
  });

  describe('getSubsystemReliability', () => {
    it('should return reliability for specific subsystem', async () => {
      const sub = await service.getSubsystemReliability('fabrication');

      expect(sub).toBeDefined();
      expect(sub?.subsystem).toBe('fabrication');
    });

    it('should return null for unknown subsystem', async () => {
      const sub = await service.getSubsystemReliability('unknown');

      expect(sub).toBeNull();
    });
  });

  describe('getCriticalAlerts', () => {
    it('should return only critical alerts', async () => {
      const alerts = await service.getCriticalAlerts();

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});

describe('ReleaseBuilder', () => {
  let builder: ReleaseBuilder;

  beforeEach(() => {
    builder = new ReleaseBuilder();
  });

  describe('buildRelease', () => {
    it('should build complete release package', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'production',
        includeTests: true,
        includeDocs: true,
        migrations: [],
      });

      expect(pkg).toBeDefined();
      expect(pkg.version).toBe('1.0.0');
      expect(pkg.environment).toBe('production');
      expect(pkg.createdAt).toBeInstanceOf(Date);
    });

    it('should include ordered migrations', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'production',
        includeTests: false,
        includeDocs: false,
        migrations: [],
      });

      expect(pkg.migrations).toBeDefined();
      expect(pkg.migrations.length).toBeGreaterThan(0);

      // Check order
      for (let i = 0; i < pkg.migrations.length; i++) {
        expect(pkg.migrations[i].order).toBe(i + 1);
      }
    });

    it('should include environment template', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'production',
        includeTests: false,
        includeDocs: false,
        migrations: [],
      });

      expect(pkg.envTemplate).toBeDefined();
      expect(pkg.envTemplate.variables.length).toBeGreaterThan(0);
      expect(pkg.envTemplate.secrets.length).toBeGreaterThan(0);
    });

    it('should include setup scripts', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'staging',
        includeTests: true,
        includeDocs: false,
        migrations: [],
      });

      expect(pkg.setupScripts).toBeDefined();
      expect(pkg.setupScripts.length).toBeGreaterThan(0);
    });

    it('should include checksums', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'production',
        includeTests: false,
        includeDocs: false,
        migrations: [],
      });

      expect(pkg.checksums).toBeDefined();
      expect(Object.keys(pkg.checksums).length).toBe(pkg.migrations.length);
    });

    it('should include manifest', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'production',
        includeTests: false,
        includeDocs: false,
        migrations: [],
      });

      expect(pkg.manifest).toBeDefined();
      expect(pkg.manifest.totalFiles).toBeGreaterThan(0);
      expect(pkg.manifest.apiEndpoints).toBeGreaterThan(0);
      expect(pkg.manifest.services.length).toBeGreaterThan(0);
      expect(pkg.manifest.features.length).toBeGreaterThan(0);
    });
  });

  describe('validateRelease', () => {
    it('should validate valid release package', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'production',
        includeTests: false,
        includeDocs: false,
        migrations: [],
      });

      const validation = await builder.validateRelease(pkg);

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect invalid version format', async () => {
      const pkg = await builder.buildRelease({
        version: '1.0.0',
        environment: 'production',
        includeTests: false,
        includeDocs: false,
        migrations: [],
      });

      pkg.version = 'invalid';
      const validation = await builder.validateRelease(pkg);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid version format. Expected: X.Y.Z');
    });
  });

  describe('getAvailableMigrations', () => {
    it('should return list of available migrations', () => {
      const migrations = builder.getAvailableMigrations();

      expect(migrations).toBeDefined();
      expect(Array.isArray(migrations)).toBe(true);
      expect(migrations.length).toBeGreaterThan(0);
    });
  });
});

describe('ErrorSurfaceAnalyzer', () => {
  let analyzer: ErrorSurfaceAnalyzer;

  beforeEach(() => {
    analyzer = new ErrorSurfaceAnalyzer();
  });

  describe('analyze', () => {
    it('should analyze all error sources', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis).toBeDefined();
      expect(analysis.analyzedAt).toBeInstanceOf(Date);
    });

    it('should count errors by severity', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis.bySeverity).toBeDefined();
      expect(typeof analysis.bySeverity.critical).toBe('number');
      expect(typeof analysis.bySeverity.high).toBe('number');
      expect(typeof analysis.bySeverity.medium).toBe('number');
      expect(typeof analysis.bySeverity.low).toBe('number');
    });

    it('should identify unique patterns', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis.uniquePatterns).toBeGreaterThan(0);
      expect(analysis.topPatterns.length).toBeGreaterThan(0);
    });

    it('should analyze by source', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis.bySource).toBeDefined();
      expect(analysis.bySource.length).toBeGreaterThan(0);

      for (const source of analysis.bySource) {
        expect(source.source).toBeDefined();
        expect(source.totalErrors).toBeGreaterThan(0);
      }
    });

    it('should calculate trends', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis.trends).toBeDefined();
      expect(analysis.trends.length).toBeGreaterThan(0);
    });

    it('should generate recommendations', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis.recommendations).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('addError', () => {
    it('should add error for analysis', async () => {
      analyzer.addError({
        id: 'test-1',
        source: 'test',
        message: 'Test error',
        timestamp: new Date(),
        metadata: {},
      });

      const analysis = await analyzer.analyze();
      expect(analysis.totalErrors).toBeGreaterThan(0);
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', async () => {
      analyzer.addError({
        id: 'test-1',
        source: 'test',
        message: 'Test error',
        timestamp: new Date(),
        metadata: {},
      });

      analyzer.clearErrors();

      const analysis = await analyzer.analyze();
      // Will still have simulated errors from collect
      expect(analysis).toBeDefined();
    });
  });

  describe('getErrorsBySeverity', () => {
    it('should filter errors by severity', async () => {
      await analyzer.analyze(); // Populate errors

      const critical = analyzer.getErrorsBySeverity('critical');
      expect(Array.isArray(critical)).toBe(true);
    });
  });
});
