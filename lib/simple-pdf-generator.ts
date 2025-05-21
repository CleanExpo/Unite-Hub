import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Define a simple project type to avoid complex dependencies
interface SimpleProject {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  [key: string]: any // Allow for additional properties
}

// Add the missing type for jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generateSimplePDF(project: SimpleProject): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF()

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
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, { align: "center" })

  // Add project overview section
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text("Project Overview", 14, 45)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, 47, 196, 47)

  // Project details table
  const projectDetails = [
    ["Project ID:", project.id],
    ["Created:", new Date(project.createdAt).toLocaleDateString()],
    ["Updated:", new Date(project.updatedAt).toLocaleDateString()],
  ]

  // Add description if available
  if (project.description) {
    projectDetails.push(["Description:", project.description])
  }

  // Add any other properties that might be available
  Object.entries(project).forEach(([key, value]) => {
    if (
      !["id", "name", "description", "createdAt", "updatedAt"].includes(key) &&
      typeof value !== "object" &&
      value !== null
    ) {
      projectDetails.push([key.charAt(0).toUpperCase() + key.slice(1) + ":", String(value)])
    }
  })

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

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${pageCount} | ${project.name} Architecture Blueprint`, 105, 290, {
      align: "center",
    })
  }

  // Return the PDF as a blob
  return doc.output("blob")
}
