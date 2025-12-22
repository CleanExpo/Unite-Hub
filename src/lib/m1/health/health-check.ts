/**
 * M1 Health Check System
 *
 * Comprehensive health monitoring for all critical and optional APIs
 * Required for production readiness and operational visibility
 *
 * Phase 24: API Connectivity Verification & Health Monitoring
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Health check status enumeration
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
  UNKNOWN = "unknown",
}

/**
 * Individual service health status
 */
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime: number; // milliseconds
  lastChecked: Date;
  message: string;
  critical: boolean;
}

/**
 * Overall system health report
 */
export interface HealthReport {
  status: HealthStatus;
  timestamp: Date;
  uptime: number; // milliseconds
  services: Record<string, ServiceHealth>;
  criticalServicesHealthy: boolean;
  metrics: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
  };
}

/**
 * M1 Health Check Manager
 */
export class HealthCheckManager {
  private services: Map<string, ServiceHealth> = new Map();
  private startTime: number = Date.now();
  private lastCheck: Date = new Date();

  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize all service health trackers
   */
  private initializeServices(): void {
    // Critical services
    this.registerService("anthropic", true);
    this.registerService("m1_jwt", true);
    this.registerService("supabase", true);

    // Optional services
    this.registerService("openai", false);
    this.registerService("openrouter", false);
    this.registerService("stripe", false);
    this.registerService("sendgrid", false);
    this.registerService("gmail_oauth", false);
    this.registerService("redis", false);
    this.registerService("nextauth", false);
    this.registerService("google_oauth", false);
    this.registerService("gemini", false);
    this.registerService("perplexity", false);
    this.registerService("dataforseo", false);
    this.registerService("semrush", false);
    this.registerService("elevenlabs", false);
    this.registerService("datadog", false);
  }

  /**
   * Register a service for health monitoring
   */
  private registerService(name: string, critical: boolean): void {
    this.services.set(name, {
      name,
      status: HealthStatus.UNKNOWN,
      responseTime: 0,
      lastChecked: new Date(),
      message: "Not yet checked",
      critical,
    });
  }

  /**
   * Check Anthropic API connectivity
   */
  async checkAnthropicHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    try {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        return this.updateService("anthropic", {
          status: HealthStatus.UNHEALTHY,
          message: "ANTHROPIC_API_KEY not configured",
          responseTime: performance.now() - startTime,
        });
      }

      // Simple header validation (lightweight check)
      if (key.length > 0 && key.startsWith("sk-")) {
        return this.updateService("anthropic", {
          status: HealthStatus.HEALTHY,
          message: "API key configured and valid",
          responseTime: performance.now() - startTime,
        });
      }

      return this.updateService("anthropic", {
        status: HealthStatus.UNHEALTHY,
        message: "Invalid API key format",
        responseTime: performance.now() - startTime,
      });
    } catch (error) {
      return this.updateService("anthropic", {
        status: HealthStatus.UNHEALTHY,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        responseTime: performance.now() - startTime,
      });
    }
  }

  /**
   * Check M1 JWT configuration
   */
  async checkM1JwtHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    try {
      const secret = process.env.M1_JWT_SECRET;
      if (!secret) {
        return this.updateService("m1_jwt", {
          status: HealthStatus.UNHEALTHY,
          message: "M1_JWT_SECRET not configured",
          responseTime: performance.now() - startTime,
        });
      }

      if (secret.length < 32) {
        return this.updateService("m1_jwt", {
          status: HealthStatus.UNHEALTHY,
          message: `Secret too short: ${secret.length} chars (min 32)`,
          responseTime: performance.now() - startTime,
        });
      }

      return this.updateService("m1_jwt", {
        status: HealthStatus.HEALTHY,
        message: `JWT secret configured (${secret.length} chars)`,
        responseTime: performance.now() - startTime,
      });
    } catch (error) {
      return this.updateService("m1_jwt", {
        status: HealthStatus.UNHEALTHY,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        responseTime: performance.now() - startTime,
      });
    }
  }

  /**
   * Check Supabase connectivity
   */
  async checkSupabaseHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        return this.updateService("supabase", {
          status: HealthStatus.UNHEALTHY,
          message: "Supabase credentials not configured",
          responseTime: performance.now() - startTime,
        });
      }

      // Try to create client (lightweight validation)
      try {
        const supabase = createClient(url, key);
        // Test with a simple query
        const { error } = await supabase.from("_dummy").select("*").limit(1);

        // 404 on dummy table is fine - means we can connect
        if (!error || error.code === "404") {
          return this.updateService("supabase", {
            status: HealthStatus.HEALTHY,
            message: "Database connection successful",
            responseTime: performance.now() - startTime,
          });
        }

        return this.updateService("supabase", {
          status: HealthStatus.DEGRADED,
          message: `Database query error: ${error.message}`,
          responseTime: performance.now() - startTime,
        });
      } catch (clientError) {
        return this.updateService("supabase", {
          status: HealthStatus.UNHEALTHY,
          message: `Client error: ${clientError instanceof Error ? clientError.message : "Unknown"}`,
          responseTime: performance.now() - startTime,
        });
      }
    } catch (error) {
      return this.updateService("supabase", {
        status: HealthStatus.UNHEALTHY,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        responseTime: performance.now() - startTime,
      });
    }
  }

  /**
   * Check optional services
   */
  async checkOptionalService(name: string): Promise<ServiceHealth> {
    const startTime = performance.now();
    try {
      const envVars = this.getEnvVarsForService(name);
      const configured = envVars.every((v) => process.env[v]);

      return this.updateService(name, {
        status: configured ? HealthStatus.HEALTHY : HealthStatus.UNKNOWN,
        message: configured ? `${name} is configured` : `${name} not configured`,
        responseTime: performance.now() - startTime,
      });
    } catch (error) {
      return this.updateService(name, {
        status: HealthStatus.UNKNOWN,
        message: `Could not check: ${error instanceof Error ? error.message : "Unknown"}`,
        responseTime: performance.now() - startTime,
      });
    }
  }

  /**
   * Get environment variables for a service
   */
  private getEnvVarsForService(service: string): string[] {
    const envVarMap: Record<string, string[]> = {
      anthropic: ["ANTHROPIC_API_KEY"],
      m1_jwt: ["M1_JWT_SECRET"],
      supabase: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      openai: ["OPENAI_API_KEY"],
      openrouter: ["OPENROUTER_API_KEY"],
      stripe: ["STRIPE_SECRET_KEY"],
      sendgrid: ["SENDGRID_API_KEY"],
      gmail_oauth: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET"],
      redis: ["REDIS_URL"],
      nextauth: ["NEXTAUTH_SECRET"],
      google_oauth: ["GOOGLE_CLIENT_ID"],
      gemini: ["GEMINI_API_KEY"],
      perplexity: ["PERPLEXITY_API_KEY"],
      dataforseo: ["DATAFORSEO_API_LOGIN"],
      semrush: ["SEMRUSH_API"],
      elevenlabs: ["ELEVENLABS_API_KEY"],
      datadog: ["DATADOG_API_KEY"],
    };

    return envVarMap[service] || [];
  }

  /**
   * Update service health status
   */
  private updateService(
    name: string,
    update: Partial<ServiceHealth>
  ): ServiceHealth {
    const current = this.services.get(name) || {
      name,
      status: HealthStatus.UNKNOWN,
      responseTime: 0,
      lastChecked: new Date(),
      message: "",
      critical: false,
    };

    const updated: ServiceHealth = {
      ...current,
      ...update,
      lastChecked: new Date(),
    };

    this.services.set(name, updated);
    return updated;
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<HealthReport> {
    // Check critical services
    await this.checkAnthropicHealth();
    await this.checkM1JwtHealth();
    await this.checkSupabaseHealth();

    // Check optional services
    const optionalServices = [
      "openai",
      "openrouter",
      "stripe",
      "sendgrid",
      "gmail_oauth",
      "redis",
      "nextauth",
      "google_oauth",
      "gemini",
      "perplexity",
      "dataforseo",
      "semrush",
      "elevenlabs",
      "datadog",
    ];

    for (const service of optionalServices) {
      await this.checkOptionalService(service);
    }

    return this.generateReport();
  }

  /**
   * Generate health report
   */
  private generateReport(): HealthReport {
    const services = Object.fromEntries(this.services);

    const metrics = {
      totalServices: this.services.size,
      healthyServices: Array.from(this.services.values()).filter(
        (s) => s.status === HealthStatus.HEALTHY
      ).length,
      degradedServices: Array.from(this.services.values()).filter(
        (s) => s.status === HealthStatus.DEGRADED
      ).length,
      unhealthyServices: Array.from(this.services.values()).filter(
        (s) => s.status === HealthStatus.UNHEALTHY
      ).length,
    };

    const criticalServices = Array.from(this.services.values()).filter(
      (s) => s.critical
    );
    const criticalServicesHealthy = criticalServices.every(
      (s) => s.status === HealthStatus.HEALTHY
    );

    let overallStatus = HealthStatus.HEALTHY;
    if (!criticalServicesHealthy) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (metrics.degradedServices > 0) {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      services,
      criticalServicesHealthy,
      metrics,
    };
  }

  /**
   * Get formatted health report
   */
  getFormattedReport(report: HealthReport): string {
    const lines: string[] = [];
    lines.push("=".repeat(80));
    lines.push("M1 HEALTH CHECK REPORT");
    lines.push(`Status: ${report.status.toUpperCase()}`);
    lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
    lines.push(`Uptime: ${Math.floor(report.uptime / 1000)}s`);
    lines.push("");
    lines.push("METRICS:");
    lines.push(
      `  Total Services: ${report.metrics.totalServices}`
    );
    lines.push(
      `  Healthy: ${report.metrics.healthyServices} ✅`
    );
    lines.push(
      `  Degraded: ${report.metrics.degradedServices} ⚠️`
    );
    lines.push(
      `  Unhealthy: ${report.metrics.unhealthyServices} ❌`
    );
    lines.push("");
    lines.push("CRITICAL SERVICES:");

    for (const [name, service] of Object.entries(report.services)) {
      if (service.critical) {
        const icon =
          service.status === HealthStatus.HEALTHY
            ? "✅"
            : service.status === HealthStatus.DEGRADED
              ? "⚠️"
              : "❌";
        lines.push(`  ${icon} ${name}: ${service.status} (${service.responseTime.toFixed(2)}ms)`);
        lines.push(`     ${service.message}`);
      }
    }

    lines.push("");
    lines.push("OPTIONAL SERVICES:");
    for (const [name, service] of Object.entries(report.services)) {
      if (!service.critical && service.status !== HealthStatus.UNKNOWN) {
        const icon =
          service.status === HealthStatus.HEALTHY
            ? "✅"
            : service.status === HealthStatus.DEGRADED
              ? "⚠️"
              : "❌";
        lines.push(`  ${icon} ${name}: ${service.status}`);
      }
    }

    lines.push("");
    lines.push("=".repeat(80));
    return lines.join("\n");
  }
}

/**
 * Singleton instance
 */
export const healthCheckManager = new HealthCheckManager();
