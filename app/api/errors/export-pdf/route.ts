import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { createStyledPDFWithBranding, StyledPDF } from "@/lib/pdf-styling"
import { createProjectReportPDF, createTaskReportPDF, createUserReportPDF } from "@/lib/pdf-templates"

export async function POST(request: Request) {
  try {
    logger.info("PDF export request received")

    const { content, filename = "export.pdf", type = "generic", data = {}, options = {} } = await request.json()

    if (!content && type === "generic") {
      logger.warn("PDF export request missing content for generic type")
      return NextResponse.json(
        {
          success: false,
          error: "Content is required for generic PDF exports",
        },
        { status: 400 },
      )
    }

    logger.info(`Generating ${type} PDF with filename: ${filename}`)

    let doc: any

    // Generate PDF based on type
    try {
      switch (type) {
        case "preview":
          // Create a preview PDF with custom colors and fonts
          doc = new StyledPDF({
            headerText: options.headerText || "Preview",
            colorScheme: "custom",
            customColors: options.customColors,
            companyName: "Your Company",
            fontSettings: options.fontSettings,
          })

          // Try to load custom font if specified
          if (options.fontSettings?.useCustomFont && options.fontSettings?.customFontUrl) {
            try {
              await doc.addCustomFont(
                options.fontSettings.customFontUrl,
                options.fontSettings.customFontName || "CustomFont",
              )
            } catch (error) {
              console.error("Error loading custom font for preview:", error)
            }
          }

          // Add content to the PDF
          const previewLines = content.split("\n")

          previewLines.forEach((line: string) => {
            // Simple markdown-like parsing
            if (line.startsWith("# ")) {
              doc.addHeading(line.substring(2), 1)
            } else if (line.startsWith("## ")) {
              doc.addHeading(line.substring(3), 2)
            } else if (line.startsWith("### ")) {
              doc.addHeading(line.substring(4), 3)
            } else if (line.startsWith("---")) {
              doc.addHorizontalLine()
            } else if (line.trim() === "") {
              doc.addSpacer(5)
            } else {
              doc.addParagraph(line)
            }
          })

          // Add a font sample section
          doc.addSpacer(10)
          doc.addHeading("Font Samples", 2)

          // Heading font sample
          doc.addParagraph("Heading Font Sample", {
            fontSize: 14,
            style: "bold",
            font: options.fontSettings?.headingFont || "helvetica",
          })
          doc.addParagraph("ABCDEFGHIJKLMNOPQRSTUVWXYZ", {
            fontSize: 12,
            font: options.fontSettings?.headingFont || "helvetica",
          })
          doc.addParagraph("abcdefghijklmnopqrstuvwxyz 0123456789", {
            fontSize: 12,
            font: options.fontSettings?.headingFont || "helvetica",
          })

          doc.addSpacer(5)

          // Body font sample
          doc.addParagraph("Body Font Sample", {
            fontSize: 14,
            style: "bold",
            font: options.fontSettings?.bodyFont || "helvetica",
          })
          doc.addParagraph("ABCDEFGHIJKLMNOPQRSTUVWXYZ", {
            fontSize: 12,
            font: options.fontSettings?.bodyFont || "helvetica",
          })
          doc.addParagraph("abcdefghijklmnopqrstuvwxyz 0123456789", {
            fontSize: 12,
            font: options.fontSettings?.bodyFont || "helvetica",
          })

          // Custom font sample if available
          if (options.fontSettings?.useCustomFont && doc.customFontLoaded) {
            doc.addSpacer(5)
            doc.addParagraph("Custom Font Sample", {
              fontSize: 14,
              style: "bold",
            })
            doc.addParagraph("ABCDEFGHIJKLMNOPQRSTUVWXYZ", {
              fontSize: 12,
            })
            doc.addParagraph("abcdefghijklmnopqrstuvwxyz 0123456789", {
              fontSize: 12,
            })
          }

          break
        case "project":
          doc = await createProjectReportPDF(data.project, data.tasks || [], data.members || [])
          break
        case "task":
          doc = await createTaskReportPDF(data.task, data.comments || [])
          break
        case "user":
          doc = await createUserReportPDF(data.user, data.projects || [], data.tasks || [])
          break
        case "generic":
        default:
          // Create a styled PDF for generic content with company branding
          doc = await createStyledPDFWithBranding({
            headerText: options.headerText || "Document",
            colorScheme: options.colorScheme || "custom",
            customColors: options.customColors,
            fontSettings: options.fontSettings,
          } as any)

          // Add content to the PDF
          const lines = content.split("\n")

          lines.forEach((line: string) => {
            // Simple markdown-like parsing
            if (line.startsWith("# ")) {
              doc.addHeading(line.substring(2), 1)
            } else if (line.startsWith("## ")) {
              doc.addHeading(line.substring(3), 2)
            } else if (line.startsWith("### ")) {
              doc.addHeading(line.substring(4), 3)
            } else if (line.startsWith("---")) {
              doc.addHorizontalLine()
            } else if (line.trim() === "") {
              doc.addSpacer(5)
            } else {
              doc.addParagraph(line)
            }
          })
          break
      }
    } catch (error) {
      logger.error(`Error generating ${type} PDF:`, error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate ${type} PDF. The server may be missing required dependencies.`,
          details: error instanceof Error ? error.message : "Unknown error",
          fallbackUrl: `/api/fallback-pdf?type=${type}&filename=${encodeURIComponent(filename)}`,
        },
        { status: 500 },
      )
    }

    if (!doc) {
      logger.error("PDF document was not created")
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate PDF document",
          fallbackUrl: `/api/fallback-pdf?type=${type}&filename=${encodeURIComponent(filename)}`,
        },
        { status: 500 },
      )
    }

    try {
      // Convert to base64
      const pdfBase64 = doc.output("datauristring")

      logger.info("PDF generated successfully")

      return NextResponse.json({
        success: true,
        data: pdfBase64,
        filename,
      })
    } catch (error) {
      logger.error("Error converting PDF to base64:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to convert PDF to base64",
          details: error instanceof Error ? error.message : "Unknown error",
          fallbackUrl: `/api/fallback-pdf?type=${type}&filename=${encodeURIComponent(filename)}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("PDF generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
        fallbackUrl: `/api/fallback-pdf?type=generic&filename=export.pdf`,
      },
      { status: 500 },
    )
  }
}
