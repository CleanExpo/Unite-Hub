/**
 * Xero Connection Status Endpoint
 *
 * GET /api/integrations/xero/status
 *
 * Returns all connected Xero accounts for the user's organization
 *
 * Following CLAUDE.md patterns:
 * - Uses getSupabaseServer() for server-side auth
 * - Returns clear error messages
 * - Returns detailed connection information
 * - Supports multiple Xero accounts per organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import XeroService from '@/lib/accounting/xero-client';

export async function GET(req: NextRequest) {
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

    // Get all connected Xero accounts
    const xeroService = new XeroService();
    const accounts = await xeroService.getAllAccounts(userOrg.org_id);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        connected: false,
        accounts: [],
        message: 'No Xero accounts connected'
      });
    }

    // Format response with detailed account info
    const formattedAccounts = accounts.map((account: any) => {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = account.expires_at - now;
      const expiresInHours = Math.floor(expiresIn / 3600);

      return {
        tenantId: account.tenant_id,
        accountLabel: account.account_label || account.xero_org_name,
        organizationName: account.xero_org_name,
        isPrimary: account.is_primary,
        connectedAt: account.created_at, // Fixed: use created_at instead of connected_at
        lastUpdated: account.updated_at,
        tokenExpiresIn: expiresInHours > 0 ? `${expiresInHours} hours` : 'Expired (will auto-refresh)',
        totalExpenses: account.total_expenses || 0,
        totalCost: account.total_cost || 0,
        totalInvoices: account.total_invoices || 0,
        totalRevenue: account.total_revenue || 0
      };
    });

    return NextResponse.json({
      connected: true,
      accounts: formattedAccounts,
      accountCount: accounts.length,
      message: `${accounts.length} Xero account${accounts.length > 1 ? 's' : ''} connected`
    });

  } catch (error) {
    console.error('❌ Xero status check error:', error);

    return NextResponse.json(
      {
        connected: false,
        accounts: [],
        error: 'Failed to check Xero status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
