// src/app/api/kanban/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initSync } from '@/server/obsidian-sync';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const workspaceId = (user.user_metadata?.workspace_id ?? user.id) as string;

  const { vault_path, sync_enabled } = await req.json();

  const { data: config } = await supabase
    .from('workspace_vault_config').select('*').eq('workspace_id', workspaceId).single();
  if (!config) return NextResponse.json({ error: 'No vault configured' }, { status: 404 });

  await initSync(config.vault_path, workspaceId);
  await supabase.from('workspace_vault_config')
    .update({ vault_path, sync_enabled, last_synced_at: new Date().toISOString() }).eq('workspace_id', workspaceId);

  return NextResponse.json({ ok: true, vault_path: vault_path ?? config.vault_path });
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const workspaceId = (user.user_metadata?.workspace_id ?? user.id) as string;

  const { data } = await supabase
    .from('workspace_vault_config').select('*').eq('workspace_id', workspaceId).single();
  return NextResponse.json(data ?? { sync_enabled: false });
}
