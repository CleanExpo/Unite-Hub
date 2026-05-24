// src/lib/campaigns/image-generator.ts
// Generates branded marketing images using Gemini's image generation models.
// Uses gemini-2.0-flash-preview-image-generation (Nano Banana 2) for standard posts.
// Falls back to graceful stub if image generation is unavailable.

import { getGeminiClient } from '@/lib/ai/gemini-client'
import { getPaperBananaClient, QUALITY_APPROVED, QUALITY_REVIEW } from '@/lib/ai/paper-banana-client'
import { buildImagePrompt } from './prompts/image-prompt'
import { buildPaperBananaPrompt } from './prompts/paper-banana-prompt'
import type { BrandDNA, VisualType, QualityStatus, ImageEngine } from './types'
import { PLATFORM_DIMENSIONS } from './types'
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

  return callGeminiImageGen(enrichedPrompt)
}

async function callGeminiImageGen(prompt: string): Promise<GeneratedImageResult> {
  try {
    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        // @ts-expect-error — responseModalities is a valid config option not yet in type definitions
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })

    const result = await model.generateContent(prompt)
    const response = result.response

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return {
          imageBase64: part.inlineData.data ?? null,
          mimeType: part.inlineData.mimeType,
          model: IMAGE_MODEL,
          promptUsed: prompt,
          error: null,
        }
      }
    }

    return {
      imageBase64: null,
      mimeType: 'image/png',
      model: IMAGE_MODEL,
      promptUsed: prompt,
      error: 'No image part found in Gemini response',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[ImageGenerator] Gemini image generation failed (non-fatal):', message)
    return {
      imageBase64: null,
      mimeType: 'image/png',
      model: IMAGE_MODEL,
      promptUsed: prompt,
      error: message,
    }
  }
}

// ─── Dual-Engine Router ────────────────────────────────────────────────────────

export interface CampaignImageResult extends GeneratedImageResult {
  qualityScore: number | null
  qualityStatus: QualityStatus | null
  imageEngine: ImageEngine
}

/**
 * Routes image generation to the correct engine based on visualType:
 * - 'photo' → Gemini (existing generateBrandedImage path)
 * - All other types → PaperBanana (if configured), with Gemini fallback
 *
 * Quality gate: PaperBanana Critic score ≥70 = approved, 50-69 = review, <50 = Gemini fallback.
 */
export async function generateCampaignImage(
  rawImagePrompt: string,
  brand: BrandDNA,
  platform: SocialPlatform,
  headline: string | null,
  cta: string | null,
  visualType: VisualType
): Promise<CampaignImageResult> {
  // Photos always go to Gemini
  if (visualType === 'photo') {
    const result = await generateBrandedImage(rawImagePrompt, brand, platform, headline, cta)
    return { ...result, qualityScore: null, qualityStatus: null, imageEngine: 'gemini' }
  }

  // Non-photo types: try PaperBanana, fall back to Gemini
  const pbClient = getPaperBananaClient()
  if (!pbClient) {
    // PaperBanana not configured — Gemini fallback
    const result = await generateBrandedImage(rawImagePrompt, brand, platform, headline, cta)
    return { ...result, qualityScore: null, qualityStatus: null, imageEngine: 'gemini' }
  }

  // Build PaperBanana prompt
  const { prompt, style } = buildPaperBananaPrompt(
    rawImagePrompt,
    brand,
    visualType,
    platform,
    headline
  )

  // Route to correct PaperBanana endpoint
  const dims = PLATFORM_DIMENSIONS[platform]
  const pbResult = visualType === 'data_viz'
    ? await pbClient.generatePlot({ prompt, style, width: dims.width, height: dims.height })
    : await pbClient.generateDiagram({ prompt, style, width: dims.width, height: dims.height })

  // Check for PaperBanana errors — fall back to Gemini
  if (pbResult.error || !pbResult.imageBase64) {
    console.warn('[ImageGenerator] PaperBanana failed, falling back to Gemini:', pbResult.error)
    const result = await generateBrandedImage(rawImagePrompt, brand, platform, headline, cta)
    return { ...result, qualityScore: null, qualityStatus: null, imageEngine: 'gemini' }
  }

  // Evaluate quality via Critic agent
  const evaluation = await pbClient.evaluate(pbResult.imageBase64)
  const score = evaluation.score

  // Quality gate
  if (score < QUALITY_REVIEW) {
    // Score < 50: rejected — fall back to Gemini
    console.warn(`[ImageGenerator] PaperBanana quality score ${score} < ${QUALITY_REVIEW}, falling back to Gemini`)
    const result = await generateBrandedImage(rawImagePrompt, brand, platform, headline, cta)
    return { ...result, qualityScore: score, qualityStatus: 'rejected', imageEngine: 'gemini' }
  }

  const qualityStatus: QualityStatus = score >= QUALITY_APPROVED ? 'approved' : 'review'

  return {
    imageBase64: pbResult.imageBase64,
    mimeType: pbResult.mimeType,
    model: 'paper_banana',
    promptUsed: prompt,
    error: null,
    qualityScore: score,
    qualityStatus,
    imageEngine: 'paper_banana',
  }
}
