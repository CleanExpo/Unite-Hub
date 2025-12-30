/**
 * Continuous Improvement Workflow
 * Runs nightly: optimize, document, secure, review
 *
 * Part of Agentic Layer Phase 5-6 - Codebase Singularity
 */

import { getContinuousOptimizerAgent } from '@/lib/agents/continuous-optimizer-agent';
import { getDocsSyncAgent } from '@/lib/agents/docs-sync-agent';
import { getSecurityScannerAgent } from '@/lib/agents/security-scanner-agent';

export interface ContinuousImprovementResult {
  optimizations: number;
  docsUpdated: number;
  securityPatches: number;
  summary: string;
}

/**
 * Runs every 24 hours
 * Continuously improves codebase
 */
export async function runContinuousImprovement(): Promise<ContinuousImprovementResult> {
  console.log('🔄 Starting continuous improvement cycle...');

  // Run all improvement agents in parallel
  const [optimizerResult, docsResult, securityResult] = await Promise.all([
    getContinuousOptimizerAgent().processTask({
      id: 'ci-1',
      workspace_id: 'system',
      task_type: 'optimize',
      payload: {},
      priority: 3,
      retry_count: 0,
      max_retries: 1
    }),
    getDocsSyncAgent().processTask({
      id: 'ci-2',
      workspace_id: 'system',
      task_type: 'docs_sync',
      payload: { changedFiles: [] },
      priority: 3,
      retry_count: 0,
      max_retries: 1
    }),
    getSecurityScannerAgent().processTask({
      id: 'ci-3',
      workspace_id: 'system',
      task_type: 'security_scan',
      payload: {},
      priority: 5,
      retry_count: 0,
      max_retries: 1
    })
  ]);

  return {
    optimizations: optimizerResult.prsCreated,
    docsUpdated: docsResult.filesUpdated.length,
    securityPatches: securityResult.patchesCreated,
    summary: `CI cycle complete: ${optimizerResult.prsCreated} optimizations, ${docsResult.filesUpdated.length} docs updated, ${securityResult.patchesCreated} security patches`
  };
}

/**
 * Start continuous improvement loop
 * Schedule to run every 24 hours
 */
export function startContinuousImprovement(intervalHours: number = 24): NodeJS.Timeout {
  // Run immediately
  runContinuousImprovement();

  // Then run periodically
  return setInterval(() => {
    runContinuousImprovement();
  }, intervalHours * 60 * 60 * 1000);
}
