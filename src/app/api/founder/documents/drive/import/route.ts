/**
 * POST /api/founder/documents/drive/import
 *
 * Imports a file from Google Drive into the Founder Document Repository.
 * Downloads the file content via the Drive API, uploads it to Supabase Storage,
 * and inserts a record in founder_documents.
 *
 * Body: { driveFileId, businessId, category, expiryDate?, notes? }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { google } from 'googleapis';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

// ─── SSRF guard: Drive file IDs are alphanumeric + dash/underscore only ───────

function isValidDriveFileId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json() as {
      driveFileId?: string;
      businessId?: string;
      category?: string;
      expiryDate?: string;
      notes?: string;
    };

    const { driveFileId, businessId, category, expiryDate, notes } = body;

    // Validate required fields
    if (!driveFileId || !businessId || !category) {
      return NextResponse.json(
        { error: 'driveFileId, businessId, and category are required' },
        { status: 400 },
      );
    }

    // SSRF protection: validate driveFileId format before using in API call
    if (!isValidDriveFileId(driveFileId)) {
      return NextResponse.json(
        { error: 'Invalid driveFileId format' },
        { status: 400 },
      );
    }

    // Fetch Drive token
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('founder_drive_tokens')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (tokenError || !tokenRow) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 400 },
      );
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
        return NextResponse.json(
          { error: 'Google Drive token expired, please reconnect' },
          { status: 400 },
        );
      }

      try {
        oauth2Client.setCredentials({ refresh_token: tokenRow.refresh_token });
        const { credentials } = await oauth2Client.refreshAccessToken();

        await supabaseAdmin
          .from('founder_drive_tokens')
          .update({
            access_token: credentials.access_token ?? '',
            expires_at: credentials.expiry_date
              ? new Date(credentials.expiry_date).toISOString()
              : null,
          })
          .eq('owner_id', user.id);

        oauth2Client.setCredentials(credentials);
      } catch (refreshErr: unknown) {
        const msg = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
        console.error('[driveImport] token refresh failed:', msg);
        return NextResponse.json(
          { error: 'Google Drive token expired, please reconnect' },
          { status: 400 },
        );
      }
    } else {
      oauth2Client.setCredentials({
        access_token: tokenRow.access_token,
        refresh_token: tokenRow.refresh_token ?? undefined,
      });
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Fetch file metadata
    const metaResponse = await drive.files.get({
      fileId: driveFileId,
      fields: 'id,name,mimeType,size,webViewLink',
    });
    const meta = metaResponse.data;

    if (!meta.name) {
      return NextResponse.json(
        { error: 'Unable to retrieve file metadata from Drive' },
        { status: 400 },
      );
    }

    // Download file content
    const fileResponse = await drive.files.get(
      { fileId: driveFileId, alt: 'media' },
      { responseType: 'arraybuffer' },
    );
    const buffer = Buffer.from(fileResponse.data as ArrayBuffer);

    // Upload to Supabase Storage
    const storagePath = `${user.id}/${crypto.randomUUID()}/${meta.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('founder-documents')
      .upload(storagePath, buffer, {
        contentType: meta.mimeType ?? 'application/octet-stream',
      });

    if (uploadError) {
      console.error('[driveImport] storage upload:', uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert document record
    const { data: document, error: insertError } = await supabaseAdmin
      .from('founder_documents')
      .insert({
        owner_id: user.id,
        business_id: businessId,
        file_name: meta.name,
        file_type: meta.mimeType ?? 'application/octet-stream',
        category,
        storage_path: storagePath,
        drive_file_id: driveFileId,
        drive_web_url: meta.webViewLink ?? null,
        file_size_bytes: parseInt(meta.size ?? '0', 10) || 0,
        expiry_date: expiryDate ?? null,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[driveImport] db insert:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[driveImport]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
