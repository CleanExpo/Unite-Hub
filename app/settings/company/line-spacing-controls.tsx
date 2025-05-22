"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Zap, AlignLeft } from "lucide-react"

export interface LineSpacing {
  heading1: number
  heading2: number
  heading3: number
  body: number
  small: number
  footer: number
}

interface LineSpacingControlsProps {
  lineSpacing: LineSpacing
  onLineSpacingChange: (spacing: LineSpacing) => void
  onPreview?: () => void
}

// Predefined line spacing presets
const LINE_SPACING_PRESETS = {
  tight: {
    name: "Tight",
    description: "Compact spacing for dense documents",
    spacing: {
      heading1: 1.1,
      heading2: 1.15,
      heading3: 1.2,
      body: 1.3,
      small: 1.25,
      footer: 1.2,
    },
  },
  normal: {
    name: "Normal",
    description: "Standard spacing for most documents",
    spacing: {
      heading1: 1.2,
      heading2: 1.25,
      heading3: 1.3,
      body: 1.5,
      small: 1.4,
      footer: 1.3,
    },
  },
  relaxed: {
    name: "Relaxed",
    description: "Comfortable spacing for easy reading",
    spacing: {
      heading1: 1.3,
      heading2: 1.35,
      heading3: 1.4,
      body: 1.6,
      small: 1.5,
      footer: 1.4,
    },
  },
  loose: {
    name: "Loose",
    description: "Generous spacing for accessibility",
    spacing: {
      heading1: 1.4,
      heading2: 1.45,
      heading3: 1.5,
      body: 1.8,
      small: 1.6,
      footer: 1.5,
    },
  },
}

// Line spacing constraints
const LINE_SPACING_LIMITS = {
  heading1: { min: 1.0, max: 2.0 },
  heading2: { min: 1.0, max: 2.0 },
  heading3: { min: 1.0, max: 2.0 },
  body: { min: 1.0, max: 2.5 },
  small: { min: 1.0, max: 2.0 },
  footer: { min: 1.0, max: 2.0 },
}

export function LineSpacingControls({ lineSpacing, onLineSpacingChange, onPreview }: LineSpacingControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const handleSpacingChange = (element: keyof LineSpacing, value: number[]) => {
    const newSpacing = {
      ...lineSpacing,
      [element]: value[0],
    }
    onLineSpacingChange(newSpacing)
  }

  const applyPreset = (presetKey: string) => {
    const preset = LINE_SPACING_PRESETS[presetKey as keyof typeof LINE_SPACING_PRESETS]
    if (preset) {
      onLineSpacingChange(preset.spacing)
      setSelectedPreset(presetKey)

      // Generate preview after a short delay
      if (onPreview) {
        setTimeout(onPreview, 300)
      }
    }
  }

  const resetToNormal = () => {
    applyPreset("normal")
  }

  const generateOptimalSpacing = () => {
    // Generate spacing based on typography best practices
    // Body text should have the most generous spacing for readability
    const baseSpacing = lineSpacing.body

    const optimalSpacing: LineSpacing = {
      heading1: Math.max(1.0, Math.min(2.0, baseSpacing * 0.8)), // Tighter for large headings
      heading2: Math.max(1.0, Math.min(2.0, baseSpacing * 0.85)),
      heading3: Math.max(1.0, Math.min(2.0, baseSpacing * 0.9)),
      body: baseSpacing, // Keep current body spacing as base
      small: Math.max(1.0, Math.min(2.0, baseSpacing * 0.9)), // Slightly tighter for small text
      footer: Math.max(1.0, Math.min(2.0, baseSpacing * 0.85)), // Tighter for footer
    }

    onLineSpacingChange(optimalSpacing)
    setSelectedPreset("")

    if (onPreview) {
      setTimeout(onPreview, 300)
    }
  }

  const formatSpacing = (value: number) => {
    return value.toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Presets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Line Spacing Presets</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateOptimalSpacing}>
              <Zap className="h-4 w-4 mr-1" />
              Auto-optimize
            </Button>
            <Button variant="outline" size="sm" onClick={resetToNormal}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(LINE_SPACING_PRESETS).map(([key, preset]) => (
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
                  <span className="text-xs bg-muted px-2 py-1 rounded">Body: {formatSpacing(preset.spacing.body)}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    H1: {formatSpacing(preset.spacing.heading1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Individual Controls */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Custom Line Spacing</Label>
        <p className="text-sm text-muted-foreground">
          Line spacing is expressed as a multiplier of the font size. For example, 1.5 means the line height is 1.5
          times the font size.
        </p>

        <div className="grid gap-4">
          {/* Heading 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading1-spacing">Heading 1 Line Spacing</Label>
              <span className="text-sm text-muted-foreground">{formatSpacing(lineSpacing.heading1)}</span>
            </div>
            <Slider
              id="heading1-spacing"
              min={LINE_SPACING_LIMITS.heading1.min}
              max={LINE_SPACING_LIMITS.heading1.max}
              step={0.05}
              value={[lineSpacing.heading1]}
              onValueChange={(value) => handleSpacingChange("heading1", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{LINE_SPACING_LIMITS.heading1.min}</span>
              <span>{LINE_SPACING_LIMITS.heading1.max}</span>
            </div>
          </div>

          {/* Heading 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading2-spacing">Heading 2 Line Spacing</Label>
              <span className="text-sm text-muted-foreground">{formatSpacing(lineSpacing.heading2)}</span>
            </div>
            <Slider
              id="heading2-spacing"
              min={LINE_SPACING_LIMITS.heading2.min}
              max={LINE_SPACING_LIMITS.heading2.max}
              step={0.05}
              value={[lineSpacing.heading2]}
              onValueChange={(value) => handleSpacingChange("heading2", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{LINE_SPACING_LIMITS.heading2.min}</span>
              <span>{LINE_SPACING_LIMITS.heading2.max}</span>
            </div>
          </div>

          {/* Heading 3 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading3-spacing">Heading 3 Line Spacing</Label>
              <span className="text-sm text-muted-foreground">{formatSpacing(lineSpacing.heading3)}</span>
            </div>
            <Slider
              id="heading3-spacing"
              min={LINE_SPACING_LIMITS.heading3.min}
              max={LINE_SPACING_LIMITS.heading3.max}
              step={0.05}
              value={[lineSpacing.heading3]}
              onValueChange={(value) => handleSpacingChange("heading3", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{LINE_SPACING_LIMITS.heading3.min}</span>
              <span>{LINE_SPACING_LIMITS.heading3.max}</span>
            </div>
          </div>

          {/* Body Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body-spacing">Body Text Line Spacing</Label>
              <span className="text-sm text-muted-foreground">{formatSpacing(lineSpacing.body)}</span>
            </div>
            <Slider
              id="body-spacing"
              min={LINE_SPACING_LIMITS.body.min}
              max={LINE_SPACING_LIMITS.body.max}
              step={0.05}
              value={[lineSpacing.body]}
              onValueChange={(value) => handleSpacingChange("body", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{LINE_SPACING_LIMITS.body.min}</span>
              <span>{LINE_SPACING_LIMITS.body.max}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Body text spacing is most important for readability. 1.4-1.6 is recommended for most documents.
            </p>
          </div>

          {/* Small Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="small-spacing">Small Text Line Spacing</Label>
              <span className="text-sm text-muted-foreground">{formatSpacing(lineSpacing.small)}</span>
            </div>
            <Slider
              id="small-spacing"
              min={LINE_SPACING_LIMITS.small.min}
              max={LINE_SPACING_LIMITS.small.max}
              step={0.05}
              value={[lineSpacing.small]}
              onValueChange={(value) => handleSpacingChange("small", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{LINE_SPACING_LIMITS.small.min}</span>
              <span>{LINE_SPACING_LIMITS.small.max}</span>
            </div>
          </div>

          {/* Footer Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="footer-spacing">Footer Text Line Spacing</Label>
              <span className="text-sm text-muted-foreground">{formatSpacing(lineSpacing.footer)}</span>
            </div>
            <Slider
              id="footer-spacing"
              min={LINE_SPACING_LIMITS.footer.min}
              max={LINE_SPACING_LIMITS.footer.max}
              step={0.05}
              value={[lineSpacing.footer]}
              onValueChange={(value) => handleSpacingChange("footer", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{LINE_SPACING_LIMITS.footer.min}</span>
              <span>{LINE_SPACING_LIMITS.footer.max}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Spacing Preview */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Line Spacing Preview</Label>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                lineHeight: lineSpacing.heading1,
              }}
            >
              Heading 1 Example
              <br />
              Multiple Line Heading ({formatSpacing(lineSpacing.heading1)})
            </div>

            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                lineHeight: lineSpacing.heading2,
              }}
            >
              Heading 2 Example
              <br />
              Multiple Line Heading ({formatSpacing(lineSpacing.heading2)})
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                lineHeight: lineSpacing.heading3,
              }}
            >
              Heading 3 Example
              <br />
              Multiple Line Heading ({formatSpacing(lineSpacing.heading3)})
            </div>

            <div
              style={{
                fontSize: "11px",
                lineHeight: lineSpacing.body,
              }}
            >
              Body text example with multiple lines to demonstrate line spacing. This paragraph shows how the line
              height affects readability and visual comfort. The spacing between these lines is set to{" "}
              {formatSpacing(lineSpacing.body)}. Proper line spacing is crucial for document readability, especially in
              longer texts where readers need to easily track from one line to the next.
            </div>

            <div
              style={{
                fontSize: "9px",
                lineHeight: lineSpacing.small,
                color: "#6b7280",
              }}
            >
              Small text example for captions and notes. This text uses a line spacing of{" "}
              {formatSpacing(lineSpacing.small)}. Even small text benefits from proper line spacing to maintain
              readability.
            </div>

            <div
              style={{
                fontSize: "8px",
                lineHeight: lineSpacing.footer,
                color: "#9ca3af",
              }}
            >
              Footer text example for page numbers and dates. Line spacing: {formatSpacing(lineSpacing.footer)}
              <br />
              Multiple line footer content to show spacing effect.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readability Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlignLeft className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Line Spacing Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Body text: 1.4-1.6 for optimal readability</li>
                <li>• Headings: 1.1-1.3 for compact, impactful appearance</li>
                <li>• Small text: 1.3-1.5 to maintain legibility</li>
                <li>• Accessibility: Use 1.5+ for body text when possible</li>
                <li>• Dense documents: Use tighter spacing to fit more content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
