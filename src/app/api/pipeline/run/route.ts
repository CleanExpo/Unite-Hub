// src/app/api/pipeline/run/route.ts
// POST: Run a pre-registered AI pipeline.
//
// Body: { pipelineId: string, seed: string, data?: string, businessContext?: string }
//   seed: the initial question / prompt injected into step 1
//   data: optional CSV/JSON data block (injected into step 1 for data-analyst pipelines)
//
// Response: { pipelineId, steps: [{ capabilityId, content, citations?, sandboxResult? }], finalOutput }

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { runPipeline, getPipeline, registerPipeline } from '@/lib/ai/pipeline'
import { registerAllCapabilities } from '@/lib/ai/capabilities'
import { researchToBriefPipeline } from '@/lib/ai/pipelines/research-to-brief'
import { bookkeeperToAdvisoryPipeline } from '@/lib/ai/pipelines/bookkeeper-to-advisory'

export const dynamic = 'force-dynamic'

// Register capabilities + pipelines (idempotent)
registerAllCapabilities()
registerPipeline(researchToBriefPipeline)
registerPipeline(bookkeeperToAdvisoryPipeline)

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let pipelineId: string
  let seed: string
  let data: string | undefined
  let businessContext: string | undefined

  try {
    const body = await request.json() as {
      pipelineId: string
      seed: string
      data?: string
      businessContext?: string
    }
    pipelineId       = body.pipelineId
    seed             = body.seed
    data             = body.data
    businessContext  = body.businessContext
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (!pipelineId?.trim()) {
    return NextResponse.json({ error: 'pipelineId is required' }, { status: 400 })
  }
  if (!seed?.trim()) {
    return NextResponse.json({ error: 'seed is required' }, { status: 400 })
  }

  const pipeline = getPipeline(pipelineId)
  if (!pipeline) {
    return NextResponse.json(
      { error: `Pipeline '${pipelineId}' not found. Available: research-to-brief, bookkeeper-to-advisory` },
      { status: 404 }
    )
  }

  // Patch step 1's buildInput to inject the seed (and optional data block)
  const seedContent = data
    ? `${seed}\n\nData:\n\`\`\`\n${data.slice(0, 20000)}\n\`\`\``
    : seed

  const patchedPipeline = {
    ...pipeline,
    steps: pipeline.steps.map((step, i) =>
      i === 0
        ? {
            ...step,
            buildInput: () => ({
              messages: [{ role: 'user' as const, content: seedContent }],
            }),
          }
        : step
    ),
  }

  try {
    const result = await runPipeline(patchedPipeline, {
      userId: user.id,
      businessKey: businessContext,
    })

    return NextResponse.json({
      pipelineId: result.pipelineId,
      steps: result.steps.map(s => ({
        capabilityId:  s.capabilityId,
        content:       s.output.content,
        citations:     s.output.citations ?? [],
        sandboxResult: s.output.sandboxResult ?? null,
        usage:         s.output.usage,
      })),
      finalOutput: {
        content:       result.finalOutput.content,
        citations:     result.finalOutput.citations ?? [],
        sandboxResult: result.finalOutput.sandboxResult ?? null,
        model:         result.finalOutput.model,
        usage:         result.finalOutput.usage,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline execution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
