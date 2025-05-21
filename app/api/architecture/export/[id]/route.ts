import { type NextRequest, NextResponse } from "next/server"
import { generateSimplePDF } from "@/lib/simple-pdf-generator"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id

    // Mock project data for demonstration
    // In a real app, you would fetch this from your database
    const project = {
      id: projectId,
      name: "Architecture Project",
      description: "This is a sample architecture project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      client: "Sample Client",
      budget: "$10,000",
      timeline: "3 months",
    }

    // Generate the PDF
    const pdfBlob = await generateSimplePDF(project)

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="architecture-blueprint-${projectId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
