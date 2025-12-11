/**
 * Guardian Phase G33: Access Audit Trail
 *
 * Best-effort audit logging for Guardian API access attempts.
 * Never throws errors - failures are logged but don't break primary flows.
 */

import { supabaseAdmin } from '@/lib/supabase';
import type { GuardianRole } from '@/lib/guardian/access';

export interface GuardianAccessAuditInput {
  tenantId: string;
  userId: string;
  role: GuardianRole;
  endpoint: string;
  method: string;
  statusCode: number;
  success: boolean;
  sourceIp?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Log Guardian API access attempt to guardian_access_audit table.
 *
 * Best-effort logging:
 * - Never throws (errors swallowed and logged to console)
 * - Uses admin client to bypass RLS for inserts
 * - Insert-only operation
 *
 * @param input Access attempt details
 */
export async function logGuardianAccess(input: GuardianAccessAuditInput): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('guardian_access_audit')
      .insert({
        tenant_id: input.tenantId,
        user_id: input.userId,
        role: input.role,
        endpoint: input.endpoint,
        method: input.method,
        status_code: input.statusCode,
        success: input.success,
        source_ip: input.sourceIp ?? null,
        user_agent: input.userAgent ?? null,
        meta: input.meta ?? {},
      });

    if (error) {
      // Do not break primary flows for audit failures
      console.error('[Guardian G33] Access audit insert failed:', error);
    }
  } catch (err) {
    // Catch-all for unexpected failures
    console.error('[Guardian G33] Access audit unexpected failure:', err);
  }
}

/**
 * Helper to extract source IP from Next.js request.
 * Handles various proxy headers (X-Forwarded-For, X-Real-IP, etc.)
 *
 * @param req Next.js Request object
 * @returns IP address or null
 */
export function extractSourceIp(req: Request): string | null {
  try {
    // Check X-Forwarded-For header (most common for proxies)
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwardedFor.split(',')[0].trim();
    }

    // Check X-Real-IP header (used by some proxies)
    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }

    // Fallback to remote address (not always available in serverless)
    return null;
  } catch (err) {
    console.error('[Guardian G33] Failed to extract source IP:', err);
    return null;
  }
}

/**
 * Helper to extract user agent from Next.js request.
 *
 * @param req Next.js Request object
 * @returns User agent string or null
 */
export function extractUserAgent(req: Request): string | null {
  try {
    return req.headers.get('user-agent') ?? null;
  } catch (err) {
    console.error('[Guardian G33] Failed to extract user agent:', err);
    return null;
  }
}
