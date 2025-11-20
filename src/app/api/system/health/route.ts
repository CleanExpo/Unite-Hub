/**
 * System Health API
 * GET /api/system/health
 *
 * Comprehensive system health endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { GlobalRegressionSuite } from '@/lib/services/system/GlobalRegressionSuite';
import { PerformanceAuditService } from '@/lib/services/system/PerformanceAuditService';
import { ReliabilityMatrixService } from '@/lib/services/system/ReliabilityMatrixService';
import { ErrorSurfaceAnalyzer } from '@/lib/services/system/ErrorSurfaceAnalyzer';

// Release metadata
const RELEASE_INFO = {
  version: '1.0.0',
  buildTimestamp: '2025-11-20T20:30:00Z',
  migrationChecksum: '8c9d0e1f',
  phases: 14,
  apiEndpoints: 104,
  databaseTables: 25,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'basic';
    const includeTests = searchParams.get('includeTests') === 'true';

    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: RELEASE_INFO.version,
      environment: process.env.NODE_ENV || 'development',
      release: RELEASE_INFO,
    };

    if (mode === 'basic') {
      return NextResponse.json(health);
    }

    // Extended health check
    const reliabilityService = new ReliabilityMatrixService();
    const errorAnalyzer = new ErrorSurfaceAnalyzer();

    const [reliability, errors] = await Promise.all([
      reliabilityService.generateMatrix(),
      errorAnalyzer.analyze(),
    ]);

    const extended = {
      ...health,
      reliability: {
        overall: reliability.overall,
        alerts: reliability.alerts,
      },
      errors: {
        total: errors.totalErrors,
        critical: errors.bySeverity.critical,
        recommendations: errors.recommendations.slice(0, 3),
      },
    };

    if (mode === 'extended') {
      return NextResponse.json(extended);
    }

    // Full health check (includes performance and tests)
    if (mode === 'full') {
      const performanceService = new PerformanceAuditService();

      const performance = await performanceService.runFullAudit({
        iterations: 3,
        warmupIterations: 1,
        timeout: 30000,
      });

      const full = {
        ...extended,
        performance: {
          score: performance.summary.overallScore,
          passed: performance.summary.passedThresholds,
          failed: performance.summary.failedThresholds,
          recommendations: performance.recommendations,
        },
      };

      // Optional regression tests
      if (includeTests) {
        const regressionSuite = new GlobalRegressionSuite();
        const testResults = await regressionSuite.runCritical();

        full['tests'] = {
          total: testResults.total,
          passed: testResults.passed,
          failed: testResults.failed,
          passRate: testResults.passRate,
        };
      }

      return NextResponse.json(full);
    }

    return NextResponse.json(extended);

  } catch (error) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
