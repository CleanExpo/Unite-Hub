export type TemplateStyle = "classic" | "modern" | "minimal" | "bold" | "technical"

export interface PDFBrandingSettings {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  headerTitle?: string
  footerText?: string
  includeTimestamp: boolean
  includePageNumbers: boolean
  includeCoverPage: boolean
  templateStyle: TemplateStyle
  companyName?: string
  contactInfo?: string
  watermark?: string
  logo?: string
}

export type PDFBrandingFormData = Omit<PDFBrandingSettings, "id" | "createdAt" | "updatedAt">

export const defaultBrandingSettings: PDFBrandingSettings = {
  id: "default",
  name: "Default Template",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
