/**
 * Synthex Admin Tenants API
 * GET /api/synthex/admin/tenants - List tenant summaries with filters
 * Phase B25: Global Admin & Cross-Tenant Reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listTenantSummariesForAdmin } from '@/lib/synthex/adminService';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const plan_code = searchParams.get('plan_code') || undefined;
    const industry = searchParams.get('industry') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get tenant summaries
    const result = await listTenantSummariesForAdmin(user.id, {
      status,
      plan_code,
      industry,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.summaries,
      total: result.total,
      limit,
      offset,
    });

  } catch (error) {
    console.error('[Admin Tenants API] Error:', error);

    // Check for authorization error
    if (error instanceof Error && error.message.includes('not authorized')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}
