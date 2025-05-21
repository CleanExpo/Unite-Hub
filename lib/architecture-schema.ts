import { z } from "zod"

// Schema for brand assets
export const BrandAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.string(),
})

// Schema for architecture project
export const ArchitectureProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  clientName: z.string().min(2, "Client name must be at least 2 characters"),
  clientEmail: z.string().email("Must be a valid email address"),
  projectType: z.string().min(1, "Project type is required"),
  budget: z.number().min(0, "Budget must be a positive number"),
  timeline: z.string().min(1, "Timeline is required"),
  requirements: z.array(z.string()).min(1, "At least one requirement is needed"),
  technologies: z.array(z.string()),
  brandAssets: z.array(BrandAssetSchema).optional().default([]),
})

// Type for architecture project
export type ArchitectureProject = z.infer<typeof ArchitectureProjectSchema>

// Schema for PDF branding
export const PdfBrandingSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Template name is required"),
  description: z.string(),
  isDefault: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  logo: z.object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
    position: z.enum(["left", "center", "right"]),
  }),
  header: z.object({
    enabled: z.boolean(),
    text: z.string(),
    includePageNumber: z.boolean(),
    includeLogo: z.boolean(),
  }),
  footer: z.object({
    enabled: z.boolean(),
    text: z.string(),
    includePageNumber: z.boolean(),
    includeTimestamp: z.boolean(),
  }),
  cover: z.object({
    enabled: z.boolean(),
    title: z.string(),
    subtitle: z.string(),
    backgroundUrl: z.string(),
    includeLogo: z.boolean(),
  }),
  watermark: z.object({
    enabled: z.boolean(),
    text: z.string(),
    opacity: z.number().min(0).max(1),
  }),
  companyInfo: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
    website: z.string(),
  }),
  layout: z.enum(["classic", "modern", "minimal", "bold"]),
})

// Type for PDF branding
export type PdfBrandingTemplate = z.infer<typeof PdfBrandingSchema>
