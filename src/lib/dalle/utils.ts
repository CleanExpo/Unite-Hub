/**
 * DALL-E Utility Functions
 *
 * Helper functions for image processing, validation, and analytics
 */

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Format image size display
 */
export function formatImageSize(size: string): string {
  const sizeMap: Record<string, string> = {
    "1024x1024": "1:1 Square (1024×1024)",
    "1792x1024": "16:9 Landscape (1792×1024)",
    "1024x1792": "9:16 Portrait (1024×1792)",
  };
  return sizeMap[size] || size;
}

/**
 * Format cost display
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Calculate estimated time for batch generation
 */
export function estimateGenerationTime(count: number): number {
  // DALL-E 3 typically takes 10-30 seconds per image
  const averageTimePerImage = 20; // seconds
  return count * averageTimePerImage;
}

/**
 * Format time in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
return `${seconds}s`;
}
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get image dimensions from size string
 */
export function parseDimensions(size: string): { width: number; height: number } {
  const [width, height] = size.split("x").map(Number);
  return { width, height };
}

/**
 * Get recommended size for platform
 */
export function getRecommendedSize(
  platform: string
): "1024x1024" | "1792x1024" | "1024x1792" {
  const platformSizes: Record<string, "1024x1024" | "1792x1024" | "1024x1792"> = {
    facebook: "1024x1024",
    instagram: "1024x1024",
    tiktok: "1024x1792",
    linkedin: "1024x1024",
    general: "1024x1024",
  };
  return platformSizes[platform.toLowerCase()] || "1024x1024";
}

/**
 * Sanitize prompt for display
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/[^\w\s.,!?-]/g, "")
    .trim()
    .substring(0, 200);
}

/**
 * Extract keywords from prompt
 */
export function extractPromptKeywords(prompt: string): string[] {
  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  // Remove duplicates and return top 10
  return Array.from(new Set(words)).slice(0, 10);
}

/**
 * Check if prompt is suitable for concept type
 */
export function validatePromptForConceptType(
  prompt: string,
  conceptType: string
): { valid: boolean; reason?: string } {
  const typeKeywords: Record<string, string[]> = {
    social_post: ["social", "post", "feed", "engaging"],
    product_mockup: ["product", "mockup", "showcase", "display"],
    marketing_visual: ["marketing", "promotional", "advertisement"],
    ad_creative: ["ad", "advertisement", "campaign", "promotion"],
    brand_concept: ["brand", "identity", "logo", "concept"],
  };

  const keywords = typeKeywords[conceptType] || [];
  const promptLower = prompt.toLowerCase();

  // Check if prompt contains at least one relevant keyword
  const hasRelevantKeyword = keywords.some((keyword) =>
    promptLower.includes(keyword)
  );

  if (!hasRelevantKeyword && keywords.length > 0) {
    return {
      valid: false,
      reason: `Prompt should include terms related to ${conceptType}`,
    };
  }

  return { valid: true };
}

/**
 * Generate variation prompt suffix
 */
export function getVariationSuffix(index: number): string {
  const suffixes = [
    "",
    "alternative composition",
    "different perspective",
    "unique angle",
    "creative interpretation",
    "innovative approach",
  ];
  return suffixes[index] || `variation ${index}`;
}

/**
 * Calculate optimal variation count based on tier
 */
export function getOptimalVariationCount(
  tier: "starter" | "professional",
  requested?: number
): number {
  const maxByTier = {
    starter: 3,
    professional: 5,
  };

  const max = maxByTier[tier];

  if (requested && requested > 0) {
    return Math.min(requested, max);
  }

  return max;
}

/**
 * Format platform name for display
 */
export function formatPlatformName(platform: string): string {
  const platformNames: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    general: "General",
  };
  return platformNames[platform.toLowerCase()] || platform;
}

/**
 * Format concept type for display
 */
export function formatConceptType(conceptType: string): string {
  const typeNames: Record<string, string> = {
    social_post: "Social Media Post",
    product_mockup: "Product Mockup",
    marketing_visual: "Marketing Visual",
    ad_creative: "Ad Creative",
    brand_concept: "Brand Concept",
  };
  return typeNames[conceptType] || conceptType;
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const parts = pathname.split(".");
    return parts[parts.length - 1].toLowerCase();
  } catch {
    return "png"; // Default
  }
}

/**
 * Generate download filename
 */
export function generateDownloadFilename(
  conceptType: string,
  platform: string,
  index: number
): string {
  const timestamp = Date.now();
  const formattedType = conceptType.replace(/_/g, "-");
  return `${formattedType}-${platform}-${index + 1}-${timestamp}.png`;
}

/**
 * Estimate storage size (rough approximation)
 */
export function estimateStorageSize(width: number, height: number): number {
  // PNG images are typically 3-5 bytes per pixel
  const bytesPerPixel = 4;
  const bytes = width * height * bytesPerPixel;
  return Math.round(bytes / 1024); // Return in KB
}

/**
 * Check if usage limit will be exceeded
 */
export function willExceedLimit(
  current: number,
  limit: number,
  requested: number
): boolean {
  return current + requested > limit;
}

/**
 * Calculate remaining usage
 */
export function calculateRemaining(current: number, limit: number): number {
  return Math.max(0, limit - current);
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === 0) {
return 0;
}
  return Math.round((current / limit) * 100);
}
