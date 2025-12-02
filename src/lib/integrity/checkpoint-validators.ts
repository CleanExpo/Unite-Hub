/**
 * Checkpoint Validators
 *
 * Validates checkpoints sequentially to ensure task progress integrity.
 * Each checkpoint represents a verification point where evidence is checked
 * against milestone criteria.
 *
 * Key Principles:
 * - Checkpoints validated in sequence (no skipping)
 * - Evidence required for each checkpoint
 * - File existence, checksums, and content verified
 * - No placeholder markers allowed in completed work
 *
 * @module lib/integrity/checkpoint-validators
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { createApiLogger } from '@/lib/logger';
import { MilestoneDefinition, MilestoneCriterion } from './milestone-definitions';
import * as evidenceCollector from '@/lib/agents/evidence-collector';

const logger = createApiLogger({ route: 'CheckpointValidators' });

// ============================================================================
// TYPES
// ============================================================================

/**
 * Checkpoint validation result
 */
export interface CheckpointValidationResult {
  checkpointId: string;
  stepIndex: number;
  passed: boolean;
  criteriaResults: CriterionValidationResult[];
  failedCriteria: string[];
  evidencePath?: string;
  timestamp: number;
  error?: string;
}

/**
 * Individual criterion validation result
 */
export interface CriterionValidationResult {
  criterionId: string;
  criterionType: string;
  description: string;
  passed: boolean;
  evidence: string;
  error?: string;
}

/**
 * Checkpoint status for a task
 */
export interface CheckpointStatus {
  taskId: string;
  stepIndex: number;
  status: 'pending' | 'validated' | 'failed';
  lastValidation?: CheckpointValidationResult;
  validationHistory: CheckpointValidationResult[];
}

// ============================================================================
// VALIDATION METHODS
// ============================================================================

/**
 * Validates file existence and non-zero size
 */
async function validateFileExists(
  target: string
): Promise<CriterionValidationResult> {
  try {
    const filePath = path.resolve(target);
    const stats = await fs.stat(filePath);

    if (stats.size === 0) {
      return {
        criterionId: 'file_exists',
        criterionType: 'output_generated',
        description: 'File exists and has content',
        passed: false,
        evidence: `File exists but is empty: ${filePath}`,
        error: 'File has zero bytes',
      };
    }

    return {
      criterionId: 'file_exists',
      criterionType: 'output_generated',
      description: 'File exists and has content',
      passed: true,
      evidence: `File: ${filePath}, Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`,
    };
  } catch (error) {
    return {
      criterionId: 'file_exists',
      criterionType: 'output_generated',
      description: 'File exists and has content',
      passed: false,
      evidence: 'File not found',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validates file has no placeholder markers
 */
async function validateNoPlaceholders(
  target: string
): Promise<CriterionValidationResult> {
  const placeholders = [
    /TODO/i,
    /TBD/i,
    /FIXME/i,
    /\[INSERT.*?\]/i,
    /\[\s*TODO\s*\]/i,
    /\[\s*IMPLEMENT\s*\]/i,
    /placeholder/i,
  ];

  try {
    const filePath = path.resolve(target);
    const content = await fs.readFile(filePath, 'utf-8');

    const found: string[] = [];
    for (const pattern of placeholders) {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        found.push(...matches);
      }
    }

    if (found.length > 0) {
      const lines: string[] = [];
      const contentLines = content.split('\n');

      for (let i = 0; i < contentLines.length && lines.length < 5; i++) {
        if (placeholders.some(p => p.test(contentLines[i]))) {
          lines.push(`Line ${i + 1}: ${contentLines[i].trim().slice(0, 80)}`);
        }
      }

      return {
        criterionId: 'no_placeholders',
        criterionType: 'no_placeholders',
        description: 'No placeholder text in file',
        passed: false,
        evidence: `Found ${found.length} placeholder(s):\n${lines.join('\n')}`,
        error: `Placeholders detected: ${found.slice(0, 3).join(', ')}`,
      };
    }

    return {
      criterionId: 'no_placeholders',
      criterionType: 'no_placeholders',
      description: 'No placeholder text in file',
      passed: true,
      evidence: `No placeholders found in ${filePath}`,
    };
  } catch (error) {
    return {
      criterionId: 'no_placeholders',
      criterionType: 'no_placeholders',
      description: 'No placeholder text in file',
      passed: false,
      evidence: 'Failed to read file',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validates file checksum matches expected value
 */
async function validateChecksum(
  target: string,
  expectedChecksum: string
): Promise<CriterionValidationResult> {
  try {
    const filePath = path.resolve(target);
    const content = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(content);
    const actualChecksum = hash.digest('hex');

    const passed = actualChecksum === expectedChecksum;

    return {
      criterionId: 'checksum_match',
      criterionType: 'integrity_verified',
      description: 'File checksum matches expected',
      passed,
      evidence: passed
        ? `Checksum verified: ${actualChecksum}`
        : `Checksum mismatch:\nExpected: ${expectedChecksum}\nActual: ${actualChecksum}`,
      error: passed ? undefined : 'Checksum does not match',
    };
  } catch (error) {
    return {
      criterionId: 'checksum_match',
      criterionType: 'integrity_verified',
      description: 'File checksum matches expected',
      passed: false,
      evidence: 'Failed to compute checksum',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validates evidence package exists
 */
async function validateEvidenceExists(
  taskId: string,
  stepIndex: number
): Promise<CriterionValidationResult> {
  try {
    const pkg = await evidenceCollector.getEvidencePackage(taskId);

    if (!pkg || pkg.evidence_files.length === 0) {
      return {
        criterionId: 'evidence_exists',
        criterionType: 'evidence_collected',
        description: 'Evidence package exists',
        passed: false,
        evidence: 'No evidence files found',
        error: 'Evidence collection incomplete',
      };
    }

    return {
      criterionId: 'evidence_exists',
      criterionType: 'evidence_collected',
      description: 'Evidence package exists',
      passed: true,
      evidence: `Evidence package contains ${pkg.evidence_files.length} files, ${pkg.logs.length} logs, ${pkg.snapshots.length} snapshots`,
    };
  } catch (error) {
    return {
      criterionId: 'evidence_exists',
      criterionType: 'evidence_collected',
      description: 'Evidence package exists',
      passed: false,
      evidence: 'Failed to retrieve evidence',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validates custom criterion
 */
async function validateCustomCriterion(
  criterion: MilestoneCriterion
): Promise<CriterionValidationResult> {
  // For custom criteria, we check metadata for validation results
  const passed = criterion.metadata?.validated === true;

  return {
    criterionId: criterion.id,
    criterionType: 'custom',
    description: criterion.description,
    passed,
    evidence: criterion.metadata?.evidence
      ? String(criterion.metadata.evidence)
      : 'No evidence provided',
    error: passed ? undefined : 'Custom validation failed',
  };
}

// ============================================================================
// CHECKPOINT VALIDATION
// ============================================================================

/**
 * Validates a single checkpoint against milestone criteria
 */
export async function validateCheckpoint(
  taskId: string,
  stepIndex: number,
  milestone: MilestoneDefinition,
  evidence: Record<string, unknown>
): Promise<CheckpointValidationResult> {
  try {
    const checkpointId = `${taskId}-checkpoint-${stepIndex}`;
    const criteriaResults: CriterionValidationResult[] = [];
    const failedCriteria: string[] = [];

    logger.info('Validating checkpoint', {
      checkpointId,
      criteriaCount: milestone.criteria.length,
    });

    // Validate each criterion
    for (const criterion of milestone.criteria) {
      let result: CriterionValidationResult;

      switch (criterion.type) {
        case 'output_generated':
          if (criterion.target) {
            result = await validateFileExists(criterion.target);
          } else {
            // Check evidence object has required outputs
            const hasOutput = evidence && Object.keys(evidence).length > 0;
            result = {
              criterionId: criterion.id,
              criterionType: 'output_generated',
              description: criterion.description,
              passed: hasOutput,
              evidence: hasOutput
                ? `Output keys: ${Object.keys(evidence).join(', ')}`
                : 'No output in evidence',
              error: hasOutput ? undefined : 'Output not found in evidence',
            };
          }
          break;

        case 'no_placeholders':
          if (criterion.target) {
            result = await validateNoPlaceholders(criterion.target);
          } else {
            result = {
              criterionId: criterion.id,
              criterionType: 'no_placeholders',
              description: criterion.description,
              passed: false,
              evidence: 'No target specified',
              error: 'Target file path required for placeholder check',
            };
          }
          break;

        case 'integrity_verified':
          if (criterion.target && criterion.expectedValue) {
            result = await validateChecksum(
              criterion.target,
              String(criterion.expectedValue)
            );
          } else {
            result = {
              criterionId: criterion.id,
              criterionType: 'integrity_verified',
              description: criterion.description,
              passed: false,
              evidence: 'Missing target or expected checksum',
              error: 'Target and expectedValue required for checksum validation',
            };
          }
          break;

        case 'evidence_collected':
          result = await validateEvidenceExists(taskId, stepIndex);
          break;

        case 'custom':
          result = await validateCustomCriterion(criterion);
          break;

        default:
          result = {
            criterionId: criterion.id,
            criterionType: criterion.type,
            description: criterion.description,
            passed: false,
            evidence: 'Unknown criterion type',
            error: `Unsupported criterion type: ${criterion.type}`,
          };
      }

      criteriaResults.push(result);

      if (!result.passed && criterion.required) {
        failedCriteria.push(criterion.id);
      }
    }

    // Checkpoint passes if all REQUIRED criteria pass
    const passed = failedCriteria.length === 0;

    const validationResult: CheckpointValidationResult = {
      checkpointId,
      stepIndex,
      passed,
      criteriaResults,
      failedCriteria,
      timestamp: Date.now(),
    };

    // Store evidence if available
    try {
      const evidenceDir = path.resolve(
        process.cwd(),
        'audit-reports/checkpoints',
        taskId
      );
      await fs.mkdir(evidenceDir, { recursive: true });

      const evidencePath = path.join(
        evidenceDir,
        `checkpoint-${stepIndex}-${Date.now()}.json`
      );
      await fs.writeFile(
        evidencePath,
        JSON.stringify(validationResult, null, 2)
      );
      validationResult.evidencePath = evidencePath;
    } catch (error) {
      logger.warn('Failed to store checkpoint evidence', {
        checkpointId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info('Checkpoint validation complete', {
      checkpointId,
      passed,
      failedCount: failedCriteria.length,
    });

    return validationResult;
  } catch (error) {
    logger.error('Checkpoint validation failed', {
      taskId,
      stepIndex,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      checkpointId: `${taskId}-checkpoint-${stepIndex}`,
      stepIndex,
      passed: false,
      criteriaResults: [],
      failedCriteria: [],
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validates all checkpoints in sequence
 * CRITICAL: Validates checkpoints sequentially - cannot skip checkpoints
 */
export async function validateCheckpointChain(
  taskId: string,
  milestones: MilestoneDefinition[],
  stepEvidence: Map<number, Record<string, unknown>>
): Promise<{
  allPassed: boolean;
  validations: CheckpointValidationResult[];
  firstFailureAt?: number;
}> {
  try {
    const validations: CheckpointValidationResult[] = [];
    let firstFailureAt: number | undefined;

    // Sort milestones by step index
    const sortedMilestones = [...milestones].sort(
      (a, b) => a.stepIndex - b.stepIndex
    );

    logger.info('Validating checkpoint chain', {
      taskId,
      totalCheckpoints: sortedMilestones.length,
    });

    // Validate each checkpoint in sequence
    for (const milestone of sortedMilestones) {
      const evidence = stepEvidence.get(milestone.stepIndex) || {};

      const validation = await validateCheckpoint(
        taskId,
        milestone.stepIndex,
        milestone,
        evidence
      );

      validations.push(validation);

      // If checkpoint fails, record first failure and STOP
      if (!validation.passed) {
        if (firstFailureAt === undefined) {
          firstFailureAt = milestone.stepIndex;
          logger.warn('Checkpoint chain broken at step', {
            taskId,
            stepIndex: milestone.stepIndex,
            failedCriteria: validation.failedCriteria,
          });
        }

        // CRITICAL: Stop validating once we hit a failure
        // Cannot skip checkpoints
        break;
      }
    }

    const allPassed = firstFailureAt === undefined;

    logger.info('Checkpoint chain validation complete', {
      taskId,
      totalValidated: validations.length,
      allPassed,
      firstFailureAt,
    });

    return {
      allPassed,
      validations,
      firstFailureAt,
    };
  } catch (error) {
    logger.error('Checkpoint chain validation failed', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      allPassed: false,
      validations: [],
      firstFailureAt: 0,
    };
  }
}

/**
 * Gets checkpoint status for a specific step
 */
export async function getCheckpointStatus(
  taskId: string,
  stepIndex: number
): Promise<CheckpointStatus | null> {
  try {
    const checkpointDir = path.resolve(
      process.cwd(),
      'audit-reports/checkpoints',
      taskId
    );

    try {
      const files = await fs.readdir(checkpointDir);
      const checkpointFiles = files.filter(f =>
        f.startsWith(`checkpoint-${stepIndex}-`)
      );

      if (checkpointFiles.length === 0) {
        return {
          taskId,
          stepIndex,
          status: 'pending',
          validationHistory: [],
        };
      }

      // Load all validations
      const validations: CheckpointValidationResult[] = [];
      for (const file of checkpointFiles) {
        try {
          const content = await fs.readFile(
            path.join(checkpointDir, file),
            'utf-8'
          );
          validations.push(JSON.parse(content));
        } catch {
          // Skip unparseable files
        }
      }

      // Sort by timestamp
      validations.sort((a, b) => a.timestamp - b.timestamp);

      const lastValidation = validations[validations.length - 1];
      const status = lastValidation.passed ? 'validated' : 'failed';

      return {
        taskId,
        stepIndex,
        status,
        lastValidation,
        validationHistory: validations,
      };
    } catch {
      return {
        taskId,
        stepIndex,
        status: 'pending',
        validationHistory: [],
      };
    }
  } catch (error) {
    logger.error('Failed to get checkpoint status', {
      taskId,
      stepIndex,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Gets all checkpoint statuses for a task
 */
export async function getAllCheckpointStatuses(
  taskId: string,
  totalSteps: number
): Promise<CheckpointStatus[]> {
  const statuses: CheckpointStatus[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const status = await getCheckpointStatus(taskId, i);
    if (status) {
      statuses.push(status);
    }
  }

  return statuses;
}
