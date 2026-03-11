// src/lib/advisory/types.ts
// Shared types for the Multi-Agent Competitive Accounting System (MACAS).

import type { BusinessKey } from '@/lib/businesses'

// ── Firm Agents ──────────────────────────────────────────────────────────────

export const FIRM_KEYS = [
  'tax_strategy',
  'grants_incentives',
  'cashflow_optimisation',
  'compliance',
] as const

export type FirmKey = (typeof FIRM_KEYS)[number]

export const FIRM_META: Record<FirmKey, { name: string; color: string; icon: string }> = {
  tax_strategy:           { name: 'Tax Strategy',           color: '#3b82f6', icon: 'Calculator' },
  grants_incentives:      { name: 'Grants & Incentives',    color: '#22c55e', icon: 'Gift' },
  cashflow_optimisation:  { name: 'Cashflow Optimisation',  color: '#f59e0b', icon: 'TrendingUp' },
  compliance:             { name: 'Compliance',             color: '#ef4444', icon: 'ShieldCheck' },
}

// ── Round Types ──────────────────────────────────────────────────────────────

export const ROUND_TYPES = [
  'proposal',
  'rebuttal',
  'counterargument',
  'risk_assessment',
  'final_recommendation',
] as const

export type RoundType = (typeof ROUND_TYPES)[number]

export const ROUND_LABELS: Record<number, { type: RoundType; label: string }> = {
  1: { type: 'proposal',             label: 'Initial Proposals' },
  2: { type: 'rebuttal',             label: 'Rebuttals' },
  3: { type: 'counterargument',      label: 'Counterarguments' },
  4: { type: 'risk_assessment',      label: 'Risk Assessment' },
  5: { type: 'final_recommendation', label: 'Final Recommendations' },
}

// ── Case Status ──────────────────────────────────────────────────────────────

export const CASE_STATUSES = [
  'draft',
  'debating',
  'judged',
  'pending_review',
  'approved',
  'rejected',
  'executed',
  'closed',
] as const

export type CaseStatus = (typeof CASE_STATUSES)[number]

// ── Database Row Types ───────────────────────────────────────────────────────

export interface AdvisoryCase {
  id: string
  founder_id: string
  business_id: string | null
  title: string
  scenario: string
  financial_context: FinancialContext
  status: CaseStatus
  current_round: number
  total_rounds: number
  winning_firm: FirmKey | null
  judge_summary: string | null
  judge_scores: JudgeScoreSummary | null
  accountant_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  approval_queue_id: string | null
  created_at: string
  updated_at: string
}

export interface AdvisoryProposal {
  id: string
  case_id: string
  founder_id: string
  firm_key: FirmKey
  round: number
  round_type: RoundType
  content: string
  structured_data: FirmProposalData
  confidence_score: number | null
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null
  model_used: string | null
  input_tokens: number | null
  output_tokens: number | null
  created_at: string
}

export interface AdvisoryEvidence {
  id: string
  proposal_id: string
  case_id: string
  founder_id: string
  citation_type: CitationType
  reference_id: string
  reference_title: string
  excerpt: string | null
  relevance_score: number | null
  url: string | null
  created_at: string
}

export interface AdvisoryJudgeScore {
  id: string
  case_id: string
  founder_id: string
  firm_key: FirmKey
  legality_score: number
  compliance_risk_score: number
  financial_outcome_score: number
  documentation_score: number
  ethics_score: number
  weighted_total: number
  rationale: string
  risk_flags: string[]
  audit_triggers: string[]
  created_at: string
}

// ── Structured Agent Output ──────────────────────────────────────────────────

export type CitationType =
  | 'ato_ruling'
  | 'legislation'
  | 'case_law'
  | 'ato_guidance'
  | 'industry_standard'

export interface Citation {
  type: CitationType
  reference: string
  title: string
  relevance: string
}

export interface Strategy {
  title: string
  description: string
  estimatedSavingsAud: number
  implementationSteps: string[]
  timeframe: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  citations: Citation[]
}

export interface FirmProposalData {
  summary: string
  strategies: Strategy[]
  confidenceScore: number
  riskFlags: string[]
  auditTriggers: string[]
}

// ── Judge Output ─────────────────────────────────────────────────────────────

/** Weights for judge scoring (must sum to 1.0) */
export const JUDGE_WEIGHTS = {
  legality: 0.40,
  complianceRisk: 0.25,
  financialOutcome: 0.20,
  documentation: 0.10,
  ethics: 0.05,
} as const

export interface JudgeScoreData {
  firmKey: FirmKey
  legality: number
  complianceRisk: number
  financialOutcome: number
  documentation: number
  ethics: number
  weightedTotal: number
  rationale: string
  riskFlags: string[]
  auditTriggers: string[]
}

export interface JudgeScoreSummary {
  scores: JudgeScoreData[]
  winner: FirmKey
  summary: string
}

// ── Financial Context ────────────────────────────────────────────────────────

export interface FinancialContext {
  businessKey: BusinessKey
  businessName: string
  snapshotDate: string
  revenue?: {
    mtdCents: number
    expensesCents: number
    growthPercent: number
    invoiceCount: number
  }
  deductions?: {
    totalDeductibleCents: number
    categories: Array<{
      category: string
      amountCents: number
      count: number
    }>
  }
  bas?: {
    currentQuarter: string
    gstCollectedCents: number
    gstPaidCents: number
    netGstCents: number
  }
  recentTransactions?: Array<{
    date: string
    description: string
    amountCents: number
    category: string | null
  }>
}

// ── Streaming Events ─────────────────────────────────────────────────────────

export type DebateEvent =
  | { event: 'round_start'; round: number; type: RoundType }
  | { event: 'firm_start'; round: number; firm: FirmKey }
  | { event: 'firm_response'; round: number; firm: FirmKey; preview: string }
  | { event: 'round_complete'; round: number }
  | { event: 'judge_start' }
  | { event: 'judge_complete'; winner: FirmKey; scores: JudgeScoreData[] }
  | { event: 'case_complete' }
  | { event: 'error'; message: string; round?: number; firm?: FirmKey }

// ── Agent Config ─────────────────────────────────────────────────────────────

export interface FirmAgentConfig {
  key: FirmKey
  name: string
  model: string
  systemPrompt: string
  maxOutputTokens: number
}

export interface JudgeAgentConfig {
  model: string
  systemPrompt: string
  maxOutputTokens: number
}

// ── API Request/Response Types ───────────────────────────────────────────────

export interface CreateCaseRequest {
  title: string
  scenario: string
  businessKey: BusinessKey
}

export interface AccountantReviewRequest {
  decision: 'approved' | 'rejected'
  notes: string
  reviewedBy: string
}

export interface CaseListResponse {
  cases: AdvisoryCase[]
  total: number
  page: number
  pageSize: number
}

export interface CaseDetailResponse {
  case: AdvisoryCase
  proposals: AdvisoryProposal[]
  scores: AdvisoryJudgeScore[]
  evidenceCount: number
}

export interface ProposalsResponse {
  proposals: AdvisoryProposal[]
}

export interface EvidenceResponse {
  evidence: AdvisoryEvidence[]
  total: number
}

export interface ScoresResponse {
  scores: AdvisoryJudgeScore[]
  winner: FirmKey | null
}
