/**
 * Enhanced Environment Variable Validation
 *
 * P3-6: Environment Variable Validation Enhancement
 *
 * Extends the basic env-validation.ts with:
 * - Type validation (string, number, boolean)
 * - Format validation (URL, email, UUID)
 * - Optional vs required marking
 * - Default values
 * - Runtime validation for feature flags
 *
 * @module lib/env-validation-enhanced
 */

/**
 * Environment variable types
 */
export type EnvVarType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'uuid' | 'json';

/**
 * Environment variable format validators
 */
export type EnvVarFormat =
  | 'jwt'
  | 'api_key'
  | 'supabase_key'
  | 'anthropic_key'
  | 'openai_key'
  | 'stripe_key'
  | 'google_client_id'
  | 'google_client_secret'
  | 'port';

/**
 * Enhanced environment variable configuration
 */
export interface EnhancedEnvConfig {
  name: string;
  required: boolean;
  type: EnvVarType;
  format?: EnvVarFormat;
  description: string;
  example?: string;
  default?: string | number | boolean;
  deprecated?: boolean;
  deprecationMessage?: string;
  validator?: (value: string) => boolean;
  transformer?: (value: string) => unknown;
  featureFlag?: boolean; // If true, treat as feature flag
}

/**
 * Environment variable validation result
 */
export interface EnvValidationResult {
  valid: boolean;
  value: unknown;
  error?: string;
  warning?: string;
}

/**
 * ═══════════════════════════════════════════════════════════
 * TYPE VALIDATORS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Validate string type
 */
function validateString(value: string): EnvValidationResult {
  if (typeof value === 'string' && value.trim().length > 0) {
    return { valid: true, value: value.trim() };
  }
  return { valid: false, value: '', error: 'Must be a non-empty string' };
}

/**
 * Validate number type
 */
function validateNumber(value: string): EnvValidationResult {
  const num = Number(value);
  if (!isNaN(num)) {
    return { valid: true, value: num };
  }
  return { valid: false, value: 0, error: 'Must be a valid number' };
}

/**
 * Validate boolean type
 */
function validateBoolean(value: string): EnvValidationResult {
  const lowercased = value.toLowerCase().trim();

  if (lowercased === 'true' || lowercased === '1' || lowercased === 'yes') {
    return { valid: true, value: true };
  }
  if (lowercased === 'false' || lowercased === '0' || lowercased === 'no') {
    return { valid: true, value: false };
  }

  return { valid: false, value: false, error: 'Must be a boolean (true/false, 1/0, yes/no)' };
}

/**
 * Validate URL type
 */
function validateUrl(value: string): EnvValidationResult {
  try {
    const url = new URL(value);
    return { valid: true, value: url.toString() };
  } catch {
    return { valid: false, value: '', error: 'Must be a valid URL' };
  }
}

/**
 * Validate email type
 */
function validateEmail(value: string): EnvValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(value)) {
    return { valid: true, value: value.trim() };
  }
  return { valid: false, value: '', error: 'Must be a valid email address' };
}

/**
 * Validate UUID type
 */
function validateUuid(value: string): EnvValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return { valid: true, value: value.toLowerCase() };
  }
  return { valid: false, value: '', error: 'Must be a valid UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)' };
}

/**
 * Validate JSON type
 */
function validateJson(value: string): EnvValidationResult {
  try {
    const parsed = JSON.parse(value);
    return { valid: true, value: parsed };
  } catch (err) {
    return { valid: false, value: null, error: `Must be valid JSON: ${(err as Error).message}` };
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * FORMAT VALIDATORS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Validate JWT format
 */
function validateJwt(value: string): EnvValidationResult {
  const jwtRegex = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  if (jwtRegex.test(value)) {
    return { valid: true, value };
  }
  return {
    valid: false,
    value: '',
    error: 'Must be a valid JWT (format: eyJ...)',
  };
}

/**
 * Validate Supabase key format
 */
function validateSupabaseKey(value: string): EnvValidationResult {
  return validateJwt(value);
}

/**
 * Validate Anthropic API key format
 */
function validateAnthropicKey(value: string): EnvValidationResult {
  if (value.startsWith('sk-ant-')) {
    return { valid: true, value };
  }
  return {
    valid: false,
    value: '',
    error: 'Must start with "sk-ant-"',
  };
}

/**
 * Validate OpenAI API key format
 */
function validateOpenAiKey(value: string): EnvValidationResult {
  if (value.startsWith('sk-') || value.startsWith('sk-proj-')) {
    return { valid: true, value };
  }
  return {
    valid: false,
    value: '',
    error: 'Must start with "sk-" or "sk-proj-"',
  };
}

/**
 * Validate Stripe key format
 */
function validateStripeKey(value: string): EnvValidationResult {
  const validPrefixes = ['sk_test_', 'sk_live_', 'rk_test_', 'rk_live_', 'pk_test_', 'pk_live_', 'whsec_'];
  const hasValidPrefix = validPrefixes.some(prefix => value.startsWith(prefix));

  if (hasValidPrefix) {
    return { valid: true, value };
  }
  return {
    valid: false,
    value: '',
    error: `Must start with one of: ${validPrefixes.join(', ')}`,
  };
}

/**
 * Validate Google Client ID format
 */
function validateGoogleClientId(value: string): EnvValidationResult {
  if (value.endsWith('.apps.googleusercontent.com')) {
    return { valid: true, value };
  }
  return {
    valid: false,
    value: '',
    error: 'Must end with ".apps.googleusercontent.com"',
  };
}

/**
 * Validate Google Client Secret format
 */
function validateGoogleClientSecret(value: string): EnvValidationResult {
  if (value.startsWith('GOCSPX-') || value.length >= 24) {
    return { valid: true, value };
  }
  return {
    valid: false,
    value: '',
    error: 'Must start with "GOCSPX-" or be at least 24 characters',
  };
}

/**
 * Validate port format
 */
function validatePort(value: string): EnvValidationResult {
  const num = Number(value);
  if (!isNaN(num) && num > 0 && num < 65536) {
    return { valid: true, value: num };
  }
  return {
    valid: false,
    value: 0,
    error: 'Must be a valid port number (1-65535)',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * VALIDATION ORCHESTRATION
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Type validators map
 */
const typeValidators: Record<EnvVarType, (value: string) => EnvValidationResult> = {
  string: validateString,
  number: validateNumber,
  boolean: validateBoolean,
  url: validateUrl,
  email: validateEmail,
  uuid: validateUuid,
  json: validateJson,
};

/**
 * Format validators map
 */
const formatValidators: Record<EnvVarFormat, (value: string) => EnvValidationResult> = {
  jwt: validateJwt,
  api_key: validateString, // Generic API key (just non-empty)
  supabase_key: validateSupabaseKey,
  anthropic_key: validateAnthropicKey,
  openai_key: validateOpenAiKey,
  stripe_key: validateStripeKey,
  google_client_id: validateGoogleClientId,
  google_client_secret: validateGoogleClientSecret,
  port: validatePort,
};

/**
 * Validate a single environment variable
 *
 * @param config - Environment variable configuration
 * @returns Validation result
 */
export function validateEnvVar(config: EnhancedEnvConfig): EnvValidationResult {
  const value = process.env[config.name];

  // Check if variable exists
  if (value === undefined || value === '') {
    // Use default if provided
    if (config.default !== undefined) {
      return {
        valid: true,
        value: config.default,
        warning: `Using default value: ${config.default}`,
      };
    }

    // Fail if required
    if (config.required) {
      return {
        valid: false,
        value: undefined,
        error: `Required environment variable "${config.name}" is not set`,
      };
    }

    // Optional and not set
    return {
      valid: true,
      value: undefined,
      warning: `Optional environment variable "${config.name}" is not set`,
    };
  }

  // Check if deprecated
  if (config.deprecated) {
    return {
      valid: true,
      value,
      warning: config.deprecationMessage || `Environment variable "${config.name}" is deprecated`,
    };
  }

  // Type validation
  const typeResult = typeValidators[config.type](value);
  if (!typeResult.valid) {
    return typeResult;
  }

  // Format validation (if specified)
  if (config.format) {
    const formatResult = formatValidators[config.format](value);
    if (!formatResult.valid) {
      return formatResult;
    }
  }

  // Custom validator (if specified)
  if (config.validator && !config.validator(value)) {
    return {
      valid: false,
      value,
      error: 'Failed custom validation',
    };
  }

  // Transform value (if transformer provided)
  const finalValue = config.transformer ? config.transformer(value) : typeResult.value;

  return {
    valid: true,
    value: finalValue,
  };
}

/**
 * Validate all environment variables
 *
 * @param configs - Array of environment variable configurations
 * @returns Map of validation results
 */
export function validateAllEnvVars(
  configs: EnhancedEnvConfig[]
): Map<string, EnvValidationResult> {
  const results = new Map<string, EnvValidationResult>();

  for (const config of configs) {
    const result = validateEnvVar(config);
    results.set(config.name, result);
  }

  return results;
}

/**
 * Get validated environment variable
 *
 * @param name - Environment variable name
 * @param config - Environment variable configuration
 * @returns Validated and typed value
 * @throws Error if validation fails
 */
export function getValidatedEnv<T = string>(
  name: string,
  config: Partial<EnhancedEnvConfig> = {}
): T {
  const fullConfig: EnhancedEnvConfig = {
    name,
    required: config.required ?? true,
    type: config.type ?? 'string',
    description: config.description ?? '',
    ...config,
  };

  const result = validateEnvVar(fullConfig);

  if (!result.valid) {
    throw new Error(`Environment validation failed for "${name}": ${result.error}`);
  }

  if (result.warning) {
    console.warn(`[EnvValidation] Warning for "${name}": ${result.warning}`);
  }

  return result.value as T;
}

/**
 * ═══════════════════════════════════════════════════════════
 * FEATURE FLAGS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Feature flag configuration
 */
export interface FeatureFlagConfig {
  name: string;
  description: string;
  default: boolean;
  deprecated?: boolean;
}

/**
 * Get feature flag value
 *
 * @param name - Feature flag name (e.g., 'FEATURE_NEW_DASHBOARD')
 * @param defaultValue - Default value if not set
 * @returns Boolean feature flag value
 */
export function getFeatureFlag(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  const result = validateBoolean(value);
  return result.valid ? (result.value as boolean) : defaultValue;
}

/**
 * Check if feature is enabled
 *
 * @param name - Feature flag name
 * @returns True if feature is enabled
 */
export function isFeatureEnabled(name: string): boolean {
  return getFeatureFlag(name, false);
}

/**
 * ═══════════════════════════════════════════════════════════
 * RUNTIME VALIDATION
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Validate environment at runtime
 *
 * Useful for validating environment after app startup when
 * certain features are accessed.
 *
 * @param configs - Array of environment variable configurations
 * @throws Error if any required variable is invalid
 */
export function validateRuntimeEnv(configs: EnhancedEnvConfig[]): void {
  const results = validateAllEnvVars(configs);

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [name, result] of results.entries()) {
    if (!result.valid && result.error) {
      errors.push(`${name}: ${result.error}`);
    }
    if (result.warning) {
      warnings.push(`${name}: ${result.warning}`);
    }
  }

  if (warnings.length > 0) {
    console.warn('[EnvValidation] Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  if (errors.length > 0) {
    throw new Error(
      `Runtime environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * EXAMPLE CONFIGURATIONS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Example: Core environment variables
 */
export const CORE_ENV_VARS: EnhancedEnvConfig[] = [
  {
    name: 'NODE_ENV',
    required: false,
    type: 'string',
    description: 'Node environment',
    default: 'development',
    validator: (v) => ['development', 'production', 'test'].includes(v),
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    type: 'url',
    description: 'NextAuth base URL',
    example: 'http://localhost:3008',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    type: 'string',
    description: 'NextAuth secret key',
    validator: (v) => v.length >= 32,
  },
];

/**
 * Example: Feature flags
 */
export const FEATURE_FLAGS: FeatureFlagConfig[] = [
  {
    name: 'FEATURE_NEW_DASHBOARD',
    description: 'Enable new dashboard UI',
    default: false,
  },
  {
    name: 'FEATURE_AI_AGENTS',
    description: 'Enable AI agent workflows',
    default: true,
  },
  {
    name: 'FEATURE_ADVANCED_ANALYTICS',
    description: 'Enable advanced analytics',
    default: false,
  },
  {
    name: 'FEATURE_STRIPE_BILLING',
    description: 'Enable Stripe billing integration',
    default: false,
  },
];
