/**
 * Synthex Admin Tenant Health API
 * GET /api/synthex/admin/tenants/[tenantId]/health - Get tenant health snapshot
 * Phase B25: Global Admin & Cross-Tenant Reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantHealthSnapshot } from '@/lib/synthex/adminService';

interface RouteParams {
  params: Promise<{
    tenantId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params to get tenantId
    const { tenantId } = await params;

    // Get health snapshot
    const snapshot = await getTenantHealthSnapshot(user.id, tenantId);

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    });

  } catch (error) {
    console.error('[Admin Tenant Health API] Error:', error);

    // Check for authorization error
    if (error instanceof Error && error.message.includes('does not have access')) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this tenant' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch health snapshot' },
      { status: 500 }
    );
  }
}
