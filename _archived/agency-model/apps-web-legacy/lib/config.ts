/**
 * Environment configuration with validation
 * Ensures all required environment variables are present at startup
 */

// Required environment variables
const REQUIRED_ENV_VARS = ['NEXT_PUBLIC_BACKEND_URL'] as const;

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  NEXT_PUBLIC_FRONTEND_URL: 'http://localhost:3000',
  LOG_LEVEL: 'info',
} as const;

/**
 * Validates that all required environment variables are present
 * Throws an error if any are missing
 */
function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((key) => `  - ${key}`).join('\n')}\n\n` +
        `Please add these to your .env.local file or environment configuration.`
    );
  }
}

// Validate on module load (fail fast)
if (typeof window === 'undefined') {
  // Only validate on server-side (Next.js edge runtime, API routes, etc.)
  validateEnv();
}

/**
 * Type-safe application configuration
 * All values are validated and guaranteed to exist
 */
export const config = {
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL!,
  },
  frontend: {
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || OPTIONAL_ENV_VARS.NEXT_PUBLIC_FRONTEND_URL,
  },
  logging: {
    level:
      (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || OPTIONAL_ENV_VARS.LOG_LEVEL,
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Helper to check if we're running on the client
 */
export const isClient = typeof window !== 'undefined';

/**
 * Helper to check if we're running on the server
 */
export const isServer = typeof window === 'undefined';

export default config;
