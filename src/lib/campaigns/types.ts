// src/lib/campaigns/types.ts
// Core types for the Synthex Campaign Engine — Pomelli-class marketing automation.
// Handles brand DNA extraction, campaign generation, and multi-platform asset creation.

import type { SocialPlatform } from '@/lib/integrations/social/types'

// ─── Brand DNA ──────────────────────────────────────────────────────────────

export interface BrandColours {
  primary: string
  secondary: string
  accent: string
  neutrals: string[]
}

export interface BrandFonts {
  heading: string
  body: string
  accent: string | null
}

export interface BrandDNA {
  clientName: string
  websiteUrl: string
  logoUrl: string | null
  colours: BrandColours
  fonts: BrandFonts
  toneOfVoice: string
  brandValues: string[]
  tagline: string | null
  targetAudience: string
  industry: string
  imageryStyle: string
  referenceImages: string[]
}

// ─── Brand Profile (DB row mapped) ──────────────────────────────────────────

export interface BrandProfile {
  id: string
  founderId: string
  businessKey: string | null
  clientName: string
  websiteUrl: string
  logoUrl: string | null
  colours: BrandColours
  fonts: BrandFonts
  toneOfVoice: string | null
  brandValues: string[]
  tagline: string | null
  targetAudience: string | null
  industry: string | null
  imageryStyle: string | null
  referenceImages: string[]
  rawScrape: Record<string, unknown>
  status: 'scanning' | 'ready' | 'failed'
  scanError: string | null
  createdAt: string
  updatedAt: string
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export type CampaignObjective = 'awareness' | 'engagement' | 'conversion' | 'retention'
export type CampaignStatus = 'draft' | 'generating' | 'ready' | 'published'
export type AssetStatus = 'pending_image' | 'generating_image' | 'ready' | 'review' | 'published'

// ─── PaperBanana Dual-Engine Types ─────────────────────────────────────────

export type VisualType = 'photo' | 'infographic' | 'diagram' | 'data_viz' | 'process_flow'
export type QualityStatus = 'approved' | 'review' | 'rejected'
export type ImageEngine = 'gemini' | 'paper_banana'

export const VISUAL_TYPES = ['photo', 'infographic', 'diagram', 'data_viz', 'process_flow'] as const

export interface Campaign {
  id: string
  founderId: string
  brandProfileId: string
  theme: string
  objective: CampaignObjective
  platforms: SocialPlatform[]
  postCount: number
  dateRangeStart: string | null
  dateRangeEnd: string | null
  status: CampaignStatus
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CampaignAsset {
  id: string
  campaignId: string
  founderId: string
  platform: SocialPlatform
  copy: string
  headline: string | null
  cta: string | null
  hashtags: string[]
  imageUrl: string | null
  imagePrompt: string
  width: number
  height: number
  variant: number
  socialPostId: string | null
  status: AssetStatus
  visualType: VisualType
  imageEngine: ImageEngine | null
  qualityScore: number | null
  qualityStatus: QualityStatus | null
  createdAt: string
  updatedAt: string
}

// ─── Platform Dimensions ────────────────────────────────────────────────────

export interface PlatformDimension {
  width: number
  height: number
  label: string
  aspectRatio: string
}

export const PLATFORM_DIMENSIONS: Record<SocialPlatform, PlatformDimension> = {
  instagram: { width: 1080, height: 1350, label: '4:5 Portrait',    aspectRatio: '4:5'  },
  facebook:  { width: 1200, height: 630,  label: '1.9:1 Landscape', aspectRatio: '1.9:1' },
  linkedin:  { width: 1200, height: 1200, label: '1:1 Square',      aspectRatio: '1:1'  },
  tiktok:    { width: 1080, height: 1920, label: '9:16 Vertical',   aspectRatio: '9:16' },
  youtube:   { width: 1280, height: 720,  label: '16:9 Landscape',  aspectRatio: '16:9' },
}

// ─── Generation Requests ─────────────────────────────────────────────────────

export interface ScanRequest {
  websiteUrl: string
  clientName: string
  businessKey?: string
}

export interface CreateCampaignRequest {
  brandProfileId: string
  theme: string
  objective: CampaignObjective
  platforms: SocialPlatform[]
  postCount?: number
  dateRangeStart?: string
  dateRangeEnd?: string
}

export interface CampaignCopyResult {
  platform: SocialPlatform
  copy: string
  headline: string | null
  cta: string | null
  hashtags: string[]
  imagePrompt: string
  visualType: VisualType
  variant: number
}

// ─── Apify Scrape Result ─────────────────────────────────────────────────────

export interface ApifyScrapeResult {
  url: string
  html: string
  text: string
  title: string | null
  description: string | null
  screenshotUrl: string | null
  cssColours: string[]
  fontFamilies: string[]
  imageUrls: string[]
  metadata: Record<string, unknown>
}
