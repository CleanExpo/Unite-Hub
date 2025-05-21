export interface PDFBrandingSettings {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  logo?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: "helvetica" | "times" | "courier" | "arial"
  headerTitle?: string
  footerText?: string
  includeTimestamp: boolean
  includePageNumbers: boolean
  includeCoverPage: boolean
  coverPageBackground?: string
  templateStyle: "classic" | "modern" | "minimal" | "bold"
  companyName?: string
  contactInfo?: string
  watermark?: string
}

export type PDFBrandingFormData = Omit<PDFBrandingSettings, "id" | "createdAt" | "updatedAt">

export const defaultBrandingSettings: PDFBrandingFormData = {
  name: "Default Template",
  isDefault: true,
  primaryColor: "#2c3e50",
  secondaryColor: "#3498db",
  accentColor: "#e74c3c",
  fontFamily: "helvetica",
  includeTimestamp: true,
  includePageNumbers: true,
  includeCoverPage: true,
  templateStyle: "classic",
}
