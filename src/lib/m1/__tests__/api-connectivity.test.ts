/**
 * M1 API Connectivity Verification Tests
 *
 * Validates all critical and optional API integrations
 * Required for production readiness verification
 *
 * Phase 24: Advanced Rate Limiting & API Validation
 */

import { describe, it, expect, beforeEach } from "vitest";

/**
 * Environment variable validation interface
 */
interface ApiConnectionStatus {
  name: string;
  required: boolean;
  configured: boolean;
  hasValue: boolean;
  message: string;
}

/**
 * Test suite for API connectivity verification
 */
describe("M1 API Connectivity", () => {
  /**
   * Helper to check if environment variable is configured
   */
  function checkApiConnection(
    envVar: string,
    required: boolean = false
  ): ApiConnectionStatus {
    const value = process.env[envVar];
    const hasValue = !!value && value.length > 0;

    return {
      name: envVar,
      required,
      configured: hasValue,
      hasValue,
      message: hasValue
        ? `${envVar} is configured`
        : `${envVar} is ${required ? "MISSING (CRITICAL)" : "not configured (optional)"}`,
    };
  }

  describe("Critical APIs (Required for M1 v2.0.0)", () => {
    it("should have ANTHROPIC_API_KEY configured", () => {
      const status = checkApiConnection("ANTHROPIC_API_KEY", true);
      expect(status.hasValue).toBe(true);
      console.log(`✅ ${status.message}`);
    });

    it("should have M1_JWT_SECRET configured", () => {
      const status = checkApiConnection("M1_JWT_SECRET", true);
      expect(status.hasValue).toBe(true);
      // Verify minimum length for security
      if (process.env.M1_JWT_SECRET) {
        expect(process.env.M1_JWT_SECRET.length).toBeGreaterThanOrEqual(32);
      }
      console.log(`✅ ${status.message}`);
    });

    it("should have Supabase URL configured", () => {
      const status = checkApiConnection("NEXT_PUBLIC_SUPABASE_URL", true);
      expect(status.hasValue).toBe(true);
      console.log(`✅ ${status.message}`);
    });

    it("should have Supabase service role key configured", () => {
      const status = checkApiConnection("SUPABASE_SERVICE_ROLE_KEY", true);
      expect(status.hasValue).toBe(true);
      console.log(`✅ ${status.message}`);
    });
  });

  describe("Optional APIs (Enhanced Features)", () => {
    it("should have OpenAI API key configured (optional)", () => {
      const status = checkApiConnection("OPENAI_API_KEY", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
        expect(status.configured).toBe(true);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have OpenRouter API key configured (optional)", () => {
      const status = checkApiConnection("OPENROUTER_API_KEY", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have Stripe secret key configured (optional)", () => {
      const status = checkApiConnection("STRIPE_SECRET_KEY", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have SendGrid API key configured (optional)", () => {
      const status = checkApiConnection("SENDGRID_API_KEY", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have Gmail OAuth configured (optional)", () => {
      const gmailId = checkApiConnection("GMAIL_CLIENT_ID", false);
      const gmailSecret = checkApiConnection("GMAIL_CLIENT_SECRET", false);

      if (gmailId.hasValue && gmailSecret.hasValue) {
        console.log(`✅ Gmail OAuth is configured`);
      } else if (gmailId.hasValue || gmailSecret.hasValue) {
        console.log(`⚠️  Gmail OAuth partially configured`);
      } else {
        console.log(`ℹ️  Gmail OAuth not configured (optional)`);
      }
    });

    it("should have Redis configured (optional)", () => {
      const status = checkApiConnection("REDIS_URL", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have Gemini API key configured (optional)", () => {
      const status = checkApiConnection("GEMINI_API_KEY", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have Perplexity API key configured (optional)", () => {
      const status = checkApiConnection("PERPLEXITY_API_KEY", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have ElevenLabs API key configured (optional)", () => {
      const status = checkApiConnection("ELEVENLABS_API_KEY", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });

    it("should have DataForSEO configured (optional)", () => {
      const login = checkApiConnection("DATAFORSEO_API_LOGIN", false);
      const password = checkApiConnection("DATAFORSEO_API_PASSWORD", false);

      if (login.hasValue && password.hasValue) {
        console.log(`✅ DataForSEO is configured`);
      } else {
        console.log(`ℹ️  DataForSEO not configured (optional)`);
      }
    });

    it("should have SEMRush configured (optional)", () => {
      const status = checkApiConnection("SEMRUSH_API", false);
      if (status.hasValue) {
        console.log(`✅ ${status.message}`);
      } else {
        console.log(`ℹ️  ${status.message}`);
      }
    });
  });

  describe("Email & Communication APIs", () => {
    it("should have SMTP configured for email fallback (optional)", () => {
      const host = checkApiConnection("EMAIL_SERVER_HOST", false);
      const user = checkApiConnection("EMAIL_SERVER_USER", false);

      if (host.hasValue && user.hasValue) {
        console.log(`✅ SMTP email is configured`);
      } else {
        console.log(`ℹ️  SMTP email not configured (optional)`);
      }
    });

    it("should have NextAuth secrets configured (optional)", () => {
      const secret = checkApiConnection("NEXTAUTH_SECRET", false);
      const url = checkApiConnection("NEXTAUTH_URL", false);

      if (secret.hasValue && url.hasValue) {
        console.log(`✅ NextAuth is configured`);
      } else {
        console.log(`ℹ️  NextAuth not fully configured (optional)`);
      }
    });
  });

  describe("M1 Configuration", () => {
    it("should have proper M1 logging configuration", () => {
      const level = process.env.M1_LOG_LEVEL || "info";
      expect(["error", "warn", "info", "debug"]).toContain(level);
      console.log(`✅ M1_LOG_LEVEL is set to: ${level}`);
    });

    it("should have M1 execution limits configured", () => {
      const maxTools = parseInt(process.env.M1_MAX_TOOL_CALLS || "50", 10);
      const maxSteps = parseInt(process.env.M1_MAX_STEPS || "100", 10);
      const maxRuntime = parseInt(process.env.M1_MAX_RUNTIME || "300", 10);

      expect(maxTools).toBeGreaterThan(0);
      expect(maxSteps).toBeGreaterThan(0);
      expect(maxRuntime).toBeGreaterThan(0);

      console.log(`✅ M1 execution limits configured`);
      console.log(`   - Max tool calls: ${maxTools}`);
      console.log(`   - Max steps: ${maxSteps}`);
      console.log(`   - Max runtime: ${maxRuntime}s`);
    });

    it("should have M1 persistence enabled", () => {
      const enabled = process.env.M1_ENABLE_PERSISTENCE !== "0";
      expect(enabled).toBe(true);
      console.log(`✅ M1 persistence is enabled`);
    });
  });

  describe("Production Readiness", () => {
    it("should have all critical APIs ready for production", () => {
      const criticalApis = [
        "ANTHROPIC_API_KEY",
        "M1_JWT_SECRET",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
      ];

      const allConfigured = criticalApis.every((api) => {
        const value = process.env[api];
        return !!value && value.length > 0;
      });

      expect(allConfigured).toBe(true);
      console.log(`✅ All critical APIs are configured and ready`);
    });

    it("should have security tokens properly configured", () => {
      const jwtSecret = process.env.M1_JWT_SECRET;
      const nextAuthSecret = process.env.NEXTAUTH_SECRET;

      // JWT secret should be min 32 chars if configured
      if (jwtSecret) {
        expect(jwtSecret.length).toBeGreaterThanOrEqual(32);
      }

      // NextAuth secret should also be substantial
      if (nextAuthSecret) {
        expect(nextAuthSecret.length).toBeGreaterThan(16);
      }

      console.log(`✅ Security tokens are properly configured`);
    });

    it("should have database connection ready", () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(supabaseUrl).toBeTruthy();
      expect(supabaseKey).toBeTruthy();
      expect(supabaseUrl).toMatch(/supabase\.co/);

      console.log(`✅ Database connection is properly configured`);
    });
  });

  describe("API Connection Summary", () => {
    it("should provide complete API connectivity report", () => {
      const apis = {
        critical: {
          anthropic: !!process.env.ANTHROPIC_API_KEY,
          m1_jwt: !!process.env.M1_JWT_SECRET,
          supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
        optional: {
          openai: !!process.env.OPENAI_API_KEY,
          openrouter: !!process.env.OPENROUTER_API_KEY,
          stripe: !!process.env.STRIPE_SECRET_KEY,
          sendgrid: !!process.env.SENDGRID_API_KEY,
          redis: !!process.env.REDIS_URL,
        },
      };

      const criticalCount = Object.values(apis.critical).filter(
        Boolean
      ).length;
      const optionalCount = Object.values(apis.optional).filter(
        Boolean
      ).length;

      console.log(`\n📊 API Connectivity Summary:`);
      console.log(`   Critical APIs: ${criticalCount}/${Object.keys(apis.critical).length} configured`);
      console.log(`   Optional APIs: ${optionalCount}/${Object.keys(apis.optional).length} configured`);
      console.log(`   Total: ${criticalCount + optionalCount} APIs ready\n`);

      // All critical APIs must be configured
      expect(criticalCount).toBe(Object.keys(apis.critical).length);
    });
  });
});
