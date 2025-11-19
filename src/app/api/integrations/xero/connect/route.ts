/**
 * Xero OAuth Connect Endpoint
 *
 * POST /api/integrations/xero/connect
 *
 * Initiates Xero OAuth 2.0 flow
 * Returns authorization URL for user to visit
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

    // Initialize Xero service
    const xeroService = new XeroService();

    // Get authorization URL
    const authUrl = xeroService.getAuthorizationUrl();

    // Store state in session (for CSRF protection)
    // In production, you'd want to store this in Redis or database
    // For now, we'll include org_id in the state parameter
    const state = Buffer.from(JSON.stringify({
      org_id: userOrg.org_id,
      user_id: user.id,
      timestamp: Date.now()
    })).toString('base64');

    const authUrlWithState = `${authUrl}&state=${state}`;

    return NextResponse.json({
      success: true,
      authUrl: authUrlWithState,
      message: 'Visit the URL to authorize Xero access'
    });

  } catch (error) {
    console.error('❌ Xero connect error:', error);

    return NextResponse.json(
      {
        error: 'Failed to initiate Xero connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
