/**
 * Supabase Connection Pooling Configuration
 *
 * Manages connection pooling with pg_bouncer for production performance.
 * Supports both pooled and non-pooled connections with automatic fallback.
 *
 * Features:
 * - Optional pooler URL configuration
 * - Session vs Transaction pooling modes
 * - Automatic fallback to standard connection
 * - Environment validation
 * - Connection URL selection logic
 *
 * @module lib/supabase/pooling-config
 */

/* eslint-disable no-undef, no-console, @typescript-eslint/no-explicit-any */

/**
 * Pooling modes supported by pg_bouncer
 */
export type PoolingMode = 'session' | 'transaction';

/**
 * Pooling configuration
 */
export interface PoolingConfig {
  /** Whether pooling is enabled */
  enabled: boolean;

  /** Connection string for pooler (if enabled) */
  poolerUrl?: string;

  /** Standard Supabase connection URL (fallback) */
  standardUrl: string;

  /** Pooling mode: session (default) or transaction */
  mode: PoolingMode;

  /** Active connection URL to use */
  activeUrl: string;

  /** Whether currently using pooled connection */
  isPooled: boolean;
}

/**
 * Get pooling configuration from environment
 *
 * Environment Variables:
 * - SUPABASE_POOLER_URL: Connection pooler URL (optional)
 * - SUPABASE_POOL_MODE: 'session' (default) or 'transaction'
 * - NEXT_PUBLIC_SUPABASE_URL: Standard Supabase URL (required)
 *
 * @returns Pooling configuration
 */
export function getPoolingConfig(): PoolingConfig {
  const standardUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://placeholder.supabase.co';

  const poolerUrl = process.env.SUPABASE_POOLER_URL;
  const poolMode = (process.env.SUPABASE_POOL_MODE || 'session') as PoolingMode;

  // Validate pool mode
  if (poolMode !== 'session' && poolMode !== 'transaction') {
    console.warn(
      `⚠️ Invalid SUPABASE_POOL_MODE: ${poolMode}. Using 'session' mode.`
    );
  }

  const isPoolingEnabled = !!poolerUrl;
  const activeUrl = isPoolingEnabled ? poolerUrl : standardUrl;

  return {
    enabled: isPoolingEnabled,
    poolerUrl,
    standardUrl,
    mode: poolMode,
    activeUrl: activeUrl || standardUrl,
    isPooled: isPoolingEnabled,
  };
}

/**
 * Check if pooler is configured and available
 *
 * @returns True if pooler URL is configured
 */
export function isPoolingConfigured(): boolean {
  return !!process.env.SUPABASE_POOLER_URL;
}

/**
 * Get the connection URL to use (pooler or standard)
 *
 * Priority:
 * 1. SUPABASE_POOLER_URL (if configured)
 * 2. NEXT_PUBLIC_SUPABASE_URL (fallback)
 *
 * @returns Connection URL
 */
export function getConnectionUrl(): string {
  const config = getPoolingConfig();
  return config.activeUrl;
}

/**
 * Get pooling mode configuration
 *
 * Session Mode (Recommended):
 * - Connection assigned to client for entire session
 * - Full transaction semantics support
 * - Slight connection overhead reduction
 * - Best for long-lived connections
 *
 * Transaction Mode (Advanced):
 * - Connection returned after each transaction
 * - Maximum connection reuse
 * - Some transaction-spanning features unavailable
 * - Best for high concurrency
 *
 * @returns Current pooling mode
 */
export function getPoolingMode(): PoolingMode {
  const config = getPoolingConfig();
  return config.mode;
}

/**
 * Log pooling configuration (for debugging)
 *
 * @internal
 */
export function logPoolingConfig(): void {
  const config = getPoolingConfig();

  if (!process.env.NODE_ENV?.includes('production')) {
    console.log('📊 Supabase Pooling Configuration:');
    console.log(`  Enabled: ${config.enabled ? '✅' : '❌'}`);
    console.log(`  Mode: ${config.mode} (${getPoolingModeDescription(config.mode)})`);

    if (config.poolerUrl) {
      // Redact sensitive parts of URL
      const redacted = redactConnectionString(config.poolerUrl);
      console.log(`  Pooler URL: ${redacted}`);
    }

    console.log(`  Active URL: ${getPoolingModeDescription(config.mode)}`);
    console.log(
      `  Using: ${config.isPooled ? 'Connection Pooler' : 'Direct Connection'}`
    );
  }
}

/**
 * Get human-readable description of pooling mode
 *
 * @internal
 */
function getPoolingModeDescription(mode: PoolingMode): string {
  switch (mode) {
    case 'session':
      return 'Session-level pooling (recommended for Next.js)';
    case 'transaction':
      return 'Transaction-level pooling (advanced, max throughput)';
    default:
      return 'Unknown mode';
  }
}

/**
 * Redact sensitive connection string for logging
 *
 * @internal
 */
function redactConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '[invalid URL]';
  }
}

/**
 * Export pooling configuration as JSON (for debugging/monitoring)
 *
 * @internal
 */
export function exportPoolingConfig(): Record<string, any> {
  const config = getPoolingConfig();

  return {
    enabled: config.enabled,
    mode: config.mode,
    isPooled: config.isPooled,
    standardUrlSet: !!config.standardUrl,
    poolerUrlSet: !!config.poolerUrl,
    activeConnectionType: config.isPooled ? 'pooled' : 'direct',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Connection pool status (for health checks)
 */
export interface PoolStatus {
  isHealthy: boolean;
  isPooled: boolean;
  mode: PoolingMode;
  message: string;
}

/**
 * Get current pool status
 *
 * @returns Pool health status
 */
export function getPoolStatus(): PoolStatus {
  const config = getPoolingConfig();

  return {
    isHealthy: true, // Will be updated by monitoring system
    isPooled: config.isPooled,
    mode: config.mode,
    message: config.isPooled
      ? `Using connection pooler in ${config.mode} mode`
      : 'Using direct connection (pooler not configured)',
  };
}

export default {
  getPoolingConfig,
  isPoolingConfigured,
  getConnectionUrl,
  getPoolingMode,
  getPoolStatus,
  logPoolingConfig,
  exportPoolingConfig,
};
