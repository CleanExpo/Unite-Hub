"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LineSpacing } from "./line-spacing-controls"

interface LineSpacingPreviewProps {
  lineSpacing: LineSpacing
  fontSizes?: {
    heading1: number
    heading2: number
    heading3: number
    body: number
    small: number
    footer: number
  }
  headingFont?: string
  bodyFont?: string
}

export function LineSpacingPreview({
  lineSpacing,
  fontSizes = {
    heading1: 24,
    heading2: 18,
    heading3: 14,
    body: 12,
    small: 10,
    footer: 8,
  },
  headingFont = "helvetica",
  bodyFont = "helvetica",
}: LineSpacingPreviewProps) {
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
        <CardTitle className="text-sm">Live Line Spacing Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Title */}
        <div
          style={{
            fontSize: `${fontSizes.heading1 * 0.6}px`,
            fontFamily: headingFontFamily,
            fontWeight: "bold",
            lineHeight: lineSpacing.heading1,
            color: "#1f2937",
          }}
        >
          Annual Performance Report
          <br />
          Comprehensive Analysis and Insights
        </div>

        {/* Section Heading */}
        <div
          style={{
            fontSize: `${fontSizes.heading2 * 0.6}px`,
            fontFamily: headingFontFamily,
            fontWeight: "bold",
            lineHeight: lineSpacing.heading2,
            color: "#374151",
            marginTop: "20px",
          }}
        >
          Executive Summary
          <br />
          Key Performance Indicators
        </div>

        {/* Subsection */}
        <div
          style={{
            fontSize: `${fontSizes.heading3 * 0.6}px`,
            fontFamily: headingFontFamily,
            fontWeight: "bold",
            lineHeight: lineSpacing.heading3,
            color: "#4b5563",
          }}
        >
          Quarterly Results Overview
          <br />
          Financial Performance Metrics
        </div>

        {/* Body Text */}
        <div
          style={{
            fontSize: `${fontSizes.body * 0.6}px`,
            fontFamily: bodyFontFamily,
            lineHeight: lineSpacing.body,
            color: "#1f2937",
          }}
        >
          This comprehensive analysis reveals significant improvements in project efficiency and team collaboration
          throughout the fiscal year. The implementation of new methodologies has resulted in a 25% increase in
          productivity across all departments.
          <br />
          <br />
          Our findings indicate that continued investment in these areas will yield substantial returns. The data shows
          consistent growth patterns and improved customer satisfaction metrics across all measured categories.
          <br />
          <br />
          Furthermore, the strategic initiatives implemented during Q3 have demonstrated measurable impact on both
          operational efficiency and employee engagement levels.
        </div>

        {/* Small Text */}
        <div
          style={{
            fontSize: `${fontSizes.small * 0.6}px`,
            fontFamily: bodyFontFamily,
            lineHeight: lineSpacing.small,
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          Figure 1: Performance metrics comparison showing quarterly improvements
          <br />
          Data collected from January 2024 through December 2024
          <br />
          Source: Internal analytics and customer feedback systems
        </div>

        {/* Table Example */}
        <div className="border rounded p-3 bg-gray-50">
          <div
            style={{
              fontSize: `${fontSizes.heading3 * 0.6}px`,
              fontFamily: headingFontFamily,
              fontWeight: "bold",
              lineHeight: lineSpacing.heading3,
              color: "#1f2937",
              marginBottom: "12px",
            }}
          >
            Performance Metrics Summary
            <br />
            Year-over-Year Comparison
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                fontWeight: "bold",
                lineHeight: lineSpacing.small,
              }}
            >
              Metric Category
              <br />
              Performance Indicator
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                fontWeight: "bold",
                lineHeight: lineSpacing.small,
              }}
            >
              2023 Results
              <br />
              Previous Year
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                fontWeight: "bold",
                lineHeight: lineSpacing.small,
              }}
            >
              2024 Results
              <br />
              Current Year
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                lineHeight: lineSpacing.small,
              }}
            >
              Efficiency Rating
              <br />
              Overall Performance
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                lineHeight: lineSpacing.small,
              }}
            >
              78% Average
              <br />
              Baseline Measurement
            </div>
            <div
              style={{
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: bodyFontFamily,
                lineHeight: lineSpacing.small,
              }}
            >
              97% Average
              <br />
              Improved Performance
            </div>
          </div>
        </div>

        {/* Footer Example */}
        <div className="border-t pt-3 mt-6">
          <div
            style={{
              fontSize: `${fontSizes.footer * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.footer,
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            Generated on {new Date().toLocaleDateString()} • Page 1 of 12 • Confidential Document
            <br />
            Internal Use Only • Performance Review Committee • Annual Report 2024
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
