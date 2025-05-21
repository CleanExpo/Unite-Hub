"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PDFBrandingForm } from "@/components/pdf-branding-form"
import { Settings2, Grid } from "lucide-react"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { PdfBrandingTemplate } from "@/types/pdf-branding"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Sample template data
const sampleTemplates: PdfBrandingTemplate[] = [
  {
    id: "template-1",
    name: "Default Template",
    description: "The default PDF template",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    colors: {
      primary: "#3b82f6",
      secondary: "#6b7280",
      accent: "#10b981",
      background: "#ffffff",
      text: "#1f2937",
    },
    fonts: {
      heading: "Helvetica",
      body: "Helvetica",
    },
    logo: {
      url: "/logo.png",
      width: 100,
      height: 50,
      position: "left",
    },
    header: {
      enabled: true,
      text: "Architecture Blueprint",
      includePageNumber: true,
      includeLogo: false,
    },
    footer: {
      enabled: true,
      text: "© 2023 Company Name",
      includePageNumber: true,
      includeTimestamp: true,
    },
    cover: {
      enabled: true,
      title: "Architecture Blueprint",
      subtitle: "Project Details",
      backgroundUrl: "",
      includeLogo: true,
    },
    watermark: {
      enabled: false,
      text: "CONFIDENTIAL",
      opacity: 0.1,
    },
    companyInfo: {
      name: "Company Name",
      address: "123 Main St, City, State, ZIP",
      phone: "(123) 456-7890",
      email: "info@company.com",
      website: "www.company.com",
    },
    layout: "classic",
  },
  {
    id: "template-2",
    name: "Modern Blue",
    description: "A modern template with blue accents",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    colors: {
      primary: "#2563eb",
      secondary: "#64748b",
      accent: "#06b6d4",
      background: "#ffffff",
      text: "#0f172a",
    },
    fonts: {
      heading: "Arial",
      body: "Arial",
    },
    logo: {
      url: "/logo.png",
      width: 100,
      height: 50,
      position: "center",
    },
    header: {
      enabled: true,
      text: "Architecture Blueprint",
      includePageNumber: true,
      includeLogo: true,
    },
    footer: {
      enabled: true,
      text: "© 2023 Company Name",
      includePageNumber: true,
      includeTimestamp: true,
    },
    cover: {
      enabled: true,
      title: "Architecture Blueprint",
      subtitle: "Project Details",
      backgroundUrl: "",
      includeLogo: true,
    },
    watermark: {
      enabled: false,
      text: "CONFIDENTIAL",
      opacity: 0.1,
    },
    companyInfo: {
      name: "Company Name",
      address: "123 Main St, City, State, ZIP",
      phone: "(123) 456-7890",
      email: "info@company.com",
      website: "www.company.com",
    },
    layout: "modern",
  },
]

export default function PdfBrandingPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<PdfBrandingTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<PdfBrandingTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [companyName, setCompanyName] = useState("Your Company")
  const [logoUrl, setLogoUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Simulate loading templates from API
    const loadTemplates = async () => {
      try {
        // In a real app, you would fetch from an API
        setTemplates(sampleTemplates)
      } catch (error) {
        console.error("Error loading templates:", error)
        toast({
          title: "Error loading templates",
          description: "There was an error loading your templates. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [toast])

  const handleSaveTemplate = async (template: PdfBrandingTemplate) => {
    try {
      // In a real app, you would save to an API
      if (isEditing) {
        // Update existing template
        setTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t)),
        )
      } else {
        // Add new template
        const newTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setTemplates((prev) => [...prev, newTemplate])
      }

      setIsEditing(false)
      setSelectedTemplate(null)

      toast({
        title: "Template saved",
        description: "Your template has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // In a real app, you would delete from an API
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))

      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting your template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSetDefaultTemplate = async (templateId: string) => {
    try {
      // In a real app, you would update in an API
      setTemplates((prev) =>
        prev.map((t) => ({
          ...t,
          isDefault: t.id === templateId,
          updatedAt: t.id === templateId ? new Date().toISOString() : t.updatedAt,
        })),
      )

      toast({
        title: "Default template set",
        description: "Your default template has been updated successfully.",
      })
    } catch (error) {
      console.error("Error setting default template:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your default template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate saving
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, you would save these settings to your database
    console.log("Saved settings:", { primaryColor, companyName, logoUrl })

    setIsSaving(false)
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    })
  }

  if (selectedTemplate) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Template" : "New Template"}</h1>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTemplate(null)
              setIsEditing(false)
            }}
          >
            Cancel
          </Button>
        </div>

        <PDFBrandingForm initialData={selectedTemplate} onSave={handleSaveTemplate} onDelete={handleDeleteTemplate} />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">PDF Branding Settings</h1>
          <p className="text-gray-500">Customize how your architecture blueprints look when exported as PDFs</p>
        </div>
        <div className="space-x-2">
          <Link
            href="/dashboard/architecture/branding/gallery"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <Grid className="mr-2 h-4 w-4" />
            Browse Gallery
          </Link>
          <Button
            onClick={() => {
              setSelectedTemplate({
                id: "",
                name: "",
                description: "",
                isDefault: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                colors: {
                  primary: "#3b82f6",
                  secondary: "#6b7280",
                  accent: "#10b981",
                  background: "#ffffff",
                  text: "#1f2937",
                },
                fonts: {
                  heading: "Helvetica",
                  body: "Helvetica",
                },
                logo: {
                  url: "/logo.png",
                  width: 100,
                  height: 50,
                  position: "left",
                },
                header: {
                  enabled: true,
                  text: "Architecture Blueprint",
                  includePageNumber: true,
                  includeLogo: false,
                },
                footer: {
                  enabled: true,
                  text: "© 2023 Company Name",
                  includePageNumber: true,
                  includeTimestamp: true,
                },
                cover: {
                  enabled: true,
                  title: "Architecture Blueprint",
                  subtitle: "Project Details",
                  backgroundUrl: "",
                  includeLogo: true,
                },
                watermark: {
                  enabled: false,
                  text: "CONFIDENTIAL",
                  opacity: 0.1,
                },
                companyInfo: {
                  name: "Company Name",
                  address: "123 Main St, City, State, ZIP",
                  phone: "(123) 456-7890",
                  email: "info@company.com",
                  website: "www.company.com",
                },
                layout: "classic",
              })
              setIsEditing(false)
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <Settings2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No templates yet</h3>
          <p className="mt-2 text-gray-500">Create your first PDF template to get started</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                setSelectedTemplate({
                  id: "",
                  name: "",
                  description: "",
                  isDefault: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  colors: {
                    primary: "#3b82f6",
                    secondary: "#6b7280",
                    accent: "#10b981",
                    background: "#ffffff",
                    text: "#1f2937",
                  },
                  fonts: {
                    heading: "Helvetica",
                    body: "Helvetica",
                  },
                  logo: {
                    url: "/logo.png",
                    width: 100,
                    height: 50,
                    position: "left",
                  },
                  header: {
                    enabled: true,
                    text: "Architecture Blueprint",
                    includePageNumber: true,
                    includeLogo: false,
                  },
                  footer: {
                    enabled: true,
                    text: "© 2023 Company Name",
                    includePageNumber: true,
                    includeTimestamp: true,
                  },
                  cover: {
                    enabled: true,
                    title: "Architecture Blueprint",
                    subtitle: "Project Details",
                    backgroundUrl: "",
                    includeLogo: true,
                  },
                  watermark: {
                    enabled: false,
                    text: "CONFIDENTIAL",
                    opacity: 0.1,
                  },
                  companyInfo: {
                    name: "Company Name",
                    address: "123 Main St, City, State, ZIP",
                    phone: "(123) 456-7890",
                    email: "info@company.com",
                    website: "www.company.com",
                  },
                  layout: "classic",
                })
                setIsEditing(false)
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Template
            </Button>
            <Link
              href="/dashboard/architecture/branding/gallery"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              <Grid className="mr-2 h-4 w-4" />
              Browse Gallery
            </Link>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
            <CardDescription>Configure the appearance of your PDF exports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
