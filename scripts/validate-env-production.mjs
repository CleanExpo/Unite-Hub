#!/usr/bin/env node

/**
 * Production Environment Validation Script
 *
 * P3-1: Startup Environment Validation
 *
 * This script validates all required environment variables before app startup.
 * - Validates existence of required variables
 * - Checks format (UUIDs, URLs, key prefixes)
 * - Groups by service for better error reporting
 * - Exits with code 1 if validation fails
 *
 * Usage:
 *   node scripts/validate-env-production.mjs
 *   npm run validate:env
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

// Validation utilities
const validators = {
  uuid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  jwt: (value) => /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(value),
  supabaseKey: (value) => /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(value),
  anthropicKey: (value) => value.startsWith('sk-ant-'),
  openaiKey: (value) => value.startsWith('sk-') || value.startsWith('sk-proj-'),
  stripeKey: (value) => value.startsWith('sk_test_') || value.startsWith('sk_live_') || value.startsWith('rk_test_') || value.startsWith('rk_live_'),
  googleClientId: (value) => value.endsWith('.apps.googleusercontent.com'),
  googleClientSecret: (value) => value.startsWith('GOCSPX-') || value.length >= 24,
  nonEmpty: (value) => value && value.trim().length > 0,
  port: (value) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && num < 65536;
  },
};

// Environment variable definitions grouped by service
const envConfig = {
  // Next.js Core
  nextjs: {
    name: 'Next.js',
    variables: [
      {
        name: 'NODE_ENV',
        required: false,
        validator: (v) => ['development', 'production', 'test'].includes(v),
        description: 'Node environment (development, production, test)',
        default: 'development',
      },
      {
        name: 'NEXTAUTH_URL',
        required: true,
        validator: validators.url,
        description: 'NextAuth base URL',
        example: 'http://localhost:3008 or https://yourdomain.com',
      },
      {
        name: 'NEXTAUTH_SECRET',
        required: true,
        validator: (v) => v.length >= 32,
        description: 'NextAuth secret key (min 32 chars)',
        example: 'openssl rand -base64 32',
      },
    ],
  },

  // Supabase
  supabase: {
    name: 'Supabase',
    variables: [
      {
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        required: true,
        validator: (v) => validators.url(v) && v.includes('supabase'),
        description: 'Supabase project URL',
        example: 'https://xxxxx.supabase.co',
      },
      {
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        required: true,
        validator: validators.supabaseKey,
        description: 'Supabase anon/public key (JWT format)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      {
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        required: true,
        validator: validators.supabaseKey,
        description: 'Supabase service role key (bypasses RLS)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    ],
  },

  // Google OAuth
  google: {
    name: 'Google OAuth',
    variables: [
      {
        name: 'GOOGLE_CLIENT_ID',
        required: true,
        validator: validators.googleClientId,
        description: 'Google OAuth 2.0 Client ID',
        example: '123456789-abcdefg.apps.googleusercontent.com',
      },
      {
        name: 'GOOGLE_CLIENT_SECRET',
        required: true,
        validator: validators.googleClientSecret,
        description: 'Google OAuth 2.0 Client Secret',
        example: 'GOCSPX-...',
      },
      {
        name: 'GOOGLE_CALLBACK_URL',
        required: false,
        validator: validators.url,
        description: 'Google OAuth callback URL',
        example: 'http://localhost:3008/api/integrations/gmail/callback',
      },
    ],
  },

  // AI Services
  ai: {
    name: 'AI Services',
    variables: [
      {
        name: 'ANTHROPIC_API_KEY',
        required: true,
        validator: validators.anthropicKey,
        description: 'Anthropic Claude API key',
        example: 'sk-ant-...',
      },
      {
        name: 'OPENAI_API_KEY',
        required: false,
        validator: validators.openaiKey,
        description: 'OpenAI API key (for Whisper transcription)',
        example: 'sk-proj-... or sk-...',
      },
      {
        name: 'OPENROUTER_API_KEY',
        required: false,
        validator: (v) => v.startsWith('sk-or-'),
        description: 'OpenRouter API key',
        example: 'sk-or-...',
      },
      {
        name: 'PERPLEXITY_API_KEY',
        required: false,
        validator: (v) => v.startsWith('pplx-'),
        description: 'Perplexity API key (for SEO research)',
        example: 'pplx-...',
      },
      {
        name: 'GEMINI_API_KEY',
        required: false,
        validator: validators.nonEmpty,
        description: 'Google Gemini API key',
        example: 'AIza...',
      },
    ],
  },

  // Email Services
  email: {
    name: 'Email Services',
    variables: [
      {
        name: 'SENDGRID_API_KEY',
        required: false,
        validator: (v) => v.startsWith('SG.'),
        description: 'SendGrid API key (priority 1)',
        example: 'SG...',
      },
      {
        name: 'RESEND_API_KEY',
        required: false,
        validator: (v) => v.startsWith('re_'),
        description: 'Resend API key (priority 2)',
        example: 're_...',
      },
      {
        name: 'EMAIL_SERVER_HOST',
        required: false,
        validator: validators.nonEmpty,
        description: 'SMTP server host (priority 3)',
        example: 'smtp.gmail.com',
      },
      {
        name: 'EMAIL_SERVER_PORT',
        required: false,
        validator: validators.port,
        description: 'SMTP server port',
        example: '587',
      },
      {
        name: 'EMAIL_SERVER_USER',
        required: false,
        validator: validators.email,
        description: 'SMTP username (email)',
        example: 'your-email@gmail.com',
      },
      {
        name: 'EMAIL_SERVER_PASSWORD',
        required: false,
        validator: validators.nonEmpty,
        description: 'SMTP password or app password',
        example: 'your-app-password',
      },
      {
        name: 'EMAIL_FROM',
        required: false,
        validator: validators.email,
        description: 'Default "from" email address',
        example: 'noreply@yourdomain.com',
      },
    ],
  },

  // Stripe Billing
  stripe: {
    name: 'Stripe',
    variables: [
      {
        name: 'STRIPE_SECRET_KEY',
        required: false,
        validator: validators.stripeKey,
        description: 'Stripe secret key',
        example: 'sk_test_... or sk_live_...',
      },
      {
        name: 'STRIPE_PRICE_ID_STARTER',
        required: false,
        validator: (v) => v.startsWith('price_'),
        description: 'Stripe price ID for Starter plan',
        example: 'price_...',
      },
      {
        name: 'STRIPE_PRICE_ID_PROFESSIONAL',
        required: false,
        validator: (v) => v.startsWith('price_'),
        description: 'Stripe price ID for Professional plan',
        example: 'price_...',
      },
      {
        name: 'STRIPE_PRICE_ID_ENTERPRISE',
        required: false,
        validator: (v) => v.startsWith('price_'),
        description: 'Stripe price ID for Enterprise plan',
        example: 'price_...',
      },
      {
        name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        required: false,
        validator: (v) => v.startsWith('pk_test_') || v.startsWith('pk_live_'),
        description: 'Stripe publishable key (client-side)',
        example: 'pk_test_... or pk_live_...',
      },
      {
        name: 'STRIPE_WEBHOOK_SECRET',
        required: false,
        validator: (v) => v.startsWith('whsec_'),
        description: 'Stripe webhook signing secret',
        example: 'whsec_...',
      },
    ],
  },

  // Redis
  redis: {
    name: 'Redis',
    variables: [
      {
        name: 'REDIS_URL',
        required: false,
        validator: (v) => validators.url(v) || v.startsWith('redis://'),
        description: 'Redis connection URL',
        example: 'redis://localhost:6379 or rediss://...',
      },
      {
        name: 'UPSTASH_REDIS_REST_URL',
        required: false,
        validator: validators.url,
        description: 'Upstash Redis REST URL',
        example: 'https://...upstash.io',
      },
      {
        name: 'UPSTASH_REDIS_REST_TOKEN',
        required: false,
        validator: validators.nonEmpty,
        description: 'Upstash Redis REST token',
        example: 'AXX...',
      },
    ],
  },

  // Monitoring & Analytics
  monitoring: {
    name: 'Monitoring',
    variables: [
      {
        name: 'SENTRY_DSN',
        required: false,
        validator: validators.url,
        description: 'Sentry error tracking DSN',
        example: 'https://...@sentry.io/...',
      },
      {
        name: 'NEXT_PUBLIC_POSTHOG_KEY',
        required: false,
        validator: validators.nonEmpty,
        description: 'PostHog analytics key',
        example: 'phc_...',
      },
      {
        name: 'NEXT_PUBLIC_POSTHOG_HOST',
        required: false,
        validator: validators.url,
        description: 'PostHog host URL',
        example: 'https://app.posthog.com',
      },
    ],
  },
};

// Validation results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  missing: [],
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Validate environment variables
function validateEnvironment() {
  console.log(colorize('\n╔═══════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║     Unite-Hub Production Environment Validation          ║', 'cyan'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════╝\n', 'cyan'));

  let totalChecked = 0;
  let totalRequired = 0;

  // Validate each service group
  for (const [serviceKey, service] of Object.entries(envConfig)) {
    console.log(colorize(`\n[${service.name}]`, 'bright'));
    console.log('─'.repeat(60));

    for (const varDef of service.variables) {
      totalChecked++;
      if (varDef.required) totalRequired++;

      const value = process.env[varDef.name];
      const exists = value !== undefined && value !== '';

      if (!exists) {
        if (varDef.required) {
          results.failed.push(varDef);
          console.log(colorize(`✗ ${varDef.name}`, 'red'));
          console.log(colorize(`  Missing (REQUIRED)`, 'red'));
          console.log(`  ${varDef.description}`);
          if (varDef.example) {
            console.log(colorize(`  Example: ${varDef.example}`, 'yellow'));
          }
        } else {
          results.missing.push(varDef);
          console.log(colorize(`○ ${varDef.name}`, 'yellow'));
          console.log(colorize(`  Not set (optional)`, 'yellow'));
          console.log(`  ${varDef.description}`);
        }
        continue;
      }

      // Validate format if validator provided
      if (varDef.validator) {
        try {
          const isValid = varDef.validator(value);
          if (!isValid) {
            if (varDef.required) {
              results.failed.push(varDef);
              console.log(colorize(`✗ ${varDef.name}`, 'red'));
              console.log(colorize(`  Invalid format (REQUIRED)`, 'red'));
            } else {
              results.warnings.push(varDef);
              console.log(colorize(`⚠ ${varDef.name}`, 'yellow'));
              console.log(colorize(`  Invalid format (optional)`, 'yellow'));
            }
            console.log(`  ${varDef.description}`);
            if (varDef.example) {
              console.log(colorize(`  Expected format: ${varDef.example}`, 'yellow'));
            }
            continue;
          }
        } catch (err) {
          if (varDef.required) {
            results.failed.push(varDef);
            console.log(colorize(`✗ ${varDef.name}`, 'red'));
            console.log(colorize(`  Validation error: ${err.message}`, 'red'));
          } else {
            results.warnings.push(varDef);
            console.log(colorize(`⚠ ${varDef.name}`, 'yellow'));
            console.log(colorize(`  Validation warning: ${err.message}`, 'yellow'));
          }
          continue;
        }
      }

      // Passed validation
      results.passed.push(varDef);
      const maskedValue = maskSensitiveValue(varDef.name, value);
      console.log(colorize(`✓ ${varDef.name}`, 'green'));
      console.log(colorize(`  ${maskedValue}`, 'green'));
    }
  }

  // Custom validations
  console.log(colorize('\n\n[Additional Validations]', 'bright'));
  console.log('─'.repeat(60));

  // Validate email service configuration
  validateEmailService();

  // Validate Redis configuration
  validateRedisConfig();

  // Print summary
  printSummary(totalChecked, totalRequired);

  // Exit with appropriate code
  if (results.failed.length > 0) {
    console.log(colorize('\n❌ Environment validation FAILED', 'red'));
    console.log(colorize('Please fix the errors above before starting the application.\n', 'red'));
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log(colorize('\n⚠️  Environment validation passed with warnings', 'yellow'));
    console.log(colorize('Some optional variables have issues but app can start.\n', 'yellow'));
    process.exit(0);
  } else {
    console.log(colorize('\n✅ Environment validation PASSED', 'green'));
    console.log(colorize('All required variables are set and valid.\n', 'green'));
    process.exit(0);
  }
}

function validateEmailService() {
  const sendgrid = process.env.SENDGRID_API_KEY;
  const resend = process.env.RESEND_API_KEY;
  const smtp = process.env.EMAIL_SERVER_HOST &&
               process.env.EMAIL_SERVER_PORT &&
               process.env.EMAIL_SERVER_USER &&
               process.env.EMAIL_SERVER_PASSWORD;

  if (!sendgrid && !resend && !smtp) {
    console.log(colorize('⚠ No email service configured', 'yellow'));
    console.log('  At least one email service should be configured:');
    console.log('  - SENDGRID_API_KEY (priority 1)');
    console.log('  - RESEND_API_KEY (priority 2)');
    console.log('  - EMAIL_SERVER_* (SMTP, priority 3)');
  } else {
    if (sendgrid) {
      console.log(colorize('✓ Email service: SendGrid (priority 1)', 'green'));
    } else if (resend) {
      console.log(colorize('✓ Email service: Resend (priority 2)', 'green'));
    } else if (smtp) {
      console.log(colorize('✓ Email service: SMTP (priority 3)', 'green'));
    }
  }
}

function validateRedisConfig() {
  const redisUrl = process.env.REDIS_URL;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl && (!upstashUrl || !upstashToken)) {
    console.log(colorize('○ No Redis configured (optional)', 'yellow'));
    console.log('  Redis enables caching and rate limiting features.');
    console.log('  Configure either REDIS_URL or UPSTASH_REDIS_REST_*');
  } else {
    if (redisUrl) {
      console.log(colorize('✓ Redis: Standard Redis URL', 'green'));
    } else {
      console.log(colorize('✓ Redis: Upstash REST API', 'green'));
    }
  }
}

function maskSensitiveValue(name, value) {
  // Don't mask URLs or non-sensitive values
  if (name.includes('URL') || name.includes('HOST') || name === 'NODE_ENV') {
    return value;
  }

  // Mask keys and secrets
  if (value.length <= 8) {
    return '***';
  }
  return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
}

function printSummary(totalChecked, totalRequired) {
  console.log(colorize('\n\n╔═══════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║                   Validation Summary                      ║', 'cyan'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════╝\n', 'cyan'));

  console.log(`Total variables checked: ${colorize(totalChecked, 'bright')}`);
  console.log(`Required variables: ${colorize(totalRequired, 'bright')}`);
  console.log(`Passed: ${colorize(results.passed.length, 'green')}`);
  console.log(`Failed: ${colorize(results.failed.length, results.failed.length > 0 ? 'red' : 'green')}`);
  console.log(`Warnings: ${colorize(results.warnings.length, results.warnings.length > 0 ? 'yellow' : 'green')}`);
  console.log(`Missing (optional): ${colorize(results.missing.length, 'yellow')}`);

  if (results.failed.length > 0) {
    console.log(colorize('\n⚠️  Failed Variables (MUST FIX):', 'red'));
    results.failed.forEach(v => {
      console.log(colorize(`   • ${v.name}`, 'red'));
    });
  }

  if (results.warnings.length > 0) {
    console.log(colorize('\n⚠️  Warning Variables (Check Format):', 'yellow'));
    results.warnings.forEach(v => {
      console.log(colorize(`   • ${v.name}`, 'yellow'));
    });
  }
}

// Run validation
validateEnvironment();
