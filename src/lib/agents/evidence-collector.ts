/**
 * Evidence Collector - Captures evidence for verification system
 *
 * Collects comprehensive evidence during verification:
 * - Execution logs and step-by-step decisions
 * - State snapshots (before/after verification)
 * - Screenshots and context (if available)
 * - Error messages and stack traces
 *
 * All evidence immutable after creation for audit integrity
 *
 * @module lib/agents/evidence-collector
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'EvidenceCollector' });

export interface EvidenceMetadata {
  taskId: string;
  timestamp: number;
  collectorId: string;
  evidenceType: 'log' | 'snapshot' | 'screenshot' | 'error';
  status: 'captured' | 'stored' | 'verified';
}

export interface ExecutionStep {
  step_id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  start_time: number;
  end_time?: number;
  duration_ms?: number;
  error?: string;
}

export interface StateSnapshot {
  timestamp: number;
  type: 'before' | 'after';
  state: Record<string, unknown>;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export interface EvidencePackage {
  taskId: string;
  created_at: number;
  evidence_files: string[];
  logs: ExecutionStep[];
  snapshots: StateSnapshot[];
  metadata: EvidenceMetadata;
  integrity: {
    total_files: number;
    total_size_bytes: number;
    checksum: string;
  };
}

/**
 * Captures execution logs from step completion
 */
export async function captureExecutionLog(
  taskId: string,
  steps: ExecutionStep[],
  collectorId = 'evidence-system'
): Promise<string> {
  try {
    const evidenceDir = path.resolve(process.cwd(), 'audit-reports/evidence', taskId);
    await fs.mkdir(evidenceDir, { recursive: true });

    const logData = {
      taskId,
      captured_at: Date.now(),
      steps: steps.map(s => ({
        ...s,
        duration_ms: s.end_time ? s.end_time - s.start_time : undefined,
      })),
    };

    const logFile = path.join(evidenceDir, `execution-log-${Date.now()}.json`);
    await fs.writeFile(logFile, JSON.stringify(logData, null, 2), { flag: 'wx' }); // wx = write, fail if exists

    logger.info(`[Evidence] Execution log captured for task ${taskId}`, {
      file: logFile,
      steps: steps.length,
    });

    return logFile;
  } catch (error) {
    logger.error('[Evidence] Failed to capture execution log', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Captures state snapshots for before/after verification
 */
export async function captureStateSnapshot(
  taskId: string,
  snapshotType: 'before' | 'after',
  state: Record<string, unknown>,
  collectorId = 'evidence-system'
): Promise<string> {
  try {
    const evidenceDir = path.resolve(process.cwd(), 'audit-reports/evidence', taskId);
    await fs.mkdir(evidenceDir, { recursive: true });

    const snapshotData: StateSnapshot = {
      timestamp: Date.now(),
      type: snapshotType,
      state,
    };

    const snapshotFile = path.join(evidenceDir, `state-${snapshotType}-${Date.now()}.json`);
    await fs.writeFile(snapshotFile, JSON.stringify(snapshotData, null, 2), { flag: 'wx' });

    logger.info(`[Evidence] State snapshot captured for task ${taskId}`, {
      file: snapshotFile,
      type: snapshotType,
      keys: Object.keys(state).length,
    });

    return snapshotFile;
  } catch (error) {
    logger.error('[Evidence] Failed to capture state snapshot', {
      taskId,
      type: snapshotType,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Captures error details and context
 */
export async function captureErrorEvidence(
  taskId: string,
  error: Error | string,
  context: Record<string, unknown> = {}
): Promise<string> {
  try {
    const evidenceDir = path.resolve(process.cwd(), 'audit-reports/evidence', taskId);
    await fs.mkdir(evidenceDir, { recursive: true });

    const errorData = {
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    const errorFile = path.join(evidenceDir, `error-${Date.now()}.json`);
    await fs.writeFile(errorFile, JSON.stringify(errorData, null, 2), { flag: 'wx' });

    logger.info(`[Evidence] Error evidence captured for task ${taskId}`, {
      file: errorFile,
    });

    return errorFile;
  } catch (error) {
    logger.error('[Evidence] Failed to capture error evidence', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Aggregates all evidence for a task into a single package
 */
export async function getEvidencePackage(taskId: string): Promise<EvidencePackage> {
  try {
    const evidenceDir = path.resolve(process.cwd(), 'audit-reports/evidence', taskId);

    let files: string[] = [];
    let totalSize = 0;

    try {
      const dirFiles = await fs.readdir(evidenceDir);
      files = dirFiles.map(f => path.join(evidenceDir, f));

      // Calculate total size
      for (const file of files) {
        const stat = await fs.stat(file);
        totalSize += stat.size;
      }
    } catch {
      // Directory might not exist yet
      files = [];
    }

    // Parse logs and snapshots
    const logs: ExecutionStep[] = [];
    const snapshots: StateSnapshot[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const data = JSON.parse(content);

        if (file.includes('execution-log')) {
          logs.push(...(data.steps || []));
        } else if (file.includes('state-')) {
          snapshots.push(data);
        }
      } catch {
        // Skip files that can't be parsed
      }
    }

    const pkg: EvidencePackage = {
      taskId,
      created_at: Date.now(),
      evidence_files: files,
      logs,
      snapshots,
      metadata: {
        taskId,
        timestamp: Date.now(),
        collectorId: 'evidence-system',
        evidenceType: 'log',
        status: 'captured',
      },
      integrity: {
        total_files: files.length,
        total_size_bytes: totalSize,
        checksum: '', // Will be set by proof generator
      },
    };

    return pkg;
  } catch (error) {
    logger.error('[Evidence] Failed to get evidence package', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Cleans up evidence files (respecting retention policy)
 */
export async function cleanupOldEvidence(taskId: string, maxAgeMs = 90 * 24 * 60 * 60 * 1000): Promise<number> {
  try {
    const evidenceDir = path.resolve(process.cwd(), 'audit-reports/evidence', taskId);
    let deletedCount = 0;

    try {
      const files = await fs.readdir(evidenceDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(evidenceDir, file);
        const stat = await fs.stat(filePath);
        const age = now - stat.mtimeMs;

        if (age > maxAgeMs) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    } catch {
      // Directory might not exist
    }

    if (deletedCount > 0) {
      logger.info(`[Evidence] Cleaned up ${deletedCount} old evidence files for task ${taskId}`);
    }

    return deletedCount;
  } catch (error) {
    logger.error('[Evidence] Failed to cleanup old evidence', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
