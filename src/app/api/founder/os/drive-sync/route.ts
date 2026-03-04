/**
 * POST /api/founder/os/drive-sync
 *
 * Reads KANBAN.md from Supabase Storage (`founder-docs` bucket),
 * then uploads it to Google Drive in a "Phill OS Backups" folder.
 *
 * Requires the user to have connected Google Drive via
 * /api/founder/documents/drive/connect first.
 *
 * Returns { success, fileUrl } on success, or
 * { error: 'Drive not connected', connectUrl } if no tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';
import { Readable } from 'stream';

const BUCKET = 'founder-docs';
const FILE_PATH = 'KANBAN.md';
const DRIVE_FOLDER_NAME = 'Phill OS Backups';

export async function POST(_req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // 1. Get Drive tokens
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('founder_drive_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('owner_id', user.id)
      .single();

    if (tokenError || !tokenRow) {
      return NextResponse.json({
        error: 'Drive not connected',
        connectUrl: '/api/founder/documents/drive/connect',
      }, { status: 400 });
    }

    // 2. Download KANBAN.md from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(FILE_PATH);

    if (downloadError || !fileData) {
      return NextResponse.json({
        error: 'KANBAN.md not found — export your Kanban board first',
      }, { status: 404 });
    }

    const content = await fileData.text();

    // 3. Set up Google Drive client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token ?? undefined,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 4. Find or create "Phill OS Backups" folder
    let folderId: string | undefined;

    const folderSearch = await drive.files.list({
      q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id ?? undefined;
    } else {
      const folderCreate = await drive.files.create({
        requestBody: {
          name: DRIVE_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = folderCreate.data.id ?? undefined;
    }

    // 5. Check if KANBAN.md already exists in the folder
    const existingSearch = await drive.files.list({
      q: `name='KANBAN.md' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    const stream = Readable.from([content]);
    let fileUrl: string;

    if (existingSearch.data.files && existingSearch.data.files.length > 0) {
      // Update existing file
      const existingId = existingSearch.data.files[0].id!;
      await drive.files.update({
        fileId: existingId,
        media: {
          mimeType: 'text/markdown',
          body: stream,
        },
      });
      fileUrl = `https://drive.google.com/file/d/${existingId}/view`;
    } else {
      // Create new file
      const created = await drive.files.create({
        requestBody: {
          name: 'KANBAN.md',
          parents: folderId ? [folderId] : undefined,
        },
        media: {
          mimeType: 'text/markdown',
          body: stream,
        },
        fields: 'id',
      });
      fileUrl = `https://drive.google.com/file/d/${created.data.id}/view`;
    }

    // 6. Update last sync time in Supabase
    await supabaseAdmin
      .from('founder_drive_tokens')
      .update({ connected_at: new Date().toISOString() })
      .eq('owner_id', user.id);

    return NextResponse.json({
      success: true,
      fileUrl,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[drive-sync]', message);

    // Handle expired/revoked tokens
    if (message.includes('invalid_grant') || message.includes('Token has been expired')) {
      return NextResponse.json({
        error: 'Drive token expired — please reconnect',
        connectUrl: '/api/founder/documents/drive/connect',
      }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
