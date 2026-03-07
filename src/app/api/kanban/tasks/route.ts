// src/app/api/kanban/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeTaskToVault } from '@/server/obsidian-sync';
import { Task } from '@/types/kanban';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspace_id');
  const status = searchParams.get('status');
  const assigneeType = searchParams.get('assignee_type');

  let query = supabase.from('tasks').select('*').eq('workspace_id', workspaceId!).order('position');
  if (status) query = query.eq('status', status);
  if (assigneeType && assigneeType !== 'all') query = query.eq('assignee_type', assigneeType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { data: task, error } = await supabase
    .from('tasks').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to vault if configured
  const { data: vaultConfig } = await supabase
    .from('workspace_vault_config')
    .select('vault_path, sync_enabled')
    .eq('workspace_id', body.workspace_id).single();

  if (vaultConfig?.sync_enabled) {
    const obsidianPath = await writeTaskToVault(task as Task, vaultConfig.vault_path);
    await supabase.from('tasks').update({ obsidian_path: obsidianPath, obsidian_synced_at: new Date().toISOString() })
      .eq('id', task.id);
    task.obsidian_path = obsidianPath;
  }

  return NextResponse.json(task, { status: 201 });
}
