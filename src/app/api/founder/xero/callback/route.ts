/**
 * GET /api/founder/xero/callback
 *
 * Xero OAuth callback handler. Xero redirects here after the user
 * authorises access. Reads code + state from query params, exchanges
 * the code for tokens, and saves them to xero_licence_tokens.
 *
 * State param is base64-encoded JSON: { licence: 'carsi' | 'dr_nrpg' }
 *
 * On success: redirects to /founder/integrations/xero?xero=connected&licence=<name>
 * On error:   redirects to /founder/integrations/xero?xero=error&message=<msg>
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/lib/accounting/xero-founder-service';
import type { LicenceName } from '@/lib/accounting/xero-founder-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const xeroError = searchParams.get('error');

  const setupBase = new URL('/founder/integrations/xero', req.url);

  // Xero may return an error param (e.g. user denied access)
  if (xeroError) {
    const desc = searchParams.get('error_description') ?? xeroError;
    setupBase.searchParams.set('xero', 'error');
    setupBase.searchParams.set('message', encodeURIComponent(desc));
    return NextResponse.redirect(setupBase.toString());
  }

  if (!code) {
    setupBase.searchParams.set('xero', 'error');
    setupBase.searchParams.set('message', encodeURIComponent('No authorisation code returned by Xero.'));
    return NextResponse.redirect(setupBase.toString());
  }

  // Decode state to get licence name
  let licence: LicenceName = 'carsi';
  if (stateRaw) {
    try {
      const decoded = JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf8'));
      if (decoded.licence === 'carsi' || decoded.licence === 'dr_nrpg') {
        licence = decoded.licence;
      }
    } catch {
      console.warn('[xero/callback] Could not parse state param — defaulting to carsi licence.');
    }
  }

  try {
    await handleCallback(code, licence);

    setupBase.searchParams.set('xero', 'connected');
    setupBase.searchParams.set('licence', licence);
    return NextResponse.redirect(setupBase.toString());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token exchange failed.';
    console.error('[xero/callback] Error:', message);

    setupBase.searchParams.set('xero', 'error');
    setupBase.searchParams.set('licence', licence);
    setupBase.searchParams.set('message', encodeURIComponent(message));
    return NextResponse.redirect(setupBase.toString());
  }
}
