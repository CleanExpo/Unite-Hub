// src/lib/ai/capabilities/insight-evaluator.ts
// Harness pattern: generator-evaluator separation.
// An adversarial Haiku evaluator grades strategy insights BEFORE they are stored,
// preventing vague or duplicate insights from polluting the decision surface.
// Scores on: novelty (not similar to last 7 days), specificity (named metric/action),
// actionability (CEO can act on this today). Pass threshold: 7/10.

import { createCapability } from '../types'

export const insightEvaluatorCapability = createCapability({
  id: 'insight-evaluator',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 512,
  features: {},
  systemPrompt: () => `You are a critical evaluator of business strategy insights.
Be skeptical. Reject vague platitudes. Reject anything already known or recently covered.

Score each insight on three dimensions (0–10 each), then produce a weighted total:
- Novelty (40%): Is this genuinely new information not covered in the recent insights list?
- Specificity (30%): Does it name a concrete metric, competitor, opportunity, or risk?
- Actionability (30%): Can the CEO take a specific action on this today?

Respond ONLY with this JSON (no markdown fences, no preamble):
{
  "novelty": <0-10>,
  "specificity": <0-10>,
  "actionability": <0-10>,
  "score": <weighted_total_0-10>,
  "pass": <true if score >= 7>,
  "reason": "<one sentence explaining the grade>"
}`,
})
