// src/lib/experiments/generator.ts
// Synthex AI experiment generator — calls Claude to design A/B experiments.
// Pattern: same as MACAS firm agents (getAIClient + Zod validation, no retry on parse failure).

import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getAIClient } from '@/lib/ai/client'
import { getSynthexStrategistPrompt } from '@/lib/experiments/prompts/synthex-strategist'
import type { GenerateExperimentRequest, GenerateExperimentResponse } from '@/lib/experiments/types'
import { EXPERIMENT_TYPES, PRIMARY_METRICS } from '@/lib/experiments/types'

// ── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-5-20250929'
const MAX_OUTPUT_TOKENS = 4096

// ── Context passed to the generator ──────────────────────────────────────────

export interface ExperimentContext {
  businessName: string
  recentPosts: Array<{
    title?: string
    content: string
    platforms: string[]
    status: string
    publishedAt?: string
  }>
  connectedChannels: Array<{
    platform: string
    handle?: string
    followerCount?: number
  }>
}

// ── Zod schema for validating AI response ────────────────────────────────────

const GeneratedVariantSchema = z.object({
  variantKey: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
  ctaText: z.string().nullable(),
  scheduledTime: z.string().nullable(),
  platforms: z.array(z.string()),
  isControl: z.boolean(),
  weight: z.number().min(0).max(1),
})

const GenerateExperimentResponseSchema = z.object({
  title: z.string().min(1),
  hypothesis: z.string().min(1),
  experimentType: z.enum(EXPERIMENT_TYPES),
  metricPrimary: z.enum(PRIMARY_METRICS),
  metricSecondary: z.string().nullable(),
  sampleSizeTarget: z.number().nullable(),
  confidenceLevel: z.number().min(0).max(1),
  aiRationale: z.string().min(1),
  variants: z.array(GeneratedVariantSchema).min(2).max(4),
})

// ── Extract JSON from response text ──────────────────────────────────────────

function extractJson(text: string): string {
  // Try markdown code fence first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Try raw JSON (first { to last })
  const startIdx = text.indexOf('{')
  const endIdx = text.lastIndexOf('}')
  if (startIdx !== -1 && endIdx > startIdx) {
    return text.slice(startIdx, endIdx + 1)
  }

  return text
}

// ── Build user message ───────────────────────────────────────────────────────

function buildUserMessage(
  request: GenerateExperimentRequest,
  context: ExperimentContext
): string {
  const parts: string[] = []

  parts.push(`## Experiment Request`)
  parts.push('')
  parts.push(`**Business:** ${context.businessName} (key: ${request.businessKey})`)

  if (request.experimentType) {
    parts.push(`**Requested Experiment Type:** ${request.experimentType}`)
  }

  if (request.focusArea) {
    parts.push(`**Focus Area:** ${request.focusArea}`)
  }

  // Recent posts for context
  if (context.recentPosts.length > 0) {
    parts.push('')
    parts.push(`### Recent Posts (${context.recentPosts.length})`)
    for (const post of context.recentPosts) {
      parts.push(`- **${post.title ?? 'Untitled'}** [${post.status}] — Platforms: ${post.platforms.join(', ')}`)
      parts.push(`  ${post.content.slice(0, 200)}${post.content.length > 200 ? '...' : ''}`)
      if (post.publishedAt) parts.push(`  Published: ${post.publishedAt}`)
    }
  } else {
    parts.push('')
    parts.push('### Recent Posts')
    parts.push('No recent posts found for this business.')
  }

  // Connected channels
  if (context.connectedChannels.length > 0) {
    parts.push('')
    parts.push(`### Connected Channels (${context.connectedChannels.length})`)
    for (const channel of context.connectedChannels) {
      const handle = channel.handle ? ` (@${channel.handle})` : ''
      const followers = channel.followerCount != null ? ` — ${channel.followerCount.toLocaleString()} followers` : ''
      parts.push(`- ${channel.platform}${handle}${followers}`)
    }
  } else {
    parts.push('')
    parts.push('### Connected Channels')
    parts.push('No connected channels found. Suggest platforms based on the business type.')
  }

  parts.push('')
  parts.push('### Instructions')
  parts.push('Design a high-impact A/B experiment for this business. Consider the recent post history and connected channels when choosing experiment type and content. Respond with the JSON object only.')

  return parts.join('\n')
}

// ── Main generator function ──────────────────────────────────────────────────

export async function generateExperiment(
  request: GenerateExperimentRequest,
  context: ExperimentContext
): Promise<GenerateExperimentResponse> {
  const client = getAIClient()
  const systemPrompt = getSynthexStrategistPrompt()
  const userMessage = buildUserMessage(request, context)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const rawContent = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')

  // Extract and parse JSON — do NOT retry on Zod/JSON errors (model won't improve)
  const jsonStr = extractJson(rawContent)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (err) {
    throw new Error(
      `Failed to parse AI response as JSON: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  const result = GenerateExperimentResponseSchema.parse(parsed)

  // Validate business rules: exactly 1 control, weights sum to 1.0
  const controlCount = result.variants.filter(v => v.isControl).length
  if (controlCount !== 1) {
    throw new Error(
      `AI generated ${controlCount} control variants — expected exactly 1`
    )
  }

  const weightSum = result.variants.reduce((sum, v) => sum + v.weight, 0)
  if (Math.abs(weightSum - 1.0) > 0.01) {
    throw new Error(
      `Variant weights sum to ${weightSum} — expected 1.0`
    )
  }

  return result
}
