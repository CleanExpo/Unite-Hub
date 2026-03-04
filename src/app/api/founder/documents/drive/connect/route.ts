/**
 * GET /api/founder/documents/drive/connect
 *
 * Initiates the Google Drive OAuth flow.
 * Redirects the authenticated user to Google's consent screen requesting
 * drive.readonly + userinfo.email scopes.
 *
 * PREREQUISITE — run the following in the Supabase SQL editor before using this route:
 *
 *   CREATE TABLE IF NOT EXISTS founder_drive_tokens (
 *     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     owner_id      uuid NOT NULL UNIQUE,
 *     access_token  text NOT NULL,
 *     refresh_token text,
 *     expires_at    timestamptz,
 *     connected_at  timestamptz DEFAULT now(),
 *     google_email  text
 *   );
 *   ALTER TABLE founder_drive_tokens ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "owner_only" ON founder_drive_tokens FOR ALL
 *     USING (owner_id = auth.uid());
 *   CREATE POLICY "service_role" ON founder_drive_tokens FOR ALL
 *     TO service_role USING (true) WITH CHECK (true);
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/founder/documents/drive/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: user.id,
      prompt: 'consent',
    });

    return NextResponse.redirect(url);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[driveConnect]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
