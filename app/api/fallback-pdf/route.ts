import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { generateSimplePDF } from "@/lib/pdf-fallback"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "generic"
    const filename = searchParams.get("filename") || "export.pdf"

    logger.info(`Fallback PDF request received for type: ${type}, filename: ${filename}`)

    // Generate a simple PDF without canvas dependency
    const pdfBase64 = await generateSimplePDF({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Export`,
      content: "This is a fallback PDF generated because the full PDF generation service is unavailable.",
      filename,
    })

    return NextResponse.json({
      success: true,
      data: pdfBase64,
      filename,
      fallback: true,
    })
  } catch (error) {
    logger.error("Fallback PDF generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate fallback PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
