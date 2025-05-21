"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { PdfBrandingTemplate } from "@/types/pdf-branding"

interface PdfBrandingFormProps {
  template: PdfBrandingTemplate
  onSave: (template: PdfBrandingTemplate) => Promise<void>
}

export function PdfBrandingForm({ template: initialTemplate, onSave }: PdfBrandingFormProps) {
  const [template, setTemplate] = useState<PdfBrandingTemplate>(initialTemplate)
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>Basic information about your template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-layout">Layout Style</Label>
              <select
                id="template-layout"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={template.layout}
                onChange={(e) => setTemplate({ ...template, layout: e.target.value as any })}
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="template-default"
              checked={template.isDefault}
              onChange={(e) => setTemplate({ ...template, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="template-default">Set as default template</Label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="company">Company Info</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>Customize the colors used in your PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="color-primary">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color-primary"
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
                  <Label htmlFor="color-secondary">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color-secondary"
                      type="color"
                      value={template.colors.secondary}
                      onChange={(e) => handleChange("colors", "secondary", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={template.colors.secondary}
                      onChange={(e) => handleChange("colors", "secondary", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Customize the fonts used in your PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="font-heading">Heading Font</Label>
                  <select
                    id="font-heading"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={template.fonts.heading}
                    onChange={(e) => handleChange("fonts", "heading", e.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier">Courier</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-body">Body Font</Label>
                  <select
                    id="font-body"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={template.fonts.body}
                    onChange={(e) => handleChange("fonts", "body", e.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier">Courier</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Header & Footer</CardTitle>
              <CardDescription>Customize the header and footer of your PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="header-enabled"
                    checked={template.header.enabled}
                    onChange={(e) => handleChange("header", "enabled", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="header-enabled">Enable header</Label>
                </div>
                {template.header.enabled && (
                  <div className="pt-2">
                    <Label htmlFor="header-text">Header Text</Label>
                    <Input
                      id="header-text"
                      value={template.header.text}
                      onChange={(e) => handleChange("header", "text", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="footer-enabled"
                    checked={template.footer.enabled}
                    onChange={(e) => handleChange("footer", "enabled", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="footer-enabled">Enable footer</Label>
                </div>
                {template.footer.enabled && (
                  <div className="pt-2">
                    <Label htmlFor="footer-text">Footer Text</Label>
                    <Input
                      id="footer-text"
                      value={template.footer.text}
                      onChange={(e) => handleChange("footer", "text", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Add your company details to the PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={template.companyInfo.name}
                  onChange={(e) => handleChange("companyInfo", "name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-address">Address</Label>
                <Textarea
                  id="company-address"
                  value={template.companyInfo.address}
                  onChange={(e) => handleChange("companyInfo", "address", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input
                    id="company-phone"
                    value={template.companyInfo.phone}
                    onChange={(e) => handleChange("companyInfo", "phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    value={template.companyInfo.email}
                    onChange={(e) => handleChange("companyInfo", "email", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-website">Website</Label>
                <Input
                  id="company-website"
                  value={template.companyInfo.website}
                  onChange={(e) => handleChange("companyInfo", "website", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </div>
  )
}
