/**
 * Gemini Image Generation Service
 *
 * Uses Gemini 2.0 Flash for image generation with 5 Whys methodology
 *
 * THE STORY: Businesses struggling to get their brand message out.
 * THE SOLUTION: Synthex helps them be heard.
 * THE IMAGES: Real humans, real emotions, real stories.
 */

import { GoogleGenAI, Modality } from '@google/genai';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';

// 5 Whys mandate for all images
const HUMAN_STORY_MANDATE = `
CRITICAL REQUIREMENTS:
- NO TEXT, NO LABELS, NO WORDS, NO NUMBERS in the image
- HUMAN-CENTERED imagery - real people, real emotions
- NO robots, NO cold tech imagery, NO sci-fi elements
- Warm, genuine, relatable imagery
- Australian/global business context
`;

export interface ImageGenerationRequest {
  prompt: string;
  category: 'hero' | 'feature' | 'carousel' | 'case-study' | 'integration' | 'empty-state' | 'cta' | 'custom';
  fiveWhys?: {
    why1_image?: string;
    why2_style?: string;
    why3_situation?: string;
    why4_person?: string;
    why5_feeling?: string;
  };
  outputPath?: string;
  workspaceId?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imagePath?: string;
  imageData?: Buffer;
  mimeType?: string;
  sizeKB?: number;
  error?: string;
  cost?: number;
}

/**
 * Generate an image using Gemini 2.0 Flash
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  const { prompt, category, fiveWhys, outputPath, workspaceId } = request;

  // Validate API key
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY not configured'
    };
  }

  const startTime = Date.now();

  try {
    // Build the full prompt with 5 Whys context
    let fullPrompt = `Generate an image: ${prompt}`;

    if (fiveWhys) {
      fullPrompt += `\n\n5 WHYS CONTEXT:`;
      if (fiveWhys.why1_image) {
fullPrompt += `\n- Purpose: ${fiveWhys.why1_image}`;
}
      if (fiveWhys.why2_style) {
fullPrompt += `\n- Style: ${fiveWhys.why2_style}`;
}
      if (fiveWhys.why3_situation) {
fullPrompt += `\n- Situation: ${fiveWhys.why3_situation}`;
}
      if (fiveWhys.why4_person) {
fullPrompt += `\n- Person: ${fiveWhys.why4_person}`;
}
      if (fiveWhys.why5_feeling) {
fullPrompt += `\n- Feeling: ${fiveWhys.why5_feeling}`;
}
    }

    fullPrompt += HUMAN_STORY_MANDATE;

    // Generate the image
    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: fullPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const latency = Date.now() - startTime;

    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const imageData = Buffer.from(part.inlineData.data, 'base64');
          const mimeType = part.inlineData.mimeType || 'image/png';
          const sizeKB = Math.round(imageData.length / 1024);

          // Save to file if outputPath provided
          if (outputPath) {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(outputPath, imageData);
          }

          // Track usage
          await trackImageGeneration({
            workspaceId,
            category,
            sizeKB,
            latency,
            success: true
          });

          return {
            success: true,
            imagePath: outputPath,
            imageData,
            mimeType,
            sizeKB,
            cost: estimateCost(sizeKB)
          };
        }
      }
    }

    // No image generated
    await trackImageGeneration({
      workspaceId,
      category,
      sizeKB: 0,
      latency,
      success: false,
      errorMessage: 'No image in response'
    });

    return {
      success: false,
      error: 'No image generated in response'
    };

  } catch (error: any) {
    const latency = Date.now() - startTime;

    await trackImageGeneration({
      workspaceId,
      category,
      sizeKB: 0,
      latency,
      success: false,
      errorMessage: error.message
    });

    console.error('Image generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate multiple images in batch
 */
export async function generateImageBatch(
  requests: ImageGenerationRequest[],
  delayMs: number = 3000
): Promise<ImageGenerationResult[]> {
  const results: ImageGenerationResult[] = [];

  for (let i = 0; i < requests.length; i++) {
    console.log(`[${i + 1}/${requests.length}] Generating: ${requests[i].category}`);

    const result = await generateImage(requests[i]);
    results.push(result);

    // Rate limiting between requests
    if (i < requests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Pre-defined image templates following 5 Whys methodology
 */
export const IMAGE_TEMPLATES = {
  heroTrades: {
    category: 'hero' as const,
    fiveWhys: {
      why1_image: 'Show a tradesperson who has escaped the paperwork nightmare',
      why2_style: 'Photorealistic - trades people trust authentic imagery',
      why3_situation: 'On a job site but confident, phone in hand, work flowing smoothly',
      why4_person: 'Australian tradie, 35-50, weathered hands but modern approach',
      why5_feeling: 'Relief and control - finally on top of the business side',
    },
    prompt: `Photorealistic image of a confident Australian tradesperson, mid-40s,
standing on a construction site during golden hour. They're holding a smartphone
casually, looking satisfied and in control. Work boots, high-vis vest, but clean
and professional. Warm natural lighting, shallow depth of field.`
  },

  heroProfessional: {
    category: 'hero' as const,
    fiveWhys: {
      why1_image: 'Show agency owner who has time for creativity again',
      why2_style: 'Modern lifestyle photography - agencies value aesthetics',
      why3_situation: 'In a beautiful office space, relaxed but productive',
      why4_person: 'Creative professional, diverse, stylish but approachable',
      why5_feeling: 'Creative freedom - automation handles the busywork',
    },
    prompt: `Modern lifestyle photograph of a creative agency owner in their 30s,
sitting in a bright, plant-filled office space. They're leaning back in their
chair with a genuine smile. Coffee cup nearby. Natural light streaming in.`
  },

  featureSuccess: {
    category: 'feature' as const,
    fiveWhys: {
      why1_image: 'Show measurable business growth',
      why2_style: 'Documentary photography - authentic success',
      why3_situation: 'Business that has visibly grown',
      why4_person: 'Owner looking at their expanded business',
      why5_feeling: 'Pride - we built this',
    },
    prompt: `Documentary photograph of a retail store owner standing at the doorway
of their newly expanded shop, arms proudly crossed. Behind them, a busy store
with happy customers. Australian main street setting. Golden hour light.`
  },

  emptyStateOpportunity: {
    category: 'empty-state' as const,
    fiveWhys: {
      why1_image: 'Make no data feel like potential not failure',
      why2_style: 'Optimistic illustration - story about to be written',
      why3_situation: 'Artist canvas before the masterpiece',
      why4_person: 'Someone about to create something beautiful',
      why5_feeling: 'Potential - your story starts here',
    },
    prompt: `Optimistic illustration of an artist easel with a blank canvas,
surrounded by beautiful paint colors ready to be used. Soft morning light.
The blank canvas feels full of potential, not empty.`
  }
};

/**
 * Estimate cost for image generation
 * Gemini 2.0 Flash is approximately $0.0001-0.0005 per image
 */
function estimateCost(sizeKB: number): number {
  return 0.0002 + (sizeKB * 0.000001);
}

/**
 * Track image generation usage
 */
async function trackImageGeneration(data: {
  workspaceId?: string;
  category: string;
  sizeKB: number;
  latency: number;
  success: boolean;
  errorMessage?: string;
}) {
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from('ai_usage_logs').insert({
      provider: 'google_gemini',
      model: IMAGE_MODEL,
      workspace_id: data.workspaceId,
      tokens_input: 0,
      tokens_output: 0,
      cost_usd: data.success ? estimateCost(data.sizeKB) : 0,
      latency_ms: data.latency,
      success: data.success,
      error_message: data.errorMessage,
      metadata: {
        type: 'image_generation',
        category: data.category,
        size_kb: data.sizeKB
      },
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track image generation:', error);
  }
}

export default {
  generateImage,
  generateImageBatch,
  IMAGE_TEMPLATES
};
