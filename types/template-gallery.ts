export interface TemplateCategory {
  id: string
  name: string
}

export interface GalleryTemplate {
  id: string
  name: string
  description: string
  previewUrl: string
  category: string
  tags: string[]
  isPremium: boolean
  isNew: boolean
}

export interface TemplateFilter {
  categories: string[]
  tags: string[]
  searchQuery: string
  showPremiumOnly: boolean
  showNewOnly: boolean
}

export interface TemplateGalleryProps {
  templates: GalleryTemplate[]
  categories: TemplateCategory[]
  onImport: (templateId: string) => Promise<void>
}
