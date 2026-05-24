// src/lib/advisory/structured-output.ts
// Zod schemas for validating structured JSON output from firm and judge agents.

import { z } from 'zod'

// ── Citation Schema ──────────────────────────────────────────────────────────

export const CitationSchema = z.object({
  type: z.enum(['ato_ruling', 'legislation', 'case_law', 'ato_guidance', 'industry_standard']),
  reference: z.string().min(1),
  title: z.string().min(1),
  relevance: z.string().min(1),
})

// ── Strategy Schema ──────────────────────────────────────────────────────────

export const StrategySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedSavingsAud: z.number(),
  implementationSteps: z.array(z.string()),
  timeframe: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  citations: z.array(CitationSchema),
})

// ── Firm Proposal Schema ─────────────────────────────────────────────────────

export const FirmProposalSchema = z.object({
  summary: z.string().min(1),
  strategies: z.array(StrategySchema).min(1),
  confidenceScore: z.number().min(0).max(100),
  riskFlags: z.array(z.string()),
  auditTriggers: z.array(z.string()),
})

// ── Judge Score Schema ───────────────────────────────────────────────────────

export const JudgeScoreEntrySchema = z.object({
  firmKey: z.enum(['tax_strategy', 'grants_incentives', 'cashflow_optimisation', 'compliance']),
  legality: z.number().min(0).max(100),
  complianceRisk: z.number().min(0).max(100),
  financialOutcome: z.number().min(0).max(100),
  documentation: z.number().min(0).max(100),
  ethics: z.number().min(0).max(100),
  rationale: z.string().min(1),
  riskFlags: z.array(z.string()),
  auditTriggers: z.array(z.string()),
})

export const JudgeOutputSchema = z.object({
  scores: z.array(JudgeScoreEntrySchema).length(4),
  winner: z.enum(['tax_strategy', 'grants_incentives', 'cashflow_optimisation', 'compliance']),
  summary: z.string().min(1),
})

// ── Parse helpers ────────────────────────────────────────────────────────────

/**
 * Extract JSON from agent response text. Handles both raw JSON and
 * markdown-fenced code blocks (```json ... ```).
 */
export function extractJson(text: string): string {
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

/**
 * Parse and validate a firm proposal from agent response text.
 * Returns the validated data or throws a ZodError with details.
 */
export function parseFirmProposal(responseText: string) {
  const json = extractJson(responseText)
  const parsed = JSON.parse(json) as unknown
  return FirmProposalSchema.parse(parsed)
}

/**
 * Parse and validate judge output from agent response text.
 * Returns the validated data or throws a ZodError with details.
 */
export function parseJudgeOutput(responseText: string) {
  const json = extractJson(responseText)
  const parsed = JSON.parse(json) as unknown
  return JudgeOutputSchema.parse(parsed)
}
