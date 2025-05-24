import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { createClient } from "@/lib/supabase/server"

// Define common paper sizes
export const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
}

// Define default color schemes
export const COLOR_SCHEMES = {
  default: {
    primary: "#3b82f6", // Blue
    secondary: "#6b7280", // Gray
    text: "#1f2937", // Dark gray
    background: "#ffffff", // White
    accent: "#f59e0b", // Amber
  },
  dark: {
    primary: "#2563eb", // Darker blue
    secondary: "#4b5563", // Darker gray
    text: "#111827", // Nearly black
    background: "#f9fafb", // Light gray
    accent: "#d97706", // Darker amber
  },
  modern: {
    primary: "#0ea5e9", // Sky blue
    secondary: "#64748b", // Slate
    text: "#0f172a", // Slate dark
    background: "#ffffff", // White
    accent: "#ec4899", // Pink
  },
}

// Fetch company settings from Supabase
export async function getCompanySettings() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("company_settings").select("*").single()

    if (error) {
      console.error("Error fetching company settings:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching company settings:", error)
    return null
  }
}

// Helper function to create a basic styled PDF
export async function createStyledPDF(options: {
  orientation?: "portrait" | "landscape"
  unit?: "mm" | "cm" | "in" | "px" | "pt"
  format?: [number, number] | "a4" | "letter" | "legal"
  headerText?: string
  footerText?: string
  companyName?: string
} = {}) {
  const pdf = new jsPDF({
    orientation: options.orientation || "portrait",
    unit: options.unit || "mm",
    format: options.format || "a4",
  })

  return pdf
}

// Helper function to create a styled PDF with company branding
export async function createStyledPDFWithBranding(options: {
  orientation?: "portrait" | "landscape"
  unit?: "mm" | "cm" | "in" | "px" | "pt"
  format?: [number, number] | "a4" | "letter" | "legal"
  headerText?: string
  footerText?: string
  companyName?: string
} = {}) {
  try {
    // Fetch company settings
    const companySettings = await getCompanySettings()

    // Create PDF with basic settings
    const pdf = new jsPDF({
      orientation: options.orientation || "portrait",
      unit: options.unit || "mm",
      format: options.format || "a4",
    })

    return pdf
  } catch (error) {
    console.error("Error creating PDF with branding:", error)
    // Fallback to basic PDF
    return createStyledPDF(options)
  }
}
