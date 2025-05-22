"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Zap, AlignJustify } from "lucide-react"

export interface ParagraphSpacing {
  paragraphSpacing: number
  headingBottomSpacing: number
  headingTopSpacing: number
  sectionSpacing: number
  listItemSpacing: number
  blockElementSpacing: number
}

interface ParagraphSpacingControlsProps {
  paragraphSpacing: ParagraphSpacing
  onParagraphSpacingChange: (spacing: ParagraphSpacing) => void
  onPreview?: () => void
}

// Predefined paragraph spacing presets
const PARAGRAPH_SPACING_PRESETS = {
  compact: {
    name: "Compact",
    description: "Minimal spacing for dense documents",
    spacing: {
      paragraphSpacing: 6,
      headingBottomSpacing: 8,
      headingTopSpacing: 12,
      sectionSpacing: 15,
      listItemSpacing: 3,
      blockElementSpacing: 10,
    },
  },
  standard: {
    name: "Standard",
    description: "Balanced spacing for most documents",
    spacing: {
      paragraphSpacing: 10,
      headingBottomSpacing: 12,
      headingTopSpacing: 18,
      sectionSpacing: 25,
      listItemSpacing: 5,
      blockElementSpacing: 15,
    },
  },
  spacious: {
    name: "Spacious",
    description: "Generous spacing for easy reading",
    spacing: {
      paragraphSpacing: 15,
      headingBottomSpacing: 15,
      headingTopSpacing: 25,
      sectionSpacing: 35,
      listItemSpacing: 8,
      blockElementSpacing: 20,
    },
  },
  presentation: {
    name: "Presentation",
    description: "Optimized for slides and presentations",
    spacing: {
      paragraphSpacing: 18,
      headingBottomSpacing: 20,
      headingTopSpacing: 30,
      sectionSpacing: 45,
      listItemSpacing: 10,
      blockElementSpacing: 25,
    },
  },
}

// Spacing constraints
const SPACING_LIMITS = {
  paragraphSpacing: { min: 0, max: 30 },
  headingBottomSpacing: { min: 0, max: 30 },
  headingTopSpacing: { min: 0, max: 40 },
  sectionSpacing: { min: 0, max: 60 },
  listItemSpacing: { min: 0, max: 20 },
  blockElementSpacing: { min: 0, max: 40 },
}

export function ParagraphSpacingControls({
  paragraphSpacing,
  onParagraphSpacingChange,
  onPreview,
}: ParagraphSpacingControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const handleSpacingChange = (element: keyof ParagraphSpacing, value: number[]) => {
    const newSpacing = {
      ...paragraphSpacing,
      [element]: value[0],
    }
    onParagraphSpacingChange(newSpacing)
  }

  const applyPreset = (presetKey: string) => {
    const preset = PARAGRAPH_SPACING_PRESETS[presetKey as keyof typeof PARAGRAPH_SPACING_PRESETS]
    if (preset) {
      onParagraphSpacingChange(preset.spacing)
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

  const generateOptimalSpacing = () => {
    // Generate spacing based on typography best practices
    // Base spacing on the current paragraph spacing
    const baseSpacing = paragraphSpacing.paragraphSpacing

    const optimalSpacing: ParagraphSpacing = {
      paragraphSpacing: baseSpacing,
      headingBottomSpacing: Math.max(0, Math.min(30, baseSpacing * 1.2)),
      headingTopSpacing: Math.max(0, Math.min(40, baseSpacing * 1.8)),
      sectionSpacing: Math.max(0, Math.min(60, baseSpacing * 2.5)),
      listItemSpacing: Math.max(0, Math.min(20, baseSpacing * 0.5)),
      blockElementSpacing: Math.max(0, Math.min(40, baseSpacing * 1.5)),
    }

    onParagraphSpacingChange(optimalSpacing)
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
          <Label className="text-base font-medium">Spacing Presets</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateOptimalSpacing}>
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
          {Object.entries(PARAGRAPH_SPACING_PRESETS).map(([key, preset]) => (
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
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    Paragraph: {preset.spacing.paragraphSpacing}mm
                  </span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Section: {preset.spacing.sectionSpacing}mm</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Individual Controls */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Custom Spacing</Label>
        <p className="text-sm text-muted-foreground">
          Adjust the spacing between paragraphs, headings, and other elements in your documents. All values are in
          millimeters (mm).
        </p>

        <div className="grid gap-4">
          {/* Paragraph Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="paragraph-spacing">Paragraph Spacing</Label>
              <span className="text-sm text-muted-foreground">{paragraphSpacing.paragraphSpacing}mm</span>
            </div>
            <Slider
              id="paragraph-spacing"
              min={SPACING_LIMITS.paragraphSpacing.min}
              max={SPACING_LIMITS.paragraphSpacing.max}
              step={1}
              value={[paragraphSpacing.paragraphSpacing]}
              onValueChange={(value) => handleSpacingChange("paragraphSpacing", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SPACING_LIMITS.paragraphSpacing.min}mm</span>
              <span>{SPACING_LIMITS.paragraphSpacing.max}mm</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Space between paragraphs. Standard is 10mm, more for better readability.
            </p>
          </div>

          {/* Heading Bottom Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading-bottom-spacing">Heading Bottom Spacing</Label>
              <span className="text-sm text-muted-foreground">{paragraphSpacing.headingBottomSpacing}mm</span>
            </div>
            <Slider
              id="heading-bottom-spacing"
              min={SPACING_LIMITS.headingBottomSpacing.min}
              max={SPACING_LIMITS.headingBottomSpacing.max}
              step={1}
              value={[paragraphSpacing.headingBottomSpacing]}
              onValueChange={(value) => handleSpacingChange("headingBottomSpacing", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SPACING_LIMITS.headingBottomSpacing.min}mm</span>
              <span>{SPACING_LIMITS.headingBottomSpacing.max}mm</span>
            </div>
            <p className="text-xs text-muted-foreground">Space between a heading and the content that follows it.</p>
          </div>

          {/* Heading Top Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="heading-top-spacing">Heading Top Spacing</Label>
              <span className="text-sm text-muted-foreground">{paragraphSpacing.headingTopSpacing}mm</span>
            </div>
            <Slider
              id="heading-top-spacing"
              min={SPACING_LIMITS.headingTopSpacing.min}
              max={SPACING_LIMITS.headingTopSpacing.max}
              step={1}
              value={[paragraphSpacing.headingTopSpacing]}
              onValueChange={(value) => handleSpacingChange("headingTopSpacing", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SPACING_LIMITS.headingTopSpacing.min}mm</span>
              <span>{SPACING_LIMITS.headingTopSpacing.max}mm</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Space before a heading. Usually larger than bottom spacing to separate sections.
            </p>
          </div>

          {/* Section Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="section-spacing">Section Spacing</Label>
              <span className="text-sm text-muted-foreground">{paragraphSpacing.sectionSpacing}mm</span>
            </div>
            <Slider
              id="section-spacing"
              min={SPACING_LIMITS.sectionSpacing.min}
              max={SPACING_LIMITS.sectionSpacing.max}
              step={1}
              value={[paragraphSpacing.sectionSpacing]}
              onValueChange={(value) => handleSpacingChange("sectionSpacing", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SPACING_LIMITS.sectionSpacing.min}mm</span>
              <span>{SPACING_LIMITS.sectionSpacing.max}mm</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Space between major sections. Larger spacing helps organize content visually.
            </p>
          </div>

          {/* List Item Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="list-item-spacing">List Item Spacing</Label>
              <span className="text-sm text-muted-foreground">{paragraphSpacing.listItemSpacing}mm</span>
            </div>
            <Slider
              id="list-item-spacing"
              min={SPACING_LIMITS.listItemSpacing.min}
              max={SPACING_LIMITS.listItemSpacing.max}
              step={1}
              value={[paragraphSpacing.listItemSpacing]}
              onValueChange={(value) => handleSpacingChange("listItemSpacing", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SPACING_LIMITS.listItemSpacing.min}mm</span>
              <span>{SPACING_LIMITS.listItemSpacing.max}mm</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Space between items in a list. Usually less than paragraph spacing.
            </p>
          </div>

          {/* Block Element Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="block-element-spacing">Block Element Spacing</Label>
              <span className="text-sm text-muted-foreground">{paragraphSpacing.blockElementSpacing}mm</span>
            </div>
            <Slider
              id="block-element-spacing"
              min={SPACING_LIMITS.blockElementSpacing.min}
              max={SPACING_LIMITS.blockElementSpacing.max}
              step={1}
              value={[paragraphSpacing.blockElementSpacing]}
              onValueChange={(value) => handleSpacingChange("blockElementSpacing", value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SPACING_LIMITS.blockElementSpacing.min}mm</span>
              <span>{SPACING_LIMITS.blockElementSpacing.max}mm</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Space around block elements like tables, code blocks, and quotes.
            </p>
          </div>
        </div>
      </div>

      {/* Spacing Preview */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Spacing Preview</Label>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="border-b pb-2 mb-2">
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: `${paragraphSpacing.headingBottomSpacing}px`,
                }}
              >
                Document Title
              </div>
            </div>

            <div
              style={{
                marginTop: `${paragraphSpacing.headingTopSpacing}px`,
                marginBottom: `${paragraphSpacing.headingBottomSpacing}px`,
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>Section Heading</div>
            </div>

            <div style={{ fontSize: "12px" }}>
              This is a paragraph of text that demonstrates paragraph spacing. The space below this paragraph is set to{" "}
              {paragraphSpacing.paragraphSpacing}mm.
            </div>

            <div
              style={{
                marginTop: `${paragraphSpacing.paragraphSpacing}px`,
                fontSize: "12px",
              }}
            >
              This is another paragraph that follows the first one. The spacing between these paragraphs helps with
              readability and visual organization of content.
            </div>

            <div
              style={{
                marginTop: `${paragraphSpacing.sectionSpacing}px`,
                marginBottom: `${paragraphSpacing.headingBottomSpacing}px`,
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>Another Section</div>
            </div>

            <div style={{ fontSize: "12px" }}>
              This paragraph follows a section heading. The space between the heading and this paragraph is{" "}
              {paragraphSpacing.headingBottomSpacing}mm.
            </div>

            <div
              style={{
                marginTop: `${paragraphSpacing.paragraphSpacing}px`,
                fontSize: "12px",
              }}
            >
              <ul className="list-disc pl-5">
                <li>This is a list item</li>
                <li
                  style={{
                    marginTop: `${paragraphSpacing.listItemSpacing}px`,
                  }}
                >
                  This is another list item with {paragraphSpacing.listItemSpacing}mm spacing
                </li>
                <li
                  style={{
                    marginTop: `${paragraphSpacing.listItemSpacing}px`,
                  }}
                >
                  A third list item to demonstrate spacing
                </li>
              </ul>
            </div>

            <div
              style={{
                marginTop: `${paragraphSpacing.blockElementSpacing}px`,
                padding: "10px",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              This is a block element (like a code block or quote) with {paragraphSpacing.blockElementSpacing}mm spacing
              around it.
            </div>

            <div
              style={{
                marginTop: `${paragraphSpacing.blockElementSpacing}px`,
                fontSize: "12px",
              }}
            >
              This paragraph follows a block element. Proper spacing helps distinguish between different types of
              content.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spacing Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlignJustify className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Spacing Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Paragraph spacing: 8-12mm for most documents</li>
                <li>• Heading spacing: More space above (15-25mm) than below (8-15mm)</li>
                <li>• Section spacing: 20-30mm to clearly separate major sections</li>
                <li>• List items: 3-8mm between items for readability</li>
                <li>• Block elements: 15-20mm to distinguish from regular text</li>
                <li>• Presentation documents: Use more generous spacing (15-30mm)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
