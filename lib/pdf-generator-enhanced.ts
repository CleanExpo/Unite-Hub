import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { ArchitectureProject } from "@/lib/architecture-schema"
import type { PDFBrandingFormData } from "@/types/pdf-branding"

// Add the missing type for jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generateCustomPDF(project: ArchitectureProject, settings: PDFBrandingFormData): Promise<Blob> {
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
    author: settings.companyName || "Streamline Architecture",
    creator: "Architecture Blueprint Generator",
  })

  // Apply font family
  doc.setFont(settings.fontFamily)

  // Parse colors
  const primaryColor = hexToRgb(settings.primaryColor)
  const secondaryColor = hexToRgb(settings.secondaryColor)
  const accentColor = hexToRgb(settings.accentColor)

  // Add watermark if specified
  if (settings.watermark) {
    const watermarkPages = doc.getNumberOfPages()
    for (let i = 1; i <= watermarkPages; i++) {
      doc.setPage(i)
      doc.setTextColor(230, 230, 230)
      doc.setFontSize(60)
      doc.text(settings.watermark, 105, 150, {
        align: "center",
        angle: 45,
      })
    }
  }

  // Add cover page if enabled
  if (settings.includeCoverPage) {
    addCoverPage(doc, project, settings, primaryColor, secondaryColor, accentColor)
    doc.addPage()
  }

  // Current Y position tracker
  let currentY = settings.includeCoverPage ? 20 : 40

  // Add logo and header if not on cover page or if cover page is disabled
  if (!settings.includeCoverPage) {
    try {
      // Try to load the logo image if provided
      if (settings.logo) {
        const logoImg = new Image()
        logoImg.src = settings.logo
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
          // Set a timeout in case the image never loads
          setTimeout(reject, 3000)
        })

        // Add logo to the PDF
        doc.addImage(logoImg, "PNG", 10, 10, 30, 15)
      }
    } catch (error) {
      console.error("Failed to load logo image:", error)
      // Continue without the logo
    }

    // Add title
    doc.setFontSize(22)
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
    doc.text(settings.headerTitle || "Architecture Blueprint", 105, 20, { align: "center" })

    // Add project name
    doc.setFontSize(18)
    doc.text(project.name, 105, 30, { align: "center" })

    // Add date if timestamp is enabled
    if (settings.includeTimestamp) {
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
    }
  }

  // Add project overview section
  doc.setFontSize(14)
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text("Project Overview", 14, currentY)

  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
  doc.line(14, currentY + 2, 196, currentY + 2)

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
    startY: currentY + 5,
    head: [],
    body: projectDetails,
    theme: "plain",
    styles: {
      cellPadding: 1,
      fontSize: 10,
      fontStyle: settings.fontFamily,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: "auto" },
    },
  })

  // Add reality check if exists
  if (project.realityCheck) {
    currentY = (doc as any).lastAutoTable.finalY + 10

    doc.setFillColor(255, 248, 225)
    doc.rect(14, currentY, 182, 20, "F")

    doc.setFontSize(12)
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b)
    doc.text("Reality Check", 20, currentY + 6)

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(project.realityCheck, 20, currentY + 12, {
      maxWidth: 170,
    })
  }

  // Add MVP Features section
  currentY = project.realityCheck ? (doc as any).lastAutoTable.finalY + 35 : (doc as any).lastAutoTable.finalY + 15

  doc.setFontSize(14)
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text("MVP Features", 14, currentY)

  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
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
        fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        cellPadding: 2,
        fontSize: 9,
        fontStyle: settings.fontFamily,
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
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text("Future Features", 14, currentY)

  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
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
        fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        cellPadding: 2,
        fontSize: 9,
        fontStyle: settings.fontFamily,
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
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text("Integrations", 14, currentY)

  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
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
        fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        cellPadding: 2,
        fontSize: 9,
        fontStyle: settings.fontFamily,
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
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text("User Personas", 14, currentY)

  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
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

      doc.setFillColor(245, 245, 245)
      doc.rect(14, personaY, 182, 30, "F")

      doc.setFontSize(12)
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
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
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text("Constraints & Preferences", 14, currentY)

  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
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
      fontStyle: settings.fontFamily,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" },
    },
  })

  // Add footer with page numbers if enabled
  if (settings.includePageNumbers) {
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)

      let footerText = `Page ${i} of ${pageCount}`

      if (settings.footerText) {
        footerText += ` | ${settings.footerText}`
      }

      if (settings.companyName) {
        footerText += ` | ${settings.companyName}`
      }

      doc.text(footerText, 105, 290, {
        align: "center",
      })
    }
  }

  // Return the PDF as a blob
  return doc.output("blob")
}

// Helper function to add a cover page
function addCoverPage(
  doc: jsPDF,
  project: ArchitectureProject,
  settings: PDFBrandingFormData,
  primaryColor: { r: number; g: number; b: number },
  secondaryColor: { r: number; g: number; b: number },
  accentColor: { r: number; g: number; b: number },
) {
  // Apply template style
  switch (settings.templateStyle) {
    case "modern":
      addModernCoverPage(doc, project, settings, primaryColor, secondaryColor, accentColor)
      break
    case "minimal":
      addMinimalCoverPage(doc, project, settings, primaryColor, secondaryColor, accentColor)
      break
    case "bold":
      addBoldCoverPage(doc, project, settings, primaryColor, secondaryColor, accentColor)
      break
    case "classic":
    default:
      addClassicCoverPage(doc, project, settings, primaryColor, secondaryColor, accentColor)
      break
  }
}

// Classic cover page
function addClassicCoverPage(
  doc: jsPDF,
  project: ArchitectureProject,
  settings: PDFBrandingFormData,
  primaryColor: { r: number; g: number; b: number },
  secondaryColor: { r: number; g: number; b: number },
  accentColor: { r: number; g: number; b: number },
) {
  // Add background color
  doc.setFillColor(250, 250, 250)
  doc.rect(0, 0, 210, 297, "F")

  // Add header bar
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.rect(0, 0, 210, 40, "F")

  // Add logo if available
  if (settings.logo) {
    try {
      const logoImg = new Image()
      logoImg.src = settings.logo
      doc.addImage(logoImg, "PNG", 15, 10, 40, 20)
    } catch (error) {
      console.error("Failed to add logo to cover page:", error)
    }
  }

  // Add title
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text("Architecture Blueprint", 105, 25, { align: "center" })

  // Add project name
  doc.setFontSize(36)
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text(project.name, 105, 80, { align: "center" })

  // Add divider
  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
  doc.setLineWidth(1)
  doc.line(50, 90, 160, 90)

  // Add project details
  doc.setFontSize(14)
  doc.setTextColor(60, 60, 60)

  let detailsY = 110

  if (project.totalPoints) {
    doc.text(`Story Points: ${project.totalPoints}`, 105, detailsY, { align: "center" })
    detailsY += 10
  }

  if (project.totalHours) {
    doc.text(`Estimated Hours: ${project.totalHours}`, 105, detailsY, { align: "center" })
    detailsY += 10
  }

  if (project.budget) {
    doc.text(`Budget: $${project.budget.toLocaleString()}`, 105, detailsY, { align: "center" })
    detailsY += 10
  }

  // Add timestamp if enabled
  if (settings.includeTimestamp) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      105,
      detailsY + 10,
      { align: "center" },
    )
  }

  // Add company info
  if (settings.companyName) {
    doc.setFontSize(16)
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
    doc.text(settings.companyName, 105, 240, { align: "center" })

    if (settings.contactInfo) {
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      doc.text(settings.contactInfo, 105, 250, { align: "center" })
    }
  }

  // Add footer
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.rect(0, 277, 210, 20, "F")
}

// Modern cover page
function addModernCoverPage(
  doc: jsPDF,
  project: ArchitectureProject,
  settings: PDFBrandingFormData,
  primaryColor: { r: number; g: number; b: number },
  secondaryColor: { r: number; g: number; b: number },
  accentColor: { r: number; g: number; b: number },
) {
  // Add background color
  doc.setFillColor(250, 250, 250)
  doc.rect(0, 0, 210, 297, "F")

  // Add side bar
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.rect(0, 0, 60, 297, "F")

  // Add accent bar
  doc.setFillColor(accentColor.r, accentColor.g, accentColor.b)
  doc.rect(60, 0, 5, 297, "F")

  // Add logo if available
  if (settings.logo) {
    try {
      const logoImg = new Image()
      logoImg.src = settings.logo
      doc.addImage(logoImg, "PNG", 10, 20, 40, 20)
    } catch (error) {
      console.error("Failed to add logo to cover page:", error)
    }
  }

  // Add title
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text("Architecture", 30, 80, { align: "center" })
  doc.text("Blueprint", 30, 90, { align: "center" })

  // Add project name
  doc.setFontSize(36)
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text(project.name, 135, 80, { align: "center" })

  // Add divider
  doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
  doc.setLineWidth(1)
  doc.line(80, 90, 190, 90)

  // Add project details
  doc.setFontSize(14)
  doc.setTextColor(60, 60, 60)

  let detailsY = 110

  if (project.totalPoints) {
    doc.text(`Story Points: ${project.totalPoints}`, 135, detailsY, { align: "center" })
    detailsY += 10
  }

  if (project.totalHours) {
    doc.text(`Estimated Hours: ${project.totalHours}`, 135, detailsY, { align: "center" })
    detailsY += 10
  }

  if (project.budget) {
    doc.text(`Budget: $${project.budget.toLocaleString()}`, 135, detailsY, { align: "center" })
    detailsY += 10
  }

  // Add timestamp if enabled
  if (settings.includeTimestamp) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      135,
      detailsY + 10,
      { align: "center" },
    )
  }

  // Add company info
  if (settings.companyName) {
    doc.setFontSize(16)
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
    doc.text(settings.companyName, 135, 240, { align: "center" })

    if (settings.contactInfo) {
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      doc.text(settings.contactInfo, 135, 250, { align: "center" })
    }
  }
}

// Minimal cover page
function addMinimalCoverPage(
  doc: jsPDF,
  project: ArchitectureProject,
  settings: PDFBrandingFormData,
  primaryColor: { r: number; g: number; b: number },
  secondaryColor: { r: number; g: number; b: number },
  accentColor: { r: number; g: number; b: number },
) {
  // Add background color
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, 210, 297, "F")

  // Add thin top border
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.rect(0, 0, 210, 5, "F")

  // Add logo if available
  if (settings.logo) {
    try {
      const logoImg = new Image()
      logoImg.src = settings.logo
      doc.addImage(logoImg, "PNG", 15, 20, 40, 20)
    } catch (error) {
      console.error("Failed to add logo to cover page:", error)
    }
  }

  // Add title
  doc.setFontSize(16)
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.text("ARCHITECTURE BLUEPRINT", 105, 60, { align: "center" })

  // Add project name
  doc.setFontSize(36)
  doc.setTextColor(60, 60, 60)
  doc.text(project.name, 105, 100, { align: "center" })

  // Add divider
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.setLineWidth(0.5)
  doc.line(80, 110, 130, 110)

  // Add project details
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)

  let detailsY = 130

  if (project.totalPoints) {
    doc.text(`Story Points: ${project.totalPoints}`, 105, detailsY, { align: "center" })
    detailsY += 8
  }

  if (project.totalHours) {
    doc.text(`Estimated Hours: ${project.totalHours}`, 105, detailsY, { align: "center" })
    detailsY += 8
  }

  if (project.budget) {
    doc.text(`Budget: $${project.budget.toLocaleString()}`, 105, detailsY, { align: "center" })
    detailsY += 8
  }

  // Add timestamp if enabled
  if (settings.includeTimestamp) {
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      105,
      detailsY + 10,
      { align: "center" },
    )
  }

  // Add company info
  if (settings.companyName) {
    doc.setFontSize(14)
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
    doc.text(settings.companyName, 105, 240, { align: "center" })

    if (settings.contactInfo) {
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(settings.contactInfo, 105, 250, { align: "center" })
    }
  }

  // Add thin bottom border
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.rect(0, 292, 210, 5, "F")
}

// Bold cover page
function addBoldCoverPage(
  doc: jsPDF,
  project: ArchitectureProject,
  settings: PDFBrandingFormData,
  primaryColor: { r: number; g: number; b: number },
  secondaryColor: { r: number; g: number; b: number },
  accentColor: { r: number; g: number; b: number },
) {
  // Add background color
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
  doc.rect(0, 0, 210, 297, "F")

  // Add diagonal accent
  doc.setFillColor(accentColor.r, accentColor.g, accentColor.b)
  doc.rect(0, 0, 210, 60, "F")

  // Add logo if available
  if (settings.logo) {
    try {
      const logoImg = new Image()
      logoImg.src = settings.logo
      doc.addImage(logoImg, "PNG", 15, 15, 40, 20)
    } catch (error) {
      console.error("Failed to add logo to cover page:", error)
    }
  }

  // Add title
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text("ARCHITECTURE", 105, 90, { align: "center" })
  doc.text("BLUEPRINT", 105, 105, { align: "center" })

  // Add project name
  doc.setFontSize(36)
  doc.setTextColor(255, 255, 255)
  doc.text(project.name, 105, 150, { align: "center" })

  // Add divider
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(1)
  doc.line(70, 160, 140, 160)

  // Add project details
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)

  let detailsY = 180

  if (project.totalPoints) {
    doc.text(`Story Points: ${project.totalPoints}`, 105, detailsY, { align: "center" })
    detailsY += 10
  }

  if (project.totalHours) {
    doc.text(`Estimated Hours: ${project.totalHours}`, 105, detailsY, { align: "center" })
    detailsY += 10
  }

  if (project.budget) {
    doc.text(`Budget: $${project.budget.toLocaleString()}`, 105, detailsY, { align: "center" })
    detailsY += 10
  }

  // Add timestamp if enabled
  if (settings.includeTimestamp) {
    doc.setFontSize(12)
    doc.setTextColor(220, 220, 220)
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      105,
      detailsY + 10,
      { align: "center" },
    )
  }

  // Add company info
  if (settings.companyName) {
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text(settings.companyName, 105, 240, { align: "center" })

    if (settings.contactInfo) {
      doc.setFontSize(12)
      doc.setTextColor(220, 220, 220)
      doc.text(settings.contactInfo, 105, 250, { align: "center" })
    }
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, "")

  // Parse hex values
  let r, g, b
  if (hex.length === 3) {
    r = Number.parseInt(hex.charAt(0) + hex.charAt(0), 16)
    g = Number.parseInt(hex.charAt(1) + hex.charAt(1), 16)
    b = Number.parseInt(hex.charAt(2) + hex.charAt(2), 16)
  } else {
    r = Number.parseInt(hex.substring(0, 2), 16)
    g = Number.parseInt(hex.substring(2, 4), 16)
    b = Number.parseInt(hex.substring(4, 6), 16)
  }

  return { r, g, b }
}

// Export the original function for backward compatibility
export { generateArchitecturePDF } from "./pdf-generator"
