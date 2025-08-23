// SECURITY: This is the ONLY file that should access process.env directly
// All other files must import from here to ensure validation and type safety

import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  
  // Feature flags
  NEXT_PUBLIC_FEATURE_NEW_UI: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_FEATURE_BETA_FEATURES: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_FEATURE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_FEATURE_AI_ORCHESTRATOR: z.string().transform(val => val === 'true').default('false'),
  
  // AI Service Configuration
  AI_SERVICE_URL: z.string().default('http://localhost:5051'),
  CLAUDE_MODEL: z.string().default('claude-4'),
  
  // Optional environment variables
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  
  return parsed.data
}

export const env = validateEnv()

export function getPublicEnv() {
  return {
    NODE_ENV: env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FEATURE_NEW_UI: env.NEXT_PUBLIC_FEATURE_NEW_UI,
    NEXT_PUBLIC_FEATURE_BETA_FEATURES: env.NEXT_PUBLIC_FEATURE_BETA_FEATURES,
    NEXT_PUBLIC_FEATURE_ANALYTICS: env.NEXT_PUBLIC_FEATURE_ANALYTICS,
  }
}