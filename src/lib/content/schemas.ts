// src/lib/content/schemas.ts
// Shared Zod schemas for content generation.
// Imported by both the capability definition and the generator to avoid circular deps.

import { z } from 'zod'

export const ContentResultSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().nullable().default(null),
  mediaPrompt: z.string().nullable().default(null),
})

// tool_use requires a root ZodObject — array results are wrapped in 'items'.
export const ContentGenerateOutputSchema = z.object({
  items: z.array(ContentResultSchema).min(1),
})
