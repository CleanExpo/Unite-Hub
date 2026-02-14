#!/usr/bin/env node

/**
 * Environment Validation Script
 *
 * Validates all required environment variables before starting the app.
 * Run this manually or as part of package.json scripts.
 */

import { config } from "dotenv";
import { existsSync } from "fs";
import { join } from "path";

// Load .env.local if it exists
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("✓ Loaded .env.local");
} else {
  console.warn("⚠️  .env.local not found - using system environment variables only");
}

const ENV_VARIABLES = [
  // Authentication
  { name: "NEXTAUTH_URL", required: true, example: "http://localhost:3008" },
  { name: "NEXTAUTH_SECRET", required: true, example: "your-secret-key-here" },

  // Supabase
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, example: "https://your-project.supabase.co" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },

  // Google OAuth
  { name: "GOOGLE_CLIENT_ID", required: true, example: "123456789-abcdefg.apps.googleusercontent.com" },
  { name: "GOOGLE_CLIENT_SECRET", required: true, example: "GOCSPX-..." },

  // AI Models
  { name: "ANTHROPIC_API_KEY", required: true, example: "sk-ant-..." },
  { name: "OPENAI_API_KEY", required: false, example: "sk-proj-..." },

  // Stripe
  { name: "STRIPE_SECRET_KEY", required: false, example: "sk_test_..." },
  { name: "STRIPE_PRICE_ID_STARTER", required: false, example: "price_..." },
  { name: "STRIPE_PRICE_ID_PROFESSIONAL", required: false, example: "price_..." },

  // OpenRouter
  { name: "OPENROUTER_API_KEY", required: false, example: "sk-or-v1-..." },

  // Security
  { name: "FIELD_ENCRYPTION_KEY", required: false, example: "64-char hex string (node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")" },

  // Social Media Connectors
  { name: "META_APP_ID", required: false, example: "123456789012345" },
  { name: "META_APP_SECRET", required: false, example: "abcdef0123456789..." },
  { name: "LINKEDIN_CLIENT_ID", required: false, example: "77abc12345" },
  { name: "LINKEDIN_CLIENT_SECRET", required: false, example: "abcDEF123" },
  { name: "REDDIT_CLIENT_ID", required: false, example: "abc123DEF456" },
  { name: "REDDIT_CLIENT_SECRET", required: false, example: "abc123DEF456ghi789" },
  { name: "YOUTUBE_CHANNEL_ID", required: false, example: "UC..." },
];

let hasErrors = false;
const missing = [];
const warnings = [];

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║         ENVIRONMENT VALIDATION                             ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

for (const env of ENV_VARIABLES) {
  const value = process.env[env.name];

  if (!value || value.trim() === "") {
    if (env.required) {
      missing.push(env.name);
      console.error(`❌ ${env.name} - REQUIRED but not set`);
      console.error(`   Example: ${env.example}\n`);
      hasErrors = true;
    } else {
      warnings.push(env.name);
      console.warn(`⚠️  ${env.name} - Optional (not set)`);
      console.warn(`   Example: ${env.example}\n`);
    }
  } else {
    console.log(`✓ ${env.name} - Set`);
  }
}

console.log("\n" + "═".repeat(60) + "\n");

if (missing.length > 0) {
  console.error(`\n❌ VALIDATION FAILED\n`);
  console.error(`Missing ${missing.length} required variable(s):`);
  missing.forEach((name) => console.error(`  - ${name}`));
  console.error(`\nTo fix:`);
  console.error(`1. Copy .env.example to .env.local`);
  console.error(`2. Fill in the required values`);
  console.error(`3. Run this script again: npm run validate:env`);
  console.error(``);
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn(`\n⚠️  ${warnings.length} optional variable(s) not set:`);
  warnings.forEach((name) => console.warn(`  - ${name}`));
  console.warn(`\nThese are optional but recommended for full functionality.\n`);
}

console.log(`✅ VALIDATION PASSED\n`);
console.log(`All required environment variables are set.`);
console.log(`Ready to start the application!\n`);
process.exit(0);
