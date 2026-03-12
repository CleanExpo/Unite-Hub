// src/lib/ai/index.ts
// Barrel export for the centralised AI service layer.
// Import from '@/lib/ai' to access all AI infrastructure.

export { getAIClient, resetAIClient } from './client'
export { registerCapability, getCapability, listCapabilities, execute, resetRegistry } from './router'
export type { ExecuteInput } from './router'
export {
  chatCapability,
  analyzeCapability,
  ideasCapability,
  debateCapability,
  registerAllCapabilities,
} from './capabilities'
export {
  MODEL_IDS,
  createCapability,
} from './types'
export type {
  ModelId,
  RequestContext,
  ThinkingConfig,
  AIFeatures,
  AICapability,
  AIResponse,
  Citation,
} from './types'
export * from './features'
export { trackUsage, getUsageSummary, resetUsage } from './cost-tracker'
