// src/app/api/kanban/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initSync } from '@/server/obsidian-sync';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { workspace_id } = await req.json();

  const { data: config } = await supabase
    .from('workspace_vault_config').select('*').eq('workspace_id', workspace_id).single();
  if (!config) return NextResponse.json({ error: 'No vault configured' }, { status: 404 });

  await initSync(config.vault_path, workspace_id);
  await supabase.from('workspace_vault_config')
    .update({ last_synced_at: new Date().toISOString() }).eq('workspace_id', workspace_id);

  return NextResponse.json({ ok: true, vault_path: config.vault_path });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const workspaceId = new URL(req.url).searchParams.get('workspace_id');
  const { data } = await supabase
    .from('workspace_vault_config').select('*').eq('workspace_id', workspaceId!).single();
  return NextResponse.json(data ?? { sync_enabled: false });
}
