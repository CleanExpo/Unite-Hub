// src/server/obsidian-sync/sync-engine.ts
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseTaskFile } from './parser';
import { startWatcher } from './watcher';
import fs from 'fs/promises';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SSE subscribers keyed by workspace_id
const subscribers = new Map<string, Set<(event: string) => void>>();

export function subscribeToEvents(workspaceId: string, cb: (event: string) => void) {
  if (!subscribers.has(workspaceId)) subscribers.set(workspaceId, new Set());
  subscribers.get(workspaceId)!.add(cb);
  return () => subscribers.get(workspaceId)?.delete(cb);
}

function broadcast(workspaceId: string, event: object) {
  subscribers.get(workspaceId)?.forEach(cb => cb(JSON.stringify(event)));
}

async function handleFileChange(
  filePath: string,
  event: 'add' | 'change' | 'unlink',
  vaultPath: string,
  workspaceId: string
) {
  const relPath = path.relative(vaultPath, filePath).replace(/\\/g, '/');

  if (event === 'unlink') {
    await supabase.from('tasks')
      .delete()
      .eq('obsidian_path', relPath)
      .eq('workspace_id', workspaceId);
    broadcast(workspaceId, { type: 'task_deleted', obsidian_path: relPath });
    return;
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = parseTaskFile(content, relPath);
    if (!parsed.title) return;

    const { data, error: upsertError } = await supabase.from('tasks')
      .upsert({ ...parsed, workspace_id: workspaceId, obsidian_synced_at: new Date().toISOString() },
               { onConflict: 'obsidian_path,workspace_id' })
      .select().single();

    if (upsertError) {
      console.error('[ObsidianSync] Upsert failed', filePath, upsertError);
      return;
    }
    broadcast(workspaceId, { type: 'task_synced', task: data });
  } catch (e) {
    console.error('[ObsidianSync] Error processing', filePath, e);
  }
}

export async function initSync(vaultPath: string, workspaceId: string) {
  startWatcher(vaultPath, (filePath, event) => {
    handleFileChange(filePath, event, vaultPath, workspaceId).catch(console.error);
  });
}
