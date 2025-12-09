/**
 * Completion Gates
 *
 * Enforces all-or-nothing completion requirements for tasks and steps.
 * A task can ONLY be marked complete if ALL steps pass ALL checkpoints.
 * No partial completion, no "close enough" - strict gate enforcement.
 *
 * Key Principles:
 * - All-or-nothing: ONE failed checkpoint blocks task completion
 * - Gates checked at step AND task level
 * - Detailed blocking issues returned for debugging
 * - Immutable gate decisions (logged for audit)
 *
 * @module lib/integrity/completion-gates
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createApiLogger } from '@/lib/logger';
import { MilestoneDefinition, TaskMilestones } from './milestone-definitions';
import {
  CheckpointValidationResult,
  validateCheckpoint,
  validateCheckpointChain,
} from './checkpoint-validators';

const logger = createApiLogger({ route: 'CompletionGates' });

// ============================================================================
// TYPES
// ============================================================================

/**
 * Blocking issue preventing completion
 */
export interface BlockingIssue {
  issueId: string;
  stepIndex: number;
  stepName: string;
  severity: 'critical' | 'high' | 'medium';
  category: 'missing_output' | 'placeholder_detected' | 'integrity_failure' | 'evidence_missing' | 'verification_failed';
  description: string;
  details: string;
  criterion?: string;
  resolution: string; // How to fix
}

/**
 * Step completion gate result
 */
export interface StepGateResult {
  stepIndex: number;
  stepName: string;
  canComplete: boolean;
  passedCriteria: number;
  totalCriteria: number;
  blockingIssues: BlockingIssue[];
  checkpointValidation?: CheckpointValidationResult;
  timestamp: number;
}

/**
 * Task completion gate result
 */
export interface TaskGateResult {
  taskId: string;
  canComplete: boolean;
  totalSteps: number;
  completedSteps: number;
  blockedSteps: number;
  blockingIssues: BlockingIssue[];
  stepGates: StepGateResult[];
  overallCompletionPercentage: number;
  timestamp: number;
  decision: 'approved' | 'blocked' | 'pending';
  decisionReason: string;
}

/**
 * Gate decision log (immutable audit record)
 */
export interface GateDecisionLog {
  taskId: string;
  decision: 'approved' | 'blocked';
  timestamp: number;
  stepResults: StepGateResult[];
  blockingIssues: BlockingIssue[];
  decidedBy: string; // Agent/system that made decision
  evidence_path: string;
}

// ============================================================================
// STEP-LEVEL GATES
// ============================================================================

/**
 * Checks if a step can be marked complete
 */
export async function canStepComplete(
  taskId: string,
  stepIndex: number,
  milestone: MilestoneDefinition,
  stepEvidence: Record<string, unknown>
): Promise<StepGateResult> {
  try {
    logger.info('Checking step completion gate', {
      taskId,
      stepIndex,
      stepName: milestone.stepName,
    });

    // Validate checkpoint
    const validation = await validateCheckpoint(
      taskId,
      stepIndex,
      milestone,
      stepEvidence
    );

    // Build blocking issues from failed criteria
    const blockingIssues: BlockingIssue[] = [];

    for (const criterionResult of validation.criteriaResults) {
      if (!criterionResult.passed) {
        const criterion = milestone.criteria.find(
          c => c.id === criterionResult.criterionId
        );

        if (!criterion?.required) {
continue;
} // Only block on required criteria

        let category: BlockingIssue['category'];
        let severity: BlockingIssue['severity'] = 'high';

        switch (criterionResult.criterionType) {
          case 'output_generated':
            category = 'missing_output';
            severity = 'critical';
            break;
          case 'no_placeholders':
            category = 'placeholder_detected';
            severity = 'high';
            break;
          case 'integrity_verified':
            category = 'integrity_failure';
            severity = 'critical';
            break;
          case 'evidence_collected':
            category = 'evidence_missing';
            severity = 'high';
            break;
          default:
            category = 'verification_failed';
            severity = 'medium';
        }

        blockingIssues.push({
          issueId: `${taskId}-step-${stepIndex}-${criterionResult.criterionId}`,
          stepIndex,
          stepName: milestone.stepName,
          severity,
          category,
          description: criterionResult.description,
          details: criterionResult.evidence,
          criterion: criterionResult.criterionId,
          resolution: getResolutionAdvice(category, criterionResult),
        });
      }
    }

    const canComplete = blockingIssues.length === 0 && validation.passed;
    const passedCriteria = validation.criteriaResults.filter(c => c.passed).length;
    const totalCriteria = validation.criteriaResults.length;

    const result: StepGateResult = {
      stepIndex,
      stepName: milestone.stepName,
      canComplete,
      passedCriteria,
      totalCriteria,
      blockingIssues,
      checkpointValidation: validation,
      timestamp: Date.now(),
    };

    logger.info('Step completion gate result', {
      taskId,
      stepIndex,
      canComplete,
      blockingIssuesCount: blockingIssues.length,
    });

    return result;
  } catch (error) {
    logger.error('Step completion gate check failed', {
      taskId,
      stepIndex,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      stepIndex,
      stepName: milestone.stepName,
      canComplete: false,
      passedCriteria: 0,
      totalCriteria: milestone.criteria.length,
      blockingIssues: [
        {
          issueId: `${taskId}-step-${stepIndex}-gate-error`,
          stepIndex,
          stepName: milestone.stepName,
          severity: 'critical',
          category: 'verification_failed',
          description: 'Gate check failed',
          details: error instanceof Error ? error.message : String(error),
          resolution: 'Fix gate validation error before proceeding',
        },
      ],
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// TASK-LEVEL GATES
// ============================================================================

/**
 * Checks if a task can be marked complete
 * CRITICAL: Returns canComplete=false if ANY step fails
 */
export async function canTaskComplete(
  taskId: string,
  taskMilestones: TaskMilestones,
  stepEvidence: Map<number, Record<string, unknown>>
): Promise<TaskGateResult> {
  try {
    logger.info('Checking task completion gate', {
      taskId,
      totalSteps: taskMilestones.totalSteps,
    });

    const stepGates: StepGateResult[] = [];
    const allBlockingIssues: BlockingIssue[] = [];

    // Check each step gate
    for (const milestone of taskMilestones.milestones) {
      const evidence = stepEvidence.get(milestone.stepIndex) || {};
      const stepGate = await canStepComplete(
        taskId,
        milestone.stepIndex,
        milestone,
        evidence
      );

      stepGates.push(stepGate);
      allBlockingIssues.push(...stepGate.blockingIssues);
    }

    // Calculate metrics
    const completedSteps = stepGates.filter(g => g.canComplete).length;
    const blockedSteps = stepGates.filter(g => !g.canComplete).length;
    const overallCompletionPercentage = Math.round(
      (completedSteps / taskMilestones.totalSteps) * 100
    );

    // CRITICAL: Task can ONLY complete if ALL steps can complete
    const canComplete = blockedSteps === 0 && completedSteps === taskMilestones.totalSteps;

    // Determine decision
    let decision: TaskGateResult['decision'];
    let decisionReason: string;

    if (canComplete) {
      decision = 'approved';
      decisionReason = `All ${taskMilestones.totalSteps} steps completed successfully`;
    } else if (blockedSteps > 0) {
      decision = 'blocked';
      decisionReason = `${blockedSteps} step(s) have blocking issues preventing completion`;
    } else {
      decision = 'pending';
      decisionReason = `${taskMilestones.totalSteps - completedSteps} step(s) not yet completed`;
    }

    const result: TaskGateResult = {
      taskId,
      canComplete,
      totalSteps: taskMilestones.totalSteps,
      completedSteps,
      blockedSteps,
      blockingIssues: allBlockingIssues,
      stepGates,
      overallCompletionPercentage,
      timestamp: Date.now(),
      decision,
      decisionReason,
    };

    // Log gate decision
    await logGateDecision(taskId, result);

    logger.info('Task completion gate result', {
      taskId,
      decision,
      completedSteps,
      blockedSteps,
      blockingIssuesCount: allBlockingIssues.length,
    });

    return result;
  } catch (error) {
    logger.error('Task completion gate check failed', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      taskId,
      canComplete: false,
      totalSteps: taskMilestones.totalSteps,
      completedSteps: 0,
      blockedSteps: taskMilestones.totalSteps,
      blockingIssues: [
        {
          issueId: `${taskId}-gate-error`,
          stepIndex: -1,
          stepName: 'Task Gate',
          severity: 'critical',
          category: 'verification_failed',
          description: 'Task gate check failed',
          details: error instanceof Error ? error.message : String(error),
          resolution: 'Fix task gate validation error',
        },
      ],
      stepGates: [],
      overallCompletionPercentage: 0,
      timestamp: Date.now(),
      decision: 'blocked',
      decisionReason: 'Gate check system error',
    };
  }
}

/**
 * Gets all blocking issues for a task
 */
export async function getBlockingIssues(
  taskId: string,
  taskMilestones: TaskMilestones,
  stepEvidence: Map<number, Record<string, unknown>>
): Promise<BlockingIssue[]> {
  try {
    const gateResult = await canTaskComplete(taskId, taskMilestones, stepEvidence);
    return gateResult.blockingIssues;
  } catch (error) {
    logger.error('Failed to get blocking issues', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Gets blocking issues grouped by severity
 */
export async function getBlockingIssuesBySeverity(
  taskId: string,
  taskMilestones: TaskMilestones,
  stepEvidence: Map<number, Record<string, unknown>>
): Promise<{
  critical: BlockingIssue[];
  high: BlockingIssue[];
  medium: BlockingIssue[];
}> {
  const issues = await getBlockingIssues(taskId, taskMilestones, stepEvidence);

  return {
    critical: issues.filter(i => i.severity === 'critical'),
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
  };
}

// ============================================================================
// GATE DECISION LOGGING
// ============================================================================

/**
 * Logs gate decision to immutable audit log
 */
async function logGateDecision(
  taskId: string,
  gateResult: TaskGateResult
): Promise<void> {
  try {
    const logsDir = path.resolve(
      process.cwd(),
      'audit-reports/gate-decisions',
      taskId
    );
    await fs.mkdir(logsDir, { recursive: true });

    const logFile = path.join(
      logsDir,
      `gate-decision-${Date.now()}.json`
    );

    const log: GateDecisionLog = {
      taskId,
      decision: gateResult.decision === 'approved' ? 'approved' : 'blocked',
      timestamp: gateResult.timestamp,
      stepResults: gateResult.stepGates,
      blockingIssues: gateResult.blockingIssues,
      decidedBy: 'completion-gate-system',
      evidence_path: logsDir,
    };

    await fs.writeFile(logFile, JSON.stringify(log, null, 2), { flag: 'wx' });

    logger.info('Gate decision logged', {
      taskId,
      decision: log.decision,
      logFile,
    });
  } catch (error) {
    logger.warn('Failed to log gate decision', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - logging failure shouldn't block gate decision
  }
}

/**
 * Retrieves gate decision history for a task
 */
export async function getGateDecisionHistory(
  taskId: string
): Promise<GateDecisionLog[]> {
  try {
    const logsDir = path.resolve(
      process.cwd(),
      'audit-reports/gate-decisions',
      taskId
    );

    const files = await fs.readdir(logsDir);
    const logs: GateDecisionLog[] = [];

    for (const file of files) {
      if (!file.startsWith('gate-decision-')) {
continue;
}

      try {
        const content = await fs.readFile(
          path.join(logsDir, file),
          'utf-8'
        );
        logs.push(JSON.parse(content));
      } catch {
        // Skip unparseable files
      }
    }

    // Sort by timestamp
    logs.sort((a, b) => a.timestamp - b.timestamp);

    return logs;
  } catch {
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Provides resolution advice for different failure categories
 */
function getResolutionAdvice(
  category: BlockingIssue['category'],
  criterionResult: { criterionType: string; evidence: string }
): string {
  switch (category) {
    case 'missing_output':
      return 'Generate the required output file or data. Ensure the step execution produces the expected output.';

    case 'placeholder_detected':
      return 'Remove all TODO, TBD, FIXME, and [INSERT] markers from the output. Replace placeholders with actual content.';

    case 'integrity_failure':
      return 'File has been modified after creation. Regenerate the file or verify checksum integrity.';

    case 'evidence_missing':
      return 'Evidence collection incomplete. Ensure evidence-collector captures all step execution data.';

    case 'verification_failed':
      return 'Verification check failed. Review criterion requirements and ensure step output meets all criteria.';

    default:
      return 'Review step output and ensure it meets all milestone criteria.';
  }
}

/**
 * Formats blocking issues for display
 */
export function formatBlockingIssues(issues: BlockingIssue[]): string {
  if (issues.length === 0) {
    return 'No blocking issues - task can complete';
  }

  const lines: string[] = [
    `=== BLOCKING ISSUES (${issues.length}) ===\n`,
  ];

  // Group by severity
  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');

  if (critical.length > 0) {
    lines.push(`CRITICAL (${critical.length}):`);
    critical.forEach(i => {
      lines.push(`  - Step ${i.stepIndex} (${i.stepName}): ${i.description}`);
      lines.push(`    ${i.details}`);
      lines.push(`    Resolution: ${i.resolution}\n`);
    });
  }

  if (high.length > 0) {
    lines.push(`HIGH (${high.length}):`);
    high.forEach(i => {
      lines.push(`  - Step ${i.stepIndex} (${i.stepName}): ${i.description}`);
      lines.push(`    ${i.details}`);
      lines.push(`    Resolution: ${i.resolution}\n`);
    });
  }

  if (medium.length > 0) {
    lines.push(`MEDIUM (${medium.length}):`);
    medium.forEach(i => {
      lines.push(`  - Step ${i.stepIndex} (${i.stepName}): ${i.description}`);
      lines.push(`    Resolution: ${i.resolution}\n`);
    });
  }

  return lines.join('\n');
}
