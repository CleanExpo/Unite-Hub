"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Trash2 } from "lucide-react"
import type { PDFBrandingSettings, PDFBrandingFormData } from "@/types/pdf-branding"

interface PDFBrandingFormProps {
  initialData?: PDFBrandingSettings
  onSave: (data: PDFBrandingFormData) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function PDFBrandingForm({ initialData, onSave, onDelete }: PDFBrandingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const defaultValues: PDFBrandingFormData = {
    name: "",
    isDefault: false,
    primaryColor: "#2c3e50",
    secondaryColor: "#3498db",
    accentColor: "#e74c3c",
    fontFamily: "helvetica",
    headerTitle: "Architecture Blueprint",
    footerText: "Confidential & Proprietary",
    includeTimestamp: true,
    includePageNumbers: true,
    includeCoverPage: true,
    templateStyle: "classic",
    companyName: "",
    contactInfo: "",
    watermark: "",
    logo: "",
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PDFBrandingFormData>({
    defaultValues: initialData || defaultValues,
  })

  const watchedValues = watch()

  const handleSave = async (data: PDFBrandingFormData) => {
    setIsSubmitting(true)
    try {
      await onSave(data)
    } catch (error) {
      console.error("Failed to save template:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id) return

    if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      setIsDeleting(true)
      try {
        await onDelete?.(initialData.id)
      } catch (error) {
        console.error("Failed to delete template:", error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-8">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">{initialData ? `Edit ${initialData.name}` : "Create New Template"}</h2>
        {initialData && onDelete && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isSubmitting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Template
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="Enter template name"
                {...register("name", { required: "Template name is required" })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateStyle">Template Style</Label>
              <Select
                value={watchedValues.templateStyle}
                onValueChange={(value) => setValue("templateStyle", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={watchedValues.isDefault}
                onCheckedChange={(checked) => setValue("isDefault", checked)}
              />
              <Label htmlFor="isDefault">Set as default template</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input id="primaryColor" type="color" className="w-12 h-10 p-1" {...register("primaryColor")} />
                <Input
                  type="text"
                  value={watchedValues.primaryColor}
                  onChange={(e) => setValue("primaryColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input id="secondaryColor" type="color" className="w-12 h-10 p-1" {...register("secondaryColor")} />
                <Input
                  type="text"
                  value={watchedValues.secondaryColor}
                  onChange={(e) => setValue("secondaryColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input id="accentColor" type="color" className="w-12 h-10 p-1" {...register("accentColor")} />
                <Input
                  type="text"
                  value={watchedValues.accentColor}
                  onChange={(e) => setValue("accentColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select value={watchedValues.fontFamily} onValueChange={(value) => setValue("fontFamily", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helvetica">Helvetica</SelectItem>
                  <SelectItem value="times">Times New Roman</SelectItem>
                  <SelectItem value="courier">Courier</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" placeholder="https://example.com/logo.png" {...register("logo")} />
              <p className="text-xs text-muted-foreground">Enter a URL to your logo image (optional)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="watermark">Watermark Text</Label>
              <Input id="watermark" placeholder="CONFIDENTIAL" {...register("watermark")} />
              <p className="text-xs text-muted-foreground">Add a watermark to all pages (optional)</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="headerTitle">Header Title</Label>
              <Input id="headerTitle" placeholder="Architecture Blueprint" {...register("headerTitle")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Input id="footerText" placeholder="Confidential & Proprietary" {...register("footerText")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="Your Company Name" {...register("companyName")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Information</Label>
              <Textarea id="contactInfo" placeholder="Email, phone, website, etc." {...register("contactInfo")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="includeCoverPage"
                checked={watchedValues.includeCoverPage}
                onCheckedChange={(checked) => setValue("includeCoverPage", checked)}
              />
              <Label htmlFor="includeCoverPage">Include Cover Page</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="includeTimestamp"
                checked={watchedValues.includeTimestamp}
                onCheckedChange={(checked) => setValue("includeTimestamp", checked)}
              />
              <Label htmlFor="includeTimestamp">Include Timestamp</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="includePageNumbers"
                checked={watchedValues.includePageNumbers}
                onCheckedChange={(checked) => setValue("includePageNumbers", checked)}
              />
              <Label htmlFor="includePageNumbers">Include Page Numbers</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-[1/1.414] border rounded-md overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <p className="text-muted-foreground">Preview will be available soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Template"
          )}
        </Button>
      </div>
    </form>
  )
}
