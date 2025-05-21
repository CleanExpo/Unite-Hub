"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TemplateGallery } from "@/components/template-gallery/template-gallery"
import type { GalleryTemplate } from "@/types/template-gallery"

export default function TemplateGalleryPage() {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)

  const handleImportTemplate = async (template: GalleryTemplate) => {
    setIsImporting(true)
    try {
      // In a real app, you would save this template to your database
      // For demo, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // After successful import, redirect back to the branding page
      router.push("/dashboard/architecture/branding")
      return Promise.resolve()
    } catch (error) {
      console.error("Failed to import template:", error)
      return Promise.reject(error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Gallery</h1>
          <p className="text-gray-500">Browse and import pre-designed PDF templates</p>
        </div>
      </div>

      <TemplateGallery onImport={handleImportTemplate} />
    </div>
  )
}
