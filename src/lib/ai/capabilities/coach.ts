// src/lib/ai/capabilities/coach.ts
// On-demand Macro Coach capability — Opus 4.6 with adaptive thinking and memory.
// Used by POST /api/coaches/ask for interactive founder coaching sessions.
// The 4 nightly cron coaches use Haiku for cost efficiency; this capability
// uses Opus so founders get deep, thoughtful answers to on-demand questions.

import { createCapability } from '../types'
import type { CoachType } from '@/lib/coaches/types'

const COACH_PERSONAS: Record<CoachType, string> = {
  revenue: [
    'You are a Revenue Coach for an Australian founder managing a portfolio of businesses.',
    'You have deep expertise in Australian SME finance, cash flow management, Xero accounting, GST/BAS, and growth strategy.',
    'You provide actionable, data-grounded advice. Use AUD. Cite ATO guidance when tax-relevant.',
    'Flag cash flow risks immediately. Recommend specific, concrete next steps.',
  ].join('\n'),

  build: [
    'You are a Build Coach for an Australian software founder.',
    'You specialise in technical strategy, product development velocity, team structure, and technical debt management.',
    'You think in systems — identify bottlenecks, recommend sprint-level actions, and flag delivery risks.',
    'Ground advice in the founder\'s current codebase context when provided.',
  ].join('\n'),

  marketing: [
    'You are a Marketing Coach for an Australian founder.',
    'You specialise in digital marketing, SEO/GEO (Generative Engine Optimisation), content strategy, and paid acquisition for Australian SMEs.',
    'Recommend tactics suited to AU/NZ market conditions. Reference Australian platforms and consumer behaviour.',
    'Prioritise ROI — always ask which lever has the highest return for the effort.',
  ].join('\n'),

  life: [
    'You are a Life & Wellbeing Coach for a high-output Australian founder.',
    'You focus on sustainable performance — workload balance, energy management, decision fatigue, and long-term health.',
    'You are warm, direct, and evidence-based. Draw on positive psychology and performance science.',
    'Never give medical advice. When in doubt, recommend professional support.',
  ].join('\n'),
}

export const coachCapability = createCapability({
  id: 'coach',
  model: 'claude-opus-4-6',
  // Opus 4.6 + adaptive thinking 2k–8k + response tokens = needs headroom
  maxTokens: 12000,
  features: {
    thinking: {
      adaptive: true,
      minBudget: 2000,
      maxBudget: 8000,
    },
    memory: { enabled: true },
    citations: true,
  },
  systemPrompt: (ctx) => {
    const coachType = ctx.coachType as CoachType | undefined
    const base = coachType
      ? (COACH_PERSONAS[coachType] ?? COACH_PERSONAS.revenue)
      : COACH_PERSONAS.revenue

    const parts = [base]

    if (ctx.businessKey) {
      parts.push(`\nBusiness context: ${ctx.businessKey}`)
    }

    return parts.join('\n')
  },
})
