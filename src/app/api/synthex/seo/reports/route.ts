/**
 * GET /api/synthex/seo/reports
 *
 * List SEO reports for a tenant with optional brand filter and pagination.
 *
 * Query parameters:
 * - tenantId: string (required)
 * - brandId?: string
 * - limit?: number (default 20)
 * - offset?: number (default 0)
 *
 * Response:
 * {
 *   status: 'ok',
 *   reports: SeoReport[],
 *   pagination: { total, limit, offset, hasMore }
 * }
 *
 * Phase: B2 - Synthex SEO Reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { listSeoReportsByTenant } from '@/lib/synthex/seoService';

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const brandId = searchParams.get('brandId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate required fields
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // Validate tenant exists and user has access
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Ensure user owns this tenant
    if (tenant.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this tenant' },
        { status: 403 }
      );
    }

    // Parse pagination params
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

    // Fetch reports
    const result = await listSeoReportsByTenant({
      tenantId,
      brandId: brandId || undefined,
      limit,
      offset,
    });

    return NextResponse.json(
      {
        status: 'ok',
        reports: result.reports,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[seo/reports] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
