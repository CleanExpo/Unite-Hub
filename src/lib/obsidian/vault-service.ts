/**
 * Obsidian Vault Service
 *
 * Bridges Unite-Hub ↔ Google Drive for Obsidian vault management.
 * All vault files are stored in Google Drive; users sync locally
 * via Google Drive Desktop so Obsidian can open them.
 *
 * Architecture:
 *   Unite-Hub writes .md → Google Drive folder
 *   Google Drive Desktop syncs → local filesystem
 *   Obsidian opens the local folder as a vault
 *
 * This service uses the stored Drive tokens from founder_drive_tokens.
 */

import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase';
import {
  OBSIDIAN_APP_JSON,
  OBSIDIAN_GRAPH_JSON,
  OBSIDIAN_WORKSPACE_JSON,
  generateDailyNote,
} from './templates';
import { mergeNote, parseNote, toSafeFileName } from './markdown';

const VAULT_NAME = 'Unite-Group Vault';
const MIME_FOLDER = 'application/vnd.google-apps.folder';
const MIME_TEXT = 'text/plain';

// ─── Token helpers ────────────────────────────────────────────────────────────

interface DriveTokenRow {
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
}

async function getOAuth2Client(ownerId: string) {
  const { data: tokenRow, error } = await supabaseAdmin
    .from('founder_drive_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('owner_id', ownerId)
    .single<DriveTokenRow>();

  if (error || !tokenRow) {
    throw new Error('Google Drive not connected. Visit /founder/documents to connect.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_URL}/api/founder/documents/drive/callback`,
  );

  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token ?? undefined,
    expiry_date: tokenRow.expires_at
      ? new Date(tokenRow.expires_at).getTime()
      : undefined,
  });

  // Refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabaseAdmin.from('founder_drive_tokens').update({
        access_token: tokens.access_token,
        expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      }).eq('owner_id', ownerId);
    }
  });

  return oauth2Client;
}

// ─── Drive helpers ────────────────────────────────────────────────────────────

async function getDrive(ownerId: string) {
  const auth = await getOAuth2Client(ownerId);
  return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string,
): Promise<string> {
  const query = [
    `name = '${name}'`,
    `mimeType = '${MIME_FOLDER}'`,
    'trashed = false',
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(' and ');

  const res = await drive.files.list({
    q: query,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
    return res.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: MIME_FOLDER,
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
  });

  return created.data.id!;
}

async function writeFileToDrive(
  drive: ReturnType<typeof google.drive>,
  fileName: string,
  content: string,
  parentId: string,
): Promise<string> {
  // Check if file already exists
  const existing = await drive.files.list({
    q: `name = '${fileName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (existing.data.files && existing.data.files.length > 0 && existing.data.files[0].id) {
    const fileId = existing.data.files[0].id;
    await drive.files.update({
      fileId,
      media: { mimeType: MIME_TEXT, body: content },
    });
    return fileId;
  }

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: MIME_TEXT,
      parents: [parentId],
    },
    media: { mimeType: MIME_TEXT, body: content },
    fields: 'id',
  });

  return created.data.id!;
}

async function readFileFromDrive(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
): Promise<string> {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return res.data as unknown as string;
}

// ─── Vault Settings persistence ───────────────────────────────────────────────

export async function getVaultSettings(ownerId: string): Promise<{
  vault_folder_id: string | null;
  vault_name: string;
  obsidian_enabled: boolean;
}> {
  const { data } = await supabaseAdmin
    .from('founder_settings')
    .select('obsidian_vault_folder_id, obsidian_vault_name, obsidian_enabled')
    .eq('owner_id', ownerId)
    .maybeSingle();

  return {
    vault_folder_id: data?.obsidian_vault_folder_id ?? null,
    vault_name: data?.obsidian_vault_name ?? VAULT_NAME,
    obsidian_enabled: data?.obsidian_enabled ?? false,
  };
}

async function saveVaultSettings(
  ownerId: string,
  vaultFolderId: string,
  vaultName: string,
) {
  await supabaseAdmin.from('founder_settings').upsert(
    {
      owner_id: ownerId,
      obsidian_vault_folder_id: vaultFolderId,
      obsidian_vault_name: vaultName,
      obsidian_enabled: true,
    },
    { onConflict: 'owner_id' },
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create the vault structure in Google Drive.
 * Idempotent — safe to call multiple times.
 */
export async function createVault(ownerId: string, vaultName = VAULT_NAME): Promise<{
  vaultFolderId: string;
  vaultName: string;
}> {
  const drive = await getDrive(ownerId);

  // Root vault folder
  const vaultFolderId = await findOrCreateFolder(drive, vaultName);

  // Sub-folders
  const subFolders = ['Contacts', 'Businesses', 'Daily Notes', 'Captures', 'Knowledge', 'Templates'];
  await Promise.all(subFolders.map(f => findOrCreateFolder(drive, f, vaultFolderId)));

  // .obsidian config folder + files
  const obsidianFolderId = await findOrCreateFolder(drive, '.obsidian', vaultFolderId);
  await Promise.all([
    writeFileToDrive(drive, 'app.json', OBSIDIAN_APP_JSON, obsidianFolderId),
    writeFileToDrive(drive, 'graph.json', OBSIDIAN_GRAPH_JSON, obsidianFolderId),
    writeFileToDrive(drive, 'workspace.json', OBSIDIAN_WORKSPACE_JSON, obsidianFolderId),
  ]);

  // Seed business notes
  const businessesFolderId = await findOrCreateFolder(drive, 'Businesses', vaultFolderId);
  const BUSINESSES = [
    { key: 'disaster-recovery', name: 'Disaster Recovery', industry: 'Restoration' },
    { key: 'restore-assist', name: 'RestoreAssist', industry: 'Restoration' },
    { key: 'nrpg', name: 'NRPG', industry: 'Construction' },
    { key: 'ato-compliance', name: 'ATO Compliance', industry: 'Finance' },
    { key: 'unite-group', name: 'Unite-Group', industry: 'Technology' },
    { key: 'carsi', name: 'CARSI', industry: 'Restoration' },
  ];

  const { generateBusinessNote } = await import('./templates');
  await Promise.all(
    BUSINESSES.map(b =>
      writeFileToDrive(drive, `${b.name}.md`, generateBusinessNote(b), businessesFolderId),
    ),
  );

  // Seed today's daily note
  await ensureDailyNote(ownerId, new Date(), vaultFolderId);

  // Persist settings
  await saveVaultSettings(ownerId, vaultFolderId, vaultName);

  return { vaultFolderId, vaultName };
}

/**
 * Write a contact .md file to the vault.
 * Preserves existing note body (notes, action items) when updating.
 */
export async function writeContactNote(
  ownerId: string,
  content: string,
  contactName: string,
): Promise<string> {
  const drive = await getDrive(ownerId);
  const { vault_folder_id } = await getVaultSettings(ownerId);
  if (!vault_folder_id) throw new Error('Vault not set up. Call createVault first.');

  const contactsFolderId = await findOrCreateFolder(drive, 'Contacts', vault_folder_id);
  const fileName = `${toSafeFileName(contactName)}.md`;

  // Read existing note to preserve body content
  let finalContent = content;
  try {
    const existing = await drive.files.list({
      q: `name = '${fileName.replace(/'/g, "\\'")}' and '${contactsFolderId}' in parents and trashed = false`,
      fields: 'files(id)',
    });
    if (existing.data.files?.length && existing.data.files[0].id) {
      const raw = await readFileFromDrive(drive, existing.data.files[0].id);
      const { frontmatter: newFm } = parseNote(content);
      finalContent = mergeNote(raw, newFm);
    }
  } catch {
    // No existing note — use fresh content
  }

  return writeFileToDrive(drive, fileName, finalContent, contactsFolderId);
}

/**
 * Ensure today's daily note exists. Creates from template if not.
 * Returns the file ID.
 */
export async function ensureDailyNote(
  ownerId: string,
  date: Date = new Date(),
  vaultFolderIdOverride?: string,
): Promise<string> {
  const drive = await getDrive(ownerId);
  const vaultFolderId = vaultFolderIdOverride ?? (await getVaultSettings(ownerId)).vault_folder_id;
  if (!vaultFolderId) throw new Error('Vault not set up.');

  const dailyFolderId = await findOrCreateFolder(drive, 'Daily Notes', vaultFolderId);
  const iso = date.toISOString().split('T')[0];
  const fileName = `${iso}.md`;

  const existing = await drive.files.list({
    q: `name = '${fileName}' and '${dailyFolderId}' in parents and trashed = false`,
    fields: 'files(id)',
  });

  if (existing.data.files?.length && existing.data.files[0].id) {
    return existing.data.files[0].id;
  }

  const content = generateDailyNote(date);
  return writeFileToDrive(drive, fileName, content, dailyFolderId);
}

/**
 * Append a capture entry to today's daily note.
 */
export async function appendCaptureToDailyNote(
  ownerId: string,
  captureText: string,
  tags: string[],
  business?: string,
): Promise<void> {
  const drive = await getDrive(ownerId);
  const { vault_folder_id } = await getVaultSettings(ownerId);
  if (!vault_folder_id) throw new Error('Vault not set up.');

  const fileId = await ensureDailyNote(ownerId);

  // Read existing content
  const raw = await readFileFromDrive(drive, fileId);

  // Build capture line
  const now = new Date();
  const time = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Australia/Sydney' });
  const tagStr = tags.map(t => `#${t}`).join(' ');
  const bizStr = business ? ` (${business})` : '';
  const captureLine = `- ${time} ${tagStr} — ${captureText}${bizStr}`;

  // Insert after "## Captures" heading
  const updated = raw.includes('## Captures\n')
    ? raw.replace('## Captures\n', `## Captures\n${captureLine}\n`)
    : raw + `\n${captureLine}\n`;

  await drive.files.update({
    fileId,
    media: { mimeType: MIME_TEXT, body: updated },
  });
}

/**
 * Read today's daily note and return the last N capture lines.
 */
export async function getRecentCaptures(ownerId: string, limit = 3): Promise<string[]> {
  const drive = await getDrive(ownerId);
  const { vault_folder_id } = await getVaultSettings(ownerId);
  if (!vault_folder_id) return [];

  try {
    const fileId = await ensureDailyNote(ownerId);
    const raw = await readFileFromDrive(drive, fileId);

    const captureSection = raw.split('## Captures')[1]?.split('##')[0] ?? '';
    const lines = captureSection
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('- '))
      .slice(-limit);

    return lines.map(l => l.replace(/^- /, ''));
  } catch {
    return [];
  }
}

/**
 * List all vault .md files (for AI summary, etc).
 */
export async function listVaultFiles(
  ownerId: string,
  folder?: string,
): Promise<Array<{ id: string; name: string; path: string }>> {
  const drive = await getDrive(ownerId);
  const { vault_folder_id } = await getVaultSettings(ownerId);
  if (!vault_folder_id) return [];

  let parentId = vault_folder_id;
  if (folder) {
    parentId = await findOrCreateFolder(drive, folder, vault_folder_id);
  }

  const res = await drive.files.list({
    q: `'${parentId}' in parents and mimeType != '${MIME_FOLDER}' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 200,
  });

  return (res.data.files ?? []).map(f => ({
    id: f.id!,
    name: f.name!,
    path: folder ? `${folder}/${f.name}` : f.name!,
  }));
}

/**
 * Read a specific file by ID from the vault.
 */
export async function readVaultFile(ownerId: string, fileId: string): Promise<string> {
  const drive = await getDrive(ownerId);
  return readFileFromDrive(drive, fileId);
}

/**
 * Get vault status: is it set up? How many files?
 */
export async function getVaultStatus(ownerId: string): Promise<{
  connected: boolean;
  enabled: boolean;
  vaultName: string;
  fileCount: number;
  lastSync: string | null;
}> {
  const { vault_folder_id, vault_name, obsidian_enabled } = await getVaultSettings(ownerId);

  if (!vault_folder_id) {
    return { connected: false, enabled: false, vaultName: VAULT_NAME, fileCount: 0, lastSync: null };
  }

  try {
    const drive = await getDrive(ownerId);
    const res = await drive.files.list({
      q: `'${vault_folder_id}' in parents and trashed = false`,
      fields: 'files(id)',
      pageSize: 1,
    });

    // Count recursively would be expensive — just confirm folder exists
    return {
      connected: true,
      enabled: obsidian_enabled,
      vaultName: vault_name,
      fileCount: res.data.files?.length ?? 0,
      lastSync: new Date().toISOString(),
    };
  } catch {
    return { connected: false, enabled: false, vaultName: vault_name, fileCount: 0, lastSync: null };
  }
}
