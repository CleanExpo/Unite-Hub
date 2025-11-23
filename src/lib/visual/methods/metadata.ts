/**
 * Method Metadata
 * Phase 69: Structured metadata for visual methods
 */

import { MethodCategoryId } from './categories';

export type ChannelId =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'youtube_shorts'
  | 'twitter'
  | 'pinterest'
  | 'reddit'
  | 'snapchat'
  | 'threads'
  | 'whatsapp'
  | 'google_business'
  | 'email'
  | 'web'
  | 'print'
  | 'podcast'
  | 'display_ads';

export type ComplexityLevel = 1 | 2 | 3 | 4 | 5;

export type BrandPersonality =
  | 'professional'
  | 'friendly'
  | 'playful'
  | 'bold'
  | 'elegant'
  | 'minimal'
  | 'creative'
  | 'technical'
  | 'warm'
  | 'edgy';

export type IndustryTag =
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'retail'
  | 'food_beverage'
  | 'real_estate'
  | 'education'
  | 'entertainment'
  | 'fashion'
  | 'automotive'
  | 'travel'
  | 'fitness'
  | 'beauty'
  | 'b2b'
  | 'b2c'
  | 'nonprofit'
  | 'government'
  | 'construction'
  | 'manufacturing'
  | 'professional_services';

export type ModelRecommendation =
  | 'nano_banana'
  | 'dalle'
  | 'gemini'
  | 'veo3'
  | 'perplexity'
  | 'jina'
  | 'elevenlabs'
  | 'midjourney'
  | 'stable_diffusion'
  | 'runway';

export interface MethodMetadata {
  id: string;
  name: string;
  description: string;
  category: MethodCategoryId;
  primary_channel: ChannelId;
  supported_channels: ChannelId[];
  motion_support: boolean;
  complexity: ComplexityLevel;
  brand_personalities: BrandPersonality[];
  industries: IndustryTag[];
  recommended_models: ModelRecommendation[];
  estimated_time_seconds: number;
  cost_tier: 'low' | 'medium' | 'high' | 'premium';
  requires_approval: boolean;
  outputs: string[];
  tags: string[];
}

// Helper to create metadata with defaults
export function createMethodMetadata(
  partial: Partial<MethodMetadata> & {
    id: string;
    name: string;
    description: string;
    category: MethodCategoryId;
  }
): MethodMetadata {
  return {
    primary_channel: 'web',
    supported_channels: ['web'],
    motion_support: false,
    complexity: 2,
    brand_personalities: ['professional'],
    industries: ['b2b', 'b2c'],
    recommended_models: ['dalle', 'gemini'],
    estimated_time_seconds: 30,
    cost_tier: 'medium',
    requires_approval: false,
    outputs: ['image'],
    tags: [],
    ...partial,
  };
}

// Metadata registry
export const METHOD_METADATA_REGISTRY: Map<string, MethodMetadata> = new Map();

export function registerMethod(metadata: MethodMetadata): void {
  METHOD_METADATA_REGISTRY.set(metadata.id, metadata);
}

export function getMethodMetadata(id: string): MethodMetadata | undefined {
  return METHOD_METADATA_REGISTRY.get(id);
}

export function getAllMethodMetadata(): MethodMetadata[] {
  return Array.from(METHOD_METADATA_REGISTRY.values());
}

export function getMethodsByCategory(category: MethodCategoryId): MethodMetadata[] {
  return getAllMethodMetadata().filter(m => m.category === category);
}

export function getMethodsByChannel(channel: ChannelId): MethodMetadata[] {
  return getAllMethodMetadata().filter(
    m => m.primary_channel === channel || m.supported_channels.includes(channel)
  );
}

export function getMethodsByIndustry(industry: IndustryTag): MethodMetadata[] {
  return getAllMethodMetadata().filter(m => m.industries.includes(industry));
}

export function getMethodsByPersonality(personality: BrandPersonality): MethodMetadata[] {
  return getAllMethodMetadata().filter(m => m.brand_personalities.includes(personality));
}

export function getMethodsWithMotion(): MethodMetadata[] {
  return getAllMethodMetadata().filter(m => m.motion_support);
}

export function getMethodsByComplexity(max: ComplexityLevel): MethodMetadata[] {
  return getAllMethodMetadata().filter(m => m.complexity <= max);
}

export default {
  createMethodMetadata,
  registerMethod,
  getMethodMetadata,
  getAllMethodMetadata,
  METHOD_METADATA_REGISTRY,
};
