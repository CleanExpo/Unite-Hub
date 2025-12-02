/* eslint-disable no-undef */
/* global process */

/**
 * Completion Integrity System Test Suite
 *
 * Tests the Phase 3 completion integrity enforcement system including:
 * - Milestone definition and validation
 * - Checkpoint validation workflows
 * - Completion gate enforcement
 * - Progress reporting accuracy
 * - Integration with orchestrator verification
 * - All-or-nothing blocking scenarios
 *
 * @module tests/integrity/completion-integrity.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as milestones from '@/lib/integrity/milestone-definitions';
import * as checkpoints from '@/lib/integrity/checkpoint-validators';
import * as gates from '@/lib/integrity/completion-gates';
import * as progress from '@/lib/integrity/progress-reporter';

// Test data directory
const TEST_DATA_DIR = path.resolve(process.cwd(), 'audit-reports-test');

// ============================================================================
// TEST SETUP & TEARDOWN
// ============================================================================

beforeEach(async () => {
  // Create test directories
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  await fs.mkdir(path.join(TEST_DATA_DIR, 'milestones'), { recursive: true });
  await fs.mkdir(path.join(TEST_DATA_DIR, 'checkpoints'), { recursive: true });
  await fs.mkdir(path.join(TEST_DATA_DIR, 'progress'), { recursive: true });
  await fs.mkdir(path.join(TEST_DATA_DIR, 'evidence'), { recursive: true });
});

afterEach(async () => {
  // Clean up test data
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// ============================================================================
// MILESTONE DEFINITION TESTS
// ============================================================================

describe('Milestone Definition System', () => {
  it('should define a valid milestone', async () => {
    const taskId = 'test-task-1';
    const stepIndex = 0;

    const milestone = await milestones.defineMilestone(taskId, stepIndex, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output file created',
          verificationMethod: 'Check file exists',
          required: true,
          target: '/tmp/test-output.json',
        },
        {
          type: 'no_placeholders',
          description: 'No placeholder markers',
          verificationMethod: 'Scan for TODO/TBD',
          required: true,
          target: '/tmp/test-output.json',
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: '/tmp/test-output.json',
        },
      ],
      weightage: 50,
      createdBy: 'test-agent',
    });

    expect(milestone).toBeDefined();
    expect(milestone.milestoneId).toBe(`${taskId}-step-${stepIndex}`);
    expect(milestone.criteria).toHaveLength(2);
    expect(milestone.weightage).toBe(50);
    expect(milestone.locked).toBe(false);
  });

  it('should validate milestone structure', () => {
    const validMilestone: milestones.MilestoneDefinition = {
      milestoneId: 'test-milestone-1',
      taskId: 'test-task-1',
      stepIndex: 0,
      stepName: 'Test Step',
      criteria: [
        {
          id: 'criterion-1',
          type: 'output_generated',
          description: 'Test criterion',
          verificationMethod: 'Test method',
          required: true,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: '/tmp/test.json',
        },
      ],
      weightage: 50,
      createdAt: Date.now(),
      createdBy: 'test',
      locked: false,
    };

    const validation = milestones.validateMilestoneStructure(validMilestone);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject invalid milestone structure', () => {
    const invalidMilestone: any = {
      milestoneId: 'test-milestone-1',
      taskId: 'test-task-1',
      // Missing stepIndex
      stepName: 'Test Step',
      criteria: [], // Empty criteria
      requiredProofs: [],
      weightage: 150, // Invalid weightage
      createdAt: Date.now(),
      createdBy: 'test',
      locked: false,
    };

    const validation = milestones.validateMilestoneStructure(invalidMilestone);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should lock milestones after definition', async () => {
    const taskId = 'test-task-lock';

    // Define milestone
    await milestones.defineMilestone(taskId, 0, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output generated',
          verificationMethod: 'Check output',
          required: true,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: '/tmp/test.json',
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    // Lock milestones
    const locked = await milestones.lockMilestones(taskId);
    expect(locked).toBe(true);

    // Verify locked
    const taskMilestones = await milestones.getMilestones(taskId);
    expect(taskMilestones?.locked).toBe(true);
    expect(taskMilestones?.milestones[0].locked).toBe(true);
  });

  it('should prevent adding milestones after lock', async () => {
    const taskId = 'test-task-locked';

    // Define and lock
    await milestones.defineMilestone(taskId, 0, {
      stepName: 'Step 1',
      criteria: [
        {
          type: 'output_generated',
          description: 'Test',
          verificationMethod: 'Test',
          required: true,
        },
      ],
      requiredProofs: [{ proofType: 'file_exists', location: '/tmp/test.json' }],
      weightage: 50,
      createdBy: 'test',
    });

    await milestones.lockMilestones(taskId);

    // Try to add another milestone
    await expect(
      milestones.defineMilestone(taskId, 1, {
        stepName: 'Step 2',
        criteria: [
          {
            type: 'output_generated',
            description: 'Test',
            verificationMethod: 'Test',
            required: true,
          },
        ],
        requiredProofs: [{ proofType: 'file_exists', location: '/tmp/test.json' }],
        weightage: 50,
        createdBy: 'test',
      })
    ).rejects.toThrow(/locked/);
  });

  it('should generate default milestones for agent types', () => {
    const emailAgentCriteria = milestones.generateDefaultMilestones('email-agent', 0);
    expect(emailAgentCriteria.length).toBeGreaterThan(0);
    expect(emailAgentCriteria.some(c => c.type === 'output_generated')).toBe(true);
    expect(emailAgentCriteria.some(c => c.type === 'no_placeholders')).toBe(true);

    const contentAgentCriteria = milestones.generateDefaultMilestones('content-agent', 0);
    expect(contentAgentCriteria.length).toBeGreaterThan(0);

    const defaultCriteria = milestones.generateDefaultMilestones('unknown-agent', 0);
    expect(defaultCriteria.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CHECKPOINT VALIDATION TESTS
// ============================================================================

describe('Checkpoint Validators', () => {
  it('should validate checkpoint with passing criteria', async () => {
    const taskId = 'test-checkpoint-1';
    const stepIndex = 0;

    // Create test file
    const testFile = path.join(TEST_DATA_DIR, 'test-output.json');
    await fs.writeFile(testFile, JSON.stringify({ test: 'data' }, null, 2));

    // Define milestone
    const milestone = await milestones.defineMilestone(taskId, stepIndex, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output file exists',
          verificationMethod: 'fs.stat',
          required: true,
          target: testFile,
        },
        {
          type: 'no_placeholders',
          description: 'No placeholders',
          verificationMethod: 'Regex scan',
          required: true,
          target: testFile,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: testFile,
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    // Validate checkpoint
    const validation = await checkpoints.validateCheckpoint(
      taskId,
      stepIndex,
      milestone,
      { outputFile: testFile }
    );

    expect(validation.passed).toBe(true);
    expect(validation.failedCriteria).toHaveLength(0);
    expect(validation.criteriaResults.every(c => c.passed)).toBe(true);
  });

  it('should fail checkpoint with placeholder markers', async () => {
    const taskId = 'test-checkpoint-placeholder';
    const stepIndex = 0;

    // Create test file with placeholders
    const testFile = path.join(TEST_DATA_DIR, 'test-placeholder.json');
    await fs.writeFile(testFile, 'TODO: Implement this\nTBD: Add details');

    const milestone = await milestones.defineMilestone(taskId, stepIndex, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'no_placeholders',
          description: 'No placeholders',
          verificationMethod: 'Regex scan',
          required: true,
          target: testFile,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: testFile,
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    const validation = await checkpoints.validateCheckpoint(
      taskId,
      stepIndex,
      milestone,
      {}
    );

    expect(validation.passed).toBe(false);
    expect(validation.failedCriteria.length).toBeGreaterThan(0);
  });

  it('should validate checkpoint chain sequentially', async () => {
    const taskId = 'test-checkpoint-chain';

    // Define 3 milestones
    const testFiles = [
      path.join(TEST_DATA_DIR, 'step-0.json'),
      path.join(TEST_DATA_DIR, 'step-1.json'),
      path.join(TEST_DATA_DIR, 'step-2.json'),
    ];

    // Create files for first 2 steps only
    await fs.writeFile(testFiles[0], JSON.stringify({ step: 0 }));
    await fs.writeFile(testFiles[1], JSON.stringify({ step: 1 }));
    // testFiles[2] is missing

    const milestoneList: milestones.MilestoneDefinition[] = [];

    for (let i = 0; i < 3; i++) {
      const milestone = await milestones.defineMilestone(taskId, i, {
        stepName: `Step ${i}`,
        criteria: [
          {
            type: 'output_generated',
            description: 'Output exists',
            verificationMethod: 'fs.stat',
            required: true,
            target: testFiles[i],
          },
        ],
        requiredProofs: [
          {
            proofType: 'file_exists',
            location: testFiles[i],
          },
        ],
        weightage: 33,
        createdBy: 'test',
      });
      milestoneList.push(milestone);
    }

    // Validate chain
    const stepEvidence = new Map<number, Record<string, unknown>>();
    stepEvidence.set(0, { file: testFiles[0] });
    stepEvidence.set(1, { file: testFiles[1] });
    stepEvidence.set(2, { file: testFiles[2] });

    const chainResult = await checkpoints.validateCheckpointChain(
      taskId,
      milestoneList,
      stepEvidence
    );

    // Should stop at step 2 (missing file)
    expect(chainResult.allPassed).toBe(false);
    expect(chainResult.firstFailureAt).toBe(2);
    expect(chainResult.validations).toHaveLength(3); // Validates all, but stops progression at first failure
  });

  it('should get checkpoint status', async () => {
    const taskId = 'test-checkpoint-status';
    const stepIndex = 0;

    // Initially should be pending
    let status = await checkpoints.getCheckpointStatus(taskId, stepIndex);
    expect(status?.status).toBe('pending');

    // Create test file and validate
    const testFile = path.join(TEST_DATA_DIR, 'test-status.json');
    await fs.writeFile(testFile, JSON.stringify({ test: 'data' }));

    const milestone = await milestones.defineMilestone(taskId, stepIndex, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output exists',
          verificationMethod: 'fs.stat',
          required: true,
          target: testFile,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: testFile,
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    await checkpoints.validateCheckpoint(taskId, stepIndex, milestone, {});

    // Should now be validated
    status = await checkpoints.getCheckpointStatus(taskId, stepIndex);
    expect(status?.status).toBe('validated');
    expect(status?.lastValidation).toBeDefined();
  });
});

// ============================================================================
// COMPLETION GATE TESTS
// ============================================================================

describe('Completion Gates', () => {
  it('should allow step completion when all criteria pass', async () => {
    const taskId = 'test-gate-step-pass';
    const stepIndex = 0;

    // Create valid output
    const testFile = path.join(TEST_DATA_DIR, 'gate-test-pass.json');
    await fs.writeFile(testFile, JSON.stringify({ status: 'completed' }));

    const milestone = await milestones.defineMilestone(taskId, stepIndex, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output exists',
          verificationMethod: 'fs.stat',
          required: true,
          target: testFile,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: testFile,
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    const gateResult = await gates.canStepComplete(
      taskId,
      stepIndex,
      milestone,
      { outputFile: testFile }
    );

    expect(gateResult.canComplete).toBe(true);
    expect(gateResult.blockingIssues).toHaveLength(0);
  });

  it('should block step completion when required criteria fail', async () => {
    const taskId = 'test-gate-step-blocked';
    const stepIndex = 0;

    // Create file with placeholders
    const testFile = path.join(TEST_DATA_DIR, 'gate-test-blocked.json');
    await fs.writeFile(testFile, 'TODO: Complete this');

    const milestone = await milestones.defineMilestone(taskId, stepIndex, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output exists',
          verificationMethod: 'fs.stat',
          required: true,
          target: testFile,
        },
        {
          type: 'no_placeholders',
          description: 'No placeholders',
          verificationMethod: 'Regex scan',
          required: true,
          target: testFile,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: testFile,
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    const gateResult = await gates.canStepComplete(
      taskId,
      stepIndex,
      milestone,
      {}
    );

    expect(gateResult.canComplete).toBe(false);
    expect(gateResult.blockingIssues.length).toBeGreaterThan(0);
    expect(gateResult.blockingIssues[0].category).toBe('placeholder_detected');
  });

  it('should enforce all-or-nothing task completion', async () => {
    const taskId = 'test-gate-task-all-or-nothing';

    // Create 3 steps, make step 1 fail
    const testFiles = [
      path.join(TEST_DATA_DIR, 'task-step-0.json'),
      path.join(TEST_DATA_DIR, 'task-step-1.json'), // Will have placeholder
      path.join(TEST_DATA_DIR, 'task-step-2.json'),
    ];

    await fs.writeFile(testFiles[0], JSON.stringify({ step: 0 }));
    await fs.writeFile(testFiles[1], 'TODO: Implement step 1');
    await fs.writeFile(testFiles[2], JSON.stringify({ step: 2 }));

    // Define milestones
    for (let i = 0; i < 3; i++) {
      await milestones.defineMilestone(taskId, i, {
        stepName: `Step ${i}`,
        criteria: [
          {
            type: 'output_generated',
            description: 'Output exists',
            verificationMethod: 'fs.stat',
            required: true,
            target: testFiles[i],
          },
          {
            type: 'no_placeholders',
            description: 'No placeholders',
            verificationMethod: 'Regex scan',
            required: true,
            target: testFiles[i],
          },
        ],
        requiredProofs: [
          {
            proofType: 'file_exists',
            location: testFiles[i],
          },
        ],
        weightage: 33,
        createdBy: 'test',
      });
    }

    const taskMilestones = await milestones.getMilestones(taskId);
    expect(taskMilestones).toBeDefined();

    const stepEvidence = new Map<number, Record<string, unknown>>();
    stepEvidence.set(0, { file: testFiles[0] });
    stepEvidence.set(1, { file: testFiles[1] });
    stepEvidence.set(2, { file: testFiles[2] });

    const taskGate = await gates.canTaskComplete(
      taskId,
      taskMilestones!,
      stepEvidence
    );

    // Task should be BLOCKED because step 1 failed
    expect(taskGate.canComplete).toBe(false);
    expect(taskGate.decision).toBe('blocked');
    expect(taskGate.blockedSteps).toBeGreaterThan(0);
    expect(taskGate.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should approve task completion when all steps pass', async () => {
    const taskId = 'test-gate-task-approved';

    // Create 2 valid steps
    const testFiles = [
      path.join(TEST_DATA_DIR, 'approved-step-0.json'),
      path.join(TEST_DATA_DIR, 'approved-step-1.json'),
    ];

    await fs.writeFile(testFiles[0], JSON.stringify({ step: 0, status: 'done' }));
    await fs.writeFile(testFiles[1], JSON.stringify({ step: 1, status: 'done' }));

    for (let i = 0; i < 2; i++) {
      await milestones.defineMilestone(taskId, i, {
        stepName: `Step ${i}`,
        criteria: [
          {
            type: 'output_generated',
            description: 'Output exists',
            verificationMethod: 'fs.stat',
            required: true,
            target: testFiles[i],
          },
          {
            type: 'no_placeholders',
            description: 'No placeholders',
            verificationMethod: 'Regex scan',
            required: true,
            target: testFiles[i],
          },
        ],
        requiredProofs: [
          {
            proofType: 'file_exists',
            location: testFiles[i],
          },
        ],
        weightage: 50,
        createdBy: 'test',
      });
    }

    const taskMilestones = await milestones.getMilestones(taskId);
    const stepEvidence = new Map<number, Record<string, unknown>>();
    stepEvidence.set(0, { file: testFiles[0] });
    stepEvidence.set(1, { file: testFiles[1] });

    const taskGate = await gates.canTaskComplete(
      taskId,
      taskMilestones!,
      stepEvidence
    );

    expect(taskGate.canComplete).toBe(true);
    expect(taskGate.decision).toBe('approved');
    expect(taskGate.blockedSteps).toBe(0);
    expect(taskGate.blockingIssues).toHaveLength(0);
  });

  it('should get blocking issues grouped by severity', async () => {
    const taskId = 'test-blocking-issues';
    const stepIndex = 0;

    // Missing file (critical) and placeholder (high)
    const testFile = path.join(TEST_DATA_DIR, 'non-existent.json');

    const milestone = await milestones.defineMilestone(taskId, stepIndex, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output exists',
          verificationMethod: 'fs.stat',
          required: true,
          target: testFile,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: testFile,
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    const taskMilestones = await milestones.getMilestones(taskId);
    const stepEvidence = new Map<number, Record<string, unknown>>();

    const issuesBySeverity = await gates.getBlockingIssuesBySeverity(
      taskId,
      taskMilestones!,
      stepEvidence
    );

    expect(issuesBySeverity.critical.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// PROGRESS REPORTING TESTS
// ============================================================================

describe('Progress Reporter', () => {
  it('should calculate completion percentage based on weightage', async () => {
    const taskId = 'test-progress-percentage';

    // Define 3 milestones with different weights
    const weights = [50, 30, 20]; // Total 100
    for (let i = 0; i < 3; i++) {
      await milestones.defineMilestone(taskId, i, {
        stepName: `Step ${i}`,
        criteria: [
          {
            type: 'output_generated',
            description: 'Test',
            verificationMethod: 'Test',
            required: true,
          },
        ],
        requiredProofs: [
          {
            proofType: 'file_exists',
            location: '/tmp/test.json',
          },
        ],
        weightage: weights[i],
        createdBy: 'test',
      });
    }

    const taskMilestones = await milestones.getMilestones(taskId);
    expect(taskMilestones).toBeDefined();

    // Simulate 2 steps validated
    const checkpointStatuses: checkpoints.CheckpointStatus[] = [
      {
        taskId,
        stepIndex: 0,
        status: 'validated',
        validationHistory: [],
      },
      {
        taskId,
        stepIndex: 1,
        status: 'validated',
        validationHistory: [],
      },
      {
        taskId,
        stepIndex: 2,
        status: 'pending',
        validationHistory: [],
      },
    ];

    const percentage = progress.getCompletionPercentage(
      taskMilestones!,
      checkpointStatuses
    );

    // Should be 80% (50 + 30)
    expect(percentage).toBe(80);
  });

  it('should generate comprehensive progress report', async () => {
    const taskId = 'test-progress-report';

    // Define 2 milestones
    const testFiles = [
      path.join(TEST_DATA_DIR, 'report-step-0.json'),
      path.join(TEST_DATA_DIR, 'report-step-1.json'),
    ];

    await fs.writeFile(testFiles[0], JSON.stringify({ step: 0 }));
    // Step 1 not completed yet

    for (let i = 0; i < 2; i++) {
      await milestones.defineMilestone(taskId, i, {
        stepName: `Step ${i}`,
        criteria: [
          {
            type: 'output_generated',
            description: 'Output exists',
            verificationMethod: 'fs.stat',
            required: true,
            target: testFiles[i],
          },
        ],
        requiredProofs: [
          {
            proofType: 'file_exists',
            location: testFiles[i],
          },
        ],
        weightage: 50,
        createdBy: 'test',
      });
    }

    const taskMilestones = await milestones.getMilestones(taskId);

    // Validate step 0
    await checkpoints.validateCheckpoint(
      taskId,
      0,
      taskMilestones!.milestones[0],
      { file: testFiles[0] }
    );

    const checkpointStatuses = await checkpoints.getAllCheckpointStatuses(taskId, 2);

    const report = await progress.reportProgress(
      taskId,
      taskMilestones!,
      0,
      checkpointStatuses
    );

    expect(report).toBeDefined();
    expect(report.taskId).toBe(taskId);
    expect(report.totalSteps).toBe(2);
    expect(report.completedSteps).toBeGreaterThan(0);
    expect(report.status).toBe('in_progress');
    expect(report.steps).toHaveLength(2);
  });

  it('should export progress report as JSON', async () => {
    const taskId = 'test-progress-export';

    await milestones.defineMilestone(taskId, 0, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Test',
          verificationMethod: 'Test',
          required: true,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: '/tmp/test.json',
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    const taskMilestones = await milestones.getMilestones(taskId);
    const checkpointStatuses = await checkpoints.getAllCheckpointStatuses(taskId, 1);

    const report = await progress.reportProgress(
      taskId,
      taskMilestones!,
      0,
      checkpointStatuses
    );

    const exported = progress.exportProgressReport(report);
    expect(exported).toBeDefined();

    const parsed = JSON.parse(exported);
    expect(parsed.task_id).toBe(taskId);
    expect(parsed.status).toBeDefined();
    expect(parsed.completion_percentage).toBeDefined();
  });

  it('should format progress report as human-readable text', async () => {
    const taskId = 'test-progress-format';

    await milestones.defineMilestone(taskId, 0, {
      stepName: 'Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Test',
          verificationMethod: 'Test',
          required: true,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: '/tmp/test.json',
        },
      ],
      weightage: 100,
      createdBy: 'test',
    });

    const taskMilestones = await milestones.getMilestones(taskId);
    const checkpointStatuses = await checkpoints.getAllCheckpointStatuses(taskId, 1);

    const report = await progress.reportProgress(
      taskId,
      taskMilestones!,
      0,
      checkpointStatuses
    );

    const formatted = progress.formatProgressReport(report);
    expect(formatted).toBeDefined();
    expect(formatted).toContain('TASK PROGRESS REPORT');
    expect(formatted).toContain(taskId);
    expect(formatted).toContain('OVERALL PROGRESS');
  });

  it('should record and retrieve progress events', async () => {
    const taskId = 'test-progress-events';

    await progress.recordProgressEvent(taskId, {
      timestamp: Date.now(),
      eventType: 'task_started',
      description: 'Task execution started',
    });

    await progress.recordProgressEvent(taskId, {
      timestamp: Date.now(),
      eventType: 'milestone_completed',
      stepIndex: 0,
      stepName: 'Test Step',
      description: 'Step 0 completed',
    });

    const timeline = await progress.getProgressTimeline(taskId);

    expect(timeline).toHaveLength(2);
    expect(timeline[0].eventType).toBe('task_started');
    expect(timeline[1].eventType).toBe('milestone_completed');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Completion Integrity Integration', () => {
  it('should enforce complete workflow from definition to gate', async () => {
    const taskId = 'test-integration-workflow';

    // Step 1: Define milestones
    const testFile = path.join(TEST_DATA_DIR, 'integration-test.json');
    await fs.writeFile(testFile, JSON.stringify({ status: 'complete' }));

    await milestones.defineMilestone(taskId, 0, {
      stepName: 'Integration Test Step',
      criteria: [
        {
          type: 'output_generated',
          description: 'Output exists',
          verificationMethod: 'fs.stat',
          required: true,
          target: testFile,
        },
        {
          type: 'no_placeholders',
          description: 'No placeholders',
          verificationMethod: 'Regex scan',
          required: true,
          target: testFile,
        },
      ],
      requiredProofs: [
        {
          proofType: 'file_exists',
          location: testFile,
        },
      ],
      weightage: 100,
      createdBy: 'integration-test',
    });

    // Step 2: Lock milestones
    await milestones.lockMilestones(taskId);

    // Step 3: Validate checkpoint
    const taskMilestones = await milestones.getMilestones(taskId);
    const validation = await checkpoints.validateCheckpoint(
      taskId,
      0,
      taskMilestones!.milestones[0],
      { file: testFile }
    );

    expect(validation.passed).toBe(true);

    // Step 4: Check gates
    const stepEvidence = new Map<number, Record<string, unknown>>();
    stepEvidence.set(0, { file: testFile });

    const gateResult = await gates.canTaskComplete(
      taskId,
      taskMilestones!,
      stepEvidence
    );

    expect(gateResult.canComplete).toBe(true);
    expect(gateResult.decision).toBe('approved');

    // Step 5: Generate progress report
    const checkpointStatuses = await checkpoints.getAllCheckpointStatuses(taskId, 1);
    const report = await progress.reportProgress(
      taskId,
      taskMilestones!,
      0,
      checkpointStatuses,
      gateResult
    );

    expect(report.status).toBe('completed');
    expect(report.completionPercentage).toBe(100);
  });
});
