import type { PDFBrandingSettings } from "./pdf-branding"

export type TemplateCategory =
  | "all"
  | "featured"
  | "business"
  | "technical"
  | "creative"
  | "minimal"
  | "modern"
  | "classic"
  | "bold"

export interface GalleryTemplate extends PDFBrandingSettings {
  description: string
  thumbnailUrl: string
  previewUrl: string
  category: TemplateCategory[]
  tags: string[]
  popularity: number
  author: string
  authorUrl?: string
  isPremium: boolean
}

export interface TemplateGalleryState {
  searchQuery: string
  selectedCategory: TemplateCategory
  sortBy: "popular" | "newest" | "name"
  filterPremium: boolean
}
