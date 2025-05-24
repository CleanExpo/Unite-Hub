"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ParagraphSpacing } from "./paragraph-spacing-controls"

interface ParagraphSpacingPreviewProps {
  paragraphSpacing: ParagraphSpacing
  fontSizes?: {
    heading1: number
    heading2: number
    heading3: number
    body: number
    small: number
    footer: number
  }
  lineSpacing?: {
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

export function ParagraphSpacingPreview({
  paragraphSpacing,
  fontSizes = {
    heading1: 24,
    heading2: 18,
    heading3: 14,
    body: 12,
    small: 10,
    footer: 8,
  },
  lineSpacing = {
    heading1: 1.2,
    heading2: 1.25,
    heading3: 1.3,
    body: 1.5,
    small: 1.4,
    footer: 1.3,
  },
  headingFont = "helvetica",
  bodyFont = "helvetica",
}: ParagraphSpacingPreviewProps) {
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

  // Convert mm to px for preview (approximate conversion)
  const mmToPx = (mm: number) => mm * 3.78

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Document Spacing Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="border rounded-md p-4 bg-white overflow-auto max-h-[500px]">
          {/* Document Title */}
          <div
            style={{
              fontSize: `${fontSizes.heading1 * 0.6}px`,
              fontFamily: headingFontFamily,
              fontWeight: "bold",
              lineHeight: lineSpacing.heading1,
              color: "#1f2937",
              marginBottom: `${mmToPx(paragraphSpacing.headingBottomSpacing)}px`,
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            Annual Performance Report
          </div>

          {/* Introduction */}
          <div
            style={{
              fontSize: `${fontSizes.body * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.body,
              color: "#1f2937",
            }}
          >
            This document demonstrates the spacing between paragraphs, headings, and other elements based on your
            customized settings. Proper spacing improves readability and document organization.
          </div>

          {/* First Section Heading */}
          <div
            style={{
              fontSize: `${fontSizes.heading2 * 0.6}px`,
              fontFamily: headingFontFamily,
              fontWeight: "bold",
              lineHeight: lineSpacing.heading2,
              color: "#374151",
              marginTop: `${mmToPx(paragraphSpacing.headingTopSpacing)}px`,
              marginBottom: `${mmToPx(paragraphSpacing.headingBottomSpacing)}px`,
            }}
          >
            Executive Summary
          </div>

          {/* Paragraph after heading */}
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
          </div>

          {/* Second paragraph with paragraph spacing */}
          <div
            style={{
              fontSize: `${fontSizes.body * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.body,
              color: "#1f2937",
              marginTop: `${mmToPx(paragraphSpacing.paragraphSpacing)}px`,
            }}
          >
            Our findings indicate that continued investment in these areas will yield substantial returns. The data
            shows consistent growth patterns and improved customer satisfaction metrics across all measured categories.
          </div>

          {/* Subsection heading */}
          <div
            style={{
              fontSize: `${fontSizes.heading3 * 0.6}px`,
              fontFamily: headingFontFamily,
              fontWeight: "bold",
              lineHeight: lineSpacing.heading3,
              color: "#4b5563",
              marginTop: `${mmToPx(paragraphSpacing.headingTopSpacing * 0.8)}px`,
              marginBottom: `${mmToPx(paragraphSpacing.headingBottomSpacing * 0.8)}px`,
            }}
          >
            Key Performance Indicators
          </div>

          {/* List with list item spacing */}
          <ul
            style={{
              fontSize: `${fontSizes.body * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.body,
              color: "#1f2937",
              paddingLeft: "20px",
              listStyleType: "disc",
            }}
          >
            <li>Customer satisfaction increased by 18% year-over-year</li>
            <li style={{ marginTop: `${mmToPx(paragraphSpacing.listItemSpacing)}px` }}>
              Project completion time reduced by 15% on average
            </li>
            <li style={{ marginTop: `${mmToPx(paragraphSpacing.listItemSpacing)}px` }}>
              Team collaboration metrics improved by 22%
            </li>
            <li style={{ marginTop: `${mmToPx(paragraphSpacing.listItemSpacing)}px` }}>
              Cost efficiency increased by 12% across all departments
            </li>
          </ul>

          {/* Block element with block spacing */}
          <div
            style={{
              fontSize: `${fontSizes.small * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.small,
              color: "#4b5563",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              padding: "12px",
              marginTop: `${mmToPx(paragraphSpacing.blockElementSpacing)}px`,
            }}
          >
            <strong>Note:</strong> These metrics were collected from January through December 2024 and represent a
            comprehensive analysis of all business units. The methodology included both quantitative data analysis and
            qualitative feedback from stakeholders.
          </div>

          {/* New section with section spacing */}
          <div
            style={{
              fontSize: `${fontSizes.heading2 * 0.6}px`,
              fontFamily: headingFontFamily,
              fontWeight: "bold",
              lineHeight: lineSpacing.heading2,
              color: "#374151",
              marginTop: `${mmToPx(paragraphSpacing.sectionSpacing)}px`,
              marginBottom: `${mmToPx(paragraphSpacing.headingBottomSpacing)}px`,
            }}
          >
            Financial Performance
          </div>

          {/* Paragraph in new section */}
          <div
            style={{
              fontSize: `${fontSizes.body * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.body,
              color: "#1f2937",
            }}
          >
            The financial results for the fiscal year exceeded expectations in several key areas. Revenue growth
            outpaced projections by 8%, while operational costs were reduced by 5% through strategic efficiency
            initiatives.
          </div>

          {/* Table-like structure */}
          <div
            style={{
              marginTop: `${mmToPx(paragraphSpacing.blockElementSpacing)}px`,
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: "#f3f4f6",
                padding: "8px 12px",
                fontSize: `${fontSizes.small * 0.6}px`,
                fontFamily: headingFontFamily,
                fontWeight: "bold",
              }}
            >
              Financial Highlights
            </div>
            <div style={{ padding: "12px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: `${fontSizes.small * 0.6}px`,
                  fontFamily: bodyFontFamily,
                }}
              >
                <div>Revenue Growth:</div>
                <div>+12.5%</div>
                <div>Cost Reduction:</div>
                <div>-5.2%</div>
                <div>Profit Margin:</div>
                <div>18.7%</div>
                <div>Return on Investment:</div>
                <div>22.3%</div>
              </div>
            </div>
          </div>

          {/* Conclusion section */}
          <div
            style={{
              fontSize: `${fontSizes.heading2 * 0.6}px`,
              fontFamily: headingFontFamily,
              fontWeight: "bold",
              lineHeight: lineSpacing.heading2,
              color: "#374151",
              marginTop: `${mmToPx(paragraphSpacing.sectionSpacing)}px`,
              marginBottom: `${mmToPx(paragraphSpacing.headingBottomSpacing)}px`,
            }}
          >
            Conclusion and Recommendations
          </div>

          <div
            style={{
              fontSize: `${fontSizes.body * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.body,
              color: "#1f2937",
            }}
          >
            Based on the comprehensive analysis presented in this report, we recommend continuing the strategic
            initiatives that have driven our success this year. The data clearly indicates that our focus on customer
            experience, operational efficiency, and team collaboration has yielded significant results.
          </div>

          <div
            style={{
              fontSize: `${fontSizes.body * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.body,
              color: "#1f2937",
              marginTop: `${mmToPx(paragraphSpacing.paragraphSpacing)}px`,
            }}
          >
            For the upcoming fiscal year, we propose expanding these initiatives and implementing additional
            improvements based on the lessons learned. This approach will ensure continued growth and success across all
            business units.
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: `${fontSizes.footer * 0.6}px`,
              fontFamily: bodyFontFamily,
              lineHeight: lineSpacing.footer,
              color: "#9ca3af",
              marginTop: `${mmToPx(paragraphSpacing.blockElementSpacing * 1.5)}px`,
              borderTop: "1px solid #e5e7eb",
              paddingTop: "8px",
              textAlign: "center",
            }}
          >
            Annual Performance Report • Fiscal Year 2024 • Page 1 of 12
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
