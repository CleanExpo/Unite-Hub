import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { createStyledPDFWithBranding } from "@/lib/pdf-styling"
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
          // Create a basic preview PDF
          doc = await createStyledPDFWithBranding({
            headerText: options.headerText || "Preview",
          })

          // Add basic content to the PDF
          doc.setFontSize(16)
          doc.text("PDF Preview", 20, 30)
          
          doc.setFontSize(12)
          const lines = content.split("\n")
          let yPosition = 50
          
          lines.forEach((line: string) => {
            if (line.trim()) {
              doc.text(line, 20, yPosition)
              yPosition += 10
            }
          })
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
          })

          // Add basic content to the PDF
          doc.setFontSize(16)
          doc.text("Document", 20, 30)
          
          doc.setFontSize(12)
          const contentLines = content.split("\n")
          let yPos = 50
          
          contentLines.forEach((line: string) => {
            if (line.trim()) {
              doc.text(line, 20, yPos)
              yPos += 10
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
