/**
 * Synthex Admin Overview API
 * GET /api/synthex/admin/overview - Global KPIs for admin dashboard
 * Phase B25: Global Admin & Cross-Tenant Reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGlobalKpis } from '@/lib/synthex/adminService';

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

    // Get global KPIs (authorization check inside service)
    const kpis = await getGlobalKpis(user.id);

    return NextResponse.json({
      success: true,
      data: kpis,
    });

  } catch (error) {
    console.error('[Admin Overview API] Error:', error);

    // Check for authorization error
    if (error instanceof Error && error.message.includes('global admins')) {
      return NextResponse.json(
        { error: 'Forbidden: Global admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
