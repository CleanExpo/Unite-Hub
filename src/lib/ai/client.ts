// src/lib/ai/client.ts
// Singleton Anthropic client for the centralised AI service layer.
// All AI calls should go through this client to avoid duplicate instantiation.

import Anthropic from '@anthropic-ai/sdk'

let _instance: Anthropic | null = null

/**
 * Returns a singleton Anthropic client instance.
 * Throws if ANTHROPIC_API_KEY is not configured.
 */
export function getAIClient(): Anthropic {
  if (!_instance) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Configure it in your environment variables.'
      )
    }
    _instance = new Anthropic({ apiKey })
  }
  return _instance
}

/** Reset the singleton — used in tests to ensure isolation. */
export function resetAIClient(): void {
  _instance = null
}
