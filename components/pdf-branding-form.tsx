"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type PDFBrandingSettings, type PDFBrandingFormData, defaultBrandingSettings } from "@/types/pdf-branding"
import { Loader2, Save, Trash2, Upload } from "lucide-react"
import { PDFPreview } from "@/components/pdf-preview"

const brandingFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  isDefault: z.boolean().default(false),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  fontFamily: z.enum(["helvetica", "times", "courier", "arial"]),
  headerTitle: z.string().optional(),
  footerText: z.string().optional(),
  includeTimestamp: z.boolean().default(true),
  includePageNumbers: z.boolean().default(true),
  includeCoverPage: z.boolean().default(true),
  coverPageBackground: z.string().optional(),
  templateStyle: z.enum(["classic", "modern", "minimal", "bold"]),
  companyName: z.string().optional(),
  contactInfo: z.string().optional(),
  watermark: z.string().optional(),
  logo: z.string().optional(),
})

interface PDFBrandingFormProps {
  initialData?: PDFBrandingSettings
  onSave: (data: PDFBrandingFormData) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function PDFBrandingForm({ initialData, onSave, onDelete }: PDFBrandingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("branding")
  const [logoPreview, setLogoPreview] = useState<string | undefined>(initialData?.logo)

  const form = useForm<PDFBrandingFormData>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: initialData || defaultBrandingSettings,
  })

  const watchedValues = form.watch()

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      form.setError("logo", {
        type: "manual",
        message: "Logo must be less than 1MB",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setLogoPreview(result)
      form.setValue("logo", result)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: PDFBrandingFormData) => {
    setIsLoading(true)
    try {
      await onSave(data)
    } catch (error) {
      console.error("Failed to save branding settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return

    if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      setIsLoading(true)
      try {
        await onDelete(initialData.id)
      } catch (error) {
        console.error("Failed to delete branding settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="branding">Branding Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                  <CardDescription>Basic information about your PDF template</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Company Template" {...field} />
                        </FormControl>
                        <FormDescription>A name to identify this template</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Default Template</FormLabel>
                          <FormDescription>Make this the default template for all new PDFs</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Customize the look and feel of your PDF exports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <FormLabel>Logo</FormLabel>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="h-24 w-24 overflow-hidden rounded border bg-gray-50 flex items-center justify-center">
                        {logoPreview ? (
                          <img
                            src={logoPreview || "/placeholder.svg"}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm text-center p-2">No logo uploaded</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("logo-upload")?.click()}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </Button>
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLogoPreview(undefined)
                              form.setValue("logo", undefined)
                            }}
                            className="w-full"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Logo
                          </Button>
                        )}
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </div>
                    </div>
                    {form.formState.errors.logo && (
                      <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.logo.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">Recommended size: 300x150px, max 1MB</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex gap-2">
                            <div className="h-10 w-10 rounded border" style={{ backgroundColor: field.value }} />
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <div className="flex gap-2">
                            <div className="h-10 w-10 rounded border" style={{ backgroundColor: field.value }} />
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <div className="flex gap-2">
                            <div className="h-10 w-10 rounded border" style={{ backgroundColor: field.value }} />
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Family</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a font family" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="helvetica">Helvetica</SelectItem>
                            <SelectItem value="times">Times New Roman</SelectItem>
                            <SelectItem value="courier">Courier</SelectItem>
                            <SelectItem value="arial">Arial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="templateStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Style</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>The overall style and layout of your PDF</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Customization</CardTitle>
                  <CardDescription>Customize the content of your PDF exports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>Your company name to display on the PDF</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="headerTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Architecture Blueprint" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Custom title to display in the header (leave empty to use project name)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Confidential" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>Custom text to display in the footer</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Email: contact@example.com&#10;Phone: (123) 456-7890"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Contact information to display on the cover page</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="watermark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Watermark</FormLabel>
                        <FormControl>
                          <Input placeholder="DRAFT" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>Optional watermark text to display on each page</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Layout Options</CardTitle>
                  <CardDescription>Configure the layout of your PDF exports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="includeCoverPage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Cover Page</FormLabel>
                            <FormDescription>Include a cover page with project details</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeTimestamp"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Timestamp</FormLabel>
                            <FormDescription>Include generation timestamp</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includePageNumbers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Page Numbers</FormLabel>
                            <FormDescription>Include page numbers in footer</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <div>
                  {initialData?.id && onDelete && (
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                      {isLoading ? (
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF Preview</CardTitle>
              <CardDescription>Preview how your PDF will look with the current settings</CardDescription>
            </CardHeader>
            <CardContent>
              <PDFPreview settings={watchedValues} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
