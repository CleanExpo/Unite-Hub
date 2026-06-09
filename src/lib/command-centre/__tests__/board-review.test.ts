import { describe, it, expect, vi } from 'vitest'
import {
  runBoardReview,
  aggregateVerdict,
  verdictToEventType,
  BOARD_PERSONAS,
  type ModelClientLike,
} from '@/lib/command-centre/board-review'
import type { PersonaOpinion } from '@/lib/command-centre/decisions'

// Build a mock Anthropic-like client that returns a single text block whose body
// is the supplied JSON string. Asserts ZERO live calls (vi.fn is local).
function makeModelClient(jsonText: string) {
  const create = vi.fn(async () => ({
    content: [{ type: 'text', text: jsonText }],
  }))
  const client = { messages: { create } } as unknown as ModelClientLike
  return { client, create }
}

function personasJson(stances: Record<string, string>): string {
  return JSON.stringify({
    personas: Object.entries(stances).map(([persona, stance]) => ({
      persona,
      stance,
      comment: `${persona} says ${stance}`,
    })),
    rationale: 'Synthesised board rationale.',
  })
}

describe('board-review aggregateVerdict', () => {
  const mk = (stance: PersonaOpinion['stance']): PersonaOpinion => ({
    persona: 'p',
    stance,
    comment: '',
  })

  it('returns HOLD for an empty board', () => {
    expect(aggregateVerdict([])).toBe('HOLD')
  })

  it('returns APPROVED only when all personas approve', () => {
    expect(aggregateVerdict([mk('APPROVED'), mk('APPROVED')])).toBe('APPROVED')
  })

  it('returns HOLD when any persona holds (and none reject)', () => {
    expect(aggregateVerdict([mk('APPROVED'), mk('HOLD'), mk('APPROVED')])).toBe('HOLD')
  })

  it('returns REJECTED when any persona rejects (hard stop wins)', () => {
    expect(aggregateVerdict([mk('APPROVED'), mk('HOLD'), mk('REJECTED')])).toBe('REJECTED')
  })
})

describe('board-review verdictToEventType', () => {
  it('maps verdicts to task event types', () => {
    expect(verdictToEventType('APPROVED')).toBe('approved')
    expect(verdictToEventType('REJECTED')).toBe('blocked')
    expect(verdictToEventType('HOLD')).toBe('comment')
  })
})

describe('runBoardReview', () => {
  it('parses the model JSON, returns personas + rationale, and aggregates APPROVED', async () => {
    const allApproved = Object.fromEntries(BOARD_PERSONAS.map((p) => [p.id, 'APPROVED']))
    const { client, create } = makeModelClient(personasJson(allApproved))

    const result = await runBoardReview({ subject: 'Ship X', brief: 'do the thing' }, client)

    expect(create).toHaveBeenCalledTimes(1)
    expect(result.verdict).toBe('APPROVED')
    expect(result.rationale).toBe('Synthesised board rationale.')
    expect(result.personas).toHaveLength(BOARD_PERSONAS.length)
    expect(result.personas.every((p) => p.stance === 'APPROVED')).toBe(true)
  })

  it('aggregates to REJECTED when the contrarian rejects', async () => {
    const stances = Object.fromEntries(BOARD_PERSONAS.map((p) => [p.id, 'APPROVED']))
    stances['contrarian'] = 'REJECTED'
    const { client } = makeModelClient(personasJson(stances))

    const result = await runBoardReview({ subject: 'Risky idea', brief: 'big risk' }, client)
    expect(result.verdict).toBe('REJECTED')
  })

  it('aggregates to HOLD when a persona holds', async () => {
    const stances = Object.fromEntries(BOARD_PERSONAS.map((p) => [p.id, 'APPROVED']))
    stances['technical-architect'] = 'HOLD'
    const { client } = makeModelClient(personasJson(stances))

    const result = await runBoardReview({ subject: 'Maybe idea', brief: 'unclear' }, client)
    expect(result.verdict).toBe('HOLD')
  })

  it('normalises loose stance strings and tolerates markdown-fenced JSON', async () => {
    const fenced =
      '```json\n' +
      JSON.stringify({
        personas: [
          { persona: 'revenue', stance: 'approve', comment: 'ok' },
          { persona: 'contrarian', stance: 'reject', comment: 'no' },
        ],
        rationale: 'mixed',
      }) +
      '\n```'
    const { client } = makeModelClient(fenced)

    const result = await runBoardReview({ subject: 'S', brief: 'B' }, client)
    expect(result.personas[0].stance).toBe('APPROVED')
    expect(result.personas[1].stance).toBe('REJECTED')
    // A reject present → REJECTED overall.
    expect(result.verdict).toBe('REJECTED')
  })

  it('throws when the model returns unparseable text', async () => {
    const { client } = makeModelClient('not json at all')
    await expect(runBoardReview({ subject: 'S', brief: 'B' }, client)).rejects.toThrow(
      /Failed to parse board verdict JSON/,
    )
  })

  it('exposes exactly nine personas in the board roster', () => {
    expect(BOARD_PERSONAS).toHaveLength(9)
    const ids = BOARD_PERSONAS.map((p) => p.id)
    expect(ids).toContain('ceo-frames')
    expect(ids).toContain('contrarian')
    expect(ids).toContain('custom-oracle')
  })
})
