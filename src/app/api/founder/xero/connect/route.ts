/**
 * GET /api/founder/xero/connect?licence=carsi|dr_nrpg
 *
 * Builds the Xero OAuth consent URL for the specified licence group
 * and redirects the browser to it.
 *
 * The state param encodes the licence name (base64 JSON) so the callback
 * can route the returned tokens to the correct row in xero_licence_tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/accounting/xero-founder-service';
import type { LicenceName } from '@/lib/accounting/xero-founder-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const licence = searchParams.get('licence') as LicenceName | null;

  if (!licence || !['carsi', 'dr_nrpg'].includes(licence)) {
    return NextResponse.json(
      { error: 'Query param ?licence=carsi|dr_nrpg is required.' },
      { status: 400 }
    );
  }

  try {
    const authUrl = await getAuthUrl(licence);
    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to build Xero auth URL.';
    console.error('[xero/connect] Error:', message);

    // Redirect back to setup UI with error rather than showing a blank page
    const setupUrl = new URL('/founder/integrations/xero', req.url);
    setupUrl.searchParams.set('error', encodeURIComponent(message));
    return NextResponse.redirect(setupUrl.toString());
  }
}
