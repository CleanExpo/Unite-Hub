import { NextResponse } from 'next/server';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { logGuardianAccess, extractSourceIp, extractUserAgent } from '@/lib/guardian/audit';
import {
  listGuardianAccessAudit,
  getGuardianAccessAuditSummary,
} from '@/lib/guardian/accessAuditService';

/**
 * Guardian G34: Access Audit Viewer API
 * Read-only API for viewing Guardian access audit logs
 *
 * Allowed roles: guardian_analyst, guardian_admin
 *
 * GET /api/guardian/access-audit?limit=200&statusCode=403&endpoint=telemetry&success=false
 * Returns audit records for authenticated founder's tenant
 */

const ALLOWED = ['guardian_analyst', 'guardian_admin'] as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const statusCodeParam = url.searchParams.get('statusCode');
  const endpointParam = url.searchParams.get('endpoint') || undefined;
  const successParam = url.searchParams.get('success');
  const summaryParam = url.searchParams.get('summary');

  const endpoint = '/api/guardian/access-audit';
  const method = 'GET';

  try {
    // Check access level (analyst or admin only)
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Handle summary request
    if (summaryParam === 'true') {
      const summary = await getGuardianAccessAuditSummary(tenantId);

      // Best-effort audit logging (success)
      await logGuardianAccess({
        tenantId,
        userId,
        role,
        endpoint,
        method,
        statusCode: 200,
        success: true,
        sourceIp: extractSourceIp(req),
        userAgent: extractUserAgent(req),
        meta: { action: 'summary' },
      });

      return NextResponse.json(summary);
    }

    // Parse filters
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 10), 500)
      : 200;
    const statusCode = statusCodeParam
      ? parseInt(statusCodeParam, 10) || undefined
      : undefined;
    const success =
      successParam === 'true'
        ? true
        : successParam === 'false'
        ? false
        : undefined;

    // Query audit records
    const records = await listGuardianAccessAudit(tenantId, {
      limit,
      statusCode,
      endpoint: endpointParam,
      success,
    });

    // Best-effort audit logging (success)
    await logGuardianAccess({
      tenantId,
      userId,
      role,
      endpoint,
      method,
      statusCode: 200,
      success: true,
      sourceIp: extractSourceIp(req),
      userAgent: extractUserAgent(req),
      meta: {
        limit,
        statusCode: statusCode ?? null,
        endpointFilter: endpointParam ?? null,
        successFilter: success ?? null,
        resultCount: records.length,
      },
    });

    return NextResponse.json({ items: records });
  } catch (error: any) {
    const message = String(error);
    const code = message.includes('UNAUTHENTICATED')
      ? 401
      : message.includes('FORBIDDEN')
      ? 403
      : 500;

    // Best-effort audit logging (failure)
    try {
      const { tenantId } = await getGuardianTenantContext().catch(() => ({
        tenantId: 'UNKNOWN_TENANT',
      }));
      const { role, userId } = await getGuardianAccessContext().catch(() => ({
        role: 'guardian_viewer' as const,
        userId: 'UNKNOWN_USER',
      }));

      await logGuardianAccess({
        tenantId,
        userId,
        role,
        endpoint,
        method,
        statusCode: code,
        success: false,
        sourceIp: extractSourceIp(req),
        userAgent: extractUserAgent(req),
        meta: { error: message },
      });
    } catch (_) {
      // Ignore audit failures in error path
    }

    console.error('Guardian Access Audit API access denied:', error);
    return NextResponse.json(
      { error: 'Guardian access audit unavailable.', code },
      { status: code }
    );
  }
}
