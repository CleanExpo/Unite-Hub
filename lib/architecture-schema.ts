import { z } from "zod"

// Constants for calculations
export const POINTS_MAP = {
  xs: 2, // 1-3 points
  s: 5, // 4-5 points
  m: 8, // 6-8 points
  l: 13, // 9-13 points
  xl: 21, // 14+ points
}

export const HOURS_PER_POINT = 5
export const QA_PERCENTAGE = 0.25 // 25% of development time
export const CONTINGENCY_PERCENTAGE = 0.15 // 15% buffer
export const BLUEPRINT_FEE = 550 // AU $550
export const EXTRA_CONSULTATION_FEE = 130 // AU $130 per hour

// Schema for user stories
const userStorySchema = z.string().min(1, "User story is required")

// Schema for features
const featureSchema = z.object({
  name: z.string().min(1, "Feature name is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["high", "medium", "low"]),
  complexity: z.enum(["xs", "s", "m", "l", "xl"]),
  userStories: z.array(userStorySchema).min(1, "At least one user story is required"),
})

// Schema for integrations
const integrationSchema = z.object({
  name: z.string().min(1, "Integration name is required"),
  purpose: z.string().min(1, "Purpose is required"),
  apiDocumentation: z.string().optional(),
})

// Schema for personas
const personaSchema = z.object({
  name: z.string().min(1, "Persona name is required"),
  role: z.string().min(1, "Role is required"),
  goals: z.string().min(1, "Goals are required"),
  painPoints: z.string().min(1, "Pain points are required"),
})

// Main architecture schema
export const architectureSchema = z.object({
  projectBasics: z.object({
    projectName: z.string().min(1, "Project name is required"),
    businessOverview: z.string().min(1, "Business overview is required"),
    projectGoals: z.string().min(1, "Project goals are required"),
    targetLaunchDate: z.string().optional(),
    expectedUserCount: z.string().optional(),
  }),
  mvpFeatures: z.array(featureSchema).min(1, "At least one MVP feature is required"),
  futureFeatures: z.array(featureSchema).default([]),
  integrations: z.array(integrationSchema).default([]),
  personas: z.array(personaSchema).min(1, "At least one persona is required"),
  technicalConstraints: z.string().optional(),
  businessConstraints: z.string().optional(),
  preferredTechnologies: z.string().optional(),
  budget: z.number().min(0, "Budget must be a positive number"),
  timeline: z.string().optional(),
  additionalComments: z.string().optional(),
})

// Export the type
export type ArchitectureInput = z.infer<typeof architectureSchema>

export interface ArchitectureProject {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  meetingDate?: string
  deliveryDate?: string
  totalPoints?: number
  totalHours?: number
  budget?: number
  roadmap?: {
    mvp: {
      features: Array<{
        name: string
        description: string
        priority: string
        complexity: string
        points: number
        hours: number
      }>
    }
    future: {
      features: Array<{
        name: string
        description: string
        priority: string
        complexity: string
        points: number
        hours: number
      }>
    }
    integrations?: Array<{
      name: string
      purpose: string
      apiDocumentation?: string
    }>
  }
  personas?: Array<{
    name: string
    role: string
    goals: string
    painPoints: string
  }>
  technicalConstraints?: string
  businessConstraints?: string
  preferredTechnologies?: string
  realityCheck?: string
}
