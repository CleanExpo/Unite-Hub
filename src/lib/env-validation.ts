/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set before the app starts.
 * This prevents runtime errors and provides clear error messages during development.
 */

interface EnvConfig {
  name: string;
  required: boolean;
  description: string;
  example?: string;
}

const ENV_VARIABLES: EnvConfig[] = [
  // Authentication
  {
    name: "NEXTAUTH_URL",
    required: true,
    description: "NextAuth base URL",
    example: "http://localhost:3008",
  },
  {
    name: "NEXTAUTH_SECRET",
    required: true,
    description: "NextAuth secret key for JWT encryption",
    example: "your-secret-key-here",
  },

  // Supabase
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Supabase project URL",
    example: "https://your-project.supabase.co",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase anon/public key",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Supabase service role key (bypasses RLS)",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },

  // Google OAuth
  {
    name: "GOOGLE_CLIENT_ID",
    required: true,
    description: "Google OAuth 2.0 Client ID",
    example: "123456789-abcdefg.apps.googleusercontent.com",
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    required: true,
    description: "Google OAuth 2.0 Client Secret",
    example: "GOCSPX-...",
  },

  // AI Models
  {
    name: "ANTHROPIC_API_KEY",
    required: true,
    description: "Anthropic Claude API key",
    example: "sk-ant-...",
  },
  {
    name: "OPENAI_API_KEY",
    required: false,
    description: "OpenAI API key (for Whisper transcription)",
    example: "sk-proj-...",
  },

  // Stripe (optional but recommended)
  {
    name: "STRIPE_SECRET_KEY",
    required: false,
    description: "Stripe secret key for billing",
    example: "sk_test_...",
  },
  {
    name: "STRIPE_PRICE_ID_STARTER",
    required: false,
    description: "Stripe price ID for Starter plan",
    example: "price_...",
  },
  {
    name: "STRIPE_PRICE_ID_PROFESSIONAL",
    required: false,
    description: "Stripe price ID for Professional plan",
    example: "price_...",
  },

  // OpenRouter
  {
    name: "OPENROUTER_API_KEY",
    required: false,
    description: "OpenRouter API key for multi-model routing",
    example: "sk-or-v1-...",
  },

  // Security
  {
    name: "FIELD_ENCRYPTION_KEY",
    required: false,
    description: "AES-256-GCM key for PII field-level encryption (64-char hex)",
    example: "generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  },

  // Social Media Connectors
  {
    name: "META_APP_ID",
    required: false,
    description: "Facebook/Instagram Meta App ID",
    example: "123456789012345",
  },
  {
    name: "META_APP_SECRET",
    required: false,
    description: "Facebook/Instagram Meta App Secret",
    example: "abcdef0123456789...",
  },
  {
    name: "LINKEDIN_CLIENT_ID",
    required: false,
    description: "LinkedIn OAuth Client ID",
    example: "77abc12345",
  },
  {
    name: "LINKEDIN_CLIENT_SECRET",
    required: false,
    description: "LinkedIn OAuth Client Secret",
    example: "abcDEF123",
  },
  {
    name: "REDDIT_CLIENT_ID",
    required: false,
    description: "Reddit API Client ID",
    example: "abc123DEF456",
  },
  {
    name: "REDDIT_CLIENT_SECRET",
    required: false,
    description: "Reddit API Client Secret",
    example: "abc123DEF456ghi789",
  },
  {
    name: "YOUTUBE_CHANNEL_ID",
    required: false,
    description: "YouTube channel ID (uses Google OAuth above)",
    example: "UC...",
  },
];

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Validate environment variables
 *
 * @returns ValidationResult with status and missing/warning variables
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const config of ENV_VARIABLES) {
    const value = process.env[config.name];

    if (!value || value.trim() === "") {
      if (config.required) {
        missing.push(config.name);
        errors.push(
          `❌ ${config.name} is required but not set\n   Description: ${config.description}\n   Example: ${config.example || "N/A"}`
        );
      } else {
        warnings.push(
          `⚠️  ${config.name} is not set (optional)\n   Description: ${config.description}\n   Example: ${config.example || "N/A"}`
        );
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    errors,
  };
}

/**
 * Validate environment and throw error if invalid
 *
 * Call this in server-side code (e.g., API routes) to ensure env vars are set
 */
export function requireEnv(): void {
  const result = validateEnv();

  if (!result.valid) {
    const errorMessage = [
      "╔════════════════════════════════════════════════════════════╗",
      "║         ENVIRONMENT VALIDATION FAILED                      ║",
      "╚════════════════════════════════════════════════════════════╝",
      "",
      "Missing required environment variables:",
      "",
      ...result.errors,
      "",
      "To fix:",
      "1. Copy .env.example to .env.local",
      "2. Fill in the required values",
      "3. Restart the development server",
      "",
      "See README.md for setup instructions",
      "",
    ].join("\n");

    throw new Error(errorMessage);
  }

  // Log warnings for optional variables
  if (result.warnings.length > 0) {
    console.warn("\n⚠️  Optional environment variables not set:\n");
    result.warnings.forEach((warning) => console.warn(warning));
    console.warn("");
  }
}

/**
 * Get environment variable with validation
 *
 * @param name - Environment variable name
 * @param required - Whether the variable is required
 * @returns The environment variable value
 * @throws Error if required variable is not set
 */
export function getEnv(name: string, required: boolean = true): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    if (required) {
      throw new Error(
        `Environment variable ${name} is required but not set. Check your .env.local file.`
      );
    }
    return "";
  }

  return value;
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Get current environment name
 */
export function getEnvironment(): "development" | "production" | "test" {
  return (process.env.NODE_ENV as any) || "development";
}
