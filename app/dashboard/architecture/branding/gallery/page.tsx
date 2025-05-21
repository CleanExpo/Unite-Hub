"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TemplateGallery } from "@/components/template-gallery/template-gallery"
import type { GalleryTemplate } from "@/types/template-gallery"
import { useToast } from "@/hooks/use-toast"

export default function TemplateGalleryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)

  const handleImportTemplate = async (template: GalleryTemplate) => {
    setIsImporting(true)
    try {
      // In a real app, call your API to import the template
      // For demo, we'll simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message
      toast({
        title: "Template imported",
        description: `${template.name} has been added to your templates.`,
      })

      // Navigate back to the branding page
      router.push("/dashboard/architecture/branding")
    } catch (error) {
      console.error("Failed to import template:", error)
      toast({
        title: "Import failed",
        description: "There was an error importing the template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => router.push("/dashboard/architecture/branding")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Branding Settings
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Template Gallery</h1>
          <p className="text-muted-foreground">Browse and import professionally designed PDF templates</p>
        </div>
      </div>

      <TemplateGallery onImport={handleImportTemplate} />
    </div>
  )
}
