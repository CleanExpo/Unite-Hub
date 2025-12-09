/**
 * Synthex Audit Logs API
 * Phase B43: Governance, Audit Logging & Export
 *
 * GET - List audit logs with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listAuditLogs, AuditLog } from '@/lib/synthex/auditService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId') || undefined;
    const actionCategory = searchParams.get('actionCategory') as AuditLog['action_category'] | undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const status = searchParams.get('status') as AuditLog['status'] | undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const logs = await listAuditLogs(tenantId, {
      userId,
      actionCategory,
      resourceType,
      resourceId,
      status,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      logs,
      count: logs.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in audit logs GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
