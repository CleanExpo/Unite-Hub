/**
 * Xero Disconnect Endpoint
 *
 * POST /api/integrations/xero/disconnect
 * Body: { tenantId?: string } - Optional specific account to disconnect
 *
 * Revokes Xero OAuth tokens and removes from database
 * If tenantId is provided, disconnects only that account
 * If tenantId is omitted, disconnects ALL accounts
 *
 * Following CLAUDE.md patterns:
 * - Uses getSupabaseServer() for server-side auth
 * - Uses supabaseAdmin for token removal (bypasses RLS)
 * - Returns clear error messages
 * - Supports multi-account disconnection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import XeroService from '@/lib/accounting/xero-client';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    // Get optional tenantId from request body
    let tenantId: string | undefined;
    try {
      const body = await req.json();
      tenantId = body.tenantId;
    } catch {
      // No body provided - disconnect all accounts
      tenantId = undefined;
    }

    // Initialize Xero service
    const xeroService = new XeroService();

    // Disconnect (revoke tokens and delete from database)
    await xeroService.disconnect(userOrg.org_id, tenantId);

    const message = tenantId
      ? 'Xero account disconnected successfully'
      : 'All Xero accounts disconnected successfully';

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('❌ Xero disconnect error:', error);

    return NextResponse.json(
      {
        error: 'Failed to disconnect Xero',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
