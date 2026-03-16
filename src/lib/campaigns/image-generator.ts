// src/lib/campaigns/image-generator.ts
// Generates branded marketing images using Gemini's image generation models.
// Uses gemini-2.0-flash-preview-image-generation (Nano Banana 2) for standard posts.
// Falls back to graceful stub if image generation is unavailable.

import { getGeminiClient } from '@/lib/ai/gemini-client'
import { buildImagePrompt } from './prompts/image-prompt'
import type { BrandDNA } from './types'
import type { SocialPlatform } from '@/lib/integrations/social/types'

// ─── Models ──────────────────────────────────────────────────────────────────

// Nano Banana 2 — fast, cost-effective ($0.04/image)
const IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation'

// ─── Main Generator ───────────────────────────────────────────────────────────

export interface GeneratedImageResult {
  imageBase64: string | null
  mimeType: string
  model: string
  promptUsed: string
  error: string | null
}

/**
 * Generates a branded marketing image using Gemini's image generation API.
 * Returns base64-encoded image data.
 * On failure (model unavailable, quota exceeded), returns error with null imageBase64.
 */
export async function generateBrandedImage(
  rawImagePrompt: string,
  brand: BrandDNA,
  platform: SocialPlatform,
  headline: string | null,
  cta: string | null
): Promise<GeneratedImageResult> {
  const enrichedPrompt = buildImagePrompt(rawImagePrompt, brand, platform, headline, cta)

  try {
    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        // @ts-expect-error — responseModalities is a valid config option not yet in type definitions
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    const result = await model.generateContent(enrichedPrompt)
    const response = result.response

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return {
          imageBase64: part.inlineData.data ?? null,
          mimeType: part.inlineData.mimeType,
          model: IMAGE_MODEL,
          promptUsed: enrichedPrompt,
          error: null,
        }
      }
    }

    return {
      imageBase64: null,
      mimeType: 'image/png',
      model: IMAGE_MODEL,
      promptUsed: enrichedPrompt,
      error: 'No image part found in Gemini response',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[ImageGenerator] Gemini image generation failed (non-fatal):', message)
    return {
      imageBase64: null,
      mimeType: 'image/png',
      model: IMAGE_MODEL,
      promptUsed: enrichedPrompt,
      error: message,
    }
  }
}
