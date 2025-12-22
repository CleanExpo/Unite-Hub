/**
 * API Validation Middleware
 *
 * Validates API connectivity and configuration before processing requests
 * Provides graceful degradation when optional APIs are unavailable
 *
 * Phase 24: API Connectivity Verification & Middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { healthCheckManager, HealthStatus } from "../health/health-check";

/**
 * API validation result
 */
export interface ApiValidationResult {
  valid: boolean;
  criticalApisHealthy: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate all critical APIs are operational
 */
export async function validateCriticalApis(): Promise<ApiValidationResult> {
  const report = await healthCheckManager.runAllChecks();

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check critical services
  if (!report.criticalServicesHealthy) {
    for (const [name, service] of Object.entries(report.services)) {
      if (service.critical && service.status === HealthStatus.UNHEALTHY) {
        errors.push(`Critical service ${name} is unhealthy: ${service.message}`);
      }
    }
  }

  // Check degraded services
  for (const [name, service] of Object.entries(report.services)) {
    if (service.status === HealthStatus.DEGRADED) {
      warnings.push(`Service ${name} is degraded: ${service.message}`);
    }
  }

  return {
    valid: report.criticalServicesHealthy,
    criticalApisHealthy: report.criticalServicesHealthy,
    warnings,
    errors,
  };
}

/**
 * Middleware to validate API connectivity before request processing
 */
export async function apiValidationMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip health check endpoint itself
  if (path === "/api/health" || path === "/health") {
    return NextResponse.next();
  }

  // Skip non-API routes
  if (!path.startsWith("/api")) {
    return NextResponse.next();
  }

  // Validate critical APIs
  const validation = await validateCriticalApis();

  if (!validation.criticalApisHealthy) {
    return NextResponse.json(
      {
        error: "Service Unavailable",
        message: "Critical API services are unhealthy",
        details: validation.errors,
        status: "UNHEALTHY",
      },
      { status: 503 }
    );
  }

  // Add warnings to response headers
  const response = NextResponse.next();
  if (validation.warnings.length > 0) {
    response.headers.set(
      "X-API-Warnings",
      JSON.stringify(validation.warnings)
    );
  }

  return response;
}

/**
 * Validate specific environment variables are configured
 */
export function validateEnvVars(required: string[]): ApiValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Required environment variable missing: ${envVar}`);
    }
  }

  return {
    valid: errors.length === 0,
    criticalApisHealthy: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Check if optional API is available
 */
export function isOptionalApiAvailable(service: string): boolean {
  const envVarMap: Record<string, string[]> = {
    openai: ["OPENAI_API_KEY"],
    openrouter: ["OPENROUTER_API_KEY"],
    stripe: ["STRIPE_SECRET_KEY"],
    sendgrid: ["SENDGRID_API_KEY"],
    gmail: ["GMAIL_CLIENT_ID"],
    redis: ["REDIS_URL"],
    datadog: ["DATADOG_API_KEY"],
  };

  const required = envVarMap[service] || [];
  return required.every((v) => process.env[v]);
}

/**
 * Get API availability summary
 */
export function getApiAvailabilitySummary(): Record<
  string,
  { critical: boolean; available: boolean }
> {
  const summary: Record<
    string,
    { critical: boolean; available: boolean }
  > = {
    anthropic: {
      critical: true,
      available: !!process.env.ANTHROPIC_API_KEY,
    },
    m1_jwt: {
      critical: true,
      available: !!process.env.M1_JWT_SECRET,
    },
    supabase: {
      critical: true,
      available:
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    openai: {
      critical: false,
      available: !!process.env.OPENAI_API_KEY,
    },
    openrouter: {
      critical: false,
      available: !!process.env.OPENROUTER_API_KEY,
    },
    stripe: {
      critical: false,
      available: !!process.env.STRIPE_SECRET_KEY,
    },
    sendgrid: {
      critical: false,
      available: !!process.env.SENDGRID_API_KEY,
    },
    gmail: {
      critical: false,
      available: !!process.env.GMAIL_CLIENT_ID,
    },
    redis: {
      critical: false,
      available: !!process.env.REDIS_URL,
    },
  };

  return summary;
}
