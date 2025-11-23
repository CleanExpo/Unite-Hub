/**
 * Environment Configuration - Validated and typed environment variables
 *
 * Source: docs/abacus/env-map.json
 * Purpose: Runtime validation, type safety, and documentation
 */

// Environment variable schema
export interface EnvConfig {
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Auth (required)
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  // AI (required)
  ANTHROPIC_API_KEY: string;

  // AI (optional)
  OPENROUTER_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;

  // Email (optional)
  SENDGRID_API_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_SERVER_HOST?: string;
  EMAIL_SERVER_PORT?: string;
  EMAIL_SERVER_USER?: string;
  EMAIL_SERVER_PASSWORD?: string;
  EMAIL_FROM?: string;

  // Stripe (optional)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;

  // WhatsApp (optional)
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_VERIFY_TOKEN?: string;
}

// Required variables for MVP
const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ANTHROPIC_API_KEY",
] as const;

// Client-exposed variables (NEXT_PUBLIC_*)
const CLIENT_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const;

// Validation errors
export interface ValidationError {
  variable: string;
  error: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validate environment variables
 */
export function validateEnv(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];

    if (!value) {
      errors.push({
        variable: varName,
        error: "Missing required environment variable",
      });
      continue;
    }

    // Specific validations
    if (varName === "NEXT_PUBLIC_SUPABASE_URL") {
      try {
        new URL(value);
      } catch {
        errors.push({
          variable: varName,
          error: "Invalid URL format",
        });
      }
    }

    if (varName === "ANTHROPIC_API_KEY" && !value.startsWith("sk-ant-")) {
      warnings.push(`${varName} doesn't start with expected prefix "sk-ant-"`);
    }

    if (varName === "NEXTAUTH_SECRET" && value.length < 32) {
      warnings.push(`${varName} should be at least 32 characters for security`);
    }
  }

  // Check for optional but recommended variables
  if (!process.env.OPENROUTER_API_KEY) {
    warnings.push("OPENROUTER_API_KEY not set - multi-model routing unavailable");
  }

  if (!process.env.SENDGRID_API_KEY && !process.env.RESEND_API_KEY) {
    warnings.push("No email provider configured - using Gmail SMTP fallback only");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validated environment config
 */
export function getEnvConfig(): EnvConfig {
  const result = validateEnv();

  if (!result.valid) {
    const errorMessages = result.errors
      .map((e) => `  - ${e.variable}: ${e.error}`)
      .join("\n");

    throw new Error(
      `Environment validation failed:\n${errorMessages}\n\nCheck your .env.local file.`
    );
  }

  // Log warnings in development
  if (process.env.NODE_ENV === "development" && result.warnings.length > 0) {
    console.warn("Environment warnings:");
    result.warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  return {
    // Required
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,

    // Optional
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  };
}

/**
 * Check if a feature is enabled based on env vars
 */
export const features = {
  hasOpenRouter: () => !!process.env.OPENROUTER_API_KEY,
  hasPerplexity: () => !!process.env.PERPLEXITY_API_KEY,
  hasGemini: () => !!process.env.GEMINI_API_KEY,
  hasOpenAI: () => !!process.env.OPENAI_API_KEY,
  hasSendGrid: () => !!process.env.SENDGRID_API_KEY,
  hasResend: () => !!process.env.RESEND_API_KEY,
  hasStripe: () => !!process.env.STRIPE_SECRET_KEY,
  hasWhatsApp: () =>
    !!process.env.WHATSAPP_PHONE_NUMBER_ID && !!process.env.WHATSAPP_ACCESS_TOKEN,

  // Feature groups
  hasEmailProvider: () =>
    !!process.env.SENDGRID_API_KEY ||
    !!process.env.RESEND_API_KEY ||
    !!process.env.EMAIL_SERVER_HOST,

  hasSEOIntelligence: () =>
    !!process.env.PERPLEXITY_API_KEY || !!process.env.OPENROUTER_API_KEY,
};

/**
 * Get client-safe environment variables
 */
export function getClientEnv(): Record<string, string> {
  const clientEnv: Record<string, string> = {};

  for (const varName of CLIENT_VARS) {
    const value = process.env[varName];
    if (value) {
      clientEnv[varName] = value;
    }
  }

  return clientEnv;
}

/**
 * Print environment status (for debugging)
 */
export function printEnvStatus(): void {
  console.log("\n=== Environment Status ===\n");

  console.log("Required Variables:");
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    const status = value ? "✅" : "❌";
    const display = value ? `${value.substring(0, 10)}...` : "NOT SET";
    console.log(`  ${status} ${varName}: ${display}`);
  }

  console.log("\nFeatures:");
  console.log(`  OpenRouter: ${features.hasOpenRouter() ? "✅" : "❌"}`);
  console.log(`  Perplexity: ${features.hasPerplexity() ? "✅" : "❌"}`);
  console.log(`  Gemini: ${features.hasGemini() ? "✅" : "❌"}`);
  console.log(`  SendGrid: ${features.hasSendGrid() ? "✅" : "❌"}`);
  console.log(`  Resend: ${features.hasResend() ? "✅" : "❌"}`);
  console.log(`  Stripe: ${features.hasStripe() ? "✅" : "❌"}`);
  console.log(`  WhatsApp: ${features.hasWhatsApp() ? "✅" : "❌"}`);

  console.log("\n=========================\n");
}

// Export singleton config (lazy-loaded)
let _config: EnvConfig | null = null;

export function env(): EnvConfig {
  if (!_config) {
    _config = getEnvConfig();
  }
  return _config;
}

export default env;
