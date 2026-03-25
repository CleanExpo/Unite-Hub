// src/lib/ai/pipeline.ts
// AI Pipeline Coordinator — chain capabilities sequentially, passing prior outputs forward.
// Each step receives all prior results so downstream capabilities can incorporate upstream findings.
//
// Usage:
//   const result = await runPipeline(myPipeline, { userId: '...', businessKey: 'ccw' })

import { execute } from './router'
import type { AIResponse, RequestContext } from './types'
import type { ExecuteInput } from './router'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PipelineStepResult {
  capabilityId: string
  output: AIResponse
}

export interface PipelineStep {
  /** Registered capability id to invoke. */
  capabilityId: string
  /**
   * Build the ExecuteInput for this step.
   * Receives all prior step results so downstream steps can incorporate upstream findings.
   */
  buildInput: (priorResults: PipelineStepResult[]) => ExecuteInput
}

export interface Pipeline {
  id: string
  description: string
  steps: PipelineStep[]
}

export interface PipelineResult {
  pipelineId: string
  steps: PipelineStepResult[]
  /** The output from the final step. */
  finalOutput: AIResponse
}

// ── Runner ───────────────────────────────────────────────────────────────────

/**
 * Run a pipeline of capability steps sequentially.
 * Each step's buildInput receives all prior outputs so context accumulates naturally.
 *
 * @throws if any step's capability is not registered or the API call fails.
 */
export async function runPipeline(
  pipeline: Pipeline,
  context: RequestContext
): Promise<PipelineResult> {
  const results: PipelineStepResult[] = []

  for (const step of pipeline.steps) {
    const input = step.buildInput(results)
    // Merge caller context into each step's input context
    const mergedInput: ExecuteInput = {
      ...input,
      context: { ...context, ...(input.context ?? {}) },
    }

    const output = await execute(step.capabilityId, mergedInput)
    results.push({ capabilityId: step.capabilityId, output })
  }

  return {
    pipelineId: pipeline.id,
    steps: results,
    finalOutput: results[results.length - 1].output,
  }
}

// ── Registry ─────────────────────────────────────────────────────────────────

const _pipelines = new Map<string, Pipeline>()

export function registerPipeline(pipeline: Pipeline): void {
  _pipelines.set(pipeline.id, pipeline)
}

export function getPipeline(id: string): Pipeline | undefined {
  return _pipelines.get(id)
}

export function listPipelines(): string[] {
  return Array.from(_pipelines.keys())
}
