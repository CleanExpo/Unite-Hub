"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Zap } from "lucide-react"

export interface FontSizes {
  heading1: number
  heading2: number
  heading3: number
  body: number
  small: number
  footer: number
}

interface FontSizeControlsProps {
  fontSizes: FontSizes
  onFontSizesChange: (sizes: FontSizes) => void
  onPreview?: () => void
}

// Predefined font size presets
const FONT_SIZE_PRESETS = {
  compact: {
    name: "Compact",
    description: "Smaller sizes for dense documents",
    sizes: {
      heading1: 18,
      heading2: 14,
      heading3: 12,
      body: 10,
      small: 8,
      footer: 7,
    },
  },
  standard: {
    name: "Standard",
    description: "Balanced sizes for most documents",
    sizes: {
      heading1: 24,
      heading2: 18,
      heading3: 14,
      body: 12,
      small: 10,
      footer: 8,
    },
  },
  large: {
    name: "Large",
    description: "Larger sizes for better readability",
    sizes: {
      heading1: 28,
      heading2: 22,
      heading3: 16,
      body: 14,
      small: 12,
      footer: 10,
    },
  },
  presentation: {
    name: "Presentation",
    description: "Large sizes for presentations and reports",
    sizes: {
      heading1: 32,
      heading2: 24,
      heading3: 18,
      body: 16,
      small: 14,
      footer: 12,
    },
  },
}

// Font size constraints
const FONT_SIZE_LIMITS = {
  heading1: { min: 16, max: 36 },
  heading2: { min: 12, max: 28 },
  heading3: { min: 10, max: 24 },
  body: { min: 8, max: 18 },
  small: { min: 6, max: 14 },
  footer: { min: 6, max: 12 },
}

export function FontSizeControls({ fontSizes, onFontSizesChange, onPreview }: FontSizeControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const handleSizeChange = (element: keyof FontSizes, value: number[]) => {
    const newSizes = {
      ...fontSizes,
      [element]: value[0],
    }
    onFontSizesChange(newSizes)
  }

  const applyPreset = (presetKey: string) => {
    const preset = FONT_SIZE_PRESETS[presetKey as keyof typeof FONT_SIZE_PRESETS]
    if (preset) {
      onFontSizesChange(preset.sizes)
      setSelectedPreset(presetKey)

      // Generate preview after a short delay
      if (onPreview) {
        setTimeout(onPreview, 300)
      }
    }
  }

  const resetToStandard = () => {
    applyPreset("standard")
  }

  const generateOptimalSizes = () => {
    // Generate sizes based on golden ratio and typography best practices
    const baseSize = fontSizes.body
    const ratio = 1.25 // Major third ratio

    const optimalSizes: FontSizes = {
      heading1: Math.round(baseSize * ratio * ratio * ratio),
      heading2: Math.round(baseSize * ratio * ratio),
      heading3: Math.round(baseSize * ratio),
      body: baseSize,
      small: Math.round(baseSize * 0.875),
      footer: Math.round(baseSize * 0.75),
    }

    // Ensure sizes are within limits
    Object.keys(optimalSizes).forEach((key) => {
      const element = key as keyof FontSizes
      const limits = FONT_SIZE_LIMITS[element]
      optimalSizes[element] = Math.max(limits.min, Math.min(limits.max, optimalSizes[element]))
    })

    onFontSizesChange(optimalSizes)
    setSelectedPreset("")

    if (onPreview) {
      setTimeout(onPreview, 300)
    }
  }

  return (
    <div className="space-y-6">
      {/* Presets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Font Size Presets</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateOptimalSizes}>
              <Zap className="h-4 w-4 mr-1" />
              Auto-optimize
            </Button>
            <Button variant="outline" size="sm" onClick={resetToStandard}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(FONT_SIZE_PRESETS).map(([key, preset]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPreset === key ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => applyPreset(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{preset.name}</h4>
                  {selectedPreset === key && <Badge variant="secondary">Active</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-muted px-2 py-1 rounded">H1: {preset.sizes.heading1}pt</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Body: {preset.sizes.body}pt</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Individual Controls */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Custom Font Sizes</Label>

        <div className="grid gap-4">
          {/* Heading 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading1-size">Heading 1 (Main Titles)</Label>
              <span className="text-sm text-muted-foreground">{fontSizes.heading1}pt</span>
            </div>
            <Slider
              id="heading1-size"
              min={FONT_SIZE_LIMITS.heading1.min}
              max={FONT_SIZE_LIMITS.heading1.max}
              step={1}
              value={[fontSizes.heading1]}
              onValueChange={(value) => handleSizeChange("heading1", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{FONT_SIZE_LIMITS.heading1.min}pt</span>
              <span>{FONT_SIZE_LIMITS.heading1.max}pt</span>
            </div>
          </div>

          {/* Heading 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading2-size">Heading 2 (Section Titles)</Label>
              <span className="text-sm text-muted-foreground">{fontSizes.heading2}pt</span>
            </div>
            <Slider
              id="heading2-size"
              min={FONT_SIZE_LIMITS.heading2.min}
              max={FONT_SIZE_LIMITS.heading2.max}
              step={1}
              value={[fontSizes.heading2]}
              onValueChange={(value) => handleSizeChange("heading2", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{FONT_SIZE_LIMITS.heading2.min}pt</span>
              <span>{FONT_SIZE_LIMITS.heading2.max}pt</span>
            </div>
          </div>

          {/* Heading 3 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading3-size">Heading 3 (Subsections)</Label>
              <span className="text-sm text-muted-foreground">{fontSizes.heading3}pt</span>
            </div>
            <Slider
              id="heading3-size"
              min={FONT_SIZE_LIMITS.heading3.min}
              max={FONT_SIZE_LIMITS.heading3.max}
              step={1}
              value={[fontSizes.heading3]}
              onValueChange={(value) => handleSizeChange("heading3", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{FONT_SIZE_LIMITS.heading3.min}pt</span>
              <span>{FONT_SIZE_LIMITS.heading3.max}pt</span>
            </div>
          </div>

          {/* Body Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body-size">Body Text (Paragraphs)</Label>
              <span className="text-sm text-muted-foreground">{fontSizes.body}pt</span>
            </div>
            <Slider
              id="body-size"
              min={FONT_SIZE_LIMITS.body.min}
              max={FONT_SIZE_LIMITS.body.max}
              step={1}
              value={[fontSizes.body]}
              onValueChange={(value) => handleSizeChange("body", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{FONT_SIZE_LIMITS.body.min}pt</span>
              <span>{FONT_SIZE_LIMITS.body.max}pt</span>
            </div>
          </div>

          {/* Small Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="small-size">Small Text (Captions, Notes)</Label>
              <span className="text-sm text-muted-foreground">{fontSizes.small}pt</span>
            </div>
            <Slider
              id="small-size"
              min={FONT_SIZE_LIMITS.small.min}
              max={FONT_SIZE_LIMITS.small.max}
              step={1}
              value={[fontSizes.small]}
              onValueChange={(value) => handleSizeChange("small", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{FONT_SIZE_LIMITS.small.min}pt</span>
              <span>{FONT_SIZE_LIMITS.small.max}pt</span>
            </div>
          </div>

          {/* Footer Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="footer-size">Footer Text (Page Numbers, Dates)</Label>
              <span className="text-sm text-muted-foreground">{fontSizes.footer}pt</span>
            </div>
            <Slider
              id="footer-size"
              min={FONT_SIZE_LIMITS.footer.min}
              max={FONT_SIZE_LIMITS.footer.max}
              step={1}
              value={[fontSizes.footer]}
              onValueChange={(value) => handleSizeChange("footer", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{FONT_SIZE_LIMITS.footer.min}pt</span>
              <span>{FONT_SIZE_LIMITS.footer.max}pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Scale Preview */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Typography Scale Preview</Label>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div style={{ fontSize: `${fontSizes.heading1 * 0.75}px`, fontWeight: "bold", lineHeight: 1.2 }}>
              Heading 1 Example ({fontSizes.heading1}pt)
            </div>
            <div style={{ fontSize: `${fontSizes.heading2 * 0.75}px`, fontWeight: "bold", lineHeight: 1.3 }}>
              Heading 2 Example ({fontSizes.heading2}pt)
            </div>
            <div style={{ fontSize: `${fontSizes.heading3 * 0.75}px`, fontWeight: "bold", lineHeight: 1.4 }}>
              Heading 3 Example ({fontSizes.heading3}pt)
            </div>
            <div style={{ fontSize: `${fontSizes.body * 0.75}px`, lineHeight: 1.5 }}>
              Body text example. This is how your regular paragraphs will appear in the PDF documents. The quick brown
              fox jumps over the lazy dog. ({fontSizes.body}pt)
            </div>
            <div style={{ fontSize: `${fontSizes.small * 0.75}px`, lineHeight: 1.4, color: "#6b7280" }}>
              Small text example for captions and notes ({fontSizes.small}pt)
            </div>
            <div style={{ fontSize: `${fontSizes.footer * 0.75}px`, lineHeight: 1.3, color: "#9ca3af" }}>
              Footer text example for page numbers and dates ({fontSizes.footer}pt)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
