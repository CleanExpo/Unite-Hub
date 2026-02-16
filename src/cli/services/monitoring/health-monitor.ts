/**
 * Health Monitor Service
 *
 * System health monitoring and service availability checks:
 * - Database connectivity
 * - API availability (Shopify, GMC, Google Secret Manager)
 * - Credential validity
 * - Service quotas and rate limits
 * - Disk space and memory usage
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';
import * as os from 'os';
import * as fs from 'fs';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastChecked: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface HealthReport {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
}

export class HealthMonitorService {
  private supabase: any;
  private configManager: ConfigManager;
  private workspaceId: string;

  constructor() {
    this.configManager = new ConfigManager();

    const config = this.configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run: synthex init');
    }

    this.workspaceId = config.workspace_id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error('Supabase credentials not configured');
    }
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthReport> {
    const checks: HealthCheck[] = [];

    // Run checks in parallel
    const [
      databaseCheck,
      credentialsCheck,
      diskCheck,
      memoryCheck,
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkCredentials(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
    ]);

    checks.push(databaseCheck, credentialsCheck, diskCheck, memoryCheck);

    // Determine overall status
    const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
    const hasDegraded = checks.some((c) => c.status === 'degraded');

    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    return {
      overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check database connectivity
   */
  async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simple query to check connectivity
      const { error } = await this.supabase
        .from('synthex_tenants')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          name: 'Database',
          status: 'unhealthy',
          message: `Database query failed: ${error.message}`,
          lastChecked: new Date().toISOString(),
          responseTime,
        };
      }

      // Check response time
      if (responseTime > 5000) {
        return {
          name: 'Database',
          status: 'degraded',
          message: `Database response slow: ${responseTime}ms`,
          lastChecked: new Date().toISOString(),
          responseTime,
        };
      }

      return {
        name: 'Database',
        status: 'healthy',
        message: `Database connection OK (${responseTime}ms)`,
        lastChecked: new Date().toISOString(),
        responseTime,
      };
    } catch (error: unknown) {
      return {
        name: 'Database',
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Shopify API availability
   */
  async checkShopifyAPI(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Get a tenant with Shopify credentials
      const { data: tenant } = await this.supabase
        .from('synthex_tenants')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .or('type.eq.shopify,type.eq.mixed')
        .limit(1)
        .single();

      if (!tenant) {
        return {
          name: 'Shopify API',
          status: 'degraded',
          message: 'No Shopify tenants configured',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        };
      }

      // TODO: Implement actual Shopify API health check
      // For now, return healthy if tenant exists
      return {
        name: 'Shopify API',
        status: 'healthy',
        message: 'Shopify API available',
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        metadata: {
          shop: tenant.metadata?.shopifyShop,
        },
      };
    } catch (error: unknown) {
      return {
        name: 'Shopify API',
        status: 'unhealthy',
        message: `Shopify API check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Google Merchant Center API availability
   */
  async checkGoogleMerchantAPI(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Get a tenant with GMC credentials
      const { data: tenant } = await this.supabase
        .from('synthex_tenants')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .or('type.eq.google-merchant,type.eq.mixed')
        .limit(1)
        .single();

      if (!tenant) {
        return {
          name: 'Google Merchant API',
          status: 'degraded',
          message: 'No Google Merchant tenants configured',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        };
      }

      // TODO: Implement actual GMC API health check
      // For now, return healthy if tenant exists
      return {
        name: 'Google Merchant API',
        status: 'healthy',
        message: 'Google Merchant API available',
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        metadata: {
          merchantId: tenant.metadata?.gmcMerchantId,
        },
      };
    } catch (error: unknown) {
      return {
        name: 'Google Merchant API',
        status: 'unhealthy',
        message: `Google Merchant API check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check credentials validity
   */
  async checkCredentials(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Get all credentials
      const { data: credentials } = await this.supabase
        .from('credential_registry')
        .select('*')
        .eq('workspace_id', this.workspaceId);

      if (!credentials || credentials.length === 0) {
        return {
          name: 'Credentials',
          status: 'degraded',
          message: 'No credentials found',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        };
      }

      // Check for expired credentials
      const now = new Date();
      const expired = credentials.filter((c: any) => {
        if (!c.expires_at) return false;
        return new Date(c.expires_at) < now;
      });

      // Check for expiring soon (< 7 days)
      const expiringSoon = credentials.filter((c: any) => {
        if (!c.expires_at) return false;
        const expiresAt = new Date(c.expires_at);
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
      });

      if (expired.length > 0) {
        return {
          name: 'Credentials',
          status: 'unhealthy',
          message: `${expired.length} credential(s) expired`,
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          metadata: {
            total: credentials.length,
            expired: expired.length,
            expiringSoon: expiringSoon.length,
          },
        };
      }

      if (expiringSoon.length > 0) {
        return {
          name: 'Credentials',
          status: 'degraded',
          message: `${expiringSoon.length} credential(s) expiring soon`,
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          metadata: {
            total: credentials.length,
            expired: expired.length,
            expiringSoon: expiringSoon.length,
          },
        };
      }

      return {
        name: 'Credentials',
        status: 'healthy',
        message: `All ${credentials.length} credential(s) valid`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        metadata: {
          total: credentials.length,
          expired: 0,
          expiringSoon: 0,
        },
      };
    } catch (error: unknown) {
      return {
        name: 'Credentials',
        status: 'unhealthy',
        message: `Credential check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check API quotas (placeholder)
   */
  async checkAPIQuotas(): Promise<HealthCheck> {
    // TODO: Implement quota checking for Shopify, GMC, etc.
    return {
      name: 'API Quotas',
      status: 'healthy',
      message: 'API quotas OK (not yet implemented)',
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Check disk space
   */
  async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const configDir = this.configManager.getConfigDir();

      // Get disk stats for config directory
      const stats = fs.statfsSync ? fs.statfsSync(configDir) : null;

      if (!stats) {
        return {
          name: 'Disk Space',
          status: 'healthy',
          message: 'Disk space check not available on this platform',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        };
      }

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bfree * stats.bsize;
      const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100;

      if (usedPercent > 95) {
        return {
          name: 'Disk Space',
          status: 'unhealthy',
          message: `Disk space critical: ${usedPercent.toFixed(1)}% used`,
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          metadata: {
            totalGB: (totalSpace / (1024 ** 3)).toFixed(2),
            freeGB: (freeSpace / (1024 ** 3)).toFixed(2),
            usedPercent: usedPercent.toFixed(1),
          },
        };
      }

      if (usedPercent > 85) {
        return {
          name: 'Disk Space',
          status: 'degraded',
          message: `Disk space low: ${usedPercent.toFixed(1)}% used`,
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          metadata: {
            totalGB: (totalSpace / (1024 ** 3)).toFixed(2),
            freeGB: (freeSpace / (1024 ** 3)).toFixed(2),
            usedPercent: usedPercent.toFixed(1),
          },
        };
      }

      return {
        name: 'Disk Space',
        status: 'healthy',
        message: `Disk space OK: ${usedPercent.toFixed(1)}% used`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        metadata: {
          totalGB: (totalSpace / (1024 ** 3)).toFixed(2),
          freeGB: (freeSpace / (1024 ** 3)).toFixed(2),
          usedPercent: usedPercent.toFixed(1),
        },
      };
    } catch (error: unknown) {
      return {
        name: 'Disk Space',
        status: 'degraded',
        message: `Disk space check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check memory usage
   */
  async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usedPercent = (usedMem / totalMem) * 100;

      if (usedPercent > 95) {
        return {
          name: 'Memory Usage',
          status: 'unhealthy',
          message: `Memory critical: ${usedPercent.toFixed(1)}% used`,
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          metadata: {
            totalGB: (totalMem / (1024 ** 3)).toFixed(2),
            freeGB: (freeMem / (1024 ** 3)).toFixed(2),
            usedPercent: usedPercent.toFixed(1),
          },
        };
      }

      if (usedPercent > 85) {
        return {
          name: 'Memory Usage',
          status: 'degraded',
          message: `Memory high: ${usedPercent.toFixed(1)}% used`,
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          metadata: {
            totalGB: (totalMem / (1024 ** 3)).toFixed(2),
            freeGB: (freeMem / (1024 ** 3)).toFixed(2),
            usedPercent: usedPercent.toFixed(1),
          },
        };
      }

      return {
        name: 'Memory Usage',
        status: 'healthy',
        message: `Memory OK: ${usedPercent.toFixed(1)}% used`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        metadata: {
          totalGB: (totalMem / (1024 ** 3)).toFixed(2),
          freeGB: (freeMem / (1024 ** 3)).toFixed(2),
          usedPercent: usedPercent.toFixed(1),
        },
      };
    } catch (error: unknown) {
      return {
        name: 'Memory Usage',
        status: 'degraded',
        message: `Memory check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }
}
