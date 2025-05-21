import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { PdfBrandingTemplate } from "@/types/pdf-branding"

// Default template to use if none is provided
const defaultTemplate: PdfBrandingTemplate = {
  id: "default",
  name: "Default Template",
  description: "Default PDF template",
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  colors: {
    primary: "#3b82f6",
    secondary: "#6b7280",
    accent: "#10b981",
    background: "#ffffff",
    text: "#1f2937",
  },
  fonts: {
    heading: "Helvetica",
    body: "Helvetica",
  },
  logo: {
    url: "/logo.png",
    width: 100,
    height: 50,
    position: "left",
  },
  header: {
    enabled: true,
    text: "Architecture Blueprint",
    includePageNumber: true,
    includeLogo: false,
  },
  footer: {
    enabled: true,
    text: "© 2023 Company Name",
    includePageNumber: true,
    includeTimestamp: true,
  },
  cover: {
    enabled: true,
    title: "Architecture Blueprint",
    subtitle: "Project Details",
    backgroundUrl: "",
    includeLogo: true,
  },
  watermark: {
    enabled: false,
    text: "CONFIDENTIAL",
    opacity: 0.1,
  },
  companyInfo: {
    name: "Company Name",
    address: "123 Main St, City, State, ZIP",
    phone: "(123) 456-7890",
    email: "info@company.com",
    website: "www.company.com",
  },
  layout: "classic",
}

export interface ArchitectureProject {
  id: string
  name: string
  description: string
  clientName: string
  clientEmail: string
  projectType: string
  budget: number
  timeline: string
  requirements: string[]
  technologies: string[]
  brandAssets: {
    name: string
    url: string
    type: string
  }[]
  createdAt: string
  updatedAt: string
}

export async function generatePDF(
  project: ArchitectureProject,
  template: PdfBrandingTemplate = defaultTemplate,
): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set default font
  doc.setFont(template.fonts.body)

  // Add watermark if enabled
  if (template.watermark.enabled) {
    const watermarkText = template.watermark.text
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(60)
    doc.setGState(new doc.GState({ opacity: template.watermark.opacity }))

    // Rotate and position the watermark
    doc.saveGraphicsState()
    doc.translate(doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2)
    doc.rotate(-45)
    doc.text(watermarkText, 0, 0, { align: "center" })
    doc.restoreGraphicsState()

    // Reset opacity
    doc.setGState(new doc.GState({ opacity: 1.0 }))
  }

  // Add cover page if enabled
  if (template.cover.enabled) {
    // Set background color
    doc.setFillColor(
      hexToRgb(template.colors.background).r,
      hexToRgb(template.colors.background).g,
      hexToRgb(template.colors.background).b,
    )
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F")

    // Add logo if enabled
    if (template.cover.includeLogo) {
      try {
        // In a real implementation, you would load the image and add it
        // For this simplified version, we'll just add a placeholder
        const logoX =
          template.logo.position === "left"
            ? 20
            : template.logo.position === "right"
              ? doc.internal.pageSize.getWidth() - 20 - template.logo.width / 4
              : (doc.internal.pageSize.getWidth() - template.logo.width / 4) / 2

        // Add colored rectangle as logo placeholder
        doc.setFillColor(
          hexToRgb(template.colors.primary).r,
          hexToRgb(template.colors.primary).g,
          hexToRgb(template.colors.primary).b,
        )
        doc.rect(logoX, 20, template.logo.width / 4, template.logo.height / 4, "F")
      } catch (error) {
        console.error("Error adding logo:", error)
      }
    }

    // Add title
    doc.setFont(template.fonts.heading, "bold")
    doc.setFontSize(24)
    doc.setTextColor(
      hexToRgb(template.colors.primary).r,
      hexToRgb(template.colors.primary).g,
      hexToRgb(template.colors.primary).b,
    )
    doc.text(template.cover.title, doc.internal.pageSize.getWidth() / 2, 100, { align: "center" })

    // Add project name
    doc.setFontSize(36)
    doc.text(project.name, doc.internal.pageSize.getWidth() / 2, 120, { align: "center" })

    // Add subtitle
    doc.setFontSize(16)
    doc.setTextColor(
      hexToRgb(template.colors.secondary).r,
      hexToRgb(template.colors.secondary).g,
      hexToRgb(template.colors.secondary).b,
    )
    doc.text(template.cover.subtitle, doc.internal.pageSize.getWidth() / 2, 140, { align: "center" })

    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 160, {
      align: "center",
    })

    // Add company info at the bottom
    doc.setFontSize(10)
    doc.text(template.companyInfo.name, doc.internal.pageSize.getWidth() / 2, 250, { align: "center" })
    doc.text(template.companyInfo.address, doc.internal.pageSize.getWidth() / 2, 255, { align: "center" })
    doc.text(
      `${template.companyInfo.phone} | ${template.companyInfo.email}`,
      doc.internal.pageSize.getWidth() / 2,
      260,
      { align: "center" },
    )
    doc.text(template.companyInfo.website, doc.internal.pageSize.getWidth() / 2, 265, { align: "center" })

    // Add a new page for the content
    doc.addPage()
  }

  // Add header if enabled
  if (template.header.enabled) {
    // We'll add the header to all pages except the cover page
    const totalPages = doc.getNumberOfPages()
    for (let i = template.cover.enabled ? 2 : 1; i <= totalPages; i++) {
      doc.setPage(i)

      // Set header text
      doc.setFont(template.fonts.heading)
      doc.setFontSize(10)
      doc.setTextColor(
        hexToRgb(template.colors.secondary).r,
        hexToRgb(template.colors.secondary).g,
        hexToRgb(template.colors.secondary).b,
      )

      let headerText = template.header.text
      if (template.header.includePageNumber) {
        headerText += ` | Page ${i} of ${totalPages}`
      }

      doc.text(headerText, doc.internal.pageSize.getWidth() - 20, 10, { align: "right" })

      // Add a line under the header
      doc.setDrawColor(
        hexToRgb(template.colors.primary).r,
        hexToRgb(template.colors.primary).g,
        hexToRgb(template.colors.primary).b,
      )
      doc.line(20, 15, doc.internal.pageSize.getWidth() - 20, 15)
    }
  }

  // Add footer if enabled
  if (template.footer.enabled) {
    // We'll add the footer to all pages except the cover page
    const totalPages = doc.getNumberOfPages()
    for (let i = template.cover.enabled ? 2 : 1; i <= totalPages; i++) {
      doc.setPage(i)

      // Set footer text
      doc.setFont(template.fonts.body)
      doc.setFontSize(8)
      doc.setTextColor(
        hexToRgb(template.colors.secondary).r,
        hexToRgb(template.colors.secondary).g,
        hexToRgb(template.colors.secondary).b,
      )

      let footerText = template.footer.text
      if (template.footer.includePageNumber) {
        footerText += ` | Page ${i} of ${totalPages}`
      }
      if (template.footer.includeTimestamp) {
        footerText += ` | Generated on: ${new Date().toLocaleString()}`
      }

      // Add a line above the footer
      doc.setDrawColor(
        hexToRgb(template.colors.primary).r,
        hexToRgb(template.colors.primary).g,
        hexToRgb(template.colors.primary).b,
      )
      doc.line(
        20,
        doc.internal.pageSize.getHeight() - 20,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 20,
      )

      doc.text(footerText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
        align: "center",
      })
    }
  }

  // Set the current page to the first content page
  doc.setPage(template.cover.enabled ? 2 : 1)

  // Add project details
  doc.setFont(template.fonts.heading, "bold")
  doc.setFontSize(18)
  doc.setTextColor(
    hexToRgb(template.colors.primary).r,
    hexToRgb(template.colors.primary).g,
    hexToRgb(template.colors.primary).b,
  )
  doc.text("Project Details", 20, 30)

  // Add project info table
  autoTable(doc, {
    startY: 40,
    head: [["Property", "Value"]],
    body: [
      ["Project Name", project.name],
      ["Description", project.description],
      ["Client", project.clientName],
      ["Client Email", project.clientEmail],
      ["Project Type", project.projectType],
      ["Budget", `$${project.budget.toLocaleString()}`],
      ["Timeline", project.timeline],
      ["Created", new Date(project.createdAt).toLocaleDateString()],
      ["Last Updated", new Date(project.updatedAt).toLocaleDateString()],
    ],
    theme: "grid",
    styles: {
      font: template.fonts.body,
      textColor: hexToRgb(template.colors.text),
    },
    headStyles: {
      fillColor: hexToRgb(template.colors.primary),
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  // Add requirements section
  const requirementsY = (doc as any).lastAutoTable.finalY + 20
  doc.setFont(template.fonts.heading, "bold")
  doc.setFontSize(18)
  doc.setTextColor(
    hexToRgb(template.colors.primary).r,
    hexToRgb(template.colors.primary).g,
    hexToRgb(template.colors.primary).b,
  )
  doc.text("Requirements", 20, requirementsY)

  // Add requirements list
  autoTable(doc, {
    startY: requirementsY + 10,
    head: [["Requirement"]],
    body: project.requirements.map((req) => [req]),
    theme: "grid",
    styles: {
      font: template.fonts.body,
      textColor: hexToRgb(template.colors.text),
    },
    headStyles: {
      fillColor: hexToRgb(template.colors.primary),
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  })

  // Add technologies section
  const technologiesY = (doc as any).lastAutoTable.finalY + 20

  // Check if we need a new page
  if (technologiesY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage()
    doc.setFont(template.fonts.heading, "bold")
    doc.setFontSize(18)
    doc.setTextColor(
      hexToRgb(template.colors.primary).r,
      hexToRgb(template.colors.primary).g,
      hexToRgb(template.colors.primary).b,
    )
    doc.text("Technologies", 20, 30)

    autoTable(doc, {
      startY: 40,
      head: [["Technology"]],
      body: project.technologies.map((tech) => [tech]),
      theme: "grid",
      styles: {
        font: template.fonts.body,
        textColor: hexToRgb(template.colors.text),
      },
      headStyles: {
        fillColor: hexToRgb(template.colors.primary),
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    })
  } else {
    doc.setFont(template.fonts.heading, "bold")
    doc.setFontSize(18)
    doc.setTextColor(
      hexToRgb(template.colors.primary).r,
      hexToRgb(template.colors.primary).g,
      hexToRgb(template.colors.primary).b,
    )
    doc.text("Technologies", 20, technologiesY)

    autoTable(doc, {
      startY: technologiesY + 10,
      head: [["Technology"]],
      body: project.technologies.map((tech) => [tech]),
      theme: "grid",
      styles: {
        font: template.fonts.body,
        textColor: hexToRgb(template.colors.text),
      },
      headStyles: {
        fillColor: hexToRgb(template.colors.primary),
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    })
  }

  // Add brand assets section if there are any
  if (project.brandAssets && project.brandAssets.length > 0) {
    const brandAssetsY = (doc as any).lastAutoTable.finalY + 20

    // Check if we need a new page
    if (brandAssetsY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      doc.setFont(template.fonts.heading, "bold")
      doc.setFontSize(18)
      doc.setTextColor(
        hexToRgb(template.colors.primary).r,
        hexToRgb(template.colors.primary).g,
        hexToRgb(template.colors.primary).b,
      )
      doc.text("Brand Assets", 20, 30)

      autoTable(doc, {
        startY: 40,
        head: [["Asset Name", "Type"]],
        body: project.brandAssets.map((asset) => [asset.name, asset.type]),
        theme: "grid",
        styles: {
          font: template.fonts.body,
          textColor: hexToRgb(template.colors.text),
        },
        headStyles: {
          fillColor: hexToRgb(template.colors.primary),
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      })
    } else {
      doc.setFont(template.fonts.heading, "bold")
      doc.setFontSize(18)
      doc.setTextColor(
        hexToRgb(template.colors.primary).r,
        hexToRgb(template.colors.primary).g,
        hexToRgb(template.colors.primary).b,
      )
      doc.text("Brand Assets", 20, brandAssetsY)

      autoTable(doc, {
        startY: brandAssetsY + 10,
        head: [["Asset Name", "Type"]],
        body: project.brandAssets.map((asset) => [asset.name, asset.type]),
        theme: "grid",
        styles: {
          font: template.fonts.body,
          textColor: hexToRgb(template.colors.text),
        },
        headStyles: {
          fillColor: hexToRgb(template.colors.primary),
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      })
    }
  }

  // Return the PDF as a blob
  return doc.output("blob")
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string) {
  // Remove the # if it exists
  hex = hex.replace("#", "")

  // Parse the hex values
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)

  return { r, g, b }
}
