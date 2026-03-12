// src/lib/ai/features/thinking.ts
// Adaptive thinking budget calculator.
// Scores prompt complexity using regex signal patterns and maps to a token budget.

// ── Signal patterns with weights ────────────────────────────────────────────

const SIGNAL_PATTERNS: Array<{ pattern: RegExp; weight: number }> = [
  // Comparative reasoning
  { pattern: /\b(compare|versus|vs|trade-off|pros\s+and\s+cons)\b/gi, weight: 2 },
  // Analytical depth
  { pattern: /\b(analy[sz]e|evaluate|assess|investigate)\b/gi, weight: 1.5 },
  // Consequence mapping
  { pattern: /\b(implication|consequence|impact|risk)\b/gi, weight: 1.5 },
  // Strategic complexity
  { pattern: /\b(strateg|restructur|optimi[sz]|refactor)\b/gi, weight: 2 },
  // Australian tax domain
  { pattern: /\b(tax|cgt|gst|bas|ato|division|subdivision|part\s+iv)\b/gi, weight: 1.5 },
  // Multi-step reasoning
  { pattern: /\b(multi-step|phase|stage|sequence)\b/gi, weight: 1.5 },
  // Deliberative signals
  { pattern: /\b(consider|account\s+for|factor\s+in|weigh)\b/gi, weight: 1 },
  // Legal/compliance
  { pattern: /\b(legal|compliance|regulation|legislation|ruling)\b/gi, weight: 1.5 },
  // Financial domain
  { pattern: /\b(financial|revenue|profit|loss|cashflow|budget)\b/gi, weight: 1 },
  // Large numbers (4+ digits)
  { pattern: /\d{4,}/g, weight: 0.5 },
]

const MIN_BUDGET = 2000
const MAX_BUDGET = 16000

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Score a prompt's complexity based on regex signal patterns.
 * Returns a numeric score (0–30+) — higher means more complex.
 */
export function detectComplexity(prompt: string): number {
  let score = 0

  for (const { pattern, weight } of SIGNAL_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0
    const matches = prompt.match(pattern)
    if (matches) {
      score += matches.length * weight
    }
  }

  // Length-based contribution
  const words = prompt.split(/\s+/).filter(Boolean).length
  if (words > 0) {
    score += Math.log2(words) * 0.5
  }

  // Question mark contribution
  const questionMarks = (prompt.match(/\?/g) || []).length
  score += questionMarks * 1.5

  return score
}

/**
 * Map prompt complexity to a thinking token budget in [MIN_BUDGET, MAX_BUDGET].
 */
export function calculateThinkingBudget(prompt: string): number {
  const complexity = detectComplexity(prompt)
  const ratio = Math.min(Math.max((complexity - 2) / 13, 0), 1)
  const budget = Math.round(MIN_BUDGET + ratio * (MAX_BUDGET - MIN_BUDGET))
  return Math.min(Math.max(budget, MIN_BUDGET), MAX_BUDGET)
}
