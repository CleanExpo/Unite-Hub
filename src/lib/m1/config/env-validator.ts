/**
 * Environment Variable Validator
 *
 * Comprehensive validation of all environment variables required for M1
 * Provides detailed reporting of missing, invalid, or misconfigured variables
 *
 * Phase 24: Environment Configuration Verification
 */

/**
 * Environment variable definition
 */
export interface EnvVarDefinition {
  name: string;
  required: boolean;
  category: "critical" | "optional" | "internal";
  description: string;
  minLength?: number;
  pattern?: RegExp;
  example?: string;
}

/**
 * Validation result for an environment variable
 */
export interface EnvVarValidationResult {
  name: string;
  status: "valid" | "invalid" | "missing" | "warning";
  value?: string;
  message: string;
  suggestions?: string[];
}

/**
 * Complete validation report
 */
export interface EnvValidationReport {
  timestamp: Date;
  status: "valid" | "invalid" | "incomplete";
  criticalIssues: EnvVarValidationResult[];
  warnings: EnvVarValidationResult[];
  missingCritical: string[];
  allVariables: EnvVarValidationResult[];
  summary: {
    totalChecked: number;
    valid: number;
    invalid: number;
    missing: number;
    warnings: number;
  };
}

/**
 * Environment variable definitions
 */
const ENV_DEFINITIONS: Record<string, EnvVarDefinition> = {
  // Critical M1 APIs
  ANTHROPIC_API_KEY: {
    name: "ANTHROPIC_API_KEY",
    required: true,
    category: "critical",
    description: "Anthropic Claude API key for OrchestratorAgent",
    minLength: 20,
    pattern: /^sk-ant-/,
    example: "sk-ant-...",
  },

  M1_JWT_SECRET: {
    name: "M1_JWT_SECRET",
    required: true,
    category: "critical",
    description: "M1 Agent approval token signing secret",
    minLength: 32,
    example: "openssl rand -hex 32",
  },

  NEXT_PUBLIC_SUPABASE_URL: {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    category: "critical",
    description: "Supabase database URL",
    minLength: 20,
    pattern: /https:\/\/.*\.supabase\.co/,
    example: "https://your-project.supabase.co",
  },

  SUPABASE_SERVICE_ROLE_KEY: {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    category: "critical",
    description: "Supabase service role key for server-side operations",
    minLength: 20,
    example: "eyJhbGciOiJIUzI1NiIs...",
  },

  // Optional but Recommended
  OPENAI_API_KEY: {
    name: "OPENAI_API_KEY",
    required: false,
    category: "optional",
    description: "OpenAI API key for Whisper transcription",
    minLength: 20,
    pattern: /^sk-/,
  },

  OPENROUTER_API_KEY: {
    name: "OPENROUTER_API_KEY",
    required: false,
    category: "optional",
    description: "OpenRouter API key for multi-model routing",
    minLength: 20,
  },

  STRIPE_SECRET_KEY: {
    name: "STRIPE_SECRET_KEY",
    required: false,
    category: "optional",
    description: "Stripe secret key for payment processing",
    pattern: /^sk_(test|live)_/,
  },

  SENDGRID_API_KEY: {
    name: "SENDGRID_API_KEY",
    required: false,
    category: "optional",
    description: "SendGrid API key for email delivery",
    pattern: /^SG\./,
  },

  GMAIL_CLIENT_ID: {
    name: "GMAIL_CLIENT_ID",
    required: false,
    category: "optional",
    description: "Google OAuth client ID for Gmail integration",
  },

  GMAIL_CLIENT_SECRET: {
    name: "GMAIL_CLIENT_SECRET",
    required: false,
    category: "optional",
    description: "Google OAuth client secret for Gmail integration",
  },

  REDIS_URL: {
    name: "REDIS_URL",
    required: false,
    category: "optional",
    description: "Redis connection URL for caching",
    pattern: /^redis:\/\//,
    example: "redis://localhost:6379",
  },

  NEXTAUTH_SECRET: {
    name: "NEXTAUTH_SECRET",
    required: false,
    category: "internal",
    description: "NextAuth encryption secret",
    minLength: 16,
  },

  // Additional services
  GEMINI_API_KEY: {
    name: "GEMINI_API_KEY",
    required: false,
    category: "optional",
    description: "Google Gemini API key for image generation",
  },

  PERPLEXITY_API_KEY: {
    name: "PERPLEXITY_API_KEY",
    required: false,
    category: "optional",
    description: "Perplexity API key for real-time search",
  },

  ELEVENLABS_API_KEY: {
    name: "ELEVENLABS_API_KEY",
    required: false,
    category: "optional",
    description: "ElevenLabs API key for voice synthesis",
  },

  DATADOG_API_KEY: {
    name: "DATADOG_API_KEY",
    required: false,
    category: "optional",
    description: "Datadog API key for APM monitoring",
  },
};

/**
 * Environment variable validator
 */
export class EnvVariableValidator {
  /**
   * Validate a single environment variable
   */
  static validateVariable(
    name: string,
    definition: EnvVarDefinition
  ): EnvVarValidationResult {
    const value = process.env[name];

    // Check if missing
    if (!value) {
      if (definition.required) {
        return {
          name,
          status: "missing",
          message: `Required variable is missing`,
          suggestions: [
            `Set ${name} in your environment`,
            `Example: ${definition.example || "see documentation"}`,
          ],
        };
      }
      return {
        name,
        status: "warning",
        message: `Optional variable not configured`,
      };
    }

    // Check minimum length
    if (definition.minLength && value.length < definition.minLength) {
      return {
        name,
        status: "invalid",
        message: `Value too short (${value.length} chars, min ${definition.minLength})`,
        suggestions: ["Generate a longer secret", "Check copied value"],
      };
    }

    // Check pattern
    if (definition.pattern && !definition.pattern.test(value)) {
      return {
        name,
        status: "invalid",
        message: `Value does not match expected format`,
        suggestions: [
          `Expected format: ${definition.pattern.source}`,
          `Example: ${definition.example || "see documentation"}`,
        ],
      };
    }

    return {
      name,
      status: "valid",
      value: value.substring(0, 10) + "...",
      message: `Variable is correctly configured`,
    };
  }

  /**
   * Validate all defined environment variables
   */
  static validateAll(): EnvValidationReport {
    const results: EnvVarValidationResult[] = [];
    const criticalIssues: EnvVarValidationResult[] = [];
    const warnings: EnvVarValidationResult[] = [];
    const missingCritical: string[] = [];

    for (const [name, definition] of Object.entries(ENV_DEFINITIONS)) {
      const result = this.validateVariable(name, definition);
      results.push(result);

      if (result.status === "invalid" || result.status === "missing") {
        if (definition.required) {
          criticalIssues.push(result);
          if (result.status === "missing") {
            missingCritical.push(name);
          }
        } else if (result.status === "warning") {
          warnings.push(result);
        }
      } else if (result.status === "warning") {
        warnings.push(result);
      }
    }

    const summary = {
      totalChecked: results.length,
      valid: results.filter((r) => r.status === "valid").length,
      invalid: results.filter((r) => r.status === "invalid").length,
      missing: results.filter((r) => r.status === "missing").length,
      warnings: warnings.length,
    };

    const status =
      criticalIssues.length > 0
        ? "invalid"
        : missingCritical.length > 0
          ? "incomplete"
          : "valid";

    return {
      timestamp: new Date(),
      status,
      criticalIssues,
      warnings,
      missingCritical,
      allVariables: results,
      summary,
    };
  }

  /**
   * Format validation report as human-readable text
   */
  static formatReport(report: EnvValidationReport): string {
    const lines: string[] = [];

    lines.push("=".repeat(80));
    lines.push("ENVIRONMENT VARIABLE VALIDATION REPORT");
    lines.push(`Status: ${report.status.toUpperCase()}`);
    lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
    lines.push("");

    lines.push("SUMMARY:");
    lines.push(
      `  Total Checked: ${report.summary.totalChecked}`
    );
    lines.push(`  Valid: ${report.summary.valid} ✅`);
    lines.push(`  Invalid: ${report.summary.invalid} ❌`);
    lines.push(`  Missing: ${report.summary.missing} ⚠️`);
    lines.push(`  Warnings: ${report.summary.warnings} ℹ️`);
    lines.push("");

    if (report.criticalIssues.length > 0) {
      lines.push("CRITICAL ISSUES:");
      for (const issue of report.criticalIssues) {
        lines.push(`  ❌ ${issue.name}`);
        lines.push(`     ${issue.message}`);
        if (issue.suggestions) {
          for (const suggestion of issue.suggestions) {
            lines.push(`     → ${suggestion}`);
          }
        }
      }
      lines.push("");
    }

    if (report.warnings.length > 0) {
      lines.push("WARNINGS:");
      for (const warning of report.warnings) {
        lines.push(`  ⚠️  ${warning.name}`);
        lines.push(`     ${warning.message}`);
      }
      lines.push("");
    }

    lines.push("DETAILED STATUS:");
    for (const result of report.allVariables) {
      const icon =
        result.status === "valid"
          ? "✅"
          : result.status === "invalid"
            ? "❌"
            : result.status === "missing"
              ? "🚫"
              : "ℹ️";
      lines.push(`  ${icon} ${result.name}: ${result.status}`);
    }

    lines.push("");
    lines.push("=".repeat(80));

    return lines.join("\n");
  }

  /**
   * Check if configuration is production-ready
   */
  static isProductionReady(): boolean {
    const report = this.validateAll();
    return (
      report.status === "valid" && report.criticalIssues.length === 0
    );
  }
}

/**
 * Export singleton instance
 */
export const envValidator = EnvVariableValidator;
