/**
 * Model Capability Map
 *
 * Defines capabilities, cost profiles, and performance characteristics for all available models.
 * Used by routing engine to make intelligent model selection decisions.
 */

import { ModelCapability } from './types';

// Comprehensive model catalog
const modelCapabilities: ModelCapability[] = [
  // Anthropic Models
  {
    id: 'claude-opus-4-5-20251101',
    model: 'claude-opus-4-5-20251101',
    capability: 'extended-thinking',
    level: 'expert',
    costPerToken: 0.015,
    latencyMs: 2000,
    availabilityScore: 0.99,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: false,
    supportsCaching: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-opus-4-1-extended-thinking',
    model: 'claude-opus-4-5-20251101',
    capability: 'complex-reasoning',
    level: 'expert',
    costPerToken: 0.015,
    latencyMs: 3500,
    availabilityScore: 0.99,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: false,
    supportsCaching: true,
    supportsStreaming: false,
  },
  {
    id: 'claude-sonnet-4-5-standard',
    model: 'claude-sonnet-4-5-20250929',
    capability: 'general-purpose',
    level: 'advanced',
    costPerToken: 0.003,
    latencyMs: 1200,
    availabilityScore: 0.995,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: true,
    supportsCaching: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-sonnet-4-5-vision',
    model: 'claude-sonnet-4-5-20250929',
    capability: 'vision',
    level: 'advanced',
    costPerToken: 0.0035,
    latencyMs: 1500,
    availabilityScore: 0.99,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: false,
    supportsCaching: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-haiku-4-5-fast',
    model: 'claude-haiku-4-5-20251001',
    capability: 'lightweight',
    level: 'intermediate',
    costPerToken: 0.0004,
    latencyMs: 600,
    availabilityScore: 0.998,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: true,
    supportsCaching: true,
    supportsStreaming: true,
  },

  // GPT Models (via OpenRouter)
  {
    id: 'openrouter-gpt4-turbo',
    model: 'openrouter/openai/gpt-4-turbo',
    capability: 'general-purpose',
    level: 'advanced',
    costPerToken: 0.01,
    latencyMs: 1800,
    availabilityScore: 0.98,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: true,
    supportsCaching: false,
    supportsStreaming: true,
  },
  {
    id: 'openrouter-gpt4-vision',
    model: 'openrouter/openai/gpt-4-vision',
    capability: 'vision',
    level: 'advanced',
    costPerToken: 0.012,
    latencyMs: 2200,
    availabilityScore: 0.97,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: false,
    supportsCaching: false,
    supportsStreaming: true,
  },

  // Gemini Models
  {
    id: 'gemini-3-pro',
    model: 'gemini-3-pro',
    capability: 'general-purpose',
    level: 'advanced',
    costPerToken: 0.001,
    latencyMs: 1000,
    availabilityScore: 0.995,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: true,
    supportsCaching: true,
    supportsStreaming: true,
  },
  {
    id: 'gemini-3-vision',
    model: 'gemini-3-pro-vision',
    capability: 'vision',
    level: 'advanced',
    costPerToken: 0.0015,
    latencyMs: 1300,
    availabilityScore: 0.99,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: false,
    supportsCaching: true,
    supportsStreaming: true,
  },
  {
    id: 'gemini-3-long-context',
    model: 'gemini-3-pro',
    capability: 'long-context',
    level: 'expert',
    costPerToken: 0.0008,
    latencyMs: 1500,
    availabilityScore: 0.99,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: true,
    supportsCaching: true,
    supportsStreaming: true,
  },

  // Llama Models
  {
    id: 'llama-3-70b',
    model: 'openrouter/meta-llama/llama-3-70b',
    capability: 'general-purpose',
    level: 'intermediate',
    costPerToken: 0.0007,
    latencyMs: 2000,
    availabilityScore: 0.96,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: true,
    supportsCaching: false,
    supportsStreaming: true,
  },

  // Perplexity Sonar (Research)
  {
    id: 'perplexity-sonar-pro',
    model: 'perplexity-sonar-pro',
    capability: 'research',
    level: 'advanced',
    costPerToken: 0.01,
    latencyMs: 3000,
    availabilityScore: 0.98,
    lastTestedAt: new Date().toISOString(),
    supportsBatching: false,
    supportsCaching: false,
    supportsStreaming: false,
  },
];

/**
 * Get all capabilities for a model
 */
export function getModelCapabilities(modelId: string): ModelCapability[] {
  return modelCapabilities.filter(cap => cap.model === modelId);
}

/**
 * Find models supporting a specific capability
 */
export function getModelsWithCapability(capability: string): ModelCapability[] {
  return modelCapabilities.filter(cap => cap.capability === capability);
}

/**
 * Find cheapest model for capability
 */
export function getCheapestModel(capability: string): ModelCapability | null {
  const candidates = getModelsWithCapability(capability);
  if (candidates.length === 0) {
return null;
}
  return candidates.reduce((prev, current) =>
    prev.costPerToken < current.costPerToken ? prev : current
  );
}

/**
 * Find fastest model for capability
 */
export function getFastestModel(capability: string): ModelCapability | null {
  const candidates = getModelsWithCapability(capability);
  if (candidates.length === 0) {
return null;
}
  return candidates.reduce((prev, current) =>
    prev.latencyMs < current.latencyMs ? prev : current
  );
}

/**
 * Find most reliable model for capability
 */
export function getMostReliableModel(capability: string): ModelCapability | null {
  const candidates = getModelsWithCapability(capability);
  if (candidates.length === 0) {
return null;
}
  return candidates.reduce((prev, current) =>
    prev.availabilityScore > current.availabilityScore ? prev : current
  );
}

/**
 * Score model for a specific use case (0-100)
 */
export function scoreModelForUseCase(
  capability: ModelCapability,
  constraints: {
    maxCostPerToken?: number;
    maxLatencyMs?: number;
    minAvailabilityScore?: number;
    needsCaching?: boolean;
    needsBatching?: boolean;
    needsStreaming?: boolean;
  }
): number {
  let score = 50; // Base score

  // Cost scoring (cheaper = higher score)
  if (constraints.maxCostPerToken) {
    if (capability.costPerToken <= constraints.maxCostPerToken) {
      score += 15;
    } else {
      return 0; // Fails constraint
    }
  }

  // Latency scoring (faster = higher score)
  if (constraints.maxLatencyMs) {
    if (capability.latencyMs <= constraints.maxLatencyMs) {
      score += 15;
    } else {
      return 0; // Fails constraint
    }
  }

  // Availability scoring
  if (constraints.minAvailabilityScore) {
    if (capability.availabilityScore >= constraints.minAvailabilityScore) {
      score += 10;
    } else {
      return 0; // Fails constraint
    }
  }

  // Feature support scoring
  if (constraints.needsCaching && capability.supportsCaching) {
score += 5;
}
  if (constraints.needsBatching && capability.supportsBatching) {
score += 5;
}
  if (constraints.needsStreaming && capability.supportsStreaming) {
score += 5;
}

  return Math.min(100, score);
}

/**
 * Get recommended models ranked by score
 */
export function getRecommendedModels(
  capability: string,
  constraints: {
    maxCostPerToken?: number;
    maxLatencyMs?: number;
    minAvailabilityScore?: number;
    needsCaching?: boolean;
    needsBatching?: boolean;
    needsStreaming?: boolean;
  },
  limit = 3
): { capability: ModelCapability; score: number }[] {
  const candidates = getModelsWithCapability(capability);

  return candidates
    .map(cap => ({
      capability: cap,
      score: scoreModelForUseCase(cap, constraints),
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get model by ID
 */
export function getModelCapabilityById(id: string): ModelCapability | null {
  return modelCapabilities.find(cap => cap.id === id) || null;
}

/**
 * Get all available models
 */
export function getAllModels(): string[] {
  const models = new Set(modelCapabilities.map(cap => cap.model));
  return Array.from(models);
}

/**
 * Get capability statistics
 */
export function getCapabilityStats() {
  const uniqueModels = new Set(modelCapabilities.map(cap => cap.model));
  const uniqueCapabilities = new Set(modelCapabilities.map(cap => cap.capability));

  const avgCost =
    modelCapabilities.reduce((sum, cap) => sum + cap.costPerToken, 0) /
    modelCapabilities.length;
  const avgLatency =
    modelCapabilities.reduce((sum, cap) => sum + cap.latencyMs, 0) /
    modelCapabilities.length;
  const avgAvailability =
    modelCapabilities.reduce((sum, cap) => sum + cap.availabilityScore, 0) /
    modelCapabilities.length;

  return {
    totalModels: uniqueModels.size,
    totalCapabilities: uniqueCapabilities.size,
    totalMappings: modelCapabilities.length,
    averageCostPerToken: avgCost.toFixed(6),
    averageLatencyMs: avgLatency.toFixed(0),
    averageAvailabilityScore: avgAvailability.toFixed(3),
  };
}

/**
 * Update model last tested time
 */
export function updateModelLastTestedAt(id: string): ModelCapability | null {
  const cap = modelCapabilities.find(c => c.id === id);
  if (cap) {
    cap.lastTestedAt = new Date().toISOString();
  }
  return cap || null;
}

/**
 * Get models by capability level
 */
export function getModelsByCapabilityLevel(level: 'basic' | 'intermediate' | 'advanced' | 'expert'): ModelCapability[] {
  return modelCapabilities.filter(cap => cap.level === level);
}
