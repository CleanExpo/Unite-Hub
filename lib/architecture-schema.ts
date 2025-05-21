import { z } from "zod"

// Constants for calculations
export const POINTS_MAP = {
  xs: 2,
  s: 5,
  m: 8,
  l: 13,
  xl: 21,
}

export const HOURS_PER_POINT = 5
export const QA_PERCENTAGE = 0.2
export const CONTINGENCY_PERCENTAGE = 0.15
export const BLUEPRINT_FEE = 1500
export const EXTRA_CONSULTATION_FEE = 150

// Schema for brand assets
export const BrandAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.string(),
})

// Schema for architecture project
export const architectureSchema = z.object({
  projectBasics: z.object({
    projectName: z.string().min(3, "Project name must be at least 3 characters"),
    businessOverview: z.string().min(10, "Business overview must be at least 10 characters"),
    projectGoals: z.string().min(10, "Project goals must be at least 10 characters"),
    targetLaunchDate: z.string(),
    expectedUserCount: z.string(),
  }),
  mvpFeatures: z.array(
    z.object({
      name: z.string().min(1, "Feature name is required"),
      description: z.string().min(1, "Feature description is required"),
      priority: z.string(),
      complexity: z.string(),
      userStories: z.array(z.string()),
    }),
  ),
  futureFeatures: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        priority: z.string(),
        complexity: z.string(),
        userStories: z.array(z.string()).optional(),
      }),
    )
    .optional()
    .default([]),
  integrations: z
    .array(
      z.object({
        name: z.string(),
        purpose: z.string(),
        apiDocumentation: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  personas: z.array(
    z.object({
      name: z.string().min(1, "Persona name is required"),
      role: z.string().min(1, "Persona role is required"),
      goals: z.string().min(1, "Persona goals are required"),
      painPoints: z.string().min(1, "Persona pain points are required"),
    }),
  ),
  technicalConstraints: z.string(),
  businessConstraints: z.string(),
  preferredTechnologies: z.string(),
  budget: z.number(),
  timeline: z.string(),
  additionalComments: z.string().optional(),
})

// Type for architecture input
export type ArchitectureInput = z.infer<typeof architectureSchema>

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
