"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { PdfBrandingTemplate } from "@/types/pdf-branding"

interface PDFBrandingFormProps {
  initialData: PdfBrandingTemplate
  onSave: (template: PdfBrandingTemplate) => Promise<void>
  onDelete?: (templateId: string) => Promise<void>
}

export function PDFBrandingForm({ initialData, onSave, onDelete }: PDFBrandingFormProps) {
  const [template, setTemplate] = useState<PdfBrandingTemplate>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleChange = (section: keyof PdfBrandingTemplate, field: string, value: any) => {
    setTemplate((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof PdfBrandingTemplate],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(template)
      toast({
        title: "Template saved",
        description: "Your branding template has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await onDelete(template.id)
        toast({
          title: "Template deleted",
          description: "Your template has been deleted successfully.",
        })
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "There was an error deleting your template. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Information</CardTitle>
        <CardDescription>Basic information about your template</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-description">Description</Label>
          <Textarea
            id="template-description"
            value={template.description}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="primary-color"
              type="color"
              value={template.colors.primary}
              onChange={(e) => handleChange("colors", "primary", e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              value={template.colors.primary}
              onChange={(e) => handleChange("colors", "primary", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input
            id="company-name"
            value={template.companyInfo.name}
            onChange={(e) => handleChange("companyInfo", "name", e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onDelete && (
          <Button variant="destructive" onClick={handleDelete}>
            Delete Template
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Template"}
        </Button>
      </CardFooter>
    </Card>
  )
}
