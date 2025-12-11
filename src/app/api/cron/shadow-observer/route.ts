/**
 * Shadow Observer Cron Job
 * Runs hourly code health audit and records metrics to database
 *
 * Endpoint: GET /api/cron/shadow-observer?secret=CRON_SECRET
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/response';

export const maxDuration = 300; // 5 minutes - within Vercel Pro limits

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return errorResponse('Unauthorized', 401);
    }

    console.log('[CRON] Shadow Observer audit starting...');
    const startTime = Date.now();

    // Import Shadow Observer agent
    const { executeShadowObserverAudit, recordSelfEvalMetrics } = await import(
      '@/lib/agents/shadow-observer-agent'
    );

    // Get founder ID from header (set by cron trigger)
    const founderId = req.headers.get('x-founder-id') || 'system';

    // Run lightweight audit (loads cached reports)
    const auditResult = await executeShadowObserverAudit({
      action: 'full'
    });

    // Record metrics to database
    if (auditResult.success) {
      await recordSelfEvalMetrics(auditResult, founderId);
    }

    const duration = Date.now() - startTime;

    console.log('[CRON] Shadow Observer audit complete', {
      success: auditResult.success,
      violations: auditResult.summary.total,
      critical: auditResult.summary.critical,
      agentScore: auditResult.agentScore,
      duration: `${(duration / 1000).toFixed(1)}s`
    });

    return successResponse({
      success: auditResult.success,
      message: 'Shadow Observer audit completed',
      metrics: {
        violations: auditResult.summary.total,
        critical: auditResult.summary.critical,
        high: auditResult.summary.high,
        medium: auditResult.summary.medium,
        agentScore: auditResult.agentScore,
        buildPass: auditResult.build?.pass
      },
      duration: `${(duration / 1000).toFixed(1)}s`,
      timestamp: auditResult.timestamp,
      reportPath: auditResult.reportPath
    });
  } catch (error) {
    console.error('[CRON] Shadow Observer audit failed:', error);

    return errorResponse(
      error instanceof Error ? error.message : 'Shadow Observer audit failed',
      500
    );
  }
}
