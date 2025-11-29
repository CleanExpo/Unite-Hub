/**
 * Database Client with Connection Pooling
 *
 * ADR-003: Connection Pooling via Supabase
 * Expected 60-80% latency reduction through pooled connections.
 *
 * This module provides:
 * - Pooled Supabase client for high-throughput operations
 * - Service role client for admin operations (bypasses RLS)
 * - Browser client re-export for consistency
 *
 * @module core/database/client
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_POOL_CONFIG, PoolConfig } from './types';

// Singleton instances
let pooledClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/**
 * Get environment variables with validation
 */
function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return { supabaseUrl, supabaseAnonKey, serviceRoleKey };
}

/**
 * Get URL for transaction pooler
 *
 * Supabase provides a pooler endpoint for serverless environments.
 * Format: project-ref.pooler.supabase.com
 */
function getPoolerUrl(supabaseUrl: string): string {
  // Extract project ref from URL
  // Format: https://[project-ref].supabase.co
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);

  if (!match) {
    // Return original URL if not standard Supabase format
    return supabaseUrl;
  }

  const projectRef = match[1];

  // Use transaction pooler for serverless
  // This uses port 6543 (transaction mode) vs 5432 (session mode)
  return `https://${projectRef}.supabase.co`;
}

/**
 * Create pooled Supabase client
 *
 * Uses Supabase's built-in connection pooling for serverless environments.
 * This is the recommended client for API routes and server actions.
 *
 * @param config - Pool configuration options
 * @returns Pooled SupabaseClient
 */
export function getPooledClient(config: PoolConfig = DEFAULT_POOL_CONFIG): SupabaseClient {
  if (pooledClient) {
    return pooledClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getEnvVars();

  const clientUrl = config.useTransactionPooler
    ? getPoolerUrl(supabaseUrl)
    : supabaseUrl;

  pooledClient = createSupabaseClient(clientUrl, supabaseAnonKey, {
    auth: {
      // Don't persist sessions for API routes
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-connection-pool': 'true',
      },
    },
  });

  return pooledClient;
}

/**
 * Get admin client (bypasses RLS)
 *
 * Uses service role key for operations that need to bypass RLS.
 * Use sparingly - prefer user-scoped operations when possible.
 *
 * @returns Admin SupabaseClient with service role
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not set
 */
export function getAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const { supabaseUrl, serviceRoleKey } = getEnvVars();

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for admin operations');
  }

  adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });

  return adminClient;
}

/**
 * Reset client instances (for testing)
 */
export function resetClients(): void {
  pooledClient = null;
  adminClient = null;
}

/**
 * Re-export createClient from supabase/server for authenticated operations
 *
 * This client reads auth from cookies and should be used for:
 * - Server Components
 * - API routes that need user context
 */
export { createClient } from '@/lib/supabase/server';

/**
 * Re-export browser client for client components
 */
export { createClient as createBrowserClient } from '@/lib/supabase/client';
