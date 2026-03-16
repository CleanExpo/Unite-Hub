// src/lib/campaigns/prompts/paper-banana-prompt.ts
// Converts BrandDNA + raw image prompt + VisualType into structured PaperBanana API input.

import type { BrandDNA, VisualType } from '@/lib/campaigns/types'
import type { SocialPlatform } from '@/lib/integrations/social/types'
import { PLATFORM_DIMENSIONS } from '@/lib/campaigns/types'

const VISUAL_TYPE_GUIDANCE: Record<Exclude<VisualType, 'photo'>, string> = {
  infographic:
    'Create a clear infographic layout with numbered sections, data callouts, bold statistics, and visual hierarchy. Use icons or small illustrations to represent key points. The layout should flow top-to-bottom with clear section dividers.',
  diagram:
    'Create a concept diagram with labelled nodes connected by directional arrows showing relationships. Use consistent node shapes (rounded rectangles for concepts, circles for decision points). Include a clear visual hierarchy with the main concept centred.',
  data_viz:
    'Create a professional data visualisation. Use appropriate chart type (bar, line, pie, or comparison). Include axis labels, legends, and data labels. Optimise the data-ink ratio — remove unnecessary grid lines and decorations. The data should be the focus.',
  process_flow:
    'Create a step-by-step process flow diagram. Use sequential numbered steps with milestone markers. Include brief labels at each step. Use arrows or connecting lines to show progression. The flow should read left-to-right or top-to-bottom.',
}

export function buildPaperBananaPrompt(
  rawImagePrompt: string,
  brand: BrandDNA,
  visualType: Exclude<VisualType, 'photo'>,
  platform: SocialPlatform,
  headline: string | null
): { prompt: string; style: Record<string, unknown> } {
  const dims = PLATFORM_DIMENSIONS[platform]
  const parts: string[] = []

  // Visual type guidance
  parts.push(VISUAL_TYPE_GUIDANCE[visualType])

  // User's raw concept
  parts.push(rawImagePrompt)

  // Platform aspect ratio note
  parts.push(
    `Output dimensions: ${dims.width}x${dims.height}px (${dims.aspectRatio} ${dims.label}).`
  )

  // Headline overlay
  if (headline) {
    parts.push(`Include the headline text: '${headline}' prominently.`)
  }

  const prompt = parts.join(' ')

  const style: Record<string, unknown> = {
    colours: {
      primary: brand.colours.primary,
      secondary: brand.colours.secondary,
      accent: brand.colours.accent,
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    fonts: {
      heading: brand.fonts.heading,
      body: brand.fonts.body,
    },
    dimensions: {
      width: dims.width,
      height: dims.height,
    },
    brand: brand.clientName,
  }

  return { prompt, style }
}
