/**
 * DALL-E Prompt Engineering Helpers
 *
 * Constructs optimized prompts for DALL-E 3 based on:
 * - Client brand assets and colors
 * - Business description and industry
 * - Platform specifications (Facebook, Instagram, etc.)
 * - Marketing concept type
 */

import { StyleDefinition, getStyleDefinition } from "./styles";

export interface PromptContext {
  businessName: string;
  businessDescription: string;
  industry?: string;
  brandColors?: string[]; // Hex colors
  keywords?: string[];
  targetAudience?: string;
}

export interface PlatformSpecs {
  platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "general";
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
  style?: string;
}

export type ConceptType =
  | "social_post"
  | "product_mockup"
  | "marketing_visual"
  | "ad_creative"
  | "brand_concept";

/**
 * Main prompt engineering function
 */
export function engineerPrompt(
  conceptType: ConceptType,
  context: PromptContext,
  platformSpecs: PlatformSpecs,
  customInstructions?: string
): string {
  const style = getStyleDefinition(platformSpecs.style || "modern");

  let prompt = buildBasePrompt(conceptType, context, style);
  prompt = addBrandElements(prompt, context);
  prompt = addPlatformOptimizations(prompt, platformSpecs);

  if (customInstructions) {
    prompt += ` ${customInstructions}`;
  }

  // Add quality and style modifiers
  prompt = finalizePrompt(prompt, style);

  return prompt;
}

/**
 * Build base prompt structure
 */
function buildBasePrompt(
  conceptType: ConceptType,
  context: PromptContext,
  style: StyleDefinition
): string {
  const { businessName, businessDescription, targetAudience } = context;

  const conceptTemplates: Record<ConceptType, string> = {
    social_post: `Create an engaging social media post image for ${businessName}. ${businessDescription}. The image should grab attention and encourage engagement.`,

    product_mockup: `Design a professional product mockup for ${businessName}. ${businessDescription}. Show the product in an appealing, realistic setting.`,

    marketing_visual: `Create a compelling marketing visual for ${businessName}. ${businessDescription}. The image should communicate value and attract ${targetAudience || "the target audience"}.`,

    ad_creative: `Design an attention-grabbing advertisement creative for ${businessName}. ${businessDescription}. The image should drive action and conversions.`,

    brand_concept: `Create a brand identity concept visual for ${businessName}. ${businessDescription}. The image should embody the brand essence and values.`,
  };

  return conceptTemplates[conceptType];
}

/**
 * Add brand-specific elements
 */
function addBrandElements(prompt: string, context: PromptContext): string {
  let enhancedPrompt = prompt;

  // Add brand colors
  if (context.brandColors && context.brandColors.length > 0) {
    const colorDescriptions = context.brandColors.map(hexToColorName).join(", ");
    enhancedPrompt += ` Use brand colors: ${colorDescriptions}.`;
  }

  // Add industry context
  if (context.industry) {
    enhancedPrompt += ` Industry: ${context.industry}.`;
  }

  // Add keywords
  if (context.keywords && context.keywords.length > 0) {
    enhancedPrompt += ` Emphasize: ${context.keywords.join(", ")}.`;
  }

  return enhancedPrompt;
}

/**
 * Add platform-specific optimizations
 */
function addPlatformOptimizations(prompt: string, specs: PlatformSpecs): string {
  const platformGuidelines: Record<typeof specs.platform, string> = {
    facebook: "Optimize for Facebook feed with eye-catching visuals that work well with text overlay. Include diverse elements that appeal to broad audiences.",

    instagram: "Create an Instagram-optimized image with high aesthetic appeal. Focus on visual storytelling, trendy aesthetics, and scroll-stopping imagery.",

    tiktok: "Design for TikTok with bold, dynamic visuals. Use vibrant colors and elements that capture Gen Z attention. Think creative and authentic.",

    linkedin: "Professional LinkedIn style. Clean, corporate-friendly design with sophisticated color palette. Focus on credibility and expertise.",

    general: "Create versatile imagery suitable for multiple platforms. Balanced composition with broad appeal.",
  };

  let enhancedPrompt = `${prompt} ${platformGuidelines[specs.platform]}`;

  // Add aspect ratio guidance
  if (specs.aspectRatio) {
    const ratioGuidance: Record<string, string> = {
      "1:1": "Square composition, centered focal point",
      "4:5": "Portrait orientation, vertical emphasis",
      "9:16": "Vertical story format, mobile-optimized layout",
      "16:9": "Landscape format, cinematic composition",
    };
    enhancedPrompt += ` ${ratioGuidance[specs.aspectRatio]}.`;
  }

  return enhancedPrompt;
}

/**
 * Finalize prompt with quality and style modifiers
 */
function finalizePrompt(prompt: string, style: StyleDefinition): string {
  let finalPrompt = prompt;

  // Add style characteristics
  finalPrompt += ` Style: ${style.characteristics.join(", ")}.`;

  // Add quality modifiers
  finalPrompt += " High quality, professional, detailed, marketing-ready.";

  // Add technical specifications
  finalPrompt += " Clean composition, balanced lighting, no text or watermarks.";

  return finalPrompt;
}

/**
 * Convert hex color to approximate color name
 */
function hexToColorName(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Simple color mapping
  if (r > 200 && g < 100 && b < 100) {
return "vibrant red";
}
  if (r < 100 && g > 200 && b < 100) {
return "vibrant green";
}
  if (r < 100 && g < 100 && b > 200) {
return "vibrant blue";
}
  if (r > 200 && g > 200 && b < 100) {
return "golden yellow";
}
  if (r > 200 && g < 100 && b > 200) {
return "magenta";
}
  if (r < 100 && g > 200 && b > 200) {
return "cyan";
}
  if (r > 200 && g > 150 && b < 100) {
return "orange";
}
  if (r > 150 && g < 100 && b > 150) {
return "purple";
}
  if (r < 80 && g < 80 && b < 80) {
return "dark charcoal";
}
  if (r > 220 && g > 220 && b > 220) {
return "clean white";
}
  if (r > 150 && g > 150 && b > 150) {
return "neutral gray";
}

  return `#${hex}`;
}

/**
 * Generate prompt variations for multiple image generation
 */
export function generatePromptVariations(
  basePrompt: string,
  count: number
): string[] {
  const variations = [basePrompt];

  const styleVariations = [
    "with dramatic lighting",
    "with soft, natural lighting",
    "with bold, vibrant colors",
    "with minimalist approach",
    "with dynamic composition",
    "with symmetrical balance",
    "with creative perspective",
  ];

  for (let i = 1; i < count && i < styleVariations.length + 1; i++) {
    variations.push(`${basePrompt} ${styleVariations[i - 1]}`);
  }

  return variations.slice(0, count);
}

/**
 * Extract keywords from business description
 */
export function extractKeywords(description: string): string[] {
  // Remove common words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "should",
  ]);

  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Return unique words, limited to top 5
  return Array.from(new Set(words)).slice(0, 5);
}
