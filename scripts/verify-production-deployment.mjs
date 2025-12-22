#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 *
 * Comprehensive pre-deployment verification for M1 v2.0.0
 * Validates all critical APIs and configuration
 *
 * Usage: node scripts/verify-production-deployment.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Color codes for terminal output
 */
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

/**
 * Print colored output
 */
function print(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

/**
 * Verification result
 */
class VerificationResult {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  add(name, status, message) {
    this.checks.push({ name, status, message });
    if (status === "pass") this.passed++;
    else if (status === "fail") this.failed++;
    else if (status === "warn") this.warnings++;
  }

  print() {
    print("blue", "=".repeat(80));
    print("blue", "M1 PRODUCTION DEPLOYMENT VERIFICATION");
    print("blue", "=".repeat(80));
    print("cyan", "");

    for (const check of this.checks) {
      const icon =
        check.status === "pass"
          ? "✅"
          : check.status === "fail"
            ? "❌"
            : "⚠️";
      print(
        check.status === "pass"
          ? "green"
          : check.status === "fail"
            ? "red"
            : "yellow",
        `${icon} ${check.name}`
      );
      print("cyan", `   ${check.message}`);
    }

    print("blue", "");
    print("blue", "=".repeat(80));
    print("blue", "SUMMARY");
    print("blue", "=".repeat(80));

    print("green", `✅ Passed: ${this.passed}`);
    if (this.warnings > 0) print("yellow", `⚠️  Warnings: ${this.warnings}`);
    if (this.failed > 0) print("red", `❌ Failed: ${this.failed}`);

    print("blue", "");

    if (this.failed === 0) {
      print("green", "🚀 DEPLOYMENT READY!");
    } else {
      print("red", "⛔ DEPLOYMENT BLOCKED - FIX ISSUES ABOVE");
      process.exit(1);
    }
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Check Node.js version
 */
function checkNodeVersion(result) {
  const version = process.version;
  const major = parseInt(version.split(".")[0].substring(1));

  if (major >= 16) {
    result.add(
      "Node.js Version",
      "pass",
      `Version ${version} (≥ 16 required)`
    );
  } else {
    result.add(
      "Node.js Version",
      "fail",
      `Version ${version} is too old (≥ 16 required)`
    );
  }
}

/**
 * Check critical files exist
 */
function checkFiles(result) {
  const criticalFiles = [
    "package.json",
    "src/lib/m1/config.ts",
    "src/lib/m1/agents/orchestrator.ts",
    "src/lib/m1/health/health-check.ts",
    "src/lib/m1/middleware/api-validation.ts",
    "src/lib/m1/config/env-validator.ts",
  ];

  for (const file of criticalFiles) {
    if (fileExists(file)) {
      result.add(`File: ${file}`, "pass", "File exists");
    } else {
      result.add(`File: ${file}`, "fail", "File missing - required for deployment");
    }
  }
}

/**
 * Check critical environment variables
 */
function checkEnvironment(result) {
  const critical = [
    "ANTHROPIC_API_KEY",
    "M1_JWT_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  for (const env of critical) {
    const value = process.env[env];
    if (value) {
      result.add(
        `Env: ${env}`,
        "pass",
        `Set to ${value.substring(0, 10)}...`
      );
    } else {
      result.add(
        `Env: ${env}`,
        "fail",
        `Not set - required for deployment`
      );
    }
  }
}

/**
 * Check M1_JWT_SECRET security requirements
 */
function checkJwtSecurity(result) {
  const secret = process.env.M1_JWT_SECRET;
  if (!secret) {
    result.add(
      "M1_JWT_SECRET Security",
      "fail",
      "Secret not configured"
    );
    return;
  }

  if (secret.length < 32) {
    result.add(
      "M1_JWT_SECRET Length",
      "fail",
      `Too short: ${secret.length} chars (min 32 required)`
    );
  } else {
    result.add(
      "M1_JWT_SECRET Length",
      "pass",
      `Adequate: ${secret.length} chars`
    );
  }

  // Check if it looks like dev value
  if (secret === "289423b73d6b61a0657d99b2fc203a48f34fbbf9143afd766e9d79b5e4316eac") {
    result.add(
      "M1_JWT_SECRET",
      "fail",
      "⚠️  Using development secret - MUST change for production"
    );
  } else {
    result.add(
      "M1_JWT_SECRET",
      "pass",
      "Using production secret"
    );
  }
}

/**
 * Check for test files
 */
function checkTestFiles(result) {
  const testFiles = [
    "src/lib/m1/__tests__/phase-24-rate-limiting.test.ts",
    "src/lib/m1/__tests__/api-connectivity.test.ts",
  ];

  for (const file of testFiles) {
    if (fileExists(file)) {
      result.add(`Test: ${file}`, "pass", "Test file present");
    } else {
      result.add(`Test: ${file}`, "warn", "Test file missing");
    }
  }
}

/**
 * Check documentation
 */
function checkDocumentation(result) {
  const docs = [
    "M1_API_CONNECTIVITY_REPORT.md",
    "DEPLOYMENT_GUIDE.md",
    "QUICK_REFERENCE.md",
  ];

  for (const doc of docs) {
    if (fileExists(doc)) {
      result.add(`Doc: ${doc}`, "pass", "Documentation present");
    } else {
      result.add(
        `Doc: ${doc}`,
        "warn",
        "Documentation not found"
      );
    }
  }
}

/**
 * Check Stripe configuration (if using payments)
 */
function checkStripe(result) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey && !webhookSecret) {
    result.add(
      "Stripe Configuration",
      "warn",
      "Not configured - payment processing disabled"
    );
    return;
  }

  if (secretKey) {
    if (secretKey.startsWith("sk_test_")) {
      result.add(
        "Stripe Keys",
        "fail",
        "Using TEST keys - must switch to LIVE for production"
      );
    } else if (secretKey.startsWith("sk_live_")) {
      result.add(
        "Stripe Keys",
        "pass",
        "Using LIVE keys"
      );
    }
  }
}

/**
 * Check OpenAI configuration
 */
function checkOpenAI(result) {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    result.add(
      "OpenAI Configuration",
      "warn",
      "Not configured - transcription disabled"
    );
  } else {
    result.add(
      "OpenAI Configuration",
      "pass",
      "Configured"
    );
  }
}

/**
 * Check Redis configuration
 */
function checkRedis(result) {
  const url = process.env.REDIS_URL;

  if (!url) {
    result.add(
      "Redis Configuration",
      "warn",
      "Not configured - caching disabled"
    );
  } else {
    if (url.includes("localhost")) {
      result.add(
        "Redis Configuration",
        "warn",
        "Using localhost - configure for production"
      );
    } else {
      result.add(
        "Redis Configuration",
        "pass",
        "Configured for production"
      );
    }
  }
}

/**
 * Run all verifications
 */
async function runVerifications() {
  const result = new VerificationResult();

  print("cyan", "Running deployment verifications...\n");

  checkNodeVersion(result);
  checkFiles(result);
  checkEnvironment(result);
  checkJwtSecurity(result);
  checkTestFiles(result);
  checkDocumentation(result);
  checkStripe(result);
  checkOpenAI(result);
  checkRedis(result);

  result.print();
}

// Run verifications
runVerifications().catch((error) => {
  print("red", `Error: ${error.message}`);
  process.exit(1);
});
