/**
 * Environment Validator
 *
 * Validates environment variables at application startup to catch
 * configuration issues early and provide clear error messages.
 *
 * Usage:
 *   import { validateEnvironment, validateEnvironmentOrThrow } from '@/lib/config/environment-validator';
 *
 *   // In middleware or app startup:
 *   validateEnvironmentOrThrow(); // Throws if critical vars missing
 *
 *   // For conditional validation:
 *   const result = validateEnvironment();
 *   if (!result.valid) {
 *     console.error('Environment validation failed:', result.errors);
 *   }
 */

export interface EnvironmentVariable {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
  category: 'core' | 'auth' | 'database' | 'ai' | 'email' | 'marketing' | 'monitoring';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  invalid: string[];
}

/**
 * Environment variable definitions
 */
export const ENVIRONMENT_VARIABLES: EnvironmentVariable[] = [
  // Core Next.js
  {
    name: 'NEXTAUTH_URL',
    required: true,
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    errorMessage: 'NEXTAUTH_URL must be a valid URL starting with http:// or https://',
    category: 'core',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    errorMessage: 'NEXTAUTH_SECRET must be at least 32 characters long',
    category: 'core',
  },

  // Supabase (Database)
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    errorMessage: 'NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL',
    category: 'database',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    validator: (value) => value.length > 100,
    errorMessage: 'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)',
    category: 'database',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    validator: (value) => value.length > 100,
    errorMessage: 'SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)',
    category: 'database',
  },

  // Anthropic AI
  {
    name: 'ANTHROPIC_API_KEY',
    required: true,
    validator: (value) => value.startsWith('sk-ant-'),
    errorMessage: 'ANTHROPIC_API_KEY must start with sk-ant-',
    category: 'ai',
  },

  // Google OAuth (required for Gmail integration)
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    validator: (value) => value.includes('.apps.googleusercontent.com'),
    errorMessage: 'GOOGLE_CLIENT_ID should end with .apps.googleusercontent.com',
    category: 'auth',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    validator: (value) => value.length > 20,
    errorMessage: 'GOOGLE_CLIENT_SECRET appears to be invalid',
    category: 'auth',
  },
  {
    name: 'GOOGLE_CALLBACK_URL',
    required: false,
    validator: (value) => value.startsWith('http'),
    errorMessage: 'GOOGLE_CALLBACK_URL must be a valid URL',
    category: 'auth',
  },

  // Email Services (optional but recommended)
  {
    name: 'SENDGRID_API_KEY',
    required: false,
    category: 'email',
  },
  {
    name: 'RESEND_API_KEY',
    required: false,
    category: 'email',
  },
  {
    name: 'EMAIL_FROM',
    required: false,
    validator: (value) => value.includes('@'),
    errorMessage: 'EMAIL_FROM must be a valid email address',
    category: 'email',
  },

  // Gmail SMTP (fallback email)
  {
    name: 'EMAIL_SERVER_HOST',
    required: false,
    category: 'email',
  },
  {
    name: 'EMAIL_SERVER_PORT',
    required: false,
    validator: (value) => !isNaN(parseInt(value)),
    errorMessage: 'EMAIL_SERVER_PORT must be a number',
    category: 'email',
  },
  {
    name: 'EMAIL_SERVER_USER',
    required: false,
    category: 'email',
  },
  {
    name: 'EMAIL_SERVER_PASSWORD',
    required: false,
    category: 'email',
  },

  // Marketing Intelligence (optional)
  {
    name: 'PERPLEXITY_API_KEY',
    required: false,
    validator: (value) => value.startsWith('pplx-'),
    errorMessage: 'PERPLEXITY_API_KEY should start with pplx-',
    category: 'marketing',
  },
  {
    name: 'OPENROUTER_API_KEY',
    required: false,
    validator: (value) => value.startsWith('sk-or-'),
    errorMessage: 'OPENROUTER_API_KEY should start with sk-or-',
    category: 'marketing',
  },

  // Monitoring (optional)
  {
    name: 'DATADOG_API_KEY',
    required: false,
    category: 'monitoring',
  },
  {
    name: 'SENTRY_DSN',
    required: false,
    validator: (value) => value.startsWith('https://'),
    errorMessage: 'SENTRY_DSN must be a valid URL',
    category: 'monitoring',
  },
];

/**
 * Validate a single environment variable
 */
function validateVariable(envVar: EnvironmentVariable): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  const value = process.env[envVar.name];

  // Check if missing
  if (!value) {
    if (envVar.required) {
      return {
        valid: false,
        error: `${envVar.name} is required but not set`,
      };
    } else {
      return {
        valid: true,
        warning: `${envVar.name} is not set (optional)`,
      };
    }
  }

  // Check format if validator provided
  if (envVar.validator && !envVar.validator(value)) {
    return {
      valid: false,
      error: envVar.errorMessage || `${envVar.name} has invalid format`,
    };
  }

  return { valid: true };
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
    invalid: [],
  };

  for (const envVar of ENVIRONMENT_VARIABLES) {
    const validation = validateVariable(envVar);

    if (!validation.valid && validation.error) {
      result.valid = false;
      result.errors.push(validation.error);

      if (!process.env[envVar.name]) {
        result.missing.push(envVar.name);
      } else {
        result.invalid.push(envVar.name);
      }
    }

    if (validation.warning) {
      result.warnings.push(validation.warning);
    }
  }

  return result;
}

/**
 * Validate environment and throw if critical variables are missing
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    const errorMessage = [
      '❌ Environment Validation Failed',
      '',
      'Critical environment variables are missing or invalid:',
      '',
      ...result.errors.map(err => `  • ${err}`),
      '',
      'Please check your .env.local file and ensure all required variables are set.',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

/**
 * Get missing required environment variables
 */
export function getMissingEnvVars(): string[] {
  const result = validateEnvironment();
  return result.missing;
}

/**
 * Get invalid environment variables
 */
export function getInvalidEnvVars(): string[] {
  const result = validateEnvironment();
  return result.invalid;
}

/**
 * Check if a specific category of environment variables is configured
 */
export function isCategoryConfigured(category: EnvironmentVariable['category']): boolean {
  const categoryVars = ENVIRONMENT_VARIABLES.filter(v => v.category === category && v.required);
  return categoryVars.every(v => process.env[v.name]);
}

/**
 * Get environment configuration status by category
 */
export function getEnvironmentStatus(): Record<string, { configured: boolean; missing: string[] }> {
  const categories: EnvironmentVariable['category'][] = [
    'core',
    'auth',
    'database',
    'ai',
    'email',
    'marketing',
    'monitoring',
  ];

  const status: Record<string, { configured: boolean; missing: string[] }> = {};

  for (const category of categories) {
    const categoryVars = ENVIRONMENT_VARIABLES.filter(v => v.category === category && v.required);
    const missing = categoryVars.filter(v => !process.env[v.name]).map(v => v.name);

    status[category] = {
      configured: missing.length === 0,
      missing,
    };
  }

  return status;
}

/**
 * Print environment status to console (for debugging)
 */
export function printEnvironmentStatus(): void {
  const status = getEnvironmentStatus();

  console.log('\n=== Environment Configuration Status ===\n');

  for (const [category, info] of Object.entries(status)) {
    const icon = info.configured ? '✅' : '❌';
    console.log(`${icon} ${category.toUpperCase()}: ${info.configured ? 'Configured' : 'Missing variables'}`);

    if (info.missing.length > 0) {
      console.log(`   Missing: ${info.missing.join(', ')}`);
    }
  }

  console.log('');
}

/**
 * Validate specific service configuration
 */
export function validateServiceConfig(service: 'email' | 'marketing' | 'monitoring'): ValidationResult {
  const serviceVars = ENVIRONMENT_VARIABLES.filter(v => v.category === service);

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
    invalid: [],
  };

  for (const envVar of serviceVars) {
    const validation = validateVariable(envVar);

    if (!validation.valid && validation.error) {
      result.valid = false;
      result.errors.push(validation.error);

      if (!process.env[envVar.name]) {
        result.missing.push(envVar.name);
      } else {
        result.invalid.push(envVar.name);
      }
    }

    if (validation.warning) {
      result.warnings.push(validation.warning);
    }
  }

  return result;
}
