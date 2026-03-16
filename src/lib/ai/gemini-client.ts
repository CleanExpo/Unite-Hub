// src/lib/ai/gemini-client.ts
// Singleton Google Generative AI client.
// All Gemini calls (image generation, vision analysis) go through this client.

import { GoogleGenerativeAI } from '@google/generative-ai'

let _instance: GoogleGenerativeAI | null = null

/**
 * Returns a singleton GoogleGenerativeAI instance.
 * Throws if GEMINI_API_KEY is not configured.
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (!_instance) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Configure it in your environment variables.'
      )
    }
    _instance = new GoogleGenerativeAI(apiKey)
  }
  return _instance
}

/** Reset the singleton — used in tests to ensure isolation. */
export function resetGeminiClient(): void {
  _instance = null
}
