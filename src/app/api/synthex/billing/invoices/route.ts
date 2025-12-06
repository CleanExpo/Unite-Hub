/**
 * Synthex Billing - Invoices API
 * GET /api/synthex/billing/invoices - List invoices
 * GET /api/synthex/billing/invoices?upcoming=true - Get upcoming charges
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listInvoices, calculateUpcomingCharges } from '@/lib/synthex/invoicingService';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters from query
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const upcoming = searchParams.get('upcoming') === 'true';
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
    }

    // Verify user has access to tenant
    const { data: tenantUser } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle upcoming charges request
    if (upcoming) {
      const upcomingCharges = await calculateUpcomingCharges(tenantId);
      return NextResponse.json({ upcomingCharges });
    }

    // List invoices
    const invoices = await listInvoices(tenantId, {
      status,
      limit,
      offset,
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('[Synthex Invoices] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
