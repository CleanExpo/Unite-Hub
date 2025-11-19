/**
 * Set Primary Xero Account Endpoint
 *
 * POST /api/integrations/xero/set-primary
 * Body: { tenantId: string }
 *
 * Sets the primary Xero account for an organization
 * Primary account is used by default for expense tracking
 *
 * Following CLAUDE.md patterns:
 * - Uses getSupabaseServer() for server-side auth
 * - Returns clear error messages
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

    // Get request body
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Set primary account
    const xeroService = new XeroService();
    await xeroService.setPrimaryAccount(userOrg.org_id, tenantId);

    return NextResponse.json({
      success: true,
      message: 'Primary account updated successfully'
    });

  } catch (error) {
    console.error('❌ Set primary account error:', error);

    return NextResponse.json(
      {
        error: 'Failed to set primary account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
