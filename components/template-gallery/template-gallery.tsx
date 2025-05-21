"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TemplateCard } from "./template-card"
import { TemplatePreviewModal } from "./template-preview-modal"
import { Loader2, Search } from "lucide-react"
import type { GalleryTemplate, TemplateCategory, TemplateGalleryState } from "@/types/template-gallery"

interface TemplateGalleryProps {
  onImport: (template: GalleryTemplate) => Promise<void>
}

export function TemplateGallery({ onImport }: TemplateGalleryProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<GalleryTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<GalleryTemplate | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const [galleryState, setGalleryState] = useState<TemplateGalleryState>({
    searchQuery: "",
    selectedCategory: "all",
    sortBy: "popular",
    filterPremium: false,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      // In a real app, fetch from your API
      // For demo, we'll simulate a delay and use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data will be defined in the template-data.ts file
      const response = await fetch("/api/templates/gallery")
      const data = await response.json()

      setTemplates(data.templates)
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryChange = (category: TemplateCategory) => {
    setGalleryState((prev) => ({ ...prev, selectedCategory: category }))
  }

  const handleSortChange = (sortBy: "popular" | "newest" | "name") => {
    setGalleryState((prev) => ({ ...prev, sortBy }))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalleryState((prev) => ({ ...prev, searchQuery: e.target.value }))
  }

  const handlePremiumFilterChange = (checked: boolean) => {
    setGalleryState((prev) => ({ ...prev, filterPremium: checked }))
  }

  const handlePreview = (template: GalleryTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewOpen(true)
  }

  const handleImport = async (template: GalleryTemplate) => {
    setIsImporting(true)
    try {
      await onImport(template)
      setIsPreviewOpen(false)
      router.push("/dashboard/architecture/branding")
    } catch (error) {
      console.error("Failed to import template:", error)
    } finally {
      setIsImporting(false)
    }
  }

  // Filter and sort templates based on gallery state
  const filteredTemplates = templates
    .filter((template) => {
      // Filter by search query
      if (galleryState.searchQuery) {
        const query = galleryState.searchQuery.toLowerCase()
        if (
          !template.name.toLowerCase().includes(query) &&
          !template.description.toLowerCase().includes(query) &&
          !template.tags.some((tag) => tag.toLowerCase().includes(query))
        ) {
          return false
        }
      }

      // Filter by category
      if (galleryState.selectedCategory !== "all" && !template.category.includes(galleryState.selectedCategory)) {
        return false
      }

      // Filter premium templates
      if (galleryState.filterPremium && template.isPremium) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Sort templates
      switch (galleryState.sortBy) {
        case "popular":
          return b.popularity - a.popularity
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={galleryState.searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select value={galleryState.sortBy} onValueChange={(value) => handleSortChange(value as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch
              id="premium-filter"
              checked={galleryState.filterPremium}
              onCheckedChange={handlePremiumFilterChange}
            />
            <Label htmlFor="premium-filter">Hide Premium</Label>
          </div>
        </div>
      </div>

      <Tabs
        value={galleryState.selectedCategory}
        onValueChange={(value) => handleCategoryChange(value as TemplateCategory)}
      >
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="creative">Creative</TabsTrigger>
          <TabsTrigger value="minimal">Minimal</TabsTrigger>
          <TabsTrigger value="modern">Modern</TabsTrigger>
          <TabsTrigger value="classic">Classic</TabsTrigger>
          <TabsTrigger value="bold">Bold</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onPreview={() => handlePreview(template)} />
          ))}
        </div>
      )}

      {selectedTemplate && (
        <TemplatePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          template={selectedTemplate}
          onImport={handleImport}
          isImporting={isImporting}
        />
      )}
    </div>
  )
}
