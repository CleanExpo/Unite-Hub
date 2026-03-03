import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ImageGenerationConfig,
  IconGenerationConfig,
  GeneratedImage,
  GeneratedIcon,
  GenerationOptions,
} from './types';

/* ----------------------------------------
   Gemini Client Configuration
   ---------------------------------------- */
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    '[ImageGeneration] GOOGLE_GENERATIVE_AI_API_KEY not set. Image generation will not work.'
  );
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/* ----------------------------------------
   Helper Functions
   ---------------------------------------- */
function generateId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function buildImagePrompt(config: ImageGenerationConfig): string {
  const colorPalette = config.brandColors.join(', ');

  let prompt = config.prompt;

  prompt += `\n\nStyle requirements:
- Visual style: ${config.style}
- Color palette: ${colorPalette}
- Context: ${config.context}
- Category: ${config.category}`;

  if (config.negativePrompt) {
    prompt += `\n\nAvoid: ${config.negativePrompt}`;
  }

  prompt += `\n\nThe image should be high quality, professional, and suitable for a modern web application.`;

  return prompt;
}

function buildIconPrompt(config: IconGenerationConfig): string {
  let prompt = `Create a ${config.style} icon: ${config.description}

Icon specifications:
- Style: ${config.style}
- Size: ${config.size}x${config.size} pixels
- Primary color: ${config.primaryColor}`;

  if (config.secondaryColor) {
    prompt += `\n- Secondary color: ${config.secondaryColor}`;
  }

  if (config.background && config.background !== 'transparent') {
    prompt += `\n- Background: ${config.background} shape`;
  }

  prompt += `\n\nThe icon should be:
- Clean and simple
- Easily recognizable at small sizes
- Consistent with modern design systems
- Suitable for both light and dark backgrounds`;

  return prompt;
}

/* ----------------------------------------
   Image Generation
   ---------------------------------------- */
export async function generateImage(
  config: ImageGenerationConfig,
  _options: GenerationOptions = {}
): Promise<GeneratedImage> {
  if (!genAI) {
    throw new Error(
      'Gemini API not configured. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable.'
    );
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const prompt = buildImagePrompt(config);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        // Note: Actual image generation config depends on API version
        // This is a placeholder structure
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    const text = response.text();

    // For now, return a placeholder since actual image generation
    // depends on the specific Gemini API version being used
    const generatedImage: GeneratedImage = {
      id: generateId(),
      data: '', // Would contain base64 image data
      mimeType: 'image/png',
      altText: `${config.style} image for ${config.context}`,
      thinking: text,
      config,
      createdAt: new Date(),
    };

    return generatedImage;
  } catch (error) {
    console.error('[ImageGeneration] Error generating image:', error);
    throw error;
  }
}

/* ----------------------------------------
   Icon Generation
   ---------------------------------------- */
export async function generateIcon(
  config: IconGenerationConfig,
  _options: GenerationOptions = {}
): Promise<GeneratedIcon> {
  if (!genAI) {
    throw new Error(
      'Gemini API not configured. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable.'
    );
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const prompt = buildIconPrompt(config);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    const text = response.text();

    // Parse SVG from response if available
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);

    const generatedIcon: GeneratedIcon = {
      id: generateId(),
      content: svgMatch ? svgMatch[0] : '',
      format: svgMatch ? 'svg' : 'png',
      name: config.description.toLowerCase().replace(/\s+/g, '-'),
      config,
      createdAt: new Date(),
    };

    return generatedIcon;
  } catch (error) {
    console.error('[ImageGeneration] Error generating icon:', error);
    throw error;
  }
}

/* ----------------------------------------
   Batch Generation
   ---------------------------------------- */
export async function generateBatch(
  configs: ImageGenerationConfig[],
  options: GenerationOptions = {}
): Promise<GeneratedImage[]> {
  const results = await Promise.allSettled(configs.map((config) => generateImage(config, options)));

  return results
    .filter(
      (result): result is PromiseFulfilledResult<GeneratedImage> => result.status === 'fulfilled'
    )
    .map((result) => result.value);
}

/* ----------------------------------------
   Alt Text Generation
   ---------------------------------------- */
export async function generateAltText(imageDescription: string, context: string): Promise<string> {
  if (!genAI) {
    return `Image: ${imageDescription}`;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const prompt = `Generate a concise, accessible alt text for an image.

Image description: ${imageDescription}
Context: ${context}

Requirements:
- Be descriptive but concise (under 125 characters)
- Focus on the key visual elements
- Make it useful for screen reader users
- Do not start with "Image of" or "Picture of"

Alt text:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('[ImageGeneration] Error generating alt text:', error);
    return `Image: ${imageDescription}`;
  }
}

/* ----------------------------------------
   Image Variation
   ---------------------------------------- */
export async function generateVariation(
  originalConfig: ImageGenerationConfig,
  variationType: 'color' | 'style' | 'composition'
): Promise<GeneratedImage> {
  const modifiedConfig = { ...originalConfig };

  switch (variationType) {
    case 'color':
      modifiedConfig.prompt = `${originalConfig.prompt}\n\nCreate a variation with different color emphasis while maintaining the same composition.`;
      break;
    case 'style':
      modifiedConfig.prompt = `${originalConfig.prompt}\n\nCreate a variation with a slightly different artistic style while maintaining the same subject.`;
      break;
    case 'composition':
      modifiedConfig.prompt = `${originalConfig.prompt}\n\nCreate a variation with a different composition or angle while maintaining the same subject and style.`;
      break;
  }

  return generateImage(modifiedConfig);
}

/* ----------------------------------------
   Check API Status
   ---------------------------------------- */
export function isConfigured(): boolean {
  return !!genAI;
}

export function getAPIStatus(): {
  configured: boolean;
  message: string;
} {
  if (!GEMINI_API_KEY) {
    return {
      configured: false,
      message: 'GOOGLE_GENERATIVE_AI_API_KEY environment variable not set',
    };
  }

  return {
    configured: true,
    message: 'Gemini API configured and ready',
  };
}
