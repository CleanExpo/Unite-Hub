import { type NextRequest, NextResponse } from "next/server"
import { generatePDF } from "@/lib/pdf-generator"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id

    // Get the project data from the database
    const supabase = createClient()
    const { data: project, error } = await supabase
      .from("architecture_projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Generate the PDF
    const doc = await generatePDF(project)

    // Convert to blob
    const pdfBlob = doc.output("blob")

    // Convert blob to ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer()

    // Return the PDF as a response
    return new NextResponse(arrayBuffer, {
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
