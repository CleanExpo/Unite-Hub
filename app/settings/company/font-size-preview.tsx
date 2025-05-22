"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FontSizes } from "./font-size-controls"

interface FontSizePreviewProps {
  fontSizes: FontSizes
  headingFont?: string
  bodyFont?: string
}

export function FontSizePreview({
  fontSizes,
  headingFont = "helvetica",
  bodyFont = "helvetica",
}: FontSizePreviewProps) {
  const getFontFamily = (font: string) => {
    switch (font) {
      case "times":
        return "Times, serif"
      case "courier":
        return "Courier, monospace"
      case "georgia":
        return "Georgia, serif"
      case "arial":
      case "helvetica":
      default:
        return "Arial, sans-serif"
    }
  }

  const headingFontFamily = getFontFamily(headingFont)
  const bodyFontFamily = getFontFamily(bodyFont)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Live Font Size Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Title */}
        <div
          style={{
            fontSize: `${fontSizes.heading1 * 0.6}px`,
            fontFamily: headingFontFamily,
            fontWeight: "bold",
            lineHeight: 1.2,
            color: "#1f2937",
          }}
        >
          Project Report Title
        </div>

        {/* Section Heading */}
        <div
          style={{
            fontSize: `${fontSizes.heading2 * 0.6}px`,
            fontFamily: headingFontFamily,
            fontWeight: "bold",
            lineHeight: 1.3,
            color: "#374151",
            marginTop: "16px",
          }}
        >
          Executive Summary
        </div>

        {/* Subsection */}
        <div
          style={{
            fontSize: `${fontSizes.heading3 * 0.6}px`,
            fontFamily: headingFontFamily,
            fontWeight: "bold",
            lineHeight: 1.4,
            color: "#4b5563",
          }}
        >
          Key Findings
        </div>

        {/* Body Text */}
        <div
          style={{
            fontSize: `${fontSizes.body * 0.6}px`,
            fontFamily: bodyFontFamily,
            lineHeight: 1.6,
            color: "#1f2937",
          }}
        >
          This comprehensive analysis reveals significant improvements in project efficiency and team collaboration. The
          implementation of new methodologies has resulted in a 25% increase in productivity across all departments. Our
          findings indicate that continued investment in these areas will yield substantial returns.
        </div>

        {/* Small Text */}
        <div
          style={{
            fontSize: `${fontSizes.small * 0.6}px`,
            fontFamily: bodyFontFamily,
            lineHeight: 1.4,
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          Figure 1: Performance metrics comparison (Q3 2024 vs Q4 2024)
        </div>

        {/* Table Header Example */}
        <div className="border rounded p-2 bg-gray-50">
          <div
            style={{
              fontSize: `${fontSizes.heading3 * 0.6}px`,
              fontFamily: headingFontFamily,
              fontWeight: "bold",
              lineHeight: 1.3,
              color: "#1f2937",
              marginBottom: "8px",
            }}
          >
            Performance Metrics
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                fontWeight: "bold",
              }}
            >
              Metric
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                fontWeight: "bold",
              }}
            >
              Q3 2024
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                fontWeight: "bold",
              }}
            >
              Q4 2024
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
              }}
            >
              Efficiency
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
              }}
            >
              78%
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
              }}
            >
              97%
            </div>
          </div>
        </div>

        {/* Footer Example */}
        <div className="border-t pt-2 mt-4">
          <div
            style={{
              fontSize: `${fontSizes.footer * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: 1.3,
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            Generated on {new Date().toLocaleDateString()} • Page 1 of 5 • Confidential
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
