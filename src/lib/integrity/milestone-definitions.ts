/**
 * Milestone Definition System
 *
 * Defines completion criteria for task steps before execution begins.
 * Milestones specify what "done" looks like for each step, enabling
 * objective verification without self-attestation.
 *
 * Key Principles:
 * - Milestones defined BEFORE task execution (no moving goalposts)
 * - Criteria must be objective and verifiable
 * - Each step has clear success metrics
 * - Weightage determines step importance
 *
 * @module lib/integrity/milestone-definitions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'MilestoneDefinitions' });

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of milestones that can be defined
 */
export type MilestoneType =
  | 'output_generated'       // File/data created
  | 'no_placeholders'        // No TODO/TBD/FIXME markers
  | 'integrity_verified'     // Checksums match
  | 'evidence_collected'     // Evidence exists
  | 'tests_passing'          // Tests pass
  | 'endpoint_responds'      // API endpoint working
  | 'database_updated'       // Database changes committed
  | 'custom';                // Custom verification logic

/**
 * Completion criterion for a milestone
 */
export interface MilestoneCriterion {
  id: string;                    // Unique criterion ID
  type: MilestoneType;           // Type of verification
  description: string;           // Human-readable description
  verificationMethod: string;    // How to verify (reproducible)
  required: boolean;             // Must pass for milestone completion
  target?: string;               // Target file/endpoint/etc
  expectedValue?: unknown;       // Expected value for comparison
  metadata?: Record<string, unknown>;
}

/**
 * Proof requirement for milestone completion
 */
export interface ProofRequirement {
  proofType: 'file_exists' | 'checksum_match' | 'test_output' | 'api_response' | 'database_row';
  location: string;              // Where proof is stored
  validator?: string;            // Custom validator function
}

/**
 * Milestone definition for a task step
 */
export interface MilestoneDefinition {
  milestoneId: string;           // Unique milestone ID
  taskId: string;                // Task this belongs to
  stepIndex: number;             // Step number in task
  stepName: string;              // Human-readable step name
  criteria: MilestoneCriterion[];
  requiredProofs: ProofRequirement[];
  weightage: number;             // 0-100, importance of this step
  createdAt: number;
  createdBy: string;             // Agent/user who defined it
  locked: boolean;               // If true, cannot be modified
}

/**
 * Milestone registry for a task
 */
export interface TaskMilestones {
  taskId: string;
  totalSteps: number;
  milestones: MilestoneDefinition[];
  totalWeightage: number;
  createdAt: number;
  locked: boolean;               // Lock after task starts
}

// ============================================================================
// STORAGE
// ============================================================================

const MILESTONES_DIR = path.resolve(process.cwd(), 'audit-reports/milestones');

/**
 * Ensures milestones directory exists
 */
async function ensureMilestonesDir(): Promise<void> {
  await fs.mkdir(MILESTONES_DIR, { recursive: true });
}

/**
 * Gets file path for task milestones
 */
function getMilestonesFilePath(taskId: string): string {
  return path.join(MILESTONES_DIR, `${taskId}.json`);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates milestone structure
 */
export function validateMilestoneStructure(milestone: MilestoneDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!milestone.milestoneId) errors.push('milestoneId is required');
  if (!milestone.taskId) errors.push('taskId is required');
  if (milestone.stepIndex === undefined) errors.push('stepIndex is required');
  if (!milestone.stepName) errors.push('stepName is required');
  if (!milestone.createdBy) errors.push('createdBy is required');

  // Weightage validation
  if (milestone.weightage < 0 || milestone.weightage > 100) {
    errors.push('weightage must be between 0 and 100');
  }

  // Criteria validation
  if (!milestone.criteria || milestone.criteria.length === 0) {
    errors.push('At least one criterion is required');
  } else {
    milestone.criteria.forEach((criterion, idx) => {
      if (!criterion.id) errors.push(`Criterion ${idx}: id is required`);
      if (!criterion.type) errors.push(`Criterion ${idx}: type is required`);
      if (!criterion.description) errors.push(`Criterion ${idx}: description is required`);
      if (!criterion.verificationMethod) {
        errors.push(`Criterion ${idx}: verificationMethod is required`);
      }
    });
  }

  // At least one required criterion
  const hasRequiredCriterion = milestone.criteria.some(c => c.required);
  if (!hasRequiredCriterion) {
    errors.push('At least one criterion must be marked as required');
  }

  // Proof requirements validation
  if (!milestone.requiredProofs || milestone.requiredProofs.length === 0) {
    errors.push('At least one proof requirement is required');
  } else {
    milestone.requiredProofs.forEach((proof, idx) => {
      if (!proof.proofType) errors.push(`Proof ${idx}: proofType is required`);
      if (!proof.location) errors.push(`Proof ${idx}: location is required`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MILESTONE DEFINITION
// ============================================================================

/**
 * Defines a milestone for a task step
 */
export async function defineMilestone(
  taskId: string,
  stepIndex: number,
  definition: {
    stepName: string;
    criteria: Omit<MilestoneCriterion, 'id'>[];
    requiredProofs: ProofRequirement[];
    weightage: number;
    createdBy: string;
  }
): Promise<MilestoneDefinition> {
  try {
    await ensureMilestonesDir();

    // Generate milestone ID
    const milestoneId = `${taskId}-step-${stepIndex}`;

    // Build milestone with IDs
    const milestone: MilestoneDefinition = {
      milestoneId,
      taskId,
      stepIndex,
      stepName: definition.stepName,
      criteria: definition.criteria.map((c, idx) => ({
        id: `${milestoneId}-criterion-${idx + 1}`,
        ...c,
      })),
      requiredProofs: definition.requiredProofs,
      weightage: definition.weightage,
      createdAt: Date.now(),
      createdBy: definition.createdBy,
      locked: false,
    };

    // Validate structure
    const validation = validateMilestoneStructure(milestone);
    if (!validation.valid) {
      throw new Error(
        `Invalid milestone structure:\n${validation.errors.join('\n')}`
      );
    }

    // Load or create task milestones
    let taskMilestones = await getMilestones(taskId);

    if (!taskMilestones) {
      taskMilestones = {
        taskId,
        totalSteps: 0,
        milestones: [],
        totalWeightage: 0,
        createdAt: Date.now(),
        locked: false,
      };
    }

    // Check if task is locked
    if (taskMilestones.locked) {
      throw new Error(
        `Cannot add milestone - task ${taskId} is locked (execution started)`
      );
    }

    // Check if milestone for this step already exists
    const existingIndex = taskMilestones.milestones.findIndex(
      m => m.stepIndex === stepIndex
    );

    if (existingIndex >= 0) {
      // Replace existing milestone
      taskMilestones.milestones[existingIndex] = milestone;
      logger.info(`Milestone updated for step ${stepIndex}`, {
        taskId,
        milestoneId,
      });
    } else {
      // Add new milestone
      taskMilestones.milestones.push(milestone);
      logger.info(`Milestone created for step ${stepIndex}`, {
        taskId,
        milestoneId,
      });
    }

    // Update totals
    taskMilestones.totalSteps = Math.max(
      taskMilestones.totalSteps,
      stepIndex + 1
    );
    taskMilestones.totalWeightage = taskMilestones.milestones.reduce(
      (sum, m) => sum + m.weightage,
      0
    );

    // Save to disk
    const filePath = getMilestonesFilePath(taskId);
    await fs.writeFile(filePath, JSON.stringify(taskMilestones, null, 2));

    logger.info('Milestone defined successfully', {
      taskId,
      stepIndex,
      milestoneId,
      criteriaCount: milestone.criteria.length,
      weightage: milestone.weightage,
    });

    return milestone;
  } catch (error) {
    logger.error('Failed to define milestone', {
      taskId,
      stepIndex,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Gets all milestones for a task
 */
export async function getMilestones(
  taskId: string
): Promise<TaskMilestones | null> {
  try {
    await ensureMilestonesDir();
    const filePath = getMilestonesFilePath(taskId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as TaskMilestones;
    } catch {
      return null;
    }
  } catch (error) {
    logger.error('Failed to get milestones', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Gets a specific milestone by step index
 */
export async function getMilestone(
  taskId: string,
  stepIndex: number
): Promise<MilestoneDefinition | null> {
  const taskMilestones = await getMilestones(taskId);
  if (!taskMilestones) return null;

  return (
    taskMilestones.milestones.find(m => m.stepIndex === stepIndex) || null
  );
}

/**
 * Locks milestones (called when task execution starts)
 * Once locked, milestones cannot be added or modified
 */
export async function lockMilestones(taskId: string): Promise<boolean> {
  try {
    const taskMilestones = await getMilestones(taskId);
    if (!taskMilestones) {
      throw new Error(`No milestones found for task ${taskId}`);
    }

    if (taskMilestones.locked) {
      logger.warn(`Milestones already locked for task ${taskId}`);
      return true;
    }

    // Lock all milestones
    taskMilestones.locked = true;
    taskMilestones.milestones.forEach(m => {
      m.locked = true;
    });

    // Save to disk
    const filePath = getMilestonesFilePath(taskId);
    await fs.writeFile(filePath, JSON.stringify(taskMilestones, null, 2));

    logger.info('Milestones locked', {
      taskId,
      totalMilestones: taskMilestones.milestones.length,
    });

    return true;
  } catch (error) {
    logger.error('Failed to lock milestones', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Generates default milestones for common agent types
 */
export function generateDefaultMilestones(
  agentType: string,
  stepIndex: number
): Omit<MilestoneCriterion, 'id'>[] {
  const defaults: Record<string, Omit<MilestoneCriterion, 'id'>[]> = {
    'email-agent': [
      {
        type: 'output_generated',
        description: 'Emails processed and extracted',
        verificationMethod: 'Check output.emailsProcessed > 0',
        required: true,
      },
      {
        type: 'no_placeholders',
        description: 'No placeholder data in results',
        verificationMethod: 'Scan for TODO, TBD, [INSERT] markers',
        required: true,
      },
      {
        type: 'evidence_collected',
        description: 'Processing evidence logged',
        verificationMethod: 'Evidence files exist in audit-reports/evidence',
        required: true,
      },
    ],
    'content-agent': [
      {
        type: 'output_generated',
        description: 'Content generated',
        verificationMethod: 'Check output.generatedContent exists and length > 100',
        required: true,
      },
      {
        type: 'no_placeholders',
        description: 'No placeholder text in content',
        verificationMethod: 'Scan for TODO, TBD, [INSERT] markers',
        required: true,
      },
      {
        type: 'evidence_collected',
        description: 'Generation evidence logged',
        verificationMethod: 'Evidence files exist',
        required: true,
      },
    ],
    'seo-audit': [
      {
        type: 'database_updated',
        description: 'Audit job created in database',
        verificationMethod: 'Check output.auditJobId exists',
        required: true,
      },
      {
        type: 'output_generated',
        description: 'Audit results generated',
        verificationMethod: 'Check database for audit results',
        required: true,
      },
    ],
    default: [
      {
        type: 'output_generated',
        description: 'Step output generated',
        verificationMethod: 'Check output exists and is not empty',
        required: true,
      },
      {
        type: 'evidence_collected',
        description: 'Execution evidence logged',
        verificationMethod: 'Evidence files exist',
        required: true,
      },
    ],
  };

  return defaults[agentType] || defaults.default;
}

/**
 * Deletes milestones (use with caution - breaks audit trail)
 */
export async function deleteMilestones(taskId: string): Promise<boolean> {
  try {
    const filePath = getMilestonesFilePath(taskId);
    await fs.unlink(filePath);
    logger.warn('Milestones deleted', { taskId });
    return true;
  } catch {
    return false;
  }
}
