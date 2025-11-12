/**
 * TypeScript Type Definitions for DALL-E Integration
 */

export type ConceptType =
  | "social_post"
  | "product_mockup"
  | "marketing_visual"
  | "ad_creative"
  | "brand_concept";

export type Platform = "facebook" | "instagram" | "tiktok" | "linkedin" | "general";

export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

export type ImageQuality = "standard" | "hd";

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export interface ImageGenerationRequest {
  clientId: string;
  conceptType: ConceptType;
  platform?: Platform;
  customPrompt?: string;
  style?: string;
  size?: ImageSize;
  quality?: ImageQuality;
  variationCount?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  images: GeneratedImage[];
  generated: number;
  requested: number;
  errors?: Array<{ variation: number; error: string }>;
  cost: number;
  prompt: string;
  style: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  revisedPrompt?: string;
}

export interface ImageConcept {
  _id: string;
  clientId: string;
  campaignId?: string;
  conceptType: ConceptType;
  platform?: Platform;
  prompt: string;
  imageUrl: string;
  thumbnailUrl?: string;
  dalleImageId?: string;
  style: string;
  colorPalette: string[];
  dimensions: {
    width: number;
    height: number;
  };
  alternativeConcepts: Array<{
    imageUrl: string;
    prompt: string;
  }>;
  usageRecommendations: string;
  technicalSpecs?: string;
  isUsed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BrandContext {
  businessName: string;
  businessDescription: string;
  industry?: string;
  brandColors?: string[];
  keywords?: string[];
  targetAudience?: string;
}

export interface UsageLimit {
  metricType: "images_generated";
  current: number;
  limit: number;
  remaining: number;
}

export interface CostTracking {
  orgId: string;
  service: "dalle";
  count: number;
  cost: number;
  timestamp: number;
}
