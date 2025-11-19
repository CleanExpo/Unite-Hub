/**
 * Update Xero Account Label Endpoint
 *
 * POST /api/integrations/xero/update-label
 * Body: { tenantId: string, accountLabel: string }
 *
 * Updates the label for a Xero account (e.g., "Main Business", "Subsidiary A")
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
    const { tenantId, accountLabel } = await req.json();

    if (!tenantId || !accountLabel) {
      return NextResponse.json(
        { error: 'Missing tenantId or accountLabel' },
        { status: 400 }
      );
    }

    // Update account label
    const xeroService = new XeroService();
    await xeroService.updateAccountLabel(userOrg.org_id, tenantId, accountLabel);

    return NextResponse.json({
      success: true,
      message: 'Account label updated successfully'
    });

  } catch (error) {
    console.error('❌ Update account label error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update account label',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
