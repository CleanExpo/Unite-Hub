/**
 * POST /api/founder/xero/setup-app
 *
 * Saves CARSI's Xero developer app credentials (client_id + client_secret)
 * to xero_oauth_app. This is the first step of the Xero Two-Licence setup.
 *
 * Body: { client_id: string, client_secret: string, redirect_uri?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveXeroApp } from '@/lib/accounting/xero-founder-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, client_secret, redirect_uri } = body as {
      client_id?: string;
      client_secret?: string;
      redirect_uri?: string;
    };

    if (!client_id?.trim() || !client_secret?.trim()) {
      return NextResponse.json(
        { error: 'client_id and client_secret are required.' },
        { status: 400 }
      );
    }

    await saveXeroApp(
      client_id.trim(),
      client_secret.trim(),
      redirect_uri?.trim()
    );

    return NextResponse.json({ success: true, message: 'CARSI Xero app credentials saved.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error saving app credentials.';
    console.error('[xero/setup-app] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
