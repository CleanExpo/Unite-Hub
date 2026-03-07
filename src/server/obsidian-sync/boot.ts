// src/server/obsidian-sync/boot.ts
import { createClient } from '@supabase/supabase-js';
import { initSync } from './sync-engine';

export async function bootVaultWatchers() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('workspace_vault_config')
    .select('workspace_id, vault_path')
    .eq('sync_enabled', true);

  for (const config of data ?? []) {
    await initSync(config.vault_path, config.workspace_id);
  }
  console.log(`[ObsidianSync] Booted ${data?.length ?? 0} vault watcher(s)`);
}
