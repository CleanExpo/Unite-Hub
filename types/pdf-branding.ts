export interface PdfBrandingColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface PdfBrandingFonts {
  heading: string
  body: string
}

export interface PdfBrandingLogo {
  url: string
  width: number
  height: number
  position: "left" | "center" | "right"
}

export interface PdfBrandingHeader {
  enabled: boolean
  text: string
  includePageNumber: boolean
  includeLogo: boolean
}

export interface PdfBrandingFooter {
  enabled: boolean
  text: string
  includePageNumber: boolean
  includeTimestamp: boolean
}

export interface PdfBrandingCover {
  enabled: boolean
  title: string
  subtitle: string
  backgroundUrl: string
  includeLogo: boolean
}

export interface PdfBrandingWatermark {
  enabled: boolean
  text: string
  opacity: number
}

export interface PdfBrandingCompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  website: string
}

export interface PdfBrandingTemplate {
  id: string
  name: string
  description: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  colors: PdfBrandingColors
  fonts: PdfBrandingFonts
  logo: PdfBrandingLogo
  header: PdfBrandingHeader
  footer: PdfBrandingFooter
  cover: PdfBrandingCover
  watermark: PdfBrandingWatermark
  companyInfo: PdfBrandingCompanyInfo
  layout: "classic" | "modern" | "minimal" | "bold"
}

export interface PdfBrandingFormProps {
  template: PdfBrandingTemplate
  onSave: (template: PdfBrandingTemplate) => Promise<void>
  onPreview: (template: PdfBrandingTemplate) => Promise<string>
}
