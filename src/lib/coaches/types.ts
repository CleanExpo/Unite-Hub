// src/lib/coaches/types.ts
// Shared types and configuration for the Macro Coaches system (UNI-1510).
// Four AI coaches: Revenue, Build, Marketing, Life.

// ── Coach Types ──────────────────────────────────────────────────────────────

export const COACH_TYPES = ['revenue', 'build', 'marketing', 'life'] as const
export type CoachType = (typeof COACH_TYPES)[number]

// ── Coach Configuration ──────────────────────────────────────────────────────

export interface CoachConfig {
  name: string
  description: string
  model: string
  maxTokens: number
  temperature: number
}

export const COACH_CONFIGS: Record<CoachType, CoachConfig> = {
  revenue: {
    name: 'Revenue Coach',
    description: 'Analyses revenue trends, cash flow health, and growth opportunities across businesses.',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 1500,
    temperature: 0.3,
  },
  build: {
    name: 'Build Coach',
    description: 'Reviews project velocity, technical debt, and delivery milestones.',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 1200,
    temperature: 0.2,
  },
  marketing: {
    name: 'Marketing Coach',
    description: 'Evaluates marketing performance, content pipeline, and audience engagement.',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 1500,
    temperature: 0.5,
  },
  life: {
    name: 'Life Coach',
    description: 'Monitors founder wellbeing signals — workload balance, burnout risk, and personal priorities.',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 1000,
    temperature: 0.4,
  },
} as const

// ── Coach Context ────────────────────────────────────────────────────────────

/** Data object passed to the AI prompt — raw data plus metadata. */
export interface CoachContext {
  /** Which coach is consuming this data */
  coachType: CoachType
  /** ISO date string for the report */
  reportDate: string
  /** Optional business key if coach is scoped to a single business */
  businessKey?: string
  /** Arbitrary data payload specific to each coach's data fetcher */
  data: Record<string, unknown>
  /** Additional metadata (e.g. date ranges, data freshness) */
  metadata?: Record<string, unknown>
}

// ── Coach Result ─────────────────────────────────────────────────────────────

/** Returned by the coach runner after a successful (or failed) run. */
export interface CoachResult {
  reportId: string
  status: 'completed' | 'failed'
  briefMarkdown: string | null
  metrics: Record<string, number>
  inputTokens: number
  outputTokens: number
  durationMs: number
  error?: string
}

// ── Coach Report (Database Row) ──────────────────────────────────────────────

/** Mirrors the public.coach_reports table schema. */
export interface CoachReport {
  id: string
  founder_id: string
  coach_type: CoachType
  business_key: string | null
  report_date: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  brief_markdown: string | null
  raw_data: Record<string, unknown> | null
  metrics: Record<string, number> | null
  input_tokens: number | null
  output_tokens: number | null
  model: string | null
  duration_ms: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// ── Data Fetcher ─────────────────────────────────────────────────────────────

/** Async function that gathers context data for a specific coach. */
export type CoachDataFetcher = (founderId: string) => Promise<CoachContext>
