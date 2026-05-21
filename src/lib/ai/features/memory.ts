// src/lib/ai/features/memory.ts
// Memory tool configuration for Anthropic's server-side memory feature.

/** Configuration options for the memory tool. */
export interface MemoryConfig {
  namespace?: string
}

/**
 * Builds a memory tool configuration object for inclusion in API requests.
 * When a namespace is provided, memory is scoped to that namespace.
 */
export function buildMemoryToolConfig(config?: MemoryConfig) {
  return {
    type: 'memory' as const,
    name: 'memory' as const,
    ...(config?.namespace ? { namespace: config.namespace } : {}),
  }
}
