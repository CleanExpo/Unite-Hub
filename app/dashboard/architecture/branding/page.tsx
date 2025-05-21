"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PDFBrandingForm } from "@/components/pdf-branding-form"
import type { PDFBrandingSettings, PDFBrandingFormData } from "@/types/pdf-branding"
import { Plus, Settings2 } from "lucide-react"

export default function PDFBrandingPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<PDFBrandingSettings[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("templates")

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      // In a real app, fetch from your API
      // For demo, we'll use mock data
      const mockTemplates: PDFBrandingSettings[] = [
        {
          id: "default",
          name: "Default Template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: true,
          primaryColor: "#2c3e50",
          secondaryColor: "#3498db",
          accentColor: "#e74c3c",
          fontFamily: "helvetica",
          includeTimestamp: true,
          includePageNumbers: true,
          includeCoverPage: true,
          templateStyle: "classic",
        },
        {
          id: "modern",
          name: "Modern Template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: false,
          primaryColor: "#1a202c",
          secondaryColor: "#4299e1",
          accentColor: "#f56565",
          fontFamily: "arial",
          headerTitle: "Architecture Blueprint",
          footerText: "Confidential & Proprietary",
          includeTimestamp: true,
          includePageNumbers: true,
          includeCoverPage: true,
          templateStyle: "modern",
          companyName: "Modern Solutions Inc.",
        },
        {
          id: "minimal",
          name: "Minimal Template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDefault: false,
          primaryColor: "#000000",
          secondaryColor: "#718096",
          accentColor: "#f56565",
          fontFamily: "helvetica",
          includeTimestamp: false,
          includePageNumbers: true,
          includeCoverPage: false,
          templateStyle: "minimal",
        },
      ]

      setTemplates(mockTemplates)

      // Set the active template to the default one
      const defaultTemplate = mockTemplates.find((t) => t.isDefault)
      if (defaultTemplate) {
        setActiveTemplate(defaultTemplate.id)
      } else if (mockTemplates.length > 0) {
        setActiveTemplate(mockTemplates[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTemplate = async (data: PDFBrandingFormData) => {
    // In a real app, save to your API
    // For demo, we'll just update the local state

    if (activeTemplate === "new") {
      // Create new template
      const newTemplate: PDFBrandingSettings = {
        ...data,
        id: `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // If this is set as default, update other templates
      if (data.isDefault) {
        setTemplates((prev) =>
          prev
            .map((t) => ({
              ...t,
              isDefault: false,
            }))
            .concat(newTemplate),
        )
      } else {
        setTemplates((prev) => [...prev, newTemplate])
      }

      setActiveTemplate(newTemplate.id)
      setActiveTab("templates")
    } else {
      // Update existing template
      setTemplates((prev) =>
        prev.map((t) => {
          // If this template is being set as default, update all others
          if (data.isDefault && t.id !== activeTemplate) {
            return { ...t, isDefault: false }
          }

          // Update the active template
          if (t.id === activeTemplate) {
            return {
              ...t,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          }

          return t
        }),
      )

      setActiveTab("templates")
    }

    // Show success message or notification
    alert("Template saved successfully!")
  }

  const handleDeleteTemplate = async (id: string) => {
    // In a real app, delete from your API
    // For demo, we'll just update the local state

    setTemplates((prev) => prev.filter((t) => t.id !== id))

    // If the deleted template was active, set the first available template as active
    if (activeTemplate === id) {
      const remainingTemplates = templates.filter((t) => t.id !== id)
      if (remainingTemplates.length > 0) {
        setActiveTemplate(remainingTemplates[0].id)
      } else {
        setActiveTemplate(null)
      }
    }

    setActiveTab("templates")

    // Show success message or notification
    alert("Template deleted successfully!")
  }

  const handleCreateNew = () => {
    setActiveTemplate("new")
    setActiveTab("edit")
  }

  const handleEditTemplate = (id: string) => {
    setActiveTemplate(id)
    setActiveTab("edit")
  }

  const getActiveTemplateData = () => {
    if (activeTemplate === "new") {
      return undefined
    }

    return templates.find((t) => t.id === activeTemplate)
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDF Branding Settings</h1>
          <p className="text-gray-500">Customize how your architecture blueprints look when exported as PDFs</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="edit" disabled={!activeTemplate}>
            Edit Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 pt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Settings2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No templates yet</h3>
              <p className="mt-2 text-gray-500">Create your first PDF template to get started</p>
              <Button onClick={handleCreateNew} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className={template.isDefault ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      {template.name}
                      {template.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Default</span>
                      )}
                    </CardTitle>
                    <CardDescription>Last updated: {new Date(template.updatedAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Style:</span>
                        <span className="text-sm capitalize">{template.templateStyle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Font:</span>
                        <span className="text-sm capitalize">{template.fontFamily}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Colors:</span>
                        <div className="flex gap-1">
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: template.primaryColor }}
                            title="Primary Color"
                          />
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: template.secondaryColor }}
                            title="Secondary Color"
                          />
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: template.accentColor }}
                            title="Accent Color"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleEditTemplate(template.id)}>
                      Edit Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit" className="pt-4">
          {activeTemplate && (
            <PDFBrandingForm
              initialData={getActiveTemplateData()}
              onSave={handleSaveTemplate}
              onDelete={activeTemplate !== "new" ? handleDeleteTemplate : undefined}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
