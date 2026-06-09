// src/lib/command-centre/board-review.ts
//
// CC-08 — Senior Board Review.
//
// Runs a task/brief past the 9-persona CEO Board and returns a single structured
// verdict (APPROVED / HOLD / REJECTED) with rationale + per-persona opinions.
//
// No existing 9-persona-per-task board path exists in the repo: `ceo-board/
// daily-briefing.ts` synthesises a *daily* briefing, and `app/api/boardroom/**`
// is CRUD over board members/meetings/decisions — neither reviews a single idea
// across the 9 lenses. So this is a clean, additive module that calls the
// Anthropic SDK through the existing singleton client (`@/lib/ai/client`),
// matching the model-router/daily-briefing usage pattern.
//
// The model client is injected (default = getAIClient) so unit tests can mock it
// with ZERO live calls. Persistence + events are handled by the caller (the
// board route) via createDecision / appendTaskEvent.

import { getAIClient } from '@/lib/ai/client'
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models'
import type { DecisionVerdict, PersonaOpinion } from './decisions'

// ─── The 9 personas (from the Nexus spec §4.C) ────────────────────────────────

export interface BoardPersona {
  id: string
  name: string
  /** The lens this persona evaluates the idea through. */
  lens: string
}

export const BOARD_PERSONAS: readonly BoardPersona[] = [
  { id: 'ceo-frames', name: 'CEO (frames the decision)', lens: 'strategic framing, north-star alignment, sequencing' },
  { id: 'revenue', name: 'Revenue', lens: 'monetisation, cashflow impact, payback period, unit economics' },
  { id: 'product-strategist', name: 'Product Strategist', lens: 'product fit, user value, scope discipline, MVP cut' },
  { id: 'technical-architect', name: 'Technical Architect', lens: 'feasibility, architecture, maintainability, technical risk' },
  { id: 'market-strategist', name: 'Market Strategist', lens: 'positioning, differentiation, timing, competitive landscape' },
  { id: 'compounder', name: 'Compounder', lens: 'durable advantage, reuse, leverage that compounds over time' },
  { id: 'moonshot', name: 'Moonshot', lens: 'upside, ambition, 10x potential vs incremental gain' },
  { id: 'custom-oracle', name: 'Custom Oracle (AU restoration/compliance)', lens: 'Australian restoration-industry fit, regulatory & compliance constraints' },
  { id: 'contrarian', name: 'Contrarian (stop-reason)', lens: 'strongest reason to STOP: risk, downside, hidden cost, why-not' },
] as const

// ─── Public types ─────────────────────────────────────────────────────────────

export interface BoardReviewInput {
  /** Short subject for the deliberation (usually the task title). */
  subject: string
  /** The idea / brief body the board deliberates on. */
  brief: string
  /** Optional project context to ground the personas. */
  projectKey?: string
  /** Optional risk hint to inform the contrarian / architect lenses. */
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
}

export interface BoardVerdict {
  verdict: DecisionVerdict
  rationale: string
  personas: PersonaOpinion[]
}

/** Minimal structural type for the Anthropic client surface we depend on. */
export interface ModelClientLike {
  messages: {
    create(params: unknown): Promise<{
      content: Array<{ type: string; text?: string }>
    }>
  }
}

// ─── Verdict aggregation (deterministic, testable) ────────────────────────────

/**
 * Aggregate per-persona stances into a single board verdict.
 * Rules (conservative — the friction model gates promotion):
 *  - ANY 'REJECTED' (a hard stop) → REJECTED.
 *  - else ANY 'HOLD' → HOLD.
 *  - else (unanimous APPROVED) → APPROVED.
 */
export function aggregateVerdict(personas: PersonaOpinion[]): DecisionVerdict {
  if (personas.length === 0) return 'HOLD'
  if (personas.some((p) => p.stance === 'REJECTED')) return 'REJECTED'
  if (personas.some((p) => p.stance === 'HOLD')) return 'HOLD'
  return 'APPROVED'
}

// ─── Prompt construction ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Senior CEO Board for a multi-business portfolio led by a founder based in Australia (specialised cleaning & restoration industry, plus an AI content agency). You deliberate on a single idea across NINE distinct personas, each with its own lens. You are a GATE before any execution: be rigorous, surface risk, and never rubber-stamp.

The nine personas and their lenses:
${BOARD_PERSONAS.map((p) => `- ${p.id} — ${p.name}: ${p.lens}`).join('\n')}

Each persona votes one of: APPROVED, HOLD, REJECTED — from its own lens only.
- APPROVED = clearly worth doing now, low concern from this lens.
- HOLD = needs more information, scoping, or a precondition before proceeding.
- REJECTED = should not proceed (this lens sees a blocking problem).

Then synthesise ONE board-level rationale (3-5 sentences) explaining the collective view.

Return ONLY a JSON object, no preamble and no markdown fences, with this exact shape:
{
  "personas": [
    { "persona": "ceo-frames", "stance": "APPROVED|HOLD|REJECTED", "comment": "one line" },
    ... one entry per persona id above, all nine ...
  ],
  "rationale": "3-5 sentence board synthesis"
}`

function buildUserMessage(input: BoardReviewInput): string {
  const lines = [
    `## Idea under review: ${input.subject}`,
    '',
    input.projectKey ? `Project: ${input.projectKey}` : 'Project: (portfolio-wide)',
    input.riskLevel ? `Declared risk level: ${input.riskLevel}` : '',
    '',
    '### Brief',
    input.brief.trim(),
    '',
    'Deliberate as all nine personas, then synthesise the board rationale. Return ONLY the JSON.',
  ]
  return lines.filter((l) => l !== '').join('\n')
}

// ─── Response parsing ─────────────────────────────────────────────────────────

function extractText(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('')
}

function normaliseStance(raw: unknown): DecisionVerdict {
  const s = String(raw ?? '').trim().toUpperCase()
  if (s === 'APPROVED' || s === 'APPROVE') return 'APPROVED'
  if (s === 'REJECTED' || s === 'REJECT') return 'REJECTED'
  return 'HOLD'
}

function parseBoardResponse(text: string): { personas: PersonaOpinion[]; rationale: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text.trim())
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('[Board] Failed to parse board verdict JSON')
    parsed = JSON.parse(match[0])
  }

  const obj = parsed as { personas?: unknown; rationale?: unknown }
  const rawPersonas = Array.isArray(obj.personas) ? obj.personas : []

  const personas: PersonaOpinion[] = rawPersonas.map((p) => {
    const rec = p as Record<string, unknown>
    return {
      persona: String(rec.persona ?? '').trim() || 'unknown',
      stance: normaliseStance(rec.stance),
      comment: String(rec.comment ?? '').trim(),
    }
  })

  return {
    personas,
    rationale: typeof obj.rationale === 'string' ? obj.rationale.trim() : '',
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the 9-persona Senior Board over an idea/brief and return a structured
 * verdict. The board verdict is derived deterministically from the per-persona
 * stances via {@link aggregateVerdict} — the model supplies the lenses, the code
 * owns the gate.
 *
 * The `client` argument is injected for testing; production callers omit it and a
 * singleton Anthropic client is used. This function performs ONE model call.
 */
export async function runBoardReview(
  input: BoardReviewInput,
  client?: ModelClientLike,
): Promise<BoardVerdict> {
  const model = client ?? (getAIClient() as unknown as ModelClientLike)

  const response = await model.messages.create({
    model: ANTHROPIC_MODELS.OPUS,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(input) }],
  })

  const { personas, rationale } = parseBoardResponse(extractText(response.content))
  const verdict = aggregateVerdict(personas)

  return { verdict, rationale, personas }
}

/** Map a board verdict to the task event type the caller should append. */
export function verdictToEventType(verdict: DecisionVerdict): 'approved' | 'blocked' | 'comment' {
  if (verdict === 'APPROVED') return 'approved'
  if (verdict === 'REJECTED') return 'blocked'
  return 'comment'
}
