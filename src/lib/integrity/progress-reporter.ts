/**
 * Progress Reporter
 *
 * Reports task progress based on verified milestone completion.
 * Progress is immutable - once a milestone is verified, it's permanently
 * recorded. Completion percentage based on weightage of verified milestones.
 *
 * Key Principles:
 * - Progress only counts VERIFIED milestones
 * - Completion percentage weighted by milestone importance
 * - Timeline shows historical progress (immutable)
 * - Export format compatible with dashboards
 *
 * @module lib/integrity/progress-reporter
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createApiLogger } from '@/lib/logger';
import { TaskMilestones, MilestoneDefinition } from './milestone-definitions';
import { CheckpointStatus, getAllCheckpointStatuses } from './checkpoint-validators';
import { TaskGateResult } from './completion-gates';

const logger = createApiLogger({ route: 'ProgressReporter' });

// ============================================================================
// TYPES
// ============================================================================

/**
 * Progress event in timeline
 */
export interface ProgressEvent {
  eventId: string;
  timestamp: number;
  eventType: 'milestone_completed' | 'milestone_failed' | 'task_started' | 'task_completed' | 'task_blocked';
  stepIndex?: number;
  stepName?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Step progress detail
 */
export interface StepProgress {
  stepIndex: number;
  stepName: string;
  status: 'pending' | 'in_progress' | 'verified' | 'failed';
  weightage: number;
  contributionToTotal: number; // Percentage this step contributes to total
  criteriaTotal: number;
  criteriaPassed: number;
  criteriaPercentage: number;
  completedAt?: number;
  failedAt?: number;
  checkpointStatus?: CheckpointStatus;
}

/**
 * Task progress report
 */
export interface TaskProgressReport {
  taskId: string;
  reportedAt: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'failed';

  // Overall metrics
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  pendingSteps: number;

  // Progress percentages
  completionPercentage: number; // 0-100, weighted by milestone importance
  verifiedPercentage: number;   // 0-100, based on verified checkpoints only

  // Step-by-step progress
  steps: StepProgress[];

  // Timeline
  timeline: ProgressEvent[];

  // Performance metrics
  startedAt?: number;
  completedAt?: number;
  totalDurationMs?: number;
  averageStepDurationMs?: number;

  // Blockers
  blockingIssuesCount: number;
  criticalIssuesCount: number;
}

/**
 * Progress snapshot (immutable record)
 */
export interface ProgressSnapshot {
  taskId: string;
  snapshotId: string;
  timestamp: number;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  status: TaskProgressReport['status'];
  checkpointStatus: { [stepIndex: number]: 'validated' | 'failed' | 'pending' };
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Calculates completion percentage based on verified milestones
 */
export function getCompletionPercentage(
  taskMilestones: TaskMilestones,
  checkpointStatuses: CheckpointStatus[]
): number {
  if (taskMilestones.totalWeightage === 0) {
return 0;
}

  let completedWeight = 0;

  for (const milestone of taskMilestones.milestones) {
    const status = checkpointStatuses.find(
      s => s.stepIndex === milestone.stepIndex
    );

    if (status?.status === 'validated') {
      completedWeight += milestone.weightage;
    }
  }

  return Math.round((completedWeight / taskMilestones.totalWeightage) * 100);
}

/**
 * Gets progress timeline events
 */
export async function getProgressTimeline(taskId: string): Promise<ProgressEvent[]> {
  try {
    const timelineDir = path.resolve(
      process.cwd(),
      'audit-reports/progress',
      taskId
    );

    try {
      const files = await fs.readdir(timelineDir);
      const events: ProgressEvent[] = [];

      for (const file of files) {
        if (!file.startsWith('event-')) {
continue;
}

        try {
          const content = await fs.readFile(
            path.join(timelineDir, file),
            'utf-8'
          );
          events.push(JSON.parse(content));
        } catch {
          // Skip unparseable files
        }
      }

      // Sort by timestamp
      events.sort((a, b) => a.timestamp - b.timestamp);

      return events;
    } catch {
      return [];
    }
  } catch (error) {
    logger.error('Failed to get progress timeline', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Records a progress event
 */
export async function recordProgressEvent(
  taskId: string,
  event: Omit<ProgressEvent, 'eventId'>
): Promise<void> {
  try {
    const timelineDir = path.resolve(
      process.cwd(),
      'audit-reports/progress',
      taskId
    );
    await fs.mkdir(timelineDir, { recursive: true });

    const eventId = `${taskId}-event-${Date.now()}`;
    const eventFile = path.join(timelineDir, `event-${eventId}.json`);

    const fullEvent: ProgressEvent = {
      eventId,
      ...event,
    };

    await fs.writeFile(eventFile, JSON.stringify(fullEvent, null, 2), {
      flag: 'wx',
    });

    logger.info('Progress event recorded', {
      taskId,
      eventType: event.eventType,
      eventId,
    });
  } catch (error) {
    logger.warn('Failed to record progress event', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - event recording failure shouldn't break progress reporting
  }
}

// ============================================================================
// PROGRESS REPORTING
// ============================================================================

/**
 * Reports progress for a task
 */
export async function reportProgress(
  taskId: string,
  taskMilestones: TaskMilestones,
  currentStep: number,
  checkpointStatuses: CheckpointStatus[],
  gateResult?: TaskGateResult
): Promise<TaskProgressReport> {
  try {
    logger.info('Generating progress report', {
      taskId,
      currentStep,
      totalSteps: taskMilestones.totalSteps,
    });

    // Calculate step progress
    const steps: StepProgress[] = [];

    for (const milestone of taskMilestones.milestones) {
      const status = checkpointStatuses.find(
        s => s.stepIndex === milestone.stepIndex
      );

      let stepStatus: StepProgress['status'] = 'pending';
      let completedAt: number | undefined;
      let failedAt: number | undefined;

      if (status?.status === 'validated') {
        stepStatus = 'verified';
        completedAt = status.lastValidation?.timestamp;
      } else if (status?.status === 'failed') {
        stepStatus = 'failed';
        failedAt = status.lastValidation?.timestamp;
      } else if (milestone.stepIndex === currentStep) {
        stepStatus = 'in_progress';
      }

      const criteriaPassed = status?.lastValidation?.criteriaResults.filter(
        c => c.passed
      ).length || 0;
      const criteriaTotal = milestone.criteria.length;
      const criteriaPercentage = criteriaTotal > 0
        ? Math.round((criteriaPassed / criteriaTotal) * 100)
        : 0;

      const contributionToTotal = taskMilestones.totalWeightage > 0
        ? Math.round((milestone.weightage / taskMilestones.totalWeightage) * 100)
        : 0;

      steps.push({
        stepIndex: milestone.stepIndex,
        stepName: milestone.stepName,
        status: stepStatus,
        weightage: milestone.weightage,
        contributionToTotal,
        criteriaTotal,
        criteriaPassed,
        criteriaPercentage,
        completedAt,
        failedAt,
        checkpointStatus: status || undefined,
      });
    }

    // Calculate overall metrics
    const completedSteps = steps.filter(s => s.status === 'verified').length;
    const failedSteps = steps.filter(s => s.status === 'failed').length;
    const pendingSteps = steps.filter(
      s => s.status === 'pending' || s.status === 'in_progress'
    ).length;

    const completionPercentage = getCompletionPercentage(
      taskMilestones,
      checkpointStatuses
    );

    const verifiedPercentage = Math.round(
      (completedSteps / taskMilestones.totalSteps) * 100
    );

    // Determine task status
    let taskStatus: TaskProgressReport['status'];
    if (completedSteps === 0) {
      taskStatus = 'not_started';
    } else if (completedSteps === taskMilestones.totalSteps) {
      taskStatus = 'completed';
    } else if (failedSteps > 0 || (gateResult && !gateResult.canComplete)) {
      taskStatus = 'blocked';
    } else {
      taskStatus = 'in_progress';
    }

    // Get timeline
    const timeline = await getProgressTimeline(taskId);

    // Performance metrics
    const completedTimes = steps
      .filter(s => s.completedAt)
      .map(s => s.completedAt!);

    const startedAt = timeline.find(e => e.eventType === 'task_started')?.timestamp;
    const completedAt = timeline.find(e => e.eventType === 'task_completed')?.timestamp;
    const totalDurationMs = startedAt && completedAt
      ? completedAt - startedAt
      : undefined;

    let averageStepDurationMs: number | undefined;
    if (completedTimes.length > 1) {
      const durations = completedTimes
        .slice(1)
        .map((t, i) => t - completedTimes[i]);
      averageStepDurationMs = Math.round(
        durations.reduce((sum, d) => sum + d, 0) / durations.length
      );
    }

    // Blocking issues
    const blockingIssuesCount = gateResult?.blockingIssues.length || 0;
    const criticalIssuesCount = gateResult?.blockingIssues.filter(
      i => i.severity === 'critical'
    ).length || 0;

    const report: TaskProgressReport = {
      taskId,
      reportedAt: Date.now(),
      status: taskStatus,
      totalSteps: taskMilestones.totalSteps,
      completedSteps,
      failedSteps,
      pendingSteps,
      completionPercentage,
      verifiedPercentage,
      steps,
      timeline,
      startedAt,
      completedAt,
      totalDurationMs,
      averageStepDurationMs,
      blockingIssuesCount,
      criticalIssuesCount,
    };

    // Store progress snapshot
    await storeProgressSnapshot(taskId, currentStep, report);

    logger.info('Progress report generated', {
      taskId,
      status: taskStatus,
      completionPercentage,
      completedSteps,
      totalSteps: taskMilestones.totalSteps,
    });

    return report;
  } catch (error) {
    logger.error('Failed to generate progress report', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return minimal report on error
    return {
      taskId,
      reportedAt: Date.now(),
      status: 'failed',
      totalSteps: taskMilestones.totalSteps,
      completedSteps: 0,
      failedSteps: 0,
      pendingSteps: taskMilestones.totalSteps,
      completionPercentage: 0,
      verifiedPercentage: 0,
      steps: [],
      timeline: [],
      blockingIssuesCount: 0,
      criticalIssuesCount: 0,
    };
  }
}

/**
 * Stores a progress snapshot (immutable)
 */
async function storeProgressSnapshot(
  taskId: string,
  currentStep: number,
  report: TaskProgressReport
): Promise<void> {
  try {
    const snapshotsDir = path.resolve(
      process.cwd(),
      'audit-reports/progress',
      taskId,
      'snapshots'
    );
    await fs.mkdir(snapshotsDir, { recursive: true });

    const snapshotId = `${taskId}-snapshot-${Date.now()}`;
    const snapshotFile = path.join(snapshotsDir, `${snapshotId}.json`);

    const checkpointStatus: { [stepIndex: number]: 'validated' | 'failed' | 'pending' } = {};
    for (const step of report.steps) {
      if (step.status === 'verified') {
        checkpointStatus[step.stepIndex] = 'validated';
      } else if (step.status === 'failed') {
        checkpointStatus[step.stepIndex] = 'failed';
      } else {
        checkpointStatus[step.stepIndex] = 'pending';
      }
    }

    const snapshot: ProgressSnapshot = {
      taskId,
      snapshotId,
      timestamp: report.reportedAt,
      currentStep,
      totalSteps: report.totalSteps,
      completionPercentage: report.completionPercentage,
      status: report.status,
      checkpointStatus,
    };

    await fs.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2), {
      flag: 'wx',
    });

    logger.info('Progress snapshot stored', {
      taskId,
      snapshotId,
      completionPercentage: snapshot.completionPercentage,
    });
  } catch (error) {
    logger.warn('Failed to store progress snapshot', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Exports progress report for dashboard display
 */
export function exportProgressReport(report: TaskProgressReport): string {
  const exported = {
    task_id: report.taskId,
    status: report.status,
    completion_percentage: report.completionPercentage,
    verified_percentage: report.verifiedPercentage,
    steps: {
      total: report.totalSteps,
      completed: report.completedSteps,
      failed: report.failedSteps,
      pending: report.pendingSteps,
    },
    step_details: report.steps.map(s => ({
      step: s.stepIndex,
      name: s.stepName,
      status: s.status,
      weightage: s.weightage,
      contribution: s.contributionToTotal,
      criteria_passed: `${s.criteriaPassed}/${s.criteriaTotal}`,
      criteria_percentage: s.criteriaPercentage,
      completed_at: s.completedAt ? new Date(s.completedAt).toISOString() : null,
    })),
    timeline: report.timeline.map(e => ({
      type: e.eventType,
      step: e.stepIndex,
      timestamp: new Date(e.timestamp).toISOString(),
      description: e.description,
    })),
    performance: {
      started_at: report.startedAt ? new Date(report.startedAt).toISOString() : null,
      completed_at: report.completedAt ? new Date(report.completedAt).toISOString() : null,
      total_duration_ms: report.totalDurationMs,
      average_step_duration_ms: report.averageStepDurationMs,
    },
    blockers: {
      total: report.blockingIssuesCount,
      critical: report.criticalIssuesCount,
    },
    reported_at: new Date(report.reportedAt).toISOString(),
  };

  return JSON.stringify(exported, null, 2);
}

/**
 * Formats progress report as human-readable text
 */
export function formatProgressReport(report: TaskProgressReport): string {
  const lines: string[] = [
    `=== TASK PROGRESS REPORT ===`,
    `Task ID: ${report.taskId}`,
    `Status: ${report.status.toUpperCase()}`,
    ``,
    `=== OVERALL PROGRESS ===`,
    `Completion: ${report.completionPercentage}% (weighted by milestone importance)`,
    `Verified: ${report.verifiedPercentage}% (${report.completedSteps}/${report.totalSteps} steps)`,
    `Failed: ${report.failedSteps} steps`,
    `Pending: ${report.pendingSteps} steps`,
    ``,
  ];

  if (report.blockingIssuesCount > 0) {
    lines.push(`=== BLOCKERS ===`);
    lines.push(`Total blocking issues: ${report.blockingIssuesCount}`);
    lines.push(`Critical issues: ${report.criticalIssuesCount}`);
    lines.push(``);
  }

  lines.push(`=== STEP-BY-STEP PROGRESS ===`);
  for (const step of report.steps) {
    const statusIcon = step.status === 'verified' ? '✓' :
                      step.status === 'failed' ? '✗' :
                      step.status === 'in_progress' ? '⟳' : '○';

    lines.push(
      `${statusIcon} Step ${step.stepIndex}: ${step.stepName} (${step.status})`
    );
    lines.push(
      `   Criteria: ${step.criteriaPassed}/${step.criteriaTotal} passed (${step.criteriaPercentage}%)`
    );
    lines.push(
      `   Weightage: ${step.weightage} points (${step.contributionToTotal}% of total)`
    );

    if (step.completedAt) {
      lines.push(`   Completed: ${new Date(step.completedAt).toISOString()}`);
    }
    lines.push(``);
  }

  if (report.timeline.length > 0) {
    lines.push(`=== TIMELINE ===`);
    report.timeline.slice(-5).forEach(e => {
      lines.push(
        `${new Date(e.timestamp).toISOString()} - ${e.eventType}: ${e.description}`
      );
    });
    lines.push(``);
  }

  if (report.totalDurationMs) {
    lines.push(`=== PERFORMANCE ===`);
    lines.push(`Total Duration: ${Math.round(report.totalDurationMs / 1000)}s`);
    if (report.averageStepDurationMs) {
      lines.push(`Avg Step Duration: ${Math.round(report.averageStepDurationMs / 1000)}s`);
    }
    lines.push(``);
  }

  lines.push(`Report generated: ${new Date(report.reportedAt).toISOString()}`);

  return lines.join('\n');
}

/**
 * Gets progress history (all snapshots)
 */
export async function getProgressHistory(taskId: string): Promise<ProgressSnapshot[]> {
  try {
    const snapshotsDir = path.resolve(
      process.cwd(),
      'audit-reports/progress',
      taskId,
      'snapshots'
    );

    const files = await fs.readdir(snapshotsDir);
    const snapshots: ProgressSnapshot[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(
          path.join(snapshotsDir, file),
          'utf-8'
        );
        snapshots.push(JSON.parse(content));
      } catch {
        // Skip unparseable files
      }
    }

    // Sort by timestamp
    snapshots.sort((a, b) => a.timestamp - b.timestamp);

    return snapshots;
  } catch {
    return [];
  }
}
