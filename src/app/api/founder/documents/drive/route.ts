/**
 * GET /api/founder/documents/drive
 *
 * Lists Google Drive files accessible via the user's stored Drive token.
 * Returns { connected: false } when no token exists.
 * Accepts optional ?search= query parameter to filter by file name.
 *
 * Only PDF, DOCX, and plain-text files are returned by default.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

// ─── Token refresh helper ─────────────────────────────────────────────────────

async function refreshAndPersist(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  ownerId: string,
  refreshToken: string,
): Promise<boolean> {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    await supabaseAdmin
      .from('founder_drive_tokens')
      .update({
        access_token: credentials.access_token ?? '',
        expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq('owner_id', ownerId);

    oauth2Client.setCredentials(credentials);
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[driveList] token refresh failed:', message);
    return false;
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Fetch stored Drive token
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('founder_drive_tokens')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (tokenError || !tokenRow) {
      return NextResponse.json({ connected: false });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/founder/documents/drive/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    // Refresh token if expired
    const now = new Date();
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at) : null;

    if (expiresAt && expiresAt <= now) {
      if (!tokenRow.refresh_token) {
        return NextResponse.json({
          connected: false,
          error: 'Token expired, please reconnect',
        });
      }

      const refreshed = await refreshAndPersist(
        oauth2Client,
        user.id,
        tokenRow.refresh_token,
      );

      if (!refreshed) {
        return NextResponse.json({
          connected: false,
          error: 'Token expired, please reconnect',
        });
      }
    } else {
      oauth2Client.setCredentials({
        access_token: tokenRow.access_token,
        refresh_token: tokenRow.refresh_token ?? undefined,
      });
    }

    // Build Drive query — only supported document types
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const mimeFilter = [
      "mimeType='application/pdf'",
      "mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
      "mimeType='text/plain'",
    ].join(' or ');

    const nameFilter = search.trim()
      ? ` and name contains '${search.trim().replace(/'/g, "\\'")}'`
      : '';

    const q = `(${mimeFilter})${nameFilter}`;

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      pageSize: 50,
      fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
      q,
      orderBy: 'modifiedTime desc',
    });

    return NextResponse.json({
      connected: true,
      googleEmail: tokenRow.google_email ?? null,
      files: response.data.files ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[driveList]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
