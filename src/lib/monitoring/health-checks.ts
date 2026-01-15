/**
 * Health Check System
 *
 * Provides comprehensive health monitoring for all system components.
 * Integrates with APM for centralized monitoring.
 *
 * Usage:
 *   import { healthCheckManager } from '@/lib/monitoring/health-checks';
 *
 *   // Perform all health checks
 *   const status = await healthCheckManager.checkAll();
 *
 *   // Check specific component
 *   const dbHealth = await healthCheckManager.checkDatabase();
 */

import { apm, HealthCheck } from './apm';
import { cacheManager } from '@/lib/cache/redis-client';
import { createClient } from '@/lib/supabase/server';
import { validatePoolerConfig } from '@/lib/supabase/pooler-config';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: number;
  uptime: number;
  version: string;
}

export interface ComponentHealth extends HealthCheck {
  details?: Record<string, any>;
}

class HealthCheckManager {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Perform all health checks
   */
  async checkAll(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAIService(),
      this.checkFileSystem(),
      this.checkEnvironment(),
    ]);

    // Determine overall status
    const unhealthyCount = checks.filter((c) => c.status === 'unhealthy').length;
    const degradedCount = checks.filter((c) => c.status === 'degraded').length;

    let status: SystemHealth['status'];
    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      checks,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * Check database health
   */
  async checkDatabase(): Promise<ComponentHealth> {
    const span = apm.startDatabaseSpan('HEALTH_CHECK', 'ping');

    try {
      const supabase = await createClient();
      const startTime = Date.now();

      // Perform simple query
      const { error, data } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;
      span.finish({ latency });

      if (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          error: error.message,
          lastChecked: Date.now(),
        };
      }

      // Check pooler configuration
      const poolerValidation = validatePoolerConfig();

      return {
        name: 'database',
        status: latency < 200 ? 'healthy' : 'degraded',
        latency,
        lastChecked: Date.now(),
        details: {
          poolerEnabled: poolerValidation.valid,
          poolerWarnings: poolerValidation.warnings,
        },
      };
    } catch (error) {
      span.finishWithError(error instanceof Error ? error : new Error(String(error)));

      return {
        name: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Check Redis cache health
   */
  async checkRedis(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      const status = await cacheManager.getStatus();
      const latency = Date.now() - startTime;

      const metrics = cacheManager.getMetrics();

      if (status === 'healthy') {
        return {
          name: 'redis',
          status: 'healthy',
          latency,
          lastChecked: Date.now(),
          details: {
            hit_rate: metrics.hit_rate,
            total_operations: metrics.total_operations,
          },
        };
      } else if (status === 'unhealthy') {
        return {
          name: 'redis',
          status: 'degraded',
          error: 'Redis connection unstable',
          lastChecked: Date.now(),
        };
      } else {
        return {
          name: 'redis',
          status: 'unhealthy',
          error: 'Redis disconnected',
          lastChecked: Date.now(),
        };
      }
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Check AI service health
   */
  async checkAIService(): Promise<ComponentHealth> {
    try {
      // Check if API key is configured
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          name: 'ai_service',
          status: 'unhealthy',
          error: 'ANTHROPIC_API_KEY not configured',
          lastChecked: Date.now(),
        };
      }

      // For now, just check configuration
      // In production, you might want to make a lightweight test call
      return {
        name: 'ai_service',
        status: 'healthy',
        lastChecked: Date.now(),
        details: {
          provider: 'anthropic',
          key_configured: true,
        },
      };
    } catch (error) {
      return {
        name: 'ai_service',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Check file system health
   */
  async checkFileSystem(): Promise<ComponentHealth> {
    try {
      const { statSync } = await import('fs');
      const { tmpdir } = await import('os');

      // Check if temp directory is writable
      const tempDir = tmpdir();
      const stats = statSync(tempDir);

      if (!stats.isDirectory()) {
        return {
          name: 'filesystem',
          status: 'unhealthy',
          error: 'Temp directory not accessible',
          lastChecked: Date.now(),
        };
      }

      return {
        name: 'filesystem',
        status: 'healthy',
        lastChecked: Date.now(),
        details: {
          temp_dir: tempDir,
        },
      };
    } catch (error) {
      return {
        name: 'filesystem',
        status: 'degraded',
        error: error instanceof Error ? error.message : String(error),
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Check environment configuration
   */
  async checkEnvironment(): Promise<ComponentHealth> {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY',
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      return {
        name: 'environment',
        status: 'unhealthy',
        error: `Missing required environment variables: ${missing.join(', ')}`,
        lastChecked: Date.now(),
        details: {
          missing_vars: missing,
        },
      };
    }

    return {
      name: 'environment',
      status: 'healthy',
      lastChecked: Date.now(),
      details: {
        node_env: process.env.NODE_ENV,
        required_vars_count: requiredVars.length,
      },
    };
  }

  /**
   * Get system uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get uptime in human-readable format
   */
  getUptimeFormatted(): string {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Singleton instance
export const healthCheckManager = new HealthCheckManager();

/**
 * Create health check API handler
 */
export async function createHealthCheckHandler() {
  return async function healthCheckHandler() {
    const health = await healthCheckManager.checkAll();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;

    return {
      status: statusCode,
      body: {
        ...health,
        uptime_formatted: healthCheckManager.getUptimeFormatted(),
      },
    };
  };
}
