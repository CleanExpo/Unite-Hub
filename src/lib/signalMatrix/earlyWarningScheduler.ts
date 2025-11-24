/**
 * Early Warning Scheduler
 * Phase 82: Daily autonomous monitoring loop
 */

import {
  SignalScope,
  UnifiedSignalMatrix,
} from './signalMatrixTypes';
import { collectSignalsForScope, getLatestMatrix } from './signalMatrixCollectorService';
import { evaluateMatrixRow } from './earlyWarningEngineService';
import { createWarningEvent } from './earlyWarningSnapshotService';
import { validateWarningIntegrity } from './earlyWarningTruthAdapter';
import { createFounderIntelFromWarnings } from './earlyWarningFounderBridge';

/**
 * Run daily evaluation for all scopes
 */
export async function runDailyEvaluation(): Promise<{
  matricesCreated: number;
  warningsGenerated: number;
  errors: string[];
}> {
  const results = {
    matricesCreated: 0,
    warningsGenerated: 0,
    errors: [] as string[],
  };

  // Evaluate global scope
  try {
    const globalResult = await evaluateScope('global');
    results.matricesCreated += globalResult.matrixCreated ? 1 : 0;
    results.warningsGenerated += globalResult.warnings;
  } catch (error) {
    results.errors.push(`Global evaluation failed: ${error}`);
  }

  // Create founder intel summary
  try {
    await createFounderIntelFromWarnings();
  } catch (error) {
    results.errors.push(`Founder intel creation failed: ${error}`);
  }

  return results;
}

/**
 * Evaluate a single scope
 */
async function evaluateScope(
  scope: SignalScope,
  clientId?: string
): Promise<{ matrixCreated: boolean; warnings: number }> {
  // Collect signals and create matrix
  const matrix = await collectSignalsForScope(scope, clientId, 7);

  if (!matrix) {
    return { matrixCreated: false, warnings: 0 };
  }

  // Evaluate matrix for warnings
  const evaluation = await evaluateMatrixRow(matrix);

  // Create warning events for detected issues
  let warningsCreated = 0;

  for (const detection of evaluation.warnings) {
    // Validate warning integrity
    const validation = validateWarningIntegrity(detection, matrix);

    if (validation.valid) {
      const event = await createWarningEvent(detection, matrix);
      if (event) {
        warningsCreated++;
      }
    }
  }

  return {
    matrixCreated: true,
    warnings: warningsCreated,
  };
}

/**
 * Run evaluation for a specific client
 */
export async function runClientEvaluation(clientId: string): Promise<{
  matrixCreated: boolean;
  warnings: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const result = await evaluateScope('client', clientId);
    return {
      ...result,
      errors,
    };
  } catch (error) {
    return {
      matrixCreated: false,
      warnings: 0,
      errors: [`Client evaluation failed: ${error}`],
    };
  }
}

/**
 * Check if evaluation should run (hourly check)
 */
export async function shouldRunEvaluation(): Promise<boolean> {
  // Get latest matrix
  const matrix = await getLatestMatrix('global');

  if (!matrix) {
    return true; // No matrix exists, should run
  }

  // Check if matrix is older than 24 hours
  const matrixAge = Date.now() - new Date(matrix.created_at).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return matrixAge >= twentyFourHours;
}

/**
 * Get evaluation status
 */
export async function getEvaluationStatus(): Promise<{
  lastRun: string | null;
  nextRun: string;
  isOverdue: boolean;
}> {
  const matrix = await getLatestMatrix('global');

  if (!matrix) {
    return {
      lastRun: null,
      nextRun: new Date().toISOString(),
      isOverdue: true,
    };
  }

  const lastRun = matrix.created_at;
  const nextRun = new Date(
    new Date(lastRun).getTime() + 24 * 60 * 60 * 1000
  ).toISOString();
  const isOverdue = new Date(nextRun) < new Date();

  return {
    lastRun,
    nextRun,
    isOverdue,
  };
}

/**
 * Generate demo matrix for testing
 */
export async function generateDemoMatrix(): Promise<UnifiedSignalMatrix> {
  const now = new Date();

  return {
    id: `demo-${Date.now()}`,
    created_at: now.toISOString(),
    client_id: null,
    scope: 'global',
    signal_json: {
      creative: {
        score: 0.7,
        confidence: 0.75,
        trend: 'stable',
        signals: [
          {
            engine: 'creative',
            metric: 'quality',
            value: 0.7,
            normalised: 0.7,
            confidence: 0.75,
            trend: 'stable',
            timestamp: now.toISOString(),
          },
        ],
      },
      performance: {
        score: 0.65,
        confidence: 0.8,
        trend: 'down',
        signals: [
          {
            engine: 'performance',
            metric: 'open_rate',
            value: 0.25,
            normalised: 0.5,
            confidence: 0.8,
            trend: 'down',
            timestamp: now.toISOString(),
          },
        ],
      },
      reality: {
        score: 0.6,
        confidence: 0.7,
        trend: 'stable',
        signals: [],
      },
      orm: {
        score: 0.5,
        confidence: 0.6,
        trend: 'stable',
        signals: [],
      },
      alignment: {
        score: 0.7,
        confidence: 0.7,
        trend: 'up',
        signals: [],
      },
      scaling: {
        score: 0.75,
        confidence: 0.8,
        trend: 'up',
        signals: [],
      },
      campaign: {
        score: 0.6,
        confidence: 0.9,
        trend: 'stable',
        signals: [],
      },
      vif: {
        score: 0.65,
        confidence: 0.7,
        trend: 'stable',
        signals: [],
      },
      story: {
        score: 0.5,
        confidence: 0.6,
        trend: 'down',
        signals: [],
      },
      external: {
        score: 0.3,
        confidence: 0.8,
        trend: 'stable',
        signals: [],
      },
      errors: [],
    },
    completeness_score: 0.7,
    confidence_score: 0.72,
    anomaly_score: 0.3,
    trend_shift_score: 0.4,
    fatigue_score: 0.5,
  };
}
