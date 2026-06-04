// src/lib/command-centre/decompose.ts
//
// CC-09 — Queue generation.
//
// On an APPROVED Board decision, decompose an idea into N small, sequential,
// risk-tagged `proposed` sub-tasks (origin 'board-review') and persist them via
// createTask, linking each to the previous one through `dependencies` and to the
// parent idea via metadata.
//
// Decomposition is deterministic and dependency-injectable so the unit test never
// needs a live model: callers may pass an explicit `steps` plan (e.g. produced by
// the board/model at runtime), and when none is supplied a deterministic default
// plan is generated from the idea. NOTHING here calls a model.

import { createTask } from './tasks'
import type {
  CommandCentreTask,
  CreateTaskInput,
  SupabaseLike,
  TaskRiskLevel,
} from './tasks'

// ─── Types ────────────────────────────────────────────────────────────────────

/** One planned sub-task in a decomposition. */
export interface DecompositionStep {
  title: string
  objective?: string
  /** Defaults to 'low' — sub-tasks start conservative; the board gates risk. */
  riskLevel?: TaskRiskLevel
}

export interface DecomposeInput {
  founderId: string
  /** The original idea text (used to derive default steps + titles). */
  idea: string
  /** The parent idea task id this queue is generated from. */
  parentTaskId: string
  /** The board decision id that approved this decomposition. */
  decisionId: string
  /** Optional project context, copied onto every sub-task. */
  projectKey?: string | null
  projectId?: string | null
  /**
   * Explicit plan. When omitted a deterministic default plan is generated.
   * Inject this (from the board/model at runtime, or in tests) to control output.
   */
  steps?: DecompositionStep[]
}

// ─── Deterministic default plan ───────────────────────────────────────────────

/**
 * Build a deterministic, generic build-loop plan for an idea. Stable across runs
 * (no randomness, no clock) so it is fully testable. Each phase is small and
 * safe; risk escalates only at the implementation/validation phases.
 */
export function defaultDecomposition(idea: string): DecompositionStep[] {
  const subject = idea.trim().replace(/\s+/g, ' ').slice(0, 80) || 'idea'
  return [
    {
      title: `Research & scope: ${subject}`,
      objective: `Research the idea, confirm scope, and write a brief for: ${subject}`,
      riskLevel: 'low',
    },
    {
      title: `Design approach: ${subject}`,
      objective: `Design a small, reversible approach (architecture + plan) for: ${subject}`,
      riskLevel: 'low',
    },
    {
      title: `Implement (branch/preview): ${subject}`,
      objective: `Implement the smallest viable change behind a branch/preview for: ${subject}`,
      riskLevel: 'medium',
    },
    {
      title: `Validate & evidence: ${subject}`,
      objective: `Run validation gates and write evidence for: ${subject}`,
      riskLevel: 'medium',
    },
  ]
}

// ─── Decompose ────────────────────────────────────────────────────────────────

/**
 * Decompose an APPROVED idea into N sequential `proposed` sub-tasks.
 *
 * - Every sub-task is created with status 'proposed' (never auto-executed) and
 *   origin 'board-review'.
 * - Tasks are linked sequentially: task[i] depends on task[i-1] (via the created
 *   row id), enforcing ordered execution.
 * - `human_approval_required` is true for any sub-task whose risk is not 'low',
 *   honouring the friction model.
 * - Parent idea + approving decision are recorded in each sub-task's metadata.
 *
 * The `client` argument is injected for testing; production callers omit it.
 * This function performs NO model call.
 */
export async function decomposeApprovedIdea(
  input: DecomposeInput,
  client?: SupabaseLike,
): Promise<CommandCentreTask[]> {
  const steps =
    input.steps && input.steps.length > 0 ? input.steps : defaultDecomposition(input.idea)

  const created: CommandCentreTask[] = []
  let previousId: string | null = null

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]
    const riskLevel: TaskRiskLevel = step.riskLevel ?? 'low'

    const taskInput: CreateTaskInput = {
      founderId: input.founderId,
      title: step.title,
      objective: step.objective ?? step.title,
      status: 'proposed',
      origin: 'board-review',
      riskLevel,
      // Non-low-risk sub-tasks require a human in the loop before promotion.
      humanApprovalRequired: riskLevel !== 'low',
      projectKey: input.projectKey ?? null,
      projectId: input.projectId ?? null,
      // Sequential linkage: each task depends on the previously created one.
      dependencies: previousId ? [previousId] : [],
      metadata: {
        parent_task_id: input.parentTaskId,
        decision_id: input.decisionId,
        sequence: i + 1,
        sequence_total: steps.length,
      },
    }

    const task = await createTask(taskInput, client)
    created.push(task)
    previousId = task.id
  }

  return created
}
