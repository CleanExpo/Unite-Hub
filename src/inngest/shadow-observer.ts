/**
 * Shadow Observer Inngest Function
 * Runs hourly code health audit and records metrics to database
 *
 * Triggered: Every hour
 * Duration: ~10-20 minutes per run
 * Cost: ~$1.50 per run
 */

import { inngest } from './client';
import { executeShadowObserverAudit, recordSelfEvalMetrics } from '@/lib/agents/shadow-observer-agent';

export const shadowObserverAudit = inngest.createFunction(
  {
    id: 'shadow-observer-audit',
    name: 'Shadow Observer Hourly Audit',
    description: 'Runs code health audit and records metrics',
    concurrency: { limit: 1 }, // Only one audit at a time
  },
  { cron: '0 * * * *' }, // Every hour at :00
  async ({ event, step }) => {
    console.log('[Inngest] Shadow Observer audit starting...');

    try {
      const startTime = Date.now();

      // Run audit
      const auditResult = await step.run('execute-audit', async () => {
        return await executeShadowObserverAudit({
          action: 'full'
        });
      });

      // Record metrics
      await step.run('record-metrics', async () => {
        if (auditResult.success) {
          // Use system founder ID for cron jobs
          await recordSelfEvalMetrics(auditResult, 'system-audit');
        }
      });

      const duration = Date.now() - startTime;

      const summary = {
        success: auditResult.success,
        violations: auditResult.summary.total,
        critical: auditResult.summary.critical,
        high: auditResult.summary.high,
        medium: auditResult.summary.medium,
        agentScore: auditResult.agentScore,
        buildPass: auditResult.build?.pass,
        duration: `${(duration / 1000).toFixed(1)}s`,
        timestamp: auditResult.timestamp
      };

      console.log('[Inngest] Shadow Observer audit complete:', summary);

      return summary;
    } catch (error) {
      console.error('[Inngest] Shadow Observer audit failed:', error);
      throw error;
    }
  }
);

/**
 * On-demand audit function (can be triggered manually)
 */
export const shadowObserverAuditOnDemand = inngest.createFunction(
  {
    id: 'shadow-observer-audit-on-demand',
    name: 'Shadow Observer On-Demand Audit',
    description: 'Manually triggered code health audit'
  },
  { event: 'shadow-observer/audit.requested' },
  async ({ event, step }) => {
    console.log('[Inngest] On-demand Shadow Observer audit starting...', event.data);

    try {
      const auditResult = await step.run('execute-on-demand-audit', async () => {
        return await executeShadowObserverAudit({
          action: event.data.action || 'full',
          severity: event.data.severity as any,
          targetFiles: event.data.targetFiles
        });
      });

      // Record metrics if provided with founder ID
      if (auditResult.success && event.data.founderId) {
        await step.run('record-on-demand-metrics', async () => {
          await recordSelfEvalMetrics(auditResult, event.data.founderId);
        });
      }

      console.log('[Inngest] On-demand audit complete');

      return {
        success: auditResult.success,
        violations: auditResult.summary.total,
        critical: auditResult.summary.critical,
        reportPath: auditResult.reportPath,
        timestamp: auditResult.timestamp
      };
    } catch (error) {
      console.error('[Inngest] On-demand audit failed:', error);
      throw error;
    }
  }
);

/**
 * Trigger on-demand audit
 * Usage: Call from anywhere in the app
 *
 * ```typescript
 * import { inngest } from '@/inngest/client';
 *
 * await inngest.send({
 *   name: 'shadow-observer/audit.requested',
 *   data: {
 *     action: 'full',
 *     founderId: userId,
 *     severity: 'critical'
 *   }
 * });
 * ```
 */
export async function triggerShadowObserverAudit(
  data: {
    founderId?: string;
    action?: 'audit' | 'scan' | 'build' | 'refactor' | 'full';
    severity?: 'critical' | 'high' | 'medium' | 'low';
    targetFiles?: string[];
  }
) {
  const { inngest: inngestClient } = await import('./client');

  return await inngestClient.send({
    name: 'shadow-observer/audit.requested',
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });
}
