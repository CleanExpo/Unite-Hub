// src/lib/experiments/statistics.ts
// Two-proportion z-test for A/B experiment analysis.
// Compares engagement/conversion rates between control and treatment variants.

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VariantMetrics {
  impressions: number
  engagements: number // clicks, likes, comments, shares — depends on primary metric
}

export interface SignificanceResult {
  zScore: number
  pValue: number
  isSignificant: boolean
  controlRate: number
  treatmentRate: number
  lift: number // percentage improvement of treatment over control
}

// ── Core Significance Calculation ──────────────────────────────────────────────

/**
 * Two-proportion z-test comparing engagement rates between control and treatment.
 * Returns null if either variant has fewer than 30 impressions (minimum sample size).
 *
 * @param control - Metrics for the control variant
 * @param treatment - Metrics for the treatment variant
 * @param confidenceLevel - Confidence threshold (default 0.95 = 95%)
 */
export function calculateSignificance(
  control: VariantMetrics,
  treatment: VariantMetrics,
  confidenceLevel: number = 0.95
): SignificanceResult | null {
  // Need minimum sample size for statistical validity
  if (control.impressions < 30 || treatment.impressions < 30) return null

  const p1 = control.engagements / control.impressions
  const p2 = treatment.engagements / treatment.impressions
  const n1 = control.impressions
  const n2 = treatment.impressions

  // Pooled proportion under the null hypothesis
  const pPool = (control.engagements + treatment.engagements) / (n1 + n2)
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2))

  // Standard error of zero means identical proportions — no meaningful comparison
  if (se === 0) return null

  const z = (p2 - p1) / se
  // Two-tailed p-value using normal approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(z)))

  const alpha = 1 - confidenceLevel

  return {
    zScore: Math.round(z * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    isSignificant: pValue < alpha,
    controlRate: Math.round(p1 * 10000) / 10000,
    treatmentRate: Math.round(p2 * 10000) / 10000,
    lift: p1 === 0 ? 0 : Math.round(((p2 - p1) / p1) * 10000) / 100,
  }
}

// ── Batch Analysis ─────────────────────────────────────────────────────────────

export interface VariantAggregated {
  variantId: string
  isControl: boolean
  totalImpressions: number
  totalEngagements: number
}

/**
 * Analyse all treatment variants against the control variant.
 * Returns a map of variantId -> SignificanceResult for each non-control variant.
 * Returns empty object if no control variant is found.
 *
 * @param variants - Array of aggregated variant metrics (must include exactly one control)
 * @param confidenceLevel - Confidence threshold (default 0.95 = 95%)
 */
export function analyseExperimentResults(
  variants: VariantAggregated[],
  confidenceLevel: number = 0.95
): Record<string, SignificanceResult | null> {
  const control = variants.find((v) => v.isControl)
  if (!control) return {}

  const results: Record<string, SignificanceResult | null> = {}
  for (const variant of variants) {
    if (variant.isControl) continue
    results[variant.variantId] = calculateSignificance(
      { impressions: control.totalImpressions, engagements: control.totalEngagements },
      { impressions: variant.totalImpressions, engagements: variant.totalEngagements },
      confidenceLevel
    )
  }
  return results
}

// ── Normal CDF Approximation ───────────────────────────────────────────────────

/**
 * Standard normal CDF approximation using the Abramowitz & Stegun method.
 * Maximum error: 1.5 x 10^-7 — more than sufficient for A/B test analysis.
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x) / Math.SQRT2

  const t = 1 / (1 + p * absX)
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)

  return 0.5 * (1 + sign * y)
}
