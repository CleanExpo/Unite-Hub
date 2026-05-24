// src/lib/ai/cost-tracker.ts
// Per-capability usage tracking for the AI service layer.

interface UsageEntry {
  totalInputTokens: number
  totalOutputTokens: number
  calls: number
  models: string[]
}

const usageMap = new Map<string, UsageEntry>()

/**
 * Records token usage for a given capability.
 * Accumulates input/output tokens and tracks distinct models used.
 */
export function trackUsage(
  capabilityId: string,
  usage: { inputTokens: number; outputTokens: number; model: string },
) {
  const existing = usageMap.get(capabilityId)
  if (existing) {
    existing.totalInputTokens += usage.inputTokens
    existing.totalOutputTokens += usage.outputTokens
    existing.calls += 1
    if (!existing.models.includes(usage.model)) {
      existing.models.push(usage.model)
    }
  } else {
    usageMap.set(capabilityId, {
      totalInputTokens: usage.inputTokens,
      totalOutputTokens: usage.outputTokens,
      calls: 1,
      models: [usage.model],
    })
  }
}

/**
 * Returns a summary of all tracked usage, keyed by capability ID.
 */
export function getUsageSummary(): Record<
  string,
  { totalInputTokens: number; totalOutputTokens: number; calls: number; models: string[] }
> {
  const result: Record<string, UsageEntry> = {}
  for (const [key, value] of usageMap) {
    result[key] = { ...value, models: [...value.models] }
  }
  return result
}

/**
 * Clears all accumulated usage data.
 */
export function resetUsage() {
  usageMap.clear()
}
