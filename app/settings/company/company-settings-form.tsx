"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Upload, X, Save, Building, RefreshCw, Type } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorPicker } from "./color-picker"
import { PDFPreview } from "./pdf-preview"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FontPairingRecommendations } from "./font-pairing-recommendations"
import { FontSizeControls, type FontSizes } from "./font-size-controls"
import { FontSizePreview } from "./font-size-preview"
import { LineSpacingControls, type LineSpacing } from "./line-spacing-controls"
import { LineSpacingPreview } from "./line-spacing-preview"
import { ParagraphSpacingControls, type ParagraphSpacing } from "./paragraph-spacing-controls"
import { ParagraphSpacingPreview } from "./paragraph-spacing-preview"

export function CompanySettingsForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fontFileRef = useRef<HTMLInputElement>(null)

  // Brand colors
  const [primaryColor, setPrimaryColor] = useState("#3b82f6") // Default blue
  const [secondaryColor, setSecondaryColor] = useState("#6b7280") // Default gray
  const [accentColor, setAccentColor] = useState("#f59e0b") // Default amber
  const [textColor, setTextColor] = useState("#1f2937") // Default dark gray
  const [backgroundColor, setBackgroundColor] = useState("#ffffff") // Default white

  // Font settings
  const [headingFont, setHeadingFont] = useState("helvetica")
  const [bodyFont, setBodyFont] = useState("helvetica")
  const [customFontUrl, setCustomFontUrl] = useState<string | null>(null)
  const [customFontName, setCustomFontName] = useState("")
  const [useCustomFont, setUseCustomFont] = useState(false)
  const [fontUploading, setFontUploading] = useState(false)
  const [customFonts, setCustomFonts] = useState<Array<{ name: string; url: string }>>([])

  // Font size settings
  const [fontSizes, setFontSizes] = useState<FontSizes>({
    heading1: 24,
    heading2: 18,
    heading3: 14,
    body: 12,
    small: 10,
    footer: 8,
  })

  // Line spacing settings
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>({
    heading1: 1.2,
    heading2: 1.25,
    heading3: 1.3,
    body: 1.5,
    small: 1.4,
    footer: 1.3,
  })

  // Paragraph spacing settings
  const [paragraphSpacing, setParagraphSpacing] = useState<ParagraphSpacing>({
    paragraphSpacing: 10,
    headingBottomSpacing: 12,
    headingTopSpacing: 18,
    sectionSpacing: 25,
    listItemSpacing: 5,
    blockElementSpacing: 15,
  })

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<string | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState("general")
  const [activeTypographyTab, setActiveTypographyTab] = useState("fonts")

  useEffect(() => {
    async function loadCompanySettings() {
      try {
        const { data: settings, error } = await supabase.from("company_settings").select("*").single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading company settings:", error)
          return
        }

        if (settings) {
          setCompanyName(settings.name || "")
          setCompanyDescription(settings.description || "")
          setLogoUrl(settings.logo_url || null)

          // Load brand colors if available
          if (settings.brand_colors) {
            setPrimaryColor(settings.brand_colors.primary || "#3b82f6")
            setSecondaryColor(settings.brand_colors.secondary || "#6b7280")
            setAccentColor(settings.brand_colors.accent || "#f59e0b")
            setTextColor(settings.brand_colors.text || "#1f2937")
            setBackgroundColor(settings.brand_colors.background || "#ffffff")
          }

          // Load font settings if available
          if (settings.font_settings) {
            setHeadingFont(settings.font_settings.headingFont || "helvetica")
            setBodyFont(settings.font_settings.bodyFont || "helvetica")
            setUseCustomFont(settings.font_settings.useCustomFont || false)
            setCustomFontName(settings.font_settings.customFontName || "")
            setCustomFontUrl(settings.font_settings.customFontUrl || null)

            // Load font sizes
            if (settings.font_settings.fontSizes) {
              setFontSizes(settings.font_settings.fontSizes)
            }

            // Load line spacing
            if (settings.font_settings?.lineSpacing) {
              setLineSpacing(settings.font_settings.lineSpacing)
            }

            // Load paragraph spacing
            if (settings.font_settings?.paragraphSpacing) {
              setParagraphSpacing(settings.font_settings.paragraphSpacing)
            }
          }

          // Load custom fonts if available
          if (settings.custom_fonts && Array.isArray(settings.custom_fonts)) {
            setCustomFonts(settings.custom_fonts)
          }
        }
      } catch (error) {
        console.error("Error loading company settings:", error)
      }
    }

    loadCompanySettings()
  }, [supabase])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      setLogoLoading(true)

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo image must be less than 2MB",
          variant: "destructive",
        })
        return
      }

      // Upload to Supabase Storage
      const fileName = `company-logo-${Date.now()}.${file.name.split(".").pop()}`
      const { data, error } = await supabase.storage.from("company-assets").upload(fileName, file, { upsert: true })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("company-assets").getPublicUrl(fileName)

      setLogoUrl(publicUrlData.publicUrl)

      toast({
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLogoLoading(false)
    }
  }

  const handleFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      setFontUploading(true)

      // Validate file type
      if (!file.type.includes("font") && !file.name.endsWith(".ttf") && !file.name.endsWith(".otf")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a font file (TTF or OTF)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Font file must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      // Generate a font name if not provided
      const fontName = customFontName || `Custom Font ${customFonts.length + 1}`

      // Upload to Supabase Storage
      const fileName = `font-${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from("company-assets").upload(fileName, file, { upsert: true })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("company-assets").getPublicUrl(fileName)
      const fontUrl = publicUrlData.publicUrl

      // Add to custom fonts list
      const newFont = { name: fontName, url: fontUrl }
      const updatedFonts = [...customFonts, newFont]
      setCustomFonts(updatedFonts)

      // Set as current custom font
      setCustomFontName(fontName)
      setCustomFontUrl(fontUrl)
      setUseCustomFont(true)

      toast({
        title: "Font uploaded",
        description: "Your custom font has been uploaded successfully",
      })

      // Clear the input
      setCustomFontName("")
      if (fontFileRef.current) {
        fontFileRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading font:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your font. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFontUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl(null)
  }

  const handleRemoveFont = async (fontUrl: string) => {
    try {
      // Remove from custom fonts list
      const updatedFonts = customFonts.filter((font) => font.url !== fontUrl)
      setCustomFonts(updatedFonts)

      // If the removed font was the selected one, reset to default
      if (customFontUrl === fontUrl) {
        setCustomFontUrl(null)
        setCustomFontName("")
        setUseCustomFont(false)
      }

      // Extract the file name from the URL
      const fileName = fontUrl.split("/").pop()
      if (fileName) {
        // Delete from storage
        const { error } = await supabase.storage.from("company-assets").remove([fileName])
        if (error) {
          console.error("Error removing font from storage:", error)
        }
      }

      toast({
        title: "Font removed",
        description: "The custom font has been removed",
      })
    } catch (error) {
      console.error("Error removing font:", error)
      toast({
        title: "Removal failed",
        description: "There was an error removing the font. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)

      const { data: existingSettings, error: fetchError } = await supabase
        .from("company_settings")
        .select("id")
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      const settings = {
        name: companyName,
        description: companyDescription,
        logo_url: logoUrl,
        brand_colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          text: textColor,
          background: backgroundColor,
        },
        font_settings: {
          headingFont,
          bodyFont,
          useCustomFont,
          customFontName,
          customFontUrl,
          fontSizes,
          lineSpacing,
          paragraphSpacing,
        },
        custom_fonts: customFonts,
      }

      let error

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("company_settings")
          .update(settings)
          .eq("id", existingSettings.id)
        error = updateError
      } else {
        // Insert new settings
        const { error: insertError } = await supabase.from("company_settings").insert([settings])
        error = insertError
      }

      if (error) {
        throw error
      }

      toast({
        title: "Settings saved",
        description: "Your company settings have been saved successfully",
      })

      router.refresh()
    } catch (error) {
      console.error("Error saving company settings:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your company settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePreview = async () => {
    try {
      setPreviewLoading(true)

      const response = await fetch("/api/errors/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "preview",
          content:
            "# Font and Color Preview\n\nThis is a preview of your brand fonts and colors in a PDF document.\n\n## Heading Font Example\nThis heading uses your selected heading font.\n\n## Body Font Example\nThis paragraph uses your selected body font. The text should be easy to read and professional looking. The quick brown fox jumps over the lazy dog.\n\n## Custom Font Example\nIf you've selected a custom font, this text will use it. Otherwise, it will fall back to your body font selection.",
          options: {
            headerText: "Font & Color Preview",
            customColors: {
              primary: primaryColor,
              secondary: secondaryColor,
              accent: accentColor,
              text: textColor,
              background: backgroundColor,
            },
            fontSettings: {
              headingFont,
              bodyFont,
              useCustomFont,
              customFontName,
              customFontUrl,
              fontSizes,
              lineSpacing,
              paragraphSpacing,
            },
          },
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to generate preview")
      }

      setPreviewData(result.data)
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Preview failed",
        description: "There was an error generating the preview. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const resetColors = () => {
    setPrimaryColor("#3b82f6") // Default blue
    setSecondaryColor("#6b7280") // Default gray
    setAccentColor("#f59e0b") // Default amber
    setTextColor("#1f2937") // Default dark gray
    setBackgroundColor("#ffffff") // Default white

    toast({
      title: "Colors reset",
      description: "Brand colors have been reset to default values",
    })
  }

  const resetFonts = () => {
    setHeadingFont("helvetica")
    setBodyFont("helvetica")
    setUseCustomFont(false)

    toast({
      title: "Fonts reset",
      description: "Font settings have been reset to default values",
    })
  }

  const handleApplyFontPair = (newHeadingFont: string, newBodyFont: string) => {
    setHeadingFont(newHeadingFont)
    setBodyFont(newBodyFont)

    // Generate a preview with the new fonts
    setTimeout(() => {
      generatePreview()
    }, 500)
  }

  return (
    <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="general">General Information</TabsTrigger>
        <TabsTrigger value="branding">Brand Colors</TabsTrigger>
        <TabsTrigger value="typography">Typography</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Update your company details and logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-description">Company Description</Label>
              <Textarea
                id="company-description"
                placeholder="Brief description of your company"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="mt-2">
                {logoUrl ? (
                  <div className="relative inline-block">
                    <div className="border rounded-md p-4 bg-muted/20">
                      <Image
                        src={logoUrl || "/placeholder.svg"}
                        alt="Company Logo"
                        width={200}
                        height={80}
                        className="object-contain"
                        style={{ maxHeight: "80px" }}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-8 text-center bg-muted/20">
                    <Building className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Upload your company logo</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Recommended size: 400x160px (PNG or JPEG, max 2MB)
                    </p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={logoLoading}>
                      {logoLoading ? "Uploading..." : "Upload Logo"}
                      {!logoLoading && <Upload className="ml-2 h-4 w-4" />}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={logoLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
              {!loading && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="branding">
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>Customize the colors used in your PDF exports and documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker id="primary-color" value={primaryColor} onChange={setPrimaryColor} />
                    <p className="text-sm text-muted-foreground">Used for headings and important elements</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker id="secondary-color" value={secondaryColor} onChange={setSecondaryColor} />
                    <p className="text-sm text-muted-foreground">Used for less prominent elements</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker id="accent-color" value={accentColor} onChange={setAccentColor} />
                    <p className="text-sm text-muted-foreground">Used for highlights and call-to-actions</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker id="text-color" value={textColor} onChange={setTextColor} />
                    <p className="text-sm text-muted-foreground">Used for body text</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker id="background-color" value={backgroundColor} onChange={setBackgroundColor} />
                    <p className="text-sm text-muted-foreground">Used for document background</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetColors} type="button">
                    Reset to Defaults
                    <RefreshCw className="ml-2 h-4 w-4" />
                  </Button>

                  <Button variant="secondary" onClick={generatePreview} disabled={previewLoading}>
                    {previewLoading ? "Generating..." : "Preview Colors"}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md p-4 bg-muted/20 min-h-[400px] flex flex-col">
                <h3 className="text-sm font-medium mb-2">Color Preview</h3>

                <div className="flex-1 overflow-hidden">
                  {previewData ? (
                    <PDFPreview data={previewData} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground text-center">
                        Click "Preview Colors" to see how your brand colors will look in PDF documents
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? "Saving..." : "Save Brand Colors"}
              {!loading && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="typography">
        <Card>
          <CardHeader>
            <CardTitle>Typography Settings</CardTitle>
            <CardDescription>Customize the fonts and spacing used in your PDF exports and documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="fonts"
              value={activeTypographyTab}
              onValueChange={setActiveTypographyTab}
              className="mb-6"
            >
              <TabsList>
                <TabsTrigger value="fonts">Fonts</TabsTrigger>
                <TabsTrigger value="sizes">Font Sizes</TabsTrigger>
                <TabsTrigger value="line-spacing">Line Spacing</TabsTrigger>
                <TabsTrigger value="paragraph-spacing">Paragraph Spacing</TabsTrigger>
              </TabsList>

              <TabsContent value="fonts" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="heading-font">Heading Font</Label>
                      <Select value={headingFont} onValueChange={setHeadingFont}>
                        <SelectTrigger id="heading-font">
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="helvetica">Helvetica</SelectItem>
                          <SelectItem value="times">Times</SelectItem>
                          <SelectItem value="courier">Courier</SelectItem>
                          <SelectItem value="georgia">Georgia</SelectItem>
                          <SelectItem value="arial">Arial</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Used for headings and titles</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="body-font">Body Font</Label>
                      <Select value={bodyFont} onValueChange={setBodyFont}>
                        <SelectTrigger id="body-font">
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="helvetica">Helvetica</SelectItem>
                          <SelectItem value="times">Times</SelectItem>
                          <SelectItem value="courier">Courier</SelectItem>
                          <SelectItem value="georgia">Georgia</SelectItem>
                          <SelectItem value="arial">Arial</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Used for body text and paragraphs</p>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-base font-medium mb-3">Recommended Font Pairings</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select from these professionally curated font combinations for optimal readability and style
                      </p>
                      <FontPairingRecommendations
                        currentHeadingFont={headingFont}
                        currentBodyFont={bodyFont}
                        onApplyPair={handleApplyFontPair}
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="use-custom-font" className="text-base">
                            Use Custom Font
                          </Label>
                          <p className="text-xs text-muted-foreground">Upload and use your own font</p>
                        </div>
                        <Switch id="use-custom-font" checked={useCustomFont} onCheckedChange={setUseCustomFont} />
                      </div>

                      {useCustomFont && (
                        <div className="space-y-4">
                          {customFonts.length > 0 ? (
                            <div className="space-y-2">
                              <Label htmlFor="custom-font-select">Select Custom Font</Label>
                              <Select
                                value={customFontUrl || ""}
                                onValueChange={(value) => {
                                  setCustomFontUrl(value)
                                  const font = customFonts.find((f) => f.url === value)
                                  if (font) {
                                    setCustomFontName(font.name)
                                  }
                                }}
                              >
                                <SelectTrigger id="custom-font-select">
                                  <SelectValue placeholder="Select a custom font" />
                                </SelectTrigger>
                                <SelectContent>
                                  {customFonts.map((font) => (
                                    <SelectItem key={font.url} value={font.url}>
                                      {font.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No custom fonts uploaded yet</p>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="custom-font-name">New Font Name</Label>
                            <Input
                              id="custom-font-name"
                              placeholder="Enter a name for your font"
                              value={customFontName}
                              onChange={(e) => setCustomFontName(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Upload Font File</Label>
                            <div className="border border-dashed rounded-md p-4 text-center bg-muted/20">
                              <Type className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-2">Upload a custom font file</p>
                              <p className="text-xs text-muted-foreground mb-4">
                                Supported formats: TTF, OTF (max 5MB)
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => fontFileRef.current?.click()}
                                disabled={fontUploading}
                              >
                                {fontUploading ? "Uploading..." : "Upload Font"}
                                {!fontUploading && <Upload className="ml-2 h-4 w-4" />}
                              </Button>
                              <input
                                type="file"
                                ref={fontFileRef}
                                className="hidden"
                                accept=".ttf,.otf,font/ttf,font/otf"
                                onChange={handleFontUpload}
                                disabled={fontUploading}
                              />
                            </div>
                          </div>

                          {customFonts.length > 0 && (
                            <div className="space-y-2">
                              <Label>Uploaded Fonts</Label>
                              <div className="border rounded-md divide-y">
                                {customFonts.map((font) => (
                                  <div key={font.url} className="flex items-center justify-between p-2">
                                    <span className="text-sm">{font.name}</span>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFont(font.url)}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetFonts} type="button">
                        Reset to Defaults
                        <RefreshCw className="ml-2 h-4 w-4" />
                      </Button>

                      <Button variant="secondary" onClick={generatePreview} disabled={previewLoading}>
                        {previewLoading ? "Generating..." : "Preview Fonts"}
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-muted/20 min-h-[400px] flex flex-col">
                    <h3 className="text-sm font-medium mb-2">Font Preview</h3>

                    <div className="flex-1 overflow-hidden">
                      {previewData ? (
                        <PDFPreview data={previewData} />
                      ) : (
                        <FontSizePreview fontSizes={fontSizes} headingFont={headingFont} bodyFont={bodyFont} />
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sizes" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-6">
                    <FontSizeControls
                      fontSizes={fontSizes}
                      onFontSizesChange={setFontSizes}
                      onPreview={generatePreview}
                    />
                  </div>

                  <div className="border rounded-md p-4 bg-muted/20 min-h-[400px] flex flex-col">
                    <h3 className="text-sm font-medium mb-2">Font Size Preview</h3>

                    <div className="flex-1 overflow-hidden">
                      {previewData ? (
                        <div className="space-y-4">
                          <PDFPreview data={previewData} />
                          <FontSizePreview fontSizes={fontSizes} headingFont={headingFont} bodyFont={bodyFont} />
                        </div>
                      ) : (
                        <FontSizePreview fontSizes={fontSizes} headingFont={headingFont} bodyFont={bodyFont} />
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="line-spacing" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-6">
                    <LineSpacingControls
                      lineSpacing={lineSpacing}
                      onLineSpacingChange={setLineSpacing}
                      onPreview={generatePreview}
                    />
                  </div>

                  <div className="border rounded-md p-4 bg-muted/20 min-h-[400px] flex flex-col">
                    <h3 className="text-sm font-medium mb-2">Line Spacing Preview</h3>

                    <div className="flex-1 overflow-hidden">
                      {previewData ? (
                        <div className="space-y-4">
                          <PDFPreview data={previewData} />
                          <LineSpacingPreview
                            lineSpacing={lineSpacing}
                            fontSizes={fontSizes}
                            headingFont={headingFont}
                            bodyFont={bodyFont}
                          />
                        </div>
                      ) : (
                        <LineSpacingPreview
                          lineSpacing={lineSpacing}
                          fontSizes={fontSizes}
                          headingFont={headingFont}
                          bodyFont={bodyFont}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paragraph-spacing" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-6">
                    <ParagraphSpacingControls
                      paragraphSpacing={paragraphSpacing}
                      onParagraphSpacingChange={setParagraphSpacing}
                      onPreview={generatePreview}
                    />
                  </div>

                  <div className="border rounded-md p-4 bg-muted/20 min-h-[400px] flex flex-col">
                    <h3 className="text-sm font-medium mb-2">Paragraph Spacing Preview</h3>

                    <div className="flex-1 overflow-hidden">
                      {previewData ? (
                        <div className="space-y-4">
                          <PDFPreview data={previewData} />
                          <ParagraphSpacingPreview
                            paragraphSpacing={paragraphSpacing}
                            fontSizes={fontSizes}
                            lineSpacing={lineSpacing}
                            headingFont={headingFont}
                            bodyFont={bodyFont}
                          />
                        </div>
                      ) : (
                        <ParagraphSpacingPreview
                          paragraphSpacing={paragraphSpacing}
                          fontSizes={fontSizes}
                          lineSpacing={lineSpacing}
                          headingFont={headingFont}
                          bodyFont={bodyFont}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? "Saving..." : "Save Typography Settings"}
              {!loading && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
