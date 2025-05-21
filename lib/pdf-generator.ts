import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { ArchitectureProject } from "@/lib/architecture-schema"

// Add the missing type for jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generateArchitecturePDF(project: ArchitectureProject): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set document properties
  doc.setProperties({
    title: `Architecture Blueprint - ${project.name}`,
    subject: "Software Architecture Blueprint",
    author: "Streamline Architecture",
    creator: "Architecture Blueprint Generator",
  })

  // Add logo and header
  try {
    // Try to load the logo image
    const logoImg = new Image()
    logoImg.src = "/logo.png"
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve
      logoImg.onerror = reject
      // Set a timeout in case the image never loads
      setTimeout(reject, 3000)
    })

    // Add logo to the PDF
    doc.addImage(logoImg, "PNG", 10, 10, 30, 15)
  } catch (error) {
    console.error("Failed to load logo image:", error)
    // Continue without the logo
  }

  // Add title
  doc.setFontSize(22)
  doc.setTextColor(44, 62, 80)
  doc.text("Architecture Blueprint", 105, 20, { align: "center" })

  // Add project name
  doc.setFontSize(18)
  doc.text(project.name, 105, 30, { align: "center" })

  // Add date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Generated on: ${new Date().toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    105,
    35,
    { align: "center" },
  )

  // Add project overview section
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text("Project Overview", 14, 45)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, 47, 196, 47)

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)

  // Project details table
  const projectDetails = [
    ["Project ID:", project.id],
    ["Status:", project.status.charAt(0).toUpperCase() + project.status.slice(1)],
    ["Created:", new Date(project.createdAt).toLocaleDateString("en-AU")],
    ["Total Story Points:", project.totalPoints?.toString() || "N/A"],
    ["Estimated Hours:", project.totalHours?.toString() || "N/A"],
    ["Budget:", project.budget ? `$${project.budget.toLocaleString()}` : "N/A"],
  ]

  doc.autoTable({
    startY: 50,
    head: [],
    body: projectDetails,
    theme: "plain",
    styles: {
      cellPadding: 1,
      fontSize: 10,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: "auto" },
    },
  })

  // Add reality check if exists
  if (project.realityCheck) {
    const currentY = (doc as any).lastAutoTable.finalY + 10

    doc.setFillColor(255, 248, 225)
    doc.rect(14, currentY, 182, 20, "F")

    doc.setFontSize(12)
    doc.setTextColor(176, 132, 0)
    doc.text("Reality Check", 20, currentY + 6)

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(project.realityCheck, 20, currentY + 12, {
      maxWidth: 170,
    })
  }

  // Add MVP Features section
  let currentY = project.realityCheck ? (doc as any).lastAutoTable.finalY + 35 : (doc as any).lastAutoTable.finalY + 15

  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text("MVP Features", 14, currentY)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, currentY + 2, 196, currentY + 2)

  // MVP Features table
  if (project.roadmap?.mvp.features && project.roadmap.mvp.features.length > 0) {
    const mvpFeatures = project.roadmap.mvp.features.map((feature) => [
      feature.name,
      feature.description,
      feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1),
      feature.complexity.toUpperCase(),
      feature.points,
      feature.hours,
    ])

    doc.autoTable({
      startY: currentY + 5,
      head: [["Feature", "Description", "Priority", "Complexity", "Points", "Hours"]],
      body: mvpFeatures,
      theme: "striped",
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        cellPadding: 2,
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
      },
    })
  } else {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("No MVP features defined.", 14, currentY + 10)
    currentY += 15
  }

  // Check if we need a new page for future features
  if ((doc as any).lastAutoTable.finalY > 230) {
    doc.addPage()
    currentY = 20
  } else {
    currentY = (doc as any).lastAutoTable.finalY + 15
  }

  // Add Future Features section
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text("Future Features", 14, currentY)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, currentY + 2, 196, currentY + 2)

  // Future Features table
  if (project.roadmap?.future.features && project.roadmap.future.features.length > 0) {
    const futureFeatures = project.roadmap.future.features.map((feature) => [
      feature.name,
      feature.description,
      feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1),
      feature.complexity.toUpperCase(),
      feature.points,
      feature.hours,
    ])

    doc.autoTable({
      startY: currentY + 5,
      head: [["Feature", "Description", "Priority", "Complexity", "Points", "Hours"]],
      body: futureFeatures,
      theme: "striped",
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        cellPadding: 2,
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
      },
    })
  } else {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("No future features defined.", 14, currentY + 10)
    currentY += 15
  }

  // Check if we need a new page for integrations
  if ((doc as any).lastAutoTable.finalY > 230) {
    doc.addPage()
    currentY = 20
  } else {
    currentY = (doc as any).lastAutoTable.finalY + 15
  }

  // Add Integrations section
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text("Integrations", 14, currentY)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, currentY + 2, 196, currentY + 2)

  // Integrations table
  if (project.roadmap?.integrations && project.roadmap.integrations.length > 0) {
    const integrations = project.roadmap.integrations.map((integration) => [
      integration.name,
      integration.purpose,
      integration.apiDocumentation || "N/A",
    ])

    doc.autoTable({
      startY: currentY + 5,
      head: [["Integration", "Purpose", "API Documentation"]],
      body: integrations,
      theme: "striped",
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        cellPadding: 2,
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: "bold" },
      },
    })
  } else {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("No integrations defined.", 14, currentY + 10)
    currentY += 15
  }

  // Check if we need a new page for personas
  if ((doc as any).lastAutoTable.finalY > 230) {
    doc.addPage()
    currentY = 20
  } else {
    currentY = (doc as any).lastAutoTable.finalY + 15
  }

  // Add User Personas section
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text("User Personas", 14, currentY)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, currentY + 2, 196, currentY + 2)

  // Personas
  if (project.personas && project.personas.length > 0) {
    let personaY = currentY + 10

    for (const persona of project.personas) {
      // Check if we need a new page
      if (personaY > 250) {
        doc.addPage()
        personaY = 20
      }

      doc.setFillColor(240, 240, 240)
      doc.rect(14, personaY, 182, 30, "F")

      doc.setFontSize(12)
      doc.setTextColor(44, 62, 80)
      doc.text(`${persona.name} - ${persona.role}`, 20, personaY + 6)

      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text("Goals:", 20, personaY + 12)
      doc.text(persona.goals, 40, personaY + 12, { maxWidth: 150 })

      doc.text("Pain Points:", 20, personaY + 20)
      doc.text(persona.painPoints, 40, personaY + 20, { maxWidth: 150 })

      personaY += 35
    }

    currentY = personaY
  } else {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("No personas defined.", 14, currentY + 10)
    currentY += 15
  }

  // Check if we need a new page for constraints
  if (currentY > 230) {
    doc.addPage()
    currentY = 20
  } else {
    currentY += 15
  }

  // Add Constraints section
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text("Constraints & Preferences", 14, currentY)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, currentY + 2, 196, currentY + 2)

  // Constraints table
  const constraints = [
    ["Technical Constraints", project.technicalConstraints || "None specified"],
    ["Business Constraints", project.businessConstraints || "None specified"],
    ["Preferred Technologies", project.preferredTechnologies || "None specified"],
  ]

  doc.autoTable({
    startY: currentY + 5,
    head: [],
    body: constraints,
    theme: "plain",
    styles: {
      cellPadding: 3,
      fontSize: 10,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" },
    },
  })

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${pageCount} | Confidential - ${project.name} Architecture Blueprint`, 105, 290, {
      align: "center",
    })
  }

  // Return the PDF as a blob
  return doc.output("blob")
}
