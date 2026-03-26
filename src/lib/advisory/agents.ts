// src/lib/advisory/agents.ts
// Firm and judge agent definitions for the Multi-Agent Competitive Accounting System.
// Each agent is a configuration (system prompt + model) — not an autonomous process.
// The debate engine calls the Anthropic API with these configs.

import type Anthropic from '@anthropic-ai/sdk'
import { getAIClient } from '@/lib/ai/client'
import type { FirmKey, FirmAgentConfig, JudgeAgentConfig, FirmProposalData, JudgeScoreSummary, RoundType, FinancialContext } from './types'
import { FIRM_META, ROUND_LABELS } from './types'
import { FirmProposalSchema, JudgeOutputSchema } from './structured-output'
import { zodToToolSchema, parseStructuredResponse } from '@/lib/ai/features/structured'
import { getTaxStrategyPrompt } from './prompts/tax-strategy'
import { getGrantsIncentivesPrompt } from './prompts/grants-incentives'
import { getCashflowOptimisationPrompt } from './prompts/cashflow-optimisation'
import { getCompliancePrompt } from './prompts/compliance'
import { getJudgePrompt } from './prompts/judge'
import { calculateThinkingBudget } from '@/lib/ai/features/thinking'

// ── Constants ────────────────────────────────────────────────────────────────

const FIRM_MODEL = 'claude-sonnet-4-5-20250929'
const JUDGE_MODEL = 'claude-opus-4-5-20251101'
const DEFAULT_MAX_OUTPUT_TOKENS = 4096
// Judge max_tokens includes adaptive thinking budget (up to 8 000) + structured output (~2 000).
const JUDGE_MAX_OUTPUT_TOKENS = 10000

// Tool schemas — computed once at module load, reused across all calls.
// Forces Claude to return structured JSON conforming to the Zod schema
// via tool_use rather than free-form text that requires regex extraction.
const FIRM_PROPOSAL_TOOL = zodToToolSchema(
  'firm_proposal',
  FirmProposalSchema,
  'Submit your structured firm proposal with strategies, confidence score, risk flags, and ATO citations.'
) as unknown as Anthropic.Tool

const JUDGE_OUTPUT_TOOL = zodToToolSchema(
  'judge_output',
  JudgeOutputSchema,
  'Submit your structured scoring decision with per-firm scores, weighted totals, winner, and summary.'
) as unknown as Anthropic.Tool

// ── Anthropic client — delegated to centralised singleton ────────────────────

// ── Firm agent configs ───────────────────────────────────────────────────────

export function getFirmAgentConfigs(): Record<FirmKey, FirmAgentConfig> {
  return {
    tax_strategy: {
      key: 'tax_strategy',
      name: FIRM_META.tax_strategy.name,
      model: FIRM_MODEL,
      systemPrompt: getTaxStrategyPrompt(),
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
    grants_incentives: {
      key: 'grants_incentives',
      name: FIRM_META.grants_incentives.name,
      model: FIRM_MODEL,
      systemPrompt: getGrantsIncentivesPrompt(),
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
    cashflow_optimisation: {
      key: 'cashflow_optimisation',
      name: FIRM_META.cashflow_optimisation.name,
      model: FIRM_MODEL,
      systemPrompt: getCashflowOptimisationPrompt(),
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
    compliance: {
      key: 'compliance',
      name: FIRM_META.compliance.name,
      model: FIRM_MODEL,
      systemPrompt: getCompliancePrompt(),
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
  }
}

export function getJudgeAgentConfig(): JudgeAgentConfig {
  return {
    model: JUDGE_MODEL,
    systemPrompt: getJudgePrompt(),
    maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
  }
}

// ── Build user message for each round ────────────────────────────────────────

interface RoundContext {
  round: number
  roundType: RoundType
  scenario: string
  financialContext: FinancialContext
  firmKey: FirmKey
  priorProposals?: Record<FirmKey, string>[] // indexed by round (0-based)
}

export function buildFirmUserMessage(ctx: RoundContext): string {
  const roundInfo = ROUND_LABELS[ctx.round]
  const parts: string[] = []

  parts.push(`## Round ${ctx.round}: ${roundInfo.label}`)
  parts.push('')
  parts.push(`### Client Scenario`)
  parts.push(ctx.scenario)
  parts.push('')
  parts.push(`### Financial Context`)
  parts.push('```json')
  parts.push(JSON.stringify(ctx.financialContext, null, 2))
  parts.push('```')

  // Include prior round context for rounds 2+
  if (ctx.priorProposals && ctx.priorProposals.length > 0) {
    parts.push('')
    parts.push('### Prior Round Submissions')
    for (let r = 0; r < ctx.priorProposals.length; r++) {
      const roundProposals = ctx.priorProposals[r]
      parts.push(`#### Round ${r + 1}`)
      for (const [firmKey, content] of Object.entries(roundProposals)) {
        if (firmKey === ctx.firmKey && ctx.round === 2) {
          // In rebuttal round, skip own proposal — focus on critiquing others
          continue
        }
        parts.push(`**${FIRM_META[firmKey as FirmKey]?.name ?? firmKey}:**`)
        parts.push(content)
        parts.push('')
      }
    }
  }

  // Round-specific instructions
  switch (ctx.roundType) {
    case 'proposal':
      parts.push('### Instructions')
      parts.push('Analyse the scenario and financial context. Propose your strategies with citations to ATO rulings and legislation. Respond with a JSON object matching the FirmProposal schema.')
      break
    case 'rebuttal':
      parts.push('### Instructions')
      parts.push('Review the other firms\' proposals. Identify weaknesses, risks, or missed opportunities. Strengthen your position. Respond with an updated JSON FirmProposal.')
      break
    case 'counterargument':
      parts.push('### Instructions')
      parts.push('Defend your position against rebuttals. Address valid criticisms and refine your strategies. Respond with an updated JSON FirmProposal.')
      break
    case 'risk_assessment':
      parts.push('### Instructions')
      parts.push('Assess ALL proposals (including your own) for ATO audit risk, compliance gaps, and Part IVA exposure. Flag any strategies that could trigger ATO scrutiny. Respond with a JSON FirmProposal focused on risk analysis.')
      break
    case 'final_recommendation':
      parts.push('### Instructions')
      parts.push('Submit your final refined recommendation incorporating all debate feedback. This is your best strategy. Respond with a JSON FirmProposal.')
      break
  }

  return parts.join('\n')
}

// ── Call a firm agent ────────────────────────────────────────────────────────

interface FirmCallResult {
  proposal: FirmProposalData
  rawContent: string
  inputTokens: number
  outputTokens: number
  model: string
}

export async function callFirmAgent(
  config: FirmAgentConfig,
  userMessage: string
): Promise<FirmCallResult> {
  const client = getAIClient()

  const response = await client.messages.create({
    model: config.model,
    max_tokens: config.maxOutputTokens,
    system: config.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    tools: [FIRM_PROPOSAL_TOOL],
    tool_choice: { type: 'tool', name: 'firm_proposal' },
  })

  const proposal = parseStructuredResponse(response.content, 'firm_proposal', FirmProposalSchema)
  // Serialise to clean JSON for context injection in later rounds
  const rawContent = JSON.stringify(proposal, null, 2)

  return {
    proposal,
    rawContent,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: config.model,
  }
}

// ── Call the judge agent ─────────────────────────────────────────────────────

interface JudgeCallResult {
  scores: JudgeScoreSummary
  rawContent: string
  inputTokens: number
  outputTokens: number
  model: string
}

export function buildJudgeUserMessage(
  scenario: string,
  financialContext: FinancialContext,
  finalProposals: Record<FirmKey, string>
): string {
  const parts: string[] = []

  parts.push('## Case for Judgement')
  parts.push('')
  parts.push('### Client Scenario')
  parts.push(scenario)
  parts.push('')
  parts.push('### Financial Context')
  parts.push('```json')
  parts.push(JSON.stringify(financialContext, null, 2))
  parts.push('```')
  parts.push('')
  parts.push('### Final Proposals (Round 5)')

  for (const [firmKey, content] of Object.entries(finalProposals)) {
    parts.push(`#### ${FIRM_META[firmKey as FirmKey]?.name ?? firmKey}`)
    parts.push(content)
    parts.push('')
  }

  parts.push('### Instructions')
  parts.push('Score each firm on the 5 criteria (0-100 each). Calculate weighted totals. Declare a winner. Respond with a JSON object matching the JudgeOutput schema.')

  return parts.join('\n')
}

export async function callJudgeAgent(userMessage: string): Promise<JudgeCallResult> {
  const client = getAIClient()
  const config = getJudgeAgentConfig()

  // Adaptive thinking: judge deliberates on complex 5-round debates —
  // budget scales with actual message complexity (4 000–8 000 tokens).
  const thinkingBudget = Math.min(Math.max(calculateThinkingBudget(userMessage), 4000), 8000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const judgeParams: any = {
    model: config.model,
    max_tokens: config.maxOutputTokens,
    system: config.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    tools: [JUDGE_OUTPUT_TOOL],
    tool_choice: { type: 'tool', name: 'judge_output' },
    thinking: { type: 'enabled', budget_tokens: thinkingBudget },
  }

  const response = await client.messages.create(judgeParams)

  const judgeOutput = parseStructuredResponse(response.content, 'judge_output', JudgeOutputSchema)

  // Calculate weighted totals
  const scores = judgeOutput.scores.map(s => ({
    ...s,
    weightedTotal: Math.round(
      (s.legality * 0.40 +
       s.complianceRisk * 0.25 +
       s.financialOutcome * 0.20 +
       s.documentation * 0.10 +
       s.ethics * 0.05) * 100
    ) / 100,
  }))

  const rawContent = JSON.stringify(judgeOutput, null, 2)

  return {
    scores: {
      scores,
      winner: judgeOutput.winner,
      summary: judgeOutput.summary,
    },
    rawContent,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: config.model,
  }
}
