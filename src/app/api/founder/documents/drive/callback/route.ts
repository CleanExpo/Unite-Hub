/**
 * GET /api/founder/documents/drive/callback
 *
 * Google OAuth callback for Drive access.
 * Exchanges the authorisation code for tokens, fetches the Google email,
 * upserts into founder_drive_tokens, then redirects to the documents page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId set during connect

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 },
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/founder/documents/drive/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    // Exchange authorisation code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the Google account email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Persist / update Drive tokens for this user
    const { error: upsertError } = await supabaseAdmin
      .from('founder_drive_tokens')
      .upsert(
        {
          owner_id: state,
          access_token: tokens.access_token ?? '',
          refresh_token: tokens.refresh_token ?? null,
          expires_at: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          google_email: userInfo.email ?? null,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'owner_id' },
      );

    if (upsertError) {
      console.error('[driveCallback] upsert error:', upsertError.message);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Redirect back to the documents page with a success signal
    const redirectUrl = `${process.env.NEXT_PUBLIC_URL}/founder/documents?drive=connected`;
    return NextResponse.redirect(redirectUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[driveCallback]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
